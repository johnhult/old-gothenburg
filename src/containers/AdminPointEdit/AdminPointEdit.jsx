import React, { Component } from 'react';
import PropTypes from 'prop-types';

import AdminInput from 'components/AdminInput/AdminInput.jsx';
import Button from 'components/Button/Button.jsx';
import Select from 'components/Select/Select.jsx';
import Spinner from 'components/Spinner/Spinner.jsx';
import MarkerTypes from 'data/MARKER-TYPES.json';
import './AdminPointEdit.css';

class AdminPointEdit extends Component {
	constructor(props) {
		super(props);
		this.state = {
			error: {
				audio: false,
				header: false,
				markerType: false,
				text: false
			},
			loading: false,
			values: {
				audio: '',
				audioFile: '',
				header: '',
				markerType: '',
				text: ''
			},
			valuesChanged: []
		};
		this.valuesInitiated = false;
	}

	validateFields = () => {
		return !!(
			((this.state.values.audio && this.state.values.audioFile) ||
				this.props.editMode === 'edit') &&
			this.state.values.header &&
			this.state.values.markerType &&
			this.state.values.text
		);
	};

	handleBlur = event => {
		let name = event.target.name;
		let value = event.target.value;
		this.setState({
			error: {
				...this.state.error,
				[name]: !value
			}
		});
	};

	handleChange = event => {
		let name = event.target.name;
		let value = event.target.value;
		let type = event.target.type;
		let file;
		if (type === 'file') {
			file = event.target.files[0];
		}
		if (
			this.props.editMode === 'edit' &&
			this.state.valuesChanged.indexOf(name) < 0
		) {
			this.setState({
				valuesChanged: [...this.state.valuesChanged, name]
			});
		}
		this.setState({
			values: {
				...this.state.values,
				audioFile: file ? file : this.state.values.audioFile,
				[name]: value
			}
		});
	};

	handleSubmit = event => {
		event.preventDefault();
		if (!this.validateFields()) {
			let error = {};
			Object.keys(this.state.error).forEach(key => {
				error[key] = !this.state.values[key];
			});
			this.setState({
				error: error
			});
			return;
		}
		this.setState({
			loading: true
		});
		const storageRef = this.props.storage.ref();
		const db = this.props.db;
		const firebase = this.props.firebase;
		if (this.props.editMode === 'add') {
			this.handleAddNew(firebase, storageRef, db);
		}
		else if (this.props.editMode === 'edit') {
			this.handleEdit(firebase, storageRef);
		}
	};

	handleEdit = (firebase, storageRef) => {
		if (this.state.valuesChanged.length <= 0) {
			return;
		}
		let headerChanged = this.state.valuesChanged.indexOf('header') >= 0;
		let textChanged = this.state.valuesChanged.indexOf('text') >= 0;
		let typeChanged = this.state.valuesChanged.indexOf('markerType') >= 0;
		let audioChanged = this.state.valuesChanged.indexOf('audio') >= 0;
		let marker = this.props.marker.selfReference;
		let markerInfo = this.props.marker.markerInfo;
		let audioTasks = [];
		let updatedMarkerInfo = {
			...(textChanged && { text: this.state.values.text }),
			...(headerChanged && { header: this.state.values.header })
		};
		let updatedMarker = {
			...(typeChanged && { type: this.state.values.markerType })
		};
		if (audioChanged) {
			// Get audio ref for current audio path
			let audioRef = firebase
				.storage()
				.refFromURL(this.props.markerInfo.audioPath);
			// Name new audio
			const audioName = `audioclips/${new Date()
				.toLocaleString('sv-SE')
				.replace(' ', '')}-${this.state.values.audioFile.name}`;
			// Get metadata from audiofile
			const metadata = { contentType: this.state.values.audioFile.type };

			// Create tasks
			let deleteTask = audioRef.delete();
			let uploadAudioTask = storageRef
				.child(audioName)
				.put(this.state.values.audioFile, metadata);

			// Push all audioTasks to array for promise
			audioTasks.push(deleteTask, uploadAudioTask);

			// When all audio tasks are done we push task for updating url in markerInfo to object
			Promise.all(audioTasks).then(
				promises => {
					promises.forEach(querySnapshot => {
						if (querySnapshot) {
							querySnapshot.ref.getDownloadURL().then(url => {
								updatedMarkerInfo.audioPath = url;
								let updateTask = [
									markerInfo.update(updatedMarkerInfo),
									...(typeChanged
										? marker.update(updatedMarker)
										: [])
								];
								Promise.all(updateTask).then(() => {
									this.setState({
										loading: false
									});
									this.props.closeEdit();
									this.props.onAdded();
								});
							});
						}
					});
				},
				() => {}
			);
		}
		else {
			console.log(typeChanged, marker, updatedMarker);
			let updateTask = [
				markerInfo.update(updatedMarkerInfo),
				...(typeChanged ? marker.update(updatedMarker) : [])
			];
			Promise.all(updateTask).then(() => {
				this.setState({
					loading: false
				});
				this.props.closeEdit();
				this.props.onAdded();
			});
		}
	};

	handleAddNew = (firebase, storageRef, db) => {
		const audioName = `audioclips/${new Date()
			.toLocaleString('sv-SE')
			.replace(' ', '')}-${this.state.values.audioFile.name}`;
		const metadata = { contentType: this.state.values.audioFile.type };
		const uploadAudioTask = storageRef
			.child(audioName)
			.put(this.state.values.audioFile, metadata);
		uploadAudioTask.then(querySnapshot => {
			let getUrlTask = querySnapshot.ref.getDownloadURL();
			getUrlTask.then(url => {
				let addMarkerInfoTask = db.collection('markerData').add({
					audioPath: url,
					header: this.state.values.header,
					text: this.state.values.text.replace('\n\n', '\\n\\n')
				});
				addMarkerInfoTask.then(docRef => {
					let addMarkerTask = db.collection('markers').add({
						geo: new firebase.firestore.GeoPoint(
							this.props.point.lat,
							this.props.point.lng
						),
						markerInfo: docRef,
						type: this.state.values.markerType
					});
					addMarkerTask.then(() => {
						this.setState({
							loading: false
						});
						this.props.closeEdit();
						this.props.onAdded();
					});
				});
			});
		});
	};

	setValues = () => {
		this.valuesInitiated = true;
		let setValues = {
			audio: '',
			audioFile: '',
			header: this.props.markerInfo.header,
			markerType: this.props.marker.type,
			text: this.props.markerInfo.text.replace(/\\n\\n/g, '\n\n')
		};
		this.setState({ values: setValues });
	};

	resetValues = () => {
		this.valuesInitiated = false;
		let resetValue = {};
		Object.keys(this.state.values).forEach(key => {
			resetValue[key] = '';
		});
		this.setState({ values: resetValue, valuesChanged: [] });
	};

	componentWillUpdate = nextProps => {
		if (!nextProps.showEdit && this.props.showEdit !== nextProps.showEdit) {
			this.resetValues();
		}
	};

	componentDidUpdate = () => {
		if (
			this.props.marker &&
			this.props.markerInfo &&
			this.props.editMode === 'edit' &&
			this.props.showEdit &&
			!this.valuesInitiated
		) {
			this.setValues();
		}
	};

	render() {
		return (
			<div
				className={`AdminPointEdit ${
					this.props.showEdit ? 'AdminPointEdit--open' : ''
				}`}
			>
				<h1 className="u-bigMargin">Add new point</h1>
				{this.props.showEdit && this.props.point ? (
					<form className="AdminInputs">
						<AdminInput
							required
							name="lat"
							label="Latitude"
							value={this.props.point.lat.toString()}
							handleChange={this.handleChange}
							handleBlur={this.handleBlur}
							showError={false}
							disabled
						/>
						<AdminInput
							required
							name="lng"
							label="Longitude"
							value={this.props.point.lng.toString()}
							handleChange={this.handleChange}
							handleBlur={this.handleBlur}
							showError={false}
							disabled
						/>
						{(!this.props.marker || !this.props.markerInfo) &&
						this.props.editMode === 'edit' ? (
							<div className="u-width100">
								<Spinner size={50} />
								<h2 className="u-doubleMargin">
									Loading marker data.
								</h2>
							</div>
						) : (
							<div className="u-width100 u-flexColumnCenter">
								<AdminInput
									required
									name="header"
									label="Header"
									value={this.state.values.header}
									handleChange={this.handleChange}
									handleBlur={this.handleBlur}
									showError={this.state.error.header}
								/>
								<AdminInput
									required
									name="text"
									label="Text"
									value={this.state.values.text}
									handleChange={this.handleChange}
									handleBlur={this.handleBlur}
									type="textarea"
									showError={this.state.error.text}
								/>
								<Select
									name="markerType"
									handleChange={this.handleChange}
									handleBlur={this.handleBlur}
									label="Choose marker type"
									options={MarkerTypes}
									value={this.state.values.markerType}
									showError={this.state.error.markerType}
								/>
								<AdminInput
									required
									name="audio"
									label={
										!this.state.values.audio &&
										!!this.props.markerInfo
											? this.props.firebase
													.storage()
													.refFromURL(
														this.props.markerInfo
															.audioPath
													).name
											: 'Audio'
									}
									value={this.state.values.audio}
									handleChange={this.handleChange}
									handleBlur={this.handleBlur}
									type="file"
									showError={this.state.error.audio}
								/>
							</div>
						)}
						{this.state.loading ? (
							<Spinner
								className="u-bigMargin"
								size={30}
								margins={'0 auto 30px'}
							/>
						) : (
							<div className="ButtonWrapper u-flex1">
								<Button
									label="Cancel"
									type="dismissive"
									handleClick={this.props.closeEdit}
									disabled={this.state.loading}
								/>
								<Button
									label={`${
										this.props.editMode === 'edit'
											? 'Edit'
											: 'Save New'
									} Point`}
									handleClick={this.handleSubmit}
									disabled={
										this.state.loading ||
										(!this.props.marker &&
											!this.props.markerInfo &&
											this.state.valuesChanged.length <=
												0 &&
											this.props.editMode === 'edit')
									}
								/>
							</div>
						)}
					</form>
				) : null}
			</div>
		);
	}
}

AdminPointEdit.defaultProps = {
	//	Example defaultProps
	//	label: 'click me'
};

AdminPointEdit.propTypes = {
	closeEdit: PropTypes.func,
	db: PropTypes.object,
	editMode: PropTypes.string,
	firebase: PropTypes.object,
	firestore: PropTypes.object,
	marker: PropTypes.object,
	markerInfo: PropTypes.object,
	onAdded: PropTypes.func.isRequired,
	point: PropTypes.object,
	showEdit: PropTypes.bool.isRequired
};

export default AdminPointEdit;

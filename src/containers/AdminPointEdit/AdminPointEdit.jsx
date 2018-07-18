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
			}
		};
	}

	validateFields = () => {
		return !!(
			this.state.values.audio &&
			this.state.values.audioFile &&
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
			Object.keys(this.state.error).forEach(key => {
				this.setState({
					error: {
						...this.state.error,
						[key]: !this.state.values[key]
					}
				});
			});
			return;
		}
		this.setState({
			loading: true
		});
		const storageRef = this.props.storage.ref();
		const db = this.props.db;
		const firebase = this.props.firebase;
		const audioName = `audioclips/${new Date()
			.toLocaleString('sv-SE')
			.replace(' ', '')}-${this.state.values.audioFile.name}`;
		const metadata = { contentType: this.state.values.audioFile.type };
		const uploadAudioTask = storageRef
			.child(audioName)
			.put(this.state.values.audioFile, metadata);
		uploadAudioTask.then(querySnapshot => {
			querySnapshot.ref.getDownloadURL().then(url => {
				db.collection('markerData')
					.add({
						audioPath: url,
						header: this.state.values.header,
						text: this.state.values.text.replace('\n\n', '\\n\\n')
					})
					.then(docRef => {
						db.collection('markers')
							.add({
								geo: new firebase.firestore.GeoPoint(
									this.props.point.lat,
									this.props.point.lng
								),
								markerInfo: docRef,
								type: this.state.values.markerType
							})
							.then(() => {
								this.setState({
									loading: false
								});
								this.props.closeNewPoint();
								this.props.onAdded();
							});
					});
			});
		});
	};

	resetValues = () => {
		let resetValue = {};
		Object.keys(this.state.values).forEach(key => {
			resetValue[key] = '';
		});
		this.setState({ values: { ...resetValue } });
	};

	componentWillUpdate = nextProps => {
		if (
			!nextProps.newPointOpen &&
			this.props.newPointOpen !== nextProps.newPointOpen
		) {
			this.resetValues();
		}
	};

	render() {
		return (
			<div
				className={`AdminPointEdit ${
					this.props.newPointOpen ? 'AdminPointEdit--open' : ''
				}`}
			>
				<h1 className="u-bigMargin">Add new point</h1>
				{this.props.newPointOpen && this.props.point ? (
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
							label="Audio"
							value={this.state.values.audio}
							handleChange={this.handleChange}
							handleBlur={this.handleBlur}
							type="file"
							showError={this.state.error.audio}
						/>
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
									handleClick={this.props.closeNewPoint}
									disabled={this.state.loading}
								/>
								<Button
									label="Save New Point"
									handleClick={this.handleSubmit}
									disabled={this.state.loading}
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
	closeNewPoint: PropTypes.func,
	db: PropTypes.object,
	firebase: PropTypes.object,
	firestore: PropTypes.object,
	marker: PropTypes.object,
	newPointOpen: PropTypes.bool.isRequired,
	onAdded: PropTypes.func.isRequired,
	point: PropTypes.object
	//	Example PropTypes:
	//	label: PropTypes.string.isRequired,
	//	onClick: PropTypes.func,
};

export default AdminPointEdit;

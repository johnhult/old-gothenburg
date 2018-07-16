import React, { Component } from 'react';
import PropTypes from 'prop-types';

import AdminInput from 'components/AdminInput/AdminInput.jsx';
import Button from 'components/Button/Button.jsx';
import Select from 'components/Select/Select.jsx';
import MarkerTypes from 'data/MARKER-TYPES.json';
import './AdminPointEdit.css';

class AdminPointEdit extends Component {
	constructor(props) {
		super(props);
		this.state = {
			audio: '',
			audioFile: '',
			error: {
				audio: false,
				header: false,
				markerType: false,
				text: false
			},
			header: '',
			markerType: '',
			text: ''
		};
	}

	validateFields = () => {
		return !!(
			this.state.audio &&
			this.state.audioFile &&
			this.state.header &&
			this.state.markerType &&
			this.state.text
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
		if (event.target.type === 'file') {
			let file = event.target.files[0];
			this.setState({
				audioFile: file
			});
		}
		this.setState(
			{
				[name]: value
			},
			() => {
				console.log(this.state);
			}
		);
	};

	handleSubmit = event => {
		event.preventDefault();
		if (!this.validateFields()) {
			console.log(this.validateFields());
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
			.replace(' ', '')}-${this.state.audioFile.name}`;
		const metadata = { contentType: this.state.audioFile.type };
		const uploadAudioTask = storageRef
			.child(audioName)
			.put(this.state.audioFile, metadata);
		uploadAudioTask.then(querySnapshot => {
			querySnapshot.ref.getDownloadURL().then(url => {
				console.log(url);
				db.collection('markerData')
					.add({
						audioPath: url,
						header: this.state.header,
						text: this.state.text
					})
					.then(docRef => {
						db.collection('markers')
							.add({
								geo: new firebase.firestore.GeoPoint(
									this.props.point.lat,
									this.props.point.lng
								),
								markerInfo: docRef,
								type: this.state.markerType
							})
							.then(() => {
								this.setState({
									loading: false
								});
								this.props.closeNewPoint();
							});
					});
			});
		});
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
							value={this.state.header}
							handleChange={this.handleChange}
							handleBlur={this.handleBlur}
							showError={this.state.error.header}
						/>
						<AdminInput
							required
							name="text"
							label="Text"
							value={this.state.text}
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
							value={this.state.markerType}
							showError={this.state.error.markerType}
						/>
						<AdminInput
							required
							name="audio"
							label="Audio"
							value={this.state.audio}
							handleChange={this.handleChange}
							handleBlur={this.handleBlur}
							type="file"
							showError={this.state.error.audio}
						/>
						<div className="ButtonWrapper u-flex1">
							<Button
								label="Cancel"
								type="dismissive"
								handleClick={this.props.closeNewPoint}
							/>
							<Button
								label="Save New Point"
								handleClick={this.handleSubmit}
								disabled={this.state.loading}
							/>
						</div>
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
	firestore: PropTypes.object,
	newPointOpen: PropTypes.bool.isRequired,
	point: PropTypes.object
	//	Example PropTypes:
	//	label: PropTypes.string.isRequired,
	//	onClick: PropTypes.func,
};

export default AdminPointEdit;

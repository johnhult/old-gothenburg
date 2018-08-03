import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { capitalizeFirst } from '../../util/util.js';

import AdminInput from 'components/AdminInput/AdminInput.jsx';
import Button from 'components/Button/Button.jsx';
import Select from 'components/Select/Select.jsx';
import Spinner from 'components/Spinner/Spinner.jsx';
import MARKERTYPES from 'data/MARKER-TYPES.json';
import './AdminPointEdit.css';

class AdminPointEdit extends Component {
	constructor(props) {
		super(props);
		this.state = {
			changeValueAudio: true,
			error: {
				audioEng: false,
				audioSwe: false,
				headerEng: false,
				headerSwe: false,
				markerType: false,
				textEng: false,
				textSwe: false
			},
			loadAudio: false,
			loading: false,
			values: {
				audioEng: '',
				audioSwe: '',
				headerEng: '',
				headerSwe: '',
				markerType: '',
				textEng: '',
				textSwe: ''
			},
			valuesChanged: []
		};
		this.valuesInitiated = false;
		this.dropEng = null;
		this.dropSwe = null;
	}

	validateFields = () => {
		return Object.keys(this.state.values).every(key => {
			let passed =
				key === 'audioEng' || key === 'audioSwe'
					? true
					: this.state.values[key];
			return passed;
		});
	};

	handleBlur = event => {
		let name = event.target.name;
		let value = event.target.value;
		let fixedValue =
			name === 'audioEng' || name === 'audioSwe' ? false : !value;
		this.setState({
			error: {
				...this.state.error,
				[name]: fixedValue
			}
		});
	};

	handleChange = event => {
		let name = event.target.name;
		let value = event.target.value;
		let type = event.target.type;
		if (type === 'file') {
			let dataTransfer = new DataTransfer();
			dataTransfer.items.add(event.target.files[0]);
			event.target.files = dataTransfer.files;
		}
		if (
			this.props.editMode === 'edit' &&
			this.state.valuesChanged.indexOf(name) < 0 &&
			this.state.changeValueAudio
		) {
			this.setState({
				valuesChanged: [...this.state.valuesChanged, name]
			});
		}
		this.setState(prevState => {
			return {
				values: {
					...prevState.values,
					[name]: value
				}
			};
		});
	};

	handleSubmit = event => {
		event.preventDefault();
		if (!this.validateFields()) {
			let error = {};
			Object.keys(this.state.error).forEach(key => {
				let fixedValue =
					key === 'audioEng' || key === 'audioSwe'
						? false
						: !this.state.values[key];
				error[key] = fixedValue;
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
			this.handleEdit(firebase, db);
		}
	};

	handleEdit = (firebase, db) => {
		if (this.state.valuesChanged.length <= 0) {
			return;
		}
		const engRef = this.props.marker.markerInfoEng || db.collection('markerDataEng').doc();
		const sweRef = this.props.marker.markerInfoSwe || db.collection('markerDataSwe').doc();
		const match = {
			audioEng: this.props.markerInfo.eng.audioPath,
			audioSwe: this.props.markerInfo.swe.audioPath,
			headerEng: {
				ref: engRef,
				value: 'header'
			},
			headerSwe: {
				ref: sweRef,
				value: 'header'
			},
			markerType: { ref: this.props.marker.selfReference, value: 'type' },
			textEng: { ref: engRef, value: 'text' },
			textSwe: { ref: sweRef, value: 'text' }
		};
		let batch = this.props.db.batch();
		let audioPromises = { changed: [], tasks: [] };
		this.state.valuesChanged.forEach(changed => {
			let audio = changed.includes('audio');
			if (audio) {
				let lang = changed.replace('audio', '').toLowerCase();

				// Create new audio file task
				audioPromises.tasks.push(this.createAudioObject(lang));
				audioPromises.changed.push(lang);

				// Delete task
				if (match[changed]) {
					let url = firebase.storage().refFromURL(match[changed]);
					audioPromises.tasks.push(url.delete());
					audioPromises.changed.push(lang);
				}
			}
			else {
				batch.set(match[changed].ref, {
					[match[changed].value]: this.state.values[changed]
				}, {merge: true});
			}
		});

		// Extra for if marker info swe or eng didn't exist before edit
		if (!this.props.marker.markerInfoEng) {
			batch.update(this.props.marker.selfReference, {markerInfoEng: engRef});
		}
		if (!this.props.marker.markerInfoSwe) {
			batch.update(this.props.marker.selfReference, {markerInfoSwe: sweRef});
		}

		// Create new object for adding urls with correct language
		let newUrls = { lang: [], tasks: [] };

		// Promise for when audio tasks are done.
		let whenAudioTasksFinished = Promise.all(audioPromises.tasks);
		// When audio tasks are done...
		let thenClose = whenAudioTasksFinished.then(promises => {
			// ...we go through the results and grab completed uploads url
			promises.forEach((snapshot, i) => {
				if (snapshot) {
					// Add correct language and push tasks to newUrls
					newUrls.lang.push(audioPromises.changed[i]);
					newUrls.tasks.push(snapshot.ref.getDownloadURL());
				}
			});
			// Promise for when all URLs are fetched
			let urlPromises = Promise.all(newUrls.tasks);
			// Send promise up
			return urlPromises.then(urls => {
				urls.forEach((url, i) => {
					if (newUrls.lang[i] === 'eng') {
						let eng = engRef;
						batch.update(eng, { audioPath: url });
					}
					if (newUrls.lang[i] === 'swe') {
						let swe = sweRef;
						batch.update(swe, { audioPath: url });
					}
				});
				// Send promise up
				return batch.commit();
			});
		});

		// When batch complete
		thenClose.then(() => {
			this.setState({
				loading: false
			});
			this.props.closeEdit();
			this.props.onAdded();
		});
	};

	createAddObject = (language, url) => {
		let header = 'header' + capitalizeFirst(language);
		let text = 'text' + capitalizeFirst(language);
		return {
			audioPath: url,
			header: this.state.values[header],
			text: this.state.values[text]
		};
	};

	createAudioObject = language => {
		let inputName = 'audio' + capitalizeFirst(language);
		let audioFile = document.querySelector(`input[name=${inputName}]`);
		audioFile = audioFile.files[0];

		// Save eng audio data
		const audioName = `audioclips/${language}/${new Date()
			.toLocaleString('sv-SE')
			.replace(' ', '')}-${audioFile.name}`;
		const metadata = {
			contentType: audioFile.type
		};
		let storage = this.props.storage.ref();
		return storage.child(audioName).put(audioFile, metadata);
	};

	handleAddNew = (firebase, storageRef, db) => {
		let audioArray = [
			this.state.values.audioEng ? this.createAudioObject('eng') : '',
			this.state.values.audioSwe ? this.createAudioObject('swe') : ''
		];

		// Promise for both
		let uploadAudio = Promise.all(audioArray);

		// When audio upload is done we can get url and create markerInfo for both markers
		let allDone = uploadAudio.then(promise => {
			// Getting urls is async so we need promise
			let urlsArray = promise.map(querySnapshot => {
				// Return array of promises
				return querySnapshot.ref
					? querySnapshot.ref.getDownloadURL()
					: '';
			});

			// Create ref which we'll use for reference when creating marker
			let engRef = db.collection('markerDataEng').doc();
			let sweRef = db.collection('markerDataSwe').doc();

			// Create promise for both urls
			let uploadMarkerDataPromise = Promise.all(urlsArray);

			// New promise for batch
			let markersDonePromise = uploadMarkerDataPromise.then(urlValues => {
				// We now have urls so we map those to object
				let url = urlValues.map(item => (item ? item : ''));

				// Create and upload both objects. Since promise always returns indexed urls we know 0 will be eng and 1 will be swe
				let eng = this.createAddObject('eng', url[0]);
				let swe = this.createAddObject('swe', url[1]);
				let batch = db.batch();
				batch.set(engRef, eng);
				batch.set(sweRef, swe);

				// Return batch commit so we can use check when both marker infos are done
				return batch.commit();
			});

			// When both markers are done we can add the marker
			return markersDonePromise.then(() => {
				return db.collection('markers').add({
					geo: new firebase.firestore.GeoPoint(
						this.props.point.lat,
						this.props.point.lng
					),
					markerInfoEng: engRef,
					markerInfoSwe: sweRef,
					type: this.state.values.markerType
				});
			});
		});

		// When everything is uploaded we close
		allDone.then(() => {
			this.setState({
				loading: false
			});
			this.props.closeEdit();
			this.props.onAdded();
		});
	};

	srcToFile = (src, fileName, mimeType) => {
		return fetch(src)
			.then(function(res) {
				return res.arrayBuffer();
			})
			.then(function(buf) {
				return new File([buf], fileName, { type: mimeType });
			});
	};

	setValues = () => {
		this.valuesInitiated = true;
		this.setState({ changeValueAudio: false, loadAudio: true });
		let setValues = {
			audioEng: '',
			audioSwe: '',
			headerEng: this.props.markerInfo.eng.header,
			headerSwe: this.props.markerInfo.swe.header,
			markerType: this.props.marker.type,
			textEng: this.props.markerInfo.eng.text.replace(/\\n\\n/g, '\n\n'),
			textSwe: this.props.markerInfo.swe.text.replace(/\\n\\n/g, '\n\n')
		};
		this.setState({ values: setValues }, () => {
			let proms = ['eng', 'swe'].map(lang => {
				if (this.props.markerInfo[lang].audioPath) {
					let file = this.props.storage.refFromURL(
						this.props.markerInfo[lang].audioPath
					);
					return this.srcToFile(
						this.props.markerInfo[lang].audioPath,
						file.name,
						'audio/mp3'
					);
				}
				else {
					return '';
				}
			});
			Promise.all(proms).then(audio => {
				this.setState({ loadAudio: false }, () => {
					audio.forEach((item, i) => {
						if (item) {
							let input = document.querySelector(
								`input[name=audio${i === 0 ? 'Eng' : 'Swe'}]`
							);
							let dataTransfer = new DataTransfer();
							dataTransfer.items.add(audio[i]);
							input.files = dataTransfer.files;
						}
					});
					this.addDropEvents();
					this.setState({ changeValueAudio: true });
				});
			});
		});
	};

	resetValues = () => {
		this.valuesInitiated = false;
		let resetValue = {};
		let resetErrors = {};
		Object.keys(this.state.values).forEach(key => {
			resetValue[key] = '';
		});
		Object.keys(this.state.error).forEach(key => {
			resetErrors[key] = false;
		});
		this.setState({
			error: resetErrors,
			values: resetValue,
			valuesChanged: []
		});
	};

	preventDefaults(e) {
		e.preventDefault();
		e.stopPropagation();
	}

	handleDrop = e => {
		let input = e.target.querySelector('input');
		let file = e.dataTransfer.files;
		input.files = file;
	};

	highlight = e => {
		if (e.target === this.dropEng) {
			this.dropEng
				.querySelector('.FileCircle')
				.classList.add('shake-slow');
			this.dropEng
				.querySelector('.FileCircle')
				.classList.add('shake-constant');
		}
		if (e.target === this.dropSwe) {
			this.dropSwe
				.querySelector('.FileCircle')
				.classList.add('shake-slow');
			this.dropSwe
				.querySelector('.FileCircle')
				.classList.add('shake-constant');
		}
	};

	unhighlight = () => {
		this.dropEng
			.querySelector('.FileCircle')
			.classList.remove('shake-slow');
		this.dropEng
			.querySelector('.FileCircle')
			.classList.remove('shake-constant');
		this.dropEng.querySelector('.FileText').classList.remove('shake-slow');
		this.dropSwe
			.querySelector('.FileCircle')
			.classList.remove('shake-slow');
		this.dropSwe
			.querySelector('.FileCircle')
			.classList.remove('shake-constant');
		this.dropSwe.querySelector('.FileText').classList.remove('shake-slow');
	};

	removeDropEvents = () => {
		['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
			this.dropEng.removeEventListener(eventName, this.preventDefaults);
			this.dropSwe.removeEventListener(eventName, this.preventDefaults);
		});
		['dragenter', 'dragover'].forEach(eventName => {
			this.dropEng.removeEventListener(eventName, this.highlight, false);
			this.dropSwe.removeEventListener(eventName, this.highlight, false);
		});

		this.dropEng.removeEventListener('drop', this.handleDrop, false);
		this.dropSwe.removeEventListener('drop', this.handleDrop, false);

		['dragleave', 'drop'].forEach(eventName => {
			this.dropEng.removeEventListener(
				eventName,
				this.unhighlight,
				false
			);
			this.dropSwe.removeEventListener(
				eventName,
				this.unhighlight,
				false
			);
		});
	};

	addDropEvents = () => {
		this.dropEng = document.getElementById('audioEng');
		this.dropSwe = document.getElementById('audioSwe');
		['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
			this.dropEng.addEventListener(
				eventName,
				this.preventDefaults,
				false
			);
			this.dropSwe.addEventListener(
				eventName,
				this.preventDefaults,
				false
			);
		});
		this.dropEng.addEventListener('drop', this.handleDrop, false);
		this.dropSwe.addEventListener('drop', this.handleDrop, false);
		['dragenter', 'dragover'].forEach(eventName => {
			this.dropEng.addEventListener(eventName, this.highlight, false);
			this.dropSwe.addEventListener(eventName, this.highlight, false);
		});

		['dragleave', 'drop'].forEach(eventName => {
			this.dropEng.addEventListener(eventName, this.unhighlight, false);
			this.dropSwe.addEventListener(eventName, this.unhighlight, false);
		});
	};

	componentWillUpdate = nextProps => {
		if (!nextProps.showEdit && this.props.showEdit !== nextProps.showEdit) {
			this.removeDropEvents();
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
		if (
			this.props.editMode === 'add' &&
			this.props.showEdit &&
			!this.valuesInitiated
		) {
			this.addDropEvents();
			this.valuesInitiated = true;
		}
	};

	render() {
		return (
			<div
				className={`AdminPointEdit ${
					this.props.showEdit ? 'AdminPointEdit--open' : ''
				}`}
			>
				<h3
					className={`u-fatText ${
						!this.props.showEdit ? 'u-invis' : ''
					}`}
				>
					{this.props.editMode === 'edit' ? 'Edit' : 'Add new'} point
				</h3>
				{this.props.showEdit &&
					this.props.point && (
						<div className="PositionWrapper u-bigMargin">
							<span className="PositionText u-fatText u-greyText">
								{this.props.point.lat}
							</span>
							<span className="PositionText u-fatText u-greyText">
								{this.props.point.lng}
							</span>
						</div>
					)}
				{this.props.showEdit && this.props.point ? (
					<form className="AdminInputs">
						{(!this.props.marker ||
							!this.props.markerInfo ||
							this.state.loadAudio) &&
						this.props.editMode === 'edit' ? (
							<div className="u-width100">
								<Spinner size={50} />
								<h2 className="u-doubleMargin">
									Loading marker data.
								</h2>
							</div>
						) : (
							<div className="u-width100 u-flexColumnCenter">
								<div className="HeaderDivider InputDivider">
									<h4 className="u-fatText">Headers</h4>
									<AdminInput
										required
										name="headerSwe"
										label="Swedish"
										value={this.state.values.headerSwe}
										handleChange={this.handleChange}
										handleBlur={this.handleBlur}
										showError={this.state.error.headerSwe}
										styling="light"
									/>
									<AdminInput
										required
										name="headerEng"
										label="English"
										value={this.state.values.headerEng}
										handleChange={this.handleChange}
										handleBlur={this.handleBlur}
										showError={this.state.error.headerEng}
										styling="light"
									/>
								</div>
								<div className="TextDivider InputDivider">
									<h4 className="u-fatText">Text</h4>
									<AdminInput
										required
										name="textSwe"
										label="Swedish"
										value={this.state.values.textSwe}
										handleChange={this.handleChange}
										handleBlur={this.handleBlur}
										type="textarea"
										showError={this.state.error.textSwe}
									/>
									<AdminInput
										required
										name="textEng"
										label="English"
										value={this.state.values.textEng}
										handleChange={this.handleChange}
										handleBlur={this.handleBlur}
										type="textarea"
										showError={this.state.error.textEng}
									/>
								</div>
								<div className="AudioDivider InputDivider">
									<h4 className="u-fatText">Audio</h4>
									<AdminInput
										required
										name="audioSwe"
										id="audioSwe"
										label="Swedish"
										audioValue={this.state.values.audioSwe}
										handleChange={this.handleChange}
										handleBlur={this.handleBlur}
										type="file"
										showError={this.state.error.audioSwe}
									/>
									<AdminInput
										required
										name="audioEng"
										id="audioEng"
										label="English"
										audioValue={this.state.values.audioEng}
										handleChange={this.handleChange}
										handleBlur={this.handleBlur}
										type="file"
										showError={this.state.error.audioEng}
									/>
								</div>
								<div className="TypeDivider InputDivider">
									<h4 className="u-fatText">Marker Type</h4>
									<Select
										name="markerType"
										handleChange={this.handleChange}
										handleBlur={this.handleBlur}
										label="Choose marker type"
										options={MARKERTYPES}
										value={this.state.values.markerType}
										showError={this.state.error.markerType}
									/>
								</div>
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
										(this.state.valuesChanged.length <= 0 &&
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

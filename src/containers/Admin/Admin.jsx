import React from 'react';
// import GoogleMapReact from 'google-map-react';
import firebase from 'firebase/app';
import 'firebase/app';
import 'firebase/firestore';
import 'firebase/storage';
import 'firebase/auth';
// import supercluster from 'points-cluster';

import AdminPointEdit from 'containers/AdminPointEdit/AdminPointEdit.jsx';
import AdminUtility from 'components/AdminUtility/AdminUtility.jsx';
import Login from 'components/Login/Login.jsx';
import Map from 'components/Map/Map.jsx';
import Overlay from 'components/Overlay/Overlay.jsx';
import Spinner from 'components/Spinner/Spinner.jsx';

import { getEmptyMarkerInfo } from '../../util/util';
import './Admin.css';

const ERROR = {
	noMarkers: 'Couldn\'t load markers. 😭 Please reload or try later.'
};

class Admin extends React.Component {
	constructor(props) {
		super(props);
		this.state = {
			activeButton: '',
			email: '',
			error: null,
			isSignedIn: false,
			loadedMarker: null,
			loadedMarkerInfo: null,
			loadingMarkers: false,
			markers: [],
			password: '',
			pointToEdit: {
				lat: null,
				lng: null
			},
			removeLoading: false,
			showEdit: false,
			showRemove: false
		};
		this.db = null;
		this.storage = null;
	}

	onLogin = user => {
		this.setState({
			isSignedIn: !!user
		});
	};

	initFirebase() {
		// Initialize Cloud Firestore through Firebase
		this.db = firebase.firestore();
		this.storage = firebase.storage();
		this.firebase = firebase;

		// Set settings because warnings
		let settings = {
			timestampsInSnapshots: true
		};
		this.db.settings(settings);

		return this.db;
	}

	getMarkers = db => {
		let database = db || this.db;
		this.setState({ loadingMarkers: true });
		// Get marker data
		database
			.collection('markers')
			.get()
			.then(
				querySnapshot => {
					let markers = [];
					querySnapshot.forEach(doc => {
						let marker = {
							...doc.data(),
							id: doc.id,
							selfReference: doc.ref
						};
						markers.push(marker);
					});
					this.setState({ loadingMarkers: false, markers: markers });
				},
				() => {
					this.setState({
						error: ERROR.noMarkers,
						loadingMarkers: false
					});
				}
			);
	};

	getMessage = () => {
		if (this.state.error) {
			return (
				<div className="InfoMessage">
					<span>{this.state.error}</span>
				</div>
			);
		}
	};

	toggleActiveButton = buttonToToggle => {
		if (this.state.showEdit) {
			return;
		}
		this.setState({
			activeButton:
				buttonToToggle !== this.state.activeButton ? buttonToToggle : ''
		});
	};

	getMarkerInfo = (clickedMarkerId, map) => {
		if (this.state.activeButton === 'remove') {
			this.setState({
				showRemove: true
			});
		}
		let marker = this.state.markers.find(
			correctMarker => correctMarker.id === clickedMarkerId
		);
		this.setState({
			loadedMarker: marker
		});
		if (this.state.activeButton === 'edit') {
			map.panTo({
				lat: marker.geo.latitude,
				lng: marker.geo.longitude
			});
			this.setState({
				loadedMarker: marker,
				pointToEdit: {
					lat: marker.geo.latitude,
					lng: marker.geo.longitude
				},
				showEdit: true
			});
		}

		// Get marker data
		let markerInfoEngTask = marker.markerInfoEng
			? marker.markerInfoEng.get()
			: '';
		let markerInfoSweTask = marker.markerInfoSwe
			? marker.markerInfoSwe.get()
			: '';

		let getPromise = Promise.all([markerInfoEngTask, markerInfoSweTask]);

		getPromise.then(markerInfos => {
			let both = markerInfos.map(
				markerInfo =>
					markerInfo ? markerInfo.data() : getEmptyMarkerInfo()
			);
			this.setState({
				loadedMarkerInfo: { eng: both[0], swe: both[1] }
			});
		});
	};

	addPoint = latLng => {
		if (this.state.activeButton !== 'add' || this.state.showEdit) {
			return;
		}
		this.setState({
			pointToEdit: {
				lat: latLng.lat,
				lng: latLng.lng
			},
			showEdit: true
		});
	};

	deleteMarker = () => {
		this.setState({
			removeLoading: true
		});

		// Get ref to both audiofiles if they exist
		let audioRefEng = this.state.loadedMarkerInfo.eng.audioPath
			? firebase
					.storage()
					.refFromURL(this.state.loadedMarkerInfo.eng.audioPath)
			: '';
		let audioRefSwe = this.state.loadedMarkerInfo.swe.audioPath
			? firebase
					.storage()
					.refFromURL(this.state.loadedMarkerInfo.swe.audioPath)
			: '';

		let audioRefEngTask = audioRefEng ? audioRefEng.delete() : '';
		let audioRefSweTask = audioRefSwe ? audioRefSwe.delete() : '';

		// Delete both audio files
		let whenAudioDeleted = Promise.all([audioRefEngTask, audioRefSweTask]);

		// Setup delete for marker and marker info
		let references = [
			this.state.loadedMarker.markerInfoEng,
			this.state.loadedMarker.markerInfoSwe,
			this.state.loadedMarker.selfReference
		];
		let batch = this.db.batch();
		references.forEach(ref => {
			batch.delete(ref);
		});
		// Delete the rest
		let whenMarkersDeleted = whenAudioDeleted.then(
			() => {
				return batch.commit();
			},
			error => {
				// Even if we get error from audio delete we want to delete marker and marker info
				return batch.commit();
			}
		);

		// When last is deleted we close and reload markers
		whenMarkersDeleted.then(() => {
			this.setState({
				removeLoading: false
			});
			this.closeRemove();
			this.getMarkers();
		});
	};

	handleChildClick = (clickedMarkerId, map) => {
		if (
			(this.state.activeButton !== 'remove' &&
				this.state.activeButton !== 'edit') ||
			this.state.showEdit
		) {
			return;
		}
		if (
			this.state.activeButton === 'remove' ||
			this.state.activeButton === 'edit'
		) {
			this.getMarkerInfo(clickedMarkerId.id, map);
		}
	};

	closeEdit = () => {
		this.setState({
			activeButton: '',
			loadedMarker: null,
			loadedMarkerInfo: null,
			showEdit: false
		});
	};

	closeRemove = () => {
		this.setState({
			activeButton: '',
			loadedMarker: null,
			loadedMarkerInfo: null,
			showRemove: false
		});
	};

	onLogin = user => {
		this.setState({ isSignedIn: !!user });
		this.getMarkers(this.initFirebase());
	};

	// Listen to the Firebase Auth state and set the local state.
	componentWillMount = () => {
		this.unregisterAuthObserver = firebase
			.auth()
			.onAuthStateChanged(user => this.onLogin(user));
	};

	componentWillUnmount() {
		// Make sure we un-register Firebase observers when the component unmounts.
		this.unregisterAuthObserver();
	}

	render() {
		if (!this.state.isSignedIn) {
			return <Login />;
		}
		return (
			<div className="AdminMapWrapper">
				{this.state.showRemove ? (
					<Overlay
						header={`Remove point${
							this.state.loadedMarkerInfo
								? ' ' +
								  this.state.loadedMarkerInfo.swe.header +
								  '/' +
								  this.state.loadedMarkerInfo.eng.header
								: ''
						}?`}
						loading={!this.state.loadedMarkerInfo}
						removeLoading={this.state.removeLoading}
						text="This action will permanently remove this marker and all it's nested data such as audiofiles and text information. Please think this though. Seriously my dude/dudette. It's going to be gone forever. What you wanna do?"
						buttons={[
							{
								action: this.closeRemove,
								label: 'Oh no, cancel this action'
							},
							{
								action: this.deleteMarker,
								disabled:
									!this.state.loadedMarkerInfo ||
									!this.state.loadedMarker,
								label: 'Delete the shit outta that marker',
								type: 'dismissive'
							}
						]}
					/>
				) : null}
				<AdminUtility
					activeButton={this.state.activeButton}
					toggleActiveButton={this.toggleActiveButton}
				/>
				<div
					className={`InnerMapWrapper ${
						this.state.activeButton === 'add' &&
						!this.state.showEdit
							? 'MouseAdd'
							: ''
					} ${
						this.state.activeButton === 'edit' &&
						!this.state.showEdit
							? 'MouseEdit'
							: ''
					} ${
						this.state.activeButton === 'remove'
							? 'MouseRemove'
							: ''
					}`}
				>
					{this.getMessage()}
					<div className="MapInner">
						{this.state.markers.length > 0 ? (
							<Map
								admin={true}
								apiKey={this.props.apiKey}
								className="Map"
								handleClick={this.addPoint}
								handleMarkerClick={this.handleChildClick}
								infoOpen={this.state.showEdit}
								language="en"
								markers={this.state.markers}
								shouldReactToClick={
									this.state.activeButton === 'add'
								}
							/>
						) : (
							<div className="Loading">
								<div>
									<Spinner />
									<h1>Loading markers 🎵</h1>
									<h4>Please wait</h4>
								</div>
							</div>
						)}
					</div>
					<AdminPointEdit
						closeEdit={this.closeEdit}
						onAdded={this.getMarkers}
						db={this.db}
						editMode={this.state.activeButton}
						firebase={this.firebase}
						showEdit={this.state.showEdit}
						marker={this.state.loadedMarker}
						markerInfo={this.state.loadedMarkerInfo}
						storage={this.storage}
						point={this.state.pointToEdit}
					/>
				</div>
			</div>
		);
	}
}

export default Admin;

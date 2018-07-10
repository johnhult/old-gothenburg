import React, { Component } from 'react';
import firebase from 'firebase/app';
import 'firebase/app';
import 'firebase/firestore';

import Map from 'components/Map/Map';
import MarkerInfo from 'containers/MarkerInfo/MarkerInfo';
import './Home.css';

const ERROR = {
	noGeoLocation: 'Your device doesn\'t seem to have any location service.',
	noMarkers: 'Couldn\'t load markers. 😭 Please reload or try later.',
	noUserPos:
		'Allow your device to use location in order to use the audio tour in Gothenburg. 📍'
};

class Home extends Component {
	constructor(props) {
		super(props);
		this.state = {
			data: null,
			error: null,
			infoOpen: false,
			loadingMarkers: true,
			loadingUserPos: true,
			markerInfo: null,
			userPos: {
				lat: 0,
				lng: 0
			}
		};
	}

	getMessage = () => {
		let message;

		if (this.state.error === null) {
			if (this.state.loadingMarkers) {
				message = (
					<div>
						<div className="Spinner" />
						<h1>Loading audio markers 🎵</h1>
						<h4>Please wait</h4>
					</div>
				);
			}
			else if (this.state.loadingUserPos) {
				message = (
					<div>
						<div className="Spinner" />
						<h1>Loading user position 📍</h1>
						<h4>Please wait</h4>
					</div>
				);
			}
			else {
				message = (
					<div>
						<div className="Spinner" />
						<h1>Something went wrong, please reload...</h1>
					</div>
				);
			}
		}
		else {
			message = <h1>{this.state.error}</h1>;
		}
		return message;
	};

	watchUserPos = () => {
		if (navigator.geolocation) {
			navigator.geolocation.watchPosition(
				position => {
					this.setState({
						loadingUserPos: false,
						userPos: {
							lat: position.coords.latitude,
							lng: position.coords.longitude
						}
					});
				},
				() => {
					this.setState({
						error: ERROR.noUserPos
					});
				}
			);
		}
		else {
			this.setState({
				error: ERROR.noGeoLocation
			});
		}
	};

	closeInfo = () => {
		this.setState({ infoOpen: false });
	};

	handleMarkerClick = clickedMarker => {
		this.setState({ infoOpen: true, openMarker: clickedMarker });
		clickedMarker.markerInfo.get().then(querySnapshot => {
			this.setState({ markerInfo: querySnapshot.data() });
		});
	};

	initFirebase() {
		// Initialize Firebase
		let config = {
			apiKey: '',
			authDomain: 'old-gothenburg.firebaseapp.com',
			databaseURL: 'https://old-gothenburg.firebaseio.com',
			projectId: 'old-gothenburg'
		};
		firebase.initializeApp(config);

		// Initialize Cloud Firestore through Firebase
		let db = firebase.firestore();
		let settings = {
			timestampsInSnapshots: true
		};

		// Set settings because warnings
		db.settings(settings);

		this.setState({ db: db });

		return db;
	}

	getMarkers(db) {
		// Get marker data
		db.collection('markers')
			.get()
			.then(
				querySnapshot => {
					let markers = [];
					querySnapshot.forEach(doc => {
						let marker = { ...doc.data(), id: doc.id };
						markers.push(marker);
					});
					this.setState({ data: markers, loadingMarkers: false });
				},
				() => {
					this.setState({
						error: ERROR.noMarkers,
						loadingMarkers: false
					});
				}
			);
	}

	componentDidMount() {
		this.watchUserPos();
		this.getMarkers(this.initFirebase());
	}

	render() {
		return this.state.loadingMarkers ||
			this.state.loadingUserPos ||
			this.state.error ? (
			<div className="Loading">{this.getMessage()}</div>
		) : (
			<div className="MapWrapper">
				<Map
					className="Map"
					handleMarkerClick={this.handleMarkerClick}
					markers={this.state.data}
					userPos={this.state.userPos}
				/>
				<MarkerInfo
					close={this.closeInfo}
					infoOpen={this.state.infoOpen}
					markerInfo={this.state.markerInfo}
				/>
			</div>
		);
	}
}

export default Home;

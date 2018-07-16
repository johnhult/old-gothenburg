import React, { Component } from 'react';
import firebase from 'firebase/app';
import 'firebase/app';
import 'firebase/firestore';

import Map from 'components/Map/Map.jsx';
import MarkerInfo from 'containers/MarkerInfo/MarkerInfo';
import Spinner from 'components/Spinner/Spinner.jsx';
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
			infoLoading: false,
			infoOpen: false,
			loadingMarkers: true,
			loadingUserPos: true,
			markerDataLoaded: [],
			markerInfo: null,
			userError: null,
			userPos: {
				lat: 0,
				lng: 0
			}
		};
		this.openMarker = null;
	}

	getMessage = () => {
		let message;

		if (this.state.error === null) {
			if (this.state.loadingMarkers) {
				message = (
					<div>
						<Spinner />
						<h1>Loading audio markers 🎵</h1>
						<h4>Please wait</h4>
					</div>
				);
			}
			else if (this.state.loadingUserPos) {
				message = (
					<div>
						<Spinner />
						<h1>Loading user position 📍</h1>
						<h4>Please wait</h4>
					</div>
				);
			}
			else {
				message = (
					<div>
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
						userError: ERROR.noUserPos
					});
				},
				{
					enableHighAccuracy: true,
					timeout: 60000
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
		this.setState({
			infoLoading: true,
			infoOpen: true
		});
		this.openMarker = clickedMarker;
		let data = this.state.markerDataLoaded.find(
			markerExist => markerExist.key === clickedMarker.markerInfo.id
		);
		if (data) {
			this.setState({ infoLoading: false, markerInfo: data });
		}
		else {
			clickedMarker.markerInfo.get().then(
				querySnapshot => {
					let dataFetchedKey = querySnapshot.id;
					data = querySnapshot.data();
					data = { ...data, key: dataFetchedKey };
					if (dataFetchedKey === this.openMarker.markerInfo.id) {
						this.setState({
							infoLoading: false,
							markerDataLoaded: [
								...this.state.markerDataLoaded,
								data
							],
							markerInfo: data
						});
					}
					else {
						this.setState({
							markerDataLoaded: [
								...this.state.markerDataLoaded,
								data
							]
						});
					}
				},
				() => {
					this.setState({
						infoLoading: false
					});
				}
			);
		}
	};

	initFirebase() {
		// Initialize Cloud Firestore through Firebase
		let db = firebase.firestore();

		// Set settings because warnings
		let settings = {
			timestampsInSnapshots: true
		};
		db.settings(settings);

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
		return this.state.loadingMarkers || this.state.error ? (
			<div className="Loading">{this.getMessage()}</div>
		) : (
			<div className="MapWrapper">
				<Map
					apiKey={this.props.apiKey}
					className="Map"
					handleMarkerClick={this.handleMarkerClick}
					infoOpen={this.state.infoOpen}
					markers={this.state.data}
					userError={this.state.userError}
					userPos={this.state.userPos}
				/>
				<MarkerInfo
					close={this.closeInfo}
					infoLoading={this.state.infoLoading}
					infoOpen={this.state.infoOpen}
					markerInfo={this.state.markerInfo}
				/>
			</div>
		);
	}
}

export default Home;

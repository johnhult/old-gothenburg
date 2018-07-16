import React from 'react';
import GoogleMapReact from 'google-map-react';
import firebase from 'firebase/app';
import 'firebase/app';
import 'firebase/firestore';
import 'firebase/storage';
import 'firebase/auth';

import AdminInput from 'components/AdminInput/AdminInput.jsx';
import AdminPointEdit from 'containers/AdminPointEdit/AdminPointEdit.jsx';
import Button from 'components/Button/Button.jsx';
import Marker from 'components/Marker/Marker.jsx';
import Spinner from 'components/Spinner/Spinner.jsx';

import AddMarker from 'img/icons/add-marker.svg';
import Logout from 'img/icons/logout.svg';
import MapStyle from 'data/MAP-STYLE.json';
import './Admin.css';

const MAP = {
	defaultCenter: {
		lat: 57.70887,
		lng: 11.97456
	},
	defaultZoom: 14,
	options: {
		clickableIcons: false,
		draggable: true,
		fullscreenControl: false,
		maxZoom: 19,
		minZoom: 8,
		panControl: true,
		scrollwheel: true,
		styles: MapStyle,
		zoomControl: true
	}
};

const ERROR = {
	noMarkers: 'Couldn\'t load markers. 😭 Please reload or try later.'
};

class Admin extends React.Component {
	constructor(props) {
		super(props);
		this.state = {
			addNewPoint: false,
			email: '',
			error: null,
			isSignedIn: false,
			loadingMarkers: false,
			markers: [],
			newPointOpen: false,
			password: '',
			pointToEdit: {
				lat: null,
				lng: null
			}
		};
		this.db = null;
		this.map = null;
		this.maps = null;
		this.newMarker = null;
		this.storage = null;
	}

	login = event => {
		event.preventDefault();
		firebase
			.auth()
			.signInWithEmailAndPassword(this.state.email, this.state.password)
			.catch(error => {
				// Handle Errors here.
				this.setState({
					error: error.message
				});
			});
	};

	handleChange = event => {
		let name = event.target.name;
		this.setState({
			[name]: event.target.value
		});
	};

	initMap = (map, maps) => {
		this.map = map;
		this.maps = maps;
		this.maps.event.addListener(map, 'click', event => {
			this.addPoint(event.latLng);
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

	getMarkers(db) {
		this.setState({ loadingMarkers: true });
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
					this.setState(
						{ loadingMarkers: false, markers: markers },
						() => {
							// this.setBounds();
						}
					);
				},
				() => {
					this.setState({
						error: ERROR.noMarkers,
						loadingMarkers: false
					});
				}
			);
	}

	getMessage = () => {
		if (this.state.loadingMarkers) {
			return (
				<div className="InfoMessage">
					<Spinner size={30} />
					<span>Loading markers</span>
				</div>
			);
		}
		else if (this.state.error) {
			return (
				<div className="InfoMessage">
					<span>{this.state.error}</span>
				</div>
			);
		}
	};

	setMapOptions = () => {
		let options = this.state.newPointOpen
			? {
				draggable: false,
				maxZoom: this.map.getZoom(),
				minZoom: this.map.getZoom(),
				panControl: false,
				scrollwheel: false,
				zoomControl: false
			  }
			: {
				...MAP.options
			  };
		this.map.setOptions(options);
	};

	setBounds = () => {
		let newBounds = new this.maps.LatLngBounds();
		this.state.markers.forEach(item => {
			newBounds.extend({
				lat: item.geo.latitude,
				lng: item.geo.longitude
			});
		});

		let increasePercentage = 1.01;
		let NE = newBounds.getNorthEast();
		let SW = newBounds.getSouthWest();

		// Increase bounds
		let latAdjustment = (NE.lat() - SW.lat()) * (increasePercentage - 1);
		let lngAdjustment = (NE.lng() - SW.lng()) * (increasePercentage - 1);
		var newNE = new this.maps.LatLng(
			NE.lat() + latAdjustment,
			NE.lng() + lngAdjustment
		);
		var newSW = new this.maps.LatLng(
			SW.lat() - latAdjustment,
			SW.lng() - lngAdjustment
		);

		let fitBounds = new this.maps.LatLngBounds(newSW, newNE);

		this.map.fitBounds(fitBounds);
	};

	addPoint = latLng => {
		if (!this.state.addNewPoint) {
			return;
		}
		this.map.panTo(latLng);
		this.newMarker = new this.maps.Marker({
			map: this.map,
			position: latLng
		});
		this.setState(
			{
				newPointOpen: true,
				pointToEdit: {
					lat: latLng.lat(),
					lng: latLng.lng()
				}
			},
			() => {
				this.setMapOptions();
			}
		);
	};

	closeNewPoint = () => {
		this.newMarker.setMap(null);
		this.setState({
			addNewPoint: false,
			newPointOpen: false
		});
	};

	componentDidUpdate = (prevProps, prevState) => {
		if (
			this.state.isSignedIn &&
			prevState.isSignedIn !== this.state.isSignedIn
		) {
			this.getMarkers(this.initFirebase());
		}
		if (
			!this.state.newPointOpen &&
			this.state.newPointOpen !== prevState.newPointOpen
		) {
			this.setMapOptions();
		}
	};

	// Listen to the Firebase Auth state and set the local state.
	componentDidMount() {
		this.unregisterAuthObserver = firebase
			.auth()
			.onAuthStateChanged(user => this.setState({ isSignedIn: !!user }));
	}

	// Make sure we un-register Firebase observers when the component unmounts.
	componentWillUnmount() {
		this.unregisterAuthObserver();
		if (this.maps) {
			this.maps.event.clearListeners(this.map, 'clicked');
		}
	}

	render() {
		if (!this.state.isSignedIn) {
			return (
				<div>
					<h1 className="LoginHeader">Old Gothenburg</h1>
					<form className="LoginForm" onSubmit={this.login}>
						<AdminInput
							name="email"
							type="email"
							label="Email"
							handleChange={this.handleChange}
							value={this.state.email}
							showError={false}
						/>
						<AdminInput
							name="password"
							type="password"
							label="Password"
							handleChange={this.handleChange}
							value={this.state.password}
							showError={false}
						/>
						<Button label="Log In" type="submit" />
					</form>
					{this.state.error ? <h1>{this.state.error}</h1> : null}
				</div>
			);
		}
		return (
			<div className="AdminMapWrapper">
				<div className="UtilityWrapper">
					<Button
						handleClick={() => firebase.auth().signOut()}
						type="icon"
						imgPath={Logout}
					/>
					<Button
						className={`${
							this.state.addNewPoint ? 'IconButton--active' : ''
						}`}
						handleClick={() =>
							this.setState({
								addNewPoint: !this.state.addNewPoint
							})
						}
						type="icon"
						imgPath={AddMarker}
					/>
				</div>
				<div
					className={`InnerMapWrapper ${
						this.state.addNewPoint && !this.state.newPointOpen
							? 'MouseAdd'
							: ''
					}`}
				>
					{this.getMessage()}
					<div className="MapInner">
						<GoogleMapReact
							bootstrapURLKeys={{
								key: this.props.apiKey
							}}
							defaultCenter={MAP.defaultCenter}
							defaultZoom={MAP.defaultZoom}
							experimental
							onChildClick={this.handleChildClick}
							onGoogleApiLoaded={({ map, maps }) =>
								this.initMap(map, maps)
							}
							options={MAP.options}
							yesIWantToUseGoogleMapApiInternals
						>
							{this.state.markers.map(marker => {
								return (
									<Marker
										key={marker.id}
										lat={marker.geo.latitude}
										lng={marker.geo.longitude}
										type={marker.type}
									/>
								);
							})}
						</GoogleMapReact>
					</div>
					<AdminPointEdit
						closeNewPoint={this.closeNewPoint}
						db={this.db}
						firebase={this.firebase}
						newPointOpen={this.state.newPointOpen}
						marker={this.state.markerSelected || null}
						storage={this.storage}
						point={this.state.pointToEdit}
					/>
				</div>
			</div>
		);
	}
}

export default Admin;

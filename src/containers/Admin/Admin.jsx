import React from 'react';
import GoogleMapReact from 'google-map-react';
import firebase from 'firebase/app';
import 'firebase/app';
import 'firebase/firestore';
import 'firebase/storage';
import 'firebase/auth';

import AdminPointEdit from 'containers/AdminPointEdit/AdminPointEdit.jsx';
import AdminUtility from 'components/AdminUtility/AdminUtility.jsx';
import Marker from 'components/Marker/Marker.jsx';
import Overlay from 'components/Overlay/Overlay.jsx';
import Spinner from 'components/Spinner/Spinner.jsx';

import Login from 'components/Login/Login.jsx';
import MapStyle from 'data/ADMIN-STYLE.json';
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
			editPoint: false,
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
			},
			removeLoading: false,
			removeMarker: null,
			removeMarkerInfo: null,
			removePoint: false,
			showRemove: false
		};
		this.db = null;
		this.map = null;
		this.maps = null;
		this.newMarker = null;
		this.storage = null;
	}

	onLogin = user => {
		this.setState({
			isSignedIn: !!user
		});
	};

	initMap = (map, maps) => {
		this.map = map;
		this.maps = maps;
		this.maps.event.addListener(map, 'click', event => {
			this.addPoint(event.latLng);
		});
		this.getMarkers(this.initFirebase());
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
					this.setState(
						{ loadingMarkers: false, markers: markers },
						() => {
							this.setBounds();
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
	};

	getMessage = () => {
		if (this.state.loadingMarkers) {
			return (
				<div className="InfoMessage">
					<Spinner size={30} margins="10px 10px 10px 0" />
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

	toggleActiveNewPoint = () => {
		if (this.state.newPointOpen) {
			return;
		}
		this.setState({
			addNewPoint: !this.state.addNewPoint
		});
	};

	toggleActiveRemovePoint = () => {
		this.setState({
			removePoint: !this.state.removePoint
		});
	};

	addPoint = latLng => {
		if (!this.state.addNewPoint || this.state.newPointOpen) {
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

	removePoint = () => {
		this.setState({
			removeLoading: true
		});
		let audioRef = firebase
			.storage()
			.refFromURL(this.state.removeMarkerInfo.audioPath);
		let markerInfoRef = this.state.removeMarker.markerInfo;
		let markerRef = this.state.removeMarker.selfReference;
		// let markerRef = firebase.firestore.CollectionReference().where(, '==', this.state.removeMarker.id);
		// console.log(audioRef, markerInfoRef, markerRef);
		audioRef.delete().then(
			() => {
				markerInfoRef.delete().then(
					() => {
						markerRef.delete().then(
							() => {
								this.setState({
									removeLoading: false
								});
								this.closeRemove();
								this.getMarkers();
							},
							error => {
								this.setState({
									error: error
								});
							}
						);
					},
					error => {
						this.setState({
							error: error
						});
					}
				);
			},
			error => {
				this.setState({
					error: error
				});
			}
		);
	};

	handleChildClick = clickedMarkerId => {
		if (!this.state.removePoint && !this.state.editPoint) {
			return;
		}
		if (this.state.removePoint) {
			this.setState({
				showRemove: true
			});
			let marker = this.state.markers.find(
				correctMarker => correctMarker.id === clickedMarkerId
			);
			marker.markerInfo.get().then(
				querySnapshot => {
					let data = querySnapshot.data();
					this.setState({
						removeMarker: marker,
						removeMarkerInfo: data
					});
				},
				error => {
					this.setState({ error: error });
				}
			);
		}
	};

	closeNewPoint = () => {
		this.newMarker.setMap(null);
		this.setState({
			addNewPoint: false,
			newPointOpen: false
		});
	};

	closeRemove = () => {
		this.setState({
			removeMarker: null,
			removeMarkerInfo: null,
			removePoint: false,
			showRemove: false
		});
	};

	componentDidUpdate = (prevProps, prevState) => {
		if (
			!this.state.newPointOpen &&
			this.state.newPointOpen !== prevState.newPointOpen
		) {
			this.setMapOptions();
		}
	};

	// Listen to the Firebase Auth state and set the local state.
	componentWillMount = () => {
		this.unregisterAuthObserver = firebase
			.auth()
			.onAuthStateChanged(user => this.setState({ isSignedIn: !!user }));
	};

	componentWillUnmount() {
		// Make sure we un-register Firebase observers when the component unmounts.
		this.unregisterAuthObserver();
		if (this.maps) {
			this.maps.event.clearListeners(this.map, 'clicked');
		}
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
							this.state.removeMarkerInfo
								? ' ' + this.state.removeMarkerInfo.header
								: ''
						}?`}
						loading={!this.state.removeMarkerInfo}
						removeLoading={this.state.removeLoading}
						text="This action will permanently remove this marker and all it's nested data such as audiofiles and text information. Please think this though. Seriously my dude/dudette. It's going to be gone forever. What you wanna do?"
						buttons={[
							{
								action: this.closeRemove,
								label: 'Oh no, cancel this action'
							},
							{
								action: this.removePoint,
								disabled: !this.state.removeMarkerInfo,
								label: 'Delete the shit outta that marker',
								type: 'dismissive'
							}
						]}
					/>
				) : null}
				<AdminUtility
					addNewPoint={this.state.addNewPoint}
					removePoint={this.state.removePoint}
					toggleActiveNewPoint={this.toggleActiveNewPoint}
					toggleActiveRemovePoint={this.toggleActiveRemovePoint}
				/>
				<div
					className={`InnerMapWrapper ${
						this.state.addNewPoint && !this.state.newPointOpen
							? 'MouseAdd'
							: ''
					} ${this.state.removePoint ? 'MouseRemove' : ''}`}
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
						onAdded={this.getMarkers}
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

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
		let options = this.state.showEdit
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

	toggleActiveButton = buttonToToggle => {
		if (this.state.showEdit) {
			return;
		}
		this.setState({
			activeButton:
				buttonToToggle !== this.state.activeButton ? buttonToToggle : ''
		});
	};

	getMarkerInfo = clickedMarkerId => {
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
			this.map.panTo({
				lat: marker.geo.latitude,
				lng: marker.geo.longitude
			});
			this.setState(
				{
					loadedMarker: marker,
					pointToEdit: {
						lat: marker.geo.latitude,
						lng: marker.geo.longitude
					},
					showEdit: true
				},
				() => {
					this.setMapOptions();
				}
			);
		}
		marker.markerInfo.get().then(
			querySnapshot => {
				let data = querySnapshot.data();
				this.setState({
					loadedMarkerInfo: data
				});
			},
			error => {
				this.setState({ error: error });
			}
		);
	};

	addPoint = latLng => {
		if (this.state.activeButton !== 'add' || this.state.showEdit) {
			return;
		}
		this.map.panTo(latLng);
		this.newMarker = new this.maps.Marker({
			map: this.map,
			position: latLng
		});
		this.setState(
			{
				pointToEdit: {
					lat: latLng.lat(),
					lng: latLng.lng()
				},
				showEdit: true
			},
			() => {
				this.setMapOptions();
			}
		);
	};

	deleteMarker = () => {
		this.setState({
			removeLoading: true
		});
		let audioRef = firebase
			.storage()
			.refFromURL(this.state.loadedMarkerInfo.audioPath);
		let markerInfoRef = this.state.loadedMarker.markerInfo;
		let markerRef = this.state.loadedMarker.selfReference;
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
			this.getMarkerInfo(clickedMarkerId);
		}
	};

	closeEdit = () => {
		if (this.state.activeButton === 'add') {
			this.newMarker.setMap(null);
		}
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

	componentDidUpdate = (prevProps, prevState) => {
		if (
			!this.state.showEdit &&
			this.state.showEdit !== prevState.showEdit
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
							this.state.loadedMarkerInfo
								? ' ' + this.state.loadedMarkerInfo.header
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

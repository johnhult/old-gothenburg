import React, { Component } from 'react';
import firebase from 'firebase/app';
import 'firebase/app';
import 'firebase/firestore';

import Map from 'components/Map/Map.jsx';
import MarkerInfo from 'containers/MarkerInfo/MarkerInfo';
import Spinner from 'components/Spinner/Spinner.jsx';
import Tutorial from 'components/Tutorial/Tutorial.jsx';
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
			language: 'en',
			loadingMarkers: true,
			loadingUserPos: true,
			markerDataLoaded: [],
			markerInfo: null,
			shouldShowTutorial: true,
			tutorialDone: false,
			userError: null,
			userPos: null
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
						<h1>
							{this.state.language === 'sv'
								? 'Laddar markörer '
								: 'Loading markers '}
							🎵
						</h1>
						<h4>
							{this.state.language === 'sv'
								? 'Var god vänta'
								: 'Please wait'}
						</h4>
					</div>
				);
			}
			else {
				message = (
					<div>
						<h1>
							{this.state.language === 'sv'
								? 'Något gick fel, prova att ladda om sidan...'
								: 'Something went wrong, please reload...'}
						</h1>
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

	visitedBefore = () => {
		let localStorage = window.localStorage;
		if (localStorage) {
			// Setup dates
			let now = new Date();
			let threeMonthsAgo = new Date(now);
			threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

			// Has visitor been here before?
			let lastVisited = localStorage.getItem('lastVisited');

			if (lastVisited) {
				lastVisited = new Date(lastVisited);

				// Check if it was more than 3 months ago visited
				let beenAWhile = lastVisited < threeMonthsAgo;
				if (!beenAWhile) {
					this.watchUserPos();
				}
				this.setState({
					shouldShowTutorial: beenAWhile
				});
			}
			else {
				this.setState({
					shouldShowTutorial: true
				});
			}

			// TODO: Remove when done with tutorial
			// now.setMonth(now.getMonth() - 3);
			localStorage.setItem('lastVisited', now);
		}
		else {
			this.watchUserPos();
		}
	};

	setTutorialDone = () => {
		this.setState({
			tutorialDone: true
		});
		this.watchUserPos();
	};

	checkLanguage = () => {
		let language =
			window.navigator.language === 'sv'
				? window.navigator.language
				: 'en';
		this.setState({
			language: language
		});
	};

	componentDidMount() {
		this.checkLanguage();
		this.visitedBefore();
		this.getMarkers(this.initFirebase());
	}

	render() {
		return this.state.loadingMarkers || this.state.error ? (
			<div className="Loading">{this.getMessage()}</div>
		) : (
			<div className="MapWrapper">
				{this.state.shouldShowTutorial &&
					!this.state.tutorialDone && (
						<Tutorial
							onDone={this.setTutorialDone}
							language={this.state.language}
						/>
					)}
				<Map
					apiKey={this.props.apiKey}
					className="Map"
					handleMarkerClick={this.handleMarkerClick}
					infoOpen={this.state.infoOpen}
					language={this.state.language}
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

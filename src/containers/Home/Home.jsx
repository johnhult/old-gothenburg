import React, { Component } from 'react';
import firebase from 'firebase/app';
import 'firebase/app';
import 'firebase/firestore';

import Button from 'components/Button/Button.jsx';
import Map from 'components/Map/Map.jsx';
import MarkerInfo from 'containers/MarkerInfo/MarkerInfo';
import Settings from 'components/Settings/Settings.jsx';
import Spinner from 'components/Spinner/Spinner.jsx';
import Tutorial from 'components/Tutorial/Tutorial.jsx';
import SettingsImg from 'img/icons/settings.svg';
import './Home.css';

const ERROR = {
	noGeoLocation: 'Your device doesn\'t seem to have any location service.',
	noMarkerData:
		'Couldn\'t find data. Try reloading. If that doesn\'t work there might be something wrong with the specific marker.',
	noMarkers: 'Couldn\'t load markers. 😭 Please reload or try later.',
	noUserPos:
		'Allow your device to use location in order to use the audio tour in Gothenburg. 📍'
};

class Home extends Component {
	constructor(props) {
		super(props);
		this.state = {
			error: null,
			infoLoading: false,
			infoOpen: false,
			language: 'en',
			loadingMarkers: true,
			loadingUserPos: true,
			markerDataLoaded: [],
			markerInfo: null,
			markers: null,
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
		this.openMarker = clickedMarker;
		let fetchMarkerData =
			this.state.language === 'sv'
				? clickedMarker.markerInfoSwe
				: clickedMarker.markerInfoEng;
		this.setState({
			error: null,
			infoLoading: true,
			infoOpen: true
		});
		let data;
		if (fetchMarkerData) {
			data = this.state.markerDataLoaded[fetchMarkerData.id];
		}
		if (data) {
			this.setState({
				error: null,
				infoLoading: false,
				markerInfo: data
			});
		}
		else if (!fetchMarkerData) {
			this.setState({
				error: ERROR.noMarkerData,
				infoLoading: false
			});
		}
		else {
			fetchMarkerData.get().then(
				querySnapshot => {
					let dataFetchedKey = querySnapshot.id;
					data = querySnapshot.data();
					data = { ...data, key: dataFetchedKey };
					if (dataFetchedKey === fetchMarkerData.id) {
						let newData = {
							...this.state.markerDataLoaded,
							[dataFetchedKey]: data
						};
						this.setState({
							error: null,
							infoLoading: false,
							markerDataLoaded: newData,
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
						error: ERROR.noMarkerData,
						infoLoading: false
					});
				}
			);
		}
	};

	toggleSettings = () => {
		this.setState({
			infoOpen: false,
			showSettings: !this.state.showSettings
		});
	};

	showTutorial = () => {
		this.setState({
			shouldShowTutorial: true,
			showSettings: false
		});
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
					this.setState({ loadingMarkers: false, markers: markers });
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
		let language = window.navigator.language === 'sv' ? 'sv' : 'en';
		this.setState({
			language: language
		});
	};

	changeLanguage = newLang => {
		this.setState({
			language: newLang
		});
	};

	componentDidMount() {
		this.checkLanguage();
		this.visitedBefore();
		this.getMarkers(this.initFirebase());
	}

	render() {
		return this.state.loadingMarkers ? (
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
				{this.state.showSettings && (
					<Settings
						handleLanguageSwitch={this.changeLanguage}
						handleShowTutorial={this.showTutorial}
						toggleSettings={this.toggleSettings}
						language={this.state.language}
					/>
				)}
				<Map
					apiKey={this.props.apiKey}
					className="Map"
					handleMarkerClick={this.handleMarkerClick}
					infoOpen={this.state.infoOpen}
					language={this.state.language}
					markers={this.state.markers}
					userError={this.state.userError}
					userPos={this.state.userPos}
				/>
				<MarkerInfo
					close={this.closeInfo}
					infoLoading={this.state.infoLoading}
					infoOpen={this.state.infoOpen}
					markerError={
						this.state.error === ERROR.noMarkerData
							? this.state.error
							: ''
					}
					markerInfo={this.state.markerInfo}
				/>
				{!this.state.infoOpen && (
					<Button
						className="SettingsButton IconButton--small"
						handleClick={this.toggleSettings}
						type="icon"
						imgPath={SettingsImg}
					/>
				)}
			</div>
		);
	}
}

export default Home;

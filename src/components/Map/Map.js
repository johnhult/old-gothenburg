import React, { Component } from 'react';
import PropTypes from 'prop-types';
import GoogleMapReact from 'google-map-react';
import supercluster from 'points-cluster';

import ClusterMarker from 'components/ClusterMarker/ClusterMarker.jsx';
import Marker from 'components/Marker/Marker.jsx';
import MapStyle from 'data/MAP-STYLE.json';

const MAP = {
	defaultZoom: 14,
	options: {
		maxZoom: 19,
		minZoom: 2,
		styles: MapStyle
	}
};

class Map extends Component {
	constructor(props) {
		super(props);
		this.state = {
			clusters: [],
			defaultCenter: {
				...this.props.userPos
			},
			error: null,
			geolocation: null,
			// hasInitPanned: false,
			loading: false,
			map: null,
			mapOptions: {
				center: { ...this.props.userPos },
				zoom: MAP.defaultZoom
			},
			maps: null
			// userPos: null
		};
	}

	getClusters = () => {
		let markers = this.props.markers.map(item => {
			return {
				id: item.id,
				lat: item.geo.latitude,
				lng: item.geo.longitude,
				type: item.type
			};
		});
		const clusters = supercluster(markers, {
			maxZoom: 16,
			minZoom: 2,
			radius: 60
		});

		return clusters(this.state.mapOptions);
	};

	createClusters = props => {
		this.setState({
			clusters: this.state.mapOptions.bounds
				? this.getClusters(props).map(
						({ wx, wy, numPoints, points }) => ({
							id: `${numPoints}_${points[0].id}`,
							lat: wy,
							lng: wx,
							numPoints,
							points
						})
				  )
				: []
		});
	};

	handleMapChange = ({ center, zoom, bounds }) => {
		this.setState(
			{
				mapOptions: {
					bounds,
					center,
					zoom
				}
			},
			() => {
				this.createClusters(this.props);
			}
		);
	};

	handleChildClick = key => {
		if (key === 'user') {
			return;
		}
		let clusterIdentifier = key.substr(0, key.indexOf('_'));
		let keyId = key.substr(key.indexOf('_'), key.length).replace('_', '');
		let numPoints = parseInt(clusterIdentifier, 10);
		if (numPoints && numPoints > 1) {
			this.zoomOnCluster();
		}
		else {
			let clickedMarker = this.props.markers.find(
				correctMarker => correctMarker.id === keyId
			);
			this.state.map.panTo({
				lat: clickedMarker.geo.latitude,
				lng: clickedMarker.geo.longitude
			});
			this.props.handleMarkerClick(clickedMarker);
		}
	};

	zoomOnCluster() {}

	// handleLocationError(browserHasGeolocation, infoWindow, pos, map) {
	// 	infoWindow.setPosition(pos);
	// 	infoWindow.setContent(
	// 		browserHasGeolocation
	// 			? 'Error: The Geolocation service failed.'
	// 			: 'Error: Your browser doesn\'t support geolocation.'
	// 	);
	// 	infoWindow.open(map);
	// }

	initMap = (map, maps) => {
		if (!map || !maps) {
			this.setState({
				error:
					'Could not properly load Google Maps. Please check your internet connection and reload page.'
			});
			return;
		}
		this.setState({
			map: map,
			maps: maps
		});
	};

	// initMap = (map, maps) => {
	// 	if (!map || !maps) {
	// 		this.setState({
	// 			error:
	// 				'Could not properly load Google Maps. Please check your internet connection and reload page.'
	// 		});
	// 		return;
	// 	}
	// 	let infoWindow = new maps.InfoWindow();
	// 	this.setState({
	// 		map: map,
	// 		maps: maps
	// 	});
	// 	if (navigator.geolocation) {
	// 		navigator.geolocation.watchPosition(
	// 			position => {
	// 				this.setState({
	// 					userPos: {
	// 						lat: position.coords.latitude,
	// 						lng: position.coords.longitude
	// 					}
	// 				});
	// 			},
	// 			() => {
	// 				this.handleLocationError(
	// 					true,
	// 					infoWindow,
	// 					map.getCenter(),
	// 					map
	// 				);
	// 				this.setState({
	// 					error:
	// 						'Allow your device to use location for a full fledged experience.'
	// 				});
	// 			}
	// 		);
	// 	}
	// 	else {
	// 		this.handleLocationError(false, infoWindow, map.getCenter(), map);
	// 	}
	// };

	// componentDidUpdate(prevProps, prevState) {
	// 	if (
	// 		this.state.userPos !== prevState.userPos &&
	// 		this.state.map &&
	// 		this.state.maps &&
	// 		!this.state.hasInitPanned
	// 	) {
	// 		this.setState({ hasInitPanned: true });
	// 		this.state.map.panTo(this.state.userPos);
	// 	}
	// }

	render() {
		return (
			<GoogleMapReact
				bootstrapURLKeys={{
					key: ''
				}}
				defaultCenter={this.state.defaultCenter}
				defaultZoom={MAP.defaultZoom}
				onChange={this.handleMapChange}
				onChildClick={this.handleChildClick}
				onGoogleApiLoaded={({ map, maps }) => this.initMap(map, maps)}
				options={MAP.options}
				yesIWantToUseGoogleMapApiInternals
			>
				{this.state.clusters.map(marker => {
					if (marker.numPoints === 1) {
						return (
							<Marker
								key={marker.id}
								lat={marker.lat}
								lng={marker.lng}
								type={marker.points[0].type}
							/>
						);
					}

					return (
						<ClusterMarker
							key={marker.id}
							lat={marker.lat}
							lng={marker.lng}
							nrOfPoints={marker.numPoints}
							points={marker.points}
						/>
					);
				})}
				{this.props.userPos ? (
					<Marker
						className="User"
						key="user"
						lat={this.props.userPos.lat}
						lng={this.props.userPos.lng}
						type="user"
					/>
				) : null}
			</GoogleMapReact>
		);
	}
}

Map.defaultProps = {};

Map.PropTypes = {
	className: PropTypes.string,
	handleMarkerClick: PropTypes.func.isRequired,
	markers: PropTypes.array,
	userPos: PropTypes.object
};

export default Map;

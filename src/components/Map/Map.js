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
		fullscreenControl: false,
		maxZoom: 19,
		minZoom: 8,
		styles: MapStyle
	}
};

class Map extends Component {
	constructor(props) {
		super(props);
		this.state = {
			bounds: null,
			clusters: [],
			defaultCenter: {
				...this.props.userPos
			},
			error: null,
			geolocation: null,
			loading: false,
			map: null,
			mapOptions: {
				bounds: null,
				center: { ...this.props.userPos },
				zoom: MAP.defaultZoom
			},
			maps: null
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

	createClusters = () => {
		this.setState({
			clusters: this.state.mapOptions.bounds
				? this.getClusters().map(({ wx, wy, numPoints, points }) => ({
					id: `${numPoints}_${points[0].id}`,
					lat: wy,
					lng: wx,
					numPoints,
					points
				  }))
				: []
		});
	};

	setDefaultBounds = maps => {
		let newBounds = new maps.LatLngBounds();
		this.props.markers.forEach(item => {
			newBounds.extend({
				lat: item.geo.latitude,
				lng: item.geo.longitude
			});
		});

		let increasePercentage = 1.1;
		let NE = newBounds.getNorthEast();
		let SW = newBounds.getSouthWest();

		// Increase bounds
		let latAdjustment = (NE.lat() - SW.lat()) * (increasePercentage - 1);
		let lngAdjustment = (NE.lng() - SW.lng()) * (increasePercentage - 1);
		var newNE = new maps.LatLng(
			NE.lat() + latAdjustment,
			NE.lng() + lngAdjustment
		);
		var newSW = new maps.LatLng(
			SW.lat() - latAdjustment,
			SW.lng() - lngAdjustment
		);

		// North West
		let NW = new maps.LatLng(newNE.lat(), newSW.lng());
		// South East
		let SE = new maps.LatLng(newSW.lat(), newNE.lng());
		let otherBounds = {
			ne: { lat: newNE.lat(), lng: newNE.lng() },
			nw: { lat: NW.lat(), lng: NW.lng() },
			se: { lat: SE.lat(), lng: SE.lng() },
			sw: { lat: newSW.lat(), lng: newSW.lng() }
		};

		return otherBounds;
	};

	handleMapChange = ({ center, zoom }, doNotReturn) => {
		if (
			(zoom === this.state.mapOptions.zoom || !this.state.bounds) &&
			!doNotReturn
		) {
			return;
		}

		this.setState(
			{
				mapOptions: {
					bounds: this.state.bounds,
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
			let clickedMarker = this.state.clusters.find(
				correctMarker => correctMarker.id === key
			);
			this.zoomOnCluster(clickedMarker);
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

	zoomOnCluster(clickedMarker) {
		let zoom = this.state.map.getZoom();
		this.state.map.panTo({
			lat: clickedMarker.lat,
			lng: clickedMarker.lng
		});
		zoom = zoom + 2 > 19 ? 19 : zoom + 2;
		this.state.map.setZoom(zoom);
	}

	initMap = (map, maps) => {
		if (!map || !maps) {
			this.setState({
				error:
					'Could not properly load Google Maps. Please check your internet connection and reload page.'
			});
			return;
		}
		this.setState(
			{
				bounds: this.setDefaultBounds(maps),
				map: map,
				maps: maps
			},
			() => {
				this.handleMapChange(
					{
						center: this.state.mapOptions.center,
						zoom: this.state.mapOptions.zoom
					},
					true
				);
			}
		);
	};

	render() {
		return (
			<GoogleMapReact
				bootstrapURLKeys={{
					key: ''
				}}
				defaultCenter={this.state.defaultCenter}
				defaultZoom={MAP.defaultZoom}
				experimental
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

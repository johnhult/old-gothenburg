import React, { Component } from 'react';
import PropTypes from 'prop-types';
import GoogleMapReact from 'google-map-react';
import supercluster from 'points-cluster';

import Button from 'components/Button/Button.jsx';
import ClusterMarker from 'components/ClusterMarker/ClusterMarker.jsx';
import Marker from 'components/Marker/Marker.jsx';
import MapStyle from 'data/MAP-STYLE.json';
import './Map.css';

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
		minZoom: 4,
		panControl: true,
		scrollwheel: true,
		styles: MapStyle,
		zoomControl: true
	}
};

class Map extends Component {
	constructor(props) {
		super(props);
		this.state = {
			bounds: null,
			clusters: [],
			error: null,
			geolocation: null,
			loaded: false,
			mapOptions: {
				bounds: null,
				center: { ...this.props.userPos },
				zoom: MAP.defaultZoom
			},
			openMarker: null
		};
		this.map = null;
		this.maps = null;
		this.newMarker = null;
	}

	centerOnUser = () => {
		this.map.setZoom(16);
		this.map.panTo(this.props.userPos);
	};

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
			minZoom: 4,
			radius: 40
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

	setDefaultBounds = (map, maps, skipFit) => {
		let newBounds = new maps.LatLngBounds();
		this.props.markers.forEach(item => {
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

		let fitBounds = new maps.LatLngBounds(newSW, newNE);

		if (!skipFit) {
			map.fitBounds(fitBounds);
		}

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
				this.createClusters();
			}
		);
	};

	handleChildClick = key => {
		if (
			key === 'user' ||
			(key === this.state.openMarker && this.props.infoOpen)
		) {
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
			if (!this.props.admin) {
				this.setState({
					openMarker: key
				});
				this.map.panTo({
					lat: clickedMarker.geo.latitude,
					lng: clickedMarker.geo.longitude
				});
			}
			this.props.handleMarkerClick(clickedMarker, this.map);
		}
	};

	zoomOnCluster(clickedMarker) {
		let zoom = this.map.getZoom();
		this.map.panTo({
			lat: clickedMarker.lat,
			lng: clickedMarker.lng
		});
		zoom = zoom + 2 > MAP.options.maxZoom ? MAP.options.maxZoom : zoom + 2;
		this.map.setZoom(zoom);
	}

	initMap = (map, maps) => {
		if (!map || !maps) {
			this.setState({
				error:
					'Could not properly load Google Maps. Please check your internet connection and reload page.'
			});
			return;
		}
		maps.event.addListenerOnce(map, 'idle', () => {
			document.getElementsByTagName('iframe')[0].title = 'Google Maps';
		});
		this.map = map;
		this.maps = maps;
		this.setState(
			{
				bounds: this.setDefaultBounds(map, maps),
				loaded: true
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

	adminClick = ({ lat, lng }) => {
		if (
			!this.props.admin ||
			this.props.infoOpen ||
			!this.props.shouldReactToClick
		) {
			return;
		}
		let latLng = { lat: lat, lng: lng };
		this.map.panTo(latLng);
		this.newMarker = new this.maps.Marker({
			map: this.map,
			position: latLng
		});
		this.props.handleClick(latLng);
	};

	componentDidUpdate(prevProps) {
		if (!this.state.loaded) {
			return;
		}
		if (prevProps.infoOpen !== this.props.infoOpen) {
			let options = this.props.infoOpen
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
			if (this.props.admin && !this.props.infoOpen && this.newMarker) {
				this.newMarker.setMap(null);
				this.newMarker = null;
			}
		}
		if (prevProps.markers.length !== this.props.markers.length) {
			this.setState(
				{
					bounds: this.setDefaultBounds(this.map, this.maps, true)
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
		}
	}

	render() {
		return (
			<div className="InnerMap">
				<GoogleMapReact
					bootstrapURLKeys={{
						key: this.props.apiKey
					}}
					defaultCenter={MAP.defaultCenter}
					defaultZoom={MAP.defaultZoom}
					onClick={this.adminClick}
					experimental
					onChange={this.handleMapChange}
					onChildClick={this.handleChildClick}
					onGoogleApiLoaded={({ map, maps }) =>
						this.initMap(map, maps)
					}
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
					{this.props.userPos && !this.props.userError ? (
						<Marker
							className="User"
							key="user"
							lat={this.props.userPos.lat}
							lng={this.props.userPos.lng}
							type="user"
						/>
					) : null}
				</GoogleMapReact>
				{this.props.infoOpen ||
				!this.props.userPos ||
				this.props.userError ? null : (
					<Button
						className="UserPositionButton"
						label={
							this.props.language === 'sv'
								? 'Min position'
								: 'My position'
						}
						handleClick={e => this.centerOnUser(e)}
					/>
				)}
			</div>
		);
	}
}

Map.defaultProps = {};

Map.propTypes = {
	admin: PropTypes.bool,
	apiKey: PropTypes.string,
	className: PropTypes.string,
	handleClick: PropTypes.func,
	handleMarkerClick: PropTypes.func.isRequired,
	infoOpen: PropTypes.bool.isRequired,
	language: PropTypes.string,
	markers: PropTypes.array,
	shouldReactToClick: PropTypes.bool,
	userError: PropTypes.string,
	userPos: PropTypes.object
};

export default Map;

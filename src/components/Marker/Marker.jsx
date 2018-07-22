import React, { Component } from 'react';
import ReactSVG from 'react-svg';

import buildingMarker from 'img/icons/marker-building.svg';
import cultureMarker from 'img/icons/marker-culture.svg';
import infoMarker from 'img/icons/marker-information.svg';
import userMarker from 'img/icons/marker-user.svg';
import './Marker.css';

const paths = {
	building: buildingMarker,
	culture: cultureMarker,
	information: infoMarker,
	user: userMarker
};

class Marker extends Component {
	constructor(props) {
		super(props);
		this.state = {};
	}

	getMarkerPath = type => {
		return paths[type];
	};

	getTypeMarkerStyles = () => {
		return this.props.type === 'user'
			? {
				height: '20px',
				transform: 'translate(-50%, -50%)',
				width: '20px'
			  }
			: {
				cursor: 'pointer',
				height: '40px',
				left: '-20px',
				position: 'relative',
				top: '-30px',
				width: '40px'
			  };
	};

	render() {
		return (
			<div
				style={{
					...this.getTypeMarkerStyles(),
					position: 'absolute'
				}}
			>
				<ReactSVG
					svgStyle={{ height: '100%', width: '100%' }}
					svgClassName={this.props.type}
					path={this.getMarkerPath(this.props.type)}
				/>
			</div>
		);
	}
}

Marker.defaultProps = {
	//	Example defaultProps
	//	label: 'click me'
};

Marker.PropTypes = {
	//	Example PropTypes:
	//	label: PropTypes.string.isRequired,
	//	onClick: PropTypes.func,
};

export default Marker;

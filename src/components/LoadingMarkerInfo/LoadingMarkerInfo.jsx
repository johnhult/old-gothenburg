import React, { Component } from 'react';

import './LoadingMarkerInfo.css';

class LoadingMarkerInfo extends Component {
	constructor(props) {
		super(props);
		this.state = {};
	}

	render() {
		return (
			<div>
				<div className="LoadingHeader">
					<div className="LoadingHeader-mock" />
				</div>
				<div className="LoadingAudio" />
				<div className="LoadingText">
					<div className="LoadingText-mock" />
					<div className="LoadingText-mock" />
					<div className="LoadingText-mock" />
					<div className="LoadingText-mock" />
					<div className="LoadingText-mock LoadingText-mock--small" />
				</div>
			</div>
		);
	}
}

LoadingMarkerInfo.defaultProps = {
	//	Example defaultProps
	//	label: 'click me'
};

LoadingMarkerInfo.PropTypes = {
	//	Example PropTypes:
	//	label: PropTypes.string.isRequired,
	//	onClick: PropTypes.func,
};

export default LoadingMarkerInfo;

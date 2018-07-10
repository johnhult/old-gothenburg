import React, { Component } from 'react';

import './ClusterMarker.css';

class ClusterMarker extends Component {
	render() {
		return (
			<div className="ClusterMarker">
				<span>{this.props.nrOfPoints}</span>
			</div>
		);
	}
}

export default ClusterMarker;

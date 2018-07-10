import React, { Component } from 'react';
import PropTypes from 'prop-types';

import CloseIcon from 'components/CloseIcon/CloseIcon.jsx';

import './MarkerInfo.css';

class MarkerInfo extends Component {
	constructor(props) {
		super(props);
		this.state = {};
	}

	render() {
		return (
			<div
				className={`MarkerInfo ${
					this.props.infoOpen ? 'MarkerInfo--open' : ''
				}`}
			>
				<div className="MarkerInfoWrapper">
					<CloseIcon handleClick={this.props.close} />
					{this.props.markerInfo ? (
						<div className="MarkerText">
							<h1>{this.props.markerInfo.header}</h1>
							<p>{this.props.markerInfo.text}</p>
							<audio controls>
								<source
									src={this.props.markerInfo.audioPath}
									type="audio/mp3"
								/>
								Your device doesn't support audio format.
							</audio>
						</div>
					) : null}
				</div>
			</div>
		);
	}
}

MarkerInfo.defaultProps = {
	//	Example defaultProps
	//	label: 'click me'
};

MarkerInfo.PropTypes = {
	close: PropTypes.func.isRequired,
	markerInfo: PropTypes.object.isRequired
	//	Example PropTypes:
	//	label: PropTypes.string.isRequired,
	//	onClick: PropTypes.func,
};

export default MarkerInfo;

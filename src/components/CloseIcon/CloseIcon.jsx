import React, { Component } from 'react';
import { PropTypes } from 'prop-types';

import './CloseIcon.css';

class CloseIcon extends Component {
	constructor(props) {
		super(props);
		this.state = {};
	}

	render() {
		return <div className="CloseIcon" onClick={this.props.handleClick} />;
	}
}

CloseIcon.defaultProps = {
	//	Example defaultProps
	//	label: 'click me'
};

CloseIcon.PropTypes = {
	handleClick: PropTypes.func.isRequired
	//	Example PropTypes:
	//	label: PropTypes.string.isRequired,
	//	onClick: PropTypes.func,
};

export default CloseIcon;

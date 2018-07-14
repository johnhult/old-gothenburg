import React, { Component } from 'react';
import PropTypes from 'prop-types';

import './Spinner.css';

class Spinner extends Component {
	constructor(props) {
		super(props);
		this.state = {};
	}

	render() {
		return (
			<div
				className="Spinner"
				style={{ height: this.props.size, width: this.props.size }}
			/>
		);
	}
}

Spinner.defaultProps = {
	//	Example defaultProps
	//	label: 'click me'
	size: 50
};

Spinner.PropTypes = {
	size: PropTypes.number
	//	Example PropTypes:
	//	label: PropTypes.string.isRequired,
	//	onClick: PropTypes.func,
};

export default Spinner;

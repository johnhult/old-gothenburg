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
				style={{
					display: this.props.display,
					height: this.props.size,
					margin: `${
						typeof this.props.margins === 'string'
							? this.props.margins
							: this.props.margins + 'px'
					}`,
					width: this.props.size
				}}
			/>
		);
	}
}

Spinner.defaultProps = {
	//	Example defaultProps
	//	label: 'click me'
	margins: '20px auto',
	size: 50
};

Spinner.PropTypes = {
	display: PropTypes.string,
	margins: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
	size: PropTypes.number
	//	Example PropTypes:
	//	label: PropTypes.string.isRequired,
	//	onClick: PropTypes.func,
};

export default Spinner;

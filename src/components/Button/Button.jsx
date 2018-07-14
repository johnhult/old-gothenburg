import React, { Component } from 'react';
import PropTypes from 'prop-types';
import './Button.css';

class Button extends Component {
	constructor(props) {
		super(props);
		this.state = {};
	}

	render() {
		return (
			<button
				className={`btn ${this.props.className}`}
				onClick={this.props.handleClick}
				type={this.props.type}
			>
				{this.props.label}
			</button>
		);
	}
}

Button.defaultProps = {
	className: 'primary',
	label: 'click me'
};

Button.PropTypes = {
	className: PropTypes.string,
	handleClick: PropTypes.func.isRequired,
	label: PropTypes.string.isRequired,
	type: PropTypes.string
};

export default Button;

import React, { Component } from 'react';
import PropTypes from 'prop-types';
import './Button.css';

class Button extends Component {

	constructor(props) {
		super(props);
	}

	render() {
		return (
			<button className={this.props.className} onClick={this.props.handleClick} type={this.props.type}>
				{this.props.label}
			</button>
		);
	}
}

Button.defaultProps = {
	label: 'click me',
	className: 'primary'
};

Button.PropTypes = {
	label: PropTypes.string.isRequired,
	className: PropTypes.string.isRequired,
	onClick: PropTypes.func,
	type: PropTypes.string
};

export default Button;

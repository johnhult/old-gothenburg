import React, { Component } from 'react';
import PropTypes from 'prop-types';
import ReactSvg from 'react-svg';

import './Button.css';

class Button extends Component {
	constructor(props) {
		super(props);
		this.state = {};
	}

	render() {
		return (
			<button
				disabled={this.props.disabled}
				className={`btn ${this.props.className || ''} ${
					this.props.type === 'icon' ? 'IconButton' : ''
				} ${this.props.type === 'dismissive' ? 'DangerButton' : ''} ${
					this.props.iconType === 'dark' ? 'IconButton--dark' : ''
				}`}
				style={{ margin: this.props.margins }}
				onClick={this.props.handleClick}
				type={this.props.type}
			>
				{this.props.type === 'icon' ? (
					<ReactSvg
						className="IconWrapper"
						path={this.props.imgPath}
						svgStyle={{ height: '20px', width: '20px' }}
					/>
				) : (
					this.props.label
				)}
			</button>
		);
	}
}

Button.defaultProps = {};

Button.PropTypes = {
	className: PropTypes.string,
	disabled: PropTypes.bool,
	handleClick: PropTypes.func.isRequired,
	iconType: PropTypes.string,
	imgPath: PropTypes.string,
	label: PropTypes.string,
	type: PropTypes.string
};

export default Button;

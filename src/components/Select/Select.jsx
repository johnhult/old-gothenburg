import React, { Component } from 'react';
import PropTypes from 'prop-types';

import './Select.css';

class Select extends Component {
	constructor(props) {
		super(props);
		this.state = {
			listOpen: false,
			selected: ''
		};
	}

	render() {
		return (
			<div className="SelectWrapper">
				<select
					required
					className={`SelectList ${
						this.props.showError ? 'SelectError' : ''
					}`}
					onChange={this.props.handleChange}
					onBlur={this.props.handleBlur}
					name={this.props.name}
					value={this.props.value}
				>
					<option value="" disabled hidden>
						{this.props.label}
					</option>
					{this.props.options.map((item, index) => {
						return (
							<option key={index} value={item}>
								{item}
							</option>
						);
					})}
				</select>
				<div className="SelectTriangle" />
			</div>
		);
	}
}

Select.defaultProps = {
	type: 'text'
};

Select.propTypes = {
	disabled: PropTypes.bool,
	handleBlur: PropTypes.func.isRequired,
	handleChange: PropTypes.func.isRequired,
	name: PropTypes.string.isRequired,
	options: PropTypes.array.isRequired,
	showError: PropTypes.bool.isRequired,
	value: PropTypes.string.isRequired
};

export default Select;

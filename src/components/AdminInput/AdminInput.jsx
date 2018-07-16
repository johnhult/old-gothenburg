import React, { Component } from 'react';
import PropTypes from 'prop-types';

import './AdminInput.css';

class AdminInput extends Component {
	constructor(props) {
		super(props);
		this.state = {};
	}

	render() {
		if (this.props.type === 'textarea') {
			return (
				<label
					className={`LabelTextarea ${
						this.props.showError ? 'TextareaError' : ''
					}`}
				>
					<textarea
						className={`${
							this.props.value !== '' ? 'InputHasValue' : ''
						}`}
						required={this.props.required}
						name={this.props.name}
						onChange={this.props.handleChange}
						onBlur={this.props.handleBlur}
						value={this.props.value}
					/>
					<span className="MovingText">{this.props.label}</span>
				</label>
			);
		}
		return (
			<label
				className={`Label ${
					this.props.type === 'file' ? 'LabelFile' : ''
				} ${
					this.props.showError && this.props.type === 'file'
						? 'FileError'
						: ''
				} ${
					this.props.showError && this.props.type !== 'file'
						? 'InputError'
						: ''
				}`}
			>
				<input
					className={`${
						this.props.value !== '' ? 'InputHasValue' : ''
					} ${this.props.type === 'file' ? 'InputFile' : ''}`}
					name={this.props.name}
					type={this.props.type}
					onChange={this.props.handleChange}
					onBlur={this.props.handleBlur}
					value={this.props.value}
					required={this.props.required}
					disabled={this.props.disabled}
					accept={this.props.type === 'file' ? 'audio/mp3' : ''}
				/>
				<span
					className={`${
						this.props.type === 'file' ? 'FileText' : 'MovingText'
					}`}
				>
					{this.props.type === 'file' && this.props.value !== ''
						? this.props.value.split('\\').pop()
						: this.props.label}
				</span>
			</label>
		);
	}
}

AdminInput.defaultProps = {
	type: 'text'
};

AdminInput.propTypes = {
	disabled: PropTypes.bool,
	handleChange: PropTypes.func.isRequired,
	label: PropTypes.string,
	name: PropTypes.string,
	required: PropTypes.bool,
	showError: PropTypes.bool.isRequired,
	type: PropTypes.string,
	value: PropTypes.string.isRequired
};

export default AdminInput;

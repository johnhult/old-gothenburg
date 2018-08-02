import React, { Component } from 'react';
import PropTypes from 'prop-types';
import ReactSVG from 'react-svg';

import Play from 'img/icons/play.svg';
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
				id={
					this.props.id && this.props.type === 'file'
						? this.props.id
						: ''
				}
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
					} ${this.props.styling === 'light' ? 'InputLight' : ''} ${
						this.props.type === 'file' ? 'InputFile' : ''
					}`}
					name={this.props.name}
					type={this.props.type}
					onChange={this.props.handleChange}
					onBlur={this.props.handleBlur}
					value={this.props.value}
					required={this.props.required}
					disabled={this.props.disabled}
					accept={this.props.type === 'file' ? 'audio/mp3' : ''}
				/>
				{this.props.type === 'file' ? (
					<div className="FileFocus" />
				) : null}
				{this.props.type === 'file' ? (
					<div className="FileCircle">
						<ReactSVG path={Play} />
					</div>
				) : null}
				{this.props.type === 'file' ? (
					<span className="FileText">
						{this.props.audioValue !== '' && this.props.audioValue
							? this.props.audioValue.split('\\').pop()
							: 'Drag and drop or click to upload'}
					</span>
				) : null}
				<span
					className={`${
						this.props.type === 'file' ? 'FileLabel' : 'MovingText'
					}`}
				>
					{this.props.label}
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
	styling: PropTypes.string,
	type: PropTypes.string,
	value: PropTypes.string
};

export default AdminInput;

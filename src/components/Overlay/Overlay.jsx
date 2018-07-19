import React, { Component } from 'react';
import PropTypes from 'prop-types';

import Button from 'components/Button/Button.jsx';
import Spinner from 'components/Spinner/Spinner.jsx';
import './Overlay.css';

class Overlay extends Component {
	constructor(props) {
		super(props);
		this.state = {};
	}

	buttons = () => {
		let btns = this.props.buttons.map((button, index) => {
			return (
				<Button
					className="u-standardMargin"
					key={index}
					label={button.label}
					handleClick={button.action}
					type={button.type}
					margins="0 10px 10px 10px"
					disabled={button.disabled}
				/>
			);
		});
		return btns;
	};

	render() {
		let header;
		let headerText = this.props.header.split(/(?=[?])/g);
		if (!this.props.loading || headerText.length <= 1) {
			header = (
				<h2 className="u-standardMargin u-fatText">
					{this.props.header}
				</h2>
			);
		}
		else {
			header = (
				<h2 className="u-standardMargin u-fatText">
					{headerText[0]}
					<Spinner size={20} display="inline-block" margins="0 5px" />
					{headerText[1]}
				</h2>
			);
		}
		return (
			<div className="OverlayBg">
				<div className="OverlayContent">
					{header}
					<p className="u-standardMargin">{this.props.text}</p>
					{this.props.removeLoading ? (
						<Spinner size={30} />
					) : (
						this.buttons()
					)}
				</div>
			</div>
		);
	}
}

Overlay.defaultProps = {
	//	Example defaultProps
	//	label: 'click me'
};

Overlay.propTypes = {
	buttons: PropTypes.arrayOf(PropTypes.object).isRequired,
	header: PropTypes.string.isRequired,
	loading: PropTypes.bool.isRequired,
	removeLoading: PropTypes.bool.isRequired,
	text: PropTypes.string.isRequired
	//	Example PropTypes:
	//	label: PropTypes.string.isRequired,
	//	onClick: PropTypes.func,
};

export default Overlay;

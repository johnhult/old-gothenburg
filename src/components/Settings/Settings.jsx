import React, { Component } from 'react';
import PropTypes from 'prop-types';

import Button from 'components/Button/Button.jsx';
import './Settings.css';

class Settings extends Component {
	constructor(props) {
		super(props);
		this.state = {};
	}

	render() {
		return (
			<div className="OverlayBg">
				<div className="Settings">
					<h2 className="u-fatText u-standardMargin">
						{this.props.language === 'sv'
							? 'Inställningar'
							: 'Settings'}
					</h2>
					<span className="u-fatText u-greyText u-smallMargin">
						{this.props.language === 'sv' ? 'Språk' : 'Language'}
					</span>
					<div className="LanguageWrapper u-bigMargin">
						<div
							className={`LanguageChoice ${this.props.language ===
								'sv' && 'LanguageChoice--active'}`}
							onClick={() =>
								this.props.handleLanguageSwitch('sv')
							}
						>
							🇸🇪 Svenska
						</div>
						<div
							className={`LanguageChoice ${this.props.language !==
								'sv' && 'LanguageChoice--active'}`}
							onClick={() =>
								this.props.handleLanguageSwitch('en')
							}
						>
							🇬🇧 English
						</div>
					</div>
					<div className="TutorialWrapper u-bigMargin">
						<span
							className="u-greyText u-fatText"
							onClick={this.props.handleShowTutorial}
						>
							{this.props.language === 'sv'
								? 'Visa hjälp'
								: 'Show tutorial'}
						</span>
					</div>
					<Button
						className="CloseSettingsButton"
						label={this.props.language === 'sv' ? 'Stäng' : 'Close'}
						handleClick={this.props.toggleSettings}
						type="dismissive"
					/>
				</div>
			</div>
		);
	}
}

Settings.defaultProps = {
	//	Example defaultProps
	//	label: 'click me'
};

Settings.propTypes = {
	handleLanguageSwitch: PropTypes.func.isRequired,
	handleShowTutorial: PropTypes.func.isRequired,
	toggleSettings: PropTypes.func.isRequired
};

export default Settings;

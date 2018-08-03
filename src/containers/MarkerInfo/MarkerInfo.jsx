import React, { Component } from 'react';
import PropTypes from 'prop-types';

import AudioPlayer from '../../components/AudioPlayer/AudioPlayer';
import CloseIcon from 'components/CloseIcon/CloseIcon.jsx';
import LoadingMarkerInfo from 'components/LoadingMarkerInfo/LoadingMarkerInfo';
import Spinner from 'components/Spinner/Spinner.jsx';
import './MarkerInfo.css';

class MarkerInfo extends Component {
	constructor(props) {
		super(props);
		this.state = {};
	}

	getLayout = () => {
		if (this.props.markerError) {
			return (
				<div className="MarkerText">
					<h1 className="MarkerHeader">{this.props.markerError}</h1>
				</div>
			);
		}
		return !this.props.infoLoading && this.props.markerInfo ? (
			<div className="MarkerText">
				<h1 className="MarkerHeader">{this.props.markerInfo.header}</h1>
				{this.props.markerInfo.audioPath && (
					<AudioPlayer
						markerKey={this.props.markerInfo.key}
						infoOpen={this.props.infoOpen}
						audioPath={this.props.markerInfo.audioPath}
					/>
				)}
				{this.props.markerInfo.text
					.split('\\n\\n')
					.map((text, index) => {
						return (
							<p className="u-bigMargin" key={index}>
								{text}
							</p>
						);
					})}
			</div>
		) : (
			<div className="MarkerText">
				<LoadingMarkerInfo />
			</div>
		);
	};

	render() {
		return (
			<div
				className={`MarkerInfo ${
					this.props.infoOpen ? 'MarkerInfo--open' : ''
				}`}
			>
				<div className="MarkerInfoWrapper">
					<div className="ExitAndLoadInfo">
						<CloseIcon handleClick={this.props.close} />
						{!this.props.infoLoading ? null : (
							<span className="MarkerLoadingSpinner">
								<Spinner size={30} margins="0 20px 0 0" />Loading
								content
							</span>
						)}
					</div>
					{this.getLayout()}
				</div>
			</div>
		);
	}
}

MarkerInfo.defaultProps = {
	//	Example defaultProps
	//	label: 'click me'
};

MarkerInfo.propTypes = {
	close: PropTypes.func.isRequired,
	infoLoading: PropTypes.bool.isRequired,
	infoOpen: PropTypes.bool,
	markerError: PropTypes.string,
	markerInfo: PropTypes.object
};

export default MarkerInfo;

import React, { Component } from 'react';
import PropTypes from 'prop-types';
import ReactSVG from 'react-svg';

import VolumeButton from 'components/VolumeButton/VolumeButton.jsx';
import play from 'img/icons/play.svg';
import pause from 'img/icons/pause.svg';
import './AudioPlayer.css';

class AudioPlayer extends Component {
	constructor(props) {
		super(props);
		this.state = {
			currentTime: '00:00',
			endTime: '00:00',
			playing: false,
			width: 0
		};
		this.interval = null;
		this.intervalInitiated = false;
		this.player = null;
		this.progressBar = null;
	}

	initInterval = () => {
		this.interval = setInterval(() => {
			this.updateAudioDetails(this.player.currentTime);
		}, 100);
		this.intervalInitiated = true;
	};

	initAudioTime = () => {
		let playerCurrentTime = this.player.currentTime;

		let currentTime = this.calculateTime(playerCurrentTime);
		this.setState({
			currentTime: currentTime,
			endTime: this.calculateTime(this.player.duration)
		});
		this.updateScrubber(playerCurrentTime);
	};

	initPlayer = () => {
		// Add resize listener for showing volume on desktop
		this.addResize();
		this.handleResize();

		// Setup correct player
		this.player = new Audio();
		this.progressBar = document.querySelector('.ProgressBar');

		// Add event for audio stopped for play button
		this.player.addEventListener('ended', this.toggleAudioPlay);
		this.player.addEventListener('loadedmetadata', this.initAudioTime);
		this.player.src = this.props.audioPath;
		this.player.load();
	};

	toggleAudioPlay = () => {
		if (!this.player) {
			return;
		}
		!this.intervalInitiated ? this.initInterval() : this.resetInterval();
		this.state.playing ? this.player.pause() : this.player.play();
		this.setState({
			playing: !this.state.playing
		});
	};

	updateAudioDetails = playerCurrentTime => {
		this.updateScrubber(playerCurrentTime);
		this.updateTime(playerCurrentTime);
	};

	updateScrubber = playerCurrentTime => {
		if (!this.player || !this.progressBar) {
			return;
		}
		if (!this.player.duration) {
			this.progressBar.value = 0;
		}
		else {
			this.progressBar.value = playerCurrentTime / this.player.duration;
		}
	};

	updateTime = playerCurrentTime => {
		this.setState({
			currentTime: this.calculateTime(playerCurrentTime)
		});
	};

	calculateTime = lengthInSeconds => {
		let minutes = Math.floor(lengthInSeconds / 60);
		let seconds = Math.floor(lengthInSeconds) - minutes * 60;
		let time =
			(minutes < 10 ? '0' + minutes : minutes) +
			':' +
			(seconds < 10 ? '0' + seconds : seconds);
		return time;
	};

	seek = event => {
		if (!this.player || !this.progressBar) {
			return;
		}
		let percent = event.nativeEvent.offsetX / this.progressBar.offsetWidth;
		this.progressBar.value = percent;
		let newTime = percent * this.player.duration;
		this.player.currentTime = newTime;
		this.updateTime(newTime);
	};

	handleResize = () => {
		this.setState({
			width: window.innerWidth
		});
	};

	resetInterval = () => {
		clearInterval(this.interval);
		this.intervalInitiated = false;
	};

	addResize = () => {
		window.addEventListener('resize', this.handleResize);
	};

	clearResize = () => {
		window.removeEventListener('resize', this.handleResize);
	};

	clearAudioEvents = () => {
		this.player.removeEventListener('loadedmetadata', this.initAudioTime);
		this.player.removeEventListener('ended', this.toggleAudioPlay);
	};

	componentDidMount = () => {
		this.initPlayer();
	};

	componentWillUnmount = () => {
		if (this.state.playing) {
			this.toggleAudioPlay();
		}
		this.clearResize();
		this.clearAudioEvents();
	};

	componentWillUpdate = nextProps => {
		let openChangedState = this.props.infoOpen !== nextProps.infoOpen;
		let markerWillChange = this.props.markerKey !== nextProps.markerKey;
		let isAudioPlaying = this.state.playing;

		// If we close info we reset and remove resize event
		if (!nextProps.infoOpen && openChangedState) {
			if (isAudioPlaying) {
				this.toggleAudioPlay();
			}
			this.clearResize();
		}
		if (markerWillChange) {
			if (isAudioPlaying) {
				this.toggleAudioPlay();
			}
		}
	};

	componentDidUpdate = prevProps => {
		let openChangedState = this.props.infoOpen !== prevProps.infoOpen;
		let markerChanged = this.props.markerKey !== prevProps.markerKey;

		// If we change marker we need to update
		if (markerChanged) {
			this.initPlayer();
		}

		// If we open same marker we need to re-add resize listener
		if (!markerChanged && openChangedState && this.props.infoOpen) {
			this.addResize();
		}
	};

	render() {
		return (
			<div
				className={`AudioPlayer ${
					this.state.width < 800 ? 'AudioPlayer--extended' : ''
				}`}
			>
				<div className="PlayerControls">
					<div className="PlayButton" onClick={this.toggleAudioPlay}>
						{this.state.playing ? (
							<ReactSVG
								className="AudioIcon"
								svgStyle={{ height: '100%', width: '100%' }}
								path={pause}
							/>
						) : (
							<ReactSVG
								className="AudioIcon"
								svgStyle={{
									height: '100%',
									left: '2px',
									position: 'relative',
									width: '100%'
								}}
								path={play}
							/>
						)}
					</div>
					<span className="CurrentTime">
						{this.state.currentTime}
					</span>
					<progress
						onClick={this.seek}
						className="ProgressBar"
						value="0"
						min="0"
						max="1"
					/>
					<span>{this.state.endTime}</span>
					{this.player && this.state.width >= 800 ? (
						<VolumeButton player={this.player} />
					) : null}
				</div>
			</div>
		);
	}
}

AudioPlayer.defaultProps = {
	//	Example defaultProps
	//	label: 'click me'
};

AudioPlayer.propTypes = {
	audioPath: PropTypes.string.isRequired,
	infoOpen: PropTypes.bool.isRequired,
	markerKey: PropTypes.string.isRequired
	//	Example PropTypes:
	//	label: PropTypes.string.isRequired,
	//	onClick: PropTypes.func,
};

export default AudioPlayer;

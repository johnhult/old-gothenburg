import React, { Component } from 'react';
import PropTypes from 'prop-types';
import ReactSVG from 'react-svg';

import CloseIcon from 'components/CloseIcon/CloseIcon.jsx';
import volume from 'img/icons/volume.svg';
import './VolumeButton.css';

class VolumeButton extends Component {
	constructor(props) {
		super(props);
		this.state = {
			progressBar: null,
			volumeOpen: false,
			width: 0
		};
	}

	openVolume = () => {
		this.setState({
			volumeOpen: true
		});
	};

	closeVolume = () => {
		this.setState({
			volumeOpen: false
		});
	};

	setVolume = event => {
		if (!this.state.progressBar) {
			return;
		}
		let percent =
			event.nativeEvent.offsetX / this.state.progressBar.offsetWidth;
		let prog = this.state.progressBar;
		prog.value = percent;
		this.setState({ progressBar: prog });
		this.props.player.volume = percent;
	};

	componentDidMount = () => {
		this.setState(
			{
				progressBar: document.querySelector('.VolumeBar')
			},
			() => {
				let prog = this.state.progressBar;
				prog.value = this.props.player.volume;
				this.setState({
					progressBar: prog
				});
			}
		);
	};

	render() {
		return (
			<div
				className={`VolumeButton ${
					this.state.volumeOpen ? 'VolumeButton--open' : ''
				}`}
			>
				<div className="VolumeButtonWrapper" onClick={this.openVolume}>
					<ReactSVG
						className="AudioVolume"
						path={volume}
						svgStyle={{ height: '100%', width: '100%' }}
					/>
				</div>
				<progress
					onClick={e => this.setVolume(e)}
					className="VolumeBar"
					value="0"
					min="0"
					max="1"
				/>
				<CloseIcon
					className="CloseVolume"
					handleClick={this.closeVolume}
				/>
			</div>
		);
	}
}

VolumeButton.defaultProps = {
	//	Example defaultProps
	//	label: 'click me'
};

VolumeButton.propTypes = {
	player: PropTypes.object.isRequired
	//	Example PropTypes:
	//	label: PropTypes.string.isRequired,
	//	onClick: PropTypes.func,
};

export default VolumeButton;

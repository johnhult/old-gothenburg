import React, { Component } from 'react';
import PropTypes from 'prop-types';

import Button from 'components/Button/Button.jsx';
import TutorialStep from 'components/TutorialStep/TutorialStep';

import './Tutorial.css';

class Tutorial extends Component {
	constructor(props) {
		super(props);
		this.state = {
			steps: {
				all: ['Welcome', 'Marker', 'Types', 'Tips', 'Position'],
				current: 0
			}
		};
	}

	goToStep = step => {
		if (
			this.state.steps.current === this.state.steps.all.length - 1 &&
			step === this.state.steps.all.length
		) {
			this.props.onDone();
		}
		else {
			this.setState(prevState => {
				return { steps: { ...prevState.steps, current: step } };
			});
		}
	};

	render() {
		let stepIndicator = this.state.steps.all.map((value, index) => {
			return (
				<div
					key={index}
					onClick={() => this.goToStep(index)}
					className={`StepIndicator ${this.state.steps.current ===
						index && 'StepIndicator--active'}`}
				/>
			);
		});
		return (
			<div className="OverlayBg">
				<div className="Tutorial">
					<TutorialStep
						currentStep={this.state.steps.current}
						language={this.props.language}
					/>
					<div className="Tutorial--lower">
						<div className="StepWrapper">{stepIndicator}</div>
						<div className="TutorialButtonWrapper">
							<Button
								className="SkipTextButton"
								label="Skip"
								handleClick={this.props.onDone}
							/>
							<Button
								label={
									this.state.steps.current ===
									this.state.steps.all.length - 1
										? 'Explore!'
										: 'Next'
								}
								handleClick={() =>
									this.goToStep(this.state.steps.current + 1)
								}
							/>
						</div>
					</div>
				</div>
			</div>
		);
	}
}

Tutorial.defaultProps = {
	//	Example defaultProps
	//	label: 'click me'
};

Tutorial.propTypes = {
	language: PropTypes.string.isRequired,
	onDone: PropTypes.func.isRequired
};

export default Tutorial;

import React, { Component } from 'react';
import PropTypes from 'prop-types';

import tut0 from 'img/tutorial/tut-0.svg';
import tut1 from 'img/tutorial/tut-1.svg';
import tut2 from 'img/tutorial/tut-2.svg';
import tut3 from 'img/tutorial/tut-3.svg';
import tut4 from 'img/tutorial/tut-4.svg';

const stepImages = [tut0, tut1, tut2, tut3, tut4];

const stepsEng = [
	{
		header: 'Welcome!',
		text:
			'Looks like you\'re new. Let\'s go through a couple of things real quick.'
	},
	{
		header: 'This is a marker.',
		text:
			'These are found on the map around Gothenburg. Clicking on these is what this experience is all	about. The secret sauce. Clicking on these will magically reveal information about the location where the marker is placed. There are also audio files for each marker.'
	},
	{
		header: 'Different markers.',
		text:
			'Some are for specific buildings, some more focused on culture, and some are general information. Markers close to each others will get grouped. The number shows how many markers are there.'
	},
	{
		header: 'Tips.',
		text:
			'We suggest using headphones for this experience.\n\nAnother tips is that you can add this website to your home screen and it will function just like an app.'
	},
	{
		header: 'Your position.',
		text:
			'In order to help you navigate, we\'ll request to use your location. Don\'t worry, we don\'t save your location in any way, only show it. Please press allow when asked for access to location.'
	}
];
const stepsSwe = [
	{
		header: 'Välkommen!',
		text: 'Verkar som att du är ny. Låt oss gå igenom lite saker snabbt.'
	},
	{
		header: 'Detta är en markör.',
		text:
			'Du hittar dessa på kartan runtom Göteborg. Att klicka på dessa är vad hela denna upplevelsen handlar om. Klickar man på dessa får man magiskt upp information om platsen där markören är placerad. Det finns också ljudfiler för varje markör.'
	},
	{
		header: 'Olika markörer.',
		text:
			'Vissa är för specifica byggnader, andra mer fokuserade på kultur och visa är generell information. Markörer nära varandra kommer grupperas. Siffran i röda cirkeln visar hur många markörer det finns där.'
	},
	{
		header: 'Tips.',
		text:
			'Vi föreslår att ni använder hörlurar.\n\nEtt annat tips är att ni kan lägga till den här hemsidan på hemskärmen så kommer det fungera precis som en app.'
	},
	{
		header: 'Din position.',
		text:
			'För att vi ska kunna hjälpa dig navigera så kommer vi att be om använda din position. Vi sparar ingen information utan det är endast för att visa var du är. Var god att tillåt sidan använda din position för bästa upplevelse.'
	}
];

class TutorialStep extends Component {
	constructor(props) {
		super(props);
		this.state = {};
	}

	render() {
		let steps = this.props.language === 'sv' ? stepsSwe : stepsEng;
		let step = steps.map((step, index) => {
			return (
				<div key={index}>
					<div className="TutorialImageWrapper u-standardMargin">
						<img
							className="Tutorial--image"
							src={stepImages[index]}
							alt="Error loading"
						/>
					</div>
					<div className="TutorialTextWrapper">
						<span className="Tutorial--header u-standardMargin">
							{step.header}
						</span>
						<span className="Tutorial--text u-standardMargin">
							{step.text}
						</span>
					</div>
				</div>
			);
		});
		return <div className="u-width100">{step[this.props.currentStep]}</div>;
	}
}

TutorialStep.defaultProps = {
	//	Example defaultProps
	//	label: 'click me'
};

TutorialStep.propTypes = {
	currentStep: PropTypes.number.isRequired
};

export default TutorialStep;

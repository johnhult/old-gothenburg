import React, { Component } from 'react';
import PropTypes from 'prop-types';
import ReactSVG from 'react-svg';


class Svg extends Component {

	constructor(props) {
		super(props);
	}

	render() {
		return (
			<ReactSVG path={this.props.src} className={this.props.className} />
		);
	}
}

Svg.propTypes = {
	path: PropTypes.string.isRequired
};

Svg.defaultProps = {
	path: ''
};

export default Svg;

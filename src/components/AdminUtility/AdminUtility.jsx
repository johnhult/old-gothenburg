import React, { Component } from 'react';
import PropTypes from 'prop-types';
import firebase from 'firebase/app';
import 'firebase/app';
import 'firebase/auth';

import Button from 'components/Button/Button.jsx';
import AddMarker from 'img/icons/add-marker.svg';
import Logout from 'img/icons/logout.svg';
import RemoveMarker from 'img/icons/remove-marker.svg';
import './AdminUtility.css';

class AdminUtility extends Component {
	constructor(props) {
		super(props);
		this.state = {};
	}

	render() {
		return (
			<div className="UtilityWrapper">
				<Button
					handleClick={() => firebase.auth().signOut()}
					type="icon"
					iconType="dark"
					imgPath={Logout}
				/>
				<Button
					className={`${
						this.props.addNewPoint ? 'IconButton--active' : ''
					}`}
					handleClick={this.props.toggleActiveNewPoint}
					type="icon"
					iconType="dark"
					imgPath={AddMarker}
				/>
				<Button
					className={`${
						this.props.removePoint ? 'IconButton--active' : ''
					}`}
					handleClick={this.props.toggleActiveRemovePoint}
					type="icon"
					iconType="dark"
					imgPath={RemoveMarker}
				/>
			</div>
		);
	}
}

AdminUtility.defaultProps = {
	//	Example defaultProps
	//	label: 'click me'
};

AdminUtility.propTypes = {
	addNewPoint: PropTypes.bool.isRequired,
	removePoint: PropTypes.bool.isRequired,
	toggleActiveNewPoint: PropTypes.func.isRequired,
	toggleActiveRemovePoint: PropTypes.func.isRequired
};

export default AdminUtility;

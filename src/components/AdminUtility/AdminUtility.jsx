import React, { Component } from 'react';
import PropTypes from 'prop-types';
import firebase from 'firebase/app';
import 'firebase/app';
import 'firebase/auth';

import Button from 'components/Button/Button.jsx';
import AddMarker from 'img/icons/add-marker.svg';
import EditMarker from 'img/icons/edit-marker.svg';
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
					active={this.props.activeButton === 'add'}
					handleClick={() => this.props.toggleActiveButton('add')}
					type="icon"
					iconType="dark"
					imgPath={AddMarker}
				/>
				<Button
					active={this.props.activeButton === 'edit'}
					handleClick={() => this.props.toggleActiveButton('edit')}
					type="icon"
					iconType="dark"
					imgPath={EditMarker}
				/>
				<Button
					active={this.props.activeButton === 'remove'}
					handleClick={() => this.props.toggleActiveButton('remove')}
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
	activeButton: PropTypes.string.isRequired,
	toggleActiveButton: PropTypes.func.isRequired
};

export default AdminUtility;

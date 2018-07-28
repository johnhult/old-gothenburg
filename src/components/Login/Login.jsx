import React, { Component } from 'react';
import firebase from 'firebase/app';
import 'firebase/app';
import 'firebase/auth';

import AdminInput from 'components/AdminInput/AdminInput.jsx';
import Button from 'components/Button/Button.jsx';
import './Login.css';

class Login extends Component {
	constructor(props) {
		super(props);
		this.state = {
			email: '',
			error: '',
			password: ''
		};
	}

	login = event => {
		event.preventDefault();
		firebase
			.auth()
			.signInWithEmailAndPassword(this.state.email, this.state.password)
			.catch(error => {
				// Handle Errors here.
				this.setState({
					error: error.message
				});
			});
	};

	handleChange = event => {
		let name = event.target.name;
		this.setState({
			[name]: event.target.value
		});
	};

	render() {
		return (
			<div>
				<h1 className="LoginHeader u-doubleMargin">Old Gothenburg</h1>
				<form className="LoginForm" onSubmit={this.login}>
					<AdminInput
						name="email"
						type="email"
						label="Email"
						handleChange={this.handleChange}
						value={this.state.email}
						showError={false}
					/>
					<AdminInput
						name="password"
						type="password"
						label="Password"
						handleChange={this.handleChange}
						value={this.state.password}
						showError={false}
					/>
					<Button
						className="u-doubleMargin"
						label="Log In"
						type="submit"
					/>
				</form>
				{this.state.error ? <span>{this.state.error}</span> : null}
			</div>
		);
	}
}

export default Login;

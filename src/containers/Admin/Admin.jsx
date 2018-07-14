// // Import FirebaseAuth and firebase.
// import React from 'react';
// import firebase from 'firebase/app';
// import 'firebase/app';
// import 'firebase/auth';

// class Admin extends React.Component {
// 	constructor(props) {
// 		super(props);
// 		// The component's Local state.
// 		this.state = {
// 			isSignedIn: false // Local signed-in state.
// 		};
// 	}

// 	// Configure FirebaseUI.
// 	uiConfig = {
// 		callbacks: {
// 			// Avoid redirects after sign-in.
// 			signInSuccessWithAuthResult: () => false
// 		},
// 		credentialHelper: 'none',
// 		// Popup signin flow rather than redirect flow.
// 		signInFlow: 'popup',
// 		// We will display Google and Facebook as auth providers.
// 		signInOptions: [firebase.auth.EmailAuthProvider.PROVIDER_ID]
// 	};

// 	// Listen to the Firebase Auth state and set the local state.
// 	componentDidMount() {
// 		this.unregisterAuthObserver = firebase
// 			.auth()
// 			.onAuthStateChanged(user => this.setState({ isSignedIn: !!user }));
// 	}

// 	// Make sure we un-register Firebase observers when the component unmounts.
// 	componentWillUnmount() {
// 		this.unregisterAuthObserver();
// 	}

// 	render() {
// 		if (!this.state.isSignedIn) {
// 			return (
// 				<div>
// 					<h1>Old Gothenburg</h1>
// 					<p>Please sign-in:</p>
// 					<div
// 						uiConfig={this.uiConfig}
// 						firebaseAuth={firebase.auth()}
// 					/>
// 				</div>
// 			);
// 		}
// 		return (
// 			<div>
// 				<h1>My App</h1>
// 				<p>
// 					Welcome {firebase.auth().currentUser.displayName}! You are
// 					now signed-in!
// 				</p>
// 				<a onClick={() => firebase.auth().signOut()}>Sign-out</a>
// 			</div>
// 		);
// 	}
// }

// export default Admin;

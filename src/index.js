import React from 'react';
import ReactDOM from 'react-dom';
import {
	BrowserRouter as Router,
	Route,
	Switch,
	browserHistory
} from 'react-router-dom';
import firebase from 'firebase/app';
import 'firebase/app';

import Admin from 'containers/Admin/Admin.jsx';
import Home from 'containers/Home/Home.jsx';
import 'index.css';
import 'style-extra/util.css';

// Initialize Firebase
let config = {
	apiKey: '',
	authDomain: 'old-gothenburg.firebaseapp.com',
	databaseURL: 'https://old-gothenburg.firebaseio.com',
	projectId: 'old-gothenburg',
	storageBucket: 'old-gothenburg.appspot.com'
};
let gMapsApi = '';
firebase.initializeApp(config);

// Here you can add global headers and footers that will stay the same over different pages
const App = () => (
	<div>
		<Main />
	</div>
);

// Add other routes inside Switch to change pages here
const Main = () => (
	<main>
		<Switch>
			<Route
				exact
				path="/"
				component={() => <Home apiKey={gMapsApi} />}
			/>
			<Route
				exact
				path="/addNewPoints"
				component={() => <Admin apiKey={gMapsApi} />}
			/>
		</Switch>
	</main>
);

ReactDOM.render(
	<Router history={browserHistory}>
		<App />
	</Router>,
	document.getElementById('root')
);

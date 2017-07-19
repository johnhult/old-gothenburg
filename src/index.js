import React from 'react';
import ReactDOM from 'react-dom';
import 'index.css';
import {
	BrowserRouter as Router,
	Route,
	Switch,
	browserHistory
} from 'react-router-dom';
import Home from 'containers/Home/Home';



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
			<Route exact path="/" component={Home} />
		</Switch>
	</main>
);

ReactDOM.render((
	<Router history={browserHistory}>
		<App />
	</Router>
), document.getElementById('root')
);

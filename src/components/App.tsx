import React from 'react';
import {BrowserRouter, Route, Switch, Redirect} from 'react-router-dom';
import ContactInfo from './pages/ContactInfo';
import ShippingAddress from './pages/ShippingAddress';

export default function CheckoutApp() {
	return (
		<BrowserRouter>
			<Switch>
				<Route path="/info">
					<ContactInfo/>
				</Route>
				<Route path="/shipping-address">
					<ShippingAddress/>
				</Route>
				<Route path="/">
					<Redirect to="/info"/>
				</Route>
			</Switch>
		</BrowserRouter>
	);
}
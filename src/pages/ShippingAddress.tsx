import React from 'react';
import {Link} from 'react-router-dom';

export default function ShippingAddress() {
	return (
		<div>
			<h1>Shipping address</h1>
			<Link to={'/'}>Go to contact info</Link>
		</div>
	);
}
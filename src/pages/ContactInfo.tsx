import React from 'react';
import {Link} from 'react-router-dom';

export default function ContactInfo() {
	return (
		<div>
			<h1>Contact information</h1>
			<Link to={'/shipping-address'}>Go to shipping address</Link>
		</div>
	);
}
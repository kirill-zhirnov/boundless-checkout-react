import React from 'react';
import {Link} from 'react-router-dom';
import CheckoutLayout from '../layout/CheckoutLayout';

export default function ShippingAddressPage() {
	return (
		<CheckoutLayout>
			<h1>Shipping address</h1>
			<Link to={'/'}>Go to contact info</Link>
		</CheckoutLayout>
	);
}
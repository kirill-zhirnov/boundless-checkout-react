import React, {useState} from 'react';
import BoundlessCheckout from './BoundlessCheckout';
import {BoundlessClient} from 'boundless-api-client';

export default function DevApp() {
	const [show, setShow] = useState(false);
	const api = new BoundlessClient();

	return (
		<div>
			<button onClick={() => setShow(true)}>Show checkout</button>
			<BoundlessCheckout cartId={''} show={show} onHide={() => setShow(false)} api={api} />
		</div>
	);
}
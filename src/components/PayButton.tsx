import React, {useContext, useState} from 'react';
import {Button} from '@mui/material';
import PaymentIcon from '@mui/icons-material/Payment';
import {ApiContext} from '../BoundlessOrderInfo';

export default function PayButton({orderId, onError}: {orderId: string, onError?: (err: any) => void}) {
	const api = useContext(ApiContext);
	const [submitting, setSubmitting] = useState(false);

	const handlePayClick = () => {
		if (!api) return;

		setSubmitting(true);
		api.customerOrder.makePaymentLink({order_id: orderId})
			.then(({url}) => {
				console.log('Payment url', url);
				window.location.href = url;
			})
			.catch(err => {
				console.error(err);

				if (onError) {
					onError(err);
				}	else throw err;
			})
			.finally(() => setSubmitting(false));
	};

	return (
		<p className='bdl-order-summary__pay-now'>
			<Button
				color='primary'
				disabled={submitting}
				onClick={handlePayClick}
				size='large'
				startIcon={<PaymentIcon />}
				variant='contained'
			>
				Pay now
			</Button>
		</p>
	);
}
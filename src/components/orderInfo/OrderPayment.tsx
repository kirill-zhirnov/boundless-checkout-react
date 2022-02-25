import {Grid} from '@mui/material';
import React from 'react';
import {IPaymentMethod} from 'boundless-api-client';
import {formatMoney} from '../../lib/formatter';
import {IOrderTotal} from '../../lib/calculator';
import PaymentsIcon from '@mui/icons-material/Payments';
import currency from 'currency.js';

export default function OrderPayment({paymentMethod, total}: {paymentMethod: IPaymentMethod, total: IOrderTotal}) {
	if (!paymentMethod) return null;

	const hasMarkUp = Boolean(currency(paymentMethod.mark_up).value);

	return (
		<div className='bdl-order-items__service-row'>
			<h5 className='bdl-order-items__service-heading'>
				<PaymentsIcon className='bdl-order-items__service-ico' fontSize='small' />
				Payment Method
			</h5>
			<Grid container>
				<Grid item sm={8} xs={12} className='bdl-order-items__service-cell bdl-order-items__service-cell_title'>
					{paymentMethod.title || ''}
				</Grid>
				<Grid item sm={2} xs={12} className='bdl-order-items__service-cell'>
					{hasMarkUp && <>
						<span className='bdl-order-items__label'>MarkUp: </span>
						{paymentMethod.mark_up}%
					</>}
				</Grid>
				<Grid item sm={2} xs={12} className='bdl-order-items__service-cell'>
					{hasMarkUp && <>
						<span className='bdl-order-items__label'>Total: </span>
						{formatMoney(total.payment_markup || '')}
					</>}
				</Grid>
			</Grid>
		</div>
	);
}
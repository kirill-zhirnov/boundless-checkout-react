import {Grid} from '@mui/material';
import React from 'react';
import {IDetailedOrder} from 'boundless-api-client';
import PaymentsIcon from '@mui/icons-material/Payments';
import useFormatCurrency from '../../hooks/useFormatCurrency';

export default function OrderPayment({order}: {order: IDetailedOrder}) {
	const paymentMethod = order.paymentMethod;
	const {formatCurrency} = useFormatCurrency();

	if (!paymentMethod) return null;

	const hasMarkUp = (order.payment_mark_up && Number(order.payment_mark_up) > 0);

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
						{formatCurrency(order.payment_mark_up!)}
					</>}
				</Grid>
			</Grid>
		</div>
	);
}
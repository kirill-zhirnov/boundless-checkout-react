import {Grid} from '@mui/material';
import React from 'react';
import useFormatCurrency from '../../hooks/useFormatCurrency';

export default function OrderTotalRow({price, qty, isSubTotal}: {price: string|number, qty: string|number, isSubTotal?: boolean}) {
	const {formatCurrency} = useFormatCurrency();

	return (
		<Grid container className='bdl-order-items__total-row'>
			<Grid item sm={8} xs={12} className='bdl-order-items__total-cell bdl-order-items__total-cell_title'>
				{isSubTotal ? 'Subtotal:' : 'Total:'}
			</Grid>
			<Grid item sm={2} xs={12} className='bdl-order-items__total-cell'>
				<span className='bdl-order-items__label'>Qty: </span>
				<span className='bdl-order-items__value'>{qty}</span>
			</Grid>
			<Grid item sm={2} xs={12} className='bdl-order-items__total-cell'>
				<span className='bdl-order-items__label'>Price: </span>
				<span className='bdl-order-items__value'>{formatCurrency(price)}</span>
			</Grid>
		</Grid>
	);
}
import {Grid} from '@mui/material';
import React from 'react';
import {IOrderTotal} from '../../lib/calculator';
import {formatMoney} from '../../lib/formatter';

export default function OrderTotalRow({total, isSubTotal}: {total: IOrderTotal, isSubTotal?: boolean}) {
	const price = isSubTotal ? total?.subtotal_price || '' : total.total_price || '';

	return (
		<Grid container className='bdl-order-items__total-row'>
			<Grid item sm={8} xs={12} className='bdl-order-items__total-cell bdl-order-items__total-cell_title'>
				{isSubTotal ? 'Subtotal:' : 'Total:'}
			</Grid>
			<Grid item sm={2} xs={12} className='bdl-order-items__total-cell'>
				<span className='bdl-order-items__label'>Qty: </span>
				<span className='bdl-order-items__value'>{total?.total_qty || 0}</span>
			</Grid>
			<Grid item sm={2} xs={12} className='bdl-order-items__total-cell'>
				<span className='bdl-order-items__label'>Price: </span>
				<span className='bdl-order-items__value'>{formatMoney(price)}</span>
			</Grid>
		</Grid>
	);
}
import {Grid} from '@mui/material';
import {IOrderDiscount} from 'boundless-api-client';
import React from 'react';
import {IOrderTotal} from '../../lib/calculator';
import {formatMoney} from '../../lib/formatter';

export default function OrderDiscounts({discounts, total}: {discounts: IOrderDiscount[], total: IOrderTotal}) {
	return (
		<div className='bdl-order-discounts'>
			<Grid container>
				<Grid item md={8} sm={12} className='bdl-order-items__total-cell bdl-order-items__total-cell_title'>
					{discounts.map(discount => (
						<div key={discount.discount_id}>{discount.title}</div>
					))}
				</Grid>
				<Grid item md={2} sm={12} className='bdl-order-items__total-cell'>
				</Grid>
				<Grid item md={2} sm={12} className='bdl-order-items__total-cell'>
					<span className='bdl-order-items__label'>Total discount: </span>
					{formatMoney(total?.discount_for_order || '')}
				</Grid>
			</Grid>
		</div>
	);
}
import {Grid} from '@mui/material';
import {IDetailedOrder} from 'boundless-api-client';
import React, {useMemo} from 'react';
import {calcOrderTotal} from '../../lib/calculator';
import {formatMoney} from '../../lib/formatter';
import OrderDiscounts from './OrderDiscounts';
import OrderRow from './OrderRow';
import OrderShipping from './OrderShipping';

export default function OrderItems({order}: {order: IDetailedOrder}) {
	const {items} = order;
	const total = useMemo(() => calcOrderTotal(order), [order]);

	console.log(total);

	return (
		<>
			<div className='bdl-order-items'>
				<Grid container className='bdl-order-items__thead'>
					<Grid item md={6} className='bdl-order-items__thead-cell'></Grid>
					<Grid item md={2} className='bdl-order-items__thead-cell'>Price</Grid>
					<Grid item md={2} className='bdl-order-items__thead-cell'>Qty</Grid>
					<Grid item md={2} className='bdl-order-items__thead-cell'>Total</Grid>
				</Grid>
				{items.map(item => (
					<OrderRow item={item} key={item.item_id} />
				))}
				<Grid container className='bdl-order-items__total-row'>
					<Grid item md={8} sm={12} className='bdl-order-items__total-cell bdl-order-items__total-cell_title'>
						Items Subtotal:
					</Grid>
					<Grid item md={2} sm={12} className='bdl-order-items__total-cell'>
						<span className='bdl-order-items__label'>Qty: </span>
						{total?.total_qty || 0}
					</Grid>
					<Grid item md={2} sm={12} className='bdl-order-items__total-cell'>
						<span className='bdl-order-items__label'>Price: </span>
						{formatMoney(total?.subtotal_price || '')}
					</Grid>
				</Grid>
				<OrderDiscounts discounts={order.discounts} total={total!}/>
				<OrderShipping services={order.services}/>
			</div>
		</>
	);
}
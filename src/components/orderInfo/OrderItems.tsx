import {Grid} from '@mui/material';
import {IDetailedOrder} from 'boundless-api-client';
import React, {useMemo} from 'react';
// import {calcOrderTotal} from '../../lib/calculator';
import OrderDiscounts from './OrderDiscounts';
import OrderPayment from './OrderPayment';
import OrderRow from './OrderRow';
import OrderShipping from './OrderShipping';
import OrderTotalRow from './OrderTotalRow';

export default function OrderItems({order}: {order: IDetailedOrder}) {
	const {items} = order;
	// const total = useMemo(() => calcOrderTotal(order), [order]);
	const showSubtotal = order.services?.length || order.discounts.length || order.paymentMethod;

	return (
		<>
			<div className='bdl-order-items'>
				<Grid container className='bdl-order-items__thead'>
					<Grid item sm={6} xs={12} className='bdl-order-items__thead-cell'></Grid>
					<Grid item sm={2} xs={12} className='bdl-order-items__thead-cell'>Price</Grid>
					<Grid item sm={2} xs={12} className='bdl-order-items__thead-cell'>Qty</Grid>
					<Grid item sm={2} xs={12} className='bdl-order-items__thead-cell'>Total</Grid>
				</Grid>
				{items.map(item => (
					<OrderRow item={item} key={item.item_id} />
				))}
				{/*{showSubtotal && <OrderTotalRow total={total!} isSubTotal />}*/}
				{/*<OrderDiscounts discounts={order.discounts} total={total!} />*/}
				<OrderShipping services={order.services} customer={order.customer}/>
				{/*{order.paymentMethod && <OrderPayment paymentMethod={order.paymentMethod} total={total!} />}*/}
				{/*<OrderTotalRow total={total!} />*/}
			</div>
		</>
	);
}
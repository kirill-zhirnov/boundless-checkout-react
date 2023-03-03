import {Grid} from '@mui/material';
import {IDetailedOrder} from 'boundless-api-client';
import React, {useMemo} from 'react';
import OrderDiscounts from './OrderDiscounts';
import OrderPayment from './OrderPayment';
import OrderRow from './OrderRow';
import OrderShipping from './OrderShipping';
import OrderTotalRow from './OrderTotalRow';
import currency from 'currency.js';
import OrderTaxes from './OrderTaxes';

export default function OrderItems({order}: {order: IDetailedOrder}) {
	const {items, total_price} = order;
	const hasTaxes = order.tax_amount !== null;
	const showSubtotal = order.services?.length || order.discounts.length || order.paymentMethod || hasTaxes;

	const itemsSubTotal = useMemo(() => {
		let totalQty = 0, totalPrice = '0';
		items.forEach(({qty, total_price}) => {
			totalQty += qty;
			totalPrice = currency(total_price || 0).add(totalPrice).toString();
		});
		return {totalQty, totalPrice};
	}, [items]);

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
				{showSubtotal &&
				<OrderTotalRow price={itemsSubTotal.totalPrice} qty={itemsSubTotal.totalQty} isSubTotal />}
				<OrderDiscounts order={order} />
				<OrderShipping services={order.services} customer={order.customer}/>
				{order.paymentMethod && <OrderPayment order={order} />}
				{hasTaxes && <OrderTaxes order={order} />}
				{total_price && <OrderTotalRow price={total_price} qty={itemsSubTotal.totalQty} />}
			</div>
		</>
	);
}
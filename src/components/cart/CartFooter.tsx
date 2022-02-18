import {IOrder} from 'boundless-api-client';
import React from 'react';
import {IOrderTotal} from '../../lib/calculator';
import {formatMoney} from '../../lib/formatter';
import currency from 'currency.js';
import clsx from 'clsx';

export default function CartFooter({total, order, open}: CartFooterProps) {
	const hasDiscount = total?.discount_for_order && currency(total?.discount_for_order).value > 0;
	const hasShipping = order?.service_total_price && currency(order?.service_total_price).value > 0;

	if (!order) return null;

	return (
		<div className={clsx('bdl-cart__footer', {open})}>
			{hasShipping || hasDiscount && <div className='bdl-cart__footer-row'>
				<h5 className='bdl-cart__footer-title'>Subtotal:
					<span className='bdl-cart__footer-value'> {formatMoney(total?.subtotal_price || 0)}</span>
				</h5>
			</div>}
			{hasDiscount && <div className="bdl-cart__footer-row">
				<h5 className='bdl-cart__footer-title'>
					Discount by coupons:
					<span className='bdl-cart__footer-value'> -{formatMoney(total?.discount_for_order || 0)}</span>
				</h5>
			</div>}
			{hasShipping && <div className="bdl-cart__footer-row" >
				<h5 className='bdl-cart__footer-title'>Shipping:
					<span className='bdl-cart__footer-value'> {formatMoney(order?.service_total_price || 0)}</span>
				</h5>
			</div>}

			<h4 className="bdl-cart__footer-row bdl-cart__footer-row_total">
				Total: <span className='bdl-cart__footer-value'>{formatMoney(total?.total_price || 0)}</span>
			</h4>
		</div>
	);
}

interface CartFooterProps {
	total: IOrderTotal | null;
	order?: IOrder;
	open: boolean;
}
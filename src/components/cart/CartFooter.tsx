import {IOrder, IOrderDiscount, TDiscountType} from 'boundless-api-client';
import React, {useState} from 'react';
import {IOrderTotal} from '../../lib/calculator';
import {formatMoney} from '../../lib/formatter';
import currency from 'currency.js';
import clsx from 'clsx';
import {useAppDispatch, useAppSelector} from '../../hooks/redux';
import {addPromise} from '../../redux/actions/xhr';

export default function CartFooter({total, order, open, discounts, setDiscounts}: CartFooterProps) {
	const dispatch = useAppDispatch();
	const api = useAppSelector(state => state.app.api);
	const orderId = useAppSelector(state => state.app.order?.id);
	const [submitting, setSubmitting] = useState(false);
	const hasDiscount = total?.discount_for_order && currency(total?.discount_for_order).value > 0;
	const hasShipping = order?.service_total_price && currency(order?.service_total_price).value > 0;

	const getDiscountAmount = () => {
		if (!discounts || !discounts.length) return '';
		if (discounts[0].discount_type === TDiscountType.percent) return ` (${discounts[0].value}%)`;

		return '';
	};

	const handleRmDiscount = (e: React.MouseEvent) => {
		e.preventDefault();
		if (!window.confirm('Are you sure?') || !api || !orderId || submitting) return;

		setSubmitting(true);

		const promise = api.checkout.clearDiscounts(orderId)
			.then(() => {
				setDiscounts([]);
			})
			.catch((err) => console.error(err))
			.finally(() => setSubmitting(false));

		dispatch(addPromise(promise));
	};

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
					Сoupon{getDiscountAmount()}:
					<span className='bdl-cart__footer-value'> -{formatMoney(total?.discount_for_order || 0)}
					</span>
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

			{hasDiscount && <div className='bdl-cart__footer-rm'>
				<small>
					<a href="#" className='bdl-cart__footer-rm-link' onClick={handleRmDiscount}>
						Remove coupon
					</a>
				</small>
			</div>}
		</div>
	);
}

interface CartFooterProps {
	total: IOrderTotal | null;
	order?: IOrder;
	open: boolean;
	discounts: IOrderDiscount[],
	setDiscounts: React.Dispatch<React.SetStateAction<IOrderDiscount[]>>
}
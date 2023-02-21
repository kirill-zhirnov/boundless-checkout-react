import {TDiscountType} from 'boundless-api-client';
import React, {useState} from 'react';
import {formatMoney} from '../../lib/formatter';
import clsx from 'clsx';
import {useAppDispatch, useAppSelector} from '../../hooks/redux';
import {addPromise} from '../../redux/actions/xhr';
import {setOrder} from '../../redux/reducers/app';

export default function CartFooter({open}: ICartFooterProps) {
	const dispatch = useAppDispatch();
	const api = useAppSelector(state => state.app.api);
	const order = useAppSelector(state => state.app.order);
	const total = useAppSelector(state => state.app.total);
	const taxSettings = useAppSelector(state => state.app.taxSettings);
	const [submitting, setSubmitting] = useState(false);

	const getDiscountAmount = () => {
		if (!order?.discounts || !order?.discounts.length) return '';
		const discount = order.discounts[0];
		if (discount.discount_type === TDiscountType.percent) return ` (${discount.value}%)`;

		return '';
	};

	const handleRmDiscount = (e: React.MouseEvent) => {
		e.preventDefault();
		if (!window.confirm('Are you sure?') || !api || !order?.id || submitting) return;

		setSubmitting(true);

		const promise = api.checkout.clearDiscounts(order.id)
			.then(({order}) => {
				if (order) dispatch(setOrder(order));
			})
			.catch((err) => console.error(err))
			.finally(() => setSubmitting(false));

		dispatch(addPromise(promise));
	};

	if (!order || !total) return null;

	const hasDiscount = total.discount != '0';
	const hasShipping = total.servicesSubTotal.price != '0';
	const hasTax = taxSettings?.turnedOn && Number(total.tax.totalTaxAmount) > 0;

	return (
		<div className={clsx('bdl-cart__footer', {open})}>
			{(hasShipping || hasDiscount || hasTax) && <div className='bdl-cart__footer-row'>
				<h5 className='bdl-cart__footer-title'>Subtotal:
					<span className='bdl-cart__footer-value'> {formatMoney(total.itemsSubTotal.price)}</span>
				</h5>
			</div>}
			{hasDiscount && <div className="bdl-cart__footer-row">
				<h5 className='bdl-cart__footer-title'>
					Сoupon{getDiscountAmount()}:
					<span className='bdl-cart__footer-value'> -{formatMoney(total.discount)}</span>
				</h5>
			</div>}
			{hasShipping && <div className="bdl-cart__footer-row" >
				<h5 className='bdl-cart__footer-title'>Shipping:
					<span className='bdl-cart__footer-value'> {formatMoney(total.servicesSubTotal.price)}</span>
				</h5>
			</div>}

			{hasTax && <div className="bdl-cart__footer-row" >
				<h5 className='bdl-cart__footer-title'>{taxSettings?.taxTitle}:
					<span className='bdl-cart__footer-value'> {formatMoney(total.tax.totalTaxAmount)}</span>
				</h5>
			</div>}
			<h4 className="bdl-cart__footer-row bdl-cart__footer-row_total">
				Total: <span className='bdl-cart__footer-value'>{formatMoney(total.price)}</span>
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

interface ICartFooterProps {
	open: boolean;
}
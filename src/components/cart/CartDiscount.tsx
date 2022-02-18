import React, {useState} from 'react';
import {IOrderDiscount} from 'boundless-api-client';
import CartDiscountForm from './CartDiscountForm';
import {useAppDispatch, useAppSelector} from '../../hooks/redux';
import {RootState} from '../../redux/store';
import {addPromise} from '../../redux/actions/xhr';
import clsx from 'clsx';

export default function CartDiscount({discounts, setDiscounts}: CartDiscountProps) {
	const dispatch = useAppDispatch();
	const api = useAppSelector((state: RootState) => state.app.api);
	const orderId = useAppSelector((state: RootState) => state.app.order?.id);
	const hasCouponCampaigns = useAppSelector((state: RootState) => state.app.hasCouponCampaigns);
	const [submitting, setSubmitting] = useState(false);

	const hasDisounts = discounts?.length > 0;

	const handleRm = (e: React.MouseEvent) => {
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

	if (!hasDisounts && !hasCouponCampaigns) return null;

	return (
		<div className='bdl-cart__discount'>
			{hasDisounts
				? <ul className='bdl-cart__discount-list'>
					{discounts.map((discount) => (
						<li className='bdl-cart__discount-item' key={discount.discount_id}>
							<div>{discount.title}</div>
							<a
								href='#'
								className={clsx('bdl-cart__discount-rm-link', {disabled: submitting})}
								onClick={handleRm}
							><small>Remove coupon</small></a>
						</li>
					))}
				</ul>
				: <CartDiscountForm setDiscounts={setDiscounts} />}
		</div>
	);
}

interface CartDiscountProps {
	discounts: IOrderDiscount[],
	setDiscounts: React.Dispatch<React.SetStateAction<IOrderDiscount[]>>
}
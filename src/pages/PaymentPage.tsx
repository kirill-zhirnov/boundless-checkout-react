import React, {useEffect, useState} from 'react';
import CheckoutLayout from '../layout/CheckoutLayout';
import {useAppDispatch, useAppSelector} from '../hooks/redux';
import {addPromise} from '../redux/actions/xhr';
import {ICheckoutPaymentPageData} from 'boundless-api-client';
import PaymentMethodForm from '../components/PaymentMethodForm';

export default function PaymentPage() {
	const [paymentPage, setPaymentPage] = useState<null|ICheckoutPaymentPageData>(null);
	const {api, order} = useAppSelector(state => state.app);
	const dispatch = useAppDispatch();

	useEffect(() => {
		const promise = api!.checkout.getPaymentPage(order!.id)
			.then((data) => setPaymentPage(data))
		;
		dispatch(addPromise(promise));
	}, []);

	return (
		<CheckoutLayout>
			{paymentPage
			? <PaymentMethodForm paymentMethods={paymentPage.paymentMethods} />
			: <div>Some loading</div>
			}
		</CheckoutLayout>
	);
}
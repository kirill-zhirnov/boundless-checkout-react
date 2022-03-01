import React, {useEffect, useState} from 'react';
import CheckoutLayout from '../layout/CheckoutLayout';
import {useAppDispatch, useAppSelector} from '../hooks/redux';
import {addPromise} from '../redux/actions/xhr';
import {ICheckoutPaymentPageData} from 'boundless-api-client';
import PaymentMethodForm from '../components/PaymentMethodForm';
import useInitCheckoutByCart from '../hooks/initCheckout';
import Loading from '../components/Loading';

export default function PaymentPage() {
	const {isInited} = useInitCheckoutByCart();
	const [paymentPage, setPaymentPage] = useState<null|ICheckoutPaymentPageData>(null);
	const [loading, setLoading] = useState(false);
	const {api, order} = useAppSelector(state => state.app);
	const dispatch = useAppDispatch();

	useEffect(() => {
		if (api && order) {
			setLoading(true);
			const promise = api.checkout.getPaymentPage(order.id)
				.then((data) => setPaymentPage(data))
				.finally(() => setLoading(false))
			;
			dispatch(addPromise(promise));
		}
	}, [api, order]);//eslint-disable-line

	if (!isInited) {
		return <Loading />;
	}

	if (loading || !paymentPage) return (
		<CheckoutLayout>
			<Loading />
		</CheckoutLayout>
	);

	return (
		<CheckoutLayout>
			<PaymentMethodForm paymentMethods={paymentPage.paymentMethods}
												 countries={paymentPage.countries}
												 requiredBillingAddress={paymentPage.requiredBillingAddress}
			/>
		</CheckoutLayout>
	);
}
import React, {useEffect, useState} from 'react';
import CheckoutLayout from '../layout/CheckoutLayout';
import {useAppDispatch, useAppSelector} from '../hooks/redux';
import {addPromise} from '../redux/actions/xhr';
import {ICheckoutPaymentPageData} from 'boundless-api-client';
import useInitCheckoutByCart from '../hooks/initCheckout';
import Loading from '../components/Loading';
import PaymentMethodForm from './paymentPage/PaymentMethodForm';
import {useTranslation} from 'react-i18next';

export default function PaymentPage() {
	const {isInited, paymentPage} = useInitPaymentPage();
	const {t} = useTranslation();

	useEffect(() => {
		document.title = t('paymentMethodForm.pageTitle');
	}, []);

	if (!isInited) {
		return <Loading />;
	}

	return (
		<CheckoutLayout>
			{paymentPage ? <PaymentMethodForm paymentPage={paymentPage} /> : <Loading />}
		</CheckoutLayout>
	);
}

const useInitPaymentPage = () => {
	const {isInited} = useInitCheckoutByCart();
	const {api, order} = useAppSelector(state => state.app);
	const dispatch = useAppDispatch();
	const [paymentPage, setPaymentPage] = useState<null|ICheckoutPaymentPageData>(null);

	useEffect(() => {
		if (isInited && api && order && !paymentPage) {
			const promise = api.checkout.getPaymentPage(order.id)
				.then((data) => setPaymentPage(data))
			;
			dispatch(addPromise(promise));
		}
	}, [isInited, api, order, dispatch]);//eslint-disable-line

	return {
		isInited,
		paymentPage
	};
};
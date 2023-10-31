import React, {useEffect, useState} from 'react';
import CheckoutLayout from '../layout/CheckoutLayout';
import useInitCheckoutByCart from '../hooks/initCheckout';
import Loading from '../components/Loading';
import {useAppDispatch, useAppSelector} from '../hooks/redux';
import {ICheckoutShippingPageData} from 'boundless-api-client';
import {addPromise} from '../redux/actions/xhr';
import ShippingForm from './shippingPage/ShippingForm';
import {useTranslation} from 'react-i18next';

export default function ShippingPage() {
	const {isInited, shippingPage} = useInitShippingPage();
	const {t} = useTranslation();

	useEffect(() => {
		document.title = t('shippingForm.pageTitle');
	}, []);//eslint-disable-line

	if (!isInited) {
		return <Loading />;
	}

	return (
		<CheckoutLayout>
			{shippingPage ? <ShippingForm shippingPage={shippingPage} /> : <Loading />}
		</CheckoutLayout>
	);
}

const useInitShippingPage = () => {
	const {isInited} = useInitCheckoutByCart();
	const [shippingPage, setShippingPage] = useState<null | ICheckoutShippingPageData>(null);
	const {api, order} = useAppSelector(state => state.app);
	const dispatch = useAppDispatch();

	useEffect(() => {
		if (api && order && !shippingPage) {
			const promise = api.checkout.getShippingPage(order.id)
				.then((data) => setShippingPage(data))
			;
			dispatch(addPromise(promise));
		}
	}, [api, order]);//eslint-disable-line

	return {
		isInited,
		shippingPage
	};
};

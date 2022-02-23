import React from 'react';
import {Route, Routes} from 'react-router-dom';
import ContactInfoPage from './pages/ContactInfoPage';
import ShippingAddressPage from './pages/ShippingAddressPage';
import {useAppSelector} from './hooks/redux';
import PaymentPage from './pages/PaymentPage';
import {TCheckoutStep} from 'boundless-api-client';
import PayPalReturnPage from './pages/PayPalReturnPage';
import ErrorPage from './pages/ErrorPage';
import IndexPage from './pages/IndexPage';

export default function CheckoutApp() {
	const {globalError} = useAppSelector((state) => state.app);

	if (globalError) {
		return <ErrorPage error={globalError} />;
	}

	return (
		<Routes>
			<Route path="/info" element={<ContactInfoPage/>}/>
			<Route path="/shipping-address" element={<ShippingAddressPage/>} />
			<Route path="/shipping-method" element={<div>choose shipping method</div>} />
			<Route path="/payment" element={<PaymentPage />} />
			<Route path="/paypal/return" element={<PayPalReturnPage isCancelPage={false}/>} />
			<Route path="/paypal/cancel" element={<PayPalReturnPage isCancelPage={true}/>} />
			<Route path="/" element={<IndexPage />} />
		</Routes>
	);
}

export const getPathByStep = (step: TCheckoutStep) => {
	switch (step) {
		case TCheckoutStep.contactInfo:
			return '/info';
		case TCheckoutStep.shippingAddress:
			return '/shipping-address';
		case TCheckoutStep.shippingMethod:
			return '/shipping-method';
		case TCheckoutStep.paymentMethod:
			return '/payment';
	}
};
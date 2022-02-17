import React, {useEffect} from 'react';
import {Navigate, Route, Routes} from 'react-router-dom';
import ContactInfoPage from './pages/ContactInfoPage';
import ShippingAddressPage from './pages/ShippingAddressPage';
import {useAppSelector} from './hooks/redux';
import Loading from './components/Loading';
import useLoadingLine from './hooks/loadingLine';
import PaymentPage from './pages/PaymentPage';
import ThankYouPage from './pages/ThankYouPage';
import {TCheckoutStep} from 'boundless-api-client';

export default function CheckoutApp() {
	const {isInited, stepper} = useAppSelector((state) => state.app);
	useLoadingLine();

	useEffect(() => {
		if (isInited) {
			//need redirect if url not presented or navigate in '*' route?

			// switch () {
			//
			// }
		}
	}, [stepper?.currentStep, isInited]);

	if (!isInited) {
		return <Loading />;
	}

	return (
		<Routes>
			<Route path="/info" element={<ContactInfoPage/>}/>
			<Route path="/shipping-address" element={<ShippingAddressPage/>} />
			<Route path="/shipping-method" element={<div>choose shipping method</div>} />
			<Route path="/payment" element={<PaymentPage />} />
			<Route path="/thank-you" element={<ThankYouPage />} />
			<Route path="*" element={<Navigate to={'/info'} />} />
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
		case TCheckoutStep.thankYou:
			return '/thank-you';
	}
};
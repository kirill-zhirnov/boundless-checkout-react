import React from 'react';
import {Route, Routes} from 'react-router-dom';
import ContactInfoPage from './pages/ContactInfoPage';
import ShippingPage from './pages/ShippingPage';
import {useAppSelector} from './hooks/redux';
import PaymentPage from './pages/PaymentPage';
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
			<Route path="/shipping-address" element={<ShippingPage/>} />
			{/*<Route path="/shipping-method" element={<div>choose shipping method</div>} />*/}
			<Route path="/payment" element={<PaymentPage />} />
			<Route path="/paypal/return" element={<PayPalReturnPage isCancelPage={false}/>} />
			<Route path="/paypal/cancel" element={<PayPalReturnPage isCancelPage={true}/>} />
			<Route path="/" element={<IndexPage />} />
		</Routes>
	);
}
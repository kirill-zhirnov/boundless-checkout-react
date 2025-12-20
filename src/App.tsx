import React from 'react';
import {Route, Routes} from 'react-router';
import ContactInfoPage from './pages/ContactInfoPage';
import ShippingPage from './pages/ShippingPage';
import {useAppSelector} from './hooks/redux';
import PaymentPage from './pages/PaymentPage';
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
			<Route path="/payment" element={<PaymentPage />} />
			<Route path="/" element={<IndexPage />} />
			<Route path="*" element={<ErrorPage error={'Page not found'} />} />
		</Routes>
	);
}
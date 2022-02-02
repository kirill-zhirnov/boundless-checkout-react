import React from 'react';
import {Navigate, Route, Routes} from 'react-router-dom';
import ContactInfoPage from './pages/ContactInfoPage';
import ShippingAddress from './pages/ShippingAddress';
import {useAppSelector} from './hooks/redux';
import Loading from './components/Loading';

export default function CheckoutApp() {
	const {onHide, isInited} = useAppSelector((state) => state.app);
	const onCloseClicked = () => {
		if (onHide) {
			onHide();
		}
	};

	if (!isInited) {
		return <Loading />;
	}

	return (
		<Routes>
			<Route path="/info" element={<ContactInfoPage/>}/>
			<Route path="/shipping-address" element={<div>
				<ShippingAddress/>
				<br/><br/>
				<button onClick={onCloseClicked}>Close</button>
			</div>
			} />
			<Route path="*" element={<Navigate to={'/info'} />} />
		</Routes>
	);
}
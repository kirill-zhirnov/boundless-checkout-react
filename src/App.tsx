import React, {useEffect} from 'react';
import {Navigate, Route, Routes} from 'react-router-dom';
import ContactInfoPage from './pages/ContactInfoPage';
import ShippingAddress from './pages/ShippingAddress';
import {useAppSelector} from './hooks/redux';
import Loading from './components/Loading';
import useLoadingLine from './hooks/loadingLine';

export default function CheckoutApp() {
	const {onHide, isInited, stepper} = useAppSelector((state) => state.app);
	useLoadingLine();

	useEffect(() => {
		if (isInited) {
			//need redirect if url not presented or navigate in '*' route?

			// switch () {
			//
			// }
		}
	}, [stepper?.currentStep, isInited]);

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
			<Route path="/shipping-address" element={<div>
				Payment coming soon
			</div>
			} />
			<Route path="*" element={<Navigate to={'/info'} />} />
		</Routes>
	);
}
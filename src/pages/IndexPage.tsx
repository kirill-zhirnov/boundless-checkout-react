import React, {useEffect} from 'react';
import useInitCheckoutByCart from '../hooks/initCheckout';
import {useAppSelector} from '../hooks/redux';
import {getPathByStep} from '../routes';
import {useNavigate} from 'react-router-dom';

export default function IndexPage() {
	useInitCheckoutByCart();
	const {isInited, stepper} = useAppSelector((state) => state.app);
	const navigate = useNavigate();

	useEffect(() => {
		if (isInited && stepper) {
			let urlPath = getPathByStep(stepper.currentStep);

			//we need to redirect somewhere:
			if (urlPath && urlPath === '/') {
				urlPath = '/info';
			}

			if (urlPath) {
				navigate(urlPath, {replace: true});
			}
		}
	}, [isInited, stepper]); //eslint-disable-line

	return <div />;
}
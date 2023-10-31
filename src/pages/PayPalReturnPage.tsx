import React, {useEffect, useState} from 'react';
import {useAppSelector} from '../hooks/redux';
import Loading from '../components/Loading';
import {useSearchParams} from 'react-router-dom';
import ErrorPage from './ErrorPage';

const defaultError = 'Incorrect input params. Please, contact administrator.';

export default function PayPalReturnPage({isCancelPage}: {isCancelPage: boolean}) {
	const [error, setError] = useState<null|string>(null);
	const [searchParams] = useSearchParams();
	const {onThankYouPage, api} = useAppSelector((state) => state.app);
	// const location = useLocation();

	useEffect(() => {
		const id = searchParams.get('token');
		if (id) {
			api!.checkout.paypalCapture(id)
				.then(({result, order}) => {
					if (order) {
						let thankYouPageError;
						if (!result && !isCancelPage) {
							thankYouPageError = 'Payment was not processed. If the order is not payed - please try again.';
						}

						onThankYouPage!({orderId: order.id, error: thankYouPageError});
					} else {
						setError(defaultError);
					}
				})
				.catch(({response: {data}}) => {
					setError(Array.isArray(data) && data[0] && data[0].message ? data[0].message : defaultError);
				});
		} else {
			setError(defaultError);
		}

	}, [searchParams]);//eslint-disable-line

	if (error) {
		return <ErrorPage error={error} />;
	}

	return <Loading />;
}
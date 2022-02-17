import {useEffect, useState} from 'react';
import {useAppSelector} from './redux';
import {useAppDispatch} from './redux';
import {initCheckoutByCart} from '../redux/actions/checkout';

export default function useInitCheckoutByCart() {
	const {isInited, cartId} = useAppSelector((state) => state.app);
	const [error, setError] = useState<null|string>(null);
	const dispatch = useAppDispatch();

	useEffect(() => {
		if (cartId) {
			if (!isInited) {
				dispatch(initCheckoutByCart());
			}
		} else {
			setError('Cart ID is not passed to the Checkout component.');
		}
	}, [cartId]);

	return {
		isInited,
		error
	};
}
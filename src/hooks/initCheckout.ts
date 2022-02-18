import {useEffect} from 'react';
import {useAppSelector} from './redux';
import {useAppDispatch} from './redux';
import {initCheckoutByCart} from '../redux/actions/checkout';
import {setGlobalError} from '../redux/reducers/app';

export default function useInitCheckoutByCart() {
	const {isInited, cartId} = useAppSelector((state) => state.app);
	const dispatch = useAppDispatch();

	useEffect(() => {
		if (cartId) {
			if (!isInited) {
				dispatch(initCheckoutByCart());
			}
		} else {
			dispatch(setGlobalError('Cart ID is not passed to the Checkout component.'));
		}
	}, [cartId]);//eslint-disable-line

	return {
		isInited
	};
}
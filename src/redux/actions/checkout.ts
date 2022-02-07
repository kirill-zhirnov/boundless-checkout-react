import {AppThunk} from '../store';
import {showCheckout, setCheckoutData} from '../reducers/app';
import {setLoggedInCustomer, userCookieName} from './user';
import Cookie from 'js-cookie';

export const makeCheckoutVisible = (): AppThunk => async (dispatch, getState) => {
	dispatch(showCheckout());

	const {api, cartId} = getState().app;

	try {
		const customerAuthToken = Cookie.get(userCookieName);
		if (customerAuthToken) {
			api!.setCustomerAuthToken(customerAuthToken);
		}

		const data = await api!.checkout.init(cartId!);
		dispatch(setCheckoutData(data));

		if (data.loggedInCustomer) {
			dispatch(setLoggedInCustomer(data.loggedInCustomer, customerAuthToken!));
		} else {
			if (customerAuthToken) {
				Cookie.remove(userCookieName);
			}
		}
	} catch (e) {
		console.error(e);
	}
};
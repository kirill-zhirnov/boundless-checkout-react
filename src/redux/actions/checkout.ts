import {AppThunk} from '../store';
import {setCheckoutData} from '../reducers/app';
import {setLoggedInCustomer, userCookieName} from './user';
import Cookie from 'js-cookie';

export const initCheckoutByCart = (): AppThunk => async (dispatch, getState) => {
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
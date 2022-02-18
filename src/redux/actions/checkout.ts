import {AppThunk} from '../store';
import {setCheckoutData, setGlobalError} from '../reducers/app';
import {setLoggedInCustomer, userCookieName} from './user';
import Cookie from 'js-cookie';

export const initCheckoutByCart = (): AppThunk => async (dispatch, getState) => {
	const {api, cartId} = getState().app;

	const customerAuthToken = Cookie.get(userCookieName);
	if (customerAuthToken) {
		api!.setCustomerAuthToken(customerAuthToken);
	}

	api!.checkout.init(cartId!)
		.then((data) => {
			dispatch(setCheckoutData(data));

			if (data.loggedInCustomer) {
				dispatch(setLoggedInCustomer(data.loggedInCustomer, customerAuthToken!));
			} else {
				if (customerAuthToken) {
					Cookie.remove(userCookieName);
				}
			}
		})
		.catch(({response: {data}}) => {
			console.error(data);

			dispatch(setGlobalError('Cannot initialize checkout. Please go back to the cart and try again.'));
		});
};
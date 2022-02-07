import {AppThunk} from '../store';
import {ICustomer} from 'boundless-api-client';
import {login} from '../reducers/user';
import Cookie from 'js-cookie';

export const userCookieName = 'boundless_customer_auth';

export const setLoggedInCustomer = (customer: ICustomer, authToken: string) : AppThunk => async (dispatch, getState) => {
	const {api} = getState().app;
	api!.setCustomerAuthToken(authToken);

	Cookie.set(userCookieName, authToken, {expires: 1, sameSite: 'None', secure: true});
	dispatch(login({loggedInCustomer: customer, authToken}));
};
import {AppThunk} from '../store';
import {showCheckout, setCheckoutData} from '../reducers/app';

export const makeCheckoutVisible = (): AppThunk => async (dispatch, getState) => {
	dispatch(showCheckout());

	const {api, cartId} = getState().app;

	try {
		const data = await api!.checkout.init(cartId!);
		dispatch(setCheckoutData(data));
	} catch (e) {
		console.error(e);
	}
};
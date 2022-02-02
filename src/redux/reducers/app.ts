import {createSlice, PayloadAction} from '@reduxjs/toolkit';
import {BoundlessClient} from 'boundless-api-client';
import {ICartItem, IOrder, ICheckoutPageSettings} from 'boundless-api-client';
import {ReactNode} from 'react';

const initialState: IAppState = {
	isInited: false,
	show: false
};

const appSlice = createSlice({
	name: 'app',
	initialState,
	reducers: {
		setBasicProps(state, action: PayloadAction<Required<Pick<IAppState, 'onHide' | 'cartId' | 'api'>> & {
			basename?: string,
			logo?: string|ReactNode
		}>) {
			const {onHide, cartId, basename, api, logo} = action.payload;

			return {
				...state,
				onHide,
				cartId,
				basename,
				api,
				logo
			};
		},
		showCheckout(state) {
			state.show = true;
		},
		hideCheckout(state) {
			return {
				...state,
				show: false,
				isInited: false
			};
		},
		setCheckoutData(state, action: PayloadAction<Required<Pick<IAppState, 'items' | 'order' | 'settings'>>>) {
			const {items, order, settings} = action.payload;

			return {
				...state,
				items,
				order,
				settings,
				isInited: true
			};
		}
	}
});

export const {setBasicProps, showCheckout, hideCheckout, setCheckoutData} = appSlice.actions;

export default appSlice.reducer;

export interface IAppState {
	basename?: string,
	onHide?: () => void,
	cartId?: string,
	api?: BoundlessClient,
	show: boolean,
	isInited: boolean,
	items?: ICartItem[],
	order?: IOrder,
	settings?: ICheckoutPageSettings,
	logo?: string|ReactNode
}
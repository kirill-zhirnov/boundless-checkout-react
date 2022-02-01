import {createSlice, PayloadAction} from '@reduxjs/toolkit';
import {BoundlessClient} from 'boundless-api-client';

const initialState: IAppState = {
};

const appSlice = createSlice({
	name: 'app',
	initialState,
	reducers: {
		initApp(state, action: PayloadAction<Required<Pick<IAppState, 'onHide' | 'cartId' | 'api'>> & {
			basename?: string
		}>) {
			const {onHide, cartId, basename, api} = action.payload;

			return {
				...state,
				onHide,
				cartId,
				basename,
				api
			};
		}
	}
});

export const {initApp} = appSlice.actions;

export default appSlice.reducer;

export interface IAppState {
	basename?: string,
	onHide?: () => void,
	cartId?: string,
	api?: BoundlessClient
}
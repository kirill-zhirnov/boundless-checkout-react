import {createSlice, PayloadAction} from '@reduxjs/toolkit';

const xhrSlice = createSlice({
	name: 'xhr',
	initialState: {
		promises: []
	} as IXHRState,
	reducers: {
		pushPromise(state, action: PayloadAction<{promise: Promise<any>}>) {
			state.promises.push(action.payload.promise);
		},
		cleanPromises(state) {
			state.promises = [];
		}
	}
});

export const {pushPromise, cleanPromises} = xhrSlice.actions;

export default xhrSlice.reducer;

export interface IXHRState {
	promises: Promise<any>[]
}
import {createSlice, PayloadAction} from '@reduxjs/toolkit';

const initialState: IXHRState = {
	promises: []
};

const xhrSlice = createSlice({
	name: 'xhr',
	initialState,
	reducers: {
		pushPromise(state, action: PayloadAction<{promise: Promise<any>}>) {
			state.promises.push(action.payload.promise);
		},
		cleanPromises(state) {
			state.promises = [];
		},
		resetXhrState() {
			return {...initialState};
		}
	}
});

export const {pushPromise, cleanPromises, resetXhrState} = xhrSlice.actions;

export default xhrSlice.reducer;

export interface IXHRState {
	promises: Promise<any>[]
}
import {ICustomer} from 'boundless-api-client';
import {createSlice, PayloadAction} from '@reduxjs/toolkit';

const initialState: IUserState = {
	loggedInCustomer: null,
	authToken: null
};

const userSlice = createSlice({
	name: 'user',
	initialState,
	reducers: {
		login(state, action: PayloadAction<{loggedInCustomer: ICustomer, authToken: string}>) {
			const {loggedInCustomer, authToken} = action.payload;

			return {
				...state,
				loggedInCustomer,
				authToken
			};
		},
		logout(state) {
			return {
				...state,
				loggedInCustomer: null,
				authToken: null
			};
		},
		resetUserState() {
			return {...initialState};
		}
	}
});

export const {login, logout, resetUserState} = userSlice.actions;
export default userSlice.reducer;

export interface IUserState {
	loggedInCustomer: ICustomer | null,
	authToken: string | null
}
import {configureStore, ThunkAction, Action} from '@reduxjs/toolkit';
import appReducers from './reducers/app';

export const store = configureStore({
	reducer: {
		app: appReducers,
	}
});

export type AppDispatch = typeof store.dispatch;
export type RootState = ReturnType<typeof store.getState>;
export type AppThunk<ReturnType = void> = ThunkAction<
	ReturnType,
	RootState,
	unknown,
	Action<string>
>;
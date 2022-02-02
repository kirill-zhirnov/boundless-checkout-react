import {configureStore, ThunkAction, Action} from '@reduxjs/toolkit';
import appReducers from './reducers/app';

export const store = configureStore({
	reducer: {
		app: appReducers,
	},
	middleware: (getDefaultMiddleware) =>
		getDefaultMiddleware({
			serializableCheck: {
				ignoredActionPaths: ['payload.onHide', 'payload.api', 'payload.logo'],
				ignoredPaths: ['app.onHide', 'app.api', 'app.logo'],
			},
		})
});

export type AppDispatch = typeof store.dispatch;
export type RootState = ReturnType<typeof store.getState>;
export type AppThunk<ReturnType = void> = ThunkAction<
	ReturnType,
	RootState,
	unknown,
	Action<string>
>;
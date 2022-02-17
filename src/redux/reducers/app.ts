import {createSlice, PayloadAction} from '@reduxjs/toolkit';
import {
	ICartItem,
	IOrder,
	ICheckoutPageSettings,
	ICheckoutStepper,
	TCheckoutStep,
	ICustomer,
	BoundlessClient
} from 'boundless-api-client';
import {ReactNode} from 'react';

const initialState: IAppState = {
	isInited: false,
	show: false
};

const appSlice = createSlice({
	name: 'app',
	initialState,
	reducers: {
		setBasicProps(state, action: PayloadAction<Required<Pick<IAppState, 'onHide' | 'api' | 'onThankYouPage'>> & {
			basename?: string,
			logo?: string|ReactNode,
			cartId?: string
		}>) {
			const {onHide, onThankYouPage, cartId, basename, api, logo} = action.payload;

			return {
				...state,
				onHide,
				onThankYouPage,
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
		setCheckoutData(state, action: PayloadAction<Required<Pick<IAppState, 'items' | 'order' | 'settings' | 'stepper'>>>) {
			const {items, order, settings, stepper} = action.payload;

			return {
				...state,
				items,
				order,
				settings,
				stepper,
				isInited: true
			};
		},
		addFilledStep(state, action: PayloadAction<{step: TCheckoutStep}>) {
			const {step} = action.payload;
			const stepper = state.stepper!;

			if (!stepper.filledSteps.includes(step)) {
				stepper.filledSteps.push(step);
			}
		},
		setOrdersCustomer(state, action: PayloadAction<ICustomer>) {
			const customer = action.payload;
			state.order!.customer = customer;
		}
	}
});

export const {
	setBasicProps,
	showCheckout,
	hideCheckout,
	setCheckoutData,
	addFilledStep,
	setOrdersCustomer
} = appSlice.actions;

export default appSlice.reducer;

export type TOnThankYouPage = ({orderId, error}: {orderId: string, error?: string}) => void;

export interface IAppState {
	basename?: string,
	onHide?: () => void,
	onThankYouPage?: TOnThankYouPage,
	cartId?: string,
	api?: BoundlessClient,
	show: boolean,
	isInited: boolean,
	items?: ICartItem[],
	order?: IOrder,
	settings?: ICheckoutPageSettings,
	logo?: string|ReactNode,
	stepper?: ICheckoutStepper
}
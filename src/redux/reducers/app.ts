import {createSlice, PayloadAction} from '@reduxjs/toolkit';
import {
	ICartItem,
	IOrder,
	ICheckoutPageSettings,
	ICheckoutStepper,
	TCheckoutStep,
	ICustomer,
	BoundlessClient,
	ICheckoutInitData
} from 'boundless-api-client';
import {ReactNode} from 'react';

const initialState: IAppState = {
	isInited: false,
	show: false,
	globalError: null
};

const appSlice = createSlice({
	name: 'app',
	initialState,
	reducers: {
		setBasicProps(state, action: PayloadAction<Required<Pick<IAppState, 'onHide' | 'api' | 'onThankYouPage'>> & {
			basename?: string,
			logo?: string|ReactNode,
			cartId?: string,
			onCheckoutInited?: TOnCheckoutInited
		}>) {
			const {onHide, onThankYouPage, cartId, basename, api, logo, onCheckoutInited} = action.payload;

			return {
				...state,
				onHide,
				onThankYouPage,
				cartId,
				basename,
				api,
				logo,
				onCheckoutInited
			};
		},
		showCheckout(state) {
			state.show = true;
		},
		hideCheckout(state) {
			return {
				...state,
				show: false,
				isInited: false,
				globalError: null
			};
		},
		setCheckoutData(state, action: PayloadAction<Required<Pick<IAppState, 'items' | 'order' | 'settings' | 'stepper'>>>) {
			const {items, order, settings, stepper} = action.payload;

			return {
				...state,
				items,
				order,
				settings,
				stepper
			};
		},
		setCheckoutInited(state, action: PayloadAction<{isInited: boolean}>) {
			state.isInited = action.payload.isInited;
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
		},
		setGlobalError(state, action: PayloadAction<string|null>) {
			state.globalError = action.payload;
		}
	}
});

export const {
	setBasicProps,
	showCheckout,
	hideCheckout,
	setCheckoutData,
	addFilledStep,
	setOrdersCustomer,
	setGlobalError,
	setCheckoutInited
} = appSlice.actions;

export default appSlice.reducer;

export type TOnThankYouPage = ({orderId, error}: {orderId: string, error?: string}) => void;
export type TOnCheckoutInited = (data: ICheckoutInitData) => void;

export interface IAppState {
	show: boolean,
	isInited: boolean,
	globalError: string|null,
	basename?: string,
	onHide?: () => void,
	onThankYouPage?: TOnThankYouPage,
	cartId?: string,
	api?: BoundlessClient,
	items?: ICartItem[],
	order?: IOrder,
	settings?: ICheckoutPageSettings,
	logo?: string|ReactNode,
	stepper?: ICheckoutStepper,
	onCheckoutInited?: TOnCheckoutInited
}
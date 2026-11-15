import {createSlice, PayloadAction} from "@reduxjs/toolkit";
import {CovaCartItem, CovaCheckoutInitData, ICurrency, ILocaleSettings} from "../../types/cart";
import {ICustomCustomer, IOrderWithCustmAttr, ITotal} from "../../types/Order";
import {setLocalStorageCheckoutData} from "../../hooks/checkoutData";
import {ICheckoutStepper, TCheckoutStep} from "../../types/common";
import {ICheckoutStepWarning} from "../../lib/checkoutGuards";

const initialState: IAppState = {
	isInited: false,
	show: false,
	globalError: null,
	stepper: null,
	stepWarning: null,
};

const appSlice = createSlice({
	name: "app",
	initialState,
	reducers: {
		setBasicProps(
			state,
			action: PayloadAction<{
				cartId?: string;
			}>,
		) {
			const {cartId} = action.payload;

			return {
				...state,
				cartId,
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
				globalError: null,
			};
		},
		setCheckoutData(
			state,
			action: PayloadAction<
				Required<
					Pick<
						IAppState,
						| "items"
						| "order"
						| "currency"
						| "localeSettings"
						| "stepper"
						| "total"
					>
				> & {
					stepWarning?: ICheckoutStepWarning | null;
				}
			>
		) {
			setLocalStorageCheckoutData(action.payload);

			const {
				items,
				order,
				currency,
				stepper,
				total,
				stepWarning,
			} = action.payload;

			return {
				...state,
				items,
				order,
				currency,
				stepper,
				isInited: true,
				total,
				stepWarning: stepWarning ?? null,
			};
		},
		setCheckoutInited(state, action: PayloadAction<{isInited: boolean}>) {
			state.isInited = action.payload.isInited;
		},
		addFilledStep(state, action: PayloadAction<{step: TCheckoutStep}>) {
			const {step} = action.payload;
			const stepper = state.stepper!;
			const completedStepIndex = stepper.steps.indexOf(step);

			if (completedStepIndex === -1) return;

			stepper.filledSteps = stepper.filledSteps.filter((filledStep) => {
				const filledStepIndex = stepper.steps.indexOf(filledStep);

				return filledStepIndex !== -1 && filledStepIndex <= completedStepIndex;
			});

			if (!stepper.filledSteps.includes(step)) {
				stepper.filledSteps.push(step);
			}

			if (state.stepWarning?.step === step) {
				state.stepWarning = null;
			}
		},
		setOrder(state, action: PayloadAction<IOrderWithCustmAttr>) {
			const order = {...action.payload};

			if (order && order.customer === null) {
				order.customer = undefined;
			}

			state.order = order;
		},
		setOrdersCustomer(state, action: PayloadAction<ICustomCustomer>) {
			const customer = action.payload;
			state.order!.customer = customer;
		},
		setGlobalError(state, action: PayloadAction<string | null>) {
			state.globalError = action.payload;
		},
		setStepWarning(state, action: PayloadAction<ICheckoutStepWarning>) {
			state.stepWarning = action.payload;
		},
		setTotal(state, action: PayloadAction<ITotal>) {
			const total = action.payload;
			state.total = total;
		},
		setIsInited(state, action: PayloadAction<boolean>) {
			state.isInited = action.payload;
		},
		setLocaleSettings(state, action: PayloadAction<ILocaleSettings>) {
			state.localeSettings = action.payload;
		},
		setCurrentStep(state, action: PayloadAction<TCheckoutStep>) {
			if (state.stepper) {
				state.stepper.currentStep = action.payload;
			}

			if (state.stepWarning && state.stepWarning.step !== action.payload) {
				state.stepWarning = null;
			}
		},
		setStepperSteps(state, action: PayloadAction<TCheckoutStep[]>) {
			if (state.stepper) {
				state.stepper.steps = action.payload;
			}
		},
	},
});

export const {
	setBasicProps,
	showCheckout,
	setCheckoutData,
	addFilledStep,
	setOrdersCustomer,
	setGlobalError,
	setStepWarning,
	setOrder,
	setCheckoutInited,
	setTotal,
	setCurrentStep,
} = appSlice.actions;

export default appSlice.reducer;

export type TOnThankYouPage = (data: {
	order: IOrderWithCustmAttr;
	total: ITotal;
	items: CovaCartItem[];
}) => Promise<void>;

export type TOnCheckoutInited = (data: CovaCheckoutInitData) => void;

export interface IAppState {
	show: boolean;
	isInited: boolean;
	globalError: string | null;
	cartId?: string;
	items?: CovaCartItem[];
	order?: IOrderWithCustmAttr;
	currency?: ICurrency;
	localeSettings?: ILocaleSettings;
	stepper?: ICheckoutStepper | null;
	stepWarning: ICheckoutStepWarning | null;
	total?: ITotal;
}

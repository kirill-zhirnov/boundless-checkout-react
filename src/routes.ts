import {TCheckoutStep} from 'boundless-api-client';

const checkoutStepRoutes = {
	[TCheckoutStep.contactInfo]: '/info',
	[TCheckoutStep.shippingAddress]: '/shipping-address',
	[TCheckoutStep.shippingMethod]: '/', //FIXME
	[TCheckoutStep.paymentMethod]: '/payment',
	[TCheckoutStep.thankYou]: '/', //FIXME
};


export const getPathByStep = (step: TCheckoutStep) => {
	return checkoutStepRoutes[step];
};

export const getStepByPath = (path: string) => {
	for (const [step, url] of Object.entries(checkoutStepRoutes)) {
		if (url === path) return step as TCheckoutStep;
	}
};
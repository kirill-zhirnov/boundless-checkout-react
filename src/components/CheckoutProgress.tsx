import {Step, StepButton, Stepper} from '@mui/material';
import {TCheckoutStep} from 'boundless-api-client';
import React from 'react';
import {useLocation, useNavigate} from 'react-router-dom';
import {getPathByStep, getStepByPath} from '../routes';
import {useAppSelector} from '../hooks/redux';

const checkoutStepTitles = {
	[TCheckoutStep.contactInfo]: 'Contact Info',
	[TCheckoutStep.shippingAddress]: 'Delivery method',
	[TCheckoutStep.shippingMethod]: 'Shipping method',
	[TCheckoutStep.paymentMethod]: 'Payment method',
	[TCheckoutStep.thankYou]: 'Thank you!'
};

export default function CheckoutProgress() {
	const stepper = useAppSelector(state => state.app.stepper);
	const {pathname} = useLocation();
	const navigate = useNavigate();

	const currentStep = getStepByPath(pathname) ? stepper?.steps.indexOf(getStepByPath(pathname)!) : 0;

	const handleStepChange = (step: TCheckoutStep) => {
		const url = getPathByStep(step);
		if (url) navigate(url);
	};

	if (!stepper) return null;

	return (
		<div className='bdl-checkout-progress'>
			<Stepper activeStep={currentStep} alternativeLabel>
				{stepper.steps.map((step) => (
					<Step key={step}>
						<StepButton color="inherit" onClick={handleStepChange.bind(null, step)}>
							{checkoutStepTitles[step]}
						</StepButton>
					</Step>
				))}
			</Stepper>
		</div>
	);
}
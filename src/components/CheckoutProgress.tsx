import {Step, StepButton, Stepper} from '@mui/material';
import {TCheckoutStep} from 'boundless-api-client';
import React, {useMemo} from 'react';
import {useLocation, useNavigate} from 'react-router-dom';
import {getPathByStep, getStepByPath} from '../routes';
import {useAppSelector} from '../hooks/redux';
import {useTranslation} from 'react-i18next';

export default function CheckoutProgress() {
	const stepper = useAppSelector(state => state.app.stepper);
	const {pathname} = useLocation();
	const navigate = useNavigate();
	const {t} = useTranslation();

	const currentStep = getStepByPath(pathname) ? stepper?.steps.indexOf(getStepByPath(pathname)!) : 0;

	const handleStepChange = (step: TCheckoutStep) => {
		const url = getPathByStep(step);
		if (url) navigate(url);
	};

	const checkoutStepTitles = useMemo(() => {
		return {
			[TCheckoutStep.contactInfo]: t('checkoutProgress.contactInfo'),
			[TCheckoutStep.shippingAddress]: t('checkoutProgress.shippingAddress'),
			[TCheckoutStep.shippingMethod]: t('checkoutProgress.shippingMethod'),
			[TCheckoutStep.paymentMethod]: t('checkoutProgress.paymentMethod'),
			[TCheckoutStep.thankYou]: t('checkoutProgress.thankYou')
		};
	}, [t]);

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
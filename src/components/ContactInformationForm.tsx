import React from 'react';
import {Form, Formik, FormikHelpers} from 'formik';
import {useAppDispatch, useAppSelector} from '../hooks/redux';
import {ICheckoutSettingsContactFields, IOrder, ICheckoutStepper, TCheckoutStep} from 'boundless-api-client';
import TextField from '@mui/material/TextField';
import Grid from '@mui/material/Grid';
import Button from '@mui/material/Button';
import {apiErrors2Formik, checkAttrs, fieldAttrs} from '../lib/formUtils';
import {addPromise} from '../redux/actions/xhr';
import ExtraErrors from './ExtraErrors';
import FormControlLabel from '@mui/material/FormControlLabel';
import Checkbox from '@mui/material/Checkbox';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import PaymentIcon from '@mui/icons-material/Payment';
import {addFilledStep, setCustomer} from '../redux/reducers/app';
import {useNavigate} from 'react-router-dom';

export default function ContactInformationForm() {
	const {settings, order, stepper} = useAppSelector(state => state.app);
	const {accountPolicy, contactFields} = settings!;
	const fieldsList = getFieldsList(contactFields);
	const smGridCell = fieldsList.length ? 12 / fieldsList.length : 12;
	const {onSubmit} = useSaveContactInfo();
	const presentedFields = fieldsList.map(({type}) => type);
	if (!order!.customer) {
		presentedFields.push('receive_marketing_info');
	}

	return (
		<Formik initialValues={getInitialValues(order!)} onSubmit={onSubmit}>
			{(formikProps) => (
				<Form>
					{Object.keys(formikProps.errors).length > 0 && <ExtraErrors presentedFields={presentedFields} errors={formikProps.errors} />}
					<Grid container spacing={2}>
						{fieldsList.map(({type, required}, i) =>
							<Grid item
										xs={12}
										sm={smGridCell}
										key={i}
							>
								{type === 'email' &&
								<TextField label={'Email'}
													 variant={'standard'}
													 type={'email'}
													 required={required}
													 fullWidth
													 {...fieldAttrs<IContactInformationFormValues>('email', formikProps)}
								/>
								}
								{type === 'phone' &&
								<TextField label={'Phone'}
													 variant={'standard'}
													 required={required}
													 {...fieldAttrs<IContactInformationFormValues>('phone', formikProps)}
													 fullWidth
								/>
								}
							</Grid>
						)}
						{presentedFields.includes('receive_marketing_info') &&
						<Grid item
									xs={12}
						>
							<FormControlLabel control={
								<Checkbox {...checkAttrs('receive_marketing_info', formikProps)}
								/>
							} label="Email me with news and offers" />
						</Grid>
						}
						<Grid item
									xs={12}
									style={{'textAlign': 'right'}}
						>
							<NextStepBtn stepper={stepper!}
													 isSubmitting={formikProps.isSubmitting}
							/>
						</Grid>
					</Grid>
				</Form>
			)}
		</Formik>
	);
}

const NextStepBtn = ({stepper, isSubmitting}: {stepper: ICheckoutStepper, isSubmitting: boolean}) => {
	if (stepper.steps.includes(TCheckoutStep.shippingAddress)) {
		return (
			<Button variant="contained"
							type={'submit'}
							size="large"
							disabled={isSubmitting}
							startIcon={<LocalShippingIcon />}
			>Continue to shipping</Button>
		);
	}

	return (
		<Button variant="contained"
						type={'submit'}
						size="large"
						disabled={isSubmitting}
						startIcon={<PaymentIcon />}
		>Continue to payment</Button>
	);
};

const useSaveContactInfo = () => {
	const {api, order, stepper} = useAppSelector(state => state.app);
	const dispatch = useAppDispatch();
	const navigate = useNavigate();

	const order_id = order!.id;
	const onSubmit = (values: IContactInformationFormValues, {setSubmitting, setErrors}: FormikHelpers<IContactInformationFormValues>) => {
		const {receive_marketing_info, ...rest} = values;

		const promise = api!.checkout.saveContactsData({
			order_id,
			...rest,
			receive_marketing_info: receive_marketing_info ? '1' : undefined
		})
			.then(({customer}) => {
				dispatch(setCustomer(customer));
				dispatch(addFilledStep({step: TCheckoutStep.contactInfo}));

				const nextUrl = (stepper!.steps.includes(TCheckoutStep.shippingAddress)) ? '/shipping-address' : '/payment';
				navigate(nextUrl, {replace: true});
			})
			.catch(({response: {data}}) => setErrors(apiErrors2Formik(data)))
			.finally(() => setSubmitting(false))
		;

		dispatch(addPromise(promise));
	};

	return {
		onSubmit
	};
};

const getFieldsList = (contactFields: ICheckoutSettingsContactFields) => {
	const fields: {type: string, required: boolean}[] = ['email', 'phone'].map(type => ({
		type,
		//@ts-ignore
		required: contactFields[type].required
	}));

	//required fields should be first:
	fields.sort((a, b) => {
		if (a.required && !b.required) {
			return -1;
		} else if (!a.required && b.required) {
			return 1;
		}

		return 0;
	});

	return fields;
};

const getInitialValues = (order: IOrder) => {
	const initialValues: IContactInformationFormValues = {
		receive_marketing_info: true
	};

	const {customer} = order;
	if (customer) {
		if (customer.email) {
			initialValues.email = customer.email;
		}

		if (customer.phone) {
			initialValues.phone = customer.phone;
		}
	}

	return initialValues;
};

export interface IContactInformationFormValues {
	email?: string;
	phone?: string;
	receive_marketing_info?: boolean;
}
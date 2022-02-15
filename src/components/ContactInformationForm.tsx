import React, {useState} from 'react';
import {Form, Formik, FormikHelpers} from 'formik';
import {useAppDispatch, useAppSelector} from '../hooks/redux';
import {
	ICheckoutSettingsContactFields,
	IOrder,
	ICheckoutStepper,
	TCheckoutStep,
	TCheckoutAccountPolicy,
	ICustomer
} from 'boundless-api-client';
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
import {addFilledStep, setOrdersCustomer} from '../redux/reducers/app';
import {useNavigate} from 'react-router-dom';
import Typography from '@mui/material/Typography';
import LoginIcon from '@mui/icons-material/Login';
import {LoginFormView} from './LoginForm';
import clsx from 'clsx';

export default function ContactInformationForm() {
	const [viewMode, setViewMode] = useState<TViewMode>(TViewMode.contact);

	if (viewMode === TViewMode.login) {
		return <LoginFormView setViewMode={setViewMode}/>;
	} else {
		return <ContactFormView setViewMode={setViewMode}/>;
	}
}

export function ContactFormView({setViewMode}: { setViewMode: (mode: TViewMode) => void }) {
	const {settings, order, stepper} = useAppSelector(state => state.app);
	const {loggedInCustomer} = useAppSelector(state => state.user);

	const {accountPolicy, contactFields} = settings!;
	const fieldsList = getFieldsList(contactFields);
	const smGridCell = fieldsList.length ? 12 / fieldsList.length : 12;
	const {onSubmit} = useSaveContactInfo();
	const presentedFields = fieldsList.map(({type}) => type);
	if (!order!.customer && !loggedInCustomer) {
		presentedFields.push('receive_marketing_info');
	}

	return (
		<Formik initialValues={getInitialValues(order!, loggedInCustomer)} onSubmit={onSubmit}>
			{(formikProps) => (
				<Form className={clsx('bdl-contact-form', {
					'two-fields': fieldsList.length === 2,
					'one-field': fieldsList.length === 1
				})}>
					{Object.keys(formikProps.errors).length > 0 &&
					<ExtraErrors presentedFields={presentedFields} errors={formikProps.errors}/>}
					<Typography variant="h5" mb={2}>
						Contact information
					</Typography>
					{(accountPolicy === TCheckoutAccountPolicy.guestAndLogin && !loggedInCustomer) &&
					<Typography align={'right'}
											variant="body2"
											className={'bdl-contact-form__has-account'}
											gutterBottom
					>
						Already have an account?
						<Button startIcon={<LoginIcon/>}
										variant="text"
										onClick={() => setViewMode(TViewMode.login)}
										sx={{mx: 1}}
										size={'small'}
						>Login</Button>
					</Typography>
					}
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
							} label="Email me with news and offers"/>
						</Grid>
						}
						<Grid item xs={12} sx={{textAlign: 'right'}}>
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

const NextStepBtn = ({stepper, isSubmitting}: { stepper: ICheckoutStepper, isSubmitting: boolean }) => {
	if (stepper.steps.includes(TCheckoutStep.shippingAddress)) {
		return (
			<Button variant="contained"
							type={'submit'}
							size="large"
							disabled={isSubmitting}
							startIcon={<LocalShippingIcon/>}
			>Continue to shipping</Button>
		);
	}

	return (
		<Button variant="contained"
						type={'submit'}
						size="large"
						disabled={isSubmitting}
						startIcon={<PaymentIcon/>}
		>Continue to payment</Button>
	);
};

const useSaveContactInfo = () => {
	const {api, order, stepper} = useAppSelector(state => state.app);
	const dispatch = useAppDispatch();
	const navigate = useNavigate();

	const order_id = order!.id;
	const onSubmit = (values: IContactInformationFormValues, {
		setSubmitting,
		setErrors
	}: FormikHelpers<IContactInformationFormValues>) => {
		const {receive_marketing_info, ...rest} = values;

		const promise = api!.checkout.saveContactsData({
				order_id,
				...rest,
				receive_marketing_info: receive_marketing_info ? '1' : undefined
			})
				.then(({customer}) => {
					dispatch(setOrdersCustomer(customer));
					dispatch(addFilledStep({step: TCheckoutStep.contactInfo}));

					const nextUrl = (stepper!.steps.includes(TCheckoutStep.shippingAddress)) ? '/shipping-address' : '/payment';
					navigate(nextUrl, {replace: true});
				})
				.catch((err) => {
					// console.log('err:', err);
					const {response: {data}} = err;
					setErrors(apiErrors2Formik(data));
				})
				.finally(() => setSubmitting(false))
		;

		dispatch(addPromise(promise));
	};

	return {
		onSubmit
	};
};

const getFieldsList = (contactFields: ICheckoutSettingsContactFields) => {
	const fields: { type: string, required: boolean, show: boolean }[] = ['email', 'phone']
		.map(type => ({
			type,
			//@ts-ignore
			required: contactFields[type].required,
			//@ts-ignore
			show: contactFields[type].show,
		}))
		.filter(({show}) => show);

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

const getInitialValues = (order: IOrder, loggedInCustomer: ICustomer | null) => {
	const {customer} = order;
	const initialValues: IContactInformationFormValues = {
		receive_marketing_info: true
	};

	if (loggedInCustomer) {
		initialValues.email = loggedInCustomer.email!;
		initialValues.phone = loggedInCustomer.phone || '';
	} else if (customer) {
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

export enum TViewMode {
	contact = 'contact',
	login = 'login'
}
import React, {useEffect, useMemo} from 'react';
import {IPaymentMethod} from 'boundless-api-client';
import Typography from '@mui/material/Typography';
import {Form, Formik, FormikHelpers, FormikProps} from 'formik';
import Radio from '@mui/material/Radio';
import RadioGroup from '@mui/material/RadioGroup';
import FormControlLabel from '@mui/material/FormControlLabel';
import FormControl from '@mui/material/FormControl';
import FormHelperText from '@mui/material/FormHelperText';
import Button from '@mui/material/Button';
import PaymentIcon from '@mui/icons-material/Payment';
import Box from '@mui/material/Box';
import {useAppDispatch, useAppSelector} from '../hooks/redux';
import {apiErrors2Formik, checkAttrs} from '../lib/formUtils';
import {addPromise} from '../redux/actions/xhr';
import ExtraErrors from './ExtraErrors';
import {TCheckoutStep, TPaymentGatewayAlias} from 'boundless-api-client';
import Checkbox from '@mui/material/Checkbox';
import {IVWCountry} from 'boundless-api-client';
import AddressFieldset, {IAddressFields} from './AddressFieldset';
import {ICustomer, TAddressType} from 'boundless-api-client';

export default function PaymentMethodForm({paymentMethods, countries, requiredBillingAddress}: {paymentMethods: IPaymentMethod[], countries: IVWCountry[], requiredBillingAddress: boolean}) {
	const {onSubmit} = useSavePaymentMethod();
	const {loggedInCustomer} = useAppSelector(state => state.user);
	const initialValues = useMemo(() => getFormInitialValues(loggedInCustomer), [loggedInCustomer]);

	useEffect(() => {
		document.title = 'Checkout: payment';
	}, []);

	return (
		<Formik initialValues={initialValues} onSubmit={onSubmit}>
			{(formikProps) => (
				<Form className={'bdl-payment-form'}>
					{Object.keys(formikProps.errors).length > 0 &&
					<ExtraErrors excludedFields={['payment_method_id']} errors={formikProps.errors}/>}
					<Typography variant="h5" mb={2}>Payment method</Typography>
					<PaymentMethods formikProps={formikProps} paymentMethods={paymentMethods} />
					{!requiredBillingAddress &&
					<Box mb={2}>
						<FormControlLabel control={<Checkbox {...checkAttrs('payment_address_the_same', formikProps)} />}
															label="Payment address is the same as shipping address"
						/>
					</Box>
					}
					{(!formikProps.values.payment_address_the_same || requiredBillingAddress) &&
					<BillingAddress countries={countries}
													formikProps={formikProps}
					/>}
					<Box textAlign={'end'}>
						<Button variant="contained"
										startIcon={<PaymentIcon />}
										type={'submit'}
										disabled={formikProps.isSubmitting}
						>
							{getBtnTitleByPaymentMethod(paymentMethods, formikProps.values.payment_method_id)}
						</Button>
					</Box>
				</Form>
			)}
		</Formik>
	);
}

const getFormInitialValues = (loggedInCustomer?: ICustomer|null) => {
	const initialValues: IPaymentMethodFormValues = {payment_method_id: -1, payment_address_the_same: true};

	if (loggedInCustomer) {
		const billingAddress = loggedInCustomer.addresses?.find(({type}) => type === TAddressType.billing);
		if (billingAddress) {
			Object.assign(initialValues, {
				first_name: billingAddress.first_name,
				last_name: billingAddress.last_name,
				company: billingAddress.company,
				address_line_1: billingAddress.address_line_1,
				address_line_2: billingAddress.address_line_2,
				city: billingAddress.city,
				state: billingAddress.state,
				country_id: billingAddress.country_id,
				zip: billingAddress.zip
			});
		}
	}

	return initialValues;
};

const BillingAddress = ({formikProps, countries}: {formikProps: FormikProps<IPaymentMethodFormValues>, countries: IVWCountry[]}) => {
	return (
		<Box mb={2} className={'bdl-billing-address'}>
			<Typography variant="h6" mb={2}>Billing address</Typography>
			<AddressFieldset countries={countries}
											 formikProps={formikProps as unknown as FormikProps<IAddressFields>}
			/>
		</Box>
	);
};

const PaymentMethods = ({formikProps, paymentMethods}: {formikProps: FormikProps<IPaymentMethodFormValues>, paymentMethods: IPaymentMethod[]}) => {
	return (
		<Box mb={2}>
			<FormControl variant="standard"
									 error={Boolean('payment_method_id' in formikProps.errors)}
			>
				<RadioGroup name="payment_method_id"
										onChange={formikProps.handleChange}
				>
					{paymentMethods.map(({payment_method_id, title, gateway_alias}) => {
						switch (gateway_alias) {
							case TPaymentGatewayAlias.paypal:
								return (
									<React.Fragment key={payment_method_id}>
										<FormControlLabel value={payment_method_id}
																			control={<Radio required={true} />}
																			label={
																				<span className={'payment-method__label'}>
																				<span className={'payment-method__icon payment-method__icon-paypal'}/>{title}
																			</span>
																			}
																			 />
										{formikProps.values.payment_method_id == payment_method_id &&
										<Typography className={'text-muted'} mb={1}>After clicking "Pay now", you will be redirected to PayPal to complete your purchase securely.</Typography>}
									</React.Fragment>
								);
							default:
								return (
									<FormControlLabel value={payment_method_id}
																		control={<Radio required={true} />}
																		label={title}
																		key={payment_method_id} />
								);
						}
					})}
				</RadioGroup>
				{'payment_method_id' in formikProps.errors && <FormHelperText>{formikProps.errors.payment_method_id}</FormHelperText>}
			</FormControl>
		</Box>
	);
};

const useSavePaymentMethod = () => {
	const {api, order, onThankYouPage} = useAppSelector(state => state.app);
	const dispatch = useAppDispatch();

	const order_id = order!.id;
	const onSubmit = (values: IPaymentMethodFormValues, {setSubmitting, setErrors}: FormikHelpers<IPaymentMethodFormValues>) => {
		const {payment_address_the_same, ...restValues} = values;
		const promise = api!.checkout.setPaymentMethod({
				order_id,
				...restValues,
				payment_address_the_same: payment_address_the_same ? '1' : ''
			})
				.then(({redirectTo, url, error}) => {
					if (redirectTo == 'url') {
						window.location.href = url!;
					} else if (redirectTo === TCheckoutStep.thankYou) {
						onThankYouPage!({orderId: order_id, error});
					} else {
						console.error('Unknown redirect:', redirectTo);
					}
				})
				.catch(({response: {data}}) => {
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

export interface IPaymentMethodFormValues {
	payment_method_id: number;
	payment_address_the_same?: boolean;
	first_name?: string;
	last_name?: string;
	company?: string;
	address_line_1?: string;
	address_line_2?: string;
	city?: string;
	state?: string;
	country_id?: number;
	zip?: string;
}

const getBtnTitleByPaymentMethod = (paymentMethods: IPaymentMethod[], paymentMethodId: number) => {
	const paymentMethod = paymentMethods.find(({payment_method_id}) => payment_method_id == paymentMethodId);

	if (paymentMethod) {
		switch (paymentMethod.gateway_alias) {
			case TPaymentGatewayAlias.paypal:
				return 'Pay now';
		}
	}

	return 'Complete order';
};
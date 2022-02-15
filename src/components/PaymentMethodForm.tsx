import React from 'react';
import {IPaymentMethod} from 'boundless-api-client';
import Typography from '@mui/material/Typography';
import {Form, Formik, FormikHelpers} from 'formik';
import Radio from '@mui/material/Radio';
import RadioGroup from '@mui/material/RadioGroup';
import FormControlLabel from '@mui/material/FormControlLabel';
import FormControl from '@mui/material/FormControl';
import FormLabel from '@mui/material/FormLabel';
import FormHelperText from '@mui/material/FormHelperText';
import Button from '@mui/material/Button';
import PaymentIcon from '@mui/icons-material/Payment';
import Box from '@mui/material/Box';
import {useAppDispatch, useAppSelector} from '../hooks/redux';
import {useNavigate} from 'react-router-dom';
import {addFilledStep, setOrdersCustomer} from '../redux/reducers/app';
import {apiErrors2Formik} from '../lib/formUtils';
import {addPromise} from '../redux/actions/xhr';
import {getPathByStep} from '../App';
import ExtraErrors from './ExtraErrors';

export default function PaymentMethodForm({paymentMethods}: {paymentMethods: IPaymentMethod[]}) {
	const {onSubmit} = useSavePaymentMethod();

	return (
		<Formik initialValues={{payment_method_id: -1}} onSubmit={onSubmit}>
			{(formikProps) => (
				<Form className={'bdl-payment-form'}>
					{Object.keys(formikProps.errors).length > 0 &&
					<ExtraErrors presentedFields={['payment_method_id']} errors={formikProps.errors}/>}
					<Typography variant="h5" mb={2}>Payment method</Typography>
					<Box mb={2}>
						<FormControl variant="standard"
												 error={Boolean('payment_method_id' in formikProps.errors)}
						>
							<RadioGroup name="payment_method_id"
													onChange={formikProps.handleChange}
							>
								{paymentMethods.map(({payment_method_id, title}) => <FormControlLabel value={payment_method_id}
																																											control={<Radio required={true} />}
																																											label={title}
																																											key={payment_method_id} />)}
							</RadioGroup>
							{'payment_method_id' in formikProps.errors && <FormHelperText>{formikProps.errors.payment_method_id}</FormHelperText>}
						</FormControl>
					</Box>
					<Button variant="contained"
									startIcon={<PaymentIcon />}
									type={'submit'}
									disabled={formikProps.isSubmitting}
					>
						Pay now
					</Button>
				</Form>
			)}
		</Formik>
	);
}

const useSavePaymentMethod = () => {
	const {api, order} = useAppSelector(state => state.app);
	const dispatch = useAppDispatch();
	const navigate = useNavigate();

	const order_id = order!.id;
	const onSubmit = (values: IPaymentMethodFormValues, {setSubmitting, setErrors}: FormikHelpers<IPaymentMethodFormValues>) => {
		const promise = api!.checkout.setPaymentMethod({
				order_id,
				...values
			})
				.then(({redirectTo}) => {
					if (redirectTo == 'url') {
						console.log('redirect me to:');
					} else {
						navigate(getPathByStep(redirectTo), {replace: true});
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
}

import React, {useEffect, useState} from 'react';
import {Form, Formik, FormikHelpers} from 'formik';
import {ContactFormView, TViewMode} from './ContactInformationForm';
import {useAppDispatch, useAppSelector} from '../hooks/redux';
import Typography from '@mui/material/Typography';
import Grid from '@mui/material/Grid';
import TextField from '@mui/material/TextField';
import {apiErrors2Formik, fieldAttrs} from '../lib/formUtils';
import Button from '@mui/material/Button';
import LoginIcon from '@mui/icons-material/Login';
import {TCheckoutAccountPolicy} from 'boundless-api-client';
import {addPromise} from '../redux/actions/xhr';
import {setLoggedInCustomer} from '../redux/actions/user';
import ContactMailIcon from '@mui/icons-material/ContactMail';

export default function LoginForm() {
	const [viewMode, setViewMode] = useState<TViewMode>(TViewMode.login);
	const {loggedInCustomer} = useAppSelector(state => state.user);

	useEffect(() => {
		document.title = 'Checkout: login';
		if (loggedInCustomer) {
			setViewMode(TViewMode.contact);
		}
	}, [loggedInCustomer]);

	if (viewMode === TViewMode.login) {
		return <LoginFormView setViewMode={setViewMode}/>;
	} else {
		return <ContactFormView setViewMode={setViewMode}/>;
	}
}

export function LoginFormView({setViewMode}: {setViewMode: (mode: TViewMode) => void}) {
	const {settings} = useAppSelector(state => state.app);
	const {accountPolicy} = settings!;
	const {onSubmit} = useSaveLoginForm(setViewMode);

	return (
		<Formik initialValues={{email: '', password: ''}} onSubmit={onSubmit}>
			{(formikProps) => (
				<Form className={'bdl-login-form'}>
					<Typography variant="h5" mb={2}>Login</Typography>
					{accountPolicy === TCheckoutAccountPolicy.guestAndLogin &&
					<Typography align={'right'}
											variant="body2"
											gutterBottom
					>
						<Button variant="text"
										onClick={() => setViewMode(TViewMode.contact)}
										disabled={formikProps.isSubmitting}
										size={'small'}
										endIcon={<ContactMailIcon />}
						>
							Continue as guest
						</Button>
					</Typography>
					}
					<Grid container spacing={2}>
						<Grid item xs={12}>
							<TextField label={'Email'}
												 variant={'standard'}
												 type={'email'}
												 required={true}
												 fullWidth
												 {...fieldAttrs<ILoginFormValues>('email', formikProps)}
							/>
						</Grid>
						<Grid item xs={12}>
							<TextField label={'Password'}
												 variant={'standard'}
												 type={'password'}
												 required={true}
												 fullWidth
												 {...fieldAttrs<ILoginFormValues>('password', formikProps)}
							/>
						</Grid>
						<Grid item xs={12} sx={{textAlign: 'right'}}>
							<Button variant="contained"
											startIcon={<LoginIcon />}
											type={'submit'}
											disabled={formikProps.isSubmitting}
							>
								Sign in
							</Button>
						</Grid>
					</Grid>
				</Form>
			)}
		</Formik>
	);
}

const useSaveLoginForm = (setViewMode: (mode: TViewMode) => void) => {
	const {api} = useAppSelector(state => state.app);
	const dispatch = useAppDispatch();

	const onSubmit = (values: ILoginFormValues, {setSubmitting, setErrors}: FormikHelpers<ILoginFormValues>) => {
		const promise = api!.customer.login(values.email, values.password)
			.then(({customer, authToken}) => {
				dispatch(setLoggedInCustomer(customer, authToken));
				setViewMode(TViewMode.contact);
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

export interface ILoginFormValues {
	email: string;
	password: string;
}
import React from 'react';
import {Form, Formik, FormikHelpers} from 'formik';
import {Button, FormControl, FormHelperText, Input, InputAdornment, InputLabel} from '@mui/material';
import {apiErrors2Formik, fieldAttrs} from '../../lib/formUtils';
import {useAppSelector, useAppDispatch} from '../../hooks/redux';
import {RootState} from '../../redux/store';
import {addPromise} from '../../redux/actions/xhr';
import {setOrder} from '../../redux/reducers/app';

export default function CartDiscountForm() {
	const dispatch = useAppDispatch();
	const api = useAppSelector((state: RootState) => state.app.api);
	const orderId = useAppSelector((state: RootState) => state.app.order?.id);

	const onSubmit = (values: IDiscountFormValues, {setSubmitting, setErrors}: FormikHelpers<IDiscountFormValues>) => {
		if (!api || !orderId) return;

		const promise = api.checkout.addDiscountCode(orderId, values.code)
			.then(({order}) => {
				if (order) dispatch(setOrder(order));
			})
			.catch(({response: {data}}) => setErrors(apiErrors2Formik(data)))
			.finally(() => setSubmitting(false))
			;

		dispatch(addPromise(promise));
	};


	return (
		<Formik initialValues={{code: ''}} onSubmit={onSubmit}>
			{(formikProps) => {
				const {helperText, error, ...restProps} = fieldAttrs<IDiscountFormValues>('code', formikProps);
				return (
					<Form className={'bdl-cart__discount-form'}>
						<FormControl
							fullWidth
							variant="standard"
							error={error}
							required
						>
							<InputLabel htmlFor="discount-code-input">Discount code</InputLabel>
							<Input
								id="discount-code-input"
								type={'text'}
								fullWidth
								endAdornment={<InputAdornment position="end">
									<Button
										type='submit'
										disabled={formikProps.isSubmitting}
									>
										Apply
									</Button>
								</InputAdornment>}
								{...restProps}
							/>
							<FormHelperText id="my-helper-text">{helperText || ''}</FormHelperText>
						</FormControl>
					</Form>
				);
			}}
		</Formik>
	);
}

export interface IDiscountFormValues {
	code: string;
}
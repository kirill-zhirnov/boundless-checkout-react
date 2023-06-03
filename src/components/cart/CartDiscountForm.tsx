import React from 'react';
import {Form, Formik, FormikHelpers} from 'formik';
import {Button, FormControl, FormHelperText, Input, InputAdornment, InputLabel} from '@mui/material';
import {apiErrors2Formik, fieldAttrs} from '../../lib/formUtils';
import {useAppSelector, useAppDispatch} from '../../hooks/redux';
import {RootState} from '../../redux/store';
import {addPromise} from '../../redux/actions/xhr';
import {setOrder, setTotal} from '../../redux/reducers/app';
import {useTranslation} from 'react-i18next';

export default function CartDiscountForm() {
	const dispatch = useAppDispatch();
	const api = useAppSelector((state: RootState) => state.app.api);
	const orderId = useAppSelector((state: RootState) => state.app.order?.id);
	const {t} = useTranslation();

	const onSubmit = (values: IDiscountFormValues, {setSubmitting, setErrors}: FormikHelpers<IDiscountFormValues>) => {
		if (!api || !orderId) return;

		const promise = api.checkout.addDiscountCode(orderId, values.code)
			.then(({order, total}) => {
				dispatch(setOrder(order));
				dispatch(setTotal(total));
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
							<InputLabel htmlFor="discount-code-input">{t('cart.discountForm.code')}</InputLabel>
							<Input
								id="discount-code-input"
								type={'text'}
								fullWidth
								endAdornment={<InputAdornment position="end">
									<Button
										type='submit'
										disabled={formikProps.isSubmitting}
									>
										{t('cart.discountForm.apply')}
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
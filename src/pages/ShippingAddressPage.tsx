import React, {useEffect, useState} from 'react';
import {Link, useNavigate} from 'react-router-dom';
import CheckoutLayout from '../layout/CheckoutLayout';
import useInitCheckoutByCart from '../hooks/initCheckout';
import Loading from '../components/Loading';
import {useAppDispatch, useAppSelector} from '../hooks/redux';
import {ICheckoutShippingPageData} from 'boundless-api-client';
import {addPromise} from '../redux/actions/xhr';
import {Form, Formik} from 'formik';
import {FormControl, FormControlLabel, Radio, RadioGroup} from '@mui/material';
import {fieldAttrs} from '../lib/formUtils';
import AddressFieldset from '../components/AddressFieldset';

export default function ShippingAddressPage() {
	const {isInited} = useInitCheckoutByCart();
	const [shippingPage, setShippingPage] = useState<null | ICheckoutShippingPageData>(null);
	const {api, order} = useAppSelector(state => state.app);
	const dispatch = useAppDispatch();
	const navigate = useNavigate();

	const onSubmit = () => {

	};

	useEffect(() => {
		if (api && order) {
			const promise = api.checkout.getShippingPage(order.id)
				.then((data) => setShippingPage(data))
				;
			dispatch(addPromise(promise));
		}
	}, [api, order]);//eslint-disable-line

	if (!isInited || !shippingPage) {
		return <Loading />;
	}

	console.log(shippingPage);
	return (
		<CheckoutLayout>
			<h1>Delivery method</h1>
			<Formik initialValues={{delivery_id: 0}} onSubmit={onSubmit}>
				{(formikProps) => (
					<Form className={'bdl-shipping-form'}>
						<FormControl component="fieldset" error={fieldAttrs('delivery_id', formikProps).error}>
							<RadioGroup {...fieldAttrs('delivery_method', formikProps)}>
								{shippingPage.options.delivery.map(delivery => (
									<FormControlLabel
										key={delivery.delivery_id}
										value={delivery.delivery_id}
										control={<Radio size='small' />}
										label={delivery.title}
									/>
								))}
							</RadioGroup>
						</FormControl>

						<h2>Shipping address</h2>
						<AddressFieldset formikProps={formikProps} countries={shippingPage.options.country} />
					</Form>
				)}
			</Formik>
			{/* <Link to={'/'}>Go to contact info</Link> */}
		</CheckoutLayout>
	);
}
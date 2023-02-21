import React, {useEffect, useState} from 'react';
import {useNavigate} from 'react-router-dom';
import CheckoutLayout from '../layout/CheckoutLayout';
import useInitCheckoutByCart from '../hooks/initCheckout';
import Loading from '../components/Loading';
import {useAppDispatch, useAppSelector} from '../hooks/redux';
import {IAddress, ICheckoutShippingPageData, IDelivery, IOrder, TAddressType, TShippingAlias} from 'boundless-api-client';
import {addPromise} from '../redux/actions/xhr';
import {Form, Formik, FormikHelpers, FormikProps} from 'formik';
import {Button, Typography} from '@mui/material';
import AddressFieldset, {IAddressFields} from '../components/AddressFieldset';
import {Box} from '@mui/system';
import {apiErrors2Formik} from '../lib/formUtils';
import {setOrder} from '../redux/reducers/app';
import SelectDelivery from '../components/SelectDelivery';
import ExtraErrors from '../components/ExtraErrors';

export default function ShippingAddressPage() {
	const {isInited} = useInitCheckoutByCart();
	const [shippingPage, setShippingPage] = useState<null | ICheckoutShippingPageData>(null);
	const {api, order} = useAppSelector(state => state.app);
	const [loading, setLoading] = useState(false);
	const dispatch = useAppDispatch();
	const [selectedDelivery, setSelectedDelivery] = useState<IDelivery | null>(null);
	const {onSubmit} = useSaveDelivery(selectedDelivery);

	useEffect(() => {
		if (!shippingPage || !order) return;
		const presetDeliveryId = order?.services?.find(service => service.is_delivery)?.serviceDelivery?.delivery_id;

		const delivery = shippingPage.options.delivery.find(el => el.delivery_id === presetDeliveryId);
		if (delivery) setSelectedDelivery(delivery);
	}, [order, shippingPage]);

	useEffect(() => {
		if (api && order && !shippingPage) {
			setLoading(true);
			const promise = api.checkout.getShippingPage(order.id)
				.then((data) => {
					setShippingPage(data);
				})
				.finally(() => setLoading(false))
				;
			dispatch(addPromise(promise));
		}
	}, [api, order]);//eslint-disable-line

	useEffect(() => {
		document.title = 'Checkout: shipping';
	}, []);

	if (!isInited) {
		return <Loading />;
	}

	if (loading || !shippingPage) return (
		<CheckoutLayout>
			<Loading />
		</CheckoutLayout>
	);

	return (
		<CheckoutLayout>
			<Formik initialValues={getFormInitialValues(order, shippingPage?.shippingAddress)} onSubmit={onSubmit}>
				{(formikProps) => (
					<Form className={'bdl-shipping-form'}>
						{Object.keys(formikProps.errors).length > 0 &&
							<ExtraErrors excludedFields={...Object.keys(formikProps.initialValues)} errors={formikProps.errors} />}
						<Typography variant="h5" mb={2}>Delivery method</Typography>
						<Box mb={2}>
							<SelectDelivery
								deliveries={shippingPage.options.delivery}
								setDelivery={setSelectedDelivery}
								formikProps={formikProps}
								selectedDelivery={selectedDelivery}
							/>
						</Box>
						{selectedDelivery && !isPickUpDelivery(selectedDelivery) &&
							<Box className='bdl-shipping-form__address-form' mb={2}>
								<Typography variant="h6">Shipping address</Typography>
								<AddressFieldset
									formikProps={formikProps as unknown as FormikProps<IAddressFields>}
									countries={shippingPage.options.country}
									showPhone
								/>
							</Box>}
						<Box textAlign={'end'}>
							<Button variant="contained"
								type={'submit'}
								disabled={formikProps.isSubmitting || !selectedDelivery}
							>
								Continue to payment
							</Button>
						</Box>
					</Form>
				)}
			</Formik>
		</CheckoutLayout>
	);
}

const isPickUpDelivery = (delivery: IDelivery | null) => {
	return delivery?.shipping?.alias === TShippingAlias.selfPickup;
};

const getFormInitialValues = (order?: IOrder | null, storedAddress?: IAddress | null) => {
	const initialValues: IDeliveryFormValues = {
		delivery_id: 0,
		first_name: '',
		last_name: '',
		company: '',
		city: '',
		country_id: '',
		address_line_1: '',
		address_line_2: '',
		state: '',
		zip: '',
		phone: ''
	};

	if (order?.customer) {
		const shippingAddress = order.customer.addresses?.find(({type}) => type === TAddressType.shipping);
		if (shippingAddress) {
			Object.assign(initialValues, {
				first_name: shippingAddress.first_name,
				last_name: shippingAddress.last_name,
				company: shippingAddress.company,
				address_line_1: shippingAddress.address_line_1,
				address_line_2: shippingAddress.address_line_2,
				city: shippingAddress.city,
				state: shippingAddress.state,
				country_id: shippingAddress.country_id,
				zip: shippingAddress.zip,
				phone: shippingAddress.phone
			});
		}

		if (order.services?.length) {
			const delivery = order.services.find(service => service.is_delivery);
			if (delivery?.serviceDelivery?.delivery_id)
				Object.assign(initialValues, {
					delivery_id: delivery?.serviceDelivery?.delivery_id,
				});
		}
	}

	if (storedAddress) {
		Object.assign(initialValues, {
			first_name: storedAddress.first_name,
			last_name: storedAddress.last_name,
			company: storedAddress.company,
			address_line_1: storedAddress.address_line_1,
			address_line_2: storedAddress.address_line_2,
			city: storedAddress.city,
			state: storedAddress.state,
			country_id: storedAddress.country_id,
			zip: storedAddress.zip,
			phone: storedAddress.phone
		});
	}

	return initialValues;
};

const useSaveDelivery = (selectedDelivery: IDelivery | null) => {
	const {api, order} = useAppSelector(state => state.app);
	const dispatch = useAppDispatch();
	const navigate = useNavigate();

	const onSubmit = (values: IDeliveryFormValues, {setSubmitting, setErrors}: FormikHelpers<IDeliveryFormValues>) => {
		if (!api || !order) return;
		const {delivery_id, ...restValues} = values;

		const promise = Promise.resolve()
			.then(() => {
				if (!isPickUpDelivery(selectedDelivery)) return api.checkout.setShippingAddress({order_id: order?.id, ...restValues});
				return;
			})
			.then(() => api.checkout.setDeliveryMethod(order?.id, +delivery_id))
			.then(({order}) => {
				if (order) dispatch(setOrder(order));
				navigate('/payment');
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

export interface IDeliveryFormValues {
	delivery_id: number;
	// payment_address_the_same?: boolean;
	first_name?: string;
	last_name: string;
	company?: string;
	address_line_1: string;
	address_line_2?: string;
	city: string;
	state?: string;
	country_id: number|string;
	zip: string;
	phone?: string;
}

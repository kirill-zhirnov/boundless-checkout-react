import React from 'react';
import {FormControl, FormControlLabel, Radio, RadioGroup} from '@mui/material';
import {IDelivery, TShippingAlias} from 'boundless-api-client';
import currency from 'currency.js';
import {IDeliveryFormValues} from '../pages/ShippingAddressPage';
import {FormikHandlers, FormikProps} from 'formik';
import {useAppSelector} from '../hooks/redux';
import StoreMallDirectoryIcon from '@mui/icons-material/StoreMallDirectory';

export default function SelectDelivery({formikProps, deliveries, setDelivery, selectedDelivery}: SelectDeliveryProps) {
	const handleSelectDelivery = (onChange: FormikHandlers['handleChange'], e: React.ChangeEvent<HTMLInputElement>) => {
		if (!e.target.checked || !deliveries.length) return;

		const delivery = deliveries.find(el => el.delivery_id === +e.target.value);
		if (delivery) setDelivery(delivery);
		onChange(e);
	};

	return (
		<FormControl component="fieldset" error={Boolean('delivery_id' in formikProps.errors)}>
			<RadioGroup name='delivery_id' onChange={handleSelectDelivery.bind(null, formikProps.handleChange)} value={formikProps.values.delivery_id}>
				{deliveries.map(delivery => (
					<React.Fragment key={delivery.delivery_id}>
						<FormControlLabel
							value={delivery.delivery_id}
							control={<Radio size='small' required />}
							label={getDeliveryTitle(delivery)}
						/>
						{selectedDelivery?.delivery_id === delivery.delivery_id &&
							<div className='bdl-shipping-form__shipping-details'>
								<DeliveryDetails delivery={delivery} />
							</div>}
					</React.Fragment>
				))}
			</RadioGroup>
		</FormControl>
	);
}

const getDeliveryTitle = (delivery: IDelivery) => {
	const price = delivery.shipping_config?.price;

	return (
		<>
			{delivery.title}
			<small className='bdl-shipping-form__price'>
				{price ? currency(price).format() : 'Free'} {/* FIXME formatMoney */}
			</small>
		</>
	);
};

const DeliveryDetails = ({delivery}: {delivery: IDelivery}) => {
	const api = useAppSelector(state => state.app.api);
	if (!api) return null;

	const getImgThumb = (img: string) => api!.makeThumb({
		imgLocalPath: img,
		maxSize: 50
	}).getSrc();

	if (delivery.shipping?.alias === TShippingAlias.selfPickup && delivery.shipping_config?.address) return (
		<>
			<StoreMallDirectoryIcon className='bdl-shipping-form__shipping-img' fontSize='large'/>
			<div dangerouslySetInnerHTML={{__html: delivery.shipping_config?.address}} />
		</>
	);

	if (delivery.description || delivery.img) return (
		<>
			{delivery.img && <img className='bdl-shipping-form__shipping-img' src={getImgThumb(delivery.img)} />}
			{delivery.description && <div dangerouslySetInnerHTML={{__html: delivery.description}} />}
		</>
	);

	return null;
};

interface SelectDeliveryProps {
	formikProps: FormikProps<IDeliveryFormValues>,
	deliveries: IDelivery[];
	setDelivery: React.Dispatch<React.SetStateAction<IDelivery | null>>
	selectedDelivery: IDelivery | null;
}
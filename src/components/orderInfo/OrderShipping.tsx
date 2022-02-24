import {Grid} from '@mui/material';
import React, {useMemo} from 'react';
import {IAddress, ICustomer, IOrderService, TAddressType} from 'boundless-api-client';
import {formatMoney} from '../../lib/formatter';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';

export default function OrderShipping({services, customer}: {services: IOrderService[], customer: ICustomer | null}) {
	const delivery = useMemo(() => services.find(service => service.is_delivery), [services]);
	const shippingAddress = useMemo(() =>
		customer?.addresses?.find(address => address.type === TAddressType.shipping) || null
		, [customer]);

	if (!delivery) return null;

	return (
		<div className='bdl-order-items__service-row'>
			<h5 className='bdl-order-items__service-heading'>
				<LocalShippingIcon className='bdl-order-items__service-ico' fontSize='small' />
				Shipping
			</h5>
			<Grid container>
				<Grid item sm={8} xs={12} className='bdl-order-items__service-cell bdl-order-items__service-cell_title'>
					<div>{delivery.serviceDelivery?.delivery?.title || ''}</div>
					{shippingAddress && <ShippingAddress address={shippingAddress} />}
				</Grid>
				<Grid item sm={2} xs={12} className='bdl-order-items__service-cell'>
				</Grid>
				<Grid item sm={2} xs={12} className='bdl-order-items__service-cell'>
					<span className='bdl-order-items__label'>Shipping total: </span>
					<span className='bdl-order-items__value'>{formatMoney(delivery.total_price || '')}</span>
				</Grid>
			</Grid>
		</div>
	);
}

const ShippingAddress = ({address}: {address: IAddress}) => {
	const fullName = [address.first_name || '', address.last_name || ''].join(' ').trim();
	const cityCountry = [
		address.city,
		address.state,
		address.country_id,
		address.zip,
	].filter(el => el).join(', ');

	return (
		<>
			<p className='bdl-order-items__address-heading'>Ship to:</p>
			<address className='bdl-order-items__address'>
				{fullName && <p className='bdl-order-items__address-lane'>{fullName}</p>}
				{address.address_line_1 && <p className='bdl-order-items__address-lane'>{address.address_line_1}</p>}
				{address.address_line_2 && <p className='bdl-order-items__address-lane'>{address.address_line_2}</p>}
				{cityCountry && <p className='bdl-order-items__address-lane'>{cityCountry}</p>}
				{address.company && <p className='bdl-order-items__address-lane'>{address.company}</p>}
				{address.phone && <p className='bdl-order-items__address-lane'><abbr title="Phone">P:</abbr>{address.phone}</p>}
			</address>
		</>
	);
};
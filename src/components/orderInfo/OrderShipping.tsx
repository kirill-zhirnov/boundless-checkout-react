import {Grid} from '@mui/material';
import React, {useMemo} from 'react';
import {IOrderService} from 'boundless-api-client';
import {formatMoney} from '../../lib/formatter';

export default function OrderShipping({services}: {services: IOrderService[]}) {
	const delivery = useMemo(() => services.find(service => service.is_delivery), [services]);

	if (!delivery) return null;

	return (
		<div className='bdl-order-shipping'>
			<Grid container>
				<Grid item md={8} sm={12} className='bdl-order-items__total-cell bdl-order-items__total-cell_title'>
					{delivery.serviceDelivery?.delivery?.title || ''}
				</Grid>
				<Grid item md={2} sm={12} className='bdl-order-items__total-cell'>
				</Grid>
				<Grid item md={2} sm={12} className='bdl-order-items__total-cell'>
					<span className='bdl-order-items__label'>Total discount: </span>
					{formatMoney(delivery.total_price || '')}
				</Grid>
			</Grid>
		</div>
	);
}
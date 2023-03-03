import React from 'react';
import {IDetailedOrder} from 'boundless-api-client';
import useFormatCurrency from '../../hooks/useFormatCurrency';
import {useAppSelector} from '../../hooks/redux';
import {Grid} from '@mui/material';

export default function OrderTaxes({order}: {order: IDetailedOrder}) {
	const {formatCurrency} = useFormatCurrency();
	const taxSettings = useAppSelector((state) => state.app.taxSettings);

	return (
		<div className='bdl-order-items__service-row'>
			<h5 className='bdl-order-items__service-heading'>
				{taxSettings && taxSettings.taxTitle}
			</h5>
			<Grid container style={{justifyContent: 'flex-end'}}>
				<Grid item sm={2} xs={12} className='bdl-order-items__service-cell'>
					{order.tax_amount && formatCurrency(order.tax_amount)}
				</Grid>
			</Grid>
		</div>
	);
}
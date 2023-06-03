import {Grid} from '@mui/material';
import React from 'react';
import useFormatCurrency from '../../hooks/useFormatCurrency';
import {useTranslation} from 'react-i18next';

export default function OrderTotalRow({price, qty, isSubTotal}: {price: string|number, qty: string|number, isSubTotal?: boolean}) {
	const {formatCurrency} = useFormatCurrency();
	const {t} = useTranslation();

	return (
		<Grid container className='bdl-order-items__total-row'>
			<Grid item sm={8} xs={12} className='bdl-order-items__total-cell bdl-order-items__total-cell_title'>
				{isSubTotal ? t('orderInfo.totalRow.titleSubTotal') : t('orderInfo.totalRow.titleTotal')}
			</Grid>
			<Grid item sm={2} xs={12} className='bdl-order-items__total-cell'>
				<span className='bdl-order-items__label'>{t('orderInfo.totalRow.qty')} </span>
				<span className='bdl-order-items__value'>{qty}</span>
			</Grid>
			<Grid item sm={2} xs={12} className='bdl-order-items__total-cell'>
				<span className='bdl-order-items__label'>{t('orderInfo.totalRow.price')} </span>
				<span className='bdl-order-items__value'>{formatCurrency(price)}</span>
			</Grid>
		</Grid>
	);
}
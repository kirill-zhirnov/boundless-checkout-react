import React from 'react';
import {Grid} from '@mui/material';
import {IDetailedOrder, IOrderDiscount, TDiscountType} from 'boundless-api-client';
import PercentIcon from '@mui/icons-material/Percent';
import useFormatCurrency from '../../hooks/useFormatCurrency';
import {useTranslation} from 'react-i18next';

export default function OrderDiscounts({order}: {order: IDetailedOrder}) {
	const {formatCurrency} = useFormatCurrency();
	const discounts = order.discounts;
	const {t} = useTranslation();

	if (!discounts.length) return null;

	const getDiscountTitleWithAmount = (discount: IOrderDiscount) => {
		if (discount.discount_type === TDiscountType.percent) return `${discount.title} (${discounts[0].value}%)`;

		return discount.title;
	};

	return (
		<div className='bdl-order-items__service-row'>
			<h5 className='bdl-order-items__service-heading'>
				<PercentIcon className='bdl-order-items__service-ico' fontSize='small' />
				{t('orderInfo.discounts.title')}
			</h5>
			<Grid container>
				<Grid item sm={8} xs={12} className='bdl-order-items__service-cell bdl-order-items__service-cell_title'>
					{discounts.map(discount => (
						<div key={discount.discount_id}>{getDiscountTitleWithAmount(discount)}</div>
					))}
				</Grid>
				<Grid item sm={2} xs={12} className='bdl-order-items__service-cell'>
				</Grid>
				<Grid item sm={2} xs={12} className='bdl-order-items__service-cell'>
					<span className='bdl-order-items__label'>{t('orderInfo.discounts.total')} </span>
					{order.discount_for_order &&
					<span className='bdl-order-items__value'>
						-{formatCurrency(order.discount_for_order)}
					</span>
					}
				</Grid>
			</Grid>
		</div>
	);
}
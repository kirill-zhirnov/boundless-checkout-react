import {Grid} from '@mui/material';
import {IOrderDiscount, TDiscountType} from 'boundless-api-client';
import React from 'react';
import {IOrderTotal} from '../../lib/calculator';
import {formatMoney} from '../../lib/formatter';
import PercentIcon from '@mui/icons-material/Percent';

export default function OrderDiscounts({discounts, total}: {discounts: IOrderDiscount[], total: IOrderTotal}) {
	if (!discounts.length) return null;

	const getDiscountTitleWithAmount = (discount: IOrderDiscount) => {
		if (discount.discount_type === TDiscountType.percent) return `${discount.title} (${discounts[0].value}%)`;

		return discount.title;
	};

	return (
		<div className='bdl-order-items__service-row'>
			<h5 className='bdl-order-items__service-heading'>
				<PercentIcon className='bdl-order-items__service-ico' fontSize='small' />
				Discounts
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
					<span className='bdl-order-items__label'>Total discount: </span>
					<span className='bdl-order-items__value'>-{formatMoney(total?.discount_for_order || '')}</span>
				</Grid>
			</Grid>
		</div>
	);
}
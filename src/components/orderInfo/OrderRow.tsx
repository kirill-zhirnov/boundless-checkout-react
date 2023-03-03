import React from 'react';
import {IOrderItem} from 'boundless-api-client';
import currency from 'currency.js';
import {Grid} from '@mui/material';
import {getProductImg} from '../../lib/images';
import {useAppSelector} from '../../hooks/redux';
import useFormatCurrency from '../../hooks/useFormatCurrency';

export default function OrderRow({item}: {item: IOrderItem}) {
	const api = useAppSelector((state) => state.app.api);
	const {formatCurrency} = useFormatCurrency();

	return (
		<>
			<Grid className='bdl-order-item' container>
				<Grid item className='bdl-order-item__description-col' sm={6} xs={12}>
					{(item.vwItem.image && api)
						? <div className='bdl-order-item__img'>
							<img {...getProductImg(api, item.vwItem.image, 200)} />
						</div>
						: <div className='bdl-order-item__img no-image' />}
					<div className='bdl-order-item__title'>
						<div className='bdl-order-item__title-row'>{item.vwItem?.product?.title || ''}</div>
						{item.vwItem.type === 'variant' && <div className='bdl-order-item__title-row bdl-order-item__title-row_muted'>{item.vwItem?.variant?.title || ''}</div>}
						{(item.vwItem.product?.sku || item.vwItem.variant?.sku) && <div className='bdl-order-item__title-row bdl-order-item__title-row_muted'>
							SKU: {item.vwItem.variant?.sku || item.vwItem.product?.sku}
						</div>}
					</div>
				</Grid>
				<Grid item className='bdl-order-item__col' sm={2} xs={12}>
					<span className='bdl-order-items__label'><strong>Price: </strong></span>
					<span className='bdl-order-items__value'>
						{item.itemPrice.final_price !== null && formatCurrency(item.itemPrice.final_price)}
					</span>
				</Grid>
				<Grid item className='bdl-order-item__col' sm={2} xs={12}>
					<span className='bdl-order-items__label'><strong>Qty: </strong></span>
					<span className='bdl-order-items__value'>{item.qty}</span>
				</Grid>
				<Grid item className='bdl-order-item__col' sm={2} xs={12}>
					<span className='bdl-order-items__label'><strong>Total: </strong></span>
					<span className='bdl-order-items__value'>
						{item.itemPrice.final_price !== null && formatCurrency(currency(item.itemPrice.final_price).multiply(item.qty).toString())}
					</span>
				</Grid>
			</Grid>
		</>
	);
}
import React, {useContext} from 'react';
import {IOrderItem} from 'boundless-api-client';
import currency from 'currency.js';
import {Grid} from '@mui/material';
import {getProductImg} from '../../lib/images';
import {ApiContext} from '../../BoundlessOrderInfo';

export default function OrderRow({item}: {item: IOrderItem}) {
	const api = useContext(ApiContext);

	if (!api) return null;

	return (
		<>
			<Grid className='bdl-order-item' container>
				<Grid item className='bdl-order-item__description-col' sm={6} xs={12}>
					{item.vwItem.image
						? <div className='bdl-order-item__img'>
							<img {...getProductImg(api!, item.vwItem.image, 200)} />
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
					<span className='bdl-order-items__value'>{currency(item.itemPrice.final_price || '').format()}</span>
				</Grid>
				<Grid item className='bdl-order-item__col' sm={2} xs={12}>
					<span className='bdl-order-items__label'><strong>Qty: </strong></span>
					<span className='bdl-order-items__value'>{item.qty}</span>
				</Grid>
				<Grid item className='bdl-order-item__col' sm={2} xs={12}>
					<span className='bdl-order-items__label'><strong>Total: </strong></span>
					<span className='bdl-order-items__value'>{currency(item.itemPrice.final_price || '').multiply(item.qty).format()}</span>
				</Grid>
			</Grid>
		</>
	);
}
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
				<Grid item className='bdl-order-item__description-col' md={6} sm={12}>
					{item.vwItem.image
						? <div className='bdl-order-item__img'>
							<img {...getProductImg(api!, item.vwItem.image, 200)} />
						</div>
						: <div className='bdl-order-item__img no-image' />}
					<div className='bdl-order-item__title'>
						<div>
							{item.vwItem?.product?.title || ''}

						</div>
						{item.vwItem.type === 'variant' && <div className='text-muted'>{item.vwItem?.variant?.title || ''}</div>}
					</div>
				</Grid>
				<Grid item className='bdl-order-item__col' md={2} sm={12}>
					<span className='bdl-order-items__label'><strong>Price: </strong></span>
					{currency(item.itemPrice.final_price || '').format()}
				</Grid>
				<Grid item className='bdl-order-item__col bdl-order-item__col_qty' md={2} sm={12}>
					<span className='bdl-order-items__label'><strong>Qty: </strong></span>
					{item.qty}
				</Grid>
				<Grid item className='bdl-order-item__col' md={2} sm={12}>
					<span className='bdl-order-items__label'><strong>Total: </strong></span>
					{currency(item.itemPrice.final_price || '').multiply(item.qty).format()}

				</Grid>
			</Grid>
		</>
	);
}
import React from 'react';
import {useAppSelector} from '../../hooks/redux';
import {formatMoney} from '../../lib/formatter';
import {getProductImg} from '../../lib/images';
import {RootState} from '../../redux/store';

export default function CartItems() {
	const api = useAppSelector((state: RootState) => state.app.api);
	const cartItems = useAppSelector((state: RootState) => state.app.items);

	if (!cartItems?.length) return <div style={{padding: 15, textAlign:'center'}}>Your cart is empty</div>;

	return (
		<ul className='bdl-cart-item__list'>
			{cartItems?.map(item => (
				<li className='bdl-cart-item' key={item.basket_item_id}>
					{item.vwItem.image
						? <div className='bdl-cart-item__img'>
							<img {...getProductImg(api!, item.vwItem.image, 200)} />
						</div>
						: <div className="no-image" />}
					<div className='bdl-cart-item__desc'>
						<h5 className='bdl-cart-item__title'>
							{item.vwItem.product.title}
							{item.vwItem.variant?.title && <>, <span className='bdl-cart-item__variant'>{item.vwItem.variant.title}</span></>}
						</h5>
						<div className='bdl-cart-item__price'>
							{formatMoney(item.itemPrice.final_price)} x {item.qty} pcs
						</div>
						<div className='bdl-cart-item__total'>
							{formatMoney(parseInt(item.itemPrice.final_price || '') * item.qty)}
						</div>
					</div>
				</li>
			))}
		</ul>);
}
import React, {useMemo, useState} from 'react';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import ExpandMore from '@mui/icons-material/ExpandMore';
import ExpandLess from '@mui/icons-material/ExpandLess';
import clsx from 'clsx';
import CartItems from './cart/CartItems';
import {Button, FormControl, Input, InputAdornment, InputLabel} from '@mui/material';
import {useAppSelector} from '../hooks/redux';
import {RootState} from '../redux/store';
import {formatMoney} from '../lib/formatter';
import {calcCartTotal} from '../lib/calculator';
import CartFooter from './cart/CartFooter';

export default function Cart() {
	const [fullOpened, setFullOpened] = useState(false);
	const cartItems = useAppSelector((state: RootState) => state.app.items);
	const order = useAppSelector((state: RootState) => state.app.order);

	const total = useMemo(() => calcCartTotal(cartItems, order), [cartItems, order]);
	// console.log('Order - ', order);

	return (
		<div className='bdl-cart'>
			<div className="bdl-cart__short">
				<a
					href="#"
					className="bdl-cart__show-summary"
					onClick={() => setFullOpened(prev => !prev)}
				>
					<ShoppingCartIcon sx={{fontSize: 16}} />
					{fullOpened
						? <>
							Hide order summary
							<ExpandLess fontSize='small' />
						</>
						: <>
							Show order summary
							<ExpandMore fontSize='small' />
						</>}
				</a>
				<h4 className='bdl-cart__total'>
					{formatMoney(total?.total_price || 0)}
				</h4>
			</div>
			<div className={clsx('bdl-cart__full', {open: fullOpened})}>
				<CartItems />
			</div>
			<form className='bdl-cart__discount'>
				<FormControl fullWidth>
					<InputLabel htmlFor="discount-code-input">Discount code</InputLabel>
					<Input
						id="discount-code-input"
						type={'text'}
						// value={''}
						// onChange={() => { }}
						endAdornment={
							<InputAdornment position="end">
								<Button
									// onClick={() => { }}
								>
									Apply
								</Button>
							</InputAdornment>
						}
					/>
				</FormControl>
			</form>
			{order && <CartFooter order={order} total={total} />}
		</div >
	);
}
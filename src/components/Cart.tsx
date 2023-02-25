import React, {useState} from 'react';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import ExpandMore from '@mui/icons-material/ExpandMore';
import ExpandLess from '@mui/icons-material/ExpandLess';
import clsx from 'clsx';
import CartItems from './cart/CartItems';
import {useAppSelector} from '../hooks/redux';
import {RootState} from '../redux/store';
import {formatMoney} from '../lib/formatter';
import CartFooter from './cart/CartFooter';
import CartDiscountForm from './cart/CartDiscountForm';
import useFormatCurrency from '../hooks/useFormatCurrency';

export default function Cart() {
	const order = useAppSelector((state: RootState) => state.app.order);
	const total = useAppSelector((state: RootState) => state.app.total);
	const [fullOpened, setFullOpened] = useState(false);
	const {formatCurrency} = useFormatCurrency();

	const hasCouponCampaigns = useAppSelector((state: RootState) => state.app.hasCouponCampaigns);
	const hasDisounts = order?.discounts && order?.discounts?.length > 0;

	const toggleCollapse = (e: React.MouseEvent) => {
		e.preventDefault();
		setFullOpened(prev => !prev);
	};

	return (
		<div className='bdl-cart'>
			<div className="bdl-cart__short">
				<a
					href="#"
					className="bdl-cart__show-summary"
					onClick={toggleCollapse}
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
					<>
						{total && formatMoney(total.price)}
						<br/>
						{total && formatCurrency(total.price)}
					</>
				</h4>
			</div>
			<div className={clsx('bdl-cart__full', {open: fullOpened})}>
				<CartItems />
			</div>
			{hasCouponCampaigns && !hasDisounts && <div className='bdl-cart__discount'>
				<CartDiscountForm />
			</div>}
			<CartFooter open={fullOpened} />
		</div >
	);
}
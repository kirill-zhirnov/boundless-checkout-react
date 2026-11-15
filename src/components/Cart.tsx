import React, {useState} from "react";
import ShoppingCartIcon from "@mui/icons-material/ShoppingCart";
import ExpandMore from "@mui/icons-material/ExpandMore";
import ExpandLess from "@mui/icons-material/ExpandLess";
import clsx from "clsx";
import CartItems from "./cart/CartItems";
import CartFooter from "./cart/CartFooter";
import CartDiscountForm from "./cart/CartDiscountForm";
import useFormatCurrency from "../hooks/useFormatCurrency";
import {useTranslation} from "react-i18next";
import FreeShippingBanner from "./FreeShippingBanner";
import {hasShipping} from "../lib/shipping";
import {getCheckoutData} from "../hooks/checkoutData";

export default function Cart() {
	const {order, total} = getCheckoutData() || {};
	const orderHasShipping = order && hasShipping(order);
	const [fullOpened, setFullOpened] = useState(true);
	const {formatCurrency} = useFormatCurrency();
	const {t} = useTranslation();

	const hasDisounts = order?.discounts && order?.discounts?.length > 0;

	const toggleCollapse = (e: React.MouseEvent) => {
		e.preventDefault();
		setFullOpened((prev) => !prev);
	};

	return (
		<div className="bdl-cart">
			<div className="bdl-cart__short">
				<a href="#" className="bdl-cart__show-summary" onClick={toggleCollapse}>
					<ShoppingCartIcon sx={{fontSize: 16}} />
					{fullOpened ? (
						<>
							{t("cart.hideOrderSummary")}
							<ExpandLess fontSize="small" />
						</>
					) : (
						<>
							{t("cart.showOrderSummary")}
							<ExpandMore fontSize="small" />
						</>
					)}
				</a>
				<h4 className="bdl-cart__total">
					{total && formatCurrency(total.price ?? 0)}
				</h4>
			</div>
			<div className={clsx("bdl-cart__full", {open: fullOpened})}>
				{orderHasShipping && <FreeShippingBanner />}
				<CartItems />
			</div>
			{!hasDisounts && order?.customer && (
				<div className="bdl-cart__discount">
					<CartDiscountForm />
				</div>
			)}
			<CartFooter open={fullOpened} />
		</div>
	);
}

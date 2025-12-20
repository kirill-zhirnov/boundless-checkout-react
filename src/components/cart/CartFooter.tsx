import React, { useEffect, useState } from "react";
import clsx from "clsx";
import useFormatCurrency from "../../hooks/useFormatCurrency";
import { useTranslation } from "react-i18next";
import { hasShipping } from "../../lib/shipping";
import { getCheckoutData } from "../../hooks/checkoutData";
import { getCartOrRetrieve } from "../../hooks/getCartOrRetrieve";

export default function CartFooter({ open }: ICartFooterProps) {
	let { order, total } = getCheckoutData() || {};
	const cart = getCartOrRetrieve();
	
	const { formatCurrency } = useFormatCurrency();
	const { t } = useTranslation();
	const [totalPrice, setTotalPrice] = useState(0);
	const [totalTaxAmount, setTotalTaxAmount] = useState(0);

	useEffect(() => {
		if (total) {
			const totalTaxAmount = total.tax.totalTaxAmount;
			const servicesSubTotal = Number(total.servicesSubTotal.price) || 0;
			const itemsSubTotal = Number(total.itemsSubTotal.price) || 0;
			const tax = Number(totalTaxAmount) || 0;

			setTotalPrice(servicesSubTotal + itemsSubTotal + tax);
			setTotalTaxAmount(Number(totalTaxAmount));
		} else {
			const cartTotal = Number(cart?.total?.total || 0);
			const cartTaxAmount = Number(cart?.taxAmount || 0);
			setTotalPrice(cartTotal + cartTaxAmount);
			setTotalTaxAmount(cartTaxAmount);
		}
	}, [total, cart]);

	const getDiscountAmount = () => {
		if (!order?.discounts || !order?.discounts.length) return "";
		const discount = order.discounts[0];
		if (discount.discount_type === "percent") {
			const discountPercent = discount.value;
			return ` (${discountPercent}%)`;
		}

		return "";
	};
	// 	e.preventDefault();
	// 	if (
	// 		!window.confirm(t("form.areYouSure") as string) ||
	// 		!order?.id ||
	// 		submitting
	// 	)
	// 		return;

	// 	setSubmitting(true);

	// 	const promise = api.checkout
	// 		.clearDiscounts(order.id)
	// 		.then(({ order, total }) => {
	// 			dispatch(setOrder(order));
	// 			dispatch(setTotal(total));
	// 		})
	// 		.catch((err) => console.error(err))
	// 		.finally(() => setSubmitting(false));

	// 	dispatch(addPromise(promise));
	// };

	const hasDiscount = total && total.discount != "0";
	const orderHasShipping = order && hasShipping(order);
	const isDelivery = order?.services?.[0]?.serviceDelivery?.delivery?.title === "Delivery";

	return (
		<div className={clsx("bdl-cart__footer", { open })}>
			{hasDiscount && (
				<div className="bdl-cart__footer-row">
					<h5 className="bdl-cart__footer-title">
						{t("cart.footer.couponTitle", { amount: getDiscountAmount() })}
						<span className="bdl-cart__footer-value">
							{" "}-{formatCurrency(total?.discount)}
						</span>
					</h5>
				</div>
			)}
			{total && (
				<div className="bdl-cart__footer-row">
					<h5 className="bdl-cart__footer-title">
						{t("cart.footer.subTotal")}
						<span className="bdl-cart__footer-value">
							{" "}
							{formatCurrency(total.itemsSubTotal.price)}
						</span>
					</h5>
				</div>
			)}
			{orderHasShipping && total && (
				<div className="bdl-cart__footer-row">
					<h5 className="bdl-cart__footer-title">
						{isDelivery ? t("cart.footer.delivery") : t("cart.footer.shipping")}
						<span className="bdl-cart__footer-value">
							{Number(total.itemsSubTotal.price) >= 100 ? (
								<>
									<span style={{ textDecoration: 'line-through', color: '#999' }}>
										{formatCurrency(isDelivery ? "4.00" : "0.00")}
									</span>
									<span style={{ color: '#4a7c4d', fontWeight: 'bold', marginLeft: '8px' }}>
										FREE
									</span>
								</>
							) : (
								` ${formatCurrency(total.servicesSubTotal.price)}`
							)}
						</span>
					</h5>
				</div>
			)}

			<div className="bdl-cart__footer-row">
				<h5 className="bdl-cart__footer-title">
					Tax:
					<span className="bdl-cart__footer-value">
						{" "}{formatCurrency(totalTaxAmount ?? 0)}
					</span>
				</h5>
			</div>
			<h4 className="bdl-cart__footer-row bdl-cart__footer-row_total">
				{t("cart.footer.total")}{" "}
				<span className="bdl-cart__footer-value">
					{formatCurrency(totalPrice)}
				</span>
			</h4>
		</div>
	);
}

interface ICartFooterProps {
	open: boolean;
}

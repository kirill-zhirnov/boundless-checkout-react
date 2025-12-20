import React, { useEffect, useState } from "react";
import CheckoutLayout from "../layout/CheckoutLayout";
import useInitCheckoutByCart from "../hooks/initCheckout";
import Loading from "../components/Loading";
import { useAppSelector } from "../hooks/redux";
import { ICheckoutShippingPageData, TCheckoutStep } from "boundless-api-client";
import ShippingForm from "./shippingPage/ShippingForm";
import { useTranslation } from "react-i18next";
import {
	DELIVERY_INFO,
	SELF_PICKUP_INFO,
	SHIPPING_DELIVERY_INFO,
} from "../constants";
import { cartHasTickets } from "../lib/products";
import { useNavigate } from 'react-router';

const useInitShippingPage = () => {
	const { isInited } = useInitCheckoutByCart();
	const [shippingPage, setShippingPage] =
		useState<null | ICheckoutShippingPageData>(null);
	const { order } = useAppSelector((state) => state.app);
	const cartItems = useAppSelector((state) => state.app.items);
	const { stepper } = useAppSelector((state) => state.app);
	const navigate = useNavigate();

	const cartItemHasTickets = cartHasTickets();
	const clonesInCart = cartItems?.some(
		(item) => item.product.ClassificationName === "Clones"
	);

	const showAllDeliveryOptions =
		(!clonesInCart && !cartItemHasTickets) ||
		(cartItems && cartItems.length > 1);

	const options = [SELF_PICKUP_INFO];
	if (showAllDeliveryOptions) {
		options.push(DELIVERY_INFO, SHIPPING_DELIVERY_INFO);
	}

	useEffect(() => {
		if (stepper && !stepper.filledSteps.includes(TCheckoutStep.contactInfo)) {
			navigate('/info');
		}
	}, [stepper, navigate]);

	useEffect(() => {
		if (order && !shippingPage) {
			if (order.customer) {
				const shippingPageData = {
					shippingAddress:
						order.customer.addresses.find(
							(address) => address.type === "shipping"
						) || null,
					billingAddress:
						order.customer.addresses.find(
							(address) => address.type === "billing"
						) || null,
					billingAddressTheSame: false,
					options: {
						country: [
							{
								country_id: 0,
								code: "CA",
								title: "Canada",
							},
						],
						delivery: options,
					},
					person: order.customer as any,
					orderServiceDelivery: null,
				};
				setShippingPage(shippingPageData);
			}
		}
	}, [order, options]); //eslint-disable-line

	return {
		isInited,
		shippingPage,
	};
};

export default function ShippingPage() {
	const { isInited, shippingPage } = useInitShippingPage();
	const { t } = useTranslation();

	useEffect(() => {
		document.title = t("shippingForm.pageTitle");
	}, []); //eslint-disable-line

	if (!isInited) {
		return <Loading />;
	}

	return (
		<CheckoutLayout>
			{shippingPage ? (
				<ShippingForm shippingPage={shippingPage} />
			) : (
				<Loading />
			)}
		</CheckoutLayout>
	);
}

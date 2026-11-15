import {useEffect, useState} from "react";
import CheckoutLayout from "../layout/CheckoutLayout";
import useInitCheckoutByCart from "../hooks/initCheckout";
import Loading from "../components/Loading";
import {useAppDispatch, useAppSelector} from "../hooks/redux";
import {ICheckoutShippingPageData, TAddressType} from "../types/shippingForm";
import ShippingForm from "./shippingPage/ShippingForm";
import {useTranslation} from "react-i18next";
import {
	DELIVERY_INFO,
	SELF_PICKUP_INFO,
	SHIPPING_DELIVERY_INFO,
} from "../constants";
import {useCartHasTickets} from "../lib/products";
import {getVancouverDateTime} from "../lib/deliveryTimes";
import {setCurrentStep, setStepWarning} from "../redux/reducers/app";
import {TCheckoutStep} from "../types/common";
import {
	getCheckoutStepWarning,
	isContactStepComplete,
} from "../lib/checkoutGuards";

const useInitShippingPage = () => {
	const {isInited} = useInitCheckoutByCart();

	const [shippingPage, setShippingPage] =
		useState<null | ICheckoutShippingPageData>(null);

	const {order} = useAppSelector((state) => state.app);
	const cartItems = useAppSelector((state) => state.app.items);
	const dispatch = useAppDispatch();

	const cartItemHasTickets = useCartHasTickets();

	const clonesInCart = cartItems?.some(
		(item) => item.product.ClassificationName === "Clones"
	);

	const showAllDeliveryOptions =
		(!clonesInCart && !cartItemHasTickets) ||
		(cartItems && cartItems.length > 1);

	const {month, day} = getVancouverDateTime();
	const isMarchFourteenth = month === 3 && day === 14;

	const deliveryOptions = [SELF_PICKUP_INFO];

	if (showAllDeliveryOptions) {
		if (!isMarchFourteenth) {
			deliveryOptions.push(DELIVERY_INFO);
		}

		deliveryOptions.push(SHIPPING_DELIVERY_INFO);
	}

	useEffect(() => {
		if (isInited && order && !isContactStepComplete(order)) {
			dispatch(setCurrentStep(TCheckoutStep.contactInfo));
			dispatch(setStepWarning(getCheckoutStepWarning(TCheckoutStep.contactInfo)));
		}
	}, [isInited, order, dispatch]);

	useEffect(() => {
		if (order && !shippingPage) {
			if (order.customer) {
				const shippingPageData = {
					shippingAddress:
						order.customer.addresses.find(
							(address) => address.type === TAddressType.shipping
						) || null,
					billingAddress:
						order.customer.addresses.find(
							(address) => address.type === TAddressType.billing
						) || null,
					options: {delivery: deliveryOptions},
				};

				setShippingPage(shippingPageData);
			}
		}
	}, [order, deliveryOptions]); //eslint-disable-line

	return {
		isInited,
		shippingPage,
	};
};

export default function ShippingPage() {
	const {isInited, shippingPage} = useInitShippingPage();
	const {t} = useTranslation();

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

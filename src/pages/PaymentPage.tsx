import React, {useEffect, useState} from "react";
import CheckoutLayout from "../layout/CheckoutLayout";
import {useAppDispatch, useAppSelector} from "../hooks/redux";
import useInitCheckoutByCart from "../hooks/initCheckout";
import Loading from "../components/Loading";
import PaymentMethodForm from "./paymentPage/PaymentMethodForm";
import type {IPaymentPageData} from "./paymentPage/types";
import type {IPaymentMethod} from "../types/Order";
import {useTranslation} from "react-i18next";
import {
	CREDIT_CARD_PAYMENT_METHOD,
	PAY_IN_STORE_PAYMENT_METHOD,
} from "../constants";
import {useCartHasTickets} from "../lib/products";
import {getCheckoutData} from "../hooks/checkoutData";
import {setCurrentStep, setStepWarning} from "../redux/reducers/app";
import {TCheckoutStep} from "../types/common";
import {
	getCheckoutStepWarning,
	getFirstIncompleteCheckoutStep,
} from "../lib/checkoutGuards";

export default function PaymentPage() {
	const {isInited, paymentPage} = useInitPaymentPage();
	const {t} = useTranslation();

	useEffect(() => {
		document.title = t("paymentMethodForm.pageTitle");
	}, []); //eslint-disable-line

	if (!isInited) {
		return <Loading />;
	}

	return (
		<CheckoutLayout>
			{paymentPage ? (
				<PaymentMethodForm paymentPage={paymentPage} />
			) : (
				<Loading />
			)}
		</CheckoutLayout>
	);
}

const useInitPaymentPage = () => {
	const {isInited} = useInitCheckoutByCart();
	const {order, stepper} = useAppSelector((state) => state.app);
	const dispatch = useAppDispatch();
	const checkoutData = getCheckoutData();
	const hasCheckoutData = Boolean(checkoutData);
	const [paymentPage, setPaymentPage] = useState<IPaymentPageData | null>(null);
	const cartItemHasTickets = useCartHasTickets();

	useEffect(() => {
		if (!checkoutData) {
			dispatch(setCurrentStep(TCheckoutStep.contactInfo));
			dispatch(setStepWarning(getCheckoutStepWarning(TCheckoutStep.contactInfo)));
		}
	}, [checkoutData, dispatch]);

	useEffect(() => {
		if (isInited && order && !paymentPage) {
			const paymentPageData = {
				paymentMethods: [
					{
						payment_method_id: CREDIT_CARD_PAYMENT_METHOD,
						title: "Credit Card",
					},
				] as IPaymentMethod[],
			} as IPaymentPageData;

			if (
				!cartItemHasTickets &&
				order.services?.find(
					(service) => service.serviceDelivery?.title === "Self Pickup"
				)
			) {
				paymentPageData.paymentMethods.push({
					payment_method_id: PAY_IN_STORE_PAYMENT_METHOD,
					title: "Pay in store",
				});
			}

			setPaymentPage(paymentPageData);
		}
	}, [isInited, order, dispatch]); //eslint-disable-line

	useEffect(() => {
		if (!isInited || !stepper || !hasCheckoutData) return;

		const firstIncompleteStep = getFirstIncompleteCheckoutStep(order, stepper);

		if (firstIncompleteStep) {
			dispatch(setCurrentStep(firstIncompleteStep));
			dispatch(setStepWarning(getCheckoutStepWarning(firstIncompleteStep)));
		}
	}, [isInited, order, stepper, hasCheckoutData, dispatch]);

	return {
		isInited,
		paymentPage,
	};
};

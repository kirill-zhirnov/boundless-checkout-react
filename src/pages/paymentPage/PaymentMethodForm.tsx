import {
	completeCreditCardPaymentOutcome,
	parseLenientAmount,
	PaymentOutcomeError,
	PaymentValidationError,
} from "../../lib/paymentOutcome";
import {useCallback, useEffect, useRef, useState} from "react";
import {Form, Formik, FormikErrors, FormikHelpers, FormikProps} from "formik";
import {
	Typography,
	Radio,
	RadioGroup,
	FormControlLabel,
	FormControl,
	FormHelperText,
	Button,
	Box,
	TextField,
	InputAdornment,
	FormLabel,
	CircularProgress,
	Alert,
} from "@mui/material";
import DoneIcon from "@mui/icons-material/Done";
import {useAppDispatch, useAppSelector} from "../../hooks/redux";
import ExtraErrors from "../../components/ExtraErrors";
import {useTranslation} from "react-i18next";
import type {IPaymentPageData} from "./types";
import type {IPaymentMethod} from "../../types/Order";
import {
	getCheckoutData,
	setLocalStorageCheckoutData,
} from "../../hooks/checkoutData";
import {fieldAttrs} from "../../lib/formUtils";
import {CREDIT_CARD_PAYMENT_METHOD, DELIVERY_ID} from "../../constants";
import {
	setCurrentStep,
	setOrder,
	setStepWarning,
	setTotal,
} from "../../redux/reducers/app";
import {IOrderWithCustmAttr} from "../../types/Order";
import {
	getCheckoutStepWarning,
	getFirstIncompleteCheckoutStep,
} from "../../lib/checkoutGuards";
import {ICheckoutStepper} from "../../types/common";
import {useCartHasTickets} from "../../lib/products";
import {hasDeliveryId, hasShipping} from "../../lib/shipping";
import {scrollCheckoutToTop} from "../../lib/scrollCheckout";
import {useCheckoutConfig} from "../../contexts/CheckoutConfigContext";
import PayHQ, {PayHQHandle} from "./PayHQ/PayHQ";
import {useCreditCardPaymentOutcome} from "../../hooks/useCreditCardPaymentOutcome";

const paymentFormFieldOrder: Array<keyof IPaymentMethodFormValues> = [
	"payment_method_id",
	"tip",
];

const scrollPaymentFormToFirstErrorField = (
	errors: FormikErrors<IPaymentMethodFormValues>,
) => {
	if (typeof document === "undefined") return;

	const firstErrorField = paymentFormFieldOrder.find((field) => Boolean(errors[field]));

	if (!firstErrorField) return;

	const paymentForm = document.querySelector<HTMLElement>(".bdl-payment-form");

	const fieldElement = Array.from(
		(paymentForm ?? document).querySelectorAll<HTMLElement>("[name]"),
	).find((element) => element.getAttribute("name") === firstErrorField);

	fieldElement?.scrollIntoView({behavior: "smooth", block: "center"});
};

const ScrollToFirstFormikSubmitError = ({
	errors,
	submitCount,
}: {
	errors: FormikErrors<IPaymentMethodFormValues>;
	submitCount: number;
}) => {
	const lastHandledSubmitCount = useRef(0);

	useEffect(() => {
		if (submitCount === 0 || submitCount === lastHandledSubmitCount.current) {
			return;
		}

		if (Object.keys(errors).length === 0) {
			return;
		}

		lastHandledSubmitCount.current = submitCount;
		scrollPaymentFormToFirstErrorField(errors);
	}, [errors, submitCount]);

	return null;
};

const makeValidatePaymentForm = (values: IPaymentMethodFormValues) => {
	const errors: Partial<Record<keyof IPaymentMethodFormValues, string>> = {};

	if (!values.payment_method_id || values.payment_method_id === "0") {
		errors.payment_method_id = "Payment method is required";
	}

	if (values.tip && parseFloat(values.tip) < 0) {
		errors.tip = "Tip must be positive";
	}

	return errors;
};

const getPaymentDeliveryContext = (order: IOrderWithCustmAttr | undefined) => ({
	isDelivery: order ? hasDeliveryId(order, DELIVERY_ID) : false,
});

const usePaymentDeliveryContext = () => {
	const {order} = useAppSelector((state) => state.app);

	return getPaymentDeliveryContext(order);
};

const redirectToIncompleteStep = (
	dispatch: ReturnType<typeof useAppDispatch>,
	stepper: ICheckoutStepper | null | undefined,
	order: IOrderWithCustmAttr | undefined,
): boolean => {
	if (!stepper) return false;

	const firstIncompleteStep = getFirstIncompleteCheckoutStep(order, stepper);

	if (!firstIncompleteStep) return false;

	dispatch(setCurrentStep(firstIncompleteStep));
	dispatch(setStepWarning(getCheckoutStepWarning(firstIncompleteStep)));

	return true;
};

export default function PaymentMethodForm({
	paymentPage,
}: {
	paymentPage: IPaymentPageData;
}) {
	const checkoutData = getCheckoutData();
	const order = checkoutData?.order;
	const items = checkoutData?.items;
	const total = checkoutData?.total;
	const stepper = useAppSelector((state) => state.app.stepper);
	const dispatch = useAppDispatch();
	const {onSubmit} = useSavePaymentMethod(paymentPage, stepper);
	const {isDelivery} = usePaymentDeliveryContext();
	const {t} = useTranslation();
	const {recordApprovedPayment} = useCreditCardPaymentOutcome();
	const [isPaymentApproved, setIsPaymentApproved] = useState(false);
	const cartItemHasTickets = useCartHasTickets();
	const payHQRef = useRef<PayHQHandle | null>(null);
	const [isPayHQSubmitting, setIsPayHQSubmitting] = useState(false);

	const handlePaymentApproved = useCallback(
		(paidAt: string, tipAmount?: string) => {
			recordApprovedPayment({paidAt, tip: tipAmount});
			setIsPaymentApproved(true);
		},
		[recordApprovedPayment],
	);

	const paymentMethods = paymentPage.paymentMethods;

	const onlyPaymentMethodIsCreditCard =
		paymentMethods.length === 1 &&
		paymentMethods[0].payment_method_id === CREDIT_CARD_PAYMENT_METHOD;

	return (
		<Formik
			initialValues={getFormInitialValues(order, paymentMethods)}
			onSubmit={onSubmit}
			validateOnChange={false}
			validate={makeValidatePaymentForm}
		>
			{(formikProps) => {
				const {values} = formikProps;
				const selectedPaymentMethodId = values.payment_method_id;

				const isCreditCard =
					selectedPaymentMethodId === CREDIT_CARD_PAYMENT_METHOD;

				const showPayHQ = isCreditCard || onlyPaymentMethodIsCreditCard;

				const submitCreditCardCheckout = async () => {
					if (formikProps.isSubmitting || isPayHQSubmitting) {
						return;
					}

					formikProps.setStatus(undefined);

					const validationErrors = await formikProps.validateForm();

					if (Object.keys(validationErrors).length > 0) {
						scrollPaymentFormToFirstErrorField(validationErrors);

						return;
					}

					const latestCheckoutData = getCheckoutData();
					const latestOrder = latestCheckoutData?.order;

					if (redirectToIncompleteStep(dispatch, stepper, latestOrder)) {
						return;
					}

					if (latestOrder?.paid_at || isPaymentApproved) {
						await formikProps.submitForm();

						return;
					}

					if (!payHQRef.current) {
						formikProps.setStatus({
							serverError: "Payment module is still loading. Please try again.",
						});

						return;
					}

					setIsPayHQSubmitting(true);

					try {
						const {paidAt} = await payHQRef.current.submitPayment();

						// Payment approved — card has been charged. Failures here need distinct handling.
						try {
							handlePaymentApproved(paidAt, values.tip);
						} catch (recordError) {
							console.error("[PaymentMethodForm] Failed to record approved payment", recordError);
							formikProps.setStatus({
								serverError:
									"Your payment was approved but we could not update your order. Please contact support.",
							});
							setIsPayHQSubmitting(false);

							return;
						}

						await formikProps.submitForm();
					} catch (error) {
						if (error instanceof PaymentValidationError) {
							return;
						}

						console.error("[PaymentMethodForm] submitCreditCardCheckout failed", error);

						if (!formikProps.status?.serverError) {
							formikProps.setStatus({
								serverError:
									error instanceof Error
										? error.message
										: "Payment could not be completed. Please try again.",
							});
						}
					} finally {
						setIsPayHQSubmitting(false);
					}
				};

				const creditCardPaymentComplete = Boolean(order?.paid_at || isPaymentApproved);

				const isCheckoutCompletionInProgress = Boolean(
					formikProps.status?.checkoutCompletionInProgress,
				);

				const isSharedButtonBusy =
					formikProps.isSubmitting ||
					isPayHQSubmitting ||
					isCheckoutCompletionInProgress;

				const submitButtonLabel =
					isCreditCard && !creditCardPaymentComplete
						? isPayHQSubmitting
							? "Processing payment..."
							: "Pay and complete order"
						: t("paymentMethodForm.completeOrder");

				return (
					<Form className={"bdl-payment-form"}>
						<ScrollToFirstFormikSubmitError
							errors={formikProps.errors}
							submitCount={formikProps.submitCount}
						/>
						{Object.keys(formikProps.errors).length > 0 && (
							<ExtraErrors
								excludedFields={["payment_method_id"]}
								errors={formikProps.errors}
							/>
						)}
						<Typography variant="h5" sx={{mb: 2}}>
							{t("paymentMethodForm.pageHeader")}
						</Typography>
						{cartItemHasTickets && (
							<Typography variant="body1" sx={{m: 2}}>
								{
									"Please note, due to limited seating, to reserve your seats, we require payment by credit card online OR you can come in store to purchase your tickets in person by credit, cash or debit. Seats must be purchased prior to event date. We look forward to hosting you!"
								}
							</Typography>
						)}
						<PaymentMethods
							order={order}
							formikProps={formikProps}
							paymentMethods={paymentMethods}
							isDelivery={isDelivery}
							setIsPaymentApproved={setIsPaymentApproved}
						/>
						{showPayHQ && (
							<PayHQ
								ref={payHQRef}
								order={order}
								total={total}
								items={items}
								tip={values.tip}
								onPaymentFailed={(error) =>
									formikProps.setStatus({serverError: error})
								}
							/>
						)}
						{formikProps.status?.serverError && (
							<Alert severity="error" sx={{mb: 2}}>
								{formikProps.status.serverError}
							</Alert>
						)}
						<Box textAlign={"end"}>
							<Button
								variant="contained"
								startIcon={
									isSharedButtonBusy ? (
										<CircularProgress size="12px" aria-label="Loading…" />
									) : (
										<DoneIcon />
									)
								}
								type={isCreditCard ? "button" : "submit"}
								onClick={isCreditCard ? submitCreditCardCheckout : undefined}
								disabled={isSharedButtonBusy}
								color="success"
								size="large"
							>
								{submitButtonLabel}
							</Button>
						</Box>
					</Form>
				);
			}}
		</Formik>
	);
}

const getFormInitialValues = (
	order: IOrderWithCustmAttr | undefined,
	paymentMethods: IPaymentMethod[],
) => {
	const paidAt = order?.paid_at;

	const initialValues: IPaymentMethodFormValues = {
		payment_method_id: paidAt
			? CREDIT_CARD_PAYMENT_METHOD
			: order?.payment_method_id
				? order.payment_method_id
				: paymentMethods[0]?.payment_method_id || undefined,
		tip: order?.tip !== "0.00" ? order?.tip : "",
	};

	return initialValues;
};

const PaymentMethods = ({
	formikProps,
	paymentMethods,
	isDelivery,
	setIsPaymentApproved,
	order,
}: {
	formikProps: FormikProps<IPaymentMethodFormValues>;
	paymentMethods: IPaymentMethod[];
	isDelivery: boolean;
	setIsPaymentApproved: (isApproved: boolean) => void;
	order: IOrderWithCustmAttr | undefined;
}) => {
	const orderHasShipping = order ? hasShipping(order) : false;
	const orderPaid = Boolean(order?.paid_at);

	return (
		<Box sx={{mb: 2}}>
			<FormControl
				required
				variant="outlined"
				error={"payment_method_id" in formikProps.errors}
			>
				{!orderHasShipping && (
					<FormLabel
						component="legend"
						sx={{
							color: "#000",
							fontWeight: "600",
							"&.Mui-focused": {
								color: "#000",
							},
						}}
					>
						Select a payment method
					</FormLabel>
				)}
				<RadioGroup
					name="payment_method_id"
					value={formikProps.values.payment_method_id}
					onChange={(e) => {
						formikProps.handleChange(e);
						setIsPaymentApproved(false);

						if (formikProps.status?.serverError) {
							formikProps.setStatus(undefined);
						}
					}}
				>
					{paymentMethods.map(({payment_method_id, title}) => (
						<FormControlLabel
							value={payment_method_id}
							control={
								<Radio
									sx={{
										color: "#133e20",
										"&.Mui-checked": {
											color: "#4a7c4d",
										},
									}}
								/>
							}
							disabled={orderPaid}
							label={title}
							key={payment_method_id}
						/>
					))}
				</RadioGroup>
				{"payment_method_id" in formikProps.errors && (
					<FormHelperText>
						{formikProps.errors.payment_method_id}
					</FormHelperText>
				)}
				{isDelivery && (
					<Box sx={{mb: 2, mt: 2}}>
						<TextField
							label="Tip"
							type="number"
							variant={"outlined"}
							{...fieldAttrs("tip", formikProps)}
							onChange={(e) => {
								formikProps.handleChange(e);

								if (formikProps.status?.serverError) {
									formikProps.setStatus(undefined);
								}
							}}
							disabled={orderPaid}
							helperText={"100% of tip goes to your driver!"}
							slotProps={{
								input: {
									startAdornment: (
										<InputAdornment position="start">$</InputAdornment>
									),
								},
								htmlInput: {
									min: "0",
									step: "0.01",
								},
							}}
						/>
					</Box>
				)}
			</FormControl>
		</Box>
	);
};

const useSavePaymentMethod = (
	paymentPage: IPaymentPageData,
	stepper: ICheckoutStepper | null | undefined,
) => {
	const {order} = useAppSelector((state) => state.app);
	const {onThankYouPage} = useCheckoutConfig();
	const dispatch = useAppDispatch();

	const onSubmit = async (
		values: IPaymentMethodFormValues,
		{setSubmitting, setStatus}: FormikHelpers<IPaymentMethodFormValues>,
	) => {
		const checkoutData = getCheckoutData();
		const checkoutDataOrder = checkoutData?.order;
		const checkoutDataTotal = checkoutData?.total;
		const items = checkoutData?.items;

		if (!checkoutDataOrder || !checkoutDataTotal) {
			console.error("[useSavePaymentMethod] Missing checkout session data at submission", {
				hasOrder: Boolean(order),
				hasCheckoutDataOrder: Boolean(checkoutDataOrder),
				hasTotal: Boolean(checkoutDataTotal),
			});
			setStatus({serverError: "Unable to complete your order. Please refresh and try again."});
			setSubmitting(false);

			return;
		}

		if (redirectToIncompleteStep(dispatch, stepper, checkoutDataOrder)) {
			setSubmitting(false);

			return;
		}

		try {
			const {payment_method_id, tip} = values;

			const selectedPaymentMethod = paymentPage.paymentMethods.find(
				(method) => method.payment_method_id === payment_method_id,
			);

			let updatedOrder: IOrderWithCustmAttr;
			let updatedTotal = {...checkoutDataTotal};

			if (payment_method_id === CREDIT_CARD_PAYMENT_METHOD) {
				const completedSession = completeCreditCardPaymentOutcome(
					{order: checkoutDataOrder, total: checkoutDataTotal},
					{
						paymentMethodId: payment_method_id,
						paymentMethod: selectedPaymentMethod,
						tip,
					},
				);

				updatedOrder = completedSession.order;
				updatedTotal = completedSession.total;
			} else {
				updatedOrder = {
					...checkoutDataOrder,
					paymentMethod: selectedPaymentMethod,
					tip: tip ? parseLenientAmount(tip).toString() : "0",
					payment_method_id: payment_method_id,
					custom_attrs: {
						...checkoutDataOrder.custom_attrs,
						checkoutCompleted: true,
					},
				} as IOrderWithCustmAttr;

				if (tip) {
					updatedOrder = {
						...updatedOrder,
						total_price: (
							parseLenientAmount(checkoutDataOrder.total_price) + parseLenientAmount(tip)
						).toString(),
					};
					updatedTotal = {
						...checkoutDataTotal,
						price: (parseLenientAmount(checkoutDataTotal?.price) + parseLenientAmount(tip)).toString(),
					};
				}
			}

			setLocalStorageCheckoutData({
				order: updatedOrder,
				total: updatedTotal,
			});

			dispatch(setOrder(updatedOrder));
			dispatch(setTotal(updatedTotal));
			setStatus({checkoutCompletionInProgress: true});
			scrollCheckoutToTop(".bdl-payment-success-message");

			await onThankYouPage({
				order: updatedOrder,
				total: updatedTotal,
				items: items ?? [],
			});
		} catch (error) {
			if (error instanceof PaymentOutcomeError) {
				console.error("[useSavePaymentMethod] PaymentOutcomeError during checkout completion", error);
				setStatus({
					serverError: `Order data error: ${error.message} Please contact support.`,
				});
			} else {
				console.error("[useSavePaymentMethod] Checkout completion failed", error);
				setStatus({
					serverError: "Unable to complete your order. Please try again.",
				});
			}
		} finally {
			setSubmitting(false);
		}
	};

	return {
		onSubmit,
	};
};

interface IPaymentMethodFormValues {
	payment_method_id?: string;
	tip?: string;
}

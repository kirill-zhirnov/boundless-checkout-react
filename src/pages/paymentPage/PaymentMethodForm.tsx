import React from "react";
import { Form, Formik, FormikHelpers, FormikProps } from "formik";
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
} from "@mui/material";
import DoneIcon from "@mui/icons-material/Done";
import { useAppDispatch, useAppSelector } from "../../hooks/redux";
import ExtraErrors from "../../components/ExtraErrors";
import { useTranslation } from "react-i18next";
import { IPaymentMethod, IPaymentPageData } from "../PaymentPage";
import {
	getCheckoutData,
	setLocalStorageCheckoutData,
} from "../../hooks/checkoutData";
import { fieldAttrs } from "../../lib/formUtils";
import { RootState } from "../../redux/store";
import { DELIVERY_ID } from "../../constants";
import { ITotal } from "boundless-api-client";
import { setOrder, setTotal } from "../../redux/reducers/app";
import { IOrderWithCustmAttr } from "../../types/Order";
import { cartHasTickets } from "../../lib/products";
import { hasShipping } from "../../lib/shipping";
import { getDynamicDeliveryTimes } from "../../lib/deliveryTimes";

// Custom validation function
const validatePaymentForm = (
	values: IPaymentMethodFormValues,
	isDelivery: boolean
) => {
	const errors: Partial<Record<keyof IPaymentMethodFormValues, string>> = {};

	if (!values.payment_method_id || values.payment_method_id === "0") {
		errors.payment_method_id = "Payment method is required";
	}

	if (values.tip && parseFloat(values.tip) < 0) {
		errors.tip = "Tip must be positive";
	}

	if (isDelivery && !values.delivery_time) {
		errors.delivery_time = "Delivery time is required";
	}

	return errors;
};

export default function PaymentMethodForm({
	paymentPage,
}: {
	paymentPage: IPaymentPageData;
}) {
	const { onSubmit } = useSavePaymentMethod(paymentPage);
	const { t } = useTranslation();
	const order = useAppSelector((state: RootState) => state.app.order);
	const isDelivery =
		order?.services?.some((service) => service.service_id === DELIVERY_ID) ||
		false;

	return (
		<Formik
			initialValues={getFormInitialValues()}
			onSubmit={onSubmit}
			validateOnChange={false}
			validate={(values) => validatePaymentForm(values, isDelivery)}
		>
			{(formikProps) => (
				<Form className={"bdl-payment-form"}>
					{Object.keys(formikProps.errors).length > 0 && (
						<ExtraErrors
							excludedFields={["payment_method_id"]}
							errors={formikProps.errors}
						/>
					)}
					<Typography variant="h5" sx={{ mb: 2 }}>
						{t("paymentMethodForm.pageHeader")}
					</Typography>
					{cartHasTickets() && (
						<Typography variant="body1" sx={{ m: 2 }}>
							{
								"Please note, due to limited seating, to reserve your seats, we require payment by credit card online OR you can come in store to purchase your tickets in person by credit, cash or debit. Seats must be purchased prior to event date. We look forward to hosting you!"
							}
						</Typography>
					)}
					<PaymentMethods
						formikProps={formikProps}
						paymentMethods={paymentPage.paymentMethods}
					/>
					<Box textAlign={"end"}>
						<Button
							variant="contained"
							startIcon={<DoneIcon />}
							type={"submit"}
							disabled={formikProps.isSubmitting}
							color="success"
							size="large"
						>
							{t("paymentMethodForm.completeOrder")}
						</Button>
					</Box>
				</Form>
			)}
		</Formik>
	);
}

const getFormInitialValues = () => {
	const order = useAppSelector((state: RootState) => state.app.order);

	const initialValues: IPaymentMethodFormValues = {
		payment_method_id: order?.payment_method_id || "0",
	};

	return initialValues;
};

const PaymentMethods = ({
	formikProps,
	paymentMethods,
}: {
	formikProps: FormikProps<IPaymentMethodFormValues>;
	paymentMethods: IPaymentMethod[];
}) => {
	const order = useAppSelector((state: RootState) => state.app.order);
	const orderHasShipping = hasShipping(order as IOrderWithCustmAttr);
	const isDelivery = order?.services?.some(
		(service) => service.service_id === DELIVERY_ID
	);
	const deliveryTimes = getDynamicDeliveryTimes();

	return (
		<Box sx={{ mb: 2 }}>
			<FormControl
				required
				variant="outlined"
				error={Boolean("payment_method_id" in formikProps.errors)}
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
					onChange={formikProps.handleChange}
				>
					{paymentMethods.map(({ payment_method_id, title }) => {
						return (
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
								label={title}
								key={payment_method_id}
							/>
						);
					})}
				</RadioGroup>
				{"payment_method_id" in formikProps.errors && (
					<FormHelperText>
						{formikProps.errors.payment_method_id}
					</FormHelperText>
				)}
				{isDelivery && (
					<>
						<Box sx={{ mb: 2, mt: 2 }}>
							<TextField
								label="Tip"
								type="number"
								variant={"outlined"}
								{...fieldAttrs("tip", formikProps)}
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
						<Box sx={{ mb: 2 }}>
							<TextField
								required={true}
								label="Delivery time"
								variant={"outlined"}
								fullWidth
								select
								slotProps={{
									select: { native: true },
								}}
								helperText="Orders placed after hours of operation will be delivered the next day."
								{...fieldAttrs("delivery_time", formikProps)}
							>
								<option value=""></option>
								{deliveryTimes.map((deliveryTime, idx) => (
									<option key={idx} value={deliveryTime}>
										{deliveryTime}
									</option>
								))}
							</TextField>
						</Box>
					</>
				)}
			</FormControl>
		</Box>
	);
};

const useSavePaymentMethod = (paymentPage: IPaymentPageData) => {
	const { order, onThankYouPage, total } = useAppSelector((state) => state.app);
	const dispatch = useAppDispatch();

	const onSubmit = (
		values: IPaymentMethodFormValues,
		{ setSubmitting }: FormikHelpers<IPaymentMethodFormValues>
	) => {
		const { order: checkoutDataOrder } = getCheckoutData() || {};

		if (!order || !checkoutDataOrder) return;

		const { payment_method_id, tip, delivery_time } = values;

		let updatedOrder = {
			...checkoutDataOrder,
			paymentMethod: paymentPage.paymentMethods.find(
				(method) => method.payment_method_id === payment_method_id
			),
			delivery_time: delivery_time || "",
			tip: tip ? parseFloat(tip).toString() : "0",
			payment_method_id: payment_method_id,
			custom_attrs: {
				...checkoutDataOrder.custom_attrs,
				checkoutCompleted: true,
			},
		};
		let updatedTotal = { ...total };

		if (tip) {
			updatedOrder = {
				...updatedOrder,
				total_price: (
					(Number(checkoutDataOrder.total_price) || 0) + parseFloat(tip)
				).toString(),
			};
			updatedTotal = {
				...total,
				price: ((Number(total?.price) || 0) + parseFloat(tip)).toString(),
			};
		}

		setLocalStorageCheckoutData({
			order: {
				...updatedOrder,
			} as IOrderWithCustmAttr,
			total: updatedTotal as unknown as ITotal,
		});

		dispatch(setOrder(updatedOrder as unknown as IOrderWithCustmAttr));
		dispatch(setTotal(updatedTotal as unknown as ITotal));

		onThankYouPage!({ orderId: checkoutDataOrder.id });
		setSubmitting(false);
	};

	return {
		onSubmit,
	};
};

export interface IPaymentMethodFormValues {
	payment_method_id: number | string;
	tip?: string;
	delivery_time?: string;
}

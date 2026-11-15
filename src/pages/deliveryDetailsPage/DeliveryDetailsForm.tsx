import {Form, Formik, FormikHelpers} from "formik";
import {Box, Button, Typography} from "@mui/material";
import DoneIcon from "@mui/icons-material/Done";
import {useAppDispatch, useAppSelector} from "../../hooks/redux";
import {
	addFilledStep,
	setCurrentStep,
	setOrder,
	setTotal,
} from "../../redux/reducers/app";
import {TCheckoutStep} from "../../types/common";
import {
	getCheckoutData,
	setLocalStorageCheckoutData,
} from "../../hooks/checkoutData";
import {IOrderWithCustmAttr} from "../../types/Order";
import {useDeliveryTimes} from "../../hooks/useDeliveryTimes";
import {
	DeliveryTimesWithDropShip,
	getNextTwoBusinessDaysFormatted,
} from "../../lib/deliveryTimes";
import {
	ordersDropShippingItems,
	ordersRegularItems,
} from "../../lib/products";
import {hasDeliveryId} from "../../lib/shipping";
import {DELIVERY_ID, SELF_PICKUP_ID} from "../../constants";
import {DeliveryTimeSelector, renderDeliveryTimeOptions} from "./helpers";
import ExtraErrors from "../../components/ExtraErrors";
import CheckoutStepWarning from "../../components/CheckoutStepWarning";
import {calculateCheckoutShippingTotals} from "../../lib/deliveryFee";

const hasDropShipTimes = (data: unknown): data is DeliveryTimesWithDropShip =>
	!!data && typeof data === "object" && "dropShipTimes" in data;

interface IDeliveryDetailsFormValues {
	delivery_time: string;
	drop_ship_delivery_time?: string;
}

export const makeValidateDeliveryDetailsForm =
	(_hasRegularItems: boolean, hasDropShipItems: boolean, isDelivery: boolean) =>
		(values: IDeliveryDetailsFormValues) => {
			const errors: Partial<Record<keyof IDeliveryDetailsFormValues, string>> =
				{};

			if (isDelivery && hasDropShipItems && !values.drop_ship_delivery_time) {
				errors.drop_ship_delivery_time = "Drop-ship delivery time is required";
			}

			return errors;
		};

const useSaveDeliveryDetails = () => {
	const dispatch = useAppDispatch();
	const {order, items} = useAppSelector((state) => state.app);

	const regularItems = ordersRegularItems(items ?? []);
	const hasRegularItems = regularItems.length > 0;
	const dropShipItems = ordersDropShippingItems(items ?? []);
	const hasDropShipItems = dropShipItems.length > 0;

	const {
		isLoading: loadingDeliveryTimes,
		isError: errorLoadingDeliveryTimes,
		data: deliveryTimes,
	} = useDeliveryTimes({
		returnTimeForTodayAndTwoDaysFromNow: hasDropShipItems,
	});

	const onSubmit = (
		values: IDeliveryDetailsFormValues,
		{setSubmitting, setErrors}: FormikHelpers<IDeliveryDetailsFormValues>,
	) => {
		const {order: checkoutDataOrder, total} = getCheckoutData() || {};

		if (!order || !checkoutDataOrder || !total) {
			setErrors({
				_error: "No order found. Please return to menu and try again.",
			} as any);
			setSubmitting(false);

			return;
		}

		const persistAndContinue = (
			updatedOrder: IOrderWithCustmAttr,
			updatedTotal: typeof total,
		) => {
			setLocalStorageCheckoutData({order: updatedOrder, total: updatedTotal});
			dispatch(setOrder(updatedOrder));
			dispatch(setTotal(updatedTotal));
			dispatch(addFilledStep({step: TCheckoutStep.deliveryDetails}));
			dispatch(setCurrentStep(TCheckoutStep.paymentMethod));
			setSubmitting(false);
		};

		const updatedOrderBase: IOrderWithCustmAttr = {
			...checkoutDataOrder,
			...(hasDropShipItems && {
				drop_ship_delivery_time: values.drop_ship_delivery_time,
			}),
		};

		if (!hasDeliveryId(checkoutDataOrder, DELIVERY_ID)) {
			persistAndContinue(updatedOrderBase, total);

			return;
		}

		const calculation = calculateCheckoutShippingTotals({
			order: checkoutDataOrder,
			total,
			deliveryId: DELIVERY_ID,
			hasRegularItems,
			hasDropShipItems,
			deliveryTime: checkoutDataOrder.delivery_time,
			dropShipDeliveryTime: values.drop_ship_delivery_time,
			regularOptions: deliveryTimes?.times,
			dropShipOptions: hasDropShipTimes(deliveryTimes)
				? deliveryTimes.dropShipTimes.times
				: undefined,
		});

		const updatedServices = checkoutDataOrder.services?.map((service) =>
			service.service_id === DELIVERY_ID
				? {...service, total_price: calculation.shippingRate}
				: service,
		);

		const updatedOrder: IOrderWithCustmAttr = {
			...updatedOrderBase,
			total_price: calculation.totalOrderPrice,
			tax_amount: calculation.totalOrderTaxes,
			service_total_price: calculation.shippingRate,
			servicesSubTotal: {qty: 1, price: calculation.shippingRate},
			services: updatedServices,
			custom_attrs: {
				...checkoutDataOrder.custom_attrs,
				shippingRate: calculation.shippingRate,
				originalShippingRate: calculation.originalShippingRate,
				shippingTax: calculation.shippingTax,
				freeShippingApplied: calculation.freeShippingApplied,
			},
		};

		const updatedTotal = {
			...total,
			price: calculation.totalOrderPrice,
			tax: {
				...total.tax,
				shipping: {
					...total.tax?.shipping,
					shippingTaxes: calculation.shippingTax.toString(),
				},
				totalTaxAmount: calculation.totalOrderTaxes,
			},
			servicesSubTotal: {
				...total.servicesSubTotal,
				price: calculation.shippingRate,
			},
		};

		persistAndContinue(updatedOrder, updatedTotal);
	};

	return {
		onSubmit,
		hasRegularItems,
		hasDropShipItems,
		dropShipItems,
		regularItems,
		loadingDeliveryTimes,
		errorLoadingDeliveryTimes,
		deliveryTimes,
	};
};

export default function DeliveryDetailsForm() {
	const {
		onSubmit,
		hasRegularItems,
		hasDropShipItems,
		dropShipItems,
		regularItems,
		loadingDeliveryTimes,
		errorLoadingDeliveryTimes,
		deliveryTimes,
	} = useSaveDeliveryDetails();

	const {order} = useAppSelector((state) => state.app);
	const isPickup = !!(order && hasDeliveryId(order, SELF_PICKUP_ID));
	const isDelivery = !!(order && hasDeliveryId(order, DELIVERY_ID));
	const isShipping = !isPickup && !isDelivery;

	const initialValues: IDeliveryDetailsFormValues = {
		delivery_time: hasRegularItems ? (order?.delivery_time ?? "") : "",
		...(hasDropShipItems && {
			drop_ship_delivery_time: order?.drop_ship_delivery_time ?? "",
		}),
	};

	const dropShipDateLabel = hasDropShipTimes(deliveryTimes)
		? deliveryTimes.dropShipTimes.date
		: "";

	return (
		<Formik
			initialValues={initialValues}
			onSubmit={onSubmit}
			validate={makeValidateDeliveryDetailsForm(
				hasRegularItems,
				hasDropShipItems,
				isDelivery,
			)}
			validateOnChange={false}
		>
			{(formikProps) => (
				<Form className={"bdl-delivery-details-form"}>
					{Object.keys(formikProps.errors).length > 0 && (
						<ExtraErrors
							excludedFields={Object.keys(formikProps.initialValues)}
							errors={formikProps.errors}
						/>
					)}
					<CheckoutStepWarning step={TCheckoutStep.deliveryDetails} />
					<Typography variant="h5" sx={{mb: 2}}>
						{"Delivery details"}
					</Typography>
					{isDelivery && order?.custom_attrs?.deliveryQuote && (
						<Typography variant="body1" sx={{mb: 2}}>
							{`Delivery zone: ${order.custom_attrs.deliveryQuote.zoneLabel}`}
						</Typography>
					)}

					{hasDropShipItems && isDelivery && (
						<DeliveryTimeSelector
							items={dropShipItems}
							field={"drop_ship_delivery_time"}
							helperText={
								dropShipDateLabel
									? `Will be delivered on ${dropShipDateLabel}`
									: ""
							}
							formikProps={formikProps}
							showDeliveryFor={true}
						>
							{renderDeliveryTimeOptions(
								hasDropShipTimes(deliveryTimes)
									? deliveryTimes.dropShipTimes.times
									: undefined,
								loadingDeliveryTimes,
								errorLoadingDeliveryTimes,
								order?.custom_attrs?.deliveryQuote?.fee,
							)}
						</DeliveryTimeSelector>
					)}
					{(hasRegularItems && isPickup) && (
						<Box sx={{mb: 2}}>
							<Typography
								variant="subtitle1"
								sx={{mb: 1, fontWeight: "bold"}}
							>
								{"Same day pickup for:"}
							</Typography>
							<ul>
								{regularItems.map((item, i) => {
									return <li key={i}>{item.product.Name}</li>;
								})}
							</ul>
						</Box>
					)}
					{hasDropShipItems && isPickup && (
						<Box sx={{mb: 2}}>
							<Typography
								variant="subtitle1"
								sx={{mb: 1, fontWeight: "bold"}}
							>
								{`${getNextTwoBusinessDaysFormatted()} pickup for:`}
							</Typography>
							<ul>
								{dropShipItems.map((item, i) => {
									return <li key={i}>{item.product.Name}</li>;
								})}
							</ul>
						</Box>
					)}
					{isShipping && (
						<Box sx={{mb: 2}}>
							<Typography
								variant="subtitle1"
								sx={{mb: 1, fontWeight: "bold"}}
							>
								{"Expected delivery time in 1-3 business days for:"}
							</Typography>
							<ul>
								{regularItems.concat(dropShipItems).map((item, i) => {
									return <li key={i}>{item.product.Name}</li>;
								})}
							</ul>
						</Box>
					)}

					<Box textAlign={"end"}>
						<Button
							variant="contained"
							startIcon={<DoneIcon />}
							type={"submit"}
							disabled={formikProps.isSubmitting}
							color="success"
							size="large"
						>
							{"Continue to payment"}
						</Button>
					</Box>
				</Form>
			)}
		</Formik>
	);
}

import React, {useEffect, useRef} from "react";
import {Form, Formik, FormikHelpers, useFormikContext} from "formik";
import ExtraErrors from "../../components/ExtraErrors";
import {Alert, Box, Button, Typography} from "@mui/material";
import PaymentIcon from "@mui/icons-material/Payment";
import {
	IAddress,
	IAddressFormFields,
	ICheckoutShippingPageData,
	IShippingFormValues,
	TAddressType,
} from "../../types/shippingForm";
import DeliverySelector from "./shippingForm/DeliverySelector";
import {useAppDispatch, useAppSelector} from "../../hooks/redux";
import {dispatchFormikSubmitPromise} from "../../lib/formikSubmit";
import {
	addFilledStep,
	setOrder,
	setTotal,
	setCurrentStep,
} from "../../redux/reducers/app";
import AddressesFields from "./shippingForm/AddressesFields";
import {isPickUpDelivery} from "../../lib/shipping";
import {useTranslation} from "react-i18next";
import {ICheckoutData, IOrderWithCustmAttr} from "../../types/Order";
import {
	DELIVERY_ID,
	DELIVERY_INFO,
	SELF_PICKUP_ID,
	SELF_PICKUP_INFO,
	SHIPPING_DELIVERY_ID,
	SHIPPING_DELIVERY_INFO,
} from "../../constants";
import {v4} from "uuid";
import {
	getCheckoutData,
	setLocalStorageCheckoutData,
} from "../../hooks/checkoutData";
import {
	ordersDropShippingItems,
	ordersRegularItems,
	useCartHasTickets,
} from "../../lib/products";
import {TCheckoutStep} from "../../types/common";
import CheckoutStepWarning from "../../components/CheckoutStepWarning";
import {clearPaymentAndDeliveryProgress} from "../../lib/checkoutProgressReset";
import {useDeliveryTimes} from "../../hooks/useDeliveryTimes";
import {
	DeliveryTimeSelector,
	renderDeliveryTimeOptions,
} from "../deliveryDetailsPage/helpers";
import {calculateCheckoutShippingTotals} from "../../lib/deliveryFee";
import type {DeliveryTimeOption} from "../../lib/deliveryTimes";
import {requestDeliveryQuote} from "../../lib/deliveryQuote";
import type {DeliveryQuoteRequest, DeliveryQuoteResponse} from "../../lib/deliveryQuote";

function DeliveryQuoteStatus() {
	const {values, status, setStatus, setValues, setFieldValue, submitForm} =
		useFormikContext<IShippingFormValues>();

	const previousValues = useRef(values);
	const correctedValuesToSubmit = useRef<IShippingFormValues | null>(null);

	useEffect(() => {
		if (previousValues.current !== values) {
			previousValues.current = values;
			setStatus(undefined);
		}

		if (correctedValuesToSubmit.current === values) {
			correctedValuesToSubmit.current = null;
			void submitForm();
		}
	}, [values, setStatus, submitForm]);

	if (status?.deliveryQuoteValues !== values) return null;
	const quote: DeliveryQuoteResponse = status.deliveryQuote;

	if (quote.status === "ok") return null;

	return (
		<Alert severity="warning" sx={{mb: 2}}>
			{quote.status === "needs_confirmation" ? (
				<>
					<Typography>Please confirm this corrected delivery address:</Typography>
					<Typography>
						{[quote.address.street, quote.address.unit, quote.address.city,
							quote.address.province, quote.address.postalCode].filter(Boolean).join(", ")}
					</Typography>
					<Button type="button" onClick={() => {
						const correctedValues = {
							...values,
							shipping_address: {
								...(values.shipping_address ?? getEmptyAddressFields()),
								address_line_1: quote.address.street,
								address_line_2: quote.address.unit ?? "",
								city: quote.address.city,
								state: quote.address.province,
								zip: quote.address.postalCode,
							},
						};

						correctedValuesToSubmit.current = correctedValues;
						setStatus(undefined);
						void setValues(correctedValues, false);
					}}>
						Use this address
					</Button>
				</>
			) : (
				<>
					<Typography>
						{quote.status === "out_of_range"
							? `Local delivery is available up to ${quote.maxKm} km from the store. Please switch to Shipping.`
							: "We couldn't verify your delivery address. Please check the address and retry, or switch to Shipping."}
					</Typography>
					<Button type="button" onClick={() => {
						setStatus(undefined);
						void setFieldValue("delivery_id", SHIPPING_DELIVERY_ID);
					}}>
						Switch to Shipping
					</Button>
				</>
			)}
		</Alert>
	);
}

// Function to validate if postal code is a British Columbia postal code
const isBCPostalCode = (postalCode: string): boolean => {
	if (!postalCode) return false;
	// Remove spaces and convert to uppercase
	const cleanedCode = postalCode.replace(/\s+/g, "").toUpperCase();

	// BC postal codes start with V and follow the pattern V#A#A#
	return /^V\d[A-Z]\d[A-Z]\d$/.test(cleanedCode);
};

// Custom validation function for shipping form
const makeValidateShippingForm = (hasRegularItems: boolean) =>
	(values: IShippingFormValues) => {
		const errors: any = {};

		// Validate BC postal code for Delivery method
		if (values.delivery_id === DELIVERY_ID && values.shipping_address.zip) {
			if (!isBCPostalCode(values.shipping_address.zip)) {
				errors["shipping_address.zip"] =
					"Delivery is only available within British Columbia. Please enter a valid BC postal code.";
			}
		}

		// Validate BC postal code for Shipping method
		if (
			values.delivery_id === SHIPPING_DELIVERY_ID &&
			values.shipping_address.zip
		) {
			if (!isBCPostalCode(values.shipping_address.zip)) {
				errors["shipping_address.zip"] =
					"Shipping is only available within British Columbia. Please enter a valid BC postal code.";
			}
		}

		if (
			hasRegularItems &&
			values.delivery_id === DELIVERY_ID &&
			!values.delivery_time
		) {
			errors.delivery_time = "Delivery time is required";
		}

		return errors;
	};

const useFormInitialValues = (
	shippingPage: ICheckoutShippingPageData,
): IShippingFormValues => {
	const {order} = useAppSelector((state) => state.app);

	const initialValues: IShippingFormValues = {
		delivery_id:
			order?.services &&
			order.services.length > 0 &&
			order.services[0].service_id != null
				? order.services[0].service_id
				: SELF_PICKUP_ID,
		delivery_time: order?.delivery_time ?? "",
		deliveryInstructions: "",
		shipping_address: getEmptyAddressFields(
			shippingPage.shippingAddress,
			order,
		),
		billing_address: getEmptyAddressFields(shippingPage.billingAddress, order),
		billing_address_the_same: false,
	};

	if (!shippingPage.billingAddress) {
		initialValues.billing_address_the_same = true;
	}

	return initialValues;
};

const getEmptyAddressFields = (
	address: IAddress | null = null,
	order: IOrderWithCustmAttr | null = null,
): IAddressFormFields => {
	let first_name = order ? order.customer?.first_name || null : null,
		last_name = order ? order.customer?.last_name || null : null,
		company,
		address_line_1,
		address_line_2,
		city,
		state,
		zip;

	if (address) {
		({
			first_name,
			last_name,
			company,
			address_line_1,
			address_line_2,
			city,
			state,
			zip,
		} = address);
	}

	return {
		first_name: first_name || "",
		last_name: last_name || "",
		company: company || "",
		address_line_1: address_line_1 || "",
		address_line_2: address_line_2 || "",
		city: city || "",
		state: state || "",
		// country_id: country_id || 0,
		// @todo: currently only shipping in Canada.
		country_id: 40,
		zip: zip || "",
	};
};

function toDeliveryQuoteAddress(address = getEmptyAddressFields()): DeliveryQuoteRequest {
	return {
		street: address.address_line_1 ?? "",
		unit: address.address_line_2 ?? "",
		city: address.city ?? "",
		province: address.state ?? "",
		postalCode: address.zip ?? "",
	};
}

const useSaveShippingForm = ({
	shippingPage,
	regularDeliveryOptions,
	hasRegularItems,
	hasDropShipItems,
}: {
	shippingPage: ICheckoutShippingPageData;
	regularDeliveryOptions?: DeliveryTimeOption[];
	hasRegularItems: boolean;
	hasDropShipItems: boolean;
}) => {
	const dispatch = useAppDispatch();
	const steps = useAppSelector((state) => state.app.stepper?.steps ?? []);

	const onSubmit = (
		values: IShippingFormValues,
		formikHelpers: FormikHelpers<IShippingFormValues>,
		checkoutData: ICheckoutData,
	) => {
		const {order, total} = checkoutData;

		if (!order) return;

		const {
			delivery_id,
			shipping_address,
			billing_address,
			billing_address_the_same,
		} = values;

		const service = (delivery_id: number, finalRate: string) => {
			switch (delivery_id) {
				case SHIPPING_DELIVERY_ID:
					return {
						order_service_id: v4(),
						service_id: SHIPPING_DELIVERY_ID,
						qty: 1,
						total_price: finalRate,
						item_price_id: "",
						is_delivery: true,
						serviceDelivery: {
							delivery_id: SHIPPING_DELIVERY_ID,
							title: "Shipping",
							text_info: null,
							data: null,
							delivery: SHIPPING_DELIVERY_INFO,
						},
					};

				case DELIVERY_ID:
					return {
						order_service_id: v4(),
						service_id: DELIVERY_ID,
						qty: 1,
						total_price: finalRate,
						item_price_id: "",
						is_delivery: true,
						serviceDelivery: {
							delivery_id: DELIVERY_ID,
							title: "Delivery",
							text_info: null,
							data: null,
							delivery: DELIVERY_INFO,
						},
					};

				case SELF_PICKUP_ID:
					return {
						order_service_id: v4(),
						service_id: SELF_PICKUP_ID,
						qty: 1,
						total_price: "0.00",
						item_price_id: "",
						is_delivery: false,
						serviceDelivery: {
							delivery_id: SELF_PICKUP_ID,
							title: "Self Pickup",
							text_info: null,
							data: null,
							delivery: SELF_PICKUP_INFO,
						},
					};

				default:
					return null;
			}
		};

		const promise = Promise.resolve()
			.then(() => {
				const addresses: IAddress[] = [];

				if (!isPickUpDelivery(delivery_id, shippingPage.options.delivery)) {
					addresses.push({
						id: v4(),
						type: TAddressType.shipping,
						is_default: true,
						first_name: shipping_address.first_name,
						last_name: shipping_address.last_name,
						company: null,
						address_line_1: shipping_address.address_line_1,
						address_line_2: shipping_address.address_line_2,
						city: shipping_address.city,
						state: shipping_address.state,
						country_id: 0, // Canada
						zip: shipping_address.zip,
						created_at: new Date().toISOString(),
						vwCountry: null,
					});

					if (!billing_address_the_same) {
						addresses.push({
							id: v4(),
							type: TAddressType.billing,
							is_default: false,
							first_name: billing_address.first_name,
							last_name: billing_address.last_name,
							company: null,
							address_line_1: billing_address.address_line_1,
							address_line_2: billing_address.address_line_2,
							city: billing_address.city,
							state: billing_address.state,
							country_id: 0, // Canada
							zip: billing_address.zip,
							created_at: new Date().toISOString(),
							vwCountry: null,
						});
					}
				}

				return {
					order: {
						...order,
						customer: {
							...order.customer,
							id: order.customer?.id ?? "",
							addresses: addresses,
						},
					} as IOrderWithCustmAttr,
				};
			})
			.then((result) => {
				if (!result) throw new Error("Order data is missing");
				const {order} = result;

				const shippingCalculation = calculateCheckoutShippingTotals({
					order,
					total,
					deliveryId: delivery_id,
					hasRegularItems,
					hasDropShipItems,
					deliveryTime: values.delivery_time,
					dropShipDeliveryTime: order.drop_ship_delivery_time,
					regularOptions: regularDeliveryOptions,
				});

				const selectedService = service(delivery_id, shippingCalculation.shippingRate);
				if (!selectedService) throw new Error("Unsupported delivery option");

				const updatedOrder: IOrderWithCustmAttr = {
					...order,
					...(delivery_id === DELIVERY_ID && hasRegularItems
						? {delivery_time: values.delivery_time}
						: {delivery_time: undefined}),
					total_price: shippingCalculation.totalOrderPrice,
					tax_amount: shippingCalculation.totalOrderTaxes,
					service_total_price: shippingCalculation.shippingRate,
					servicesSubTotal: {
						qty: 1,
						price: shippingCalculation.shippingRate,
					},
					customer: order.customer && {
						...order.customer,
						email: order.customer.email ?? null,
					},
					services: [selectedService],
					custom_attrs: {
						...order.custom_attrs,
						shippingRate: shippingCalculation.shippingRate,
						originalShippingRate: shippingCalculation.originalShippingRate,
						shippingTax: shippingCalculation.shippingTax,
						freeShippingApplied: shippingCalculation.freeShippingApplied,
						deliveryInstructions: values.deliveryInstructions || "",
					},
				};

				const checkoutOrder = {
					...clearPaymentAndDeliveryProgress(updatedOrder),
					...(delivery_id === DELIVERY_ID && hasRegularItems
						? {delivery_time: values.delivery_time}
						: {delivery_time: undefined}),
				};

				if (total) {
					const updatedTotal = {
						...total,
						price: shippingCalculation.totalOrderPrice,
						tax: {
							...total.tax,
							shipping: {
								...total.tax.shipping,
								shippingTaxes: shippingCalculation.shippingTax.toString(),
							} as any,
							totalTaxAmount: shippingCalculation.totalOrderTaxes,
						},
						servicesSubTotal: {
							...total.servicesSubTotal,
							price: shippingCalculation.shippingRate,
						},
					};

					setLocalStorageCheckoutData({
						order: checkoutOrder,
						total: updatedTotal,
					});

					dispatch(setOrder(checkoutOrder));
					dispatch(setTotal(updatedTotal));
					dispatch(addFilledStep({step: TCheckoutStep.shippingAddress}));
				}

				const shippingIdx = steps.indexOf(TCheckoutStep.shippingAddress);
				const nextStep = steps[shippingIdx + 1] ?? TCheckoutStep.paymentMethod;
				dispatch(setCurrentStep(nextStep));
			});

		return dispatchFormikSubmitPromise(dispatch, promise, formikHelpers);
	};

	const submitWithDeliveryQuote = async (
		values: IShippingFormValues,
		formikHelpers: FormikHelpers<IShippingFormValues>,
	) => {
		const checkoutData = getCheckoutData();

		if (!checkoutData?.order) return;
		const customAttrs = {...checkoutData.order.custom_attrs};
		delete customAttrs.deliveryQuote;

		if (values.delivery_id === DELIVERY_ID) {
			const response = await requestDeliveryQuote(toDeliveryQuoteAddress(values.shipping_address));

			if (response.status !== "ok") {
				formikHelpers.setStatus({deliveryQuote: response, deliveryQuoteValues: values});
				formikHelpers.setSubmitting(false);

				return;
			}

			customAttrs.deliveryQuote = {fee: response.fee, zoneLabel: response.zoneLabel, quotedAt: Date.now()};
		}

		return onSubmit(values, formikHelpers, {
			...checkoutData,
			order: {...checkoutData.order, custom_attrs: customAttrs},
		});
	};

	return {
		onSubmit: submitWithDeliveryQuote,
	};
};

export default function ShippingForm({
	shippingPage,
}: {
	shippingPage: ICheckoutShippingPageData;
}) {
	const items = useAppSelector((state) => state.app.items ?? []);
	const regularItems = ordersRegularItems(items);
	const hasRegularItems = regularItems.length > 0;
	const hasDropShipItems = ordersDropShippingItems(items).length > 0;
	const {t} = useTranslation();
	const initialValues = useFormInitialValues(shippingPage);
	const cartItemHasTickets = useCartHasTickets();

	const {
		isLoading,
		isError,
		data: deliveryTimes,
	} = useDeliveryTimes({
		returnTimeForTodayAndTwoDaysFromNow: false,
	});

	const {onSubmit} = useSaveShippingForm({
		shippingPage,
		regularDeliveryOptions: deliveryTimes?.times,
		hasRegularItems,
		hasDropShipItems,
	});

	const nextDayHelperText = deliveryTimes?.isNextDay
		? "NOTE: Delivery is closed for the day; your order will be delivered tomorrow."
		: "Will be delivered today.";

	return (
		<Formik
			initialValues={initialValues}
			onSubmit={onSubmit}
			validate={makeValidateShippingForm(hasRegularItems)}
		>
			{(formikProps) => {
				const {values} = formikProps;
				values.delivery_id = Number(values.delivery_id);

				const {delivery_id} = values;

				return (
					<Form className={"bdl-shipping-form"}>
						{Object.keys(formikProps.errors).length > 0 && (
							<ExtraErrors
								excludedFields={Object.keys(formikProps.initialValues)}
								errors={formikProps.errors}
							/>
						)}
						<CheckoutStepWarning step={TCheckoutStep.shippingAddress} />
						<Typography variant="h5" sx={{m: 2}}>
							{t("shippingForm.pageHeader")}
						</Typography>
						{cartItemHasTickets && (
							<Typography variant="body1" sx={{m: 2}}>
								{
									"Your seats will be Reserved by Name, Birth Date and Number of Seats. Please ensure you bring an ID that matches your First and Last Name at time of event."
								}
							</Typography>
						)}
						<DeliverySelector
							options={shippingPage.options}
							deliveryTimeOptions={deliveryTimes?.times}
						/>
						{delivery_id === DELIVERY_ID && hasRegularItems && (
							<DeliveryTimeSelector
								items={regularItems}
								field="delivery_time"
								helperText={nextDayHelperText}
								formikProps={formikProps}
							>
								{renderDeliveryTimeOptions(deliveryTimes?.times, isLoading, isError)}
							</DeliveryTimeSelector>
						)}
						{!isPickUpDelivery(delivery_id, shippingPage.options.delivery) && (
							<AddressesFields shippingPage={shippingPage} />
						)}
						<DeliveryQuoteStatus />
						<Box textAlign={"end"}>
							<Button
								variant="contained"
								type={"submit"}
								disabled={formikProps.isSubmitting || !delivery_id}
								color="success"
								size="large"
								startIcon={<PaymentIcon />}
							>
								{t("shippingForm.continueToPayment")}
							</Button>
						</Box>
					</Form>
				);
			}}
		</Formik>
	);
}

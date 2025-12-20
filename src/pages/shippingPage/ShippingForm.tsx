import React from "react";
import {
	IAddress,
	IAddressFields,
	ICheckoutShippingPageData,
	TCheckoutStep,
} from "boundless-api-client";
import { Form, Formik, FormikHelpers } from "formik";
import ExtraErrors from "../../components/ExtraErrors";
import { Button, Typography } from "@mui/material";
import PaymentIcon from "@mui/icons-material/Payment";
import { Box } from "@mui/system";
import { IShippingFormValues } from "../../types/shippingForm";
import DeliverySelector from "./shippingForm/DeliverySelector";
import { useAppDispatch, useAppSelector } from "../../hooks/redux";
import { useNavigate } from 'react-router';
import { addPromise } from "../../redux/actions/xhr";
import { apiErrors2Formik } from "../../lib/formUtils";
import { addFilledStep, setOrder, setTotal } from "../../redux/reducers/app";
import AddressesFields from "./shippingForm/AddressesFields";
import {
	isPickUpDelivery,
	getOrderShippingRate,
	qualifiesForFreeShipping,
} from "../../lib/shipping";
import { useTranslation } from "react-i18next";
import { RootState } from "../../redux/store";
import { IOrderWithCustmAttr } from "../../types/Order";
import {
	DELIVERY_COST,
	DELIVERY_ID,
	DELIVERY_INFO,
	SELF_PICKUP_ID,
	SELF_PICKUP_INFO,
	SHIPPING_DELIVERY_ID,
	SHIPPING_DELIVERY_INFO,
} from "../../constants";
import ShippingRatesField from "./shippingForm/ShippingRatesField";
import { v4 } from "uuid";
import {
	getCheckoutData,
	setLocalStorageCheckoutData,
} from "../../hooks/checkoutData";
import { cartHasTickets } from "../../lib/products";

// Function to validate if postal code is a Penticton postal code
const isPentictonPostalCode = (postalCode: string): boolean => {
	if (!postalCode) return false;
	// Remove spaces and convert to uppercase
	const cleanedCode = postalCode.replace(/\s+/g, "").toUpperCase();
	// Penticton postal codes start with V2A
	return cleanedCode.startsWith("V2A");
};

// Function to validate if postal code is a British Columbia postal code
const isBCPostalCode = (postalCode: string): boolean => {
	if (!postalCode) return false;
	// Remove spaces and convert to uppercase
	const cleanedCode = postalCode.replace(/\s+/g, "").toUpperCase();
	// BC postal codes start with V and follow the pattern V#A#A#
	return /^V\d[A-Z]\d[A-Z]\d$/.test(cleanedCode);
};

// Custom validation function for shipping form
const validateShippingForm = (values: IShippingFormValues) => {
	const errors: any = {};

	// Validate Penticton postal code for Delivery method
	if (values.delivery_id === DELIVERY_ID && values.shipping_address?.zip) {
		if (!isPentictonPostalCode(values.shipping_address.zip)) {
			errors["shipping_address.zip"] =
				"Delivery is only available within Penticton, BC. Please enter a valid Penticton postal code.";
		}
	}

	// Validate BC postal code for Shipping method
	if (
		values.delivery_id === SHIPPING_DELIVERY_ID &&
		values.shipping_address?.zip
	) {
		if (!isBCPostalCode(values.shipping_address.zip)) {
			errors["shipping_address.zip"] =
				"Shipping is only available within British Columbia. Please enter a valid BC postal code.";
		}
	}

	return errors;
};

const getFormInitialValues = (
	shippingPage: ICheckoutShippingPageData
): IShippingFormValues => {
	const { order } = useAppSelector((state) => state.app);

	const initialValues: IShippingFormValues = {
		delivery_id:
			order?.services &&
			order.services.length > 0 &&
			order.services[0].service_id != null
				? order.services[0].service_id
				: SELF_PICKUP_ID,
		serviceCode: "",
		deliveryInstructions: "",
		shipping_address: getEmptyAddressFields(
			shippingPage.shippingAddress,
			order
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
	order: IOrderWithCustmAttr | null = null
): IAddressFields => {
	let first_name = order ? order.customer?.first_name || null : null,
		last_name = order ? order.customer?.last_name || null : null,
		company,
		address_line_1,
		address_line_2,
		city,
		state,
		zip,
		phone;

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
			phone,
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
		phone: phone || "",
	};
};

const useSaveShippingForm = ({
	shippingPage,
}: {
	shippingPage: ICheckoutShippingPageData;
}) => {
	const cartItems = useAppSelector((state: RootState) => state.app.items);
	const dispatch = useAppDispatch();
	const navigate = useNavigate();

	const onSubmit = (
		values: IShippingFormValues,
		{ setSubmitting, setErrors }: FormikHelpers<IShippingFormValues>
	) => {
		const { order, total } = getCheckoutData() || {};
		if (!order) return;

		const {
			delivery_id,
			serviceCode,
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
				const addresses = [];

				if (!isPickUpDelivery(delivery_id, shippingPage.options.delivery)) {
					addresses.push({
						id: v4(),
						type: "shipping",
						is_default: true,
						first_name: order.customer?.first_name,
						last_name: order.customer?.last_name,
						company: null,
						address_line_1: shipping_address?.address_line_1,
						address_line_2: shipping_address?.address_line_2,
						city: shipping_address?.city,
						state: shipping_address?.state,
						country_id: 0, // Canada
						zip: shipping_address?.zip,
						phone: shipping_address?.phone,
						created_at: new Date().toISOString(),
						vwCountry: null,
					});

					if (!billing_address_the_same) {
						addresses.push({
							id: v4(),
							type: "billing",
							is_default: false,
							first_name: billing_address?.first_name,
							last_name: billing_address?.last_name,
							company: null,
							address_line_1: billing_address?.address_line_1,
							address_line_2: billing_address?.address_line_2,
							city: billing_address?.city,
							state: billing_address?.state,
							country_id: 0, // Canada
							zip: billing_address?.zip,
							phone: billing_address?.phone,
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
			.then(async (result) => {
				if (!result) throw new Error("Order data is missing");
				const { order } = result;

				const orderShippingRate = await getOrderShippingRate(
					order,
					cartItems,
					serviceCode
				);

				if (
					delivery_id === SHIPPING_DELIVERY_ID &&
					orderShippingRate &&
					!("price-quotes" in orderShippingRate)
				) {
					const error = {
						response: {
							data: [
								{
									field: "serviceCode",
									message: `Unable to set shipping rate. Please try again or contact ${process.env.NEXT_PUBLIC_ADMIN_EMAIL}`,
								},
							],
						},
					};
					throw error;
				}

				return { orderShippingRate, order };
			})
			.then(async (result) => {
				if (!result) throw new Error("Order data is missing");

				const { orderShippingRate, order } = result;
				const shippingPriceQuote = orderShippingRate
					? orderShippingRate["price-quotes"]["price-quote"]
					: null;
				let shippingTaxes = delivery_id === DELIVERY_ID ? 0.2 : 0;
				let shippingRate = delivery_id === DELIVERY_ID ? DELIVERY_COST : "0.00";

				if (delivery_id === SHIPPING_DELIVERY_ID && shippingPriceQuote) {
					const shippingPriceQuoteValue = Array.isArray(shippingPriceQuote)
						? shippingPriceQuote[0]["price-details"]
						: shippingPriceQuote["price-details"];

					const adjustments =
						shippingPriceQuoteValue.adjustments?.adjustment || [];
					let totalAdjustmentCost = 0;
					for (const adjustment of adjustments) {
						totalAdjustmentCost += Number(adjustment["adjustment-cost"]);
					}
					shippingRate = (
						totalAdjustmentCost + shippingPriceQuoteValue["base"]
					).toString();

					shippingTaxes =
						shippingPriceQuoteValue.taxes.gst +
						shippingPriceQuoteValue.taxes.pst +
						shippingPriceQuoteValue.taxes.hst;
				}

				const freeShippingApplies = qualifiesForFreeShipping(total);

				// Apply free shipping if qualifies
				const finalShippingRate = freeShippingApplies ? "0.00" : shippingRate;
				const finalShippingTaxes = freeShippingApplies ? 0 : shippingTaxes;

				let currentTaxes = Number(order.tax_amount);
				// Handle case where user changed delivery type.
				if (order.custom_attrs.shippingTax) {
					currentTaxes -= Number(order.custom_attrs.shippingTax);
				}
				const totalOrderTaxes = (
					currentTaxes + finalShippingTaxes
				).toString();

				const totalOrderPrice = (
					Number(total?.itemsSubTotal.price) +
					Number(totalOrderTaxes) +
					Number(finalShippingRate)
				).toFixed(2);

				const updatedOrder = {
					...order,
					total_price: totalOrderPrice,
					tax_amount: totalOrderTaxes,
					service_total_price: finalShippingRate,
					servicesSubTotal: {
						qty: 1,
						price: finalShippingRate,
					},
					customer: {
						...order.customer,
						email: order.customer?.email ?? null,
					},
					services: [service(delivery_id, finalShippingRate)],
					custom_attrs: {
						...order.custom_attrs,
						serviceCode: serviceCode,
						shippingRate: finalShippingRate,
						originalShippingRate: shippingRate,
						shippingTax: finalShippingTaxes,
						freeShippingApplied: freeShippingApplies,
						deliveryInstructions: values.deliveryInstructions || "",
					},
				} as unknown as IOrderWithCustmAttr;

				if (total) {
					const updatedTotal = {
						...total,
						price: totalOrderPrice,
						tax: {
							...total.tax,
							shipping: {
								...total.tax.shipping,
								shippingTaxes: finalShippingTaxes.toString(),
							} as any,
							totalTaxAmount: totalOrderTaxes,
						},
						servicesSubTotal: {
							...total.servicesSubTotal,
							price: finalShippingRate,
						},
					};

					setLocalStorageCheckoutData({
						order: updatedOrder,
						total: updatedTotal,
					});

					dispatch(setOrder(updatedOrder));
					dispatch(setTotal(updatedTotal));
					dispatch(addFilledStep({ step: TCheckoutStep.shippingMethod }));
				}

				navigate("/payment");
			})
			.catch(({ response: { data } }) => {
				setErrors(apiErrors2Formik(data));
			})
			.finally(() => setSubmitting(false));
		dispatch(addPromise(promise));
	};

	return {
		onSubmit,
	};
};

export default function ShippingForm({
	shippingPage,
}: {
	shippingPage: ICheckoutShippingPageData;
}) {
	const { total } = useAppSelector((state) => state.app);
	const freeShippingApplies = qualifiesForFreeShipping(total);

	const { onSubmit } = useSaveShippingForm({ shippingPage });
	const { t } = useTranslation();

	return (
		<Formik
			initialValues={getFormInitialValues(shippingPage)}
			onSubmit={onSubmit}
			validate={validateShippingForm}
		>
			{(formikProps) => {
				const { values } = formikProps;
				values.delivery_id = Number(values.delivery_id);

				const { delivery_id, serviceCode } = values;

				return (
					<Form className={"bdl-shipping-form"}>
						{Object.keys(formikProps.errors).length > 0 && (
							<ExtraErrors
								excludedFields={Object.keys(formikProps.initialValues)}
								errors={formikProps.errors}
							/>
						)}
						<Typography variant="h5" sx={{ m: 2 }}>
							{t("shippingForm.pageHeader")}
						</Typography>
						{cartHasTickets() && (
							<Typography variant="body1" sx={{ m: 2 }}>
								{
									"Your seats will be Reserved by Name, Birth Date and Number of Seats. Please ensure you bring an ID that matches your First and Last Name at time of event."
								}
							</Typography>
						)}
						<DeliverySelector options={shippingPage.options} />
						{!isPickUpDelivery(delivery_id, shippingPage.options.delivery) && (
							<AddressesFields shippingPage={shippingPage} />
						)}
						{delivery_id === SHIPPING_DELIVERY_ID && !freeShippingApplies && (
							<ShippingRatesField />
						)}
						<Box textAlign={"end"}>
							<Button
								variant="contained"
								type={"submit"}
								disabled={
									formikProps.isSubmitting ||
									!delivery_id ||
									(delivery_id === SHIPPING_DELIVERY_ID &&
										!serviceCode &&
										!freeShippingApplies)
								}
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

import {IOrderWithCustmAttr, ITotal} from "../types/Order";

const laterProgressCustomAttrKeys = ["checkoutCompleted"];

const shippingCustomAttrKeys = [
	"shippingRate",
	"originalShippingRate",
	"shippingTax",
	"freeShippingApplied",
	"deliveryInstructions",
	"deliveryQuote",
];

const removeKeys = <T extends object>(
	source: T | undefined,
	keys: string[],
): T => {
	const next = {...(source ?? {})} as T & Record<string, unknown>;
	keys.forEach((key) => delete next[key]);

	return next;
};

const numeric = (value: string | number | null | undefined, context?: string): number => {
	if (value === null || value === undefined) return 0;

	const parsed = Number(value);

	if (!Number.isFinite(parsed)) {
		console.error(
			`[checkoutProgressReset] Non-numeric value encountered${context ? ` for ${context}` : ""}`,
			value,
		);

		return 0;
	}

	return parsed;
};

export const clearPaymentAndDeliveryProgress = (
	order: IOrderWithCustmAttr,
): IOrderWithCustmAttr => {
	const orderWithoutTip = removeKeys(order, ["tip"]);

	return {
		...orderWithoutTip,
		payment_method_id: null,
		paid_at: null,
		paymentMethod: undefined,
		delivery_time: undefined,
		drop_ship_delivery_time: undefined,
		custom_attrs: removeKeys(order.custom_attrs, laterProgressCustomAttrKeys),
	};
};

export const clearCheckoutProgressAfterContactSave = (
	order: IOrderWithCustmAttr,
): IOrderWithCustmAttr => {
	const orderWithoutServicesSubTotal = removeKeys(
		clearPaymentAndDeliveryProgress(order),
		["servicesSubTotal"],
	);

	return {
		...orderWithoutServicesSubTotal,
		customer: order.customer
			? {
				...order.customer,
				addresses: [],
			}
			: order.customer,
		services: [],
		service_total_price: "0.00",
		custom_attrs: removeKeys(order.custom_attrs, [
			...laterProgressCustomAttrKeys,
			...shippingCustomAttrKeys,
		]),
	};
};

export const clearProgressAfterContact = (
	order: IOrderWithCustmAttr,
	total: ITotal | undefined,
): {order: IOrderWithCustmAttr; total: ITotal | undefined} => {
	const shippingTax = numeric(order.custom_attrs?.shippingTax, "custom_attrs.shippingTax");
	const shippingRate = numeric(order.custom_attrs?.shippingRate, "custom_attrs.shippingRate");
	const tip = numeric(order.tip, "order.tip");
	const taxAmount = Math.max(0, numeric(order.tax_amount, "order.tax_amount") - shippingTax).toString();

	const totalPrice = Math.max(
		0,
		numeric(order.total_price ?? total?.price, "order.total_price") - shippingTax - shippingRate - tip,
	).toFixed(2);

	const nextOrder: IOrderWithCustmAttr = {
		...clearCheckoutProgressAfterContactSave(order),
		tax_amount: taxAmount,
		total_price: totalPrice,
	};

	const nextTotal = total
		? {
			...total,
			price: totalPrice,
			tax: {
				...total.tax,
				shipping: {
					...total.tax.shipping,
					shippingTaxes: "0",
				},
				totalTaxAmount: taxAmount,
			},
			servicesSubTotal: {
				...total.servicesSubTotal,
				price: "0.00",
				qty: 0,
			},
		}
		: total;

	return {order: nextOrder, total: nextTotal};
};

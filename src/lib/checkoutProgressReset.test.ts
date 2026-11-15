import {
	clearCheckoutProgressAfterContactSave,
	clearPaymentAndDeliveryProgress,
	clearProgressAfterContact,
} from "./checkoutProgressReset";
import {IOrderService, IOrderWithCustmAttr, ITotal, TPublishingStatus} from "../types/Order";
import {IAddress, TAddressType} from "../types/shippingForm";
import {SHIPPING_DELIVERY_INFO} from "../constants";

const savedContact = {
	id: "saved-customer-1",
	email: "new-customer@example.com",
	created_at: "2026-06-01T00:00:00.000Z",
	first_name: "New",
	last_name: "Customer",
	phone: "2505550000",
	dob: "1990-01-01",
	custom_attrs: null,
	addresses: [],
};

const staleShippingAddress = (overrides: Partial<IAddress> = {}): IAddress => ({
	id: "stale-shipping-address-1",
	type: TAddressType.shipping,
	is_default: true,
	first_name: "Old",
	last_name: "Shipping",
	company: null,
	address_line_1: "10 Old St",
	address_line_2: null,
	city: "Penticton",
	state: "BC",
	country_id: 40,
	zip: "V2A 1A1",
	created_at: "2026-06-01T00:00:00.000Z",
	vwCountry: null,
	...overrides,
});

const selectedShippingService = (overrides: Partial<IOrderService> = {}): IOrderService => ({
	order_service_id: "service-1",
	service_id: 456,
	qty: 1,
	total_price: "12.00",
	item_price_id: "",
	is_delivery: true,
	serviceDelivery: {
		delivery_id: 456,
		title: "Shipping",
		text_info: null,
		data: null,
		delivery: SHIPPING_DELIVERY_INFO,
	},
	...overrides,
});

const makeTotal = (overrides: Partial<ITotal> = {}): ITotal => ({
	itemsSubTotal: {price: "100.00", qty: 2},
	price: "119.20",
	discount: "0.00",
	tax: {
		totalTaxAmount: "1.20",
		itemsWithTax: [],
		shipping: {shippingTaxes: "1.20"},
	},
	servicesSubTotal: {price: "12.00", qty: 1},
	...overrides,
});

const makeOrder = (overrides: Partial<IOrderWithCustmAttr> = {}): IOrderWithCustmAttr => ({
	id: "order-1",
	status_id: null,
	payment_method_id: "credit-card",
	paid_at: "2026-06-02T12:00:00.000Z",
	service_total_price: "12.00",
	payment_mark_up: null,
	total_price: "112.00",
	discount_for_order: null,
	tax_amount: "1.20",
	publishing_status: TPublishingStatus.published,
	created_at: "2026-06-01T00:00:00.000Z",
	customer: {
		...savedContact,
		addresses: [staleShippingAddress()],
	},
	services: [selectedShippingService()],
	paymentMethod: {payment_method_id: "credit-card", title: "Credit Card"},
	tax_calculations: null,
	custom_attrs: {
		checkoutCompleted: true,
		shippingRate: "12.00",
		originalShippingRate: "12.00",
		shippingTax: 1.2,
		freeShippingApplied: false,
		deliveryInstructions: "Leave at side door",
		loyaltyTier: "gold",
	},
	delivery_time: "10:00 AM",
	drop_ship_delivery_time: "2:00 PM",
	tip: "0.00",
	...overrides,
});

describe("checkout progress reset", () => {
	it("clears shipping, delivery, and payment progress after contact is saved while preserving the saved contact", () => {
		const result = clearCheckoutProgressAfterContactSave(
			makeOrder({
				tip: "6.00",
				servicesSubTotal: {price: "12.00", qty: 1},
			}),
		);

		expect(result.customer).toMatchObject({
			id: savedContact.id,
			email: savedContact.email,
			first_name: savedContact.first_name,
			last_name: savedContact.last_name,
			phone: savedContact.phone,
			dob: savedContact.dob,
		});
		expect(result.customer?.addresses).toEqual([]);
		expect(result.services).toEqual([]);
		expect(result.tip).toBeUndefined();
		expect(result.servicesSubTotal).toBeUndefined();

		expect(result.delivery_time).toBeUndefined();
		expect(result.drop_ship_delivery_time).toBeUndefined();
		expect(result.payment_method_id).toBeNull();
		expect(result.paid_at).toBeNull();
		expect(result.paymentMethod).toBeUndefined();

		expect(result.custom_attrs.checkoutCompleted).toBeUndefined();
		expect(result.custom_attrs.shippingRate).toBeUndefined();
		expect(result.custom_attrs.originalShippingRate).toBeUndefined();
		expect(result.custom_attrs.shippingTax).toBeUndefined();
		expect(result.custom_attrs.freeShippingApplied).toBeUndefined();
		expect(result.custom_attrs.deliveryInstructions).toBeUndefined();
		expect(result.custom_attrs.loyaltyTier).toBe("gold");
	});

	it("clears delivery and payment progress after shipping is saved while preserving the submitted service and address", () => {
		const submittedAddress = staleShippingAddress({
			id: "submitted-shipping-address-1",
			address_line_1: "99 New Shipping St",
		});

		const submittedService = selectedShippingService({
			order_service_id: "submitted-service-1",
			total_price: "0.00",
		});

		const result = clearPaymentAndDeliveryProgress(
			makeOrder({
				customer: {
					...savedContact,
					addresses: [submittedAddress],
				},
				services: [submittedService],
				tip: "6.00",
			}),
		);

		expect(result.customer?.addresses).toEqual([submittedAddress]);
		expect(result.services).toEqual([submittedService]);
		expect(result.tip).toBeUndefined();

		expect(result.delivery_time).toBeUndefined();
		expect(result.drop_ship_delivery_time).toBeUndefined();
		expect(result.payment_method_id).toBeNull();
		expect(result.paid_at).toBeNull();
		expect(result.paymentMethod).toBeUndefined();
		expect(result.custom_attrs.checkoutCompleted).toBeUndefined();
		expect(result.custom_attrs.shippingRate).toBe("12.00");
		expect(result.custom_attrs.deliveryInstructions).toBe("Leave at side door");
	});

	it("clears contact progress through the integration helper and removes stale payment/service totals", () => {
		const {order, total} = clearProgressAfterContact(
			makeOrder({
				total_price: "119.20",
				tax_amount: "1.20",
				tip: "6.00",
				servicesSubTotal: {price: "12.00", qty: 1},
			}),
			makeTotal(),
		);

		expect(order.services).toEqual([]);
		expect(order.tip).toBeUndefined();
		expect(order.servicesSubTotal).toBeUndefined();
		expect(total?.servicesSubTotal).toEqual({price: "0.00", qty: 0});
	});

	it("subtracts stale shipping attrs and tip from contact-reset order and returned totals", () => {
		const {order, total} = clearProgressAfterContact(
			makeOrder({
				total_price: "119.20",
				tax_amount: "1.20",
				tip: "6.00",
			}),
			makeTotal(),
		);

		expect(order.total_price).toBe("100.00");
		expect(total?.price).toBe("100.00");
	});

	it("clears contact progress when no total is available yet", () => {
		const {order, total} = clearProgressAfterContact(
			makeOrder({
				total_price: "119.20",
				tax_amount: "1.20",
				tip: "6.00",
			}),
			undefined,
		);

		expect(order.services).toEqual([]);
		expect(order.total_price).toBe("100.00");
		expect(total).toBeUndefined();
	});
});

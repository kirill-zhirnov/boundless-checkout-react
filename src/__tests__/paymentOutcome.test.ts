import {
	applyCreditCardTipToSession,
	completeCreditCardPaymentOutcome,
	PaymentOutcomeError,
	recordCreditCardPaymentOutcome,
	parseLenientAmount,
} from "../lib/paymentOutcome";
import {IOrderWithCustmAttr, ITotal, TPublishingStatus} from "../types/Order";

const makeOrder = (overrides: Partial<IOrderWithCustmAttr> = {}): IOrderWithCustmAttr => ({
	id: "order-1",
	status_id: null,
	payment_method_id: null,
	paid_at: null,
	service_total_price: "0.00",
	payment_mark_up: null,
	total_price: "100.00",
	discount_for_order: null,
	tax_amount: "0.00",
	publishing_status: TPublishingStatus.published,
	created_at: "2026-05-23T00:00:00.000Z",
	tax_calculations: null,
	custom_attrs: {},
	tip: "0.00",
	...overrides,
});

const makeTotal = (overrides: Partial<ITotal> = {}): ITotal => ({
	price: "100.00",
	itemsSubTotal: {price: "100.00", qty: 1},
	discount: "0",
	tax: {totalTaxAmount: null, itemsWithTax: [], shipping: {}},
	servicesSubTotal: {price: 0, qty: 0},
	...overrides,
});

describe("PaymentOutcome", () => {
	it("applies a new credit-card tip to order and total exactly once", () => {
		const result = applyCreditCardTipToSession(
			{order: makeOrder(), total: makeTotal()},
			"5",
		);

		expect(result.order.tip).toBe("5");
		expect(result.order.total_price).toBe("105.00");
		expect(result.total.price).toBe("105.00");
	});

	it("returns the session unchanged when the applied tip is undefined", () => {
		const result = applyCreditCardTipToSession(
			{order: makeOrder(), total: makeTotal()},
			undefined,
		);

		expect(result.order.tip).toBe("0.00");
		expect(result.order.total_price).toBe("100.00");
		expect(result.total.price).toBe("100.00");
	});

	it("returns the session unchanged when the applied tip is zero", () => {
		const result = applyCreditCardTipToSession(
			{order: makeOrder(), total: makeTotal()},
			"0",
		);

		expect(result.order.tip).toBe("0.00");
		expect(result.order.total_price).toBe("100.00");
		expect(result.total.price).toBe("100.00");
	});

	it("does not re-apply an existing matching tip", () => {
		const result = applyCreditCardTipToSession(
			{
				order: makeOrder({tip: "5", total_price: "105.00"}),
				total: makeTotal({price: "105.00"}),
			},
			"5.00",
		);

		expect(result.order.tip).toBe("5");
		expect(result.order.total_price).toBe("105.00");
		expect(result.total.price).toBe("105.00");
	});

	it("rejects a submitted tip that differs from the existing order tip", () => {
		expect(() =>
			applyCreditCardTipToSession(
				{
					order: makeOrder({tip: "5", total_price: "105.00"}),
					total: makeTotal({price: "105.00"}),
				},
				"7",
			),
		).toThrow(PaymentOutcomeError);
	});

	it("records Payfirma approval as paid while leaving checkout incomplete", () => {
		const result = recordCreditCardPaymentOutcome(
			{order: makeOrder(), total: makeTotal()},
			{paidAt: "2026-05-23T12:00:00.000Z", tip: "5"},
		);

		expect(result.order.paid_at).toBe("2026-05-23T12:00:00.000Z");
		expect(result.order.custom_attrs.checkoutCompleted).toBeUndefined();
		expect(result.order.total_price).toBe("105.00");
		expect(result.total.price).toBe("105.00");
	});

	it("completes a paid credit-card CheckoutSession without double-applying the tip", () => {
		const result = completeCreditCardPaymentOutcome(
			{
				order: makeOrder({
					paid_at: "2026-05-23T12:00:00.000Z",
					tip: "5",
					total_price: "105.00",
				}),
				total: makeTotal({price: "105.00"}),
			},
			{
				paymentMethodId: "5",
				paymentMethod: {payment_method_id: "5", title: "Credit Card"},
				tip: "5.00",
				deliveryTime: "1:00 PM",
			},
		);

		expect(result.order.payment_method_id).toBe("5");
		expect(result.order.paymentMethod).toEqual({payment_method_id: "5", title: "Credit Card"});
		expect(result.order.delivery_time).toBe("1:00 PM");
		expect(result.order.custom_attrs.checkoutCompleted).toBe(true);
		expect(result.order.total_price).toBe("105.00");
		expect(result.total.price).toBe("105.00");
	});

	it("completes a paid credit-card CheckoutSession without a deliveryTime", () => {
		const result = completeCreditCardPaymentOutcome(
			{
				order: makeOrder({
					paid_at: "2026-05-23T12:00:00.000Z",
					tip: "5",
					total_price: "105.00",
				}),
				total: makeTotal({price: "105.00"}),
			},
			{
				paymentMethodId: "5",
				tip: "5.00",
			},
		);

		expect(result.order).not.toHaveProperty("delivery_time");
		expect(result.order.custom_attrs.checkoutCompleted).toBe(true);
	});

	describe("Amount parsing strictness", () => {
		it("rejects partially invalid strings and non-finite values", () => {
			const session = {order: makeOrder(), total: makeTotal()};

			expect(() => applyCreditCardTipToSession(session, "5abc")).toThrow(PaymentOutcomeError);
			expect(() => applyCreditCardTipToSession(session, "5,00")).toThrow(PaymentOutcomeError);
			expect(() => applyCreditCardTipToSession(session, "Infinity")).toThrow(PaymentOutcomeError);
			expect(() => applyCreditCardTipToSession(session, "NaN")).toThrow(PaymentOutcomeError);
		});
	});

	describe("parseLenientAmount", () => {
		it("coerces invalid or empty inputs to 0", () => {
			expect(parseLenientAmount(null)).toBe(0);
			expect(parseLenientAmount(undefined)).toBe(0);
			expect(parseLenientAmount("")).toBe(0);
			expect(parseLenientAmount("not-a-number")).toBe(0);
			expect(parseLenientAmount("NaN")).toBe(0);
			expect(parseLenientAmount("Infinity")).toBe(0);
		});

		it("parses valid numeric values", () => {
			expect(parseLenientAmount("0")).toBe(0);
			expect(parseLenientAmount("5.50")).toBe(5.5);
			expect(parseLenientAmount("-3.14")).toBe(-3.14);
			expect(parseLenientAmount(42)).toBe(42);
		});
	});

	describe("completeCreditCardPaymentOutcome paymentMethod preservation", () => {
		it("preserves an existing order.paymentMethod when input.paymentMethod is omitted", () => {
			const existingPaymentMethod = {payment_method_id: "6", title: "Existing Method"};

			const result = completeCreditCardPaymentOutcome(
				{
					order: makeOrder({
						paymentMethod: existingPaymentMethod,
					}),
					total: makeTotal(),
				},
				{
					paymentMethodId: "5",
				},
			);

			expect(result.order.paymentMethod).toBe(existingPaymentMethod);
			expect(result.order.payment_method_id).toBe("5");
		});
	});
});

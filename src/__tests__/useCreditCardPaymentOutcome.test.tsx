import {vi, type Mock} from "vitest";
import {act, renderHook} from "@testing-library/react";
import {useCreditCardPaymentOutcome} from "../hooks/useCreditCardPaymentOutcome";
import {IOrderWithCustmAttr, ITotal, TPublishingStatus} from "../types/Order";
import {getCheckoutData, setLocalStorageCheckoutData} from "../hooks/checkoutData";
import {CovaCartItem} from "../types/cart";

const mockDispatch = vi.fn();

vi.mock("../hooks/redux", () => ({
	useAppDispatch: () => mockDispatch,
}));

vi.mock("../hooks/checkoutData", () => ({
	getCheckoutData: vi.fn(),
	setLocalStorageCheckoutData: vi.fn(),
}));

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

describe("useCreditCardPaymentOutcome", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("records approved credit-card PaymentOutcome in localStorage and Redux", () => {
		const order = makeOrder();
		const total = makeTotal();
		const items: CovaCartItem[] = [];
		(getCheckoutData as Mock).mockReturnValue({order, total, items});

		const {result} = renderHook(() => useCreditCardPaymentOutcome());

		let updated: {order: IOrderWithCustmAttr; total: ITotal} | undefined;
		act(() => {
			updated = result.current.recordApprovedPayment({
				paidAt: "2026-05-23T12:00:00.000Z",
				tip: "5",
			});
		});

		expect(updated).toEqual({
			order: expect.objectContaining({
				paid_at: "2026-05-23T12:00:00.000Z",
				tip: "5",
				total_price: "105.00",
			}),
			total: expect.objectContaining({price: "105.00"}),
		});

		expect(setLocalStorageCheckoutData).toHaveBeenCalledWith({
			order: expect.objectContaining({
				paid_at: "2026-05-23T12:00:00.000Z",
				tip: "5",
				total_price: "105.00",
			}),
			total: expect.objectContaining({price: "105.00"}),
			items,
		});
		expect(mockDispatch).toHaveBeenCalledWith(
			expect.objectContaining({
				type: "app/setOrder",
				payload: expect.objectContaining({
					paid_at: "2026-05-23T12:00:00.000Z",
					tip: "5",
					total_price: "105.00",
				}),
			})
		);
		expect(mockDispatch).toHaveBeenCalledWith(
			expect.objectContaining({
				type: "app/setTotal",
				payload: expect.objectContaining({
					price: "105.00",
				}),
			})
		);
	});

	describe("rejects recording when CheckoutSession is missing components", () => {
		const testCases = [
			{order: undefined, total: undefined},
			{order: makeOrder(), total: undefined},
			{order: undefined, total: makeTotal()},
		];

		testCases.forEach(({order, total}) => {
			it(`fails when order is ${order ? "present" : "missing"} and total is ${total ? "present" : "missing"}`, () => {
				(getCheckoutData as Mock).mockReturnValue({order, total, items: [] as CovaCartItem[]});
				const {result} = renderHook(() => useCreditCardPaymentOutcome());

				expect(() => {
					result.current.recordApprovedPayment({
						paidAt: "2026-05-23T12:00:00.000Z",
						tip: "5",
					});
				}).toThrow("Cannot record credit-card payment outcome without an order and total.");

				expect(setLocalStorageCheckoutData).not.toHaveBeenCalled();
				expect(mockDispatch).not.toHaveBeenCalled();
			});
		});
	});
});

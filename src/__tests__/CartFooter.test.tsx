import {vi, type Mock} from "vitest";
import React from "react";
import {render, screen} from "@testing-library/react";
import CartFooter from "../components/cart/CartFooter";
import {IOrderWithCustmAttr, ITotal, TPublishingStatus} from "../types/Order";
import {getCheckoutData} from "../hooks/checkoutData";
import {getCartOrRetrieve} from "../hooks/getCartOrRetrieve";

let mockState: any = {};

vi.mock("../hooks/redux", () => ({
	useAppSelector: (selector: any) => selector(mockState),
}));

vi.mock("../hooks/checkoutData", () => ({
	getCheckoutData: vi.fn(),
}));

vi.mock("../hooks/getCartOrRetrieve", () => ({
	getCartOrRetrieve: vi.fn(),
}));

const makeOrder = (
	overrides: Partial<IOrderWithCustmAttr> = {},
): IOrderWithCustmAttr => ({
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
	itemsSubTotal: {price: "90.00", qty: 1},
	discount: "0",
	tax: {totalTaxAmount: "10.00", itemsWithTax: [], shipping: {}},
	servicesSubTotal: {price: "0.00", qty: 0},
	...overrides,
});

const setReduxCheckoutState = (
	overrides: {
		order?: Partial<IOrderWithCustmAttr>;
		total?: Partial<ITotal>;
	} = {},
) => {
	mockState = {
		app: {
			order: makeOrder(overrides.order),
			total: makeTotal(overrides.total),
			localeSettings: undefined,
		},
	};
};

describe("CartFooter", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		(getCheckoutData as Mock).mockReturnValue(null);
		(getCartOrRetrieve as Mock).mockReturnValue(null);
		setReduxCheckoutState();
	});

	it("does not render a tip row when there is no positive tip", () => {
		render(<CartFooter open />);

		expect(screen.queryByText("Tip:")).not.toBeInTheDocument();
		expect(screen.getByText("$100.00")).toBeInTheDocument();
	});

	it("renders a tip row when the order has a positive tip", () => {
		setReduxCheckoutState({
			order: {tip: "5", total_price: "105.00"},
			total: {price: "105.00"},
		});

		render(<CartFooter open />);

		expect(screen.getByText("Tip:")).toBeInTheDocument();
		expect(screen.getByText("$5.00")).toBeInTheDocument();
		expect(screen.getByText("$105.00")).toBeInTheDocument();
	});

	it("updates the displayed total from Redux after payment approval adds a tip", () => {
		const {rerender} = render(<CartFooter open />);

		expect(screen.queryByText("Tip:")).not.toBeInTheDocument();
		expect(screen.getByText("$100.00")).toBeInTheDocument();

		setReduxCheckoutState({
			order: {
				paid_at: "2026-05-23T12:00:00.000Z",
				tip: "5",
				total_price: "105.00",
			},
			total: {price: "105.00"},
		});

		rerender(<CartFooter open />);

		expect(screen.getByText("Tip:")).toBeInTheDocument();
		expect(screen.getByText("$5.00")).toBeInTheDocument();
		expect(screen.getByText("$105.00")).toBeInTheDocument();
	});

	it("ignores negative tip values for total calculations", () => {
		setReduxCheckoutState({
			order: {tip: "-5.00"},
			total: {
				price: undefined,
				itemsSubTotal: {price: "90.00", qty: 1},
				servicesSubTotal: {price: "0.00", qty: 0},
				tax: {totalTaxAmount: "10.00", itemsWithTax: [], shipping: {}},
			},
		});

		render(<CartFooter open />);

		expect(screen.queryByText("Tip:")).not.toBeInTheDocument();
		expect(screen.getByText("$100.00")).toBeInTheDocument(); // fallback total: 90 + 0 + 10 + 0 (tip is clamped)
	});

	it("shows the free shipping badge and struck-through original price when itemsSubTotal >= 100", () => {
		setReduxCheckoutState({
			order: {
				services: [
					{
						service_id: 1,
						serviceDelivery: {
							delivery: {
								title: "Shipping",
							},
						},
					},
				] as any,
			},
			total: {
				itemsSubTotal: {price: "100.00", qty: 2},
				servicesSubTotal: {price: "4.00", qty: 1},
				price: "104.00",
			},
		});

		render(<CartFooter open />);

		expect(screen.getByText(/Shipping/i)).toBeInTheDocument();
		expect(screen.getByText("FREE")).toBeInTheDocument();
		const originalPrice = screen.getByText("$4.00");
		expect(originalPrice).toHaveClass("strikethrough");
	});

	it("shows the regular shipping price when itemsSubTotal < 100", () => {
		setReduxCheckoutState({
			order: {
				services: [
					{
						service_id: 1,
						serviceDelivery: {
							delivery: {
								title: "Shipping",
							},
						},
					},
				] as any,
			},
			total: {
				itemsSubTotal: {price: "99.00", qty: 1},
				servicesSubTotal: {price: "4.00", qty: 1},
				price: "103.00",
			},
		});

		render(<CartFooter open />);

		expect(screen.getByText(/Shipping/i)).toBeInTheDocument();
		expect(screen.getByText("$4.00")).toBeInTheDocument();
		expect(screen.queryByText("FREE")).not.toBeInTheDocument();
	});

	it("falls back to data from localStorage via getCheckoutData when Redux state is missing", () => {
		mockState = {
			app: {
				order: null,
				total: null,
				localeSettings: undefined,
			},
		};

		(getCheckoutData as Mock).mockReturnValue({
			order: makeOrder({tip: "8.00", total_price: "108.00"}),
			total: makeTotal({price: "108.00"}),
		});

		render(<CartFooter open />);

		expect(screen.getByText("Tip:")).toBeInTheDocument();
		expect(screen.getByText("$8.00")).toBeInTheDocument();
		expect(screen.getByText("$108.00")).toBeInTheDocument();
	});
});

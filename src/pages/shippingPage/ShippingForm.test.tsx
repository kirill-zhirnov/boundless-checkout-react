import {vi} from "vitest";
import React from "react";
import {act, fireEvent, render, screen, waitFor, within} from "@testing-library/react";
import ShippingForm from "./ShippingForm";
import {
	DELIVERY_ID,
	SELF_PICKUP_ID,
	SHIPPING_COST,
	SHIPPING_DELIVERY_ID,
} from "../../constants";
import {TCheckoutStep} from "../../types/common";
import {requestDeliveryQuote} from "../../lib/deliveryQuote";
import type {DeliveryQuoteResponse} from "../../lib/deliveryQuote";

vi.mock("../../lib/deliveryQuote", async () => ({
	...await vi.importActual<typeof import("../../lib/deliveryQuote")>("../../lib/deliveryQuote"),
	requestDeliveryQuote: vi.fn(),
}));

const mockRequestDeliveryQuote = vi.mocked(requestDeliveryQuote);

const originalFetch = global.fetch;

const mockDispatch = vi.fn();

let mockState: any = {};

let mockCheckoutData: any = {};

const mockSetLocalStorageCheckoutData = vi.fn();

type MockDeliveryTimes = {
	isNextDay: boolean;
	times: Array<{
		label: string;
		applyDeliveryFee: boolean;
		asapDeliveryAvailable?: boolean;
	}>;
};

const defaultDeliveryTimes: MockDeliveryTimes = {
	isNextDay: false,
	times: [
		{label: "10:00 AM", applyDeliveryFee: true},
		{label: "12:00 PM", applyDeliveryFee: false},
	],
};

let mockDeliveryTimes: MockDeliveryTimes = defaultDeliveryTimes;

const setAsapDeliveryTime = (applyDeliveryFee: boolean) => {
	mockDeliveryTimes = {
		isNextDay: false,
		times: [
			{
				label: "ASAP",
				applyDeliveryFee,
				asapDeliveryAvailable: true,
			},
		],
	};
};

vi.mock("../../hooks/redux", () => ({
	useAppSelector: (selector: any) => selector(mockState),
	useAppDispatch: () => mockDispatch,
}));

vi.mock("../../hooks/checkoutData", () => ({
	getCheckoutData: () => mockCheckoutData,
	setLocalStorageCheckoutData: (data: any) =>
		mockSetLocalStorageCheckoutData(data),
}));

vi.mock("react-i18next", () => ({
	useTranslation: () => ({t: (key: string) => key}),
}));

vi.mock("../../components/CheckoutStepWarning", () => ({default: () => null}));

vi.mock("../../components/ExtraErrors", () => ({default: () => null}));

vi.mock("../../lib/products", async () => {
	const actual = await vi.importActual<typeof import("../../lib/products")>("../../lib/products");

	return {...actual, useCartHasTickets: () => false};
});

vi.mock("../../hooks/useDeliveryTimes", () => ({
	useDeliveryTimes: () => ({
		isLoading: false,
		isError: false,
		data: mockDeliveryTimes,
	}),
}));

vi.mock("./shippingForm/DeliverySelector", async () => {
	const {useFormikContext} = await vi.importActual<typeof import("formik")>("formik");

	const {
		DELIVERY_ID: deliveryId,
		SELF_PICKUP_ID: selfPickupId,
		SHIPPING_DELIVERY_ID: shippingDeliveryId,
	} = await vi.importActual<typeof import("../../constants")>("../../constants");

	function MockDeliverySelector() {
		const {values, handleChange} = useFormikContext<{delivery_id: number}>();

		return (
			<label>
				Delivery method
				<select
					name="delivery_id"
					value={values.delivery_id}
					onChange={handleChange}
				>
					<option value={String(selfPickupId)}>Self Pickup</option>
					<option value={String(deliveryId)}>Delivery</option>
					<option value={String(shippingDeliveryId)}>Shipping</option>
				</select>
			</label>
		);
	}

	return {default: MockDeliverySelector};
});

vi.mock("./shippingForm/AddressesFields", async () => {
	const {useFormikContext} = await vi.importActual<typeof import("formik")>("formik");

	const requiredAddressFields = [
		{field: "first_name", label: "first name"},
		{field: "last_name", label: "last name"},
		{field: "address_line_1", label: "address line 1"},
		{field: "address_line_2", label: "unit"},
		{field: "zip", label: "zip"},
		{field: "city", label: "city"},
		{field: "state", label: "state"},
	];

	function MockAddressesFields() {
		const {values, handleChange} = useFormikContext<Record<string, Record<string, string>>>();

		const renderRequiredFields = (prefix: string, labelPrefix: string) =>
			requiredAddressFields.map(({field, label}) => {
				const id = `${prefix.replace("_address", "")}-${field.replaceAll("_", "-")}`;

				return (
					<div key={`${prefix}.${field}`}>
						<label htmlFor={id}>{`${labelPrefix} ${label}`}</label>
						<input
							id={id}
							name={`${prefix}.${field}`}
							required={field !== "address_line_2"}
							value={values[prefix]?.[field] ?? ""}
							onChange={handleChange}
						/>
					</div>
				);
			});

		return (
			<div>
				{renderRequiredFields("shipping_address", "Shipping")}
				{renderRequiredFields("billing_address", "Billing")}
			</div>
		);
	}

	return {default: MockAddressesFields};
});

const cartItem = (isDropShip = false) => ({
	product: {
		Name: isDropShip ? "Drop-ship product" : "Regular product",
		ClassificationName: "Flower",
		ProductSpecifications: [
			{
				DisplayName: "Is Drop Shipping Inventory",
				Unit: "",
				Value: isDropShip ? "Yes" : "No",
			},
		],
	},
});

const staleOrder = (deliveryId = SHIPPING_DELIVERY_ID) => ({
	id: "order-1",
	tax_amount: "0",
	total_price: "10.00",
	service_total_price: "0.00",
	servicesSubTotal: {qty: 0, price: "0.00"},
	custom_attrs: {},
	customer: {
		id: "customer-1",
		email: "customer@example.com",
		first_name: "Stale",
		last_name: "Customer",
		addresses: [],
	},
	services: [{service_id: deliveryId}],
});

const checkoutTotal = (itemsSubTotalPrice = "10.00") => ({
	price: itemsSubTotalPrice,
	itemsSubTotal: {price: itemsSubTotalPrice},
	servicesSubTotal: {qty: 0, price: "0.00"},
	tax: {
		shipping: {shippingTaxes: "0"},
		totalTaxAmount: "0",
	},
});

const shippingPage = () => ({
	shippingAddress: null,
	billingAddress: {
		first_name: "Initial",
		last_name: "Billing",
		address_line_1: "1 Billing St",
		city: "Penticton",
		state: "BC",
		zip: "V2A 1A1",
	},
	options: {
		delivery: [
			{
				delivery_id: SELF_PICKUP_ID,
				title: "Self Pickup",
				alias: "selfPickup",
				description: "Self Pickup",
			},
			{
				delivery_id: DELIVERY_ID,
				title: "Delivery",
				alias: "delivery",
				description: "Delivery",
			},
			{
				delivery_id: SHIPPING_DELIVERY_ID,
				title: "Shipping",
				alias: "shipping",
				description: "Shipping",
			},
		],
	},
});

const fillRequiredShippingAddressFields = (
	overrides: Partial<
		Record<
			"first_name" | "last_name" | "address_line_1" | "zip" | "city" | "state",
			string
		>
	> = {},
) => {
	const values = {
		first_name: "Jane",
		last_name: "Customer",
		address_line_1: "123 Main St",
		zip: "V2A 1A1",
		city: "Penticton",
		state: "BC",
		...overrides,
	};

	fireEvent.change(screen.getByLabelText("Shipping first name"), {
		target: {value: values.first_name},
	});
	fireEvent.change(screen.getByLabelText("Shipping last name"), {
		target: {value: values.last_name},
	});
	fireEvent.change(screen.getByLabelText("Shipping address line 1"), {
		target: {value: values.address_line_1},
	});
	fireEvent.change(screen.getByLabelText("Shipping zip"), {
		target: {value: values.zip},
	});
	fireEvent.change(screen.getByLabelText("Shipping city"), {
		target: {value: values.city},
	});
	fireEvent.change(screen.getByLabelText("Shipping state"), {
		target: {value: values.state},
	});
};

const continueToPayment = async () => {
	fireEvent.click(
		screen.getByRole("button", {name: "shippingForm.continueToPayment"}),
	);

	await waitFor(() => {
		expect(mockSetLocalStorageCheckoutData).toHaveBeenCalled();
	});

	return mockSetLocalStorageCheckoutData.mock.calls[0][0];
};

const expectPersistedShippingFee = (
	persisted: any,
	expectedRate: string,
	expectedTax: number,
) => {
	expect(persisted.order.service_total_price).toBe(expectedRate);
	expect(persisted.order.custom_attrs.shippingRate).toBe(expectedRate);
	expect(persisted.order.servicesSubTotal.price).toBe(expectedRate);
	expect(persisted.total.servicesSubTotal.price).toBe(expectedRate);
	expect(persisted.order.custom_attrs.shippingTax).toBe(expectedTax);
	expect(persisted.total.tax.shipping.shippingTaxes).toBe(
		expectedTax.toString(),
	);
};

describe("ShippingForm checkout address persistence", () => {
	beforeEach(() => {
		mockDispatch.mockClear();
		mockSetLocalStorageCheckoutData.mockClear();
		mockDeliveryTimes = defaultDeliveryTimes;
		mockRequestDeliveryQuote.mockReset();
		mockRequestDeliveryQuote.mockResolvedValue({
			status: "ok", fee: "6.00", zoneLabel: "Naramata", distanceKm: 20,
		});

		const order = staleOrder();
		mockState = {
			app: {
				order,
				total: checkoutTotal(),
				stepper: {
					steps: [
						TCheckoutStep.contactInfo,
						TCheckoutStep.shippingAddress,
						TCheckoutStep.paymentMethod,
					],
				},
			},
		};
		mockState.app.items = [cartItem(false)];
		mockCheckoutData = {order, total: checkoutTotal()};
	});

	afterEach(() => {
		global.fetch = originalFetch;
	});

	const setCheckoutOrder = (
		deliveryId: number,
		items = [cartItem(false)],
		{
			orderOverrides = {},
			total = mockState.app.total,
		}: {orderOverrides?: Record<string, any>; total?: any} = {},
	) => {
		const order = {...staleOrder(deliveryId), ...orderOverrides};

		mockState.app.order = order;
		mockState.app.items = items;
		mockState.app.total = total;
		mockCheckoutData = {order, total};
	};

	it("renders the delivery-time selector above address fields for Delivery with regular items", () => {
		setCheckoutOrder(DELIVERY_ID);

		render(<ShippingForm shippingPage={shippingPage() as any} />);

		const deliveryTimeSelector = screen.getByRole("combobox", {
			name: /delivery time/i,
		});

		const firstAddressField = screen.getByLabelText("Shipping first name");

		expect(deliveryTimeSelector).toBeInTheDocument();
		expect(
			deliveryTimeSelector.compareDocumentPosition(firstAddressField) &
				Node.DOCUMENT_POSITION_FOLLOWING,
		).toBeTruthy();
	});

	it("renders an ASAP delivery-time option for Delivery with regular items", () => {
		setCheckoutOrder(DELIVERY_ID);
		setAsapDeliveryTime(true);

		render(<ShippingForm shippingPage={shippingPage() as any} />);

		const deliveryTimeSelector = screen.getByRole("combobox", {
			name: /delivery time/i,
		});

		expect(
			within(deliveryTimeSelector).getByRole("option", {
				name: "ASAP",
			}),
		).toBeInTheDocument();
	});

	it("hides an old saved quote from slot prices while editing a Delivery address", async () => {
		setCheckoutOrder(DELIVERY_ID, [cartItem(false)], {
			orderOverrides: {
				custom_attrs: {deliveryQuote: {fee: "6.00", zoneLabel: "Naramata", quotedAt: Date.now()}},
			},
		});
		render(<ShippingForm shippingPage={shippingPage() as any} />);

		const selector = screen.getByRole("combobox", {name: /delivery time/i});
		expect(within(selector).getByRole("option", {name: "10:00 AM"})).toBeInTheDocument();
		expect(within(selector).getByRole("option", {name: "12:00 PM — Free delivery"})).toBeInTheDocument();
		expect(selector).not.toHaveTextContent("$6.00");

		fillRequiredShippingAddressFields({city: "Naramata", zip: "V0H 1N0"});
		await waitFor(() => expect(screen.getByLabelText("Shipping city")).toHaveValue("Naramata"));
		expect(selector).not.toHaveTextContent("$6.00");
		expect(mockRequestDeliveryQuote).not.toHaveBeenCalled();
	});

	it.each([
		{name: "Pickup", deliveryId: SELF_PICKUP_ID},
		{name: "Shipping", deliveryId: SHIPPING_DELIVERY_ID},
	])("does not render the delivery-time selector for $name", ({deliveryId}) => {
		setCheckoutOrder(deliveryId);

		render(<ShippingForm shippingPage={shippingPage() as any} />);

		expect(
			screen.queryByRole("combobox", {name: /delivery time/i}),
		).not.toBeInTheDocument();
	});

	it("does not render the delivery-time selector for Delivery when the cart is drop-ship-only", () => {
		setCheckoutOrder(DELIVERY_ID, [cartItem(true)]);

		render(<ShippingForm shippingPage={shippingPage() as any} />);

		expect(
			screen.queryByRole("combobox", {name: /delivery time/i}),
		).not.toBeInTheDocument();
	});

	it.each([
		{name: "Pickup", deliveryId: SELF_PICKUP_ID, items: [cartItem(false)]},
		{name: "Shipping", deliveryId: SHIPPING_DELIVERY_ID, items: [cartItem(false)]},
		{name: "drop-ship-only Delivery", deliveryId: DELIVERY_ID, items: [cartItem(true)]},
	])(
		"does not show ASAP for $name because the regular delivery-time selector is hidden",
		({deliveryId, items}) => {
			setCheckoutOrder(deliveryId, items);
			setAsapDeliveryTime(true);

			render(<ShippingForm shippingPage={shippingPage() as any} />);

			expect(
				screen.queryByRole("combobox", {name: /delivery time/i}),
			).not.toBeInTheDocument();
			expect(
				screen.queryByRole("option", {name: "ASAP"}),
			).not.toBeInTheDocument();
		},
	);

	it("requires delivery_time before submitting Delivery with regular items", async () => {
		setCheckoutOrder(DELIVERY_ID);

		render(<ShippingForm shippingPage={shippingPage() as any} />);

		fillRequiredShippingAddressFields();

		const submitButton = screen.getByRole("button", {
			name: "shippingForm.continueToPayment",
		});

		const form = submitButton.closest("form");

		if (!form) throw new Error("Expected continue button to be inside a form");

		fireEvent.submit(form);

		expect(await screen.findByText("Delivery time is required")).toBeInTheDocument();
		expect(mockSetLocalStorageCheckoutData).not.toHaveBeenCalled();
	});

	it("persists order.delivery_time on successful Delivery submit", async () => {
		setCheckoutOrder(DELIVERY_ID);

		render(<ShippingForm shippingPage={shippingPage() as any} />);

		fillRequiredShippingAddressFields();
		fireEvent.change(screen.getByRole("combobox", {name: /delivery time/i}), {
			target: {value: "10:00 AM"},
		});
		const persisted = await continueToPayment();

		expect(persisted.order.delivery_time).toBe("10:00 AM");
	});

	it("persists the Delivery fee when the selected regular delivery time applies the fee", async () => {
		setCheckoutOrder(DELIVERY_ID);

		render(<ShippingForm shippingPage={shippingPage() as any} />);

		fillRequiredShippingAddressFields();
		fireEvent.change(screen.getByRole("combobox", {name: /delivery time/i}), {
			target: {value: "10:00 AM"},
		});

		const persisted = await continueToPayment();

		expectPersistedShippingFee(persisted, "6.00", 0.3);
		expect(persisted.order.custom_attrs.originalShippingRate).toBe("6.00");
		expect(persisted.order.custom_attrs.deliveryQuote).toEqual({
			fee: "6.00", zoneLabel: "Naramata", quotedAt: expect.any(Number),
		});
		expect(persisted.order.custom_attrs.freeShippingApplied).toBe(false);
		expect(mockRequestDeliveryQuote).toHaveBeenCalledTimes(1);
		expect(mockRequestDeliveryQuote).toHaveBeenCalledWith({
			street: "123 Main St", unit: "", city: "Penticton", province: "BC", postalCode: "V2A 1A1",
		});
		expect(mockDispatch).toHaveBeenCalledWith(expect.objectContaining({
			type: "app/setCurrentStep", payload: TCheckoutStep.paymentMethod,
		}));
	});

	it("persists and prices paid ASAP Delivery like any fee-bearing delivery-time option", async () => {
		setCheckoutOrder(DELIVERY_ID);
		setAsapDeliveryTime(true);

		render(<ShippingForm shippingPage={shippingPage() as any} />);

		fillRequiredShippingAddressFields();
		fireEvent.change(screen.getByRole("combobox", {name: /delivery time/i}), {
			target: {value: "ASAP"},
		});

		const persisted = await continueToPayment();

		expect(persisted.order.delivery_time).toBe("ASAP");
		expectPersistedShippingFee(persisted, "6.00", 0.3);
	});

	it("waives the Delivery fee for fee-free ASAP Delivery", async () => {
		setCheckoutOrder(DELIVERY_ID);
		setAsapDeliveryTime(false);

		render(<ShippingForm shippingPage={shippingPage() as any} />);

		fillRequiredShippingAddressFields();
		fireEvent.change(screen.getByRole("combobox", {name: /delivery time/i}), {
			target: {value: "ASAP"},
		});

		const persisted = await continueToPayment();

		expect(persisted.order.delivery_time).toBe("ASAP");
		expectPersistedShippingFee(persisted, "0.00", 0);
	});

	it("waives the Delivery fee when the selected regular delivery time is fee-free", async () => {
		setCheckoutOrder(DELIVERY_ID);

		render(<ShippingForm shippingPage={shippingPage() as any} />);

		fillRequiredShippingAddressFields();
		fireEvent.change(screen.getByRole("combobox", {name: /delivery time/i}), {
			target: {value: "12:00 PM"},
		});

		const persisted = await continueToPayment();

		expectPersistedShippingFee(persisted, "0.00", 0);
		expect(persisted.order.custom_attrs.freeShippingApplied).toBe(true);
		expect(persisted.order.custom_attrs.originalShippingRate).toBe("6.00");
	});

	it("defaults to the Delivery fee when the selected regular delivery time label is unmatched", async () => {
		setCheckoutOrder(DELIVERY_ID);

		render(<ShippingForm shippingPage={shippingPage() as any} />);

		fillRequiredShippingAddressFields();

		const deliveryTimeSelector = screen.getByRole("combobox", {
			name: /delivery time/i,
		});

		const staleOption = document.createElement("option");
		staleOption.value = "Unlisted regular time";
		deliveryTimeSelector.appendChild(staleOption);
		fireEvent.change(deliveryTimeSelector, {
			target: {value: "Unlisted regular time"},
		});

		const persisted = await continueToPayment();

		expect(persisted.order.delivery_time).toBe("Unlisted regular time");
		expectPersistedShippingFee(persisted, "6.00", 0.3);
	});

	it("keeps Pickup free even when stale delivery-time metadata would otherwise require a fee", async () => {
		setCheckoutOrder(SELF_PICKUP_ID, [cartItem(false)], {
			orderOverrides: {delivery_time: "10:00 AM"},
		});

		render(<ShippingForm shippingPage={shippingPage() as any} />);

		const persisted = await continueToPayment();

		expectPersistedShippingFee(persisted, "0.00", 0);
	});

	it.each([
		{
			name: "uses the Shipping fee below the free-shipping threshold",
			itemsSubTotalPrice: "10.00",
			deliveryTime: "12:00 PM",
			expectedRate: SHIPPING_COST,
			expectedTax: 0.3,
			expectedFreeShippingApplied: false,
		},
		{
			name: "keeps free Shipping above the free-shipping threshold",
			itemsSubTotalPrice: "100.00",
			deliveryTime: "10:00 AM",
			expectedRate: "0.00",
			expectedTax: 0,
			expectedFreeShippingApplied: true,
		},
	])(
		"$name and ignores delivery-time fee metadata",
		async ({
			itemsSubTotalPrice,
			deliveryTime,
			expectedRate,
			expectedTax,
			expectedFreeShippingApplied,
		}) => {
			setCheckoutOrder(SHIPPING_DELIVERY_ID, [cartItem(false)], {
				orderOverrides: {delivery_time: deliveryTime},
				total: checkoutTotal(itemsSubTotalPrice),
			});

			render(<ShippingForm shippingPage={shippingPage() as any} />);

			fillRequiredShippingAddressFields();

			const persisted = await continueToPayment();

			expectPersistedShippingFee(persisted, expectedRate, expectedTax);
			expect(persisted.order.custom_attrs.originalShippingRate).toBe(SHIPPING_COST);
			expect(persisted.order.custom_attrs.freeShippingApplied).toBe(
				expectedFreeShippingApplied,
			);
			expect(persisted.order.delivery_time).toBeUndefined();
		},
	);

	it.each([
		{
			name: "mixed cart with no drop-ship delivery time yet",
			items: [cartItem(false), cartItem(true)],
			selectedRegularTime: "12:00 PM",
		},
		{
			name: "mixed cart with an unmatched drop-ship delivery time",
			items: [cartItem(false), cartItem(true)],
			selectedRegularTime: "12:00 PM",
			dropShipDeliveryTime: "Unlisted drop-ship time",
		},
		{
			name: "drop-ship-only cart with no drop-ship delivery time yet",
			items: [cartItem(true)],
		},
	])(
		"applies the Delivery fee for a $name until Delivery Details recalculates",
		async ({items, selectedRegularTime, dropShipDeliveryTime}) => {
			setCheckoutOrder(DELIVERY_ID, items, {
				orderOverrides: {
					drop_ship_delivery_time: dropShipDeliveryTime,
				},
			});

			render(<ShippingForm shippingPage={shippingPage() as any} />);

			fillRequiredShippingAddressFields();

			if (selectedRegularTime) {
				fireEvent.change(screen.getByRole("combobox", {name: /delivery time/i}), {
					target: {value: selectedRegularTime},
				});
			}

			const persisted = await continueToPayment();

			expectPersistedShippingFee(persisted, "6.00", 0.3);
		},
	);

	it("quotes a non-Penticton BC address again on every Delivery submit, never on field edits", async () => {
		setCheckoutOrder(DELIVERY_ID, [cartItem(true)], {
			orderOverrides: {custom_attrs: {deliveryQuote: {fee: "4.00", zoneLabel: "Old", quotedAt: Date.now()}}},
		});
		render(<ShippingForm shippingPage={shippingPage() as any} />);
		fillRequiredShippingAddressFields({city: "Naramata", zip: "V0H 1N0"});
		expect(mockRequestDeliveryQuote).not.toHaveBeenCalled();

		await continueToPayment();
		fireEvent.change(screen.getByLabelText("Shipping address line 1"), {
			target: {value: "2 New St"},
		});
		expect(mockRequestDeliveryQuote).toHaveBeenCalledTimes(1);
		fireEvent.click(screen.getByRole("button", {name: "shippingForm.continueToPayment"}));
		await waitFor(() => expect(mockSetLocalStorageCheckoutData).toHaveBeenCalledTimes(2));
		expect(mockRequestDeliveryQuote).toHaveBeenCalledTimes(2);
		expect(mockRequestDeliveryQuote).toHaveBeenLastCalledWith(expect.objectContaining({
			street: "2 New St", city: "Naramata", postalCode: "V0H 1N0",
		}));
	});

	it("rejects a non-BC Delivery postal code before requesting a quote", async () => {
		setCheckoutOrder(DELIVERY_ID, [cartItem(true)]);
		render(<ShippingForm shippingPage={shippingPage() as any} />);
		fillRequiredShippingAddressFields({zip: "T2P 1A1"});
		const button = screen.getByRole("button", {name: "shippingForm.continueToPayment"});
		fireEvent.submit(button.closest("form")!);
		await waitFor(() => expect(button).not.toBeDisabled());
		expect(mockRequestDeliveryQuote).not.toHaveBeenCalled();
		expect(mockSetLocalStorageCheckoutData).not.toHaveBeenCalled();
	});

	it.each([
		{status: "out_of_range", maxKm: 30} as const,
		{status: "unverifiable"} as const,
		{status: "unavailable"} as const,
	])("blocks $status without saving, advancing, mutating the order or changing the method", async (response) => {
		setCheckoutOrder(DELIVERY_ID, [cartItem(true)], {
			orderOverrides: {custom_attrs: {deliveryQuote: {fee: "4.00", zoneLabel: "Old", quotedAt: 1}}},
		});
		const originalOrder = JSON.parse(JSON.stringify(mockCheckoutData.order));
		mockRequestDeliveryQuote.mockResolvedValue(response);
		render(<ShippingForm shippingPage={shippingPage() as any} />);
		fillRequiredShippingAddressFields();
		fireEvent.click(screen.getByRole("button", {name: "shippingForm.continueToPayment"}));

		const alert = await screen.findByRole("alert");
		expect(alert).toHaveTextContent(response.status === "out_of_range"
			? "Local delivery is available up to 30 km from the store. Please switch to Shipping."
			: "We couldn't verify your delivery address.");
		expect(screen.getByLabelText("Delivery method")).toHaveValue(String(DELIVERY_ID));
		expect(mockCheckoutData.order).toEqual(originalOrder);
		expect(mockSetLocalStorageCheckoutData).not.toHaveBeenCalled();
		expect(mockDispatch).not.toHaveBeenCalled();
		expect(screen.getByRole("button", {name: "shippingForm.continueToPayment"})).not.toBeDisabled();
	});

	it.each([
		{label: "Shipping address line 1", value: "2 Edited St"},
		{label: "Delivery method", value: String(SHIPPING_DELIVERY_ID)},
	])("does not show an old correction when $label changes during a pending quote, but shows fresh-submit feedback", async ({label, value}) => {
		setCheckoutOrder(DELIVERY_ID, [cartItem(true)]);
		let resolveQuote!: (response: DeliveryQuoteResponse) => void;
		mockRequestDeliveryQuote.mockResolvedValue({status: "out_of_range", maxKm: 30});
		mockRequestDeliveryQuote.mockImplementationOnce(() => new Promise((resolve) => {
			resolveQuote = resolve;
		}));
		render(<ShippingForm shippingPage={shippingPage() as any} />);
		fillRequiredShippingAddressFields();
		const button = screen.getByRole("button", {name: "shippingForm.continueToPayment"});
		fireEvent.click(button);
		await waitFor(() => expect(mockRequestDeliveryQuote).toHaveBeenCalledTimes(1));
		expect(button).toBeDisabled();

		fireEvent.change(screen.getByLabelText(label), {target: {value}});
		await act(async () => resolveQuote({
			status: "needs_confirmation",
			address: {street: "385 Martin St", city: "Naramata", province: "BC", postalCode: "V0H 1N0"},
		}));

		expect(screen.getByLabelText(label)).toHaveValue(value);
		expect(screen.queryByRole("alert")).not.toBeInTheDocument();
		expect(button).not.toBeDisabled();
		expect(mockRequestDeliveryQuote).toHaveBeenCalledTimes(1);
		expect(mockSetLocalStorageCheckoutData).not.toHaveBeenCalled();
		expect(mockDispatch).not.toHaveBeenCalled();

		fireEvent.change(screen.getByLabelText("Delivery method"), {target: {value: String(DELIVERY_ID)}});
		fireEvent.click(button);
		expect(await screen.findByRole("alert")).toHaveTextContent("Local delivery is available up to 30 km");
		expect(mockRequestDeliveryQuote).toHaveBeenCalledTimes(2);
		expect(mockRequestDeliveryQuote).toHaveBeenLastCalledWith(expect.objectContaining({
			street: label === "Shipping address line 1" ? value : "123 Main St",
		}));
		expect(button).not.toBeDisabled();
		expect(mockSetLocalStorageCheckoutData).not.toHaveBeenCalled();
	});

	it("normalizes a rejected fetch through the real quote client without crashing Formik, and allows retry", async () => {
		setCheckoutOrder(DELIVERY_ID, [cartItem(true)]);
		const actual = await vi.importActual<typeof import("../../lib/deliveryQuote")>("../../lib/deliveryQuote");
		mockRequestDeliveryQuote.mockImplementation(actual.requestDeliveryQuote);
		const fetchMock = vi.fn().mockRejectedValueOnce(new Error("Network offline"));
		global.fetch = fetchMock;
		render(<ShippingForm shippingPage={shippingPage() as any} />);
		fillRequiredShippingAddressFields();
		fireEvent.click(screen.getByRole("button", {name: "shippingForm.continueToPayment"}));

		expect(await screen.findByRole("alert")).toHaveTextContent("We couldn't verify your delivery address.");
		expect(fetchMock).toHaveBeenCalledWith("/api/deliveryQuote", expect.objectContaining({method: "POST"}));
		expect(mockSetLocalStorageCheckoutData).not.toHaveBeenCalled();
		expect(mockDispatch).not.toHaveBeenCalled();
		expect(screen.getByRole("button", {name: "shippingForm.continueToPayment"})).not.toBeDisabled();

		fetchMock.mockResolvedValueOnce({
			status: 200,
			json: async () => ({status: "ok", fee: "6.00", zoneLabel: "Naramata", distanceKm: 20}),
		});
		const persisted = await continueToPayment();
		expect(fetchMock).toHaveBeenCalledTimes(2);
		expectPersistedShippingFee(persisted, "6.00", 0.3);
	});

	it("accepts a corrected address into Formik before re-quoting and saves only after ok", async () => {
		setCheckoutOrder(DELIVERY_ID);
		const originalOrder = JSON.parse(JSON.stringify(mockCheckoutData.order));
		const correctedAddress = {street: "385 Martin St", unit: "2", city: "Naramata", province: "BC", postalCode: "V0H 1N0"};
		mockRequestDeliveryQuote.mockResolvedValueOnce({status: "needs_confirmation", address: correctedAddress});
		render(<ShippingForm shippingPage={shippingPage() as any} />);
		fillRequiredShippingAddressFields();
		fireEvent.change(screen.getByRole("combobox", {name: /delivery time/i}), {target: {value: "10:00 AM"}});
		fireEvent.click(screen.getByRole("button", {name: "shippingForm.continueToPayment"}));

		expect(await screen.findByRole("alert")).toHaveTextContent("385 Martin St, 2, Naramata, BC, V0H 1N0");
		expect(mockCheckoutData.order).toEqual(originalOrder);
		expect(mockSetLocalStorageCheckoutData).not.toHaveBeenCalled();
		expect(mockDispatch).not.toHaveBeenCalled();
		fireEvent.click(screen.getByRole("button", {name: "Use this address"}));

		await waitFor(() => expect(mockSetLocalStorageCheckoutData).toHaveBeenCalledTimes(1));
		expect(mockRequestDeliveryQuote).toHaveBeenCalledTimes(2);
		expect(mockRequestDeliveryQuote).toHaveBeenLastCalledWith(correctedAddress);
		expect(screen.getByLabelText("Shipping address line 1")).toHaveValue(correctedAddress.street);
		expect(screen.getByLabelText("Shipping unit")).toHaveValue(correctedAddress.unit);
		expect(screen.getByLabelText("Shipping city")).toHaveValue(correctedAddress.city);
		expect(screen.getByLabelText("Shipping state")).toHaveValue(correctedAddress.province);
		expect(screen.getByLabelText("Shipping zip")).toHaveValue(correctedAddress.postalCode);
		const persisted = mockSetLocalStorageCheckoutData.mock.calls[0][0];
		expect(persisted.order.customer.addresses[0]).toEqual(expect.objectContaining({
			first_name: "Jane", address_line_1: correctedAddress.street, address_line_2: "2", city: correctedAddress.city, zip: correctedAddress.postalCode,
		}));
		expect(persisted.order.delivery_time).toBe("10:00 AM");
		expect(screen.queryByRole("alert")).not.toBeInTheDocument();
	});

	it.each([
		{label: "Shipping first name", value: "Edited"},
		{label: "Shipping last name", value: "Edited"},
		{label: "Shipping address line 1", value: "2 Edited St"},
		{label: "Shipping unit", value: "3"},
		{label: "Shipping city", value: "Naramata"},
		{label: "Shipping state", value: "BC"},
		{label: "Shipping zip", value: "V0H 1N0"},
		{label: "Billing first name", value: "Edited"},
		{label: "Delivery time", value: "12:00 PM"},
		{label: "Delivery method", value: String(SELF_PICKUP_ID)},
	])("clears quote feedback when $label is edited without making another quote request", async ({label, value}) => {
		setCheckoutOrder(DELIVERY_ID);
		mockRequestDeliveryQuote.mockResolvedValue({status: "unverifiable"});
		render(<ShippingForm shippingPage={shippingPage() as any} />);
		fillRequiredShippingAddressFields({state: "British Columbia"});
		fireEvent.change(screen.getByRole("combobox", {name: /delivery time/i}), {target: {value: "10:00 AM"}});
		fireEvent.click(screen.getByRole("button", {name: "shippingForm.continueToPayment"}));
		await screen.findByRole("alert");

		const field = label === "Delivery time"
			? screen.getByRole("combobox", {name: /delivery time/i})
			: screen.getByLabelText(label);

		fireEvent.change(field, {target: {value}});
		await waitFor(() => expect(screen.queryByRole("alert")).not.toBeInTheDocument());
		expect(mockRequestDeliveryQuote).toHaveBeenCalledTimes(1);
		expect(mockSetLocalStorageCheckoutData).not.toHaveBeenCalled();
	});

	it("offers Shipping after a blocked quote without auto-submitting or silently switching", async () => {
		setCheckoutOrder(DELIVERY_ID, [cartItem(true)]);
		mockRequestDeliveryQuote.mockResolvedValue({status: "out_of_range", maxKm: 30});
		render(<ShippingForm shippingPage={shippingPage() as any} />);
		fillRequiredShippingAddressFields();
		fireEvent.click(screen.getByRole("button", {name: "shippingForm.continueToPayment"}));
		await screen.findByRole("alert");
		fireEvent.click(screen.getByRole("button", {name: "Switch to Shipping"}));

		await waitFor(() => expect(screen.getByLabelText("Delivery method")).toHaveValue(String(SHIPPING_DELIVERY_ID)));
		expect(screen.queryByRole("alert")).not.toBeInTheDocument();
		expect(mockSetLocalStorageCheckoutData).not.toHaveBeenCalled();
		expect(mockDispatch).not.toHaveBeenCalled();
		await continueToPayment();
		expect(mockRequestDeliveryQuote).toHaveBeenCalledTimes(1);
	});

	it.each([SHIPPING_DELIVERY_ID, SELF_PICKUP_ID])("drops a stale quote on method %s submit without requesting another", async (deliveryId) => {
		setCheckoutOrder(deliveryId, [cartItem(false)], {
			orderOverrides: {custom_attrs: {deliveryQuote: {fee: "6.00", zoneLabel: "Old", quotedAt: 1}}},
		});
		render(<ShippingForm shippingPage={shippingPage() as any} />);

		if (deliveryId === SHIPPING_DELIVERY_ID) fillRequiredShippingAddressFields();
		const persisted = await continueToPayment();
		expect(persisted.order.custom_attrs).not.toHaveProperty("deliveryQuote");
		expect(mockCheckoutData.order.custom_attrs.deliveryQuote).toBeDefined();
		expect(mockRequestDeliveryQuote).not.toHaveBeenCalled();
	});

	it("stores the quoted original fee and waiver for a Delivery subtotal of $100", async () => {
		setCheckoutOrder(DELIVERY_ID, [cartItem(true)], {total: checkoutTotal("100.00")});
		render(<ShippingForm shippingPage={shippingPage() as any} />);
		fillRequiredShippingAddressFields();
		const persisted = await continueToPayment();
		expectPersistedShippingFee(persisted, "0.00", 0);
		expect(persisted.order.custom_attrs.originalShippingRate).toBe("6.00");
		expect(persisted.order.custom_attrs.freeShippingApplied).toBe(true);
		expect(mockRequestDeliveryQuote).toHaveBeenCalledTimes(1);
	});

	it("switches a paid shipping order to pickup and clears stale payment and shipping totals", async () => {
		const paidShippingOrder = {
			...staleOrder(),
			paid_at: "2026-05-23T12:00:00.000Z",
			payment_method_id: "5",
			paymentMethod: {payment_method_id: "5", title: "Credit Card"},
			tip: "5.00",
			delivery_time: "10:00 AM",
			service_total_price: "6.00",
			tax_amount: "0.30",
			total_price: "16.30",
			custom_attrs: {
				checkoutCompleted: true,
				shippingRate: "6.00",
				originalShippingRate: "6.00",
				shippingTax: "0.30",
				freeShippingApplied: false,
			},
			customer: {
				...staleOrder().customer,
				addresses: [{type: "shipping", first_name: "Old", last_name: "Ship"}],
			},
		} as any;

		const paidShippingTotal = {
			price: "16.30",
			itemsSubTotal: {price: "10.00"},
			servicesSubTotal: {qty: 1, price: "6.00"},
			tax: {shipping: {shippingTaxes: "0.30"}, totalTaxAmount: "0.30"},
		} as any;

		mockState.app.order = paidShippingOrder;
		mockState.app.total = paidShippingTotal;
		mockCheckoutData = {order: paidShippingOrder, total: paidShippingTotal};

		render(<ShippingForm shippingPage={shippingPage() as any} />);

		fireEvent.change(screen.getByLabelText("Delivery method"), {
			target: {value: String(SELF_PICKUP_ID)},
		});
		fireEvent.click(
			screen.getByRole("button", {name: "shippingForm.continueToPayment"}),
		);

		await waitFor(() => {
			expect(mockSetLocalStorageCheckoutData).toHaveBeenCalled();
		});

		const persisted = mockSetLocalStorageCheckoutData.mock.calls[0][0];
		expect(persisted.order.customer.addresses).toEqual([]);
		expect(persisted.order.services[0]).toEqual(
			expect.objectContaining({
				service_id: SELF_PICKUP_ID,
				is_delivery: false,
				total_price: "0.00",
			}),
		);
		expect(persisted.order.paid_at).toBeNull();
		expect(persisted.order.payment_method_id).toBeNull();
		expect(persisted.order.paymentMethod).toBeUndefined();
		expect(persisted.order.tip).toBeUndefined();
		expect(persisted.order.delivery_time).toBeUndefined();
		expect(persisted.order.custom_attrs.checkoutCompleted).toBeUndefined();
		expect(persisted.order.service_total_price).toBe("0.00");
		expect(persisted.order.custom_attrs.shippingRate).toBe("0.00");
		expect(persisted.order.custom_attrs.shippingTax).toBe(0);
		expect(persisted.total.servicesSubTotal.price).toBe("0.00");
		expect(persisted.total.tax.shipping.shippingTaxes).toBe("0");
		expect(persisted.total.tax.totalTaxAmount).toBe("0");
		expect(persisted.total.price).toBe("10.00");
		expect(mockDispatch).toHaveBeenCalledWith(
			expect.objectContaining({type: "app/setOrder", payload: persisted.order}),
		);
		expect(mockDispatch).toHaveBeenCalledWith(
			expect.objectContaining({type: "app/setTotal", payload: persisted.total}),
		);
	});

	it("persists submitted shipping names and keeps billing names from the billing form", async () => {
		render(<ShippingForm shippingPage={shippingPage() as any} />);

		fillRequiredShippingAddressFields({
			first_name: "Submitted",
			last_name: "Recipient",
		});
		fireEvent.change(screen.getByLabelText("Billing first name"), {
			target: {value: "Billing"},
		});
		fireEvent.change(screen.getByLabelText("Billing last name"), {
			target: {value: "Payer"},
		});

		fireEvent.click(
			screen.getByRole("button", {name: "shippingForm.continueToPayment"}),
		);

		await waitFor(() => {
			expect(mockSetLocalStorageCheckoutData).toHaveBeenCalled();
		});

		const savedOrder = mockSetLocalStorageCheckoutData.mock.calls[0][0].order;

		const shippingAddress = savedOrder.customer.addresses.find(
			(address: any) => address.type === "shipping",
		);

		const billingAddress = savedOrder.customer.addresses.find(
			(address: any) => address.type === "billing",
		);

		expect(billingAddress).toEqual(
			expect.objectContaining({
				first_name: "Billing",
				last_name: "Payer",
			}),
		);
		expect(shippingAddress).toEqual(
			expect.objectContaining({
				first_name: "Submitted",
				last_name: "Recipient",
			}),
		);
		expect(shippingAddress).not.toHaveProperty("phone");
		expect(billingAddress).not.toHaveProperty("phone");
	});
});

import {vi, type Mock} from "vitest";
import React from "react";

import {act, render, screen, waitFor} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {TPublishingStatus} from "../../types/Order";
import PaymentMethodForm from "./PaymentMethodForm";
import {CREDIT_CARD_PAYMENT_METHOD, DELIVERY_ID, PAY_IN_STORE_PAYMENT_METHOD, SELF_PICKUP_ID} from "../../constants";
import {PaymentValidationError, PaymentOutcomeError, completeCreditCardPaymentOutcome} from "../../lib/paymentOutcome";
import {getCheckoutStepWarning} from "../../lib/checkoutGuards";
import {setCurrentStep, setStepWarning} from "../../redux/reducers/app";
import {TCheckoutStep} from "../../types/common";

const mockDispatch = vi.fn();

let mockState: any = {};

let mockCheckoutData: any = {};

const mockOnThankYouPage = vi.fn();

const mockSubmitPayment = vi.fn();

const mockRecordApprovedPayment = vi.fn();

vi.mock("../../hooks/redux", () => ({
	useAppSelector: (selector: any) => selector(mockState),
	useAppDispatch: () => mockDispatch,
}));

vi.mock("../../lib/paymentOutcome", async () => {
	const original = await vi.importActual<typeof import("../../lib/paymentOutcome")>("../../lib/paymentOutcome");

	return {
		...original,
		completeCreditCardPaymentOutcome: vi.fn(original.completeCreditCardPaymentOutcome),
	};
});

vi.mock("../../hooks/checkoutData", () => ({
	getCheckoutData: vi.fn(() => mockCheckoutData),
	setLocalStorageCheckoutData: vi.fn((updates) => {
		mockCheckoutData = {...mockCheckoutData, ...updates};
	}),
}));

vi.mock("../../contexts/CheckoutConfigContext", () => ({
	useCheckoutConfig: () => ({
		onThankYouPage: mockOnThankYouPage,
		payfirmaInfo: {token: "payfirma-api-key", environment: "TEST", endpoint: ""},
	}),
}));

vi.mock("../../hooks/useDeliveryTimes", () => ({
	useDeliveryTimes: () => ({
		isLoading: false,
		isError: false,
		data: {
			isNextDay: false,
			times: [
				{label: "10:00 AM", applyDeliveryFee: true},
				{label: "11:00 AM", applyDeliveryFee: true},
			],
		},
	}),
}));

vi.mock("../../hooks/useCreditCardPaymentOutcome", () => ({
	useCreditCardPaymentOutcome: () => ({
		recordApprovedPayment: mockRecordApprovedPayment,
	}),
}));

vi.mock("./PayHQ/PayHQ", async () => {
	const React = await vi.importActual<typeof import("react")>("react");

	// The PayHQ mock only resolves `submitPayment()`.
	// PaymentMethodForm records the payment approval from that result,
	// serving as a single source of truth.
	return {
		default: React.forwardRef((_props: any, ref: any) => {
			React.useImperativeHandle(ref, () => ({
				submitPayment: mockSubmitPayment,
			}));

			return <div data-testid="payhq">PayHQ mock</div>;
		}),
	};
});

const creditCardMethod = {
	payment_method_id: CREDIT_CARD_PAYMENT_METHOD,
	title: "Credit Card",
} as any;

const payInStoreMethod = {
	payment_method_id: PAY_IN_STORE_PAYMENT_METHOD,
	title: "Pay in store",
} as any;

const completeShippingAddress = (overrides: any = {}) => ({
	type: "shipping",
	first_name: "Ada",
	last_name: "Lovelace",
	address_line_1: "123 Main St",
	city: "Penticton",
	state: "BC",
	zip: "V2A 1A1",
	...overrides,
});

const completeCustomer = (overrides: any = {}) => ({
	id: "customer-1",
	first_name: "Ada",
	last_name: "Lovelace",
	email: "ada@example.com",
	phone: "2505551234",
	dob: "1990-01-01",
	addresses: [completeShippingAddress()],
	...overrides,
});

const pickupService = (overrides: any = {}) => ({
	service_id: SELF_PICKUP_ID,
	serviceDelivery: {
		title: "Self Pickup",
		delivery: {
			alias: "selfPickup",
			title: "Self Pickup",
		},
	},
	...overrides,
});

const deliveryService = (overrides: any = {}) => ({
	service_id: DELIVERY_ID,
	serviceDelivery: {
		title: "Delivery",
		delivery: {
			alias: "delivery",
			title: "Delivery",
		},
	},
	...overrides,
});

const checkoutSteps = [
	TCheckoutStep.contactInfo,
	TCheckoutStep.shippingAddress,
	TCheckoutStep.paymentMethod,
];

const completeStepper = {
	currentStep: TCheckoutStep.paymentMethod,
	steps: checkoutSteps,
	filledSteps: [TCheckoutStep.contactInfo, TCheckoutStep.shippingAddress],
};

function makeOrder(overrides: any = {}) {
	return {
		id: "order-1",
		status_id: null,
		payment_method_id: CREDIT_CARD_PAYMENT_METHOD,
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
		services: [pickupService()],
		customer: completeCustomer(),
		...overrides,
	};
}

const total = {
	price: "100.00",
	itemsSubTotal: {price: "100.00", qty: 1},
	discount: "0",
	tax: {totalTaxAmount: "0.00"},
	servicesSubTotal: {price: "0.00", qty: 0},
} as any;

const items: any[] = [];

function setup({
	order = makeOrder(),
	paymentMethods = [creditCardMethod],
}: {
	order?: any;
	paymentMethods?: any[];
} = {}) {
	const stepper = {...completeStepper};
	mockState = {app: {order, total, items, stepper}};
	mockCheckoutData = {order, total, items, stepper};

	return render(
		<PaymentMethodForm
			paymentPage={{paymentMethods} as any}
		/>,
	);
}

async function expectRedirectedToCheckoutStep(step: TCheckoutStep) {
	await waitFor(() => {
		expect(mockDispatch).toHaveBeenCalledWith(setCurrentStep(step));
	});
	expect(mockDispatch).toHaveBeenCalledWith(
		setStepWarning(getCheckoutStepWarning(step)),
	);
}

describe("PaymentMethodForm shared PayHQ submit button", () => {
	const originalScrollIntoView = Element.prototype.scrollIntoView;
	let paymentFormEl: HTMLDivElement | null = null;

	beforeAll(() => {
		Element.prototype.scrollIntoView = vi.fn();
	});

	afterAll(() => {
		if (originalScrollIntoView === undefined) {
			delete (Element.prototype as any).scrollIntoView;
		} else {
			Element.prototype.scrollIntoView = originalScrollIntoView;
		}
	});

	afterEach(() => {
		if (paymentFormEl) {
			document.body.removeChild(paymentFormEl);
			paymentFormEl = null;
		}
	});

	beforeEach(() => {
		vi.clearAllMocks();
		mockSubmitPayment.mockResolvedValue({paidAt: "2026-05-23T12:00:00.000Z"});
		mockRecordApprovedPayment.mockImplementation(({paidAt}: {paidAt: string}) => {
			mockCheckoutData = {
				...mockCheckoutData,
				order: {...mockCheckoutData.order, paid_at: paidAt},
			};
		});
		mockOnThankYouPage.mockResolvedValue(undefined);
	});

	it("uses the single visible button to pay by card and complete checkout", async () => {
		const user = userEvent.setup();

		setup();

		expect(screen.getByTestId("payhq")).toBeInTheDocument();
		expect(screen.queryByRole("button", {name: /^pay$/i})).not.toBeInTheDocument();
		expect(screen.queryByRole("button", {name: /^complete order$/i})).not.toBeInTheDocument();

		const actionButtons = screen.getAllByRole("button").filter(b => b.textContent?.match(/pay|complete/i));
		expect(actionButtons).toHaveLength(1);

		await user.click(screen.getByRole("button", {name: /^pay and complete order$/i}));

		await waitFor(() => {
			expect(mockSubmitPayment).toHaveBeenCalledTimes(1);
		});
		expect(mockRecordApprovedPayment).toHaveBeenCalledTimes(1);
		expect(mockRecordApprovedPayment).toHaveBeenCalledWith({
			paidAt: "2026-05-23T12:00:00.000Z",
			tip: "",
		});

		await waitFor(() => {
			expect(mockOnThankYouPage).toHaveBeenCalledTimes(1);
		});

		const [checkoutArg] = mockOnThankYouPage.mock.calls[0];
		expect(checkoutArg.order.paid_at).toBe("2026-05-23T12:00:00.000Z");
		expect(checkoutArg.order.custom_attrs.checkoutCompleted).toBe(true);

		expect(mockRecordApprovedPayment.mock.invocationCallOrder[0]).toBeLessThan(
			mockOnThankYouPage.mock.invocationCallOrder[0]
		);
	});

	it("uses the latest persisted tipped total when completing checkout after card approval", async () => {
		const user = userEvent.setup();

		const deliveryOrder = makeOrder({
			custom_attrs: {deliveryQuote: {fee: "6.00", zoneLabel: "Naramata", quotedAt: Date.now()}},
			services: [{service_id: DELIVERY_ID, serviceDelivery: {delivery: {title: "Delivery"}}}],
			delivery_time: "10:00 AM",
			total_price: "100.00",
			tip: "0.00",
		});

		const tippedTotal = {...total, price: "105.00"};

		mockRecordApprovedPayment.mockImplementation(({paidAt}: {paidAt: string}) => {
			mockCheckoutData = {
				...mockCheckoutData,
				order: {
					...mockCheckoutData.order,
					paid_at: paidAt,
					tip: "5",
					total_price: "105.00",
				},
				total: tippedTotal,
			};

			return {order: mockCheckoutData.order, total: mockCheckoutData.total};
		});

		setup({order: deliveryOrder});

		const tipInput = screen.getByRole("spinbutton", {name: /tip/i});
		await user.clear(tipInput);
		await user.paste("5");

		await user.click(screen.getByRole("button", {name: /^pay and complete order$/i}));

		await waitFor(() => expect(mockOnThankYouPage).toHaveBeenCalledTimes(1));

		const [checkoutArg] = mockOnThankYouPage.mock.calls[0];
		expect(checkoutArg.order.paid_at).toBe("2026-05-23T12:00:00.000Z");
		expect(checkoutArg.order.tip).toBe("5");
		expect(checkoutArg.order.total_price).toBe("105.00");
		expect(checkoutArg.order.delivery_time).toBe("10:00 AM");
		expect(checkoutArg.total.price).toBe("105.00");
	});

	it("does not render a delivery_time selector for Delivery orders", () => {
		const deliveryOrder = makeOrder({
			services: [deliveryService()],
		});

		setup({order: deliveryOrder});

		expect(screen.queryByRole("combobox", {name: /delivery time/i})).not.toBeInTheDocument();
	});

	it("does not require a submitted delivery_time before submitting PayHQ payment", async () => {
		const user = userEvent.setup();

		const deliveryOrder = makeOrder({
			delivery_time: "",
			custom_attrs: {deliveryQuote: {fee: "6.00", zoneLabel: "Naramata", quotedAt: Date.now()}},
			services: [deliveryService()],
		});

		setup({order: deliveryOrder});

		await user.click(screen.getByRole("button", {name: /^pay and complete order$/i}));

		await waitFor(() => expect(mockSubmitPayment).toHaveBeenCalledTimes(1));
		expect(screen.queryByText("Delivery time is required")).not.toBeInTheDocument();
		expect(mockRecordApprovedPayment).toHaveBeenCalledTimes(1);
		await waitFor(() => expect(mockOnThankYouPage).toHaveBeenCalledTimes(1));
	});

	it("does not revalidate delivery_time from the latest persisted order before submitting PayHQ payment", async () => {
		const user = userEvent.setup();

		setup({order: makeOrder({services: [pickupService()]})});

		// Simulate persisted checkout data changing from pickup to Delivery after render.
		mockCheckoutData = {
			...mockCheckoutData,
			order: makeOrder({
				delivery_time: "",
				custom_attrs: {deliveryQuote: {fee: "6.00", zoneLabel: "Naramata", quotedAt: Date.now()}},
				services: [deliveryService()],
			}),
		};

		await user.click(screen.getByRole("button", {name: /^pay and complete order$/i}));

		await waitFor(() => expect(mockSubmitPayment).toHaveBeenCalledTimes(1));
		expect(screen.queryByText("Delivery time is required")).not.toBeInTheDocument();
		expect(mockRecordApprovedPayment).toHaveBeenCalledTimes(1);
		await waitFor(() => expect(mockOnThankYouPage).toHaveBeenCalledTimes(1));
	});

	it("blocks payment for a restored Delivery address without a quote before contacting PayHQ", async () => {
		const user = userEvent.setup();
		setup({order: makeOrder({services: [deliveryService()]})});

		await user.click(screen.getByRole("button", {name: /^pay and complete order$/i}));

		await expectRedirectedToCheckoutStep(TCheckoutStep.shippingAddress);
		expect(mockSubmitPayment).not.toHaveBeenCalled();
		expect(mockRecordApprovedPayment).not.toHaveBeenCalled();
		expect(mockOnThankYouPage).not.toHaveBeenCalled();
	});

	it("does not recharge when the latest persisted credit-card order is already paid", async () => {
		const user = userEvent.setup();
		const paidAt = "2026-05-23T11:30:00.000Z";

		setup({order: makeOrder({paid_at: null})});

		// Simulate another completion path recording payment after render but before click.
		mockCheckoutData = {
			...mockCheckoutData,
			order: makeOrder({paid_at: paidAt}),
		};

		await user.click(screen.getByRole("button", {name: /^pay and complete order$/i}));

		await waitFor(() => expect(mockOnThankYouPage).toHaveBeenCalledTimes(1));
		expect(mockSubmitPayment).not.toHaveBeenCalled();
		expect(mockRecordApprovedPayment).not.toHaveBeenCalled();

		const [checkoutArg] = mockOnThankYouPage.mock.calls[0];
		expect(checkoutArg.order.paid_at).toBe(paidAt);
		expect(checkoutArg.order.custom_attrs.checkoutCompleted).toBe(true);
	});

	it("blocks credit-card payment when the latest persisted customer is incomplete", async () => {
		const user = userEvent.setup();

		setup();

		// Simulate persisted checkout data becoming stale after render but before payment submission.
		mockCheckoutData = {
			...mockCheckoutData,
			order: makeOrder({customer: completeCustomer({phone: ""})}),
		};

		await user.click(screen.getByRole("button", {name: /^pay and complete order$/i}));

		await expectRedirectedToCheckoutStep(TCheckoutStep.contactInfo);
		expect(mockSubmitPayment).not.toHaveBeenCalled();
		expect(mockRecordApprovedPayment).not.toHaveBeenCalled();
		expect(mockOnThankYouPage).not.toHaveBeenCalled();
	});

	it("blocks credit-card payment when latest persisted contact is complete but shipping is incomplete", async () => {
		const user = userEvent.setup();

		setup();

		// Simulate persisted checkout data changing after render; the submit guard must read this order.
		mockCheckoutData = {
			...mockCheckoutData,
			order: makeOrder({
				customer: completeCustomer({addresses: []}),
				services: [deliveryService()],
			}),
		};

		await user.click(screen.getByRole("button", {name: /^pay and complete order$/i}));

		await expectRedirectedToCheckoutStep(TCheckoutStep.shippingAddress);
		expect(mockSubmitPayment).not.toHaveBeenCalled();
		expect(mockRecordApprovedPayment).not.toHaveBeenCalled();
		expect(mockOnThankYouPage).not.toHaveBeenCalled();
	});

	it("keeps the shared button busy after thank-you callback resolves", async () => {
		const user = userEvent.setup();
		let resolveThankYou!: () => void;

		const thankYouPromise = new Promise<void>((resolve) => {
			resolveThankYou = resolve;
		});

		mockOnThankYouPage.mockReturnValue(thankYouPromise);

		setup();

		const button = screen.getByRole("button", {name: /^pay and complete order$/i});
		await user.click(button);

		await waitFor(() => expect(mockOnThankYouPage).toHaveBeenCalledTimes(1));
		expect(button).toBeDisabled();
		expect(screen.getByLabelText("Loading…")).toBeInTheDocument();

		await act(async () => {
			resolveThankYou();
			await thankYouPromise;
		});

		expect(button).toBeDisabled();
		expect(screen.getByLabelText("Loading…")).toBeInTheDocument();
	});

	it("retries only checkout completion after card approval when checkout completion fails", async () => {
		const user = userEvent.setup();
		const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
		const checkoutCompletionError = new Error("temporary checkout failure");
		mockOnThankYouPage
			.mockRejectedValueOnce(checkoutCompletionError)
			.mockResolvedValueOnce(undefined);

		try {
			setup();

			const button = screen.getByRole("button", {name: /^pay and complete order$/i});
			await user.click(button);

			expect(await screen.findByText("Unable to complete your order. Please try again.")).toBeInTheDocument();
			expect(consoleSpy).toHaveBeenCalledWith(
				"[useSavePaymentMethod] Checkout completion failed",
				checkoutCompletionError
			);
			expect(mockSubmitPayment).toHaveBeenCalledTimes(1);

			await user.click(screen.getByRole("button", {name: /^complete order$/i}));

			await waitFor(() => expect(mockOnThankYouPage).toHaveBeenCalledTimes(2));
			expect(mockSubmitPayment).toHaveBeenCalledTimes(1);
			expect(mockRecordApprovedPayment).toHaveBeenCalledTimes(1);
		} finally {
			consoleSpy.mockRestore();
		}
	});

	it("locks payment method after card approval and retries completion without recharging", async () => {
		const user = userEvent.setup();
		const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
		const checkoutCompletionError = new Error("temporary checkout failure");
		mockOnThankYouPage
			.mockRejectedValueOnce(checkoutCompletionError)
			.mockResolvedValueOnce(undefined);

		try {
			setup({paymentMethods: [creditCardMethod, payInStoreMethod]});

			expect(screen.getByRole("radio", {name: /pay in store/i})).toBeEnabled();

			await user.click(screen.getByRole("button", {name: /^pay and complete order$/i}));

			expect(await screen.findByText("Unable to complete your order. Please try again.")).toBeInTheDocument();
			expect(consoleSpy).toHaveBeenCalledWith(
				"[useSavePaymentMethod] Checkout completion failed",
				checkoutCompletionError
			);
			expect(mockSubmitPayment).toHaveBeenCalledTimes(1);
			expect(mockRecordApprovedPayment).toHaveBeenCalledTimes(1);

			const payInStoreRadio = screen.getByRole("radio", {name: /pay in store/i});
			expect(payInStoreRadio).toBeDisabled();

			await user.click(screen.getByRole("button", {name: /^complete order$/i}));

			await waitFor(() => expect(mockOnThankYouPage).toHaveBeenCalledTimes(2));
			expect(mockSubmitPayment).toHaveBeenCalledTimes(1);

			const [checkoutArg] = mockOnThankYouPage.mock.calls[1];
			expect(checkoutArg.order.payment_method_id).toBe(CREDIT_CARD_PAYMENT_METHOD);
			expect(checkoutArg.order.paid_at).toBe("2026-05-23T12:00:00.000Z");
		} finally {
			consoleSpy.mockRestore();
		}
	});

	it("blocks card-approved checkout completion retry when latest persisted prerequisites are incomplete", async () => {
		const user = userEvent.setup();
		const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
		const checkoutCompletionError = new Error("temporary checkout failure");
		mockOnThankYouPage
			.mockRejectedValueOnce(checkoutCompletionError)
			.mockResolvedValueOnce(undefined);

		try {
			setup();

			await user.click(screen.getByRole("button", {name: /^pay and complete order$/i}));

			expect(await screen.findByText("Unable to complete your order. Please try again.")).toBeInTheDocument();
			expect(consoleSpy).toHaveBeenCalledWith(
				"[useSavePaymentMethod] Checkout completion failed",
				checkoutCompletionError
			);
			expect(mockSubmitPayment).toHaveBeenCalledTimes(1);
			expect(mockOnThankYouPage).toHaveBeenCalledTimes(1);

			mockOnThankYouPage.mockClear();
			mockDispatch.mockClear();
			mockCheckoutData = {
				...mockCheckoutData,
				order: makeOrder({
					paid_at: "2026-05-23T12:00:00.000Z",
					customer: completeCustomer({phone: ""}),
				}),
			};

			await user.click(screen.getByRole("button", {name: /^complete order$/i}));

			await expectRedirectedToCheckoutStep(TCheckoutStep.contactInfo);
			expect(mockSubmitPayment).toHaveBeenCalledTimes(1);
			expect(mockOnThankYouPage).not.toHaveBeenCalled();
		} finally {
			consoleSpy.mockRestore();
		}
	});

	it("keeps non-credit-card methods on the normal Formik submit path", async () => {
		const user = userEvent.setup();
		const order = makeOrder({payment_method_id: PAY_IN_STORE_PAYMENT_METHOD});

		setup({order, paymentMethods: [payInStoreMethod, creditCardMethod]});

		expect(screen.queryByTestId("payhq")).not.toBeInTheDocument();

		await user.click(screen.getByRole("button", {name: /^complete order$/i}));

		expect(mockSubmitPayment).not.toHaveBeenCalled();
		expect(mockRecordApprovedPayment).not.toHaveBeenCalled();
		await waitFor(() => expect(mockOnThankYouPage).toHaveBeenCalledTimes(1));

		const [checkoutArg] = mockOnThankYouPage.mock.calls[0];
		expect(checkoutArg.order.custom_attrs.checkoutCompleted).toBe(true);
	});

	it("completes checkout from the latest persisted order when render-time Redux order is stale", async () => {
		const user = userEvent.setup();
		const latestOrder = makeOrder({payment_method_id: PAY_IN_STORE_PAYMENT_METHOD});

		setup({order: null, paymentMethods: [payInStoreMethod, creditCardMethod]});

		// Simulate checkout data being restored after render but before submit.
		mockCheckoutData = {
			...mockCheckoutData,
			order: latestOrder,
			total,
			items,
		};

		await user.click(screen.getByRole("button", {name: /^complete order$/i}));

		await waitFor(() => expect(mockOnThankYouPage).toHaveBeenCalledTimes(1));
		expect(mockSubmitPayment).not.toHaveBeenCalled();
		expect(mockDispatch).not.toHaveBeenCalledWith(setCurrentStep(TCheckoutStep.contactInfo));

		const [checkoutArg] = mockOnThankYouPage.mock.calls[0];
		expect(checkoutArg.order.id).toBe(latestOrder.id);
		expect(checkoutArg.order.custom_attrs.checkoutCompleted).toBe(true);
	});

	it("blocks non-credit-card completion when latest persisted prerequisites are incomplete without completing checkout", async () => {
		const user = userEvent.setup();
		const order = makeOrder({payment_method_id: PAY_IN_STORE_PAYMENT_METHOD});

		setup({order, paymentMethods: [payInStoreMethod, creditCardMethod]});

		mockCheckoutData = {
			...mockCheckoutData,
			order: makeOrder({
				payment_method_id: PAY_IN_STORE_PAYMENT_METHOD,
				customer: completeCustomer({addresses: []}),
				services: [deliveryService()],
			}),
		};

		await user.click(screen.getByRole("button", {name: /^complete order$/i}));

		await expectRedirectedToCheckoutStep(TCheckoutStep.shippingAddress);
		expect(mockSubmitPayment).not.toHaveBeenCalled();
		expect(mockOnThankYouPage).not.toHaveBeenCalled();
		expect(mockCheckoutData.order.custom_attrs.checkoutCompleted).toBeUndefined();
	});

	it("updates non-credit-card checkout completion data with a tip", async () => {
		const user = userEvent.setup();

		const order = makeOrder({
			payment_method_id: PAY_IN_STORE_PAYMENT_METHOD,
			custom_attrs: {deliveryQuote: {fee: "6.00", zoneLabel: "Naramata", quotedAt: Date.now()}},
			services: [{service_id: DELIVERY_ID, serviceDelivery: {delivery: {title: "Delivery"}}}],
			delivery_time: "10:00 AM",
			total_price: "100.00",
		});

		setup({order, paymentMethods: [payInStoreMethod, creditCardMethod]});

		const tipInput = screen.getByRole("spinbutton", {name: /tip/i});
		await user.clear(tipInput);
		await user.paste("15.00");

		await user.click(screen.getByRole("button", {name: /^complete order$/i}));

		await waitFor(() => expect(mockOnThankYouPage).toHaveBeenCalledTimes(1));

		const [checkoutArg] = mockOnThankYouPage.mock.calls[0];

		expect(checkoutArg.order.tip).toBe("15");
		expect(checkoutArg.order.total_price).toBe("115");
		expect(checkoutArg.order.delivery_time).toBe("10:00 AM");
		expect(checkoutArg.total.price).toBe("115");
	});

	it("drops PayHQ validation errors silently without logging an error", async () => {
		const user = userEvent.setup();
		const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
		mockSubmitPayment.mockRejectedValue(
			new PaymentValidationError("Required payment fields are missing."),
		);

		try {
			setup();

			await user.click(screen.getByRole("button", {name: /^pay and complete order$/i}));

			await waitFor(() => expect(mockSubmitPayment).toHaveBeenCalledTimes(1));
			expect(screen.queryByRole("alert")).not.toBeInTheDocument();
			expect(consoleSpy).not.toHaveBeenCalled();
		} finally {
			consoleSpy.mockRestore();
		}
	});

	it("renders server error alert for unhandled PayHQ submit errors", async () => {
		const user = userEvent.setup();
		const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
		const submitError = new Error("Card declined");
		mockSubmitPayment.mockRejectedValue(submitError);

		try {
			setup();

			await user.click(screen.getByRole("button", {name: /^pay and complete order$/i}));

			await waitFor(() => expect(mockSubmitPayment).toHaveBeenCalledTimes(1));
			expect(consoleSpy).toHaveBeenCalledWith(
				"[PaymentMethodForm] submitCreditCardCheckout failed",
				submitError
			);
			expect(await screen.findByRole("alert")).toHaveTextContent("Card declined");
		} finally {
			consoleSpy.mockRestore();
		}
	});

	it("handles failure to record approved payment gracefully", async () => {
		const user = userEvent.setup();
		const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
		const recordError = new Error("Local storage full");
		mockRecordApprovedPayment.mockImplementation(() => {
			throw recordError;
		});

		try {
			setup();

			const button = screen.getByRole("button", {name: /^pay and complete order$/i});
			await user.click(button);

			await waitFor(() => expect(mockSubmitPayment).toHaveBeenCalledTimes(1));

			expect(consoleSpy).toHaveBeenCalledWith(
				"[PaymentMethodForm] Failed to record approved payment",
				recordError
			);
			expect(await screen.findByRole("alert")).toHaveTextContent(
				"Your payment was approved but we could not update your order. Please contact support."
			);

			// Form submission (onThankYouPage) should not have been called
			expect(mockOnThankYouPage).not.toHaveBeenCalled();

			// Button should be re-enabled
			expect(button).not.toBeDisabled();
			expect(screen.queryByLabelText("Loading…")).not.toBeInTheDocument();
		} finally {
			consoleSpy.mockRestore();
		}
	});

	it("renders error banner when session data is missing on submit", async () => {
		const user = userEvent.setup();
		const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

		try {
			setup({
				order: null,
				paymentMethods: [payInStoreMethod]
			});

			const button = screen.getByRole("button", {name: /^complete order$/i});
			await user.click(button);

			expect(consoleSpy).toHaveBeenCalledWith(
				"[useSavePaymentMethod] Missing checkout session data at submission",
				{
					hasOrder: false,
					hasCheckoutDataOrder: false,
					hasTotal: true,
				}
			);
			expect(await screen.findByRole("alert")).toHaveTextContent(
				"Unable to complete your order. Please refresh and try again."
			);
			expect(mockOnThankYouPage).not.toHaveBeenCalled();
		} finally {
			consoleSpy.mockRestore();
		}
	});

	it("scrolls to the first errored field when credit-card payment validation fails", async () => {
		const user = userEvent.setup();
		const scrollIntoViewMock = vi.spyOn(Element.prototype, "scrollIntoView");

		const deliveryOrder = makeOrder({
			delivery_time: "10:00 AM",
			services: [deliveryService()],
		});

		setup({order: deliveryOrder});

		const tipInput = screen.getByRole("spinbutton", {name: /tip/i}) as HTMLInputElement;
		await user.clear(tipInput);
		await user.paste("-5");

		await user.click(screen.getByRole("button", {name: /^pay and complete order$/i}));

		expect(await screen.findByText(/tip must be positive/i)).toBeInTheDocument();

		expect(scrollIntoViewMock).toHaveBeenCalled();
		const scrolledElement = scrollIntoViewMock.mock.contexts[0] as HTMLElement;
		expect(scrolledElement.getAttribute("name")).toBe("tip");

		expect(mockSubmitPayment).not.toHaveBeenCalled();
	});

	it("scrolls to the first errored field when non-credit-card payment validation fails", async () => {
		const user = userEvent.setup();
		const scrollIntoViewMock = vi.spyOn(Element.prototype, "scrollIntoView");

		const order = makeOrder({
			payment_method_id: PAY_IN_STORE_PAYMENT_METHOD,
			services: [{service_id: DELIVERY_ID, serviceDelivery: {delivery: {title: "Delivery"}}}],
			delivery_time: "10:00 AM",
			total_price: "100.00",
		});

		setup({order, paymentMethods: [payInStoreMethod, creditCardMethod]});

		const tipInput = screen.getByRole("spinbutton", {name: /tip/i}) as HTMLInputElement;
		tipInput.removeAttribute("min");
		await user.clear(tipInput);
		await user.paste("-5");
		await user.tab(); // trigger blur

		await user.click(screen.getByRole("button", {name: /^complete order$/i}));

		expect(await screen.findByText(/tip must be positive/i)).toBeInTheDocument();

		expect(scrollIntoViewMock).toHaveBeenCalled();
		const scrolledElement = scrollIntoViewMock.mock.contexts[0] as HTMLElement;
		expect(scrolledElement.getAttribute("name")).toBe("tip");

		expect(mockOnThankYouPage).not.toHaveBeenCalled();
	});

	it("handles PaymentOutcomeError with a specific support error message", async () => {
		const user = userEvent.setup();
		const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

		// Force checkout completion logic to throw PaymentOutcomeError
		(completeCreditCardPaymentOutcome as Mock).mockImplementationOnce(() => {
			throw new PaymentOutcomeError("tip mismatch");
		});

		try {
			setup({
				order: {...makeOrder(), paid_at: "2026-05-23T12:00:00.000Z"}, // Payment already approved
				paymentMethods: [creditCardMethod],
			});

			// Submit form
			const button = screen.getByRole("button", {name: /^complete order$/i});
			await user.click(button);

			expect(consoleSpy).toHaveBeenCalledWith(
				"[useSavePaymentMethod] PaymentOutcomeError during checkout completion",
				expect.any(PaymentOutcomeError)
			);

			const alert = await screen.findByRole("alert");
			expect(alert).toHaveTextContent("Order data error: tip mismatch Please contact support.");
			expect(alert).not.toHaveTextContent("Please try again.");

			expect(mockOnThankYouPage).not.toHaveBeenCalled();
		} finally {
			consoleSpy.mockRestore();
		}
	});
});

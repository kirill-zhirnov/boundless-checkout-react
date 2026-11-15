import {vi, type Mock} from "vitest";
import React from "react";
import {render, screen, waitFor, act} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {TPublishingStatus} from "../../../types/Order";
import {getCheckoutData} from "../../../hooks/checkoutData";
import PayHQ, {CreatePaymentInstance, PayHQHandle} from "./PayHQ";

let mockState: any = {};

let mockCheckoutData: any = {};

let mockPayfirmaInfo: {token?: string; environment?: string; endpoint?: string} = {
	token: "payfirma-api-key",
	environment: "TEST",
	endpoint: "",
};

vi.mock("../../../hooks/redux", () => ({
	useAppSelector: (selector: any) => selector(mockState),
}));

vi.mock("../../../hooks/checkoutData", () => ({
	getCheckoutData: vi.fn(() => mockCheckoutData),
}));

vi.mock("../../../contexts/CheckoutConfigContext", () => ({
	useCheckoutConfig: () => ({payfirmaInfo: mockPayfirmaInfo}),
}));

vi.mock("merrco-payfirma-simple-pay-module", () => ({default: vi.fn()}));

const order = {
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
	customer: {
		first_name: "Original",
		last_name: "Customer",
		email: "original@example.com",
		addresses: [
			{
				id: "address-1",
				type: "billing",
				is_default: true,
				first_name: "Original",
				last_name: "Customer",
				company: null,
				address_line_1: "123 Main St",
				address_line_2: "Unit 4",
				city: "Vancouver",
				state: "British Columbia",
				country_id: 0,
				zip: "V5K 0A1",
				created_at: "2026-05-23T00:00:00.000Z",
				vwCountry: {
					country_id: 0,
					code: "CA",
					title: "Canada",
				},
			},
		],
	},
} as any;

const total = {
	price: "100.00",
	itemsSubTotal: {price: "90.00", qty: 1},
	discount: "0",
	tax: {totalTaxAmount: "10.00"},
	servicesSubTotal: {price: "0.00", qty: 0},
} as any;

const items = [{id: "item-1", title: "Test item"}] as any;

function PayHQSubmitHarness({
	onPaymentFailed = vi.fn(),
	createPaymentInstance,
	payHQRef,
	tip,
}: {
	onPaymentFailed?: (message: string) => void;
	createPaymentInstance: CreatePaymentInstance;
	payHQRef?: React.Ref<PayHQHandle>;
	tip?: string;
}) {
	const internalRef = React.useRef<PayHQHandle | null>(null);
	const ref = payHQRef || internalRef;
	const [result, setResult] = React.useState<string>("");

	return (
		<>
			<PayHQ
				ref={ref}
				tip={tip}
				onPaymentFailed={onPaymentFailed}
				createPaymentInstance={createPaymentInstance}
			/>
			<button
				type="button"
				onClick={async () => {
					try {
						// Fallback if payHQRef wasn't provided but the button is clicked
						const targetRef = typeof ref === "function" ? null : ref;
						const paymentResult = await targetRef?.current?.submitPayment();

						if (paymentResult?.paidAt) {
							setResult(paymentResult.paidAt);
						}
					} catch {
						// ignore
					}
				}}
			>
				External payment submit
			</button>
			{result && <div data-testid="payment-result">{result}</div>}
		</>
	);
}

describe("PayHQ", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		mockPayfirmaInfo = {
			token: "payfirma-api-key",
			environment: "TEST",
			endpoint: "",
		};
		mockCheckoutData = {order, items, total};
		mockState = {
			app: {
				order,
				items,
				total,
			},
		};
		global.fetch = vi.fn().mockResolvedValue({
			ok: true,
			json: vi.fn().mockResolvedValue({
				success: true,
				paidAt: "2026-05-23T12:00:00.000Z",
			}),
		}) as Mock;
	});

	it("fails closed when the Payfirma environment is missing", async () => {
		mockPayfirmaInfo = {token: "payfirma-api-key", endpoint: ""};

		const createPaymentInstance: CreatePaymentInstance = vi.fn(() => ({
			getPaymentToken: vi.fn(),
		}));

		render(
			<PayHQ
				onPaymentFailed={vi.fn()}
				createPaymentInstance={createPaymentInstance}
			/>,
		);

		expect(
			screen.getByText(/An error occurred while initializing the payment module/i),
		).toBeInTheDocument();
		await waitFor(() => expect(createPaymentInstance).not.toHaveBeenCalled());
	});

	it("shows required field errors, focuses the first invalid field, and does not request payment when contact details are empty", async () => {
		const user = userEvent.setup();

		const getPaymentToken = vi.fn().mockResolvedValue({
			payment_token: "payment-token-1",
		});

		const createPaymentInstance: CreatePaymentInstance = vi.fn(() => ({
			getPaymentToken,
		}));

		render(
			<PayHQSubmitHarness
				onPaymentFailed={vi.fn()}
				createPaymentInstance={createPaymentInstance}
			/>,
		);

		await waitFor(() => expect(createPaymentInstance).toHaveBeenCalled());
		expect(screen.queryByRole("button", {name: /^pay$/i})).not.toBeInTheDocument();

		const firstNameField = screen.getByLabelText(/first name/i);
		await user.clear(firstNameField);
		await user.clear(screen.getByLabelText(/last name/i));
		await user.type(screen.getByLabelText(/last name/i), "   ");
		await user.clear(screen.getByLabelText(/email/i));
		await user.click(screen.getByRole("button", {name: /external payment submit/i}));

		expect(await screen.findByText("First name is required")).toBeInTheDocument();
		expect(screen.getByText("Last name is required")).toBeInTheDocument();
		expect(screen.getByText("Email is required")).toBeInTheDocument();
		expect(firstNameField).toHaveFocus();
		expect(getPaymentToken).not.toHaveBeenCalled();
		expect(global.fetch).not.toHaveBeenCalled();
	});

	it("clears a required field error when the field receives a non-empty value", async () => {
		const user = userEvent.setup();

		const getPaymentToken = vi.fn().mockResolvedValue({
			payment_token: "payment-token-1",
		});

		const createPaymentInstance: CreatePaymentInstance = vi.fn(() => ({
			getPaymentToken,
		}));

		render(
			<PayHQSubmitHarness
				onPaymentFailed={vi.fn()}
				createPaymentInstance={createPaymentInstance}
			/>,
		);

		await waitFor(() => expect(createPaymentInstance).toHaveBeenCalled());
		expect(screen.queryByRole("button", {name: /^pay$/i})).not.toBeInTheDocument();

		const firstNameField = screen.getByLabelText(/first name/i);
		await user.clear(firstNameField);
		await user.click(screen.getByRole("button", {name: /external payment submit/i}));

		expect(await screen.findByText("First name is required")).toBeInTheDocument();

		await user.type(firstNameField, "Ada");

		expect(screen.queryByText("First name is required")).not.toBeInTheDocument();
		expect(getPaymentToken).not.toHaveBeenCalled();
		expect(global.fetch).not.toHaveBeenCalled();
	});

	it("defaults billing address fields from the first customer address", async () => {
		const getPaymentToken = vi.fn().mockResolvedValue({
			payment_token: "payment-token-1",
		});

		const createPaymentInstance: CreatePaymentInstance = vi.fn(() => ({
			getPaymentToken,
		}));

		render(
			<PayHQSubmitHarness
				onPaymentFailed={vi.fn()}
				createPaymentInstance={createPaymentInstance}
			/>,
		);

		await waitFor(() => expect(createPaymentInstance).toHaveBeenCalled());

		expect(screen.getByLabelText(/address 1/i)).toHaveValue("123 Main St");
		expect(screen.getByLabelText(/address 2/i)).toHaveValue("Unit 4");
		expect(screen.getByLabelText(/city/i)).toHaveValue("Vancouver");
		expect(screen.getByLabelText(/postal code/i)).toHaveValue("V5K 0A1");
		expect(screen.getByLabelText(/select country/i)).toHaveValue("CA");
		expect(screen.getByLabelText(/province\/state/i)).toHaveValue("British Columbia");
	});

	it("updates province/state options when the selected country changes", async () => {
		const user = userEvent.setup();

		const getPaymentToken = vi.fn().mockResolvedValue({
			payment_token: "payment-token-1",
		});

		const createPaymentInstance: CreatePaymentInstance = vi.fn(() => ({
			getPaymentToken,
		}));

		render(
			<PayHQSubmitHarness
				onPaymentFailed={vi.fn()}
				createPaymentInstance={createPaymentInstance}
			/>,
		);

		await waitFor(() => expect(createPaymentInstance).toHaveBeenCalled());

		const countryField = screen.getByLabelText(/select country/i);
		const provinceField = screen.getByLabelText(/province\/state/i);

		expect(screen.getByRole("option", {name: "British Columbia"})).toBeInTheDocument();
		expect(screen.queryByRole("option", {name: "California"})).not.toBeInTheDocument();

		await user.selectOptions(countryField, "US");

		expect(countryField).toHaveValue("US");
		expect(provinceField).toHaveValue("");
		expect(screen.getByRole("option", {name: "California"})).toBeInTheDocument();
		expect(screen.queryByRole("option", {name: "British Columbia"})).not.toBeInTheDocument();
	});

	it("shows required field errors, focuses the first invalid field, and does not request payment when required address details are empty", async () => {
		const user = userEvent.setup();

		const getPaymentToken = vi.fn().mockResolvedValue({
			payment_token: "payment-token-1",
		});

		const createPaymentInstance: CreatePaymentInstance = vi.fn(() => ({
			getPaymentToken,
		}));

		render(
			<PayHQSubmitHarness
				onPaymentFailed={vi.fn()}
				createPaymentInstance={createPaymentInstance}
			/>,
		);

		await waitFor(() => expect(createPaymentInstance).toHaveBeenCalled());

		const address1Field = screen.getByLabelText(/address 1/i);
		await user.clear(address1Field);
		await user.clear(screen.getByLabelText(/city/i));
		await user.clear(screen.getByLabelText(/postal code/i));
		await user.selectOptions(screen.getByLabelText(/select country/i), "");
		await user.click(screen.getByRole("button", {name: /external payment submit/i}));

		expect(await screen.findByText("Address 1 is required")).toBeInTheDocument();
		expect(screen.getByText("City is required")).toBeInTheDocument();
		expect(screen.getByText("Country is required")).toBeInTheDocument();
		expect(screen.getByText("Postal code is required")).toBeInTheDocument();
		expect(screen.getByText("Province/State is required")).toBeInTheDocument();
		expect(address1Field).toHaveFocus();
		expect(getPaymentToken).not.toHaveBeenCalled();
		expect(global.fetch).not.toHaveBeenCalled();
	});

	it("sends the cardholder contact details to the Payfirma sale endpoint", async () => {
		const user = userEvent.setup();

		const getPaymentToken = vi.fn().mockResolvedValue({
			payment_token: "payment-token-1",
		});

		const createPaymentInstance: CreatePaymentInstance = vi.fn(() => ({
			getPaymentToken,
		}));

		render(
			<PayHQSubmitHarness
				onPaymentFailed={vi.fn()}
				createPaymentInstance={createPaymentInstance}
			/>,
		);

		await waitFor(() => expect(createPaymentInstance).toHaveBeenCalled());
		expect(screen.queryByRole("button", {name: /^pay$/i})).not.toBeInTheDocument();

		await user.clear(screen.getByLabelText(/first name/i));
		await user.paste(" Ada ");
		const emailField = screen.getByLabelText(/email/i);
		expect(emailField).toHaveValue("original@example.com");

		await user.clear(screen.getByLabelText(/last name/i));
		await user.paste(" Lovelace ");
		await user.clear(emailField);
		await user.paste(" ada@example.com ");
		await user.clear(screen.getByLabelText(/address 1/i));
		await user.paste(" 456 Oak Ave ");
		await user.clear(screen.getByLabelText(/address 2/i));
		await user.paste(" Suite 12 ");
		await user.clear(screen.getByLabelText(/city/i));
		await user.paste(" Victoria ");
		await user.clear(screen.getByLabelText(/postal code/i));
		await user.paste(" V8W 1A1 ");
		await user.click(screen.getByRole("button", {name: /external payment submit/i}));

		await waitFor(() => expect(global.fetch).toHaveBeenCalledWith(
			"/api/payfirmaSale",
			expect.any(Object),
		));

		const [, requestInit] = (global.fetch as Mock).mock.calls[0];
		const body = JSON.parse(requestInit.body);

		expect(body).toEqual(
			expect.objectContaining({
				orderId: "order-1",
				firstName: "Ada",
				lastName: "Lovelace",
				email: "ada@example.com",
				address1: "456 Oak Ave",
				address2: "Suite 12",
				city: "Victoria",
				country: "CA",
				postalCode: "V8W 1A1",
				province: "BC",
				paymentToken: "payment-token-1",
				items,
				total,
			}),
		);
		expect(body.order).toEqual(expect.objectContaining({id: "order-1"}));

		expect(await screen.findByTestId("payment-result")).toHaveTextContent(
			"2026-05-23T12:00:00.000Z",
		);
	});

	it("preserves user-edited billing fields when unchanged checkout order data is cloned", async () => {
		const user = userEvent.setup();

		const getPaymentToken = vi.fn().mockResolvedValue({
			payment_token: "payment-token-1",
		});

		const createPaymentInstance: CreatePaymentInstance = vi.fn(() => ({
			getPaymentToken,
		}));

		const {rerender} = render(
			<PayHQSubmitHarness createPaymentInstance={createPaymentInstance} />,
		);

		await waitFor(() => expect(createPaymentInstance).toHaveBeenCalled());

		const firstNameField = screen.getByRole("textbox", {name: /first name/i});
		expect(firstNameField).toHaveValue("Original");

		await user.clear(firstNameField);
		await user.type(firstNameField, "Customer Override");
		expect(firstNameField).toHaveValue("Customer Override");

		const clonedOrder = JSON.parse(JSON.stringify(order));
		mockState = {app: {order: clonedOrder, items, total}};
		mockCheckoutData = {order: clonedOrder, items, total};

		rerender(
			<PayHQSubmitHarness createPaymentInstance={createPaymentInstance} />,
		);

		await waitFor(() =>
			expect(screen.getByRole("textbox", {name: /first name/i})).toHaveValue(
				"Customer Override",
			),
		);
	});

	it("refreshes billing fields and sale payload when the checkout order changes", async () => {
		const user = userEvent.setup();

		const getPaymentToken = vi.fn().mockResolvedValue({
			payment_token: "payment-token-2",
		});

		const createPaymentInstance: CreatePaymentInstance = vi.fn(() => ({
			getPaymentToken,
		}));

		const {rerender} = render(
			<PayHQSubmitHarness createPaymentInstance={createPaymentInstance} />,
		);

		await waitFor(() => expect(createPaymentInstance).toHaveBeenCalled());

		const updatedOrder = {
			...order,
			id: "order-2",
			customer: {
				...order.customer,
				first_name: "Updated",
				last_name: "Buyer",
				email: "updated@example.com",
				addresses: [
					{
						...order.customer.addresses[0],
						address_line_1: "999 Fresh St",
						address_line_2: "Suite 9",
						city: "Kelowna",
						state: "British Columbia",
						zip: "V1Y 1A1",
					},
				],
			},
		} as any;

		mockState = {app: {order: updatedOrder, items, total}};
		mockCheckoutData = {order: updatedOrder, items, total};

		rerender(
			<PayHQSubmitHarness createPaymentInstance={createPaymentInstance} />,
		);

		await waitFor(() =>
			expect(screen.getByRole("textbox", {name: /first name/i})).toHaveValue(
				"Updated",
			),
		);
		expect(screen.getByRole("textbox", {name: /last name/i})).toHaveValue(
			"Buyer",
		);
		expect(screen.getByRole("textbox", {name: /email/i})).toHaveValue(
			"updated@example.com",
		);
		expect(screen.getByRole("textbox", {name: /address 1/i})).toHaveValue(
			"999 Fresh St",
		);
		expect(screen.getByRole("textbox", {name: /address 2/i})).toHaveValue(
			"Suite 9",
		);
		expect(screen.getByRole("textbox", {name: /city/i})).toHaveValue(
			"Kelowna",
		);
		expect(screen.getByRole("textbox", {name: /postal code/i})).toHaveValue(
			"V1Y 1A1",
		);
		expect(screen.getByRole("combobox", {name: /select country/i})).toHaveValue(
			"CA",
		);
		expect(
			screen.getByRole("combobox", {name: /province\/state/i}),
		).toHaveValue("British Columbia");

		await user.click(screen.getByRole("button", {name: /external payment submit/i}));

		await waitFor(() => expect(global.fetch).toHaveBeenCalledTimes(1));
		const [requestUrl, requestInit] = (global.fetch as Mock).mock.calls[0];
		expect(requestUrl).toBe("/api/payfirmaSale");
		expect(requestInit.method).toBe("POST");
		const requestBody = JSON.parse(requestInit.body);

		expect(requestBody).toEqual(
			expect.objectContaining({
				orderId: "order-2",
				firstName: "Updated",
				lastName: "Buyer",
				email: "updated@example.com",
				address1: "999 Fresh St",
				address2: "Suite 9",
				city: "Kelowna",
				country: "CA",
				postalCode: "V1Y 1A1",
				province: "BC",
			}),
		);
		expect(requestBody.order).toEqual(
			expect.objectContaining({
				id: "order-2",
				customer: expect.objectContaining({
					first_name: "Updated",
					last_name: "Buyer",
					email: "updated@example.com",
					addresses: [
						expect.objectContaining({
							address_line_1: "999 Fresh St",
							address_line_2: "Suite 9",
							city: "Kelowna",
							state: "British Columbia",
							zip: "V1Y 1A1",
							vwCountry: expect.objectContaining({code: "CA", title: "Canada"}),
						}),
					],
				}),
			}),
		);
	});

	it("prevents duplicate sale attempts if submitPayment is called again while in flight", async () => {
		let resolveToken: (val: any) => void = () => {};

		const getPaymentToken = vi.fn().mockReturnValue(
			new Promise((resolve) => {
				resolveToken = resolve;
			})
		);

		const createPaymentInstance: CreatePaymentInstance = vi.fn(() => ({
			getPaymentToken,
		}));

		const payHQRef = React.createRef<PayHQHandle>();

		render(
			<PayHQSubmitHarness
				payHQRef={payHQRef}
				onPaymentFailed={vi.fn()}
				createPaymentInstance={createPaymentInstance}
			/>,
		);

		await waitFor(() => expect(createPaymentInstance).toHaveBeenCalled());

		// Trigger two submissions synchronously
		let submit1: Promise<any>;
		let submit2: Promise<any>;
		act(() => {
			submit1 = payHQRef.current!.submitPayment();
			submit2 = payHQRef.current!.submitPayment();
		});

		// Second should reject immediately because first is in flight
		await expect(submit2!).rejects.toThrow("Payment is already being processed.");

		// Resolve first
		await act(async () => {
			resolveToken({payment_token: "payment-token-1"});
			await submit1;
		});

		expect(getPaymentToken).toHaveBeenCalledTimes(1);
		expect(global.fetch).toHaveBeenCalledTimes(1);
	});

	it("prevents duplicate sale attempts if submitPayment is called again after success", async () => {
		const getPaymentToken = vi.fn().mockResolvedValue({
			payment_token: "payment-token-1",
		});

		const createPaymentInstance: CreatePaymentInstance = vi.fn(() => ({
			getPaymentToken,
		}));

		const payHQRef = React.createRef<PayHQHandle>();

		render(
			<PayHQSubmitHarness
				payHQRef={payHQRef}
				onPaymentFailed={vi.fn()}
				createPaymentInstance={createPaymentInstance}
			/>,
		);

		await waitFor(() => expect(createPaymentInstance).toHaveBeenCalled());

		// First submission succeeds
		await act(async () => {
			await payHQRef.current?.submitPayment();
		});
		expect(global.fetch).toHaveBeenCalledTimes(1);

		// Second submission should fail because already approved
		let submit2: Promise<any>;
		act(() => {
			submit2 = payHQRef.current!.submitPayment();
		});
		await expect(submit2!).rejects.toThrow("Payment has already been approved.");

		// Fetch and getPaymentToken shouldn't be called again
		expect(getPaymentToken).toHaveBeenCalledTimes(1);
		expect(global.fetch).toHaveBeenCalledTimes(1);
	});

	it("rejects and reports failure if the sale fails", async () => {
		const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

		const getPaymentToken = vi.fn().mockResolvedValue({
			payment_token: "payment-token-1",
		});

		const createPaymentInstance: CreatePaymentInstance = vi.fn(() => ({
			getPaymentToken,
		}));

		global.fetch = vi.fn().mockResolvedValue({
			ok: false,
			json: vi.fn().mockResolvedValue({
				message: "Card declined by issuer",
			}),
		});

		const onPaymentFailed = vi.fn();
		const payHQRef = React.createRef<PayHQHandle>();

		try {
			render(
				<PayHQSubmitHarness
					payHQRef={payHQRef}
					onPaymentFailed={onPaymentFailed}
					createPaymentInstance={createPaymentInstance}
				/>,
			);

			await waitFor(() => expect(createPaymentInstance).toHaveBeenCalled());

			await act(async () => {
				const submitResult = payHQRef.current!.submitPayment();
				await expect(submitResult).rejects.toThrow("Card declined by issuer");
			});
			expect(consoleSpy).toHaveBeenCalledWith(
				"[PayHQ] Payment failed",
				"Card declined by issuer",
			);
			expect(onPaymentFailed).toHaveBeenCalledWith("Card declined by issuer");
		} finally {
			consoleSpy.mockRestore();
		}
	});

	it("logs parse errors from non-OK Payfirma responses and reports the generic failure", async () => {
		const parseError = new Error("invalid json");
		const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

		const getPaymentToken = vi.fn().mockResolvedValue({
			payment_token: "payment-token-1",
		});

		const createPaymentInstance: CreatePaymentInstance = vi.fn(() => ({
			getPaymentToken,
		}));

		const onPaymentFailed = vi.fn();
		const payHQRef = React.createRef<PayHQHandle>();

		global.fetch = vi.fn().mockResolvedValue({
			ok: false,
			json: vi.fn().mockRejectedValue(parseError),
		}) as Mock;

		try {
			render(
				<PayHQSubmitHarness
					payHQRef={payHQRef}
					onPaymentFailed={onPaymentFailed}
					createPaymentInstance={createPaymentInstance}
				/>,
			);

			await waitFor(() => expect(createPaymentInstance).toHaveBeenCalled());

			await act(async () => {
				const submitResult = payHQRef.current!.submitPayment();
				await expect(submitResult).rejects.toThrow(
					"Payment could not be completed. Please try again or contact the store.",
				);
			});

			expect(consoleSpy).toHaveBeenCalledWith(
				"[PayHQ] Failed to parse error response body",
				parseError,
			);
			expect(onPaymentFailed).toHaveBeenCalledWith(
				"Payment could not be completed. Please try again or contact the store.",
			);
		} finally {
			consoleSpy.mockRestore();
		}
	});

	it("does not tokenize or submit a sale when persisted checkout session data is missing", async () => {
		const getPaymentToken = vi.fn().mockResolvedValue({
			payment_token: "payment-token-1",
		});

		const createPaymentInstance: CreatePaymentInstance = vi.fn(() => ({
			getPaymentToken,
		}));

		const onPaymentFailed = vi.fn();
		const payHQRef = React.createRef<PayHQHandle>();

		mockCheckoutData = null;

		render(
			<PayHQSubmitHarness
				payHQRef={payHQRef}
				onPaymentFailed={onPaymentFailed}
				createPaymentInstance={createPaymentInstance}
			/>,
		);

		await waitFor(() => expect(createPaymentInstance).toHaveBeenCalled());

		await act(async () => {
			const submitResult = payHQRef.current!.submitPayment();
			await expect(submitResult).rejects.toThrow(
				"Unable to start payment because checkout session data is missing. Please refresh and try again.",
			);
		});

		expect(onPaymentFailed).toHaveBeenCalledWith(
			"Unable to start payment because checkout session data is missing. Please refresh and try again.",
		);
		expect(getPaymentToken).not.toHaveBeenCalled();
		expect(global.fetch).not.toHaveBeenCalled();
	});

	it("does not tokenize or submit a sale when persisted checkout session data is unreadable", async () => {
		const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

		const getPaymentToken = vi.fn().mockResolvedValue({
			payment_token: "payment-token-1",
		});

		const createPaymentInstance: CreatePaymentInstance = vi.fn(() => ({
			getPaymentToken,
		}));

		const onPaymentFailed = vi.fn();
		const payHQRef = React.createRef<PayHQHandle>();
		const checkoutReadError = new Error("Unexpected token u in JSON at position 0");

		(getCheckoutData as Mock).mockImplementationOnce(() => {
			throw checkoutReadError;
		});

		try {
			render(
				<PayHQSubmitHarness
					payHQRef={payHQRef}
					onPaymentFailed={onPaymentFailed}
					createPaymentInstance={createPaymentInstance}
				/>,
			);

			await waitFor(() => expect(createPaymentInstance).toHaveBeenCalled());

			await act(async () => {
				const submitResult = payHQRef.current!.submitPayment();
				await expect(submitResult).rejects.toThrow(
					"Unable to start payment because checkout session data is missing. Please refresh and try again.",
				);
			});

			expect(consoleSpy).toHaveBeenCalledWith(
				"[PayHQ] Failed to read checkout session data",
				checkoutReadError,
			);
			expect(onPaymentFailed).toHaveBeenCalledWith(
				"Unable to start payment because checkout session data is missing. Please refresh and try again.",
			);
			expect(getPaymentToken).not.toHaveBeenCalled();
			expect(global.fetch).not.toHaveBeenCalled();
		} finally {
			consoleSpy.mockRestore();
		}
	});

	it("shows processing guidance when the order is already paid", () => {
		const createPaymentInstance: CreatePaymentInstance = vi.fn(() => ({
			getPaymentToken: vi.fn(),
		}));

		mockState = {
			app: {
				order: {...order, paid_at: "2026-05-23T12:00:00.000Z"},
				items,
				total,
			},
		};

		render(
			<PayHQ
				onPaymentFailed={vi.fn()}
				createPaymentInstance={createPaymentInstance}
			/>,
		);

		expect(
			screen.getByText(
				"Your payment was approved. Please wait while we process your order.",
			),
		).toBeInTheDocument();
	});

	it("applies the tip prop to the payment POST payload", async () => {
		const user = userEvent.setup();

		const getPaymentToken = vi.fn().mockResolvedValue({
			payment_token: "payment-token-1",
		});

		const createPaymentInstance: CreatePaymentInstance = vi.fn(() => ({
			getPaymentToken,
		}));

		render(
			<PayHQSubmitHarness
				tip="5"
				onPaymentFailed={vi.fn()}
				createPaymentInstance={createPaymentInstance}
			/>,
		);

		await waitFor(() => expect(createPaymentInstance).toHaveBeenCalled());
		await user.click(screen.getByRole("button", {name: /external payment submit/i}));

		await waitFor(() => expect(global.fetch).toHaveBeenCalledWith(
			"/api/payfirmaSale",
			expect.any(Object),
		));

		const [, requestInit] = (global.fetch as Mock).mock.calls[0];
		const body = JSON.parse(requestInit.body);

		expect(body.order.total_price).toBe("105.00");
		expect(body.total.price).toBe("105.00");
	});

	it("rejects when the API response has success: false", async () => {
		const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

		const getPaymentToken = vi.fn().mockResolvedValue({
			payment_token: "payment-token-1",
		});

		const createPaymentInstance: CreatePaymentInstance = vi.fn(() => ({
			getPaymentToken,
		}));

		global.fetch = vi.fn().mockResolvedValue({
			ok: true,
			json: vi.fn().mockResolvedValue({
				success: false,
				message: "Declined by bank",
			}),
		});

		const onPaymentFailed = vi.fn();
		const payHQRef = React.createRef<PayHQHandle>();

		try {
			render(
				<PayHQSubmitHarness
					payHQRef={payHQRef}
					onPaymentFailed={onPaymentFailed}
					createPaymentInstance={createPaymentInstance}
				/>,
			);

			await waitFor(() => expect(createPaymentInstance).toHaveBeenCalled());

			await act(async () => {
				const submitResult = payHQRef.current!.submitPayment();
				await expect(submitResult).rejects.toThrow("Declined by bank");
			});

			expect(consoleSpy).toHaveBeenCalledWith(
				"[PayHQ] Payment failed",
				"Declined by bank",
			);
			expect(onPaymentFailed).toHaveBeenCalledWith("Declined by bank");
		} finally {
			consoleSpy.mockRestore();
		}
	});

	it("rejects when getPaymentToken resolves with no token", async () => {
		const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
		const getPaymentToken = vi.fn().mockResolvedValue(null);

		const createPaymentInstance: CreatePaymentInstance = vi.fn(() => ({
			getPaymentToken,
		}));

		const payHQRef = React.createRef<PayHQHandle>();

		try {
			render(
				<PayHQSubmitHarness
					payHQRef={payHQRef}
					onPaymentFailed={vi.fn()}
					createPaymentInstance={createPaymentInstance}
				/>,
			);

			await waitFor(() => expect(createPaymentInstance).toHaveBeenCalled());

			await act(async () => {
				const submitResult = payHQRef.current!.submitPayment();
				await expect(submitResult).rejects.toThrow("Missing payment token");
			});

			expect(consoleSpy).toHaveBeenCalledWith(
				"[PayHQ] Payment failed",
				"Missing payment token",
			);
			expect(global.fetch).not.toHaveBeenCalled();
		} finally {
			consoleSpy.mockRestore();
		}
	});

	it("warns and uses a client timestamp when a successful sale omits paidAt", async () => {
		vi.useFakeTimers({toFake: ["Date"]}).setSystemTime(new Date("2026-05-30T10:00:00.000Z"));
		const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

		const getPaymentToken = vi.fn().mockResolvedValue({
			payment_token: "payment-token-1",
		});

		const createPaymentInstance: CreatePaymentInstance = vi.fn(() => ({
			getPaymentToken,
		}));

		const payHQRef = React.createRef<PayHQHandle>();

		global.fetch = vi.fn().mockResolvedValue({
			ok: true,
			json: vi.fn().mockResolvedValue({success: true}),
		}) as Mock;

		try {
			render(
				<PayHQSubmitHarness
					payHQRef={payHQRef}
					onPaymentFailed={vi.fn()}
					createPaymentInstance={createPaymentInstance}
				/>,
			);

			await waitFor(() => expect(createPaymentInstance).toHaveBeenCalled());

			let result: {paidAt: string} | undefined;
			await act(async () => {
				result = await payHQRef.current!.submitPayment();
			});

			expect(result?.paidAt).toBe("2026-05-30T10:00:00.000Z");
			expect(warnSpy).toHaveBeenCalledWith(
				"[PayHQ] /api/payfirmaSale returned success without a valid paidAt; using client timestamp as fallback.",
			);
		} finally {
			warnSpy.mockRestore();
			vi.useRealTimers();
		}
	});

	it("warns and uses a client timestamp when paidAt is not a string", async () => {
		vi.useFakeTimers({toFake: ["Date"]}).setSystemTime(new Date("2026-05-30T11:00:00.000Z"));
		const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

		const getPaymentToken = vi.fn().mockResolvedValue({
			payment_token: "payment-token-1",
		});

		const createPaymentInstance: CreatePaymentInstance = vi.fn(() => ({
			getPaymentToken,
		}));

		const payHQRef = React.createRef<PayHQHandle>();

		global.fetch = vi.fn().mockResolvedValue({
			ok: true,
			json: vi.fn().mockResolvedValue({success: true, paidAt: 12345}),
		}) as Mock;

		try {
			render(
				<PayHQSubmitHarness
					payHQRef={payHQRef}
					onPaymentFailed={vi.fn()}
					createPaymentInstance={createPaymentInstance}
				/>,
			);

			await waitFor(() => expect(createPaymentInstance).toHaveBeenCalled());

			let result: {paidAt: string} | undefined;
			await act(async () => {
				result = await payHQRef.current!.submitPayment();
			});

			expect(result?.paidAt).toBe("2026-05-30T11:00:00.000Z");
			expect(warnSpy).toHaveBeenCalledWith(
				"[PayHQ] /api/payfirmaSale returned success without a valid paidAt; using client timestamp as fallback.",
			);
		} finally {
			warnSpy.mockRestore();
			vi.useRealTimers();
		}
	});
});

import {AppThunk} from "../store";
import {
	setCheckoutData,
	setCheckoutInited,
	setGlobalError,
	TOnCheckoutInited,
} from "../reducers/app";
import {getCartOrRetrieve} from "../../hooks/getCartOrRetrieve";
import {ICheckoutStepper, TCheckoutStep} from "../../types/common";
import type {Cart, CovaCartItem, CovaCheckoutInitData, ICartTotal} from "../../types/cart";
import {IOrderService, IOrderWithCustmAttr, ITotal, TPublishingStatus} from "../../types/Order";
import {getCheckoutData} from "../../hooks/checkoutData";
import {getOrderTaxes} from "../../lib/taxes";
import {ordersDropShippingItems} from "../../lib/products";
import {
	canNavigateToCheckoutStep,
	getCheckoutStepWarning,
	getFirstIncompleteCheckoutStep,
} from "../../lib/checkoutGuards";

const EMPTY_CART_ERROR = "Your cart is empty. Please go back to the site and start shopping.";

const CHECKOUT_INIT_ERROR = "Cannot initialize checkout. Please go back to the cart and try again.";

const DEFAULT_CURRENCY = {
	currency_id: 0,
	alias: "CAD",
	code: 4217,
};

const DEFAULT_LOCALE_SETTINGS = {
	money: {
		decimal: ".",
		thousand: ",",
		precision: 2,
		format: "%s%v",
		symbol: "$",
	},
};

const buildCheckoutSteps = (items: Parameters<typeof ordersDropShippingItems>[0]): TCheckoutStep[] => {
	const hasDropShipItems = ordersDropShippingItems(items).length > 0;

	return [
		TCheckoutStep.contactInfo,
		TCheckoutStep.shippingAddress,
		...(hasDropShipItems ? [TCheckoutStep.deliveryDetails] : []),
		TCheckoutStep.paymentMethod,
	];
};

type CheckoutDataOrder = IOrderWithCustmAttr | undefined;

type CheckoutDataOrderService = IOrderService | null;

type StepWarning = ReturnType<typeof getCheckoutStepWarning>;

type CheckoutInitDataWithWarning = CovaCheckoutInitData & {stepWarning: StepWarning | null};

type CheckoutDispatch = (
	action:
		| ReturnType<typeof setCheckoutData>
		| ReturnType<typeof setCheckoutInited>
		| ReturnType<typeof setGlobalError>,
) => void;

type TaxSummary = ITotal["tax"];

type BuildCheckoutTotalParams = {
	price: string | null;
	cartTotal: ICartTotal;
	checkoutDataOrder: CheckoutDataOrder;
	checkoutDataOrderService: CheckoutDataOrderService;
	tax: TaxSummary;
};

type BuildInitialOrderParams = {
	cartId?: string;
	stateOrder: IOrderWithCustmAttr | undefined;
	cartTotal: ICartTotal;
	checkoutDataOrder: CheckoutDataOrder;
	checkoutDataOrderService: CheckoutDataOrderService;
	totalOrderTaxes: string | null;
	tax: TaxSummary;
};

type BuildCheckoutInitDataParams = {
	items: CovaCartItem[];
	initialOrder: IOrderWithCustmAttr;
	normalizedStepper: ICheckoutStepper;
	stepWarning: StepWarning | null;
	checkoutDataTotal: ITotal | undefined;
	checkoutDataOrder: CheckoutDataOrder;
	cartTotal: ICartTotal;
	checkoutDataOrderService: CheckoutDataOrderService;
	tax: TaxSummary;
};

type CheckoutCartWithItems = Cart & {items: CovaCartItem[]};

type BuildCheckoutInitDataForCartParams = {
	cart: CheckoutCartWithItems;
	cartId?: string;
	stateOrder: IOrderWithCustmAttr | undefined;
	stateStepper: ICheckoutStepper | null | undefined;
};

const resolveOrderTaxes = async (
	items: CovaCartItem[],
	checkoutDataOrder: CheckoutDataOrder,
) => {
	if (checkoutDataOrder?.tax_amount) return checkoutDataOrder.tax_amount;

	return getOrderTaxes(items);
};

const buildTaxSummary = (
	items: CovaCartItem[],
	totalOrderTaxes: string | null,
	checkoutDataOrder: CheckoutDataOrder,
): TaxSummary => ({
	totalTaxAmount: totalOrderTaxes,
	itemsWithTax: items,
	shipping: {
		shippingTaxes: checkoutDataOrder?.tax_calculations?.tax?.shipping?.shippingTaxes,
	},
});

const getCheckoutDataOrderService = (
	checkoutDataOrder: CheckoutDataOrder,
): CheckoutDataOrderService => checkoutDataOrder?.services?.[0] ?? null;

const buildCheckoutTotal = ({
	price,
	cartTotal,
	checkoutDataOrder,
	checkoutDataOrderService,
	tax,
}: BuildCheckoutTotalParams): ITotal => ({
	price,
	itemsSubTotal: {
		price: checkoutDataOrder?.tax_calculations?.itemsSubTotal.price ?? cartTotal.total,
		qty: cartTotal.qty,
	},
	discount: checkoutDataOrder?.discount_for_order ?? "0",
	tax,
	servicesSubTotal: {
		price: checkoutDataOrderService ? checkoutDataOrderService.total_price : 0,
		qty: checkoutDataOrderService ? checkoutDataOrderService.qty : 0,
	},
});

const resolveInitialOrderTotal = (
	checkoutDataOrder: CheckoutDataOrder,
	cartTotal: ICartTotal,
	totalOrderTaxes: string | null,
) => {
	if (checkoutDataOrder?.total_price) return checkoutDataOrder.total_price;

	return (Number(cartTotal.total) + Number(totalOrderTaxes)).toFixed(2);
};

const buildInitialOrderDefaults = ({
	cartId,
	stateOrder,
}: Pick<BuildInitialOrderParams, "cartId" | "stateOrder">) => ({
	id: cartId ?? "",
	status_id: null,
	payment_mark_up: null,
	publishing_status: TPublishingStatus.published,
	created_at: stateOrder?.created_at ?? new Date().toISOString(),
});

const resolvePaymentMethodId = (checkoutDataOrder: CheckoutDataOrder) => (
	checkoutDataOrder?.payment_method_id ?? null
);

const resolvePaidAt = (checkoutDataOrder: CheckoutDataOrder) => (
	checkoutDataOrder?.paid_at ?? null
);

const resolveServiceTotalPrice = (checkoutDataOrder: CheckoutDataOrder) => (
	checkoutDataOrder?.service_total_price ?? "0.00"
);

const resolveTip = (checkoutDataOrder: CheckoutDataOrder) => (
	checkoutDataOrder?.tip ?? "0.00"
);

const buildInitialOrderPaymentFields = (checkoutDataOrder: CheckoutDataOrder) => ({
	payment_method_id: resolvePaymentMethodId(checkoutDataOrder),
	paid_at: resolvePaidAt(checkoutDataOrder),
	service_total_price: resolveServiceTotalPrice(checkoutDataOrder),
	tip: resolveTip(checkoutDataOrder),
});

const buildDeliveryTimeFields = (
	checkoutDataOrder: CheckoutDataOrder,
): Partial<Pick<IOrderWithCustmAttr, "delivery_time" | "drop_ship_delivery_time">> => {
	const deliveryTimeFields: Partial<Pick<IOrderWithCustmAttr, "delivery_time" | "drop_ship_delivery_time">> = {};

	if (checkoutDataOrder?.delivery_time) {
		deliveryTimeFields.delivery_time = checkoutDataOrder.delivery_time;
	}

	if (checkoutDataOrder?.drop_ship_delivery_time) {
		deliveryTimeFields.drop_ship_delivery_time = checkoutDataOrder.drop_ship_delivery_time;
	}

	return deliveryTimeFields;
};

const buildInitialOrderDiscountFields = (checkoutDataOrder: CheckoutDataOrder) => ({
	discount_for_order: checkoutDataOrder?.discount_for_order
		? checkoutDataOrder.discount_for_order
		: null,
	discounts: checkoutDataOrder?.discounts ? checkoutDataOrder.discounts : [],
});

const resolveOrderTaxCalculations = ({
	cartTotal,
	checkoutDataOrder,
	checkoutDataOrderService,
	totalOrderTaxes,
	tax,
}: Omit<BuildInitialOrderParams, "cartId" | "stateOrder">): ITotal => {
	if (checkoutDataOrder?.tax_calculations) return checkoutDataOrder.tax_calculations;

	return buildCheckoutTotal({
		price: totalOrderTaxes,
		cartTotal,
		checkoutDataOrder,
		checkoutDataOrderService,
		tax,
	});
};

const buildInitialOrderCustomAttrs = (checkoutDataOrder: CheckoutDataOrder) => {
	const customAttrs = checkoutDataOrder?.custom_attrs;

	return {
		...customAttrs,
		shippingTax: customAttrs?.shippingTax ?? "0.00",
		serviceRate: customAttrs?.serviceRate ?? "0.00",
		checkoutInited: true,
	};
};

const buildInitialOrder = (params: BuildInitialOrderParams): IOrderWithCustmAttr => {
	const {
		cartTotal,
		checkoutDataOrder,
		totalOrderTaxes,
	} = params;

	return {
		...buildInitialOrderDefaults(params),
		...buildInitialOrderPaymentFields(checkoutDataOrder),
		total_price: resolveInitialOrderTotal(
			checkoutDataOrder,
			cartTotal,
			totalOrderTaxes,
		),
		...buildDeliveryTimeFields(checkoutDataOrder),
		...buildInitialOrderDiscountFields(checkoutDataOrder),
		tax_amount: totalOrderTaxes,
		customer: checkoutDataOrder?.customer ?? undefined,
		services: checkoutDataOrder?.services ?? [],
		tax_calculations: resolveOrderTaxCalculations(params),
		custom_attrs: buildInitialOrderCustomAttrs(checkoutDataOrder),
	};
};

const buildRequestedStepper = (
	stateStepper: ICheckoutStepper | null | undefined,
	steps: TCheckoutStep[],
): ICheckoutStepper => ({
	filledSteps: stateStepper?.filledSteps ?? [],
	currentStep: stateStepper?.currentStep ?? TCheckoutStep.contactInfo,
	steps,
});

const getFallbackCheckoutStep = (steps: TCheckoutStep[]) => {
	if (steps.includes(TCheckoutStep.paymentMethod)) return TCheckoutStep.paymentMethod;

	return steps[0] ?? TCheckoutStep.contactInfo;
};

const resolveRequestedCurrentStep = (requestedStepper: ICheckoutStepper) => {
	if (requestedStepper.steps.includes(requestedStepper.currentStep)) {
		return requestedStepper.currentStep;
	}

	return getFallbackCheckoutStep(requestedStepper.steps);
};

const resolveBlockedCheckoutStep = (
	initialOrder: IOrderWithCustmAttr,
	requestedStepper: ICheckoutStepper,
) => {
	const firstIncompleteStep = getFirstIncompleteCheckoutStep(
		initialOrder,
		requestedStepper,
	);

	if (!firstIncompleteStep) return null;

	const requestedStepIsAllowed = canNavigateToCheckoutStep(
		requestedStepper.currentStep,
		initialOrder,
		requestedStepper,
	);

	if (requestedStepIsAllowed) return null;

	return {
		currentStep: firstIncompleteStep,
		stepWarning: getCheckoutStepWarning(firstIncompleteStep),
	};
};

const normalizeStepper = (
	initialOrder: IOrderWithCustmAttr,
	stateStepper: ICheckoutStepper | null | undefined,
	steps: TCheckoutStep[],
) => {
	const requestedStepper = buildRequestedStepper(stateStepper, steps);
	const blockedCheckoutStep = resolveBlockedCheckoutStep(initialOrder, requestedStepper);

	const currentStep = blockedCheckoutStep
		? blockedCheckoutStep.currentStep
		: resolveRequestedCurrentStep(requestedStepper);

	const stepWarning = blockedCheckoutStep ? blockedCheckoutStep.stepWarning : null;

	return {
		stepper: {
			...requestedStepper,
			currentStep,
		},
		stepWarning,
	};
};

const resolveCheckoutTotalPrice = (
	checkoutDataOrder: CheckoutDataOrder,
	initialOrder: IOrderWithCustmAttr,
) => {
	if (checkoutDataOrder?.total_price) return checkoutDataOrder.total_price;

	return initialOrder.total_price;
};

const buildCheckoutInitData = ({
	items,
	initialOrder,
	normalizedStepper,
	stepWarning,
	checkoutDataTotal,
	checkoutDataOrder,
	cartTotal,
	checkoutDataOrderService,
	tax,
}: BuildCheckoutInitDataParams): CheckoutInitDataWithWarning => ({
	items,
	order: {...initialOrder},
	currency: {...DEFAULT_CURRENCY},
	localeSettings: {money: {...DEFAULT_LOCALE_SETTINGS.money}},
	stepper: normalizedStepper,
	stepWarning,
	total: checkoutDataTotal
		? checkoutDataTotal
		: buildCheckoutTotal({
			price: resolveCheckoutTotalPrice(checkoutDataOrder, initialOrder),
			cartTotal,
			checkoutDataOrder,
			checkoutDataOrderService,
			tax,
		}),
});

const hasCheckoutCartItems = (cart: Cart | null): cart is CheckoutCartWithItems => Boolean(cart?.items?.length);

const dispatchEmptyCartError = (dispatch: CheckoutDispatch) => {
	dispatch(setGlobalError(EMPTY_CART_ERROR));
};

const buildCheckoutInitDataForCart = async ({
	cart,
	cartId,
	stateOrder,
	stateStepper,
}: BuildCheckoutInitDataForCartParams): Promise<CheckoutInitDataWithWarning> => {
	const {items, total: cartTotal} = cart;
	const steps = buildCheckoutSteps(items);
	const checkoutData = getCheckoutData();
	const checkoutDataOrder = checkoutData?.order;

	const totalOrderTaxes = await resolveOrderTaxes(items, checkoutDataOrder);
	const tax = buildTaxSummary(items, totalOrderTaxes, checkoutDataOrder);
	const checkoutDataOrderService = getCheckoutDataOrderService(checkoutDataOrder);

	const initialOrder = buildInitialOrder({
		cartId,
		stateOrder,
		cartTotal,
		checkoutDataOrder,
		checkoutDataOrderService,
		totalOrderTaxes,
		tax,
	});

	const {stepper: normalizedStepper, stepWarning} = normalizeStepper(
		initialOrder,
		stateStepper,
		steps,
	);

	return buildCheckoutInitData({
		items,
		initialOrder,
		normalizedStepper,
		stepWarning,
		checkoutDataTotal: checkoutData?.total,
		checkoutDataOrder,
		cartTotal,
		checkoutDataOrderService,
		tax,
	});
};

const completeCheckoutInitialization = (
	dispatch: CheckoutDispatch,
	data: CheckoutInitDataWithWarning,
	onCheckoutInited?: TOnCheckoutInited,
) => {
	dispatch(setCheckoutData(data));
	dispatch(setCheckoutInited({isInited: true}));

	if (onCheckoutInited) {
		onCheckoutInited(data);
	}
};

const handleCheckoutInitializationError = (
	dispatch: CheckoutDispatch,
	error: unknown,
) => {
	console.error(error);
	dispatch(setGlobalError(CHECKOUT_INIT_ERROR));
};

export const initCheckoutByCart =
	(config: {onCheckoutInited?: TOnCheckoutInited}): AppThunk =>
		async (dispatch, getState) => {
			const {cartId, order, stepper} = getState().app;
			const {onCheckoutInited} = config;

			const cart = getCartOrRetrieve();

			try {
				if (!hasCheckoutCartItems(cart)) {
					dispatchEmptyCartError(dispatch);

					return;
				}

				const data = await buildCheckoutInitDataForCart({
					cart,
					cartId,
					stateOrder: order,
					stateStepper: stepper,
				});

				completeCheckoutInitialization(dispatch, data, onCheckoutInited);
			} catch (error) {
				handleCheckoutInitializationError(dispatch, error);
			}
		};

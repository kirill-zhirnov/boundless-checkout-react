import {
	DELIVERY_ID,
	SELF_PICKUP_ID,
	SHIPPING_DELIVERY_ID,
} from "../constants";
import {IOrderService, IOrderWithCustmAttr} from "../types/Order";
import {TShippingAlias} from "../types/shippingForm";
import {ICheckoutStepper, TCheckoutStep} from "../types/common";
import {isDeliveryQuoteFresh} from "./deliveryQuote";

export interface ICheckoutStepWarning {
	step: TCheckoutStep;
	message: string;
}

const stepWarnings: Partial<Record<TCheckoutStep, string>> = {
	[TCheckoutStep.contactInfo]: "Please complete your contact information before continuing.",
	[TCheckoutStep.shippingAddress]: "Please complete your delivery method before continuing.",
	[TCheckoutStep.deliveryDetails]: "Please complete your delivery details before continuing.",
};

const hasValue = (value: unknown): boolean => {
	if (typeof value === "string") return value.trim().length > 0;

	return value !== null && value !== undefined;
};

const hasRequiredAddressFields = (address: any): boolean => {
	if (!address) return false;

	return [
		address.first_name,
		address.last_name,
		address.address_line_1,
		address.city,
		address.state,
		address.zip,
	].every(hasValue);
};

const getSelectedService = (order: IOrderWithCustmAttr | undefined) =>
	order?.services?.find(Boolean) ?? null;

const isPickupService = (service: IOrderService | null): boolean => {
	if (!service) return false;

	return (
		service.service_id === SELF_PICKUP_ID ||
		service.serviceDelivery?.delivery?.alias === TShippingAlias.selfPickup ||
		service.serviceDelivery?.title === "Self Pickup" ||
		service.serviceDelivery?.delivery?.title === "Self Pickup"
	);
};

const isAddressRequiredService = (service: IOrderService | null): boolean => {
	if (!service) return false;

	if (isPickupService(service)) return false;

	return (
		service.service_id === DELIVERY_ID ||
		service.service_id === SHIPPING_DELIVERY_ID ||
		service.serviceDelivery?.title === "Delivery" ||
		service.serviceDelivery?.title === "Shipping" ||
		service.serviceDelivery?.delivery?.title === "Delivery" ||
		service.serviceDelivery?.delivery?.title === "Shipping"
	);
};

export const isContactStepComplete = (
	order: IOrderWithCustmAttr | undefined,
): boolean => {
	const customer = order?.customer;

	if (!customer) return false;

	return [
		customer.id,
		customer.first_name,
		customer.last_name,
		customer.email,
		customer.phone,
		customer.dob,
	].every(hasValue);
};

export const isShippingStepComplete = (
	order: IOrderWithCustmAttr | undefined,
): boolean => {
	const service = getSelectedService(order);

	if (!service) return false;

	if (isPickupService(service)) return true;

	if (!isAddressRequiredService(service)) return false;

	const addresses = order?.customer?.addresses ?? [];
	const shippingAddress = addresses.find((address: any) => address.type === "shipping");
	const billingAddress = addresses.find((address: any) => address.type === "billing");

	if (!hasRequiredAddressFields(shippingAddress)) return false;

	if (billingAddress && !hasRequiredAddressFields(billingAddress)) return false;

	const isDelivery = service.service_id === DELIVERY_ID ||
		service.serviceDelivery?.title === "Delivery" ||
		service.serviceDelivery?.delivery?.title === "Delivery";

	if (isDelivery && !isDeliveryQuoteFresh(order?.custom_attrs?.deliveryQuote)) return false;

	return true;
};

export const getCheckoutStepWarning = (
	step: TCheckoutStep,
): ICheckoutStepWarning => ({
	step,
	message: stepWarnings[step] ?? "Please complete this checkout step before continuing.",
});

const isStepComplete = (
	step: TCheckoutStep,
	order: IOrderWithCustmAttr | undefined,
	stepper: ICheckoutStepper,
): boolean => {
	switch (step) {
		case TCheckoutStep.contactInfo:
			return isContactStepComplete(order);
		case TCheckoutStep.shippingAddress:
			return isShippingStepComplete(order);
		case TCheckoutStep.deliveryDetails:
			return stepper.filledSteps.includes(TCheckoutStep.deliveryDetails);
		default:
			return true;
	}
};

export const getFirstIncompleteCheckoutStep = (
	order: IOrderWithCustmAttr | undefined,
	stepper: ICheckoutStepper,
): TCheckoutStep | null => {
	for (const step of stepper.steps) {
		if (step === TCheckoutStep.paymentMethod || step === TCheckoutStep.thankYou) {
			return null;
		}

		if (!isStepComplete(step, order, stepper)) return step;
	}

	return null;
};

export const canNavigateToCheckoutStep = (
	targetStep: TCheckoutStep,
	order: IOrderWithCustmAttr | undefined,
	stepper: ICheckoutStepper,
): boolean => {
	const currentStepIndex = stepper.steps.indexOf(stepper.currentStep);
	const targetStepIndex = stepper.steps.indexOf(targetStep);

	if (targetStepIndex === -1) return false;

	if (currentStepIndex !== -1 && targetStepIndex < currentStepIndex) return true;

	const prerequisiteSteps = stepper.steps.slice(0, targetStepIndex);

	return prerequisiteSteps.every((step) => isStepComplete(step, order, stepper));
};

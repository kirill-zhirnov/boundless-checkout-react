import {IDelivery, TShippingAlias} from "../types/shippingForm";
import {IOrderWithCustmAttr, ITotal} from "../types/Order";

export const isPickUpDelivery = (
	deliveryId: number,
	deliveryOptions: IDelivery[],
): boolean => {
	const selectedDelivery = deliveryOptions.find(
		({delivery_id}) => delivery_id == deliveryId,
	);

	if (selectedDelivery) {
		return selectedDelivery.alias === TShippingAlias.selfPickup;
	}

	return false;
};

export const isDeliveryMethod = (
	deliveryId: number,
	deliveryOptions: IDelivery[],
): boolean => {
	const selectedDelivery = deliveryOptions.find(
		({delivery_id}) => delivery_id == deliveryId,
	);

	if (selectedDelivery) {
		return selectedDelivery.title === "Delivery";
	}

	return false;
};

export const hasDeliveryId = (
	order: IOrderWithCustmAttr,
	deliveryId: number,
): boolean => {
	return !!order?.services?.some((service) => service.service_id === deliveryId);
};

export const hasShipping = (order: IOrderWithCustmAttr) => {
	if (!order.services || order.services.length < 1) return false;

	const serviceTitle = order.services[0].serviceDelivery?.delivery?.title;

	return serviceTitle === "Shipping" || serviceTitle === "Delivery";
};

// Helper function to check if order qualifies for free shipping
export const qualifiesForFreeShipping = (
	total: ITotal | undefined,
): boolean => {
	const itemsSubTotal = total?.itemsSubTotal?.price || "0";
	const subtotal = Number(itemsSubTotal);

	return subtotal >= 100;
};

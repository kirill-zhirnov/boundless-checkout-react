import {IDelivery, TShippingAlias} from 'boundless-api-client';

export const isPickUpDelivery = (deliveryId: number, deliveryOptions: IDelivery[]): boolean => {
	const selectedDelivery = deliveryOptions.find(({delivery_id}) => delivery_id == deliveryId);

	if (selectedDelivery) {
		return selectedDelivery.shipping?.alias === TShippingAlias.selfPickup;
	}

	return false;
};

import {useAppSelector} from "../hooks/redux";
import {Cart, CleanedCovaProduct, CovaCartItem} from "../types/cart";

export const covaProductPrice = (product: CleanedCovaProduct): string => {
	const price = product.Prices[0]?.Price;
	const discountedPrice = product.discountedPrice;

	return discountedPrice ? discountedPrice : price.toString();
};

export const isPromotionItem = (product: CleanedCovaProduct): boolean => {
	return !!product.discountedPrice;
};

export const useCartHasTickets = () => {
	const cartItems = useAppSelector((state) => state.app.items);

	return cartItems?.some(
		(item) => item.product.ClassificationName === "Workshops"
	);
};

/**
 * Extract a given spec from a product's ProductSpecifications
 * @param productSpecifications Array of product specifications
 * @returns Spec value if found, null otherwise
 */
const extractSpec = (
	productSpecifications: Array<{
		Unit: string;
		Value: string;
		DisplayName: string;
	}>,
	specName: string,
): string | null => {
	const spec = productSpecifications?.find((spec) => {
		if (specName === "Brand") {
			if (
				spec.DisplayName === "Brand USE THIS ONE" &&
				spec.Value?.trim() !== ""
			) {
				return true;
			}
		}

		return spec.DisplayName === specName;
	});

	return spec?.Value?.trim() || null;
};

export const productIsDropShip = (product: CleanedCovaProduct) => {
	const isDropShip = extractSpec(product.ProductSpecifications, "Is Drop Shipping Inventory");

	return isDropShip === "Yes";
};

export const ordersDropShippingItems = (items: CovaCartItem[]) => {
	const dropShipItems = items.filter((item) => {
		return productIsDropShip(item.product);
	});

	return dropShipItems;
};

export const ordersRegularItems = (items: CovaCartItem[]) => {
	const dropShipItems = items.filter((item) => {
		return !productIsDropShip(item.product);
	});

	return dropShipItems;
};
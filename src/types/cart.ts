import type {IOrderWithCustmAttr, ITotal} from "./Order";
import type {ICheckoutStepper} from "./common";

export interface ICartTotal {
	qty: number;
	total: string;
}

export interface ICurrency {
	currency_id: number;
	alias: string;
	code: number;
}

export interface ILocaleSettings {
	money: {
		decimal: string;
		thousand: string;
		precision: number;
		format: string;
		symbol: string;
	};
}

export interface CovaProduct {
	ProductId: string;
	MasterProductId: number;
	MasterProductName: string;
	VariationId: null | number;
	Slug: string;
	CatalogSku: string;
	IsArchived: boolean;
	MeasurementType: string;
	IsBatchTracked: boolean;
	IsNonStock: boolean;
	LifeCycle: string;
	ClassificationId: number;
	ClassificationName: string;
	ClassificationPath: string;
	Name: string;
	ShortDescription: string;
	LongDescription: string;
	HeroShotUri: string;
	SupplierSkus: Array<{
		SKU: string;
		SupplierId: number;
		Supplier: string;
		Description: string;
	}>;
	ManufacturerSkus: Array<any>;
	Upcs: Array<any>;
	ProductSpecifications: Array<{
		Unit: string;
		Value: string;
		DisplayName: string;
	}>;
	Assets: Array<{
		Id: string;
		Name: string;
		Uri: string;
		Type: string;
		IsHidden: boolean;
	}>;
	Availability: Array<{
		LocationId: number;
		RoomId: number;
		PackageId: string;
		BatchId: string;
		UnitId: number;
		InStockQuantity: number;
		OnOrderQuantity: number;
		TransferInQuantity: number;
		TransferOutQuantity: number;
		TotalCostInStock: number;
		UnitCost: number;
		ReceivedDate: string;
		UpdatedDateUtc: string;
		IsSellingRoom: boolean;
	}>;
	Prices: Array<{
		LocationId: number;
		FromEntityId: number;
		ProductId: string;
		TierId: null | number;
		TierName: null | string;
		TierQuantity: null | number;
		GroupId: null | number;
		GroupName: null | string;
		ShelfId: null | number;
		ShelfName: null | string;
		Price: number;
		AtTierPrice: null | number;
		SalePrices: Array<any>;
		UpdatedDateUtc: string;
	}>;
	discountedPrice?: string;
	couponPrice?: string;
	discount?: number;
	UpdatedDateUtc: string;
	taxTotal?: string;
	MSRP: null | number;
	MSRPCurrencyCode: null | string;
}

export type CleanedCovaProduct = Pick<
	CovaProduct,
	| "ProductId"
	| "Slug"
	| "ClassificationId"
	| "ClassificationName"
	| "Name"
	| "ShortDescription"
	| "LongDescription"
	| "HeroShotUri"
	| "ProductSpecifications"
	| "Assets"
	| "Availability"
	| "Prices"
	| "discountedPrice"
	| "taxTotal"
	| "couponPrice"
	| "discount"
	| "UpdatedDateUtc"
>;

export interface Cart {
	id: string;
	total: ICartTotal;
	items?: CovaCartItem[];
	taxAmount?: number;
}

export interface CovaCartItem {
	product: CleanedCovaProduct;
	qty: number;
	originalQty?: number;
	total: string | number;
	thcGrams?: number | null;
}

export interface CovaCheckoutInitData {
	items: CovaCartItem[];
	order: IOrderWithCustmAttr;
	currency: ICurrency;
	localeSettings: ILocaleSettings;
	stepper: ICheckoutStepper;
	total: ITotal;
}

export interface Coupon {
	code: string;
	type: string;
	value: string;
}

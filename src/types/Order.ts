import type {CovaCartItem} from "./cart";
import type {StoredDeliveryQuote} from "../lib/deliveryQuote";
import type {IAddress, IDelivery} from "./shippingForm";

export enum TPublishingStatus {
	published = "published",
}

export interface ITotal {
	price: string | null;
	itemsSubTotal: {price: string; qty: number};
	discount: string;
	tax: {
		totalTaxAmount: string | null;
		itemsWithTax: CovaCartItem[];
		shipping: {shippingTaxes?: string};
	};
	servicesSubTotal: {price: string | number; qty: number};
}

export interface IOrderService {
	order_service_id: string;
	service_id: number;
	qty: number;
	total_price: string;
	item_price_id: string;
	is_delivery: boolean;
	serviceDelivery: {
		delivery_id: number;
		title: string;
		text_info: null;
		data: null;
		delivery: IDelivery;
	};
}

export interface IOrderDiscount {
	discount_id: string;
	title: string;
	discount_type: "percent" | "fixed";
	value: string;
}

export interface IPaymentMethod {
	payment_method_id: string;
	title: string;
}

export interface IOrderWithCustmAttr {
	id: string;
	status_id: null | number;
	payment_method_id: null | string;
	service_total_price: null | string;
	payment_mark_up: null | string;
	total_price: null | string;
	discount_for_order: null | string;
	tax_amount: null | string;
	publishing_status: TPublishingStatus;
	created_at: string;
	customer?: ICustomCustomer;
	discounts?: IOrderDiscount[];
	paymentMethod?: IPaymentMethod;
	services?: IOrderService[];
	tax_calculations: ITotal | null;
	servicesSubTotal?: {qty: number; price: string};
	custom_attrs: {
		deliveryQuote?: StoredDeliveryQuote;
		[key: string]: any;
	};
	tip?: string;
	delivery_time?: string;
	drop_ship_delivery_time?: string;
	paid_at: string | null;
}

export interface ICustomCustomer {
	id: string;
	email: string | null;
	created_at: string;
	first_name: string | null;
	last_name: string | null;
	phone: string | null;
	dob?: string;
	custom_attrs: null;
	addresses: IAddress[];
}

export interface ICheckoutData {
	order: IOrderWithCustmAttr | undefined;
	total: ITotal | undefined;
	items?: CovaCartItem[];
}

export interface IPayfirmaInfo {
	token: string;
	environment: string;
	endpoint: string;
}

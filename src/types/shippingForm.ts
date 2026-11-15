export enum TAddressType {
	shipping = "shipping",
	billing = "billing",
}

export enum TShippingAlias {
	selfPickup = "selfPickup",
}

export interface IVWCountry {
	country_id: number;
	code: string;
	title: string;
}

export interface IAddress {
	id: string;
	type: TAddressType;
	is_default: boolean;
	first_name: string | null;
	last_name: string | null;
	company: string | null;
	address_line_1: string | null;
	address_line_2: string | null;
	city: string | null;
	state: string | null;
	zip: string | null;
	country_id: number;
	created_at: string;
	vwCountry: IVWCountry | null;
}

export interface IDelivery {
	delivery_id: number;
	title: string;
	description: string;
	alias: string;
	shipping_id: number;
	shipping_config: null;
	free_shipping_from: null;
	calc_method: null;
	created_at: string;
	shipping: null;
	img: null;
}

export interface ICheckoutShippingPageData {
	shippingAddress: IAddress | null;
	billingAddress: IAddress | null;
	options: {delivery: IDelivery[]};
}

export interface IAddressFormFields {
	first_name: string;
	last_name: string;
	company: string;
	address_line_1: string;
	address_line_2: string;
	city: string;
	state: string;
	zip: string;
	country_id: number;
}

export interface IShippingFormValues {
	delivery_id: number;
	delivery_time?: string;
	deliveryInstructions?: string;
	shipping_address: IAddressFormFields;
	billing_address_the_same?: boolean;
	billing_address: IAddressFormFields;
}

export interface IAddressSubForm {
	first_name?: string;
	last_name: string;
	company?: string;
	address_line_1: string;
	address_line_2?: string;
	city: string;
	state?: string;
	country_id: number|string;
	zip: string;
}

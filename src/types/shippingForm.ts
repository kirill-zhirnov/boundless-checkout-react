import {IAddressFields} from 'boundless-api-client';
export interface IShippingFormValues {
	delivery_id: number;
	shipping_address?: IAddressFields;
	billing_address_the_same?: boolean;
	billing_address?: IAddressFields;
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
	phone?: string;
}
import React from 'react';
import {IVWCountry, TCheckoutCustomerName, TCheckoutFieldStatus} from 'boundless-api-client';
import Grid from '@mui/material/Grid';
import {FormikProps, useFormikContext} from 'formik';
import TextField from '@mui/material/TextField';
import {IFieldAttrs} from '../../../lib/formUtils';
import {useAppSelector} from '../../../hooks/redux';
import {IAddressSubForm, IShippingFormValues} from '../../../types/shippingForm';

export default function AddressFieldset({countries, showPhone, keyPrefix}: IProps) {
	const {settings} = useAppSelector(state => state.app);
	const formikProps = useFormikContext<IShippingFormValues>();

	return (
		<Grid container spacing={2}>
			<Grid item xs={6}>
				<TextField label={'First name'}
									 variant={'standard'}
									 required={settings!.customerNameRequired.includes(TCheckoutCustomerName.first)}
									 fullWidth
									 {...addressFieldAttrs(keyPrefix, 'first_name', formikProps)}
				/>
			</Grid>
			<Grid item xs={6}>
				<TextField label={'Last name'}
									 variant={'standard'}
									 required={true}
									 fullWidth
									 {...addressFieldAttrs(keyPrefix, 'last_name', formikProps)}
				/>
			</Grid>

			{[TCheckoutFieldStatus.optional, TCheckoutFieldStatus.required].includes(settings!.companyName) &&
			<Grid item xs={12}>
				<TextField label={'Company'}
									 variant={'standard'}
									 required={settings!.companyName === TCheckoutFieldStatus.required}
									 fullWidth
									 {...addressFieldAttrs(keyPrefix, 'company', formikProps)}
				/>
			</Grid>
			}

			<Grid item xs={12}>
				<TextField label={'Address'}
									 variant={'standard'}
									 required={true}
									 fullWidth
									 {...addressFieldAttrs(keyPrefix, 'address_line_1', formikProps)}
				/>
			</Grid>

			{[TCheckoutFieldStatus.optional, TCheckoutFieldStatus.required].includes(settings!.addressLine2) &&
			<Grid item xs={12}>
				<TextField label={'Apartment, suite, etc.'}
									 variant={'standard'}
									 required={settings!.addressLine2 === TCheckoutFieldStatus.required}
									 fullWidth
									 {...addressFieldAttrs(keyPrefix, 'address_line_2', formikProps)}
				/>
			</Grid>
			}

			<Grid item xs={6}>
				<TextField label={'ZIP code'}
									 variant={'standard'}
									 required={true}
									 fullWidth
									 {...addressFieldAttrs(keyPrefix, 'zip', formikProps)}
				/>
			</Grid>
			<Grid item xs={6}>
				<TextField label={'City'}
									 variant={'standard'}
									 required={true}
									 fullWidth
									 {...addressFieldAttrs(keyPrefix, 'city', formikProps)}
				/>
			</Grid>

			<Grid item xs={6}>
				<TextField label={'State'}
									 variant={'standard'}
									 fullWidth
									 {...addressFieldAttrs(keyPrefix, 'state', formikProps)}
				/>
			</Grid>
			<Grid item xs={6}>
				<TextField label={'Country'}
									 variant={'standard'}
									 required={true}
									 fullWidth
									 select
									 SelectProps={{native: true}}
									 {...addressFieldAttrs(keyPrefix, 'country_id', formikProps)}
				>
					<option>Select country</option>
					{countries.map(({country_id, title}) =>
						<option key={country_id} value={country_id}>{title}</option>
					)}
				</TextField>
			</Grid>

			{showPhone &&
			<Grid item xs={12}>
				<TextField label={'Phone'}
									 variant={'standard'}
									 fullWidth
									 {...addressFieldAttrs(keyPrefix, 'phone', formikProps)}
				/>
			</Grid>
			}
		</Grid>
	);
}

interface IProps {
	countries: IVWCountry[],
	showPhone?: boolean,
	keyPrefix: 'shipping_address' | 'billing_address'
}

export interface IAddressFields {
	first_name?: string;
	last_name?: string;
	company?: string;
	address_line_1?: string;
	address_line_2?: string;
	city?: string;
	state?: string;
	country_id?: number|string;
	zip?: string;
	phone?: string;
}

export function addressFieldAttrs(
	keyPrefix: 'shipping_address' | 'billing_address',
	field: string,
	formikProps: FormikProps<IShippingFormValues>,
	helperText: string = ''
): IFieldAttrs {
	const {errors, values, handleChange} = formikProps;
	const addressValues = values[keyPrefix] as IAddressSubForm;

	const fullName = `${keyPrefix}.${field}`;
	let error = false;
	//@ts-ignore
	if (fullName in errors && errors[fullName]) {
		error = true;
		//@ts-ignore
		helperText = errors[fullName] as string;
	}

	const out: IFieldAttrs = {
		name: fullName,
		error,
		value: '',
		onChange: handleChange
	};

	//@ts-ignore
	if (field in addressValues && addressValues[field] !== null) {
		//@ts-ignore
		out.value = addressValues[field];
	}

	if (helperText)
		out.helperText = helperText;

	return out;
}
import React from 'react';
import {IVWCountry, TCheckoutCustomerName, TCheckoutFieldStatus} from 'boundless-api-client';
import Grid from '@mui/material/Grid';
import {FormikProps} from 'formik';
import TextField from '@mui/material/TextField';
import {fieldAttrs} from '../lib/formUtils';
import {useAppSelector} from '../hooks/redux';

interface IProps {
	countries: IVWCountry[],
	formikProps: FormikProps<IAddressFields>,
	showPhone?: boolean
}

export default function AddressFieldset({formikProps, countries, showPhone}: IProps) {
	const {settings} = useAppSelector(state => state.app);

	return (
		<Grid container spacing={2}>
			<Grid item xs={6}>
				<TextField label={'First name'}
									 variant={'standard'}
									 required={settings!.customerNameRequired.includes(TCheckoutCustomerName.first)}
									 fullWidth
									 {...fieldAttrs('first_name', formikProps)}
				/>
			</Grid>
			<Grid item xs={6}>
				<TextField label={'Last name'}
									 variant={'standard'}
									 required={true}
									 fullWidth
									 {...fieldAttrs('last_name', formikProps)}
				/>
			</Grid>

			{[TCheckoutFieldStatus.optional, TCheckoutFieldStatus.required].includes(settings!.companyName) &&
			<Grid item xs={12}>
				<TextField label={'Company'}
									 variant={'standard'}
									 required={settings!.companyName === TCheckoutFieldStatus.required}
									 fullWidth
									 {...fieldAttrs('company', formikProps)}
				/>
			</Grid>
			}

			<Grid item xs={12}>
				<TextField label={'Address'}
									 variant={'standard'}
									 required={true}
									 fullWidth
									 {...fieldAttrs('address_line_1', formikProps)}
				/>
			</Grid>

			{[TCheckoutFieldStatus.optional, TCheckoutFieldStatus.required].includes(settings!.addressLine2) &&
			<Grid item xs={12}>
				<TextField label={'Apartment, suite, etc.'}
									 variant={'standard'}
									 required={settings!.addressLine2 === TCheckoutFieldStatus.required}
									 fullWidth
									 {...fieldAttrs('address_line_2', formikProps)}
				/>
			</Grid>
			}

			<Grid item xs={6}>
				<TextField label={'ZIP code'}
									 variant={'standard'}
									 required={true}
									 fullWidth
									 {...fieldAttrs('zip', formikProps)}
				/>
			</Grid>
			<Grid item xs={6}>
				<TextField label={'City'}
									 variant={'standard'}
									 required={true}
									 fullWidth
									 {...fieldAttrs('city', formikProps)}
				/>
			</Grid>

			<Grid item xs={6}>
				<TextField label={'State'}
									 variant={'standard'}
									 fullWidth
									 {...fieldAttrs('state', formikProps)}
				/>
			</Grid>
			<Grid item xs={6}>
				<TextField label={'Country'}
									 variant={'standard'}
									 fullWidth
									 select
									 SelectProps={{
										 native: true,
									 }}
									 {...fieldAttrs('country_id', formikProps)}
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
									 {...fieldAttrs('phone', formikProps)}
				/>
			</Grid>
			}
		</Grid>
	);
}

export interface IAddressFields {
	first_name?: string;
	last_name?: string;
	company?: string;
	address_line_1?: string;
	address_line_2?: string;
	city?: string;
	state?: string;
	country_id?: number;
	zip?: string;
}
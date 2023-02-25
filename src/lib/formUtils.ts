import {FormikProps, FormikValues} from 'formik';
import {FormikHandlers} from 'formik/dist/types';

export interface IFieldAttrs {
	name: string;
	error: boolean;
	value: string;
	onChange: FormikHandlers['handleChange'];
	helperText?: string;
}

export function fieldAttrs<V extends FormikValues>(field: string, formikProps: FormikProps<V>, helperText: string = ''): IFieldAttrs {
	const {errors, values, handleChange} = formikProps;

	let error = false;
	if (field in errors && errors[field]) {
		error = true;
		helperText = errors[field] as string;
	}

	const out: IFieldAttrs = {
		name: field,
		error,
		value: '',
		onChange: handleChange
	};

	if (field in values && values[field] !== null) {
		out.value = values[field];
	}

	if (helperText)
		out.helperText = helperText;

	return out;
}

interface ICheckAttrs {
	name: string;
	onChange: FormikHandlers['handleChange'];
	checked?: boolean;
}

export function checkAttrs<V extends FormikValues>(field: string, formikProps: FormikProps<V>): ICheckAttrs {
	const {handleChange, values} = formikProps;

	const out: ICheckAttrs = {
		name: field,
		onChange: handleChange
	};

	if (field in values) {
		out.checked = values[field];
	}

	return out;
}

export type TApiErrors = {field: string; message: string}[];

export function apiErrors2Formik(errors: TApiErrors) {
	const out: {[field: string]: string} = {};

	if (Array.isArray(errors)) {
		errors.forEach(({field, message}) => out[field] = message);
	}

	return out;
}
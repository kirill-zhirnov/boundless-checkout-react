import type {FormikErrors, FormikHelpers} from "formik";
import {addPromise} from "../redux/actions/xhr";
import type {AppDispatch} from "../redux/store";
import {apiErrors2Formik} from "./formUtils";
import type {TApiErrors} from "./formUtils";

interface IApiErrorResponse {
	response: {
		data: TApiErrors;
	};
}

export function dispatchFormikSubmitPromise<TValues>(
	dispatch: AppDispatch,
	promise: Promise<void>,
	{setErrors, setSubmitting}: FormikHelpers<TValues>,
): Promise<void> {
	const handledPromise = promise
		.catch(({response: {data}}: IApiErrorResponse) => {
			setErrors(apiErrors2Formik(data) as FormikErrors<TValues>);
		})
		.finally(() => setSubmitting(false));

	dispatch(addPromise(handledPromise));

	return handledPromise;
}

/// <reference types="react" />
import { FormikErrors } from 'formik';
/**
 * Some fields might not be presented in the form,
 * but in the response might be errors related to these hidden fields (e.g. some system errors).
 *
 * We need to display errors in any case.
 */
export default function ExtraErrors({ presentedFields, errors }: {
    presentedFields: string[];
    errors: FormikErrors<any>;
}): JSX.Element;

import React, {useState, SyntheticEvent, useEffect} from 'react';
import {FormikErrors} from 'formik';
import Snackbar from '@mui/material/Snackbar';
import Alert from '@mui/material/Alert';

/**
 * Some fields might not be presented in the form,
 * but in the response might be errors related to these hidden fields (e.g. some system errors).
 *
 * We need to display errors in any case.
 */
export default function ExtraErrors({excludedFields, errors}: {excludedFields: string[], errors: FormikErrors<any>}) {
	const [open, setIsOpen] = useState(true);
	const [alertText, setAlertText] = useState<null|string>(null);

	useEffect(() => {
		const errorsList = Object.keys(errors)
			.filter((key) => !excludedFields.includes(key))
			.map((key) => errors[key])
		;

		if (errorsList.length) {
			setAlertText(errorsList.join(' '));
			setIsOpen(true);
		} else {
			setAlertText(null);
			setIsOpen(false);
		}
	}, [excludedFields, errors]);

	const handleClose = (event?: SyntheticEvent | Event, reason?: string) => {
		if (reason === 'clickaway') {
			return;
		}
		setIsOpen(false);
		setAlertText(null);
	};

	return (
		<Snackbar open={open}
							autoHideDuration={6000}
							onClose={handleClose}
							anchorOrigin={{vertical: 'top', horizontal: 'right'}}
		>
			<Alert severity="error">{alertText || ''}</Alert>
		</Snackbar>
	);
}
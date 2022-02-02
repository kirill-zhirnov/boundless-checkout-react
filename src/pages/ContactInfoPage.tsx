import React from 'react';
import CheckoutLayout from '../layout/CheckoutLayout';
import {useAppSelector} from '../hooks/redux';

export default function ContactInfoPage() {
	const {settings} = useAppSelector(state => state.app);
	console.log('settings:', settings);

	return (
		<CheckoutLayout>

		</CheckoutLayout>
	);
}
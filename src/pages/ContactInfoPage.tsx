import React from 'react';
import CheckoutLayout from '../layout/CheckoutLayout';
import ContactInformationForm from '../components/ContactInformationForm';
import useInitCheckoutByCart from '../hooks/initCheckout';
import Loading from '../components/Loading';

export default function ContactInfoPage() {
	const {isInited} = useInitCheckoutByCart();

	if (!isInited) {
		return <Loading />;
	}

	return (
		<CheckoutLayout>
			<ContactInformationForm />
		</CheckoutLayout>
	);
}
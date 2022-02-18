import React from 'react';
import CheckoutLayout from '../layout/CheckoutLayout';
import {useAppSelector} from '../hooks/redux';
import {TCheckoutAccountPolicy} from 'boundless-api-client';
import ContactInformationForm from '../components/ContactInformationForm';
import LoginForm from '../components/LoginForm';
import useInitCheckoutByCart from '../hooks/initCheckout';
import Loading from '../components/Loading';

export default function ContactInfoPage() {
	const {isInited} = useInitCheckoutByCart();
	const {settings} = useAppSelector(state => state.app);

	if (!isInited) {
		return <Loading />;
	}

	const {accountPolicy} = settings!;

	return (
		<CheckoutLayout>
			{[TCheckoutAccountPolicy.guestAndLogin, TCheckoutAccountPolicy.guest].includes(accountPolicy) &&
			<ContactInformationForm />}
			{[TCheckoutAccountPolicy.loginRequired].includes(accountPolicy) &&
			<LoginForm />}
		</CheckoutLayout>
	);
}
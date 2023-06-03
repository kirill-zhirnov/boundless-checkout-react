import React from 'react';
import Container from '@mui/material/Container';
import Box from '@mui/material/Box';
import Alert from '@mui/material/Alert';
import AlertTitle from '@mui/material/AlertTitle';
import Button from '@mui/material/Button';
import {useAppSelector} from '../hooks/redux';
import {TClickedElement} from '../lib/elementEvents';
import {useTranslation} from 'react-i18next';

export default function ErrorPage({error}: {error: string}) {
	const {onHide} = useAppSelector((state) => state.app);
	const {t} = useTranslation();

	const onBackClicked = () => {
		if (onHide) {
			onHide(TClickedElement.backToCart);
		}
	};

	return (
		<section className={'bdl-checkout-layout'}>
			<main className={'bdl-checkout-layout__main bdl-checkout-layout__main-v-center'}>
				<Container className={'bdl-checkout-layout__container'}>
					<Alert severity="error">
						<AlertTitle>{t('errorPage.error')}</AlertTitle>
						{error}
					</Alert>
					<Box mt={2} textAlign={'center'}>
						<Button variant="contained"
										size="large"
										onClick={onBackClicked}
						>{t('errorPage.backToSite')}</Button>
					</Box>
				</Container>
			</main>
		</section>
	);
}
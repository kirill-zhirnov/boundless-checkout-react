import React, {ReactNode} from 'react';
import Container from '@mui/material/Container';
import Header from '../components/Header';
import Footer from '../components/Footer';
import Grid from '@mui/material/Grid';

export default function CheckoutLayout({children}: {children: ReactNode | ReactNode[]}) {
	return (
		<section className={'bdl-checkout-layout'}>
			<Header />
			<main className={'bdl-checkout-layout__main'}>
				<Container>
					<Grid container spacing={2}>
						<Grid item md={9} sm={8} xs={12}>
							{children}
						</Grid>
						<Grid item md={3} sm={4} xs={12}>
							Cart will be there
						</Grid>
					</Grid>
				</Container>
			</main>
			<Footer />
		</section>
	);
}
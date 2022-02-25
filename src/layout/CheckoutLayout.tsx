import React, {ReactNode} from 'react';
import Container from '@mui/material/Container';
import Header from '../components/Header';
import Footer from '../components/Footer';
import Grid from '@mui/material/Grid';
import LoadingLine from '../components/LoadingLine';
import CheckoutProgress from '../components/CheckoutProgress';

export default function CheckoutLayout({children}: {children: ReactNode | ReactNode[]}) {
	return (
		<section className={'bdl-checkout-layout'}>
			<LoadingLine />
			<Header />
			<main className={'bdl-checkout-layout__main'}>
				<Container className={'bdl-checkout-layout__container'}>
					<CheckoutProgress />
					<Grid container spacing={2}>
						<Grid item md={9} sm={8} xs={12}>
							{children}
						</Grid>
						<Grid item md={3} sm={4} xs={12}>
							<div style={{borderLeft: '1px solid #f2f2f2', minHeight: '300px'}}>
								Cart will be there
							</div>
						</Grid>
					</Grid>
				</Container>
			</main>
			<Footer />
		</section>
	);
}
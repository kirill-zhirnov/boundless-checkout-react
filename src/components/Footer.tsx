import React from 'react';
import Container from '@mui/material/Container';
import {useAppSelector} from '../hooks/redux';
import Grid from '@mui/material/Grid';

export default function Footer() {
	const {settings} = useAppSelector(state => state.app);
	const {footerLinks} = settings!;

	return (
		<footer className={'bdl-footer'}>
			<Container>
				<Grid container>
					<Grid item md={9} sm={8} xs={12}>
						{(Array.isArray(footerLinks) && footerLinks.length) &&
						<p className={'bdl-footer__links'}>
							{footerLinks.map(({title, url}, i) =>
								<a href={url}
									 key={i}
									 target={'_blank'}
									 className={'bdl-footer__link'}
								>{title}</a>
							)}
						</p>
						}
					</Grid>
					<Grid item md={3} sm={4} xs={12}>some right links</Grid>
				</Grid>
			</Container>
			<div className={'bdl-footer__hr'} />
		</footer>
	);
}
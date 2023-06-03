import React, {MouseEvent} from 'react';
import Container from '@mui/material/Container';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import {useAppSelector} from '../hooks/redux';
import {TClickedElement} from '../lib/elementEvents';
import {useTranslation} from 'react-i18next';

export default function Header() {
	const {onHide} = useAppSelector(state => state.app);
	const {t} = useTranslation();

	const onBackToCartClicked = (e: MouseEvent<HTMLAnchorElement>) => {
		e.preventDefault();
		onHide!(TClickedElement.backToCart);
	};

	const onLogoClicked = (e: MouseEvent<HTMLAnchorElement>) => {
		e.preventDefault();
		onHide!(TClickedElement.logo);
	};

	return (
		<header className={'bdl-header'}>
			<Container>
				<div className={'bdl-header__body'}>
					<a href={'#'}
						 className={'bdl-header__to-cart'}
						 onClick={onBackToCartClicked}
					>
						<ChevronLeftIcon /> {t('header.backToCart')}
					</a>
					<div className={'bdl-header__logo-wrapper'}>
							<a href={'#'}
								 className={'bdl-header__logo'}
								 onClick={onLogoClicked}
							>
								<Logo />
							</a>
					</div>
					{/*<div className={'bdl-header__at-right'}></div>*/}
				</div>
			</Container>
		</header>
	);
}

const Logo = () => {
	const {settings, logo, api} = useAppSelector(state => state.app);

	const textLogoClass = 'bdl-header__text-logo';
	if (logo) {
		return (typeof logo === 'string') ? <h1 className={textLogoClass}>{logo}</h1> : <>{logo}</>;
	} else if (settings?.logo) {
		const thumb = api!.makeThumb({
			imgLocalPath: settings.logo,
			maxSize: 300
		});

		return <img src={thumb.getSrc()} className={'bdl-header__img-logo'} />;
	} else {
		return <h1 className={textLogoClass}>Checkout</h1>;
	}
};
import React, {ReactNode} from 'react';
import ReactDOM, {Root} from 'react-dom/client';
import BoundlessCheckout, {IBoundlessCheckoutProps} from './BoundlessCheckout';
import BoundlessOrderInfo, {BoundlessOrderInfoProps} from './BoundlessOrderInfo';
import {store} from './redux/store';
import {resetState} from './redux/actions/app';
import {initI18n} from './i18n/funcs';
initI18n();

export class StarterWrapper {
	protected root?: Root;

	constructor(
		protected el: HTMLElement,
		protected component: ReactNode
	) {
	}

	start() {
		this.root = ReactDOM.createRoot(this.el);
		this.root.render(<>{this.component}</>);
	}

	destroy() {
		this.root?.unmount();
		// store.dispatch(resetState());
	}
}

export function startCheckout(el: HTMLElement, props: Omit<IBoundlessCheckoutProps, 'show' | 'logo'> & {
	logoSrc?: string,
	logoText?: string
}): StarterWrapper {
	let logo: string|ReactNode|undefined;
	if (props.logoText !== undefined) {
		logo = props.logoText;
	} else if (props.logoSrc) {
		logo = <img src={props.logoSrc} className={'bdl-header__img-logo'} />;
	}

	const wrapper = new StarterWrapper(el, <BoundlessCheckout
		show={true}
		logo={logo}
		{...props}
	/>);
	wrapper.start();

	return wrapper;
}

export function startOrderInfo(el: HTMLElement, props: BoundlessOrderInfoProps): StarterWrapper {
	const wrapper = new StarterWrapper(el, <BoundlessOrderInfo {...props} />);
	wrapper.start();

	return wrapper;
}

export function resetCheckoutState() {
	store.dispatch(resetState());
}
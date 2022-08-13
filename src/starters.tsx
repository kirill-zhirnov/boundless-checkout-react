import React, {ReactNode} from 'react';
import ReactDOM, {Root} from 'react-dom/client';
import BoundlessCheckout, {IBoundlessCheckoutProps} from './BoundlessCheckout';

export class StarterWrapper {
	protected root?: Root;

	constructor(
		protected el: HTMLElement,
		protected component: ReactNode
	) {
	}

	start() {
		this.root =  ReactDOM.createRoot(this.el);
		this.root.render(<>{this.component}</>);
	}

	destroy() {
		this.root?.unmount();
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
	console.log('in startCheckout');
	const wrapper = new StarterWrapper(el, <BoundlessCheckout
		show={true}
		logo={logo}
		{...props}
	/>);
	wrapper.start();
	console.log('started');
	return wrapper;
	// const root = ReactDOM.createRoot(el);
	// root.render(
	// 	<>
	// 		<BoundlessCheckout
	// 			show={true}
	// 			logo={logo}
	// 			{...props}
	// 		/>
	// 	</>
	// );
}
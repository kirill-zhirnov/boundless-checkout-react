import React, {Component, createRef} from 'react';
import ReactDOM from 'react-dom';
import clsx from 'clsx';
import {disableBodyScroll, enableBodyScroll, clearAllBodyScrollLocks} from 'body-scroll-lock';
import '../../styles/styles.scss';
import CheckoutApp from './App';
import {Provider} from 'react-redux';
import {store} from '../redux/store';
// import {initApp} from '../redux/reducers/app';
import {BoundlessClient} from 'boundless-api-client';

export default class BoundlessCheckout extends Component<IBoundlessCheckoutProps, {}> {
	private el: HTMLDivElement;
	private rootElRef: React.RefObject<HTMLDivElement>;

	constructor(props: IBoundlessCheckoutProps) {
		super(props);
		this.el = document.createElement('div');
		this.rootElRef = createRef();
	}

	componentDidMount() {
		document.body.appendChild(this.el);

		// const {onHide, cartId, basename, api} = this.props;
		// store.dispatch(initApp({
		// 	onHide,
		// 	cartId,
		// 	basename,
		// 	api
		// }));
	}

	componentDidUpdate(prevProps: Readonly<IBoundlessCheckoutProps>) {
		if (prevProps.show !== this.props.show && this.rootElRef.current) {
			if (this.props.show) {
				disableBodyScroll(this.rootElRef.current);
			} else {
				enableBodyScroll(this.rootElRef.current);
			}
		}
	}

	componentWillUnmount() {
		clearAllBodyScrollLocks();
		document.body.removeChild(this.el);
	}

	render() {
		const {show, onHide} = this.props;

		return ReactDOM.createPortal(
			<div className={clsx('bdl-checkout', {'bdl-checkout_show': show})}
					 ref={this.rootElRef}
			>
				BoundlessCheckout: coming soon :) got cartId
				<div>
					<button onClick={() => onHide()}>Close</button>
				</div>
				<Provider store={store}>
					<CheckoutApp />
				</Provider>
			</div>,
			this.el
		);
	}
}

interface IBoundlessCheckoutProps {
	cartId: string,
	show: boolean,
	onHide: () => void,
	basename?: string,
	api: BoundlessClient
}
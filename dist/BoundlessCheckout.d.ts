import React, { Component, ReactNode } from 'react';
import '../styles/styles.scss';
import { BoundlessClient } from 'boundless-api-client';
import 'nprogress/nprogress.css';
import '@fontsource/roboto/300.css';
import '@fontsource/roboto/400.css';
import '@fontsource/roboto/500.css';
import '@fontsource/roboto/700.css';
export default class BoundlessCheckout extends Component<IBoundlessCheckoutProps, {}> {
    private el;
    private rootElRef;
    constructor(props: IBoundlessCheckoutProps);
    componentDidMount(): void;
    syncShowProp(): void;
    componentDidUpdate(prevProps: Readonly<IBoundlessCheckoutProps>): void;
    componentWillUnmount(): void;
    render(): React.ReactPortal;
}
interface IBoundlessCheckoutProps {
    cartId: string;
    show: boolean;
    onHide: () => void;
    api: BoundlessClient;
    basename?: string;
    logo?: string | ReactNode;
}
export {};

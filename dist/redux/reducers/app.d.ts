import { BoundlessClient } from 'boundless-api-client';
import { ICartItem, IOrder, ICheckoutPageSettings } from 'boundless-api-client';
import { ReactNode } from 'react';
export declare const setBasicProps: import("@reduxjs/toolkit").ActionCreatorWithPayload<Required<Pick<IAppState, "onHide" | "cartId" | "api">> & {
    basename?: string | undefined;
    logo?: string | ReactNode;
}, string>, showCheckout: import("@reduxjs/toolkit").ActionCreatorWithoutPayload<string>, hideCheckout: import("@reduxjs/toolkit").ActionCreatorWithoutPayload<string>, setCheckoutData: import("@reduxjs/toolkit").ActionCreatorWithPayload<Required<Pick<IAppState, "items" | "order" | "settings">>, string>;
declare const _default: import("redux").Reducer<IAppState, import("redux").AnyAction>;
export default _default;
export interface IAppState {
    basename?: string;
    onHide?: () => void;
    cartId?: string;
    api?: BoundlessClient;
    show: boolean;
    isInited: boolean;
    items?: ICartItem[];
    order?: IOrder;
    settings?: ICheckoutPageSettings;
    logo?: string | ReactNode;
}

export declare const pushPromise: import("@reduxjs/toolkit").ActionCreatorWithPayload<{
    promise: Promise<any>;
}, string>, cleanPromises: import("@reduxjs/toolkit").ActionCreatorWithoutPayload<string>;
declare const _default: import("redux").Reducer<IXHRState, import("redux").AnyAction>;
export default _default;
export interface IXHRState {
    promises: Promise<any>[];
}

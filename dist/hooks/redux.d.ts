import { TypedUseSelectorHook } from 'react-redux';
import type { RootState } from '../redux/store';
export declare const useAppDispatch: () => import("redux").Dispatch<import("redux").AnyAction> & import("redux-thunk").ThunkDispatch<{
    app: import("../redux/reducers/app").IAppState;
    xhr: import("../redux/reducers/xhr").IXHRState;
}, null, import("redux").AnyAction> & import("redux-thunk").ThunkDispatch<{
    app: import("../redux/reducers/app").IAppState;
    xhr: import("../redux/reducers/xhr").IXHRState;
}, undefined, import("redux").AnyAction>;
export declare const useAppSelector: TypedUseSelectorHook<RootState>;

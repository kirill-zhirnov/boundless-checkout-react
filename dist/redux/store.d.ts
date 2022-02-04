import { ThunkAction, Action } from '@reduxjs/toolkit';
export declare const store: import("@reduxjs/toolkit").EnhancedStore<{
    app: import("./reducers/app").IAppState;
    xhr: import("./reducers/xhr").IXHRState;
}, import("redux").AnyAction, import("@reduxjs/toolkit").MiddlewareArray<import("redux-thunk").ThunkMiddleware<{
    app: import("./reducers/app").IAppState;
    xhr: import("./reducers/xhr").IXHRState;
}, import("redux").AnyAction, null> | import("redux-thunk").ThunkMiddleware<{
    app: import("./reducers/app").IAppState;
    xhr: import("./reducers/xhr").IXHRState;
}, import("redux").AnyAction, undefined> | import("redux").Middleware<{}, {
    app: import("./reducers/app").IAppState;
    xhr: import("./reducers/xhr").IXHRState;
}, import("redux").Dispatch<import("redux").AnyAction>>>>;
export declare type AppDispatch = typeof store.dispatch;
export declare type RootState = ReturnType<typeof store.getState>;
export declare type AppThunk<ReturnType = void> = ThunkAction<ReturnType, RootState, unknown, Action<string>>;

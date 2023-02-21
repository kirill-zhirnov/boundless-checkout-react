import {AppThunk} from '../store';
import {resetAppState} from '../reducers/app';
import {resetUserState} from '../reducers/user';
import {resetXhrState} from '../reducers/xhr';

export const resetState = () : AppThunk => async (dispatch) => {
	dispatch(resetAppState());
	dispatch(resetUserState());
	dispatch(resetXhrState());
};
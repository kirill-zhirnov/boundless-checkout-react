import React, {useEffect} from 'react';
import NProgress from 'nprogress';
import {useAppDispatch, useAppSelector} from './redux';
import {RootState} from '../redux/store';
import {cleanPromises} from '../redux/reducers/xhr';
// NProgress.configure({template: '<div class="bar" role="bar"><div class="peg"></div></div><div class="spinner" role="spinner"><div class="spinner-icon"></div></div>'});

export default function useLoadingLine() {
	const dispatch = useAppDispatch();
	const promises = useAppSelector((state: RootState) => state.xhr.promises);

	const checkBgPromises = () => {
		const size = promises.length;
		if (!size) return;

		NProgress.start();
		Promise.allSettled(promises)
			.then(() => {
				if (promises.length === size) {
					NProgress.done();
					dispatch(cleanPromises());
				}
			});
	};

	useEffect(() => {
		checkBgPromises();
	}, [promises]);
}
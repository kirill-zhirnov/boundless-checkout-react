import React, {useEffect, useState} from 'react';
import {useNProgress} from '@tanem/react-nprogress';
import LinearProgress from '@mui/material/LinearProgress';
import CircularProgress from '@mui/material/CircularProgress';
import {useAppDispatch, useAppSelector} from '../hooks/redux';
import {RootState} from '../redux/store';
import clsx from 'clsx';
import {cleanPromises} from '../redux/reducers/xhr';

export default function LoadingLine() {
	const dispatch = useAppDispatch();
	const promises = useAppSelector((state: RootState) => state.xhr.promises);
	const [isAnimating, setIsAnimating] = useState(false);

	const {isFinished, progress} = useNProgress({
		isAnimating,
	});

	const checkBgPromises = () => {
		const size = promises.length;
		if (!size) return;

		setIsAnimating(true);
		Promise.allSettled(promises)
			.then(() => {
				if (promises.length === size) {
					setIsAnimating(false);
					dispatch(cleanPromises());
				}
			});
	};

	useEffect(() => {
		checkBgPromises();
	}, [promises]);//eslint-disable-line

	return (
		<div className={'bdl-loading-line'}>
			<LinearProgress variant="determinate"
											value={isFinished ? 0 : progress*100}
											className={clsx('bdl-loading-line__linear', {'bdl-loading-line__linear_finished': isFinished})}
			/>
			{!isFinished && <CircularProgress className={'bdl-loading-line__circular'} size={20}/>}
		</div>
	);
}
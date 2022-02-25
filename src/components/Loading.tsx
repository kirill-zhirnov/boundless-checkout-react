import {CircularProgress} from '@mui/material';
import React from 'react';

export default function Loading({size = 60}: {size?: number}) {
	return (
		<div className='bdl-loading'>
			<CircularProgress size={size}/>
		</div>
	);
}
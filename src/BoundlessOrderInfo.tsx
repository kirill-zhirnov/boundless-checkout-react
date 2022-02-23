import React, {useEffect, useState} from 'react';
import {BoundlessClient, IDetailedOrder} from 'boundless-api-client';
import Paper from '@mui/material/Paper';
import OrderItems from './components/orderInfo/OrderItems';

export const ApiContext = React.createContext<BoundlessClient|null>(null);

export default function BoundlessOrderInfo({api, orderId}: BoundlessOrderInfoProps) {
	const [order, setOrder] = useState<IDetailedOrder | null>(null);

	useEffect(() => {
		api.customerOrder.getOrder(orderId).then((data) => setOrder(data));
	}, [api, orderId]);

	if (!order) return <div>Loading...</div>;

	console.log(order);
	return (
		<ApiContext.Provider value={api}>
			<div style={{backgroundColor: '#fafafa', padding: 20}}>
				<Paper className='bdl-order-summary'>
					<OrderItems order={order} />
				</Paper>
			</div>
		</ApiContext.Provider>
	);
}

interface BoundlessOrderInfoProps {
	orderId: string;
	api: BoundlessClient;
}
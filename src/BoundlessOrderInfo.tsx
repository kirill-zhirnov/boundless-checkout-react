import React, {useEffect, useState} from 'react';
import {BoundlessClient, IDetailedOrder} from 'boundless-api-client';
import Paper from '@mui/material/Paper';
import OrderItems from './components/orderInfo/OrderItems';

import PayButton from './components/PayButton';

export const ApiContext = React.createContext<BoundlessClient | null>(null);
export const ErrorContext = React.createContext<((error: any) => void) | null | undefined>(null);

export default function BoundlessOrderInfo({api, orderId, showItems = true, showPayButton = true, showStatus = true, onError}: BoundlessOrderInfoProps) {
	const [order, setOrder] = useState<IDetailedOrder | null>(null);

	useEffect(() => {
		api.customerOrder.getOrder(orderId)
			.then((data) => setOrder(data))
			.catch(err => {
				console.error(err);

				if (onError) {
					onError(err);
				} else throw err;
			});

	}, [api, orderId, onError]);

	if (!order) return <div>Loading...</div>;

	return (
		<ApiContext.Provider value={api}>
			<ErrorContext.Provider value={onError}>
				<div className='bdl-order-summary'>
					{showPayButton && <PayButton orderId={orderId} />}
					{showStatus && <p className='bdl-order-summary__status'>Order status: {order.status?.title}</p>}
					<Paper>
						{showItems && <OrderItems order={order} />}
					</Paper>
				</div>
			</ErrorContext.Provider>
		</ApiContext.Provider>
	);
}

interface BoundlessOrderInfoProps {
	orderId: string;
	api: BoundlessClient;
	showItems?: boolean;
	showStatus?: boolean;
	showPayButton?: boolean;
	onError?: (error: any) => void;
}
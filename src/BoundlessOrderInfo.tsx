import React, {useEffect, useState} from 'react';
import {BoundlessClient, IDetailedOrder} from 'boundless-api-client';
import Paper from '@mui/material/Paper';
import OrderItems from './components/orderInfo/OrderItems';
import {Button} from '@mui/material';
import PaymentIcon from '@mui/icons-material/Payment';

export const ApiContext = React.createContext<BoundlessClient | null>(null);

export default function BoundlessOrderInfo({api, orderId, showItems = true, showPayButton = true, showStatus = true}: BoundlessOrderInfoProps) {
	const [order, setOrder] = useState<IDetailedOrder | null>(null);

	useEffect(() => {
		api.customerOrder.getOrder(orderId).then((data) => setOrder(data));
	}, [api, orderId]);

	if (!order) return <div>Loading...</div>;

	console.log(order);
	return (
		<ApiContext.Provider value={api}>
			<div className='bdl-order-summary'>
				{showPayButton && <p className='bdl-order-summary__pay-now'>
					<Button
						color='primary'
						size='large'
						startIcon={<PaymentIcon />}
						variant='contained'
					>
						Pay now
					</Button>
				</p>}
				{showStatus && <p className='bdl-order-summary__status'>Order status: {order.status?.title}</p>}
				<Paper>
					{showItems && <OrderItems order={order} />}
				</Paper>
			</div>
		</ApiContext.Provider>
	);
}

interface BoundlessOrderInfoProps {
	orderId: string;
	api: BoundlessClient;
	showItems?: boolean;
	showStatus?: boolean;
	showPayButton?: boolean;
}
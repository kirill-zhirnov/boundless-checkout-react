import React, {useEffect, useState} from 'react';
import {BoundlessClient, IDetailedOrder, TPaymentGatewayAlias} from 'boundless-api-client';
import Paper from '@mui/material/Paper';
import OrderItems from './components/orderInfo/OrderItems';
import Typography from '@mui/material/Typography';
import PayButton from './components/PayButton';
import Loading from './components/Loading';

export const ApiContext = React.createContext<BoundlessClient | null>(null);

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

	if (!order) return <Loading />;

	return (
		<ApiContext.Provider value={api}>
			<div className='bdl-order-summary'>
				{(showPayButton && !order.paid_at && order.paymentMethod?.gateway_alias === TPaymentGatewayAlias.paypal) &&
				<PayButton orderId={orderId} onError={onError} />
				}
				{showStatus &&
				<div>
					<Typography variant="subtitle1" gutterBottom>Order ID: {order.order_id}</Typography>
					<Typography variant="subtitle1" gutterBottom>Order status: {order.status?.title}</Typography>
					{order.paid_at && <Typography variant="subtitle1" gutterBottom>Payment status: Paid</Typography>}
				</div>}
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
	onError?: (error: any) => void;
}
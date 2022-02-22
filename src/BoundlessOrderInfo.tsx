import React from 'react';
import {IDetailedOrder} from 'boundless-api-client';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Paper from '@mui/material/Paper';

export default function BoundlessOrderInfo({order}: {order: IDetailedOrder}) {
	return (
		<TableContainer component={Paper}>
			<Table>
				<TableHead>
					<TableRow>
						<TableCell></TableCell>
						<TableCell>Price</TableCell>
						<TableCell>Qty</TableCell>
						<TableCell>Total</TableCell>
					</TableRow>
				</TableHead>
				<TableBody>
					{order.items.map((item) =>
						<TableRow key={item.item_id}>
							<TableCell>{item.vwItem.product.title}</TableCell>
							<TableCell></TableCell>
							<TableCell></TableCell>
							<TableCell></TableCell>
						</TableRow>
					)}
				</TableBody>
			</Table>
		</TableContainer>
	);
}
import React from "react";
import {useFormikContext} from "formik";
import {
	Box,
	FormControl,
	FormControlLabel,
	FormHelperText,
	Radio,
	RadioGroup,
	Typography,
} from "@mui/material";
import {ICheckoutShippingPageData, IDelivery, IShippingFormValues} from "../../../types/shippingForm";
import StoreMallDirectoryIcon from "@mui/icons-material/StoreMallDirectory";
import LocalShippingIcon from "@mui/icons-material/LocalShipping";
import DirectionsCarIcon from "@mui/icons-material/DirectionsCar";
import {useAppSelector} from "../../../hooks/redux";
import {qualifiesForFreeShipping} from "../../../lib/shipping";
import type {DeliveryTimeOption} from "../../../lib/deliveryTimes";
import {SHIPPING_COST} from "../../../constants";

const DeliveryTitle = ({delivery}: {delivery: IDelivery}) => {
	const iconSx = {
		height: "auto",
		marginRight: "12px",
		maxWidth: "50px",
	};

	return (
		<span>
			{delivery.title === "Self Pickup" && (
				<StoreMallDirectoryIcon fontSize="large" sx={iconSx} />
			)}
			{delivery.title === "Delivery" && (
				<DirectionsCarIcon fontSize="large" sx={iconSx} />
			)}
			{delivery.title === "Shipping" && (
				<LocalShippingIcon fontSize="large" sx={iconSx} />
			)}
		</span>
	);
};

const getDeliveryFeeCopy = (deliveryTimeOptions?: DeliveryTimeOption[]) => {
	const feeFreeSlotCount = Array.isArray(deliveryTimeOptions)
		? deliveryTimeOptions.filter(
			(option) => option.applyDeliveryFee === false,
		).length
		: 0;

	const feeCopy = "Delivery fee is based on driving distance and confirmed after your address is entered.";

	if (feeFreeSlotCount === 0) {
		return feeCopy;
	}

	if (feeFreeSlotCount === deliveryTimeOptions?.length) {
		return `${feeCopy} Free delivery available on all time slots.`;
	}

	return `${feeCopy} Free delivery available on select time slots.`;
};

const FeeCopy = ({isFree, children}: {isFree: boolean; children: React.ReactNode}) => (
	<Typography variant="body2" color="text.secondary" sx={{mt: 1}}>
		{isFree ? (
			<>
				<span style={{textDecoration: "line-through", color: "#999"}}>
					{children}
				</span>
				<span
					style={{
						color: "#4a7c4d",
						fontWeight: "bold",
						marginLeft: "8px",
					}}
				>
					FREE SHIPPING (Order over $100)
				</span>
			</>
		) : (
			children
		)}
	</Typography>
);

const DeliveryDetails = ({
	delivery,
	deliveryTimeOptions,
}: {
	delivery: IDelivery;
	deliveryTimeOptions?: DeliveryTimeOption[];
}) => {
	const {total} = useAppSelector((state) => state.app);
	const details = delivery.description;

	const freeShippingApplies = qualifiesForFreeShipping(total);
	const deliveryFeeCopy = getDeliveryFeeCopy(deliveryTimeOptions);

	if (!details) {
		return null;
	}

	return (
		<Box
			sx={{
				padding: "0 10px 0 0",
			}}
		>
			<Typography variant="body1" component="div">
				{details}
			</Typography>
			{delivery.title === "Delivery" && (
				<FeeCopy isFree={freeShippingApplies}>
					{deliveryFeeCopy}
					<br />
					Free delivery on orders over $100
				</FeeCopy>
			)}
			{delivery.title === "Shipping" && (
				<FeeCopy isFree={freeShippingApplies}>{`Shipping fee: $${SHIPPING_COST}`}</FeeCopy>
			)}
		</Box>
	);
};

type IInPros = Pick<ICheckoutShippingPageData, "options"> & {
	deliveryTimeOptions?: DeliveryTimeOption[];
};

export default function DeliverySelector({options, deliveryTimeOptions}: IInPros) {
	const formikProps = useFormikContext<IShippingFormValues>();

	return (
		<Box
			sx={{
				mb: 2,
				background: "#f8f9fa",
				padding: "15px",
			}}
		>
			<FormControl
				component="fieldset"
				error={Boolean("delivery_id" in formikProps.errors)}
			>
				<RadioGroup
					name="delivery_id"
					onChange={formikProps.handleChange}
					value={formikProps.values.delivery_id}
				>
					{options.delivery.map((delivery) => {
						return (
							<React.Fragment key={delivery.delivery_id}>
								<FormControlLabel
									value={delivery.delivery_id}
									control={
										<Radio
											sx={{
												color: "#133e20",
												"&.Mui-checked": {
													color: "#4a7c4d",
												},
												"&.Mui-disabled": {
													color: "#ccc",
												},
											}}
										/>
									}
									sx={{
										mb: 1,
										alignItems: "flex-start",
									}}
									label={
										<Box
											sx={{
												display: "flex",
												flexDirection: "column",
												width: "100%",
											}}
										>
											<Box
												sx={{
													display: "flex",
													alignItems: "center",
													width: "100%",
												}}
											>
												<DeliveryDetails
													delivery={delivery}
													deliveryTimeOptions={deliveryTimeOptions}
												/>
												<DeliveryTitle delivery={delivery} />
											</Box>
										</Box>
									}
								/>
							</React.Fragment>
						);
					})}
				</RadioGroup>
				{"delivery_id" in formikProps.errors && (
					<FormHelperText>{formikProps.errors.delivery_id}</FormHelperText>
				)}
			</FormControl>
		</Box>
	);
}

import React from "react";
import {useFormikContext} from "formik";
import {ICheckoutShippingPageData, IShippingFormValues} from "../../../types/shippingForm";
import {Box, Typography} from "@mui/material";
import AddressFieldset from "./AddressFieldset";
import FormControlLabel from "@mui/material/FormControlLabel";
import Checkbox from "@mui/material/Checkbox";
import {checkAttrs} from "../../../lib/formUtils";
import {useTranslation} from "react-i18next";
import {isDeliveryMethod} from "../../../lib/shipping";

export default function AddressesFields({
	shippingPage,
}: {
	shippingPage: ICheckoutShippingPageData;
}) {
	const formikProps = useFormikContext<IShippingFormValues>();
	const {t} = useTranslation();

	const {values} = formikProps;

	if (!values.delivery_id) return null;

	const deliveryMethodSelected = isDeliveryMethod(values.delivery_id, shippingPage.options.delivery);

	return (
		<>
			<Box className="bdl-shipping-form__address-form" sx={{mb: 2}}>
				<Typography variant="h6" sx={{mb: 2}}>{deliveryMethodSelected ? t("addresses.deliveryAddress") : t("addresses.shippingAddress")}</Typography>
				<AddressFieldset keyPrefix={"shipping_address"} />
			</Box>
			{!deliveryMethodSelected && (
				<Box sx={{mb: 2}}>
					<FormControlLabel
						control={
							<Checkbox
								value={true}
								color="success"
								{...checkAttrs("billing_address_the_same", formikProps)}
							/>
						}
						label={t("addresses.billingTheSame")}
					/>
				</Box>
			)}
			{!deliveryMethodSelected && !values.billing_address_the_same && (
				<Box className="bdl-shipping-form__address-form" sx={{mb: 2}}>
					<Typography variant="h6">{t("addresses.billingAddress")}</Typography>
					<AddressFieldset
						keyPrefix={"billing_address"}
					/>
				</Box>
			)}
		</>
	);
}

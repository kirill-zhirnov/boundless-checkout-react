import React from "react";
import { Form, Formik, FormikHelpers } from "formik";
import {
	Button,
	FormControl,
	FormHelperText,
	Input,
	InputAdornment,
	InputLabel,
	Skeleton,
} from "@mui/material";
import { apiErrors2Formik, fieldAttrs } from "../../lib/formUtils";
import { useAppDispatch } from "../../hooks/redux";
import { addPromise } from "../../redux/actions/xhr";
import { setOrder, setTotal } from "../../redux/reducers/app";
import { useTranslation } from "react-i18next";
import { CleanedCovaProduct, Coupon } from "../../types/cart";
import to from "await-to-js";
import { IOrderWithCustmAttr } from "../../types/Order";
import {
	getCheckoutData,
	setLocalStorageCheckoutData,
} from "../../hooks/checkoutData";
import { getOrderTaxes } from "../../lib/taxes";
import {
	cartPromotionItems,
	covaProductPrice,
	isPromotionItem,
} from "../../lib/products";
import { getCartOrRetrieve, setCart } from "../../hooks/getCartOrRetrieve";
import { ITotal } from "boundless-api-client";
import { useQuery } from "@tanstack/react-query";
import { useCustomer } from "../../hooks/useCustomer";

export default function CartDiscountForm() {
	const dispatch = useAppDispatch();
	const { t } = useTranslation();
	const { order, total } = getCheckoutData() || {};
	const cart = getCartOrRetrieve();

	const { customer, isSuccess: isCustomerSuccess } = useCustomer(order);

	const {
		isSuccess,
		isError,
		data: coupons,
		error,
	} = useQuery({
		queryKey: ["coupons"],
		queryFn: async (): Promise<Coupon[]> => {
			const [err, resp] = await to(
				fetch(`/api/covaCpn`, {
					method: "GET",
					headers: {
						"Content-Type": "application/json",
					},
				})
			);

			if (err || !resp) {
				console.error("Failed to getCouponProducts", err);
				throw new Error("Failed to getCouponProducts");
			}

			const [parseErr, data] = await to(resp.json());

			if (parseErr) {
				console.error("Failed to parse getCouponProducts response", parseErr);
				throw new Error("Failed to parse getCouponProducts response");
			}

			const coupons = data
				.map((item: CleanedCovaProduct) => {
					return {
						code:
							item.ProductSpecifications.find(
								(spec) => spec.DisplayName === "Coupon - Code"
							)?.Value || "",
						type:
							item.ProductSpecifications.find(
								(spec) => spec.DisplayName === "Coupon - Type"
							)?.Value || "",
						value:
							item.ProductSpecifications.find(
								(spec) => spec.DisplayName === "Coupon - Amount"
							)?.Value || "",
					};
				})
				.filter((coupon: Coupon | undefined): coupon is Coupon => !!coupon);
			return coupons;
		},
	});

	if (!cart || (cart.items?.length === 1 && isPromotionItem(cart.items[0].product)))
		return null;

	if (isError) {
		console.error("Failed to fetch coupon products:", error);
		return null;
	}

	if (!isSuccess || !isCustomerSuccess)
		return <Skeleton height={40} variant="text" />;

	const validateCouponForm = (values: IDiscountFormValues) => {
		const errors: Partial<Record<keyof IDiscountFormValues, string>> = {};

		if (!values.code) {
			errors.code = "Required";
			return errors;
		}

		const valueCode = values.code.trim().toLowerCase();
		const validCode = coupons.some(
			(coupon) => coupon.code.toLowerCase() === valueCode
		);
		if (!validCode) {
			errors.code = "Invalid coupon code";
			return errors;
		}

		if (customer?.ReferralSource) {
			const usedCoupons = customer?.ReferralSource?.split(",").map((code) =>
				code.trim().toLowerCase()
			);

			if (usedCoupons.includes(valueCode)) {
				errors.code = "Coupon code has already been used";
				return errors;
			}
		}

		return errors;
	};

	const onSubmit = (
		values: IDiscountFormValues,
		{ setSubmitting, setErrors }: FormikHelpers<IDiscountFormValues>
	) => {
		if (!order || !total || !cart || !cart.items) return;
		const code = values.code.trim();
		const coupon = coupons.find(
			(cpn) => cpn.code.toLowerCase() === code.toLowerCase()
		);
		if (!coupon) {
			setErrors({ code: "Invalid coupon code" });
			setSubmitting(false);
			return;
		}
		const cartPromoItems = cartPromotionItems(cart);
		let discount =
			coupon.type === "Percent"
				? Number(total.itemsSubTotal.price) * (Number(coupon.value) / 100)
				: Number(coupon.value);

		const cartPromoItemsSubtotal = cartPromoItems.reduce(
			(accumulator, currentValue) => accumulator + Number(currentValue.total),
			0
		);
		const subTotalWithoutPromoItems =
			Number(total.itemsSubTotal.price) - cartPromoItemsSubtotal;
		if (cartPromoItems.length > 0 && coupon.type === "Percent") {
			discount = subTotalWithoutPromoItems * (Number(coupon.value) / 100);
		}
		const discountValue = subTotalWithoutPromoItems < discount ? subTotalWithoutPromoItems : discount;

		const promise = Promise.resolve()
			.then(async () => {
				const discountedCartItems = cart.items!.map((item) => {
					if (isPromotionItem(item.product)) {
						return {
							...item,
						};
					}
					const product = item.product;
					const finalPrice = covaProductPrice(product);
					const roundedPrice = Number.parseFloat(Number(finalPrice).toFixed(2));
					let lineDollarAmount = roundedPrice * item.qty;
					if (discount > 0) {
						const originalLineDollarAmount = lineDollarAmount;
						if (originalLineDollarAmount < discount) {
							lineDollarAmount = 0;
							discount = discount - originalLineDollarAmount;
						} else {
							lineDollarAmount -= discount;
							discount = 0;
						}
					}
					return {
						...item,
						product: {
							...item.product,
							couponPrice: (lineDollarAmount / item.qty).toFixed(2),
						},
						total:
							lineDollarAmount > 0 ? Number(lineDollarAmount.toFixed(2)) : 0,
					};
				});

				const newSubTotal = discountedCartItems.reduce(
					(acc, item) => acc + Number(item.total || 0),
					0
				);
				const shippingTaxes = total.tax.shipping?.shippingTaxes;
				const newOrderTaxes = await getOrderTaxes(discountedCartItems);
				const totalOrderTaxes = (
					Number(newOrderTaxes) + Number(shippingTaxes ?? 0)
				).toString();

				setCart({
					...cart,
					total: {
						...cart.total,
						total: newSubTotal.toString(),
					},
					taxAmount: Number(totalOrderTaxes),
					items: discountedCartItems,
				});

				const totalOrderPrice = (
					Number(newSubTotal) + Number(totalOrderTaxes)
				).toFixed(2);

				const updatedOrder = {
					...order,
					discounts: [
						{
							discount_id: coupon.code,
							title: `Coupon: ${coupon.code}`,
							discount_type: coupon.type === "Percent" ? "percent" : "fixed",
							value: coupon.value,
						},
					],
					discount_for_order: discountValue,
					total_price: totalOrderPrice,
					tax_amount: totalOrderTaxes,
					tax_calculations: {
						...order.tax_calculations,
						price: totalOrderTaxes,
						itemsSubTotal: {
							...order.tax_calculations?.itemsSubTotal,
							price: newSubTotal,
						},
						discount: discountValue.toString(),
						tax: {
							...order.tax_calculations?.tax,
							totalTaxAmount: totalOrderTaxes,
						},
					} as unknown as ITotal,
					custom_attrs: {
						...order.custom_attrs,
						originalCart: cart,
						originalSubTotalPrice: total.itemsSubTotal.price,
					},
				} as unknown as IOrderWithCustmAttr;

				if (total) {
					const updatedTotal = {
						...total,
						price: totalOrderPrice,
						itemsSubTotal: {
							...total.itemsSubTotal,
							price: newSubTotal.toString(),
						},
						discount: discountValue.toString(),
						tax: {
							...total.tax,
							totalTaxAmount: totalOrderTaxes,
						},
					};

					setLocalStorageCheckoutData({
						order: updatedOrder,
						total: updatedTotal,
					});

					dispatch(setOrder(updatedOrder));
					dispatch(setTotal(updatedTotal));
				}
			})
			.catch(({ response: { data } }) => {
				setErrors(apiErrors2Formik(data));
			})
			.finally(() => setSubmitting(false));

		dispatch(addPromise(promise));
	};

	return (
		<Formik
			initialValues={{ code: "" }}
			onSubmit={onSubmit}
			validate={validateCouponForm}
			validateOnChange={false}
		>
			{(formikProps) => {
				const { helperText, error, ...restProps } =
					fieldAttrs<IDiscountFormValues>("code", formikProps);
				return (
					<Form className={"bdl-cart__discount-form"}>
						<FormControl fullWidth variant="standard" error={error} required>
							<InputLabel color="success" htmlFor="code">
								{t("cart.discountForm.code")}
							</InputLabel>
							<Input
								disabled={!isSuccess}
								id="code"
								type={"text"}
								fullWidth
								endAdornment={
									<InputAdornment position="end">
										<Button
											type="submit"
											disabled={formikProps.isSubmitting}
											color="success"
										>
											{t("cart.discountForm.apply")}
										</Button>
									</InputAdornment>
								}
								{...restProps}
							/>
							<FormHelperText id="discount-form-helper-text">
								{helperText || ""}
							</FormHelperText>
						</FormControl>
					</Form>
				);
			}}
		</Formik>
	);
}

export interface IDiscountFormValues {
	code: string;
}

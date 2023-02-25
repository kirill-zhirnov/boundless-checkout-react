import {useAppSelector} from './redux';
import {useCallback} from 'react';
import currency, {Options} from 'currency.js';

export default function useFormatCurrency() {
	const localeSettings = useAppSelector(state => state.app.localeSettings);

	const formatCurrency = useCallback((amount: number|string) => {
		const currencyOptions: Options = {};
		if (localeSettings) {
			const {format, precision, symbol, decimal} = localeSettings.money;
			let pattern = format.replace('%v', '#');
			pattern = pattern.replace('%s', '!');

			Object.assign(currencyOptions, {
				precision,
				symbol,
				decimal,
				pattern
			});
		}

		return currency(amount, currencyOptions).format();
	}, [localeSettings]);

	return {formatCurrency};
}
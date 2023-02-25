import currency from 'currency.js';

export function formatMoney(amount: number|string|null): string {
	if (!amount) return '';

	return currency(amount).format();
}

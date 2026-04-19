// File: src/utils/currencies.js

export const CURRENCIES = [
    { code: 'INR', symbol: '₹', name: 'Indian Rupee' },
    { code: 'USD', symbol: '$', name: 'US Dollar' },
    { code: 'EUR', symbol: '€', name: 'Euro' },
    { code: 'GBP', symbol: '£', name: 'British Pound' },
    { code: 'JPY', symbol: '¥', name: 'Japanese Yen' },
    { code: 'CNY', symbol: '¥', name: 'Chinese Yuan' },
    { code: 'AUD', symbol: 'A$', name: 'Australian Dollar' },
    { code: 'CAD', symbol: 'C$', name: 'Canadian Dollar' },
    { code: 'SGD', symbol: 'S$', name: 'Singapore Dollar' },
    { code: 'AED', symbol: 'د.إ', name: 'UAE Dirham' },
    { code: 'SAR', symbol: '﷼', name: 'Saudi Riyal' },
    { code: 'BRL', symbol: 'R$', name: 'Brazilian Real' },
    { code: 'KRW', symbol: '₩', name: 'South Korean Won' },
    { code: 'THB', symbol: '฿', name: 'Thai Baht' },
    { code: 'MYR', symbol: 'RM', name: 'Malaysian Ringgit' },
];

export const DEFAULT_CURRENCY = CURRENCIES[0]; // INR

export const getCurrencyByCode = (code) => {
    return CURRENCIES.find((c) => c.code === code) || DEFAULT_CURRENCY;
};

/**
 * Format a number with currency-appropriate grouping.
 * INR uses Indian grouping (3,2,2 → 1,00,000).
 * All other currencies use Western grouping (3,3,3 → 100,000).
 * @param {number} amount
 * @param {string} currencyCode - e.g. 'INR', 'USD'
 * @param {{ minimumFractionDigits?: number, maximumFractionDigits?: number }} [opts]
 */
export const formatAmount = (amount, currencyCode, opts = {}) => {
    const locale = currencyCode === 'INR' ? 'en-IN' : 'en-US';
    const { minimumFractionDigits = 0, maximumFractionDigits = 0 } = opts;
    return amount.toLocaleString(locale, { minimumFractionDigits, maximumFractionDigits });
};

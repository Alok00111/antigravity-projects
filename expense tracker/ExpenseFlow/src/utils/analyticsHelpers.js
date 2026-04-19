// File: src/utils/analyticsHelpers.js

import { TRANSACTION_TYPES } from './constants';
import { getCategoryById } from './categories';

/**
 * Get spending breakdown by category
 * Returns sorted array: [{ categoryId, label, icon, color, amount, percentage }]
 */
export const getCategoryBreakdown = (transactions, type = TRANSACTION_TYPES.EXPENSE) => {
    const filtered = transactions.filter((t) => t.type === type);
    const total = filtered.reduce((sum, t) => sum + t.amount, 0);

    if (total === 0) return [];

    const grouped = {};
    filtered.forEach((t) => {
        if (!grouped[t.category]) {
            grouped[t.category] = 0;
        }
        grouped[t.category] += t.amount;
    });

    return Object.entries(grouped)
        .map(([categoryId, amount]) => {
            const cat = getCategoryById(categoryId);
            return {
                categoryId,
                label: cat?.label || 'Unknown',
                icon: cat?.icon || 'help-circle-outline',
                color: cat?.color || '#71717A',
                amount,
                percentage: Math.round((amount / total) * 100),
            };
        })
        .sort((a, b) => b.amount - a.amount);
};

/**
 * Get monthly totals for the last N months
 * Returns: [{ month: "Jan", year: 2026, income, expense, monthIndex }]
 */
export const getMonthlyTotals = (transactions, monthsBack = 6) => {
    const now = new Date();
    const results = [];

    for (let i = monthsBack - 1; i >= 0; i--) {
        const targetDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const monthStart = new Date(targetDate.getFullYear(), targetDate.getMonth(), 1);
        const monthEnd = new Date(targetDate.getFullYear(), targetDate.getMonth() + 1, 0, 23, 59, 59, 999);

        const monthTxns = transactions.filter((t) => {
            const d = new Date(t.date);
            return d >= monthStart && d <= monthEnd;
        });

        const MONTHS_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

        results.push({
            month: MONTHS_SHORT[targetDate.getMonth()],
            year: targetDate.getFullYear(),
            monthIndex: targetDate.getMonth(),
            income: monthTxns
                .filter((t) => t.type === TRANSACTION_TYPES.INCOME)
                .reduce((sum, t) => sum + t.amount, 0),
            expense: monthTxns
                .filter((t) => t.type === TRANSACTION_TYPES.EXPENSE)
                .reduce((sum, t) => sum + t.amount, 0),
        });
    }

    return results;
};

/**
 * Get top N spending categories
 */
export const getTopCategories = (transactions, n = 5) => {
    return getCategoryBreakdown(transactions, TRANSACTION_TYPES.EXPENSE).slice(0, n);
};

/**
 * Get total for a transaction type
 */
export const getTotalByType = (transactions, type) => {
    return transactions
        .filter((t) => t.type === type)
        .reduce((sum, t) => sum + t.amount, 0);
};

// File: src/utils/trendHelpers.js
// Utility functions for trend comparison analysis

import { TRANSACTION_TYPES } from './constants';

/**
 * Get the start and end dates of a month.
 * @param {number} offset - 0 = current month, -1 = previous month, etc.
 */
export const getMonthBounds = (offset = 0) => {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth() + offset, 1);
    const end = new Date(now.getFullYear(), now.getMonth() + offset + 1, 0, 23, 59, 59, 999);
    return { start, end };
};

/**
 * Get the short month label for a given offset.
 */
export const getMonthLabel = (offset = 0) => {
    const { start } = getMonthBounds(offset);
    return start.toLocaleString('default', { month: 'short' });
};

/**
 * Compute monthly spending totals for the last N months.
 * Returns array of { month, label, income, expense, balance }
 */
export const getMonthlyTotals = (transactions, monthCount = 6) => {
    const result = [];

    for (let i = 0; i < monthCount; i++) {
        const offset = -i;
        const { start, end } = getMonthBounds(offset);

        const monthTxns = transactions.filter((t) => {
            const d = new Date(t.date);
            return d >= start && d <= end;
        });

        const income = monthTxns
            .filter((t) => t.type === TRANSACTION_TYPES.INCOME)
            .reduce((sum, t) => sum + t.amount, 0);

        const expense = monthTxns
            .filter((t) => t.type === TRANSACTION_TYPES.EXPENSE)
            .reduce((sum, t) => sum + t.amount, 0);

        result.push({
            month: start.toISOString(),
            label: getMonthLabel(offset),
            income,
            expense,
            balance: income - expense,
        });
    }

    return result.reverse(); // oldest first
};

/**
 * Calculate spending trend — percentage change between current and previous month.
 * Returns { change, percentage, direction: 'up' | 'down' | 'flat' }
 */
export const getSpendingTrend = (transactions) => {
    const current = getMonthBounds(0);
    const previous = getMonthBounds(-1);

    const currentExpense = transactions
        .filter((t) => t.type === TRANSACTION_TYPES.EXPENSE && new Date(t.date) >= current.start && new Date(t.date) <= current.end)
        .reduce((sum, t) => sum + t.amount, 0);

    const previousExpense = transactions
        .filter((t) => t.type === TRANSACTION_TYPES.EXPENSE && new Date(t.date) >= previous.start && new Date(t.date) <= previous.end)
        .reduce((sum, t) => sum + t.amount, 0);

    if (previousExpense === 0) {
        return { change: currentExpense, percentage: 0, direction: 'flat', currentExpense, previousExpense };
    }

    const change = currentExpense - previousExpense;
    const percentage = ((change / previousExpense) * 100).toFixed(1);
    const direction = change > 0 ? 'up' : change < 0 ? 'down' : 'flat';

    return { change, percentage: Math.abs(percentage), direction, currentExpense, previousExpense };
};

/**
 * Get top spending categories with month-over-month changes.
 */
export const getCategoryTrends = (transactions, limit = 5) => {
    const current = getMonthBounds(0);
    const previous = getMonthBounds(-1);

    // Current month by category
    const currentByCat = {};
    transactions
        .filter((t) => t.type === TRANSACTION_TYPES.EXPENSE && new Date(t.date) >= current.start && new Date(t.date) <= current.end)
        .forEach((t) => {
            // Handle split transactions
            if (t.splits && t.splits.length > 0) {
                t.splits.forEach((s) => {
                    currentByCat[s.category] = (currentByCat[s.category] || 0) + s.amount;
                });
            } else {
                currentByCat[t.category] = (currentByCat[t.category] || 0) + t.amount;
            }
        });

    // Previous month by category
    const prevByCat = {};
    transactions
        .filter((t) => t.type === TRANSACTION_TYPES.EXPENSE && new Date(t.date) >= previous.start && new Date(t.date) <= previous.end)
        .forEach((t) => {
            if (t.splits && t.splits.length > 0) {
                t.splits.forEach((s) => {
                    prevByCat[s.category] = (prevByCat[s.category] || 0) + s.amount;
                });
            } else {
                prevByCat[t.category] = (prevByCat[t.category] || 0) + t.amount;
            }
        });

    // Build trend data
    const allCats = new Set([...Object.keys(currentByCat), ...Object.keys(prevByCat)]);
    const trends = [];

    allCats.forEach((catId) => {
        const curr = currentByCat[catId] || 0;
        const prev = prevByCat[catId] || 0;
        const change = curr - prev;
        const pct = prev > 0 ? ((change / prev) * 100).toFixed(1) : (curr > 0 ? 100 : 0);
        trends.push({ categoryId: catId, current: curr, previous: prev, change, percentage: pct });
    });

    // Sort by current month spending descending
    trends.sort((a, b) => b.current - a.current);
    return trends.slice(0, limit);
};

/**
 * Get daily spending totals for the last N days.
 * Returns array of { day (1-indexed), label ('Mon', 'Tue'...), amount, dateStr }
 */
export const getDailySpending = (transactions, dayCount = 30) => {
    const today = new Date();
    today.setHours(23, 59, 59, 999);

    const result = [];

    for (let i = dayCount - 1; i >= 0; i--) {
        const dayDate = new Date(today);
        dayDate.setDate(today.getDate() - i);
        const dayStart = new Date(dayDate.getFullYear(), dayDate.getMonth(), dayDate.getDate(), 0, 0, 0, 0);
        const dayEnd = new Date(dayDate.getFullYear(), dayDate.getMonth(), dayDate.getDate(), 23, 59, 59, 999);

        const dayTotal = transactions
            .filter((t) => t.type === TRANSACTION_TYPES.EXPENSE && new Date(t.date) >= dayStart && new Date(t.date) <= dayEnd)
            .reduce((sum, t) => sum + t.amount, 0);

        const dayLabel = dayDate.toLocaleString('default', { weekday: 'short' });
        const dateLabel = `${dayDate.getDate()}/${dayDate.getMonth() + 1}`;

        result.push({
            day: dayDate.getDate(),
            label: dayLabel,
            dateStr: dateLabel,
            amount: dayTotal,
        });
    }

    return result;
};

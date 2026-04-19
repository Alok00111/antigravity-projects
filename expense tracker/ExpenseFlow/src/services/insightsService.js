// File: src/services/insightsService.js
// Analyzes transaction data and generates smart spending insights

import { TRANSACTION_TYPES } from '../utils/constants';
import { getCategoryById } from '../utils/categories';

/**
 * Generate smart insights from transaction data.
 * @param {Array} transactions - All transactions
 * @param {string} currencyCode - Active currency code
 * @returns {Array<{ id, icon, text, type, color }>}
 */
export const generateInsights = (transactions, currencyCode) => {
    if (!transactions || transactions.length === 0) return [];

    const now = new Date();
    const thisMonth = now.getMonth();
    const thisYear = now.getFullYear();
    const lastMonth = thisMonth === 0 ? 11 : thisMonth - 1;
    const lastYear = thisMonth === 0 ? thisYear - 1 : thisYear;

    const expenses = transactions.filter((t) => t.type === TRANSACTION_TYPES.EXPENSE);

    const thisMonthTxns = expenses.filter((t) => {
        const d = new Date(t.date);
        return d.getMonth() === thisMonth && d.getFullYear() === thisYear;
    });

    const lastMonthTxns = expenses.filter((t) => {
        const d = new Date(t.date);
        return d.getMonth() === lastMonth && d.getFullYear() === lastYear;
    });

    const thisMonthIncome = transactions
        .filter((t) => t.type === TRANSACTION_TYPES.INCOME)
        .filter((t) => {
            const d = new Date(t.date);
            return d.getMonth() === thisMonth && d.getFullYear() === thisYear;
        })
        .reduce((s, t) => s + t.amount, 0);

    const lastMonthIncome = transactions
        .filter((t) => t.type === TRANSACTION_TYPES.INCOME)
        .filter((t) => {
            const d = new Date(t.date);
            return d.getMonth() === lastMonth && d.getFullYear() === lastYear;
        })
        .reduce((s, t) => s + t.amount, 0);

    const thisMonthTotal = thisMonthTxns.reduce((s, t) => s + t.amount, 0);
    const lastMonthTotal = lastMonthTxns.reduce((s, t) => s + t.amount, 0);

    const insights = [];

    // ── 1. Category comparison (this month vs last month) ──
    const thisMonthByCat = groupByCategory(thisMonthTxns);
    const lastMonthByCat = groupByCategory(lastMonthTxns);

    const allCats = new Set([...Object.keys(thisMonthByCat), ...Object.keys(lastMonthByCat)]);
    let biggestIncrease = { catId: null, pct: 0, amount: 0 };
    let biggestDecrease = { catId: null, pct: 0, amount: 0 };

    for (const catId of allCats) {
        const thisAmt = thisMonthByCat[catId] || 0;
        const lastAmt = lastMonthByCat[catId] || 0;
        if (lastAmt === 0 || thisAmt === 0) continue;

        const pctChange = ((thisAmt - lastAmt) / lastAmt) * 100;

        if (pctChange > 20 && pctChange > biggestIncrease.pct) {
            biggestIncrease = { catId, pct: pctChange, amount: thisAmt };
        }
        if (pctChange < -20 && pctChange < biggestDecrease.pct) {
            biggestDecrease = { catId, pct: pctChange, amount: thisAmt };
        }
    }

    if (biggestIncrease.catId) {
        const cat = getCategoryById(biggestIncrease.catId);
        const label = cat?.label || biggestIncrease.catId;
        insights.push({
            id: 'cat_increase',
            icon: 'trending-up',
            text: `${label} spending up ${Math.round(biggestIncrease.pct)}% vs last month`,
            type: 'warning',
            color: '#F59E0B',
        });
    }

    if (biggestDecrease.catId) {
        const cat = getCategoryById(biggestDecrease.catId);
        const label = cat?.label || biggestDecrease.catId;
        insights.push({
            id: 'cat_decrease',
            icon: 'trending-down',
            text: `${label} spending down ${Math.abs(Math.round(biggestDecrease.pct))}% — nice!`,
            type: 'success',
            color: '#10B981',
        });
    }

    // ── 2. Top spending day of week ──
    if (expenses.length >= 14) {
        const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        const dayTotals = [0, 0, 0, 0, 0, 0, 0];
        const dayCounts = [0, 0, 0, 0, 0, 0, 0];

        expenses.forEach((t) => {
            const day = new Date(t.date).getDay();
            dayTotals[day] += t.amount;
            dayCounts[day]++;
        });

        const dayAvgs = dayTotals.map((total, i) => (dayCounts[i] > 0 ? total / dayCounts[i] : 0));
        const peakDay = dayAvgs.indexOf(Math.max(...dayAvgs));

        if (dayAvgs[peakDay] > 0) {
            insights.push({
                id: 'peak_day',
                icon: 'calendar',
                text: `${dayNames[peakDay]}s are your biggest spending day`,
                type: 'info',
                color: '#3B82F6',
            });
        }
    }

    // ── 3. Savings comparison ──
    const thisSavings = thisMonthIncome - thisMonthTotal;
    const lastSavings = lastMonthIncome - lastMonthTotal;

    if (lastMonthTotal > 0 && thisMonthIncome > 0) {
        if (thisSavings > lastSavings && thisSavings > 0) {
            const diff = thisSavings - lastSavings;
            insights.push({
                id: 'savings_up',
                icon: 'rocket',
                text: `Saving more than last month — keep it up! 🎉`,
                type: 'success',
                color: '#10B981',
            });
        } else if (thisSavings < lastSavings && lastSavings > 0) {
            insights.push({
                id: 'savings_down',
                icon: 'alert-circle',
                text: `Savings are lower than last month — watch your spending`,
                type: 'warning',
                color: '#F59E0B',
            });
        }
    }

    // ── 4. Biggest transaction this month ──
    if (thisMonthTxns.length > 0) {
        const biggest = thisMonthTxns.reduce((max, t) => (t.amount > max.amount ? t : max), thisMonthTxns[0]);
        const cat = getCategoryById(biggest.category);
        const label = cat?.label || 'expense';
        if (biggest.amount > thisMonthTotal * 0.25 && thisMonthTxns.length > 3) {
            insights.push({
                id: 'biggest_txn',
                icon: 'flash',
                text: `Your biggest ${label} transaction was ${Math.round((biggest.amount / thisMonthTotal) * 100)}% of this month's spending`,
                type: 'info',
                color: '#8B5CF6',
            });
        }
    }

    // ── 5. Spending streak (days under average) ──
    if (thisMonthTxns.length > 5) {
        const dayOfMonth = now.getDate();
        const dailyAvg = thisMonthTotal / dayOfMonth;
        let streak = 0;

        for (let d = dayOfMonth; d >= 1; d--) {
            const dayDate = new Date(thisYear, thisMonth, d);
            const dayTotal = thisMonthTxns
                .filter((t) => new Date(t.date).getDate() === d)
                .reduce((s, t) => s + t.amount, 0);

            if (dayTotal <= dailyAvg) {
                streak++;
            } else {
                break;
            }
        }

        if (streak >= 3) {
            insights.push({
                id: 'streak',
                icon: 'flame',
                text: `${streak}-day streak spending under your daily average! 🔥`,
                type: 'success',
                color: '#EF4444',
            });
        }
    }

    // ── 6. Overall month comparison ──
    if (lastMonthTotal > 0 && thisMonthTotal > 0) {
        const pctChange = ((thisMonthTotal - lastMonthTotal) / lastMonthTotal) * 100;
        if (Math.abs(pctChange) > 10) {
            const direction = pctChange > 0 ? 'more' : 'less';
            insights.push({
                id: 'month_compare',
                icon: pctChange > 0 ? 'arrow-up-circle' : 'arrow-down-circle',
                text: `Spending ${Math.abs(Math.round(pctChange))}% ${direction} than last month overall`,
                type: pctChange > 0 ? 'warning' : 'success',
                color: pctChange > 0 ? '#F59E0B' : '#10B981',
            });
        }
    }

    // Prioritize: success & warning first, then info
    const priority = { success: 0, warning: 1, info: 2 };
    insights.sort((a, b) => (priority[a.type] || 2) - (priority[b.type] || 2));

    return insights.slice(0, 5); // Max 5 insights
};

/**
 * Group transactions by category and sum amounts.
 */
const groupByCategory = (transactions) => {
    const result = {};
    transactions.forEach((t) => {
        const cat = t.category || 'other';
        result[cat] = (result[cat] || 0) + t.amount;
    });
    return result;
};

export default { generateInsights };

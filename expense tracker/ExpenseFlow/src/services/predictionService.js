// File: src/services/predictionService.js
// ML-lite budget prediction using exponential smoothing + trend detection

import { TRANSACTION_TYPES } from '../utils/constants';
import { getCategoryById, EXPENSE_CATEGORIES } from '../utils/categories';

/**
 * Generate budget predictions per category for next month.
 * @param {Array} transactions - All transactions
 * @returns {Array<{ categoryId, categoryLabel, categoryColor, predicted, recommended, confidence, trend }>}
 */
export const generatePredictions = (transactions) => {
    if (!transactions || transactions.length === 0) return [];

    const expenses = transactions.filter((t) => t.type === TRANSACTION_TYPES.EXPENSE);
    if (expenses.length === 0) return [];

    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    // Get last 6 months of data grouped by category then by month
    const monthlyByCategory = {};

    for (let i = 1; i <= 6; i++) {
        const m = new Date(currentYear, currentMonth - i, 1);
        const month = m.getMonth();
        const year = m.getFullYear();
        const key = `${year}-${month}`;

        expenses.forEach((t) => {
            const d = new Date(t.date);
            if (d.getMonth() === month && d.getFullYear() === year) {
                const cat = t.category || 'other';
                if (!monthlyByCategory[cat]) monthlyByCategory[cat] = {};
                monthlyByCategory[cat][key] = (monthlyByCategory[cat][key] || 0) + t.amount;
            }
        });
    }

    const predictions = [];

    for (const [catId, monthData] of Object.entries(monthlyByCategory)) {
        const values = [];

        // Get values in chronological order (oldest first)
        for (let i = 6; i >= 1; i--) {
            const m = new Date(currentYear, currentMonth - i, 1);
            const key = `${m.getFullYear()}-${m.getMonth()}`;
            values.push(monthData[key] || 0);
        }

        // Need at least 2 months of data
        const nonZero = values.filter((v) => v > 0);
        if (nonZero.length < 2) continue;

        // Exponential moving average (alpha = 0.4 — weights recent months more)
        const alpha = 0.4;
        let ema = nonZero[0];
        for (let i = 1; i < nonZero.length; i++) {
            ema = alpha * nonZero[i] + (1 - alpha) * ema;
        }

        // Linear trend: simple slope from first to last non-zero
        const first = nonZero[0];
        const last = nonZero[nonZero.length - 1];
        const trend = last > first * 1.1 ? 'up' : last < first * 0.9 ? 'down' : 'stable';

        // Predicted amount: EMA adjusted by trend
        let predicted = ema;
        if (trend === 'up') predicted *= 1.05;
        if (trend === 'down') predicted *= 0.95;
        predicted = Math.round(predicted * 100) / 100;

        // Recommended budget: prediction + 10% buffer
        const recommended = Math.round(predicted * 1.1);

        // Confidence based on coefficient of variation
        const mean = nonZero.reduce((s, v) => s + v, 0) / nonZero.length;
        const variance = nonZero.reduce((s, v) => s + Math.pow(v - mean, 2), 0) / nonZero.length;
        const cv = mean > 0 ? Math.sqrt(variance) / mean : 1;
        const confidence = cv < 0.2 ? 'High' : cv < 0.5 ? 'Medium' : 'Low';

        const cat = getCategoryById(catId);

        predictions.push({
            categoryId: catId,
            categoryLabel: cat?.label || catId,
            categoryColor: cat?.color || '#71717A',
            categoryIcon: cat?.icon || 'ellipsis-horizontal-circle-outline',
            predicted,
            recommended,
            confidence,
            trend,
            monthsOfData: nonZero.length,
        });
    }

    // Sort by predicted amount descending (highest spend first)
    predictions.sort((a, b) => b.predicted - a.predicted);

    return predictions;
};

export default { generatePredictions };

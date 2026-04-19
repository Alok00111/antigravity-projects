// File: src/services/currencyConversionService.js

import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_KEYS } from '../utils/constants';

const API_BASE = 'https://open.er-api.com/v6/latest';

/**
 * Fetch the exchange rate from one currency to another.
 * Uses the free ExchangeRate-API (no key required, daily updates).
 * @param {string} fromCode - Source currency code (e.g. 'USD')
 * @param {string} toCode   - Target currency code (e.g. 'INR')
 * @returns {Promise<{ rate: number, timestamp: string } | null>}
 */
export const fetchExchangeRate = async (fromCode, toCode) => {
    try {
        const response = await fetch(`${API_BASE}/${fromCode}`);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);

        const data = await response.json();
        if (data.result !== 'success') throw new Error('API returned failure');

        const rate = data.rates?.[toCode];
        if (!rate) throw new Error(`Rate not found for ${toCode}`);

        return {
            rate,
            timestamp: data.time_last_update_utc || new Date().toISOString(),
        };
    } catch (error) {
        console.error('Error fetching exchange rate:', error);
        return null;
    }
};

/**
 * Round a number to 2 decimal places.
 */
const round2 = (n) => Math.round(n * 100) / 100;

/**
 * Convert all monetary data in AsyncStorage from one currency to another.
 * Multiplies every stored amount by the given rate.
 *
 * Data stores converted:
 *   - Transactions  → amount, splits[].amount
 *   - Budgets       → each category limit
 *   - Savings Goals → savedAmount, targetAmount
 *   - Accounts      → balance
 *
 * @param {number} rate - Conversion multiplier (e.g. 90.77 for USD→INR)
 * @returns {Promise<{ success: boolean, counts: object }>}
 */
export const convertAllData = async (rate) => {
    const counts = { transactions: 0, budgets: 0, savingsGoals: 0, accounts: 0 };

    try {
        // ── Transactions ──────────────────────────────────────────
        const txnRaw = await AsyncStorage.getItem(STORAGE_KEYS.TRANSACTIONS);
        if (txnRaw) {
            const transactions = JSON.parse(txnRaw);
            const converted = transactions.map((t) => {
                const updated = { ...t, amount: round2(t.amount * rate) };
                if (Array.isArray(t.splits)) {
                    updated.splits = t.splits.map((s) => ({
                        ...s,
                        amount: round2(s.amount * rate),
                    }));
                }
                return updated;
            });
            await AsyncStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(converted));
            counts.transactions = converted.length;
        }

        // ── Budgets ───────────────────────────────────────────────
        const budgetRaw = await AsyncStorage.getItem(STORAGE_KEYS.BUDGETS);
        if (budgetRaw) {
            const budgets = JSON.parse(budgetRaw);
            const converted = {};
            for (const [catId, limit] of Object.entries(budgets)) {
                converted[catId] = round2(limit * rate);
                counts.budgets++;
            }
            await AsyncStorage.setItem(STORAGE_KEYS.BUDGETS, JSON.stringify(converted));
        }

        // ── Savings Goals ─────────────────────────────────────────
        const goalsRaw = await AsyncStorage.getItem(STORAGE_KEYS.SAVINGS_GOALS);
        if (goalsRaw) {
            const goals = JSON.parse(goalsRaw);
            const converted = goals.map((g) => ({
                ...g,
                savedAmount: round2(g.savedAmount * rate),
                targetAmount: round2(g.targetAmount * rate),
            }));
            await AsyncStorage.setItem(STORAGE_KEYS.SAVINGS_GOALS, JSON.stringify(converted));
            counts.savingsGoals = converted.length;
        }

        // ── Accounts ──────────────────────────────────────────────
        const acctRaw = await AsyncStorage.getItem(STORAGE_KEYS.ACCOUNTS);
        if (acctRaw) {
            const accounts = JSON.parse(acctRaw);
            const converted = accounts.map((a) => ({
                ...a,
                balance: round2((a.balance || 0) * rate),
            }));
            await AsyncStorage.setItem(STORAGE_KEYS.ACCOUNTS, JSON.stringify(converted));
            counts.accounts = converted.length;
        }

        // ── Recurring Rules ───────────────────────────────────────
        const recurRaw = await AsyncStorage.getItem(STORAGE_KEYS.RECURRING_RULES);
        if (recurRaw) {
            const rules = JSON.parse(recurRaw);
            const converted = rules.map((r) => ({
                ...r,
                amount: round2(r.amount * rate),
            }));
            await AsyncStorage.setItem(STORAGE_KEYS.RECURRING_RULES, JSON.stringify(converted));
        }

        return { success: true, counts };
    } catch (error) {
        console.error('Error converting data:', error);
        return { success: false, counts };
    }
};

export default {
    fetchExchangeRate,
    convertAllData,
};

// File: src/services/debtService.js
// CRUD operations for debt/loan tracking

import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_KEYS } from '../utils/constants';

const getDebts = async () => {
    try {
        const data = await AsyncStorage.getItem(STORAGE_KEYS.DEBTS);
        return data ? JSON.parse(data) : [];
    } catch (e) {
        console.error('Error loading debts:', e);
        return [];
    }
};

const saveDebts = async (debts) => {
    try {
        await AsyncStorage.setItem(STORAGE_KEYS.DEBTS, JSON.stringify(debts));
        return true;
    } catch (e) {
        console.error('Error saving debts:', e);
        return false;
    }
};

const addDebt = async (debt) => {
    const debts = await getDebts();
    const newDebt = {
        ...debt,
        id: Date.now().toString(),
        date: new Date().toISOString(),
        settled: false,
        settledDate: null,
        partialPayments: [],
    };
    debts.push(newDebt);
    await saveDebts(debts);
    return debts;
};

const updateDebt = async (id, updates) => {
    const debts = await getDebts();
    const updated = debts.map((d) => (d.id === id ? { ...d, ...updates } : d));
    await saveDebts(updated);
    return updated;
};

const deleteDebt = async (id) => {
    const debts = await getDebts();
    const filtered = debts.filter((d) => d.id !== id);
    await saveDebts(filtered);
    return filtered;
};

const addPayment = async (debtId, payment) => {
    const debts = await getDebts();
    const updated = debts.map((d) => {
        if (d.id === debtId) {
            const payments = [...(d.partialPayments || []), {
                amount: payment.amount,
                date: new Date().toISOString(),
                note: payment.note || '',
            }];
            const totalPaid = payments.reduce((s, p) => s + p.amount, 0);
            return {
                ...d,
                partialPayments: payments,
                settled: totalPaid >= d.amount,
                settledDate: totalPaid >= d.amount ? new Date().toISOString() : null,
            };
        }
        return d;
    });
    await saveDebts(updated);
    return updated;
};

const settleDebt = async (id) => {
    return updateDebt(id, { settled: true, settledDate: new Date().toISOString() });
};

const getTotals = (debts) => {
    const active = debts.filter((d) => !d.settled);
    const lent = active.filter((d) => d.type === 'lent');
    const borrowed = active.filter((d) => d.type === 'borrowed');

    const getPaid = (d) => (d.partialPayments || []).reduce((s, p) => s + p.amount, 0);

    return {
        totalLent: lent.reduce((s, d) => s + d.amount - getPaid(d), 0),
        totalBorrowed: borrowed.reduce((s, d) => s + d.amount - getPaid(d), 0),
        lentCount: lent.length,
        borrowedCount: borrowed.length,
    };
};

export default {
    getDebts,
    addDebt,
    updateDebt,
    deleteDebt,
    addPayment,
    settleDebt,
    getTotals,
};

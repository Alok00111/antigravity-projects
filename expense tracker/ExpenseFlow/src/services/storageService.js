// File: src/services/storageService.js

import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_KEYS } from '../utils/constants';

const getTransactions = async () => {
    try {
        const data = await AsyncStorage.getItem(STORAGE_KEYS.TRANSACTIONS);
        return data ? JSON.parse(data) : [];
    } catch (error) {
        console.error('Error loading transactions:', error);
        return [];
    }
};

const saveTransaction = async (transaction) => {
    try {
        const existing = await getTransactions();
        const updated = [transaction, ...existing];
        await AsyncStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(updated));
        return true;
    } catch (error) {
        console.error('Error saving transaction:', error);
        return false;
    }
};

const deleteTransaction = async (id) => {
    try {
        const existing = await getTransactions();
        const updated = existing.filter((item) => item.id !== id);
        await AsyncStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(updated));
        return true;
    } catch (error) {
        console.error('Error deleting transaction:', error);
        return false;
    }
};

const updateTransaction = async (updatedTransaction) => {
    try {
        const existing = await getTransactions();
        const updated = existing.map((item) =>
            item.id === updatedTransaction.id ? { ...item, ...updatedTransaction } : item
        );
        await AsyncStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(updated));
        return true;
    } catch (error) {
        console.error('Error updating transaction:', error);
        return false;
    }
};

const clearAllTransactions = async () => {
    try {
        await AsyncStorage.removeItem(STORAGE_KEYS.TRANSACTIONS);
        return true;
    } catch (error) {
        console.error('Error clearing transactions:', error);
        return false;
    }
};

export default {
    getTransactions,
    saveTransaction,
    updateTransaction,
    deleteTransaction,
    clearAllTransactions,
};

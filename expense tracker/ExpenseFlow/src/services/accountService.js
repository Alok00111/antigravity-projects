// File: src/services/accountService.js

import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_KEYS, DEFAULT_ACCOUNTS } from '../utils/constants';

const getAccounts = async () => {
    try {
        const data = await AsyncStorage.getItem(STORAGE_KEYS.ACCOUNTS);
        if (data) return JSON.parse(data);
        // First launch: seed with default accounts
        await AsyncStorage.setItem(STORAGE_KEYS.ACCOUNTS, JSON.stringify(DEFAULT_ACCOUNTS));
        return DEFAULT_ACCOUNTS;
    } catch (error) {
        console.error('Error loading accounts:', error);
        return DEFAULT_ACCOUNTS;
    }
};

const saveAccounts = async (accounts) => {
    try {
        await AsyncStorage.setItem(STORAGE_KEYS.ACCOUNTS, JSON.stringify(accounts));
        return true;
    } catch (error) {
        console.error('Error saving accounts:', error);
        return false;
    }
};

const addAccount = async (account) => {
    const accounts = await getAccounts();
    const newAccount = {
        id: `acc_${Date.now().toString(36)}`,
        name: account.name,
        icon: account.icon || 'wallet-outline',
        color: account.color || '#6366F1',
        isDefault: false,
    };
    const updated = [...accounts, newAccount];
    await saveAccounts(updated);
    return newAccount;
};

const updateAccount = async (updatedAccount) => {
    const accounts = await getAccounts();
    const updated = accounts.map((a) =>
        a.id === updatedAccount.id ? { ...a, ...updatedAccount } : a
    );
    await saveAccounts(updated);
    return true;
};

const deleteAccount = async (id) => {
    const accounts = await getAccounts();
    if (accounts.length <= 1) return false; // must keep at least one
    const updated = accounts.filter((a) => a.id !== id);
    // If deleted account was default, make first remaining one default
    if (!updated.some((a) => a.isDefault)) {
        updated[0].isDefault = true;
    }
    await saveAccounts(updated);
    return true;
};

const setDefaultAccount = async (id) => {
    const accounts = await getAccounts();
    const updated = accounts.map((a) => ({
        ...a,
        isDefault: a.id === id,
    }));
    await saveAccounts(updated);
    return true;
};

const getDefaultAccount = async () => {
    const accounts = await getAccounts();
    return accounts.find((a) => a.isDefault) || accounts[0] || DEFAULT_ACCOUNTS[0];
};

export default {
    getAccounts,
    saveAccounts,
    addAccount,
    updateAccount,
    deleteAccount,
    setDefaultAccount,
    getDefaultAccount,
};

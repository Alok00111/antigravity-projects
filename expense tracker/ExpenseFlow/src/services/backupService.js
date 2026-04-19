// File: src/services/backupService.js
// Local backup & restore using expo-file-system, expo-sharing, and expo-document-picker

import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import * as DocumentPicker from 'expo-document-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_KEYS } from '../utils/constants';

/**
 * Keys to include in a backup.
 */
const BACKUP_KEYS = [
    '@expense_tracker_transactions',
    '@expense_tracker_budgets',
    '@expense_tracker_recurring',
    '@expense_tracker_categories',
    '@expenseflow_savings_goals',
    STORAGE_KEYS.ACCOUNTS,
    '@expenseflow_settings',
    '@expenseflow_theme',
];

/**
 * Export all app data as a JSON file and share it.
 */
const exportBackup = async () => {
    try {
        const data = {};
        for (const key of BACKUP_KEYS) {
            const value = await AsyncStorage.getItem(key);
            if (value) {
                data[key] = JSON.parse(value);
            }
        }

        const backup = {
            version: 1,
            appName: 'ExpenseFlow',
            exportedAt: new Date().toISOString(),
            data,
        };

        const fileName = `ExpenseFlow_Backup_${new Date().toISOString().slice(0, 10).replace(/-/g, '')}.json`;
        const filePath = `${FileSystem.documentDirectory}${fileName}`;

        await FileSystem.writeAsStringAsync(filePath, JSON.stringify(backup, null, 2));

        const canShare = await Sharing.isAvailableAsync();
        if (canShare) {
            await Sharing.shareAsync(filePath, {
                mimeType: 'application/json',
                dialogTitle: 'Export ExpenseFlow Backup',
                UTI: 'public.json',
            });
        }

        // Save last backup timestamp
        await AsyncStorage.setItem(STORAGE_KEYS.LAST_BACKUP, new Date().toISOString());

        return { success: true, fileName };
    } catch (error) {
        console.error('Export backup failed:', error);
        return { success: false, error: error.message };
    }
};

/**
 * Import app data from a JSON backup file.
 */
const importBackup = async () => {
    try {
        const result = await DocumentPicker.getDocumentAsync({
            type: 'application/json',
            copyToCacheDirectory: true,
        });

        if (result.canceled || !result.assets || result.assets.length === 0) {
            return { success: false, cancelled: true };
        }

        const fileUri = result.assets[0].uri;
        const content = await FileSystem.readAsStringAsync(fileUri);
        const backup = JSON.parse(content);

        // Validate backup format
        if (!backup.appName || backup.appName !== 'ExpenseFlow' || !backup.data) {
            return { success: false, error: 'Invalid backup file. This file was not created by ExpenseFlow.' };
        }

        // Restore data
        let restoredCount = 0;
        for (const [key, value] of Object.entries(backup.data)) {
            await AsyncStorage.setItem(key, JSON.stringify(value));
            restoredCount++;
        }

        return {
            success: true,
            restoredCount,
            backupDate: backup.exportedAt,
        };
    } catch (error) {
        console.error('Import backup failed:', error);
        if (error.message?.includes('JSON')) {
            return { success: false, error: 'Invalid file format. Please select a valid ExpenseFlow backup file.' };
        }
        return { success: false, error: error.message };
    }
};

/**
 * Get info about the last backup.
 */
const getLastBackupInfo = async () => {
    try {
        const lastBackup = await AsyncStorage.getItem(STORAGE_KEYS.LAST_BACKUP);
        return lastBackup ? new Date(lastBackup) : null;
    } catch {
        return null;
    }
};

/**
 * Get a summary of current data (for display before export/import).
 */
const getDataSummary = async () => {
    try {
        const txnRaw = await AsyncStorage.getItem('@expense_tracker_transactions');
        const transactions = txnRaw ? JSON.parse(txnRaw) : [];

        const budgetRaw = await AsyncStorage.getItem('@expense_tracker_budgets');
        const budgets = budgetRaw ? JSON.parse(budgetRaw) : [];

        const recurringRaw = await AsyncStorage.getItem('@expense_tracker_recurring');
        const recurring = recurringRaw ? JSON.parse(recurringRaw) : [];

        const accRaw = await AsyncStorage.getItem(STORAGE_KEYS.ACCOUNTS);
        const accounts = accRaw ? JSON.parse(accRaw) : [];

        return {
            transactions: transactions.length,
            budgets: budgets.length,
            recurring: recurring.length,
            accounts: accounts.length,
        };
    } catch {
        return { transactions: 0, budgets: 0, recurring: 0, accounts: 0 };
    }
};

export default {
    exportBackup,
    importBackup,
    getLastBackupInfo,
    getDataSummary,
};

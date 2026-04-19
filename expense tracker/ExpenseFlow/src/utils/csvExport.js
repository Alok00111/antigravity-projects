// File: src/utils/csvExport.js

import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { getCategoryById } from './categories';
import { formatDate } from './dateHelpers';

/**
 * Convert transactions to CSV string
 */
const transactionsToCSV = (transactions) => {
    const header = 'Date,Type,Category,Amount,Note\n';
    const rows = transactions.map((txn) => {
        const cat = getCategoryById(txn.category);
        const date = formatDate(txn.date);
        const type = txn.type.charAt(0).toUpperCase() + txn.type.slice(1);
        const category = cat?.label || 'Unknown';
        const amount = txn.amount.toFixed(2);
        const note = `"${(txn.note || '').replace(/"/g, '""')}"`;
        return `${date},${type},${category},${amount},${note}`;
    });
    return header + rows.join('\n');
};

/**
 * Export transactions to CSV file and open share dialog
 */
export const exportToCSV = async (transactions) => {
    try {
        const csv = transactionsToCSV(transactions);
        const fileName = `ExpenseFlow_${new Date().toISOString().split('T')[0]}.csv`;
        const filePath = `${FileSystem.documentDirectory}${fileName}`;

        await FileSystem.writeAsStringAsync(filePath, csv, {
            encoding: FileSystem.EncodingType.UTF8,
        });

        const isAvailable = await Sharing.isAvailableAsync();
        if (isAvailable) {
            await Sharing.shareAsync(filePath, {
                mimeType: 'text/csv',
                dialogTitle: 'Export Transactions',
                UTI: 'public.comma-separated-values-text',
            });
        } else {
            throw new Error('Sharing is not available on this device');
        }

        return true;
    } catch (error) {
        console.error('Error exporting CSV:', error);
        throw error;
    }
};

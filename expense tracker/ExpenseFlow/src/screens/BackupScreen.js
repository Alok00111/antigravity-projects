// File: src/screens/BackupScreen.js
// Backup & Restore screen for exporting / importing data

import React, { useState, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useTheme } from '../context/ThemeContext';
import ScreenContainer from '../components/ScreenContainer';
import { useAlert } from '../context/AlertContext';
import { SPACING, FONT_SIZE } from '../utils/constants';
import backupService from '../services/backupService';

const BackupScreen = () => {
    const { colors } = useTheme();
    const { showAlert } = useAlert();
    const [lastBackup, setLastBackup] = useState(null);
    const [summary, setSummary] = useState(null);
    const [loading, setLoading] = useState(false);

    useFocusEffect(
        useCallback(() => {
            loadInfo();
        }, [])
    );

    const loadInfo = async () => {
        const [last, sum] = await Promise.all([
            backupService.getLastBackupInfo(),
            backupService.getDataSummary(),
        ]);
        setLastBackup(last);
        setSummary(sum);
    };

    const handleExport = async () => {
        setLoading(true);
        try {
            const result = await backupService.exportBackup();
            if (result.success) {
                showAlert({
                    title: '✅ Backup Exported',
                    message: `Your data has been exported as ${result.fileName}. Save it somewhere safe!`,
                    type: 'success',
                });
                await loadInfo();
            } else {
                showAlert({ title: 'Export Failed', message: result.error || 'Something went wrong.', type: 'error' });
            }
        } catch (e) {
            showAlert({ title: 'Error', message: 'Failed to export backup.', type: 'error' });
        } finally {
            setLoading(false);
        }
    };

    const handleImport = () => {
        showAlert({
            title: '⚠️ Import Backup',
            message: 'This will replace ALL your current data with the backup data. This action cannot be undone.\n\nAre you sure?',
            type: 'confirm',
            buttons: [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Import & Replace',
                    style: 'destructive',
                    onPress: async () => {
                        setLoading(true);
                        try {
                            const result = await backupService.importBackup();
                            if (result.cancelled) return;
                            if (result.success) {
                                showAlert({
                                    title: '✅ Data Restored',
                                    message: `Successfully restored ${result.restoredCount} data categories from backup (${new Date(result.backupDate).toLocaleDateString()}).`,
                                    type: 'success',
                                });
                                await loadInfo();
                            } else {
                                showAlert({ title: 'Import Failed', message: result.error || 'Invalid backup file.', type: 'error' });
                            }
                        } catch (e) {
                            showAlert({ title: 'Error', message: 'Failed to import backup.', type: 'error' });
                        } finally {
                            setLoading(false);
                        }
                    },
                },
            ],
        });
    };

    const formatDate = (date) => {
        if (!date) return 'Never';
        return `${date.toLocaleDateString()} at ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    };

    return (
        <ScreenContainer>
            <Text style={[styles.header, { color: colors.text }]}>Backup & Restore</Text>

            {/* Last Backup Info */}
            <View style={[styles.infoCard, { backgroundColor: colors.card }]}>
                <View style={[styles.infoIcon, { backgroundColor: `${colors.primary}18` }]}>
                    <Ionicons name="time-outline" size={24} color={colors.primary} />
                </View>
                <View style={styles.infoContent}>
                    <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Last Backup</Text>
                    <Text style={[styles.infoValue, { color: colors.text }]}>{formatDate(lastBackup)}</Text>
                </View>
            </View>

            {/* Data Summary */}
            {summary && (
                <View style={[styles.summaryCard, { backgroundColor: colors.card }]}>
                    <Text style={[styles.summaryTitle, { color: colors.text }]}>Your Data</Text>
                    <View style={styles.summaryGrid}>
                        <SummaryItem label="Transactions" count={summary.transactions} icon="receipt-outline" color="#8B5CF6" colors={colors} />
                        <SummaryItem label="Budgets" count={summary.budgets} icon="pie-chart-outline" color="#EC4899" colors={colors} />
                        <SummaryItem label="Recurring" count={summary.recurring} icon="repeat-outline" color="#6366F1" colors={colors} />
                        <SummaryItem label="Accounts" count={summary.accounts} icon="wallet-outline" color="#22C55E" colors={colors} />
                    </View>
                </View>
            )}

            {/* Buttons */}
            <View style={styles.buttonsContainer}>
                <TouchableOpacity
                    style={[styles.actionButton, { backgroundColor: colors.primary }]}
                    onPress={handleExport}
                    activeOpacity={0.8}
                    disabled={loading}
                >
                    {loading ? (
                        <ActivityIndicator color="#FFF" />
                    ) : (
                        <>
                            <Ionicons name="cloud-upload-outline" size={22} color="#FFF" />
                            <Text style={styles.actionBtnText}>Export Backup</Text>
                        </>
                    )}
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.actionButton, { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border }]}
                    onPress={handleImport}
                    activeOpacity={0.8}
                    disabled={loading}
                >
                    <Ionicons name="cloud-download-outline" size={22} color={colors.text} />
                    <Text style={[styles.actionBtnText, { color: colors.text }]}>Import Backup</Text>
                </TouchableOpacity>
            </View>

            {/* Info Note */}
            <View style={[styles.noteBox, { backgroundColor: `${colors.primary}08`, borderColor: `${colors.primary}30` }]}>
                <Ionicons name="information-circle-outline" size={18} color={colors.primary} />
                <Text style={[styles.noteText, { color: colors.textSecondary }]}>
                    Your backup file contains all transactions, budgets, accounts, and settings. Save it to Google Drive, iCloud, or another safe location to protect against data loss.
                </Text>
            </View>
        </ScreenContainer>
    );
};

const SummaryItem = ({ label, count, icon, color, colors }) => (
    <View style={styles.summaryItem}>
        <View style={[styles.summaryIcon, { backgroundColor: `${color}18` }]}>
            <Ionicons name={icon} size={16} color={color} />
        </View>
        <Text style={[styles.summaryCount, { color: colors.text }]}>{count}</Text>
        <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>{label}</Text>
    </View>
);

const styles = StyleSheet.create({
    header: {
        fontSize: FONT_SIZE.xxl,
        fontWeight: '700',
        marginBottom: SPACING.lg,
    },
    infoCard: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: SPACING.md,
        borderRadius: 14,
        marginBottom: SPACING.md,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.04,
        shadowRadius: 4,
        elevation: 2,
    },
    infoIcon: {
        width: 48,
        height: 48,
        borderRadius: 14,
        alignItems: 'center',
        justifyContent: 'center',
    },
    infoContent: { marginLeft: SPACING.md, flex: 1 },
    infoLabel: { fontSize: FONT_SIZE.sm, fontWeight: '500' },
    infoValue: { fontSize: FONT_SIZE.md, fontWeight: '700', marginTop: 2 },
    summaryCard: {
        padding: SPACING.md,
        borderRadius: 14,
        marginBottom: SPACING.lg,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.04,
        shadowRadius: 4,
        elevation: 2,
    },
    summaryTitle: {
        fontSize: FONT_SIZE.md,
        fontWeight: '700',
        marginBottom: SPACING.md,
    },
    summaryGrid: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    summaryItem: { alignItems: 'center', flex: 1 },
    summaryIcon: {
        width: 36,
        height: 36,
        borderRadius: 10,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 4,
    },
    summaryCount: { fontSize: FONT_SIZE.lg, fontWeight: '800' },
    summaryLabel: { fontSize: FONT_SIZE.xs, marginTop: 2 },
    buttonsContainer: { gap: SPACING.sm, marginBottom: SPACING.lg },
    actionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: SPACING.sm,
        paddingVertical: SPACING.md,
        borderRadius: 14,
    },
    actionBtnText: {
        fontSize: FONT_SIZE.md,
        fontWeight: '700',
        color: '#FFF',
    },
    noteBox: {
        flexDirection: 'row',
        gap: SPACING.sm,
        padding: SPACING.md,
        borderRadius: 12,
        borderWidth: 1,
    },
    noteText: {
        fontSize: FONT_SIZE.sm,
        flex: 1,
        lineHeight: 18,
    },
});

export default BackupScreen;

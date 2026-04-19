// File: src/screens/AnalyticsScreen.js

import React, { useState, useCallback, useMemo } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    RefreshControl,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useTheme } from '../context/ThemeContext';
import ScreenContainer from '../components/ScreenContainer';
import EmptyState from '../components/EmptyState';
import { AnalyticsSkeleton } from '../components/SkeletonLoader';
import DonutChart from '../components/charts/DonutChart';
import MonthlyBarChart from '../components/charts/MonthlyBarChart';
import TopCategories from '../components/charts/TopCategories';
import { FONT_SIZE, SPACING, TRANSACTION_TYPES } from '../utils/constants';
import { getMonthRange, filterByDateRange } from '../utils/dateHelpers';
import { getCategoryBreakdown, getMonthlyTotals, getTopCategories } from '../utils/analyticsHelpers';
import storageService from '../services/storageService';
import { formatAmount } from '../utils/currencies';

const PERIODS = [
    { key: 'thisMonth', label: 'This Month' },
    { key: 'lastMonth', label: 'Last Month' },
    { key: 'all', label: 'All Time' },
];

const AnalyticsScreen = () => {
    const { colors, currency } = useTheme();
    const [transactions, setTransactions] = useState([]);
    const [refreshing, setRefreshing] = useState(false);
    const [loading, setLoading] = useState(true);
    const [selectedPeriod, setSelectedPeriod] = useState('thisMonth');

    const loadData = useCallback(async () => {
        try {
            const data = await storageService.getTransactions();
            setTransactions(data);
        } catch (e) {
            console.error('Failed to load:', e);
        } finally {
            setLoading(false);
        }
    }, []);

    useFocusEffect(
        useCallback(() => {
            loadData();
        }, [loadData])
    );

    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        await loadData();
        setRefreshing(false);
    }, [loadData]);

    const filteredTransactions = useMemo(() => {
        const now = new Date();
        if (selectedPeriod === 'thisMonth') {
            const { start, end } = getMonthRange();
            return filterByDateRange(transactions, start, end);
        } else if (selectedPeriod === 'lastMonth') {
            const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
            const { start, end } = getMonthRange(lastMonth);
            return filterByDateRange(transactions, start, end);
        }
        return transactions;
    }, [transactions, selectedPeriod]);

    const totalIncome = filteredTransactions
        .filter((t) => t.type === TRANSACTION_TYPES.INCOME)
        .reduce((sum, t) => sum + t.amount, 0);

    const totalExpense = filteredTransactions
        .filter((t) => t.type === TRANSACTION_TYPES.EXPENSE)
        .reduce((sum, t) => sum + t.amount, 0);

    const categoryBreakdown = getCategoryBreakdown(filteredTransactions);
    const monthlyTotals = getMonthlyTotals(transactions);
    const topCategories = getTopCategories(filteredTransactions);

    if (loading) {
        return (
            <ScreenContainer>
                <AnalyticsSkeleton />
            </ScreenContainer>
        );
    }

    return (
        <ScreenContainer>
            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                        tintColor={colors.primary}
                        colors={[colors.primary]}
                    />
                }
            >
                <Text style={[styles.header, { color: colors.text }]}>Analytics</Text>

                {/* Period Selector */}
                <View style={styles.periodRow}>
                    {PERIODS.map((p) => (
                        <TouchableOpacity
                            key={p.key}
                            style={[
                                styles.periodChip,
                                { backgroundColor: colors.card, borderColor: colors.border },
                                selectedPeriod === p.key && { backgroundColor: colors.primary, borderColor: colors.primary },
                            ]}
                            onPress={() => setSelectedPeriod(p.key)}
                            activeOpacity={0.7}
                        >
                            <Text
                                style={[
                                    styles.periodText,
                                    { color: colors.textSecondary },
                                    selectedPeriod === p.key && styles.periodTextActive,
                                ]}
                            >
                                {p.label}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>

                {/* Summary */}
                <View style={styles.summaryRow}>
                    <View style={[styles.summaryCard, { backgroundColor: colors.card }]}>
                        <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>Income</Text>
                        <Text style={[styles.summaryValue, { color: colors.success }]}>
                            {currency.symbol}{formatAmount(totalIncome, currency.code)}
                        </Text>
                    </View>
                    <View style={[styles.summaryCard, { backgroundColor: colors.card }]}>
                        <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>Expense</Text>
                        <Text style={[styles.summaryValue, { color: colors.danger }]}>
                            {currency.symbol}{formatAmount(totalExpense, currency.code)}
                        </Text>
                    </View>
                </View>

                {filteredTransactions.length === 0 ? (
                    <EmptyState
                        icon="bar-chart-outline"
                        title="No data for this period"
                        subtitle="Add some transactions to see your analytics"
                    />
                ) : (
                    <>
                        <View style={styles.chartSection}>
                            <Text style={[styles.sectionTitle, { color: colors.text }]}>Spending by Category</Text>
                            <DonutChart data={categoryBreakdown} total={totalExpense} />
                        </View>

                        <View style={styles.chartSection}>
                            <MonthlyBarChart data={monthlyTotals} />
                        </View>

                        <View style={styles.chartSection}>
                            <TopCategories data={topCategories} />
                        </View>
                    </>
                )}
            </ScrollView>
        </ScreenContainer>
    );
};

const styles = StyleSheet.create({
    scrollContent: { paddingBottom: SPACING.xl + 20 },
    loadingText: { fontSize: FONT_SIZE.md },
    header: {
        fontSize: FONT_SIZE.xxl,
        fontWeight: '700',
        marginBottom: SPACING.md,
    },
    periodRow: {
        flexDirection: 'row',
        gap: SPACING.sm,
        marginBottom: SPACING.md,
    },
    periodChip: {
        flex: 1,
        paddingVertical: SPACING.xs + 2,
        borderRadius: 12,
        borderWidth: 1,
        alignItems: 'center',
    },
    periodText: {
        fontSize: FONT_SIZE.sm,
        fontWeight: '600',
    },
    periodTextActive: { color: '#FFF' },
    summaryRow: {
        flexDirection: 'row',
        gap: SPACING.sm,
        marginBottom: SPACING.lg,
    },
    summaryCard: {
        flex: 1,
        borderRadius: 14,
        padding: SPACING.md,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.04,
        shadowRadius: 4,
        elevation: 2,
    },
    summaryLabel: {
        fontSize: FONT_SIZE.sm,
        fontWeight: '600',
        marginBottom: 4,
    },
    summaryValue: {
        fontSize: FONT_SIZE.xl,
        fontWeight: '700',
    },
    chartSection: {
        marginBottom: SPACING.lg,
    },
    sectionTitle: {
        fontSize: FONT_SIZE.lg,
        fontWeight: '700',
        marginBottom: SPACING.sm,
    },
});

export default AnalyticsScreen;

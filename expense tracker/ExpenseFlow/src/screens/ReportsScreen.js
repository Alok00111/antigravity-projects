// File: src/screens/ReportsScreen.js

import React, { useState, useCallback, useMemo } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    RefreshControl,
    Share,
} from 'react-native';
import { useAlert } from '../context/AlertContext';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useTheme } from '../context/ThemeContext';
import ScreenContainer from '../components/ScreenContainer';
import EmptyState from '../components/EmptyState';
import { FONT_SIZE, SPACING, TRANSACTION_TYPES } from '../utils/constants';
import { getMonthRange, filterByDateRange } from '../utils/dateHelpers';
import { getWeekRange, generateReportData, formatReportText } from '../utils/reportHelpers';
import storageService from '../services/storageService';
import { formatAmount } from '../utils/currencies';

const PERIODS = [
    { key: 'thisWeek', label: 'This Week' },
    { key: 'thisMonth', label: 'This Month' },
    { key: 'lastMonth', label: 'Last Month' },
    { key: 'all', label: 'All Time' },
];

const StatCard = ({ icon, label, value, valueColor, colors }) => (
    <View style={[styles.statCard, { backgroundColor: colors.card }]}>
        <View style={[styles.statIconCircle, { backgroundColor: `${valueColor}18` }]}>
            <Ionicons name={icon} size={20} color={valueColor} />
        </View>
        <Text style={[styles.statLabel, { color: colors.textSecondary }]}>{label}</Text>
        <Text style={[styles.statValue, { color: valueColor }]}>{value}</Text>
    </View>
);

const CategoryBar = ({ category, maxAmount, colors, currencySymbol, currencyCode }) => {
    const barWidth = maxAmount > 0 ? Math.max((category.amount / maxAmount) * 100, 8) : 8;
    return (
        <View style={styles.categoryBarRow}>
            <View style={styles.categoryBarLeft}>
                <View style={[styles.categoryBarIcon, { backgroundColor: `${category.color}18` }]}>
                    <Ionicons name={category.icon} size={16} color={category.color} />
                </View>
                <View style={styles.categoryBarInfo}>
                    <Text style={[styles.categoryBarLabel, { color: colors.text }]}>{category.label}</Text>
                    <Text style={[styles.categoryBarAmount, { color: colors.textSecondary }]}>
                        {currencySymbol}{formatAmount(category.amount, currencyCode)} · {category.percentage}%
                    </Text>
                </View>
            </View>
            <View style={[styles.barTrack, { backgroundColor: colors.border }]}>
                <View
                    style={[styles.barFill, { width: `${barWidth}%`, backgroundColor: category.color }]}
                />
            </View>
        </View>
    );
};

const ReportsScreen = () => {
    const { colors, currency } = useTheme();
    const { showAlert } = useAlert();
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

    const { filteredTransactions, periodLabel } = useMemo(() => {
        const now = new Date();
        let start, end, label;

        switch (selectedPeriod) {
            case 'thisWeek': {
                const range = getWeekRange(now);
                start = range.start;
                end = range.end;
                label = 'This Week';
                break;
            }
            case 'thisMonth': {
                const range = getMonthRange();
                start = range.start;
                end = range.end;
                label = now.toLocaleString('default', { month: 'long', year: 'numeric' });
                break;
            }
            case 'lastMonth': {
                const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
                const range = getMonthRange(lastMonth);
                start = range.start;
                end = range.end;
                label = lastMonth.toLocaleString('default', { month: 'long', year: 'numeric' });
                break;
            }
            default:
                return {
                    filteredTransactions: transactions,
                    periodLabel: 'All Time',
                };
        }

        return {
            filteredTransactions: filterByDateRange(transactions, start, end),
            periodLabel: label,
        };
    }, [transactions, selectedPeriod]);

    const reportData = useMemo(() => generateReportData(filteredTransactions), [filteredTransactions]);

    const handleShare = async () => {
        try {
            const text = formatReportText(reportData, currency.symbol, periodLabel, currency.code);
            await Share.share({ message: text, title: 'ExpenseFlow Report' });
        } catch (e) {
            showAlert({ title: 'Error', message: 'Failed to share report.', type: 'error' });
        }
    };

    const maxCatAmount = reportData.topCategories.length > 0
        ? Math.max(...reportData.topCategories.map((c) => c.amount))
        : 0;

    if (loading) {
        return (
            <ScreenContainer>
                <Text style={[styles.header, { color: colors.text }]}>Reports</Text>
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
                {/* Header */}
                <View style={styles.headerRow}>
                    <Text style={[styles.header, { color: colors.text }]}>Reports</Text>
                    <TouchableOpacity
                        style={[styles.shareBtn, { backgroundColor: `${colors.primary}18` }]}
                        onPress={handleShare}
                        activeOpacity={0.7}
                    >
                        <Ionicons name="share-outline" size={20} color={colors.primary} />
                        <Text style={[styles.shareBtnText, { color: colors.primary }]}>Share</Text>
                    </TouchableOpacity>
                </View>

                {/* Period Selector */}
                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.periodRow}
                >
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
                </ScrollView>

                {/* Period Label */}
                <Text style={[styles.periodLabel, { color: colors.textSecondary }]}>
                    {periodLabel}
                </Text>

                {filteredTransactions.length === 0 ? (
                    <EmptyState
                        icon="document-text-outline"
                        title="No data for this period"
                        subtitle="Add some transactions to see your report"
                    />
                ) : (
                    <>
                        {/* Summary Stats */}
                        <View style={styles.statsGrid}>
                            <StatCard
                                icon="arrow-down-circle-outline"
                                label="Income"
                                value={`${currency.symbol}${formatAmount(reportData.totalIncome, currency.code)}`}
                                valueColor={colors.success}
                                colors={colors}
                            />
                            <StatCard
                                icon="arrow-up-circle-outline"
                                label="Expense"
                                value={`${currency.symbol}${formatAmount(reportData.totalExpense, currency.code)}`}
                                valueColor={colors.danger}
                                colors={colors}
                            />
                            <StatCard
                                icon="wallet-outline"
                                label="Balance"
                                value={`${currency.symbol}${formatAmount(reportData.balance, currency.code)}`}
                                valueColor={reportData.balance >= 0 ? colors.success : colors.danger}
                                colors={colors}
                            />
                            <StatCard
                                icon="calendar-outline"
                                label="Daily Avg"
                                value={`${currency.symbol}${formatAmount(reportData.dailyAverage, currency.code)}`}
                                valueColor={colors.primary}
                                colors={colors}
                            />
                        </View>

                        {/* Transaction Count */}
                        <View style={[styles.countCard, { backgroundColor: colors.card }]}>
                            <Ionicons name="receipt-outline" size={20} color={colors.primary} />
                            <Text style={[styles.countText, { color: colors.text }]}>
                                {reportData.transactionCount} transactions over {reportData.dayCount} days
                            </Text>
                        </View>

                        {/* Top Categories */}
                        {reportData.topCategories.length > 0 && (
                            <View style={styles.section}>
                                <Text style={[styles.sectionTitle, { color: colors.text }]}>
                                    Top Spending Categories
                                </Text>
                                {reportData.topCategories.map((cat) => (
                                    <CategoryBar
                                        key={cat.id}
                                        category={cat}
                                        maxAmount={maxCatAmount}
                                        colors={colors}
                                        currencySymbol={currency.symbol}
                                        currencyCode={currency.code}
                                    />
                                ))}
                            </View>
                        )}

                        {/* Income vs Expense */}
                        <View style={styles.section}>
                            <Text style={[styles.sectionTitle, { color: colors.text }]}>
                                Income vs Expense
                            </Text>
                            <View style={[styles.comparisonCard, { backgroundColor: colors.card }]}>
                                <View style={styles.comparisonRow}>
                                    <View style={styles.comparisonItem}>
                                        <View style={[styles.comparisonDot, { backgroundColor: colors.success }]} />
                                        <Text style={[styles.comparisonLabel, { color: colors.textSecondary }]}>Income</Text>
                                    </View>
                                    <Text style={[styles.comparisonValue, { color: colors.success }]}>
                                        {currency.symbol}{formatAmount(reportData.totalIncome, currency.code)}
                                    </Text>
                                </View>
                                <View style={[styles.comparisonBar, { backgroundColor: colors.border }]}>
                                    <View
                                        style={[
                                            styles.comparisonBarFill,
                                            {
                                                backgroundColor: colors.success,
                                                width: `${(reportData.totalIncome + reportData.totalExpense) > 0
                                                    ? (reportData.totalIncome / (reportData.totalIncome + reportData.totalExpense)) * 100 : 50}%`,
                                            },
                                        ]}
                                    />
                                </View>
                                <View style={styles.comparisonRow}>
                                    <View style={styles.comparisonItem}>
                                        <View style={[styles.comparisonDot, { backgroundColor: colors.danger }]} />
                                        <Text style={[styles.comparisonLabel, { color: colors.textSecondary }]}>Expense</Text>
                                    </View>
                                    <Text style={[styles.comparisonValue, { color: colors.danger }]}>
                                        {currency.symbol}{formatAmount(reportData.totalExpense, currency.code)}
                                    </Text>
                                </View>
                            </View>
                        </View>
                    </>
                )}
            </ScrollView>
        </ScreenContainer>
    );
};

const styles = StyleSheet.create({
    scrollContent: { paddingBottom: SPACING.xl + 20 },
    headerRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: SPACING.md,
    },
    header: {
        fontSize: FONT_SIZE.xxl,
        fontWeight: '700',
    },
    shareBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingHorizontal: SPACING.md,
        paddingVertical: SPACING.sm,
        borderRadius: 12,
    },
    shareBtnText: {
        fontSize: FONT_SIZE.sm,
        fontWeight: '700',
    },
    periodRow: {
        gap: SPACING.sm,
        marginBottom: SPACING.sm,
    },
    periodChip: {
        paddingVertical: SPACING.xs + 2,
        paddingHorizontal: SPACING.md,
        borderRadius: 12,
        borderWidth: 1,
    },
    periodText: {
        fontSize: FONT_SIZE.sm,
        fontWeight: '600',
    },
    periodTextActive: { color: '#FFF' },
    periodLabel: {
        fontSize: FONT_SIZE.sm,
        fontWeight: '600',
        marginBottom: SPACING.md,
        textAlign: 'center',
    },
    statsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: SPACING.sm,
        marginBottom: SPACING.md,
    },
    statCard: {
        width: '48%',
        flexGrow: 1,
        borderRadius: 14,
        padding: SPACING.md,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.04,
        shadowRadius: 4,
        elevation: 2,
    },
    statIconCircle: {
        width: 36,
        height: 36,
        borderRadius: 10,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: SPACING.xs,
    },
    statLabel: {
        fontSize: FONT_SIZE.sm,
        fontWeight: '600',
        marginBottom: 4,
    },
    statValue: {
        fontSize: FONT_SIZE.lg,
        fontWeight: '700',
    },
    countCard: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: SPACING.sm,
        padding: SPACING.md,
        borderRadius: 14,
        marginBottom: SPACING.lg,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.04,
        shadowRadius: 4,
        elevation: 2,
    },
    countText: {
        fontSize: FONT_SIZE.md,
        fontWeight: '600',
    },
    section: {
        marginBottom: SPACING.lg,
    },
    sectionTitle: {
        fontSize: FONT_SIZE.lg,
        fontWeight: '700',
        marginBottom: SPACING.md,
    },
    categoryBarRow: {
        marginBottom: SPACING.md,
    },
    categoryBarLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: SPACING.xs,
    },
    categoryBarIcon: {
        width: 32,
        height: 32,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
    },
    categoryBarInfo: {
        flex: 1,
        marginLeft: SPACING.sm,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    categoryBarLabel: {
        fontSize: FONT_SIZE.md,
        fontWeight: '600',
    },
    categoryBarAmount: {
        fontSize: FONT_SIZE.sm,
        fontWeight: '600',
    },
    barTrack: {
        height: 8,
        borderRadius: 4,
        marginLeft: 40,
    },
    barFill: {
        height: 8,
        borderRadius: 4,
    },
    comparisonCard: {
        borderRadius: 14,
        padding: SPACING.md,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.04,
        shadowRadius: 4,
        elevation: 2,
    },
    comparisonRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    comparisonItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: SPACING.sm,
    },
    comparisonDot: {
        width: 10,
        height: 10,
        borderRadius: 5,
    },
    comparisonLabel: {
        fontSize: FONT_SIZE.md,
        fontWeight: '600',
    },
    comparisonValue: {
        fontSize: FONT_SIZE.md,
        fontWeight: '700',
    },
    comparisonBar: {
        height: 10,
        borderRadius: 5,
        marginVertical: SPACING.sm,
        overflow: 'hidden',
    },
    comparisonBarFill: {
        height: 10,
        borderRadius: 5,
    },
});

export default ReportsScreen;

// File: src/screens/DashboardScreen.js

import React, { useState, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    RefreshControl,
    TouchableOpacity,
} from 'react-native';
import { useAlert } from '../context/AlertContext';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { useTheme } from '../context/ThemeContext';
import ScreenContainer from '../components/ScreenContainer';
import SummaryCard from '../components/SummaryCard';
import TransactionItem from '../components/TransactionItem';
import EmptyState from '../components/EmptyState';
import { DashboardSkeleton } from '../components/SkeletonLoader';
import QuickGlanceCard from '../components/QuickGlanceCard';
import {
    FONT_SIZE,
    SPACING,
    STORAGE_KEYS,
    TRANSACTION_TYPES,
    SCREEN_NAMES,
} from '../utils/constants';
import { getMonthRange, filterByDateRange, getMonthFull } from '../utils/dateHelpers';
import storageService from '../services/storageService';
import { formatAmount } from '../utils/currencies';
import accountService from '../services/accountService';
import { getSpendingTrend } from '../utils/trendHelpers';
import { generateInsights } from '../services/insightsService';
import TrendCard from '../components/TrendCard';
import InsightsCard from '../components/InsightsCard';

const RECENT_COUNT = 5;

const DashboardScreen = () => {
    const navigation = useNavigation();
    const { colors, currency } = useTheme();
    const { showAlert } = useAlert();
    const [transactions, setTransactions] = useState([]);
    const [accounts, setAccounts] = useState([]);
    const [budgets, setBudgets] = useState({});
    const [userName, setUserName] = useState('');
    const [selectedAccount, setSelectedAccount] = useState('all');
    const [refreshing, setRefreshing] = useState(false);
    const [loading, setLoading] = useState(true);

    const loadData = useCallback(async () => {
        try {
            const [data, accs, budgetData, storedName] = await Promise.all([
                storageService.getTransactions(),
                accountService.getAccounts(),
                AsyncStorage.getItem(STORAGE_KEYS.BUDGETS),
                AsyncStorage.getItem(STORAGE_KEYS.USER_NAME),
            ]);
            setTransactions(data);
            setAccounts(accs);
            if (budgetData) setBudgets(JSON.parse(budgetData));
            if (storedName) setUserName(storedName);
        } catch (e) {
            console.error('Failed to load transactions:', e);
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

    const handleDelete = useCallback((txn) => {
        showAlert({
            title: 'Delete Transaction',
            message: 'Are you sure?',
            type: 'confirm',
            buttons: [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        const success = await storageService.deleteTransaction(txn.id);
                        if (success) {
                            setTransactions((prev) => prev.filter((t) => t.id !== txn.id));
                        }
                    },
                },
            ],
        });
    }, [showAlert]);

    const handleTransactionPress = useCallback(
        (txn) => {
            navigation.navigate(SCREEN_NAMES.ADD_TRANSACTION, { transaction: txn });
        },
        [navigation]
    );

    // Filter by account
    const accountFiltered = selectedAccount === 'all'
        ? transactions
        : transactions.filter((t) => (t.accountId || 'cash') === selectedAccount);

    // Calculate monthly stats
    const { start, end } = getMonthRange();
    const monthlyTransactions = filterByDateRange(accountFiltered, start, end);

    const totalIncome = monthlyTransactions
        .filter((t) => t.type === TRANSACTION_TYPES.INCOME)
        .reduce((sum, t) => sum + t.amount, 0);

    const totalExpense = monthlyTransactions
        .filter((t) => t.type === TRANSACTION_TYPES.EXPENSE)
        .reduce((sum, t) => sum + t.amount, 0);

    const balance = totalIncome - totalExpense;

    const recentTransactions = [...accountFiltered]
        .sort((a, b) => new Date(b.date) - new Date(a.date))
        .slice(0, RECENT_COUNT);

    // Spending trend
    const trend = getSpendingTrend(accountFiltered);

    // Smart insights
    const insights = generateInsights(transactions, currency.code);

    const currentMonthName = getMonthFull(new Date());

    // Spending prediction
    const now = new Date();
    const dayOfMonth = now.getDate();
    const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    const daysRemaining = daysInMonth - dayOfMonth;
    const dailyAvgExpense = dayOfMonth > 0 ? totalExpense / dayOfMonth : 0;
    const predictedMonthEnd = totalExpense + (dailyAvgExpense * daysRemaining);
    const predictedSavings = totalIncome - predictedMonthEnd;
    const isOnTrack = predictedSavings >= 0;

    if (loading) {
        return (
            <ScreenContainer>
                <DashboardSkeleton />
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
                {/* Greeting */}
                <View style={styles.headerRow}>
                    <View style={{ flex: 1 }}>
                        <Text style={[styles.greeting, { color: colors.text }]} numberOfLines={1}>
                            {userName ? `Hey, ${userName}!` : 'Hello!'}
                        </Text>
                        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>{currentMonthName} Overview</Text>
                    </View>
                    <TouchableOpacity
                        onPress={() => navigation.navigate(SCREEN_NAMES.SETTINGS)}
                        activeOpacity={0.7}
                        style={[styles.settingsBtn, { backgroundColor: colors.card }]}
                    >
                        <Ionicons name="settings-outline" size={24} color={colors.textSecondary} />
                    </TouchableOpacity>
                </View>

                {/* Quick Glance */}
                <QuickGlanceCard
                    transactions={transactions}
                    budgets={budgets}
                    onAddPress={() => navigation.navigate(SCREEN_NAMES.ADD_TRANSACTION)}
                />

                {/* Account Filter */}
                {accounts.length > 1 && (
                    <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        style={styles.accountFilter}
                        contentContainerStyle={styles.accountFilterContent}
                    >
                        <TouchableOpacity
                            style={[
                                styles.accountChip,
                                {
                                    backgroundColor: selectedAccount === 'all' ? colors.primary : colors.card,
                                    borderColor: selectedAccount === 'all' ? colors.primary : colors.border,
                                },
                            ]}
                            onPress={() => setSelectedAccount('all')}
                            activeOpacity={0.7}
                        >
                            <Ionicons name="layers-outline" size={14} color={selectedAccount === 'all' ? '#FFF' : colors.textSecondary} />
                            <Text style={[styles.accountChipText, { color: selectedAccount === 'all' ? '#FFF' : colors.text }]}>All</Text>
                        </TouchableOpacity>
                        {accounts.map((acc) => (
                            <TouchableOpacity
                                key={acc.id}
                                style={[
                                    styles.accountChip,
                                    {
                                        backgroundColor: selectedAccount === acc.id ? acc.color : colors.card,
                                        borderColor: selectedAccount === acc.id ? acc.color : colors.border,
                                    },
                                ]}
                                onPress={() => setSelectedAccount(acc.id)}
                                activeOpacity={0.7}
                            >
                                <Ionicons name={acc.icon} size={14} color={selectedAccount === acc.id ? '#FFF' : acc.color} />
                                <Text style={[styles.accountChipText, { color: selectedAccount === acc.id ? '#FFF' : colors.text }]}>{acc.name}</Text>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                )}

                {/* Summary Cards */}
                <View style={styles.cardsRow}>
                    <SummaryCard
                        title="Balance"
                        amount={balance}
                        icon="wallet-outline"
                        iconBgColor={`${colors.primary}18`}
                        amountColor={balance >= 0 ? colors.success : colors.danger}
                    />
                </View>

                <View style={styles.cardsRow}>
                    <SummaryCard
                        title="Income"
                        amount={totalIncome}
                        icon="arrow-down-circle-outline"
                        iconBgColor={`${colors.success}18`}
                        amountColor={colors.success}
                    />
                    <View style={{ width: SPACING.sm }} />
                    <SummaryCard
                        title="Expense"
                        amount={totalExpense}
                        icon="arrow-up-circle-outline"
                        iconBgColor={`${colors.danger}18`}
                        amountColor={colors.danger}
                    />
                </View>

                {/* Smart Insights */}
                {insights.length > 0 && <InsightsCard insights={insights} />}

                {/* Trend Card */}
                {transactions.length > 0 && <TrendCard trend={trend} transactions={accountFiltered} />}

                {/* Spending Prediction */}
                {monthlyTransactions.length > 0 && (
                    <View style={[styles.predictionCard, { backgroundColor: colors.card }]}>
                        <View style={styles.predictionHeader}>
                            <Ionicons name="trending-up" size={20} color={isOnTrack ? colors.success : '#F59E0B'} />
                            <Text style={[styles.predictionTitle, { color: colors.text }]}>Month-End Forecast</Text>
                        </View>
                        <View style={styles.predictionRow}>
                            <View style={styles.predictionItem}>
                                <Text style={[styles.predictionLabel, { color: colors.textSecondary }]}>Avg/Day</Text>
                                <Text style={[styles.predictionAmount, { color: colors.danger }]}>
                                    {currency.symbol}{formatAmount(dailyAvgExpense, currency.code)}
                                </Text>
                            </View>
                            <View style={[styles.predictionDivider, { backgroundColor: colors.border }]} />
                            <View style={styles.predictionItem}>
                                <Text style={[styles.predictionLabel, { color: colors.textSecondary }]}>Projected</Text>
                                <Text style={[styles.predictionAmount, { color: colors.danger }]}>
                                    {currency.symbol}{formatAmount(predictedMonthEnd, currency.code)}
                                </Text>
                            </View>
                            <View style={[styles.predictionDivider, { backgroundColor: colors.border }]} />
                            <View style={styles.predictionItem}>
                                <Text style={[styles.predictionLabel, { color: colors.textSecondary }]}>
                                    {isOnTrack ? 'Savings' : 'Over'}
                                </Text>
                                <Text style={[styles.predictionAmount, { color: isOnTrack ? colors.success : colors.danger }]}>
                                    {isOnTrack ? '' : '-'}{currency.symbol}{formatAmount(Math.abs(predictedSavings), currency.code)}
                                </Text>
                            </View>
                        </View>
                        <Text style={[styles.predictionFooter, { color: colors.textSecondary }]}>
                            {daysRemaining} days left · {isOnTrack ? '✅ On track' : '⚠️ Exceeding income'}
                        </Text>
                    </View>
                )}

                {/* Recent Transactions */}
                <View style={styles.sectionRow}>
                    <Text style={[styles.sectionTitle, { color: colors.text }]}>Recent Transactions</Text>
                    {transactions.length > RECENT_COUNT && (
                        <TouchableOpacity onPress={() => navigation.navigate(SCREEN_NAMES.TRANSACTIONS)}>
                            <Text style={[styles.seeAll, { color: colors.primary }]}>See All</Text>
                        </TouchableOpacity>
                    )}
                </View>

                {recentTransactions.length > 0 ? (
                    recentTransactions.map((txn) => (
                        <TransactionItem
                            key={txn.id}
                            transaction={txn}
                            onPress={handleTransactionPress}
                            onDelete={handleDelete}
                        />
                    ))
                ) : (
                    <EmptyState
                        icon="receipt-outline"
                        title="No transactions yet"
                        subtitle="Tap the + tab to add your first transaction"
                        actionLabel="Add Transaction"
                        onAction={() => navigation.navigate(SCREEN_NAMES.ADD_TRANSACTION)}
                    />
                )}
            </ScrollView>
        </ScreenContainer>
    );
};

const styles = StyleSheet.create({
    scrollContent: {
        paddingBottom: SPACING.xl + 20,
    },
    loadingText: {
        fontSize: FONT_SIZE.md,
    },
    headerRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: SPACING.lg,
    },
    greeting: {
        fontSize: FONT_SIZE.xxl,
        fontWeight: '700',
    },
    subtitle: {
        fontSize: FONT_SIZE.md,
        marginTop: 2,
    },
    settingsBtn: {
        width: 44,
        height: 44,
        borderRadius: 14,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.04,
        shadowRadius: 4,
        elevation: 2,
    },
    cardsRow: {
        flexDirection: 'row',
        marginBottom: SPACING.sm,
    },
    sectionRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: SPACING.lg,
        marginBottom: SPACING.md,
    },
    sectionTitle: {
        fontSize: FONT_SIZE.lg,
        fontWeight: '700',
    },
    seeAll: {
        fontSize: FONT_SIZE.md,
        fontWeight: '600',
    },
    predictionCard: {
        borderRadius: 16,
        padding: SPACING.md,
        marginTop: SPACING.md,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 8,
        elevation: 3,
    },
    predictionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: SPACING.sm,
        marginBottom: SPACING.sm,
    },
    predictionTitle: {
        fontSize: FONT_SIZE.md,
        fontWeight: '700',
    },
    predictionRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    predictionItem: {
        flex: 1,
        alignItems: 'center',
    },
    predictionLabel: {
        fontSize: FONT_SIZE.sm,
        marginBottom: 4,
    },
    predictionAmount: {
        fontSize: FONT_SIZE.md,
        fontWeight: '700',
    },
    predictionDivider: {
        width: 1,
        height: 30,
    },
    predictionFooter: {
        fontSize: FONT_SIZE.sm,
        marginTop: SPACING.sm,
        textAlign: 'center',
    },
    accountFilter: {
        marginBottom: SPACING.md,
    },
    accountFilterContent: {
        gap: SPACING.xs + 2,
    },
    accountChip: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        paddingHorizontal: SPACING.sm + 2,
        paddingVertical: SPACING.xs + 2,
        borderRadius: 16,
        borderWidth: 1,
    },
    accountChipText: {
        fontSize: FONT_SIZE.sm,
        fontWeight: '600',
    },
});

export default DashboardScreen;

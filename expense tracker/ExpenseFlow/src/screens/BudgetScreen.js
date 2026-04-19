// File: src/screens/BudgetScreen.js

import React, { useState, useCallback, useMemo } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TextInput,
    TouchableOpacity,
    RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import { useTheme } from '../context/ThemeContext';
import ScreenContainer from '../components/ScreenContainer';
import {
    FONT_SIZE,
    SPACING,
    STORAGE_KEYS,
    TRANSACTION_TYPES,
} from '../utils/constants';
import { formatAmount } from '../utils/currencies';
import { EXPENSE_CATEGORIES, getCategoryById } from '../utils/categories';
import { getMonthRange, filterByDateRange, getMonthFull } from '../utils/dateHelpers';
import storageService from '../services/storageService';
import { useAlert } from '../context/AlertContext';
import { generatePredictions } from '../services/predictionService';
import PredictiveBudgetCard from '../components/PredictiveBudgetCard';

const BudgetScreen = () => {
    const { colors, currency } = useTheme();
    const { showAlert } = useAlert();
    const [budgets, setBudgets] = useState({});
    const [transactions, setTransactions] = useState([]);
    const [refreshing, setRefreshing] = useState(false);
    const [editingCategory, setEditingCategory] = useState(null);
    const [editAmount, setEditAmount] = useState('');

    const loadData = useCallback(async () => {
        try {
            const [txns, budgetData] = await Promise.all([
                storageService.getTransactions(),
                AsyncStorage.getItem(STORAGE_KEYS.BUDGETS),
            ]);
            setTransactions(txns);
            if (budgetData) setBudgets(JSON.parse(budgetData));
        } catch (e) {
            console.error('Error loading budget data:', e);
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

    const monthlyExpenses = useMemo(() => {
        const { start, end } = getMonthRange();
        const monthTxns = filterByDateRange(transactions, start, end)
            .filter((t) => t.type === TRANSACTION_TYPES.EXPENSE);
        const byCategory = {};
        monthTxns.forEach((t) => {
            byCategory[t.category] = (byCategory[t.category] || 0) + t.amount;
        });
        return byCategory;
    }, [transactions]);

    const saveBudgets = async (newBudgets) => {
        try {
            await AsyncStorage.setItem(STORAGE_KEYS.BUDGETS, JSON.stringify(newBudgets));
            setBudgets(newBudgets);
        } catch (e) {
            showAlert({ title: 'Error', message: 'Failed to save budget.', type: 'error' });
        }
    };

    const handleSetBudget = (categoryId) => {
        const amount = parseFloat(editAmount);
        if (isNaN(amount) || amount <= 0) {
            showAlert({ title: 'Invalid Amount', message: 'Please enter a valid budget amount.', type: 'warning' });
            return;
        }
        const newBudgets = { ...budgets, [categoryId]: amount };
        saveBudgets(newBudgets);
        setEditingCategory(null);
        setEditAmount('');
    };

    const handleRemoveBudget = (categoryId) => {
        showAlert({
            title: 'Remove Budget',
            message: 'Remove this budget limit?',
            type: 'confirm',
            buttons: [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Remove',
                    style: 'destructive',
                    onPress: () => {
                        const newBudgets = { ...budgets };
                        delete newBudgets[categoryId];
                        saveBudgets(newBudgets);
                    },
                },
            ],
        });
    };

    // Predictions
    const predictions = useMemo(() => generatePredictions(transactions), [transactions]);

    const handleApplyPrediction = (categoryId, recommended) => {
        const newBudgets = { ...budgets, [categoryId]: recommended };
        saveBudgets(newBudgets);
        showAlert({ title: '✅ Applied', message: `Budget set to ${currency.symbol}${formatAmount(recommended, currency.code)}`, type: 'success' });
    };

    const handleApplyAll = () => {
        showAlert({
            title: 'Apply All Suggestions?',
            message: `This will set budgets for ${predictions.length} categories based on your spending patterns.`,
            type: 'confirm',
            buttons: [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Apply All',
                    onPress: () => {
                        const newBudgets = { ...budgets };
                        predictions.forEach((p) => {
                            newBudgets[p.categoryId] = p.recommended;
                        });
                        saveBudgets(newBudgets);
                        showAlert({ title: '✅ Done!', message: `${predictions.length} budget limits updated.`, type: 'success' });
                    },
                },
            ],
        });
    };

    const currentMonth = getMonthFull(new Date());

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
                <Text style={[styles.header, { color: colors.text }]}>Budget Limits</Text>
                <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
                    Track spending against your {currentMonth} budgets
                </Text>

                {/* Predictive Budget Suggestions */}
                <PredictiveBudgetCard
                    predictions={predictions}
                    onApply={handleApplyPrediction}
                    onApplyAll={handleApplyAll}
                />

                {EXPENSE_CATEGORIES.map((cat) => {
                    const spent = monthlyExpenses[cat.id] || 0;
                    const limit = budgets[cat.id];
                    const hasLimit = limit !== undefined;
                    const progress = hasLimit ? Math.min(spent / limit, 1) : 0;
                    const isOver = hasLimit && spent > limit;
                    const isWarning = hasLimit && progress >= 0.8 && !isOver;
                    const isEditing = editingCategory === cat.id;

                    let statusColor = colors.success;
                    if (isOver) statusColor = colors.danger;
                    else if (isWarning) statusColor = '#F59E0B';

                    return (
                        <View key={cat.id} style={[styles.budgetCard, { backgroundColor: colors.card }]}>
                            <View style={styles.cardHeader}>
                                <View style={[styles.iconCircle, { backgroundColor: `${cat.color}18` }]}>
                                    <Ionicons name={cat.icon} size={20} color={cat.color} />
                                </View>
                                <View style={styles.cardInfo}>
                                    <Text style={[styles.catLabel, { color: colors.text }]}>{cat.label}</Text>
                                    <Text style={[styles.spentText, { color: colors.textSecondary }]}>
                                        {currency.symbol}{formatAmount(spent, currency.code)}
                                        {hasLimit && ` / ${currency.symbol}${formatAmount(limit, currency.code)}`}
                                    </Text>
                                </View>
                                {hasLimit && (
                                    <TouchableOpacity
                                        onPress={() => handleRemoveBudget(cat.id)}
                                        activeOpacity={0.6}
                                    >
                                        <Ionicons name="close-circle-outline" size={22} color={colors.textSecondary} />
                                    </TouchableOpacity>
                                )}
                            </View>

                            {hasLimit && (
                                <View style={[styles.progressTrack, { backgroundColor: colors.border }]}>
                                    <View
                                        style={[
                                            styles.progressFill,
                                            { width: `${progress * 100}%`, backgroundColor: statusColor },
                                        ]}
                                    />
                                </View>
                            )}

                            {isOver && (
                                <View style={[styles.alertRow, { backgroundColor: `${colors.danger}15` }]}>
                                    <Ionicons name="warning-outline" size={14} color={colors.danger} />
                                    <Text style={[styles.alertText, { color: colors.danger }]}>
                                        Over budget by {currency.symbol}{formatAmount(spent - limit, currency.code)}
                                    </Text>
                                </View>
                            )}
                            {isWarning && (
                                <View style={[styles.alertRow, { backgroundColor: '#F59E0B15' }]}>
                                    <Ionicons name="alert-circle-outline" size={14} color="#F59E0B" />
                                    <Text style={[styles.alertText, { color: '#F59E0B' }]}>
                                        Approaching budget limit ({Math.round(progress * 100)}%)
                                    </Text>
                                </View>
                            )}

                            {isEditing ? (
                                <View style={styles.editRow}>
                                    <View style={[styles.editInput, { backgroundColor: colors.background, borderColor: colors.border }]}>
                                        <Text style={[styles.editCurrency, { color: colors.textSecondary }]}>{currency.symbol}</Text>
                                        <TextInput
                                            style={[styles.editField, { color: colors.text }]}
                                            keyboardType="decimal-pad"
                                            placeholder="Amount"
                                            placeholderTextColor={colors.tabInactive}
                                            value={editAmount}
                                            onChangeText={setEditAmount}
                                            autoFocus
                                        />
                                    </View>
                                    <TouchableOpacity
                                        style={[styles.saveBtn, { backgroundColor: colors.primary }]}
                                        onPress={() => handleSetBudget(cat.id)}
                                    >
                                        <Ionicons name="checkmark" size={20} color="#FFF" />
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        style={[styles.cancelBtn, { borderColor: colors.border }]}
                                        onPress={() => {
                                            setEditingCategory(null);
                                            setEditAmount('');
                                        }}
                                    >
                                        <Ionicons name="close" size={20} color={colors.textSecondary} />
                                    </TouchableOpacity>
                                </View>
                            ) : (
                                <TouchableOpacity
                                    style={[styles.setBtn, { borderColor: colors.border }]}
                                    onPress={() => {
                                        setEditingCategory(cat.id);
                                        setEditAmount(hasLimit ? String(limit) : '');
                                    }}
                                    activeOpacity={0.7}
                                >
                                    <Ionicons name={hasLimit ? 'create-outline' : 'add'} size={16} color={colors.primary} />
                                    <Text style={[styles.setBtnText, { color: colors.primary }]}>
                                        {hasLimit ? 'Edit Limit' : 'Set Limit'}
                                    </Text>
                                </TouchableOpacity>
                            )}
                        </View>
                    );
                })}
            </ScrollView>
        </ScreenContainer>
    );
};

const styles = StyleSheet.create({
    scrollContent: { paddingBottom: SPACING.xl + 20 },
    header: {
        fontSize: FONT_SIZE.xxl,
        fontWeight: '700',
        marginBottom: 4,
    },
    subtitle: {
        fontSize: FONT_SIZE.md,
        marginBottom: SPACING.lg,
    },
    budgetCard: {
        borderRadius: 14,
        padding: SPACING.md,
        marginBottom: SPACING.sm,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.04,
        shadowRadius: 4,
        elevation: 2,
    },
    cardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    iconCircle: {
        width: 38,
        height: 38,
        borderRadius: 10,
        alignItems: 'center',
        justifyContent: 'center',
    },
    cardInfo: {
        flex: 1,
        marginLeft: SPACING.sm,
    },
    catLabel: {
        fontSize: FONT_SIZE.md,
        fontWeight: '600',
    },
    spentText: {
        fontSize: FONT_SIZE.sm,
        marginTop: 2,
    },
    progressTrack: {
        height: 6,
        borderRadius: 3,
        marginTop: SPACING.sm,
        overflow: 'hidden',
    },
    progressFill: {
        height: '100%',
        borderRadius: 3,
    },
    alertRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        marginTop: SPACING.sm,
        paddingHorizontal: SPACING.sm,
        paddingVertical: 4,
        borderRadius: 6,
    },
    alertText: {
        fontSize: FONT_SIZE.sm,
        fontWeight: '600',
    },
    setBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 4,
        marginTop: SPACING.sm,
        borderWidth: 1,
        borderRadius: 8,
        paddingVertical: 6,
    },
    setBtnText: {
        fontSize: FONT_SIZE.sm,
        fontWeight: '600',
    },
    editRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: SPACING.sm,
        marginTop: SPACING.sm,
    },
    editInput: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderRadius: 8,
        paddingHorizontal: SPACING.sm,
        paddingVertical: 6,
    },
    editCurrency: {
        fontSize: FONT_SIZE.md,
        fontWeight: '600',
        marginRight: 4,
    },
    editField: {
        flex: 1,
        fontSize: FONT_SIZE.md,
    },
    saveBtn: {
        width: 36,
        height: 36,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
    },
    cancelBtn: {
        width: 36,
        height: 36,
        borderRadius: 8,
        borderWidth: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
});

export default BudgetScreen;

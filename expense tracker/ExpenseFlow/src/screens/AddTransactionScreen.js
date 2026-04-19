// File: src/screens/AddTransactionScreen.js

import React, { useState, useCallback, useEffect } from 'react';
import {
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    ScrollView,
    KeyboardAvoidingView,
    Platform,
    View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '../context/ThemeContext';
import ScreenContainer from '../components/ScreenContainer';
import TypeToggle from '../components/TypeToggle';
import CategoryPicker from '../components/CategoryPicker';
import SplitInput from '../components/SplitInput';
import {
    FONT_SIZE,
    SPACING,
    TRANSACTION_TYPES,
    STORAGE_KEYS,
} from '../utils/constants';
import { getCategoriesByType, getCategoryById } from '../utils/categories';
import createTransaction from '../models/transactionModel';
import storageService from '../services/storageService';
import { formatAmount } from '../utils/currencies';
import ReceiptPicker from '../components/ReceiptPicker';
import AccountPicker from '../components/AccountPicker';
import { getMonthRange, filterByDateRange } from '../utils/dateHelpers';
import * as haptics from '../utils/haptics';
import notificationService from '../services/notificationService';
import { useAlert } from '../context/AlertContext';

const INITIAL_STATE = {
    type: TRANSACTION_TYPES.EXPENSE,
    amount: '',
    category: null,
    note: '',
    tags: [],
    tagInput: '',
    receiptUri: null,
    accountId: null,
    isSplit: false,
    splits: [{ category: null, amount: '' }, { category: null, amount: '' }],
};

const AddTransactionScreen = () => {
    const navigation = useNavigation();
    const route = useRoute();
    const { colors, currency } = useTheme();
    const { showAlert } = useAlert();
    const editTransaction = route.params?.transaction || null;
    const isEditMode = !!editTransaction;

    const [formData, setFormData] = useState(INITIAL_STATE);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (editTransaction) {
            const cat = getCategoryById(editTransaction.category);
            setFormData({
                type: editTransaction.type,
                amount: String(editTransaction.amount),
                category: cat,
                note: editTransaction.note || '',
                tags: editTransaction.tags || [],
                tagInput: '',
                receiptUri: editTransaction.receiptUri || null,
                accountId: editTransaction.accountId || 'cash',
            });
        }
    }, [editTransaction]);

    useEffect(() => {
        const unsubscribe = navigation.addListener('focus', () => {
            if (!route.params?.transaction) {
                setFormData(INITIAL_STATE);
            }
        });
        return unsubscribe;
    }, [navigation, route.params]);

    const categories = getCategoriesByType(formData.type);

    const handleTypeToggle = useCallback((type) => {
        haptics.lightTap();
        setFormData((prev) => ({ ...prev, type, category: null }));
    }, []);

    const handleCategorySelect = useCallback((category) => {
        haptics.selection();
        setFormData((prev) => ({ ...prev, category }));
    }, []);

    const handleAmountChange = useCallback((text) => {
        const cleaned = text.replace(/[^0-9.]/g, '');
        const parts = cleaned.split('.');
        const sanitized = parts.length > 2
            ? `${parts[0]}.${parts.slice(1).join('')}`
            : cleaned;
        setFormData((prev) => ({ ...prev, amount: sanitized }));
    }, []);

    const handleNoteChange = useCallback((text) => {
        setFormData((prev) => ({ ...prev, note: text }));
    }, []);

    const handleTagInputChange = useCallback((text) => {
        setFormData((prev) => ({ ...prev, tagInput: text }));
    }, []);

    const handleAddTag = useCallback(() => {
        setFormData((prev) => {
            const tag = prev.tagInput.trim().toLowerCase().replace(/^#/, '');
            if (!tag || prev.tags.includes(tag) || prev.tags.length >= 5) return prev;
            return { ...prev, tags: [...prev.tags, tag], tagInput: '' };
        });
    }, []);

    const handleRemoveTag = useCallback((tagToRemove) => {
        setFormData((prev) => ({
            ...prev,
            tags: prev.tags.filter((t) => t !== tagToRemove),
        }));
    }, []);

    const handleReceiptPick = useCallback((uri) => {
        setFormData((prev) => ({ ...prev, receiptUri: uri }));
    }, []);

    const handleReceiptRemove = useCallback(() => {
        setFormData((prev) => ({ ...prev, receiptUri: null }));
    }, []);

    const handleScanResult = useCallback((result) => {
        setFormData((prev) => ({
            ...prev,
            amount: result.amount ? String(result.amount) : prev.amount,
            note: result.note || prev.note,
        }));
    }, []);

    const validateForm = () => {
        if (!formData.amount || parseFloat(formData.amount) <= 0) {
            haptics.warning();
            showAlert({ title: 'Missing Amount', message: 'Please enter a valid amount.', type: 'warning' });
            return false;
        }
        if (formData.isSplit) {
            const validSplits = formData.splits.filter((s) => s.category && parseFloat(s.amount) > 0);
            if (validSplits.length < 2) {
                haptics.warning();
                showAlert({ title: 'Invalid Split', message: 'Please fill at least 2 split categories with amounts.', type: 'warning' });
                return false;
            }
            const splitTotal = validSplits.reduce((sum, s) => sum + parseFloat(s.amount), 0);
            const total = parseFloat(formData.amount);
            if (Math.abs(splitTotal - total) > 0.01) {
                haptics.warning();
                showAlert({ title: 'Split Mismatch', message: `Split amounts (${currency.symbol}${splitTotal.toFixed(2)}) don't match the total (${currency.symbol}${total.toFixed(2)}).`, type: 'warning' });
                return false;
            }
        } else if (!formData.category) {
            haptics.warning();
            showAlert({ title: 'Missing Category', message: 'Please select a category.', type: 'warning' });
            return false;
        }
        return true;
    };

    const handleSave = async () => {
        if (!validateForm() || isSaving) return;
        setIsSaving(true);
        try {
            let success;
            if (isEditMode) {
                const updated = {
                    ...editTransaction,
                    type: formData.type,
                    amount: parseFloat(formData.amount),
                    category: formData.category.id,
                    note: formData.note.trim(),
                    tags: formData.tags,
                    receiptUri: formData.receiptUri,
                };
                success = await storageService.updateTransaction(updated);
            } else {
                const validSplits = formData.isSplit
                    ? formData.splits.filter((s) => s.category && parseFloat(s.amount) > 0).map((s) => ({ category: s.category, amount: parseFloat(s.amount) }))
                    : null;
                const transaction = createTransaction({
                    type: formData.type,
                    amount: formData.amount,
                    category: formData.isSplit ? validSplits[0].category : formData.category.id,
                    note: formData.note.trim(),
                    tags: formData.tags,
                    receiptUri: formData.receiptUri,
                    accountId: formData.accountId,
                    splits: validSplits,
                });
                success = await storageService.saveTransaction(transaction);
            }
            if (success) {
                haptics.success();

                // Check budget limit for expense categories
                let budgetWarning = '';
                if (formData.type === TRANSACTION_TYPES.EXPENSE && formData.category) {
                    budgetWarning = await getBudgetWarning(formData.category.id);
                }

                const saveMsg = `${formData.type === TRANSACTION_TYPES.INCOME ? 'Income' : 'Expense'} of ${currency.symbol}${formData.amount} ${isEditMode ? 'updated' : 'saved'} successfully.`;

                if (budgetWarning) {
                    haptics.warning();
                    showAlert({
                        title: '⚠️ Budget Alert',
                        message: `${saveMsg}\n\n${budgetWarning}`,
                        type: 'expense',
                        buttons: [{ text: 'Got it' }],
                    });
                } else {
                    showAlert({
                        title: isEditMode ? 'Updated!' : 'Saved!',
                        message: saveMsg,
                        type: formData.type === TRANSACTION_TYPES.INCOME ? 'income' : 'expense',
                    });
                }

                setFormData(INITIAL_STATE);
                if (isEditMode) navigation.setParams({ transaction: undefined });
            } else {
                showAlert({ title: 'Error', message: 'Failed to save. Please try again.', type: 'error' });
            }
        } catch (err) {
            haptics.error();
            showAlert({ title: 'Error', message: 'Something went wrong. Please try again.', type: 'error' });
        } finally {
            setIsSaving(false);
        }
    };

    const getBudgetWarning = async (categoryId) => {
        try {
            const budgetData = await AsyncStorage.getItem(STORAGE_KEYS.BUDGETS);
            if (!budgetData) return '';
            const budgets = JSON.parse(budgetData);
            const limit = budgets[categoryId];
            if (!limit) return '';

            const allTxns = await storageService.getTransactions();
            const { start, end } = getMonthRange();
            const monthExpenses = filterByDateRange(allTxns, start, end)
                .filter((t) => t.type === TRANSACTION_TYPES.EXPENSE && t.category === categoryId);
            const totalSpent = monthExpenses.reduce((sum, t) => sum + t.amount, 0);

            const catLabel = formData.category?.label || 'this category';
            const fmtSpent = currency.symbol + formatAmount(totalSpent, currency.code);
            const fmtLimit = currency.symbol + formatAmount(limit, currency.code);

            if (totalSpent > limit) {
                const overBy = currency.symbol + formatAmount(totalSpent - limit, currency.code);
                // Send push notification for budget exceeded
                notificationService.sendBudgetAlert(catLabel, 100, totalSpent, limit, currency.symbol, currency.code);
                return `🚨 You've exceeded your ${catLabel} budget!\n\nSpent: ${fmtSpent} / ${fmtLimit}\nOver by: ${overBy}`;
            } else if (totalSpent / limit >= 0.8) {
                const pct = Math.round((totalSpent / limit) * 100);
                // Send push notification for budget warning
                notificationService.sendBudgetAlert(catLabel, pct, totalSpent, limit, currency.symbol, currency.code);
                return `⚡ ${pct}% of your ${catLabel} budget used!\n\nSpent: ${fmtSpent} / ${fmtLimit}`;
            }
            return '';
        } catch (e) {
            return '';
        }
    };

    const isExpense = formData.type === TRANSACTION_TYPES.EXPENSE;
    const accentColor = isExpense ? colors.danger : colors.accent;

    return (
        <ScreenContainer>
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                style={styles.flex}
            >
                <ScrollView
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={styles.scrollContent}
                    keyboardShouldPersistTaps="handled"
                >
                    <Text style={[styles.header, { color: colors.text }]}>
                        {isEditMode ? 'Edit Transaction' : 'Add Transaction'}
                    </Text>

                    <TypeToggle selectedType={formData.type} onToggle={handleTypeToggle} />

                    {/* Account Picker */}
                    <AccountPicker
                        selected={formData.accountId}
                        onSelect={(id) => setFormData((prev) => ({ ...prev, accountId: id }))}
                    />

                    <View style={styles.amountContainer}>
                        <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>Amount</Text>
                        <View style={[styles.amountInputRow, { backgroundColor: colors.card, borderColor: accentColor }]}>
                            <Text style={[styles.currencySymbol, { color: accentColor }]}>{currency.symbol}</Text>
                            <TextInput
                                style={[styles.amountInput, { color: colors.text }]}
                                placeholder="0.00"
                                placeholderTextColor={colors.tabInactive}
                                keyboardType="decimal-pad"
                                value={formData.amount}
                                onChangeText={handleAmountChange}
                                maxLength={12}
                            />
                        </View>
                    </View>

                    {/* Category or Split */}
                    {formData.type === TRANSACTION_TYPES.EXPENSE && (
                        <View style={styles.splitToggleContainer}>
                            <TouchableOpacity
                                style={[
                                    styles.splitToggle,
                                    {
                                        backgroundColor: formData.isSplit ? `${colors.primary}18` : colors.card,
                                        borderColor: formData.isSplit ? colors.primary : colors.border,
                                    },
                                ]}
                                onPress={() => setFormData((prev) => ({ ...prev, isSplit: !prev.isSplit, category: null }))}
                                activeOpacity={0.7}
                            >
                                <Ionicons name="git-branch-outline" size={18} color={formData.isSplit ? colors.primary : colors.textSecondary} />
                                <Text style={[styles.splitToggleText, { color: formData.isSplit ? colors.primary : colors.textSecondary }]}>
                                    Split Transaction
                                </Text>
                            </TouchableOpacity>
                        </View>
                    )}

                    {formData.isSplit ? (
                        <SplitInput
                            totalAmount={formData.amount}
                            type={formData.type}
                            splits={formData.splits}
                            onSplitsChange={(splits) => setFormData((prev) => ({ ...prev, splits }))}
                        />
                    ) : (
                        <CategoryPicker
                            categories={categories}
                            selectedCategory={formData.category}
                            onSelect={handleCategorySelect}
                        />
                    )}

                    <View style={styles.noteContainer}>
                        <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>Note (optional)</Text>
                        <View style={[styles.noteInputRow, { backgroundColor: colors.card, borderColor: colors.border }]}>
                            <Ionicons
                                name="create-outline"
                                size={20}
                                color={colors.textSecondary}
                                style={styles.noteIcon}
                            />
                            <TextInput
                                style={[styles.noteInput, { color: colors.text }]}
                                placeholder="Add a note..."
                                placeholderTextColor={colors.tabInactive}
                                value={formData.note}
                                onChangeText={handleNoteChange}
                                maxLength={100}
                                multiline
                            />
                        </View>
                    </View>

                    {/* Tags */}
                    <View style={styles.noteContainer}>
                        <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>Tags (optional)</Text>
                        <View style={[styles.noteInputRow, { backgroundColor: colors.card, borderColor: colors.border }]}>
                            <Ionicons
                                name="pricetag-outline"
                                size={20}
                                color={colors.textSecondary}
                                style={styles.noteIcon}
                            />
                            <TextInput
                                style={[styles.noteInput, { color: colors.text, flex: 1 }]}
                                placeholder="Type tag, press enter..."
                                placeholderTextColor={colors.tabInactive}
                                value={formData.tagInput}
                                onChangeText={handleTagInputChange}
                                onSubmitEditing={handleAddTag}
                                returnKeyType="done"
                                maxLength={20}
                            />
                        </View>
                        {formData.tags.length > 0 && (
                            <View style={styles.tagsRow}>
                                {formData.tags.map((tag) => (
                                    <TouchableOpacity
                                        key={tag}
                                        style={[styles.tagChip, { backgroundColor: `${accentColor}18` }]}
                                        onPress={() => handleRemoveTag(tag)}
                                        activeOpacity={0.7}
                                    >
                                        <Text style={[styles.tagText, { color: accentColor }]}>#{tag}</Text>
                                        <Ionicons name="close" size={14} color={accentColor} />
                                    </TouchableOpacity>
                                ))}
                            </View>
                        )}
                    </View>

                    {/* Receipt Picker */}
                    <ReceiptPicker
                        receiptUri={formData.receiptUri}
                        onPick={handleReceiptPick}
                        onRemove={handleReceiptRemove}
                        onScanResult={handleScanResult}
                    />

                    <TouchableOpacity
                        style={[styles.saveButton, { backgroundColor: accentColor }]}
                        onPress={handleSave}
                        activeOpacity={0.8}
                        disabled={isSaving}
                    >
                        <Ionicons
                            name={isEditMode ? 'checkmark-done-circle-outline' : 'checkmark-circle-outline'}
                            size={22}
                            color="#FFF"
                        />
                        <Text style={styles.saveButtonText}>
                            {isSaving
                                ? (isEditMode ? 'Updating...' : 'Saving...')
                                : (isEditMode ? 'Update Transaction' : 'Save Transaction')
                            }
                        </Text>
                    </TouchableOpacity>

                    {isEditMode && (
                        <TouchableOpacity
                            style={styles.cancelButton}
                            onPress={() => {
                                setFormData(INITIAL_STATE);
                                navigation.setParams({ transaction: undefined });
                            }}
                            activeOpacity={0.7}
                        >
                            <Text style={[styles.cancelText, { color: colors.textSecondary }]}>Cancel Edit</Text>
                        </TouchableOpacity>
                    )}
                </ScrollView>
            </KeyboardAvoidingView>
        </ScreenContainer>
    );
};

const styles = StyleSheet.create({
    flex: { flex: 1 },
    scrollContent: { paddingBottom: SPACING.xl + 20 },
    header: {
        fontSize: FONT_SIZE.xxl,
        fontWeight: '700',
        marginBottom: SPACING.lg,
    },
    amountContainer: { marginTop: SPACING.lg },
    sectionLabel: {
        fontSize: FONT_SIZE.md,
        fontWeight: '600',
        marginBottom: SPACING.sm,
    },
    amountInputRow: {
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius: 12,
        borderWidth: 2,
        paddingHorizontal: SPACING.md,
        paddingVertical: SPACING.sm,
    },
    currencySymbol: {
        fontSize: FONT_SIZE.xxl,
        fontWeight: '700',
        marginRight: SPACING.sm,
    },
    amountInput: {
        flex: 1,
        fontSize: FONT_SIZE.xxl,
        fontWeight: '600',
        paddingVertical: SPACING.xs,
    },
    noteContainer: { marginTop: SPACING.lg },
    noteInputRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        borderRadius: 12,
        borderWidth: 1,
        paddingHorizontal: SPACING.md,
        paddingVertical: SPACING.sm + 2,
    },
    noteIcon: {
        marginTop: 4,
        marginRight: SPACING.sm,
    },
    noteInput: {
        flex: 1,
        fontSize: FONT_SIZE.md,
        minHeight: 44,
        textAlignVertical: 'top',
    },
    saveButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: SPACING.md,
        borderRadius: 14,
        marginTop: SPACING.xl,
        gap: SPACING.sm,
    },
    saveButtonText: {
        fontSize: FONT_SIZE.lg,
        fontWeight: '700',
        color: '#FFF',
    },
    cancelButton: {
        alignItems: 'center',
        paddingVertical: SPACING.md,
        marginTop: SPACING.sm,
    },
    cancelText: {
        fontSize: FONT_SIZE.md,
        fontWeight: '600',
    },
    tagsRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: SPACING.xs,
        marginTop: SPACING.sm,
    },
    tagChip: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: SPACING.sm,
        paddingVertical: 4,
        borderRadius: 12,
        gap: 4,
    },
    tagText: {
        fontSize: FONT_SIZE.sm,
        fontWeight: '600',
    },
    splitToggleContainer: {
        marginTop: SPACING.md,
        marginBottom: SPACING.xs,
    },
    splitToggle: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: SPACING.xs,
        alignSelf: 'flex-start',
        paddingHorizontal: SPACING.md,
        paddingVertical: SPACING.xs + 2,
        borderRadius: 10,
        borderWidth: 1,
    },
    splitToggleText: {
        fontSize: FONT_SIZE.sm,
        fontWeight: '600',
    },
});

export default AddTransactionScreen;

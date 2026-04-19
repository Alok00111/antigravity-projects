// File: src/screens/RecurringScreen.js

import React, { useState, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TextInput,
    TouchableOpacity,
    FlatList,
    Switch,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import { useTheme } from '../context/ThemeContext';
import ScreenContainer from '../components/ScreenContainer';
import TypeToggle from '../components/TypeToggle';
import {
    FONT_SIZE,
    SPACING,
    STORAGE_KEYS,
    TRANSACTION_TYPES,
} from '../utils/constants';
import { formatAmount } from '../utils/currencies';
import { getCategoriesByType, getCategoryById } from '../utils/categories';
import { useAlert } from '../context/AlertContext';
import billReminderService, { REMINDER_OPTIONS } from '../services/billReminderService';

const FREQUENCIES = [
    { key: 'daily', label: 'Daily' },
    { key: 'weekly', label: 'Weekly' },
    { key: 'biweekly', label: 'Bi-weekly' },
    { key: 'monthly', label: 'Monthly' },
];

const RecurringScreen = () => {
    const { colors, currency } = useTheme();
    const { showAlert } = useAlert();
    const [rules, setRules] = useState([]);
    const [showForm, setShowForm] = useState(false);
    const [type, setType] = useState(TRANSACTION_TYPES.EXPENSE);
    const [amount, setAmount] = useState('');
    const [selectedCategory, setSelectedCategory] = useState(null);
    const [frequency, setFrequency] = useState('monthly');
    const [note, setNote] = useState('');

    const loadRules = useCallback(async () => {
        try {
            const data = await AsyncStorage.getItem(STORAGE_KEYS.RECURRING_RULES);
            if (data) setRules(JSON.parse(data));
        } catch (e) {
            console.error('Error loading recurring rules:', e);
        }
    }, []);

    useFocusEffect(
        useCallback(() => {
            loadRules();
        }, [loadRules])
    );

    const saveRules = async (newRules) => {
        try {
            await AsyncStorage.setItem(STORAGE_KEYS.RECURRING_RULES, JSON.stringify(newRules));
            setRules(newRules);
        } catch (e) {
            showAlert({ title: 'Error', message: 'Failed to save recurring rules.', type: 'error' });
        }
    };

    const handleAddRule = () => {
        const parsedAmount = parseFloat(amount);
        if (isNaN(parsedAmount) || parsedAmount <= 0) {
            showAlert({ title: 'Invalid Amount', message: 'Enter a valid amount.', type: 'warning' });
            return;
        }
        if (!selectedCategory) {
            showAlert({ title: 'No Category', message: 'Please select a category.', type: 'warning' });
            return;
        }

        const newRule = {
            id: Date.now().toString(),
            type,
            amount: parsedAmount,
            category: selectedCategory.id,
            frequency,
            note: note.trim(),
            createdAt: new Date().toISOString(),
        };

        const newRules = [...rules, newRule];
        saveRules(newRules);
        setShowForm(false);
        setAmount('');
        setSelectedCategory(null);
        setFrequency('monthly');
        setNote('');
    };

    const handleDeleteRule = (ruleId) => {
        showAlert({
            title: 'Delete Rule',
            message: 'Remove this recurring rule?',
            type: 'confirm',
            buttons: [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: () => {
                        const newRules = rules.filter((r) => r.id !== ruleId);
                        saveRules(newRules);
                    },
                },
            ],
        });
    };

    const handleToggleReminder = async (rule) => {
        const newEnabled = !rule.reminderEnabled;
        if (newEnabled) {
            // Show picker for reminder timing
            showAlert({
                title: '🔔 Remind Me',
                message: 'When should we remind you?',
                type: 'info',
                buttons: [
                    ...REMINDER_OPTIONS.map((opt) => ({
                        text: opt.label,
                        onPress: async () => {
                            const updated = await billReminderService.updateRuleReminder(rule.id, true, opt.key);
                            if (updated) setRules(updated);
                        },
                    })),
                    { text: 'Cancel', style: 'cancel' },
                ],
            });
        } else {
            const updated = await billReminderService.updateRuleReminder(rule.id, false);
            if (updated) setRules(updated);
        }
    };

    const categories = getCategoriesByType(type);

    const renderRule = ({ item }) => {
        const cat = getCategoryById(item.category);
        const isExpense = item.type === TRANSACTION_TYPES.EXPENSE;
        const freqLabel = FREQUENCIES.find((f) => f.key === item.frequency)?.label || item.frequency;

        return (
            <View style={[styles.ruleCard, { backgroundColor: colors.card }]}>
                <View style={styles.ruleHeader}>
                    <View style={[styles.iconCircle, { backgroundColor: cat ? `${cat.color}18` : `${colors.textSecondary}18` }]}>
                        <Ionicons
                            name={cat?.icon || 'help-circle-outline'}
                            size={20}
                            color={cat?.color || colors.textSecondary}
                        />
                    </View>
                    <View style={styles.ruleInfo}>
                        <Text style={[styles.ruleLabel, { color: colors.text }]}>
                            {cat?.label || 'Unknown'}
                        </Text>
                        <View style={styles.ruleMetaRow}>
                            <View style={[styles.badge, { backgroundColor: `${colors.primary}18` }]}>
                                <Text style={[styles.badgeText, { color: colors.primary }]}>
                                    {freqLabel}
                                </Text>
                            </View>
                            <Text style={[styles.ruleType, { color: isExpense ? colors.danger : colors.success }]}>
                                {isExpense ? 'Expense' : 'Income'}
                            </Text>
                        </View>
                    </View>
                    <View style={styles.ruleRight}>
                        <Text style={[styles.ruleAmount, { color: isExpense ? colors.danger : colors.success }]}>
                            {isExpense ? '-' : '+'}{currency.symbol}{formatAmount(item.amount, currency.code, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </Text>
                        <TouchableOpacity
                            onPress={() => handleDeleteRule(item.id)}
                            activeOpacity={0.6}
                            style={styles.deleteIcon}
                        >
                            <Ionicons name="trash-outline" size={18} color={colors.danger} />
                        </TouchableOpacity>
                    </View>
                </View>
                {item.note ? (
                    <Text style={[styles.ruleNote, { color: colors.textSecondary }]}>{item.note}</Text>
                ) : null}
                {/* Reminder toggle */}
                <View style={[styles.reminderRow, { borderTopColor: colors.border }]}>
                    <View style={styles.reminderLeft}>
                        <Ionicons
                            name={item.reminderEnabled ? 'notifications' : 'notifications-outline'}
                            size={16}
                            color={item.reminderEnabled ? '#F59E0B' : colors.textSecondary}
                        />
                        <Text style={[styles.reminderText, { color: item.reminderEnabled ? colors.text : colors.textSecondary }]}>
                            {item.reminderEnabled
                                ? `Reminder ${REMINDER_OPTIONS.find((o) => o.key === (item.reminderDaysBefore ?? 1))?.label || '1 day before'}`
                                : 'No reminder'}
                        </Text>
                    </View>
                    <Switch
                        value={!!item.reminderEnabled}
                        onValueChange={() => handleToggleReminder(item)}
                        trackColor={{ false: colors.border, true: `${colors.primary}60` }}
                        thumbColor={item.reminderEnabled ? colors.primary : '#ccc'}
                    />
                </View>
            </View>
        );
    };

    return (
        <ScreenContainer>
            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
            >
                <Text style={[styles.header, { color: colors.text }]}>Recurring Transactions</Text>
                <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
                    Automate your regular bills & income
                </Text>

                {!showForm && (
                    <TouchableOpacity
                        style={[styles.addBtn, { backgroundColor: colors.primary }]}
                        onPress={() => setShowForm(true)}
                        activeOpacity={0.8}
                    >
                        <Ionicons name="add-circle-outline" size={22} color="#FFF" />
                        <Text style={styles.addBtnText}>Add Recurring Rule</Text>
                    </TouchableOpacity>
                )}

                {showForm && (
                    <View style={[styles.formCard, { backgroundColor: colors.card }]}>
                        <TypeToggle selectedType={type} onToggle={setType} />

                        <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>Amount</Text>
                        <View style={[styles.amountRow, { backgroundColor: colors.background, borderColor: colors.border }]}>
                            <Text style={[styles.currencySymbol, { color: colors.primary }]}>{currency.symbol}</Text>
                            <TextInput
                                style={[styles.amountInput, { color: colors.text }]}
                                placeholder="0.00"
                                placeholderTextColor={colors.tabInactive}
                                keyboardType="decimal-pad"
                                value={amount}
                                onChangeText={setAmount}
                            />
                        </View>

                        <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>Category</Text>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                            <View style={styles.catRow}>
                                {categories.map((cat) => (
                                    <TouchableOpacity
                                        key={cat.id}
                                        style={[
                                            styles.catChip,
                                            { backgroundColor: colors.background, borderColor: colors.border },
                                            selectedCategory?.id === cat.id && { borderColor: cat.color, borderWidth: 2 },
                                        ]}
                                        onPress={() => setSelectedCategory(cat)}
                                    >
                                        <Ionicons name={cat.icon} size={16} color={cat.color} />
                                        <Text style={[styles.catChipText, { color: colors.text }]}>{cat.label}</Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </ScrollView>

                        <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>Frequency</Text>
                        <View style={styles.freqRow}>
                            {FREQUENCIES.map((f) => (
                                <TouchableOpacity
                                    key={f.key}
                                    style={[
                                        styles.freqChip,
                                        { backgroundColor: colors.background, borderColor: colors.border },
                                        frequency === f.key && { backgroundColor: colors.primary, borderColor: colors.primary },
                                    ]}
                                    onPress={() => setFrequency(f.key)}
                                >
                                    <Text
                                        style={[
                                            styles.freqText,
                                            { color: colors.textSecondary },
                                            frequency === f.key && { color: '#FFF' },
                                        ]}
                                    >
                                        {f.label}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>

                        <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>Note (optional)</Text>
                        <TextInput
                            style={[styles.noteInput, { backgroundColor: colors.background, borderColor: colors.border, color: colors.text }]}
                            placeholder="e.g., Netflix subscription"
                            placeholderTextColor={colors.tabInactive}
                            value={note}
                            onChangeText={setNote}
                        />

                        <View style={styles.formActions}>
                            <TouchableOpacity
                                style={[styles.formSaveBtn, { backgroundColor: colors.primary }]}
                                onPress={handleAddRule}
                            >
                                <Text style={styles.formSaveBtnText}>Save Rule</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.formCancelBtn, { borderColor: colors.border }]}
                                onPress={() => setShowForm(false)}
                            >
                                <Text style={[styles.formCancelText, { color: colors.textSecondary }]}>Cancel</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                )}

                {rules.length > 0 && (
                    <View style={styles.rulesSection}>
                        <Text style={[styles.sectionTitle, { color: colors.text }]}>
                            Active Rules ({rules.length})
                        </Text>
                        <FlatList
                            data={rules}
                            renderItem={renderRule}
                            keyExtractor={(item) => item.id}
                            scrollEnabled={false}
                        />
                    </View>
                )}

                {rules.length === 0 && !showForm && (
                    <View style={styles.emptyState}>
                        <Ionicons name="repeat-outline" size={48} color={colors.tabInactive} />
                        <Text style={[styles.emptyTitle, { color: colors.text }]}>No recurring rules yet</Text>
                        <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
                            Add rules to automate your regular transactions
                        </Text>
                    </View>
                )}
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
    addBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: SPACING.sm,
        paddingVertical: SPACING.md,
        borderRadius: 14,
        marginBottom: SPACING.lg,
    },
    addBtnText: {
        color: '#FFF',
        fontSize: FONT_SIZE.md,
        fontWeight: '700',
    },
    formCard: {
        borderRadius: 14,
        padding: SPACING.md,
        marginBottom: SPACING.lg,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 8,
        elevation: 3,
    },
    fieldLabel: {
        fontSize: FONT_SIZE.sm,
        fontWeight: '600',
        marginTop: SPACING.md,
        marginBottom: SPACING.sm,
    },
    amountRow: {
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius: 10,
        borderWidth: 1,
        paddingHorizontal: SPACING.md,
    },
    currencySymbol: {
        fontSize: FONT_SIZE.xl,
        fontWeight: '700',
        marginRight: SPACING.sm,
    },
    amountInput: {
        flex: 1,
        fontSize: FONT_SIZE.xl,
        fontWeight: '600',
        paddingVertical: SPACING.sm,
    },
    catRow: {
        flexDirection: 'row',
        gap: SPACING.sm,
    },
    catChip: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        paddingHorizontal: SPACING.sm + 4,
        paddingVertical: SPACING.xs + 2,
        borderRadius: 20,
        borderWidth: 1,
    },
    catChipText: {
        fontSize: FONT_SIZE.sm,
        fontWeight: '600',
    },
    freqRow: {
        flexDirection: 'row',
        gap: SPACING.sm,
        flexWrap: 'wrap',
    },
    freqChip: {
        paddingHorizontal: SPACING.md,
        paddingVertical: SPACING.xs + 2,
        borderRadius: 20,
        borderWidth: 1,
    },
    freqText: {
        fontSize: FONT_SIZE.sm,
        fontWeight: '600',
    },
    noteInput: {
        borderRadius: 10,
        borderWidth: 1,
        paddingHorizontal: SPACING.md,
        paddingVertical: SPACING.sm,
        fontSize: FONT_SIZE.md,
    },
    formActions: {
        flexDirection: 'row',
        gap: SPACING.sm,
        marginTop: SPACING.lg,
    },
    formSaveBtn: {
        flex: 1,
        alignItems: 'center',
        paddingVertical: SPACING.sm + 4,
        borderRadius: 12,
    },
    formSaveBtnText: {
        color: '#FFF',
        fontSize: FONT_SIZE.md,
        fontWeight: '700',
    },
    formCancelBtn: {
        flex: 1,
        alignItems: 'center',
        paddingVertical: SPACING.sm + 4,
        borderRadius: 12,
        borderWidth: 1,
    },
    formCancelText: {
        fontSize: FONT_SIZE.md,
        fontWeight: '600',
    },
    rulesSection: {
        marginTop: SPACING.sm,
    },
    sectionTitle: {
        fontSize: FONT_SIZE.lg,
        fontWeight: '700',
        marginBottom: SPACING.md,
    },
    ruleCard: {
        borderRadius: 14,
        padding: SPACING.md,
        marginBottom: SPACING.sm,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.04,
        shadowRadius: 4,
        elevation: 2,
    },
    ruleHeader: {
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
    ruleInfo: {
        flex: 1,
        marginLeft: SPACING.sm,
    },
    ruleLabel: {
        fontSize: FONT_SIZE.md,
        fontWeight: '600',
    },
    ruleMetaRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: SPACING.sm,
        marginTop: 4,
    },
    badge: {
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 6,
    },
    badgeText: {
        fontSize: FONT_SIZE.sm - 1,
        fontWeight: '600',
    },
    ruleType: {
        fontSize: FONT_SIZE.sm,
        fontWeight: '600',
    },
    ruleRight: {
        alignItems: 'flex-end',
    },
    ruleAmount: {
        fontSize: FONT_SIZE.md,
        fontWeight: '700',
    },
    deleteIcon: {
        marginTop: 6,
    },
    ruleNote: {
        fontSize: FONT_SIZE.sm,
        marginTop: SPACING.sm,
        marginLeft: 50,
    },
    emptyState: {
        alignItems: 'center',
        paddingVertical: SPACING.xl * 2,
    },
    emptyTitle: {
        fontSize: FONT_SIZE.lg,
        fontWeight: '700',
        marginTop: SPACING.md,
    },
    emptySubtitle: {
        fontSize: FONT_SIZE.md,
        marginTop: SPACING.sm,
        textAlign: 'center',
    },
    reminderRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginTop: SPACING.sm,
        paddingTop: SPACING.sm,
        borderTopWidth: 1,
    },
    reminderLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    reminderText: {
        fontSize: FONT_SIZE.sm,
        fontWeight: '600',
    },
});

export default RecurringScreen;

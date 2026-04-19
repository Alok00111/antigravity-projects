// File: src/screens/DebtsScreen.js
// Full debt/loan tracker with summary cards, add form, and payment tracking

import React, { useState, useCallback, useMemo } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    TextInput,
    RefreshControl,
    Modal,
    KeyboardAvoidingView,
    Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useTheme } from '../context/ThemeContext';
import { useAlert } from '../context/AlertContext';
import ScreenContainer from '../components/ScreenContainer';
import EmptyState from '../components/EmptyState';
import { FONT_SIZE, SPACING } from '../utils/constants';
import { formatAmount } from '../utils/currencies';
import debtService from '../services/debtService';

const TAB_FILTERS = ['All', 'Lent', 'Borrowed', 'Settled'];

const DebtsScreen = () => {
    const { colors, isDark, currency } = useTheme();
    const { showAlert } = useAlert();
    const [debts, setDebts] = useState([]);
    const [activeTab, setActiveTab] = useState('All');
    const [refreshing, setRefreshing] = useState(false);
    const [showAddModal, setShowAddModal] = useState(false);
    const [showPaymentModal, setShowPaymentModal] = useState(null);

    // Add form state
    const [formData, setFormData] = useState({
        personName: '',
        amount: '',
        type: 'lent',
        description: '',
        dueDate: '',
    });
    const [paymentAmount, setPaymentAmount] = useState('');
    const [paymentNote, setPaymentNote] = useState('');

    const loadDebts = useCallback(async () => {
        const data = await debtService.getDebts();
        setDebts(data);
    }, []);

    useFocusEffect(
        useCallback(() => {
            loadDebts();
        }, [loadDebts])
    );

    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        await loadDebts();
        setRefreshing(false);
    }, [loadDebts]);

    const totals = useMemo(() => debtService.getTotals(debts), [debts]);

    const filtered = useMemo(() => {
        switch (activeTab) {
            case 'Lent':
                return debts.filter((d) => d.type === 'lent' && !d.settled);
            case 'Borrowed':
                return debts.filter((d) => d.type === 'borrowed' && !d.settled);
            case 'Settled':
                return debts.filter((d) => d.settled);
            default:
                return debts;
        }
    }, [debts, activeTab]);

    const handleAddDebt = async () => {
        if (!formData.personName.trim()) {
            showAlert({ title: 'Missing Name', message: 'Please enter the person\'s name.', type: 'warning' });
            return;
        }
        const amount = parseFloat(formData.amount);
        if (isNaN(amount) || amount <= 0) {
            showAlert({ title: 'Invalid Amount', message: 'Please enter a valid amount.', type: 'warning' });
            return;
        }

        const updated = await debtService.addDebt({
            personName: formData.personName.trim(),
            amount,
            type: formData.type,
            description: formData.description.trim(),
            dueDate: formData.dueDate || null,
        });
        setDebts(updated);
        setShowAddModal(false);
        setFormData({ personName: '', amount: '', type: 'lent', description: '', dueDate: '' });
        showAlert({ title: '✅ Added', message: `${formData.type === 'lent' ? 'Lent to' : 'Borrowed from'} ${formData.personName}`, type: 'success' });
    };

    const handleAddPayment = async () => {
        const amount = parseFloat(paymentAmount);
        if (isNaN(amount) || amount <= 0) {
            showAlert({ title: 'Invalid Amount', message: 'Enter a valid payment amount.', type: 'warning' });
            return;
        }
        const updated = await debtService.addPayment(showPaymentModal.id, { amount, note: paymentNote });
        setDebts(updated);
        setShowPaymentModal(null);
        setPaymentAmount('');
        setPaymentNote('');
        showAlert({ title: '💰 Payment Recorded', message: `${currency.symbol}${formatAmount(amount, currency.code)} recorded`, type: 'success' });
    };

    const handleSettle = (debt) => {
        showAlert({
            title: 'Mark as Settled?',
            message: `Mark the ${debt.type === 'lent' ? 'loan to' : 'debt from'} ${debt.personName} as fully settled?`,
            type: 'confirm',
            buttons: [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Settle',
                    onPress: async () => {
                        const updated = await debtService.settleDebt(debt.id);
                        setDebts(updated);
                        showAlert({ title: '✅ Settled', message: `Debt with ${debt.personName} settled.`, type: 'success' });
                    },
                },
            ],
        });
    };

    const handleDelete = (debt) => {
        showAlert({
            title: 'Delete Debt?',
            message: `Remove the record with ${debt.personName}?`,
            type: 'confirm',
            buttons: [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        const updated = await debtService.deleteDebt(debt.id);
                        setDebts(updated);
                    },
                },
            ],
        });
    };

    const getPaid = (debt) => (debt.partialPayments || []).reduce((s, p) => s + p.amount, 0);
    const getRemaining = (debt) => Math.max(0, debt.amount - getPaid(debt));

    const isOverdue = (debt) => {
        if (!debt.dueDate || debt.settled) return false;
        return new Date(debt.dueDate) < new Date();
    };

    const renderDebtCard = (debt) => {
        const paid = getPaid(debt);
        const remaining = getRemaining(debt);
        const progress = debt.amount > 0 ? Math.min(paid / debt.amount, 1) : 0;
        const overdue = isOverdue(debt);
        const isLent = debt.type === 'lent';

        return (
            <View key={debt.id} style={[styles.debtCard, { backgroundColor: colors.card }]}>
                <View style={styles.cardHeader}>
                    <View style={[styles.avatar, { backgroundColor: isLent ? '#10B98118' : '#EF444418' }]}>
                        <Ionicons
                            name={isLent ? 'arrow-up-circle' : 'arrow-down-circle'}
                            size={24}
                            color={isLent ? '#10B981' : '#EF4444'}
                        />
                    </View>
                    <View style={{ flex: 1 }}>
                        <View style={styles.nameRow}>
                            <Text style={[styles.personName, { color: colors.text }]}>{debt.personName}</Text>
                            {overdue && (
                                <View style={styles.overdueBadge}>
                                    <Ionicons name="alert-circle" size={12} color="#EF4444" />
                                    <Text style={styles.overdueText}>Overdue</Text>
                                </View>
                            )}
                            {debt.settled && (
                                <View style={[styles.settledBadge, { backgroundColor: '#10B98118' }]}>
                                    <Ionicons name="checkmark-circle" size={12} color="#10B981" />
                                    <Text style={[styles.settledText, { color: '#10B981' }]}>Settled</Text>
                                </View>
                            )}
                        </View>
                        <Text style={[styles.debtType, { color: colors.textSecondary }]}>
                            {isLent ? 'You lent' : 'You borrowed'} · {new Date(debt.date).toLocaleDateString('en', { day: 'numeric', month: 'short' })}
                        </Text>
                    </View>
                    <View style={{ alignItems: 'flex-end' }}>
                        <Text style={[styles.debtAmount, { color: isLent ? '#10B981' : '#EF4444' }]}>
                            {currency.symbol}{formatAmount(debt.amount, currency.code)}
                        </Text>
                        {paid > 0 && (
                            <Text style={[styles.remainingText, { color: colors.textSecondary }]}>
                                {currency.symbol}{formatAmount(remaining, currency.code)} left
                            </Text>
                        )}
                    </View>
                </View>

                {/* Description */}
                {debt.description ? (
                    <Text style={[styles.description, { color: colors.textSecondary }]} numberOfLines={1}>
                        {debt.description}
                    </Text>
                ) : null}

                {/* Progress bar */}
                {paid > 0 && !debt.settled && (
                    <View style={[styles.progressTrack, { backgroundColor: colors.border }]}>
                        <View style={[styles.progressFill, { width: `${progress * 100}%`, backgroundColor: '#10B981' }]} />
                    </View>
                )}

                {/* Due date */}
                {debt.dueDate && !debt.settled && (
                    <View style={styles.dueDateRow}>
                        <Ionicons name="calendar-outline" size={12} color={overdue ? '#EF4444' : colors.textSecondary} />
                        <Text style={[styles.dueDateText, { color: overdue ? '#EF4444' : colors.textSecondary }]}>
                            Due {new Date(debt.dueDate).toLocaleDateString('en', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </Text>
                    </View>
                )}

                {/* Actions */}
                {!debt.settled && (
                    <View style={styles.actions}>
                        <TouchableOpacity
                            style={[styles.actionBtn, { backgroundColor: `${colors.primary}12`, borderColor: `${colors.primary}25` }]}
                            onPress={() => {
                                setShowPaymentModal(debt);
                                setPaymentAmount('');
                                setPaymentNote('');
                            }}
                            activeOpacity={0.7}
                        >
                            <Ionicons name="cash-outline" size={14} color={colors.primary} />
                            <Text style={[styles.actionBtnText, { color: colors.primary }]}>Payment</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.actionBtn, { backgroundColor: '#10B98112', borderColor: '#10B98125' }]}
                            onPress={() => handleSettle(debt)}
                            activeOpacity={0.7}
                        >
                            <Ionicons name="checkmark-circle-outline" size={14} color="#10B981" />
                            <Text style={[styles.actionBtnText, { color: '#10B981' }]}>Settle</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.actionBtn, { backgroundColor: '#EF444412', borderColor: '#EF444425' }]}
                            onPress={() => handleDelete(debt)}
                            activeOpacity={0.7}
                        >
                            <Ionicons name="trash-outline" size={14} color="#EF4444" />
                        </TouchableOpacity>
                    </View>
                )}
                {debt.settled && (
                    <View style={styles.actions}>
                        <TouchableOpacity
                            style={[styles.actionBtn, { backgroundColor: '#EF444412', borderColor: '#EF444425' }]}
                            onPress={() => handleDelete(debt)}
                            activeOpacity={0.7}
                        >
                            <Ionicons name="trash-outline" size={14} color="#EF4444" />
                            <Text style={[styles.actionBtnText, { color: '#EF4444' }]}>Remove</Text>
                        </TouchableOpacity>
                    </View>
                )}
            </View>
        );
    };

    const renderAddModal = () => (
        <Modal visible={showAddModal} transparent animationType="slide">
            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalOverlay}>
                <View style={[styles.modalCard, { backgroundColor: colors.card }]}>
                    <View style={styles.modalHeader}>
                        <Text style={[styles.modalTitle, { color: colors.text }]}>Add Debt / Loan</Text>
                        <TouchableOpacity onPress={() => setShowAddModal(false)}>
                            <Ionicons name="close-circle" size={28} color={colors.textSecondary} />
                        </TouchableOpacity>
                    </View>

                    {/* Type toggle */}
                    <View style={[styles.typeToggle, { backgroundColor: colors.background }]}>
                        <TouchableOpacity
                            style={[styles.typeBtn, formData.type === 'lent' && { backgroundColor: '#10B981' }]}
                            onPress={() => setFormData((p) => ({ ...p, type: 'lent' }))}
                            activeOpacity={0.7}
                        >
                            <Ionicons name="arrow-up-circle" size={16} color={formData.type === 'lent' ? '#FFF' : colors.textSecondary} />
                            <Text style={[styles.typeBtnText, { color: formData.type === 'lent' ? '#FFF' : colors.text }]}>I Lent</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.typeBtn, formData.type === 'borrowed' && { backgroundColor: '#EF4444' }]}
                            onPress={() => setFormData((p) => ({ ...p, type: 'borrowed' }))}
                            activeOpacity={0.7}
                        >
                            <Ionicons name="arrow-down-circle" size={16} color={formData.type === 'borrowed' ? '#FFF' : colors.textSecondary} />
                            <Text style={[styles.typeBtnText, { color: formData.type === 'borrowed' ? '#FFF' : colors.text }]}>I Borrowed</Text>
                        </TouchableOpacity>
                    </View>

                    {/* Form fields */}
                    <View style={[styles.formField, { borderColor: colors.border, backgroundColor: colors.background }]}>
                        <Ionicons name="person-outline" size={18} color={colors.textSecondary} />
                        <TextInput
                            style={[styles.formInput, { color: colors.text }]}
                            placeholder="Person's name"
                            placeholderTextColor={colors.tabInactive}
                            value={formData.personName}
                            onChangeText={(t) => setFormData((p) => ({ ...p, personName: t }))}
                        />
                    </View>
                    <View style={[styles.formField, { borderColor: colors.border, backgroundColor: colors.background }]}>
                        <Text style={[styles.currencyLabel, { color: colors.textSecondary }]}>{currency.symbol}</Text>
                        <TextInput
                            style={[styles.formInput, { color: colors.text }]}
                            placeholder="Amount"
                            placeholderTextColor={colors.tabInactive}
                            keyboardType="decimal-pad"
                            value={formData.amount}
                            onChangeText={(t) => setFormData((p) => ({ ...p, amount: t }))}
                        />
                    </View>
                    <View style={[styles.formField, { borderColor: colors.border, backgroundColor: colors.background }]}>
                        <Ionicons name="chatbox-outline" size={18} color={colors.textSecondary} />
                        <TextInput
                            style={[styles.formInput, { color: colors.text }]}
                            placeholder="Description (optional)"
                            placeholderTextColor={colors.tabInactive}
                            value={formData.description}
                            onChangeText={(t) => setFormData((p) => ({ ...p, description: t }))}
                        />
                    </View>

                    <TouchableOpacity
                        style={[styles.saveBtn, { backgroundColor: colors.primary }]}
                        onPress={handleAddDebt}
                        activeOpacity={0.8}
                    >
                        <Ionicons name="add-circle" size={20} color="#FFF" />
                        <Text style={styles.saveBtnText}>Add</Text>
                    </TouchableOpacity>
                </View>
            </KeyboardAvoidingView>
        </Modal>
    );

    const renderPaymentModal = () => (
        <Modal visible={!!showPaymentModal} transparent animationType="slide">
            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalOverlay}>
                <View style={[styles.modalCard, { backgroundColor: colors.card }]}>
                    <View style={styles.modalHeader}>
                        <Text style={[styles.modalTitle, { color: colors.text }]}>Record Payment</Text>
                        <TouchableOpacity onPress={() => setShowPaymentModal(null)}>
                            <Ionicons name="close-circle" size={28} color={colors.textSecondary} />
                        </TouchableOpacity>
                    </View>
                    {showPaymentModal && (
                        <Text style={[styles.paymentInfo, { color: colors.textSecondary }]}>
                            Remaining: {currency.symbol}{formatAmount(getRemaining(showPaymentModal), currency.code)} from {showPaymentModal.personName}
                        </Text>
                    )}
                    <View style={[styles.formField, { borderColor: colors.border, backgroundColor: colors.background }]}>
                        <Text style={[styles.currencyLabel, { color: colors.textSecondary }]}>{currency.symbol}</Text>
                        <TextInput
                            style={[styles.formInput, { color: colors.text }]}
                            placeholder="Payment amount"
                            placeholderTextColor={colors.tabInactive}
                            keyboardType="decimal-pad"
                            value={paymentAmount}
                            onChangeText={setPaymentAmount}
                            autoFocus
                        />
                    </View>
                    <View style={[styles.formField, { borderColor: colors.border, backgroundColor: colors.background }]}>
                        <Ionicons name="chatbox-outline" size={18} color={colors.textSecondary} />
                        <TextInput
                            style={[styles.formInput, { color: colors.text }]}
                            placeholder="Note (optional)"
                            placeholderTextColor={colors.tabInactive}
                            value={paymentNote}
                            onChangeText={setPaymentNote}
                        />
                    </View>
                    <TouchableOpacity
                        style={[styles.saveBtn, { backgroundColor: colors.primary }]}
                        onPress={handleAddPayment}
                        activeOpacity={0.8}
                    >
                        <Ionicons name="cash-outline" size={20} color="#FFF" />
                        <Text style={styles.saveBtnText}>Record Payment</Text>
                    </TouchableOpacity>
                </View>
            </KeyboardAvoidingView>
        </Modal>
    );

    return (
        <ScreenContainer>
            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} colors={[colors.primary]} />
                }
            >
                <Text style={[styles.header, { color: colors.text }]}>Debts & Loans</Text>
                <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
                    Track money lent and borrowed
                </Text>

                {/* Summary cards */}
                <View style={styles.summaryRow}>
                    <View style={[styles.summaryCard, { backgroundColor: '#10B98112', borderColor: '#10B98125' }]}>
                        <Ionicons name="arrow-up-circle" size={24} color="#10B981" />
                        <Text style={[styles.summaryLabel, { color: '#10B981' }]}>Owed to You</Text>
                        <Text style={[styles.summaryAmount, { color: '#10B981' }]}>
                            {currency.symbol}{formatAmount(totals.totalLent, currency.code)}
                        </Text>
                        <Text style={[styles.summaryCount, { color: '#10B98190' }]}>{totals.lentCount} active</Text>
                    </View>
                    <View style={[styles.summaryCard, { backgroundColor: '#EF444412', borderColor: '#EF444425' }]}>
                        <Ionicons name="arrow-down-circle" size={24} color="#EF4444" />
                        <Text style={[styles.summaryLabel, { color: '#EF4444' }]}>You Owe</Text>
                        <Text style={[styles.summaryAmount, { color: '#EF4444' }]}>
                            {currency.symbol}{formatAmount(totals.totalBorrowed, currency.code)}
                        </Text>
                        <Text style={[styles.summaryCount, { color: '#EF444490' }]}>{totals.borrowedCount} active</Text>
                    </View>
                </View>

                {/* Tab filter */}
                <View style={styles.tabRow}>
                    {TAB_FILTERS.map((tab) => {
                        const isActive = activeTab === tab;
                        return (
                            <TouchableOpacity
                                key={tab}
                                style={[
                                    styles.tabBtn,
                                    {
                                        backgroundColor: isActive ? colors.primary : colors.card,
                                        borderColor: isActive ? colors.primary : colors.border,
                                    },
                                ]}
                                onPress={() => setActiveTab(tab)}
                                activeOpacity={0.7}
                            >
                                <Text style={[styles.tabBtnText, { color: isActive ? '#FFF' : colors.text }]}>{tab}</Text>
                            </TouchableOpacity>
                        );
                    })}
                </View>

                {/* Debt list */}
                {filtered.length > 0 ? (
                    filtered.map(renderDebtCard)
                ) : (
                    <EmptyState
                        icon="people-outline"
                        title={activeTab === 'All' ? 'No debts yet' : `No ${activeTab.toLowerCase()} debts`}
                        subtitle="Tap + to add a new debt or loan"
                    />
                )}
            </ScrollView>

            {/* FAB */}
            <TouchableOpacity
                style={[styles.fab, { backgroundColor: colors.primary }]}
                onPress={() => setShowAddModal(true)}
                activeOpacity={0.8}
            >
                <Ionicons name="add" size={28} color="#FFF" />
            </TouchableOpacity>

            {renderAddModal()}
            {renderPaymentModal()}
        </ScreenContainer>
    );
};

const styles = StyleSheet.create({
    scrollContent: { paddingBottom: SPACING.xl + 60 },
    header: {
        fontSize: FONT_SIZE.xxl,
        fontWeight: '700',
        marginBottom: 4,
    },
    subtitle: {
        fontSize: FONT_SIZE.md,
        marginBottom: SPACING.lg,
    },
    summaryRow: {
        flexDirection: 'row',
        gap: SPACING.sm,
        marginBottom: SPACING.lg,
    },
    summaryCard: {
        flex: 1,
        borderRadius: 16,
        borderWidth: 1,
        padding: SPACING.md,
        alignItems: 'center',
        gap: 4,
    },
    summaryLabel: {
        fontSize: FONT_SIZE.sm,
        fontWeight: '600',
        marginTop: 4,
    },
    summaryAmount: {
        fontSize: FONT_SIZE.xl,
        fontWeight: '700',
    },
    summaryCount: {
        fontSize: FONT_SIZE.sm - 1,
        fontWeight: '500',
    },
    tabRow: {
        flexDirection: 'row',
        gap: SPACING.xs + 2,
        marginBottom: SPACING.md,
    },
    tabBtn: {
        paddingHorizontal: SPACING.sm + 4,
        paddingVertical: SPACING.xs + 2,
        borderRadius: 16,
        borderWidth: 1,
    },
    tabBtnText: {
        fontSize: FONT_SIZE.sm,
        fontWeight: '600',
    },
    debtCard: {
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
        gap: SPACING.sm,
    },
    avatar: {
        width: 42,
        height: 42,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    nameRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: SPACING.xs,
    },
    personName: {
        fontSize: FONT_SIZE.md,
        fontWeight: '700',
    },
    overdueBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 2,
        backgroundColor: '#EF444415',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 6,
    },
    overdueText: {
        fontSize: FONT_SIZE.sm - 2,
        fontWeight: '600',
        color: '#EF4444',
    },
    settledBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 2,
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 6,
    },
    settledText: {
        fontSize: FONT_SIZE.sm - 2,
        fontWeight: '600',
    },
    debtType: {
        fontSize: FONT_SIZE.sm,
        marginTop: 1,
    },
    debtAmount: {
        fontSize: FONT_SIZE.lg,
        fontWeight: '700',
    },
    remainingText: {
        fontSize: FONT_SIZE.sm - 1,
        marginTop: 1,
    },
    description: {
        fontSize: FONT_SIZE.sm,
        marginTop: SPACING.xs,
        marginLeft: 42 + SPACING.sm,
    },
    progressTrack: {
        height: 4,
        borderRadius: 2,
        marginTop: SPACING.sm,
        overflow: 'hidden',
    },
    progressFill: {
        height: '100%',
        borderRadius: 2,
    },
    dueDateRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        marginTop: SPACING.xs,
    },
    dueDateText: {
        fontSize: FONT_SIZE.sm - 1,
        fontWeight: '500',
    },
    actions: {
        flexDirection: 'row',
        gap: SPACING.xs + 2,
        marginTop: SPACING.sm,
    },
    actionBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        paddingHorizontal: SPACING.sm + 2,
        paddingVertical: SPACING.xs + 2,
        borderRadius: 8,
        borderWidth: 1,
    },
    actionBtnText: {
        fontSize: FONT_SIZE.sm - 1,
        fontWeight: '600',
    },
    fab: {
        position: 'absolute',
        right: SPACING.md,
        bottom: SPACING.lg,
        width: 56,
        height: 56,
        borderRadius: 28,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 6,
    },
    modalOverlay: {
        flex: 1,
        justifyContent: 'flex-end',
        backgroundColor: 'rgba(0,0,0,0.5)',
    },
    modalCard: {
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        padding: SPACING.lg,
        paddingBottom: SPACING.xl + 20,
    },
    modalHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: SPACING.lg,
    },
    modalTitle: {
        fontSize: FONT_SIZE.lg,
        fontWeight: '700',
    },
    typeToggle: {
        flexDirection: 'row',
        borderRadius: 12,
        padding: 4,
        marginBottom: SPACING.md,
    },
    typeBtn: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        paddingVertical: SPACING.sm + 2,
        borderRadius: 10,
    },
    typeBtnText: {
        fontSize: FONT_SIZE.md,
        fontWeight: '600',
    },
    formField: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: SPACING.sm,
        paddingHorizontal: SPACING.sm + 2,
        paddingVertical: Platform.OS === 'ios' ? SPACING.sm + 4 : SPACING.xs,
        borderWidth: 1,
        borderRadius: 12,
        marginBottom: SPACING.sm,
    },
    formInput: {
        flex: 1,
        fontSize: FONT_SIZE.md,
    },
    currencyLabel: {
        fontSize: FONT_SIZE.lg,
        fontWeight: '600',
    },
    paymentInfo: {
        fontSize: FONT_SIZE.sm,
        marginBottom: SPACING.md,
    },
    saveBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: SPACING.sm,
        paddingVertical: SPACING.sm + 4,
        borderRadius: 12,
        marginTop: SPACING.sm,
    },
    saveBtnText: {
        fontSize: FONT_SIZE.md,
        fontWeight: '700',
        color: '#FFF',
    },
});

export default DebtsScreen;

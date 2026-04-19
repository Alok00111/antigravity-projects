// File: src/screens/AccountsScreen.js

import React, { useState, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    TextInput,
    Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useTheme } from '../context/ThemeContext';
import { SPACING, FONT_SIZE } from '../utils/constants';
import ScreenContainer from '../components/ScreenContainer';
import accountService from '../services/accountService';
import { formatAmount } from '../utils/currencies';
import storageService from '../services/storageService';
import { useAlert } from '../context/AlertContext';
import * as haptics from '../utils/haptics';

const ACCOUNT_ICONS = [
    'cash-outline', 'wallet-outline', 'card-outline', 'business-outline',
    'phone-portrait-outline', 'logo-bitcoin', 'diamond-outline', 'briefcase-outline',
    'home-outline', 'car-outline', 'gift-outline', 'globe-outline',
];

const ACCOUNT_COLORS = [
    '#22C55E', '#3B82F6', '#F97316', '#8B5CF6',
    '#EC4899', '#14B8A6', '#EF4444', '#F59E0B',
    '#6366F1', '#06B6D4', '#D946EF', '#84CC16',
];

const AccountsScreen = () => {
    const { colors, currency } = useTheme();
    const { showAlert } = useAlert();
    const [accounts, setAccounts] = useState([]);
    const [transactions, setTransactions] = useState([]);
    const [modalVisible, setModalVisible] = useState(false);
    const [editingAccount, setEditingAccount] = useState(null);
    const [formName, setFormName] = useState('');
    const [formIcon, setFormIcon] = useState(ACCOUNT_ICONS[0]);
    const [formColor, setFormColor] = useState(ACCOUNT_COLORS[0]);

    const currencySymbol = currency?.symbol || '₹';

    useFocusEffect(
        useCallback(() => {
            loadData();
        }, [])
    );

    const loadData = async () => {
        const [accs, txns] = await Promise.all([
            accountService.getAccounts(),
            storageService.getTransactions(),
        ]);
        setAccounts(accs);
        setTransactions(txns);
    };

    const getAccountBalance = (accountId) => {
        const acctTxns = transactions.filter((t) => (t.accountId || 'cash') === accountId);
        const income = acctTxns.filter((t) => t.type === 'income').reduce((s, t) => s + t.amount, 0);
        const expense = acctTxns.filter((t) => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
        return income - expense;
    };

    const getAccountTxnCount = (accountId) => {
        return transactions.filter((t) => (t.accountId || 'cash') === accountId).length;
    };

    const openAddModal = () => {
        setEditingAccount(null);
        setFormName('');
        setFormIcon(ACCOUNT_ICONS[0]);
        setFormColor(ACCOUNT_COLORS[0]);
        setModalVisible(true);
    };

    const openEditModal = (account) => {
        setEditingAccount(account);
        setFormName(account.name);
        setFormIcon(account.icon);
        setFormColor(account.color);
        setModalVisible(true);
    };

    const handleSave = async () => {
        if (!formName.trim()) {
            showAlert({ title: 'Error', message: 'Please enter an account name.', type: 'error' });
            return;
        }
        haptics.lightTap();
        if (editingAccount) {
            await accountService.updateAccount({
                id: editingAccount.id,
                name: formName.trim(),
                icon: formIcon,
                color: formColor,
            });
        } else {
            await accountService.addAccount({
                name: formName.trim(),
                icon: formIcon,
                color: formColor,
            });
        }
        setModalVisible(false);
        loadData();
    };

    const handleDelete = (account) => {
        if (accounts.length <= 1) {
            showAlert({ title: 'Cannot Delete', message: 'You must keep at least one account.', type: 'warning' });
            return;
        }
        const txnCount = getAccountTxnCount(account.id);
        showAlert({
            title: 'Delete Account',
            message: txnCount > 0
                ? `"${account.name}" has ${txnCount} transactions. Deleting won't remove transactions, but they'll show under the default account.`
                : `Delete "${account.name}"?`,
            type: 'warning',
            buttons: [
                {
                    text: 'Delete', onPress: async () => {
                        haptics.lightTap();
                        await accountService.deleteAccount(account.id);
                        loadData();
                    }
                },
                { text: 'Cancel', style: 'cancel' },
            ],
        });
    };

    const handleSetDefault = async (id) => {
        haptics.selection();
        await accountService.setDefaultAccount(id);
        loadData();
    };

    const totalBalance = accounts.reduce((sum, a) => sum + getAccountBalance(a.id), 0);

    return (
        <ScreenContainer>
            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                <Text style={[styles.header, { color: colors.text }]}>Accounts</Text>

                {/* Total Balance Card */}
                <View style={[styles.totalCard, { backgroundColor: colors.primary }]}>
                    <Text style={styles.totalLabel}>Total Balance</Text>
                    <Text style={styles.totalAmount}>
                        {currencySymbol}{formatAmount(Math.abs(totalBalance), currency?.code || 'INR')}
                    </Text>
                    <Text style={styles.totalSub}>{accounts.length} accounts</Text>
                </View>

                {/* Account List */}
                {accounts.map((account) => {
                    const balance = getAccountBalance(account.id);
                    const txnCount = getAccountTxnCount(account.id);
                    return (
                        <TouchableOpacity
                            key={account.id}
                            style={[styles.accountCard, { backgroundColor: colors.card, borderColor: colors.border }]}
                            onPress={() => openEditModal(account)}
                            onLongPress={() => handleDelete(account)}
                            activeOpacity={0.7}
                        >
                            <View style={[styles.accountIcon, { backgroundColor: `${account.color}20` }]}>
                                <Ionicons name={account.icon} size={24} color={account.color} />
                            </View>
                            <View style={styles.accountInfo}>
                                <View style={styles.accountNameRow}>
                                    <Text style={[styles.accountName, { color: colors.text }]}>{account.name}</Text>
                                    {account.isDefault && (
                                        <View style={[styles.defaultBadge, { backgroundColor: `${colors.primary}20` }]}>
                                            <Text style={[styles.defaultText, { color: colors.primary }]}>Default</Text>
                                        </View>
                                    )}
                                </View>
                                <Text style={[styles.accountSub, { color: colors.textSecondary }]}>
                                    {txnCount} transactions
                                </Text>
                            </View>
                            <View style={styles.accountBalance}>
                                <Text style={[styles.balanceAmount, { color: balance >= 0 ? '#22C55E' : '#EF4444' }]}>
                                    {balance < 0 ? '-' : ''}{currencySymbol}{formatAmount(Math.abs(balance), currency?.code || 'INR')}
                                </Text>
                                {!account.isDefault && (
                                    <TouchableOpacity onPress={() => handleSetDefault(account.id)} style={styles.setDefaultBtn}>
                                        <Text style={[styles.setDefaultText, { color: colors.textSecondary }]}>Set default</Text>
                                    </TouchableOpacity>
                                )}
                            </View>
                        </TouchableOpacity>
                    );
                })}

                {/* Add Account */}
                <TouchableOpacity
                    style={[styles.addBtn, { backgroundColor: colors.card, borderColor: colors.border }]}
                    onPress={openAddModal}
                    activeOpacity={0.7}
                >
                    <Ionicons name="add-circle-outline" size={24} color={colors.primary} />
                    <Text style={[styles.addBtnText, { color: colors.primary }]}>Add Account</Text>
                </TouchableOpacity>
            </ScrollView>

            {/* Add/Edit Modal */}
            <Modal visible={modalVisible} animationType="slide" transparent>
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
                        <Text style={[styles.modalTitle, { color: colors.text }]}>
                            {editingAccount ? 'Edit Account' : 'New Account'}
                        </Text>

                        <TextInput
                            style={[styles.input, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
                            placeholder="Account name"
                            placeholderTextColor={colors.textSecondary}
                            value={formName}
                            onChangeText={setFormName}
                            autoFocus
                        />

                        <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>Icon</Text>
                        <View style={styles.iconGrid}>
                            {ACCOUNT_ICONS.map((icon) => (
                                <TouchableOpacity
                                    key={icon}
                                    style={[
                                        styles.iconOption,
                                        {
                                            backgroundColor: formIcon === icon ? formColor : colors.background,
                                            borderColor: formIcon === icon ? formColor : colors.border,
                                        },
                                    ]}
                                    onPress={() => setFormIcon(icon)}
                                >
                                    <Ionicons name={icon} size={20} color={formIcon === icon ? '#FFF' : colors.text} />
                                </TouchableOpacity>
                            ))}
                        </View>

                        <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>Color</Text>
                        <View style={styles.colorGrid}>
                            {ACCOUNT_COLORS.map((color) => (
                                <TouchableOpacity
                                    key={color}
                                    style={[
                                        styles.colorOption,
                                        { backgroundColor: color },
                                        formColor === color && styles.colorSelected,
                                    ]}
                                    onPress={() => setFormColor(color)}
                                >
                                    {formColor === color && (
                                        <Ionicons name="checkmark" size={16} color="#FFF" />
                                    )}
                                </TouchableOpacity>
                            ))}
                        </View>

                        <View style={styles.modalActions}>
                            <TouchableOpacity
                                style={[styles.modalBtn, { backgroundColor: colors.background }]}
                                onPress={() => setModalVisible(false)}
                            >
                                <Text style={[styles.modalBtnText, { color: colors.text }]}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.modalBtn, { backgroundColor: colors.primary }]}
                                onPress={handleSave}
                            >
                                <Text style={[styles.modalBtnText, { color: '#FFF' }]}>
                                    {editingAccount ? 'Update' : 'Create'}
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </ScreenContainer>
    );
};

const styles = StyleSheet.create({
    scrollContent: { paddingBottom: SPACING.xl + 20 },
    header: { fontSize: FONT_SIZE.xxl, fontWeight: '700', marginBottom: SPACING.md },
    totalCard: {
        borderRadius: 16,
        padding: SPACING.lg,
        marginBottom: SPACING.lg,
        alignItems: 'center',
    },
    totalLabel: { color: 'rgba(255,255,255,0.8)', fontSize: FONT_SIZE.md, fontWeight: '500' },
    totalAmount: { color: '#FFF', fontSize: 36, fontWeight: '800', marginTop: 4 },
    totalSub: { color: 'rgba(255,255,255,0.6)', fontSize: FONT_SIZE.sm, marginTop: 4 },
    accountCard: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: SPACING.md,
        borderRadius: 14,
        borderWidth: 1,
        marginBottom: SPACING.sm,
    },
    accountIcon: {
        width: 48,
        height: 48,
        borderRadius: 14,
        alignItems: 'center',
        justifyContent: 'center',
    },
    accountInfo: { flex: 1, marginLeft: SPACING.sm },
    accountNameRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    accountName: { fontSize: FONT_SIZE.md, fontWeight: '600' },
    defaultBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8 },
    defaultText: { fontSize: 10, fontWeight: '700' },
    accountSub: { fontSize: FONT_SIZE.sm, marginTop: 2 },
    accountBalance: { alignItems: 'flex-end' },
    balanceAmount: { fontSize: FONT_SIZE.md, fontWeight: '700' },
    setDefaultBtn: { marginTop: 4 },
    setDefaultText: { fontSize: 11, fontWeight: '500' },
    addBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        padding: SPACING.md,
        borderRadius: 14,
        borderWidth: 1,
        borderStyle: 'dashed',
        marginTop: SPACING.sm,
    },
    addBtnText: { fontSize: FONT_SIZE.md, fontWeight: '600' },
    modalOverlay: {
        flex: 1,
        justifyContent: 'flex-end',
        backgroundColor: 'rgba(0,0,0,0.5)',
    },
    modalContent: {
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        padding: SPACING.lg,
        paddingBottom: 40,
    },
    modalTitle: { fontSize: FONT_SIZE.xl, fontWeight: '700', marginBottom: SPACING.lg },
    input: {
        borderWidth: 1,
        borderRadius: 12,
        padding: SPACING.md,
        fontSize: FONT_SIZE.md,
        marginBottom: SPACING.md,
    },
    sectionLabel: { fontSize: FONT_SIZE.sm, fontWeight: '600', marginBottom: SPACING.sm },
    iconGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: SPACING.md },
    iconOption: {
        width: 42,
        height: 42,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
    },
    colorGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: SPACING.lg },
    colorOption: {
        width: 36,
        height: 36,
        borderRadius: 18,
        alignItems: 'center',
        justifyContent: 'center',
    },
    colorSelected: { borderWidth: 3, borderColor: 'rgba(255,255,255,0.6)' },
    modalActions: { flexDirection: 'row', gap: SPACING.sm },
    modalBtn: {
        flex: 1,
        paddingVertical: SPACING.md,
        borderRadius: 12,
        alignItems: 'center',
    },
    modalBtnText: { fontSize: FONT_SIZE.md, fontWeight: '700' },
});

export default AccountsScreen;

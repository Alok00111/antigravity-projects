// File: src/screens/SettingsScreen.js

import React, { useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Switch,
    Alert,
    Platform,
    Modal,
    TextInput,
    KeyboardAvoidingView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import { useTheme, ACCENT_PRESETS } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import ScreenContainer from '../components/ScreenContainer';
import { FONT_SIZE, SPACING, SCREEN_NAMES, STORAGE_KEYS } from '../utils/constants';
import { exportCSV } from '../utils/csvExport';
import storageService from '../services/storageService';
import notificationService from '../services/notificationService';
import { fetchExchangeRate, convertAllData } from '../services/currencyConversionService';
import CurrencyPicker from '../components/CurrencyPicker';
import { useAlert } from '../context/AlertContext';
import { formatAmount } from '../utils/currencies';

const isExpoGo = Constants.appOwnership === 'expo';

const SettingRow = ({ icon, iconColor, label, subtitle, onPress, trailing, colors }) => (
    <TouchableOpacity
        style={[styles.settingRow, { backgroundColor: colors.card }]}
        onPress={onPress}
        activeOpacity={onPress ? 0.7 : 1}
    >
        <View style={[styles.settingIconCircle, { backgroundColor: `${iconColor}18` }]}>
            <Ionicons name={icon} size={20} color={iconColor} />
        </View>
        <View style={styles.settingInfo}>
            <Text style={[styles.settingLabel, { color: colors.text }]}>{label}</Text>
            {subtitle && <Text style={[styles.settingSubtitle, { color: colors.textSecondary }]}>{subtitle}</Text>}
        </View>
        {trailing || <Ionicons name="chevron-forward" size={20} color={colors.tabInactive} />}
    </TouchableOpacity>
);

const SettingsScreen = () => {
    const navigation = useNavigation();
    const { colors, isDark, accentColor, currency, toggleDarkMode, setAccentColor, setCurrency } = useTheme();
    const { isLockEnabled, isBiometricAvailable, toggleLock } = useAuth();
    const { showAlert } = useAlert();
    const [notificationsEnabled, setNotificationsEnabled] = React.useState(false);
    const [isConverting, setIsConverting] = React.useState(false);
    const [userName, setUserName] = React.useState('');
    const [showNameModal, setShowNameModal] = React.useState(false);
    const [tempName, setTempName] = React.useState('');

    React.useEffect(() => {
        loadNotificationSetting();
        loadUserName();
    }, []);

    const loadNotificationSetting = async () => {
        const enabled = await notificationService.isNotificationsEnabled();
        setNotificationsEnabled(enabled);
    };

    const loadUserName = async () => {
        try {
            const name = await AsyncStorage.getItem(STORAGE_KEYS.USER_NAME);
            if (name) setUserName(name);
        } catch (e) {
            console.error('Error loading user name:', e);
        }
    };

    const handleChangeName = () => {
        // Use the native Alert.prompt on iOS, or a simple workaround
        if (Platform.OS === 'ios') {
            Alert.prompt(
                'Your Name',
                'Enter your display name',
                [
                    { text: 'Cancel', style: 'cancel' },
                    {
                        text: 'Save',
                        onPress: async (name) => {
                            if (name && name.trim()) {
                                await AsyncStorage.setItem(STORAGE_KEYS.USER_NAME, name.trim());
                                setUserName(name.trim());
                                showAlert({ title: '✅ Updated', message: `Welcome, ${name.trim()}!`, type: 'success' });
                            }
                        },
                    },
                ],
                'plain-text',
                userName
            );
        } else {
            setShowNameModal(true);
            setTempName(userName);
        }
    };

    const saveNameFromModal = async () => {
        if (tempName && tempName.trim()) {
            await AsyncStorage.setItem(STORAGE_KEYS.USER_NAME, tempName.trim());
            setUserName(tempName.trim());
            setShowNameModal(false);
            showAlert({ title: '✅ Updated', message: `Welcome, ${tempName.trim()}!`, type: 'success' });
        }
    };



    const handleToggleNotifications = async (value) => {
        if (value) {
            const granted = await notificationService.requestPermissions();
            if (!granted) {
                showAlert({ title: 'Permission Denied', message: 'Please enable notifications in your device settings.', type: 'warning' });
                return;
            }
        } else {
            await notificationService.cancelAllNotifications();
        }
        setNotificationsEnabled(value);
        // Save to settings
        try {
            const raw = await AsyncStorage.getItem('@expenseflow_settings');
            const current = raw ? JSON.parse(raw) : {};
            await AsyncStorage.setItem('@expenseflow_settings', JSON.stringify({ ...current, notificationsEnabled: value }));
        } catch (e) {
            console.error('Error saving notification setting:', e);
        }
    };

    const handleExportCSV = useCallback(async () => {
        try {
            const transactions = await storageService.getTransactions();
            if (!transactions.length) {
                showAlert({ title: 'No Data', message: 'No transactions to export.', type: 'info' });
                return;
            }
            await exportCSV(transactions);
        } catch (e) {
            showAlert({ title: 'Error', message: 'Failed to export CSV.', type: 'error' });
        }
    }, []);

    const handleClearData = useCallback(() => {
        showAlert({
            title: 'Clear All Data',
            message: 'This will permanently delete all transactions, budgets, and settings. This action cannot be undone.',
            type: 'confirm',
            buttons: [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete Everything',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await AsyncStorage.multiRemove([
                                '@expense_tracker_transactions',
                                '@expense_tracker_budgets',
                                '@expense_tracker_recurring',
                            ]);
                            showAlert({ title: 'Done', message: 'All data has been cleared.', type: 'success' });
                        } catch (e) {
                            showAlert({ title: 'Error', message: 'Failed to clear data.', type: 'error' });
                        }
                    },
                },
            ],
        });
    }, [showAlert]);

    const handleCurrencyChange = useCallback((newCurrency) => {
        if (newCurrency.code === currency.code) return;

        showAlert({
            title: '💱 Switch Currency',
            message: `Switch from ${currency.name} (${currency.symbol}) to ${newCurrency.name} (${newCurrency.symbol})?\n\nYou can convert existing data to the new currency using live exchange rates, or just change the display symbol.`,
            type: 'confirm',
            buttons: [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Symbol Only',
                    onPress: () => {
                        setCurrency(newCurrency);
                        showAlert({
                            title: 'Currency Updated',
                            message: `Display currency changed to ${newCurrency.name} (${newCurrency.symbol}). Your amounts were not converted.`,
                            type: 'success',
                        });
                    },
                },
                {
                    text: 'Convert Data',
                    onPress: async () => {
                        setIsConverting(true);
                        try {
                            const result = await fetchExchangeRate(currency.code, newCurrency.code);
                            if (!result) {
                                showAlert({
                                    title: 'Connection Error',
                                    message: 'Could not fetch exchange rates. Please check your internet connection and try again.',
                                    type: 'error',
                                });
                                return;
                            }

                            const { rate, timestamp } = result;
                            const conversion = await convertAllData(rate);

                            if (!conversion.success) {
                                showAlert({
                                    title: 'Conversion Failed',
                                    message: 'An error occurred while converting your data. Your data was not modified.',
                                    type: 'error',
                                });
                                return;
                            }

                            setCurrency(newCurrency);

                            const { counts } = conversion;
                            const rateStr = `1 ${currency.code} = ${formatAmount(rate, newCurrency.code, { minimumFractionDigits: 2, maximumFractionDigits: 4 })} ${newCurrency.code}`;

                            showAlert({
                                title: '✅ Conversion Complete',
                                message: `All data converted at:\n${rateStr}\n\n• ${counts.transactions} transactions\n• ${counts.budgets} budget limits\n• ${counts.savingsGoals} savings goals\n• ${counts.accounts} accounts`,
                                type: 'success',
                            });
                        } catch (e) {
                            showAlert({
                                title: 'Error',
                                message: 'Something went wrong during conversion.',
                                type: 'error',
                            });
                        } finally {
                            setIsConverting(false);
                        }
                    },
                },
            ],
        });
    }, [currency, setCurrency, showAlert]);

    return (
        <ScreenContainer>
            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
            >
                <Text style={[styles.header, { color: colors.text }]}>Settings</Text>

                {/* Profile */}
                <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>Profile</Text>
                <View style={styles.section}>
                    <SettingRow
                        icon="person-outline"
                        iconColor="#6366F1"
                        label={userName || 'Set Your Name'}
                        subtitle={userName ? 'Tap to change your display name' : 'Personalize your dashboard greeting'}
                        onPress={handleChangeName}
                        colors={colors}
                    />
                </View>

                {/* Appearance */}
                <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>Appearance</Text>
                <View style={styles.section}>
                    <SettingRow
                        icon="moon-outline"
                        iconColor="#6366F1"
                        label="Dark Mode"
                        subtitle="Easier on the eyes at night"
                        colors={colors}
                        trailing={
                            <Switch
                                value={isDark}
                                onValueChange={toggleDarkMode}
                                trackColor={{ false: colors.border, true: colors.primary }}
                                thumbColor="#FFF"
                            />
                        }
                    />
                </View>

                {/* Currency */}
                <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>Currency</Text>
                <View style={styles.section}>
                    <SettingRow
                        icon="cash-outline"
                        iconColor="#10B981"
                        label="Base Currency"
                        subtitle={`${currency.name} (${currency.symbol})`}
                        colors={colors}
                        trailing={
                            <CurrencyPicker
                                selectedCode={currency.code}
                                onSelect={handleCurrencyChange}
                            />
                        }
                    />
                </View>

                {/* Accent Color */}
                <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>Accent Color</Text>
                <View style={[styles.section, { padding: SPACING.md }]}>
                    <View style={styles.colorsGrid}>
                        {ACCENT_PRESETS.map((preset) => {
                            const isSelected = accentColor === preset.color;
                            return (
                                <TouchableOpacity
                                    key={preset.color}
                                    style={[
                                        styles.colorCircle,
                                        { backgroundColor: preset.color },
                                        isSelected && styles.colorCircleSelected,
                                    ]}
                                    onPress={() => setAccentColor(preset.color)}
                                    activeOpacity={0.7}
                                >
                                    {isSelected && (
                                        <Ionicons name="checkmark" size={18} color="#FFF" />
                                    )}
                                </TouchableOpacity>
                            );
                        })}
                    </View>
                    {accentColor && (
                        <TouchableOpacity
                            style={[styles.resetBtn, { borderColor: colors.border }]}
                            onPress={() => setAccentColor(null)}
                            activeOpacity={0.7}
                        >
                            <Ionicons name="refresh-outline" size={16} color={colors.textSecondary} />
                            <Text style={[styles.resetText, { color: colors.textSecondary }]}>Reset to Default</Text>
                        </TouchableOpacity>
                    )}
                </View>

                {/* Security */}
                {isBiometricAvailable && (
                    <>
                        <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>Security</Text>
                        <View style={styles.section}>
                            <SettingRow
                                icon="finger-print-outline"
                                iconColor="#22C55E"
                                label="Biometric Lock"
                                subtitle="Require fingerprint or Face ID"
                                colors={colors}
                                trailing={
                                    <Switch
                                        value={isLockEnabled}
                                        onValueChange={toggleLock}
                                        trackColor={{ false: colors.border, true: colors.primary }}
                                        thumbColor="#FFF"
                                    />
                                }
                            />
                        </View>
                    </>
                )}

                {/* Notifications */}
                <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>Notifications</Text>
                <View style={styles.section}>
                    {isExpoGo ? (
                        <SettingRow
                            icon="notifications-outline"
                            iconColor="#F59E0B"
                            label="Push Notifications"
                            subtitle="In-app budget alerts are active. Push notifications require a development build."
                            colors={colors}
                            trailing={
                                <View style={{ backgroundColor: `${colors.textSecondary}18`, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 }}>
                                    <Text style={{ color: colors.textSecondary, fontSize: FONT_SIZE.xs, fontWeight: '600' }}>Expo Go</Text>
                                </View>
                            }
                        />
                    ) : (
                        <SettingRow
                            icon="notifications-outline"
                            iconColor="#F59E0B"
                            label="Push Notifications"
                            subtitle="Budget alerts & reminders"
                            colors={colors}
                            trailing={
                                <Switch
                                    value={notificationsEnabled}
                                    onValueChange={handleToggleNotifications}
                                    trackColor={{ false: colors.border, true: colors.primary }}
                                    thumbColor="#FFF"
                                />
                            }
                        />
                    )}
                </View>

                {/* Data */}
                <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>Data</Text>
                <View style={styles.section}>
                    <SettingRow
                        icon="wallet-outline"
                        iconColor="#22C55E"
                        label="Manage Accounts"
                        subtitle="Cash, Bank, Credit Card, UPI"
                        onPress={() => navigation.navigate(SCREEN_NAMES.ACCOUNTS)}
                        colors={colors}
                    />
                    <SettingRow
                        icon="cloud-upload-outline"
                        iconColor="#06B6D4"
                        label="Backup & Restore"
                        subtitle="Export or import your data"
                        onPress={() => navigation.navigate(SCREEN_NAMES.BACKUP)}
                        colors={colors}
                    />
                    <SettingRow
                        icon="bar-chart-outline"
                        iconColor="#8B5CF6"
                        label="View Reports"
                        subtitle="Monthly & weekly spending reports"
                        colors={colors}
                        onPress={() => navigation.navigate(SCREEN_NAMES.REPORTS)}
                    />
                    <SettingRow
                        icon="download-outline"
                        iconColor="#3B82F6"
                        label="Export to CSV"
                        subtitle="Share your transactions"
                        onPress={handleExportCSV}
                        colors={colors}
                    />
                    <SettingRow
                        icon="pie-chart-outline"
                        iconColor="#EC4899"
                        label="Budget Limits"
                        subtitle="Set spending limits per category"
                        onPress={() => navigation.navigate(SCREEN_NAMES.BUDGET)}
                        colors={colors}
                    />
                    <SettingRow
                        icon="repeat-outline"
                        iconColor="#6366F1"
                        label="Recurring Transactions"
                        subtitle="Auto-add monthly bills & income"
                        onPress={() => navigation.navigate('Recurring')}
                        colors={colors}
                    />
                    <SettingRow
                        icon="diamond-outline"
                        iconColor="#EAB308"
                        label="Savings Goals"
                        subtitle="Track progress towards your targets"
                        onPress={() => navigation.navigate(SCREEN_NAMES.SAVINGS_GOALS)}
                        colors={colors}
                    />
                    <SettingRow
                        icon="color-palette-outline"
                        iconColor="#D946EF"
                        label="Custom Categories"
                        subtitle="Create your own categories"
                        onPress={() => navigation.navigate(SCREEN_NAMES.CUSTOM_CATEGORIES)}
                        colors={colors}
                    />
                    <SettingRow
                        icon="images-outline"
                        iconColor="#06B6D4"
                        label="Receipt Gallery"
                        subtitle="Browse all attached receipts"
                        onPress={() => navigation.navigate(SCREEN_NAMES.RECEIPT_GALLERY)}
                        colors={colors}
                    />
                    <SettingRow
                        icon="people-outline"
                        iconColor="#F97316"
                        label="Debts & Loans"
                        subtitle="Track money lent and borrowed"
                        onPress={() => navigation.navigate(SCREEN_NAMES.DEBTS)}
                        colors={colors}
                    />
                </View>

                {/* Danger Zone */}
                <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>Danger Zone</Text>
                <View style={styles.section}>
                    <SettingRow
                        icon="trash-outline"
                        iconColor={colors.danger}
                        label="Clear All Data"
                        subtitle="Delete all transactions and settings"
                        onPress={handleClearData}
                        colors={colors}
                    />
                </View>

                {/* About */}
                <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>About</Text>
                <View style={styles.section}>
                    <SettingRow
                        icon="information-circle-outline"
                        iconColor="#14B8A6"
                        label="ExpenseFlow"
                        subtitle="Version 1.0.0"
                        colors={colors}
                    />
                </View>
            </ScrollView>

            {/* Android Name Edit Modal */}
            <Modal visible={showNameModal} transparent animationType="fade">
                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    style={styles.nameModalOverlay}
                >
                    <View style={[styles.nameModalCard, { backgroundColor: colors.card }]}>
                        <Text style={[styles.nameModalTitle, { color: colors.text }]}>Your Name</Text>
                        <Text style={[styles.nameModalSub, { color: colors.textSecondary }]}>
                            Enter your display name
                        </Text>
                        <TextInput
                            style={[styles.nameModalInput, {
                                backgroundColor: colors.background,
                                borderColor: colors.border,
                                color: colors.text,
                            }]}
                            placeholder="Enter your name"
                            placeholderTextColor={colors.textSecondary}
                            value={tempName}
                            onChangeText={setTempName}
                            autoFocus
                            maxLength={30}
                            returnKeyType="done"
                            onSubmitEditing={saveNameFromModal}
                        />
                        <View style={styles.nameModalBtns}>
                            <TouchableOpacity
                                style={[styles.nameModalBtn, { backgroundColor: colors.background }]}
                                onPress={() => setShowNameModal(false)}
                                activeOpacity={0.7}
                            >
                                <Text style={[styles.nameModalBtnText, { color: colors.textSecondary }]}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.nameModalBtn, { backgroundColor: colors.primary }]}
                                onPress={saveNameFromModal}
                                activeOpacity={0.8}
                            >
                                <Text style={[styles.nameModalBtnText, { color: '#FFF' }]}>Save</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </KeyboardAvoidingView>
            </Modal>
        </ScreenContainer>
    );
};

const styles = StyleSheet.create({
    scrollContent: { paddingBottom: SPACING.xl + 20 },
    header: {
        fontSize: FONT_SIZE.xxl,
        fontWeight: '700',
        marginBottom: SPACING.lg,
    },
    sectionLabel: {
        fontSize: FONT_SIZE.sm,
        fontWeight: '600',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
        marginBottom: SPACING.sm,
        marginTop: SPACING.md,
        marginLeft: 4,
    },
    section: {
        gap: SPACING.sm,
        marginBottom: SPACING.sm,
    },
    settingRow: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: SPACING.md,
        borderRadius: 14,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.04,
        shadowRadius: 4,
        elevation: 2,
    },
    settingIconCircle: {
        width: 38,
        height: 38,
        borderRadius: 10,
        alignItems: 'center',
        justifyContent: 'center',
    },
    settingInfo: {
        flex: 1,
        marginLeft: SPACING.sm,
    },
    settingLabel: {
        fontSize: FONT_SIZE.md,
        fontWeight: '600',
    },
    settingSubtitle: {
        fontSize: FONT_SIZE.sm,
        marginTop: 2,
    },
    colorsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: SPACING.sm,
    },
    colorCircle: {
        width: 40,
        height: 40,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
    },
    colorCircleSelected: {
        borderWidth: 3,
        borderColor: '#FFF',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
        elevation: 4,
    },
    resetBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        marginTop: SPACING.md,
        paddingVertical: SPACING.sm,
        borderWidth: 1,
        borderRadius: 10,
    },
    resetText: {
        fontSize: FONT_SIZE.sm,
        fontWeight: '600',
    },
    nameModalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: SPACING.lg,
    },
    nameModalCard: {
        width: '100%',
        borderRadius: 20,
        padding: SPACING.lg,
    },
    nameModalTitle: {
        fontSize: FONT_SIZE.lg,
        fontWeight: '700',
        textAlign: 'center',
        marginBottom: 4,
    },
    nameModalSub: {
        fontSize: FONT_SIZE.sm,
        textAlign: 'center',
        marginBottom: SPACING.md,
    },
    nameModalInput: {
        fontSize: FONT_SIZE.md,
        fontWeight: '600',
        textAlign: 'center',
        paddingVertical: SPACING.sm + 4,
        paddingHorizontal: SPACING.md,
        borderRadius: 12,
        borderWidth: 1.5,
        marginBottom: SPACING.md,
    },
    nameModalBtns: {
        flexDirection: 'row',
        gap: SPACING.sm,
    },
    nameModalBtn: {
        flex: 1,
        paddingVertical: SPACING.sm + 2,
        borderRadius: 12,
        alignItems: 'center',
    },
    nameModalBtnText: {
        fontSize: FONT_SIZE.md,
        fontWeight: '700',
    },
});

export default SettingsScreen;

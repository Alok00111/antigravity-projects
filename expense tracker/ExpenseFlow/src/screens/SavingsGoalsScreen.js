// File: src/screens/SavingsGoalsScreen.js

import React, { useState, useCallback, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TextInput,
    TouchableOpacity,
    Animated,
    FlatList,
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
} from '../utils/constants';
import { formatAmount } from '../utils/currencies';
import { useAlert } from '../context/AlertContext';

const GOAL_ICONS = [
    { id: 'car-outline', label: 'Car', color: '#3B82F6' },
    { id: 'home-outline', label: 'Home', color: '#8B5CF6' },
    { id: 'airplane-outline', label: 'Travel', color: '#EC4899' },
    { id: 'school-outline', label: 'Education', color: '#06B6D4' },
    { id: 'phone-portrait-outline', label: 'Gadget', color: '#F97316' },
    { id: 'medkit-outline', label: 'Health', color: '#EF4444' },
    { id: 'gift-outline', label: 'Gift', color: '#F43F5E' },
    { id: 'diamond-outline', label: 'Luxury', color: '#A78BFA' },
    { id: 'wallet-outline', label: 'Emergency', color: '#22C55E' },
    { id: 'star-outline', label: 'Other', color: '#EAB308' },
];

const SavingsGoalsScreen = () => {
    const { colors, currency } = useTheme();
    const { showAlert } = useAlert();
    const [goals, setGoals] = useState([]);
    const [showForm, setShowForm] = useState(false);
    const [goalName, setGoalName] = useState('');
    const [targetAmount, setTargetAmount] = useState('');
    const [savedAmount, setSavedAmount] = useState('');
    const [selectedIcon, setSelectedIcon] = useState(GOAL_ICONS[0]);
    const [addFundsGoalId, setAddFundsGoalId] = useState(null);
    const [addFundsAmount, setAddFundsAmount] = useState('');
    const formScale = useRef(new Animated.Value(0)).current;

    const loadGoals = useCallback(async () => {
        try {
            const data = await AsyncStorage.getItem(STORAGE_KEYS.SAVINGS_GOALS);
            if (data) setGoals(JSON.parse(data));
        } catch (e) {
            console.error('Error loading goals:', e);
        }
    }, []);

    useFocusEffect(
        useCallback(() => {
            loadGoals();
        }, [loadGoals])
    );

    const saveGoals = async (newGoals) => {
        try {
            await AsyncStorage.setItem(STORAGE_KEYS.SAVINGS_GOALS, JSON.stringify(newGoals));
            setGoals(newGoals);
        } catch (e) {
            showAlert({ title: 'Error', message: 'Failed to save goals.', type: 'error' });
        }
    };

    const toggleForm = (show) => {
        if (show) {
            setShowForm(true);
            Animated.spring(formScale, {
                toValue: 1,
                friction: 6,
                tension: 80,
                useNativeDriver: true,
            }).start();
        } else {
            Animated.timing(formScale, {
                toValue: 0,
                duration: 200,
                useNativeDriver: true,
            }).start(() => {
                setShowForm(false);
                resetForm();
            });
        }
    };

    const resetForm = () => {
        setGoalName('');
        setTargetAmount('');
        setSavedAmount('');
        setSelectedIcon(GOAL_ICONS[0]);
    };

    const handleCreateGoal = () => {
        if (!goalName.trim()) {
            showAlert({ title: 'Missing Name', message: 'Please name your savings goal.', type: 'warning' });
            return;
        }
        const target = parseFloat(targetAmount);
        if (isNaN(target) || target <= 0) {
            showAlert({ title: 'Invalid Target', message: 'Enter a valid target amount.', type: 'warning' });
            return;
        }
        const saved = parseFloat(savedAmount) || 0;

        const newGoal = {
            id: Date.now().toString(),
            name: goalName.trim(),
            targetAmount: target,
            savedAmount: Math.min(saved, target),
            icon: selectedIcon.id,
            iconColor: selectedIcon.color,
            createdAt: new Date().toISOString(),
        };

        saveGoals([...goals, newGoal]);
        toggleForm(false);
    };

    const handleAddFunds = (goalId) => {
        const amount = parseFloat(addFundsAmount);
        if (isNaN(amount) || amount <= 0) {
            showAlert({ title: 'Invalid Amount', message: 'Enter a valid amount to add.', type: 'warning' });
            return;
        }

        const updatedGoals = goals.map((g) => {
            if (g.id === goalId) {
                const newSaved = Math.min(g.savedAmount + amount, g.targetAmount);
                return { ...g, savedAmount: newSaved };
            }
            return g;
        });

        saveGoals(updatedGoals);
        setAddFundsGoalId(null);
        setAddFundsAmount('');

        const goal = updatedGoals.find((g) => g.id === goalId);
        if (goal && goal.savedAmount >= goal.targetAmount) {
            showAlert({ title: '🎉 Goal Achieved!', message: `Congratulations! You've reached your "${goal.name}" savings goal!`, type: 'success' });
        }
    };

    const handleWithdraw = (goalId) => {
        const goal = goals.find((g) => g.id === goalId);
        if (!goal || goal.savedAmount <= 0) return;
        const withdrawAmount = Math.min(goal.savedAmount * 0.1, goal.savedAmount);
        showAlert({
            title: 'Withdraw Funds',
            message: `Withdraw ${currency.symbol}${formatAmount(withdrawAmount, currency.code)} (10%) from "${goal.name}"?`,
            type: 'confirm',
            buttons: [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Withdraw',
                    style: 'destructive',
                    onPress: () => {
                        const updatedGoals = goals.map((g) => {
                            if (g.id === goalId) {
                                return { ...g, savedAmount: Math.max(g.savedAmount - withdrawAmount, 0) };
                            }
                            return g;
                        });
                        saveGoals(updatedGoals);
                    },
                },
            ],
        });
    };

    const handleDeleteGoal = (goalId) => {
        showAlert({
            title: 'Delete Goal',
            message: 'Are you sure you want to delete this goal?',
            type: 'confirm',
            buttons: [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: () => saveGoals(goals.filter((g) => g.id !== goalId)),
                },
            ],
        });
    };

    const renderGoalCard = ({ item }) => {
        const progress = item.targetAmount > 0 ? item.savedAmount / item.targetAmount : 0;
        const percentage = Math.round(progress * 100);
        const isComplete = percentage >= 100;
        const remaining = item.targetAmount - item.savedAmount;
        const isAddingFunds = addFundsGoalId === item.id;

        let progressColor = item.iconColor;
        if (isComplete) progressColor = colors.success;

        return (
            <View style={[styles.goalCard, { backgroundColor: colors.card }]}>
                {/* Header */}
                <View style={styles.goalHeader}>
                    <View style={[styles.goalIconCircle, { backgroundColor: `${item.iconColor}18` }]}>
                        <Ionicons name={item.icon} size={24} color={item.iconColor} />
                    </View>
                    <View style={styles.goalInfo}>
                        <Text style={[styles.goalName, { color: colors.text }]}>{item.name}</Text>
                        <Text style={[styles.goalMeta, { color: colors.textSecondary }]}>
                            {isComplete ? '🎉 Goal achieved!' : `${currency.symbol}${formatAmount(remaining, currency.code)} remaining`}
                        </Text>
                    </View>
                    <TouchableOpacity onPress={() => handleDeleteGoal(item.id)} activeOpacity={0.6}>
                        <Ionicons name="trash-outline" size={18} color={colors.textSecondary} />
                    </TouchableOpacity>
                </View>

                {/* Progress */}
                <View style={styles.progressSection}>
                    <View style={styles.progressLabelRow}>
                        <Text style={[styles.savedText, { color: colors.text }]}>
                            {currency.symbol}{formatAmount(item.savedAmount, currency.code)}
                        </Text>
                        <Text style={[styles.targetText, { color: colors.textSecondary }]}>
                            of {currency.symbol}{formatAmount(item.targetAmount, currency.code)}
                        </Text>
                    </View>
                    <View style={[styles.progressBarTrack, { backgroundColor: colors.border }]}>
                        <View
                            style={[
                                styles.progressBarFill,
                                {
                                    width: `${Math.min(percentage, 100)}%`,
                                    backgroundColor: progressColor,
                                },
                            ]}
                        />
                    </View>
                    <Text style={[styles.percentText, { color: progressColor }]}>{percentage}%</Text>
                </View>

                {/* Actions */}
                {!isComplete && (
                    <>
                        {isAddingFunds ? (
                            <View style={styles.addFundsRow}>
                                <View style={[styles.addFundsInput, { backgroundColor: colors.background, borderColor: colors.border }]}>
                                    <Text style={[styles.addFundsCurrency, { color: colors.textSecondary }]}>{currency.symbol}</Text>
                                    <TextInput
                                        style={[styles.addFundsField, { color: colors.text }]}
                                        keyboardType="decimal-pad"
                                        placeholder="Amount"
                                        placeholderTextColor={colors.tabInactive}
                                        value={addFundsAmount}
                                        onChangeText={setAddFundsAmount}
                                        autoFocus
                                    />
                                </View>
                                <TouchableOpacity
                                    style={[styles.addFundsSaveBtn, { backgroundColor: colors.success }]}
                                    onPress={() => handleAddFunds(item.id)}
                                >
                                    <Ionicons name="checkmark" size={20} color="#FFF" />
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={[styles.addFundsCancelBtn, { borderColor: colors.border }]}
                                    onPress={() => {
                                        setAddFundsGoalId(null);
                                        setAddFundsAmount('');
                                    }}
                                >
                                    <Ionicons name="close" size={20} color={colors.textSecondary} />
                                </TouchableOpacity>
                            </View>
                        ) : (
                            <View style={styles.actionRow}>
                                <TouchableOpacity
                                    style={[styles.actionBtn, { backgroundColor: `${colors.success}15`, borderColor: `${colors.success}30` }]}
                                    onPress={() => {
                                        setAddFundsGoalId(item.id);
                                        setAddFundsAmount('');
                                    }}
                                    activeOpacity={0.7}
                                >
                                    <Ionicons name="add-circle-outline" size={18} color={colors.success} />
                                    <Text style={[styles.actionBtnText, { color: colors.success }]}>Add Funds</Text>
                                </TouchableOpacity>
                            </View>
                        )}
                    </>
                )}
            </View>
        );
    };

    // Stats
    const totalTarget = goals.reduce((s, g) => s + g.targetAmount, 0);
    const totalSaved = goals.reduce((s, g) => s + g.savedAmount, 0);
    const completedGoals = goals.filter((g) => g.savedAmount >= g.targetAmount).length;

    return (
        <ScreenContainer>
            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
            >
                <Text style={[styles.header, { color: colors.text }]}>Savings Goals</Text>
                <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
                    Track your progress towards financial targets
                </Text>

                {/* Stats Overview */}
                {goals.length > 0 && (
                    <View style={styles.statsRow}>
                        <View style={[styles.statCard, { backgroundColor: colors.card }]}>
                            <Text style={[styles.statValue, { color: colors.primary }]}>
                                {currency.symbol}{formatAmount(totalSaved, currency.code)}
                            </Text>
                            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Total Saved</Text>
                        </View>
                        <View style={[styles.statCard, { backgroundColor: colors.card }]}>
                            <Text style={[styles.statValue, { color: colors.accent }]}>
                                {completedGoals}/{goals.length}
                            </Text>
                            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Completed</Text>
                        </View>
                    </View>
                )}

                {/* Add Goal Button */}
                {!showForm && (
                    <TouchableOpacity
                        style={[styles.addGoalBtn, { backgroundColor: colors.primary }]}
                        onPress={() => toggleForm(true)}
                        activeOpacity={0.8}
                    >
                        <Ionicons name="add-circle-outline" size={22} color="#FFF" />
                        <Text style={styles.addGoalBtnText}>New Savings Goal</Text>
                    </TouchableOpacity>
                )}

                {/* Create Goal Form */}
                {showForm && (
                    <Animated.View
                        style={[
                            styles.formCard,
                            { backgroundColor: colors.card, transform: [{ scale: formScale }] },
                        ]}
                    >
                        <Text style={[styles.formTitle, { color: colors.text }]}>Create a Goal</Text>

                        <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>Goal Name</Text>
                        <TextInput
                            style={[styles.textInput, { backgroundColor: colors.background, borderColor: colors.border, color: colors.text }]}
                            placeholder="e.g., New iPhone, Vacation"
                            placeholderTextColor={colors.tabInactive}
                            value={goalName}
                            onChangeText={setGoalName}
                            maxLength={40}
                        />

                        <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>Icon</Text>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                            <View style={styles.iconRow}>
                                {GOAL_ICONS.map((ic) => (
                                    <TouchableOpacity
                                        key={ic.id}
                                        style={[
                                            styles.iconOption,
                                            { backgroundColor: colors.background, borderColor: colors.border },
                                            selectedIcon.id === ic.id && { borderColor: ic.color, borderWidth: 2 },
                                        ]}
                                        onPress={() => setSelectedIcon(ic)}
                                    >
                                        <Ionicons name={ic.id} size={22} color={ic.color} />
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </ScrollView>

                        <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>Target Amount</Text>
                        <View style={[styles.amountRow, { backgroundColor: colors.background, borderColor: colors.border }]}>
                            <Text style={[styles.currencySymbol, { color: colors.primary }]}>{currency.symbol}</Text>
                            <TextInput
                                style={[styles.amountInput, { color: colors.text }]}
                                placeholder="50,000"
                                placeholderTextColor={colors.tabInactive}
                                keyboardType="decimal-pad"
                                value={targetAmount}
                                onChangeText={setTargetAmount}
                            />
                        </View>

                        <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>Already Saved (optional)</Text>
                        <View style={[styles.amountRow, { backgroundColor: colors.background, borderColor: colors.border }]}>
                            <Text style={[styles.currencySymbol, { color: colors.accent }]}>{currency.symbol}</Text>
                            <TextInput
                                style={[styles.amountInput, { color: colors.text }]}
                                placeholder="0"
                                placeholderTextColor={colors.tabInactive}
                                keyboardType="decimal-pad"
                                value={savedAmount}
                                onChangeText={setSavedAmount}
                            />
                        </View>

                        <View style={styles.formActions}>
                            <TouchableOpacity
                                style={[styles.formSaveBtn, { backgroundColor: colors.primary }]}
                                onPress={handleCreateGoal}
                            >
                                <Ionicons name="checkmark-circle-outline" size={20} color="#FFF" />
                                <Text style={styles.formSaveBtnText}>Create Goal</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.formCancelBtn, { borderColor: colors.border }]}
                                onPress={() => toggleForm(false)}
                            >
                                <Text style={[styles.formCancelText, { color: colors.textSecondary }]}>Cancel</Text>
                            </TouchableOpacity>
                        </View>
                    </Animated.View>
                )}

                {/* Goals List */}
                {goals.length > 0 && (
                    <View style={styles.goalsSection}>
                        <Text style={[styles.sectionTitle, { color: colors.text }]}>
                            Your Goals ({goals.length})
                        </Text>
                        <FlatList
                            data={goals}
                            renderItem={renderGoalCard}
                            keyExtractor={(item) => item.id}
                            scrollEnabled={false}
                        />
                    </View>
                )}

                {/* Empty State */}
                {goals.length === 0 && !showForm && (
                    <View style={styles.emptyState}>
                        <Ionicons name="diamond-outline" size={56} color={colors.tabInactive} />
                        <Text style={[styles.emptyTitle, { color: colors.text }]}>No savings goals yet</Text>
                        <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
                            Set a goal to start saving towards something meaningful
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
    statsRow: {
        flexDirection: 'row',
        gap: SPACING.sm,
        marginBottom: SPACING.lg,
    },
    statCard: {
        flex: 1,
        borderRadius: 14,
        padding: SPACING.md,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.04,
        shadowRadius: 4,
        elevation: 2,
    },
    statValue: {
        fontSize: FONT_SIZE.xl,
        fontWeight: '700',
    },
    statLabel: {
        fontSize: FONT_SIZE.sm,
        fontWeight: '600',
        marginTop: 4,
    },
    addGoalBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: SPACING.sm,
        paddingVertical: SPACING.md,
        borderRadius: 14,
        marginBottom: SPACING.lg,
    },
    addGoalBtnText: {
        color: '#FFF',
        fontSize: FONT_SIZE.md,
        fontWeight: '700',
    },
    formCard: {
        borderRadius: 16,
        padding: SPACING.md,
        marginBottom: SPACING.lg,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 8,
        elevation: 3,
    },
    formTitle: {
        fontSize: FONT_SIZE.lg,
        fontWeight: '700',
        marginBottom: SPACING.sm,
    },
    fieldLabel: {
        fontSize: FONT_SIZE.sm,
        fontWeight: '600',
        marginTop: SPACING.md,
        marginBottom: SPACING.sm,
    },
    textInput: {
        borderRadius: 10,
        borderWidth: 1,
        paddingHorizontal: SPACING.md,
        paddingVertical: SPACING.sm + 2,
        fontSize: FONT_SIZE.md,
    },
    iconRow: {
        flexDirection: 'row',
        gap: SPACING.sm,
    },
    iconOption: {
        width: 44,
        height: 44,
        borderRadius: 12,
        borderWidth: 1,
        alignItems: 'center',
        justifyContent: 'center',
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
    formActions: {
        flexDirection: 'row',
        gap: SPACING.sm,
        marginTop: SPACING.lg,
    },
    formSaveBtn: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: SPACING.sm,
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
    goalsSection: {
        marginTop: SPACING.sm,
    },
    sectionTitle: {
        fontSize: FONT_SIZE.lg,
        fontWeight: '700',
        marginBottom: SPACING.md,
    },
    goalCard: {
        borderRadius: 16,
        padding: SPACING.md,
        marginBottom: SPACING.sm + 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 8,
        elevation: 3,
    },
    goalHeader: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    goalIconCircle: {
        width: 44,
        height: 44,
        borderRadius: 14,
        alignItems: 'center',
        justifyContent: 'center',
    },
    goalInfo: {
        flex: 1,
        marginLeft: SPACING.sm,
    },
    goalName: {
        fontSize: FONT_SIZE.md + 1,
        fontWeight: '700',
    },
    goalMeta: {
        fontSize: FONT_SIZE.sm,
        marginTop: 2,
    },
    progressSection: {
        marginTop: SPACING.md,
    },
    progressLabelRow: {
        flexDirection: 'row',
        alignItems: 'baseline',
        gap: 4,
        marginBottom: 6,
    },
    savedText: {
        fontSize: FONT_SIZE.lg,
        fontWeight: '700',
    },
    targetText: {
        fontSize: FONT_SIZE.sm,
        fontWeight: '500',
    },
    progressBarTrack: {
        height: 8,
        borderRadius: 4,
        overflow: 'hidden',
    },
    progressBarFill: {
        height: '100%',
        borderRadius: 4,
    },
    percentText: {
        fontSize: FONT_SIZE.sm,
        fontWeight: '700',
        textAlign: 'right',
        marginTop: 4,
    },
    actionRow: {
        flexDirection: 'row',
        gap: SPACING.sm,
        marginTop: SPACING.md,
    },
    actionBtn: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 4,
        paddingVertical: SPACING.sm,
        borderRadius: 10,
        borderWidth: 1,
    },
    actionBtnText: {
        fontSize: FONT_SIZE.sm,
        fontWeight: '700',
    },
    addFundsRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: SPACING.sm,
        marginTop: SPACING.md,
    },
    addFundsInput: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderRadius: 8,
        paddingHorizontal: SPACING.sm,
        paddingVertical: 6,
    },
    addFundsCurrency: {
        fontSize: FONT_SIZE.md,
        fontWeight: '600',
        marginRight: 4,
    },
    addFundsField: {
        flex: 1,
        fontSize: FONT_SIZE.md,
    },
    addFundsSaveBtn: {
        width: 36,
        height: 36,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
    },
    addFundsCancelBtn: {
        width: 36,
        height: 36,
        borderRadius: 8,
        borderWidth: 1,
        alignItems: 'center',
        justifyContent: 'center',
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
        paddingHorizontal: SPACING.lg,
    },
});

export default SavingsGoalsScreen;

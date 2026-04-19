// File: src/components/QuickGlanceCard.js
// Compact glanceable card at top of Dashboard showing today's spend and remaining budget

import React, { useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Circle } from 'react-native-svg';
import { useTheme } from '../context/ThemeContext';
import { SPACING, FONT_SIZE, TRANSACTION_TYPES } from '../utils/constants';
import { formatAmount } from '../utils/currencies';

const RING_SIZE = 48;
const RING_STROKE = 4;
const RING_RADIUS = (RING_SIZE - RING_STROKE) / 2;
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;

const QuickGlanceCard = ({ transactions, budgets, onAddPress }) => {
    const { colors, isDark, currency } = useTheme();

    const stats = useMemo(() => {
        const now = new Date();
        const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
        const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
        const daysRemaining = daysInMonth - now.getDate();

        let todaySpend = 0;
        let monthSpend = 0;

        (transactions || []).forEach((t) => {
            if (t.type !== TRANSACTION_TYPES.EXPENSE) return;
            const d = new Date(t.date);
            if (d >= monthStart) {
                monthSpend += t.amount;
                if (d >= todayStart) {
                    todaySpend += t.amount;
                }
            }
        });

        // Calculate total monthly budget
        const totalBudget = budgets
            ? Object.values(budgets).reduce((s, v) => s + (typeof v === 'number' ? v : 0), 0)
            : 0;

        const dailyBudget = totalBudget > 0 && daysRemaining > 0
            ? (totalBudget - monthSpend) / daysRemaining
            : 0;

        const budgetProgress = totalBudget > 0 ? Math.min(monthSpend / totalBudget, 1) : 0;

        return { todaySpend, monthSpend, dailyBudget, budgetProgress, totalBudget, daysRemaining };
    }, [transactions, budgets]);

    const progressOffset = RING_CIRCUMFERENCE * (1 - stats.budgetProgress);
    const isOverBudget = stats.budgetProgress >= 1;
    const ringColor = isOverBudget ? '#EF4444' : stats.budgetProgress > 0.8 ? '#F59E0B' : colors.primary;

    return (
        <View style={[styles.container, {
            backgroundColor: isDark ? `${colors.primary}08` : `${colors.primary}06`,
            borderColor: `${colors.primary}15`,
        }]}>
            <View style={styles.mainRow}>
                {/* Progress ring */}
                <View style={styles.ringContainer}>
                    <Svg width={RING_SIZE} height={RING_SIZE}>
                        <Circle
                            stroke={`${colors.border}80`}
                            fill="transparent"
                            cx={RING_SIZE / 2}
                            cy={RING_SIZE / 2}
                            r={RING_RADIUS}
                            strokeWidth={RING_STROKE}
                        />
                        <Circle
                            stroke={ringColor}
                            fill="transparent"
                            cx={RING_SIZE / 2}
                            cy={RING_SIZE / 2}
                            r={RING_RADIUS}
                            strokeWidth={RING_STROKE}
                            strokeDasharray={RING_CIRCUMFERENCE}
                            strokeDashoffset={progressOffset}
                            strokeLinecap="round"
                            rotation="-90"
                            origin={`${RING_SIZE / 2}, ${RING_SIZE / 2}`}
                        />
                    </Svg>
                    <View style={styles.ringCenter}>
                        <Text style={[styles.ringPercent, { color: ringColor }]}>
                            {Math.round(stats.budgetProgress * 100)}%
                        </Text>
                    </View>
                </View>

                {/* Stats */}
                <View style={styles.statsContainer}>
                    <View style={styles.statRow}>
                        <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Today</Text>
                        <Text style={[styles.statValue, { color: colors.text }]}>
                            {currency.symbol}{formatAmount(stats.todaySpend, currency.code)}
                        </Text>
                    </View>
                    <View style={styles.statRow}>
                        <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
                            {stats.dailyBudget > 0 ? 'Daily Budget' : 'This Month'}
                        </Text>
                        <Text style={[styles.statValue, { color: stats.dailyBudget > 0 ? (stats.todaySpend > stats.dailyBudget ? '#EF4444' : '#10B981') : colors.text }]}>
                            {currency.symbol}{formatAmount(stats.dailyBudget > 0 ? stats.dailyBudget : stats.monthSpend, currency.code)}
                        </Text>
                    </View>
                </View>

                {/* Quick add button */}
                <TouchableOpacity
                    style={[styles.addBtn, { backgroundColor: colors.primary }]}
                    onPress={onAddPress}
                    activeOpacity={0.8}
                >
                    <Ionicons name="add" size={22} color="#FFF" />
                </TouchableOpacity>
            </View>

            {/* Footer info */}
            {stats.totalBudget > 0 && (
                <Text style={[styles.footer, { color: colors.textSecondary }]}>
                    {stats.daysRemaining} day{stats.daysRemaining !== 1 ? 's' : ''} left · {currency.symbol}{formatAmount(Math.max(0, stats.totalBudget - stats.monthSpend), currency.code)} remaining
                </Text>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        borderRadius: 16,
        borderWidth: 1,
        padding: SPACING.md,
        marginBottom: SPACING.sm,
    },
    mainRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: SPACING.md,
    },
    ringContainer: {
        position: 'relative',
        width: RING_SIZE,
        height: RING_SIZE,
    },
    ringCenter: {
        ...StyleSheet.absoluteFillObject,
        alignItems: 'center',
        justifyContent: 'center',
    },
    ringPercent: {
        fontSize: FONT_SIZE.sm - 1,
        fontWeight: '700',
    },
    statsContainer: {
        flex: 1,
        gap: 6,
    },
    statRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    statLabel: {
        fontSize: FONT_SIZE.sm,
        fontWeight: '500',
    },
    statValue: {
        fontSize: FONT_SIZE.md,
        fontWeight: '700',
    },
    addBtn: {
        width: 40,
        height: 40,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 4,
        elevation: 3,
    },
    footer: {
        fontSize: FONT_SIZE.sm - 1,
        marginTop: SPACING.sm,
        textAlign: 'center',
    },
});

export default QuickGlanceCard;

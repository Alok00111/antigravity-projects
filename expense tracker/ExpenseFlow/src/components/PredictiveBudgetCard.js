// File: src/components/PredictiveBudgetCard.js
// Shows AI-generated budget suggestions per category on the BudgetScreen

import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { SPACING, FONT_SIZE } from '../utils/constants';
import { formatAmount } from '../utils/currencies';

const CONFIDENCE_CONFIG = {
    High: { color: '#10B981', icon: 'shield-checkmark' },
    Medium: { color: '#F59E0B', icon: 'shield-half' },
    Low: { color: '#EF4444', icon: 'shield-outline' },
};

const TREND_ICONS = {
    up: { icon: 'trending-up', color: '#EF4444', label: 'Rising' },
    down: { icon: 'trending-down', color: '#10B981', label: 'Falling' },
    stable: { icon: 'remove', color: '#3B82F6', label: 'Stable' },
};

const PredictiveBudgetCard = ({ predictions, onApply, onApplyAll }) => {
    const { colors, isDark, currency } = useTheme();
    const [expanded, setExpanded] = useState(false);

    if (!predictions || predictions.length === 0) return null;

    const nextMonth = new Date();
    nextMonth.setMonth(nextMonth.getMonth() + 1);
    const monthName = nextMonth.toLocaleString('en', { month: 'long' });

    const shown = expanded ? predictions : predictions.slice(0, 3);

    return (
        <View style={[styles.container, { backgroundColor: isDark ? `${colors.primary}10` : `${colors.primary}08`, borderColor: `${colors.primary}25` }]}>
            {/* Header */}
            <View style={styles.header}>
                <View style={styles.headerLeft}>
                    <View style={[styles.headerIcon, { backgroundColor: `${colors.primary}20` }]}>
                        <Ionicons name="sparkles" size={18} color={colors.primary} />
                    </View>
                    <View>
                        <Text style={[styles.headerTitle, { color: colors.text }]}>
                            Suggested for {monthName}
                        </Text>
                        <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>
                            Based on your spending patterns
                        </Text>
                    </View>
                </View>
            </View>

            {/* Category predictions */}
            {shown.map((pred) => {
                const conf = CONFIDENCE_CONFIG[pred.confidence] || CONFIDENCE_CONFIG.Low;
                const trend = TREND_ICONS[pred.trend] || TREND_ICONS.stable;

                return (
                    <View key={pred.categoryId} style={[styles.predRow, { borderTopColor: `${colors.border}60` }]}>
                        <View style={styles.predLeft}>
                            <View style={[styles.catIcon, { backgroundColor: `${pred.categoryColor}18` }]}>
                                <Ionicons name={pred.categoryIcon} size={16} color={pred.categoryColor} />
                            </View>
                            <View style={styles.predInfo}>
                                <Text style={[styles.catLabel, { color: colors.text }]}>{pred.categoryLabel}</Text>
                                <View style={styles.predMeta}>
                                    <Ionicons name={trend.icon} size={12} color={trend.color} />
                                    <Text style={[styles.metaText, { color: colors.textSecondary }]}>
                                        {currency.symbol}{formatAmount(pred.predicted, currency.code)}
                                    </Text>
                                    <Ionicons name={conf.icon} size={12} color={conf.color} />
                                    <Text style={[styles.metaText, { color: conf.color }]}>{pred.confidence}</Text>
                                </View>
                            </View>
                        </View>
                        <TouchableOpacity
                            style={[styles.applyBtn, { backgroundColor: `${colors.primary}15`, borderColor: `${colors.primary}30` }]}
                            onPress={() => onApply(pred.categoryId, pred.recommended)}
                            activeOpacity={0.7}
                        >
                            <Text style={[styles.applyAmount, { color: colors.primary }]}>
                                {currency.symbol}{formatAmount(pred.recommended, currency.code)}
                            </Text>
                            <Text style={[styles.applyLabel, { color: colors.primary }]}>Apply</Text>
                        </TouchableOpacity>
                    </View>
                );
            })}

            {/* Footer actions */}
            <View style={styles.footer}>
                {predictions.length > 3 && (
                    <TouchableOpacity onPress={() => setExpanded(!expanded)} activeOpacity={0.7}>
                        <Text style={[styles.footerLink, { color: colors.primary }]}>
                            {expanded ? 'Show Less' : `Show All (${predictions.length})`}
                        </Text>
                    </TouchableOpacity>
                )}
                <TouchableOpacity
                    style={[styles.applyAllBtn, { backgroundColor: colors.primary }]}
                    onPress={onApplyAll}
                    activeOpacity={0.8}
                >
                    <Ionicons name="checkmark-done" size={16} color="#FFF" />
                    <Text style={styles.applyAllText}>Apply All</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        borderRadius: 16,
        borderWidth: 1,
        padding: SPACING.md,
        marginBottom: SPACING.lg,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: SPACING.sm,
    },
    headerLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: SPACING.sm,
    },
    headerIcon: {
        width: 36,
        height: 36,
        borderRadius: 10,
        alignItems: 'center',
        justifyContent: 'center',
    },
    headerTitle: {
        fontSize: FONT_SIZE.md,
        fontWeight: '700',
    },
    headerSubtitle: {
        fontSize: FONT_SIZE.sm,
        marginTop: 1,
    },
    predRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: SPACING.sm + 2,
        borderTopWidth: 1,
    },
    predLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
        gap: SPACING.sm,
    },
    catIcon: {
        width: 32,
        height: 32,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
    },
    predInfo: {
        flex: 1,
    },
    catLabel: {
        fontSize: FONT_SIZE.sm,
        fontWeight: '600',
    },
    predMeta: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        marginTop: 2,
    },
    metaText: {
        fontSize: FONT_SIZE.sm - 1,
        fontWeight: '500',
    },
    applyBtn: {
        alignItems: 'center',
        paddingHorizontal: SPACING.sm + 2,
        paddingVertical: SPACING.xs + 2,
        borderRadius: 10,
        borderWidth: 1,
        minWidth: 80,
    },
    applyAmount: {
        fontSize: FONT_SIZE.sm,
        fontWeight: '700',
    },
    applyLabel: {
        fontSize: FONT_SIZE.sm - 2,
        fontWeight: '600',
        marginTop: 1,
    },
    footer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginTop: SPACING.sm,
        paddingTop: SPACING.sm,
    },
    footerLink: {
        fontSize: FONT_SIZE.sm,
        fontWeight: '600',
    },
    applyAllBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        paddingHorizontal: SPACING.md,
        paddingVertical: SPACING.sm,
        borderRadius: 10,
    },
    applyAllText: {
        fontSize: FONT_SIZE.sm,
        fontWeight: '700',
        color: '#FFF',
    },
});

export default PredictiveBudgetCard;

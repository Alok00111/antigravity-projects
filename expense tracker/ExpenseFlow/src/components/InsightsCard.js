// File: src/components/InsightsCard.js
// Horizontal carousel of smart spending insights on Dashboard

import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { SPACING, FONT_SIZE } from '../utils/constants';

const InsightsCard = ({ insights }) => {
    const { colors, isDark } = useTheme();

    if (!insights || insights.length === 0) return null;

    return (
        <View style={styles.container}>
            <View style={styles.headerRow}>
                <Ionicons name="bulb" size={18} color="#F59E0B" />
                <Text style={[styles.headerText, { color: colors.text }]}>Smart Insights</Text>
            </View>
            <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
            >
                {insights.map((insight) => (
                    <View
                        key={insight.id}
                        style={[
                            styles.chip,
                            {
                                backgroundColor: isDark
                                    ? `${insight.color}18`
                                    : `${insight.color}10`,
                                borderColor: `${insight.color}30`,
                            },
                        ]}
                    >
                        <View
                            style={[
                                styles.iconCircle,
                                { backgroundColor: `${insight.color}25` },
                            ]}
                        >
                            <Ionicons name={insight.icon} size={16} color={insight.color} />
                        </View>
                        <Text
                            style={[styles.chipText, { color: colors.text }]}
                            numberOfLines={2}
                        >
                            {insight.text}
                        </Text>
                    </View>
                ))}
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        marginTop: SPACING.sm,
        marginBottom: SPACING.sm,
    },
    headerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginBottom: SPACING.sm,
    },
    headerText: {
        fontSize: FONT_SIZE.md,
        fontWeight: '700',
    },
    scrollContent: {
        gap: SPACING.sm,
        paddingRight: SPACING.md,
    },
    chip: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: SPACING.sm + 2,
        paddingHorizontal: SPACING.md,
        borderRadius: 14,
        borderWidth: 1,
        maxWidth: 260,
        gap: SPACING.sm,
    },
    iconCircle: {
        width: 32,
        height: 32,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
    },
    chipText: {
        fontSize: FONT_SIZE.sm,
        fontWeight: '600',
        flex: 1,
        lineHeight: 18,
    },
});

export default InsightsCard;

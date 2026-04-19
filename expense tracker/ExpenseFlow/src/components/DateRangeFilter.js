// File: src/components/DateRangeFilter.js

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { SPACING, FONT_SIZE } from '../utils/constants';

const FILTER_OPTIONS = [
    { key: 'all', label: 'All' },
    { key: 'today', label: 'Today' },
    { key: 'thisWeek', label: 'This Week' },
    { key: 'thisMonth', label: 'This Month' },
    { key: 'lastMonth', label: 'Last Month' },
];

const DateRangeFilter = ({ selected, onSelect }) => {
    const { colors } = useTheme();

    return (
        <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.container}
        >
            {FILTER_OPTIONS.map((option) => (
                <TouchableOpacity
                    key={option.key}
                    style={[
                        styles.chip,
                        { backgroundColor: colors.card, borderColor: colors.border },
                        selected === option.key && { backgroundColor: colors.primary, borderColor: colors.primary },
                    ]}
                    onPress={() => onSelect(option.key)}
                    activeOpacity={0.7}
                >
                    <Text
                        style={[
                            styles.chipText,
                            { color: colors.textSecondary },
                            selected === option.key && styles.chipTextActive,
                        ]}
                    >
                        {option.label}
                    </Text>
                </TouchableOpacity>
            ))}
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: {
        gap: SPACING.sm,
        paddingVertical: SPACING.xs,
    },
    chip: {
        paddingHorizontal: SPACING.md,
        paddingVertical: SPACING.xs + 2,
        borderRadius: 20,
        borderWidth: 1,
    },
    chipText: {
        fontSize: FONT_SIZE.sm,
        fontWeight: '600',
    },
    chipTextActive: {
        color: '#FFF',
    },
});

export default DateRangeFilter;

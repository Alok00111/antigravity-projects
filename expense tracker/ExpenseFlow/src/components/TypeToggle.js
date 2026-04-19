// File: src/components/TypeToggle.js

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { SPACING, FONT_SIZE, TRANSACTION_TYPES } from '../utils/constants';

const TypeToggle = ({ selectedType, onToggle }) => {
    const { colors } = useTheme();
    const isExpense = selectedType === TRANSACTION_TYPES.EXPENSE;

    return (
        <View style={[styles.container, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <TouchableOpacity
                style={[
                    styles.option,
                    isExpense && [styles.activeOption, { backgroundColor: colors.danger }],
                ]}
                onPress={() => onToggle(TRANSACTION_TYPES.EXPENSE)}
                activeOpacity={0.8}
            >
                <Text style={[styles.optionText, { color: colors.textSecondary }, isExpense && styles.activeText]}>
                    Expense
                </Text>
            </TouchableOpacity>
            <TouchableOpacity
                style={[
                    styles.option,
                    !isExpense && [styles.activeOption, { backgroundColor: colors.success }],
                ]}
                onPress={() => onToggle(TRANSACTION_TYPES.INCOME)}
                activeOpacity={0.8}
            >
                <Text style={[styles.optionText, { color: colors.textSecondary }, !isExpense && styles.activeText]}>
                    Income
                </Text>
            </TouchableOpacity>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        borderRadius: 12,
        borderWidth: 1,
        padding: 4,
    },
    option: {
        flex: 1,
        paddingVertical: SPACING.sm + 2,
        alignItems: 'center',
        borderRadius: 10,
    },
    activeOption: {},
    optionText: {
        fontSize: FONT_SIZE.md,
        fontWeight: '600',
    },
    activeText: {
        color: '#FFF',
        fontWeight: '700',
    },
});

export default TypeToggle;

// File: src/components/EmptyState.js

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { SPACING, FONT_SIZE } from '../utils/constants';

const EmptyState = ({ icon, title, subtitle, actionLabel, onAction }) => {
    const { colors } = useTheme();

    return (
        <View style={styles.container}>
            <View style={[styles.iconCircle, { backgroundColor: `${colors.primary}12` }]}>
                <Ionicons name={icon} size={48} color={colors.primary} />
            </View>
            <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
            {subtitle && <Text style={[styles.subtitle, { color: colors.textSecondary }]}>{subtitle}</Text>}
            {actionLabel && onAction && (
                <TouchableOpacity
                    style={[styles.actionButton, { backgroundColor: colors.primary }]}
                    onPress={onAction}
                    activeOpacity={0.8}
                >
                    <Text style={styles.actionText}>{actionLabel}</Text>
                </TouchableOpacity>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: SPACING.xl * 2,
        paddingHorizontal: SPACING.lg,
    },
    iconCircle: {
        width: 96,
        height: 96,
        borderRadius: 48,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: SPACING.lg,
    },
    title: {
        fontSize: FONT_SIZE.lg,
        fontWeight: '700',
        textAlign: 'center',
        marginBottom: SPACING.sm,
    },
    subtitle: {
        fontSize: FONT_SIZE.md,
        textAlign: 'center',
        lineHeight: 22,
    },
    actionButton: {
        marginTop: SPACING.lg,
        paddingHorizontal: SPACING.lg,
        paddingVertical: SPACING.sm + 4,
        borderRadius: 12,
    },
    actionText: {
        color: '#FFF',
        fontSize: FONT_SIZE.md,
        fontWeight: '700',
    },
});

export default EmptyState;

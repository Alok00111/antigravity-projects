// File: src/components/SummaryCard.js

import React, { useRef, useEffect } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { SPACING, FONT_SIZE } from '../utils/constants';
import { formatAmount } from '../utils/currencies';

const SummaryCard = ({ title, amount, icon, iconBgColor, amountColor }) => {
    const { colors, currency } = useTheme();
    const scaleAnim = useRef(new Animated.Value(0.92)).current;

    useEffect(() => {
        Animated.spring(scaleAnim, {
            toValue: 1,
            friction: 5,
            tension: 80,
            useNativeDriver: true,
        }).start();
    }, []);

    return (
        <Animated.View style={[styles.card, { backgroundColor: colors.card, transform: [{ scale: scaleAnim }] }]}>
            <View style={[styles.iconCircle, { backgroundColor: iconBgColor || `${colors.primary}18` }]}>
                <Ionicons name={icon} size={22} color={amountColor || colors.primary} />
            </View>
            <Text style={[styles.title, { color: colors.textSecondary }]}>{title}</Text>
            <Text style={[styles.amount, { color: amountColor || colors.text }]}>
                {currency.symbol}{formatAmount(amount, currency.code, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </Text>
        </Animated.View>
    );
};

const styles = StyleSheet.create({
    card: {
        flex: 1,
        borderRadius: 16,
        padding: SPACING.md,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 8,
        elevation: 3,
    },
    iconCircle: {
        width: 40,
        height: 40,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: SPACING.sm,
    },
    title: {
        fontSize: FONT_SIZE.sm,
        fontWeight: '600',
        marginBottom: 4,
    },
    amount: {
        fontSize: FONT_SIZE.lg,
        fontWeight: '700',
    },
});

export default SummaryCard;

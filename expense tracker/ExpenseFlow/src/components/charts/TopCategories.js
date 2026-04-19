// File: src/components/charts/TopCategories.js

import React, { useRef, useEffect } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { SPACING, FONT_SIZE } from '../../utils/constants';
import { formatAmount } from '../../utils/currencies';

const TopCategories = ({ data = [] }) => {
    const { colors, currency } = useTheme();
    const currencyCode = currency.code;
    const animRefs = useRef([]);

    useEffect(() => {
        if (data.length) {
            animRefs.current = data.map(() => new Animated.Value(0));
            const anims = animRefs.current.map((anim) =>
                Animated.spring(anim, {
                    toValue: 1,
                    friction: 7,
                    tension: 40,
                    useNativeDriver: true,
                })
            );
            Animated.stagger(100, anims).start();
        }
    }, [data]);

    if (!data.length) return null;

    const maxAmount = data[0]?.amount || 1;

    return (
        <View style={[styles.container, { backgroundColor: colors.card }]}>
            <Text style={[styles.title, { color: colors.text }]}>Top Categories</Text>
            {data.map((item, i) => {
                const progress = item.amount / maxAmount;
                const animValue = animRefs.current[i] || new Animated.Value(1);
                return (
                    <Animated.View
                        key={i}
                        style={[
                            styles.row,
                            {
                                opacity: animValue,
                                transform: [{
                                    translateX: animValue.interpolate({
                                        inputRange: [0, 1],
                                        outputRange: [-60, 0],
                                    }),
                                }],
                            },
                        ]}
                    >
                        <View style={styles.rankWrapper}>
                            <Text style={[styles.rank, { color: colors.textSecondary }]}>{i + 1}</Text>
                        </View>
                        <View style={[styles.iconCircle, { backgroundColor: `${item.color}18` }]}>
                            <Ionicons name={item.icon} size={18} color={item.color} />
                        </View>
                        <View style={styles.infoCol}>
                            <View style={styles.labelRow}>
                                <Text style={[styles.label, { color: colors.text }]}>{item.label}</Text>
                                <Text style={[styles.amount, { color: colors.text }]}>
                                    {currency.symbol}{formatAmount(item.amount, currencyCode)}
                                </Text>
                            </View>
                            <View style={[styles.progressTrack, { backgroundColor: colors.border }]}>
                                <View
                                    style={[
                                        styles.progressFill,
                                        { width: `${progress * 100}%`, backgroundColor: item.color },
                                    ]}
                                />
                            </View>
                        </View>
                    </Animated.View>
                );
            })}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        borderRadius: 16,
        padding: SPACING.md,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 8,
        elevation: 3,
    },
    title: {
        fontSize: FONT_SIZE.lg,
        fontWeight: '700',
        marginBottom: SPACING.md,
    },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: SPACING.sm + 4,
    },
    rankWrapper: {
        width: 20,
        alignItems: 'center',
    },
    rank: {
        fontSize: FONT_SIZE.sm,
        fontWeight: '700',
    },
    iconCircle: {
        width: 34,
        height: 34,
        borderRadius: 10,
        alignItems: 'center',
        justifyContent: 'center',
        marginLeft: SPACING.sm,
    },
    infoCol: {
        flex: 1,
        marginLeft: SPACING.sm,
    },
    labelRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 4,
    },
    label: {
        fontSize: FONT_SIZE.md,
        fontWeight: '600',
    },
    amount: {
        fontSize: FONT_SIZE.md,
        fontWeight: '700',
    },
    progressTrack: {
        height: 6,
        borderRadius: 3,
        overflow: 'hidden',
    },
    progressFill: {
        height: '100%',
        borderRadius: 3,
    },
});

export default TopCategories;

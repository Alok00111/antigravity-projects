// File: src/components/SkeletonLoader.js
// Reusable shimmer skeleton placeholder component

import React, { useRef, useEffect } from 'react';
import { View, StyleSheet, Animated, Dimensions } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { SPACING } from '../utils/constants';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const ShimmerBlock = ({ width = '100%', height = 16, borderRadius = 8, style }) => {
    const { colors, isDark } = useTheme();
    const shimmerAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        const loop = Animated.loop(
            Animated.timing(shimmerAnim, {
                toValue: 1,
                duration: 1200,
                useNativeDriver: true,
            })
        );
        loop.start();
        return () => loop.stop();
    }, []);

    const baseColor = isDark ? '#1E293B' : '#E5E7EB';
    const shimmerColor = isDark ? '#334155' : '#F3F4F6';

    const translateX = shimmerAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [-SCREEN_WIDTH, SCREEN_WIDTH],
    });

    return (
        <View
            style={[
                {
                    width,
                    height,
                    borderRadius,
                    backgroundColor: baseColor,
                    overflow: 'hidden',
                },
                style,
            ]}
        >
            <Animated.View
                style={{
                    ...StyleSheet.absoluteFillObject,
                    backgroundColor: shimmerColor,
                    opacity: 0.5,
                    transform: [{ translateX }],
                    width: '60%',
                }}
            />
        </View>
    );
};

// Dashboard skeleton
export const DashboardSkeleton = () => (
    <View style={styles.container}>
        {/* Greeting */}
        <View style={styles.row}>
            <View>
                <ShimmerBlock width={140} height={28} />
                <ShimmerBlock width={100} height={16} style={{ marginTop: 6 }} />
            </View>
            <ShimmerBlock width={44} height={44} borderRadius={14} />
        </View>

        {/* Balance Card */}
        <ShimmerBlock width="100%" height={90} borderRadius={16} style={{ marginTop: SPACING.lg }} />

        {/* Income + Expense Cards */}
        <View style={[styles.row, { marginTop: SPACING.sm }]}>
            <ShimmerBlock width="48%" height={90} borderRadius={16} />
            <ShimmerBlock width="48%" height={90} borderRadius={16} />
        </View>

        {/* Prediction */}
        <ShimmerBlock width="100%" height={100} borderRadius={16} style={{ marginTop: SPACING.md }} />

        {/* Section header */}
        <View style={[styles.row, { marginTop: SPACING.lg }]}>
            <ShimmerBlock width={160} height={20} />
            <ShimmerBlock width={50} height={16} />
        </View>

        {/* Transaction items */}
        {[1, 2, 3, 4].map((i) => (
            <View key={i} style={[styles.txnRow, { marginTop: SPACING.sm }]}>
                <ShimmerBlock width={44} height={44} borderRadius={12} />
                <View style={{ flex: 1, marginLeft: SPACING.sm }}>
                    <ShimmerBlock width="60%" height={16} />
                    <ShimmerBlock width="40%" height={12} style={{ marginTop: 6 }} />
                </View>
                <ShimmerBlock width={70} height={18} />
            </View>
        ))}
    </View>
);

// Transaction list skeleton
export const TransactionsSkeleton = () => (
    <View style={styles.container}>
        {/* Search bar */}
        <ShimmerBlock width="100%" height={44} borderRadius={12} />

        {/* Filter chips */}
        <View style={[styles.row, { marginTop: SPACING.md }]}>
            {[80, 90, 100, 70].map((w, i) => (
                <ShimmerBlock key={i} width={w} height={32} borderRadius={16} />
            ))}
        </View>

        {/* Date header */}
        <ShimmerBlock width={120} height={16} style={{ marginTop: SPACING.lg }} />

        {/* Items */}
        {[1, 2, 3, 4, 5, 6].map((i) => (
            <View key={i} style={[styles.txnRow, { marginTop: SPACING.sm }]}>
                <ShimmerBlock width={44} height={44} borderRadius={12} />
                <View style={{ flex: 1, marginLeft: SPACING.sm }}>
                    <ShimmerBlock width="55%" height={16} />
                    <ShimmerBlock width="35%" height={12} style={{ marginTop: 6 }} />
                </View>
                <ShimmerBlock width={65} height={18} />
            </View>
        ))}
    </View>
);

// Analytics skeleton
export const AnalyticsSkeleton = () => (
    <View style={styles.container}>
        {/* Period selector */}
        <View style={[styles.row, { marginTop: SPACING.sm }]}>
            {[60, 60, 80, 60].map((w, i) => (
                <ShimmerBlock key={i} width={w} height={32} borderRadius={16} />
            ))}
        </View>

        {/* Donut chart */}
        <ShimmerBlock width="100%" height={280} borderRadius={16} style={{ marginTop: SPACING.lg }} />

        {/* Bar chart */}
        <ShimmerBlock width="100%" height={240} borderRadius={16} style={{ marginTop: SPACING.md }} />

        {/* Top categories */}
        <ShimmerBlock width="100%" height={200} borderRadius={16} style={{ marginTop: SPACING.md }} />
    </View>
);

const styles = StyleSheet.create({
    container: {
        padding: SPACING.md,
    },
    row: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    txnRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
});

export default ShimmerBlock;

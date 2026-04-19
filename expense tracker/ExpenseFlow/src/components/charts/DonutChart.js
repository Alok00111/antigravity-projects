// File: src/components/charts/DonutChart.js

import React, { useRef, useEffect, useState } from 'react';
import { View, Text, StyleSheet, Animated, TouchableOpacity } from 'react-native';
import Svg, { Path, G, Circle } from 'react-native-svg';
import { useTheme } from '../../context/ThemeContext';
import { SPACING, FONT_SIZE } from '../../utils/constants';
import { formatAmount } from '../../utils/currencies';
import * as haptics from '../../utils/haptics';

const SIZE = 200;
const RADIUS = 80;
const STROKE_WIDTH = 28;
const CENTER = SIZE / 2;

const polarToCartesian = (cx, cy, r, angle) => ({
    x: cx + r * Math.cos((angle - 90) * (Math.PI / 180)),
    y: cy + r * Math.sin((angle - 90) * (Math.PI / 180)),
});

const describeArc = (cx, cy, r, startAngle, endAngle) => {
    const start = polarToCartesian(cx, cy, r, endAngle);
    const end = polarToCartesian(cx, cy, r, startAngle);
    const largeArc = endAngle - startAngle > 180 ? 1 : 0;
    return `M ${start.x} ${start.y} A ${r} ${r} 0 ${largeArc} 0 ${end.x} ${end.y}`;
};

const DonutChart = ({ data = [], total = 0 }) => {
    const { colors, currency } = useTheme();
    const currencyCode = currency.code;
    const scaleAnim = useRef(new Animated.Value(0)).current;
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const highlightAnim = useRef(new Animated.Value(0)).current;
    const [selectedIndex, setSelectedIndex] = useState(null);
    const autoHideTimer = useRef(null);

    useEffect(() => {
        if (data.length && total > 0) {
            scaleAnim.setValue(0);
            fadeAnim.setValue(0);
            Animated.parallel([
                Animated.spring(scaleAnim, {
                    toValue: 1,
                    friction: 6,
                    tension: 40,
                    useNativeDriver: true,
                }),
                Animated.timing(fadeAnim, {
                    toValue: 1,
                    duration: 400,
                    useNativeDriver: true,
                }),
            ]).start();
        }
    }, [data, total]);

    useEffect(() => {
        return () => {
            if (autoHideTimer.current) clearTimeout(autoHideTimer.current);
        };
    }, []);

    const handleSelect = (index) => {
        if (autoHideTimer.current) clearTimeout(autoHideTimer.current);

        if (selectedIndex === index) {
            // Deselect
            setSelectedIndex(null);
            Animated.timing(highlightAnim, {
                toValue: 0,
                duration: 200,
                useNativeDriver: true,
            }).start();
            return;
        }

        haptics.selection();
        setSelectedIndex(index);
        highlightAnim.setValue(0);
        Animated.spring(highlightAnim, {
            toValue: 1,
            friction: 5,
            tension: 80,
            useNativeDriver: true,
        }).start();

        // Auto-hide after 3 seconds
        autoHideTimer.current = setTimeout(() => {
            setSelectedIndex(null);
            Animated.timing(highlightAnim, {
                toValue: 0,
                duration: 200,
                useNativeDriver: true,
            }).start();
        }, 3000);
    };

    if (!data.length || total === 0) return null;

    let currentAngle = 0;
    const arcs = data.map((item) => {
        const angle = (item.amount / total) * 359.99;
        const arc = {
            ...item,
            startAngle: currentAngle,
            endAngle: currentAngle + angle,
        };
        currentAngle += angle;
        return arc;
    });

    const selectedItem = selectedIndex !== null ? data[selectedIndex] : null;

    return (
        <Animated.View style={[styles.container, { backgroundColor: colors.card, opacity: fadeAnim, transform: [{ scale: scaleAnim }] }]}>
            <View style={styles.chartWrapper}>
                <Svg width={SIZE} height={SIZE}>
                    <Circle
                        cx={CENTER}
                        cy={CENTER}
                        r={RADIUS}
                        fill="none"
                        stroke={colors.border}
                        strokeWidth={STROKE_WIDTH}
                    />
                    <G>
                        {arcs.map((arc, i) => (
                            <Path
                                key={i}
                                d={describeArc(CENTER, CENTER, RADIUS, arc.startAngle, arc.endAngle)}
                                fill="none"
                                stroke={arc.color}
                                strokeWidth={selectedIndex === i ? STROKE_WIDTH + 6 : STROKE_WIDTH}
                                strokeLinecap="round"
                                opacity={selectedIndex !== null && selectedIndex !== i ? 0.3 : 1}
                            />
                        ))}
                    </G>
                </Svg>
                <View style={styles.centerLabel}>
                    {selectedItem ? (
                        <Animated.View style={{ alignItems: 'center', opacity: highlightAnim, transform: [{ scale: highlightAnim }] }}>
                            <Text style={[styles.selectedLabel, { color: selectedItem.color }]}>
                                {selectedItem.label}
                            </Text>
                            <Text style={[styles.selectedAmount, { color: selectedItem.color }]}>
                                {currency.symbol}{formatAmount(selectedItem.amount, currencyCode)}
                            </Text>
                            <Text style={[styles.selectedPercent, { color: colors.textSecondary }]}>
                                {Math.round((selectedItem.amount / total) * 100)}%
                            </Text>
                        </Animated.View>
                    ) : (
                        <>
                            <Text style={[styles.totalLabel, { color: colors.textSecondary }]}>Total</Text>
                            <Text style={[styles.totalAmount, { color: colors.text }]}>
                                {currency.symbol}{formatAmount(total, currencyCode)}
                            </Text>
                        </>
                    )}
                </View>
            </View>

            {/* Legend — tappable */}
            <View style={styles.legend}>
                {data.map((item, i) => (
                    <TouchableOpacity
                        key={i}
                        style={[
                            styles.legendItem,
                            selectedIndex === i && { backgroundColor: `${item.color}18`, borderRadius: 8, paddingVertical: 4, paddingHorizontal: 6 },
                        ]}
                        onPress={() => handleSelect(i)}
                        activeOpacity={0.7}
                    >
                        <View style={[styles.legendDot, { backgroundColor: item.color }]} />
                        <Text
                            style={[
                                styles.legendLabel,
                                { color: selectedIndex !== null && selectedIndex !== i ? colors.tabInactive : colors.text },
                            ]}
                            numberOfLines={1}
                        >
                            {item.label}
                        </Text>
                        <Text style={[styles.legendValue, { color: selectedIndex === i ? item.color : colors.textSecondary, fontWeight: selectedIndex === i ? '700' : '400' }]}>
                            {selectedIndex === i
                                ? `${currency.symbol}${formatAmount(item.amount, currencyCode)}`
                                : `${Math.round((item.amount / total) * 100)}%`
                            }
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>
        </Animated.View>
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
    chartWrapper: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    centerLabel: {
        position: 'absolute',
        alignItems: 'center',
    },
    totalLabel: {
        fontSize: FONT_SIZE.sm,
        fontWeight: '600',
    },
    totalAmount: {
        fontSize: FONT_SIZE.xl,
        fontWeight: '700',
    },
    selectedLabel: {
        fontSize: FONT_SIZE.sm,
        fontWeight: '700',
    },
    selectedAmount: {
        fontSize: FONT_SIZE.lg,
        fontWeight: '800',
    },
    selectedPercent: {
        fontSize: FONT_SIZE.sm - 1,
        fontWeight: '600',
        marginTop: 2,
    },
    legend: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: SPACING.sm,
        marginTop: SPACING.md,
    },
    legendItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        paddingRight: SPACING.sm,
    },
    legendDot: {
        width: 10,
        height: 10,
        borderRadius: 5,
    },
    legendLabel: {
        fontSize: FONT_SIZE.sm,
        fontWeight: '500',
    },
    legendValue: {
        fontSize: FONT_SIZE.sm,
    },
});

export default DonutChart;

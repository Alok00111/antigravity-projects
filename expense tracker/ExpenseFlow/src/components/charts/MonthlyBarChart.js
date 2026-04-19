// File: src/components/charts/MonthlyBarChart.js

import React, { useRef, useEffect, useState } from 'react';
import { View, Text, StyleSheet, Animated, TouchableOpacity } from 'react-native';
import Svg, { Rect } from 'react-native-svg';
import { useTheme } from '../../context/ThemeContext';
import { SPACING, FONT_SIZE } from '../../utils/constants';
import { formatAmount } from '../../utils/currencies';
import * as haptics from '../../utils/haptics';

const BAR_WIDTH = 16;
const CHART_HEIGHT = 160;
const GAP = 6;

const MonthlyBarChart = ({ data = [] }) => {
    const { colors, currency } = useTheme();
    const currencyCode = currency.code;
    const animRefs = useRef([]);
    const [selected, setSelected] = useState(null); // { monthIndex, type: 'income'|'expense' }
    const tooltipAnim = useRef(new Animated.Value(0)).current;
    const autoHideTimer = useRef(null);

    useEffect(() => {
        if (data.length) {
            animRefs.current = data.map(() => new Animated.Value(0));
            const anims = animRefs.current.map((anim, i) =>
                Animated.spring(anim, {
                    toValue: 1,
                    friction: 6,
                    tension: 50,
                    delay: i * 80,
                    useNativeDriver: true,
                })
            );
            Animated.stagger(80, anims).start();
        }
    }, [data]);

    useEffect(() => {
        return () => {
            if (autoHideTimer.current) clearTimeout(autoHideTimer.current);
        };
    }, []);

    const handleBarPress = (monthIndex, type) => {
        if (autoHideTimer.current) clearTimeout(autoHideTimer.current);

        // Deselect if same
        if (selected && selected.monthIndex === monthIndex && selected.type === type) {
            setSelected(null);
            Animated.timing(tooltipAnim, { toValue: 0, duration: 200, useNativeDriver: true }).start();
            return;
        }

        haptics.selection();
        setSelected({ monthIndex, type });
        tooltipAnim.setValue(0);
        Animated.spring(tooltipAnim, {
            toValue: 1,
            friction: 5,
            tension: 80,
            useNativeDriver: true,
        }).start();

        autoHideTimer.current = setTimeout(() => {
            setSelected(null);
            Animated.timing(tooltipAnim, { toValue: 0, duration: 200, useNativeDriver: true }).start();
        }, 3000);
    };

    if (!data.length) return null;

    const maxValue = Math.max(...data.flatMap((d) => [d.income, d.expense]), 1);

    const selectedItem = selected ? data[selected.monthIndex] : null;
    const selectedAmount = selectedItem
        ? (selected.type === 'income' ? selectedItem.income : selectedItem.expense)
        : 0;
    const selectedLabel = selected
        ? `${selectedItem.month} ${selected.type === 'income' ? 'Income' : 'Expense'}`
        : '';

    return (
        <View style={[styles.container, { backgroundColor: colors.card }]}>
            <View style={styles.titleRow}>
                <Text style={[styles.title, { color: colors.text }]}>Monthly Trends</Text>
                {selected && (
                    <Animated.View style={[
                        styles.tooltip,
                        {
                            backgroundColor: selected.type === 'income' ? `${colors.success}18` : `${colors.danger}18`,
                            opacity: tooltipAnim,
                            transform: [{ scale: tooltipAnim }],
                        },
                    ]}>
                        <Text style={[styles.tooltipLabel, { color: selected.type === 'income' ? colors.success : colors.danger }]}>
                            {selectedLabel}
                        </Text>
                        <Text style={[styles.tooltipAmount, { color: selected.type === 'income' ? colors.success : colors.danger }]}>
                            {currency.symbol}{formatAmount(selectedAmount, currencyCode)}
                        </Text>
                    </Animated.View>
                )}
            </View>

            <View style={styles.chartRow}>
                {data.map((item, i) => {
                    const incomeHeight = (item.income / maxValue) * CHART_HEIGHT;
                    const expenseHeight = (item.expense / maxValue) * CHART_HEIGHT;
                    const animValue = animRefs.current[i] || new Animated.Value(1);
                    const isSelectedMonth = selected && selected.monthIndex === i;
                    const dimmed = selected && !isSelectedMonth;

                    return (
                        <Animated.View
                            key={i}
                            style={[
                                styles.barGroup,
                                {
                                    opacity: animValue.interpolate({
                                        inputRange: [0, 1],
                                        outputRange: [0, dimmed ? 0.3 : 1],
                                    }),
                                    transform: [{
                                        translateY: animValue.interpolate({
                                            inputRange: [0, 1],
                                            outputRange: [40, 0],
                                        }),
                                    }],
                                },
                            ]}
                        >
                            <View style={styles.barsContainer}>
                                {/* Income bar — touchable */}
                                <TouchableOpacity
                                    style={[styles.barTouch, { height: CHART_HEIGHT }]}
                                    onPress={() => handleBarPress(i, 'income')}
                                    activeOpacity={0.7}
                                >
                                    <Svg width={BAR_WIDTH} height={CHART_HEIGHT}>
                                        <Rect
                                            x={0}
                                            y={CHART_HEIGHT - incomeHeight}
                                            width={BAR_WIDTH}
                                            height={incomeHeight || 2}
                                            rx={4}
                                            fill={colors.success}
                                            opacity={isSelectedMonth && selected.type === 'income' ? 1 : 0.85}
                                        />
                                    </Svg>
                                </TouchableOpacity>

                                <View style={{ width: GAP }} />

                                {/* Expense bar — touchable */}
                                <TouchableOpacity
                                    style={[styles.barTouch, { height: CHART_HEIGHT }]}
                                    onPress={() => handleBarPress(i, 'expense')}
                                    activeOpacity={0.7}
                                >
                                    <Svg width={BAR_WIDTH} height={CHART_HEIGHT}>
                                        <Rect
                                            x={0}
                                            y={CHART_HEIGHT - expenseHeight}
                                            width={BAR_WIDTH}
                                            height={expenseHeight || 2}
                                            rx={4}
                                            fill={colors.danger}
                                            opacity={isSelectedMonth && selected.type === 'expense' ? 1 : 0.85}
                                        />
                                    </Svg>
                                </TouchableOpacity>
                            </View>

                            <Text style={[
                                styles.monthLabel,
                                {
                                    color: isSelectedMonth ? colors.text : colors.textSecondary,
                                    fontWeight: isSelectedMonth ? '800' : '600',
                                },
                            ]}>
                                {item.month}
                            </Text>
                        </Animated.View>
                    );
                })}
            </View>

            {/* Legend — also tappable */}
            <View style={styles.legendRow}>
                <TouchableOpacity
                    style={styles.legendItem}
                    onPress={() => {
                        // Sum all income
                        haptics.selection();
                        const totalIncome = data.reduce((sum, d) => sum + d.income, 0);
                        setSelected(null);
                        tooltipAnim.setValue(0);
                        setSelected({ monthIndex: -1, type: 'income', totalAmount: totalIncome });
                        Animated.spring(tooltipAnim, { toValue: 1, friction: 5, tension: 80, useNativeDriver: true }).start();
                        if (autoHideTimer.current) clearTimeout(autoHideTimer.current);
                        autoHideTimer.current = setTimeout(() => {
                            setSelected(null);
                            Animated.timing(tooltipAnim, { toValue: 0, duration: 200, useNativeDriver: true }).start();
                        }, 3000);
                    }}
                    activeOpacity={0.7}
                >
                    <View style={[styles.legendDot, { backgroundColor: colors.success }]} />
                    <Text style={[styles.legendText, { color: colors.textSecondary }]}>Income</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={styles.legendItem}
                    onPress={() => {
                        haptics.selection();
                        const totalExpense = data.reduce((sum, d) => sum + d.expense, 0);
                        setSelected(null);
                        tooltipAnim.setValue(0);
                        setSelected({ monthIndex: -1, type: 'expense', totalAmount: totalExpense });
                        Animated.spring(tooltipAnim, { toValue: 1, friction: 5, tension: 80, useNativeDriver: true }).start();
                        if (autoHideTimer.current) clearTimeout(autoHideTimer.current);
                        autoHideTimer.current = setTimeout(() => {
                            setSelected(null);
                            Animated.timing(tooltipAnim, { toValue: 0, duration: 200, useNativeDriver: true }).start();
                        }, 3000);
                    }}
                    activeOpacity={0.7}
                >
                    <View style={[styles.legendDot, { backgroundColor: colors.danger }]} />
                    <Text style={[styles.legendText, { color: colors.textSecondary }]}>Expense</Text>
                </TouchableOpacity>
            </View>

            {/* Total tooltip when legend tapped */}
            {selected && selected.monthIndex === -1 && (
                <Animated.View style={[
                    styles.totalTooltip,
                    {
                        backgroundColor: selected.type === 'income' ? `${colors.success}18` : `${colors.danger}18`,
                        opacity: tooltipAnim,
                        transform: [{ scale: tooltipAnim }],
                    },
                ]}>
                    <Text style={[styles.tooltipLabel, { color: selected.type === 'income' ? colors.success : colors.danger }]}>
                        Total {selected.type === 'income' ? 'Income' : 'Expense'}
                    </Text>
                    <Text style={[styles.tooltipAmount, { color: selected.type === 'income' ? colors.success : colors.danger }]}>
                        {currency.symbol}{formatAmount(selected.totalAmount || 0, currencyCode)}
                    </Text>
                </Animated.View>
            )}
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
    titleRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: SPACING.md,
    },
    title: {
        fontSize: FONT_SIZE.lg,
        fontWeight: '700',
    },
    tooltip: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingHorizontal: SPACING.sm,
        paddingVertical: 4,
        borderRadius: 10,
    },
    tooltipLabel: {
        fontSize: FONT_SIZE.sm - 1,
        fontWeight: '600',
    },
    tooltipAmount: {
        fontSize: FONT_SIZE.sm,
        fontWeight: '800',
    },
    totalTooltip: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        paddingVertical: SPACING.sm,
        borderRadius: 10,
        marginTop: SPACING.sm,
    },
    chartRow: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        alignItems: 'flex-end',
    },
    barGroup: {
        alignItems: 'center',
    },
    barsContainer: {
        flexDirection: 'row',
        alignItems: 'flex-end',
    },
    barTouch: {
        justifyContent: 'flex-end',
    },
    monthLabel: {
        fontSize: FONT_SIZE.sm - 1,
        fontWeight: '600',
        marginTop: 6,
    },
    legendRow: {
        flexDirection: 'row',
        justifyContent: 'center',
        gap: SPACING.lg,
        marginTop: SPACING.md,
    },
    legendItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        paddingVertical: 4,
        paddingHorizontal: 8,
    },
    legendDot: {
        width: 10,
        height: 10,
        borderRadius: 5,
    },
    legendText: {
        fontSize: FONT_SIZE.sm,
    },
});

export default MonthlyBarChart;

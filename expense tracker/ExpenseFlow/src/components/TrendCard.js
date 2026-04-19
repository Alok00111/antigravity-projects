// File: src/components/TrendCard.js
// Premium spending trend card with vibrant SVG line chart

import React, { useMemo, useRef, useEffect, useState } from 'react';
import { View, Text, StyleSheet, Animated, useWindowDimensions, TouchableOpacity } from 'react-native';
import Svg, {
    Path, Defs, LinearGradient, Stop, Circle, Line,
    Text as SvgText, Rect,
} from 'react-native-svg';
import { LinearGradient as ExpoGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { SPACING, FONT_SIZE } from '../utils/constants';
import { getDailySpending } from '../utils/trendHelpers';
import { formatAmount } from '../utils/currencies';
import * as haptics from '../utils/haptics';

const CHART_HEIGHT = 170;
const CHART_PADDING_TOP = 16;
const CHART_PADDING_BOTTOM = 28;
const Y_AXIS_WIDTH = 40;
const CHART_PADDING_RIGHT = 12;
const CHART_INNER_PAD = 16; // horizontal padding inside chart so edge dots aren't clipped
const DAY_COUNT = 14;

/**
 * Format amounts for the Y-axis labels (compact: 1K, 2.5K, etc.)
 */
const formatYLabel = (val, symbol) => {
    if (val >= 100000) return `${symbol}${(val / 100000).toFixed(1)}L`;
    if (val >= 1000) return `${symbol}${(val / 1000).toFixed(val >= 10000 ? 0 : 1)}K`;
    return `${symbol}${val.toFixed(0)}`;
};

const TrendCard = ({ trend, transactions = [] }) => {
    const { colors, isDark, currency } = useTheme();
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const pulseAnim = useRef(new Animated.Value(1)).current;
    const tooltipAnim = useRef(new Animated.Value(0)).current;
    const autoHideTimer = useRef(null);
    const [selected, setSelected] = useState(null); // index into dailyData
    const { width: screenWidth } = useWindowDimensions();
    const cardInnerWidth = screenWidth - SPACING.md * 4;
    const chartDrawWidth = cardInnerWidth - Y_AXIS_WIDTH - CHART_PADDING_RIGHT;

    useEffect(() => {
        Animated.spring(fadeAnim, { toValue: 1, friction: 6, tension: 40, useNativeDriver: true }).start();

        Animated.loop(
            Animated.sequence([
                Animated.timing(pulseAnim, { toValue: 1.6, duration: 1200, useNativeDriver: true }),
                Animated.timing(pulseAnim, { toValue: 1, duration: 1200, useNativeDriver: true }),
            ])
        ).start();

        return () => {
            if (autoHideTimer.current) clearTimeout(autoHideTimer.current);
        };
    }, []);

    const dailyData = useMemo(
        () => getDailySpending(transactions, DAY_COUNT),
        [transactions]
    );

    if (!trend) return null;

    const isUp = trend.direction === 'up';
    const isDown = trend.direction === 'down';

    const lineColor1 = isUp ? '#FF6B6B' : isDown ? '#00E5A0' : '#A78BFA';
    const lineColor2 = isUp ? '#EE5A24' : isDown ? '#00B4D8' : '#818CF8';
    const glowColor = isUp ? '#FF6B6B' : isDown ? '#00E5A0' : '#A78BFA';
    const fillColor1 = isUp ? '#FF6B6B' : isDown ? '#00E5A0' : '#A78BFA';
    const fillColor2 = isDark ? '#0F0F14' : '#FFFFFF';
    const cardGrad1 = isDark ? '#1E1B2E' : '#F8F6FF';
    const cardGrad2 = isDark ? '#161422' : '#FFFFFF';
    const trendIcon = isUp ? 'trending-up' : isDown ? 'trending-down' : 'remove-outline';
    const trendLabel = isUp ? 'more' : isDown ? 'less' : 'same';

    const sym = currency?.symbol || '₹';
    const maxAmount = Math.max(...dailyData.map((d) => d.amount), 1);
    const hasData = dailyData.some((d) => d.amount > 0);

    // Handle tap on a data point
    const handleDotPress = (index) => {
        if (autoHideTimer.current) clearTimeout(autoHideTimer.current);

        if (selected === index) {
            setSelected(null);
            Animated.timing(tooltipAnim, { toValue: 0, duration: 200, useNativeDriver: true }).start();
            return;
        }

        haptics.selection();
        setSelected(index);
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
        }, 3500);
    };

    // Build nice Y-axis tick values
    const yTicks = useMemo(() => {
        const steps = [0, 0.25, 0.5, 0.75, 1];
        return steps.map((pct) => ({
            value: maxAmount * pct,
            pct,
        }));
    }, [maxAmount]);

    const renderChart = (cw) => {
        if (!hasData || cw <= 0) {
            return (
                <View style={[styles.emptyChart, { height: CHART_HEIGHT }]}>
                    <View style={[styles.emptyIconWrap, { backgroundColor: `${glowColor}15` }]}>
                        <Ionicons name="analytics-outline" size={28} color={`${glowColor}60`} />
                    </View>
                    <Text style={[styles.emptyChartText, { color: colors.textSecondary }]}>
                        Start spending to see your trend
                    </Text>
                </View>
            );
        }

        const drawHeight = CHART_HEIGHT - CHART_PADDING_TOP - CHART_PADDING_BOTTOM;
        const usableWidth = cw - CHART_INNER_PAD * 2;
        const stepX = usableWidth / (dailyData.length - 1 || 1);

        const points = dailyData.map((d, i) => ({
            x: CHART_INNER_PAD + i * stepX,
            y: CHART_PADDING_TOP + drawHeight - (d.amount / maxAmount) * drawHeight,
            data: d,
            index: i,
        }));

        const buildSmoothPath = (pts) => {
            if (pts.length < 2) return '';
            let path = `M ${pts[0].x} ${pts[0].y}`;
            for (let i = 0; i < pts.length - 1; i++) {
                const tension = 0.3;
                const cp1x = pts[i].x + stepX * tension;
                const cp1y = pts[i].y;
                const cp2x = pts[i + 1].x - stepX * tension;
                const cp2y = pts[i + 1].y;
                path += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${pts[i + 1].x} ${pts[i + 1].y}`;
            }
            return path;
        };

        const buildFillPath = (pts) => {
            const lp = buildSmoothPath(pts);
            if (!lp) return '';
            return `${lp} L ${pts[pts.length - 1].x} ${CHART_HEIGHT - CHART_PADDING_BOTTOM} L ${pts[0].x} ${CHART_HEIGHT - CHART_PADDING_BOTTOM} Z`;
        };

        const linePath = buildSmoothPath(points);
        const fillPath = buildFillPath(points);
        const labelInterval = Math.max(1, Math.floor(dailyData.length / 5));

        let lastDataIdx = points.length - 1;
        for (let i = points.length - 1; i >= 0; i--) {
            if (points[i].data.amount > 0) { lastDataIdx = i; break; }
        }

        return (
            <View style={styles.chartArea}>
                {/* Y-axis labels */}
                <View style={[styles.yAxis, { height: CHART_HEIGHT }]}>
                    {yTicks.map((tick, idx) => {
                        const y = CHART_PADDING_TOP + drawHeight * (1 - tick.pct);
                        return (
                            <Text
                                key={idx}
                                style={[
                                    styles.yLabel,
                                    {
                                        color: isDark ? '#71717A' : '#A1A1AA',
                                        top: y - 6,
                                    },
                                ]}
                                numberOfLines={1}
                            >
                                {formatYLabel(tick.value, sym)}
                            </Text>
                        );
                    })}
                </View>

                {/* SVG Chart */}
                <View style={styles.svgWrap}>
                    <Svg width={cw} height={CHART_HEIGHT}>
                        <Defs>
                            <LinearGradient id="areaFill" x1="0" y1="0" x2="0" y2="1">
                                <Stop offset="0" stopColor={fillColor1} stopOpacity="0.35" />
                                <Stop offset="0.6" stopColor={fillColor1} stopOpacity="0.08" />
                                <Stop offset="1" stopColor={fillColor2} stopOpacity="0" />
                            </LinearGradient>
                            <LinearGradient id="lineStroke" x1="0" y1="0" x2="1" y2="0">
                                <Stop offset="0" stopColor={lineColor2} stopOpacity="0.6" />
                                <Stop offset="0.4" stopColor={lineColor1} stopOpacity="1" />
                                <Stop offset="1" stopColor={lineColor2} stopOpacity="0.9" />
                            </LinearGradient>
                            <LinearGradient id="glowStroke" x1="0" y1="0" x2="1" y2="0">
                                <Stop offset="0" stopColor={glowColor} stopOpacity="0.15" />
                                <Stop offset="0.5" stopColor={glowColor} stopOpacity="0.3" />
                                <Stop offset="1" stopColor={glowColor} stopOpacity="0.15" />
                            </LinearGradient>
                        </Defs>

                        {/* Grid lines */}
                        {yTicks.map((tick, idx) => {
                            const y = CHART_PADDING_TOP + drawHeight * (1 - tick.pct);
                            return (
                                <Line
                                    key={idx}
                                    x1={0}
                                    x2={cw}
                                    y1={y}
                                    y2={y}
                                    stroke={isDark ? '#FFFFFF10' : '#00000008'}
                                    strokeWidth={1}
                                />
                            );
                        })}

                        {/* Selected vertical indicator line */}
                        {selected !== null && points[selected] && (
                            <Line
                                x1={points[selected].x}
                                x2={points[selected].x}
                                y1={CHART_PADDING_TOP}
                                y2={CHART_HEIGHT - CHART_PADDING_BOTTOM}
                                stroke={lineColor1}
                                strokeWidth={1}
                                strokeDasharray="4,3"
                                opacity={0.5}
                            />
                        )}

                        {/* Gradient area fill */}
                        {fillPath ? <Path d={fillPath} fill="url(#areaFill)" /> : null}

                        {/* Glow line */}
                        {linePath ? (
                            <Path
                                d={linePath}
                                fill="none"
                                stroke="url(#glowStroke)"
                                strokeWidth={10}
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            />
                        ) : null}

                        {/* Main gradient line */}
                        {linePath ? (
                            <Path
                                d={linePath}
                                fill="none"
                                stroke="url(#lineStroke)"
                                strokeWidth={3}
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            />
                        ) : null}

                        {/* Data dots */}
                        {points.map((pt, i) => {
                            const isSelected = selected === i;
                            const isLast = i === lastDataIdx;

                            // Show dot: at selected, last data, peaks/valleys, or if has amount
                            const isPeakOrValley = i > 0 && i < points.length - 1 && (
                                (pt.data.amount > points[i - 1].data.amount && pt.data.amount > points[i + 1].data.amount) ||
                                (pt.data.amount < points[i - 1].data.amount && pt.data.amount < points[i + 1].data.amount)
                            );
                            const showDot = isSelected || isLast || isPeakOrValley || i === 0;
                            if (!showDot && pt.data.amount === 0) return null;

                            const dotR = isSelected ? 5.5 : isLast ? 4 : 3;

                            return (
                                <React.Fragment key={i}>
                                    {isSelected && (
                                        <>
                                            <Circle cx={pt.x} cy={pt.y} r={14} fill={lineColor1} opacity={0.08} />
                                            <Circle cx={pt.x} cy={pt.y} r={9} fill={lineColor1} opacity={0.12} />
                                        </>
                                    )}
                                    {(showDot || pt.data.amount > 0) && (
                                        <>
                                            <Circle
                                                cx={pt.x}
                                                cy={pt.y}
                                                r={dotR}
                                                fill={isDark ? '#1A1A24' : '#FFFFFF'}
                                                stroke={lineColor1}
                                                strokeWidth={isSelected ? 2.5 : isLast ? 2.5 : 2}
                                            />
                                            <Circle
                                                cx={pt.x}
                                                cy={pt.y}
                                                r={isSelected ? 2 : isLast ? 1.8 : 1.2}
                                                fill={lineColor1}
                                            />
                                        </>
                                    )}
                                </React.Fragment>
                            );
                        })}

                        {/* X-axis date labels */}
                        {points.map((pt, i) => {
                            const isSelected = selected === i;
                            if (i % labelInterval !== 0 && i !== points.length - 1 && !isSelected) return null;
                            return (
                                <SvgText
                                    key={`lbl-${i}`}
                                    x={pt.x}
                                    y={CHART_HEIGHT - 6}
                                    fill={isSelected ? lineColor1 : (isDark ? '#71717A' : '#A1A1AA')}
                                    fontSize={isSelected ? 10 : 9}
                                    fontWeight={isSelected ? '700' : '500'}
                                    textAnchor="middle"
                                >
                                    {pt.data.dateStr}
                                </SvgText>
                            );
                        })}
                    </Svg>

                    {/* Invisible hit areas for each data point — overlaid on top */}
                    <View style={[StyleSheet.absoluteFill, styles.hitAreaContainer]} pointerEvents="box-none">
                        {points.map((pt, i) => {
                            const hitLeft = Math.max(0, pt.x - stepX / 2);
                            const hitWidth = Math.min(stepX, cw - hitLeft);
                            return (
                                <TouchableOpacity
                                    key={`hit-${i}`}
                                    style={[
                                        styles.hitArea,
                                        {
                                            left: hitLeft,
                                            width: hitWidth,
                                            height: CHART_HEIGHT - CHART_PADDING_BOTTOM,
                                        },
                                    ]}
                                    onPress={() => handleDotPress(i)}
                                    activeOpacity={1}
                                />
                            );
                        })}
                    </View>
                </View>
            </View>
        );
    };

    // Selected tooltip data
    const selectedData = selected !== null ? dailyData[selected] : null;

    return (
        <Animated.View
            style={[
                styles.outerWrap,
                {
                    opacity: fadeAnim,
                    transform: [{
                        translateY: fadeAnim.interpolate({
                            inputRange: [0, 1],
                            outputRange: [24, 0],
                        }),
                    }],
                },
            ]}
        >
            <ExpoGradient
                colors={[cardGrad1, cardGrad2]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.container}
            >
                {/* Decorative corner glow */}
                <View style={[styles.cornerGlow, { backgroundColor: glowColor, opacity: isDark ? 0.06 : 0.04 }]} />

                {/* Header */}
                <View style={styles.headerRow}>
                    <View style={styles.headerLeft}>
                        <View style={[styles.iconCircle, { backgroundColor: `${glowColor}18` }]}>
                            <Ionicons name={trendIcon} size={18} color={lineColor1} />
                        </View>
                        <View style={styles.headerText}>
                            <Text style={[styles.title, { color: colors.text }]}>Spending Trend</Text>
                            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
                                Last {DAY_COUNT} days
                            </Text>
                        </View>
                    </View>
                    <View style={[styles.badge, { backgroundColor: `${glowColor}15`, borderColor: `${glowColor}25` }]}>
                        <Ionicons
                            name={isUp ? 'caret-up' : isDown ? 'caret-down' : 'remove'}
                            size={10}
                            color={lineColor1}
                        />
                        <Text style={[styles.badgeText, { color: lineColor1 }]}>
                            {trend.direction === 'flat' ? '0%' : `${trend.percentage}%`}
                        </Text>
                        <Text style={[styles.badgeSuffix, { color: lineColor1 }]}>{trendLabel}</Text>
                    </View>
                </View>

                {/* Tooltip — pops up when a day is tapped */}
                {selectedData && (
                    <Animated.View
                        style={[
                            styles.tooltip,
                            {
                                backgroundColor: `${lineColor1}14`,
                                borderColor: `${lineColor1}30`,
                                opacity: tooltipAnim,
                                transform: [{ scale: tooltipAnim }],
                            },
                        ]}
                    >
                        <View style={styles.tooltipInner}>
                            <View style={[styles.tooltipDot, { backgroundColor: lineColor1 }]} />
                            <Text style={[styles.tooltipDate, { color: colors.textSecondary }]}>
                                {selectedData.label}, {selectedData.dateStr}
                            </Text>
                        </View>
                        <Text style={[styles.tooltipAmount, { color: lineColor1 }]}>
                            {sym}{formatAmount(selectedData.amount, currency?.code || 'INR')}
                        </Text>
                    </Animated.View>
                )}

                {/* Stats Row */}
                <View style={styles.statsRow}>
                    <View style={[styles.statBox, { backgroundColor: isDark ? '#FFFFFF06' : '#00000004', borderColor: isDark ? '#FFFFFF08' : '#00000008' }]}>
                        <Text style={[styles.statLabel, { color: colors.textSecondary }]}>This Month</Text>
                        <Text style={[styles.statValue, { color: colors.text }]}>
                            {sym}{formatAmount(trend.currentExpense || 0, currency?.code || 'INR')}
                        </Text>
                    </View>
                    <View style={styles.statGap} />
                    <View style={[styles.statBox, { backgroundColor: isDark ? '#FFFFFF06' : '#00000004', borderColor: isDark ? '#FFFFFF08' : '#00000008' }]}>
                        <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Last Month</Text>
                        <Text style={[styles.statValue, { color: colors.textSecondary }]}>
                            {sym}{formatAmount(trend.previousExpense || 0, currency?.code || 'INR')}
                        </Text>
                    </View>
                </View>

                {/* Chart with Y-axis */}
                <View style={styles.chartWrap}>
                    {renderChart(chartDrawWidth)}
                </View>

                {/* Animated pulse dot overlay for latest point */}
                {hasData && selected === null && (
                    <Animated.View
                        style={[
                            styles.pulseIndicator,
                            {
                                backgroundColor: `${lineColor1}20`,
                                borderColor: `${lineColor1}40`,
                                transform: [{ scale: pulseAnim }],
                                opacity: pulseAnim.interpolate({
                                    inputRange: [1, 1.6],
                                    outputRange: [0.6, 0],
                                }),
                            },
                        ]}
                    />
                )}
            </ExpoGradient>
        </Animated.View>
    );
};

const styles = StyleSheet.create({
    outerWrap: {
        marginTop: SPACING.md,
        borderRadius: 20,
        shadowColor: '#7C3AED',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 16,
        elevation: 5,
    },
    container: {
        borderRadius: 20,
        padding: SPACING.md,
        overflow: 'hidden',
    },
    cornerGlow: {
        position: 'absolute',
        top: -40,
        right: -40,
        width: 120,
        height: 120,
        borderRadius: 60,
    },
    headerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: SPACING.sm,
    },
    headerLeft: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    iconCircle: {
        width: 38,
        height: 38,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    headerText: {
        marginLeft: SPACING.sm,
    },
    title: {
        fontSize: FONT_SIZE.md,
        fontWeight: '800',
        letterSpacing: 0.2,
    },
    subtitle: {
        fontSize: FONT_SIZE.xs,
        marginTop: 1,
        fontWeight: '500',
    },
    badge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 3,
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 20,
        borderWidth: 1,
    },
    badgeText: {
        fontSize: FONT_SIZE.sm,
        fontWeight: '800',
    },
    badgeSuffix: {
        fontSize: 9,
        fontWeight: '600',
        textTransform: 'uppercase',
        opacity: 0.7,
    },
    tooltip: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 14,
        paddingVertical: 10,
        borderRadius: 12,
        borderWidth: 1,
        marginBottom: SPACING.sm,
    },
    tooltipInner: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    tooltipDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
    },
    tooltipDate: {
        fontSize: FONT_SIZE.sm,
        fontWeight: '600',
    },
    tooltipAmount: {
        fontSize: FONT_SIZE.lg,
        fontWeight: '800',
    },
    statsRow: {
        flexDirection: 'row',
        marginBottom: SPACING.sm,
    },
    statBox: {
        flex: 1,
        alignItems: 'center',
        paddingVertical: SPACING.sm,
        borderRadius: 12,
        borderWidth: 1,
    },
    statGap: {
        width: SPACING.sm,
    },
    statLabel: {
        fontSize: 10,
        fontWeight: '600',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
        marginBottom: 3,
    },
    statValue: {
        fontSize: FONT_SIZE.lg,
        fontWeight: '800',
    },
    chartWrap: {
        marginRight: -SPACING.xs,
    },
    chartArea: {
        flexDirection: 'row',
    },
    yAxis: {
        width: Y_AXIS_WIDTH,
        position: 'relative',
    },
    yLabel: {
        position: 'absolute',
        left: 0,
        fontSize: 9,
        fontWeight: '500',
        width: Y_AXIS_WIDTH - 4,
        textAlign: 'right',
    },
    svgWrap: {
        flex: 1,
        position: 'relative',
    },
    hitAreaContainer: {
        flexDirection: 'row',
    },
    hitArea: {
        position: 'absolute',
        top: 0,
    },
    emptyChart: {
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
    },
    emptyIconWrap: {
        width: 48,
        height: 48,
        borderRadius: 14,
        alignItems: 'center',
        justifyContent: 'center',
    },
    emptyChartText: {
        fontSize: FONT_SIZE.sm,
        fontWeight: '500',
    },
    pulseIndicator: {
        position: 'absolute',
        bottom: 52,
        right: SPACING.md + 4,
        width: 14,
        height: 14,
        borderRadius: 7,
        borderWidth: 1,
    },
});

export default TrendCard;

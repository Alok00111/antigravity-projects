// File: src/components/TransactionItem.js

import React, { useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Animated,
    PanResponder,
    TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { getCategoryById } from '../utils/categories';
import { formatTime } from '../utils/dateHelpers';
import { SPACING, FONT_SIZE, TRANSACTION_TYPES } from '../utils/constants';
import { formatAmount } from '../utils/currencies';
import * as haptics from '../utils/haptics';

const SWIPE_THRESHOLD = -80;

const TransactionItem = ({ transaction, onPress, onDelete }) => {
    const { colors, currency } = useTheme();
    const translateX = useRef(new Animated.Value(0)).current;

    const panResponder = useRef(
        PanResponder.create({
            onStartShouldSetPanResponder: () => false,
            onMoveShouldSetPanResponder: (_, gestureState) =>
                Math.abs(gestureState.dx) > 10 && Math.abs(gestureState.dy) < 10,
            onPanResponderMove: (_, gestureState) => {
                if (gestureState.dx < 0) {
                    translateX.setValue(Math.max(gestureState.dx, -120));
                }
            },
            onPanResponderRelease: (_, gestureState) => {
                if (gestureState.dx < SWIPE_THRESHOLD) {
                    haptics.mediumTap();
                    Animated.spring(translateX, {
                        toValue: -100,
                        useNativeDriver: true,
                    }).start();
                } else {
                    Animated.spring(translateX, {
                        toValue: 0,
                        useNativeDriver: true,
                    }).start();
                }
            },
        })
    ).current;

    const handleDelete = () => {
        haptics.heavyTap();
        Animated.timing(translateX, {
            toValue: -400,
            duration: 250,
            useNativeDriver: true,
        }).start(() => onDelete?.(transaction));
    };

    const category = getCategoryById(transaction.category);
    const isExpense = transaction.type === TRANSACTION_TYPES.EXPENSE;
    const amountColor = isExpense ? colors.danger : colors.success;
    const prefix = isExpense ? '-' : '+';

    return (
        <View style={styles.wrapper}>
            {/* Delete background */}
            <View style={[styles.deleteContainer, { backgroundColor: colors.danger }]}>
                <TouchableOpacity onPress={handleDelete} style={styles.deleteBtn}>
                    <Ionicons name="trash-outline" size={22} color="#FFF" />
                    <Text style={styles.deleteText}>Delete</Text>
                </TouchableOpacity>
            </View>

            {/* Foreground card */}
            <Animated.View
                style={[
                    styles.card,
                    { backgroundColor: colors.card, transform: [{ translateX }] },
                ]}
                {...panResponder.panHandlers}
            >
                <TouchableOpacity
                    style={styles.cardContent}
                    onPress={() => onPress?.(transaction)}
                    activeOpacity={0.7}
                >
                    <View style={[styles.iconCircle, { backgroundColor: category ? `${category.color}18` : `${colors.textSecondary}18` }]}>
                        <Ionicons
                            name={category?.icon || 'help-circle-outline'}
                            size={22}
                            color={category?.color || colors.textSecondary}
                        />
                    </View>
                    <View style={styles.info}>
                        <Text style={[styles.categoryLabel, { color: colors.text }]}>
                            {category?.label || 'Unknown'}
                        </Text>
                        {transaction.note ? (
                            <Text style={[styles.note, { color: colors.textSecondary }]} numberOfLines={1}>
                                {transaction.note}
                            </Text>
                        ) : (
                            <Text style={[styles.time, { color: colors.tabInactive }]}>
                                {formatTime(transaction.date)}
                            </Text>
                        )}
                        {transaction.tags?.length > 0 && (
                            <View style={styles.tagsRow}>
                                {transaction.tags.map((tag) => (
                                    <View key={tag} style={[styles.tagChip, { backgroundColor: `${category?.color || colors.primary}18` }]}>
                                        <Text style={[styles.tagText, { color: category?.color || colors.primary }]}>#{tag}</Text>
                                    </View>
                                ))}
                            </View>
                        )}
                    </View>
                    <View style={styles.rightSection}>
                        {transaction.receiptUri && (
                            <Ionicons name="attach" size={16} color={colors.textSecondary} style={{ marginBottom: 2 }} />
                        )}
                        <Text style={[styles.amount, { color: amountColor }]}>
                            {prefix}{currency.symbol}{formatAmount(transaction.amount, currency.code, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </Text>
                    </View>
                </TouchableOpacity>
            </Animated.View>
        </View>
    );
};

const styles = StyleSheet.create({
    wrapper: {
        marginBottom: SPACING.sm,
        borderRadius: 14,
        overflow: 'hidden',
    },
    deleteContainer: {
        position: 'absolute',
        top: 0,
        bottom: 0,
        right: 0,
        width: 100,
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center',
    },
    deleteBtn: {
        alignItems: 'center',
        gap: 4,
    },
    deleteText: {
        color: '#FFF',
        fontSize: FONT_SIZE.sm,
        fontWeight: '600',
    },
    card: {
        borderRadius: 14,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.04,
        shadowRadius: 4,
        elevation: 2,
    },
    cardContent: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: SPACING.md,
    },
    iconCircle: {
        width: 44,
        height: 44,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    info: {
        flex: 1,
        marginLeft: SPACING.sm,
    },
    categoryLabel: {
        fontSize: FONT_SIZE.md,
        fontWeight: '600',
    },
    note: {
        fontSize: FONT_SIZE.sm,
        marginTop: 2,
    },
    time: {
        fontSize: FONT_SIZE.sm,
        marginTop: 2,
    },
    amount: {
        fontSize: FONT_SIZE.md,
        fontWeight: '700',
    },
    rightSection: {
        alignItems: 'flex-end',
    },
    tagsRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 4,
        marginTop: 4,
    },
    tagChip: {
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 6,
    },
    tagText: {
        fontSize: FONT_SIZE.sm - 1,
        fontWeight: '600',
    },
});

export default TransactionItem;

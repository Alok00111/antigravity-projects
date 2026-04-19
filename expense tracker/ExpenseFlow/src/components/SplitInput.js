// File: src/components/SplitInput.js

import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { SPACING, FONT_SIZE, TRANSACTION_TYPES } from '../utils/constants';
import { getCategoriesByType, getCategoryById } from '../utils/categories';

const SplitInput = ({ totalAmount, type, splits, onSplitsChange }) => {
    const { colors, currency } = useTheme();
    const categories = getCategoriesByType(type);
    const [showCategoryPicker, setShowCategoryPicker] = useState(null); // index of split being edited

    const total = parseFloat(totalAmount) || 0;
    const splitTotal = splits.reduce((sum, s) => sum + (parseFloat(s.amount) || 0), 0);
    const remaining = total - splitTotal;

    const addSplit = () => {
        if (splits.length >= 6) return;
        onSplitsChange([...splits, { category: null, amount: '' }]);
    };

    const removeSplit = (index) => {
        if (splits.length <= 2) return;
        const updated = splits.filter((_, i) => i !== index);
        onSplitsChange(updated);
    };

    const updateSplit = (index, field, value) => {
        const updated = splits.map((s, i) => {
            if (i !== index) return s;
            if (field === 'amount') {
                const cleaned = value.replace(/[^0-9.]/g, '');
                return { ...s, amount: cleaned };
            }
            return { ...s, [field]: value };
        });
        onSplitsChange(updated);
    };

    const selectCategory = (index, categoryId) => {
        updateSplit(index, 'category', categoryId);
        setShowCategoryPicker(null);
    };

    const progressPercentage = total > 0 ? Math.min((splitTotal / total) * 100, 100) : 0;
    const isBalanced = Math.abs(remaining) < 0.01;
    const isOver = remaining < -0.01;

    return (
        <View style={styles.container}>
            <Text style={[styles.label, { color: colors.textSecondary }]}>Split Across Categories</Text>

            {/* Progress Bar */}
            <View style={[styles.progressContainer, { backgroundColor: colors.background }]}>
                <View
                    style={[
                        styles.progressBar,
                        {
                            width: `${progressPercentage}%`,
                            backgroundColor: isOver ? colors.danger : isBalanced ? '#22C55E' : colors.primary,
                        },
                    ]}
                />
            </View>
            <Text style={[styles.remainingText, { color: isOver ? colors.danger : isBalanced ? '#22C55E' : colors.textSecondary }]}>
                {isBalanced
                    ? '✓ Perfectly balanced'
                    : isOver
                        ? `Over by ${currency.symbol}${Math.abs(remaining).toFixed(2)}`
                        : `${currency.symbol}${remaining.toFixed(2)} remaining`
                }
            </Text>

            {/* Split Rows */}
            {splits.map((split, index) => {
                const cat = split.category ? getCategoryById(split.category) : null;
                return (
                    <View key={index} style={[styles.splitRow, { backgroundColor: colors.card, borderColor: colors.border }]}>
                        {/* Category Selector */}
                        <TouchableOpacity
                            style={[styles.catBtn, { backgroundColor: cat ? `${cat.color}15` : colors.background }]}
                            onPress={() => setShowCategoryPicker(showCategoryPicker === index ? null : index)}
                            activeOpacity={0.7}
                        >
                            {cat ? (
                                <>
                                    <Ionicons name={cat.icon} size={16} color={cat.color} />
                                    <Text style={[styles.catText, { color: colors.text }]} numberOfLines={1}>{cat.label}</Text>
                                </>
                            ) : (
                                <>
                                    <Ionicons name="add" size={16} color={colors.textSecondary} />
                                    <Text style={[styles.catText, { color: colors.textSecondary }]}>Category</Text>
                                </>
                            )}
                        </TouchableOpacity>

                        {/* Amount Input */}
                        <View style={[styles.amountBox, { borderColor: colors.border }]}>
                            <Text style={[styles.currSym, { color: colors.textSecondary }]}>{currency.symbol}</Text>
                            <TextInput
                                style={[styles.amountInput, { color: colors.text }]}
                                placeholder="0"
                                placeholderTextColor={colors.tabInactive}
                                keyboardType="decimal-pad"
                                value={split.amount}
                                onChangeText={(v) => updateSplit(index, 'amount', v)}
                                maxLength={10}
                            />
                        </View>

                        {/* Remove Button */}
                        {splits.length > 2 && (
                            <TouchableOpacity onPress={() => removeSplit(index)} style={styles.removeBtn}>
                                <Ionicons name="close-circle" size={22} color={colors.danger} />
                            </TouchableOpacity>
                        )}

                        {/* Category Picker Dropdown */}
                        {showCategoryPicker === index && (
                            <View style={[styles.catDropdown, { backgroundColor: colors.card, borderColor: colors.border }]}>
                                {categories.map((c) => (
                                    <TouchableOpacity
                                        key={c.id}
                                        style={[
                                            styles.catOption,
                                            split.category === c.id && { backgroundColor: `${c.color}15` },
                                        ]}
                                        onPress={() => selectCategory(index, c.id)}
                                    >
                                        <Ionicons name={c.icon} size={18} color={c.color} />
                                        <Text style={[styles.catOptionText, { color: colors.text }]}>{c.label}</Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        )}
                    </View>
                );
            })}

            {/* Add Split Button */}
            {splits.length < 6 && (
                <TouchableOpacity
                    style={[styles.addBtn, { borderColor: colors.border }]}
                    onPress={addSplit}
                    activeOpacity={0.7}
                >
                    <Ionicons name="add-circle-outline" size={18} color={colors.primary} />
                    <Text style={[styles.addBtnText, { color: colors.primary }]}>Add Split</Text>
                </TouchableOpacity>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: { marginTop: SPACING.md },
    label: { fontSize: FONT_SIZE.md, fontWeight: '600', marginBottom: SPACING.sm },
    progressContainer: {
        height: 6,
        borderRadius: 3,
        overflow: 'hidden',
        marginBottom: 4,
    },
    progressBar: { height: '100%', borderRadius: 3 },
    remainingText: { fontSize: FONT_SIZE.sm, marginBottom: SPACING.sm },
    splitRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: SPACING.sm,
        padding: SPACING.sm,
        borderRadius: 12,
        borderWidth: 1,
        marginBottom: SPACING.sm,
        flexWrap: 'wrap',
    },
    catBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        paddingHorizontal: SPACING.sm + 2,
        paddingVertical: SPACING.xs + 2,
        borderRadius: 10,
        flex: 1,
        minWidth: 100,
    },
    catText: { fontSize: FONT_SIZE.sm, fontWeight: '600' },
    amountBox: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderRadius: 8,
        paddingHorizontal: SPACING.xs + 2,
        width: 100,
    },
    currSym: { fontSize: FONT_SIZE.md, fontWeight: '600' },
    amountInput: { flex: 1, fontSize: FONT_SIZE.md, fontWeight: '600', paddingVertical: SPACING.xs + 2 },
    removeBtn: { padding: 2 },
    catDropdown: {
        width: '100%',
        borderWidth: 1,
        borderRadius: 10,
        padding: SPACING.xs,
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 4,
    },
    catOption: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        paddingHorizontal: SPACING.sm,
        paddingVertical: SPACING.xs + 2,
        borderRadius: 8,
    },
    catOptionText: { fontSize: FONT_SIZE.sm, fontWeight: '500' },
    addBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        paddingVertical: SPACING.sm,
        borderWidth: 1,
        borderStyle: 'dashed',
        borderRadius: 10,
    },
    addBtnText: { fontSize: FONT_SIZE.sm, fontWeight: '600' },
});

export default SplitInput;

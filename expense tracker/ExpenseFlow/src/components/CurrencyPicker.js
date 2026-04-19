// File: src/components/CurrencyPicker.js

import React, { useState } from 'react';
import {
    Modal,
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    FlatList,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { CURRENCIES } from '../utils/currencies';
import { SPACING, FONT_SIZE } from '../utils/constants';

const CurrencyPicker = ({ selectedCode, onSelect, trigger }) => {
    const { colors } = useTheme();
    const [visible, setVisible] = useState(false);

    const handleSelect = (currency) => {
        onSelect(currency);
        setVisible(false);
    };

    const renderCurrency = ({ item }) => {
        const isSelected = item.code === selectedCode;
        return (
            <TouchableOpacity
                style={[
                    styles.item,
                    { backgroundColor: isSelected ? `${colors.primary}18` : colors.card },
                ]}
                onPress={() => handleSelect(item)}
                activeOpacity={0.7}
            >
                <View style={styles.itemLeft}>
                    <Text style={[styles.symbol, { color: colors.primary }]}>{item.symbol}</Text>
                    <View>
                        <Text style={[styles.code, { color: colors.text }]}>{item.code}</Text>
                        <Text style={[styles.name, { color: colors.textSecondary }]}>{item.name}</Text>
                    </View>
                </View>
                {isSelected && (
                    <Ionicons name="checkmark-circle" size={22} color={colors.primary} />
                )}
            </TouchableOpacity>
        );
    };

    return (
        <>
            {trigger ? (
                <TouchableOpacity onPress={() => setVisible(true)} activeOpacity={0.7}>
                    {trigger}
                </TouchableOpacity>
            ) : (
                <TouchableOpacity
                    style={[styles.defaultTrigger, { backgroundColor: colors.card, borderColor: colors.border }]}
                    onPress={() => setVisible(true)}
                    activeOpacity={0.7}
                >
                    <Text style={[styles.triggerText, { color: colors.text }]}>
                        {selectedCode}
                    </Text>
                    <Ionicons name="chevron-down" size={16} color={colors.textSecondary} />
                </TouchableOpacity>
            )}

            <Modal
                visible={visible}
                transparent
                animationType="slide"
                onRequestClose={() => setVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalContent, { backgroundColor: colors.background }]}>
                        <View style={styles.modalHeader}>
                            <Text style={[styles.modalTitle, { color: colors.text }]}>Select Currency</Text>
                            <TouchableOpacity onPress={() => setVisible(false)} activeOpacity={0.7}>
                                <Ionicons name="close-circle" size={28} color={colors.textSecondary} />
                            </TouchableOpacity>
                        </View>
                        <FlatList
                            data={CURRENCIES}
                            keyExtractor={(item) => item.code}
                            renderItem={renderCurrency}
                            contentContainerStyle={styles.listContent}
                            showsVerticalScrollIndicator={false}
                        />
                    </View>
                </View>
            </Modal>
        </>
    );
};

const styles = StyleSheet.create({
    defaultTrigger: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: SPACING.sm + 2,
        paddingVertical: SPACING.xs + 2,
        borderRadius: 8,
        borderWidth: 1,
        gap: 4,
    },
    triggerText: {
        fontSize: FONT_SIZE.md,
        fontWeight: '700',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        maxHeight: '70%',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        paddingTop: SPACING.md,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: SPACING.lg,
        paddingBottom: SPACING.md,
    },
    modalTitle: {
        fontSize: FONT_SIZE.xl,
        fontWeight: '700',
    },
    listContent: {
        paddingHorizontal: SPACING.md,
        paddingBottom: SPACING.xl + 20,
    },
    item: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: SPACING.md,
        borderRadius: 12,
        marginBottom: SPACING.xs,
    },
    itemLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: SPACING.md,
    },
    symbol: {
        fontSize: FONT_SIZE.xl,
        fontWeight: '700',
        width: 36,
        textAlign: 'center',
    },
    code: {
        fontSize: FONT_SIZE.md,
        fontWeight: '700',
    },
    name: {
        fontSize: FONT_SIZE.sm,
        marginTop: 2,
    },
});

export default CurrencyPicker;

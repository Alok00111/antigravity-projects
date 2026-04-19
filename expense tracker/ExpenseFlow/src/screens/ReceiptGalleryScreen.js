// File: src/screens/ReceiptGalleryScreen.js
// Browsable grid of all receipt images attached to transactions

import React, { useState, useCallback, useMemo } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    Image,
    TouchableOpacity,
    Modal,
    Dimensions,
    ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useTheme } from '../context/ThemeContext';
import ScreenContainer from '../components/ScreenContainer';
import EmptyState from '../components/EmptyState';
import { FONT_SIZE, SPACING, TRANSACTION_TYPES } from '../utils/constants';
import { formatAmount } from '../utils/currencies';
import { getCategoryById } from '../utils/categories';
import storageService from '../services/storageService';

const { width } = Dimensions.get('window');
const COLUMN_COUNT = 3;
const THUMB_GAP = 4;
const THUMB_SIZE = (width - SPACING.md * 2 - THUMB_GAP * (COLUMN_COUNT - 1)) / COLUMN_COUNT;

const ReceiptGalleryScreen = () => {
    const { colors, currency } = useTheme();
    const [transactions, setTransactions] = useState([]);
    const [selectedReceipt, setSelectedReceipt] = useState(null);
    const [selectedMonth, setSelectedMonth] = useState(null);

    useFocusEffect(
        useCallback(() => {
            loadReceipts();
        }, [])
    );

    const loadReceipts = async () => {
        const txns = await storageService.getTransactions();
        setTransactions(txns);
    };

    // Get receipts with transaction data
    const receipts = useMemo(() => {
        return transactions
            .filter((t) => t.receiptUri)
            .sort((a, b) => new Date(b.date) - new Date(a.date));
    }, [transactions]);

    // Get available months
    const months = useMemo(() => {
        const monthSet = new Map();
        receipts.forEach((r) => {
            const d = new Date(r.date);
            const key = `${d.getFullYear()}-${d.getMonth()}`;
            if (!monthSet.has(key)) {
                monthSet.set(key, {
                    key,
                    label: d.toLocaleString('en', { month: 'short', year: 'numeric' }),
                    month: d.getMonth(),
                    year: d.getFullYear(),
                });
            }
        });
        return Array.from(monthSet.values());
    }, [receipts]);

    // Filter by selected month
    const filtered = useMemo(() => {
        if (!selectedMonth) return receipts;
        return receipts.filter((r) => {
            const d = new Date(r.date);
            return d.getMonth() === selectedMonth.month && d.getFullYear() === selectedMonth.year;
        });
    }, [receipts, selectedMonth]);

    const renderThumbnail = ({ item }) => {
        const cat = getCategoryById(item.category);
        return (
            <TouchableOpacity
                style={[styles.thumbContainer, { backgroundColor: colors.card }]}
                onPress={() => setSelectedReceipt(item)}
                activeOpacity={0.85}
            >
                <Image source={{ uri: item.receiptUri }} style={styles.thumbnail} />
                <View style={[styles.thumbOverlay, { backgroundColor: 'rgba(0,0,0,0.45)' }]}>
                    <Text style={styles.thumbAmount} numberOfLines={1}>
                        {currency.symbol}{formatAmount(item.amount, currency.code)}
                    </Text>
                    {cat && (
                        <Text style={styles.thumbCategory} numberOfLines={1}>{cat.label}</Text>
                    )}
                </View>
            </TouchableOpacity>
        );
    };

    const renderViewer = () => {
        if (!selectedReceipt) return null;
        const cat = getCategoryById(selectedReceipt.category);
        const date = new Date(selectedReceipt.date);

        return (
            <Modal visible={!!selectedReceipt} transparent animationType="fade">
                <View style={styles.modalBg}>
                    {/* Close button */}
                    <TouchableOpacity
                        style={styles.closeBtn}
                        onPress={() => setSelectedReceipt(null)}
                        activeOpacity={0.7}
                    >
                        <Ionicons name="close-circle" size={36} color="#FFF" />
                    </TouchableOpacity>

                    {/* Full image */}
                    <Image
                        source={{ uri: selectedReceipt.receiptUri }}
                        style={styles.fullImage}
                        resizeMode="contain"
                    />

                    {/* Transaction details overlay */}
                    <View style={[styles.detailsOverlay, { backgroundColor: `${colors.card}F0` }]}>
                        <View style={styles.detailsRow}>
                            {cat && (
                                <View style={[styles.detailIcon, { backgroundColor: `${cat.color}20` }]}>
                                    <Ionicons name={cat.icon} size={18} color={cat.color} />
                                </View>
                            )}
                            <View style={{ flex: 1 }}>
                                <Text style={[styles.detailCategory, { color: colors.text }]}>
                                    {cat?.label || 'Unknown'}
                                </Text>
                                <Text style={[styles.detailDate, { color: colors.textSecondary }]}>
                                    {date.toLocaleDateString('en', { day: 'numeric', month: 'short', year: 'numeric' })}
                                </Text>
                            </View>
                            <Text style={[styles.detailAmount, { color: selectedReceipt.type === TRANSACTION_TYPES.EXPENSE ? colors.danger : colors.success }]}>
                                {selectedReceipt.type === TRANSACTION_TYPES.EXPENSE ? '-' : '+'}{currency.symbol}{formatAmount(selectedReceipt.amount, currency.code)}
                            </Text>
                        </View>
                        {selectedReceipt.note ? (
                            <Text style={[styles.detailNote, { color: colors.textSecondary }]} numberOfLines={2}>
                                {selectedReceipt.note}
                            </Text>
                        ) : null}
                    </View>
                </View>
            </Modal>
        );
    };

    return (
        <ScreenContainer>
            <Text style={[styles.header, { color: colors.text }]}>Receipt Gallery</Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
                {receipts.length} receipt{receipts.length !== 1 ? 's' : ''} attached
            </Text>

            {/* Month filter */}
            {months.length > 1 && (
                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    style={styles.monthFilter}
                    contentContainerStyle={styles.monthFilterContent}
                >
                    <TouchableOpacity
                        style={[
                            styles.monthChip,
                            {
                                backgroundColor: !selectedMonth ? colors.primary : colors.card,
                                borderColor: !selectedMonth ? colors.primary : colors.border,
                            },
                        ]}
                        onPress={() => setSelectedMonth(null)}
                        activeOpacity={0.7}
                    >
                        <Text style={[styles.monthChipText, { color: !selectedMonth ? '#FFF' : colors.text }]}>All</Text>
                    </TouchableOpacity>
                    {months.map((m) => {
                        const isActive = selectedMonth?.key === m.key;
                        return (
                            <TouchableOpacity
                                key={m.key}
                                style={[
                                    styles.monthChip,
                                    {
                                        backgroundColor: isActive ? colors.primary : colors.card,
                                        borderColor: isActive ? colors.primary : colors.border,
                                    },
                                ]}
                                onPress={() => setSelectedMonth(isActive ? null : m)}
                                activeOpacity={0.7}
                            >
                                <Text style={[styles.monthChipText, { color: isActive ? '#FFF' : colors.text }]}>{m.label}</Text>
                            </TouchableOpacity>
                        );
                    })}
                </ScrollView>
            )}

            {/* Grid */}
            {filtered.length > 0 ? (
                <FlatList
                    data={filtered}
                    renderItem={renderThumbnail}
                    keyExtractor={(item) => item.id}
                    numColumns={COLUMN_COUNT}
                    contentContainerStyle={styles.grid}
                    columnWrapperStyle={styles.gridRow}
                    showsVerticalScrollIndicator={false}
                />
            ) : (
                <EmptyState
                    icon="camera-outline"
                    title="No receipts yet"
                    subtitle="Attach receipt photos when adding transactions"
                />
            )}

            {renderViewer()}
        </ScreenContainer>
    );
};

const styles = StyleSheet.create({
    header: {
        fontSize: FONT_SIZE.xxl,
        fontWeight: '700',
        marginBottom: 4,
    },
    subtitle: {
        fontSize: FONT_SIZE.md,
        marginBottom: SPACING.md,
    },
    monthFilter: {
        marginBottom: SPACING.md,
    },
    monthFilterContent: {
        gap: SPACING.xs + 2,
    },
    monthChip: {
        paddingHorizontal: SPACING.sm + 4,
        paddingVertical: SPACING.xs + 2,
        borderRadius: 16,
        borderWidth: 1,
    },
    monthChipText: {
        fontSize: FONT_SIZE.sm,
        fontWeight: '600',
    },
    grid: {
        paddingBottom: SPACING.xl + 20,
    },
    gridRow: {
        gap: THUMB_GAP,
        marginBottom: THUMB_GAP,
    },
    thumbContainer: {
        width: THUMB_SIZE,
        height: THUMB_SIZE,
        borderRadius: 12,
        overflow: 'hidden',
    },
    thumbnail: {
        width: '100%',
        height: '100%',
    },
    thumbOverlay: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        paddingHorizontal: 6,
        paddingVertical: 4,
    },
    thumbAmount: {
        color: '#FFF',
        fontSize: FONT_SIZE.sm,
        fontWeight: '700',
    },
    thumbCategory: {
        color: 'rgba(255,255,255,0.8)',
        fontSize: FONT_SIZE.sm - 2,
        fontWeight: '500',
    },
    modalBg: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.95)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    closeBtn: {
        position: 'absolute',
        top: 50,
        right: 20,
        zIndex: 10,
    },
    fullImage: {
        width: width - 32,
        height: width * 1.2,
        borderRadius: 12,
    },
    detailsOverlay: {
        position: 'absolute',
        bottom: 40,
        left: 16,
        right: 16,
        borderRadius: 16,
        padding: SPACING.md,
    },
    detailsRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: SPACING.sm,
    },
    detailIcon: {
        width: 36,
        height: 36,
        borderRadius: 10,
        alignItems: 'center',
        justifyContent: 'center',
    },
    detailCategory: {
        fontSize: FONT_SIZE.md,
        fontWeight: '700',
    },
    detailDate: {
        fontSize: FONT_SIZE.sm,
        marginTop: 1,
    },
    detailAmount: {
        fontSize: FONT_SIZE.lg,
        fontWeight: '700',
    },
    detailNote: {
        fontSize: FONT_SIZE.sm,
        marginTop: SPACING.xs,
    },
});

export default ReceiptGalleryScreen;

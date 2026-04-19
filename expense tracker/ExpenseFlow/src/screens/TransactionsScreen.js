// File: src/screens/TransactionsScreen.js

import React, { useState, useCallback, useMemo } from 'react';
import {
    View,
    Text,
    StyleSheet,
    SectionList,
    RefreshControl,
    ScrollView,
    TouchableOpacity,
} from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { useTheme } from '../context/ThemeContext';
import ScreenContainer from '../components/ScreenContainer';
import TransactionItem from '../components/TransactionItem';
import EmptyState from '../components/EmptyState';
import SearchBar from '../components/SearchBar';
import DateRangeFilter from '../components/DateRangeFilter';
import { TransactionsSkeleton } from '../components/SkeletonLoader';
import { FONT_SIZE, SPACING, SCREEN_NAMES } from '../utils/constants';
import {
    groupByDate,
    getMonthRange,
    getWeekRange,
    filterByDateRange,
} from '../utils/dateHelpers';
import { getCategoryById } from '../utils/categories';
import storageService from '../services/storageService';
import { useAlert } from '../context/AlertContext';

const TransactionsScreen = () => {
    const navigation = useNavigation();
    const { colors } = useTheme();
    const { showAlert } = useAlert();
    const [transactions, setTransactions] = useState([]);
    const [refreshing, setRefreshing] = useState(false);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [dateFilter, setDateFilter] = useState('all');
    const [tagFilter, setTagFilter] = useState(null);

    const loadData = useCallback(async () => {
        try {
            const data = await storageService.getTransactions();
            setTransactions(data);
        } catch (e) {
            console.error('Failed to load transactions:', e);
        } finally {
            setLoading(false);
        }
    }, []);

    useFocusEffect(
        useCallback(() => {
            loadData();
        }, [loadData])
    );

    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        await loadData();
        setRefreshing(false);
    }, [loadData]);

    const handleDelete = useCallback((txn) => {
        showAlert({
            title: 'Delete Transaction',
            message: 'Are you sure you want to delete this transaction?',
            type: 'confirm',
            buttons: [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        const success = await storageService.deleteTransaction(txn.id);
                        if (success) {
                            setTransactions((prev) => prev.filter((t) => t.id !== txn.id));
                        }
                    },
                },
            ],
        });
    }, [showAlert]);

    const handleTransactionPress = useCallback(
        (txn) => {
            navigation.navigate(SCREEN_NAMES.ADD_TRANSACTION, { transaction: txn });
        },
        [navigation]
    );

    const filteredTransactions = useMemo(() => {
        let result = [...transactions];
        const now = new Date();

        if (dateFilter === 'today') {
            const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
            result = filterByDateRange(result, todayStart, todayEnd);
        } else if (dateFilter === 'thisWeek') {
            const { start, end } = getWeekRange();
            result = filterByDateRange(result, start, end);
        } else if (dateFilter === 'thisMonth') {
            const { start, end } = getMonthRange();
            result = filterByDateRange(result, start, end);
        } else if (dateFilter === 'lastMonth') {
            const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
            const { start, end } = getMonthRange(lastMonth);
            result = filterByDateRange(result, start, end);
        }

        if (searchQuery) {
            result = result.filter((txn) => {
                const cat = getCategoryById(txn.category);
                const catLabel = cat?.label?.toLowerCase() || '';
                const note = (txn.note || '').toLowerCase();
                const tags = (txn.tags || []).join(' ').toLowerCase();
                return catLabel.includes(searchQuery) || note.includes(searchQuery) || tags.includes(searchQuery);
            });
        }

        if (tagFilter) {
            result = result.filter((txn) =>
                (txn.tags || []).includes(tagFilter)
            );
        }

        return result;
    }, [transactions, dateFilter, searchQuery, tagFilter]);

    const sections = groupByDate(filteredTransactions);

    const renderItem = ({ item }) => (
        <TransactionItem
            transaction={item}
            onPress={handleTransactionPress}
            onDelete={handleDelete}
        />
    );

    const renderSectionHeader = ({ section: { title } }) => (
        <View style={styles.sectionHeaderContainer}>
            <Text style={[styles.sectionHeaderText, { color: colors.textSecondary }]}>{title}</Text>
        </View>
    );

    const allTags = useMemo(() => {
        const tagSet = new Set();
        transactions.forEach((txn) => {
            (txn.tags || []).forEach((tag) => tagSet.add(tag));
        });
        return [...tagSet].sort();
    }, [transactions]);

    const renderEmpty = () => {
        if (loading) return <TransactionsSkeleton />;
        if (searchQuery || dateFilter !== 'all' || tagFilter) {
            return (
                <EmptyState
                    icon="search-outline"
                    title="No results"
                    subtitle="Try adjusting your search or filters"
                />
            );
        }
        return (
            <EmptyState
                icon="receipt-outline"
                title="No transactions yet"
                subtitle="Tap the + tab to add your first transaction"
                actionLabel="Add Transaction"
                onAction={() => navigation.navigate(SCREEN_NAMES.ADD_TRANSACTION)}
            />
        );
    };

    return (
        <ScreenContainer>
            <Text style={[styles.header, { color: colors.text }]}>Transactions</Text>
            <SearchBar onSearch={setSearchQuery} />
            <View style={styles.filterContainer}>
                <DateRangeFilter selected={dateFilter} onSelect={setDateFilter} />
            </View>

            {allTags.length > 0 && (
                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    style={styles.tagFilterRow}
                    contentContainerStyle={styles.tagFilterContent}
                >
                    {allTags.map((tag) => (
                        <TouchableOpacity
                            key={tag}
                            style={[
                                styles.tagChip,
                                { backgroundColor: colors.card, borderColor: colors.border },
                                tagFilter === tag && { backgroundColor: `${colors.primary}18`, borderColor: colors.primary },
                            ]}
                            onPress={() => setTagFilter(tagFilter === tag ? null : tag)}
                            activeOpacity={0.7}
                        >
                            <Text style={[
                                styles.tagChipText,
                                { color: colors.textSecondary },
                                tagFilter === tag && { color: colors.primary, fontWeight: '700' },
                            ]}>
                                #{tag}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>
            )}

            {filteredTransactions.length > 0 && (
                <Text style={[styles.countText, { color: colors.textSecondary }]}>
                    {filteredTransactions.length} transaction{filteredTransactions.length !== 1 ? 's' : ''}
                    {(searchQuery || dateFilter !== 'all') ? ' found' : ''}
                </Text>
            )}

            <SectionList
                sections={sections}
                renderItem={renderItem}
                renderSectionHeader={renderSectionHeader}
                keyExtractor={(item) => item.id}
                ListEmptyComponent={renderEmpty}
                contentContainerStyle={
                    sections.length === 0 ? styles.emptyContainer : styles.listContent
                }
                showsVerticalScrollIndicator={false}
                stickySectionHeadersEnabled={false}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                        tintColor={colors.primary}
                        colors={[colors.primary]}
                    />
                }
            />
        </ScreenContainer>
    );
};

const styles = StyleSheet.create({
    header: {
        fontSize: FONT_SIZE.xxl,
        fontWeight: '700',
        marginBottom: SPACING.md,
    },
    filterContainer: {
        marginTop: SPACING.sm,
        marginBottom: SPACING.sm,
    },
    countText: {
        fontSize: FONT_SIZE.sm,
        marginBottom: SPACING.sm,
    },
    listContent: {
        paddingBottom: SPACING.xl + 20,
    },
    emptyContainer: {
        flex: 1,
    },
    sectionHeaderContainer: {
        paddingVertical: SPACING.sm,
        marginTop: SPACING.sm,
        marginBottom: SPACING.xs,
    },
    sectionHeaderText: {
        fontSize: FONT_SIZE.md,
        fontWeight: '700',
    },
    tagFilterRow: {
        marginBottom: SPACING.sm,
    },
    tagFilterContent: {
        gap: SPACING.xs,
    },
    tagChip: {
        paddingHorizontal: SPACING.sm + 4,
        paddingVertical: 6,
        borderRadius: 20,
        borderWidth: 1,
    },
    tagChipText: {
        fontSize: FONT_SIZE.sm,
        fontWeight: '600',
    },
});

export default TransactionsScreen;

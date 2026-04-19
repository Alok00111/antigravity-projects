// File: src/components/CategoryPicker.js

import React from 'react';
import { View, Text, TouchableOpacity, FlatList, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { SPACING, FONT_SIZE } from '../utils/constants';

const NUM_COLUMNS = 4;

const CategoryPicker = ({ categories, selectedCategory, onSelect }) => {
    const { colors } = useTheme();

    const renderItem = ({ item }) => {
        const isSelected = selectedCategory?.id === item.id;
        return (
            <TouchableOpacity
                style={[
                    styles.categoryItem,
                    { backgroundColor: colors.card, borderColor: colors.border },
                    isSelected && { borderColor: item.color, borderWidth: 2 },
                ]}
                onPress={() => onSelect(item)}
                activeOpacity={0.7}
            >
                <View style={[styles.iconCircle, { backgroundColor: `${item.color}18` }]}>
                    <Ionicons name={item.icon} size={22} color={item.color} />
                </View>
                <Text style={[styles.label, { color: colors.text }]} numberOfLines={1}>
                    {item.label}
                </Text>
            </TouchableOpacity>
        );
    };

    return (
        <View style={styles.container}>
            <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>Category</Text>
            <FlatList
                data={categories}
                renderItem={renderItem}
                keyExtractor={(item) => item.id}
                numColumns={NUM_COLUMNS}
                scrollEnabled={false}
                columnWrapperStyle={styles.row}
                contentContainerStyle={styles.listContent}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        marginTop: SPACING.lg,
    },
    sectionLabel: {
        fontSize: FONT_SIZE.md,
        fontWeight: '600',
        marginBottom: SPACING.sm,
    },
    row: {
        justifyContent: 'flex-start',
        gap: SPACING.sm,
        marginBottom: SPACING.sm,
    },
    listContent: {
        paddingBottom: SPACING.sm,
    },
    categoryItem: {
        flex: 1,
        maxWidth: '23%',
        alignItems: 'center',
        borderRadius: 12,
        borderWidth: 1,
        paddingVertical: SPACING.sm + 2,
        paddingHorizontal: SPACING.xs,
    },
    iconCircle: {
        width: 40,
        height: 40,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 4,
    },
    label: {
        fontSize: FONT_SIZE.sm - 1,
        fontWeight: '600',
        textAlign: 'center',
    },
});

export default CategoryPicker;

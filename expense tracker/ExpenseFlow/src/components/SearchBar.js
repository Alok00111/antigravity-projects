// File: src/components/SearchBar.js

import React, { useState, useCallback, useRef } from 'react';
import { View, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { SPACING, FONT_SIZE } from '../utils/constants';

const SearchBar = ({ onSearch, placeholder = 'Search transactions...' }) => {
    const { colors } = useTheme();
    const [query, setQuery] = useState('');
    const debounceRef = useRef(null);

    const handleChange = useCallback(
        (text) => {
            setQuery(text);
            if (debounceRef.current) clearTimeout(debounceRef.current);
            debounceRef.current = setTimeout(() => {
                onSearch?.(text.trim().toLowerCase());
            }, 300);
        },
        [onSearch]
    );

    const handleClear = useCallback(() => {
        setQuery('');
        onSearch?.('');
    }, [onSearch]);

    return (
        <View style={[styles.container, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Ionicons name="search-outline" size={20} color={colors.textSecondary} />
            <TextInput
                style={[styles.input, { color: colors.text }]}
                placeholder={placeholder}
                placeholderTextColor={colors.tabInactive}
                value={query}
                onChangeText={handleChange}
                returnKeyType="search"
                autoCorrect={false}
            />
            {query.length > 0 && (
                <TouchableOpacity onPress={handleClear} activeOpacity={0.7}>
                    <Ionicons name="close-circle" size={20} color={colors.textSecondary} />
                </TouchableOpacity>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius: 12,
        borderWidth: 1,
        paddingHorizontal: SPACING.md,
        paddingVertical: SPACING.sm,
        gap: SPACING.sm,
    },
    input: {
        flex: 1,
        fontSize: FONT_SIZE.md,
        paddingVertical: 4,
    },
});

export default SearchBar;

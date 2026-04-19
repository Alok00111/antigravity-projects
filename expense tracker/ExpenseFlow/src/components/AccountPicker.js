// File: src/components/AccountPicker.js

import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { SPACING, FONT_SIZE } from '../utils/constants';
import accountService from '../services/accountService';

const AccountPicker = ({ selected, onSelect }) => {
    const { colors } = useTheme();
    const [accounts, setAccounts] = useState([]);

    useEffect(() => {
        loadAccounts();
    }, []);

    const loadAccounts = async () => {
        const data = await accountService.getAccounts();
        setAccounts(data);
        // Auto-select default if nothing selected
        if (!selected && data.length > 0) {
            const def = data.find((a) => a.isDefault) || data[0];
            onSelect(def.id);
        }
    };

    if (accounts.length === 0) return null;

    return (
        <View style={styles.container}>
            <Text style={[styles.label, { color: colors.textSecondary }]}>Account</Text>
            <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
            >
                {accounts.map((account) => {
                    const isSelected = selected === account.id;
                    return (
                        <TouchableOpacity
                            key={account.id}
                            style={[
                                styles.pill,
                                {
                                    backgroundColor: isSelected ? account.color : colors.card,
                                    borderColor: isSelected ? account.color : colors.border,
                                },
                            ]}
                            onPress={() => onSelect(account.id)}
                            activeOpacity={0.7}
                        >
                            <Ionicons
                                name={account.icon}
                                size={16}
                                color={isSelected ? '#FFF' : account.color}
                            />
                            <Text
                                style={[
                                    styles.pillText,
                                    { color: isSelected ? '#FFF' : colors.text },
                                ]}
                            >
                                {account.name}
                            </Text>
                        </TouchableOpacity>
                    );
                })}
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        marginBottom: SPACING.md,
    },
    label: {
        fontSize: FONT_SIZE.md,
        fontWeight: '600',
        marginBottom: SPACING.sm,
    },
    scrollContent: {
        gap: SPACING.sm,
    },
    pill: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingHorizontal: SPACING.md,
        paddingVertical: SPACING.sm + 2,
        borderRadius: 20,
        borderWidth: 1,
    },
    pillText: {
        fontSize: FONT_SIZE.sm,
        fontWeight: '600',
    },
});

export default AccountPicker;

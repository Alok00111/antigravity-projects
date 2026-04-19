// File: src/context/ThemeContext.js

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LIGHT_COLORS, DARK_COLORS } from '../theme/colors';
import { STORAGE_KEYS } from '../utils/constants';
import { loadCustomCategories } from '../utils/categories';
import { getCurrencyByCode, DEFAULT_CURRENCY } from '../utils/currencies';
import * as haptics from '../utils/haptics';

const ThemeContext = createContext({
    colors: LIGHT_COLORS,
    isDark: false,
    accentColor: null,
    currency: DEFAULT_CURRENCY,
    toggleDarkMode: () => { },
    setAccentColor: () => { },
    setCurrency: () => { },
});

export const ACCENT_PRESETS = [
    { label: 'Purple', color: '#7C3AED' },
    { label: 'Blue', color: '#3B82F6' },
    { label: 'Indigo', color: '#6366F1' },
    { label: 'Teal', color: '#14B8A6' },
    { label: 'Emerald', color: '#10B981' },
    { label: 'Orange', color: '#F97316' },
    { label: 'Rose', color: '#F43F5E' },
    { label: 'Pink', color: '#EC4899' },
    { label: 'Amber', color: '#F59E0B' },
    { label: 'Cyan', color: '#06B6D4' },
    { label: 'Fuchsia', color: '#D946EF' },
    { label: 'Lime', color: '#84CC16' },
];

export const ThemeProvider = ({ children }) => {
    const [isDark, setIsDark] = useState(false);
    const [accentColor, setAccentColorState] = useState(null);
    const [currency, setCurrencyState] = useState(DEFAULT_CURRENCY);
    const [isLoaded, setIsLoaded] = useState(false);

    useEffect(() => {
        loadTheme();
    }, []);

    const loadTheme = async () => {
        try {
            await loadCustomCategories();
            const settings = await AsyncStorage.getItem(STORAGE_KEYS.SETTINGS);
            if (settings) {
                const parsed = JSON.parse(settings);
                setIsDark(parsed.darkMode || false);
                setAccentColorState(parsed.accentColor || null);
                if (parsed.currencyCode) {
                    setCurrencyState(getCurrencyByCode(parsed.currencyCode));
                }
            }
        } catch (e) {
            console.error('Error loading theme:', e);
        } finally {
            setIsLoaded(true);
        }
    };

    const saveSettings = async (updates) => {
        try {
            const raw = await AsyncStorage.getItem(STORAGE_KEYS.SETTINGS);
            const current = raw ? JSON.parse(raw) : {};
            const merged = { ...current, ...updates };
            await AsyncStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(merged));
        } catch (e) {
            console.error('Error saving settings:', e);
        }
    };

    const toggleDarkMode = useCallback(async () => {
        const newValue = !isDark;
        haptics.lightTap();
        setIsDark(newValue);
        saveSettings({ darkMode: newValue });
    }, [isDark]);

    const setAccentColor = useCallback(async (color) => {
        haptics.selection();
        setAccentColorState(color);
        saveSettings({ accentColor: color });
    }, []);

    const setCurrency = useCallback(async (curr) => {
        haptics.selection();
        setCurrencyState(curr);
        saveSettings({ currencyCode: curr.code });
    }, []);

    const baseColors = isDark ? DARK_COLORS : LIGHT_COLORS;
    const colors = accentColor
        ? { ...baseColors, primary: accentColor }
        : baseColors;

    if (!isLoaded) return null;

    return (
        <ThemeContext.Provider value={{ colors, isDark, accentColor, currency, toggleDarkMode, setAccentColor, setCurrency }}>
            {children}
        </ThemeContext.Provider>
    );
};

export const useTheme = () => useContext(ThemeContext);

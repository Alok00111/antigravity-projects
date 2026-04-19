// File: src/utils/categories.js
// Manages built-in + custom categories

import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_KEYS } from './constants';

export const EXPENSE_CATEGORIES = [
    { id: 'food', label: 'Food', icon: 'fast-food-outline', color: '#F97316' },
    { id: 'transport', label: 'Transport', icon: 'car-outline', color: '#3B82F6' },
    { id: 'shopping', label: 'Shopping', icon: 'cart-outline', color: '#EC4899' },
    { id: 'bills', label: 'Bills', icon: 'receipt-outline', color: '#EAB308' },
    { id: 'health', label: 'Health', icon: 'medkit-outline', color: '#EF4444' },
    { id: 'entertainment', label: 'Fun', icon: 'game-controller-outline', color: '#8B5CF6' },
    { id: 'education', label: 'Education', icon: 'school-outline', color: '#06B6D4' },
    { id: 'other_expense', label: 'Other', icon: 'ellipsis-horizontal-circle-outline', color: '#71717A' },
];

export const INCOME_CATEGORIES = [
    { id: 'salary', label: 'Salary', icon: 'wallet-outline', color: '#22C55E' },
    { id: 'freelance', label: 'Freelance', icon: 'laptop-outline', color: '#6366F1' },
    { id: 'investment', label: 'Investment', icon: 'trending-up-outline', color: '#14B8A6' },
    { id: 'gift', label: 'Gift', icon: 'gift-outline', color: '#F43F5E' },
    { id: 'other_income', label: 'Other', icon: 'ellipsis-horizontal-circle-outline', color: '#71717A' },
];

// In-memory cache of custom categories
let _customCategories = [];

export const loadCustomCategories = async () => {
    try {
        const data = await AsyncStorage.getItem(STORAGE_KEYS.CUSTOM_CATEGORIES);
        if (data) _customCategories = JSON.parse(data);
        return _customCategories;
    } catch (e) {
        console.error('Error loading custom categories:', e);
        return [];
    }
};

export const saveCustomCategories = async (categories) => {
    try {
        _customCategories = categories;
        await AsyncStorage.setItem(STORAGE_KEYS.CUSTOM_CATEGORIES, JSON.stringify(categories));
    } catch (e) {
        console.error('Error saving custom categories:', e);
    }
};

export const getCustomCategories = () => _customCategories;

export const getCategoriesByType = (type) => {
    const builtIn = type === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;
    const custom = _customCategories.filter((c) => c.type === type);
    return [...builtIn, ...custom];
};

export const getCategoryById = (id) => {
    const all = [...EXPENSE_CATEGORIES, ...INCOME_CATEGORIES, ..._customCategories];
    return all.find((cat) => cat.id === id) || null;
};

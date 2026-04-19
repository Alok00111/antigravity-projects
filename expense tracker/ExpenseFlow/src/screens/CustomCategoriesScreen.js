// File: src/screens/CustomCategoriesScreen.js

import React, { useState, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TextInput,
    TouchableOpacity,
    FlatList,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useTheme } from '../context/ThemeContext';
import ScreenContainer from '../components/ScreenContainer';
import {
    FONT_SIZE,
    SPACING,
    TRANSACTION_TYPES,
} from '../utils/constants';
import {
    getCustomCategories,
    saveCustomCategories,
    loadCustomCategories,
} from '../utils/categories';
import * as haptics from '../utils/haptics';
import { useAlert } from '../context/AlertContext';

const ICON_OPTIONS = [
    'home-outline', 'car-outline', 'airplane-outline', 'bicycle-outline',
    'bus-outline', 'train-outline', 'pizza-outline', 'cafe-outline',
    'beer-outline', 'wine-outline', 'ice-cream-outline', 'nutrition-outline',
    'fitness-outline', 'football-outline', 'game-controller-outline', 'musical-notes-outline',
    'film-outline', 'camera-outline', 'book-outline', 'school-outline',
    'briefcase-outline', 'laptop-outline', 'phone-portrait-outline', 'desktop-outline',
    'wifi-outline', 'cloud-outline', 'heart-outline', 'medkit-outline',
    'paw-outline', 'flower-outline', 'leaf-outline', 'earth-outline',
    'shirt-outline', 'glasses-outline', 'umbrella-outline', 'key-outline',
    'construct-outline', 'hammer-outline', 'color-palette-outline', 'brush-outline',
    'diamond-outline', 'gift-outline', 'star-outline', 'trophy-outline',
    'ribbon-outline', 'rocket-outline', 'bonfire-outline', 'flame-outline',
];

const COLOR_OPTIONS = [
    '#EF4444', '#F97316', '#F59E0B', '#EAB308',
    '#84CC16', '#22C55E', '#14B8A6', '#06B6D4',
    '#3B82F6', '#6366F1', '#8B5CF6', '#A855F7',
    '#D946EF', '#EC4899', '#F43F5E', '#71717A',
];

const CustomCategoriesScreen = () => {
    const { colors } = useTheme();
    const { showAlert } = useAlert();
    const [customCats, setCustomCats] = useState([]);
    const [showForm, setShowForm] = useState(false);
    const [catName, setCatName] = useState('');
    const [catType, setCatType] = useState(TRANSACTION_TYPES.EXPENSE);
    const [selectedIcon, setSelectedIcon] = useState(ICON_OPTIONS[0]);
    const [selectedColor, setSelectedColor] = useState(COLOR_OPTIONS[0]);

    useFocusEffect(
        useCallback(() => {
            loadCustomCategories().then(() => {
                setCustomCats(getCustomCategories());
            });
        }, [])
    );

    const resetForm = () => {
        setCatName('');
        setCatType(TRANSACTION_TYPES.EXPENSE);
        setSelectedIcon(ICON_OPTIONS[0]);
        setSelectedColor(COLOR_OPTIONS[0]);
    };

    const handleCreate = () => {
        if (!catName.trim()) {
            haptics.warning();
            showAlert({ title: 'Missing Name', message: 'Please enter a category name.', type: 'warning' });
            return;
        }
        // Check for duplicates
        const existing = [...getCustomCategories()];
        if (existing.some((c) => c.label.toLowerCase() === catName.trim().toLowerCase())) {
            haptics.warning();
            showAlert({ title: 'Duplicate', message: 'A category with this name already exists.', type: 'warning' });
            return;
        }

        const newCat = {
            id: `custom_${Date.now()}`,
            label: catName.trim(),
            icon: selectedIcon,
            color: selectedColor,
            type: catType,
            isCustom: true,
        };

        const updated = [...existing, newCat];
        saveCustomCategories(updated);
        setCustomCats(updated);
        haptics.success();
        setShowForm(false);
        resetForm();
    };

    const handleDelete = (catId) => {
        showAlert({
            title: 'Delete Category',
            message: 'This will remove the category. Existing transactions using it will show as "Unknown".',
            type: 'confirm',
            buttons: [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: () => {
                        haptics.heavyTap();
                        const updated = getCustomCategories().filter((c) => c.id !== catId);
                        saveCustomCategories(updated);
                        setCustomCats(updated);
                    },
                },
            ],
        });
    };

    const expenseCustom = customCats.filter((c) => c.type === TRANSACTION_TYPES.EXPENSE);
    const incomeCustom = customCats.filter((c) => c.type === TRANSACTION_TYPES.INCOME);

    const renderCategoryItem = (item) => (
        <View key={item.id} style={[styles.catItem, { backgroundColor: colors.card }]}>
            <View style={[styles.catIconCircle, { backgroundColor: `${item.color}18` }]}>
                <Ionicons name={item.icon} size={20} color={item.color} />
            </View>
            <View style={styles.catInfo}>
                <Text style={[styles.catLabel, { color: colors.text }]}>{item.label}</Text>
                <Text style={[styles.catType, { color: colors.textSecondary }]}>
                    {item.type === TRANSACTION_TYPES.EXPENSE ? 'Expense' : 'Income'}
                </Text>
            </View>
            <TouchableOpacity onPress={() => handleDelete(item.id)} activeOpacity={0.6}>
                <Ionicons name="trash-outline" size={18} color={colors.danger} />
            </TouchableOpacity>
        </View>
    );

    return (
        <ScreenContainer>
            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
            >
                <Text style={[styles.header, { color: colors.text }]}>Custom Categories</Text>
                <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
                    Create your own categories for better tracking
                </Text>

                {/* Add Button */}
                {!showForm && (
                    <TouchableOpacity
                        style={[styles.addBtn, { backgroundColor: colors.primary }]}
                        onPress={() => setShowForm(true)}
                        activeOpacity={0.8}
                    >
                        <Ionicons name="add-circle-outline" size={22} color="#FFF" />
                        <Text style={styles.addBtnText}>New Category</Text>
                    </TouchableOpacity>
                )}

                {/* Create Form */}
                {showForm && (
                    <View style={[styles.formCard, { backgroundColor: colors.card }]}>
                        <Text style={[styles.formTitle, { color: colors.text }]}>Create Category</Text>

                        {/* Type Toggle */}
                        <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>Type</Text>
                        <View style={[styles.typeRow, { backgroundColor: colors.background, borderColor: colors.border }]}>
                            <TouchableOpacity
                                style={[
                                    styles.typeBtn,
                                    catType === TRANSACTION_TYPES.EXPENSE && { backgroundColor: colors.danger },
                                ]}
                                onPress={() => { haptics.lightTap(); setCatType(TRANSACTION_TYPES.EXPENSE); }}
                            >
                                <Text style={[
                                    styles.typeText,
                                    { color: colors.textSecondary },
                                    catType === TRANSACTION_TYPES.EXPENSE && { color: '#FFF' },
                                ]}>Expense</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[
                                    styles.typeBtn,
                                    catType === TRANSACTION_TYPES.INCOME && { backgroundColor: colors.success },
                                ]}
                                onPress={() => { haptics.lightTap(); setCatType(TRANSACTION_TYPES.INCOME); }}
                            >
                                <Text style={[
                                    styles.typeText,
                                    { color: colors.textSecondary },
                                    catType === TRANSACTION_TYPES.INCOME && { color: '#FFF' },
                                ]}>Income</Text>
                            </TouchableOpacity>
                        </View>

                        {/* Name */}
                        <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>Name</Text>
                        <TextInput
                            style={[styles.textInput, { backgroundColor: colors.background, borderColor: colors.border, color: colors.text }]}
                            placeholder="e.g., Gym, Uber, Rent"
                            placeholderTextColor={colors.tabInactive}
                            value={catName}
                            onChangeText={setCatName}
                            maxLength={20}
                        />

                        {/* Icon */}
                        <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>Icon</Text>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                            <View style={styles.optionRow}>
                                {ICON_OPTIONS.map((icon) => (
                                    <TouchableOpacity
                                        key={icon}
                                        style={[
                                            styles.iconOption,
                                            { backgroundColor: colors.background, borderColor: colors.border },
                                            selectedIcon === icon && { borderColor: selectedColor, borderWidth: 2 },
                                        ]}
                                        onPress={() => { haptics.selection(); setSelectedIcon(icon); }}
                                    >
                                        <Ionicons name={icon} size={20} color={selectedIcon === icon ? selectedColor : colors.textSecondary} />
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </ScrollView>

                        {/* Color */}
                        <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>Color</Text>
                        <View style={styles.colorGrid}>
                            {COLOR_OPTIONS.map((clr) => (
                                <TouchableOpacity
                                    key={clr}
                                    style={[
                                        styles.colorOption,
                                        { backgroundColor: clr },
                                        selectedColor === clr && styles.colorOptionSelected,
                                    ]}
                                    onPress={() => { haptics.selection(); setSelectedColor(clr); }}
                                >
                                    {selectedColor === clr && (
                                        <Ionicons name="checkmark" size={16} color="#FFF" />
                                    )}
                                </TouchableOpacity>
                            ))}
                        </View>

                        {/* Preview */}
                        <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>Preview</Text>
                        <View style={[styles.previewCard, { backgroundColor: colors.background, borderColor: colors.border }]}>
                            <View style={[styles.catIconCircle, { backgroundColor: `${selectedColor}18` }]}>
                                <Ionicons name={selectedIcon} size={20} color={selectedColor} />
                            </View>
                            <Text style={[styles.previewLabel, { color: colors.text }]}>
                                {catName || 'Category Name'}
                            </Text>
                        </View>

                        {/* Actions */}
                        <View style={styles.formActions}>
                            <TouchableOpacity
                                style={[styles.formSaveBtn, { backgroundColor: colors.primary }]}
                                onPress={handleCreate}
                            >
                                <Text style={styles.formSaveBtnText}>Create</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.formCancelBtn, { borderColor: colors.border }]}
                                onPress={() => { setShowForm(false); resetForm(); }}
                            >
                                <Text style={[styles.formCancelText, { color: colors.textSecondary }]}>Cancel</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                )}

                {/* Existing Custom Categories */}
                {expenseCustom.length > 0 && (
                    <View style={styles.section}>
                        <Text style={[styles.sectionTitle, { color: colors.text }]}>
                            Custom Expense ({expenseCustom.length})
                        </Text>
                        {expenseCustom.map(renderCategoryItem)}
                    </View>
                )}

                {incomeCustom.length > 0 && (
                    <View style={styles.section}>
                        <Text style={[styles.sectionTitle, { color: colors.text }]}>
                            Custom Income ({incomeCustom.length})
                        </Text>
                        {incomeCustom.map(renderCategoryItem)}
                    </View>
                )}

                {customCats.length === 0 && !showForm && (
                    <View style={styles.emptyState}>
                        <Ionicons name="color-palette-outline" size={56} color={colors.tabInactive} />
                        <Text style={[styles.emptyTitle, { color: colors.text }]}>No custom categories</Text>
                        <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
                            Create categories that match your unique spending habits
                        </Text>
                    </View>
                )}
            </ScrollView>
        </ScreenContainer>
    );
};

const styles = StyleSheet.create({
    scrollContent: { paddingBottom: SPACING.xl + 20 },
    header: { fontSize: FONT_SIZE.xxl, fontWeight: '700', marginBottom: 4 },
    subtitle: { fontSize: FONT_SIZE.md, marginBottom: SPACING.lg },
    addBtn: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
        gap: SPACING.sm, paddingVertical: SPACING.md, borderRadius: 14, marginBottom: SPACING.lg,
    },
    addBtnText: { color: '#FFF', fontSize: FONT_SIZE.md, fontWeight: '700' },
    formCard: {
        borderRadius: 16, padding: SPACING.md, marginBottom: SPACING.lg,
        shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 3,
    },
    formTitle: { fontSize: FONT_SIZE.lg, fontWeight: '700', marginBottom: SPACING.sm },
    fieldLabel: { fontSize: FONT_SIZE.sm, fontWeight: '600', marginTop: SPACING.md, marginBottom: SPACING.sm },
    typeRow: {
        flexDirection: 'row', borderRadius: 10, borderWidth: 1, overflow: 'hidden',
    },
    typeBtn: { flex: 1, alignItems: 'center', paddingVertical: SPACING.sm },
    typeText: { fontSize: FONT_SIZE.md, fontWeight: '600' },
    textInput: {
        borderRadius: 10, borderWidth: 1, paddingHorizontal: SPACING.md,
        paddingVertical: SPACING.sm + 2, fontSize: FONT_SIZE.md,
    },
    optionRow: { flexDirection: 'row', gap: SPACING.sm },
    iconOption: {
        width: 42, height: 42, borderRadius: 12, borderWidth: 1,
        alignItems: 'center', justifyContent: 'center',
    },
    colorGrid: {
        flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm,
    },
    colorOption: {
        width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center',
    },
    colorOptionSelected: {
        borderWidth: 3, borderColor: 'rgba(255,255,255,0.6)',
    },
    previewCard: {
        flexDirection: 'row', alignItems: 'center', padding: SPACING.md,
        borderRadius: 12, borderWidth: 1, gap: SPACING.sm,
    },
    previewLabel: { fontSize: FONT_SIZE.md, fontWeight: '600' },
    formActions: { flexDirection: 'row', gap: SPACING.sm, marginTop: SPACING.lg },
    formSaveBtn: {
        flex: 1, alignItems: 'center', paddingVertical: SPACING.sm + 4, borderRadius: 12,
    },
    formSaveBtnText: { color: '#FFF', fontSize: FONT_SIZE.md, fontWeight: '700' },
    formCancelBtn: {
        flex: 1, alignItems: 'center', paddingVertical: SPACING.sm + 4, borderRadius: 12, borderWidth: 1,
    },
    formCancelText: { fontSize: FONT_SIZE.md, fontWeight: '600' },
    section: { marginTop: SPACING.md },
    sectionTitle: { fontSize: FONT_SIZE.lg, fontWeight: '700', marginBottom: SPACING.sm },
    catItem: {
        flexDirection: 'row', alignItems: 'center', padding: SPACING.md,
        borderRadius: 14, marginBottom: SPACING.sm,
        shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 4, elevation: 2,
    },
    catIconCircle: {
        width: 38, height: 38, borderRadius: 10, alignItems: 'center', justifyContent: 'center',
    },
    catInfo: { flex: 1, marginLeft: SPACING.sm },
    catLabel: { fontSize: FONT_SIZE.md, fontWeight: '600' },
    catType: { fontSize: FONT_SIZE.sm, marginTop: 2 },
    emptyState: { alignItems: 'center', paddingVertical: SPACING.xl * 2 },
    emptyTitle: { fontSize: FONT_SIZE.lg, fontWeight: '700', marginTop: SPACING.md },
    emptySubtitle: { fontSize: FONT_SIZE.md, marginTop: SPACING.sm, textAlign: 'center', paddingHorizontal: SPACING.lg },
});

export default CustomCategoriesScreen;

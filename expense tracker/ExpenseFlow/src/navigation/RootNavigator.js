// File: src/navigation/RootNavigator.js

import React, { useState, useEffect } from 'react';
import { Platform, ActivityIndicator, View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '../context/ThemeContext';
import BottomTabNavigator from './BottomTabNavigator';
import SettingsScreen from '../screens/SettingsScreen';
import BudgetScreen from '../screens/BudgetScreen';
import RecurringScreen from '../screens/RecurringScreen';
import SavingsGoalsScreen from '../screens/SavingsGoalsScreen';
import CustomCategoriesScreen from '../screens/CustomCategoriesScreen';
import OnboardingScreen from '../screens/OnboardingScreen';
import ReportsScreen from '../screens/ReportsScreen';
import AccountsScreen from '../screens/AccountsScreen';
import BackupScreen from '../screens/BackupScreen';
import ReceiptGalleryScreen from '../screens/ReceiptGalleryScreen';
import DebtsScreen from '../screens/DebtsScreen';
import { SCREEN_NAMES, STORAGE_KEYS } from '../utils/constants';

const Stack = createNativeStackNavigator();

const defaultFontFamily = Platform.select({
    ios: 'System',
    android: 'sans-serif',
    default: 'System',
});

const RootNavigator = () => {
    const { colors, isDark } = useTheme();
    const [isLoading, setIsLoading] = useState(true);
    const [showOnboarding, setShowOnboarding] = useState(false);

    const navigationTheme = {
        dark: isDark,
        fonts: {
            regular: { fontFamily: defaultFontFamily, fontWeight: '400' },
            medium: { fontFamily: defaultFontFamily, fontWeight: '500' },
            bold: { fontFamily: defaultFontFamily, fontWeight: '700' },
            heavy: { fontFamily: defaultFontFamily, fontWeight: '900' },
        },
        colors: {
            primary: colors.primary,
            background: colors.background,
            card: colors.card,
            text: colors.text,
            border: colors.border,
            notification: colors.accent,
        },
    };

    useEffect(() => {
        checkOnboarding();
    }, []);

    const checkOnboarding = async () => {
        try {
            const done = await AsyncStorage.getItem(STORAGE_KEYS.ONBOARDING_DONE);
            setShowOnboarding(!done);
        } catch (e) {
            console.error('Error checking onboarding:', e);
        } finally {
            setIsLoading(false);
        }
    };

    if (isLoading) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background }}>
                <ActivityIndicator size="large" color={colors.primary} />
            </View>
        );
    }

    if (showOnboarding) {
        return (
            <OnboardingScreen onFinish={() => setShowOnboarding(false)} />
        );
    }

    const modalScreenOptions = {
        headerShown: true,
        title: '',
        headerBackTitle: 'Back',
        headerStyle: { backgroundColor: colors.background },
        headerShadowVisible: false,
        headerTintColor: colors.text,
        contentStyle: { backgroundColor: colors.background },
        animation: 'slide_from_right',
    };

    return (
        <View style={{ flex: 1, backgroundColor: colors.background }}>
            <NavigationContainer theme={navigationTheme}>
                <Stack.Navigator screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.background } }}>
                    <Stack.Screen name="MainTabs" component={BottomTabNavigator} />
                    <Stack.Screen
                        name={SCREEN_NAMES.SETTINGS}
                        component={SettingsScreen}
                        options={modalScreenOptions}
                    />
                    <Stack.Screen
                        name={SCREEN_NAMES.BUDGET}
                        component={BudgetScreen}
                        options={modalScreenOptions}
                    />
                    <Stack.Screen
                        name="Recurring"
                        component={RecurringScreen}
                        options={modalScreenOptions}
                    />
                    <Stack.Screen
                        name={SCREEN_NAMES.SAVINGS_GOALS}
                        component={SavingsGoalsScreen}
                        options={modalScreenOptions}
                    />
                    <Stack.Screen
                        name={SCREEN_NAMES.CUSTOM_CATEGORIES}
                        component={CustomCategoriesScreen}
                        options={modalScreenOptions}
                    />
                    <Stack.Screen
                        name={SCREEN_NAMES.REPORTS}
                        component={ReportsScreen}
                        options={modalScreenOptions}
                    />
                    <Stack.Screen
                        name={SCREEN_NAMES.ACCOUNTS}
                        component={AccountsScreen}
                        options={modalScreenOptions}
                    />
                    <Stack.Screen
                        name={SCREEN_NAMES.BACKUP}
                        component={BackupScreen}
                        options={modalScreenOptions}
                    />
                    <Stack.Screen
                        name={SCREEN_NAMES.RECEIPT_GALLERY}
                        component={ReceiptGalleryScreen}
                        options={modalScreenOptions}
                    />
                    <Stack.Screen
                        name={SCREEN_NAMES.DEBTS}
                        component={DebtsScreen}
                        options={modalScreenOptions}
                    />
                </Stack.Navigator>
            </NavigationContainer>
        </View>
    );
};

export default RootNavigator;

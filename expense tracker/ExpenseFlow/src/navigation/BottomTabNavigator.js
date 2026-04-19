// File: src/navigation/BottomTabNavigator.js

import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import DashboardScreen from '../screens/DashboardScreen';
import AddTransactionScreen from '../screens/AddTransactionScreen';
import TransactionsScreen from '../screens/TransactionsScreen';
import AnalyticsScreen from '../screens/AnalyticsScreen';
import { SCREEN_NAMES, TAB_LABELS, TAB_ICONS, FONT_SIZE } from '../utils/constants';
import * as haptics from '../utils/haptics';

const Tab = createBottomTabNavigator();

const getTabBarIcon = (routeName, focused, color, size) => {
    const iconConfig = TAB_ICONS[routeName];
    const iconName = focused ? iconConfig.focused : iconConfig.unfocused;
    return <Ionicons name={iconName} size={size} color={color} />;
};

const BottomTabNavigator = () => {
    const { colors } = useTheme();

    const screenOptions = ({ route }) => ({
        tabBarIcon: ({ focused, color, size }) =>
            getTabBarIcon(route.name, focused, color, size),
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.tabInactive,
        tabBarStyle: {
            backgroundColor: colors.card,
            borderTopColor: colors.border,
            borderTopWidth: 1,
            paddingBottom: 20,
            paddingTop: 10,
            height: 80,
        },
        tabBarLabelStyle: {
            fontSize: FONT_SIZE.sm,
            fontWeight: '600',
        },
        headerShown: false,
        sceneContainerStyle: { backgroundColor: colors.background },
    });

    const tabListeners = () => ({
        tabPress: () => haptics.selection(),
    });

    return (
        <Tab.Navigator screenOptions={screenOptions}>
            <Tab.Screen
                name={SCREEN_NAMES.DASHBOARD}
                component={DashboardScreen}
                options={{ tabBarLabel: TAB_LABELS[SCREEN_NAMES.DASHBOARD] }}
                listeners={tabListeners}
            />
            <Tab.Screen
                name={SCREEN_NAMES.TRANSACTIONS}
                component={TransactionsScreen}
                options={{ tabBarLabel: TAB_LABELS[SCREEN_NAMES.TRANSACTIONS] }}
                listeners={tabListeners}
            />
            <Tab.Screen
                name={SCREEN_NAMES.ADD_TRANSACTION}
                component={AddTransactionScreen}
                options={{ tabBarLabel: TAB_LABELS[SCREEN_NAMES.ADD_TRANSACTION] }}
                listeners={tabListeners}
            />
            <Tab.Screen
                name={SCREEN_NAMES.ANALYTICS}
                component={AnalyticsScreen}
                options={{ tabBarLabel: TAB_LABELS[SCREEN_NAMES.ANALYTICS] }}
                listeners={tabListeners}
            />
        </Tab.Navigator>
    );
};

export default BottomTabNavigator;

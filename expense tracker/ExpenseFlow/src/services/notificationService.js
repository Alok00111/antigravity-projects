// File: src/services/notificationService.js
// Gracefully handles environments where expo-notifications is not available (e.g. Expo Go SDK 53+)

import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import { STORAGE_KEYS } from '../utils/constants';
import { formatAmount } from '../utils/currencies';

// Only attempt to use notifications in development builds, NOT in Expo Go
const isExpoGo = Constants.appOwnership === 'expo';
let Notifications = null;

if (!isExpoGo) {
    try {
        Notifications = require('expo-notifications');
        Notifications.setNotificationHandler({
            handleNotification: async () => ({
                shouldShowAlert: true,
                shouldPlaySound: true,
                shouldSetBadge: false,
            }),
        });
    } catch (e) {
        // Silently fall back — notifications not available
    }
}

const isAvailable = () => !!Notifications;

const requestPermissions = async () => {
    if (!isAvailable()) return false;
    try {
        const { status: existingStatus } = await Notifications.getPermissionsAsync();
        let finalStatus = existingStatus;

        if (existingStatus !== 'granted') {
            const { status } = await Notifications.requestPermissionsAsync();
            finalStatus = status;
        }

        if (finalStatus !== 'granted') return false;

        if (Platform.OS === 'android') {
            await Notifications.setNotificationChannelAsync('default', {
                name: 'ExpenseFlow',
                importance: Notifications.AndroidImportance.HIGH,
                vibrationPattern: [0, 250, 250, 250],
            });
        }

        return true;
    } catch (error) {
        console.warn('Error requesting notification permissions:', error);
        return false;
    }
};

const isNotificationsEnabled = async () => {
    try {
        const settings = await AsyncStorage.getItem(STORAGE_KEYS.SETTINGS);
        if (settings) {
            const parsed = JSON.parse(settings);
            return parsed.notificationsEnabled || false;
        }
        return false;
    } catch {
        return false;
    }
};

const sendBudgetAlert = async (categoryName, percentUsed, spent, limit, currencySymbol = '₹', currencyCode = 'INR') => {
    if (!isAvailable()) return;
    const enabled = await isNotificationsEnabled();
    if (!enabled) return;

    try {
        const isExceeded = percentUsed >= 100;
        const title = isExceeded ? '🚨 Budget Exceeded!' : '⚡ Budget Warning';
        const body = isExceeded
            ? `You've exceeded your ${categoryName} budget! Spent ${currencySymbol}${formatAmount(spent, currencyCode)} of ${currencySymbol}${formatAmount(limit, currencyCode)}.`
            : `${Math.round(percentUsed)}% of your ${categoryName} budget used. Spent ${currencySymbol}${formatAmount(spent, currencyCode)} of ${currencySymbol}${formatAmount(limit, currencyCode)}.`;

        await Notifications.scheduleNotificationAsync({
            content: { title, body, sound: 'default', data: { type: 'budget_alert', categoryName } },
            trigger: null,
        });
    } catch (e) {
        // Silently fail
    }
};

const scheduleRecurringReminder = async (ruleName, nextDate) => {
    if (!isAvailable()) return null;
    const enabled = await isNotificationsEnabled();
    if (!enabled) return null;

    try {
        const triggerDate = new Date(nextDate);
        triggerDate.setHours(9, 0, 0, 0);
        if (triggerDate <= new Date()) return null;

        return await Notifications.scheduleNotificationAsync({
            content: {
                title: '🔔 Recurring Transaction Due',
                body: `Your recurring transaction "${ruleName}" is due today.`,
                sound: 'default',
                data: { type: 'recurring_reminder', ruleName },
            },
            trigger: { date: triggerDate },
        });
    } catch (e) {
        return null;
    }
};

const cancelAllNotifications = async () => {
    if (!isAvailable()) return;
    try {
        await Notifications.cancelAllScheduledNotificationsAsync();
    } catch (e) {
        // Silently fail
    }
};

const getScheduledNotifications = async () => {
    if (!isAvailable()) return [];
    try {
        return await Notifications.getAllScheduledNotificationsAsync();
    } catch {
        return [];
    }
};

export default {
    isAvailable,
    requestPermissions,
    isNotificationsEnabled,
    sendBudgetAlert,
    scheduleRecurringReminder,
    cancelAllNotifications,
    getScheduledNotifications,
};

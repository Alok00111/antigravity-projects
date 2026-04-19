// File: src/utils/haptics.js
// Centralized haptic feedback utility

import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

/**
 * Light tap — for toggles, selections, tab switches
 */
export const lightTap = () => {
    if (Platform.OS !== 'web') {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
};

/**
 * Medium tap — for buttons, save actions
 */
export const mediumTap = () => {
    if (Platform.OS !== 'web') {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
};

/**
 * Heavy tap — for important actions like delete, clear all
 */
export const heavyTap = () => {
    if (Platform.OS !== 'web') {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    }
};

/**
 * Success — for saved, goal achieved, transaction added
 */
export const success = () => {
    if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
};

/**
 * Warning — for approaching budget, validation failure
 */
export const warning = () => {
    if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    }
};

/**
 * Error — for errors, destructive action confirmations
 */
export const error = () => {
    if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
};

/**
 * Selection — subtle tick for scrolling through pickers
 */
export const selection = () => {
    if (Platform.OS !== 'web') {
        Haptics.selectionAsync();
    }
};

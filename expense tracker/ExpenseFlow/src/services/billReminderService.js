// File: src/services/billReminderService.js
// Schedules / cancels local push notifications for recurring bill rules

import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_KEYS } from '../utils/constants';
import notificationService from './notificationService';
import { getCategoryById } from '../utils/categories';

const REMINDER_OPTIONS = [
    { key: 0, label: 'Same day' },
    { key: 1, label: '1 day before' },
    { key: 2, label: '2 days before' },
    { key: 3, label: '3 days before' },
];

/**
 * Calculate the next occurrence date for a recurring rule.
 */
const getNextOccurrence = (rule) => {
    const now = new Date();
    const created = new Date(rule.lastTriggered || rule.createdAt);
    let next = new Date(created);

    switch (rule.frequency) {
        case 'daily':
            next.setDate(now.getDate() + 1);
            break;
        case 'weekly':
            next.setDate(now.getDate() + (7 - now.getDay() || 7));
            break;
        case 'biweekly':
            next.setDate(now.getDate() + 14);
            break;
        case 'monthly':
        default:
            next.setMonth(now.getMonth() + 1);
            next.setDate(Math.min(created.getDate(), new Date(now.getFullYear(), now.getMonth() + 2, 0).getDate()));
            break;
    }

    // If the computed date is in the past, advance it
    if (next <= now) {
        next.setDate(next.getDate() + 1);
    }

    return next;
};

/**
 * Schedule a reminder notification for a recurring rule.
 * @param {Object} rule - The recurring rule object
 * @param {number} daysBefore - How many days before the due date to remind (0 = same day)
 * @returns {Promise<string|null>} notification ID or null
 */
const scheduleReminder = async (rule, daysBefore = 1) => {
    if (!notificationService.isAvailable()) return null;

    try {
        const nextDate = getNextOccurrence(rule);
        const reminderDate = new Date(nextDate);
        reminderDate.setDate(reminderDate.getDate() - daysBefore);
        reminderDate.setHours(9, 0, 0, 0); // 9 AM

        if (reminderDate <= new Date()) return null;

        const cat = getCategoryById(rule.category);
        const label = cat?.label || 'Bill';
        const dayText = daysBefore === 0 ? 'today' : daysBefore === 1 ? 'tomorrow' : `in ${daysBefore} days`;

        return await notificationService.scheduleRecurringReminder(
            `${label} (${rule.note || rule.frequency})`,
            reminderDate
        );
    } catch (e) {
        console.error('Error scheduling bill reminder:', e);
        return null;
    }
};

/**
 * Update a rule's reminder settings and reschedule.
 * @param {string} ruleId - The rule ID
 * @param {boolean} enabled - Whether reminders are enabled
 * @param {number} daysBefore - Days before due date to remind
 */
const updateRuleReminder = async (ruleId, enabled, daysBefore = 1) => {
    try {
        const data = await AsyncStorage.getItem(STORAGE_KEYS.RECURRING_RULES);
        if (!data) return;

        const rules = JSON.parse(data);
        const updated = rules.map((r) => {
            if (r.id === ruleId) {
                return {
                    ...r,
                    reminderEnabled: enabled,
                    reminderDaysBefore: daysBefore,
                };
            }
            return r;
        });

        await AsyncStorage.setItem(STORAGE_KEYS.RECURRING_RULES, JSON.stringify(updated));

        // Schedule or cancel
        const rule = updated.find((r) => r.id === ruleId);
        if (rule && enabled) {
            await scheduleReminder(rule, daysBefore);
        }

        return updated;
    } catch (e) {
        console.error('Error updating rule reminder:', e);
        return null;
    }
};

/**
 * Refresh all reminders (call on app start or after changes).
 */
const refreshAllReminders = async () => {
    try {
        const data = await AsyncStorage.getItem(STORAGE_KEYS.RECURRING_RULES);
        if (!data) return;

        const rules = JSON.parse(data);
        for (const rule of rules) {
            if (rule.reminderEnabled) {
                await scheduleReminder(rule, rule.reminderDaysBefore || 1);
            }
        }
    } catch (e) {
        console.error('Error refreshing reminders:', e);
    }
};

export { REMINDER_OPTIONS };

export default {
    scheduleReminder,
    updateRuleReminder,
    refreshAllReminders,
    getNextOccurrence,
    REMINDER_OPTIONS,
};

// File: src/utils/constants.js

export const APP_NAME = 'ExpenseFlow';

export const SCREEN_NAMES = {
    DASHBOARD: 'Dashboard',
    ADD_TRANSACTION: 'AddTransaction',
    TRANSACTIONS: 'Transactions',
    ANALYTICS: 'Analytics',
    SETTINGS: 'Settings',
    BUDGET: 'Budget',
    ONBOARDING: 'Onboarding',
    SAVINGS_GOALS: 'SavingsGoals',
    CUSTOM_CATEGORIES: 'CustomCategories',
    REPORTS: 'Reports',
    ACCOUNTS: 'Accounts',
    BACKUP: 'Backup',
    RECEIPT_GALLERY: 'ReceiptGallery',
    DEBTS: 'Debts',
};

export const TAB_LABELS = {
    [SCREEN_NAMES.DASHBOARD]: 'Dashboard',
    [SCREEN_NAMES.ADD_TRANSACTION]: 'Add',
    [SCREEN_NAMES.TRANSACTIONS]: 'Transactions',
    [SCREEN_NAMES.ANALYTICS]: 'Analytics',
};

export const TAB_ICONS = {
    [SCREEN_NAMES.DASHBOARD]: { focused: 'home', unfocused: 'home-outline' },
    [SCREEN_NAMES.ADD_TRANSACTION]: { focused: 'add-circle', unfocused: 'add-circle-outline' },
    [SCREEN_NAMES.TRANSACTIONS]: { focused: 'list', unfocused: 'list-outline' },
    [SCREEN_NAMES.ANALYTICS]: { focused: 'stats-chart', unfocused: 'stats-chart-outline' },
};

export const TRANSACTION_TYPES = {
    EXPENSE: 'expense',
    INCOME: 'income',
};

export const STORAGE_KEYS = {
    TRANSACTIONS: '@expenseflow_transactions',
    BUDGETS: '@expenseflow_budgets',
    SETTINGS: '@expenseflow_settings',
    ONBOARDING_DONE: '@expenseflow_onboarding_done',
    RECURRING_RULES: '@expenseflow_recurring_rules',
    SAVINGS_GOALS: '@expenseflow_savings_goals',
    CUSTOM_CATEGORIES: '@expenseflow_custom_categories',
    NOTIFICATION_SETTINGS: '@expenseflow_notification_settings',
    ACCOUNTS: '@expenseflow_accounts',
    LAST_BACKUP: '@expenseflow_last_backup',
    DEBTS: '@expenseflow_debts',
    USER_NAME: '@expenseflow_user_name',
};


export const DEFAULT_ACCOUNTS = [
    { id: 'cash', name: 'Cash', icon: 'cash-outline', color: '#22C55E', isDefault: true },
    { id: 'bank', name: 'Bank Account', icon: 'business-outline', color: '#3B82F6', isDefault: false },
    { id: 'credit_card', name: 'Credit Card', icon: 'card-outline', color: '#F97316', isDefault: false },
    { id: 'upi', name: 'UPI', icon: 'phone-portrait-outline', color: '#8B5CF6', isDefault: false },
];

export const SPACING = {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
};

export const FONT_SIZE = {
    sm: 12,
    md: 14,
    lg: 18,
    xl: 24,
    xxl: 32,
};

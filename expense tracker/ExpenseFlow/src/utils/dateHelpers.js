// File: src/utils/dateHelpers.js

const MONTHS_SHORT = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];

const MONTHS_FULL = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
];

/**
 * Format an ISO string to "Feb 14, 2026"
 */
export const formatDate = (isoString) => {
    const d = new Date(isoString);
    return `${MONTHS_SHORT[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
};

/**
 * Format an ISO string to "Today", "Yesterday", or "Feb 14, 2026"
 */
export const formatRelativeDate = (isoString) => {
    const d = new Date(isoString);
    const now = new Date();

    const dateOnly = new Date(d.getFullYear(), d.getMonth(), d.getDate());
    const todayOnly = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const diffDays = Math.round((todayOnly - dateOnly) / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) {
        const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        return days[d.getDay()];
    }
    return formatDate(isoString);
};

/**
 * Format time from ISO string to "2:30 PM"
 */
export const formatTime = (isoString) => {
    const d = new Date(isoString);
    let hours = d.getHours();
    const mins = d.getMinutes().toString().padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12 || 12;
    return `${hours}:${mins} ${ampm}`;
};

/**
 * Get a date key like "2026-02-14" for grouping
 */
const getDateKey = (isoString) => {
    const d = new Date(isoString);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

/**
 * Group transactions by date for SectionList
 * Returns sorted (newest first) array of { title, data }
 */
export const groupByDate = (transactions) => {
    const groups = {};
    transactions.forEach((txn) => {
        const key = getDateKey(txn.date);
        if (!groups[key]) {
            groups[key] = {
                title: formatRelativeDate(txn.date),
                dateKey: key,
                data: [],
            };
        }
        groups[key].data.push(txn);
    });

    return Object.values(groups)
        .sort((a, b) => b.dateKey.localeCompare(a.dateKey))
        .map(({ title, data }) => ({
            title,
            data: data.sort((a, b) => new Date(b.date) - new Date(a.date)),
        }));
};

/**
 * Get start and end of a given month (or current month)
 */
export const getMonthRange = (date = new Date()) => {
    const start = new Date(date.getFullYear(), date.getMonth(), 1);
    const end = new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59, 999);
    return { start, end };
};

/**
 * Get start and end of the current week (Monday–Sunday)
 */
export const getWeekRange = (date = new Date()) => {
    const d = new Date(date);
    const day = d.getDay();
    const diffToMon = day === 0 ? 6 : day - 1;
    const start = new Date(d);
    start.setDate(d.getDate() - diffToMon);
    start.setHours(0, 0, 0, 0);

    const end = new Date(start);
    end.setDate(start.getDate() + 6);
    end.setHours(23, 59, 59, 999);
    return { start, end };
};

/**
 * Filter transactions within a date range
 */
export const filterByDateRange = (transactions, start, end) => {
    return transactions.filter((txn) => {
        const d = new Date(txn.date);
        return d >= start && d <= end;
    });
};

/**
 * Get short month name from a Date
 */
export const getMonthShort = (date) => MONTHS_SHORT[date.getMonth()];

/**
 * Get full month name from a Date
 */
export const getMonthFull = (date) => MONTHS_FULL[date.getMonth()];

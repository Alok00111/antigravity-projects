import AsyncStorage from '@react-native-async-storage/async-storage';

// Storage keys
const KEYS = {
    THEME: '@theme_preference',
    LANGUAGE: '@target_language',
    COMPLETED_DAYS: '@completed_days',
    PROGRESS_LOGS: '@progress_logs',
    GEMINI_API_KEY: '@gemini_api_key',
};

export interface ProgressLog {
    day: number;
    date: string;
    topic: string;
    transcript: string;
    score: number;
    feedback: string[];
    duration: number;
}

// Theme preference
export const getThemePreference = async (): Promise<string | null> => {
    try {
        return await AsyncStorage.getItem(KEYS.THEME);
    } catch (error) {
        console.error('Error getting theme preference:', error);
        return null;
    }
};

export const setThemePreference = async (theme: string): Promise<void> => {
    try {
        await AsyncStorage.setItem(KEYS.THEME, theme);
    } catch (error) {
        console.error('Error setting theme preference:', error);
    }
};

// Target language
export const getTargetLanguage = async (): Promise<string> => {
    try {
        const language = await AsyncStorage.getItem(KEYS.LANGUAGE);
        return language || 'spanish';
    } catch (error) {
        console.error('Error getting target language:', error);
        return 'spanish';
    }
};

export const setTargetLanguage = async (language: string): Promise<void> => {
    try {
        await AsyncStorage.setItem(KEYS.LANGUAGE, language);
    } catch (error) {
        console.error('Error setting target language:', error);
    }
};

// Completed days
export const getCompletedDays = async (): Promise<number[]> => {
    try {
        const data = await AsyncStorage.getItem(KEYS.COMPLETED_DAYS);
        return data ? JSON.parse(data) : [];
    } catch (error) {
        console.error('Error getting completed days:', error);
        return [];
    }
};

export const markDayComplete = async (day: number): Promise<void> => {
    try {
        const completed = await getCompletedDays();
        if (!completed.includes(day)) {
            completed.push(day);
            await AsyncStorage.setItem(KEYS.COMPLETED_DAYS, JSON.stringify(completed));
        }
    } catch (error) {
        console.error('Error marking day complete:', error);
    }
};

// Progress logs
export const getProgressLogs = async (): Promise<ProgressLog[]> => {
    try {
        const data = await AsyncStorage.getItem(KEYS.PROGRESS_LOGS);
        return data ? JSON.parse(data) : [];
    } catch (error) {
        console.error('Error getting progress logs:', error);
        return [];
    }
};

export const addProgressLog = async (log: ProgressLog): Promise<void> => {
    try {
        const logs = await getProgressLogs();
        logs.push(log);
        await AsyncStorage.setItem(KEYS.PROGRESS_LOGS, JSON.stringify(logs));
        await markDayComplete(log.day);
    } catch (error) {
        console.error('Error adding progress log:', error);
    }
};

// Gemini API Key
export const getGeminiApiKey = async (): Promise<string | null> => {
    try {
        return await AsyncStorage.getItem(KEYS.GEMINI_API_KEY);
    } catch (error) {
        console.error('Error getting Gemini API key:', error);
        return null;
    }
};

export const setGeminiApiKey = async (key: string): Promise<void> => {
    try {
        await AsyncStorage.setItem(KEYS.GEMINI_API_KEY, key);
    } catch (error) {
        console.error('Error setting Gemini API key:', error);
    }
};

// Clear all progress
export const clearAllProgress = async (): Promise<void> => {
    try {
        await AsyncStorage.multiRemove([KEYS.COMPLETED_DAYS, KEYS.PROGRESS_LOGS]);
    } catch (error) {
        console.error('Error clearing progress:', error);
    }
};

// Clear all data (including settings)
export const clearAllData = async (): Promise<void> => {
    try {
        await AsyncStorage.multiRemove(Object.values(KEYS));
    } catch (error) {
        console.error('Error clearing all data:', error);
    }
};

export default {
    getThemePreference,
    setThemePreference,
    getTargetLanguage,
    setTargetLanguage,
    getCompletedDays,
    markDayComplete,
    getProgressLogs,
    addProgressLog,
    getGeminiApiKey,
    setGeminiApiKey,
    clearAllProgress,
    clearAllData,
};

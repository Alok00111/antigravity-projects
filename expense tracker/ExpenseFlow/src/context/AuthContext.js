// File: src/context/AuthContext.js
// Manages biometric lock state and authentication

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { AppState } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as LocalAuthentication from 'expo-local-authentication';
import { STORAGE_KEYS } from '../utils/constants';

const AuthContext = createContext({
    isLocked: false,
    isLockEnabled: false,
    isBiometricAvailable: false,
    authenticate: async () => false,
    toggleLock: async () => { },
});

export const AuthProvider = ({ children }) => {
    const [isLocked, setIsLocked] = useState(false);
    const [isLockEnabled, setIsLockEnabled] = useState(false);
    const [isBiometricAvailable, setIsBiometricAvailable] = useState(false);
    const [isReady, setIsReady] = useState(false);

    useEffect(() => {
        init();
    }, []);

    // Lock when app goes to background
    useEffect(() => {
        const subscription = AppState.addEventListener('change', (nextState) => {
            if (nextState === 'background' && isLockEnabled) {
                setIsLocked(true);
            }
            if (nextState === 'active' && isLocked && isLockEnabled) {
                authenticate();
            }
        });
        return () => subscription?.remove();
    }, [isLockEnabled, isLocked]);

    const init = async () => {
        try {
            // Check hardware support
            const compatible = await LocalAuthentication.hasHardwareAsync();
            const enrolled = await LocalAuthentication.isEnrolledAsync();
            setIsBiometricAvailable(compatible && enrolled);

            // Load user preference
            const settings = await AsyncStorage.getItem(STORAGE_KEYS.SETTINGS);
            if (settings) {
                const parsed = JSON.parse(settings);
                const enabled = parsed.biometricLock || false;
                setIsLockEnabled(enabled);
                if (enabled && compatible && enrolled) {
                    setIsLocked(true);
                    // Will auto-prompt on mount
                }
            }
        } catch (e) {
            console.error('Error initializing auth:', e);
        } finally {
            setIsReady(true);
        }
    };

    const authenticate = useCallback(async () => {
        try {
            const result = await LocalAuthentication.authenticateAsync({
                promptMessage: 'Unlock ExpenseFlow',
                cancelLabel: 'Cancel',
                disableDeviceFallback: false,
                fallbackLabel: 'Use Passcode',
            });
            if (result.success) {
                setIsLocked(false);
                return true;
            }
            return false;
        } catch (e) {
            console.error('Authentication error:', e);
            return false;
        }
    }, []);

    const toggleLock = useCallback(async () => {
        try {
            const newValue = !isLockEnabled;
            if (newValue) {
                // Verify auth first before enabling
                const result = await LocalAuthentication.authenticateAsync({
                    promptMessage: 'Verify to enable biometric lock',
                    cancelLabel: 'Cancel',
                    disableDeviceFallback: false,
                });
                if (!result.success) return;
            }
            setIsLockEnabled(newValue);
            setIsLocked(false);
            // Merge with existing settings
            const existingRaw = await AsyncStorage.getItem(STORAGE_KEYS.SETTINGS);
            const existing = existingRaw ? JSON.parse(existingRaw) : {};
            await AsyncStorage.setItem(
                STORAGE_KEYS.SETTINGS,
                JSON.stringify({ ...existing, biometricLock: newValue })
            );
        } catch (e) {
            console.error('Error toggling lock:', e);
        }
    }, [isLockEnabled]);

    if (!isReady) return null;

    return (
        <AuthContext.Provider
            value={{
                isLocked,
                isLockEnabled,
                isBiometricAvailable,
                authenticate,
                toggleLock,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);

// File: src/components/BiometricLockScreen.js
// Full-screen lock overlay shown when app is locked

import React, { useEffect, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Animated,
    Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { SPACING, FONT_SIZE } from '../utils/constants';

const { width } = Dimensions.get('window');

const BiometricLockScreen = () => {
    const { isLocked, authenticate } = useAuth();
    const pulseAnim = useRef(new Animated.Value(1)).current;
    const fadeAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        if (isLocked) {
            // Fade in
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 300,
                useNativeDriver: true,
            }).start();

            // Pulse animation on lock icon
            const pulse = Animated.loop(
                Animated.sequence([
                    Animated.timing(pulseAnim, {
                        toValue: 1.1,
                        duration: 1200,
                        useNativeDriver: true,
                    }),
                    Animated.timing(pulseAnim, {
                        toValue: 1,
                        duration: 1200,
                        useNativeDriver: true,
                    }),
                ])
            );
            pulse.start();

            // Auto-prompt after short delay
            const timer = setTimeout(() => authenticate(), 500);
            return () => {
                pulse.stop();
                clearTimeout(timer);
            };
        }
    }, [isLocked]);

    if (!isLocked) return null;

    return (
        <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
            <View style={styles.content}>
                <Animated.View
                    style={[
                        styles.lockIconContainer,
                        { transform: [{ scale: pulseAnim }] },
                    ]}
                >
                    <Ionicons name="lock-closed" size={48} color="#A78BFA" />
                </Animated.View>

                <Text style={styles.title}>ExpenseFlow is Locked</Text>
                <Text style={styles.subtitle}>
                    Use fingerprint or Face ID to unlock
                </Text>

                <TouchableOpacity
                    style={styles.unlockBtn}
                    onPress={authenticate}
                    activeOpacity={0.7}
                >
                    <Ionicons name="finger-print-outline" size={24} color="#FFF" />
                    <Text style={styles.unlockBtnText}>Tap to Unlock</Text>
                </TouchableOpacity>
            </View>
        </Animated.View>
    );
};

const styles = StyleSheet.create({
    container: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: '#0A0A1A',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 9999,
    },
    content: {
        alignItems: 'center',
        paddingHorizontal: SPACING.xl,
    },
    lockIconContainer: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: 'rgba(167, 139, 250, 0.12)',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: SPACING.xl,
    },
    title: {
        fontSize: FONT_SIZE.xxl,
        fontWeight: '700',
        color: '#F5F5FA',
        textAlign: 'center',
        marginBottom: SPACING.sm,
    },
    subtitle: {
        fontSize: FONT_SIZE.md,
        color: '#8892B0',
        textAlign: 'center',
        marginBottom: SPACING.xl * 2,
    },
    unlockBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: SPACING.sm,
        backgroundColor: '#7C3AED',
        width: width - SPACING.lg * 2,
        paddingVertical: SPACING.md + 2,
        borderRadius: 16,
    },
    unlockBtnText: {
        color: '#FFF',
        fontSize: FONT_SIZE.lg,
        fontWeight: '700',
    },
});

export default BiometricLockScreen;

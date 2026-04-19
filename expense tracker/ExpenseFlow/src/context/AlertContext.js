// File: src/context/AlertContext.js
// Ultra-premium themed alert system with rich visuals per type

import React, { createContext, useContext, useState, useCallback, useRef } from 'react';
import {
    Modal,
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    Animated,
    Dimensions,
    Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from './ThemeContext';
import { SPACING, FONT_SIZE } from '../utils/constants';
import { LinearGradient } from 'expo-linear-gradient';

const AlertContext = createContext({ showAlert: () => { } });

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Each type gets a completely different visual identity
const ALERT_THEMES = {
    success: {
        icon: 'checkmark-circle',
        iconOutline: 'checkmark-circle-outline',
        gradient: ['#059669', '#10B981', '#34D399'],
        glowColor: '#10B981',
        label: 'SUCCESS',
        emoji: '✨',
        decorIcon1: 'star',
        decorIcon2: 'sparkles-outline',
        decorIcon3: 'trophy-outline',
    },
    error: {
        icon: 'close-circle',
        iconOutline: 'close-circle-outline',
        gradient: ['#DC2626', '#EF4444', '#F87171'],
        glowColor: '#EF4444',
        label: 'ERROR',
        emoji: '⚠️',
        decorIcon1: 'alert-circle',
        decorIcon2: 'flash-outline',
        decorIcon3: 'shield-outline',
    },
    warning: {
        icon: 'warning',
        iconOutline: 'warning-outline',
        gradient: ['#D97706', '#F59E0B', '#FBBF24'],
        glowColor: '#F59E0B',
        label: 'WARNING',
        emoji: '⚡',
        decorIcon1: 'alert',
        decorIcon2: 'eye-outline',
        decorIcon3: 'information-circle-outline',
    },
    info: {
        icon: 'information-circle',
        iconOutline: 'information-circle-outline',
        gradient: ['#2563EB', '#3B82F6', '#60A5FA'],
        glowColor: '#3B82F6',
        label: 'INFO',
        emoji: '💡',
        decorIcon1: 'bulb',
        decorIcon2: 'chatbox-ellipses-outline',
        decorIcon3: 'help-circle-outline',
    },
    confirm: {
        icon: 'shield-checkmark',
        iconOutline: 'shield-checkmark-outline',
        gradient: ['#7C3AED', '#8B5CF6', '#A78BFA'],
        glowColor: '#8B5CF6',
        label: 'CONFIRM',
        emoji: '🔒',
        decorIcon1: 'lock-closed',
        decorIcon2: 'help-circle-outline',
        decorIcon3: 'shield-half-outline',
    },
    // Special types for expense/income flows
    expense: {
        icon: 'arrow-up-circle',
        iconOutline: 'arrow-up-circle-outline',
        gradient: ['#DC2626', '#EF4444', '#FB7185'],
        glowColor: '#EF4444',
        label: 'EXPENSE',
        emoji: '💸',
        decorIcon1: 'card',
        decorIcon2: 'wallet-outline',
        decorIcon3: 'cash-outline',
    },
    income: {
        icon: 'arrow-down-circle',
        iconOutline: 'arrow-down-circle-outline',
        gradient: ['#059669', '#10B981', '#6EE7B7'],
        glowColor: '#10B981',
        label: 'INCOME',
        emoji: '💰',
        decorIcon1: 'trending-up',
        decorIcon2: 'diamond-outline',
        decorIcon3: 'star-outline',
    },
};

export const AlertProvider = ({ children }) => {
    const { colors, isDark } = useTheme();
    const [visible, setVisible] = useState(false);
    const [config, setConfig] = useState({});

    // Animations
    const backdropAnim = useRef(new Animated.Value(0)).current;
    const cardScale = useRef(new Animated.Value(0.6)).current;
    const cardOpacity = useRef(new Animated.Value(0)).current;
    const cardSlide = useRef(new Animated.Value(50)).current;
    const iconScale = useRef(new Animated.Value(0)).current;
    const iconRotate = useRef(new Animated.Value(0)).current;
    const glowScale = useRef(new Animated.Value(0.5)).current;
    const glowOpacity = useRef(new Animated.Value(0)).current;
    const labelOpacity = useRef(new Animated.Value(0)).current;
    const labelSlide = useRef(new Animated.Value(-10)).current;
    const contentOpacity = useRef(new Animated.Value(0)).current;
    const contentSlide = useRef(new Animated.Value(15)).current;
    const buttonsOpacity = useRef(new Animated.Value(0)).current;
    const buttonsSlide = useRef(new Animated.Value(20)).current;
    // Floating decorations
    const decor1Anim = useRef(new Animated.Value(0)).current;
    const decor2Anim = useRef(new Animated.Value(0)).current;
    const decor3Anim = useRef(new Animated.Value(0)).current;

    const showAlert = useCallback(({ title, message, type = 'info', buttons = [{ text: 'OK' }] }) => {
        setConfig({ title, message, type, buttons });
        setVisible(true);

        // Reset
        backdropAnim.setValue(0);
        cardScale.setValue(0.6);
        cardOpacity.setValue(0);
        cardSlide.setValue(50);
        iconScale.setValue(0);
        iconRotate.setValue(0);
        glowScale.setValue(0.5);
        glowOpacity.setValue(0);
        labelOpacity.setValue(0);
        labelSlide.setValue(-10);
        contentOpacity.setValue(0);
        contentSlide.setValue(15);
        buttonsOpacity.setValue(0);
        buttonsSlide.setValue(20);
        decor1Anim.setValue(0);
        decor2Anim.setValue(0);
        decor3Anim.setValue(0);

        // Cinematic entrance sequence
        Animated.stagger(60, [
            // 1. Backdrop
            Animated.timing(backdropAnim, { toValue: 1, duration: 250, useNativeDriver: true }),
            // 2. Card springs in
            Animated.parallel([
                Animated.spring(cardScale, { toValue: 1, friction: 7, tension: 100, useNativeDriver: true }),
                Animated.timing(cardOpacity, { toValue: 1, duration: 250, useNativeDriver: true }),
                Animated.spring(cardSlide, { toValue: 0, friction: 8, tension: 80, useNativeDriver: true }),
            ]),
            // 3. Glow expands
            Animated.parallel([
                Animated.spring(glowScale, { toValue: 1, friction: 5, tension: 60, useNativeDriver: true }),
                Animated.timing(glowOpacity, { toValue: 1, duration: 300, useNativeDriver: true }),
            ]),
            // 4. Icon bounces in with slight rotation
            Animated.parallel([
                Animated.spring(iconScale, { toValue: 1, friction: 4, tension: 180, useNativeDriver: true }),
                Animated.spring(iconRotate, { toValue: 1, friction: 6, tension: 120, useNativeDriver: true }),
            ]),
            // 5. Label slides in
            Animated.parallel([
                Animated.timing(labelOpacity, { toValue: 1, duration: 200, useNativeDriver: true }),
                Animated.spring(labelSlide, { toValue: 0, friction: 8, tension: 100, useNativeDriver: true }),
            ]),
            // 6. Content fades in
            Animated.parallel([
                Animated.timing(contentOpacity, { toValue: 1, duration: 250, useNativeDriver: true }),
                Animated.spring(contentSlide, { toValue: 0, friction: 8, tension: 80, useNativeDriver: true }),
            ]),
            // 7. Buttons slide up
            Animated.parallel([
                Animated.timing(buttonsOpacity, { toValue: 1, duration: 200, useNativeDriver: true }),
                Animated.spring(buttonsSlide, { toValue: 0, friction: 7, tension: 90, useNativeDriver: true }),
            ]),
        ]).start();

        // Floating decoration animations
        Animated.loop(
            Animated.sequence([
                Animated.timing(decor1Anim, { toValue: 1, duration: 3000, useNativeDriver: true }),
                Animated.timing(decor1Anim, { toValue: 0, duration: 3000, useNativeDriver: true }),
            ])
        ).start();
        Animated.loop(
            Animated.sequence([
                Animated.timing(decor2Anim, { toValue: 1, duration: 4000, useNativeDriver: true }),
                Animated.timing(decor2Anim, { toValue: 0, duration: 4000, useNativeDriver: true }),
            ])
        ).start();
        Animated.loop(
            Animated.sequence([
                Animated.timing(decor3Anim, { toValue: 1, duration: 2500, useNativeDriver: true }),
                Animated.timing(decor3Anim, { toValue: 0, duration: 2500, useNativeDriver: true }),
            ])
        ).start();
    }, []);

    const dismiss = useCallback((onPress) => {
        Animated.parallel([
            Animated.timing(cardScale, { toValue: 0.6, duration: 200, useNativeDriver: true }),
            Animated.timing(cardOpacity, { toValue: 0, duration: 180, useNativeDriver: true }),
            Animated.timing(backdropAnim, { toValue: 0, duration: 250, useNativeDriver: true }),
            Animated.timing(cardSlide, { toValue: 50, duration: 200, useNativeDriver: true }),
        ]).start(() => {
            setVisible(false);
            decor1Anim.stopAnimation();
            decor2Anim.stopAnimation();
            decor3Anim.stopAnimation();
            if (onPress) onPress();
        });
    }, []);

    const theme = ALERT_THEMES[config.type] || ALERT_THEMES.info;
    const hasMultipleButtons = (config.buttons || []).length > 1;
    const hasThreeButtons = (config.buttons || []).length >= 3;

    // Interpolated animations
    const iconRotation = iconRotate.interpolate({
        inputRange: [0, 0.5, 1],
        outputRange: ['-15deg', '8deg', '0deg'],
    });

    const decor1Y = decor1Anim.interpolate({
        inputRange: [0, 1],
        outputRange: [0, -8],
    });
    const decor2Y = decor2Anim.interpolate({
        inputRange: [0, 1],
        outputRange: [0, 6],
    });
    const decor3Opacity = decor3Anim.interpolate({
        inputRange: [0, 0.5, 1],
        outputRange: [0.3, 0.7, 0.3],
    });

    return (
        <AlertContext.Provider value={{ showAlert }}>
            {children}
            <Modal
                visible={visible}
                transparent
                animationType="none"
                statusBarTranslucent
                onRequestClose={() => dismiss()}
            >
                {/* Backdrop */}
                <Animated.View style={[styles.overlay, { opacity: backdropAnim }]}>
                    <TouchableOpacity
                        style={StyleSheet.absoluteFillObject}
                        activeOpacity={1}
                        onPress={() => dismiss()}
                    />
                </Animated.View>

                {/* Dialog wrapper */}
                <View style={styles.dialogContainer} pointerEvents="box-none">
                    <Animated.View
                        style={[
                            styles.card,
                            {
                                backgroundColor: isDark ? '#1A1A24' : '#FFFFFF',
                                transform: [
                                    { scale: cardScale },
                                    { translateY: cardSlide },
                                ],
                                opacity: cardOpacity,
                            },
                        ]}
                    >
                        {/* ─── HERO SECTION with gradient ─── */}
                        <View style={styles.heroSection}>
                            <LinearGradient
                                colors={theme.gradient}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 1 }}
                                style={styles.heroGradient}
                            >
                                {/* Floating decorative icons */}
                                <Animated.View style={[styles.decorIcon, styles.decorIcon1, { transform: [{ translateY: decor1Y }] }]}>
                                    <Ionicons name={theme.decorIcon1} size={16} color="rgba(255,255,255,0.2)" />
                                </Animated.View>
                                <Animated.View style={[styles.decorIcon, styles.decorIcon2, { transform: [{ translateY: decor2Y }] }]}>
                                    <Ionicons name={theme.decorIcon2} size={20} color="rgba(255,255,255,0.15)" />
                                </Animated.View>
                                <Animated.View style={[styles.decorIcon, styles.decorIcon3, { opacity: decor3Opacity }]}>
                                    <Ionicons name={theme.decorIcon3} size={14} color="rgba(255,255,255,0.18)" />
                                </Animated.View>

                                {/* Decorative circles */}
                                <View style={styles.decorCircle1} />
                                <View style={styles.decorCircle2} />

                                {/* Glow behind icon */}
                                <Animated.View
                                    style={[
                                        styles.iconGlow,
                                        {
                                            opacity: glowOpacity,
                                            transform: [{ scale: glowScale }],
                                        },
                                    ]}
                                />

                                {/* Main icon */}
                                <Animated.View
                                    style={[
                                        styles.iconContainer,
                                        {
                                            transform: [
                                                { scale: iconScale },
                                                { rotate: iconRotation },
                                            ],
                                        },
                                    ]}
                                >
                                    <View style={styles.iconRing}>
                                        <View style={styles.iconInner}>
                                            <Ionicons name={theme.icon} size={36} color="#FFFFFF" />
                                        </View>
                                    </View>
                                </Animated.View>

                                {/* Type label badge */}
                                <Animated.View
                                    style={[
                                        styles.typeBadge,
                                        {
                                            opacity: labelOpacity,
                                            transform: [{ translateY: labelSlide }],
                                        },
                                    ]}
                                >
                                    <Text style={styles.typeBadgeText}>{theme.label}</Text>
                                </Animated.View>
                            </LinearGradient>
                        </View>

                        {/* ─── CONTENT SECTION ─── */}
                        <Animated.View
                            style={[
                                styles.contentSection,
                                {
                                    opacity: contentOpacity,
                                    transform: [{ translateY: contentSlide }],
                                },
                            ]}
                        >
                            {config.title && (
                                <Text style={[styles.title, { color: colors.text }]}>
                                    {config.title}
                                </Text>
                            )}
                            {config.message && (
                                <Text style={[styles.message, { color: colors.textSecondary }]}>
                                    {config.message}
                                </Text>
                            )}
                        </Animated.View>

                        {/* ─── BUTTONS SECTION ─── */}
                        <Animated.View
                            style={[
                                styles.buttonSection,
                                {
                                    opacity: buttonsOpacity,
                                    transform: [{ translateY: buttonsSlide }],
                                    borderTopColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)',
                                },
                            ]}
                        >
                            <View style={[
                                styles.buttonRow,
                                hasMultipleButtons && !hasThreeButtons && styles.buttonRowMultiple,
                                hasThreeButtons && styles.buttonRowStacked,
                            ]}>
                                {(config.buttons || []).map((btn, i) => {
                                    const isDestructive = btn.style === 'destructive';
                                    const isCancel = btn.style === 'cancel';

                                    if (isCancel) {
                                        return (
                                            <TouchableOpacity
                                                key={i}
                                                style={[
                                                    styles.btn,
                                                    styles.btnCancel,
                                                    {
                                                        backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)',
                                                        borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)',
                                                    },
                                                    hasMultipleButtons && !hasThreeButtons && styles.btnFlex,
                                                ]}
                                                onPress={() => dismiss(btn.onPress)}
                                                activeOpacity={0.7}
                                            >
                                                <Text style={[styles.btnText, { color: colors.textSecondary }]}>
                                                    {btn.text}
                                                </Text>
                                            </TouchableOpacity>
                                        );
                                    }

                                    if (isDestructive) {
                                        return (
                                            <TouchableOpacity
                                                key={i}
                                                style={[
                                                    styles.btn,
                                                    styles.btnElevated,
                                                    hasMultipleButtons && !hasThreeButtons && styles.btnFlex,
                                                ]}
                                                onPress={() => dismiss(btn.onPress)}
                                                activeOpacity={0.75}
                                            >
                                                <LinearGradient
                                                    colors={['#EF4444', '#DC2626']}
                                                    start={{ x: 0, y: 0 }}
                                                    end={{ x: 1, y: 0 }}
                                                    style={styles.btnGradient}
                                                >
                                                    <Ionicons name="trash-outline" size={16} color="#FFF" style={{ marginRight: 6 }} />
                                                    <Text style={[styles.btnText, styles.btnTextBold, { color: '#FFFFFF' }]}>
                                                        {btn.text}
                                                    </Text>
                                                </LinearGradient>
                                            </TouchableOpacity>
                                        );
                                    }

                                    // Primary button
                                    return (
                                        <TouchableOpacity
                                            key={i}
                                            style={[
                                                styles.btn,
                                                styles.btnElevated,
                                                hasMultipleButtons && !hasThreeButtons && styles.btnFlex,
                                            ]}
                                            onPress={() => dismiss(btn.onPress)}
                                            activeOpacity={0.75}
                                        >
                                            <LinearGradient
                                                colors={theme.gradient.slice(0, 2)}
                                                start={{ x: 0, y: 0 }}
                                                end={{ x: 1, y: 0 }}
                                                style={styles.btnGradient}
                                            >
                                                <Text style={[styles.btnText, styles.btnTextBold, { color: '#FFFFFF' }]}>
                                                    {btn.text}
                                                </Text>
                                            </LinearGradient>
                                        </TouchableOpacity>
                                    );
                                })}
                            </View>
                        </Animated.View>
                    </Animated.View>
                </View>
            </Modal>
        </AlertContext.Provider>
    );
};

export const useAlert = () => useContext(AlertContext);

const styles = StyleSheet.create({
    overlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
    },
    dialogContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 24,
    },
    card: {
        width: Math.min(SCREEN_WIDTH - 40, 370),
        borderRadius: 28,
        overflow: 'hidden',
        ...Platform.select({
            ios: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 20 },
                shadowOpacity: 0.35,
                shadowRadius: 40,
            },
            android: {
                elevation: 28,
            },
        }),
    },

    // ── Hero gradient section ──
    heroSection: {
        overflow: 'hidden',
    },
    heroGradient: {
        paddingTop: 32,
        paddingBottom: 24,
        alignItems: 'center',
        position: 'relative',
        overflow: 'hidden',
    },
    decorCircle1: {
        position: 'absolute',
        top: -20,
        right: -20,
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: 'rgba(255,255,255,0.08)',
    },
    decorCircle2: {
        position: 'absolute',
        bottom: -15,
        left: -15,
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: 'rgba(255,255,255,0.06)',
    },
    decorIcon: {
        position: 'absolute',
    },
    decorIcon1: {
        top: 18,
        right: 30,
    },
    decorIcon2: {
        top: 45,
        left: 22,
    },
    decorIcon3: {
        bottom: 20,
        right: 50,
    },

    // ── Icon ──
    iconGlow: {
        position: 'absolute',
        width: 90,
        height: 90,
        borderRadius: 45,
        backgroundColor: 'rgba(255,255,255,0.15)',
        top: 18,
    },
    iconContainer: {
        marginBottom: 12,
    },
    iconRing: {
        width: 78,
        height: 78,
        borderRadius: 39,
        borderWidth: 3,
        borderColor: 'rgba(255,255,255,0.3)',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(255,255,255,0.12)',
    },
    iconInner: {
        width: 58,
        height: 58,
        borderRadius: 29,
        backgroundColor: 'rgba(255,255,255,0.18)',
        alignItems: 'center',
        justifyContent: 'center',
    },

    // ── Type label ──
    typeBadge: {
        backgroundColor: 'rgba(255,255,255,0.2)',
        paddingHorizontal: 14,
        paddingVertical: 4,
        borderRadius: 20,
    },
    typeBadgeText: {
        color: '#FFFFFF',
        fontSize: 11,
        fontWeight: '800',
        letterSpacing: 1.8,
    },

    // ── Content ──
    contentSection: {
        paddingHorizontal: 24,
        paddingTop: 22,
        paddingBottom: 8,
        alignItems: 'center',
    },
    title: {
        fontSize: 20,
        fontWeight: '800',
        textAlign: 'center',
        marginBottom: 8,
        letterSpacing: -0.3,
    },
    message: {
        fontSize: 15,
        lineHeight: 22,
        textAlign: 'center',
        fontWeight: '500',
    },

    // ── Buttons ──
    buttonSection: {
        padding: 16,
        paddingTop: 14,
        borderTopWidth: 1,
        marginTop: 12,
    },
    buttonRow: {
        gap: 10,
    },
    buttonRowMultiple: {
        flexDirection: 'row-reverse',
    },
    buttonRowStacked: {
        flexDirection: 'column',
    },
    btn: {
        borderRadius: 16,
        overflow: 'hidden',
    },
    btnFlex: {
        flex: 1,
    },
    btnCancel: {
        paddingVertical: 14,
        alignItems: 'center',
        borderWidth: 1.5,
    },
    btnElevated: {
        ...Platform.select({
            ios: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.2,
                shadowRadius: 8,
            },
            android: {
                elevation: 6,
            },
        }),
    },
    btnGradient: {
        paddingVertical: 14,
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'row',
    },
    btnText: {
        fontSize: 15,
        fontWeight: '600',
    },
    btnTextBold: {
        fontWeight: '800',
        letterSpacing: 0.3,
    },
});

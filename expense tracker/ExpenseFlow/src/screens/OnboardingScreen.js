// File: src/screens/OnboardingScreen.js

import React, { useState, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Animated,
    Dimensions,
    TextInput,
    KeyboardAvoidingView,
    Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { FONT_SIZE, SPACING, STORAGE_KEYS } from '../utils/constants';

const { width } = Dimensions.get('window');

const SLIDES = [
    {
        icon: 'wallet-outline',
        color: '#6366F1',
        title: 'Track Every Rupee',
        subtitle: 'Log income & expenses with beautiful, intuitive controls.',
    },
    {
        icon: 'bar-chart-outline',
        color: '#EC4899',
        title: 'Smart Analytics',
        subtitle: 'Visual insights with charts and category breakdowns to understand your spending.',
    },
    {
        icon: 'sparkles-outline',
        color: '#F59E0B',
        title: 'AI-Powered Insights',
        subtitle: 'Get smart tips and predictions based on your spending patterns.',
    },
    {
        icon: 'people-outline',
        color: '#F97316',
        title: 'Debts & Loans',
        subtitle: 'Track who owes you and who you owe, with partial payment support.',
    },
    {
        icon: 'camera-outline',
        color: '#06B6D4',
        title: 'Snap Receipts',
        subtitle: 'Attach receipt photos and scan them with built-in OCR.',
    },
    {
        icon: 'shield-checkmark-outline',
        color: '#22C55E',
        title: 'Budget & Save',
        subtitle: 'Set spending limits, get predictive budgets, and stay on track.',
    },
];

const OnboardingScreen = ({ onFinish }) => {
    const [currentSlide, setCurrentSlide] = useState(0);
    const [userName, setUserName] = useState('');
    const [showNameInput, setShowNameInput] = useState(false);
    const fadeAnim = useRef(new Animated.Value(1)).current;
    const scaleAnim = useRef(new Animated.Value(1)).current;

    const animateTransition = (nextSlide) => {
        Animated.parallel([
            Animated.timing(fadeAnim, { toValue: 0, duration: 150, useNativeDriver: true }),
            Animated.timing(scaleAnim, { toValue: 0.9, duration: 150, useNativeDriver: true }),
        ]).start(() => {
            if (nextSlide === 'name') {
                setShowNameInput(true);
            } else {
                setCurrentSlide(nextSlide);
            }
            Animated.parallel([
                Animated.timing(fadeAnim, { toValue: 1, duration: 250, useNativeDriver: true }),
                Animated.spring(scaleAnim, { toValue: 1, friction: 8, useNativeDriver: true }),
            ]).start();
        });
    };

    const handleNext = () => {
        if (showNameInput) {
            finishOnboarding();
        } else if (currentSlide < SLIDES.length - 1) {
            animateTransition(currentSlide + 1);
        } else {
            animateTransition('name');
        }
    };

    const finishOnboarding = async () => {
        try {
            await AsyncStorage.setItem(STORAGE_KEYS.ONBOARDING_DONE, 'true');
            if (userName.trim()) {
                await AsyncStorage.setItem(STORAGE_KEYS.USER_NAME, userName.trim());
            }
        } catch (e) {
            console.error('Error saving onboarding status:', e);
        }
        onFinish?.();
    };

    const slide = SLIDES[currentSlide];
    const totalSteps = SLIDES.length + 1; // slides + name input
    const currentStep = showNameInput ? SLIDES.length : currentSlide;

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
            {/* Skip */}
            <TouchableOpacity style={styles.skipBtn} onPress={finishOnboarding}>
                <Text style={styles.skipText}>Skip</Text>
            </TouchableOpacity>

            {showNameInput ? (
                /* Name Input Step */
                <Animated.View style={[styles.content, { opacity: fadeAnim, transform: [{ scale: scaleAnim }] }]}>
                    <View style={[styles.iconCircle, { backgroundColor: '#6366F118' }]}>
                        <Ionicons name="person-outline" size={64} color="#6366F1" />
                    </View>
                    <Text style={styles.title}>What's your name?</Text>
                    <Text style={styles.subtitle}>We'll use it to personalize your experience.</Text>
                    <View style={styles.inputContainer}>
                        <TextInput
                            style={styles.nameInput}
                            placeholder="Enter your name"
                            placeholderTextColor="#555580"
                            value={userName}
                            onChangeText={setUserName}
                            autoFocus
                            returnKeyType="done"
                            onSubmitEditing={finishOnboarding}
                            maxLength={30}
                        />
                    </View>
                </Animated.View>
            ) : (
                /* Feature Slides */
                <Animated.View style={[styles.content, { opacity: fadeAnim, transform: [{ scale: scaleAnim }] }]}>
                    <View style={[styles.iconCircle, { backgroundColor: `${slide.color}18` }]}>
                        <Ionicons name={slide.icon} size={64} color={slide.color} />
                    </View>
                    <Text style={styles.title}>{slide.title}</Text>
                    <Text style={styles.subtitle}>{slide.subtitle}</Text>
                </Animated.View>
            )}

            {/* Dots */}
            <View style={styles.dotsRow}>
                {Array.from({ length: totalSteps }).map((_, i) => {
                    const dotColor = i < SLIDES.length ? SLIDES[i].color : '#6366F1';
                    const isActive = i === currentStep;
                    return (
                        <View
                            key={i}
                            style={[
                                styles.dot,
                                isActive && [styles.dotActive, { backgroundColor: showNameInput ? '#6366F1' : slide.color }],
                            ]}
                        />
                    );
                })}
            </View>

            {/* Button */}
            <TouchableOpacity
                style={[styles.nextBtn, { backgroundColor: showNameInput ? '#6366F1' : slide.color }]}
                onPress={handleNext}
                activeOpacity={0.8}
            >
                <Text style={styles.nextBtnText}>
                    {showNameInput ? "Let's Go!" : currentSlide === SLIDES.length - 1 ? 'Almost Done' : 'Next'}
                </Text>
                <Ionicons
                    name={showNameInput ? 'checkmark-circle-outline' : 'arrow-forward'}
                    size={20}
                    color="#FFF"
                />
            </TouchableOpacity>
        </KeyboardAvoidingView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#0A0A1A',
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: SPACING.lg,
    },
    skipBtn: {
        position: 'absolute',
        top: 60,
        right: SPACING.lg,
    },
    skipText: {
        color: '#8892B0',
        fontSize: FONT_SIZE.md,
        fontWeight: '600',
    },
    content: {
        alignItems: 'center',
        paddingHorizontal: SPACING.md,
    },
    iconCircle: {
        width: 120,
        height: 120,
        borderRadius: 60,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: SPACING.xl,
    },
    title: {
        fontSize: FONT_SIZE.xxl + 4,
        fontWeight: '800',
        color: '#F5F5FA',
        textAlign: 'center',
        marginBottom: SPACING.md,
    },
    subtitle: {
        fontSize: FONT_SIZE.md + 1,
        color: '#8892B0',
        textAlign: 'center',
        lineHeight: 24,
        paddingHorizontal: SPACING.lg,
    },
    inputContainer: {
        width: width - SPACING.lg * 4,
        marginTop: SPACING.xl,
    },
    nameInput: {
        backgroundColor: '#1A1A2E',
        color: '#F5F5FA',
        fontSize: FONT_SIZE.lg,
        fontWeight: '600',
        textAlign: 'center',
        paddingVertical: SPACING.md + 2,
        paddingHorizontal: SPACING.lg,
        borderRadius: 16,
        borderWidth: 1.5,
        borderColor: '#333355',
    },
    dotsRow: {
        flexDirection: 'row',
        gap: 8,
        marginTop: SPACING.xl * 2,
        marginBottom: SPACING.xl,
    },
    dot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#333355',
    },
    dotActive: {
        width: 24,
        borderRadius: 4,
    },
    nextBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: SPACING.sm,
        width: width - SPACING.lg * 2,
        paddingVertical: SPACING.md + 2,
        borderRadius: 16,
    },
    nextBtnText: {
        color: '#FFF',
        fontSize: FONT_SIZE.lg,
        fontWeight: '700',
    },
});

export default OnboardingScreen;

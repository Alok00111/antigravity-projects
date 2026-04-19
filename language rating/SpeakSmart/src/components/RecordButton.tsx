import React, { useEffect, useRef } from 'react';
import {
    TouchableOpacity,
    View,
    StyleSheet,
    Animated,
    Easing,
} from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { borderRadius, shadows } from '../styles/typography';

interface RecordButtonProps {
    isRecording: boolean;
    onPress: () => void;
    size?: number;
}

export const RecordButton: React.FC<RecordButtonProps> = ({
    isRecording,
    onPress,
    size = 72,
}) => {
    const { theme, isDark } = useTheme();
    const pulseAnim = useRef(new Animated.Value(1)).current;

    useEffect(() => {
        if (isRecording) {
            // Pulse animation when recording
            Animated.loop(
                Animated.sequence([
                    Animated.timing(pulseAnim, {
                        toValue: 1.15,
                        duration: 800,
                        easing: Easing.inOut(Easing.ease),
                        useNativeDriver: true,
                    }),
                    Animated.timing(pulseAnim, {
                        toValue: 1,
                        duration: 800,
                        easing: Easing.inOut(Easing.ease),
                        useNativeDriver: true,
                    }),
                ])
            ).start();
        } else {
            pulseAnim.stopAnimation();
            pulseAnim.setValue(1);
        }
    }, [isRecording, pulseAnim]);

    return (
        <View style={styles.container}>
            {/* Pulse ring */}
            {isRecording && (
                <Animated.View
                    style={[
                        styles.pulseRing,
                        {
                            width: size + 32,
                            height: size + 32,
                            borderRadius: (size + 32) / 2,
                            backgroundColor: theme.accentLight,
                            transform: [{ scale: pulseAnim }],
                        },
                    ]}
                />
            )}

            {/* Main button */}
            <TouchableOpacity
                onPress={onPress}
                activeOpacity={0.8}
                style={[
                    styles.button,
                    {
                        width: size,
                        height: size,
                        borderRadius: size / 2,
                        backgroundColor: theme.accent,
                    },
                    !isDark && shadows.lg,
                ]}
            >
                {isRecording ? (
                    // Stop icon (square)
                    <View
                        style={[
                            styles.stopIcon,
                            {
                                width: size * 0.3,
                                height: size * 0.3,
                                backgroundColor: '#FFFFFF',
                            },
                        ]}
                    />
                ) : (
                    // Mic icon (circle)
                    <View
                        style={[
                            styles.micIcon,
                            {
                                width: size * 0.25,
                                height: size * 0.35,
                                backgroundColor: '#FFFFFF',
                            },
                        ]}
                    />
                )}
            </TouchableOpacity>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    pulseRing: {
        position: 'absolute',
    },
    button: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    stopIcon: {
        borderRadius: 4,
    },
    micIcon: {
        borderRadius: 8,
        borderBottomLeftRadius: 16,
        borderBottomRightRadius: 16,
    },
});

export default RecordButton;

import React, { useRef, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Animated,
    Dimensions,
} from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { typography, spacing, borderRadius, shadows } from '../styles/typography';

interface TopicCardProps {
    topic: string;
    day: number;
    difficulty: string;
    tips: string[];
    isFlipped: boolean;
    score?: number;
    feedback?: string[];
    isLoading?: boolean;
}

const { width } = Dimensions.get('window');
const CARD_WIDTH = width - spacing.lg * 2;

export const TopicCard: React.FC<TopicCardProps> = ({
    topic,
    day,
    difficulty,
    tips,
    isFlipped,
    score,
    feedback,
    isLoading,
}) => {
    const { theme, isDark } = useTheme();
    const flipAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        Animated.spring(flipAnim, {
            toValue: isFlipped ? 1 : 0,
            friction: 8,
            tension: 10,
            useNativeDriver: true,
        }).start();
    }, [isFlipped, flipAnim]);

    const frontInterpolate = flipAnim.interpolate({
        inputRange: [0, 1],
        outputRange: ['0deg', '180deg'],
    });

    const backInterpolate = flipAnim.interpolate({
        inputRange: [0, 1],
        outputRange: ['180deg', '360deg'],
    });

    const frontOpacity = flipAnim.interpolate({
        inputRange: [0, 0.5, 1],
        outputRange: [1, 0, 0],
    });

    const backOpacity = flipAnim.interpolate({
        inputRange: [0, 0.5, 1],
        outputRange: [0, 0, 1],
    });

    const getDifficultyColor = () => {
        switch (difficulty) {
            case 'beginner':
                return '#28A745';
            case 'intermediate':
                return '#FFC107';
            case 'advanced':
                return '#DC3545';
            default:
                return theme.accent;
        }
    };

    const getScoreColor = () => {
        if (!score) return theme.text;
        if (score >= 8) return theme.success;
        if (score >= 5) return '#FFC107';
        return theme.error;
    };

    const cardStyle = [
        styles.card,
        {
            backgroundColor: theme.surface,
            borderColor: isDark ? theme.border : 'transparent',
            borderWidth: isDark ? 1 : 0,
        },
        !isDark && shadows.md,
    ];

    return (
        <View style={styles.container}>
            {/* Front of card */}
            <Animated.View
                style={[
                    ...cardStyle,
                    {
                        transform: [{ rotateY: frontInterpolate }],
                        opacity: frontOpacity,
                    },
                ]}
            >
                <View style={styles.header}>
                    <Text style={[styles.dayLabel, { color: theme.textSecondary }]}>
                        DAY {day}
                    </Text>
                    <View
                        style={[
                            styles.difficultyBadge,
                            { backgroundColor: getDifficultyColor() + '20' },
                        ]}
                    >
                        <Text
                            style={[styles.difficultyText, { color: getDifficultyColor() }]}
                        >
                            {difficulty.toUpperCase()}
                        </Text>
                    </View>
                </View>

                <Text style={[styles.topic, { color: theme.text }]}>{topic}</Text>

                <View style={styles.tipsContainer}>
                    <Text style={[styles.tipsLabel, { color: theme.textSecondary }]}>
                        TIPS
                    </Text>
                    {tips.map((tip, index) => (
                        <Text
                            key={index}
                            style={[styles.tipText, { color: theme.textSecondary }]}
                        >
                            • {tip}
                        </Text>
                    ))}
                </View>
            </Animated.View>

            {/* Back of card (Results) */}
            <Animated.View
                style={[
                    ...cardStyle,
                    styles.cardBack,
                    {
                        transform: [{ rotateY: backInterpolate }],
                        opacity: backOpacity,
                    },
                ]}
            >
                {isLoading ? (
                    <View style={styles.loadingContainer}>
                        <Text style={[styles.loadingText, { color: theme.textSecondary }]}>
                            Analyzing your speech...
                        </Text>
                    </View>
                ) : (
                    <>
                        <Text style={[styles.resultLabel, { color: theme.textSecondary }]}>
                            YOUR SCORE
                        </Text>
                        <Text style={[styles.score, { color: getScoreColor() }]}>
                            {score}/10
                        </Text>

                        <View style={styles.feedbackContainer}>
                            <Text
                                style={[styles.feedbackLabel, { color: theme.textSecondary }]}
                            >
                                FEEDBACK
                            </Text>
                            {feedback?.map((item, index) => (
                                <Text
                                    key={index}
                                    style={[styles.feedbackText, { color: theme.text }]}
                                >
                                    • {item}
                                </Text>
                            ))}
                        </View>
                    </>
                )}
            </Animated.View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        width: CARD_WIDTH,
        height: 320,
        alignSelf: 'center',
    },
    card: {
        position: 'absolute',
        width: '100%',
        height: '100%',
        borderRadius: borderRadius.md,
        padding: spacing.lg,
        backfaceVisibility: 'hidden',
    },
    cardBack: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: spacing.md,
    },
    dayLabel: {
        ...typography.label,
    },
    difficultyBadge: {
        paddingHorizontal: spacing.sm,
        paddingVertical: spacing.xs,
        borderRadius: borderRadius.sm,
    },
    difficultyText: {
        fontSize: 10,
        fontWeight: '600',
        letterSpacing: 0.5,
    },
    topic: {
        ...typography.h2,
        marginBottom: spacing.lg,
    },
    tipsContainer: {
        marginTop: 'auto',
    },
    tipsLabel: {
        ...typography.label,
        marginBottom: spacing.sm,
    },
    tipText: {
        ...typography.bodySmall,
        marginBottom: spacing.xs,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        ...typography.body,
    },
    resultLabel: {
        ...typography.label,
        marginBottom: spacing.sm,
    },
    score: {
        ...typography.score,
        marginBottom: spacing.lg,
    },
    feedbackContainer: {
        width: '100%',
        paddingHorizontal: spacing.md,
    },
    feedbackLabel: {
        ...typography.label,
        marginBottom: spacing.sm,
        textAlign: 'left',
    },
    feedbackText: {
        ...typography.body,
        marginBottom: spacing.sm,
        textAlign: 'left',
    },
});

export default TopicCard;

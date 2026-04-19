import React from 'react';
import { TouchableOpacity, View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { typography, spacing } from '../styles/typography';

interface TimelineDotProps {
    day: number;
    isCompleted: boolean;
    isCurrent: boolean;
    onPress: () => void;
}

export const TimelineDot: React.FC<TimelineDotProps> = ({
    day,
    isCompleted,
    isCurrent,
    onPress,
}) => {
    const { theme } = useTheme();

    return (
        <TouchableOpacity onPress={onPress} style={styles.container}>
            <View
                style={[
                    styles.dot,
                    {
                        backgroundColor: isCompleted ? theme.accent : 'transparent',
                        borderColor: isCurrent ? theme.accent : theme.border,
                        borderWidth: isCompleted ? 0 : 2,
                    },
                ]}
            >
                {isCompleted && <Text style={styles.checkmark}>✓</Text>}
            </View>
            <Text
                style={[
                    styles.dayText,
                    {
                        color: isCompleted || isCurrent ? theme.text : theme.textSecondary,
                        fontWeight: isCurrent ? '700' : '400',
                    },
                ]}
            >
                Day {day}
            </Text>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: spacing.md,
    },
    dot: {
        width: 24,
        height: 24,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: spacing.md,
    },
    checkmark: {
        color: '#FFFFFF',
        fontSize: 12,
        fontWeight: '700',
    },
    dayText: {
        ...typography.body,
    },
});

export default TimelineDot;

import { StyleSheet } from 'react-native';

// Typography scale following Swiss Minimalist design
export const typography = StyleSheet.create({
    // Headings - Large & Bold
    h1: {
        fontSize: 32,
        fontWeight: '700',
        letterSpacing: -0.5,
        lineHeight: 40,
    },
    h2: {
        fontSize: 24,
        fontWeight: '700',
        letterSpacing: -0.3,
        lineHeight: 32,
    },
    h3: {
        fontSize: 20,
        fontWeight: '600',
        letterSpacing: -0.2,
        lineHeight: 28,
    },

    // Body text - High contrast, readable
    body: {
        fontSize: 16,
        fontWeight: '400',
        lineHeight: 24,
    },
    bodySmall: {
        fontSize: 14,
        fontWeight: '400',
        lineHeight: 20,
    },

    // Labels and captions
    label: {
        fontSize: 12,
        fontWeight: '500',
        letterSpacing: 0.5,
        textTransform: 'uppercase',
    },
    caption: {
        fontSize: 12,
        fontWeight: '400',
        lineHeight: 16,
    },

    // Numbers and scores
    score: {
        fontSize: 48,
        fontWeight: '700',
        letterSpacing: -1,
    },
    timer: {
        fontSize: 24,
        fontWeight: '600',
        fontVariant: ['tabular-nums'],
    },
});

// Spacing scale
export const spacing = {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 48,
};

// Border radius
export const borderRadius = {
    sm: 8,
    md: 16,
    lg: 24,
    full: 9999,
};

// Shadows for Light mode
export const shadows = {
    sm: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 1,
    },
    md: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
        elevation: 3,
    },
    lg: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.12,
        shadowRadius: 16,
        elevation: 6,
    },
};

export default {
    typography,
    spacing,
    borderRadius,
    shadows,
};

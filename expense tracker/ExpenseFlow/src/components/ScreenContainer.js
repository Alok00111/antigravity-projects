// File: src/components/ScreenContainer.js

import React from 'react';
import { StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../context/ThemeContext';
import { SPACING } from '../utils/constants';

const ScreenContainer = ({ children, style }) => {
    const { colors } = useTheme();

    return (
        <SafeAreaView
            style={[styles.container, { backgroundColor: colors.background }, style]}
            edges={['top', 'left', 'right']}
        >
            {children}
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        paddingHorizontal: SPACING.md,
    },
});

export default ScreenContainer;

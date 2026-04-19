import React from 'react';
import { View, StyleSheet } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { NavigationContainer } from '@react-navigation/native';
import { useTheme } from '../context/ThemeContext';
import TodayScreen from '../screens/TodayScreen';
import JourneyScreen from '../screens/JourneyScreen';
import SettingsScreen from '../screens/SettingsScreen';

const Tab = createBottomTabNavigator();

// Simple icon components
const HomeIcon = ({ color, size }: { color: string; size: number }) => (
    <View style={[styles.iconContainer, { width: size, height: size }]}>
        <View
            style={[
                styles.homeBase,
                { borderColor: color, borderWidth: 2, width: size * 0.7, height: size * 0.5 },
            ]}
        />
        <View
            style={[
                styles.homeRoof,
                {
                    borderLeftColor: 'transparent',
                    borderRightColor: 'transparent',
                    borderBottomColor: color,
                    borderLeftWidth: size * 0.45,
                    borderRightWidth: size * 0.45,
                    borderBottomWidth: size * 0.35,
                },
            ]}
        />
    </View>
);

const JourneyIcon = ({ color, size }: { color: string; size: number }) => (
    <View style={[styles.iconContainer, { width: size, height: size }]}>
        <View style={[styles.timelineLine, { backgroundColor: color, height: size * 0.8 }]} />
        <View
            style={[
                styles.timelineDot,
                { backgroundColor: color, top: size * 0.1, width: size * 0.25, height: size * 0.25 },
            ]}
        />
        <View
            style={[
                styles.timelineDot,
                { borderColor: color, borderWidth: 2, top: size * 0.4, width: size * 0.25, height: size * 0.25 },
            ]}
        />
        <View
            style={[
                styles.timelineDot,
                { borderColor: color, borderWidth: 2, top: size * 0.7, width: size * 0.25, height: size * 0.25 },
            ]}
        />
    </View>
);

const SettingsIcon = ({ color, size }: { color: string; size: number }) => (
    <View style={[styles.iconContainer, { width: size, height: size }]}>
        <View
            style={[
                styles.gear,
                {
                    borderColor: color,
                    borderWidth: 2,
                    width: size * 0.6,
                    height: size * 0.6,
                    borderRadius: size * 0.3,
                },
            ]}
        />
        <View
            style={[
                styles.gearCenter,
                {
                    backgroundColor: color,
                    width: size * 0.2,
                    height: size * 0.2,
                    borderRadius: size * 0.1,
                },
            ]}
        />
    </View>
);

export const TabNavigator: React.FC = () => {
    const { theme, isDark } = useTheme();

    return (
        <NavigationContainer>
            <Tab.Navigator
                screenOptions={{
                    headerShown: false,
                    tabBarStyle: {
                        backgroundColor: theme.surface,
                        borderTopColor: isDark ? theme.border : 'transparent',
                        borderTopWidth: isDark ? 1 : 0,
                        paddingBottom: 8,
                        paddingTop: 8,
                        height: 64,
                        elevation: isDark ? 0 : 8,
                        shadowColor: '#000',
                        shadowOffset: { width: 0, height: -2 },
                        shadowOpacity: isDark ? 0 : 0.05,
                        shadowRadius: 8,
                    },
                    tabBarActiveTintColor: theme.accent,
                    tabBarInactiveTintColor: theme.textSecondary,
                    tabBarLabelStyle: {
                        fontSize: 11,
                        fontWeight: '500',
                        marginTop: 2,
                    },
                }}
            >
                <Tab.Screen
                    name="Today"
                    component={TodayScreen}
                    options={{
                        tabBarIcon: ({ color, size }) => <HomeIcon color={color} size={size} />,
                    }}
                />
                <Tab.Screen
                    name="Journey"
                    component={JourneyScreen}
                    options={{
                        tabBarIcon: ({ color, size }) => <JourneyIcon color={color} size={size} />,
                    }}
                />
                <Tab.Screen
                    name="Settings"
                    component={SettingsScreen}
                    options={{
                        tabBarIcon: ({ color, size }) => <SettingsIcon color={color} size={size} />,
                    }}
                />
            </Tab.Navigator>
        </NavigationContainer>
    );
};

const styles = StyleSheet.create({
    iconContainer: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    homeBase: {
        position: 'absolute',
        bottom: 0,
        borderTopWidth: 0,
    },
    homeRoof: {
        position: 'absolute',
        top: 2,
        width: 0,
        height: 0,
        backgroundColor: 'transparent',
        borderStyle: 'solid',
    },
    timelineLine: {
        position: 'absolute',
        width: 2,
        left: '50%',
        marginLeft: -1,
        top: '10%',
    },
    timelineDot: {
        position: 'absolute',
        left: '50%',
        marginLeft: -3,
        borderRadius: 6,
    },
    gear: {
        position: 'absolute',
    },
    gearCenter: {
        position: 'absolute',
    },
});

export default TabNavigator;

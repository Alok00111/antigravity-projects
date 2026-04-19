import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, StatusBar, Modal, TouchableOpacity, Pressable } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { typography, spacing, borderRadius, shadows } from '../styles/typography';
import TimelineDot from '../components/TimelineDot';
import { getCompletedDays } from '../services/storageService';
import challengesPart1 from '../data/challenges.json';
import challengesPart2 from '../data/challenges_part2.json';

const challenges = [...challengesPart1, ...challengesPart2];

interface Challenge {
    day: number;
    topic: string;
    duration: number;
    warmup: { activity: string; focus: string };
    vocabulary: string[];
    sentences: string[];
    speakingPrompt: string;
    fluencyDrill: string;
}

export const JourneyScreen: React.FC = () => {
    const { theme, isDark } = useTheme();
    const [completedDays, setCompletedDays] = useState<number[]>([]);
    const [selectedChallenge, setSelectedChallenge] = useState<Challenge | null>(null);
    const [modalVisible, setModalVisible] = useState(false);

    useEffect(() => { loadProgress(); }, []);

    const loadProgress = async () => {
        const days = await getCompletedDays();
        setCompletedDays(days);
    };

    const getCurrentDay = useCallback(() => completedDays.length > 0 ? Math.max(...completedDays) + 1 : 1, [completedDays]);

    const handleDotPress = (challenge: Challenge) => {
        setSelectedChallenge(challenge);
        setModalVisible(true);
    };

    const progressPercentage = (completedDays.length / 100) * 100;
    const totalHours = completedDays.length;

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
            <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={theme.background} />

            <View style={styles.header}>
                <Text style={[styles.title, { color: theme.text }]}>Journey</Text>
                <Text style={[styles.subtitle, { color: theme.textSecondary }]}>100-day speaking mastery</Text>
            </View>

            {/* Stats Cards */}
            <View style={styles.statsRow}>
                <View style={[styles.statCard, { backgroundColor: theme.surface }, !isDark && shadows.sm]}>
                    <Text style={[styles.statValue, { color: theme.accent }]}>{completedDays.length}</Text>
                    <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Days</Text>
                </View>
                <View style={[styles.statCard, { backgroundColor: theme.surface }, !isDark && shadows.sm]}>
                    <Text style={[styles.statValue, { color: theme.accent }]}>{totalHours}h</Text>
                    <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Practiced</Text>
                </View>
                <View style={[styles.statCard, { backgroundColor: theme.surface }, !isDark && shadows.sm]}>
                    <Text style={[styles.statValue, { color: theme.accent }]}>{Math.round(progressPercentage)}%</Text>
                    <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Complete</Text>
                </View>
            </View>

            {/* Progress Bar */}
            <View style={[styles.progressCard, { backgroundColor: theme.surface, borderColor: isDark ? theme.border : 'transparent' }, !isDark && shadows.sm]}>
                <View style={styles.progressHeader}>
                    <Text style={[styles.progressTitle, { color: theme.text }]}>Progress to Fluency</Text>
                    <Text style={[styles.progressValue, { color: theme.accent }]}>{completedDays.length}/100</Text>
                </View>
                <View style={[styles.progressBar, { backgroundColor: theme.border }]}>
                    <View style={[styles.progressFill, { backgroundColor: theme.accent, width: `${progressPercentage}%` }]} />
                </View>
            </View>

            {/* Timeline */}
            <ScrollView style={styles.timeline} contentContainerStyle={styles.timelineContent} showsVerticalScrollIndicator={false}>
                <View style={[styles.timelineLine, { backgroundColor: theme.border }]} />
                {(challenges as Challenge[]).map((challenge) => (
                    <TimelineDot
                        key={challenge.day}
                        day={challenge.day}
                        isCompleted={completedDays.includes(challenge.day)}
                        isCurrent={getCurrentDay() === challenge.day}
                        onPress={() => handleDotPress(challenge)}
                    />
                ))}
            </ScrollView>

            {/* Challenge Detail Modal */}
            <Modal animationType="slide" transparent visible={modalVisible} onRequestClose={() => setModalVisible(false)}>
                <Pressable style={styles.modalOverlay} onPress={() => setModalVisible(false)}>
                    <Pressable style={[styles.modalContent, { backgroundColor: theme.surface }]} onPress={(e) => e.stopPropagation()}>
                        {selectedChallenge && (
                            <>
                                <View style={styles.modalHandle} />
                                <View style={styles.modalHeader}>
                                    <Text style={[styles.modalDay, { color: theme.accent }]}>DAY {selectedChallenge.day}</Text>
                                    <Text style={[styles.modalDuration, { color: theme.textSecondary }]}>{selectedChallenge.duration} min</Text>
                                </View>
                                <Text style={[styles.modalTopic, { color: theme.text }]}>{selectedChallenge.topic}</Text>

                                {/* Lesson Sections */}
                                <View style={styles.lessonSection}>
                                    <Text style={[styles.lessonLabel, { color: theme.accent }]}>🔥 WARM-UP (10 min)</Text>
                                    <Text style={[styles.lessonText, { color: theme.textSecondary }]}>{selectedChallenge.warmup.activity}</Text>
                                </View>

                                <View style={styles.lessonSection}>
                                    <Text style={[styles.lessonLabel, { color: theme.accent }]}>📚 VOCABULARY (15 min)</Text>
                                    <Text style={[styles.lessonText, { color: theme.textSecondary }]}>{selectedChallenge.vocabulary.join(' • ')}</Text>
                                </View>

                                <View style={styles.lessonSection}>
                                    <Text style={[styles.lessonLabel, { color: theme.accent }]}>🎤 SPEAKING (25 min)</Text>
                                    <Text style={[styles.lessonText, { color: theme.textSecondary }]}>{selectedChallenge.speakingPrompt}</Text>
                                </View>

                                <View style={styles.lessonSection}>
                                    <Text style={[styles.lessonLabel, { color: theme.accent }]}>⚡ FLUENCY DRILL (10 min)</Text>
                                    <Text style={[styles.lessonText, { color: theme.textSecondary }]}>{selectedChallenge.fluencyDrill}</Text>
                                </View>

                                <TouchableOpacity style={[styles.closeBtn, { backgroundColor: theme.accent }]} onPress={() => setModalVisible(false)}>
                                    <Text style={styles.closeBtnText}>Got it</Text>
                                </TouchableOpacity>
                            </>
                        )}
                    </Pressable>
                </Pressable>
            </Modal>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: { paddingHorizontal: spacing.lg, paddingTop: spacing.xl, paddingBottom: spacing.md },
    title: { ...typography.h1 },
    subtitle: { ...typography.body, marginTop: spacing.xs },
    statsRow: { flexDirection: 'row', paddingHorizontal: spacing.lg, marginBottom: spacing.md },
    statCard: { flex: 1, padding: spacing.md, borderRadius: borderRadius.md, alignItems: 'center', marginHorizontal: spacing.xs },
    statValue: { fontSize: 28, fontWeight: '700' },
    statLabel: { fontSize: 12, marginTop: spacing.xs },
    progressCard: { marginHorizontal: spacing.lg, padding: spacing.md, borderRadius: borderRadius.md, borderWidth: 1, marginBottom: spacing.md },
    progressHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.sm },
    progressTitle: { ...typography.body, fontWeight: '600' },
    progressValue: { ...typography.h3 },
    progressBar: { height: 8, borderRadius: 4, overflow: 'hidden' },
    progressFill: { height: '100%', borderRadius: 4 },
    timeline: { flex: 1, paddingHorizontal: spacing.lg },
    timelineContent: { paddingVertical: spacing.md, paddingLeft: spacing.lg },
    timelineLine: { position: 'absolute', left: spacing.lg + 11, top: spacing.md, bottom: spacing.md, width: 2 },
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
    modalContent: { borderTopLeftRadius: borderRadius.lg, borderTopRightRadius: borderRadius.lg, padding: spacing.lg, paddingTop: spacing.md, maxHeight: '80%' },
    modalHandle: { width: 40, height: 4, backgroundColor: '#CCC', borderRadius: 2, alignSelf: 'center', marginBottom: spacing.md },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.sm },
    modalDay: { ...typography.label },
    modalDuration: { ...typography.caption },
    modalTopic: { ...typography.h2, marginBottom: spacing.lg },
    lessonSection: { marginBottom: spacing.md },
    lessonLabel: { fontSize: 12, fontWeight: '600', marginBottom: spacing.xs },
    lessonText: { ...typography.bodySmall },
    closeBtn: { paddingVertical: spacing.md, borderRadius: borderRadius.md, alignItems: 'center', marginTop: spacing.md },
    closeBtnText: { color: '#FFF', fontWeight: '600', fontSize: 16 },
});

export default JourneyScreen;

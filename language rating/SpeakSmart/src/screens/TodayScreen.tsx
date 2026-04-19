import React, { useState, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    SafeAreaView,
    StatusBar,
    ScrollView,
    TouchableOpacity,
} from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { typography, spacing, borderRadius, shadows } from '../styles/typography';
import RecordButton from '../components/RecordButton';
import { useVoiceRecording } from '../hooks/useVoiceRecording';
import { useSpeech } from '../hooks/useSpeech';
import { generateFeedback, FeedbackResult } from '../services/geminiService';
import { addProgressLog, getCompletedDays, getTargetLanguage } from '../services/storageService';
import challengesPart1 from '../data/challenges.json';
import challengesPart2 from '../data/challenges_part2.json';

// Merge both challenge files
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

export const TodayScreen: React.FC = () => {
    const { theme, isDark } = useTheme();
    const { isRecording, duration, startRecording, stopRecording, resetTranscript } = useVoiceRecording();
    const { speak, stopSpeaking } = useSpeech();

    const [currentChallenge, setCurrentChallenge] = useState<Challenge>(challenges[0] as Challenge);
    const [showFeedback, setShowFeedback] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [feedback, setFeedback] = useState<FeedbackResult | null>(null);
    const [activeSection, setActiveSection] = useState<'warmup' | 'vocab' | 'speak' | 'drill'>('warmup');

    useEffect(() => {
        loadChallenge();
    }, []);

    const loadChallenge = async () => {
        const completed = await getCompletedDays();
        const nextDay = completed.length > 0 ? Math.max(...completed) + 1 : 1;
        const challengeIndex = Math.min(nextDay - 1, challenges.length - 1);
        setCurrentChallenge(challenges[challengeIndex] as Challenge);
    };

    const formatDuration = (seconds: number): string => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    const handleRecordPress = useCallback(async () => {
        try {
            if (isRecording) {
                const transcript = await stopRecording();
                setIsLoading(true);
                setShowFeedback(true);

                const language = await getTargetLanguage();
                const result = await generateFeedback(transcript, language, currentChallenge.speakingPrompt, duration);

                setFeedback(result);
                setIsLoading(false);

                // Speak the feedback aloud (wrapped in try-catch to prevent crash)
                if (result.spokenFeedback && !result.error) {
                    try {
                        setTimeout(() => speak(result.spokenFeedback, { language: 'english' }), 500);
                    } catch (speechErr) {
                        console.error('Speech error:', speechErr);
                    }
                }

                if (result.score > 0 && !result.error) {
                    await addProgressLog({
                        day: currentChallenge.day,
                        date: new Date().toISOString(),
                        topic: currentChallenge.topic,
                        transcript,
                        score: result.score,
                        feedback: [result.overallFeedback],
                        duration,
                    });
                }
            } else {
                setShowFeedback(false);
                setFeedback(null);
                resetTranscript();
                try {
                    stopSpeaking();
                } catch (e) {
                    // Ignore speech stop errors
                }
                await startRecording();
            }
        } catch (error) {
            console.error('Recording handler error:', error);
            setIsLoading(false);
            setFeedback({
                score: 0,
                languageDetected: 'unknown',
                languageMatch: true,
                pronunciation: { score: 0, issues: [], tips: [] },
                fluency: { score: 0, issues: [], tips: [] },
                grammar: { score: 0, issues: [], corrections: [] },
                overallFeedback: 'An error occurred. Please try again.',
                spokenFeedback: 'An error occurred.',
                error: 'Processing error',
            });
        }
    }, [isRecording, stopRecording, startRecording, resetTranscript, currentChallenge, duration, speak, stopSpeaking]);

    const resetScreen = () => {
        setShowFeedback(false);
        setFeedback(null);
        setActiveSection('warmup');
    };

    const getScoreColor = (score: number) => {
        if (score >= 8) return theme.success;
        if (score >= 5) return '#FFC107';
        return theme.error;
    };

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
            <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={theme.background} />

            <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                {/* Header */}
                <View style={styles.header}>
                    <Text style={[styles.dayLabel, { color: theme.accent }]}>DAY {currentChallenge.day}</Text>
                    <Text style={[styles.title, { color: theme.text }]}>{currentChallenge.topic}</Text>
                    <Text style={[styles.duration, { color: theme.textSecondary }]}>
                        {currentChallenge.duration} minutes • 1 hour session
                    </Text>
                </View>

                {!showFeedback ? (
                    <>
                        {/* Section Tabs */}
                        <View style={styles.tabs}>
                            {(['warmup', 'vocab', 'speak', 'drill'] as const).map((section) => (
                                <TouchableOpacity
                                    key={section}
                                    style={[
                                        styles.tab,
                                        { backgroundColor: activeSection === section ? theme.accent : theme.surface },
                                    ]}
                                    onPress={() => setActiveSection(section)}
                                >
                                    <Text style={[styles.tabText, { color: activeSection === section ? '#FFF' : theme.text }]}>
                                        {section === 'warmup' ? '🔥 Warm-up' : section === 'vocab' ? '📚 Vocab' : section === 'speak' ? '🎤 Speak' : '⚡ Drill'}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>

                        {/* Section Content */}
                        <View style={[styles.card, { backgroundColor: theme.surface, borderColor: isDark ? theme.border : 'transparent' }, !isDark && shadows.md]}>
                            {activeSection === 'warmup' && (
                                <>
                                    <Text style={[styles.sectionTitle, { color: theme.accent }]}>WARM-UP (10 min)</Text>
                                    <Text style={[styles.activityText, { color: theme.text }]}>{currentChallenge.warmup.activity}</Text>
                                    <Text style={[styles.focusLabel, { color: theme.textSecondary }]}>Focus: {currentChallenge.warmup.focus}</Text>
                                </>
                            )}

                            {activeSection === 'vocab' && (
                                <>
                                    <Text style={[styles.sectionTitle, { color: theme.accent }]}>VOCABULARY (15 min)</Text>
                                    <View style={styles.vocabGrid}>
                                        {currentChallenge.vocabulary.map((word, i) => (
                                            <View key={i} style={[styles.vocabChip, { backgroundColor: theme.accentLight }]}>
                                                <Text style={[styles.vocabText, { color: theme.accent }]}>{word}</Text>
                                            </View>
                                        ))}
                                    </View>
                                    <Text style={[styles.subTitle, { color: theme.text }]}>Practice Sentences:</Text>
                                    {currentChallenge.sentences.map((sentence, i) => (
                                        <Text key={i} style={[styles.sentence, { color: theme.textSecondary }]}>• {sentence}</Text>
                                    ))}
                                </>
                            )}

                            {activeSection === 'speak' && (
                                <>
                                    <Text style={[styles.sectionTitle, { color: theme.accent }]}>SPEAKING PRACTICE (25 min)</Text>
                                    <Text style={[styles.prompt, { color: theme.text }]}>{currentChallenge.speakingPrompt}</Text>
                                    <Text style={[styles.tipText, { color: theme.textSecondary }]}>
                                        💡 Record yourself, get AI feedback on pronunciation, fluency, and grammar!
                                    </Text>
                                </>
                            )}

                            {activeSection === 'drill' && (
                                <>
                                    <Text style={[styles.sectionTitle, { color: theme.accent }]}>FLUENCY DRILL (10 min)</Text>
                                    <Text style={[styles.activityText, { color: theme.text }]}>{currentChallenge.fluencyDrill}</Text>
                                    <Text style={[styles.tipText, { color: theme.textSecondary }]}>
                                        ⚡ Speed challenge: Complete this without pausing!
                                    </Text>
                                </>
                            )}
                        </View>
                    </>
                ) : (
                    /* Feedback View */
                    <View style={[styles.card, { backgroundColor: theme.surface }, !isDark && shadows.md]}>
                        {isLoading ? (
                            <Text style={[styles.loadingText, { color: theme.textSecondary }]}>Analyzing your speech...</Text>
                        ) : feedback ? (
                            <>
                                {/* Language Mismatch Warning */}
                                {!feedback.languageMatch && (
                                    <View style={[styles.warningBox, { backgroundColor: theme.error + '20' }]}>
                                        <Text style={[styles.warningText, { color: theme.error }]}>
                                            🌐 You spoke in {feedback.languageDetected}. Try speaking in your target language!
                                        </Text>
                                    </View>
                                )}

                                {/* Overall Score */}
                                <View style={styles.scoreContainer}>
                                    <Text style={[styles.scoreLabel, { color: theme.textSecondary }]}>OVERALL SCORE</Text>
                                    <Text style={[styles.score, { color: getScoreColor(feedback.score) }]}>{feedback.score}/10</Text>
                                </View>

                                {/* Detailed Scores */}
                                <View style={styles.detailScores}>
                                    {/* Pronunciation */}
                                    <View style={[styles.scoreBox, { backgroundColor: theme.background }]}>
                                        <Text style={[styles.scoreBoxLabel, { color: theme.textSecondary }]}>Pronunciation</Text>
                                        <Text style={[styles.scoreBoxValue, { color: getScoreColor(feedback.pronunciation.score) }]}>
                                            {feedback.pronunciation.score}/10
                                        </Text>
                                        {feedback.pronunciation.issues.length > 0 && (
                                            <Text style={[styles.issueText, { color: theme.error }]}>• {feedback.pronunciation.issues[0]}</Text>
                                        )}
                                        {feedback.pronunciation.tips.length > 0 && (
                                            <Text style={[styles.tipSmall, { color: theme.success }]}>💡 {feedback.pronunciation.tips[0]}</Text>
                                        )}
                                    </View>

                                    {/* Fluency */}
                                    <View style={[styles.scoreBox, { backgroundColor: theme.background }]}>
                                        <Text style={[styles.scoreBoxLabel, { color: theme.textSecondary }]}>Fluency</Text>
                                        <Text style={[styles.scoreBoxValue, { color: getScoreColor(feedback.fluency.score) }]}>
                                            {feedback.fluency.score}/10
                                        </Text>
                                        {feedback.fluency.issues.length > 0 && (
                                            <Text style={[styles.issueText, { color: theme.error }]}>• {feedback.fluency.issues[0]}</Text>
                                        )}
                                        {feedback.fluency.tips.length > 0 && (
                                            <Text style={[styles.tipSmall, { color: theme.success }]}>💡 {feedback.fluency.tips[0]}</Text>
                                        )}
                                    </View>

                                    {/* Grammar */}
                                    <View style={[styles.scoreBox, { backgroundColor: theme.background }]}>
                                        <Text style={[styles.scoreBoxLabel, { color: theme.textSecondary }]}>Grammar</Text>
                                        <Text style={[styles.scoreBoxValue, { color: getScoreColor(feedback.grammar.score) }]}>
                                            {feedback.grammar.score}/10
                                        </Text>
                                        {feedback.grammar.issues.length > 0 && (
                                            <Text style={[styles.issueText, { color: theme.error }]}>• {feedback.grammar.issues[0]}</Text>
                                        )}
                                        {feedback.grammar.corrections.length > 0 && (
                                            <Text style={[styles.tipSmall, { color: theme.success }]}>✏️ {feedback.grammar.corrections[0]}</Text>
                                        )}
                                    </View>
                                </View>

                                {/* Overall Feedback */}
                                <View style={styles.feedbackBox}>
                                    <Text style={[styles.feedbackTitle, { color: theme.text }]}>AI Coach Feedback</Text>
                                    <Text style={[styles.feedbackText, { color: theme.textSecondary }]}>{feedback.overallFeedback}</Text>
                                </View>

                                {/* Try Again Button */}
                                <TouchableOpacity style={[styles.tryAgainBtn, { backgroundColor: theme.accent }]} onPress={resetScreen}>
                                    <Text style={styles.tryAgainText}>Try Again</Text>
                                </TouchableOpacity>
                            </>
                        ) : null}
                    </View>
                )}
            </ScrollView>

            {/* Recording UI */}
            {!showFeedback && activeSection === 'speak' && (
                <View style={styles.recordContainer}>
                    {isRecording && (
                        <View style={styles.timerRow}>
                            <View style={[styles.recordingDot, { backgroundColor: theme.accent }]} />
                            <Text style={[styles.timer, { color: theme.text }]}>{formatDuration(duration)}</Text>
                        </View>
                    )}
                    <RecordButton isRecording={isRecording} onPress={handleRecordPress} />
                    <Text style={[styles.hint, { color: theme.textSecondary }]}>
                        {isRecording ? 'Tap to stop' : 'Tap to record'}
                    </Text>
                </View>
            )}
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1 },
    content: { flex: 1 },
    header: { padding: spacing.lg, paddingTop: spacing.xl },
    dayLabel: { ...typography.label, marginBottom: spacing.xs },
    title: { ...typography.h1 },
    duration: { ...typography.caption, marginTop: spacing.xs },
    tabs: { flexDirection: 'row', paddingHorizontal: spacing.md, marginBottom: spacing.md },
    tab: { flex: 1, paddingVertical: spacing.sm, marginHorizontal: spacing.xs, borderRadius: borderRadius.sm, alignItems: 'center' },
    tabText: { fontSize: 12, fontWeight: '600' },
    card: { marginHorizontal: spacing.lg, padding: spacing.lg, borderRadius: borderRadius.md, borderWidth: 1, marginBottom: spacing.lg },
    sectionTitle: { ...typography.label, marginBottom: spacing.md },
    activityText: { ...typography.body, marginBottom: spacing.md },
    focusLabel: { ...typography.caption },
    vocabGrid: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: spacing.md },
    vocabChip: { paddingHorizontal: spacing.sm, paddingVertical: spacing.xs, borderRadius: borderRadius.sm, marginRight: spacing.xs, marginBottom: spacing.xs },
    vocabText: { fontSize: 14, fontWeight: '500' },
    subTitle: { ...typography.body, fontWeight: '600', marginBottom: spacing.sm },
    sentence: { ...typography.bodySmall, marginBottom: spacing.xs },
    prompt: { ...typography.h3, marginBottom: spacing.md },
    tipText: { ...typography.caption },
    recordContainer: { alignItems: 'center', paddingBottom: spacing.xl },
    timerRow: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.md },
    recordingDot: { width: 8, height: 8, borderRadius: 4, marginRight: spacing.sm },
    timer: { ...typography.timer },
    hint: { ...typography.caption, marginTop: spacing.md },
    loadingText: { ...typography.body, textAlign: 'center', padding: spacing.xl },
    warningBox: { padding: spacing.md, borderRadius: borderRadius.sm, marginBottom: spacing.md },
    warningText: { fontSize: 14, fontWeight: '500' },
    scoreContainer: { alignItems: 'center', marginBottom: spacing.lg },
    scoreLabel: { ...typography.label },
    score: { ...typography.score },
    detailScores: { marginBottom: spacing.lg },
    scoreBox: { padding: spacing.md, borderRadius: borderRadius.sm, marginBottom: spacing.sm },
    scoreBoxLabel: { fontSize: 12, fontWeight: '600', marginBottom: spacing.xs },
    scoreBoxValue: { fontSize: 24, fontWeight: '700', marginBottom: spacing.xs },
    issueText: { fontSize: 12, marginBottom: spacing.xs },
    tipSmall: { fontSize: 12 },
    feedbackBox: { marginBottom: spacing.lg },
    feedbackTitle: { ...typography.body, fontWeight: '600', marginBottom: spacing.sm },
    feedbackText: { ...typography.body },
    tryAgainBtn: { paddingVertical: spacing.md, borderRadius: borderRadius.md, alignItems: 'center' },
    tryAgainText: { color: '#FFF', fontWeight: '600', fontSize: 16 },
});

export default TodayScreen;

import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    SafeAreaView,
    ScrollView,
    Switch,
    StatusBar,
    TouchableOpacity,
    Alert,
    Modal,
    Pressable,
} from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { typography, spacing, borderRadius, shadows } from '../styles/typography';
import { getTargetLanguage, setTargetLanguage, clearAllProgress } from '../services/storageService';

const LANGUAGES = [
    { code: 'spanish', name: 'Spanish' },
    { code: 'french', name: 'French' },
    { code: 'german', name: 'German' },
    { code: 'italian', name: 'Italian' },
    { code: 'portuguese', name: 'Portuguese' },
    { code: 'japanese', name: 'Japanese' },
    { code: 'korean', name: 'Korean' },
    { code: 'mandarin', name: 'Mandarin Chinese' },
    { code: 'hindi', name: 'Hindi' },
    { code: 'arabic', name: 'Arabic' },
];

export const SettingsScreen: React.FC = () => {
    const { theme, isDark, toggleTheme } = useTheme();
    const [targetLang, setTargetLang] = useState('spanish');
    const [showLanguagePicker, setShowLanguagePicker] = useState(false);

    useEffect(() => { loadSettings(); }, []);

    const loadSettings = async () => {
        const lang = await getTargetLanguage();
        setTargetLang(lang);
    };

    const handleLanguageChange = async (langCode: string) => {
        setTargetLang(langCode);
        await setTargetLanguage(langCode);
        setShowLanguagePicker(false);
    };

    const handleClearProgress = () => {
        Alert.alert('Clear All Progress', 'This will reset all completed challenges. Cannot be undone.', [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Clear', style: 'destructive', onPress: async () => { await clearAllProgress(); Alert.alert('Done', 'Progress cleared.'); } },
        ]);
    };

    const getLanguageName = (code: string) => LANGUAGES.find((l) => l.code === code)?.name || code;

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
            <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={theme.background} />

            <View style={styles.header}>
                <Text style={[styles.title, { color: theme.text }]}>Settings</Text>
                <Text style={[styles.subtitle, { color: theme.textSecondary }]}>Customize your experience</Text>
            </View>

            <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
                {/* Appearance */}
                <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>APPEARANCE</Text>
                <View style={[styles.section, { backgroundColor: theme.surface, borderColor: isDark ? theme.border : 'transparent' }, !isDark && shadows.sm]}>
                    <View style={styles.row}>
                        <Text style={[styles.rowLabel, { color: theme.text }]}>Dark Mode</Text>
                        <Switch value={isDark} onValueChange={toggleTheme} trackColor={{ false: theme.border, true: theme.accent }} thumbColor="#FFFFFF" />
                    </View>
                </View>

                {/* Language */}
                <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>LANGUAGE</Text>
                <View style={[styles.section, { backgroundColor: theme.surface, borderColor: isDark ? theme.border : 'transparent' }, !isDark && shadows.sm]}>
                    <TouchableOpacity style={styles.row} onPress={() => setShowLanguagePicker(true)}>
                        <Text style={[styles.rowLabel, { color: theme.text }]}>Target Language</Text>
                        <View style={styles.rowValue}>
                            <Text style={[styles.rowValueText, { color: theme.textSecondary }]}>{getLanguageName(targetLang)}</Text>
                            <Text style={styles.chevron}>›</Text>
                        </View>
                    </TouchableOpacity>
                </View>
                <Text style={[styles.noteText, { color: theme.textSecondary }]}>
                    The AI will analyze your speech and provide feedback in this language.
                </Text>

                {/* About */}
                <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>ABOUT</Text>
                <View style={[styles.section, { backgroundColor: theme.surface, borderColor: isDark ? theme.border : 'transparent' }, !isDark && shadows.sm]}>
                    <View style={styles.row}>
                        <Text style={[styles.rowLabel, { color: theme.text }]}>AI Engine</Text>
                        <Text style={[styles.rowValueText, { color: theme.textSecondary }]}>Gemini 1.5 Flash</Text>
                    </View>
                    <View style={[styles.divider, { backgroundColor: theme.border }]} />
                    <View style={styles.row}>
                        <Text style={[styles.rowLabel, { color: theme.text }]}>Curriculum</Text>
                        <Text style={[styles.rowValueText, { color: theme.textSecondary }]}>100 Days (1hr/day)</Text>
                    </View>
                </View>

                {/* Data */}
                <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>DATA</Text>
                <View style={[styles.section, { backgroundColor: theme.surface, borderColor: isDark ? theme.border : 'transparent' }, !isDark && shadows.sm]}>
                    <TouchableOpacity style={styles.row} onPress={handleClearProgress}>
                        <Text style={[styles.rowLabel, { color: theme.error }]}>Clear All Progress</Text>
                    </TouchableOpacity>
                </View>

                {/* Footer */}
                <View style={styles.footer}>
                    <Text style={[styles.footerText, { color: theme.textSecondary }]}>SpeakSmart v2.0.0</Text>
                    <Text style={[styles.footerText, { color: theme.textSecondary }]}>Made with ♥ for language learners</Text>
                </View>
            </ScrollView>

            {/* Language Picker Modal */}
            <Modal animationType="slide" transparent visible={showLanguagePicker} onRequestClose={() => setShowLanguagePicker(false)}>
                <Pressable style={styles.modalOverlay} onPress={() => setShowLanguagePicker(false)}>
                    <Pressable style={[styles.modalContent, { backgroundColor: theme.surface }]} onPress={(e) => e.stopPropagation()}>
                        <View style={styles.modalHandle} />
                        <Text style={[styles.modalTitle, { color: theme.text }]}>Select Language</Text>
                        <ScrollView>
                            {LANGUAGES.map((lang) => (
                                <TouchableOpacity key={lang.code} style={[styles.languageOption, { backgroundColor: targetLang === lang.code ? theme.accentLight : 'transparent' }]} onPress={() => handleLanguageChange(lang.code)}>
                                    <Text style={[styles.languageOptionText, { color: targetLang === lang.code ? theme.accent : theme.text }]}>{lang.name}</Text>
                                    {targetLang === lang.code && <Text style={[styles.checkmark, { color: theme.accent }]}>✓</Text>}
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
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
    content: { flex: 1 },
    contentContainer: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xxl },
    sectionTitle: { ...typography.label, marginTop: spacing.lg, marginBottom: spacing.sm, marginLeft: spacing.xs },
    section: { borderRadius: borderRadius.md, borderWidth: 1, overflow: 'hidden' },
    row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: spacing.md, paddingHorizontal: spacing.md },
    rowLabel: { ...typography.body },
    rowValue: { flexDirection: 'row', alignItems: 'center' },
    rowValueText: { ...typography.body },
    chevron: { fontSize: 20, color: '#999', marginLeft: spacing.xs },
    divider: { height: 1, marginHorizontal: spacing.md },
    noteText: { ...typography.caption, marginTop: spacing.sm, marginLeft: spacing.xs },
    footer: { marginTop: spacing.xxl, alignItems: 'center' },
    footerText: { ...typography.caption, marginBottom: spacing.xs },
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
    modalContent: { borderTopLeftRadius: borderRadius.lg, borderTopRightRadius: borderRadius.lg, padding: spacing.lg, paddingTop: spacing.md, maxHeight: '60%' },
    modalHandle: { width: 40, height: 4, backgroundColor: '#CCC', borderRadius: 2, alignSelf: 'center', marginBottom: spacing.md },
    modalTitle: { ...typography.h3, marginBottom: spacing.md },
    languageOption: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: spacing.md, paddingHorizontal: spacing.md, borderRadius: borderRadius.sm, marginBottom: spacing.xs },
    languageOptionText: { ...typography.body },
    checkmark: { fontSize: 18, fontWeight: '600' },
});

export default SettingsScreen;

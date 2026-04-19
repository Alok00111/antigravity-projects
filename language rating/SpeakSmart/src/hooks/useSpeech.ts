import { useCallback, useRef, useEffect } from 'react';
import { Platform } from 'react-native';

interface UseSpeechOptions {
    language?: string;
    pitch?: number;
    rate?: number;
}

// Store available voices
let cachedVoices: SpeechSynthesisVoice[] = [];

export const useSpeech = () => {
    const voicesLoaded = useRef(false);

    // Load voices on mount (for web)
    useEffect(() => {
        if (Platform.OS === 'web' && 'speechSynthesis' in window) {
            const loadVoices = () => {
                cachedVoices = window.speechSynthesis.getVoices();
                voicesLoaded.current = true;
            };

            loadVoices();
            window.speechSynthesis.onvoiceschanged = loadVoices;
        }
    }, []);

    /**
     * Find the best natural-sounding voice available
     */
    const getBestVoice = (targetLang: string): SpeechSynthesisVoice | null => {
        if (cachedVoices.length === 0) {
            cachedVoices = window.speechSynthesis.getVoices();
        }

        const langCode = targetLang.toLowerCase();

        // Priority order for FEMALE voices only
        const preferredVoices = [
            // Google's neural female voices (best quality)
            'Google UK English Female',
            'Google US English Female',
            // Microsoft neural female voices
            'Microsoft Aria',
            'Microsoft Jenny',
            'Microsoft Zira',
            // Apple female voices (very natural)
            'Samantha',
            'Karen',
            'Moira',
            'Fiona',
            'Victoria',
            'Tessa',
        ];

        // Try to find a preferred voice for English
        for (const preferred of preferredVoices) {
            const voice = cachedVoices.find(v =>
                v.name.includes(preferred) && v.lang.startsWith('en')
            );
            if (voice) return voice;
        }

        // Fall back to any English voice that's marked as "default" or "local"
        const defaultVoice = cachedVoices.find(v =>
            v.lang.startsWith('en') && (v.default || v.localService)
        );
        if (defaultVoice) return defaultVoice;

        // Last resort: any English voice
        return cachedVoices.find(v => v.lang.startsWith('en')) || null;
    };

    /**
     * Speak text aloud using device text-to-speech with natural voice
     */
    const speak = useCallback(
        async (text: string, options: UseSpeechOptions = {}) => {
            try {
                if (Platform.OS === 'web') {
                    if ('speechSynthesis' in window) {
                        window.speechSynthesis.cancel();

                        const utterance = new SpeechSynthesisUtterance(text);

                        // Get the best available voice
                        const voice = getBestVoice(options.language || 'english');
                        if (voice) {
                            utterance.voice = voice;
                        }

                        // Natural speech settings
                        utterance.rate = options.rate || 0.95; // Slightly slower for clarity
                        utterance.pitch = options.pitch || 1.0;
                        utterance.volume = 1.0;

                        // Add slight pauses for more natural speech
                        const processedText = text
                            .replace(/\./g, '. ') // Pause after periods
                            .replace(/!/g, '! ') // Pause after exclamations
                            .replace(/,/g, ', '); // Brief pause after commas

                        utterance.text = processedText;

                        window.speechSynthesis.speak(utterance);
                    }
                } else {
                    // Native platforms - use expo-speech
                    const Speech = await import('expo-speech');
                    await Speech.stop();

                    const languageMap: Record<string, string> = {
                        english: 'en-US',
                        spanish: 'es-ES',
                        french: 'fr-FR',
                        german: 'de-DE',
                        italian: 'it-IT',
                        portuguese: 'pt-BR',
                        japanese: 'ja-JP',
                        korean: 'ko-KR',
                        mandarin: 'zh-CN',
                        hindi: 'hi-IN',
                        arabic: 'ar-SA',
                    };

                    await Speech.speak(text, {
                        language: languageMap[options.language || 'english'] || 'en-US',
                        pitch: options.pitch || 1.0,
                        rate: options.rate || 0.9,
                    });
                }
            } catch (error) {
                console.error('Error speaking:', error);
            }
        },
        []
    );

    const stopSpeaking = useCallback(async () => {
        try {
            if (Platform.OS === 'web') {
                if ('speechSynthesis' in window) {
                    window.speechSynthesis.cancel();
                }
            } else {
                const Speech = await import('expo-speech');
                await Speech.stop();
            }
        } catch (error) {
            console.error('Error stopping speech:', error);
        }
    }, []);

    return { speak, stopSpeaking };
};

export default useSpeech;

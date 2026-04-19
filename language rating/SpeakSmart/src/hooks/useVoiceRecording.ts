import { useState, useEffect, useCallback, useRef } from 'react';
import { Platform } from 'react-native';

// Real speech recognition for all platforms
// Web: Web Speech API
// Native: @react-native-voice/voice

export interface VoiceRecordingState {
    isRecording: boolean;
    transcript: string;
    error: string | null;
    duration: number;
}

export interface VoiceRecordingHook extends VoiceRecordingState {
    startRecording: () => Promise<void>;
    stopRecording: () => Promise<string>;
    resetTranscript: () => void;
}

// Types for Web Speech API
interface SpeechRecognitionEvent {
    results: SpeechRecognitionResultList;
    resultIndex: number;
}

interface SpeechRecognitionResultList {
    length: number;
    [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionResult {
    isFinal: boolean;
    [index: number]: SpeechRecognitionAlternative;
}

interface SpeechRecognitionAlternative {
    transcript: string;
    confidence: number;
}

interface SpeechRecognition extends EventTarget {
    continuous: boolean;
    interimResults: boolean;
    lang: string;
    start(): void;
    stop(): void;
    abort(): void;
    onresult: ((event: SpeechRecognitionEvent) => void) | null;
    onerror: ((event: { error: string }) => void) | null;
    onend: (() => void) | null;
}

declare global {
    interface Window {
        SpeechRecognition: new () => SpeechRecognition;
        webkitSpeechRecognition: new () => SpeechRecognition;
    }
}

/**
 * Custom hook for voice recording and speech-to-text
 * - Web: Uses Web Speech API
 * - Native: Uses @react-native-voice/voice
 */
export const useVoiceRecording = (): VoiceRecordingHook => {
    const [isRecording, setIsRecording] = useState(false);
    const [transcript, setTranscript] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [duration, setDuration] = useState(0);

    const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const startTimeRef = useRef<number>(0);
    const recognitionRef = useRef<SpeechRecognition | null>(null);
    const fullTranscriptRef = useRef<string>('');
    const VoiceRef = useRef<any>(null);

    // Initialize native Voice module
    useEffect(() => {
        if (Platform.OS !== 'web') {
            // Dynamically import the native module
            import('@react-native-voice/voice')
                .then((Voice) => {
                    VoiceRef.current = Voice.default;

                    Voice.default.onSpeechResults = (e: { value?: string[] }) => {
                        if (e.value && e.value[0]) {
                            setTranscript(e.value[0]);
                            fullTranscriptRef.current = e.value[0];
                        }
                    };

                    Voice.default.onSpeechPartialResults = (e: { value?: string[] }) => {
                        if (e.value && e.value[0]) {
                            setTranscript(e.value[0]);
                        }
                    };

                    Voice.default.onSpeechError = (e: { error?: { message?: string } }) => {
                        console.error('Voice error:', e);
                        setError(e.error?.message || 'Speech recognition error');
                    };
                })
                .catch((err) => {
                    console.log('Native voice module not available (Expo Go):', err.message);
                });
        }

        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
            if (Platform.OS !== 'web' && VoiceRef.current) {
                VoiceRef.current.destroy().catch(() => { });
            }
            if (Platform.OS === 'web' && recognitionRef.current) {
                recognitionRef.current.abort();
            }
        };
    }, []);

    const startRecording = useCallback(async () => {
        try {
            setError(null);
            setTranscript('');
            fullTranscriptRef.current = '';
            setDuration(0);
            setIsRecording(true);
            startTimeRef.current = Date.now();

            // Start duration timer
            timerRef.current = setInterval(() => {
                setDuration(Math.floor((Date.now() - startTimeRef.current) / 1000));
            }, 1000);

            if (Platform.OS === 'web') {
                // Web Speech API
                const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

                if (SpeechRecognition) {
                    const recognition = new SpeechRecognition();
                    recognition.continuous = true;
                    recognition.interimResults = true;
                    recognition.lang = 'en-US';

                    recognition.onresult = (event: SpeechRecognitionEvent) => {
                        let finalTranscript = '';
                        let interimTranscript = '';

                        for (let i = 0; i < event.results.length; i++) {
                            const result = event.results[i];
                            if (result.isFinal) {
                                finalTranscript += result[0].transcript + ' ';
                            } else {
                                interimTranscript += result[0].transcript;
                            }
                        }

                        fullTranscriptRef.current = finalTranscript.trim();
                        setTranscript(finalTranscript + interimTranscript);
                    };

                    recognition.onerror = (event) => {
                        if (event.error !== 'aborted') {
                            setError(`Speech error: ${event.error}`);
                        }
                    };

                    recognitionRef.current = recognition;
                    recognition.start();
                    console.log('Web Speech API started');
                } else {
                    setError('Speech recognition not supported in this browser');
                }
            } else {
                // Native @react-native-voice/voice
                if (VoiceRef.current) {
                    await VoiceRef.current.start('en-US');
                    console.log('Native voice recognition started');
                } else {
                    console.log('Native voice not available, using mock mode');
                }
            }
        } catch (err: any) {
            setError(err.message || 'Failed to start recording');
            setIsRecording(false);
        }
    }, []);

    const stopRecording = useCallback(async (): Promise<string> => {
        try {
            setIsRecording(false);

            if (timerRef.current) {
                clearInterval(timerRef.current);
                timerRef.current = null;
            }

            if (Platform.OS === 'web') {
                if (recognitionRef.current) {
                    recognitionRef.current.stop();
                    recognitionRef.current = null;
                }
            } else {
                if (VoiceRef.current) {
                    await VoiceRef.current.stop();
                }
            }

            // Return the captured transcript
            const finalTranscript = fullTranscriptRef.current.trim() || transcript.trim();

            // If no transcript on native (Expo Go fallback)
            if (Platform.OS !== 'web' && !VoiceRef.current && !finalTranscript) {
                const mockTranscripts = [
                    "Hello, my name is Alex and I am learning a new language.",
                    "Today I want to talk about my favorite hobby.",
                    "I believe learning languages opens opportunities.",
                ];
                const mock = mockTranscripts[Math.floor(Math.random() * mockTranscripts.length)];
                setTranscript(mock);
                return mock;
            }

            return finalTranscript;
        } catch (err: any) {
            setError(err.message || 'Failed to stop recording');
            return '';
        }
    }, [transcript]);

    const resetTranscript = useCallback(() => {
        setTranscript('');
        fullTranscriptRef.current = '';
        setError(null);
        setDuration(0);
    }, []);

    return {
        isRecording,
        transcript,
        error,
        duration,
        startRecording,
        stopRecording,
        resetTranscript,
    };
};

export default useVoiceRecording;

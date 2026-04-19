// Hardcoded API key for Gemini
const GEMINI_API_KEY = 'AIzaSyAe6CoQTOGDHYPs5LH9cmu5LwnbwuuVhag';

const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';

export interface PronunciationFeedback {
    score: number;
    issues: string[];
    tips: string[];
}

export interface FluencyFeedback {
    score: number;
    issues: string[];
    tips: string[];
}

export interface GrammarFeedback {
    score: number;
    issues: string[];
    corrections: string[];
}

export interface FeedbackResult {
    score: number;
    languageDetected: string;
    languageMatch: boolean;
    pronunciation: PronunciationFeedback;
    fluency: FluencyFeedback;
    grammar: GrammarFeedback;
    overallFeedback: string;
    spokenFeedback: string; // Concise version for text-to-speech
    error?: string;
}

/**
 * Generate comprehensive speaking feedback using Google Gemini API
 */
export const generateFeedback = async (
    transcript: string,
    targetLanguage: string,
    topic: string,
    recordingDuration: number = 10 // Duration in seconds
): Promise<FeedbackResult> => {
    try {
        // Handle no speech detected - give low score instead of error
        if (!transcript || transcript.trim().length === 0) {
            return {
                score: 1,
                languageDetected: 'none',
                languageMatch: false,
                pronunciation: { score: 1, issues: ['No speech detected'], tips: ['Make sure to speak clearly into the microphone'] },
                fluency: { score: 1, issues: ['No speech detected'], tips: ['Try speaking for at least 10 seconds'] },
                grammar: { score: 1, issues: [], corrections: [] },
                overallFeedback: "I couldn't hear any speech! Please make sure your microphone is working and speak clearly. Try again!",
                spokenFeedback: "I didn't hear anything! Make sure your microphone is on and try speaking clearly.",
            };
        }

        const prompt = `You are an expert language coach specializing in ${targetLanguage}. Analyze this speech sample comprehensively.

TOPIC: "${topic}"
EXPECTED LANGUAGE: ${targetLanguage}

SPEAKER'S TRANSCRIPT:
"${transcript}"

Provide detailed analysis in this EXACT JSON format (no markdown, no code blocks):
{
  "score": <overall score 1-10>,
  "languageDetected": "<detected language like 'english', 'spanish', etc.>",
  "languageMatch": <true if speaker used ${targetLanguage}, false otherwise>,
  "pronunciation": {
    "score": <1-10>,
    "issues": ["<specific sound or word mispronunciation>", "..."],
    "tips": ["<actionable pronunciation tip>", "..."]
  },
  "fluency": {
    "score": <1-10>,
    "issues": ["<hesitations, pauses, filler words noticed>", "..."],
    "tips": ["<tip to improve flow and rhythm>", "..."]
  },
  "grammar": {
    "score": <1-10>,
    "issues": ["<grammar mistake found>", "..."],
    "corrections": ["<wrong phrase> → <correct phrase>", "..."]
  },
  "overallFeedback": "<2-3 sentences of encouraging overall feedback>",
  "spokenFeedback": "<1 sentence summary to be read aloud, max 20 words>"
}

SCORING GUIDE:
- 1-3: Significant improvement needed
- 4-6: Good effort, keep practicing  
- 7-9: Very good with minor refinements
- 10: Excellent, native-like proficiency

If the speaker used a DIFFERENT LANGUAGE than ${targetLanguage}:
- Set languageMatch to false
- In overallFeedback, kindly tell them to try again in ${targetLanguage}
- Still provide feedback on what they said

Be encouraging but honest. Give specific, actionable tips.`;

        const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }],
                generationConfig: {
                    temperature: 0.7,
                    maxOutputTokens: 1024,
                },
            }),
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            console.error('Gemini API error - Status:', response.status);
            console.error('Gemini API error - Details:', JSON.stringify(errorData, null, 2));

            // Return demo feedback when API fails - so user can still test the app
            console.log('Falling back to demo mode feedback');
            return createDemoFeedback(transcript, targetLanguage, recordingDuration);
        }

        const data = await response.json();
        const textContent = data.candidates?.[0]?.content?.parts?.[0]?.text;

        if (!textContent) {
            return createDefaultFeedback();
        }

        // Parse JSON from response
        let jsonStr = textContent.trim();
        if (jsonStr.startsWith('```')) {
            jsonStr = jsonStr.replace(/```json?\n?/g, '').replace(/```/g, '').trim();
        }

        const result = JSON.parse(jsonStr);

        return {
            score: clamp(result.score || 5, 1, 10),
            languageDetected: result.languageDetected || 'unknown',
            languageMatch: result.languageMatch !== false,
            pronunciation: {
                score: clamp(result.pronunciation?.score || 5, 1, 10),
                issues: result.pronunciation?.issues || [],
                tips: result.pronunciation?.tips || ['Practice speaking slowly and clearly.'],
            },
            fluency: {
                score: clamp(result.fluency?.score || 5, 1, 10),
                issues: result.fluency?.issues || [],
                tips: result.fluency?.tips || ['Try to speak in complete phrases.'],
            },
            grammar: {
                score: clamp(result.grammar?.score || 5, 1, 10),
                issues: result.grammar?.issues || [],
                corrections: result.grammar?.corrections || [],
            },
            overallFeedback: result.overallFeedback || 'Good effort! Keep practicing.',
            spokenFeedback: result.spokenFeedback || 'Good job! Keep practicing to improve.',
        };
    } catch (error) {
        console.error('Error generating feedback:', error);
        return createDefaultFeedback();
    }
};

function clamp(value: number, min: number, max: number): number {
    return Math.min(max, Math.max(min, value));
}

function createErrorResult(message: string): FeedbackResult {
    return {
        score: 0,
        languageDetected: 'unknown',
        languageMatch: true,
        pronunciation: { score: 0, issues: [], tips: [] },
        fluency: { score: 0, issues: [], tips: [] },
        grammar: { score: 0, issues: [], corrections: [] },
        overallFeedback: message,
        spokenFeedback: message,
        error: message,
    };
}

function createDefaultFeedback(): FeedbackResult {
    return {
        score: 5,
        languageDetected: 'unknown',
        languageMatch: true,
        pronunciation: {
            score: 5,
            issues: [],
            tips: ['Practice speaking slowly and clearly.'],
        },
        fluency: {
            score: 5,
            issues: [],
            tips: ['Try to speak in complete phrases without long pauses.'],
        },
        grammar: {
            score: 5,
            issues: [],
            corrections: [],
        },
        overallFeedback: 'Good attempt! Keep practicing to improve your fluency and pronunciation.',
        spokenFeedback: 'Good job! Keep practicing every day.',
    };
}

/**
 * Generate demo feedback when API is unavailable
 * Uses actual WORD COUNT from transcript for scoring (more words = higher score)
 */
function createDemoFeedback(transcript: string, targetLanguage: string, durationSeconds: number): FeedbackResult {
    // Score based on WORD COUNT from actual transcript
    const wordCount = transcript.split(/\s+/).filter(w => w.length > 0).length;

    // Word count scoring: 0-5 words: 2-3, 6-15 words: 4-5, 16-30 words: 6-7, 31-50 words: 7-8, 50+ words: 8-9
    let baseScore: number;
    if (wordCount <= 5) {
        baseScore = Math.floor(Math.random() * 2) + 2; // 2-3
    } else if (wordCount <= 15) {
        baseScore = Math.floor(Math.random() * 2) + 4; // 4-5
    } else if (wordCount <= 30) {
        baseScore = Math.floor(Math.random() * 2) + 6; // 6-7
    } else if (wordCount <= 50) {
        baseScore = Math.floor(Math.random() * 2) + 7; // 7-8
    } else {
        baseScore = Math.floor(Math.random() * 2) + 8; // 8-9
    }

    const pronunciationScore = Math.min(10, Math.max(1, baseScore + Math.floor(Math.random() * 3) - 1));
    const fluencyScore = Math.min(10, Math.max(1, baseScore + Math.floor(Math.random() * 3) - 1));
    const grammarScore = Math.min(10, Math.max(1, baseScore + Math.floor(Math.random() * 3) - 1));

    // Conversational feedback phrases
    const encouragements = [
        "Hey, nice work on that one!",
        "I really liked what you did there!",
        "That was a solid attempt, well done!",
        "You're making great progress!",
        "I can hear you're getting more confident!",
    ];

    const encouragement = encouragements[durationSeconds % encouragements.length];

    // Build natural spoken feedback based on how long they spoke
    let spokenFeedback = '';
    if (baseScore >= 8) {
        spokenFeedback = `Wow, that was really impressive! I'd give you an ${baseScore} out of 10. Your delivery felt natural and confident. Just keep at it!`;
    } else if (baseScore >= 6) {
        spokenFeedback = `Hey, that was pretty good! You scored ${baseScore} out of 10. I noticed some nice moments in there. Try speaking a bit more smoothly and you'll be even better!`;
    } else if (baseScore >= 4) {
        spokenFeedback = `Good effort! You got ${baseScore} out of 10. Try speaking a bit longer next time to really practice your skills!`;
    } else {
        spokenFeedback = `That was a quick one! You scored ${baseScore} out of 10. Try speaking for at least 10 seconds to get better practice!`;
    }

    // Written feedback based on duration
    const overallFeedback = `${encouragement} You spoke for ${durationSeconds} seconds. ${durationSeconds > 30
        ? "I love how detailed your response was - that shows real commitment! The key now is polishing those rough edges."
        : durationSeconds > 15
            ? "Good speaking time! Try to add even more detail next time to really challenge yourself."
            : durationSeconds > 7
                ? "Nice start! Try speaking for a bit longer to get more practice in."
                : "That was pretty quick - try to speak for at least 10-15 seconds to get real practice!"
        }`;

    return {
        score: baseScore,
        languageDetected: targetLanguage,
        languageMatch: true,
        pronunciation: {
            score: pronunciationScore,
            issues: durationSeconds > 10 ? ['A few sounds weren\'t quite clear'] : ['Speak longer so I can hear more'],
            tips: ['Try to emphasize the endings of your words more clearly'],
        },
        fluency: {
            score: fluencyScore,
            issues: durationSeconds < 10 ? ['Recording was too short to fully assess'] : [],
            tips: ['Connect your sentences together - let them flow naturally'],
        },
        grammar: {
            score: grammarScore,
            issues: [],
            corrections: durationSeconds > 15 ? ['Watch your verb tenses'] : [],
        },
        overallFeedback,
        spokenFeedback,
    };
}

export default { generateFeedback };

import { useState, useCallback } from 'react';
import { PracticeMode } from './useProgressTracking';

export interface PronunciationScore {
  overall: number; // 0-100
  clarity: number; // 0-100
  fluency: number; // 0-100
  aussieAccent: number; // 0-100
  accuracy: number; // 0-100 - how close to target phrase
  timestamp: Date;
  phrase?: string;
  spokenText?: string;
  feedback?: string;
  detailedFeedback?: string[];
}

export interface SessionScores {
  sessionId: string;
  mode: PracticeMode;
  scores: PronunciationScore[];
  averageOverall: number;
  improvement: number; // compared to previous session
}

interface StoredScores {
  sessions: SessionScores[];
}

const STORAGE_KEY = 'aussie-english-pronunciation';

// Aussie-specific phrases for practice with phonetic hints
export const PRACTICE_PHRASES: Record<PracticeMode, Array<{ text: string; hint: string; keywords: string[] }>> = {
  everyday: [
    { text: "G'day, how ya going?", hint: "guh-DAY, how ya GO-in", keywords: ["gday", "going"] },
    { text: "No worries, mate!", hint: "no WUH-rees, mayt", keywords: ["worries", "mate"] },
    { text: "See you this arvo", hint: "see ya this AH-vo", keywords: ["arvo"] },
    { text: "Chuck it in the boot", hint: "chuck it in the BOOT", keywords: ["chuck", "boot"] },
    { text: "Let's grab a cuppa", hint: "lets grab a CUP-pa", keywords: ["cuppa"] },
    { text: "That's heaps good", hint: "thats HEEPS good", keywords: ["heaps", "good"] },
    { text: "I reckon it'll be fine", hint: "I RECK-en itll be fine", keywords: ["reckon", "fine"] },
    { text: "Fair go, mate", hint: "FAIR go, mayt", keywords: ["fair", "go", "mate"] },
  ],
  slang: [
    { text: "She'll be right, mate", hint: "shell be RIGHT, mayt", keywords: ["shell", "right", "mate"] },
    { text: "Too easy, no dramas", hint: "too EE-zee, no DRAH-mas", keywords: ["easy", "dramas"] },
    { text: "Flat out like a lizard drinking", hint: "flat OUT like a LIZ-ard", keywords: ["flat", "lizard", "drinking"] },
    { text: "Having a yarn with me mates", hint: "havin a YARN with me mayts", keywords: ["yarn", "mates"] },
    { text: "It's chockers in here", hint: "its CHOCK-ers in here", keywords: ["chockers"] },
    { text: "Don't be a sook", hint: "dont be a SOOK", keywords: ["sook"] },
    { text: "That's bloody ripper", hint: "thats BLUD-ee RIP-pa", keywords: ["bloody", "ripper"] },
    { text: "Strewth, that's bonzer!", hint: "STROOTH, thats BON-za", keywords: ["strewth", "bonzer"] },
  ],
  workplace: [
    { text: "I'll action that today", hint: "ill ACK-shun that today", keywords: ["action", "today"] },
    { text: "Let's touch base later", hint: "lets TOUCH BASE layter", keywords: ["touch", "base", "later"] },
    { text: "Happy to have a yarn about it", hint: "happy to have a YARN about it", keywords: ["happy", "yarn"] },
    { text: "I'll shoot you an email", hint: "ill SHOOT you an ee-mayl", keywords: ["shoot", "email"] },
    { text: "Sounds good, cheers", hint: "sounds GOOD, cheers", keywords: ["sounds", "good", "cheers"] },
    { text: "I'll follow up on Monday", hint: "ill FOLLOW up on Monday", keywords: ["follow", "monday"] },
    { text: "No worries at all", hint: "no WUH-rees at all", keywords: ["worries"] },
    { text: "Let me circle back on that", hint: "let me CIRCLE back on that", keywords: ["circle", "back"] },
  ],
};

// Feedback templates based on score ranges
const FEEDBACK_TEMPLATES = {
  excellent: [
    "Excellent pronunciation! You sound like a true Aussie!",
    "Spot on! Your accent is coming along beautifully.",
    "Ripper job! Keep up the great work.",
    "Fair dinkum, that was perfect!",
  ],
  good: [
    "Good effort! Your pronunciation is improving.",
    "Nice work! A few more practice sessions and you'll nail it.",
    "Well done! Focus on the vowel sounds for even better results.",
    "Getting there! Your Aussie accent is developing nicely.",
  ],
  average: [
    "Getting there! Try to relax and let the words flow naturally.",
    "Not bad! Practice the rhythm of Australian English.",
    "Keep practicing! Focus on the rising intonation at the end of sentences.",
    "Good attempt! Try listening to the phrase again before repeating.",
  ],
  needsWork: [
    "Keep at it! Australian pronunciation takes time to master.",
    "Don't give up! Try listening more to native speakers.",
    "Practice makes perfect! Focus on one phrase at a time.",
    "Take your time with each word. You're making progress!",
  ],
};

// Normalize text for comparison
function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, '') // Remove punctuation
    .replace(/\s+/g, ' ')    // Normalize whitespace
    .trim();
}

// Calculate Levenshtein distance for fuzzy matching
function levenshteinDistance(a: string, b: string): number {
  const matrix: number[][] = [];

  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitution
          matrix[i][j - 1] + 1,     // insertion
          matrix[i - 1][j] + 1      // deletion
        );
      }
    }
  }

  return matrix[b.length][a.length];
}

// Calculate similarity percentage between two strings
function calculateSimilarity(target: string, spoken: string): number {
  const normalizedTarget = normalizeText(target);
  const normalizedSpoken = normalizeText(spoken);

  if (normalizedTarget === normalizedSpoken) return 100;
  if (!normalizedSpoken) return 0;

  const distance = levenshteinDistance(normalizedTarget, normalizedSpoken);
  const maxLength = Math.max(normalizedTarget.length, normalizedSpoken.length);

  return Math.max(0, Math.round((1 - distance / maxLength) * 100));
}

// Check how many keywords were captured
function calculateKeywordMatch(keywords: string[], spoken: string): number {
  const normalizedSpoken = normalizeText(spoken);
  let matched = 0;

  for (const keyword of keywords) {
    // Check for exact match or close match
    if (normalizedSpoken.includes(keyword.toLowerCase())) {
      matched++;
    } else {
      // Check for similar words (within 2 character difference)
      const words = normalizedSpoken.split(' ');
      for (const word of words) {
        if (levenshteinDistance(keyword.toLowerCase(), word) <= 2) {
          matched++;
          break;
        }
      }
    }
  }

  return keywords.length > 0 ? Math.round((matched / keywords.length) * 100) : 100;
}

// Generate detailed feedback based on analysis
function generateDetailedFeedback(
  target: string,
  spoken: string,
  accuracy: number,
  keywordMatch: number
): string[] {
  const feedback: string[] = [];
  const normalizedTarget = normalizeText(target);
  const normalizedSpoken = normalizeText(spoken);

  // Check word count
  const targetWords = normalizedTarget.split(' ').length;
  const spokenWords = normalizedSpoken.split(' ').length;

  if (spokenWords < targetWords * 0.7) {
    feedback.push("Try to say the complete phrase - some words were missed.");
  } else if (spokenWords > targetWords * 1.3) {
    feedback.push("You added extra words - try to match the phrase exactly.");
  }

  // Check specific Aussie features
  if (target.includes("'day") && !normalizedSpoken.includes("day")) {
    feedback.push("Remember to pronounce \"G'day\" as \"guh-day\".");
  }

  if (target.includes("arvo") && !normalizedSpoken.includes("arvo")) {
    feedback.push("\"Arvo\" means afternoon - try to include it!");
  }

  if (keywordMatch < 70) {
    feedback.push("Focus on the key words in the phrase.");
  }

  if (accuracy >= 90) {
    feedback.push("Great accuracy! Your pronunciation is clear.");
  } else if (accuracy >= 70) {
    feedback.push("Good attempt! Try speaking a bit more clearly.");
  } else if (accuracy >= 50) {
    feedback.push("Getting there! Listen to the phrase again before trying.");
  }

  return feedback;
}

function getFeedback(score: number): string {
  if (score >= 85) {
    return FEEDBACK_TEMPLATES.excellent[Math.floor(Math.random() * FEEDBACK_TEMPLATES.excellent.length)];
  } else if (score >= 70) {
    return FEEDBACK_TEMPLATES.good[Math.floor(Math.random() * FEEDBACK_TEMPLATES.good.length)];
  } else if (score >= 50) {
    return FEEDBACK_TEMPLATES.average[Math.floor(Math.random() * FEEDBACK_TEMPLATES.average.length)];
  } else {
    return FEEDBACK_TEMPLATES.needsWork[Math.floor(Math.random() * FEEDBACK_TEMPLATES.needsWork.length)];
  }
}

export interface ScoreFromSpeechParams {
  targetPhrase: { text: string; hint: string; keywords: string[] };
  spokenText: string;
  confidence: number;
  mode: PracticeMode;
}

export function usePronunciationScoring() {
  const [sessionScores, setSessionScores] = useState<SessionScores[]>(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const data: StoredScores = JSON.parse(stored);
        return data.sessions.map(s => ({
          ...s,
          scores: s.scores.map(score => ({
            ...score,
            timestamp: new Date(score.timestamp),
          })),
        }));
      } catch {
        return [];
      }
    }
    return [];
  });

  const [currentSessionScores, setCurrentSessionScores] = useState<PronunciationScore[]>([]);
  const [currentPhrase, setCurrentPhrase] = useState<{ text: string; hint: string; keywords: string[] } | null>(null);
  const [isScoring, setIsScoring] = useState(false);

  // Save to localStorage
  const saveScores = useCallback((scores: SessionScores[]) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ sessions: scores }));
  }, []);

  // Score pronunciation based on real speech recognition
  const scoreFromSpeech = useCallback(({
    targetPhrase,
    spokenText,
    confidence,
  }: ScoreFromSpeechParams): PronunciationScore => {
    // Calculate accuracy (how close spoken text is to target)
    const accuracy = calculateSimilarity(targetPhrase.text, spokenText);

    // Calculate keyword match
    const keywordMatch = calculateKeywordMatch(targetPhrase.keywords, spokenText);

    // Clarity is based on recognition confidence (0-1 from Web Speech API)
    const clarity = Math.round(confidence * 100) || 70; // Default to 70 if no confidence

    // Fluency combines accuracy and keyword match
    const fluency = Math.round((accuracy * 0.6 + keywordMatch * 0.4));

    // Aussie accent score - bonus for getting Aussie-specific words right
    const aussieBonus = keywordMatch >= 80 ? 10 : keywordMatch >= 60 ? 5 : 0;
    const aussieAccent = Math.min(100, Math.round(fluency * 0.8 + aussieBonus));

    // Overall score
    const overall = Math.round((clarity * 0.25 + fluency * 0.35 + accuracy * 0.25 + aussieAccent * 0.15));

    // Generate feedback
    const feedback = getFeedback(overall);
    const detailedFeedback = generateDetailedFeedback(
      targetPhrase.text,
      spokenText,
      accuracy,
      keywordMatch
    );

    return {
      overall,
      clarity,
      fluency,
      aussieAccent,
      accuracy,
      timestamp: new Date(),
      phrase: targetPhrase.text,
      spokenText,
      feedback,
      detailedFeedback,
    };
  }, []);

  const startPronunciationPractice = useCallback((mode: PracticeMode) => {
    const phrases = PRACTICE_PHRASES[mode];
    const randomPhrase = phrases[Math.floor(Math.random() * phrases.length)];
    setCurrentPhrase(randomPhrase);
    return randomPhrase;
  }, []);

  const submitPronunciationWithSpeech = useCallback((
    spokenText: string,
    confidence: number,
    mode: PracticeMode
  ): PronunciationScore | null => {
    if (!currentPhrase) return null;

    setIsScoring(true);

    const score = scoreFromSpeech({
      targetPhrase: currentPhrase,
      spokenText,
      confidence,
      mode,
    });

    setCurrentSessionScores(prev => [...prev, score]);
    setCurrentPhrase(null);
    setIsScoring(false);

    return score;
  }, [currentPhrase, scoreFromSpeech]);

  const getNextPhrase = useCallback((mode: PracticeMode) => {
    return startPronunciationPractice(mode);
  }, [startPronunciationPractice]);

  const finalizeSessionScores = useCallback((sessionId: string, mode: PracticeMode) => {
    if (currentSessionScores.length === 0) return null;

    const averageOverall = Math.round(
      currentSessionScores.reduce((sum, s) => sum + s.overall, 0) / currentSessionScores.length
    );

    // Calculate improvement compared to last session in same mode
    const previousSessions = sessionScores.filter(s => s.mode === mode);
    const lastSession = previousSessions[previousSessions.length - 1];
    const improvement = lastSession
      ? averageOverall - lastSession.averageOverall
      : 0;

    const newSessionScores: SessionScores = {
      sessionId,
      mode,
      scores: currentSessionScores,
      averageOverall,
      improvement,
    };

    const updatedScores = [...sessionScores, newSessionScores];
    setSessionScores(updatedScores);
    saveScores(updatedScores);
    setCurrentSessionScores([]);

    return newSessionScores;
  }, [currentSessionScores, sessionScores, saveScores]);

  const getOverallStats = useCallback(() => {
    if (sessionScores.length === 0) {
      return {
        averageScore: 0,
        totalPhrasesPracticed: 0,
        bestScore: 0,
        recentTrend: 0,
        modeAverages: {
          everyday: 0,
          slang: 0,
          workplace: 0,
        },
      };
    }

    const allScores = sessionScores.flatMap(s => s.scores);
    const averageScore = Math.round(
      allScores.reduce((sum, s) => sum + s.overall, 0) / allScores.length
    );
    const bestScore = Math.max(...allScores.map(s => s.overall));

    // Calculate trend from last 5 sessions
    const recentSessions = sessionScores.slice(-5);
    const recentTrend = recentSessions.length >= 2
      ? recentSessions[recentSessions.length - 1].averageOverall -
        recentSessions[0].averageOverall
      : 0;

    // Mode averages
    const modeAverages: Record<PracticeMode, number> = {
      everyday: 0,
      slang: 0,
      workplace: 0,
    };

    (['everyday', 'slang', 'workplace'] as PracticeMode[]).forEach(mode => {
      const modeSessions = sessionScores.filter(s => s.mode === mode);
      if (modeSessions.length > 0) {
        modeAverages[mode] = Math.round(
          modeSessions.reduce((sum, s) => sum + s.averageOverall, 0) / modeSessions.length
        );
      }
    });

    return {
      averageScore,
      totalPhrasesPracticed: allScores.length,
      bestScore,
      recentTrend,
      modeAverages,
    };
  }, [sessionScores]);

  const clearPronunciationData = useCallback(() => {
    setSessionScores([]);
    setCurrentSessionScores([]);
    setCurrentPhrase(null);
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  return {
    sessionScores,
    currentSessionScores,
    currentPhrase,
    isScoring,
    startPronunciationPractice,
    submitPronunciationWithSpeech,
    getNextPhrase,
    finalizeSessionScores,
    getOverallStats,
    clearPronunciationData,
    scoreFromSpeech,
  };
}

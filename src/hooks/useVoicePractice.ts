import { useState, useCallback, useEffect, useRef } from 'react';

interface VoicePracticeResult {
  score: number;
  feedback: 'perfect' | 'excellent' | 'good' | 'close' | 'partial' | 'tryagain' | 'different';
  transcript: string;
}

interface UseVoicePracticeReturn {
  isSupported: boolean;
  isListening: boolean;
  transcript: string;
  result: VoicePracticeResult | null;
  error: string | null;
  startListening: (targetWord: string) => void;
  stopListening: () => void;
  reset: () => void;
}

export function useVoicePractice(): UseVoicePracticeReturn {
  const [isSupported, setIsSupported] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [result, setResult] = useState<VoicePracticeResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recognitionRef = useRef<any>(null);
  const targetWordRef = useRef<string>('');

  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const SpeechRecognitionAPI = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    setIsSupported(!!SpeechRecognitionAPI);

    if (SpeechRecognitionAPI) {
      const recognition = new SpeechRecognitionAPI();
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = 'en-AU';
      recognition.maxAlternatives = 3;

      recognition.onstart = () => {
        setIsListening(true);
        setError(null);
        setTranscript('');
        setResult(null);
      };

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      recognition.onresult = (event: any) => {
        const results = event.results[0];
        const spokenText = results[0].transcript.toLowerCase().trim();
        setTranscript(spokenText);

        if (results.isFinal) {
          const alternatives: string[] = [];
          for (let i = 0; i < results.length; i++) {
            alternatives.push(results[i].transcript.toLowerCase().trim());
          }
          const matchResult = calculateMatch(targetWordRef.current, spokenText, alternatives);
          setResult(matchResult);
        }
      };

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      recognition.onerror = (event: any) => {
        setIsListening(false);
        let message = 'Error occurred. Please try again.';
        if (event.error === 'no-speech') {
          message = "Didn't hear anything. Try again!";
        } else if (event.error === 'audio-capture') {
          message = 'No microphone found. Check your settings.';
        } else if (event.error === 'not-allowed') {
          message = 'Microphone access denied. Please allow access.';
        }
        setError(message);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
    };
  }, []);

  const startListening = useCallback((targetWord: string) => {
    if (!recognitionRef.current || !targetWord) return;

    targetWordRef.current = targetWord.toLowerCase().trim();
    setError(null);
    setResult(null);
    setTranscript('');

    try {
      recognitionRef.current.start();
    } catch {
      // Recognition might already be running
      recognitionRef.current.stop();
      setTimeout(() => {
        recognitionRef.current?.start();
      }, 100);
    }
  }, []);

  const stopListening = useCallback(() => {
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop();
    }
  }, [isListening]);

  const reset = useCallback(() => {
    setTranscript('');
    setResult(null);
    setError(null);
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop();
    }
  }, [isListening]);

  return {
    isSupported,
    isListening,
    transcript,
    result,
    error,
    startListening,
    stopListening,
    reset,
  };
}

// Utility functions for pronunciation matching
function normalizeString(str: string): string {
  return str
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, ' ');
}

function calculateSimilarity(str1: string, str2: string): number {
  const len1 = str1.length;
  const len2 = str2.length;

  if (len1 === 0) return len2 === 0 ? 100 : 0;
  if (len2 === 0) return 0;

  const matrix: number[][] = Array(len1 + 1)
    .fill(null)
    .map(() => Array(len2 + 1).fill(null));

  for (let i = 0; i <= len1; i++) matrix[i][0] = i;
  for (let j = 0; j <= len2; j++) matrix[0][j] = j;

  for (let i = 1; i <= len1; i++) {
    for (let j = 1; j <= len2; j++) {
      const cost = str1[i - 1] === str2[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,
        matrix[i][j - 1] + 1,
        matrix[i - 1][j - 1] + cost
      );
    }
  }

  const distance = matrix[len1][len2];
  const maxLen = Math.max(len1, len2);
  return Math.round((1 - distance / maxLen) * 100);
}

function calculateMatch(
  target: string,
  spoken: string,
  alternatives: string[]
): VoicePracticeResult {
  const normalizedTarget = normalizeString(target);
  const normalizedSpoken = normalizeString(spoken);

  // Exact match
  if (normalizedTarget === normalizedSpoken) {
    return { score: 100, feedback: 'perfect', transcript: spoken };
  }

  // Check alternatives
  for (const alt of alternatives) {
    if (normalizeString(alt) === normalizedTarget) {
      return { score: 95, feedback: 'excellent', transcript: spoken };
    }
  }

  const similarity = calculateSimilarity(normalizedTarget, normalizedSpoken);

  // Check if spoken text contains the target word
  if (normalizedSpoken.includes(normalizedTarget)) {
    return { score: Math.max(similarity, 85), feedback: 'good', transcript: spoken };
  }

  // Check if target contains spoken (partial match)
  if (normalizedTarget.includes(normalizedSpoken) && normalizedSpoken.length > 2) {
    return { score: Math.max(similarity, 70), feedback: 'partial', transcript: spoken };
  }

  // Return similarity score based feedback
  if (similarity >= 80) {
    return { score: similarity, feedback: 'good', transcript: spoken };
  } else if (similarity >= 60) {
    return { score: similarity, feedback: 'close', transcript: spoken };
  } else if (similarity >= 40) {
    return { score: similarity, feedback: 'tryagain', transcript: spoken };
  } else {
    return { score: similarity, feedback: 'different', transcript: spoken };
  }
}

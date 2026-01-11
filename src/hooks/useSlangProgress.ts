import { useState, useEffect, useCallback } from 'react';
import { slangData } from '../data/slangData';

interface CardProgress {
  id: string;
  level: number; // 0-5, where 5 is mastered
  nextReview: number; // timestamp
  lastReview: number;
}

interface SlangProgress {
  cards: Record<string, CardProgress>;
  quizHighScore: number;
  totalQuizzesTaken: number;
}

const STORAGE_KEY = 'aussie-slang-progress';

const getInitialProgress = (): SlangProgress => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (e) {
    console.error('Failed to load slang progress:', e);
  }
  return {
    cards: {},
    quizHighScore: 0,
    totalQuizzesTaken: 0,
  };
};

// Spaced repetition intervals in milliseconds
const INTERVALS = [
  0, // Level 0: Review now
  1 * 60 * 60 * 1000, // Level 1: 1 hour
  24 * 60 * 60 * 1000, // Level 2: 1 day
  3 * 24 * 60 * 60 * 1000, // Level 3: 3 days
  7 * 24 * 60 * 60 * 1000, // Level 4: 1 week
  30 * 24 * 60 * 60 * 1000, // Level 5: 1 month (mastered)
];

export function useSlangProgress() {
  const [progress, setProgress] = useState<SlangProgress>(getInitialProgress);

  // Save to localStorage whenever progress changes
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
  }, [progress]);

  const getCardProgress = useCallback(
    (cardId: string): CardProgress => {
      return (
        progress.cards[cardId] || {
          id: cardId,
          level: 0,
          nextReview: 0,
          lastReview: 0,
        }
      );
    },
    [progress.cards]
  );

  const updateCardProgress = useCallback((cardId: string, rating: number) => {
    // Rating: 1 = didn't know, 2 = hard, 3 = good, 4 = easy, 5 = perfect
    setProgress((prev) => {
      const current = prev.cards[cardId] || {
        id: cardId,
        level: 0,
        nextReview: 0,
        lastReview: 0,
      };

      let newLevel = current.level;

      if (rating <= 2) {
        // Didn't know or hard - reset or decrease level
        newLevel = Math.max(0, current.level - 1);
      } else if (rating === 3) {
        // Good - maintain or slightly increase
        newLevel = Math.min(5, current.level + 1);
      } else {
        // Easy or perfect - increase more
        newLevel = Math.min(5, current.level + (rating === 5 ? 2 : 1));
      }

      const now = Date.now();
      const nextReview = now + INTERVALS[newLevel];

      return {
        ...prev,
        cards: {
          ...prev.cards,
          [cardId]: {
            id: cardId,
            level: newLevel,
            nextReview,
            lastReview: now,
          },
        },
      };
    });
  }, []);

  const getDueCards = useCallback(() => {
    const now = Date.now();
    return slangData.filter((card) => {
      const cardProgress = progress.cards[card.id];
      if (!cardProgress) return true; // New card, always due
      return cardProgress.nextReview <= now;
    });
  }, [progress.cards]);

  const getLearnedCount = useCallback(() => {
    return Object.values(progress.cards).filter((c) => c.level >= 1).length;
  }, [progress.cards]);

  const getMasteredCount = useCallback(() => {
    return Object.values(progress.cards).filter((c) => c.level >= 5).length;
  }, [progress.cards]);

  const updateQuizScore = useCallback((score: number) => {
    setProgress((prev) => ({
      ...prev,
      quizHighScore: Math.max(prev.quizHighScore, score),
      totalQuizzesTaken: prev.totalQuizzesTaken + 1,
    }));
  }, []);

  const resetProgress = useCallback(() => {
    if (window.confirm('Are you sure you want to reset all your slang learning progress?')) {
      setProgress({
        cards: {},
        quizHighScore: 0,
        totalQuizzesTaken: 0,
      });
    }
  }, []);

  return {
    progress,
    getCardProgress,
    updateCardProgress,
    getDueCards,
    getLearnedCount,
    getMasteredCount,
    updateQuizScore,
    resetProgress,
  };
}

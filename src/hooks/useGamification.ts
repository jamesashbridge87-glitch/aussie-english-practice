import { useState, useEffect, useCallback } from 'react';
import { slangData } from '../data/slangData';

// XP rewards for different activities
const XP_REWARDS = {
  flashcardView: 1,
  quizCorrect: 10,
  quizComplete: 25,
  perfectQuiz: 50,
  reviewComplete: 30,
  dailyChallenge: 50,
  streakBonus: 20,
  fillBlankCorrect: 8,
  sentenceBuilderCorrect: 5,
  voicePractice: 2,
};

// Level thresholds
const LEVEL_XP = [0, 100, 250, 500, 1000, 2000, 3500, 5500, 8000, 12000, 20000];

// Achievement definitions
interface Achievement {
  id: string;
  name: string;
  desc: string;
  icon: string;
  condition: (state: GamificationState) => boolean;
}

const ACHIEVEMENTS: Achievement[] = [
  { id: 'first_flip', name: 'First Flip', desc: 'View your first flashcard', icon: '1f0cf', condition: (s) => s.cardsViewed >= 1 },
  { id: 'ten_cards', name: 'Getting Started', desc: 'View 10 flashcards', icon: '1f4da', condition: (s) => s.cardsViewed >= 10 },
  { id: 'fifty_cards', name: 'Dedicated Learner', desc: 'View 50 flashcards', icon: '1f4d6', condition: (s) => s.cardsViewed >= 50 },
  { id: 'hundred_cards', name: 'Card Master', desc: 'View 100 flashcards', icon: '1f393', condition: (s) => s.cardsViewed >= 100 },
  { id: 'first_quiz', name: 'Quiz Taker', desc: 'Complete your first quiz', icon: '2705', condition: (s) => s.quizzesCompleted >= 1 },
  { id: 'five_quizzes', name: 'Quiz Regular', desc: 'Complete 5 quizzes', icon: '1f3c5', condition: (s) => s.quizzesCompleted >= 5 },
  { id: 'perfect_score', name: 'Perfect!', desc: 'Get 100% on a quiz', icon: '1f4af', condition: (s) => s.perfectQuizzes >= 1 },
  { id: 'three_perfect', name: 'Perfectionist', desc: 'Get 3 perfect quiz scores', icon: '1f31f', condition: (s) => s.perfectQuizzes >= 3 },
  { id: 'streak_3', name: 'On Fire', desc: '3 day streak', icon: '1f525', condition: (s) => s.maxStreak >= 3 },
  { id: 'streak_7', name: 'Week Warrior', desc: '7 day streak', icon: '1f4aa', condition: (s) => s.maxStreak >= 7 },
  { id: 'streak_30', name: 'Monthly Master', desc: '30 day streak', icon: '1f451', condition: (s) => s.maxStreak >= 30 },
  { id: 'level_5', name: 'Rising Star', desc: 'Reach Level 5', icon: '2b50', condition: (s) => s.level >= 5 },
  { id: 'level_10', name: 'Slang Expert', desc: 'Reach Level 10', icon: '1f3c6', condition: (s) => s.level >= 10 },
  { id: 'first_favorite', name: 'Bookworm', desc: 'Add first favorite', icon: '2764', condition: (s) => s.favorites.length >= 1 },
  { id: 'daily_done', name: 'Daily Dedication', desc: 'Complete a daily challenge', icon: '1f4c5', condition: (s) => s.dailyChallengesCompleted >= 1 },
  { id: 'voice_practice', name: 'Voice Actor', desc: 'Practice pronunciation 10 times', icon: '1f3a4', condition: (s) => s.voicePracticeCount >= 10 },
  { id: 'fill_blank_master', name: 'Fill Master', desc: 'Complete 5 fill-in-the-blank games', icon: '270d', condition: (s) => s.fillBlankCompleted >= 5 },
  { id: 'builder_master', name: 'Sentence Builder', desc: 'Complete 5 sentence builder games', icon: '1f9e9', condition: (s) => s.sentenceBuilderCompleted >= 5 },
];

interface GamificationState {
  xp: number;
  level: number;
  streak: number;
  maxStreak: number;
  lastActivity: string | null;
  cardsViewed: number;
  quizzesCompleted: number;
  perfectQuizzes: number;
  highScore: number;
  dailyChallengesCompleted: number;
  lastDailyChallenge: string | null;
  dailyChallengeCompletedToday: string | null;
  todaysDailyTerm: string | null;
  favorites: string[];
  unlockedAchievements: string[];
  voicePracticeCount: number;
  fillBlankCompleted: number;
  sentenceBuilderCompleted: number;
}

const STORAGE_KEY = 'aussie_slang_gamification';

const defaultState: GamificationState = {
  xp: 0,
  level: 1,
  streak: 0,
  maxStreak: 0,
  lastActivity: null,
  cardsViewed: 0,
  quizzesCompleted: 0,
  perfectQuizzes: 0,
  highScore: 0,
  dailyChallengesCompleted: 0,
  lastDailyChallenge: null,
  dailyChallengeCompletedToday: null,
  todaysDailyTerm: null,
  favorites: [],
  unlockedAchievements: [],
  voicePracticeCount: 0,
  fillBlankCompleted: 0,
  sentenceBuilderCompleted: 0,
};

const getInitialState = (): GamificationState => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return { ...defaultState, ...JSON.parse(stored) };
    }
  } catch (e) {
    console.error('Failed to load gamification state:', e);
  }
  return { ...defaultState };
};

export function useGamification() {
  const [state, setState] = useState<GamificationState>(getInitialState);
  const [notification, setNotification] = useState<string | null>(null);
  const [newAchievements, setNewAchievements] = useState<Achievement[]>([]);

  // Save to localStorage whenever state changes
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state]);

  // Check and update daily challenge on mount
  useEffect(() => {
    const today = new Date().toDateString();
    if (state.lastDailyChallenge !== today) {
      const randomIndex = Math.floor(Math.random() * slangData.length);
      setState(prev => ({
        ...prev,
        todaysDailyTerm: slangData[randomIndex].id,
        lastDailyChallenge: today,
      }));
    }
  }, [state.lastDailyChallenge]);

  // Check streak on mount
  useEffect(() => {
    checkStreak();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const showNotification = useCallback((message: string) => {
    setNotification(message);
    setTimeout(() => setNotification(null), 3000);
  }, []);

  const calculateLevel = useCallback((xp: number): number => {
    for (let i = LEVEL_XP.length - 1; i >= 0; i--) {
      if (xp >= LEVEL_XP[i]) {
        return i + 1;
      }
    }
    return 1;
  }, []);

  const checkAchievements = useCallback((newState: GamificationState): Achievement[] => {
    const unlocked: Achievement[] = [];
    ACHIEVEMENTS.forEach(achievement => {
      if (!newState.unlockedAchievements.includes(achievement.id)) {
        if (achievement.condition(newState)) {
          unlocked.push(achievement);
        }
      }
    });
    return unlocked;
  }, []);

  const addXP = useCallback((amount: number, _reason: string = '') => {
    setState(prev => {
      const newXP = prev.xp + amount;
      const newLevel = calculateLevel(newXP);
      const leveledUp = newLevel > prev.level;

      const newState = {
        ...prev,
        xp: newXP,
        level: newLevel,
      };

      // Check for new achievements
      const unlocked = checkAchievements(newState);
      if (unlocked.length > 0) {
        newState.unlockedAchievements = [
          ...prev.unlockedAchievements,
          ...unlocked.map(a => a.id)
        ];
        setNewAchievements(unlocked);
      }

      if (leveledUp) {
        showNotification(`Level Up! You're now Level ${newLevel}!`);
      }

      return newState;
    });
  }, [calculateLevel, checkAchievements, showNotification]);

  const checkStreak = useCallback(() => {
    const today = new Date().toDateString();
    setState(prev => {
      if (!prev.lastActivity) {
        return { ...prev, streak: 0 };
      }

      if (prev.lastActivity === today) {
        return prev;
      }

      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);

      if (prev.lastActivity === yesterday.toDateString()) {
        const newStreak = prev.streak + 1;
        const newMaxStreak = Math.max(newStreak, prev.maxStreak);
        if (newStreak > 1) {
          showNotification(`${newStreak} day streak! +${XP_REWARDS.streakBonus} XP`);
        }
        return {
          ...prev,
          streak: newStreak,
          maxStreak: newMaxStreak,
          lastActivity: today,
          xp: prev.xp + (newStreak > 1 ? XP_REWARDS.streakBonus : 0),
        };
      } else {
        if (prev.streak > 0) {
          showNotification('Streak lost! Start a new one today.');
        }
        return {
          ...prev,
          streak: 0,
          lastActivity: today,
        };
      }
    });
  }, [showNotification]);

  const recordActivity = useCallback(() => {
    const today = new Date().toDateString();
    setState(prev => {
      if (prev.lastActivity !== today) {
        const newStreak = prev.streak + 1;
        return {
          ...prev,
          lastActivity: today,
          streak: newStreak,
          maxStreak: Math.max(newStreak, prev.maxStreak),
        };
      }
      return prev;
    });
  }, []);

  const recordCardView = useCallback(() => {
    setState(prev => {
      const newState = {
        ...prev,
        cardsViewed: prev.cardsViewed + 1,
      };
      const unlocked = checkAchievements(newState);
      if (unlocked.length > 0) {
        newState.unlockedAchievements = [
          ...prev.unlockedAchievements,
          ...unlocked.map(a => a.id)
        ];
        setNewAchievements(unlocked);
      }
      return newState;
    });
    addXP(XP_REWARDS.flashcardView, 'card');
    recordActivity();
  }, [addXP, recordActivity, checkAchievements]);

  const recordQuizComplete = useCallback((score: number, total: number) => {
    setState(prev => {
      const isPerfect = score === total;
      const newState = {
        ...prev,
        quizzesCompleted: prev.quizzesCompleted + 1,
        perfectQuizzes: isPerfect ? prev.perfectQuizzes + 1 : prev.perfectQuizzes,
        highScore: Math.max(score, prev.highScore),
      };
      const unlocked = checkAchievements(newState);
      if (unlocked.length > 0) {
        newState.unlockedAchievements = [
          ...prev.unlockedAchievements,
          ...unlocked.map(a => a.id)
        ];
        setNewAchievements(unlocked);
      }
      return newState;
    });
    addXP(XP_REWARDS.quizComplete, 'quiz');
    if (score === total) {
      addXP(XP_REWARDS.perfectQuiz, 'perfect');
    }
    recordActivity();
  }, [addXP, recordActivity, checkAchievements]);

  const recordQuizCorrect = useCallback(() => {
    addXP(XP_REWARDS.quizCorrect, 'correct');
  }, [addXP]);

  const recordFillBlankComplete = useCallback((score: number, total: number) => {
    setState(prev => ({
      ...prev,
      fillBlankCompleted: prev.fillBlankCompleted + 1,
    }));
    addXP(XP_REWARDS.quizComplete, 'fillblank');
    if (score === total) {
      addXP(XP_REWARDS.perfectQuiz, 'perfect');
    }
    recordActivity();
  }, [addXP, recordActivity]);

  const recordFillBlankCorrect = useCallback(() => {
    addXP(XP_REWARDS.fillBlankCorrect, 'fillblank-correct');
  }, [addXP]);

  const recordSentenceBuilderComplete = useCallback(() => {
    setState(prev => ({
      ...prev,
      sentenceBuilderCompleted: prev.sentenceBuilderCompleted + 1,
    }));
    addXP(XP_REWARDS.quizComplete, 'builder');
    recordActivity();
  }, [addXP, recordActivity]);

  const recordSentenceBuilderCorrect = useCallback(() => {
    addXP(XP_REWARDS.sentenceBuilderCorrect, 'builder-correct');
  }, [addXP]);

  const recordVoicePractice = useCallback(() => {
    setState(prev => ({
      ...prev,
      voicePracticeCount: prev.voicePracticeCount + 1,
    }));
    addXP(XP_REWARDS.voicePractice, 'voice');
  }, [addXP]);

  const toggleFavorite = useCallback((termId: string): boolean => {
    let added = false;
    setState(prev => {
      const index = prev.favorites.indexOf(termId);
      let newFavorites: string[];
      if (index === -1) {
        newFavorites = [...prev.favorites, termId];
        added = true;
        showNotification('Added to favorites!');
      } else {
        newFavorites = prev.favorites.filter(id => id !== termId);
        showNotification('Removed from favorites');
      }
      const newState = { ...prev, favorites: newFavorites };
      const unlocked = checkAchievements(newState);
      if (unlocked.length > 0) {
        newState.unlockedAchievements = [
          ...prev.unlockedAchievements,
          ...unlocked.map(a => a.id)
        ];
        setNewAchievements(unlocked);
      }
      return newState;
    });
    return added;
  }, [showNotification, checkAchievements]);

  const isFavorite = useCallback((termId: string): boolean => {
    return state.favorites.includes(termId);
  }, [state.favorites]);

  const completeDailyChallenge = useCallback(() => {
    const today = new Date().toDateString();
    if (state.dailyChallengeCompletedToday !== today) {
      setState(prev => ({
        ...prev,
        dailyChallengesCompleted: prev.dailyChallengesCompleted + 1,
        dailyChallengeCompletedToday: today,
      }));
      addXP(XP_REWARDS.dailyChallenge, 'daily');
      showNotification(`Daily Challenge Complete! +${XP_REWARDS.dailyChallenge} XP`);
    }
  }, [state.dailyChallengeCompletedToday, addXP, showNotification]);

  const getXPProgress = useCallback(() => {
    const currentLevelXP = LEVEL_XP[state.level - 1] || 0;
    const nextLevelXP = LEVEL_XP[Math.min(state.level, LEVEL_XP.length - 1)];
    const progress = state.xp - currentLevelXP;
    const needed = nextLevelXP - currentLevelXP;
    return { progress, needed, percentage: (progress / needed) * 100 };
  }, [state.xp, state.level]);

  const getDailyChallengeTerm = useCallback(() => {
    if (!state.todaysDailyTerm) return null;
    return slangData.find(t => t.id === state.todaysDailyTerm) || null;
  }, [state.todaysDailyTerm]);

  const isDailyChallengeCompleted = useCallback(() => {
    const today = new Date().toDateString();
    return state.dailyChallengeCompletedToday === today;
  }, [state.dailyChallengeCompletedToday]);

  const getFavoriteTerms = useCallback(() => {
    return slangData.filter(term => state.favorites.includes(term.id));
  }, [state.favorites]);

  const getUnlockedAchievements = useCallback(() => {
    return ACHIEVEMENTS.filter(a => state.unlockedAchievements.includes(a.id));
  }, [state.unlockedAchievements]);

  const getAllAchievements = useCallback(() => {
    return ACHIEVEMENTS.map(a => ({
      ...a,
      unlocked: state.unlockedAchievements.includes(a.id),
    }));
  }, [state.unlockedAchievements]);

  const clearNewAchievements = useCallback(() => {
    setNewAchievements([]);
  }, []);

  const resetProgress = useCallback(() => {
    if (window.confirm('Are you sure you want to reset all your progress? This cannot be undone.')) {
      setState(defaultState);
      localStorage.removeItem(STORAGE_KEY);
      showNotification('Progress reset');
    }
  }, [showNotification]);

  return {
    // State
    xp: state.xp,
    level: state.level,
    streak: state.streak,
    maxStreak: state.maxStreak,
    highScore: state.highScore,
    cardsViewed: state.cardsViewed,
    quizzesCompleted: state.quizzesCompleted,
    favorites: state.favorites,

    // Actions
    addXP,
    recordCardView,
    recordQuizComplete,
    recordQuizCorrect,
    recordFillBlankComplete,
    recordFillBlankCorrect,
    recordSentenceBuilderComplete,
    recordSentenceBuilderCorrect,
    recordVoicePractice,
    toggleFavorite,
    isFavorite,
    completeDailyChallenge,
    resetProgress,

    // Computed
    getXPProgress,
    getDailyChallengeTerm,
    isDailyChallengeCompleted,
    getFavoriteTerms,
    getUnlockedAchievements,
    getAllAchievements,

    // Notifications
    notification,
    newAchievements,
    clearNewAchievements,
  };
}

export type { Achievement, GamificationState };
export { ACHIEVEMENTS, XP_REWARDS };

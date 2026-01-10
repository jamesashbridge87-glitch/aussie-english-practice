import { useState, useEffect, useCallback } from 'react';
import { ProgressStats } from './useProgressTracking';

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  category: 'streak' | 'sessions' | 'time' | 'modes' | 'special';
  requirement: (stats: ProgressStats) => boolean;
  progress?: (stats: ProgressStats) => { current: number; target: number };
}

export interface UnlockedAchievement {
  id: string;
  unlockedAt: Date;
}

const ACHIEVEMENTS: Achievement[] = [
  // Streak achievements
  {
    id: 'first-day',
    title: 'First Steps',
    description: 'Complete your first practice session',
    icon: '🎯',
    category: 'streak',
    requirement: (stats) => stats.totalSessions >= 1,
  },
  {
    id: 'streak-3',
    title: 'Getting Started',
    description: 'Maintain a 3-day practice streak',
    icon: '🔥',
    category: 'streak',
    requirement: (stats) => stats.streak >= 3,
    progress: (stats) => ({ current: Math.min(stats.streak, 3), target: 3 }),
  },
  {
    id: 'streak-7',
    title: 'Week Warrior',
    description: 'Maintain a 7-day practice streak',
    icon: '⚡',
    category: 'streak',
    requirement: (stats) => stats.streak >= 7,
    progress: (stats) => ({ current: Math.min(stats.streak, 7), target: 7 }),
  },
  {
    id: 'streak-30',
    title: 'Dedicated Learner',
    description: 'Maintain a 30-day practice streak',
    icon: '🏆',
    category: 'streak',
    requirement: (stats) => stats.streak >= 30,
    progress: (stats) => ({ current: Math.min(stats.streak, 30), target: 30 }),
  },

  // Session achievements
  {
    id: 'sessions-5',
    title: 'Getting Chatty',
    description: 'Complete 5 practice sessions',
    icon: '💬',
    category: 'sessions',
    requirement: (stats) => stats.totalSessions >= 5,
    progress: (stats) => ({ current: Math.min(stats.totalSessions, 5), target: 5 }),
  },
  {
    id: 'sessions-25',
    title: 'Conversation Pro',
    description: 'Complete 25 practice sessions',
    icon: '🗣️',
    category: 'sessions',
    requirement: (stats) => stats.totalSessions >= 25,
    progress: (stats) => ({ current: Math.min(stats.totalSessions, 25), target: 25 }),
  },
  {
    id: 'sessions-100',
    title: 'Century Club',
    description: 'Complete 100 practice sessions',
    icon: '💯',
    category: 'sessions',
    requirement: (stats) => stats.totalSessions >= 100,
    progress: (stats) => ({ current: Math.min(stats.totalSessions, 100), target: 100 }),
  },

  // Time achievements
  {
    id: 'time-30min',
    title: 'Half Hour Hero',
    description: 'Practice for 30 minutes total',
    icon: '⏱️',
    category: 'time',
    requirement: (stats) => stats.totalPracticeTime >= 30 * 60,
    progress: (stats) => ({ current: Math.min(stats.totalPracticeTime, 30 * 60), target: 30 * 60 }),
  },
  {
    id: 'time-2hr',
    title: 'Two Hour Tower',
    description: 'Practice for 2 hours total',
    icon: '⌛',
    category: 'time',
    requirement: (stats) => stats.totalPracticeTime >= 2 * 60 * 60,
    progress: (stats) => ({ current: Math.min(stats.totalPracticeTime, 2 * 60 * 60), target: 2 * 60 * 60 }),
  },
  {
    id: 'time-10hr',
    title: 'Time Investor',
    description: 'Practice for 10 hours total',
    icon: '🕐',
    category: 'time',
    requirement: (stats) => stats.totalPracticeTime >= 10 * 60 * 60,
    progress: (stats) => ({ current: Math.min(stats.totalPracticeTime, 10 * 60 * 60), target: 10 * 60 * 60 }),
  },

  // Mode achievements
  {
    id: 'mode-everyday',
    title: 'Daily Chatter',
    description: 'Complete 5 Everyday English sessions',
    icon: '🏠',
    category: 'modes',
    requirement: (stats) => stats.modeBreakdown.everyday >= 5,
    progress: (stats) => ({ current: Math.min(stats.modeBreakdown.everyday, 5), target: 5 }),
  },
  {
    id: 'mode-slang',
    title: 'True Blue Aussie',
    description: 'Complete 5 Aussie Slang sessions',
    icon: '🦘',
    category: 'modes',
    requirement: (stats) => stats.modeBreakdown.slang >= 5,
    progress: (stats) => ({ current: Math.min(stats.modeBreakdown.slang, 5), target: 5 }),
  },
  {
    id: 'mode-workplace',
    title: 'Office Ready',
    description: 'Complete 5 Workplace English sessions',
    icon: '💼',
    category: 'modes',
    requirement: (stats) => stats.modeBreakdown.workplace >= 5,
    progress: (stats) => ({ current: Math.min(stats.modeBreakdown.workplace, 5), target: 5 }),
  },
  {
    id: 'mode-all',
    title: 'Well Rounded',
    description: 'Complete at least 3 sessions in each mode',
    icon: '🌟',
    category: 'modes',
    requirement: (stats) =>
      stats.modeBreakdown.everyday >= 3 &&
      stats.modeBreakdown.slang >= 3 &&
      stats.modeBreakdown.workplace >= 3,
  },

  // Special achievements
  {
    id: 'long-session',
    title: 'Deep Conversation',
    description: 'Have a session lasting over 10 minutes',
    icon: '🎙️',
    category: 'special',
    requirement: (stats) => stats.averageSessionDuration >= 10 * 60 || stats.totalPracticeTime / Math.max(stats.totalSessions, 1) >= 10 * 60,
  },
  {
    id: 'weekly-5',
    title: 'Busy Week',
    description: 'Complete 5 sessions in one week',
    icon: '📅',
    category: 'special',
    requirement: (stats) => stats.sessionsThisWeek >= 5,
    progress: (stats) => ({ current: Math.min(stats.sessionsThisWeek, 5), target: 5 }),
  },
];

const STORAGE_KEY = 'aussie-english-achievements';

export function useAchievements() {
  const [unlockedAchievements, setUnlockedAchievements] = useState<UnlockedAchievement[]>([]);
  const [newlyUnlocked, setNewlyUnlocked] = useState<Achievement[]>([]);

  // Load from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const data: UnlockedAchievement[] = JSON.parse(stored);
        setUnlockedAchievements(data.map(a => ({
          ...a,
          unlockedAt: new Date(a.unlockedAt),
        })));
      } catch (e) {
        console.error('Failed to load achievements:', e);
      }
    }
  }, []);

  // Save to localStorage when achievements change
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(unlockedAchievements));
  }, [unlockedAchievements]);

  const checkAchievements = useCallback((stats: ProgressStats) => {
    const newUnlocks: Achievement[] = [];

    ACHIEVEMENTS.forEach((achievement) => {
      const alreadyUnlocked = unlockedAchievements.some(u => u.id === achievement.id);

      if (!alreadyUnlocked && achievement.requirement(stats)) {
        newUnlocks.push(achievement);
      }
    });

    if (newUnlocks.length > 0) {
      const newUnlockedRecords = newUnlocks.map(a => ({
        id: a.id,
        unlockedAt: new Date(),
      }));

      setUnlockedAchievements(prev => [...prev, ...newUnlockedRecords]);
      setNewlyUnlocked(newUnlocks);
    }
  }, [unlockedAchievements]);

  const dismissNewlyUnlocked = useCallback(() => {
    setNewlyUnlocked([]);
  }, []);

  const getAchievementProgress = useCallback((stats: ProgressStats) => {
    return ACHIEVEMENTS.map(achievement => {
      const unlocked = unlockedAchievements.find(u => u.id === achievement.id);
      const progress = achievement.progress ? achievement.progress(stats) : undefined;

      return {
        ...achievement,
        unlocked: !!unlocked,
        unlockedAt: unlocked?.unlockedAt,
        progress,
      };
    });
  }, [unlockedAchievements]);

  const clearAchievements = useCallback(() => {
    setUnlockedAchievements([]);
    setNewlyUnlocked([]);
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  return {
    achievements: ACHIEVEMENTS,
    unlockedAchievements,
    newlyUnlocked,
    checkAchievements,
    dismissNewlyUnlocked,
    getAchievementProgress,
    clearAchievements,
  };
}

import { useMemo } from 'react';
import { SessionRecord } from './useProgressTracking';
import { OnboardingData } from './useOnboarding';
import { scenarios, Scenario, ScenarioCategory } from '../data/scenarios';

export interface ScenarioRecommendation {
  scenario: Scenario;
  reason: string;
  priority: number;
}

// Category weights based on user goals
// Uses actual ScenarioCategory values: 'interview' | 'first-weeks' | 'day-to-day' | 'meetings' | 'growth' | 'social'
const GOAL_CATEGORY_WEIGHTS: Record<string, Record<ScenarioCategory, number>> = {
  'workplace-confidence': {
    'interview': 1.5,
    'first-weeks': 2,
    'day-to-day': 3,
    'meetings': 3,
    'growth': 2,
    'social': 1,
  },
  'social-connections': {
    'interview': 0.5,
    'first-weeks': 1.5,
    'day-to-day': 2,
    'meetings': 1,
    'growth': 0.5,
    'social': 3,
  },
  'sound-local': {
    'interview': 1,
    'first-weeks': 2,
    'day-to-day': 2.5,
    'meetings': 1.5,
    'growth': 1,
    'social': 3,
  },
  'all-of-above': {
    'interview': 2,
    'first-weeks': 2,
    'day-to-day': 2,
    'meetings': 2,
    'growth': 2,
    'social': 2,
  },
};

// Difficulty weights based on comfort level
const COMFORT_DIFFICULTY_WEIGHTS: Record<string, Record<string, number>> = {
  'nervous': {
    beginner: 3,
    intermediate: 1,
    advanced: 0.2,
  },
  'getting-there': {
    beginner: 1.5,
    intermediate: 3,
    advanced: 1,
  },
  'pretty-confident': {
    beginner: 0.5,
    intermediate: 2,
    advanced: 3,
  },
};

export function useScenarioRecommendations(
  onboardingData: OnboardingData,
  sessions: SessionRecord[],
  maxRecommendations: number = 5
): ScenarioRecommendation[] {
  return useMemo(() => {
    const { goal, comfortLevel, experienceLevel } = onboardingData;

    // Get recently practiced scenario IDs (last 7 days)
    // Note: sessions track by PracticeMode, not ScenarioCategory
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    const recentSessions = sessions.filter(s => new Date(s.startTime) > weekAgo);
    const sessionCount = sessions.length;

    // Calculate scores for each scenario
    const scoredScenarios: ScenarioRecommendation[] = scenarios.map(scenario => {
      let score = 100; // Base score
      let reason = '';

      // Apply goal-based category weighting
      if (goal) {
        const weights = GOAL_CATEGORY_WEIGHTS[goal] || GOAL_CATEGORY_WEIGHTS['all-of-above'];
        const categoryWeight = weights[scenario.category] || 1;
        score *= categoryWeight;

        if (categoryWeight >= 2.5) {
          reason = 'Matches your goal';
        }
      }

      // Apply comfort-based difficulty weighting
      if (comfortLevel) {
        const diffWeights = COMFORT_DIFFICULTY_WEIGHTS[comfortLevel] || COMFORT_DIFFICULTY_WEIGHTS['getting-there'];
        const diffWeight = diffWeights[scenario.difficulty] || 1;
        score *= diffWeight;

        if (diffWeight >= 2.5) {
          reason = reason || `Right difficulty for you`;
        }
      }

      // Boost variety - prefer categories not practiced recently
      // Map scenario categories to broad groups for variety tracking
      const categoryGroups: Record<ScenarioCategory, string> = {
        'interview': 'career',
        'first-weeks': 'workplace',
        'day-to-day': 'workplace',
        'meetings': 'workplace',
        'growth': 'career',
        'social': 'social',
      };
      const scenarioGroup = categoryGroups[scenario.category];
      const recentlyPracticedGroups = new Set(recentSessions.map(() => 'workplace')); // Simplified

      if (!recentlyPracticedGroups.has(scenarioGroup) && sessionCount > 0) {
        score *= 1.3;
        reason = reason || 'Try something new';
      }

      // Boost scenarios for new users
      if (experienceLevel === 'new-to-australia' && scenario.difficulty === 'beginner') {
        score *= 1.3;
      }

      // Boost first-weeks scenarios for new users with few sessions
      if (sessionCount < 5 && scenario.category === 'first-weeks') {
        score *= 1.4;
        reason = reason || 'Great for getting started';
      }

      // Add some randomness to keep it fresh
      score *= (0.9 + Math.random() * 0.2);

      return {
        scenario,
        reason: reason || 'Recommended for you',
        priority: Math.round(score),
      };
    });

    // Sort by priority and return top recommendations
    return scoredScenarios
      .sort((a, b) => b.priority - a.priority)
      .slice(0, maxRecommendations);
  }, [onboardingData, sessions, maxRecommendations]);
}

// Get a single "scenario of the day" recommendation
export function getDailyRecommendation(
  recommendations: ScenarioRecommendation[],
  onboardingData: OnboardingData
): ScenarioRecommendation | null {
  if (recommendations.length === 0) return null;

  // If first session not completed, return the onboarding recommendation
  if (!onboardingData.firstSessionCompleted && onboardingData.recommendedScenarioId) {
    const recommended = scenarios.find(s => s.id === onboardingData.recommendedScenarioId);
    if (recommended) {
      return {
        scenario: recommended,
        reason: 'Perfect starting point for you',
        priority: 1000,
      };
    }
  }

  // Otherwise return top recommendation with some variety based on day
  const dayOfWeek = new Date().getDay();
  const index = dayOfWeek % Math.min(3, recommendations.length);
  return recommendations[index];
}

// Get "try something different" suggestion
export function getTrySomethingNew(
  sessions: SessionRecord[],
  currentCategory?: ScenarioCategory
): Scenario | null {
  // Find scenarios in different categories
  const differentScenarios = scenarios.filter(s => s.category !== currentCategory);

  if (differentScenarios.length > 0) {
    // Prefer beginner scenarios for variety
    const beginnerScenarios = differentScenarios.filter(s => s.difficulty === 'beginner');
    if (beginnerScenarios.length > 0 && sessions.length < 10) {
      return beginnerScenarios[Math.floor(Math.random() * beginnerScenarios.length)];
    }
    return differentScenarios[Math.floor(Math.random() * differentScenarios.length)];
  }

  return null;
}

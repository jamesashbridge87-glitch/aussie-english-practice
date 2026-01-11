import { useState, useEffect, useCallback } from 'react';
import { fetchWithAuth, useAuth } from './useAuth';

export interface UsageStatus {
  allowed: boolean;
  daily_limit_minutes: number;
  minutes_used: number;
  remaining_minutes: number;
  plan: string;
}

export interface Plan {
  plan: string;
  daily_minutes: number;
  monthly_price_cents: number;
  description: string;
}

interface SubscriptionState {
  usage: UsageStatus | null;
  plans: Plan[];
  isLoading: boolean;
  error: string | null;
}

export function useSubscription() {
  const { isAuthenticated, refreshUser } = useAuth();
  const [state, setState] = useState<SubscriptionState>({
    usage: null,
    plans: [],
    isLoading: true,
    error: null,
  });

  const fetchUsage = useCallback(async () => {
    if (!isAuthenticated) {
      setState(prev => ({ ...prev, usage: null, isLoading: false }));
      return;
    }

    try {
      const response = await fetchWithAuth('/subscriptions/check');
      if (response.ok) {
        const data = await response.json();
        setState(prev => ({
          ...prev,
          usage: {
            allowed: data.can_start_session,
            daily_limit_minutes: data.daily_limit_minutes,
            minutes_used: data.minutes_used,
            remaining_minutes: data.remaining_minutes,
            plan: data.plan,
          },
          isLoading: false,
          error: null,
        }));
      }
    } catch (error) {
      console.error('Failed to fetch usage:', error);
      setState(prev => ({
        ...prev,
        error: 'Failed to check usage status',
        isLoading: false,
      }));
    }
  }, [isAuthenticated]);

  const fetchPlans = useCallback(async () => {
    try {
      const response = await fetchWithAuth('/subscriptions/plans');
      if (response.ok) {
        const data = await response.json();
        setState(prev => ({ ...prev, plans: data.plans }));
      }
    } catch (error) {
      console.error('Failed to fetch plans:', error);
    }
  }, []);

  useEffect(() => {
    fetchUsage();
    fetchPlans();
  }, [fetchUsage, fetchPlans]);

  const checkCanStartSession = useCallback(async (): Promise<{
    allowed: boolean;
    message?: string;
    remaining?: number;
  }> => {
    if (!isAuthenticated) {
      return { allowed: false, message: 'Please log in to start a session' };
    }

    await fetchUsage();

    if (!state.usage) {
      return { allowed: false, message: 'Unable to check usage status' };
    }

    if (!state.usage.allowed) {
      return {
        allowed: false,
        message: `You've used your daily limit of ${state.usage.daily_limit_minutes} minutes. Upgrade your plan for more practice time!`,
        remaining: 0,
      };
    }

    return {
      allowed: true,
      remaining: state.usage.remaining_minutes,
    };
  }, [isAuthenticated, fetchUsage, state.usage]);

  const startCheckout = useCallback(async (plan: 'basic' | 'standard' | 'premium') => {
    try {
      const response = await fetchWithAuth('/billing/checkout', {
        method: 'POST',
        body: JSON.stringify({ plan }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to start checkout');
      }

      const { url } = await response.json();
      window.location.href = url;
    } catch (error) {
      console.error('Checkout error:', error);
      throw error;
    }
  }, []);

  const openBillingPortal = useCallback(async () => {
    try {
      const response = await fetchWithAuth('/billing/portal', {
        method: 'POST',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to open billing portal');
      }

      const { url } = await response.json();
      window.location.href = url;
    } catch (error) {
      console.error('Portal error:', error);
      throw error;
    }
  }, []);

  const recordSessionUsage = useCallback(async (
    sessionId: string,
    feedback?: boolean,
    messagesCount?: number
  ) => {
    try {
      await fetchWithAuth(`/sessions/${sessionId}/end`, {
        method: 'POST',
        body: JSON.stringify({ feedback, messages_count: messagesCount }),
      });
      await fetchUsage();
      await refreshUser();
    } catch (error) {
      console.error('Failed to record session:', error);
    }
  }, [fetchUsage, refreshUser]);

  const startBackendSession = useCallback(async (mode?: string): Promise<string | null> => {
    try {
      const response = await fetchWithAuth('/sessions/start', {
        method: 'POST',
        body: JSON.stringify({ mode }),
      });

      if (!response.ok) {
        const error = await response.json();
        if (error.code === 'USAGE_LIMIT_REACHED') {
          throw new Error('Daily usage limit reached');
        }
        throw new Error(error.error || 'Failed to start session');
      }

      const data = await response.json();
      return data.session.id;
    } catch (error) {
      console.error('Failed to start backend session:', error);
      throw error;
    }
  }, []);

  return {
    usage: state.usage,
    plans: state.plans,
    isLoading: state.isLoading,
    error: state.error,
    refreshUsage: fetchUsage,
    checkCanStartSession,
    startCheckout,
    openBillingPortal,
    startBackendSession,
    recordSessionUsage,
  };
}

import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from './auth.js';
import { SubscriptionModel } from '../models/Subscription.js';
import { UsageModel } from '../models/Usage.js';

export interface UsageCheckResult {
  allowed: boolean;
  daily_limit_minutes: number;
  minutes_used: number;
  remaining_minutes: number;
  plan: string;
}

export function checkUsageLimits(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  if (!req.user) {
    res.status(401).json({ error: 'Authentication required' });
    return;
  }

  const userId = req.user.id;
  const dailyLimit = SubscriptionModel.getUserDailyLimit(userId);
  const todayUsage = UsageModel.getTodayUsage(userId);

  const remaining = Math.max(0, dailyLimit - todayUsage.minutes_used);

  if (remaining <= 0) {
    res.status(403).json({
      error: 'Daily usage limit reached',
      code: 'USAGE_LIMIT_REACHED',
      daily_limit_minutes: dailyLimit,
      minutes_used: todayUsage.minutes_used,
      remaining_minutes: 0,
    });
    return;
  }

  // Attach usage info to request for downstream use
  (req as any).usageInfo = {
    daily_limit_minutes: dailyLimit,
    minutes_used: todayUsage.minutes_used,
    remaining_minutes: remaining,
  };

  next();
}

export function getUsageStatus(userId: string): UsageCheckResult {
  const subscription = SubscriptionModel.findByUserId(userId);
  const plan = subscription?.plan || 'free';
  const dailyLimit = SubscriptionModel.getUserDailyLimit(userId);
  const todayUsage = UsageModel.getTodayUsage(userId);
  const remaining = Math.max(0, dailyLimit - todayUsage.minutes_used);

  return {
    allowed: remaining > 0,
    daily_limit_minutes: dailyLimit,
    minutes_used: todayUsage.minutes_used,
    remaining_minutes: remaining,
    plan,
  };
}

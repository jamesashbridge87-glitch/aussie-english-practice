import { Router, Response } from 'express';
import { authenticate, AuthenticatedRequest } from '../middleware/auth.js';
import { SubscriptionModel } from '../models/Subscription.js';
import { UsageModel } from '../models/Usage.js';
import { getUsageStatus } from '../middleware/usageLimits.js';

const router = Router();

// GET /subscriptions/plans - Get available plans
router.get('/plans', (_req, res: Response) => {
  try {
    const plans = SubscriptionModel.getPlanLimits();
    res.json({ plans });
  } catch (error) {
    console.error('Get plans error:', error);
    res.status(500).json({ error: 'Failed to get plans' });
  }
});

// GET /subscriptions/current - Get current subscription
router.get('/current', authenticate, (req: AuthenticatedRequest, res: Response) => {
  try {
    const subscription = SubscriptionModel.findByUserId(req.user!.id);
    const usageStatus = getUsageStatus(req.user!.id);

    res.json({
      subscription: subscription || {
        plan: 'free',
        status: 'active',
      },
      usage: usageStatus,
    });
  } catch (error) {
    console.error('Get subscription error:', error);
    res.status(500).json({ error: 'Failed to get subscription' });
  }
});

// GET /subscriptions/usage - Get usage history
router.get('/usage', authenticate, (req: AuthenticatedRequest, res: Response) => {
  try {
    const days = parseInt(req.query.days as string) || 30;
    const history = UsageModel.getUsageHistory(req.user!.id, days);
    const monthlyTotal = UsageModel.getTotalMinutesThisMonth(req.user!.id);
    const currentUsage = getUsageStatus(req.user!.id);

    res.json({
      current: currentUsage,
      monthly_total_minutes: monthlyTotal,
      history,
    });
  } catch (error) {
    console.error('Get usage error:', error);
    res.status(500).json({ error: 'Failed to get usage' });
  }
});

// GET /subscriptions/check - Quick check if user can start session
router.get('/check', authenticate, (req: AuthenticatedRequest, res: Response) => {
  try {
    const status = getUsageStatus(req.user!.id);

    res.json({
      can_start_session: status.allowed,
      ...status,
    });
  } catch (error) {
    console.error('Check usage error:', error);
    res.status(500).json({ error: 'Failed to check usage' });
  }
});

export default router;

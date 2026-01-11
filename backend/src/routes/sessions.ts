import { Router, Response } from 'express';
import { authenticate, AuthenticatedRequest } from '../middleware/auth.js';
import { checkUsageLimits, getUsageStatus } from '../middleware/usageLimits.js';
import { SessionModel } from '../models/Usage.js';
import { z } from 'zod';

const router = Router();

const startSessionSchema = z.object({
  mode: z.enum(['everyday', 'slang', 'workplace']).optional(),
});

const endSessionSchema = z.object({
  feedback: z.boolean().optional(),
  messages_count: z.number().optional(),
});

// POST /sessions/start - Start a new practice session
router.post('/start', authenticate, checkUsageLimits, (req: AuthenticatedRequest, res: Response) => {
  try {
    const validation = startSessionSchema.safeParse(req.body);
    if (!validation.success) {
      res.status(400).json({
        error: 'Validation failed',
        details: validation.error.errors,
      });
      return;
    }

    // Check if there's already an active session
    const activeSession = SessionModel.getActiveSession(req.user!.id);
    if (activeSession) {
      res.status(409).json({
        error: 'Active session already exists',
        session: activeSession,
      });
      return;
    }

    const { mode } = validation.data;
    const session = SessionModel.create(req.user!.id, mode);
    const usageInfo = (req as any).usageInfo;

    res.status(201).json({
      session,
      usage: usageInfo,
    });
  } catch (error) {
    console.error('Start session error:', error);
    res.status(500).json({ error: 'Failed to start session' });
  }
});

// POST /sessions/:id/end - End a practice session
router.post('/:id/end', authenticate, (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const validation = endSessionSchema.safeParse(req.body);
    if (!validation.success) {
      res.status(400).json({
        error: 'Validation failed',
        details: validation.error.errors,
      });
      return;
    }

    const session = SessionModel.findById(id);
    if (!session) {
      res.status(404).json({ error: 'Session not found' });
      return;
    }

    if (session.user_id !== req.user!.id) {
      res.status(403).json({ error: 'Not authorized' });
      return;
    }

    if (session.ended_at) {
      res.status(400).json({ error: 'Session already ended' });
      return;
    }

    const { feedback, messages_count } = validation.data;

    if (messages_count !== undefined) {
      SessionModel.updateMessageCount(id, messages_count);
    }

    const endedSession = SessionModel.end(id, feedback);
    const usageStatus = getUsageStatus(req.user!.id);

    res.json({
      session: endedSession,
      usage: usageStatus,
    });
  } catch (error) {
    console.error('End session error:', error);
    res.status(500).json({ error: 'Failed to end session' });
  }
});

// GET /sessions/active - Get current active session
router.get('/active', authenticate, (req: AuthenticatedRequest, res: Response) => {
  try {
    const activeSession = SessionModel.getActiveSession(req.user!.id);
    res.json({ session: activeSession || null });
  } catch (error) {
    console.error('Get active session error:', error);
    res.status(500).json({ error: 'Failed to get active session' });
  }
});

// GET /sessions/history - Get session history
router.get('/history', authenticate, (req: AuthenticatedRequest, res: Response) => {
  try {
    const limit = parseInt(req.query.limit as string) || 10;
    const sessions = SessionModel.getRecentSessions(req.user!.id, limit);
    res.json({ sessions });
  } catch (error) {
    console.error('Get session history error:', error);
    res.status(500).json({ error: 'Failed to get session history' });
  }
});

export default router;

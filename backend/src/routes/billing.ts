import { Router, Request, Response } from 'express';
import { authenticate, AuthenticatedRequest } from '../middleware/auth.js';
import { StripeService } from '../services/stripe.js';
import { PlanType } from '../models/Subscription.js';
import { z } from 'zod';

const router = Router();

const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

const checkoutSchema = z.object({
  plan: z.enum(['basic', 'standard', 'premium']),
});

// POST /billing/checkout - Create checkout session
router.post('/checkout', authenticate, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const validation = checkoutSchema.safeParse(req.body);
    if (!validation.success) {
      res.status(400).json({
        error: 'Validation failed',
        details: validation.error.errors,
      });
      return;
    }

    const { plan } = validation.data;

    const session = await StripeService.createCheckoutSession(
      req.user!.id,
      plan as Exclude<PlanType, 'free'>,
      `${FRONTEND_URL}/subscription/success`,
      `${FRONTEND_URL}/subscription/cancel`
    );

    res.json({ url: session.url });
  } catch (error) {
    console.error('Checkout error:', error);
    res.status(500).json({ error: 'Failed to create checkout session' });
  }
});

// POST /billing/portal - Create customer portal session
router.post('/portal', authenticate, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const session = await StripeService.createPortalSession(
      req.user!.id,
      `${FRONTEND_URL}/settings`
    );

    res.json({ url: session.url });
  } catch (error) {
    console.error('Portal error:', error);
    res.status(500).json({ error: 'Failed to create portal session' });
  }
});

// POST /billing/webhook - Stripe webhook handler
router.post('/webhook', async (req: Request, res: Response) => {
  const signature = req.headers['stripe-signature'] as string;

  if (!signature) {
    res.status(400).json({ error: 'Missing stripe-signature header' });
    return;
  }

  try {
    // Note: req.body must be raw buffer for webhook verification
    // This is handled in the main app with express.raw() for this route
    const event = StripeService.constructWebhookEvent(req.body, signature);
    await StripeService.handleWebhookEvent(event);

    res.json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(400).json({ error: 'Webhook verification failed' });
  }
});

export default router;

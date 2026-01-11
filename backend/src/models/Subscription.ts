import { db } from '../db/database.js';
import { v4 as uuidv4 } from 'uuid';

export type PlanType = 'free' | 'basic' | 'standard' | 'premium';
export type SubscriptionStatus = 'active' | 'canceled' | 'past_due' | 'trialing';

export interface Subscription {
  id: string;
  user_id: string;
  plan: PlanType;
  status: SubscriptionStatus;
  stripe_subscription_id: string | null;
  stripe_price_id: string | null;
  current_period_start: string | null;
  current_period_end: string | null;
  cancel_at_period_end: number;
  created_at: string;
  updated_at: string;
}

export interface PlanLimit {
  plan: PlanType;
  daily_minutes: number;
  monthly_price_cents: number;
  description: string;
}

export interface CreateSubscriptionInput {
  user_id: string;
  plan: PlanType;
  status?: SubscriptionStatus;
  stripe_subscription_id?: string;
  stripe_price_id?: string;
  current_period_start?: string;
  current_period_end?: string;
}

export const SubscriptionModel = {
  create(input: CreateSubscriptionInput): Subscription {
    const id = uuidv4();

    const stmt = db.prepare(`
      INSERT INTO subscriptions (
        id, user_id, plan, status, stripe_subscription_id, stripe_price_id,
        current_period_start, current_period_end
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      id,
      input.user_id,
      input.plan,
      input.status || 'active',
      input.stripe_subscription_id || null,
      input.stripe_price_id || null,
      input.current_period_start || null,
      input.current_period_end || null
    );

    return this.findById(id) as Subscription;
  },

  findById(id: string): Subscription | undefined {
    const stmt = db.prepare('SELECT * FROM subscriptions WHERE id = ?');
    return stmt.get(id) as Subscription | undefined;
  },

  findByUserId(userId: string): Subscription | undefined {
    const stmt = db.prepare(`
      SELECT * FROM subscriptions
      WHERE user_id = ? AND status IN ('active', 'trialing')
      ORDER BY created_at DESC
      LIMIT 1
    `);
    return stmt.get(userId) as Subscription | undefined;
  },

  findByStripeSubscriptionId(stripeSubId: string): Subscription | undefined {
    const stmt = db.prepare('SELECT * FROM subscriptions WHERE stripe_subscription_id = ?');
    return stmt.get(stripeSubId) as Subscription | undefined;
  },

  update(id: string, updates: Partial<Omit<Subscription, 'id' | 'user_id' | 'created_at'>>): void {
    const fields: string[] = [];
    const values: any[] = [];

    if (updates.plan !== undefined) {
      fields.push('plan = ?');
      values.push(updates.plan);
    }
    if (updates.status !== undefined) {
      fields.push('status = ?');
      values.push(updates.status);
    }
    if (updates.stripe_subscription_id !== undefined) {
      fields.push('stripe_subscription_id = ?');
      values.push(updates.stripe_subscription_id);
    }
    if (updates.stripe_price_id !== undefined) {
      fields.push('stripe_price_id = ?');
      values.push(updates.stripe_price_id);
    }
    if (updates.current_period_start !== undefined) {
      fields.push('current_period_start = ?');
      values.push(updates.current_period_start);
    }
    if (updates.current_period_end !== undefined) {
      fields.push('current_period_end = ?');
      values.push(updates.current_period_end);
    }
    if (updates.cancel_at_period_end !== undefined) {
      fields.push('cancel_at_period_end = ?');
      values.push(updates.cancel_at_period_end);
    }

    if (fields.length === 0) return;

    fields.push("updated_at = datetime('now')");
    values.push(id);

    const stmt = db.prepare(`
      UPDATE subscriptions SET ${fields.join(', ')}
      WHERE id = ?
    `);
    stmt.run(...values);
  },

  cancel(id: string): void {
    this.update(id, { status: 'canceled' });
  },

  getPlanLimits(): PlanLimit[] {
    const stmt = db.prepare('SELECT * FROM plan_limits ORDER BY daily_minutes ASC');
    return stmt.all() as PlanLimit[];
  },

  getPlanLimit(plan: PlanType): PlanLimit | undefined {
    const stmt = db.prepare('SELECT * FROM plan_limits WHERE plan = ?');
    return stmt.get(plan) as PlanLimit | undefined;
  },

  getUserDailyLimit(userId: string): number {
    const subscription = this.findByUserId(userId);
    if (!subscription) {
      // Default to free tier
      const freeLimit = this.getPlanLimit('free');
      return freeLimit?.daily_minutes || 2;
    }

    const planLimit = this.getPlanLimit(subscription.plan);
    return planLimit?.daily_minutes || 2;
  },
};

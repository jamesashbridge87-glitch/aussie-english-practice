import { db } from '../db/database.js';
import { v4 as uuidv4 } from 'uuid';
import bcrypt from 'bcryptjs';

export interface User {
  id: string;
  email: string;
  password_hash: string;
  name: string | null;
  created_at: string;
  updated_at: string;
  email_verified: number;
  stripe_customer_id: string | null;
}

export interface CreateUserInput {
  email: string;
  password: string;
  name?: string;
}

export interface UserWithSubscription extends Omit<User, 'password_hash'> {
  subscription: {
    plan: string;
    status: string;
    daily_limit_minutes: number;
  } | null;
}

const SALT_ROUNDS = 12;

export const UserModel = {
  async create(input: CreateUserInput): Promise<User> {
    const id = uuidv4();
    const password_hash = await bcrypt.hash(input.password, SALT_ROUNDS);

    const stmt = db.prepare(`
      INSERT INTO users (id, email, password_hash, name)
      VALUES (?, ?, ?, ?)
    `);

    stmt.run(id, input.email.toLowerCase(), password_hash, input.name || null);

    return this.findById(id) as Promise<User>;
  },

  findById(id: string): User | undefined {
    const stmt = db.prepare('SELECT * FROM users WHERE id = ?');
    return stmt.get(id) as User | undefined;
  },

  findByEmail(email: string): User | undefined {
    const stmt = db.prepare('SELECT * FROM users WHERE email = ?');
    return stmt.get(email.toLowerCase()) as User | undefined;
  },

  findByStripeCustomerId(customerId: string): User | undefined {
    const stmt = db.prepare('SELECT * FROM users WHERE stripe_customer_id = ?');
    return stmt.get(customerId) as User | undefined;
  },

  async verifyPassword(user: User, password: string): Promise<boolean> {
    return bcrypt.compare(password, user.password_hash);
  },

  updateStripeCustomerId(userId: string, stripeCustomerId: string): void {
    const stmt = db.prepare(`
      UPDATE users SET stripe_customer_id = ?, updated_at = datetime('now')
      WHERE id = ?
    `);
    stmt.run(stripeCustomerId, userId);
  },

  updateName(userId: string, name: string): void {
    const stmt = db.prepare(`
      UPDATE users SET name = ?, updated_at = datetime('now')
      WHERE id = ?
    `);
    stmt.run(name, userId);
  },

  getWithSubscription(userId: string): UserWithSubscription | undefined {
    const stmt = db.prepare(`
      SELECT
        u.id, u.email, u.name, u.created_at, u.updated_at,
        u.email_verified, u.stripe_customer_id,
        s.plan, s.status,
        pl.daily_minutes
      FROM users u
      LEFT JOIN subscriptions s ON u.id = s.user_id AND s.status IN ('active', 'trialing')
      LEFT JOIN plan_limits pl ON s.plan = pl.plan
      WHERE u.id = ?
    `);

    const row = stmt.get(userId) as any;
    if (!row) return undefined;

    return {
      id: row.id,
      email: row.email,
      name: row.name,
      created_at: row.created_at,
      updated_at: row.updated_at,
      email_verified: row.email_verified,
      stripe_customer_id: row.stripe_customer_id,
      subscription: row.plan ? {
        plan: row.plan,
        status: row.status,
        daily_limit_minutes: row.daily_minutes,
      } : null,
    };
  },

  delete(userId: string): void {
    const stmt = db.prepare('DELETE FROM users WHERE id = ?');
    stmt.run(userId);
  },
};

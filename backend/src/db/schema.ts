// Database schema definitions for SQLite
// Tables: users, subscriptions, usage_records, sessions

export const schema = `
-- Users table
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  name TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),
  email_verified INTEGER DEFAULT 0,
  stripe_customer_id TEXT UNIQUE
);

-- Subscription plans reference
-- basic: 5 mins/day ($25 AUD/month)
-- standard: 10 mins/day ($49 AUD/month)
-- premium: 15 mins/day ($79 AUD/month)

-- Subscriptions table
CREATE TABLE IF NOT EXISTS subscriptions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  plan TEXT NOT NULL CHECK(plan IN ('free', 'basic', 'standard', 'premium')),
  status TEXT NOT NULL CHECK(status IN ('active', 'canceled', 'past_due', 'trialing')),
  stripe_subscription_id TEXT UNIQUE,
  stripe_price_id TEXT,
  current_period_start TEXT,
  current_period_end TEXT,
  cancel_at_period_end INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

-- Daily usage records
CREATE TABLE IF NOT EXISTS usage_records (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  date TEXT NOT NULL,
  minutes_used REAL DEFAULT 0,
  sessions_count INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),
  UNIQUE(user_id, date)
);

-- Individual session records
CREATE TABLE IF NOT EXISTS practice_sessions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  started_at TEXT NOT NULL,
  ended_at TEXT,
  duration_seconds INTEGER DEFAULT 0,
  mode TEXT CHECK(mode IN ('everyday', 'slang', 'workplace')),
  messages_count INTEGER DEFAULT 0,
  feedback INTEGER,
  created_at TEXT DEFAULT (datetime('now'))
);

-- Plan limits configuration
CREATE TABLE IF NOT EXISTS plan_limits (
  plan TEXT PRIMARY KEY,
  daily_minutes INTEGER NOT NULL,
  monthly_price_cents INTEGER NOT NULL,
  description TEXT
);

-- Insert default plan limits
INSERT OR IGNORE INTO plan_limits (plan, daily_minutes, monthly_price_cents, description) VALUES
  ('free', 2, 0, 'Free trial - 2 minutes per day'),
  ('basic', 5, 2500, 'Basic plan - 5 minutes per day'),
  ('standard', 10, 4900, 'Standard plan - 10 minutes per day'),
  ('premium', 15, 7900, 'Premium plan - 15 minutes per day');

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_usage_records_user_date ON usage_records(user_id, date);
CREATE INDEX IF NOT EXISTS idx_practice_sessions_user_id ON practice_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_practice_sessions_started_at ON practice_sessions(started_at);
`;

export const dropSchema = `
DROP TABLE IF EXISTS practice_sessions;
DROP TABLE IF EXISTS usage_records;
DROP TABLE IF EXISTS subscriptions;
DROP TABLE IF EXISTS plan_limits;
DROP TABLE IF EXISTS users;
`;

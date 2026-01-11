import { db } from '../db/database.js';
import { v4 as uuidv4 } from 'uuid';

export interface UsageRecord {
  id: string;
  user_id: string;
  date: string;
  minutes_used: number;
  sessions_count: number;
  created_at: string;
  updated_at: string;
}

export interface PracticeSession {
  id: string;
  user_id: string;
  started_at: string;
  ended_at: string | null;
  duration_seconds: number;
  mode: 'everyday' | 'slang' | 'workplace' | null;
  messages_count: number;
  feedback: number | null;
  created_at: string;
}

export interface DailyUsageSummary {
  date: string;
  minutes_used: number;
  sessions_count: number;
  limit_minutes: number;
  remaining_minutes: number;
}

function getTodayDate(): string {
  return new Date().toISOString().split('T')[0];
}

export const UsageModel = {
  getOrCreateDailyRecord(userId: string, date?: string): UsageRecord {
    const recordDate = date || getTodayDate();

    let record = this.findByUserAndDate(userId, recordDate);
    if (record) return record;

    const id = uuidv4();
    const stmt = db.prepare(`
      INSERT INTO usage_records (id, user_id, date, minutes_used, sessions_count)
      VALUES (?, ?, ?, 0, 0)
    `);
    stmt.run(id, userId, recordDate);

    return this.findById(id) as UsageRecord;
  },

  findById(id: string): UsageRecord | undefined {
    const stmt = db.prepare('SELECT * FROM usage_records WHERE id = ?');
    return stmt.get(id) as UsageRecord | undefined;
  },

  findByUserAndDate(userId: string, date: string): UsageRecord | undefined {
    const stmt = db.prepare('SELECT * FROM usage_records WHERE user_id = ? AND date = ?');
    return stmt.get(userId, date) as UsageRecord | undefined;
  },

  getTodayUsage(userId: string): UsageRecord {
    return this.getOrCreateDailyRecord(userId);
  },

  addMinutes(userId: string, minutes: number): UsageRecord {
    const record = this.getOrCreateDailyRecord(userId);

    const stmt = db.prepare(`
      UPDATE usage_records
      SET minutes_used = minutes_used + ?, updated_at = datetime('now')
      WHERE id = ?
    `);
    stmt.run(minutes, record.id);

    return this.findById(record.id) as UsageRecord;
  },

  incrementSessionCount(userId: string): void {
    const record = this.getOrCreateDailyRecord(userId);

    const stmt = db.prepare(`
      UPDATE usage_records
      SET sessions_count = sessions_count + 1, updated_at = datetime('now')
      WHERE id = ?
    `);
    stmt.run(record.id);
  },

  getUsageHistory(userId: string, days: number = 30): UsageRecord[] {
    const stmt = db.prepare(`
      SELECT * FROM usage_records
      WHERE user_id = ?
      ORDER BY date DESC
      LIMIT ?
    `);
    return stmt.all(userId, days) as UsageRecord[];
  },

  getTotalMinutesThisMonth(userId: string): number {
    const now = new Date();
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];

    const stmt = db.prepare(`
      SELECT COALESCE(SUM(minutes_used), 0) as total
      FROM usage_records
      WHERE user_id = ? AND date >= ?
    `);
    const result = stmt.get(userId, firstDayOfMonth) as { total: number };
    return result.total;
  },
};

export const SessionModel = {
  create(userId: string, mode?: string): PracticeSession {
    const id = uuidv4();
    const started_at = new Date().toISOString();

    const stmt = db.prepare(`
      INSERT INTO practice_sessions (id, user_id, started_at, mode)
      VALUES (?, ?, ?, ?)
    `);
    stmt.run(id, userId, started_at, mode || null);

    // Increment daily session count
    UsageModel.incrementSessionCount(userId);

    return this.findById(id) as PracticeSession;
  },

  findById(id: string): PracticeSession | undefined {
    const stmt = db.prepare('SELECT * FROM practice_sessions WHERE id = ?');
    return stmt.get(id) as PracticeSession | undefined;
  },

  end(id: string, feedback?: boolean): PracticeSession | undefined {
    const session = this.findById(id);
    if (!session) return undefined;

    const ended_at = new Date().toISOString();
    const started = new Date(session.started_at).getTime();
    const ended = new Date(ended_at).getTime();
    const duration_seconds = Math.round((ended - started) / 1000);

    const stmt = db.prepare(`
      UPDATE practice_sessions
      SET ended_at = ?, duration_seconds = ?, feedback = ?
      WHERE id = ?
    `);
    stmt.run(ended_at, duration_seconds, feedback !== undefined ? (feedback ? 1 : 0) : null, id);

    // Add minutes to usage record
    const minutes_used = duration_seconds / 60;
    UsageModel.addMinutes(session.user_id, minutes_used);

    return this.findById(id);
  },

  updateMessageCount(id: string, count: number): void {
    const stmt = db.prepare(`
      UPDATE practice_sessions SET messages_count = ? WHERE id = ?
    `);
    stmt.run(count, id);
  },

  getRecentSessions(userId: string, limit: number = 10): PracticeSession[] {
    const stmt = db.prepare(`
      SELECT * FROM practice_sessions
      WHERE user_id = ?
      ORDER BY started_at DESC
      LIMIT ?
    `);
    return stmt.all(userId, limit) as PracticeSession[];
  },

  getActiveSession(userId: string): PracticeSession | undefined {
    const stmt = db.prepare(`
      SELECT * FROM practice_sessions
      WHERE user_id = ? AND ended_at IS NULL
      ORDER BY started_at DESC
      LIMIT 1
    `);
    return stmt.get(userId) as PracticeSession | undefined;
  },
};

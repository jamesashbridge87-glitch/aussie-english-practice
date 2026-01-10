import { useState, useEffect, useCallback } from 'react';

export type PracticeMode = 'everyday' | 'slang' | 'workplace';

export interface SessionRecord {
  id: string;
  mode: PracticeMode;
  startTime: Date;
  endTime: Date | null;
  duration: number; // in seconds
  messageCount: number;
  feedback: boolean | null;
}

export interface ProgressStats {
  totalSessions: number;
  totalPracticeTime: number; // in seconds
  sessionsThisWeek: number;
  practiceTimeThisWeek: number;
  averageSessionDuration: number;
  modeBreakdown: Record<PracticeMode, number>;
  streak: number; // consecutive days practiced
  lastPracticeDate: Date | null;
}

interface StoredProgress {
  sessions: SessionRecord[];
  studentName: string;
}

const STORAGE_KEY = 'aussie-english-progress';

export function useProgressTracking() {
  const [sessions, setSessions] = useState<SessionRecord[]>([]);
  const [currentSession, setCurrentSession] = useState<SessionRecord | null>(null);
  const [studentName, setStudentName] = useState<string>('');

  // Load from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const data: StoredProgress = JSON.parse(stored);
        setSessions(data.sessions.map(s => ({
          ...s,
          startTime: new Date(s.startTime),
          endTime: s.endTime ? new Date(s.endTime) : null,
        })));
        setStudentName(data.studentName || '');
      } catch (e) {
        console.error('Failed to load progress:', e);
      }
    }
  }, []);

  // Save to localStorage when sessions change
  useEffect(() => {
    const data: StoredProgress = { sessions, studentName };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }, [sessions, studentName]);

  const startSession = useCallback((mode: PracticeMode): SessionRecord => {
    const session: SessionRecord = {
      id: `session-${Date.now()}`,
      mode,
      startTime: new Date(),
      endTime: null,
      duration: 0,
      messageCount: 0,
      feedback: null,
    };
    setCurrentSession(session);
    return session;
  }, []);

  const endSession = useCallback((feedback?: boolean) => {
    if (!currentSession) return;

    const endTime = new Date();
    const duration = Math.round((endTime.getTime() - currentSession.startTime.getTime()) / 1000);

    const completedSession: SessionRecord = {
      ...currentSession,
      endTime,
      duration,
      feedback: feedback ?? null,
    };

    setSessions(prev => [...prev, completedSession]);
    setCurrentSession(null);

    return completedSession;
  }, [currentSession]);

  const incrementMessageCount = useCallback(() => {
    if (!currentSession) return;
    setCurrentSession(prev => prev ? { ...prev, messageCount: prev.messageCount + 1 } : null);
  }, [currentSession]);

  const updateFeedback = useCallback((feedback: boolean) => {
    if (!currentSession) return;
    setCurrentSession(prev => prev ? { ...prev, feedback } : null);
  }, [currentSession]);

  const getStats = useCallback((): ProgressStats => {
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const sessionsThisWeek = sessions.filter(s => new Date(s.startTime) >= weekAgo);
    const practiceTimeThisWeek = sessionsThisWeek.reduce((sum, s) => sum + s.duration, 0);

    const modeBreakdown: Record<PracticeMode, number> = {
      everyday: sessions.filter(s => s.mode === 'everyday').length,
      slang: sessions.filter(s => s.mode === 'slang').length,
      workplace: sessions.filter(s => s.mode === 'workplace').length,
    };

    // Calculate streak
    let streak = 0;
    const sortedSessions = [...sessions].sort(
      (a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime()
    );

    if (sortedSessions.length > 0) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      let checkDate = new Date(today);
      const lastSession = new Date(sortedSessions[0].startTime);
      lastSession.setHours(0, 0, 0, 0);

      // If last session wasn't today or yesterday, streak is 0
      const daysSinceLastSession = Math.floor(
        (today.getTime() - lastSession.getTime()) / (24 * 60 * 60 * 1000)
      );

      if (daysSinceLastSession <= 1) {
        // Start counting streak
        const sessionDates = new Set(
          sortedSessions.map(s => {
            const d = new Date(s.startTime);
            d.setHours(0, 0, 0, 0);
            return d.getTime();
          })
        );

        while (sessionDates.has(checkDate.getTime())) {
          streak++;
          checkDate.setDate(checkDate.getDate() - 1);
        }
      }
    }

    const totalPracticeTime = sessions.reduce((sum, s) => sum + s.duration, 0);

    return {
      totalSessions: sessions.length,
      totalPracticeTime,
      sessionsThisWeek: sessionsThisWeek.length,
      practiceTimeThisWeek,
      averageSessionDuration: sessions.length > 0 ? totalPracticeTime / sessions.length : 0,
      modeBreakdown,
      streak,
      lastPracticeDate: sortedSessions.length > 0 ? new Date(sortedSessions[0].startTime) : null,
    };
  }, [sessions]);

  const clearProgress = useCallback(() => {
    setSessions([]);
    setCurrentSession(null);
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  return {
    sessions,
    currentSession,
    studentName,
    setStudentName,
    startSession,
    endSession,
    incrementMessageCount,
    updateFeedback,
    getStats,
    clearProgress,
  };
}

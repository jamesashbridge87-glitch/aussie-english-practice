import { useState } from 'react';
import { ProgressStats, PracticeMode, SessionRecord } from '../hooks/useProgressTracking';
import { UnlockedAchievement } from '../hooks/useAchievements';
import { AchievementDisplay, AchievementToast, AchievementWithProgress } from './AchievementDisplay';
import { ExportMenu } from './ExportMenu';
import { PronunciationStatsDisplay } from './PronunciationPractice';
import './ProgressDashboard.css';

interface PronunciationOverallStats {
  averageScore: number;
  totalPhrasesPracticed: number;
  bestScore: number;
  recentTrend: number;
  modeAverages: {
    everyday: number;
    slang: number;
    workplace: number;
  };
}

interface ProgressDashboardProps {
  stats: ProgressStats;
  studentName: string;
  sessions: SessionRecord[];
  onNameChange: (name: string) => void;
  onClearProgress: () => void;
  achievements?: AchievementWithProgress[];
  unlockedAchievements?: UnlockedAchievement[];
  newlyUnlockedAchievements?: { id: string; title: string; description: string; icon: string; category: string }[];
  onDismissAchievements?: () => void;
  pronunciationStats?: PronunciationOverallStats;
}

function formatTime(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
  const hours = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  return `${hours}h ${mins}m`;
}

function formatDate(date: Date | null): string {
  if (!date) return 'Never';
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - date.getTime()) / (24 * 60 * 60 * 1000));

  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;

  return date.toLocaleDateString('en-AU', { day: 'numeric', month: 'short' });
}

const modeLabels: Record<PracticeMode, string> = {
  everyday: 'Everyday',
  slang: 'Slang',
  workplace: 'Workplace',
};

type TabType = 'overview' | 'achievements' | 'pronunciation';

export function ProgressDashboard({
  stats,
  studentName,
  sessions,
  onNameChange,
  onClearProgress,
  achievements,
  unlockedAchievements,
  newlyUnlockedAchievements,
  onDismissAchievements,
  pronunciationStats,
}: ProgressDashboardProps) {
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const totalModeCount = stats.modeBreakdown.everyday + stats.modeBreakdown.slang + stats.modeBreakdown.workplace;

  return (
    <div className="progress-dashboard">
      {/* Achievement Toast */}
      {newlyUnlockedAchievements && newlyUnlockedAchievements.length > 0 && onDismissAchievements && (
        <AchievementToast
          achievements={newlyUnlockedAchievements as any}
          onDismiss={onDismissAchievements}
        />
      )}

      <div className="dashboard-header">
        <div className="header-left">
          <h2>Your Progress</h2>
          <div className="student-name-input">
            <input
              type="text"
              value={studentName}
              onChange={(e) => onNameChange(e.target.value)}
              placeholder="Enter your name..."
            />
          </div>
        </div>
        <div className="header-right">
          <ExportMenu
            studentName={studentName}
            sessions={sessions}
            stats={stats}
            unlockedAchievements={unlockedAchievements || []}
            totalAchievements={achievements?.length || 0}
          />
        </div>
      </div>

      {/* Tabs */}
      <div className="dashboard-tabs">
        <button
          className={`tab-btn ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          Overview
        </button>
        <button
          className={`tab-btn ${activeTab === 'achievements' ? 'active' : ''}`}
          onClick={() => setActiveTab('achievements')}
        >
          Achievements
          {unlockedAchievements && achievements && (
            <span className="tab-badge">{unlockedAchievements.length}/{achievements.length}</span>
          )}
        </button>
        <button
          className={`tab-btn ${activeTab === 'pronunciation' ? 'active' : ''}`}
          onClick={() => setActiveTab('pronunciation')}
        >
          Pronunciation
        </button>
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <>
          <div className="stats-grid">
            <div className="stat-card highlight">
              <span className="stat-value">{stats.streak}</span>
              <span className="stat-label">Day Streak 🔥</span>
            </div>

            <div className="stat-card">
              <span className="stat-value">{stats.totalSessions}</span>
              <span className="stat-label">Total Sessions</span>
            </div>

            <div className="stat-card">
              <span className="stat-value">{formatTime(stats.totalPracticeTime)}</span>
              <span className="stat-label">Practice Time</span>
            </div>

            <div className="stat-card">
              <span className="stat-value">{stats.sessionsThisWeek}</span>
              <span className="stat-label">This Week</span>
            </div>
          </div>

          {stats.totalSessions > 0 && (
            <>
              <div className="mode-breakdown">
                <h3>Practice Breakdown</h3>
                <div className="mode-bars">
                  {(Object.keys(stats.modeBreakdown) as PracticeMode[]).map((mode) => {
                    const count = stats.modeBreakdown[mode];
                    const percentage = totalModeCount > 0 ? (count / totalModeCount) * 100 : 0;

                    return (
                      <div key={mode} className="mode-bar-item">
                        <div className="mode-bar-header">
                          <span className="mode-bar-label">{modeLabels[mode]}</span>
                          <span className="mode-bar-count">{count} sessions</span>
                        </div>
                        <div className="mode-bar-track">
                          <div
                            className={`mode-bar-fill ${mode}`}
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="additional-stats">
                <div className="additional-stat">
                  <span className="additional-stat-label">Average session</span>
                  <span className="additional-stat-value">
                    {formatTime(Math.round(stats.averageSessionDuration))}
                  </span>
                </div>
                <div className="additional-stat">
                  <span className="additional-stat-label">Last practice</span>
                  <span className="additional-stat-value">
                    {formatDate(stats.lastPracticeDate)}
                  </span>
                </div>
              </div>
            </>
          )}

          {stats.totalSessions === 0 && (
            <div className="empty-progress">
              <p>No practice sessions yet. Start your first session to track your progress!</p>
            </div>
          )}

          {stats.totalSessions > 0 && (
            <button className="clear-progress-btn" onClick={onClearProgress}>
              Clear Progress
            </button>
          )}
        </>
      )}

      {/* Achievements Tab */}
      {activeTab === 'achievements' && achievements && (
        <AchievementDisplay achievements={achievements} />
      )}

      {/* Pronunciation Tab */}
      {activeTab === 'pronunciation' && pronunciationStats && (
        <PronunciationStatsDisplay stats={pronunciationStats} />
      )}
    </div>
  );
}

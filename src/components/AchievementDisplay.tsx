import { Achievement } from '../hooks/useAchievements';
import './AchievementDisplay.css';

export interface AchievementWithProgress {
  id: string;
  title: string;
  description: string;
  icon: string;
  category: 'streak' | 'sessions' | 'time' | 'modes' | 'special';
  unlocked: boolean;
  unlockedAt?: Date;
  progress?: { current: number; target: number };
}

interface AchievementDisplayProps {
  achievements: AchievementWithProgress[];
}

interface AchievementToastProps {
  achievements: Achievement[];
  onDismiss: () => void;
}

const categoryLabels: Record<string, string> = {
  streak: 'Streak',
  sessions: 'Sessions',
  time: 'Practice Time',
  modes: 'Practice Modes',
  special: 'Special',
};

export function AchievementDisplay({ achievements }: AchievementDisplayProps) {
  const categories = ['streak', 'sessions', 'time', 'modes', 'special'];
  const unlockedCount = achievements.filter(a => a.unlocked).length;

  return (
    <div className="achievement-display">
      <div className="achievement-header">
        <h3>Achievements</h3>
        <span className="achievement-count">
          {unlockedCount} / {achievements.length} unlocked
        </span>
      </div>

      {categories.map(category => {
        const categoryAchievements = achievements.filter(a => a.category === category);
        if (categoryAchievements.length === 0) return null;

        return (
          <div key={category} className="achievement-category">
            <h4>{categoryLabels[category]}</h4>
            <div className="achievement-grid">
              {categoryAchievements.map(achievement => (
                <div
                  key={achievement.id}
                  className={`achievement-card ${achievement.unlocked ? 'unlocked' : 'locked'}`}
                >
                  <div className="achievement-icon">
                    {achievement.unlocked ? achievement.icon : '🔒'}
                  </div>
                  <div className="achievement-info">
                    <span className="achievement-title">{achievement.title}</span>
                    <span className="achievement-description">{achievement.description}</span>
                    {!achievement.unlocked && achievement.progress && (
                      <div className="achievement-progress">
                        <div className="achievement-progress-bar">
                          <div
                            className="achievement-progress-fill"
                            style={{
                              width: `${(achievement.progress.current / achievement.progress.target) * 100}%`,
                            }}
                          />
                        </div>
                        <span className="achievement-progress-text">
                          {formatProgress(achievement.progress.current, achievement.progress.target, achievement.category)}
                        </span>
                      </div>
                    )}
                    {achievement.unlocked && achievement.unlockedAt && (
                      <span className="achievement-date">
                        Unlocked {formatDate(achievement.unlockedAt)}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export function AchievementToast({ achievements, onDismiss }: AchievementToastProps) {
  if (achievements.length === 0) return null;

  return (
    <div className="achievement-toast-overlay" onClick={onDismiss}>
      <div className="achievement-toast" onClick={e => e.stopPropagation()}>
        <div className="toast-header">
          <span className="toast-title">
            {achievements.length === 1 ? 'Achievement Unlocked!' : `${achievements.length} Achievements Unlocked!`}
          </span>
        </div>
        <div className="toast-achievements">
          {achievements.map(achievement => (
            <div key={achievement.id} className="toast-achievement">
              <span className="toast-icon">{achievement.icon}</span>
              <div className="toast-info">
                <span className="toast-achievement-title">{achievement.title}</span>
                <span className="toast-achievement-desc">{achievement.description}</span>
              </div>
            </div>
          ))}
        </div>
        <button className="toast-dismiss" onClick={onDismiss}>
          Awesome!
        </button>
      </div>
    </div>
  );
}

function formatProgress(current: number, target: number, category: string): string {
  if (category === 'time') {
    const formatTime = (seconds: number) => {
      if (seconds < 60) return `${seconds}s`;
      if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
      return `${(seconds / 3600).toFixed(1)}h`;
    };
    return `${formatTime(current)} / ${formatTime(target)}`;
  }
  return `${current} / ${target}`;
}

function formatDate(date: Date): string {
  return date.toLocaleDateString('en-AU', { day: 'numeric', month: 'short' });
}

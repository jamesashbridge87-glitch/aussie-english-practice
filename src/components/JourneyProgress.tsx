import { JourneyProgress, JOURNEY_PHASES } from '../hooks/useJourneyProgress';
import './JourneyProgress.css';

interface JourneyProgressProps {
  progress: JourneyProgress;
}

export function JourneyProgressDisplay({ progress }: JourneyProgressProps) {
  const {
    currentDay,
    currentWeek,
    currentPhase,
    overallProgress,
    daysUntilNextPhase,
    isNewPhase,
    recommendation,
    weeklyGoal,
  } = progress;

  const isStarted = currentDay > 0;

  return (
    <div className="journey-progress">
      {/* Header with current phase */}
      <div className="journey-header">
        <div className="current-phase-badge">
          <span className="phase-icon">{currentPhase.icon}</span>
          <div className="phase-info">
            <span className="phase-label">
              {isStarted ? `Week ${currentWeek} · Day ${currentDay}` : 'Ready to begin'}
            </span>
            <span className="phase-name">{currentPhase.name}</span>
          </div>
        </div>
        {isNewPhase && isStarted && (
          <div className="new-phase-celebration">
            🎉 New phase unlocked!
          </div>
        )}
      </div>

      {/* Phase description */}
      <p className="phase-description">{currentPhase.description}</p>

      {/* Overall 90-day progress bar */}
      <div className="overall-progress">
        <div className="progress-header">
          <span className="progress-label">90-Day Journey</span>
          <span className="progress-value">{Math.round(overallProgress)}%</span>
        </div>
        <div className="progress-track">
          <div
            className="progress-fill"
            style={{ width: `${overallProgress}%` }}
          />
          {/* Phase markers */}
          <div className="phase-markers">
            <div className="phase-marker" style={{ left: '0%' }} title="Week 1" />
            <div className="phase-marker" style={{ left: '15.5%' }} title="Week 3" />
            <div className="phase-marker" style={{ left: '31%' }} title="Week 5" />
            <div className="phase-marker" style={{ left: '62%' }} title="Week 9" />
            <div className="phase-marker" style={{ left: '100%' }} title="Week 12" />
          </div>
        </div>
        <div className="progress-phases">
          {JOURNEY_PHASES.map((phase) => (
            <span
              key={phase.id}
              className={`progress-phase-label ${phase.id === currentPhase.id ? 'active' : ''}`}
            >
              {phase.icon}
            </span>
          ))}
        </div>
      </div>

      {/* Next phase countdown */}
      {daysUntilNextPhase > 0 && currentDay > 0 && (
        <div className="next-phase-countdown">
          <span className="countdown-number">{daysUntilNextPhase}</span>
          <span className="countdown-label">days until next phase</span>
        </div>
      )}

      {/* Weekly goal */}
      <div className="weekly-goal">
        <div className="goal-header">
          <span className="goal-icon">🎯</span>
          <span className="goal-title">This Week's Goal</span>
        </div>
        <p className="goal-text">{weeklyGoal}</p>
      </div>

      {/* Recommendation */}
      <div className="recommendation">
        <div className="recommendation-header">
          <span className="recommendation-icon">💡</span>
          <span className="recommendation-title">Recommendation</span>
        </div>
        <p className="recommendation-text">{recommendation}</p>
      </div>

      {/* Phase tips */}
      <div className="phase-tips">
        <h4>Tips for {currentPhase.name}</h4>
        <ul>
          {currentPhase.tips.map((tip, index) => (
            <li key={index}>{tip}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}

interface JourneyTimelineProps {
  progress: JourneyProgress;
}

export function JourneyTimeline({ progress }: JourneyTimelineProps) {
  const { currentPhase, phaseHistory } = progress;

  return (
    <div className="journey-timeline">
      <h4>Your 90-Day Journey</h4>
      <div className="timeline">
        {JOURNEY_PHASES.map((phase, index) => {
          const historyEntry = phaseHistory.find(h => h.phase.id === phase.id);
          const isCurrentPhase = phase.id === currentPhase.id;
          const isCompleted = historyEntry?.completedAt !== undefined;
          void historyEntry; // Track if phase has been started for future use

          let status: 'completed' | 'current' | 'upcoming' = 'upcoming';
          if (isCompleted) status = 'completed';
          else if (isCurrentPhase) status = 'current';

          return (
            <div key={phase.id} className={`timeline-item ${status}`}>
              <div className="timeline-marker">
                {status === 'completed' ? '✓' : phase.icon}
              </div>
              <div className="timeline-content">
                <div className="timeline-header">
                  <span className="timeline-phase-name">{phase.name}</span>
                  <span className="timeline-weeks">
                    Weeks {phase.weekRange[0]}-{phase.weekRange[1]}
                  </span>
                </div>
                <p className="timeline-description">{phase.description}</p>
                {historyEntry && (
                  <div className="timeline-stats">
                    <span className="timeline-sessions">
                      {historyEntry.sessionsCompleted} sessions
                    </span>
                  </div>
                )}
                {isCurrentPhase && (
                  <div className="timeline-current-badge">You are here</div>
                )}
              </div>
              {index < JOURNEY_PHASES.length - 1 && (
                <div className={`timeline-connector ${status === 'completed' ? 'completed' : ''}`} />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

interface JourneyCompactProps {
  progress: JourneyProgress;
  onClick?: () => void;
}

export function JourneyCompact({ progress, onClick }: JourneyCompactProps) {
  const { currentDay, currentPhase, overallProgress } = progress;
  const isStarted = currentDay > 0;

  return (
    <button className="journey-compact" onClick={onClick}>
      <span className="journey-compact-icon">{currentPhase.icon}</span>
      <div className="journey-compact-info">
        <span className="journey-compact-phase">{currentPhase.name}</span>
        <span className="journey-compact-day">
          {isStarted ? `Day ${currentDay} of 90` : 'Start your journey'}
        </span>
      </div>
      <div className="journey-compact-progress">
        <svg viewBox="0 0 36 36" className="journey-compact-ring">
          <path
            className="ring-bg"
            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
            fill="none"
            stroke="#e5e7eb"
            strokeWidth="3"
          />
          <path
            className="ring-fill"
            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
            fill="none"
            stroke="url(#journeyGradient)"
            strokeWidth="3"
            strokeLinecap="round"
            strokeDasharray={`${overallProgress}, 100`}
          />
          <defs>
            <linearGradient id="journeyGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#10b981" />
              <stop offset="100%" stopColor="#8b5cf6" />
            </linearGradient>
          </defs>
        </svg>
        <span className="journey-compact-percent">{Math.round(overallProgress)}%</span>
      </div>
    </button>
  );
}

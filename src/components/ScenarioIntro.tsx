import { Scenario } from '../data/scenarios';
import './ScenarioIntro.css';

interface ScenarioIntroProps {
  scenario: Scenario;
  onStart: () => void;
  onBack: () => void;
  isLoading?: boolean;
}

export function ScenarioIntro({ scenario, onStart, onBack, isLoading = false }: ScenarioIntroProps) {
  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner': return '#22c55e';
      case 'intermediate': return '#f59e0b';
      case 'advanced': return '#ef4444';
      default: return '#6b7280';
    }
  };

  return (
    <div className="scenario-intro">
      <button className="back-link" onClick={onBack} disabled={isLoading}>
        ← Choose different scenario
      </button>

      <div className="intro-header">
        <span className="intro-icon">{scenario.icon}</span>
        <div>
          <h2>{scenario.title}</h2>
          <div className="intro-meta">
            <span
              className="difficulty-tag"
              style={{ backgroundColor: getDifficultyColor(scenario.difficulty) }}
            >
              {scenario.difficulty}
            </span>
            <span className="duration-tag">~{scenario.durationMinutes} minutes</span>
          </div>
        </div>
      </div>

      <div className="intro-section">
        <h3>The Situation</h3>
        <p>{scenario.setting}</p>
      </div>

      <div className="intro-roles">
        <div className="role-box">
          <span className="role-label">You are:</span>
          <span className="role-value">{scenario.yourRole}</span>
        </div>
        <div className="role-box">
          <span className="role-label">Speaking with:</span>
          <span className="role-value">{scenario.callerName} ({scenario.theirRole})</span>
        </div>
      </div>

      <div className="intro-section">
        <h3>Your Goals</h3>
        <ul className="goals-list">
          {scenario.goals.map((goal, index) => (
            <li key={index}>{goal}</li>
          ))}
        </ul>
      </div>

      <div className="intro-section vocab-section">
        <h3>Vocab You Might Hear</h3>
        <div className="vocab-grid">
          {scenario.vocabPreview.map((item, index) => (
            <div key={index} className="vocab-item">
              <span className="vocab-term">"{item.term}"</span>
              <span className="vocab-meaning">{item.meaning}</span>
              {item.example && (
                <span className="vocab-example">e.g., "{item.example}"</span>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="intro-section tip-section">
        <h3>Cultural Tip</h3>
        <p className="cultural-tip">{scenario.culturalTip}</p>
      </div>

      <button
        className="start-scenario-btn"
        onClick={onStart}
        disabled={isLoading}
      >
        {isLoading ? 'Connecting...' : 'Start Conversation'}
      </button>
    </div>
  );
}

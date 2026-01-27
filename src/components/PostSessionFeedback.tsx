import { useState, useEffect } from 'react';
import { Scenario } from '../data/scenarios';
import { getRandomEncouragement, getScenarioTip } from '../data/feedbackMessages';
import './PostSessionFeedback.css';

export type SessionFeeling = 'great' | 'okay' | 'tough';

interface PostSessionFeedbackProps {
  scenario: Scenario;
  onComplete: (feeling: SessionFeeling) => void;
  onSelectScenario: (scenario: Scenario) => void;
  recommendedScenario?: Scenario | null;
}

export function PostSessionFeedback({
  scenario,
  onComplete,
  onSelectScenario,
  recommendedScenario,
}: PostSessionFeedbackProps) {
  const [step, setStep] = useState<'feeling' | 'feedback' | 'next'>('feeling');
  const [feeling, setFeeling] = useState<SessionFeeling | null>(null);
  const [encouragement, setEncouragement] = useState('');
  const [tip, setTip] = useState('');

  useEffect(() => {
    if (feeling) {
      setEncouragement(getRandomEncouragement(feeling));
      setTip(getScenarioTip(scenario.id));
    }
  }, [feeling, scenario.id]);

  const handleFeelingSelect = (selectedFeeling: SessionFeeling) => {
    setFeeling(selectedFeeling);
    setStep('feedback');
  };

  const handleContinue = () => {
    setStep('next');
  };

  const handleDone = () => {
    if (feeling) {
      onComplete(feeling);
    }
  };

  const handleRepeat = () => {
    if (feeling) {
      onComplete(feeling);
      onSelectScenario(scenario);
    }
  };

  const handleTryRecommended = () => {
    if (feeling && recommendedScenario) {
      onComplete(feeling);
      onSelectScenario(recommendedScenario);
    }
  };

  return (
    <div className="post-session-overlay">
      <div className="post-session-modal">
        {step === 'feeling' && (
          <div className="feedback-step feeling-step">
            <div className="step-icon">{scenario.icon}</div>
            <h2>Session Complete!</h2>
            <p className="scenario-name">{scenario.title}</p>
            <p className="feeling-question">How did that feel?</p>

            <div className="feeling-buttons">
              <button
                className="feeling-btn great"
                onClick={() => handleFeelingSelect('great')}
              >
                <span className="feeling-emoji">😊</span>
                <span className="feeling-label">Great</span>
                <span className="feeling-desc">I felt confident</span>
              </button>

              <button
                className="feeling-btn okay"
                onClick={() => handleFeelingSelect('okay')}
              >
                <span className="feeling-emoji">😐</span>
                <span className="feeling-label">Okay</span>
                <span className="feeling-desc">Getting there</span>
              </button>

              <button
                className="feeling-btn tough"
                onClick={() => handleFeelingSelect('tough')}
              >
                <span className="feeling-emoji">😓</span>
                <span className="feeling-label">Tough</span>
                <span className="feeling-desc">Found it hard</span>
              </button>
            </div>
          </div>
        )}

        {step === 'feedback' && feeling && (
          <div className="feedback-step encouragement-step">
            <div className="encouragement-icon">
              {feeling === 'great' ? '🌟' : feeling === 'okay' ? '💪' : '🤗'}
            </div>

            <p className="encouragement-message">{encouragement}</p>

            <div className="tip-box">
              <span className="tip-icon">💡</span>
              <p className="tip-text">{tip}</p>
            </div>

            <button className="continue-btn" onClick={handleContinue}>
              Continue
            </button>
          </div>
        )}

        {step === 'next' && feeling && (
          <div className="feedback-step next-step">
            <h2>What's next?</h2>

            <div className="next-options">
              <button className="next-option repeat" onClick={handleRepeat}>
                <span className="option-icon">🔄</span>
                <div className="option-content">
                  <span className="option-title">Practice again</span>
                  <span className="option-desc">Repeat {scenario.title}</span>
                </div>
              </button>

              {recommendedScenario && (
                <button className="next-option recommended" onClick={handleTryRecommended}>
                  <span className="option-icon">{recommendedScenario.icon}</span>
                  <div className="option-content">
                    <span className="option-title">Try something new</span>
                    <span className="option-desc">{recommendedScenario.title}</span>
                  </div>
                  <span className="recommended-badge">Recommended</span>
                </button>
              )}

              <button className="next-option browse" onClick={handleDone}>
                <span className="option-icon">📋</span>
                <div className="option-content">
                  <span className="option-title">Browse scenarios</span>
                  <span className="option-desc">See all practice options</span>
                </div>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default PostSessionFeedback;

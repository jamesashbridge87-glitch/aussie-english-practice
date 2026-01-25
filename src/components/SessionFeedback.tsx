import { useState } from 'react';
import './SessionFeedback.css';

interface SessionFeedbackProps {
  sessionDuration: number;
  messageCount: number;
  scenarioTitle?: string;
  onSubmit: (feedback: SessionFeedbackData) => void;
  onSkip: () => void;
}

export interface SessionFeedbackData {
  overallRating: number;
  wouldRecommend: boolean;
  helpfulAspects: string[];
  improvementAreas: string[];
  difficulty: 'too-easy' | 'just-right' | 'too-hard' | null;
  comments: string;
}

const HELPFUL_OPTIONS = [
  { id: 'vocabulary', label: 'New vocabulary', icon: '📚' },
  { id: 'pronunciation', label: 'Pronunciation practice', icon: '🗣️' },
  { id: 'confidence', label: 'Built confidence', icon: '💪' },
  { id: 'cultural', label: 'Cultural insights', icon: '🦘' },
  { id: 'realistic', label: 'Realistic scenarios', icon: '🎭' },
  { id: 'feedback', label: 'Helpful feedback', icon: '💡' },
];

const IMPROVEMENT_OPTIONS = [
  { id: 'speed', label: 'Speaking pace', icon: '⏱️' },
  { id: 'clarity', label: 'Audio clarity', icon: '🔊' },
  { id: 'variety', label: 'More variety', icon: '🎲' },
  { id: 'difficulty', label: 'Difficulty level', icon: '📊' },
  { id: 'longer', label: 'Longer sessions', icon: '⏳' },
  { id: 'hints', label: 'More hints', icon: '❓' },
];

function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  if (mins === 0) return `${secs}s`;
  return `${mins}m ${secs}s`;
}

export function SessionFeedback({
  sessionDuration,
  messageCount,
  scenarioTitle,
  onSubmit,
  onSkip,
}: SessionFeedbackProps) {
  const [step, setStep] = useState(1);
  const [rating, setRating] = useState(0);
  const [wouldRecommend, setWouldRecommend] = useState<boolean | null>(null);
  const [helpfulAspects, setHelpfulAspects] = useState<string[]>([]);
  const [improvementAreas, setImprovementAreas] = useState<string[]>([]);
  const [difficulty, setDifficulty] = useState<'too-easy' | 'just-right' | 'too-hard' | null>(null);
  const [comments, setComments] = useState('');

  const handleToggleHelpful = (id: string) => {
    setHelpfulAspects(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const handleToggleImprovement = (id: string) => {
    setImprovementAreas(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const handleSubmit = () => {
    onSubmit({
      overallRating: rating,
      wouldRecommend: wouldRecommend ?? true,
      helpfulAspects,
      improvementAreas,
      difficulty,
      comments,
    });
  };

  const canProceed = () => {
    switch (step) {
      case 1: return rating > 0;
      case 2: return true; // Optional
      case 3: return true; // Optional
      default: return true;
    }
  };

  return (
    <div className="session-feedback">
      <div className="feedback-header">
        <h2>Session Complete! 🎉</h2>
        <div className="session-summary">
          {scenarioTitle && <span className="summary-item">{scenarioTitle}</span>}
          <span className="summary-item">⏱️ {formatDuration(sessionDuration)}</span>
          <span className="summary-item">💬 {messageCount} messages</span>
        </div>
      </div>

      <div className="feedback-progress">
        <div className={`progress-dot ${step >= 1 ? 'active' : ''}`} />
        <div className={`progress-line ${step >= 2 ? 'active' : ''}`} />
        <div className={`progress-dot ${step >= 2 ? 'active' : ''}`} />
        <div className={`progress-line ${step >= 3 ? 'active' : ''}`} />
        <div className={`progress-dot ${step >= 3 ? 'active' : ''}`} />
      </div>

      {/* Step 1: Overall Rating */}
      {step === 1 && (
        <div className="feedback-step">
          <h3>How was your practice session?</h3>
          <div className="star-rating">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                className={`star-btn ${rating >= star ? 'active' : ''}`}
                onClick={() => setRating(star)}
                aria-label={`Rate ${star} stars`}
              >
                <span className="star">{rating >= star ? '★' : '☆'}</span>
              </button>
            ))}
          </div>
          <p className="rating-label">
            {rating === 0 && 'Tap to rate'}
            {rating === 1 && 'Needs work'}
            {rating === 2 && 'Could be better'}
            {rating === 3 && 'Pretty good'}
            {rating === 4 && 'Great session!'}
            {rating === 5 && 'Ripper! Loved it!'}
          </p>

          <div className="difficulty-section">
            <p className="section-label">How was the difficulty?</p>
            <div className="difficulty-options">
              <button
                className={`difficulty-btn ${difficulty === 'too-easy' ? 'active' : ''}`}
                onClick={() => setDifficulty('too-easy')}
              >
                Too Easy
              </button>
              <button
                className={`difficulty-btn ${difficulty === 'just-right' ? 'active' : ''}`}
                onClick={() => setDifficulty('just-right')}
              >
                Just Right
              </button>
              <button
                className={`difficulty-btn ${difficulty === 'too-hard' ? 'active' : ''}`}
                onClick={() => setDifficulty('too-hard')}
              >
                Too Hard
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Step 2: What was helpful */}
      {step === 2 && (
        <div className="feedback-step">
          <h3>What did you find helpful?</h3>
          <p className="step-subtitle">Select all that apply (optional)</p>
          <div className="option-grid">
            {HELPFUL_OPTIONS.map((option) => (
              <button
                key={option.id}
                className={`option-btn ${helpfulAspects.includes(option.id) ? 'active' : ''}`}
                onClick={() => handleToggleHelpful(option.id)}
              >
                <span className="option-icon">{option.icon}</span>
                <span className="option-label">{option.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Step 3: Improvements and final thoughts */}
      {step === 3 && (
        <div className="feedback-step">
          <h3>How can we improve?</h3>
          <p className="step-subtitle">Select any areas for improvement (optional)</p>
          <div className="option-grid">
            {IMPROVEMENT_OPTIONS.map((option) => (
              <button
                key={option.id}
                className={`option-btn ${improvementAreas.includes(option.id) ? 'active' : ''}`}
                onClick={() => handleToggleImprovement(option.id)}
              >
                <span className="option-icon">{option.icon}</span>
                <span className="option-label">{option.label}</span>
              </button>
            ))}
          </div>

          <div className="recommend-section">
            <p className="section-label">Would you recommend this to a mate?</p>
            <div className="recommend-options">
              <button
                className={`recommend-btn ${wouldRecommend === true ? 'active' : ''}`}
                onClick={() => setWouldRecommend(true)}
              >
                👍 Yeah, definitely!
              </button>
              <button
                className={`recommend-btn ${wouldRecommend === false ? 'active' : ''}`}
                onClick={() => setWouldRecommend(false)}
              >
                👎 Not really
              </button>
            </div>
          </div>

          <div className="comments-section">
            <label htmlFor="comments" className="section-label">Any other thoughts?</label>
            <textarea
              id="comments"
              value={comments}
              onChange={(e) => setComments(e.target.value)}
              placeholder="Share your feedback... (optional)"
              rows={3}
            />
          </div>
        </div>
      )}

      <div className="feedback-actions">
        {step > 1 && (
          <button className="action-btn secondary" onClick={() => setStep(step - 1)}>
            Back
          </button>
        )}
        {step < 3 ? (
          <>
            <button
              className="action-btn primary"
              onClick={() => setStep(step + 1)}
              disabled={!canProceed()}
            >
              Continue
            </button>
            <button className="action-btn skip" onClick={onSkip}>
              Skip feedback
            </button>
          </>
        ) : (
          <button className="action-btn primary" onClick={handleSubmit}>
            Submit Feedback
          </button>
        )}
      </div>
    </div>
  );
}

export default SessionFeedback;

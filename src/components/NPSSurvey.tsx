import { useState, useEffect } from 'react';
import './NPSSurvey.css';

interface NPSSurveyProps {
  onComplete: (score: number, feedback?: string) => void;
  onDismiss: () => void;
}

// NPS Survey shown monthly to collect feedback
export function NPSSurvey({ onComplete, onDismiss }: NPSSurveyProps) {
  const [step, setStep] = useState<'score' | 'feedback' | 'thanks'>('score');
  const [score, setScore] = useState<number | null>(null);
  const [feedback, setFeedback] = useState('');
  const [isLeaving, setIsLeaving] = useState(false);

  const handleScoreSelect = (selectedScore: number) => {
    setScore(selectedScore);
    setStep('feedback');
  };

  const handleSubmit = () => {
    if (score !== null) {
      onComplete(score, feedback.trim() || undefined);
      setStep('thanks');
    }
  };

  const handleSkip = () => {
    if (score !== null) {
      onComplete(score);
      setStep('thanks');
    }
  };

  const handleClose = () => {
    setIsLeaving(true);
    setTimeout(() => {
      onDismiss();
    }, 300);
  };

  const getFeedbackPrompt = () => {
    if (score === null) return '';
    if (score >= 9) return "What do you love most about SpeakAussie?";
    if (score >= 7) return "What would make SpeakAussie even better?";
    return "What could we do to improve your experience?";
  };

  return (
    <div className={`nps-overlay ${isLeaving ? 'leaving' : ''}`}>
      <div className="nps-modal">
        <button className="nps-close" onClick={handleClose}>
          ×
        </button>

        {step === 'score' && (
          <div className="nps-content">
            <div className="nps-header">
              <span className="nps-emoji">🇦🇺</span>
              <h2>Quick question!</h2>
            </div>

            <p className="nps-question">
              How likely are you to recommend SpeakAussie to a friend or colleague?
            </p>

            <div className="nps-scale">
              <div className="nps-scores">
                {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(num => (
                  <button
                    key={num}
                    className={`nps-score-btn ${score === num ? 'selected' : ''}`}
                    onClick={() => handleScoreSelect(num)}
                  >
                    {num}
                  </button>
                ))}
              </div>
              <div className="nps-labels">
                <span>Not likely</span>
                <span>Very likely</span>
              </div>
            </div>
          </div>
        )}

        {step === 'feedback' && score !== null && (
          <div className="nps-content">
            <div className="nps-score-badge">
              You selected: <strong>{score}</strong>
            </div>

            <p className="nps-feedback-prompt">{getFeedbackPrompt()}</p>

            <textarea
              className="nps-feedback-input"
              value={feedback}
              onChange={e => setFeedback(e.target.value)}
              placeholder="Your feedback helps us improve..."
              rows={4}
              autoFocus
            />

            <div className="nps-actions">
              <button className="nps-skip" onClick={handleSkip}>
                Skip
              </button>
              <button className="nps-submit" onClick={handleSubmit}>
                Submit
              </button>
            </div>
          </div>
        )}

        {step === 'thanks' && (
          <div className="nps-content nps-thanks">
            <div className="thanks-emoji">🙏</div>
            <h2>Thanks for your feedback!</h2>
            <p>Your input helps us make SpeakAussie better for everyone.</p>
            <button className="nps-done" onClick={handleClose}>
              Done
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// Hook to manage NPS survey timing
const NPS_STORAGE_KEY = 'speakaussie_nps';
const NPS_INTERVAL_DAYS = 30; // Show survey every 30 days
const MIN_SESSIONS_BEFORE_NPS = 5; // Require at least 5 sessions before showing

interface NPSData {
  lastShown: string | null;
  responses: Array<{
    score: number;
    feedback?: string;
    timestamp: string;
  }>;
}

export function useNPSSurvey(sessionCount: number) {
  const [shouldShow, setShouldShow] = useState(false);

  useEffect(() => {
    const data: NPSData = JSON.parse(
      localStorage.getItem(NPS_STORAGE_KEY) || '{"lastShown":null,"responses":[]}'
    );

    // Don't show if not enough sessions
    if (sessionCount < MIN_SESSIONS_BEFORE_NPS) {
      return;
    }

    // Check if enough time has passed since last survey
    if (data.lastShown) {
      const lastShownDate = new Date(data.lastShown);
      const daysSince = (Date.now() - lastShownDate.getTime()) / (1000 * 60 * 60 * 24);
      if (daysSince < NPS_INTERVAL_DAYS) {
        return;
      }
    }

    // Show survey after a short delay (don't interrupt immediately)
    const timer = setTimeout(() => {
      setShouldShow(true);
    }, 2000);

    return () => clearTimeout(timer);
  }, [sessionCount]);

  const recordResponse = (score: number, feedback?: string) => {
    const data: NPSData = JSON.parse(
      localStorage.getItem(NPS_STORAGE_KEY) || '{"lastShown":null,"responses":[]}'
    );

    data.lastShown = new Date().toISOString();
    data.responses.push({
      score,
      feedback,
      timestamp: new Date().toISOString(),
    });

    localStorage.setItem(NPS_STORAGE_KEY, JSON.stringify(data));
    setShouldShow(false);
  };

  const dismiss = () => {
    const data: NPSData = JSON.parse(
      localStorage.getItem(NPS_STORAGE_KEY) || '{"lastShown":null,"responses":[]}'
    );

    // Mark as shown even if dismissed, but wait less time before asking again
    data.lastShown = new Date().toISOString();
    localStorage.setItem(NPS_STORAGE_KEY, JSON.stringify(data));
    setShouldShow(false);
  };

  return { shouldShow, recordResponse, dismiss };
}

export default NPSSurvey;

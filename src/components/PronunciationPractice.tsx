import { useState, useEffect, useCallback } from 'react';
import { PracticeMode } from '../hooks/useProgressTracking';
import { PronunciationScore, usePronunciationScoring } from '../hooks/usePronunciationScoring';
import { useSpeechRecognition } from '../hooks/useSpeechRecognition';
import './PronunciationPractice.css';

interface PronunciationPracticeProps {
  mode: PracticeMode;
  isSessionActive: boolean;
  onScoreUpdate?: (score: PronunciationScore) => void;
}

export function PronunciationPractice({
  mode,
  isSessionActive,
  onScoreUpdate,
}: PronunciationPracticeProps) {
  const {
    currentPhrase,
    currentSessionScores,
    isScoring,
    startPronunciationPractice,
    submitPronunciationWithSpeech,
    getNextPhrase,
  } = usePronunciationScoring();

  const [lastScore, setLastScore] = useState<PronunciationScore | null>(null);
  const [showScore, setShowScore] = useState(false);
  const [isPracticing, setIsPracticing] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordedTranscript, setRecordedTranscript] = useState('');
  const [recordingConfidence, setRecordingConfidence] = useState(0);

  const handleSpeechResult = useCallback((result: { transcript: string; confidence: number; isFinal: boolean }) => {
    setRecordedTranscript(result.transcript);
    if (result.confidence > 0) {
      setRecordingConfidence(result.confidence);
    }
  }, []);

  const handleSpeechEnd = useCallback(() => {
    setIsRecording(false);
  }, []);

  const handleSpeechError = useCallback((error: string) => {
    console.error('Speech recognition error:', error);
    setIsRecording(false);
  }, []);

  const {
    isSupported,
    transcript,
    confidence,
    error: speechError,
    startListening,
    stopListening,
    resetTranscript,
  } = useSpeechRecognition({
    language: 'en-AU',
    continuous: false,
    interimResults: true,
    onResult: handleSpeechResult,
    onEnd: handleSpeechEnd,
    onError: handleSpeechError,
  });

  // Reset when session ends
  useEffect(() => {
    if (!isSessionActive) {
      setIsPracticing(false);
      setLastScore(null);
      setShowScore(false);
      setIsRecording(false);
      setRecordedTranscript('');
      stopListening();
    }
  }, [isSessionActive, stopListening]);

  // Update transcript from speech recognition
  useEffect(() => {
    if (transcript) {
      setRecordedTranscript(transcript);
    }
    if (confidence > 0) {
      setRecordingConfidence(confidence);
    }
  }, [transcript, confidence]);

  const handleStartPractice = () => {
    startPronunciationPractice(mode);
    setIsPracticing(true);
    setShowScore(false);
    setLastScore(null);
    setRecordedTranscript('');
    setRecordingConfidence(0);
  };

  const handleStartRecording = () => {
    setRecordedTranscript('');
    setRecordingConfidence(0);
    resetTranscript();
    startListening();
    setIsRecording(true);
  };

  const handleStopRecording = () => {
    stopListening();
    setIsRecording(false);
  };

  const handleSubmit = () => {
    if (!recordedTranscript.trim()) {
      return;
    }

    const score = submitPronunciationWithSpeech(
      recordedTranscript,
      recordingConfidence || 0.7, // Default confidence if not available
      mode
    );

    if (score) {
      setLastScore(score);
      setShowScore(true);
      onScoreUpdate?.(score);
    }
  };

  const handleNextPhrase = () => {
    getNextPhrase(mode);
    setShowScore(false);
    setLastScore(null);
    setRecordedTranscript('');
    setRecordingConfidence(0);
    resetTranscript();
  };

  const handleStopPractice = () => {
    setIsPracticing(false);
    setShowScore(false);
    setLastScore(null);
    setRecordedTranscript('');
    stopListening();
  };

  if (!isSessionActive) {
    return null;
  }

  const averageScore = currentSessionScores.length > 0
    ? Math.round(currentSessionScores.reduce((sum, s) => sum + s.overall, 0) / currentSessionScores.length)
    : 0;

  return (
    <div className="pronunciation-practice">
      <div className="pronunciation-header">
        <h3>Pronunciation Practice</h3>
        {currentSessionScores.length > 0 && (
          <div className="session-average">
            Session avg: <span className={getScoreClass(averageScore)}>{averageScore}</span>
          </div>
        )}
      </div>

      {!isSupported && (
        <div className="speech-not-supported">
          Speech recognition is not supported in your browser. Try using Chrome or Edge.
        </div>
      )}

      {speechError && (
        <div className="speech-error">
          {speechError}
        </div>
      )}

      {!isPracticing ? (
        <button
          className="start-practice-btn"
          onClick={handleStartPractice}
          disabled={!isSupported}
        >
          Start Pronunciation Practice
        </button>
      ) : (
        <div className="practice-area">
          {currentPhrase && !showScore && (
            <div className="phrase-display">
              <span className="phrase-label">Say this phrase:</span>
              <p className="phrase-text">"{currentPhrase.text}"</p>
              <p className="phrase-hint">Pronunciation: {currentPhrase.hint}</p>

              {/* Recording section */}
              <div className="recording-section">
                {!isRecording && !recordedTranscript && (
                  <button
                    className="record-btn"
                    onClick={handleStartRecording}
                    disabled={!isSupported}
                  >
                    <span className="record-icon">🎤</span>
                    Tap to Record
                  </button>
                )}

                {isRecording && (
                  <div className="recording-active">
                    <div className="recording-indicator">
                      <span className="pulse-dot"></span>
                      <span>Listening...</span>
                    </div>
                    <div className="live-transcript">
                      {recordedTranscript || 'Start speaking...'}
                    </div>
                    <button
                      className="stop-record-btn"
                      onClick={handleStopRecording}
                    >
                      Stop Recording
                    </button>
                  </div>
                )}

                {!isRecording && recordedTranscript && (
                  <div className="recorded-result">
                    <span className="recorded-label">You said:</span>
                    <p className="recorded-text">"{recordedTranscript}"</p>
                    <div className="recorded-actions">
                      <button
                        className="submit-btn"
                        onClick={handleSubmit}
                        disabled={isScoring}
                      >
                        {isScoring ? 'Analyzing...' : 'Check Score'}
                      </button>
                      <button
                        className="retry-btn"
                        onClick={handleStartRecording}
                      >
                        Try Again
                      </button>
                    </div>
                  </div>
                )}
              </div>

              <div className="phrase-actions">
                <button className="skip-btn" onClick={handleNextPhrase}>
                  Skip Phrase
                </button>
              </div>
            </div>
          )}

          {showScore && lastScore && (
            <div className="score-display">
              <div className="score-header">
                <span className="score-label">Your Score</span>
                <span className={`overall-score ${getScoreClass(lastScore.overall)}`}>
                  {lastScore.overall}
                </span>
              </div>

              {/* What you said vs target */}
              <div className="comparison-section">
                <div className="comparison-item">
                  <span className="comparison-label">Target:</span>
                  <span className="comparison-text">{lastScore.phrase}</span>
                </div>
                <div className="comparison-item">
                  <span className="comparison-label">You said:</span>
                  <span className="comparison-text spoken">{lastScore.spokenText || recordedTranscript}</span>
                </div>
              </div>

              <div className="score-breakdown">
                <ScoreBar label="Accuracy" value={lastScore.accuracy || 0} />
                <ScoreBar label="Clarity" value={lastScore.clarity} />
                <ScoreBar label="Fluency" value={lastScore.fluency} />
                <ScoreBar label="Aussie Accent" value={lastScore.aussieAccent} />
              </div>

              <div className="score-feedback">
                <p className="main-feedback">{lastScore.feedback}</p>
                {lastScore.detailedFeedback && lastScore.detailedFeedback.length > 0 && (
                  <ul className="detailed-feedback">
                    {lastScore.detailedFeedback.map((item, i) => (
                      <li key={i}>{item}</li>
                    ))}
                  </ul>
                )}
              </div>

              <div className="score-actions">
                <button className="next-btn" onClick={handleNextPhrase}>
                  Next Phrase
                </button>
                <button className="stop-practice-btn" onClick={handleStopPractice}>
                  Stop Practice
                </button>
              </div>
            </div>
          )}

          {currentSessionScores.length > 0 && (
            <div className="practice-progress">
              <span>Phrases practiced: {currentSessionScores.length}</span>
              <div className="mini-scores">
                {currentSessionScores.slice(-5).map((score, i) => (
                  <span key={i} className={`mini-score ${getScoreClass(score.overall)}`}>
                    {score.overall}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

interface ScoreBarProps {
  label: string;
  value: number;
}

function ScoreBar({ label, value }: ScoreBarProps) {
  return (
    <div className="score-bar-item">
      <div className="score-bar-header">
        <span className="score-bar-label">{label}</span>
        <span className={`score-bar-value ${getScoreClass(value)}`}>{value}</span>
      </div>
      <div className="score-bar-track">
        <div
          className={`score-bar-fill ${getScoreClass(value)}`}
          style={{ width: `${value}%` }}
        />
      </div>
    </div>
  );
}

function getScoreClass(score: number): string {
  if (score >= 85) return 'excellent';
  if (score >= 70) return 'good';
  if (score >= 50) return 'average';
  return 'needs-work';
}

export interface PronunciationStats {
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

interface PronunciationStatsProps {
  stats: PronunciationStats;
}

export function PronunciationStatsDisplay({ stats }: PronunciationStatsProps) {
  if (stats.totalPhrasesPracticed === 0) {
    return (
      <div className="pronunciation-stats empty">
        <p>No pronunciation practice data yet. Start practicing to see your stats!</p>
      </div>
    );
  }

  return (
    <div className="pronunciation-stats">
      <h3>Pronunciation Performance</h3>

      <div className="stats-overview">
        <div className="stat-item">
          <span className={`stat-value ${getScoreClass(stats.averageScore)}`}>
            {stats.averageScore}
          </span>
          <span className="stat-label">Average Score</span>
        </div>
        <div className="stat-item">
          <span className="stat-value">{stats.totalPhrasesPracticed}</span>
          <span className="stat-label">Phrases Practiced</span>
        </div>
        <div className="stat-item">
          <span className={`stat-value ${getScoreClass(stats.bestScore)}`}>
            {stats.bestScore}
          </span>
          <span className="stat-label">Best Score</span>
        </div>
        <div className="stat-item">
          <span className={`stat-value ${stats.recentTrend >= 0 ? 'positive' : 'negative'}`}>
            {stats.recentTrend >= 0 ? '+' : ''}{stats.recentTrend}
          </span>
          <span className="stat-label">Recent Trend</span>
        </div>
      </div>

      <div className="mode-scores">
        <h4>Scores by Mode</h4>
        <div className="mode-score-bars">
          <div className="mode-score-item">
            <span className="mode-label">Everyday</span>
            <div className="mode-bar">
              <div
                className={`mode-bar-fill ${getScoreClass(stats.modeAverages.everyday)}`}
                style={{ width: `${stats.modeAverages.everyday}%` }}
              />
            </div>
            <span className="mode-value">{stats.modeAverages.everyday || '-'}</span>
          </div>
          <div className="mode-score-item">
            <span className="mode-label">Slang</span>
            <div className="mode-bar">
              <div
                className={`mode-bar-fill ${getScoreClass(stats.modeAverages.slang)}`}
                style={{ width: `${stats.modeAverages.slang}%` }}
              />
            </div>
            <span className="mode-value">{stats.modeAverages.slang || '-'}</span>
          </div>
          <div className="mode-score-item">
            <span className="mode-label">Workplace</span>
            <div className="mode-bar">
              <div
                className={`mode-bar-fill ${getScoreClass(stats.modeAverages.workplace)}`}
                style={{ width: `${stats.modeAverages.workplace}%` }}
              />
            </div>
            <span className="mode-value">{stats.modeAverages.workplace || '-'}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

import { useState, useCallback, useEffect, useRef } from 'react';
import { useFishAudioConversation, PracticeMode } from '../hooks/useFishAudioConversation';
import { useProgressTracking } from '../hooks/useProgressTracking';
import { useAchievements } from '../hooks/useAchievements';
import { usePronunciationScoring } from '../hooks/usePronunciationScoring';
import { useAuth } from '../hooks/useAuth';
import { useSubscription } from '../hooks/useSubscription';
import { useAnonymousUsage } from '../hooks/useAnonymousUsage';
import { PracticeModeSelector } from './PracticeModeSelector';
import { ProgressDashboard } from './ProgressDashboard';
import { AudioVisualizer } from './AudioVisualizer';
import { AuthModal } from './AuthModal';
import { UserMenu } from './UserMenu';
import { UsageBadge } from './UsageBadge';
import { SubscriptionPlans } from './SubscriptionPlans';
import { SessionTimer } from './SessionTimer';
import './AussieEnglishPractice.css';

interface Message {
  role: 'user' | 'agent';
  content: string;
  timestamp: Date;
}

export function AussieEnglishPractice() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isSessionActive, setIsSessionActive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [textInput, setTextInput] = useState('');
  const [selectedMode, setSelectedMode] = useState<PracticeMode>('everyday');
  const [showProgress, setShowProgress] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showPlans, setShowPlans] = useState(false);
  const [sessionRemainingMinutes, setSessionRemainingMinutes] = useState(0);
  const backendSessionId = useRef<string | null>(null);
  const anonymousSessionStart = useRef<number | null>(null);

  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const {
    usage,
    checkCanStartSession,
    startBackendSession,
    recordSessionUsage,
    refreshUsage,
  } = useSubscription();
  const {
    remainingMinutes: anonRemainingMinutes,
    canStartSession: canStartAnonSession,
    endSessionTracking: endAnonSessionTracking,
  } = useAnonymousUsage();

  const {
    sessions,
    currentSession,
    studentName,
    setStudentName,
    startSession: startTracking,
    endSession: endTracking,
    incrementMessageCount,
    getStats,
    clearProgress,
  } = useProgressTracking();

  const {
    unlockedAchievements,
    newlyUnlocked,
    checkAchievements,
    dismissNewlyUnlocked,
    getAchievementProgress,
    clearAchievements,
  } = useAchievements();

  const {
    finalizeSessionScores,
    getOverallStats: getPronunciationStats,
    clearPronunciationData,
  } = usePronunciationScoring();

  const conversation = useFishAudioConversation({
    onConnect: () => {
      console.log('Connected to Fish Audio Conversation');
      setError(null);
    },
    onDisconnect: () => {
      console.log('Disconnected from conversation');
      setIsSessionActive(false);
    },
    onMessage: (message) => {
      if (message.source === 'user' && message.message) {
        setMessages((prev) => [
          ...prev,
          { role: 'user', content: message.message, timestamp: new Date() },
        ]);
        incrementMessageCount();
      } else if (message.source === 'ai' && message.message) {
        setMessages((prev) => [
          ...prev,
          { role: 'agent', content: message.message, timestamp: new Date() },
        ]);
      }
    },
    onError: (error) => {
      console.error('Conversation error:', error);
      setError('Connection error. Please try again.');
    },
  });

  const {
    status,
    isSpeaking,
    isListening,
    isProcessing,
    getInputByteFrequencyData,
    getOutputByteFrequencyData,
    startRecording,
    stopRecording,
  } = conversation;

  // Check achievements when stats change
  const stats = getStats();
  useEffect(() => {
    checkAchievements(stats);
  }, [stats, checkAchievements]);

  const requestMicrophonePermission = async (): Promise<boolean> => {
    try {
      await navigator.mediaDevices.getUserMedia({ audio: true });
      return true;
    } catch {
      setError('Microphone access is required for voice practice. Please allow microphone access and try again.');
      return false;
    }
  };

  const startSession = async () => {
    // Check usage limits based on authentication status
    if (isAuthenticated) {
      // Logged-in user: check backend usage limits
      const canStart = await checkCanStartSession();
      if (!canStart.allowed) {
        setError(canStart.message || 'Cannot start session');
        setShowPlans(true);
        return;
      }
      setSessionRemainingMinutes(canStart.remaining || 0);
    } else {
      // Anonymous user: check localStorage usage limits
      const anonCheck = canStartAnonSession();
      if (!anonCheck.allowed) {
        setError(anonCheck.message || 'Cannot start session');
        setShowPlans(true);
        return;
      }
      setSessionRemainingMinutes(anonCheck.remaining || 0);
      anonymousSessionStart.current = Date.now();
    }

    const hasPermission = await requestMicrophonePermission();
    if (!hasPermission) return;

    try {
      setError(null);
      setMessages([]);

      // Start backend session for tracking (only for logged-in users)
      if (isAuthenticated) {
        const sessionId = await startBackendSession(selectedMode);
        backendSessionId.current = sessionId;
      }

      await conversation.startSession({
        mode: selectedMode,
      });

      startTracking(selectedMode);
      setIsSessionActive(true);
    } catch (err) {
      console.error('Failed to start session:', err);
      setError('Failed to start practice session. Please try again.');
    }
  };

  const endSession = async (feedback?: boolean) => {
    try {
      await conversation.endSession();

      // Finalize pronunciation scores if any
      if (currentSession) {
        finalizeSessionScores(currentSession.id, selectedMode);
      }

      // Record usage based on authentication status
      if (isAuthenticated && backendSessionId.current) {
        await recordSessionUsage(
          backendSessionId.current,
          feedback,
          messages.filter(m => m.role === 'user').length
        );
        backendSessionId.current = null;
        refreshUsage();
      } else if (anonymousSessionStart.current) {
        // Track anonymous usage in localStorage
        endAnonSessionTracking(anonymousSessionStart.current);
        anonymousSessionStart.current = null;
        // Show plans after anonymous session ends
        setShowPlans(true);
      }

      endTracking(feedback);
      setIsSessionActive(false);
    } catch (err) {
      console.error('Failed to end session:', err);
    }
  };

  const handleFeedback = (positive: boolean) => {
    conversation.sendFeedback(positive);
    endSession(positive);
  };

  const handleTimeUp = useCallback(() => {
    // Auto-end session when time runs out
    endSession();
  }, []);

  const handleSendText = () => {
    if (textInput.trim()) {
      conversation.sendUserMessage(textInput);
      setTextInput('');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendText();
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTextInput(e.target.value);
    if (isSessionActive) {
      conversation.sendUserActivity();
    }
  };

  const getInputFrequencyData = useCallback((): Uint8Array | null => {
    try {
      return getInputByteFrequencyData() ?? null;
    } catch {
      return null;
    }
  }, [getInputByteFrequencyData]);

  const getOutputFrequencyData = useCallback((): Uint8Array | null => {
    try {
      return getOutputByteFrequencyData() ?? null;
    } catch {
      return null;
    }
  }, [getOutputByteFrequencyData]);

  const handleClearProgress = () => {
    if (window.confirm('Are you sure you want to clear all your progress? This cannot be undone.')) {
      clearProgress();
      clearAchievements();
      clearPronunciationData();
    }
  };

  if (authLoading) {
    return (
      <div className="aussie-practice-container">
        <div className="loading-state">Loading...</div>
      </div>
    );
  }

  return (
    <div className="aussie-practice-container">
      <header className="practice-header">
        <div className="header-top">
          <div className="header-brand">
            <img src={`${import.meta.env.BASE_URL}logo.png`} alt="Your Aussie Uncle" className="header-logo" />
            <h1>SpeakAussie</h1>
          </div>
          <div className="header-actions">
            {isAuthenticated ? (
              <UserMenu onShowPlans={() => setShowPlans(true)} />
            ) : (
              <button
                className="login-btn"
                onClick={() => setShowAuthModal(true)}
              >
                Log In
              </button>
            )}
          </div>
        </div>
        <p>Practice your Australian English with a native speaker</p>
        <button
          className="toggle-progress-btn"
          onClick={() => setShowProgress(!showProgress)}
        >
          {showProgress ? 'Hide Progress' : 'Show Progress'}
        </button>
      </header>

      {showProgress && (
        <ProgressDashboard
          stats={stats}
          studentName={studentName}
          sessions={sessions}
          onNameChange={setStudentName}
          onClearProgress={handleClearProgress}
          achievements={getAchievementProgress(stats)}
          unlockedAchievements={unlockedAchievements}
          newlyUnlockedAchievements={newlyUnlocked}
          onDismissAchievements={dismissNewlyUnlocked}
          pronunciationStats={getPronunciationStats()}
        />
      )}

      {showPlans && (
        <div className="plans-modal-overlay" onClick={() => setShowPlans(false)}>
          <div className="plans-modal" onClick={e => e.stopPropagation()}>
            <button className="plans-modal-close" onClick={() => setShowPlans(false)}>
              &times;
            </button>
            <SubscriptionPlans onAuthRequired={() => setShowAuthModal(true)} />
          </div>
        </div>
      )}

      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      {!isSessionActive ? (
        <div className="start-section">
          <div className="instructions">
            <h2>G'day, mate!</h2>
            <p>Ready to practice your Aussie English? Choose a mode and start a voice conversation with Your Aussie Uncle!</p>
          </div>

          {isAuthenticated && usage ? (
            <UsageBadge onUpgradeClick={() => setShowPlans(true)} />
          ) : !isAuthenticated && (
            <div className="anonymous-usage-badge">
              <span className="usage-time">{anonRemainingMinutes} min</span>
              <span className="usage-label">free today</span>
            </div>
          )}

          <PracticeModeSelector
            selectedMode={selectedMode}
            onSelectMode={setSelectedMode}
          />

          <button
            className="start-button pulse-animation"
            onClick={startSession}
          >
            Start Practising Now
          </button>
          <p className="button-subtitle">Chat with Your Aussie Uncle</p>
        </div>
      ) : (
        <div className="session-section">
          {/* Session Timer */}
          <SessionTimer
            remainingMinutes={sessionRemainingMinutes}
            isActive={isSessionActive}
            onTimeUp={handleTimeUp}
            warningThresholdSeconds={10}
          />

          <div className="session-mode-badge">
            {selectedMode === 'everyday' && 'Everyday English'}
            {selectedMode === 'slang' && 'Aussie Slang'}
            {selectedMode === 'workplace' && 'Workplace English'}
          </div>

          {/* Audio Visualizer */}
          <AudioVisualizer
            getInputFrequencyData={getInputFrequencyData}
            getOutputFrequencyData={getOutputFrequencyData}
            isActive={status === 'connected'}
            isSpeaking={isSpeaking}
          />

          {/* Status indicator */}
          <div className="status-bar">
            <div className={`status-indicator ${status}`}>
              <span className="status-dot"></span>
              {status === 'connected' ? 'Connected' : 'Connecting...'}
            </div>
            {currentSession && (
              <div className="session-timer">
                Session #{(stats.totalSessions + 1)}
              </div>
            )}
          </div>

          {/* Conversation display */}
          <div className="conversation-display">
            {messages.length === 0 ? (
              <div className="empty-state">
                Hold the microphone button and speak to begin the conversation...
              </div>
            ) : (
              messages.map((msg, index) => (
                <div key={index} className={`message ${msg.role}`}>
                  <span className="message-role">
                    {msg.role === 'user' ? 'You' : 'Teacher'}
                  </span>
                  <p className="message-content">{msg.content}</p>
                </div>
              ))
            )}
          </div>

          {/* Push-to-talk button */}
          <div className="voice-input-section">
            <button
              className={`push-to-talk-btn ${isListening ? 'recording' : ''} ${isProcessing ? 'processing' : ''}`}
              onMouseDown={() => !isProcessing && !isSpeaking && startRecording()}
              onMouseUp={() => isListening && stopRecording()}
              onMouseLeave={() => isListening && stopRecording()}
              onTouchStart={() => !isProcessing && !isSpeaking && startRecording()}
              onTouchEnd={() => isListening && stopRecording()}
              disabled={isProcessing || isSpeaking}
            >
              {isProcessing ? (
                <span>Processing...</span>
              ) : isListening ? (
                <span>Release to Send</span>
              ) : isSpeaking ? (
                <span>Listening to Teacher...</span>
              ) : (
                <span>Hold to Speak</span>
              )}
            </button>
            {isListening && (
              <div className="recording-indicator">Recording...</div>
            )}
          </div>

          {/* Text input option */}
          <div className="text-input-section">
            <input
              type="text"
              value={textInput}
              onChange={handleInputChange}
              onKeyPress={handleKeyPress}
              placeholder="Or type your message here..."
              className="text-input"
            />
            <button
              onClick={handleSendText}
              className="send-button"
              disabled={!textInput.trim()}
            >
              Send
            </button>
          </div>

          {/* Session controls */}
          <div className="session-controls">
            <button
              className="end-button"
              onClick={() => endSession()}
            >
              End Session
            </button>
          </div>

          {/* Feedback section */}
          <div className="feedback-section">
            <span>How was this session?</span>
            <button onClick={() => handleFeedback(true)}>Good</button>
            <button onClick={() => handleFeedback(false)}>Needs work</button>
          </div>
        </div>
      )}

      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
      />
    </div>
  );
}

export default AussieEnglishPractice;

import { useState, useCallback, useEffect, useRef } from 'react';
import { useElevenLabsConversation } from '../hooks/useElevenLabsConversation';
import { useProgressTracking } from '../hooks/useProgressTracking';
import { useAchievements } from '../hooks/useAchievements';
import { usePronunciationScoring } from '../hooks/usePronunciationScoring';
import { useAuth } from '../hooks/useAuth';
import { useSubscription } from '../hooks/useSubscription';
import { useAnonymousUsage } from '../hooks/useAnonymousUsage';
import { ScenarioSelector } from './ScenarioSelector';
import { ScenarioIntro } from './ScenarioIntro';
import CustomScenarioForm from './CustomScenarioForm';
import { ProgressDashboard } from './ProgressDashboard';
import { AudioVisualizer } from './AudioVisualizer';
import { AuthModal } from './AuthModal';
import { UserMenu } from './UserMenu';
import { UsageBadge } from './UsageBadge';
import { SubscriptionPlans } from './SubscriptionPlans';
import { SessionTimer } from './SessionTimer';
import { SessionTranscript, TranscriptMessage } from './SessionTranscript';
import { Scenario, getCategoryInfo, CustomScenarioInput, createCustomScenario } from '../data/scenarios';
import './AussieEnglishPractice.css';

type ViewState = 'selector' | 'intro' | 'session' | 'custom-form';

export function AussieEnglishPractice() {
  const [messages, setMessages] = useState<TranscriptMessage[]>([]);
  const [viewState, setViewState] = useState<ViewState>('selector');
  const messageIdCounter = useRef(0);
  const [selectedScenario, setSelectedScenario] = useState<Scenario | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showProgress, setShowProgress] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showPlans, setShowPlans] = useState(false);
  const [sessionRemainingMinutes, setSessionRemainingMinutes] = useState(0);
  const [isStarting, setIsStarting] = useState(false);
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

  const conversation = useElevenLabsConversation({
    onConnect: () => {
      console.log('Connected to ElevenLabs conversation');
      setError(null);
    },
    onDisconnect: () => {
      console.log('Disconnected from conversation');
      setViewState('selector');
      setSelectedScenario(null);
    },
    onMessage: (message) => {
      if (message.source === 'user' && message.message) {
        messageIdCounter.current += 1;
        setMessages((prev) => [
          ...prev,
          {
            id: `msg-${messageIdCounter.current}`,
            role: 'user',
            content: message.message,
            timestamp: new Date()
          },
        ]);
        incrementMessageCount();
      } else if (message.source === 'ai' && message.message) {
        messageIdCounter.current += 1;
        setMessages((prev) => [
          ...prev,
          {
            id: `msg-${messageIdCounter.current}`,
            role: 'agent',
            content: message.message,
            timestamp: new Date()
          },
        ]);
      }
    },
    onError: (error) => {
      console.error('Conversation error:', error);
      setError('Connection error. Please try again.');
      setIsStarting(false);
    },
  });

  const {
    status,
    isSpeaking,
    isListening,
    isMuted,
    getInputByteFrequencyData,
    getOutputByteFrequencyData,
    toggleMute,
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

  const handleSelectScenario = (scenario: Scenario) => {
    setSelectedScenario(scenario);
    setViewState('intro');
    setError(null);
  };

  const handleSelectCustom = () => {
    setViewState('custom-form');
    setError(null);
  };

  const handleCustomFormSubmit = (input: CustomScenarioInput) => {
    const customScenario = createCustomScenario(input);
    setSelectedScenario(customScenario);
    setViewState('intro');
  };

  const handleBackToSelector = () => {
    setSelectedScenario(null);
    setViewState('selector');
  };

  const startSession = async () => {
    if (!selectedScenario) return;

    // Check usage limits based on authentication status
    if (isAuthenticated) {
      const canStart = await checkCanStartSession();
      if (!canStart.allowed) {
        setError(canStart.message || 'Cannot start session');
        setShowPlans(true);
        return;
      }
      setSessionRemainingMinutes(canStart.remaining || 0);
    } else {
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
      setIsStarting(true);
      setError(null);
      setMessages([]);

      // Start backend session for tracking (only for logged-in users)
      if (isAuthenticated) {
        const sessionId = await startBackendSession(selectedScenario.category);
        backendSessionId.current = sessionId;
      }

      await conversation.startSession({
        scenario: selectedScenario,
      });

      startTracking(selectedScenario.category as 'everyday' | 'slang' | 'workplace');
      setViewState('session');
      setIsStarting(false);
    } catch (err) {
      console.error('Failed to start session:', err);
      setError('Failed to start practice session. Please try again.');
      setIsStarting(false);
    }
  };

  const endSession = async (feedback?: boolean) => {
    try {
      await conversation.endSession();

      // Finalize pronunciation scores if any
      if (currentSession && selectedScenario) {
        finalizeSessionScores(currentSession.id, selectedScenario.category as 'everyday' | 'slang' | 'workplace');
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
        endAnonSessionTracking(anonymousSessionStart.current);
        anonymousSessionStart.current = null;
        setShowPlans(true);
      }

      endTracking(feedback);
      setViewState('selector');
      setSelectedScenario(null);
    } catch (err) {
      console.error('Failed to end session:', err);
    }
  };

  const handleFeedback = (positive: boolean) => {
    conversation.sendFeedback(positive);
    endSession(positive);
  };

  const handleTimeUp = useCallback(() => {
    endSession();
  }, []);

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

  const categoryInfo = selectedScenario ? getCategoryInfo(selectedScenario.category) : null;

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
        <p>Master Australian workplace English</p>
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

      {viewState === 'selector' && (
        <div className="start-section">
          <div className="instructions">
            <h2>G'day, mate!</h2>
            <p>Choose a scenario to practice your Australian workplace English. From job interviews to Friday drinks - we've got you covered!</p>
          </div>

          {isAuthenticated && usage ? (
            <UsageBadge onUpgradeClick={() => setShowPlans(true)} />
          ) : !isAuthenticated && (
            <div className="anonymous-usage-badge">
              <span className="usage-time">{anonRemainingMinutes} min</span>
              <span className="usage-label">free today</span>
            </div>
          )}

          <ScenarioSelector
            onSelectScenario={handleSelectScenario}
            onSelectCustom={handleSelectCustom}
          />
        </div>
      )}

      {viewState === 'custom-form' && (
        <CustomScenarioForm
          onSubmit={handleCustomFormSubmit}
          onBack={handleBackToSelector}
        />
      )}

      {viewState === 'intro' && selectedScenario && (
        <ScenarioIntro
          scenario={selectedScenario}
          onStart={startSession}
          onBack={handleBackToSelector}
          isLoading={isStarting}
        />
      )}

      {viewState === 'session' && selectedScenario && (
        <div className="session-section">
          {/* Session Timer */}
          <SessionTimer
            remainingMinutes={sessionRemainingMinutes}
            isActive={viewState === 'session'}
            onTimeUp={handleTimeUp}
            warningThresholdSeconds={10}
          />

          <div className="session-mode-badge">
            <span className="scenario-badge-icon">{selectedScenario.icon}</span>
            <span>{selectedScenario.title}</span>
            {categoryInfo && (
              <span className="category-badge">{categoryInfo.title}</span>
            )}
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

          {/* Enhanced Conversation Transcript */}
          <SessionTranscript
            messages={messages}
            agentName={selectedScenario.theirRole}
            userName={studentName || 'You'}
            isSpeaking={isSpeaking}
            isListening={isListening}
            isConnected={status === 'connected'}
            highlightSlang={true}
          />

          {/* Voice controls */}
          <div className="voice-input-section">
            <button
              className={`mute-btn ${isMuted ? 'muted' : ''}`}
              onClick={toggleMute}
              aria-label={isMuted ? 'Unmute microphone' : 'Mute microphone'}
            >
              {isMuted ? (
                <>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="1" y1="1" x2="23" y2="23" />
                    <path d="M9 9v3a3 3 0 0 0 5.12 2.12M15 9.34V4a3 3 0 0 0-5.94-.6" />
                    <path d="M17 16.95A7 7 0 0 1 5 12v-2m14 0v2a7 7 0 0 1-.11 1.23" />
                    <line x1="12" y1="19" x2="12" y2="23" />
                    <line x1="8" y1="23" x2="16" y2="23" />
                  </svg>
                  Unmute
                </>
              ) : (
                <>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
                    <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                    <line x1="12" y1="19" x2="12" y2="23" />
                    <line x1="8" y1="23" x2="16" y2="23" />
                  </svg>
                  Mute
                </>
              )}
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

import { useState, useCallback, useEffect, useRef } from 'react';
import { useElevenLabsConversation } from '../hooks/useElevenLabsConversation';
import { useProgressTracking } from '../hooks/useProgressTracking';
import { useAchievements } from '../hooks/useAchievements';
import { usePronunciationScoring } from '../hooks/usePronunciationScoring';
import { useAuth } from '../hooks/useAuth';
import { useSubscription } from '../hooks/useSubscription';
import { useAnonymousUsage } from '../hooks/useAnonymousUsage';
import { useJourneyProgress } from '../hooks/useJourneyProgress';
import { useOnboarding } from '../hooks/useOnboarding';
import { useScenarioRecommendations, getDailyRecommendation } from '../hooks/useScenarioRecommendations';
import { ScenarioSelector } from './ScenarioSelector';
import { JourneyCompact } from './JourneyProgress';
import { OnboardingFlow } from './OnboardingFlow';
import { CelebrationToast, useCelebrations, CELEBRATIONS } from './CelebrationToast';
import { ScenarioIntro } from './ScenarioIntro';
import { ProgressDashboard } from './ProgressDashboard';
import { CultureModuleViewer } from './CultureModuleViewer';
import { AudioVisualizer } from './AudioVisualizer';
import { AuthModal } from './AuthModal';
import { UserMenu } from './UserMenu';
import { UsageBadge } from './UsageBadge';
import { SubscriptionPlans } from './SubscriptionPlans';
import { SessionTimer } from './SessionTimer';
import { PostSessionFeedback, SessionFeeling } from './PostSessionFeedback';
import { FeedbackButton } from './FeedbackButton';
import { NPSSurvey, useNPSSurvey } from './NPSSurvey';
import { Scenario, getCategoryInfo, scenarios } from '../data/scenarios';
import './AussieEnglishPractice.css';

interface Message {
  role: 'user' | 'agent';
  content: string;
  timestamp: Date;
}

type ViewState = 'selector' | 'intro' | 'session';

export function AussieEnglishPractice() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [viewState, setViewState] = useState<ViewState>('selector');
  const [selectedScenario, setSelectedScenario] = useState<Scenario | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showProgress, setShowProgress] = useState(false);
  const [showCultureGuide, setShowCultureGuide] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showPlans, setShowPlans] = useState(false);
  const [sessionRemainingMinutes, setSessionRemainingMinutes] = useState(0);
  const [isStarting, setIsStarting] = useState(false);
  const [showPostSessionFeedback, setShowPostSessionFeedback] = useState(false);
  const [completedScenario, setCompletedScenario] = useState<Scenario | null>(null);
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

  // Track 90-day journey progress
  const journeyProgress = useJourneyProgress(sessions);

  // Onboarding and recommendations
  const {
    onboardingData,
    needsOnboarding,
    completeOnboarding,
    markFirstSessionCompleted,
  } = useOnboarding();

  const recommendations = useScenarioRecommendations(onboardingData, sessions);
  const dailyRecommendation = getDailyRecommendation(recommendations, onboardingData);

  // Celebrations
  const { currentCelebration, showCelebration, dismissCelebration } = useCelebrations();

  // NPS Survey (shows monthly after 5+ sessions)
  const stats = getStats();
  const { shouldShow: shouldShowNPS, recordResponse: recordNPSResponse, dismiss: dismissNPS } = useNPSSurvey(stats.totalSessions);

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

  const endSession = async (feedback?: boolean, skipFeedbackFlow?: boolean) => {
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
      }

      endTracking(feedback);

      // Mark first session completed for onboarding and show celebration
      if (!onboardingData.firstSessionCompleted) {
        markFirstSessionCompleted();
        showCelebration(CELEBRATIONS.firstSession());
      } else {
        // Check for session milestones (5, 25, 50, 100)
        const newSessionCount = sessions.length + 1;
        if ([5, 25, 50, 100].includes(newSessionCount)) {
          showCelebration(CELEBRATIONS.sessionMilestone(newSessionCount));
        }
      }

      // Show post-session feedback flow instead of going directly to selector
      if (!skipFeedbackFlow && selectedScenario) {
        setCompletedScenario(selectedScenario);
        setShowPostSessionFeedback(true);
      }

      setViewState('selector');
      setSelectedScenario(null);
    } catch (err) {
      console.error('Failed to end session:', err);
    }
  };

  // Handle post-session feedback completion
  const handlePostSessionComplete = (_feeling: SessionFeeling) => {
    setShowPostSessionFeedback(false);
    setCompletedScenario(null);
    // Show subscription prompt for anonymous users after session feedback
    // Note: feeling can be used for analytics in the future
    if (!isAuthenticated) {
      setShowPlans(true);
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
        <p>Speak with confidence at work</p>
        <div className="header-toggles">
          <button
            className="toggle-progress-btn"
            onClick={() => { setShowProgress(!showProgress); setShowCultureGuide(false); }}
          >
            {showProgress ? 'Hide Progress' : 'Show Progress'}
          </button>
          <button
            className="toggle-culture-btn"
            onClick={() => { setShowCultureGuide(!showCultureGuide); setShowProgress(false); }}
          >
            {showCultureGuide ? 'Hide Culture Guide' : 'Culture Guide'}
          </button>
        </div>
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

      {showCultureGuide && (
        <div className="culture-guide-section">
          <CultureModuleViewer
            onSelectScenario={(scenarioId) => {
              const scenario = scenarios.find((s) => s.id === scenarioId);
              if (scenario) {
                setShowCultureGuide(false);
                handleSelectScenario(scenario);
              }
            }}
          />
        </div>
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
            <p>Practice real conversations. Build real confidence. From interviews to Friday drinks - we've got you covered!</p>
          </div>

          <div className="status-badges">
            {isAuthenticated && usage ? (
              <UsageBadge onUpgradeClick={() => setShowPlans(true)} />
            ) : !isAuthenticated && (
              <div className="anonymous-usage-badge">
                <span className="usage-time">{anonRemainingMinutes} min</span>
                <span className="usage-label">free today</span>
              </div>
            )}
            <JourneyCompact
              progress={journeyProgress}
              onClick={() => setShowProgress(true)}
            />
          </div>

          {/* Daily recommendation */}
          {dailyRecommendation && (
            <div className="daily-recommendation">
              <div className="recommendation-header">
                <span className="recommendation-badge">Recommended for you</span>
              </div>
              <button
                className="recommendation-card"
                onClick={() => handleSelectScenario(dailyRecommendation.scenario)}
              >
                <span className="recommendation-icon">{dailyRecommendation.scenario.icon}</span>
                <div className="recommendation-content">
                  <span className="recommendation-title">{dailyRecommendation.scenario.title}</span>
                  <span className="recommendation-reason">{dailyRecommendation.reason}</span>
                </div>
                <span className="recommendation-arrow">→</span>
              </button>
            </div>
          )}

          <ScenarioSelector onSelectScenario={handleSelectScenario} />
        </div>
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

          {/* Conversation display */}
          <div className="conversation-display">
            {messages.length === 0 ? (
              <div className="empty-state">
                Just start speaking - the conversation will begin!
              </div>
            ) : (
              messages.map((msg, index) => (
                <div key={index} className={`message ${msg.role}`}>
                  <span className="message-role">
                    {msg.role === 'user' ? 'You' : selectedScenario.theirRole}
                  </span>
                  <p className="message-content">{msg.content}</p>
                </div>
              ))
            )}
          </div>

          {/* Voice controls */}
          <div className="voice-input-section">
            <div className="real-time-indicator">
              {isSpeaking ? (
                <span className="speaking-indicator">{selectedScenario.theirRole} is speaking...</span>
              ) : isListening ? (
                <span className="listening-indicator">Listening to you...</span>
              ) : (
                <span className="ready-indicator">Ready - just start talking!</span>
              )}
            </div>
            <button
              className={`mute-btn ${isMuted ? 'muted' : ''}`}
              onClick={toggleMute}
            >
              {isMuted ? 'Unmute' : 'Mute'}
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

      {/* Onboarding flow for new users */}
      {needsOnboarding && !authLoading && (
        <OnboardingFlow
          onComplete={(exp, goal, comfort, name) => {
            completeOnboarding(exp, goal, comfort, name);
            if (name) setStudentName(name);
          }}
          onSkip={() => completeOnboarding('settling-in', 'all-of-above', 'getting-there')}
        />
      )}

      {/* Celebration toast */}
      <CelebrationToast
        celebration={currentCelebration}
        onDismiss={dismissCelebration}
      />

      {/* Post-session feedback flow */}
      {showPostSessionFeedback && completedScenario && (
        <PostSessionFeedback
          scenario={completedScenario}
          onComplete={handlePostSessionComplete}
          onSelectScenario={handleSelectScenario}
          recommendedScenario={recommendations[0]?.scenario || null}
        />
      )}

      {/* In-app feedback button */}
      <FeedbackButton />

      {/* NPS Survey (monthly) */}
      {shouldShowNPS && (
        <NPSSurvey
          onComplete={recordNPSResponse}
          onDismiss={dismissNPS}
        />
      )}
    </div>
  );
}

export default AussieEnglishPractice;

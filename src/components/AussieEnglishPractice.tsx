import { useConversation } from '@elevenlabs/react';
import { useState, useCallback, useEffect } from 'react';
import { useProgressTracking, PracticeMode } from '../hooks/useProgressTracking';
import { useAchievements } from '../hooks/useAchievements';
import { usePronunciationScoring } from '../hooks/usePronunciationScoring';
import { PracticeModeSelector, modePrompts } from './PracticeModeSelector';
import { ProgressDashboard } from './ProgressDashboard';
import { AudioVisualizer } from './AudioVisualizer';
import { PronunciationPractice } from './PronunciationPractice';
import './AussieEnglishPractice.css';

interface Message {
  role: 'user' | 'agent';
  content: string;
  timestamp: Date;
}

const modeFirstMessages: Record<PracticeMode, string> = {
  everyday: "G'day! Ready to practice some everyday Aussie English? What would you like to chat about today?",
  slang: "G'day mate! Ready to learn some fair dinkum Aussie slang? No worries, I'll help you sound like a true blue Aussie in no time!",
  workplace: "Good morning! Ready to practice professional Australian English for the workplace? Let's make sure you're prepared for your Aussie work environment.",
};

export function AussieEnglishPractice() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isSessionActive, setIsSessionActive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [textInput, setTextInput] = useState('');
  const [selectedMode, setSelectedMode] = useState<PracticeMode>('everyday');
  const [showProgress, setShowProgress] = useState(false);

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
    achievements,
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

  const conversation = useConversation({
    onConnect: () => {
      console.log('Connected to Aussie English Practice Agent');
      setError(null);
    },
    onDisconnect: () => {
      console.log('Disconnected from agent');
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

  const { status, isSpeaking, getInputByteFrequencyData, getOutputByteFrequencyData } = conversation;

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
    const hasPermission = await requestMicrophonePermission();
    if (!hasPermission) return;

    try {
      setError(null);
      setMessages([]);

      await conversation.startSession({
        agentId: 'g50Lc7IzLlbPiRpgNXQJ',
        connectionType: 'webrtc',
        overrides: {
          agent: {
            prompt: {
              prompt: modePrompts[selectedMode],
            },
            firstMessage: modeFirstMessages[selectedMode],
          },
        },
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

  const getInputFrequencyData = useCallback(() => {
    try {
      return getInputByteFrequencyData();
    } catch {
      return null;
    }
  }, [getInputByteFrequencyData]);

  const getOutputFrequencyData = useCallback(() => {
    try {
      return getOutputByteFrequencyData();
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

  return (
    <div className="aussie-practice-container">
      <header className="practice-header">
        <h1>Aussie English Practice</h1>
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

      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      {!isSessionActive ? (
        <div className="start-section">
          <div className="instructions">
            <h2>G'day, mate!</h2>
            <p>Ready to practice your Aussie English? Choose a mode and start a voice conversation.</p>
          </div>

          <PracticeModeSelector
            selectedMode={selectedMode}
            onSelectMode={setSelectedMode}
          />

          <button
            className="start-button"
            onClick={startSession}
          >
            Start Practice Session
          </button>
        </div>
      ) : (
        <div className="session-section">
          <div className="session-mode-badge">
            {selectedMode === 'everyday' && '🏠 Everyday English'}
            {selectedMode === 'slang' && '🦘 Aussie Slang'}
            {selectedMode === 'workplace' && '💼 Workplace English'}
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
                Start speaking to begin the conversation...
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

          {/* Pronunciation Practice */}
          <PronunciationPractice
            mode={selectedMode}
            isSessionActive={isSessionActive}
          />

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
            <button onClick={() => handleFeedback(true)}>👍 Good</button>
            <button onClick={() => handleFeedback(false)}>👎 Needs work</button>
          </div>
        </div>
      )}
    </div>
  );
}

export default AussieEnglishPractice;

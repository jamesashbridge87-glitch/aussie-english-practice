import { useState, useCallback, useMemo } from 'react';
import { slangData, categories, categoryNames, difficulties, difficultyNames, SlangCategory, SlangDifficulty } from '../../data/slangData';
import { useTextToSpeech } from '../../hooks/useTextToSpeech';
import { useGamification } from '../../hooks/useGamification';
import { useVoicePractice } from '../../hooks/useVoicePractice';
import { useSoundEffects } from '../../hooks/useSoundEffects';
import './SlangFlashcards.css';

export function SlangFlashcards() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<SlangCategory | 'all'>('all');
  const [selectedDifficulty, setSelectedDifficulty] = useState<SlangDifficulty | 'all'>('all');
  const [showVoicePractice, setShowVoicePractice] = useState(false);

  const { speak, isSpeaking, isSupported: ttsSupported } = useTextToSpeech();
  const { recordCardView, toggleFavorite, isFavorite } = useGamification();
  const { playFlip } = useSoundEffects();
  const {
    isSupported: voiceSupported,
    isListening,
    transcript,
    result,
    error,
    startListening,
    stopListening,
    reset: resetVoice,
  } = useVoicePractice();

  const filteredCards = useMemo(() => {
    let cards = slangData;
    if (selectedCategory !== 'all') {
      cards = cards.filter((card) => card.category === selectedCategory);
    }
    if (selectedDifficulty !== 'all') {
      cards = cards.filter((card) => card.difficulty === selectedDifficulty);
    }
    return cards;
  }, [selectedCategory, selectedDifficulty]);

  const currentCard = filteredCards[currentIndex];

  const flipCard = useCallback(() => {
    setIsFlipped((prev) => {
      if (!prev) {
        recordCardView();
        playFlip();
      }
      return !prev;
    });
  }, [recordCardView, playFlip]);

  const nextCard = useCallback(() => {
    setIsFlipped(false);
    setShowVoicePractice(false);
    resetVoice();
    setCurrentIndex((prev) => (prev + 1) % filteredCards.length);
  }, [filteredCards.length, resetVoice]);

  const prevCard = useCallback(() => {
    setIsFlipped(false);
    setShowVoicePractice(false);
    resetVoice();
    setCurrentIndex((prev) => (prev - 1 + filteredCards.length) % filteredCards.length);
  }, [filteredCards.length, resetVoice]);

  const handleCategoryChange = (category: SlangCategory | 'all') => {
    setSelectedCategory(category);
    setCurrentIndex(0);
    setIsFlipped(false);
    setShowVoicePractice(false);
    resetVoice();
  };

  const handleDifficultyChange = (difficulty: SlangDifficulty | 'all') => {
    setSelectedDifficulty(difficulty);
    setCurrentIndex(0);
    setIsFlipped(false);
    setShowVoicePractice(false);
    resetVoice();
  };

  const handleSpeak = (e: React.MouseEvent, text: string) => {
    e.stopPropagation();
    speak(text);
  };

  const handleFavorite = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (currentCard) {
      toggleFavorite(currentCard.id);
    }
  };

  const handleVoicePractice = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isListening) {
      stopListening();
    } else {
      setShowVoicePractice(true);
      startListening(currentCard.term);
    }
  };

  const getDifficultyColor = (difficulty: SlangDifficulty) => {
    switch (difficulty) {
      case 'beginner': return '#22c55e';
      case 'intermediate': return '#f59e0b';
      case 'advanced': return '#ef4444';
    }
  };

  const getFeedbackMessage = () => {
    if (!result) return null;
    switch (result.feedback) {
      case 'perfect': return { text: 'Perfect!', color: '#22c55e' };
      case 'excellent': return { text: 'Excellent!', color: '#22c55e' };
      case 'good': return { text: 'Good job!', color: '#22c55e' };
      case 'close': return { text: 'Close! Try again.', color: '#f59e0b' };
      case 'partial': return { text: 'Partial match', color: '#f59e0b' };
      case 'tryagain': return { text: 'Try again!', color: '#ef4444' };
      case 'different': return { text: 'Not quite right', color: '#ef4444' };
    }
  };

  if (filteredCards.length === 0) {
    return (
      <div className="slang-flashcards">
        <p>No cards available for this filter combination.</p>
        <button onClick={() => { handleCategoryChange('all'); handleDifficultyChange('all'); }}>
          Reset Filters
        </button>
      </div>
    );
  }

  const feedback = getFeedbackMessage();

  return (
    <div className="slang-flashcards">
      <div className="flashcard-filters">
        <div className="filter-group">
          <select
            value={selectedCategory}
            onChange={(e) => handleCategoryChange(e.target.value as SlangCategory | 'all')}
            className="filter-select"
          >
            <option value="all">All Categories</option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {categoryNames[cat]}
              </option>
            ))}
          </select>
          <select
            value={selectedDifficulty}
            onChange={(e) => handleDifficultyChange(e.target.value as SlangDifficulty | 'all')}
            className="filter-select"
          >
            <option value="all">All Levels</option>
            {difficulties.map((diff) => (
              <option key={diff} value={diff}>
                {difficultyNames[diff]}
              </option>
            ))}
          </select>
        </div>
        <span className="card-counter">
          Card {currentIndex + 1} of {filteredCards.length}
        </span>
      </div>

      <div className="flashcard-container" onClick={flipCard}>
        <div className={`flashcard ${isFlipped ? 'flipped' : ''}`}>
          <div className="flashcard-inner">
            <div className="flashcard-front">
              <span
                className="difficulty-badge"
                style={{ backgroundColor: getDifficultyColor(currentCard.difficulty) }}
              >
                {difficultyNames[currentCard.difficulty]}
              </span>
              <span className="term">{currentCard.term}</span>

              {/* Favorite button */}
              <button
                className={`favorite-btn ${isFavorite(currentCard.id) ? 'active' : ''}`}
                onClick={handleFavorite}
                aria-label={isFavorite(currentCard.id) ? 'Remove from favorites' : 'Add to favorites'}
              >
                {isFavorite(currentCard.id) ? '♥' : '♡'}
              </button>

              {/* TTS button */}
              {ttsSupported && (
                <button
                  className={`speak-btn ${isSpeaking ? 'speaking' : ''}`}
                  onClick={(e) => handleSpeak(e, currentCard.term)}
                  aria-label="Listen to pronunciation"
                >
                  <span className="speaker-icon">🔊</span>
                </button>
              )}

              {/* Voice practice button */}
              {voiceSupported && (
                <button
                  className={`voice-btn ${isListening ? 'recording' : ''}`}
                  onClick={handleVoicePractice}
                  aria-label="Practice pronunciation"
                >
                  <span className="mic-icon">🎤</span>
                </button>
              )}
            </div>
            <div className="flashcard-back">
              <span className="meaning">{currentCard.meaning}</span>
              <div className="example-section">
                <span className="example-label">Example:</span>
                <span className="example">"{currentCard.example}"</span>
                {ttsSupported && (
                  <button
                    className={`speak-btn small ${isSpeaking ? 'speaking' : ''}`}
                    onClick={(e) => handleSpeak(e, currentCard.example)}
                    aria-label="Listen to example"
                  >
                    <span className="speaker-icon">🔊</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Voice Practice Feedback */}
      {showVoicePractice && (
        <div className="voice-practice-section">
          {isListening && (
            <div className="listening-indicator">
              <span className="pulse-dot"></span>
              Listening...
            </div>
          )}
          {transcript && (
            <p className="voice-transcript">You said: "{transcript}"</p>
          )}
          {feedback && (
            <div className="voice-feedback" style={{ borderColor: feedback.color }}>
              <span style={{ color: feedback.color }}>{feedback.text}</span>
              {result && <span className="voice-score">{result.score}%</span>}
            </div>
          )}
          {error && (
            <p className="voice-error">{error}</p>
          )}
        </div>
      )}

      <div className="flashcard-nav">
        <button className="nav-btn" onClick={prevCard}>
          Previous
        </button>
        <button className="flip-btn" onClick={flipCard}>
          {isFlipped ? 'Show Term' : 'Flip Card'}
        </button>
        <button className="nav-btn" onClick={nextCard}>
          Next
        </button>
      </div>
    </div>
  );
}

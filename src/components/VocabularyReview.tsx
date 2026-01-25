import { useState, useMemo, useCallback } from 'react';
import { useSlangProgress } from '../hooks/useSlangProgress';
import { useGamification } from '../hooks/useGamification';
import { slangData, SlangTerm, categoryNames, difficultyNames } from '../data/slangData';
import './VocabularyReview.css';

type ViewMode = 'review' | 'browse' | 'stats';
type FilterCategory = 'all' | SlangTerm['category'];
type FilterDifficulty = 'all' | SlangTerm['difficulty'];

interface FlashcardProps {
  term: SlangTerm;
  isFlipped: boolean;
  onFlip: () => void;
  onRate: (rating: number) => void;
  level: number;
}

function Flashcard({ term, isFlipped, onFlip, onRate, level }: FlashcardProps) {
  const levelLabels = ['New', 'Learning', 'Familiar', 'Good', 'Strong', 'Mastered'];
  const levelColors = ['#94a3b8', '#f59e0b', '#eab308', '#84cc16', '#22c55e', '#10b981'];

  return (
    <div className="flashcard-container">
      <div className={`flashcard ${isFlipped ? 'flashcard--flipped' : ''}`} onClick={onFlip}>
        <div className="flashcard__front">
          <div className="flashcard__level" style={{ backgroundColor: levelColors[level] }}>
            {levelLabels[level]}
          </div>
          <div className="flashcard__category">{categoryNames[term.category]}</div>
          <div className="flashcard__term">{term.term}</div>
          <div className="flashcard__hint">Tap to reveal meaning</div>
        </div>
        <div className="flashcard__back">
          <div className="flashcard__level" style={{ backgroundColor: levelColors[level] }}>
            {levelLabels[level]}
          </div>
          <div className="flashcard__term flashcard__term--small">{term.term}</div>
          <div className="flashcard__meaning">{term.meaning}</div>
          <div className="flashcard__example">"{term.example}"</div>
          <div className="flashcard__difficulty">{difficultyNames[term.difficulty]}</div>
        </div>
      </div>

      {isFlipped && (
        <div className="rating-buttons">
          <p className="rating-prompt">How well did you know this?</p>
          <div className="rating-options">
            <button className="rating-btn rating-btn--1" onClick={() => onRate(1)}>
              <span className="rating-emoji">😕</span>
              <span className="rating-label">Didn't know</span>
            </button>
            <button className="rating-btn rating-btn--2" onClick={() => onRate(2)}>
              <span className="rating-emoji">🤔</span>
              <span className="rating-label">Hard</span>
            </button>
            <button className="rating-btn rating-btn--3" onClick={() => onRate(3)}>
              <span className="rating-emoji">😊</span>
              <span className="rating-label">Good</span>
            </button>
            <button className="rating-btn rating-btn--4" onClick={() => onRate(4)}>
              <span className="rating-emoji">😄</span>
              <span className="rating-label">Easy</span>
            </button>
            <button className="rating-btn rating-btn--5" onClick={() => onRate(5)}>
              <span className="rating-emoji">🤩</span>
              <span className="rating-label">Perfect!</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export function VocabularyReview() {
  const [viewMode, setViewMode] = useState<ViewMode>('review');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [filterCategory, setFilterCategory] = useState<FilterCategory>('all');
  const [filterDifficulty, setFilterDifficulty] = useState<FilterDifficulty>('all');
  const [sessionStats, setSessionStats] = useState({ reviewed: 0, correct: 0 });

  const {
    getCardProgress,
    updateCardProgress,
    getDueCards,
    getLearnedCount,
    getMasteredCount,
  } = useSlangProgress();

  const { recordCardView } = useGamification();

  // Get cards due for review
  const dueCards = useMemo(() => getDueCards(), [getDueCards]);

  // Filtered cards for browse mode
  const filteredCards = useMemo(() => {
    return slangData.filter(term => {
      if (filterCategory !== 'all' && term.category !== filterCategory) return false;
      if (filterDifficulty !== 'all' && term.difficulty !== filterDifficulty) return false;
      return true;
    });
  }, [filterCategory, filterDifficulty]);

  // Current card based on mode
  const currentCards = viewMode === 'review' ? dueCards : filteredCards;
  const currentCard = currentCards[currentIndex];

  const handleFlip = useCallback(() => {
    if (!isFlipped) {
      recordCardView();
    }
    setIsFlipped(!isFlipped);
  }, [isFlipped, recordCardView]);

  const handleRate = useCallback((rating: number) => {
    if (!currentCard) return;

    updateCardProgress(currentCard.id, rating);

    setSessionStats(prev => ({
      reviewed: prev.reviewed + 1,
      correct: rating >= 3 ? prev.correct + 1 : prev.correct,
    }));

    // Move to next card
    setIsFlipped(false);
    if (currentIndex < currentCards.length - 1) {
      setCurrentIndex(prev => prev + 1);
    } else {
      // Reached end of deck
      setCurrentIndex(0);
    }
  }, [currentCard, currentCards.length, currentIndex, updateCardProgress]);

  const handleSkip = useCallback(() => {
    setIsFlipped(false);
    if (currentIndex < currentCards.length - 1) {
      setCurrentIndex(prev => prev + 1);
    } else {
      setCurrentIndex(0);
    }
  }, [currentCards.length, currentIndex]);

  const resetSession = useCallback(() => {
    setCurrentIndex(0);
    setIsFlipped(false);
    setSessionStats({ reviewed: 0, correct: 0 });
  }, []);

  // Calculate overall stats
  const totalTerms = slangData.length;
  const learnedCount = getLearnedCount();
  const masteredCount = getMasteredCount();

  // Category stats
  const categoryStats = useMemo(() => {
    const stats: Record<string, { total: number; learned: number; mastered: number }> = {};

    slangData.forEach(term => {
      if (!stats[term.category]) {
        stats[term.category] = { total: 0, learned: 0, mastered: 0 };
      }
      stats[term.category].total++;

      const cardProgress = getCardProgress(term.id);
      if (cardProgress.level >= 1) stats[term.category].learned++;
      if (cardProgress.level >= 5) stats[term.category].mastered++;
    });

    return stats;
  }, [getCardProgress]);

  return (
    <div className="vocabulary-review">
      <header className="vocab-header">
        <h1>Aussie Vocabulary</h1>
        <div className="vocab-tabs">
          <button
            className={`vocab-tab ${viewMode === 'review' ? 'active' : ''}`}
            onClick={() => { setViewMode('review'); resetSession(); }}
          >
            Review ({dueCards.length})
          </button>
          <button
            className={`vocab-tab ${viewMode === 'browse' ? 'active' : ''}`}
            onClick={() => { setViewMode('browse'); setCurrentIndex(0); setIsFlipped(false); }}
          >
            Browse All
          </button>
          <button
            className={`vocab-tab ${viewMode === 'stats' ? 'active' : ''}`}
            onClick={() => setViewMode('stats')}
          >
            Progress
          </button>
        </div>
      </header>

      {viewMode === 'stats' && (
        <div className="vocab-stats">
          <div className="stats-overview">
            <div className="stat-circle">
              <svg viewBox="0 0 36 36" className="circular-chart">
                <path
                  className="circle-bg"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
                <path
                  className="circle-progress"
                  strokeDasharray={`${(learnedCount / totalTerms) * 100}, 100`}
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
                <text x="18" y="20.35" className="percentage">{Math.round((learnedCount / totalTerms) * 100)}%</text>
              </svg>
              <p className="stat-label">Overall Progress</p>
            </div>

            <div className="stats-numbers">
              <div className="stat-item">
                <span className="stat-value">{totalTerms}</span>
                <span className="stat-name">Total Terms</span>
              </div>
              <div className="stat-item">
                <span className="stat-value">{learnedCount}</span>
                <span className="stat-name">Learning</span>
              </div>
              <div className="stat-item stat-item--highlight">
                <span className="stat-value">{masteredCount}</span>
                <span className="stat-name">Mastered</span>
              </div>
              <div className="stat-item">
                <span className="stat-value">{dueCards.length}</span>
                <span className="stat-name">Due Now</span>
              </div>
            </div>
          </div>

          <div className="category-breakdown">
            <h3>By Category</h3>
            {Object.entries(categoryStats).map(([category, stats]) => (
              <div key={category} className="category-stat">
                <div className="category-header">
                  <span className="category-name">{categoryNames[category as SlangTerm['category']]}</span>
                  <span className="category-count">{stats.learned}/{stats.total}</span>
                </div>
                <div className="category-bar">
                  <div
                    className="category-bar-learned"
                    style={{ width: `${(stats.learned / stats.total) * 100}%` }}
                  />
                  <div
                    className="category-bar-mastered"
                    style={{ width: `${(stats.mastered / stats.total) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {(viewMode === 'review' || viewMode === 'browse') && (
        <>
          {viewMode === 'browse' && (
            <div className="browse-filters">
              <select
                value={filterCategory}
                onChange={(e) => { setFilterCategory(e.target.value as FilterCategory); setCurrentIndex(0); }}
              >
                <option value="all">All Categories</option>
                {Object.entries(categoryNames).map(([key, name]) => (
                  <option key={key} value={key}>{name}</option>
                ))}
              </select>
              <select
                value={filterDifficulty}
                onChange={(e) => { setFilterDifficulty(e.target.value as FilterDifficulty); setCurrentIndex(0); }}
              >
                <option value="all">All Levels</option>
                {Object.entries(difficultyNames).map(([key, name]) => (
                  <option key={key} value={key}>{name}</option>
                ))}
              </select>
            </div>
          )}

          {currentCards.length === 0 ? (
            <div className="empty-state">
              {viewMode === 'review' ? (
                <>
                  <span className="empty-icon">🎉</span>
                  <h3>All caught up!</h3>
                  <p>No cards due for review right now. Check back later or browse all cards.</p>
                  <button className="browse-btn" onClick={() => setViewMode('browse')}>
                    Browse All Cards
                  </button>
                </>
              ) : (
                <>
                  <span className="empty-icon">🔍</span>
                  <h3>No cards found</h3>
                  <p>Try adjusting your filters.</p>
                </>
              )}
            </div>
          ) : (
            <>
              <div className="card-progress">
                <span className="card-counter">
                  {currentIndex + 1} / {currentCards.length}
                </span>
                {sessionStats.reviewed > 0 && (
                  <span className="session-stats">
                    Session: {sessionStats.correct}/{sessionStats.reviewed} correct
                  </span>
                )}
              </div>

              <Flashcard
                term={currentCard}
                isFlipped={isFlipped}
                onFlip={handleFlip}
                onRate={handleRate}
                level={getCardProgress(currentCard.id).level}
              />

              <div className="card-controls">
                <button className="control-btn" onClick={handleSkip}>
                  Skip →
                </button>
                {viewMode === 'browse' && (
                  <>
                    <button
                      className="control-btn"
                      onClick={() => { setCurrentIndex(Math.max(0, currentIndex - 1)); setIsFlipped(false); }}
                      disabled={currentIndex === 0}
                    >
                      ← Previous
                    </button>
                    <button
                      className="control-btn"
                      onClick={() => { setCurrentIndex(Math.min(currentCards.length - 1, currentIndex + 1)); setIsFlipped(false); }}
                      disabled={currentIndex === currentCards.length - 1}
                    >
                      Next →
                    </button>
                  </>
                )}
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}

export default VocabularyReview;

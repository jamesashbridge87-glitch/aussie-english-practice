import { useState, useCallback } from 'react';
import { SlangTerm } from '../../data/slangData';
import { useSlangProgress } from '../../hooks/useSlangProgress';
import './SlangReview.css';

type ReviewState = 'stats' | 'reviewing' | 'answer' | 'complete';

interface RatingOption {
  value: number;
  label: string;
  className: string;
}

const RATINGS: RatingOption[] = [
  { value: 1, label: "Didn't know", className: 'rating-1' },
  { value: 2, label: 'Hard', className: 'rating-2' },
  { value: 3, label: 'Good', className: 'rating-3' },
  { value: 4, label: 'Easy', className: 'rating-4' },
  { value: 5, label: 'Perfect', className: 'rating-5' },
];

export function SlangReview() {
  const [reviewState, setReviewState] = useState<ReviewState>('stats');
  const [dueCards, setDueCards] = useState<SlangTerm[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);

  const {
    getDueCards,
    getLearnedCount,
    getMasteredCount,
    updateCardProgress,
    resetProgress,
  } = useSlangProgress();

  const startReview = useCallback(() => {
    const cards = getDueCards();
    if (cards.length === 0) {
      return;
    }
    setDueCards(cards);
    setCurrentIndex(0);
    setIsFlipped(false);
    setReviewState('reviewing');
  }, [getDueCards]);

  const showAnswer = useCallback(() => {
    setIsFlipped(true);
    setReviewState('answer');
  }, []);

  const handleRating = useCallback(
    (rating: number) => {
      const currentCard = dueCards[currentIndex];
      updateCardProgress(currentCard.id, rating);

      if (currentIndex + 1 >= dueCards.length) {
        setReviewState('complete');
      } else {
        setCurrentIndex((prev) => prev + 1);
        setIsFlipped(false);
        setReviewState('reviewing');
      }
    },
    [dueCards, currentIndex, updateCardProgress]
  );

  const backToStats = useCallback(() => {
    setReviewState('stats');
    setDueCards([]);
    setCurrentIndex(0);
    setIsFlipped(false);
  }, []);

  const dueCount = getDueCards().length;
  const learnedCount = getLearnedCount();
  const masteredCount = getMasteredCount();
  const currentCard = dueCards[currentIndex];

  return (
    <div className="slang-review">
      {reviewState === 'stats' && (
        <div className="review-stats">
          <h2>Spaced Repetition Review</h2>
          <p className="stats-subtitle">Learn smarter with adaptive flashcards</p>

          <div className="stats-grid">
            <div className="stat-card">
              <span className="stat-number">{dueCount}</span>
              <span className="stat-label">Due Today</span>
            </div>
            <div className="stat-card">
              <span className="stat-number">{learnedCount}</span>
              <span className="stat-label">Total Learned</span>
            </div>
            <div className="stat-card">
              <span className="stat-number">{masteredCount}</span>
              <span className="stat-label">Mastered</span>
            </div>
          </div>

          <div className="review-actions">
            <button
              className="start-btn"
              onClick={startReview}
              disabled={dueCount === 0}
            >
              {dueCount === 0 ? 'No Cards Due' : 'Start Review'}
            </button>
            <button className="reset-btn" onClick={resetProgress}>
              Reset Progress
            </button>
          </div>
        </div>
      )}

      {(reviewState === 'reviewing' || reviewState === 'answer') && currentCard && (
        <div className="review-card-section">
          <div className="review-progress">
            <span>
              Reviewing: {dueCards.length - currentIndex} cards left
            </span>
          </div>

          <div className="flashcard-container" onClick={reviewState === 'reviewing' ? showAnswer : undefined}>
            <div className={`flashcard ${isFlipped ? 'flipped' : ''}`}>
              <div className="flashcard-inner">
                <div className="flashcard-front">
                  <span className="term">{currentCard.term}</span>
                </div>
                <div className="flashcard-back">
                  <span className="meaning">{currentCard.meaning}</span>
                  <span className="example">"{currentCard.example}"</span>
                </div>
              </div>
            </div>
          </div>

          {reviewState === 'reviewing' && (
            <button className="show-answer-btn" onClick={showAnswer}>
              Show Answer
            </button>
          )}

          {reviewState === 'answer' && (
            <div className="rating-section">
              <p>How well did you know this?</p>
              <div className="rating-buttons">
                {RATINGS.map((rating) => (
                  <button
                    key={rating.value}
                    className={`rating-btn ${rating.className}`}
                    onClick={() => handleRating(rating.value)}
                  >
                    {rating.label}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {reviewState === 'complete' && (
        <div className="review-complete">
          <h2>Review Complete!</h2>
          <p>You've reviewed all due cards. Come back later for more!</p>
          <button className="start-btn" onClick={backToStats}>
            View Stats
          </button>
        </div>
      )}
    </div>
  );
}

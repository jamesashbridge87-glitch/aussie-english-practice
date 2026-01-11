import { useState, useCallback } from 'react';
import { slangData, categories, categoryNames, SlangCategory } from '../../data/slangData';
import './SlangFlashcards.css';

export function SlangFlashcards() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<SlangCategory | 'all'>('all');

  const filteredCards = selectedCategory === 'all'
    ? slangData
    : slangData.filter((card) => card.category === selectedCategory);

  const currentCard = filteredCards[currentIndex];

  const flipCard = useCallback(() => {
    setIsFlipped((prev) => !prev);
  }, []);

  const nextCard = useCallback(() => {
    setIsFlipped(false);
    setCurrentIndex((prev) => (prev + 1) % filteredCards.length);
  }, [filteredCards.length]);

  const prevCard = useCallback(() => {
    setIsFlipped(false);
    setCurrentIndex((prev) => (prev - 1 + filteredCards.length) % filteredCards.length);
  }, [filteredCards.length]);

  const handleCategoryChange = (category: SlangCategory | 'all') => {
    setSelectedCategory(category);
    setCurrentIndex(0);
    setIsFlipped(false);
  };

  if (filteredCards.length === 0) {
    return (
      <div className="slang-flashcards">
        <p>No cards available for this category.</p>
      </div>
    );
  }

  return (
    <div className="slang-flashcards">
      <div className="flashcard-controls">
        <select
          value={selectedCategory}
          onChange={(e) => handleCategoryChange(e.target.value as SlangCategory | 'all')}
          className="category-select"
        >
          <option value="all">All Categories</option>
          {categories.map((cat) => (
            <option key={cat} value={cat}>
              {categoryNames[cat]}
            </option>
          ))}
        </select>
        <span className="card-counter">
          Card {currentIndex + 1} of {filteredCards.length}
        </span>
      </div>

      <div className="flashcard-container" onClick={flipCard}>
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

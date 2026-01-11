import { useState } from 'react';
import { SlangFlashcards } from './SlangFlashcards';
import { SlangQuiz } from './SlangQuiz';
import { SlangReview } from './SlangReview';
import './SlangPage.css';

type SlangMode = 'flashcards' | 'quiz' | 'review';

export function SlangPage() {
  const [activeMode, setActiveMode] = useState<SlangMode>('flashcards');

  return (
    <div className="slang-page-container">
      <header className="slang-header">
        <div className="header-brand">
          <img
            src={`${import.meta.env.BASE_URL}logo.png`}
            alt="Your Aussie Uncle"
            className="header-logo"
          />
          <h1>SpeakAussie</h1>
        </div>
        <p className="header-subtitle">Aussie Slang Learner</p>
      </header>

      <nav className="mode-selector">
        <button
          className={`mode-btn ${activeMode === 'flashcards' ? 'active' : ''}`}
          onClick={() => setActiveMode('flashcards')}
        >
          Flashcards
        </button>
        <button
          className={`mode-btn ${activeMode === 'quiz' ? 'active' : ''}`}
          onClick={() => setActiveMode('quiz')}
        >
          Quiz
        </button>
        <button
          className={`mode-btn ${activeMode === 'review' ? 'active' : ''}`}
          onClick={() => setActiveMode('review')}
        >
          Review
        </button>
      </nav>

      <main className="slang-main">
        {activeMode === 'flashcards' && <SlangFlashcards />}
        {activeMode === 'quiz' && <SlangQuiz />}
        {activeMode === 'review' && <SlangReview />}
      </main>

      <div className="upgrade-banner">
        <div className="upgrade-content">
          <h3>Want to practice speaking?</h3>
          <p>Try our pronunciation practice or chat with Your Aussie Uncle!</p>
          <div className="upgrade-links">
            <a href="/speak" className="upgrade-link secondary">
              Free Pronunciation
            </a>
            <a href="/app" className="upgrade-link primary">
              Full Experience
            </a>
          </div>
        </div>
      </div>

      <footer className="slang-footer">
        <p>
          Powered by{' '}
          <a href="https://youraussieuncle.com" target="_blank" rel="noopener noreferrer">
            Your Aussie Uncle
          </a>
        </p>
      </footer>
    </div>
  );
}

export default SlangPage;

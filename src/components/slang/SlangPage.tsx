import { useState, useCallback, useMemo } from 'react';
import { SlangFlashcards } from './SlangFlashcards';
import { SlangQuiz } from './SlangQuiz';
import { SlangReview } from './SlangReview';
import { FillInBlank } from './FillInBlank';
import { SentenceBuilder } from './SentenceBuilder';
import { useGamification } from '../../hooks/useGamification';
import { slangData } from '../../data/slangData';
import './SlangPage.css';

type SlangMode = 'flashcards' | 'quiz' | 'review' | 'fillblank' | 'builder' | 'favorites' | 'achievements' | 'stats';

export function SlangPage() {
  const [activeMode, setActiveMode] = useState<SlangMode>('flashcards');
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);

  const {
    xp,
    level,
    streak,
    highScore,
    cardsViewed,
    quizzesCompleted,
    favorites,
    getXPProgress,
    getDailyChallengeTerm,
    isDailyChallengeCompleted,
    completeDailyChallenge,
    getFavoriteTerms,
    getAllAchievements,
    notification,
    newAchievements,
    clearNewAchievements,
    resetProgress,
  } = useGamification();

  const xpProgress = getXPProgress();
  const dailyTerm = getDailyChallengeTerm();
  const dailyCompleted = isDailyChallengeCompleted();
  const favoriteTerms = getFavoriteTerms();
  const achievements = getAllAchievements();

  const searchResults = useMemo(() => {
    if (!searchQuery || searchQuery.length < 2) return [];
    const query = searchQuery.toLowerCase();
    return slangData.filter(
      term =>
        term.term.toLowerCase().includes(query) ||
        term.meaning.toLowerCase().includes(query) ||
        term.example.toLowerCase().includes(query)
    );
  }, [searchQuery]);

  const handleSearch = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  }, []);

  const clearSearch = useCallback(() => {
    setSearchQuery('');
  }, []);

  const handleDailyChallenge = useCallback(() => {
    completeDailyChallenge();
    setActiveMode('flashcards');
  }, [completeDailyChallenge]);

  return (
    <div className="slang-page-container">
      {/* Notifications */}
      {notification && (
        <div className="game-notification show">{notification}</div>
      )}

      {/* Achievement popups */}
      {newAchievements.length > 0 && (
        <div className="achievement-popup">
          <div className="achievement-content">
            <h3>Achievement Unlocked!</h3>
            {newAchievements.map(a => (
              <div key={a.id} className="achievement-item">
                <span className="achievement-icon">{String.fromCodePoint(parseInt(a.icon, 16))}</span>
                <div>
                  <strong>{a.name}</strong>
                  <p>{a.desc}</p>
                </div>
              </div>
            ))}
            <button onClick={clearNewAchievements}>Awesome!</button>
          </div>
        </div>
      )}

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

        {/* Stats bar */}
        <div className="stats-bar">
          <div className="stat-item">
            <span className="stat-icon">&#x1f525;</span>
            <span className="stat-value">{streak}</span>
            <span className="stat-label">Streak</span>
          </div>
          <div className="stat-item">
            <span className="stat-icon">&#x2b50;</span>
            <span className="stat-value">{xp}</span>
            <span className="stat-label">XP</span>
          </div>
          <div className="stat-item">
            <span className="stat-icon">&#x1f3c6;</span>
            <span className="stat-value">{level}</span>
            <span className="stat-label">Level</span>
          </div>
        </div>

        {/* XP Progress bar */}
        <div className="xp-progress">
          <div className="xp-bar">
            <div className="xp-fill" style={{ width: `${Math.min(xpProgress.percentage, 100)}%` }}></div>
          </div>
          <span className="xp-text">{xpProgress.progress} / {xpProgress.needed} XP to Level {level + 1}</span>
        </div>

        {/* Search bar */}
        <div className="search-container">
          <button
            className={`search-toggle ${showSearch ? 'active' : ''}`}
            onClick={() => setShowSearch(!showSearch)}
            aria-label="Toggle search"
          >
            &#128269;
          </button>
          {showSearch && (
            <div className="search-box">
              <input
                type="text"
                placeholder="Search slang..."
                value={searchQuery}
                onChange={handleSearch}
                className="search-input"
              />
              {searchQuery && (
                <button className="search-clear" onClick={clearSearch}>&#x2715;</button>
              )}
            </div>
          )}
        </div>

        {/* Search results */}
        {searchQuery && searchResults.length > 0 && (
          <div className="search-results">
            <p className="search-count">{searchResults.length} results found</p>
            <div className="search-results-list">
              {searchResults.slice(0, 5).map(term => (
                <div key={term.id} className="search-result-item">
                  <strong>{term.term}</strong>
                  <span>{term.meaning}</span>
                </div>
              ))}
              {searchResults.length > 5 && (
                <p className="search-more">...and {searchResults.length - 5} more</p>
              )}
            </div>
          </div>
        )}
      </header>

      {/* Daily Challenge Banner */}
      {dailyTerm && !dailyCompleted && (
        <div className="daily-challenge">
          <div className="daily-content">
            <span className="daily-icon">&#128197;</span>
            <div className="daily-text">
              <strong>Daily Challenge</strong>
              <p>Learn today's word: <em>{dailyTerm.term}</em></p>
            </div>
            <button className="daily-btn" onClick={handleDailyChallenge}>
              Learn +50 XP
            </button>
          </div>
        </div>
      )}

      <nav className="mode-selector">
        <div className="mode-row">
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
        </div>
        <div className="mode-row">
          <button
            className={`mode-btn ${activeMode === 'fillblank' ? 'active' : ''}`}
            onClick={() => setActiveMode('fillblank')}
          >
            Fill Blank
          </button>
          <button
            className={`mode-btn ${activeMode === 'builder' ? 'active' : ''}`}
            onClick={() => setActiveMode('builder')}
          >
            Builder
          </button>
          <button
            className={`mode-btn ${activeMode === 'favorites' ? 'active' : ''}`}
            onClick={() => setActiveMode('favorites')}
          >
            &#9825; {favorites.length}
          </button>
        </div>
        <div className="mode-row secondary">
          <button
            className={`mode-btn small ${activeMode === 'achievements' ? 'active' : ''}`}
            onClick={() => setActiveMode('achievements')}
          >
            Achievements
          </button>
          <button
            className={`mode-btn small ${activeMode === 'stats' ? 'active' : ''}`}
            onClick={() => setActiveMode('stats')}
          >
            Stats
          </button>
        </div>
      </nav>

      <main className="slang-main">
        {activeMode === 'flashcards' && <SlangFlashcards />}
        {activeMode === 'quiz' && <SlangQuiz />}
        {activeMode === 'review' && <SlangReview />}
        {activeMode === 'fillblank' && <FillInBlank />}
        {activeMode === 'builder' && <SentenceBuilder />}

        {activeMode === 'favorites' && (
          <div className="favorites-section">
            <h2>Your Favorites</h2>
            {favoriteTerms.length === 0 ? (
              <p className="no-favorites">
                No favorites yet. Click the heart icon on flashcards to add terms!
              </p>
            ) : (
              <div className="favorites-list">
                {favoriteTerms.map(term => (
                  <div key={term.id} className="favorite-card">
                    <div className="fav-term">{term.term}</div>
                    <div className="fav-meaning">{term.meaning}</div>
                    <div className="fav-example">"{term.example}"</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeMode === 'achievements' && (
          <div className="achievements-section">
            <h2>Achievements</h2>
            <p className="achievements-count">
              {achievements.filter(a => a.unlocked).length} / {achievements.length} unlocked
            </p>
            <div className="achievements-grid">
              {achievements.map(achievement => (
                <div
                  key={achievement.id}
                  className={`achievement-badge ${achievement.unlocked ? 'unlocked' : 'locked'}`}
                >
                  <span className="badge-icon">
                    {achievement.unlocked
                      ? String.fromCodePoint(parseInt(achievement.icon, 16))
                      : '🔒'}
                  </span>
                  <span className="badge-name">{achievement.name}</span>
                  <span className="badge-desc">{achievement.desc}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeMode === 'stats' && (
          <div className="stats-section">
            <h2>Your Stats</h2>
            <div className="stats-grid">
              <div className="stat-card">
                <span className="stat-number">{cardsViewed}</span>
                <span className="stat-name">Cards Viewed</span>
              </div>
              <div className="stat-card">
                <span className="stat-number">{quizzesCompleted}</span>
                <span className="stat-name">Quizzes Done</span>
              </div>
              <div className="stat-card">
                <span className="stat-number">{highScore}</span>
                <span className="stat-name">High Score</span>
              </div>
              <div className="stat-card">
                <span className="stat-number">{streak}</span>
                <span className="stat-name">Day Streak</span>
              </div>
              <div className="stat-card">
                <span className="stat-number">{level}</span>
                <span className="stat-name">Level</span>
              </div>
              <div className="stat-card">
                <span className="stat-number">{xp}</span>
                <span className="stat-name">Total XP</span>
              </div>
            </div>
            <button className="reset-btn" onClick={resetProgress}>
              Reset All Progress
            </button>
          </div>
        )}
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

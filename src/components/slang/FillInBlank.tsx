import { useState, useCallback, useMemo } from 'react';
import { slangData, categories, categoryNames, difficulties, difficultyNames, SlangCategory, SlangDifficulty, SlangTerm } from '../../data/slangData';
import { useGamification } from '../../hooks/useGamification';
import { useSoundEffects } from '../../hooks/useSoundEffects';
import './FillInBlank.css';

type GameState = 'start' | 'playing' | 'feedback' | 'results';

const QUIZ_LENGTH = 10;

function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

function escapeRegex(string: string): string {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function calculateSimilarity(str1: string, str2: string): number {
  const len1 = str1.length;
  const len2 = str2.length;

  if (len1 === 0) return len2 === 0 ? 100 : 0;
  if (len2 === 0) return 0;

  const matrix: number[][] = Array(len1 + 1)
    .fill(null)
    .map(() => Array(len2 + 1).fill(null));

  for (let i = 0; i <= len1; i++) matrix[i][0] = i;
  for (let j = 0; j <= len2; j++) matrix[0][j] = j;

  for (let i = 1; i <= len1; i++) {
    for (let j = 1; j <= len2; j++) {
      const cost = str1[i - 1] === str2[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,
        matrix[i][j - 1] + 1,
        matrix[i - 1][j - 1] + cost
      );
    }
  }

  const distance = matrix[len1][len2];
  const maxLen = Math.max(len1, len2);
  return Math.round((1 - distance / maxLen) * 100);
}

export function FillInBlank() {
  const [gameState, setGameState] = useState<GameState>('start');
  const [selectedCategory, setSelectedCategory] = useState<SlangCategory | 'all'>('all');
  const [selectedDifficulty, setSelectedDifficulty] = useState<SlangDifficulty | 'all'>('all');
  const [questions, setQuestions] = useState<SlangTerm[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [score, setScore] = useState(0);
  const [userAnswer, setUserAnswer] = useState('');
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);

  const { recordFillBlankComplete, recordFillBlankCorrect, notification } = useGamification();
  const { playCorrect, playIncorrect, playSuccess } = useSoundEffects();

  const filteredTerms = useMemo(() => {
    let terms = slangData;
    if (selectedCategory !== 'all') {
      terms = terms.filter(t => t.category === selectedCategory);
    }
    if (selectedDifficulty !== 'all') {
      terms = terms.filter(t => t.difficulty === selectedDifficulty);
    }
    return terms;
  }, [selectedCategory, selectedDifficulty]);

  const startGame = useCallback(() => {
    if (filteredTerms.length < 5) {
      alert('Not enough terms for this filter. Try a different category or difficulty.');
      return;
    }
    const newQuestions = shuffleArray(filteredTerms).slice(0, Math.min(QUIZ_LENGTH, filteredTerms.length));
    setQuestions(newQuestions);
    setCurrentQuestion(0);
    setScore(0);
    setUserAnswer('');
    setIsCorrect(null);
    setGameState('playing');
  }, [filteredTerms]);

  const getSentenceWithBlank = useCallback((term: SlangTerm): string => {
    const regex = new RegExp(escapeRegex(term.term), 'gi');
    return term.example.replace(regex, '_____');
  }, []);

  const checkAnswer = useCallback((userInput: string, correctAnswer: string): boolean => {
    const userLower = userInput.toLowerCase().trim();
    const correctLower = correctAnswer.toLowerCase().trim();

    // Exact match
    if (userLower === correctLower) return true;

    // Remove punctuation and compare
    const cleanUser = userLower.replace(/[^a-z0-9\s]/g, '').trim();
    const cleanCorrect = correctLower.replace(/[^a-z0-9\s]/g, '').trim();
    if (cleanUser === cleanCorrect) return true;

    // Check similarity (allow typos)
    const similarity = calculateSimilarity(cleanUser, cleanCorrect);
    if (similarity >= 85) return true;

    return false;
  }, []);

  const handleSubmit = useCallback(() => {
    if (!userAnswer.trim()) return;

    const currentTerm = questions[currentQuestion];
    const correct = checkAnswer(userAnswer, currentTerm.term);
    setIsCorrect(correct);

    if (correct) {
      setScore(prev => prev + 1);
      playCorrect();
      recordFillBlankCorrect();
    } else {
      playIncorrect();
    }

    setGameState('feedback');
  }, [userAnswer, questions, currentQuestion, checkAnswer, playCorrect, playIncorrect, recordFillBlankCorrect]);

  const nextQuestion = useCallback(() => {
    if (currentQuestion + 1 >= questions.length) {
      const finalScore = score + (isCorrect ? 0 : 0); // Already added in handleSubmit
      recordFillBlankComplete(finalScore, questions.length);
      playSuccess();
      setGameState('results');
    } else {
      setCurrentQuestion(prev => prev + 1);
      setUserAnswer('');
      setIsCorrect(null);
      setGameState('playing');
    }
  }, [currentQuestion, questions.length, score, isCorrect, recordFillBlankComplete, playSuccess]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      if (gameState === 'playing') {
        handleSubmit();
      } else if (gameState === 'feedback') {
        nextQuestion();
      }
    }
  }, [gameState, handleSubmit, nextQuestion]);

  const getResultMessage = (finalScore: number, total: number): string => {
    const percentage = (finalScore / total) * 100;
    if (percentage === 100) return "Strewth! Perfect score! You're a true Aussie!";
    if (percentage >= 80) return "Ripper! You really know your slang!";
    if (percentage >= 60) return "Not bad, mate! Keep at it!";
    if (percentage >= 40) return "She'll be right! Practice makes perfect!";
    return "No worries! Give it another burl!";
  };

  const question = questions[currentQuestion];

  return (
    <div className="fill-in-blank">
      {notification && <div className="game-notification">{notification}</div>}

      {gameState === 'start' && (
        <div className="game-start">
          <h2>Fill in the Blank</h2>
          <p>Complete the sentence with the correct Aussie slang term!</p>

          <div className="game-options">
            <div className="option-group">
              <label>Category</label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value as SlangCategory | 'all')}
                className="game-select"
              >
                <option value="all">All Categories</option>
                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {categoryNames[cat]}
                  </option>
                ))}
              </select>
            </div>

            <div className="option-group">
              <label>Difficulty</label>
              <select
                value={selectedDifficulty}
                onChange={(e) => setSelectedDifficulty(e.target.value as SlangDifficulty | 'all')}
                className="game-select"
              >
                <option value="all">All Levels</option>
                {difficulties.map((diff) => (
                  <option key={diff} value={diff}>
                    {difficultyNames[diff]}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <p className="terms-count">{filteredTerms.length} terms available</p>

          <button
            className="start-btn"
            onClick={startGame}
            disabled={filteredTerms.length < 5}
          >
            Start Game
          </button>
        </div>
      )}

      {(gameState === 'playing' || gameState === 'feedback') && question && (
        <div className="game-playing">
          <div className="game-progress">
            <span>Question {currentQuestion + 1} of {questions.length}</span>
            <span className="game-score">Score: {score}</span>
          </div>

          <div className="question-card">
            <p className="sentence-text">{getSentenceWithBlank(question)}</p>
            <p className="hint-text">Meaning: {question.meaning}</p>

            <input
              type="text"
              className={`answer-input ${gameState === 'feedback' ? (isCorrect ? 'correct' : 'incorrect') : ''}`}
              value={userAnswer}
              onChange={(e) => setUserAnswer(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type your answer..."
              disabled={gameState === 'feedback'}
              autoFocus
            />

            {gameState === 'playing' && (
              <button className="submit-btn" onClick={handleSubmit} disabled={!userAnswer.trim()}>
                Submit Answer
              </button>
            )}

            {gameState === 'feedback' && (
              <div className={`feedback ${isCorrect ? 'correct' : 'incorrect'}`}>
                <p>
                  {isCorrect
                    ? 'Correct! Well done!'
                    : <>Not quite! The answer was: <strong>{question.term}</strong></>
                  }
                </p>
                <button className="next-btn" onClick={nextQuestion}>
                  {currentQuestion + 1 >= questions.length ? 'See Results' : 'Next Question'}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {gameState === 'results' && (
        <div className="game-results">
          <h2>Game Complete!</h2>
          <div className="results-score">
            <span className="big-score">{score}</span>
            <span className="score-label">out of {questions.length}</span>
          </div>
          <p className="results-message">{getResultMessage(score, questions.length)}</p>
          <button className="start-btn" onClick={startGame}>
            Play Again
          </button>
        </div>
      )}
    </div>
  );
}

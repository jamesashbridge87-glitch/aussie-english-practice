import { useState, useCallback, useMemo } from 'react';
import { sentenceTemplates, SentenceTemplate } from '../../data/slangData';
import { useGamification } from '../../hooks/useGamification';
import { useSoundEffects } from '../../hooks/useSoundEffects';
import './SentenceBuilder.css';

type GameState = 'start' | 'playing' | 'feedback' | 'results';

const GAME_LENGTH = 10;

function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

export function SentenceBuilder() {
  const [gameState, setGameState] = useState<GameState>('start');
  const [sentences, setSentences] = useState<SentenceTemplate[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [selectedWord, setSelectedWord] = useState<string | null>(null);
  const [placedWord, setPlacedWord] = useState<string | null>(null);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [showHint, setShowHint] = useState(false);

  const { recordSentenceBuilderComplete, recordSentenceBuilderCorrect, notification } = useGamification();
  const { playCorrect, playIncorrect, playSuccess, playFlip } = useSoundEffects();

  const currentSentence = sentences[currentIndex];

  // Generate word options for current sentence
  const wordOptions = useMemo(() => {
    if (!currentSentence) return [];

    const correctAnswer = currentSentence.answer;

    // Get distractors from other templates
    const distractors = sentenceTemplates
      .filter(t => t.answer !== correctAnswer)
      .map(t => t.answer);

    const shuffledDistractors = shuffleArray(distractors).slice(0, 5);
    return shuffleArray([correctAnswer, ...shuffledDistractors]);
  }, [currentSentence]);

  const startGame = useCallback(() => {
    const shuffled = shuffleArray([...sentenceTemplates]).slice(0, Math.min(GAME_LENGTH, sentenceTemplates.length));
    setSentences(shuffled);
    setCurrentIndex(0);
    setScore(0);
    setSelectedWord(null);
    setPlacedWord(null);
    setIsCorrect(null);
    setShowHint(false);
    setGameState('playing');
    playFlip();
  }, [playFlip]);

  const handleWordClick = useCallback((word: string) => {
    if (gameState !== 'playing' || isCorrect !== null) return;

    setSelectedWord(word);
    setPlacedWord(word);
  }, [gameState, isCorrect]);

  const handleBlankClick = useCallback(() => {
    if (gameState !== 'playing' || isCorrect !== null || !selectedWord) return;

    // Submit the answer
    const correct = selectedWord.toLowerCase() === currentSentence.answer.toLowerCase();
    setIsCorrect(correct);
    setPlacedWord(selectedWord);

    if (correct) {
      setScore(prev => prev + 1);
      playCorrect();
      recordSentenceBuilderCorrect();
    } else {
      playIncorrect();
    }

    setGameState('feedback');

    // Auto-advance after delay
    setTimeout(() => {
      if (currentIndex + 1 >= sentences.length) {
        recordSentenceBuilderComplete();
        playSuccess();
        setGameState('results');
      } else {
        setCurrentIndex(prev => prev + 1);
        setSelectedWord(null);
        setPlacedWord(null);
        setIsCorrect(null);
        setShowHint(false);
        setGameState('playing');
      }
    }, 2000);
  }, [
    gameState,
    isCorrect,
    selectedWord,
    currentSentence,
    currentIndex,
    sentences.length,
    playCorrect,
    playIncorrect,
    playSuccess,
    recordSentenceBuilderCorrect,
    recordSentenceBuilderComplete
  ]);

  const handleDragStart = useCallback((e: React.DragEvent, word: string) => {
    e.dataTransfer.setData('text/plain', word);
    e.dataTransfer.effectAllowed = 'move';
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    if (gameState !== 'playing' || isCorrect !== null) return;

    const word = e.dataTransfer.getData('text/plain');
    setSelectedWord(word);
    setPlacedWord(word);

    // Submit the answer
    const correct = word.toLowerCase() === currentSentence.answer.toLowerCase();
    setIsCorrect(correct);

    if (correct) {
      setScore(prev => prev + 1);
      playCorrect();
      recordSentenceBuilderCorrect();
    } else {
      playIncorrect();
    }

    setGameState('feedback');

    // Auto-advance after delay
    setTimeout(() => {
      if (currentIndex + 1 >= sentences.length) {
        recordSentenceBuilderComplete();
        playSuccess();
        setGameState('results');
      } else {
        setCurrentIndex(prev => prev + 1);
        setSelectedWord(null);
        setPlacedWord(null);
        setIsCorrect(null);
        setShowHint(false);
        setGameState('playing');
      }
    }, 2000);
  }, [
    gameState,
    isCorrect,
    currentSentence,
    currentIndex,
    sentences.length,
    playCorrect,
    playIncorrect,
    playSuccess,
    recordSentenceBuilderCorrect,
    recordSentenceBuilderComplete
  ]);

  const skipSentence = useCallback(() => {
    if (gameState !== 'playing' || isCorrect !== null) return;

    if (currentIndex + 1 >= sentences.length) {
      recordSentenceBuilderComplete();
      playSuccess();
      setGameState('results');
    } else {
      setCurrentIndex(prev => prev + 1);
      setSelectedWord(null);
      setPlacedWord(null);
      setIsCorrect(null);
      setShowHint(false);
      playFlip();
    }
  }, [gameState, isCorrect, currentIndex, sentences.length, playFlip, playSuccess, recordSentenceBuilderComplete]);

  const toggleHint = useCallback(() => {
    setShowHint(prev => !prev);
  }, []);

  const getResultMessage = (finalScore: number, total: number): string => {
    const percentage = (finalScore / total) * 100;
    if (percentage === 100) return "Perfect! You're a sentence building legend!";
    if (percentage >= 80) return "Ripper effort! You've got the hang of it!";
    if (percentage >= 60) return "Not bad! Keep practicing, mate!";
    return "She'll be right! Have another crack at it!";
  };

  // Split sentence into parts around the blank
  const sentenceParts = currentSentence?.sentence.split('___') || ['', ''];

  return (
    <div className="sentence-builder">
      {notification && <div className="game-notification">{notification}</div>}

      {gameState === 'start' && (
        <div className="game-start">
          <h2>Sentence Builder</h2>
          <p>Drag and drop the correct word to complete the sentence!</p>
          <p className="game-tip">Tip: Click or drag words to place them in the blank</p>
          <button className="start-btn" onClick={startGame}>
            Start Game
          </button>
        </div>
      )}

      {(gameState === 'playing' || gameState === 'feedback') && currentSentence && (
        <div className="game-playing">
          <div className="game-progress">
            <span>Sentence {currentIndex + 1} of {sentences.length}</span>
            <span className="game-score">Score: {score}</span>
          </div>

          <div className="sentence-display">
            <span className="sentence-part">{sentenceParts[0]}</span>
            <span
              className={`word-blank ${placedWord ? 'filled' : ''} ${
                isCorrect === true ? 'correct' : isCorrect === false ? 'incorrect' : ''
              }`}
              onClick={handleBlankClick}
              onDragOver={handleDragOver}
              onDrop={handleDrop}
            >
              {placedWord || '???'}
            </span>
            <span className="sentence-part">{sentenceParts[1] || ''}</span>
          </div>

          <div className="word-bank">
            {wordOptions.map((word, index) => (
              <div
                key={`${word}-${index}`}
                className={`draggable-word ${
                  selectedWord === word ? 'selected' : ''
                } ${
                  gameState === 'feedback' && word.toLowerCase() === currentSentence.answer.toLowerCase()
                    ? 'correct-word'
                    : ''
                } ${
                  gameState === 'feedback' && selectedWord === word && isCorrect === false
                    ? 'incorrect-word'
                    : ''
                }`}
                draggable={gameState === 'playing' && isCorrect === null}
                onClick={() => handleWordClick(word)}
                onDragStart={(e) => handleDragStart(e, word)}
              >
                {word}
              </div>
            ))}
          </div>

          {gameState === 'playing' && isCorrect === null && (
            <div className="game-controls">
              <button className="hint-btn" onClick={toggleHint}>
                {showHint ? 'Hide Hint' : 'Show Hint'}
              </button>
              <button className="skip-btn" onClick={skipSentence}>
                Skip
              </button>
            </div>
          )}

          {showHint && (
            <p className="hint-text">Hint: {currentSentence.hint}</p>
          )}

          {gameState === 'feedback' && (
            <div className={`feedback ${isCorrect ? 'correct' : 'incorrect'}`}>
              <p>
                {isCorrect
                  ? 'Correct! Well done!'
                  : <>Not quite! The answer was "{currentSentence.answer}"</>
                }
              </p>
            </div>
          )}
        </div>
      )}

      {gameState === 'results' && (
        <div className="game-results">
          <h2>Game Complete!</h2>
          <div className="results-score">
            <span className="big-score">{score}</span>
            <span className="score-label">out of {sentences.length}</span>
          </div>
          <p className="results-message">{getResultMessage(score, sentences.length)}</p>
          <button className="start-btn" onClick={startGame}>
            Play Again
          </button>
        </div>
      )}
    </div>
  );
}

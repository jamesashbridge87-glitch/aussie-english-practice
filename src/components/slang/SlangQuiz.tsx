import { useState, useCallback, useMemo } from 'react';
import { slangData, categories, categoryNames, SlangCategory, SlangTerm } from '../../data/slangData';
import { useSlangProgress } from '../../hooks/useSlangProgress';
import './SlangQuiz.css';

type QuizDirection = 'term-to-meaning' | 'meaning-to-term';
type QuizState = 'start' | 'playing' | 'feedback' | 'results';

interface QuizQuestion {
  term: SlangTerm;
  options: string[];
  correctAnswer: string;
}

const QUIZ_LENGTH = 10;

function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

function generateQuestions(
  terms: SlangTerm[],
  direction: QuizDirection,
  count: number
): QuizQuestion[] {
  const shuffledTerms = shuffleArray(terms).slice(0, count);

  return shuffledTerms.map((term) => {
    const correctAnswer = direction === 'term-to-meaning' ? term.meaning : term.term;

    // Get 3 wrong answers
    const otherTerms = terms.filter((t) => t.id !== term.id);
    const wrongAnswers = shuffleArray(otherTerms)
      .slice(0, 3)
      .map((t) => (direction === 'term-to-meaning' ? t.meaning : t.term));

    const options = shuffleArray([correctAnswer, ...wrongAnswers]);

    return {
      term,
      options,
      correctAnswer,
    };
  });
}

export function SlangQuiz() {
  const [quizState, setQuizState] = useState<QuizState>('start');
  const [selectedCategory, setSelectedCategory] = useState<SlangCategory | 'all'>('all');
  const [direction, setDirection] = useState<QuizDirection>('term-to-meaning');
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [score, setScore] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);

  const { updateQuizScore, progress } = useSlangProgress();

  const filteredTerms = useMemo(() => {
    return selectedCategory === 'all'
      ? slangData
      : slangData.filter((t) => t.category === selectedCategory);
  }, [selectedCategory]);

  const startQuiz = useCallback(() => {
    const newQuestions = generateQuestions(
      filteredTerms,
      direction,
      Math.min(QUIZ_LENGTH, filteredTerms.length)
    );
    setQuestions(newQuestions);
    setCurrentQuestion(0);
    setScore(0);
    setSelectedAnswer(null);
    setIsCorrect(null);
    setQuizState('playing');
  }, [filteredTerms, direction]);

  const handleAnswer = useCallback(
    (answer: string) => {
      const correct = answer === questions[currentQuestion].correctAnswer;
      setSelectedAnswer(answer);
      setIsCorrect(correct);
      if (correct) {
        setScore((prev) => prev + 1);
      }
      setQuizState('feedback');
    },
    [questions, currentQuestion]
  );

  const nextQuestion = useCallback(() => {
    if (currentQuestion + 1 >= questions.length) {
      updateQuizScore(score + (isCorrect ? 1 : 0));
      setQuizState('results');
    } else {
      setCurrentQuestion((prev) => prev + 1);
      setSelectedAnswer(null);
      setIsCorrect(null);
      setQuizState('playing');
    }
  }, [currentQuestion, questions.length, score, isCorrect, updateQuizScore]);

  const getResultMessage = (finalScore: number, total: number) => {
    const percentage = (finalScore / total) * 100;
    if (percentage === 100) return "Perfect score! You're a true blue Aussie!";
    if (percentage >= 80) return "Ripper! You know your Aussie slang!";
    if (percentage >= 60) return "Good effort, mate!";
    if (percentage >= 40) return "Not bad, keep practicing!";
    return "No worries, give it another crack!";
  };

  const question = questions[currentQuestion];

  return (
    <div className="slang-quiz">
      {quizState === 'start' && (
        <div className="quiz-start">
          <h2>Ready for a Quiz?</h2>
          <p>Test your knowledge of Aussie slang!</p>

          <div className="quiz-options">
            <div className="option-group">
              <label>Category</label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value as SlangCategory | 'all')}
                className="quiz-select"
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
              <label>Direction</label>
              <select
                value={direction}
                onChange={(e) => setDirection(e.target.value as QuizDirection)}
                className="quiz-select"
              >
                <option value="term-to-meaning">Slang → Meaning</option>
                <option value="meaning-to-term">Meaning → Slang</option>
              </select>
            </div>
          </div>

          {progress.quizHighScore > 0 && (
            <p className="high-score">High Score: {progress.quizHighScore}/{QUIZ_LENGTH}</p>
          )}

          <button className="start-btn" onClick={startQuiz}>
            Start Quiz
          </button>
        </div>
      )}

      {(quizState === 'playing' || quizState === 'feedback') && question && (
        <div className="quiz-playing">
          <div className="quiz-progress">
            <span>
              Question {currentQuestion + 1} of {questions.length}
            </span>
            <span className="quiz-score">Score: {score}</span>
          </div>

          <div className="question-card">
            <h2 className="question-text">
              {direction === 'term-to-meaning'
                ? `What does "${question.term.term}" mean?`
                : `What slang means "${question.term.meaning}"?`}
            </h2>

            <div className="answer-options">
              {question.options.map((option, index) => (
                <button
                  key={index}
                  className={`answer-btn ${
                    quizState === 'feedback'
                      ? option === question.correctAnswer
                        ? 'correct'
                        : option === selectedAnswer
                        ? 'incorrect'
                        : ''
                      : ''
                  }`}
                  onClick={() => quizState === 'playing' && handleAnswer(option)}
                  disabled={quizState === 'feedback'}
                >
                  {option}
                </button>
              ))}
            </div>
          </div>

          {quizState === 'feedback' && (
            <div className={`feedback ${isCorrect ? 'correct' : 'incorrect'}`}>
              <p>
                {isCorrect ? 'Correct!' : `Wrong! The answer was: ${question.correctAnswer}`}
              </p>
              <p className="example-text">"{question.term.example}"</p>
              <button className="next-btn" onClick={nextQuestion}>
                {currentQuestion + 1 >= questions.length ? 'See Results' : 'Next Question'}
              </button>
            </div>
          )}
        </div>
      )}

      {quizState === 'results' && (
        <div className="quiz-results">
          <h2>Quiz Complete!</h2>
          <div className="results-score">
            <span className="big-score">{score}</span>
            <span className="score-label">out of {questions.length}</span>
          </div>
          <p className="results-message">{getResultMessage(score, questions.length)}</p>
          <button className="start-btn" onClick={startQuiz}>
            Try Again
          </button>
        </div>
      )}
    </div>
  );
}

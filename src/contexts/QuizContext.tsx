import React, { createContext, useContext, useState, useEffect } from 'react';
import { Question, QuizState, UserAnswer, User } from '../types/quiz';
import questionsData from '../data/questions.json';

interface QuizContextType {
  questions: Question[];
  quizState: QuizState;
  user: User | null;
  setUser: (user: User) => void;
  updateAnswer: (questionId: number, answer: number | null) => void;
  goToQuestion: (questionIndex: number) => void;
  nextQuestion: () => void;
  previousQuestion: () => void;
  skipQuestion: () => void;
  submitQuiz: () => void;
  resetQuiz: () => void;
  updateTimer: (timeRemaining: number) => void;
  getUnansweredQuestions: () => number[];
  isQuizStarted: boolean;
  startQuiz: () => void;
}

const QuizContext = createContext<QuizContextType | undefined>(undefined);

const QUIZ_DURATION = 90 * 60 * 1000; // 90 minutes in milliseconds
const STORAGE_KEY = 'quiz-state';

export const QuizProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [questions] = useState<Question[]>(questionsData);
  const [user, setUser] = useState<User | null>(null);
  const [isQuizStarted, setIsQuizStarted] = useState(false);
  const [quizState, setQuizState] = useState<QuizState>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsedState = JSON.parse(saved);
      return {
        ...parsedState,
        startTime: parsedState.startTime || Date.now()
      };
    }
    
    return {
      currentQuestion: 0,
      answers: questions.map(q => ({
        questionId: q.id,
        selectedAnswer: null,
        isAnswered: false
      })),
      timeRemaining: QUIZ_DURATION,
      isCompleted: false,
      startTime: Date.now()
    };
  });

  // Save state to localStorage whenever it changes
  useEffect(() => {
    if (isQuizStarted) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(quizState));
    }
  }, [quizState, isQuizStarted]);

  // Load user from localStorage
  useEffect(() => {
    const savedUser = localStorage.getItem('quiz-user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }

    const savedQuizStarted = localStorage.getItem('quiz-started');
    if (savedQuizStarted === 'true') {
      setIsQuizStarted(true);
    }
  }, []);

  const startQuiz = () => {
    setIsQuizStarted(true);
    localStorage.setItem('quiz-started', 'true');
    
    // Reset timer if needed
    setQuizState(prev => ({
      ...prev,
      startTime: Date.now(),
      timeRemaining: QUIZ_DURATION
    }));
  };

  const updateAnswer = (questionId: number, answer: number | null) => {
    setQuizState(prev => ({
      ...prev,
      answers: prev.answers.map(a => 
        a.questionId === questionId 
          ? { ...a, selectedAnswer: answer, isAnswered: answer !== null }
          : a
      )
    }));
  };

  const goToQuestion = (questionIndex: number) => {
    if (questionIndex >= 0 && questionIndex < questions.length) {
      setQuizState(prev => ({ ...prev, currentQuestion: questionIndex }));
    }
  };

  const nextQuestion = () => {
    setQuizState(prev => ({
      ...prev,
      currentQuestion: Math.min(prev.currentQuestion + 1, questions.length - 1)
    }));
  };

  const previousQuestion = () => {
    setQuizState(prev => ({
      ...prev,
      currentQuestion: Math.max(prev.currentQuestion - 1, 0)
    }));
  };

  const skipQuestion = () => {
    if (quizState.currentQuestion < questions.length - 1) {
      nextQuestion();
    }
  };

  const submitQuiz = () => {
    setQuizState(prev => ({ ...prev, isCompleted: true }));
    localStorage.setItem('quiz-completed', 'true');
  };

  const resetQuiz = () => {
    setQuizState({
      currentQuestion: 0,
      answers: questions.map(q => ({
        questionId: q.id,
        selectedAnswer: null,
        isAnswered: false
      })),
      timeRemaining: QUIZ_DURATION,
      isCompleted: false,
      startTime: Date.now()
    });
    setIsQuizStarted(false);
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem('quiz-started');
    localStorage.removeItem('quiz-completed');
  };

  const updateTimer = (timeRemaining: number) => {
    setQuizState(prev => ({ ...prev, timeRemaining }));
  };

  const getUnansweredQuestions = () => {
    return quizState.answers
      .filter(answer => !answer.isAnswered)
      .map(answer => answer.questionId);
  };

  const contextValue: QuizContextType = {
    questions,
    quizState,
    user,
    setUser: (user: User) => {
      setUser(user);
      localStorage.setItem('quiz-user', JSON.stringify(user));
    },
    updateAnswer,
    goToQuestion,
    nextQuestion,
    previousQuestion,
    skipQuestion,
    submitQuiz,
    resetQuiz,
    updateTimer,
    getUnansweredQuestions,
    isQuizStarted,
    startQuiz
  };

  return (
    <QuizContext.Provider value={contextValue}>
      {children}
    </QuizContext.Provider>
  );
};

export const useQuiz = () => {
  const context = useContext(QuizContext);
  if (!context) {
    throw new Error('useQuiz must be used within a QuizProvider');
  }
  return context;
};
import React, { createContext, useContext, useState, useEffect } from 'react';
import { Question, QuizState, UserAnswer, User } from '../types/quiz';
import questionsData from '../data/questions.json';

interface QuizContextType {
  questions: Question[];
  quizState: QuizState;
  user: User | null;
  setUser: (user: User) => void;
  // Perhatikan: answer di sini adalah **indeks asli** dari opsi yang dipilih (0, 1, 2, ...)
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
  calculateScore: () => number; // Tambahkan fungsi untuk menghitung skor
}

const QuizContext = createContext<QuizContextType | undefined>(undefined);

const QUIZ_DURATION = 90 * 60 * 1000; // 90 minutes in milliseconds
const STORAGE_KEY = 'quiz-state';
const USER_STORAGE_KEY = 'quiz-user';
const START_STORAGE_KEY = 'quiz-started';

// Ambil data pertanyaan sekali
const initialQuestions: Question[] = questionsData as Question[];

const getInitialQuizState = (questions: Question[]): QuizState => ({
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

export const QuizProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Gunakan initialQuestions yang sudah diimpor
  const [questions] = useState<Question[]>(initialQuestions); 
  const [user, setUserState] = useState<User | null>(null);
  const [isQuizStarted, setIsQuizStarted] = useState(false);

  // Inisialisasi State Kuis
  const [quizState, setQuizState] = useState<QuizState>(() => {
    // 1. Coba ambil state yang tersimpan
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsedState = JSON.parse(saved);
        // Pastikan answers memiliki panjang yang sama dengan questions yang dimuat
        if (parsedState.answers.length === questions.length) {
             return {
                ...parsedState,
                // Pastikan startTime ada atau gunakan waktu sekarang
                startTime: parsedState.startTime || Date.now() 
             };
        }
      } catch (e) {
        console.error("Error parsing saved quiz state", e);
        // Jika parsing gagal, fallback ke state awal
      }
    }
    
    // 2. Fallback ke state awal jika tidak ada data tersimpan atau data korup
    return getInitialQuizState(questions);
  });

  // --- Efek Pemuatan (Load) ---
  useEffect(() => {
    // Load User
    const savedUser = localStorage.getItem(USER_STORAGE_KEY);
    if (savedUser) {
      setUserState(JSON.parse(savedUser));
    }

    // Load Quiz Started status
    const savedQuizStarted = localStorage.getItem(START_STORAGE_KEY);
    if (savedQuizStarted === 'true') {
      setIsQuizStarted(true);
    }
  }, []); // Hanya berjalan saat mount

  // --- Efek Penyimpanan (Save) ---
  useEffect(() => {
    // Simpan state hanya jika kuis sudah dimulai dan belum selesai
    if (isQuizStarted && !quizState.isCompleted) { 
      localStorage.setItem(STORAGE_KEY, JSON.stringify(quizState));
    }
  }, [quizState, isQuizStarted]);
  
  // --- Aksi Kuis ---

  const startQuiz = () => {
    setIsQuizStarted(true);
    localStorage.setItem(START_STORAGE_KEY, 'true');
    
    // Reset timer dan answers saat kuis dimulai (jika belum selesai)
    if (!quizState.isCompleted) {
        setQuizState(prev => ({
            ...prev,
            answers: getInitialQuizState(questions).answers, // Reset jawaban
            startTime: Date.now(),
            timeRemaining: QUIZ_DURATION
        }));
    }
  };

  // Fungsi ini menerima **indeks asli** dari Question.tsx (Sudah Benar)
  const updateAnswer = (questionId: number, answer: number | null) => {
    setQuizState(prev => ({
      ...prev,
      answers: prev.answers.map(a => 
        a.questionId === questionId 
          ? { 
              ...a, 
              selectedAnswer: answer, 
              isAnswered: answer !== null 
            }
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
    localStorage.removeItem(STORAGE_KEY); // Hapus state yang sedang berjalan setelah submit
  };

  const resetQuiz = () => {
    setQuizState(getInitialQuizState(questions)); // Gunakan fungsi inisialisasi yang rapi
    setIsQuizStarted(false);
    
    // Hapus semua data kuis terkait
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(START_STORAGE_KEY);
    localStorage.removeItem('quiz-completed');
    localStorage.removeItem(USER_STORAGE_KEY); // Hapus juga user saat reset total
    setUserState(null);
  };

  const updateTimer = (timeRemaining: number) => {
    // Hanya update jika kuis belum selesai
    if (!quizState.isCompleted) {
        setQuizState(prev => ({ ...prev, timeRemaining }));
    }
  };

  const getUnansweredQuestions = () => {
    // Ubah .map(answer => answer.questionId) menjadi .map((answer, index) => index) 
    // agar mengembalikan indeks (0-based) pertanyaan, bukan ID (1-based)
    return quizState.answers
      .map((answer, index) => ({ answer, index }))
      .filter(({ answer }) => !answer.isAnswered)
      .map(({ index }) => index);
  };
  
  const calculateScore = () => {
    if (!quizState.isCompleted) return 0;

    let correctCount = 0;
    
    quizState.answers.forEach(userAnswer => {
        const questionData = questions.find(q => q.id === userAnswer.questionId);
        
        // Membandingkan selectedAnswer (indeks asli) dengan correctAnswer (indeks asli)
        if (questionData && userAnswer.selectedAnswer === questionData.correctAnswer) {
            correctCount++;
        }
    });
    
    return correctCount;
  };

  const contextValue: QuizContextType = {
    questions,
    quizState,
    user,
    setUser: (user: User) => {
      setUserState(user);
      localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
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
    startQuiz,
    calculateScore
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
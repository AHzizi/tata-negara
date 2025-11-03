import React from 'react';
import { Question as QuestionType } from '../types/quiz';
import { useQuiz } from '../contexts/QuizContext';

interface QuestionProps {
  question: QuestionType;
}

export const Question: React.FC<QuestionProps> = ({ question }) => {
  const { quizState, updateAnswer } = useQuiz();
  
  const currentAnswer = quizState.answers.find(a => a.questionId === question.id);
  const selectedAnswer = currentAnswer?.selectedAnswer;

  const handleAnswerSelect = (answerIndex: number) => {
    updateAnswer(question.id, answerIndex);
  };

  const optionLabels = ['A', 'B', 'C', 'D', 'E'];

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-md border border-sky-100 dark:border-gray-700">
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Question {question.id}
          </h2>
          <span className="text-sm text-gray-500 dark:text-gray-400">
            {quizState.currentQuestion + 1} of {quizState.answers.length}
          </span>
        </div>
        
        <p className="text-gray-800 dark:text-gray-200 text-base leading-relaxed">
          {question.question}
        </p>
      </div>

      <div className="space-y-3">
        {question.options.map((option, index) => (
          <button
            key={index}
            onClick={() => handleAnswerSelect(index)}
            className={`w-full text-left p-4 rounded-lg border-2 transition-all duration-200 hover:scale-[1.02] focus:outline-none focus:ring-2 focus:ring-pink-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800 ${
              selectedAnswer === index
                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'
                : 'border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:border-sky-300 dark:hover:border-blue-400'
            }`}
          >
            <div className="flex items-center space-x-3">
              <div className={`flex items-center justify-center w-8 h-8 rounded-full border-2 font-semibold text-sm ${
                selectedAnswer === index
                  ? 'border-blue-500 bg-blue-500 text-white'
                  : 'border-gray-300 dark:border-gray-500 text-gray-600 dark:text-gray-400'
              }`}>
                {optionLabels[index]}
              </div>
              <span className="flex-1">{option}</span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};
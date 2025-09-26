import React, { useState } from 'react';
import axios from 'axios';
import { toast } from 'react-hot-toast';

const Quiz = () => {
  const [quiz, setQuiz] = useState(null);
  const [answers, setAnswers] = useState({});
  const [score, setScore] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const generateQuiz = async () => {
    setIsLoading(true);
    try {
      const response = await axios.get('http://localhost:5000/quiz');
      setQuiz(response.data);
      setAnswers({});
      setScore(null);
      toast.success('Quiz generated!');
    } catch (error) {
      console.error('Error generating quiz:', error);
      toast.error('Failed to generate quiz');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAnswerChange = (qId, value) => {
    setAnswers((prev) => ({ ...prev, [qId]: value }));
  };

  const submitQuiz = () => {
    let totalScore = 0;
    quiz.questions.forEach((q) => {
      let correctAnswer = q.correct_answer;

      // Convert boolean correct_answer to string for true_false questions
      if (q.type === 'true_false') {
        correctAnswer = correctAnswer.toString();
      }

      if (answers[q.id] === correctAnswer) totalScore++;
    });
    setScore(`${totalScore} / ${quiz.questions.length}`);
    toast.success('Quiz submitted!');
  };

  const answeredCount = Object.keys(answers).length;
  const totalQuestions = quiz ? quiz.questions.length : 0;
  const progress = totalQuestions > 0 ? (answeredCount / totalQuestions) * 100 : 0;

  return (
    <div className="max-w-5xl mx-auto py-8">
      <div className="card">
        <h1 className="text-3xl mb-6 flex items-center gap-2">
          <i className="fas fa-question-circle"></i> Quiz Time
        </h1>

        {quiz && (
          <div className="mb-6">
            <div className="relative pt-1">
              <div className="flex mb-2 items-center justify-between">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-200">
                  Progress: {answeredCount}/{totalQuestions}
                </span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2.5">
                <div
                  className="bg-blue-600 h-2.5 rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                ></div>
              </div>
            </div>
          </div>
        )}

        {!quiz ? (
          <button
            onClick={generateQuiz}
            disabled={isLoading}
            className="btn-primary"
          >
            {isLoading ? (
              <>
                <i className="fas fa-spinner fa-spin"></i> Generating...
              </>
            ) : (
              <>
                <i className="fas fa-play"></i> Generate Quiz
              </>
            )}
          </button>
        ) : isLoading ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div
                key={i}
                className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg border animate-pulse"
              >
                <div className="h-6 bg-gray-200 dark:bg-gray-600 rounded w-3/4 mb-4"></div>
                <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded w-1/2 mb-2"></div>
                <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        ) : (
          <>
            {quiz.questions.map((q) => (
              <div
                key={q.id}
                className="mb-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg border"
              >
                <p className="font-semibold text-lg mb-2">
                  {q.question}{' '}
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    ({q.type})
                  </span>
                </p>

                {q.type === 'mcq' &&
                  q.options.map((opt, i) => (
                    <label key={i} className="block mb-2">
                      <input
                        type="radio"
                        name={`q${q.id}`}
                        value={opt}
                        checked={answers[q.id] === opt}
                        onChange={() => handleAnswerChange(q.id, opt)}
                        className="mr-2"
                      />
                      {opt}
                    </label>
                  ))}

                {q.type === 'true_false' && (
                  <>
                    <label className="block mb-2">
                      <input
                        type="radio"
                        name={`q${q.id}`}
                        value="true"
                        checked={answers[q.id] === 'true'}
                        onChange={() => handleAnswerChange(q.id, 'true')}
                        className="mr-2"
                      />
                      True
                    </label>
                    <label className="block">
                      <input
                        type="radio"
                        name={`q${q.id}`}
                        value="false"
                        checked={answers[q.id] === 'false'}
                        onChange={() => handleAnswerChange(q.id, 'false')}
                        className="mr-2"
                      />
                      False
                    </label>
                  </>
                )}

                {q.type === 'short_answer' && (
                  <input
                    type="text"
                    className="input-field"
                    value={answers[q.id] || ''}
                    onChange={(e) => handleAnswerChange(q.id, e.target.value)}
                    placeholder="Type your answer..."
                  />
                )}
              </div>
            ))}

            <button
              onClick={submitQuiz}
              className="btn-primary"
              disabled={answeredCount < totalQuestions}
            >
              <i className="fas fa-check"></i> Submit Quiz
            </button>

            {score && (
              <div className="mt-6 p-4 bg-green-100 dark:bg-green-800 rounded-lg flex items-center gap-2">
                <i className="fas fa-trophy text-green-600 dark:text-green-400"></i>
                <p className="text-lg font-semibold">Score: {score}</p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default Quiz;

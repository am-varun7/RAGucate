import React, { useState } from 'react';
import axios from 'axios';
import { toast } from 'react-hot-toast';

const Summary = () => {
  const [summaries, setSummaries] = useState([]);
  const [flashcards, setFlashcards] = useState([]);
  const [flippedCard, setFlippedCard] = useState(null);
  const [isLoadingSummary, setIsLoadingSummary] = useState(false);
  const [isLoadingFlashcards, setIsLoadingFlashcards] = useState(false);

  const generateSummary = async () => {
    setIsLoadingSummary(true);
    try {
      const response = await axios.get('http://localhost:5000/summary');
      setSummaries(response.data.summaries || []);
      toast.success('Summaries generated!');
    } catch (error) {
      console.error('Error generating summary:', error);
      toast.error('Failed to generate summaries');
    } finally {
      setIsLoadingSummary(false);
    }
  };

  const generateFlashcards = async () => {
    setIsLoadingFlashcards(true);
    try {
      const response = await axios.get('http://localhost:5000/summary?type=flashcards');
      setFlashcards(response.data.flashcards || []);
      toast.success('Flashcards generated!');
    } catch (error) {
      console.error('Error generating flashcards:', error);
      toast.error('Failed to generate flashcards');
    } finally {
      setIsLoadingFlashcards(false);
    }
  };

  const handleCardClick = (index) => {
    setFlippedCard(flippedCard === index ? null : index);
  };

  return (
    <div className="max-w-5xl mx-auto py-8">
      <div className="card">
        <h1 className="text-3xl mb-6 flex items-center gap-2">
          <i className="fas fa-book-open"></i> Summaries & Flashcards
        </h1>
        <div className="flex gap-4 mb-6">
          <button
            onClick={generateSummary}
            disabled={isLoadingSummary}
            className="btn-primary"
          >
            {isLoadingSummary ? (
              <>
                <i className="fas fa-spinner fa-spin"></i> Generating...
              </>
            ) : (
              <>
                <i className="fas fa-file-alt"></i> Generate Summary
              </>
            )}
          </button>
          <button
            onClick={generateFlashcards}
            disabled={isLoadingFlashcards}
            className="btn-secondary"
          >
            {isLoadingFlashcards ? (
              <>
                <i className="fas fa-spinner fa-spin"></i> Generating...
              </>
            ) : (
              <>
                <i className="fas fa-clone"></i> Generate Flashcards
              </>
            )}
          </button>
        </div>
        {isLoadingSummary ? (
          <div className="space-y-4">
            {[...Array(2)].map((_, i) => (
              <div key={i} className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg border animate-pulse">
                <div className="h-6 bg-gray-200 dark:bg-gray-600 rounded w-1/4 mb-4"></div>
                <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded w-3/4 mb-2"></div>
                <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        ) : summaries.length > 0 ? (
          <div className="mb-8">
            <h2 className="text-2xl mb-4 flex items-center gap-2">
              <i className="fas fa-list"></i> Chapter Summaries
            </h2>
            {summaries.map((sum, i) => (
              <div key={i} className="mb-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg border hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors">
                <h3 className="text-lg font-semibold text-blue-600 dark:text-blue-400">{sum.chapter}</h3>
                <p className="text-gray-700 dark:text-gray-200">{sum.summary}</p>
                <ul className="list-disc ml-6 mt-2">
                  {sum.key_points.map((point, j) => (
                    <li key={j} className="text-gray-600 dark:text-gray-300">{point}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        ) : null}
        {isLoadingFlashcards ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="p-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg shadow animate-pulse">
                <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded w-3/4 mb-2"></div>
                <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        ) : flashcards.length > 0 ? (
          <div>
            <h2 className="text-2xl mb-4 flex items-center gap-2">
              <i className="fas fa-clone"></i> Flashcards
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {flashcards.map((card, i) => (
                <div
                  key={i}
                  className={`relative p-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg shadow hover:shadow-lg transition-transform duration-500 transform cursor-pointer ${
                    flippedCard === i ? 'rotate-y-180' : ''
                  }`}
                  onClick={() => handleCardClick(i)}
                  style={{ transformStyle: 'preserve-3d' }}
                >
                  <div
                    className={`absolute inset-0 p-4 ${
                      flippedCard === i ? 'opacity-0' : 'opacity-100'
                    } transition-opacity duration-500`}
                    style={{ backfaceVisibility: 'hidden' }}
                  >
                    <p className="font-semibold text-blue-600 dark:text-blue-400">Q: {card.front}</p>
                  </div>
                  <div
                    className={`absolute inset-0 p-4 ${
                      flippedCard === i ? 'opacity-100' : 'opacity-0'
                    } transition-opacity duration-500 rotate-y-180`}
                    style={{ backfaceVisibility: 'hidden' }}
                  >
                    <p className="text-gray-700 dark:text-gray-200">A: {card.back}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
};

export default Summary;
import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-hot-toast';

const Chat = () => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const chatRef = useRef(null);

  const handleSend = async () => {
    if (!input.trim()) {
      toast.error('Please enter a question');
      return;
    }
    const userMessage = { role: 'user', content: input, timestamp: new Date().toLocaleTimeString() };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await axios.post('http://localhost:5000/ask', { question: input });
      const aiMessage = {
        role: 'ai',
        content: response.data.answer,
        sources: response.data.sources || [],
        timestamp: new Date().toLocaleTimeString(),
      };
      setMessages((prev) => [...prev, aiMessage]);
    } catch (error) {
      console.error('Error asking question:', error);
      toast.error('Failed to get response');
    } finally {
      setIsLoading(false);
    }
  };

  const clearChat = () => {
    setMessages([]);
    toast.success('Chat cleared');
  };

  useEffect(() => {
    chatRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <div className="max-w-5xl mx-auto py-8">
      <div className="card">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl flex items-center gap-2">
            <i className="fas fa-robot"></i> AI Tutor Chat
          </h1>
          <button
            onClick={clearChat}
            className="btn-secondary text-sm"
          >
            <i className="fas fa-trash"></i> Clear Chat
          </button>
        </div>
        <div className="h-[500px] overflow-y-auto border border-gray-200 dark:border-gray-600 rounded-lg p-4 mb-6 bg-gray-50 dark:bg-gray-700">
          {messages.length === 0 ? (
            <p className="text-gray-500 dark:text-gray-400 text-center mt-20">Start asking questions to your AI tutor!</p>
          ) : (
            messages.map((msg, index) => (
              <div
                key={index}
                className={`mb-4 flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[70%] p-3 rounded-lg transition-all ${
                    msg.role === 'user'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-200 dark:bg-gray-600 text-gray-800 dark:text-gray-200'
                  }`}
                >
                  {msg.content}
                  <div className="text-xs mt-2 opacity-80">
                    {msg.timestamp}
                    {msg.sources && msg.sources.length > 0 && (
                      <>
                        {' | Sources: '}
                        {msg.sources.map((source, i) => (
                          <span key={i}>
                            {source}
                            {i < msg.sources.length - 1 ? ', ' : ''}
                          </span>
                        ))}
                        {msg.sources.some((s) => s === 'internet') && ' (sourced from internet)'}
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
          {isLoading && (
            <div className="text-center text-gray-500 dark:text-gray-400">
              <i className="fas fa-spinner fa-spin mr-2"></i> Loading...
            </div>
          )}
          <div ref={chatRef} />
        </div>
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className="input-field"
            placeholder="Ask a question..."
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            disabled={isLoading}
          />
          <button
            onClick={handleSend}
            disabled={isLoading}
            className="btn-primary"
          >
            <i className="fas fa-paper-plane"></i> Send
          </button>
        </div>
      </div>
    </div>
  );
};

export default Chat;
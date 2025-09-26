import React, { useState } from 'react';
import { Link } from 'react-router-dom';

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);

  const toggleSidebar = () => {
    setIsOpen(!isOpen);
  };

  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode);
    document.documentElement.classList.toggle('dark');
  };

  return (
    <>
      {/* Mobile toggle button */}
      <button
        onClick={toggleSidebar}
        className="md:hidden fixed top-4 left-4 z-50 p-2 bg-indigo-600 text-white rounded-lg focus:outline-none hover:bg-indigo-700 transition-colors"
      >
        <i className={`fas ${isOpen ? 'fa-times' : 'fa-bars'}`}></i>
      </button>

      {/* Sidebar */}
      <nav
        className={`fixed top-0 left-0 h-full bg-gradient-to-b from-indigo-600 to-teal-500 text-white w-64 p-6 transform ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        } md:translate-x-0 transition-all duration-300 ease-in-out z-40 shadow-lg border-r border-indigo-300 dark:border-indigo-800 hover:w-72 group`}
      >
        <h1 className="text-2xl font-bold mb-8 flex items-center gap-2">
          <i className="fas fa-book"></i> RAGucate
        </h1>
        <div className="space-y-4">
          <Link
            to="/upload"
            className="block py-2 px-4 rounded-lg hover:bg-purple-500 transition-colors flex items-center gap-2"
            onClick={() => setIsOpen(false)}
          >
            <i className="fas fa-upload"></i> Upload
          </Link>
          <Link
            to="/chat"
            className="block py-2 px-4 rounded-lg hover:bg-purple-500 transition-colors flex items-center gap-2"
            onClick={() => setIsOpen(false)}
          >
            <i className="fas fa-robot"></i> Chat
          </Link>
          <Link
            to="/quiz"
            className="block py-2 px-4 rounded-lg hover:bg-purple-500 transition-colors flex items-center gap-2"
            onClick={() => setIsOpen(false)}
          >
            <i className="fas fa-question-circle"></i> Quiz
          </Link>
          <Link
            to="/summary"
            className="block py-2 px-4 rounded-lg hover:bg-purple-500 transition-colors flex items-center gap-2"
            onClick={() => setIsOpen(false)}
          >
            <i className="fas fa-book-open"></i> Summary
          </Link>
          <button
            onClick={toggleTheme}
            className="w-full text-left py-2 px-4 rounded-lg hover:bg-purple-500 transition-colors flex items-center gap-2"
          >
            <i className={`fas ${isDarkMode ? 'fa-sun' : 'fa-moon'}`}></i>
            {isDarkMode ? 'Light Mode' : 'Dark Mode'}
          </button>
        </div>
      </nav>

      {/* Overlay for mobile when sidebar is open */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 md:hidden z-30"
          onClick={toggleSidebar}
        ></div>
      )}
    </>
  );
};

export default Navbar;
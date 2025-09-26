import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Navbar from './components/Navbar';
import Upload from './components/Upload';
import Chat from './components/Chat';
import Quiz from './components/Quiz';
import Summary from './components/Summary';

function App() {
  return (
    <Router>
      <div className="min-h-screen flex">
        <Navbar />
        <main className="flex-1 p-4 md:ml-64">
          <Toaster position="top-right" toastOptions={{ duration: 3000 }} />
          <Routes>
            <Route path="/upload" element={<Upload />} />
            <Route path="/chat" element={<Chat />} />
            <Route path="/quiz" element={<Quiz />} />
            <Route path="/summary" element={<Summary />} />
            <Route path="/" element={<Upload />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
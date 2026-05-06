import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useLocalStorage } from '../hooks/useLocalStorage';

const StudyContext = createContext(null);

export function StudyProvider({ children }) {
  const [activeSectionId, setActiveSectionId] = useState('hero');
  const [theme, setTheme] = useLocalStorage('app_theme', 'light');
  const [buddyName, setBuddyName] = useLocalStorage('buddy_name', 'Study Buddy');
  
  // Lifted shared library state to context for syncing
  const [savedLibrary, setSavedLibrary] = useLocalStorage('study_library', []);
  
  // Pre-fill states for different sections
  const [learnPrefill, setLearnPrefill] = useState('');
  const [explainPrefill, setExplainPrefill] = useState('');
  const [quizPrefill, setQuizPrefill] = useState('');

  // Handle dark mode class on document
  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  const prefillLearn = useCallback((topic) => {
    setLearnPrefill(topic);
    document.getElementById('learn')?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  const prefillExplain = useCallback((topic) => {
    setExplainPrefill(topic);
    document.getElementById('explain')?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  const prefillQuiz = useCallback((topic) => {
    setQuizPrefill(topic);
    document.getElementById('quiz')?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  const value = {
    activeSectionId,
    setActiveSectionId,
    theme,
    toggleTheme,
    buddyName,
    setBuddyName,
    savedLibrary,
    setSavedLibrary,
    learnPrefill,
    setLearnPrefill,
    prefillLearn,
    explainPrefill,
    setExplainPrefill,
    prefillExplain,
    quizPrefill,
    setQuizPrefill,
    prefillQuiz
  };

  return (
    <StudyContext.Provider value={value}>
      {children}
    </StudyContext.Provider>
  );
}

export function useStudyContext() {
  const context = useContext(StudyContext);
  if (!context) {
    throw new Error('useStudyContext must be used within a StudyProvider');
  }
  return context;
}

import { createContext, useContext, useReducer, useEffect } from 'react';

const StudyContext = createContext(null);

function getInitialState() {
  const buddyName = localStorage.getItem('buddy_name') || null;
  let savedConcepts = [];
  try {
    const raw = localStorage.getItem('saved_concepts');
    if (raw) savedConcepts = JSON.parse(raw);
  } catch {
    savedConcepts = [];
  }

  return {
    buddyName,
    currentView: buddyName ? 'home' : 'setup',
    buddyMood: 'idle',
    currentConcept: '',
    conceptPage: null,
    quiz: {
      active: false,
      score: 0,
      round: 0,
      difficulty: 'easy',
      currentQuestion: null,
    },
    savedConcepts,
    pendingAlerts: [],
    isListening: false,
    transcript: '',
  };
}

function studyReducer(state, action) {
  switch (action.type) {
    case 'SET_BUDDY_NAME':
      return { ...state, buddyName: action.payload };

    case 'SET_VIEW':
      return { ...state, currentView: action.payload };

    case 'SET_MOOD': {
      const valid = ['idle', 'listening', 'thinking', 'celebrating'];
      if (!valid.includes(action.payload)) return state;
      return { ...state, buddyMood: action.payload };
    }

    case 'SET_CONCEPT':
      return { ...state, currentConcept: action.payload };

    case 'SET_CONCEPT_PAGE':
      return { ...state, conceptPage: action.payload };

    case 'QUIZ_START':
      return {
        ...state,
        quiz: {
          active: true,
          score: 0,
          round: 0,
          difficulty: 'easy',
          currentQuestion: null,
        },
      };

    case 'QUIZ_QUESTION':
      return {
        ...state,
        quiz: { ...state.quiz, currentQuestion: action.payload },
      };

    case 'QUIZ_ANSWER': {
      const newScore = action.payload.correct ? state.quiz.score + 1 : state.quiz.score;
      const newRound = state.quiz.round + 1;
      const difficulty = newScore >= 3 ? 'hard' : newScore >= 1 ? 'medium' : 'easy';
      return { ...state, quiz: { ...state.quiz, score: newScore, round: newRound, difficulty } };
    }

    case 'QUIZ_END':
      return {
        ...state,
        quiz: { ...state.quiz, active: false },
      };

    case 'SAVE_CONCEPT': {
      const exists = state.savedConcepts.some(c => c.concept === action.payload.concept);
      if (exists) return state;
      return { ...state, savedConcepts: [...state.savedConcepts, action.payload] };
    }

    case 'SET_LISTENING':
      return { ...state, isListening: action.payload };

    case 'SET_TRANSCRIPT':
      return { ...state, transcript: action.payload };

    case 'SET_ALERTS':
      return { ...state, pendingAlerts: action.payload };

    default:
      return state;
  }
}

export function StudyProvider({ children }) {
  const [state, dispatch] = useReducer(studyReducer, undefined, getInitialState);

  useEffect(() => {
    if (state.buddyName !== null) {
      localStorage.setItem('buddy_name', state.buddyName);
    } else {
      localStorage.removeItem('buddy_name');
    }
  }, [state.buddyName]);

  useEffect(() => {
    localStorage.setItem('saved_concepts', JSON.stringify(state.savedConcepts));
  }, [state.savedConcepts]);

  return (
    <StudyContext.Provider value={{ state, dispatch }}>
      {children}
    </StudyContext.Provider>
  );
}

export function useStudy() {
  const context = useContext(StudyContext);
  if (context === null) {
    throw new Error('useStudy must be used within a StudyProvider');
  }
  return context;
}

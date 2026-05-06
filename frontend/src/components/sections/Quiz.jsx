import React, { useState, useEffect, useRef } from 'react';
import { CheckSquare, Play, RefreshCw, Save, ArrowRight, Mic } from 'lucide-react';
import { useStudyContext } from '../../context/StudyContext';
import { useLocalStorage } from '../../hooks/useLocalStorage';

export default function Quiz() {
  const { setActiveSectionId, quizPrefill, setQuizPrefill, setLearnPrefill } = useStudyContext();
  const [topic, setTopic] = useState('');
  
  // Quiz State
  const [session, setSession] = useLocalStorage('active_quiz_session', null);
  const [status, setStatus] = useState('idle'); // idle | active | mastered | exhausted
  const [question, setQuestion] = useState(null);
  const [answer, setAnswer] = useState('');
  const [feedback, setFeedback] = useState(null); // { correct: boolean, explanation: string }
  const [showConfetti, setShowConfetti] = useState(false);

  const sectionRef = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) setActiveSectionId('quiz');
      },
      { threshold: 0.3 }
    );
    if (sectionRef.current) observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, [setActiveSectionId]);

  useEffect(() => {
    if (quizPrefill) {
      setTopic(quizPrefill);
      setQuizPrefill('');
      if (!session || session.topic !== quizPrefill) {
        setStatus('idle');
      }
    }
  }, [quizPrefill, session]);

  // Restore session on mount
  useEffect(() => {
    if (session && session.status === 'active') {
      setStatus('active');
      setTopic(session.topic);
      if (session.backendState && session.backendState.current_question) {
        setQuestion(session.backendState.current_question);
      }
    }
  }, []);

  const startQuiz = async () => {
    if (!topic.trim()) return;
    setStatus('active');
    setFeedback(null);
    setAnswer('');
    setShowConfetti(false);
    
    try {
      const res = await fetch('http://localhost:8000/api/quiz/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ concept: topic, saved_concepts: [] })
      });
      if (!res.ok) throw new Error('Failed to start quiz');
      const backendState = await res.json();
      
      const newSession = {
        id: Date.now().toString(),
        topic,
        round: 1,
        score: { correct: 0, wrong: 0 },
        difficulty: backendState.difficulty || 'easy',
        status: 'active',
        backendState
      };
      
      setSession(newSession);
      setQuestion(backendState.current_question);
      
    } catch (err) {
      console.error(err);
      setStatus('idle');
      alert("Error starting quiz. Ensure backend is running.");
    }
  };

  const submitAnswer = async () => {
    if (!answer || !question) return;
    
    const answerIndex = question.options.indexOf(answer);
    
    try {
      const res = await fetch('http://localhost:8000/api/quiz/answer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ answer_index: answerIndex, state: session.backendState })
      });
      if (!res.ok) throw new Error('Failed to submit answer');
      const data = await res.json();
      
      setFeedback({
        correct: data.correct,
        explanation: data.explanation,
        next_step: data.next_step,
        next_state: data.state
      });

      const newScore = {
        correct: session.score.correct + (data.correct ? 1 : 0),
        wrong: session.score.wrong + (data.correct ? 0 : 1)
      };

      setSession({
        ...session,
        score: newScore,
        difficulty: data.state.difficulty,
        backendState: data.state
      });
      
    } catch (err) {
      console.error(err);
      alert("Error submitting answer.");
    }
  };

  const nextQuestion = () => {
    if (!feedback) return;
    
    if (feedback.next_step === 'mastered') {
      setStatus('mastered');
      setSession({ ...session, status: 'mastered' });
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 3500);
      return;
    }

    if (feedback.next_step === 'exhausted' || session.round >= 10) {
      setStatus('exhausted');
      setSession({ ...session, status: 'exhausted' });
      return;
    }

    setSession({ ...session, round: session.round + 1 });
    setQuestion(feedback.next_state.current_question);
    setFeedback(null);
    setAnswer('');
  };

  const getDiffColor = (diff) => {
    if (diff === 'Easy') return 'text-success bg-success/10 border-success/20';
    if (diff === 'Medium') return 'text-warning bg-warning/10 border-warning/20';
    return 'text-error bg-error/10 border-error/20';
  };

  return (
    <section id="quiz" ref={sectionRef} className="py-20 px-4 min-h-screen relative overflow-hidden flex items-center">
      {showConfetti && (
        <div className="absolute inset-0 pointer-events-none z-50 flex justify-center">
          {[...Array(20)].map((_, i) => (
            <div 
              key={i} 
              className="w-4 h-4 absolute top-0 animate-confetti"
              style={{
                left: `${Math.random() * 100}%`,
                backgroundColor: ['#7c3aed', '#10b981', '#f59e0b', '#ef4444', '#3b82f6'][Math.floor(Math.random() * 5)],
                animationDelay: `${Math.random() * 0.5}s`,
                animationDuration: `${2 + Math.random()}s`
              }}
            />
          ))}
        </div>
      )}

      <div className="max-w-2xl mx-auto w-full space-y-8">
        
        {/* Header */}
        <div className="text-center space-y-4">
          <h2 className="text-3xl font-bold flex items-center justify-center gap-2">
            <CheckSquare className="text-primary" /> Adaptive Quiz
          </h2>
          <p className="text-text-secondary">Test your knowledge. Difficulty adapts as you answer.</p>
        </div>

        {status === 'idle' && (
          <div className="bg-surface/60 backdrop-blur-xl border border-white/20 dark:border-white/10 rounded-3xl p-10 shadow-xl text-center space-y-6 transition-all duration-300 hover:shadow-2xl">
            <div className="max-w-md mx-auto space-y-4">
              <input
                type="text"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="Topic to quiz on..."
                className="w-full px-4 py-3 bg-surface-raised border border-surface-raised rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 text-text-primary"
              />
              <div className="text-sm text-text-muted flex items-center justify-center gap-2">
                <span className="w-2 h-2 rounded-full bg-success"></span> Starting difficulty: Easy
              </div>
              <button
                onClick={startQuiz}
                disabled={!topic.trim()}
                className="w-full bg-primary text-white py-3 rounded-xl font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                <Play className="w-5 h-5 fill-current" /> Start Quiz
              </button>
            </div>
          </div>
        )}

        {status === 'active' && session && question && (
          <div className="space-y-6">
            {/* Top Bar */}
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-surface/40 backdrop-blur-md px-6 py-4 rounded-2xl border border-white/20 dark:border-white/10 shadow-sm">
              <div className="flex-1 w-full">
                <div className="flex justify-between text-xs font-medium text-text-muted mb-1">
                  <span>Round {session.round} of 10</span>
                  <span>{Math.round((session.round/10)*100)}%</span>
                </div>
                <div className="w-full h-2 bg-surface-raised rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-primary transition-all duration-500" 
                    style={{ width: `${(session.round/10)*100}%` }}
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <span className="px-3 py-1 bg-surface-raised rounded-full text-xs font-medium flex items-center gap-1">
                  ✅ {session.score.correct}
                </span>
                <span className="px-3 py-1 bg-surface-raised rounded-full text-xs font-medium flex items-center gap-1">
                  ❌ {session.score.wrong}
                </span>
                <span className={`px-3 py-1 border rounded-full text-xs font-medium ${getDiffColor(session.difficulty)}`}>
                  {session.difficulty}
                </span>
              </div>
            </div>

            {/* Question Card */}
            <div className={`bg-surface/60 backdrop-blur-xl p-6 md:p-10 rounded-3xl shadow-xl border-2 transition-all duration-300 hover:shadow-2xl ${
              feedback ? (feedback.correct ? 'border-success/50' : 'border-error/50') : 'border-white/20 dark:border-white/10'
            }`}>
              <h3 className="text-xl font-medium text-text-primary mb-8">{question.text}</h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {question.options.map((opt, i) => (
                  <button
                    key={i}
                    onClick={() => !feedback && setAnswer(opt)}
                    disabled={!!feedback}
                    className={`p-4 rounded-xl border text-left transition-all ${
                      answer === opt
                        ? 'border-primary bg-primary/5 ring-2 ring-primary/20'
                        : 'border-surface-raised hover:border-text-muted bg-surface-raised/30'
                    } ${feedback ? 'opacity-80 cursor-not-allowed' : ''}`}
                  >
                    {opt}
                  </button>
                ))}
              </div>

              {!feedback ? (
                <div className="mt-8 flex justify-between items-center">
                  <button className="text-text-secondary hover:text-primary p-2 rounded-full hover:bg-surface-raised transition-colors">
                    <Mic className="w-5 h-5" />
                  </button>
                  <button
                    onClick={submitAnswer}
                    disabled={!answer}
                    className="bg-primary text-white px-8 py-2.5 rounded-xl font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
                  >
                    Submit Answer
                  </button>
                </div>
              ) : (
                <div className="mt-8 space-y-6 animate-in slide-in-from-bottom-4 fade-in">
                  <div className={`p-4 rounded-xl flex gap-3 ${feedback.correct ? 'bg-success/10 text-success' : 'bg-error/10 text-error'}`}>
                    <div className="font-bold text-xl">{feedback.correct ? '✅' : '❌'}</div>
                    <div>
                      <p className="font-medium mb-1">{feedback.correct ? 'Correct!' : 'Incorrect'}</p>
                      <p className="text-sm opacity-90">{feedback.explanation}</p>
                    </div>
                  </div>
                  <button
                    onClick={nextQuestion}
                    className="w-full bg-surface-raised text-text-primary px-8 py-3 rounded-xl font-medium hover:bg-surface-raised/80 transition-colors flex justify-center items-center gap-2"
                  >
                    Next Question <ArrowRight className="w-5 h-5" />
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {(status === 'mastered' || status === 'exhausted') && (
          <div className="bg-surface/60 backdrop-blur-xl border border-white/20 dark:border-white/10 rounded-3xl p-12 text-center space-y-6 shadow-xl transition-all duration-300 hover:shadow-2xl">
            <div className="text-6xl mb-4">{status === 'mastered' ? '🎉' : '📈'}</div>
            <h3 className="text-2xl font-bold text-text-primary">
              {status === 'mastered' ? 'Topic Mastered!' : 'Keep Practicing'}
            </h3>
            <div className="text-text-secondary max-w-md mx-auto space-y-2">
              <p>Final Score: {session?.score.correct}/10 correct</p>
              <p>Difficulty Reached: {session?.difficulty}</p>
            </div>
            
            <div className="flex flex-col sm:flex-row justify-center gap-4 pt-6 border-t border-surface-raised">
              {status === 'mastered' && (
                <button 
                  onClick={() => alert('Saved mastery to library!')}
                  className="flex items-center justify-center gap-2 px-6 py-2.5 bg-primary/10 text-primary rounded-xl font-medium hover:bg-primary/20 transition-colors"
                >
                  <Save className="w-5 h-5" /> Save to Library
                </button>
              )}
              <button
                onClick={() => setStatus('idle')}
                className="flex items-center justify-center gap-2 px-6 py-2.5 bg-surface-raised text-text-primary rounded-xl font-medium hover:bg-surface-raised/80 transition-colors"
              >
                <RefreshCw className="w-5 h-5" /> {status === 'mastered' ? 'Quiz Again' : 'Try Again'}
              </button>
              <button
                onClick={() => {
                  setLearnPrefill(session?.topic || '');
                  setStatus('idle');
                }}
                className="flex items-center justify-center gap-2 px-6 py-2.5 bg-surface-raised text-text-primary rounded-xl font-medium hover:bg-surface-raised/80 transition-colors"
              >
                Review Topic
              </button>
            </div>
          </div>
        )}

      </div>
    </section>
  );
}

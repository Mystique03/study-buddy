import React, { useState, useEffect, useRef } from 'react';
import { BookOpen, Mic, ArrowRight, Palette, CheckSquare, Save, Volume2 } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { useStudyContext } from '../../context/StudyContext';
import { useLocalStorage } from '../../hooks/useLocalStorage';

export default function Learn() {
  const { setActiveSectionId, learnPrefill, setLearnPrefill, prefillExplain, prefillQuiz, setSavedLibrary } = useStudyContext();
  const [topicInput, setTopicInput] = useState('');
  const [currentTopic, setCurrentTopic] = useState('');
  const [status, setStatus] = useState('idle'); // idle | loading | streaming | done | error
  const [response, setResponse] = useState('');
  const [modelUsed, setModelUsed] = useState('llama-3.1-8b-instant');
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  
  const [recentTopics, setRecentTopics] = useLocalStorage('recent_topics', []);
  
  const sectionRef = useRef(null);
  const recognitionRef = useRef(null);

  // Browser Web Speech API — Voice to Text
  const startVoiceInput = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert('Voice input is not supported in this browser. Please use Google Chrome.');
      return;
    }
    const recognition = new SpeechRecognition();
    recognition.lang = 'en-US';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
    recognitionRef.current = recognition;
    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => setIsListening(false);
    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      setTopicInput(transcript);
      fetchExplanation(transcript);
    };
    recognition.onerror = () => setIsListening(false);
    recognition.start();
  };

  // Browser SpeechSynthesis API — Text to Speech
  const readAloud = () => {
    if (!response) return;
    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }
    const plainText = response.replace(/[#*`]/g, '');
    const utterance = new SpeechSynthesisUtterance(plainText);
    utterance.lang = 'en-US';
    utterance.rate = 0.95;
    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);
    window.speechSynthesis.speak(utterance);
  };

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setActiveSectionId('learn');
        }
      },
      { threshold: 0.3 }
    );
    if (sectionRef.current) observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, [setActiveSectionId]);

  useEffect(() => {
    if (learnPrefill) {
      setTopicInput(learnPrefill);
      fetchExplanation(learnPrefill);
      setLearnPrefill('');
    }
  }, [learnPrefill]);

  const fetchExplanation = async (query) => {
    if (!query.trim()) return;
    
    // Update recent topics
    setRecentTopics(prev => {
      const newTopics = [query, ...prev.filter(t => t !== query)].slice(0, 8);
      return newTopics;
    });

    setCurrentTopic(query);
    setStatus('loading');
    setResponse('');
    
    try {
      const res = await fetch('http://localhost:8000/api/learn', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ concept: query })
      });

      if (!res.ok) {
        throw new Error(`Error: ${res.statusText}`);
      }

      const data = await res.json();
      
      if (data.error) {
        throw new Error(data.error);
      }
      
      // Formatting the JSON data into a Markdown string for the UI to render.
      // This is necessary because ReactMarkdown expects a string, not an object.
      let fullResponse = `# Understanding ${query}\n\n`;
      fullResponse += `${data.intuition || 'No intuition provided.'}\n\n`;
      
      if (data.key_papers && data.key_papers.length > 0) {
        fullResponse += `### Key Papers\n`;
        data.key_papers.forEach(paper => {
          fullResponse += `- **${paper.title}**: ${paper.description}\n`;
        });
        fullResponse += `\n`;
      }

      if (data.recent_advances && data.recent_advances.length > 0) {
        fullResponse += `### Recent Advances\n`;
        data.recent_advances.forEach(adv => {
          fullResponse += `- ${adv}\n`;
        });
        fullResponse += `\n`;
      }
      
      setResponse(fullResponse);
      setStatus('done');
      
    } catch (error) {
      console.error("Failed to fetch explanation:", error);
      setResponse(`**Error:** Failed to connect to the backend. Please make sure the FastAPI server is running on localhost:8000.\n\nDetails: ${error.message}`);
      setStatus('done');
    }
  };

  const handleSaveToLibrary = () => {
    const newEntry = {
      id: Date.now().toString(),
      topic: currentTopic,
      summary: response.substring(0, 100) + '...',
      status: 'Saved',
      difficulty: 'Medium',
      savedAt: new Date().toISOString(),
      quizHistory: []
    };
    setSavedLibrary(prev => [...prev, newEntry]);
    alert("Saved to Library!");
  };

  const handleAction = (action) => {
    if (action === 'explain') {
      prefillExplain(currentTopic);
    } else if (action === 'quiz') {
      prefillQuiz(currentTopic);
    } else if (action === 'tts') {
      alert("TTS mock playing...");
    }
  };

  return (
    <section id="learn" ref={sectionRef} className="py-20 px-4 min-h-screen flex items-center">
      <div className="max-w-7xl mx-auto w-full grid grid-cols-1 md:grid-cols-12 gap-8">
        
        {/* Left Column: Input */}
        <div className="md:col-span-4 flex flex-col gap-6">
          <div>
            <h2 className="text-3xl font-bold flex items-center gap-2 mb-2">
              <BookOpen className="text-primary" /> Learn
            </h2>
            <p className="text-text-secondary">Ask anything — I'll explain it clearly</p>
          </div>

          <div className="bg-surface/60 backdrop-blur-xl p-6 rounded-3xl shadow-xl border border-white/20 dark:border-white/10 space-y-4 transition-all duration-300 hover:shadow-2xl">
            <textarea
              value={topicInput}
              onChange={(e) => setTopicInput(e.target.value)}
              placeholder="What do you want to learn about?"
              className="w-full bg-transparent border-none focus:ring-0 resize-none h-24 text-text-primary placeholder:text-text-muted"
            />
            
            <div className="flex items-center justify-between border-t border-surface-raised pt-4">
              <button 
                className={`p-2 rounded-full transition-colors flex items-center gap-2 text-sm font-medium ${
                  isListening 
                    ? 'text-white bg-error animate-pulse' 
                    : 'text-text-secondary hover:text-primary hover:bg-primary/10'
                }`}
                onClick={startVoiceInput}
                title={isListening ? 'Listening... click to stop' : 'Click to speak'}
              >
                <Mic className="w-5 h-5" /> {isListening ? 'Listening...' : 'Voice'}
              </button>
              
              <button
                onClick={() => fetchExplanation(topicInput)}
                className="bg-primary text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2 hover:bg-primary/90 transition-colors"
              >
                Explain it <ArrowRight className="w-4 h-4" />
              </button>
            </div>
            <p className="text-xs text-text-muted text-center pt-2">Or press Space to use voice anywhere</p>
          </div>

          {/* History Chips */}
          {recentTopics.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm font-medium text-text-secondary">Recent Topics</p>
              <div className="flex flex-wrap gap-2">
                {recentTopics.map((t, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      setTopicInput(t);
                      fetchExplanation(t);
                    }}
                    className="px-3 py-1 bg-surface border border-surface-raised rounded-full text-xs text-text-secondary hover:border-primary hover:text-primary transition-colors"
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Response */}
        <div className="md:col-span-8 flex flex-col h-full min-h-[400px]">
          {status === 'idle' && (
            <div className="flex-1 flex flex-col items-center justify-center text-text-muted border-2 border-dashed border-white/20 dark:border-white/10 rounded-3xl bg-surface/40 backdrop-blur-sm">
              <BookOpen className="w-12 h-12 mb-4 opacity-50" />
              <p>Ask a topic to get started</p>
            </div>
          )}

          {status === 'loading' && (
            <div className="flex-1 bg-surface/60 backdrop-blur-xl rounded-3xl border border-white/20 dark:border-white/10 p-8 space-y-4 animate-pulse shadow-xl">
              <div className="h-4 bg-surface-raised rounded w-1/4"></div>
              <div className="h-4 bg-surface-raised rounded w-full mt-8"></div>
              <div className="h-4 bg-surface-raised rounded w-5/6"></div>
              <div className="h-4 bg-surface-raised rounded w-4/6"></div>
            </div>
          )}

          {(status === 'streaming' || status === 'done') && (
            <div className="flex-1 flex flex-col gap-4">
              <div className="flex items-center gap-3">
                <span className="px-3 py-1 bg-primary/10 text-primary rounded-full text-sm font-semibold">
                  {currentTopic}
                </span>
                <span className="px-2 py-1 bg-surface-raised text-text-secondary rounded-md text-xs font-mono">
                  {modelUsed}
                </span>
              </div>

              <div className="flex-1 bg-surface/80 backdrop-blur-2xl rounded-3xl border border-white/20 dark:border-white/10 p-6 md:p-8 shadow-2xl overflow-auto prose prose-sm md:prose-base dark:prose-invert max-w-none transition-all duration-300">
                <ReactMarkdown>{response}</ReactMarkdown>
                {status === 'streaming' && <span className="inline-block w-2 h-4 bg-primary ml-1 animate-pulse" />}
              </div>

              {status === 'done' && (
                <div className="flex flex-wrap gap-3 mt-2">
                  <button onClick={() => handleAction('explain')} className="flex items-center gap-2 px-4 py-2 bg-surface/60 backdrop-blur-md border border-white/20 dark:border-white/10 rounded-xl text-sm font-medium hover:bg-surface hover:-translate-y-1 hover:shadow-lg transition-all duration-300">
                    <Palette className="w-4 h-4 text-primary" /> Explain Visually
                  </button>
                  <button onClick={() => handleAction('quiz')} className="flex items-center gap-2 px-4 py-2 bg-surface/60 backdrop-blur-md border border-white/20 dark:border-white/10 rounded-xl text-sm font-medium hover:bg-surface hover:-translate-y-1 hover:shadow-lg transition-all duration-300">
                    <CheckSquare className="w-4 h-4 text-warning" /> Quiz Me
                  </button>
                  <button onClick={handleSaveToLibrary} className="flex items-center gap-2 px-4 py-2 bg-surface/60 backdrop-blur-md border border-white/20 dark:border-white/10 rounded-xl text-sm font-medium hover:bg-surface hover:-translate-y-1 hover:shadow-lg transition-all duration-300">
                    <Save className="w-4 h-4 text-info" /> Save to Library
                  </button>
                  <button onClick={readAloud} className={`flex items-center gap-2 px-4 py-2 bg-surface/60 backdrop-blur-md border border-white/20 dark:border-white/10 rounded-xl text-sm font-medium hover:bg-surface hover:-translate-y-1 hover:shadow-lg transition-all duration-300 ${
                    isSpeaking ? 'border-success text-success' : ''
                  }`}>
                    <Volume2 className="w-4 h-4 text-success" /> {isSpeaking ? 'Stop Reading' : 'Read Aloud'}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

      </div>
    </section>
  );
}

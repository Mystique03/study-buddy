import React, { useState, useEffect, useRef } from 'react';
import { Palette, PenTool, ZoomIn, ZoomOut, Maximize, Download, Save, CheckSquare, Volume2, Mic } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { useStudyContext } from '../../context/StudyContext';

export default function Explain() {
  const { setActiveSectionId, explainPrefill, setExplainPrefill, setQuizPrefill } = useStudyContext();
  const [concept, setConcept] = useState('');
  const [style, setStyle] = useState('diagram'); // diagram | flowchart | concept_map
  const [status, setStatus] = useState('idle');
  const [response, setResponse] = useState(null);
  
  const sectionRef = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) setActiveSectionId('explain');
      },
      { threshold: 0.3 }
    );
    if (sectionRef.current) observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, [setActiveSectionId]);

  useEffect(() => {
    if (explainPrefill) {
      setConcept(explainPrefill);
      handleVisualize(explainPrefill, style);
      setExplainPrefill('');
    }
  }, [explainPrefill]);

  const handleVisualize = async (query, currentStyle) => {
    if (!query.trim()) return;
    setStatus('loading');
    setResponse(null);
    
    try {
      const res = await fetch('http://localhost:8000/api/visual', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ concept: query })
      });

      if (!res.ok) {
        throw new Error(`Error: ${res.statusText}`);
      }

      const data = await res.json();
      
      setResponse({
        type: 'html',
        content: data.html || `<div class="p-4 text-center">No visualization generated.</div>`,
      });
      setStatus('done');
      
    } catch (error) {
      console.error("Failed to generate visual:", error);
      setResponse({
        type: 'markdown',
        content: `**Error:** Failed to connect to the backend or generate visual.\n\nDetails: ${error.message}`
      });
      setStatus('done');
    }
  };

  const handleAction = (action) => {
    if (action === 'quiz') {
      setQuizPrefill(concept);
      document.getElementById('quiz')?.scrollIntoView({ behavior: 'smooth' });
    }
    else alert(`Action: ${action}`);
  };

  return (
    <section id="explain" ref={sectionRef} className="py-20 px-4 min-h-screen flex flex-col justify-center">
      <div className="max-w-5xl mx-auto w-full space-y-8">
        
        {/* Header & Input */}
        <div className="flex flex-col md:flex-row gap-6 items-end">
          <div className="flex-1 space-y-4 w-full">
            <div>
              <h2 className="text-3xl font-bold flex items-center gap-2 mb-2">
                <Palette className="text-primary" /> Visual Explanation
              </h2>
            </div>
            
            <div className="flex bg-surface/60 backdrop-blur-xl p-2 rounded-3xl shadow-lg border border-white/20 dark:border-white/10 w-full transition-all duration-300 hover:shadow-xl">
              <input
                type="text"
                value={concept}
                onChange={(e) => setConcept(e.target.value)}
                placeholder="Choose a concept to visualize..."
                className="flex-1 bg-transparent border-none focus:ring-0 px-4 text-text-primary"
              />
              <button className="p-3 bg-surface border border-white/20 rounded-2xl text-text-secondary hover:text-primary hover:-translate-y-0.5 transition-all shadow-sm">
                <Mic className="w-5 h-5" />
              </button>
            </div>
          </div>
          
          <div className="w-full md:w-auto flex flex-col gap-2">
            <div className="flex gap-1 bg-surface p-1 rounded-xl border border-surface-raised w-max self-end md:self-auto">
              {['diagram', 'flowchart', 'concept_map'].map(s => (
                <button
                  key={s}
                  onClick={() => setStyle(s)}
                  className={`px-3 py-1.5 text-sm font-medium rounded-lg capitalize transition-colors ${
                    style === s ? 'bg-primary/10 text-primary' : 'text-text-secondary hover:bg-surface-raised'
                  }`}
                >
                  {s.replace('_', ' ')}
                </button>
              ))}
            </div>
            <button
              onClick={() => handleVisualize(concept, style)}
              className="w-full md:w-auto bg-primary text-white px-6 py-2.5 rounded-xl font-medium hover:bg-primary/90 transition-colors"
            >
              Visualize
            </button>
          </div>
        </div>

        {/* Output Area */}
        <div className="bg-surface/60 backdrop-blur-xl border border-white/20 dark:border-white/10 rounded-3xl shadow-xl min-h-[400px] flex flex-col overflow-hidden relative transition-all duration-300 hover:shadow-2xl">
          
          {status === 'idle' && (
            <div className="flex-1 flex flex-col items-center justify-center text-text-muted p-8">
              <PenTool className="w-12 h-12 mb-4 opacity-50" />
              <p>Choose a concept above to visualize</p>
            </div>
          )}

          {status === 'loading' && (
            <div className="flex-1 flex flex-col items-center justify-center p-8 border-2 border-dashed border-surface-raised m-4 rounded-xl">
              <div className="relative w-16 h-16 mb-4">
                <PenTool className="w-8 h-8 text-primary absolute bottom-0 left-0 animate-bounce" />
                <div className="w-full h-1 bg-primary/20 absolute bottom-0 rounded-full" />
              </div>
              <p className="text-text-secondary font-medium animate-pulse">Drawing...</p>
            </div>
          )}

          {status === 'done' && response && (
            <>
              {/* Toolbar */}
              <div className="h-14 border-b border-white/10 flex items-center justify-between px-6 bg-surface/40 backdrop-blur-sm">
                <div className="flex items-center gap-2">
                  <button className="p-1.5 rounded hover:bg-surface-raised text-text-secondary"><ZoomIn className="w-4 h-4" /></button>
                  <button className="p-1.5 rounded hover:bg-surface-raised text-text-secondary"><ZoomOut className="w-4 h-4" /></button>
                  <button className="p-1.5 rounded hover:bg-surface-raised text-text-secondary"><Maximize className="w-4 h-4" /></button>
                </div>
                <button className="flex items-center gap-2 px-3 py-1 bg-surface border border-surface-raised rounded-md text-xs font-medium text-text-secondary hover:text-primary transition-colors">
                  <Download className="w-3 h-3" /> Save as PNG
                </button>
              </div>

              {/* Canvas Content */}
              <div className="flex-1 p-4 md:p-8 overflow-auto flex items-center justify-center bg-dots">
                {response.type === 'markdown' ? (
                  <div className="prose prose-sm md:prose-base dark:prose-invert max-w-none text-center bg-surface p-8 rounded-xl shadow-sm border border-surface-raised">
                    <ReactMarkdown>{response.content}</ReactMarkdown>
                  </div>
                ) : (
                  <div className="w-full h-full max-w-4xl mx-auto shadow-xl rounded-2xl overflow-hidden border border-surface-raised">
                    <iframe
                      title="Visualization"
                      srcDoc={response.content}
                      className="w-full h-[600px] border-0 bg-white"
                      sandbox="allow-scripts allow-same-origin"
                    />
                  </div>
                )}
              </div>

              {/* Action Row */}
              <div className="border-t border-white/10 p-5 bg-surface/40 backdrop-blur-sm flex justify-center gap-4">
                <button onClick={() => handleAction('save')} className="flex items-center gap-2 px-5 py-2.5 bg-surface/60 backdrop-blur-md border border-white/20 dark:border-white/10 rounded-xl text-sm font-medium hover:bg-surface hover:-translate-y-1 hover:shadow-lg transition-all duration-300">
                  <Save className="w-4 h-4 text-info" /> Save
                </button>
                <button onClick={() => handleAction('quiz')} className="flex items-center gap-2 px-5 py-2.5 bg-surface/60 backdrop-blur-md border border-white/20 dark:border-white/10 rounded-xl text-sm font-medium hover:bg-surface hover:-translate-y-1 hover:shadow-lg transition-all duration-300">
                  <CheckSquare className="w-4 h-4 text-warning" /> Quiz on this
                </button>
                <button onClick={() => handleAction('tts')} className="flex items-center gap-2 px-5 py-2.5 bg-surface/60 backdrop-blur-md border border-white/20 dark:border-white/10 rounded-xl text-sm font-medium hover:bg-surface hover:-translate-y-1 hover:shadow-lg transition-all duration-300">
                  <Volume2 className="w-4 h-4 text-success" /> Narrate
                </button>
              </div>
            </>
          )}
        </div>

      </div>
    </section>
  );
}

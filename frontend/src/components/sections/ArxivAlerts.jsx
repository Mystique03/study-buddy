import React, { useState, useEffect, useRef } from 'react';
import { Bell, ExternalLink, Bookmark, Search, X, Loader2, RefreshCcw } from 'lucide-react';
import { useStudyContext } from '../../context/StudyContext';
import { useLocalStorage } from '../../hooks/useLocalStorage';

export default function ArxivAlerts() {
  const { setActiveSectionId, savedLibrary } = useStudyContext();
  const [subscriptions, setSubscriptions] = useLocalStorage('arxiv_subscriptions', []);
  const [savedPapers, setSavedPapers] = useLocalStorage('saved_papers', []);
  
  const [newTopic, setNewTopic] = useState('');
  const [status, setStatus] = useState('loaded'); // loading | loaded | error
  const [papers, setPapers] = useState([]);
  const [expanded, setExpanded] = useState(new Set());
  const [filterTopic, setFilterTopic] = useState('All');
  
  const sectionRef = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) setActiveSectionId('arxiv');
      },
      { threshold: 0.1 }
    );
    if (sectionRef.current) observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, [setActiveSectionId]);

  // Mock fetch papers when subscriptions change
  useEffect(() => {
    if (subscriptions.length > 0) {
      fetchPapers();
    } else {
      setPapers([]);
    }
  }, [subscriptions]);

  const fetchPapers = () => {
    setStatus('loading');
    setTimeout(() => {
      const mockPapers = subscriptions.map((sub, i) => ({
        id: `arxiv-${i}-${Date.now()}`,
        title: `Recent Advances in ${sub}: A Comprehensive Review`,
        authors: ['Jane Doe', 'John Smith', 'et al.'],
        abstract: `This paper presents a novel approach to understanding ${sub}. We demonstrate significant improvements over baseline methods using our new architecture. The results indicate that this could lead to major breakthroughs in the field. Furthermore, we analyze the limitations of previous studies and propose a new benchmark dataset for future evaluations.`,
        categories: ['cs.AI', 'cs.LG'],
        published: `${i + 1} days ago`,
        url: 'https://arxiv.org',
        relevance_topic: sub
      }));
      setPapers(mockPapers);
      setStatus('loaded');
    }, 1500);
  };

  const addSubscription = (e) => {
    e.preventDefault();
    if (newTopic.trim() && !subscriptions.includes(newTopic.trim())) {
      setSubscriptions([...subscriptions, newTopic.trim()]);
      setNewTopic('');
    }
  };

  const removeSubscription = (topic) => {
    setSubscriptions(subscriptions.filter(t => t !== topic));
  };

  const toggleExpand = (id) => {
    const next = new Set(expanded);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setExpanded(next);
  };

  const savePaper = (paper) => {
    if (!savedPapers.some(p => p.id === paper.id)) {
      setSavedPapers([...savedPapers, paper]);
      alert("Paper saved!");
    }
  };

  const filteredPapers = filterTopic === 'All' 
    ? papers 
    : papers.filter(p => p.relevance_topic === filterTopic);

  return (
    <section id="arxiv" ref={sectionRef} className="py-20 px-4 min-h-screen bg-surface-raised/30 flex items-center">
      <div className="max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Panel: Subscriptions */}
        <div className="lg:col-span-4 bg-surface border border-surface-raised rounded-2xl p-6 shadow-sm sticky top-24">
          <div className="flex items-center gap-2 mb-6">
            <Bell className="text-primary w-6 h-6" />
            <h2 className="text-xl font-bold text-text-primary">Monitoring Topics</h2>
          </div>

          <form onSubmit={addSubscription} className="flex gap-2 mb-6">
            <input
              type="text"
              value={newTopic}
              onChange={(e) => setNewTopic(e.target.value)}
              placeholder="Topic to monitor..."
              className="flex-1 bg-surface-raised border border-surface-raised px-3 py-2 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-primary text-text-primary"
            />
            <button type="submit" className="bg-primary text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors">
              Add
            </button>
          </form>

          {/* Suggestions from Library */}
          {savedLibrary.length > 0 && subscriptions.length === 0 && (
            <div className="mb-6 space-y-2">
              <p className="text-xs font-medium text-text-muted uppercase tracking-wider">Suggestions from Library</p>
              <div className="flex flex-wrap gap-2">
                {savedLibrary.slice(0, 5).map(item => (
                  <button
                    key={item.id}
                    onClick={() => setSubscriptions([...subscriptions, item.topic])}
                    className="text-xs px-2 py-1 bg-surface-raised rounded hover:bg-primary/10 hover:text-primary transition-colors text-text-secondary"
                  >
                    + {item.topic}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Active Subscriptions */}
          <div className="space-y-2">
            {subscriptions.length === 0 ? (
              <p className="text-sm text-text-muted text-center py-4">No topics monitored yet. Add one above.</p>
            ) : (
              subscriptions.map((topic, i) => (
                <div key={i} className="flex justify-between items-center bg-surface-raised/50 px-3 py-2 rounded-lg group">
                  <span className="text-sm font-medium text-text-primary truncate pr-2">{topic}</span>
                  <button 
                    onClick={() => removeSubscription(topic)}
                    className="text-text-muted hover:text-error opacity-0 group-hover:opacity-100 transition-all"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right Panel: Feed */}
        <div className="lg:col-span-8 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <h2 className="text-2xl font-bold text-text-primary flex items-center gap-2">
              📡 Latest Papers
            </h2>
            
            <div className="flex gap-2">
              <select 
                value={filterTopic}
                onChange={(e) => setFilterTopic(e.target.value)}
                className="bg-surface border border-surface-raised rounded-lg px-3 py-2 text-sm text-text-primary focus:outline-none"
              >
                <option value="All">All Topics</option>
                {subscriptions.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
              <button 
                onClick={fetchPapers}
                className="p-2 bg-surface border border-surface-raised rounded-lg text-text-secondary hover:text-primary transition-colors"
              >
                <RefreshCcw className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Feed Content */}
          <div className="space-y-4">
            {status === 'loading' && (
              [...Array(3)].map((_, i) => (
                <div key={i} className="bg-surface border border-surface-raised rounded-2xl p-6 animate-pulse space-y-4">
                  <div className="h-6 bg-surface-raised rounded w-3/4"></div>
                  <div className="h-4 bg-surface-raised rounded w-1/4"></div>
                  <div className="h-20 bg-surface-raised rounded w-full mt-4"></div>
                </div>
              ))
            )}

            {status === 'loaded' && filteredPapers.length === 0 && (
              <div className="bg-surface border border-surface-raised border-dashed rounded-2xl p-12 text-center">
                <Search className="w-12 h-12 text-text-muted mx-auto mb-4 opacity-50" />
                <h3 className="text-lg font-medium text-text-primary mb-2">No new papers found</h3>
                <p className="text-text-secondary">Try adding more topics to monitor.</p>
              </div>
            )}

            {status === 'loaded' && filteredPapers.map(paper => (
              <div key={paper.id} className="bg-surface border border-surface-raised rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow group">
                <div className="flex flex-col sm:flex-row justify-between items-start gap-4 mb-3">
                  <div>
                    <h3 className="text-lg font-bold text-text-primary leading-tight mb-1">
                      <a href={paper.url} target="_blank" rel="noreferrer" className="hover:text-primary hover:underline flex items-start gap-1">
                        {paper.title} <ExternalLink className="w-3 h-3 mt-1 shrink-0" />
                      </a>
                    </h3>
                    <p className="text-sm text-primary">{paper.authors.join(', ')}</p>
                  </div>
                  <span className="shrink-0 px-2.5 py-1 bg-surface-raised rounded-full text-xs font-medium text-text-secondary">
                    {paper.published}
                  </span>
                </div>

                <div className="flex flex-wrap gap-2 mb-4">
                  <span className="px-2 py-0.5 bg-primary/10 text-primary rounded text-xs font-medium">
                    Topic: {paper.relevance_topic}
                  </span>
                  {paper.categories.map(cat => (
                    <span key={cat} className="px-2 py-0.5 border border-surface-raised text-text-muted rounded text-xs font-mono">
                      {cat}
                    </span>
                  ))}
                </div>

                <div className="relative mb-4">
                  <p className={`text-sm text-text-secondary ${expanded.has(paper.id) ? '' : 'line-clamp-3'}`}>
                    <span className="font-semibold text-text-primary">Abstract:</span> {paper.abstract}
                  </p>
                  {!expanded.has(paper.id) && paper.abstract.length > 200 && (
                    <button 
                      onClick={() => toggleExpand(paper.id)}
                      className="text-xs text-primary font-medium hover:underline mt-1"
                    >
                      Show more
                    </button>
                  )}
                  {expanded.has(paper.id) && (
                    <button 
                      onClick={() => toggleExpand(paper.id)}
                      className="text-xs text-primary font-medium hover:underline mt-1 block"
                    >
                      Show less
                    </button>
                  )}
                </div>

                <div className="flex justify-end pt-4 border-t border-surface-raised">
                  <button 
                    onClick={() => savePaper(paper)}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-text-secondary hover:text-primary hover:bg-primary/10 rounded-lg transition-colors"
                  >
                    <Bookmark className="w-4 h-4" /> Save Paper
                  </button>
                </div>
              </div>
            ))}
          </div>

        </div>
      </div>
    </section>
  );
}

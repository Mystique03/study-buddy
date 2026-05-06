import React, { useState, useEffect, useRef } from 'react';
import { Library as LibraryIcon, Search, Trash2, BookOpen, CheckSquare, X } from 'lucide-react';
import { useStudyContext } from '../../context/StudyContext';
import { useLocalStorage } from '../../hooks/useLocalStorage';

export default function Library() {
  const { setActiveSectionId, setLearnPrefill, setQuizPrefill, savedLibrary, setSavedLibrary } = useStudyContext();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilters, setActiveFilters] = useState([]);
  const [sortOrder, setSortOrder] = useState('recent'); // recent | alpha | diff
  
  const sectionRef = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) setActiveSectionId('library');
      },
      { threshold: 0.1 }
    );
    if (sectionRef.current) observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, [setActiveSectionId]);

  const toggleFilter = (f) => {
    setActiveFilters(prev => 
      prev.includes(f) ? prev.filter(x => x !== f) : [...prev, f]
    );
  };

  const deleteItem = (id) => {
    if (confirm("Delete this topic from library?")) {
      setSavedLibrary(prev => prev.filter(item => item.id !== id));
    }
  };

  const handleAction = (action, topic) => {
    if (action === 'review') {
      setLearnPrefill(topic);
      document.getElementById('learn')?.scrollIntoView({ behavior: 'smooth' });
    }
    if (action === 'requiz') {
      setQuizPrefill(topic);
      document.getElementById('quiz')?.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // Filter and sort logic
  const filteredItems = savedLibrary.filter(item => {
    const matchesSearch = item.topic.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          item.summary.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = activeFilters.length === 0 || activeFilters.includes(item.status);
    return matchesSearch && matchesFilter;
  }).sort((a, b) => {
    if (sortOrder === 'recent') return new Date(b.savedAt) - new Date(a.savedAt);
    if (sortOrder === 'alpha') return a.topic.localeCompare(b.topic);
    return 0; // fallback diff sort could be implemented based on mapped values
  });

  return (
    <section id="library" ref={sectionRef} className="py-20 px-4 min-h-screen">
      <div className="max-w-7xl mx-auto w-full space-y-8">
        
        {/* Header Row */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-surface-raised pb-6">
          <div>
            <h2 className="text-3xl font-bold flex items-center gap-2 mb-2">
              <LibraryIcon className="text-primary" /> Knowledge Library
            </h2>
            <p className="text-text-secondary">{savedLibrary.length} topics saved</p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 flex-1 md:max-w-xl justify-end">
            <div className="relative flex-1 sm:max-w-xs">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search library..."
                className="w-full pl-9 pr-4 py-2 bg-surface border border-surface-raised rounded-lg focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary text-sm text-text-primary"
              />
              {searchQuery && (
                <X 
                  className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-text-muted cursor-pointer hover:text-text-primary" 
                  onClick={() => setSearchQuery('')}
                />
              )}
            </div>
            <select
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value)}
              className="px-3 py-2 bg-surface border border-surface-raised rounded-lg text-sm text-text-primary focus:outline-none"
            >
              <option value="recent">Most Recent</option>
              <option value="alpha">Alphabetical</option>
            </select>
          </div>
        </div>

        {/* Filters and Actions */}
        {savedLibrary.length > 0 && (
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex gap-2 flex-wrap">
              {['Saved', 'Mastered', 'In Progress'].map(f => (
                <button
                  key={f}
                  onClick={() => toggleFilter(f)}
                  className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors border ${
                    activeFilters.includes(f)
                      ? 'bg-primary text-white border-primary shadow-md'
                      : 'bg-surface/60 backdrop-blur-sm text-text-secondary border-white/20 hover:border-text-muted'
                  }`}
                >
                  {f}
                </button>
              ))}
              {activeFilters.length > 0 && (
                <button 
                  onClick={() => setActiveFilters([])}
                  className="px-4 py-1.5 rounded-full text-sm font-medium text-text-muted hover:text-text-primary underline transition-colors"
                >
                  Clear Filters
                </button>
              )}
            </div>

            <button 
              onClick={() => {
                if(confirm("Are you sure you want to delete ALL saved topics? This cannot be undone.")) {
                  setSavedLibrary([]);
                }
              }}
              className="flex items-center gap-2 px-4 py-2 bg-error/10 text-error hover:bg-error hover:text-white border border-error/20 rounded-xl text-sm font-medium transition-colors ml-auto"
            >
              <Trash2 className="w-4 h-4" /> Clear Library
            </button>
          </div>
        )}

        {/* Grid View */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredItems.map(item => (
            <div key={item.id} className="relative bg-surface/60 backdrop-blur-xl border border-white/20 dark:border-white/10 rounded-3xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 group flex flex-col">
              <div className="flex justify-between items-start mb-4 pr-8">
                <h3 className="font-bold text-lg text-text-primary line-clamp-1 pr-2" title={item.topic}>{item.topic}</h3>
                <button 
                  onClick={() => deleteItem(item.id)}
                  title="Click to unsave"
                  className={`shrink-0 px-3 py-1 rounded-full text-xs font-medium cursor-pointer hover:opacity-80 transition-opacity ${
                  item.status === 'Mastered' ? 'bg-success/10 text-success border border-success/20' :
                  item.status === 'In Progress' ? 'bg-warning/10 text-warning border border-warning/20' :
                  'bg-info/10 text-info border border-info/20'
                }`}>
                  {item.status === 'Mastered' ? '✅ Mastered' : item.status === 'Saved' ? '💾 Saved' : '🔄 In Progress'}
                </button>
              </div>
              
              <p className="text-sm text-text-secondary line-clamp-2 mb-4 flex-1">
                {item.summary}
              </p>
              
              <div className="text-xs text-text-muted mb-6">
                Saved {new Date(item.savedAt).toLocaleDateString()}
              </div>

              <div className="grid grid-cols-2 gap-3 mt-auto">
                <button onClick={() => handleAction('review', item.topic)} className="flex items-center justify-center gap-1.5 px-3 py-2.5 bg-surface/80 backdrop-blur border border-white/10 rounded-xl text-sm font-medium text-text-primary hover:bg-surface hover:-translate-y-0.5 hover:shadow-md transition-all">
                  <BookOpen className="w-4 h-4" /> Review
                </button>
                <button onClick={() => handleAction('requiz', item.topic)} className="flex items-center justify-center gap-1.5 px-3 py-2.5 bg-surface/80 backdrop-blur border border-white/10 rounded-xl text-sm font-medium text-text-primary hover:bg-surface hover:-translate-y-0.5 hover:shadow-md transition-all">
                  <CheckSquare className="w-4 h-4" /> Re-quiz
                </button>
              </div>
              
              <button 
                onClick={() => deleteItem(item.id)}
                className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 p-2 text-text-muted hover:text-error transition-all translate-x-2 group-hover:translate-x-0"
                title="Delete from Library"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            </div>
          ))}
        </div>

        {/* Empty States */}
        {savedLibrary.length === 0 && (
          <div className="text-center py-20 bg-surface border border-surface-raised rounded-2xl border-dashed">
            <LibraryIcon className="w-16 h-16 mx-auto text-text-muted mb-4 opacity-50" />
            <h3 className="text-xl font-bold text-text-primary mb-2">Your library is empty</h3>
            <p className="text-text-secondary mb-6">Start learning to save topics here.</p>
            <button 
              onClick={() => {
                document.getElementById('learn')?.scrollIntoView({ behavior: 'smooth' });
                document.querySelector('#learn textarea')?.focus();
              }}
              className="bg-primary text-white px-6 py-2.5 rounded-xl font-medium hover:bg-primary/90 transition-colors"
            >
              Start Learning
            </button>
          </div>
        )}

        {savedLibrary.length > 0 && filteredItems.length === 0 && (
          <div className="text-center py-20 text-text-muted">
            <p className="mb-2">No topics match your search.</p>
            <button onClick={() => {setSearchQuery(''); setActiveFilters([]);}} className="text-primary hover:underline">Clear filters</button>
          </div>
        )}

      </div>
    </section>
  );
}

import React, { useState, useEffect } from 'react';
import { BookOpen, Palette, CheckSquare, Library, Bell } from 'lucide-react';
import { useStudyContext } from '../../context/StudyContext';
import StudyBuddy from '../buddy/StudyBuddy';

export default function Hero() {
  const { setActiveSectionId, setLearnPrefill, buddyName } = useStudyContext();
  const [topic, setTopic] = useState('');

  // Intersection Observer for active section
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setActiveSectionId('hero');
        }
      },
      { threshold: 0.5 }
    );
    const el = document.getElementById('hero');
    if (el) observer.observe(el);
    return () => observer.disconnect();
  }, [setActiveSectionId]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (topic.trim()) {
      setLearnPrefill(topic);
      document.getElementById('learn')?.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const scrollTo = (id) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <section id="hero" className="min-h-screen flex flex-col items-center justify-center px-4 relative overflow-hidden pt-20">
      <div className="max-w-4xl w-full text-center space-y-10 z-10 relative animate-fade-in-up">
        <div className="space-y-6">
          <h1 className="text-6xl md:text-8xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-primary via-info to-primary animate-gradient-x drop-shadow-sm pb-2">
            I'm {buddyName}
          </h1>
          <p className="text-xl md:text-2xl text-text-secondary max-w-2xl mx-auto font-light leading-relaxed">
            Your personalized AI companion. Ask anything by voice or text.
          </p>
        </div>

        {/* Mascot Voice Button */}
        <div className="my-12 relative">
          <div className="absolute inset-0 bg-primary/10 blur-[50px] rounded-full w-48 h-48 left-1/2 -translate-x-1/2 top-1/2 -translate-y-1/2 -z-10" />
          <StudyBuddy />
        </div>

        {/* Search Input */}
        <form onSubmit={handleSubmit} className="relative max-w-2xl mx-auto group">
          <div className="absolute -inset-1 bg-gradient-to-r from-primary to-info rounded-full blur opacity-25 group-hover:opacity-50 transition duration-500"></div>
          <div className="relative flex items-center">
            <input
              id="quick-input"
              type="text"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="Ask a topic to get started..."
              className="w-full pl-8 pr-36 py-5 rounded-full bg-surface/80 backdrop-blur-xl border border-white/20 dark:border-white/10 focus:outline-none focus:ring-2 focus:ring-primary/50 text-lg shadow-xl transition-all"
            />
            <button
              type="submit"
              className="absolute right-2 top-2 bottom-2 px-8 bg-gradient-to-r from-primary to-indigo-600 text-white rounded-full font-semibold hover:shadow-lg hover:scale-105 transition-all duration-300"
            >
              Send
            </button>
          </div>
        </form>

        {/* Feature Pills */}
        <div className="flex flex-wrap items-center justify-center gap-4 pt-12">
          {[
            { id: 'learn', label: 'Learn', icon: BookOpen },
            { id: 'explain', label: 'Explain', icon: Palette },
            { id: 'quiz', label: 'Quiz', icon: CheckSquare },
            { id: 'library', label: 'Library', icon: Library },
            { id: 'arxiv', label: 'ArXiv', icon: Bell },
          ].map((feature) => (
            <button
              key={feature.id}
              onClick={() => scrollTo(feature.id)}
              className="flex items-center gap-2 px-6 py-3 bg-surface/60 backdrop-blur-md border border-white/20 dark:border-white/10 rounded-full text-text-secondary hover:text-primary hover:bg-surface hover:shadow-lg hover:-translate-y-1 transition-all duration-300 font-medium"
            >
              <feature.icon className="w-5 h-5" />
              {feature.label}
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}

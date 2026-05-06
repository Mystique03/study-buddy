import React, { useState } from 'react';
import { Brain, Moon, Sun, Menu, X, Edit2 } from 'lucide-react';
import { useStudyContext } from '../../context/StudyContext';

export default function Navbar() {
  const { activeSectionId, theme, toggleTheme, buddyName, setBuddyName } = useStudyContext();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isEditingName, setIsEditingName] = useState(false);
  const [tempName, setTempName] = useState(buddyName);

  const links = [
    { id: 'learn', label: 'Learn' },
    { id: 'explain', label: 'Explain' },
    { id: 'quiz', label: 'Quiz' },
    { id: 'library', label: 'Library' },
    { id: 'arxiv', label: 'Alerts' }
  ];

  const scrollToSection = (id) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
    setMobileMenuOpen(false);
  };

  const handleNameSave = () => {
    if (tempName.trim()) {
      setBuddyName(tempName.trim());
    } else {
      setTempName(buddyName); // Revert if empty
    }
    setIsEditingName(false);
  };

  return (
    <nav className="sticky top-0 z-[100] h-16 bg-surface/80 backdrop-blur-md border-b border-surface-raised transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full flex items-center justify-between">
        {/* Left: Logo */}
        <div className="flex items-center gap-2 cursor-pointer" onClick={() => scrollToSection('hero')}>
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
            <Brain className="w-5 h-5 text-primary" />
          </div>
          {isEditingName ? (
            <div className="hidden sm:flex flex-col justify-center">
              <input
                type="text"
                autoFocus
                value={tempName}
                onChange={(e) => setTempName(e.target.value)}
                onBlur={handleNameSave}
                onKeyDown={(e) => e.key === 'Enter' && handleNameSave()}
                className="font-bold text-lg text-text-primary bg-surface border border-primary/50 rounded px-2 py-0.5 outline-none w-32 focus:ring-2 focus:ring-primary/20"
                onClick={(e) => e.stopPropagation()}
              />
            </div>
          ) : (
            <button 
              className="hidden sm:flex flex-col items-start justify-center group hover:text-primary transition-colors cursor-text"
              onClick={(e) => {
                e.stopPropagation();
                setIsEditingName(true);
                setTempName(buddyName);
              }}
            >
              <div className="flex items-center gap-2">
                <span className="font-bold text-lg text-text-primary group-hover:text-primary transition-colors leading-tight">
                  {buddyName}
                </span>
                <Edit2 className="w-3.5 h-3.5 text-text-muted opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
              <span className="text-[10px] font-medium text-text-muted opacity-60 group-hover:opacity-100 transition-opacity leading-none mt-0.5 uppercase tracking-wider">
                Click to rename
              </span>
            </button>
          )}
        </div>

        {/* Center: Desktop Nav */}
        <div className="hidden md:flex items-center gap-6">
          {links.map((link) => (
            <button
              key={link.id}
              onClick={() => scrollToSection(link.id)}
              className={`text-sm font-medium transition-colors ${
                activeSectionId === link.id
                  ? 'text-primary'
                  : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              {link.label}
            </button>
          ))}
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-4">
          <button
            onClick={toggleTheme}
            className="p-2 rounded-full text-text-secondary hover:bg-surface-raised transition-colors"
            aria-label="Toggle dark mode"
          >
            {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </button>

          {/* Mobile Menu Toggle */}
          <button
            className="md:hidden p-2 text-text-secondary"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden absolute top-16 left-0 w-full bg-surface border-b border-surface-raised shadow-lg py-4 px-4 flex flex-col gap-4">
          {links.map((link) => (
            <button
              key={link.id}
              onClick={() => scrollToSection(link.id)}
              className={`text-left text-base font-medium px-4 py-2 rounded-lg ${
                activeSectionId === link.id
                  ? 'bg-primary/10 text-primary'
                  : 'text-text-secondary hover:bg-surface-raised hover:text-text-primary'
              }`}
            >
              {link.label}
            </button>
          ))}
        </div>
      )}
    </nav>
  );
}

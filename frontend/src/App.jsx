import React from 'react';
import { StudyProvider } from './context/StudyContext';
import Navbar from './components/layout/Navbar';
import FloatingVoiceButton from './components/layout/FloatingVoiceButton';
import Hero from './components/sections/Hero';
import Learn from './components/sections/Learn';
import Explain from './components/sections/Explain';
import Quiz from './components/sections/Quiz';
import Library from './components/sections/Library';
import ArxivAlerts from './components/sections/ArxivAlerts';

function App() {
  return (
    <StudyProvider>
      <div className="app relative text-text-primary min-h-screen font-sans bg-bg overflow-x-hidden">
        
        {/* Animated Background Mesh */}
        <div className="fixed inset-0 z-[-1] overflow-hidden pointer-events-none">
          <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-primary/20 blur-[100px] animate-blob" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-info/20 blur-[120px] animate-blob" style={{ animationDelay: '2s' }} />
          <div className="absolute top-[40%] left-[60%] w-[30%] h-[30%] rounded-full bg-success/10 blur-[80px] animate-blob" style={{ animationDelay: '4s' }} />
        </div>

        <Navbar />
        
        <main className="w-full relative z-10 backdrop-blur-[2px]">
          <Hero />
          
          <div className="w-full max-w-7xl mx-auto border-t border-surface-raised/50" />
          <Learn />
          
          <div className="w-full max-w-7xl mx-auto border-t border-surface-raised/50" />
          <Explain />
          
          <div className="w-full max-w-7xl mx-auto border-t border-surface-raised/50" />
          <Quiz />
          
          <div className="w-full max-w-7xl mx-auto border-t border-surface-raised/50" />
          <Library />
          
          <div className="w-full max-w-7xl mx-auto border-t border-surface-raised/50" />
          <ArxivAlerts />
        </main>
        
        <FloatingVoiceButton />
      </div>
    </StudyProvider>
  );
}

export default App;
import React, { useState, useEffect, useRef } from 'react';
import { Mic, Square, Loader2, Volume2 } from 'lucide-react';
import { useStudyContext } from '../../context/StudyContext';

export default function FloatingVoiceButton() {
  const { activeSectionId, setLearnPrefill, setExplainPrefill, setQuizPrefill } = useStudyContext();
  const [state, setState] = useState('idle'); // idle | listening | processing | speaking
  const [transcript, setTranscript] = useState('');
  const recognitionRef = useRef(null);

  useEffect(() => {
    // Initialize Web Speech API
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.lang = 'en-US';
      recognition.interimResults = true; // Show text as user speaks
      recognition.maxAlternatives = 1;

      let silenceTimer = null;

      const resetSilenceTimer = (duration) => {
        clearTimeout(silenceTimer);
        silenceTimer = setTimeout(() => {
          recognition.stop();
        }, duration);
      };

      recognition.onstart = () => {
        setState('listening');
        setTranscript('Listening...');
        // Start a 5-second timer. If no speech is detected at all, it will stop.
        resetSilenceTimer(5000);
      };

      recognition.onresult = (event) => {
        let currentTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          currentTranscript += event.results[i][0].transcript;
        }
        setTranscript(currentTranscript);
        
        // Reset the silence timer every time we hear a new word
        if (event.results[0].isFinal) {
          clearTimeout(silenceTimer);
          processTranscript(currentTranscript);
        } else {
          // If 2.5 seconds pass without new words, force stop and process
          resetSilenceTimer(2500);
        }
      };

      const processTranscript = (finalTranscript) => {
        clearTimeout(silenceTimer);
        setState('processing');
        setTimeout(() => {
          if (activeSectionId === 'explain') {
            setExplainPrefill(finalTranscript);
          } else if (activeSectionId === 'quiz') {
            setQuizPrefill(finalTranscript);
          } else {
            setLearnPrefill(finalTranscript);
            document.getElementById('learn')?.scrollIntoView({ behavior: 'smooth' });
          }
          setState('idle');
          setTranscript('');
        }, 500);
      };

      recognition.onerror = (event) => {
        console.error("Speech recognition error", event.error);
        setState('idle');
        setTranscript('');
      };

      recognition.onend = () => {
        // If it ended without a final result, reset state
        if (state === 'listening') {
          setState('idle');
          setTranscript('');
        }
      };

      recognitionRef.current = recognition;
    }
  }, [activeSectionId, setLearnPrefill, setExplainPrefill, setQuizPrefill]);

  const toggleMic = () => {
    if (!recognitionRef.current) {
      alert("Voice input is not supported in your browser. Please use Chrome.");
      return;
    }

    if (state === 'listening') {
      recognitionRef.current.stop();
    } else if (state === 'idle') {
      recognitionRef.current.start();
    }
  };

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] flex flex-col items-center gap-2">
      {/* Transcript Chip */}
      {transcript && (
        <div className="bg-surface-raised border border-surface-raised text-text-primary px-4 py-2 rounded-full text-sm shadow-md animate-in fade-in slide-in-from-bottom-2">
          {transcript}
        </div>
      )}

      {/* FAB */}
      <button
        id="floating-voice-btn"
        onClick={toggleMic}
        disabled={state === 'processing' || state === 'speaking'}
        className={`w-16 h-16 rounded-full flex items-center justify-center shadow-lg transition-all
          ${state === 'idle' ? 'bg-surface hover:bg-surface-raised text-primary' : ''}
          ${state === 'listening' ? 'bg-error text-white animate-pulse-ring' : ''}
          ${state === 'processing' ? 'bg-surface text-text-muted cursor-not-allowed' : ''}
          ${state === 'speaking' ? 'bg-primary text-white animate-pulse' : ''}
        `}
      >
        {state === 'idle' && <Mic className="w-8 h-8" />}
        {state === 'listening' && <Square className="w-6 h-6 fill-current" />}
        {state === 'processing' && <Loader2 className="w-8 h-8 animate-spin" />}
        {state === 'speaking' && <Volume2 className="w-8 h-8 animate-bounce" />}
      </button>
    </div>
  );
}

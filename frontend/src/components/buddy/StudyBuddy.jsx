import React, { useState, useEffect, useRef } from 'react';
import { useStudyContext } from '../../context/StudyContext';
import './BuddyAnimations.css';

const MESSAGES = {
    idle: () => `Hi! 👋 Click me to talk!`,
    listening: () => '👂 I\'m listening...',
    processing: () => '🤔 Let me think...',
    error: () => 'Oops, couldn\'t hear that.'
};

export default function StudyBuddy() {
    const { activeSectionId, setLearnPrefill, setExplainPrefill, setQuizPrefill } = useStudyContext();
    const [state, setState] = useState('idle'); // idle | listening | processing | error
    const [transcript, setTranscript] = useState('');
    const recognitionRef = useRef(null);

    useEffect(() => {
        const handleKeyDown = (e) => {
            // Space to toggle mic when no input is focused
            if (e.code === 'Space' && e.target.tagName !== 'INPUT' && e.target.tagName !== 'TEXTAREA') {
                e.preventDefault();
                toggleMic();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [state]);

    useEffect(() => {
        // Initialize Web Speech API
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (SpeechRecognition) {
            const recognition = new SpeechRecognition();
            recognition.lang = 'en-US';
            recognition.interimResults = true;
            recognition.maxAlternatives = 1;

            let silenceTimer = null;

            recognition.onstart = () => {
                setState('listening');
                setTranscript('Listening...');
            };

            recognition.onresult = (event) => {
                let currentTranscript = '';
                for (let i = event.resultIndex; i < event.results.length; i++) {
                    currentTranscript += event.results[i][0].transcript;
                }
                setTranscript(currentTranscript);
                
                clearTimeout(silenceTimer);
                
                if (event.results[0].isFinal) {
                    processTranscript(currentTranscript);
                } else {
                    silenceTimer = setTimeout(() => {
                        recognition.stop();
                        processTranscript(currentTranscript);
                    }, 2500);
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
                setState('error');
                setTimeout(() => {
                    setState('idle');
                    setTranscript('');
                }, 3000);
            };

            recognition.onend = () => {
                if (state === 'listening') {
                    setState('idle');
                    setTranscript('');
                }
            };

            recognitionRef.current = recognition;
        }
    }, [activeSectionId, setLearnPrefill, setExplainPrefill, setQuizPrefill, state]);

    const toggleMic = () => {
        if (!recognitionRef.current) {
            alert("Voice input is not supported in your browser. Please use Chrome.");
            return;
        }

        if (state === 'listening') {
            recognitionRef.current.stop();
        } else if (state === 'idle' || state === 'error') {
            recognitionRef.current.start();
        }
    };

    return (
        <div
            id="study-buddy-btn"
            className={`buddy-container mood-${state}`}
            onClick={toggleMic}
            title="Click or press Space to use Voice"
        >
            <img src="/images/cat-buddy.png" alt="Study Buddy Cat" />
            <div className="speech-bubble">
                {transcript || MESSAGES[state]?.()}
            </div>
        </div>
    );
}

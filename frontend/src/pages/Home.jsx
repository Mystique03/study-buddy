import { useState } from 'react'
import { useStudy } from '../context/StudyContext'
import Header from '../components/layout/Header'
import StudyBuddy from '../components/buddy/StudyBuddy'
import VoiceWidget from '../components/study/VoiceWidget'
import VisualRenderer from '../components/study/VisualRenderer'
import QuizView from '../components/study/QuizView'
import LibraryView from '../components/study/LibraryView'
import BuddyNameSetup from '../components/setup/BuddyNameSetup'

export default function Home() {
    const { state, dispatch } = useStudy()
    const { currentView, currentConcept, conceptPage, buddyName } = state
    const [inputConcept, setInputConcept] = useState('')
    const [loading, setLoading] = useState(false)

    const handleLearn = async () => {
        if (!inputConcept.trim()) return
        setLoading(true)
        dispatch({ type: 'SET_MOOD', payload: 'thinking' })
        try {
            const res = await fetch('/api/learn', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ concept: inputConcept.trim(), buddy_name: buddyName }),
            })
            const data = await res.json()
            dispatch({ type: 'SET_CONCEPT', payload: inputConcept.trim() })
            dispatch({ type: 'SET_CONCEPT_PAGE', payload: data.concept_page || data })
            dispatch({ type: 'SET_MOOD', payload: 'idle' })
            setInputConcept('')
        } catch (e) {
            console.error(e)
            dispatch({ type: 'SET_MOOD', payload: 'idle' })
        } finally {
            setLoading(false)
        }
    }

    const startQuiz = () => {
        dispatch({ type: 'QUIZ_START' })
        dispatch({ type: 'SET_VIEW', payload: 'quiz' })
    }

    const renderContent = () => {
        if (currentView === 'setup') return <BuddyNameSetup />
        if (currentView === 'quiz') return <QuizView />
        if (currentView === 'library') return <LibraryView />

        return (
            <>
                <div className="greeting">
                    <h2>☀️ Hey {buddyName ? buddyName : 'there'}!</h2>
                    <p>What do you want to learn today?</p>
                </div>

                <div className="study-card">
                    <div style={{ display: 'flex', gap: '10px', marginBottom: '16px' }}>
                        <input
                            type="text"
                            value={inputConcept}
                            onChange={e => setInputConcept(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && handleLearn()}
                            placeholder="e.g. Quantum entanglement"
                            style={{
                                flex: 1,
                                padding: '12px 16px',
                                borderRadius: '50px',
                                border: '2px solid var(--green-sage)',
                                fontSize: '1rem',
                                fontFamily: 'Poppins, sans-serif',
                                outline: 'none',
                            }}
                        />
                        <button className="btn-primary" onClick={handleLearn} disabled={loading}>
                            {loading ? '...' : 'Learn'}
                        </button>
                    </div>

                    <VoiceWidget />
                </div>

                {conceptPage && (
                    <div className="study-card">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                            <h3>{currentConcept}</h3>
                            <button className="btn-primary" onClick={startQuiz} style={{ fontSize: '0.85rem', padding: '8px 16px' }}>
                                Quiz Me 🧠
                            </button>
                        </div>
                        {conceptPage.intuition && <p style={{ marginBottom: '12px' }}>{conceptPage.intuition}</p>}
                        {conceptPage.explanation && <p style={{ marginBottom: '12px' }}>{conceptPage.explanation}</p>}
                        {conceptPage.visual_html && <VisualRenderer html={conceptPage.visual_html} title={currentConcept} />}
                    </div>
                )}
            </>
        )
    }

    return (
        <div className="home-page">
            <Header
                onLibrary={() => dispatch({ type: 'SET_VIEW', payload: 'library' })}
                onNewSession={() => {
                    dispatch({ type: 'QUIZ_END' })
                    dispatch({ type: 'SET_VIEW', payload: 'home' })
                    dispatch({ type: 'SET_CONCEPT_PAGE', payload: null })
                }}
            />
            {renderContent()}
            {currentView !== 'setup' && <StudyBuddy />}
        </div>
    )
}

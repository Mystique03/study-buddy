import { useState, useEffect } from 'react'
import { useStudy } from '../../context/StudyContext'

export default function QuizView() {
    const { state, dispatch } = useStudy()
    const { currentConcept, quiz, conceptPage } = state
    const [selectedAnswer, setSelectedAnswer] = useState(null)
    const [isCorrect, setIsCorrect] = useState(null)
    const [loading, setLoading] = useState(false)

    useEffect(() => {
        if (quiz.active && !quiz.currentQuestion) startQuiz()
    }, [quiz.active])

    const startQuiz = async () => {
        setLoading(true)
        try {
            const res = await fetch('/api/quiz/start', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ concept: currentConcept, difficulty: quiz.difficulty, buddy_name: state.buddyName }),
            })
            const data = await res.json()
            dispatch({ type: 'QUIZ_QUESTION', payload: data.current_question })
        } finally {
            setLoading(false)
        }
    }

    const handleAnswer = async (option, index) => {
        if (selectedAnswer !== null || loading) return
        setSelectedAnswer(index)
        setLoading(true)
        try {
            const quizState = {
                buddy_name: state.buddyName || 'Buddy',
                mode: 'quiz',
                current_concept: currentConcept,
                conversation_history: [],
                concept_page: {},
                quiz_score: quiz.score,
                quiz_round: quiz.round,
                difficulty: quiz.difficulty,
                current_question: quiz.currentQuestion,
                saved_concepts: state.savedConcepts,
                pending_alerts: [],
            }
            const res = await fetch('/api/quiz/answer', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ answer_index: index, state: quizState }),
            })
            const data = await res.json()
            const correct = data.correct
            setIsCorrect(correct)
            dispatch({ type: 'QUIZ_ANSWER', payload: { correct } })
            dispatch({ type: 'SET_MOOD', payload: correct ? 'celebrating' : 'thinking' })

            setTimeout(() => {
                const newScore = correct ? quiz.score + 1 : quiz.score
                const newRound = quiz.round + 1
                if (newScore >= 5 || newRound >= 10) {
                    dispatch({ type: 'QUIZ_END' })
                } else if (data.next_step === 'continue' && data.state?.current_question) {
                    setSelectedAnswer(null)
                    setIsCorrect(null)
                    dispatch({ type: 'QUIZ_QUESTION', payload: data.state.current_question })
                    setLoading(false)
                } else {
                    dispatch({ type: 'QUIZ_END' })
                }
            }, 1500)
        } catch (e) {
            console.error(e)
        } finally {
            setLoading(false)
        }
    }

    const saveAndExit = () => {
        dispatch({
            type: 'SAVE_CONCEPT',
            payload: {
                concept: currentConcept,
                score: quiz.score,
                difficulty_reached: quiz.difficulty,
                date_learned: new Date().toLocaleDateString(),
                concept_page: conceptPage,
                quiz_history: [],
            },
        })
        dispatch({ type: 'SET_MOOD', payload: 'idle' })
        dispatch({ type: 'SET_VIEW', payload: 'home' })
    }

    const mastered = quiz.score >= 5
    const exhausted = quiz.round >= 10

    if (!quiz.active) {
        return (
            <div className="study-card" style={{ textAlign: 'center' }}>
                <h2>{mastered ? '🎉 Mastered!' : '😅 Keep practicing!'}</h2>
                <p style={{ margin: '12px 0' }}>
                    {mastered
                        ? `You got ${quiz.score} correct! Concept saved to your library.`
                        : `You got ${quiz.score}/10. Try again to master it!`}
                </p>
                <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', marginTop: '16px' }}>
                    <button className="btn-primary" onClick={saveAndExit}>Save to Library</button>
                    <button className="btn-outline" onClick={() => dispatch({ type: 'SET_VIEW', payload: 'home' })}>Back</button>
                </div>
            </div>
        )
    }

    const difficultyColor = { easy: '#4caf50', medium: '#ff9800', hard: '#e53935' }

    return (
        <div className="study-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <span style={{ fontWeight: 600 }}>{currentConcept}</span>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <span style={{ background: difficultyColor[quiz.difficulty], color: 'white', padding: '2px 10px', borderRadius: '50px', fontSize: '0.8rem' }}>{quiz.difficulty}</span>
                    <span style={{ fontSize: '0.9rem', color: 'var(--green-sage)' }}>{quiz.score} correct · Round {quiz.round + 1}/10</span>
                </div>
            </div>

            {loading && !quiz.currentQuestion ? (
                <p style={{ textAlign: 'center', color: 'var(--green-sage)' }}>Loading question...</p>
            ) : quiz.currentQuestion ? (
                <>
                    <p style={{ fontSize: '1.05rem', fontWeight: 500, marginBottom: '20px' }}>{quiz.currentQuestion.question}</p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        {quiz.currentQuestion.options?.map((opt, i) => {
                            let bg = 'white'
                            if (selectedAnswer === i) bg = isCorrect ? '#e8f5e9' : '#ffebee'
                            const border = selectedAnswer === i
                                ? `2px solid ${isCorrect ? '#4caf50' : '#e53935'}`
                                : '2px solid var(--green-sage)'
                            return (
                                <button
                                    key={i}
                                    onClick={() => handleAnswer(opt, i)}
                                    disabled={selectedAnswer !== null || loading}
                                    style={{
                                        background: bg,
                                        border,
                                        borderRadius: '12px',
                                        padding: '12px 16px',
                                        textAlign: 'left',
                                        cursor: selectedAnswer !== null ? 'default' : 'pointer',
                                        fontFamily: 'Poppins, sans-serif',
                                        fontSize: '0.95rem',
                                    }}
                                >
                                    <strong>{String.fromCharCode(65 + i)}.</strong> {opt}
                                </button>
                            )
                        })}
                    </div>
                </>
            ) : null}

            <button className="btn-outline" onClick={() => dispatch({ type: 'SET_VIEW', payload: 'home' })} style={{ marginTop: '20px', fontSize: '0.85rem' }}>
                Exit Quiz
            </button>
        </div>
    )
}

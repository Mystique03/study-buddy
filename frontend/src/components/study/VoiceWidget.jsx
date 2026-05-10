import { useRef, useState } from 'react'
import { useStudy } from '../../context/StudyContext'

export default function VoiceWidget() {
    const { state, dispatch } = useStudy()
    const { quiz } = state
    const [permissionDenied, setPermissionDenied] = useState(false)
    const mediaRecorderRef = useRef(null)
    const chunksRef = useRef([])
    const streamRef = useRef(null)

    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
            streamRef.current = stream
            const recorder = new MediaRecorder(stream)
            chunksRef.current = []
            recorder.ondataavailable = e => { if (e.data.size > 0) chunksRef.current.push(e.data) }
            recorder.start()
            mediaRecorderRef.current = recorder
            dispatch({ type: 'SET_LISTENING', payload: true })
            dispatch({ type: 'SET_MOOD', payload: 'listening' })
        } catch {
            setPermissionDenied(true)
        }
    }

    const stopRecording = () => {
        const recorder = mediaRecorderRef.current
        if (!recorder || recorder.state === 'inactive') return
        recorder.onstop = async () => {
            streamRef.current?.getTracks().forEach(t => t.stop())
            dispatch({ type: 'SET_LISTENING', payload: false })
            dispatch({ type: 'SET_MOOD', payload: 'thinking' })

            const blob = new Blob(chunksRef.current, { type: recorder.mimeType })
            try {
                const form = new FormData()
                form.append('file', blob, 'audio.webm')
                const transcribeRes = await fetch('/api/voice/transcribe', { method: 'POST', body: form })
                const { text } = await transcribeRes.json()
                dispatch({ type: 'SET_TRANSCRIPT', payload: text })

                const endpoint = quiz.active ? '/api/quiz/answer' : '/api/learn'
                let payload
                if (quiz.active) {
                    const lower = text.toLowerCase()
                    const answerIndex = (quiz.currentQuestion?.options ?? []).findIndex(opt =>
                        lower.includes(opt.toLowerCase().slice(0, 20))
                    )
                    payload = {
                        answer_index: answerIndex,
                        state: {
                            buddy_name: state.buddyName || 'Buddy',
                            mode: 'quiz',
                            current_concept: state.currentConcept,
                            conversation_history: [],
                            concept_page: {},
                            quiz_score: quiz.score,
                            quiz_round: quiz.round,
                            difficulty: quiz.difficulty,
                            current_question: quiz.currentQuestion,
                            saved_concepts: state.savedConcepts,
                            pending_alerts: [],
                        },
                    }
                } else {
                    payload = { concept: text, buddy_name: state.buddyName }
                }
                const llmRes = await fetch(endpoint, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload),
                })
                const llmData = await llmRes.json()

                if (!quiz.active && llmData.concept_page) {
                    dispatch({ type: 'SET_CONCEPT', payload: text })
                    dispatch({ type: 'SET_CONCEPT_PAGE', payload: llmData.concept_page })
                }

                const speakText = llmData.response || llmData.feedback || llmData.explanation || ''
                if (speakText) {
                    const ttsRes = await fetch('/api/voice/synthesize', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ text: speakText }),
                    })
                    const audioBlob = await ttsRes.blob()
                    const url = URL.createObjectURL(audioBlob)
                    const audio = new Audio(url)
                    audio.onended = () => URL.revokeObjectURL(url)
                    audio.play()
                }

                const newScore = quiz.active && llmData.correct ? quiz.score + 1 : quiz.score
                dispatch({ type: 'SET_MOOD', payload: newScore >= 5 ? 'celebrating' : 'idle' })
            } catch (e) {
                console.error('Voice pipeline error:', e)
                dispatch({ type: 'SET_MOOD', payload: 'idle' })
            }
        }
        recorder.stop()
    }

    if (permissionDenied) {
        return (
            <div className="voice-widget">
                <p style={{ color: '#e53935', fontSize: '0.9rem' }}>Microphone access denied. Please allow it in your browser settings.</p>
            </div>
        )
    }

    return (
        <div className="voice-widget">
            <button
                className={`btn-primary ${state.isListening ? 'listening' : ''}`}
                onMouseDown={startRecording}
                onMouseUp={stopRecording}
                onTouchStart={startRecording}
                onTouchEnd={stopRecording}
            >
                {state.isListening ? '🎤 Listening...' : '🎤 Hold to Speak'}
            </button>
        </div>
    )
}

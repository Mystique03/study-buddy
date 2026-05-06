import { useStudy } from '../../context/StudyContext'
import './BuddyAnimations.css'

const MESSAGES = {
    idle: (name) => `🐱 Ready to study, ${name || 'friend'}?`,
    listening: () => '👂 I\'m listening...',
    thinking: () => '🤔 Let me think...',
    celebrating: () => '🌟 You mastered it!',
}

export default function StudyBuddy() {
    const { state, dispatch } = useStudy()
    const { buddyMood, buddyName } = state

    return (
        <div
            className={`buddy-container mood-${buddyMood}`}
            onClick={() => dispatch({ type: 'SET_MOOD', payload: 'listening' })}
        >
            <img src="/images/cat-buddy.png" alt="Study Buddy Cat" />
            <div className="speech-bubble">
                {MESSAGES[buddyMood]?.(buddyName) ?? MESSAGES.idle(buddyName)}
            </div>
        </div>
    )
}

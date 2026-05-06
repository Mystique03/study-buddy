import { useState } from 'react'
import { useStudy } from '../../context/StudyContext'

export default function BuddyNameSetup() {
    const { dispatch } = useStudy()
    const [name, setName] = useState('')
    const [error, setError] = useState('')

    const handleConfirm = () => {
        const trimmed = name.trim()
        if (!trimmed) { setError('Please enter a name.'); return }
        if (trimmed.length > 20) { setError('Name must be 20 characters or less.'); return }
        dispatch({ type: 'SET_BUDDY_NAME', payload: trimmed })
        dispatch({ type: 'SET_VIEW', payload: 'home' })
    }

    return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
            <div className="study-card" style={{ maxWidth: '400px', width: '100%', textAlign: 'center' }}>
                <h2 style={{ marginBottom: '8px' }}>👋 Welcome!</h2>
                <p style={{ marginBottom: '24px', color: 'var(--green-sage)' }}>What should I call your study buddy?</p>
                <input
                    autoFocus
                    type="text"
                    value={name}
                    onChange={e => { setName(e.target.value); setError('') }}
                    onKeyDown={e => e.key === 'Enter' && handleConfirm()}
                    placeholder="e.g. Whiskers"
                    maxLength={20}
                    style={{
                        width: '100%',
                        padding: '12px 16px',
                        borderRadius: '50px',
                        border: '2px solid var(--green-sage)',
                        fontSize: '1rem',
                        marginBottom: '8px',
                        outline: 'none',
                        fontFamily: 'Poppins, sans-serif',
                    }}
                />
                {error && <p style={{ color: '#e53935', fontSize: '0.85rem', marginBottom: '8px' }}>{error}</p>}
                <button className="btn-primary" onClick={handleConfirm} style={{ width: '100%', marginTop: '8px' }}>
                    Let's go! 🐱
                </button>
            </div>
        </div>
    )
}

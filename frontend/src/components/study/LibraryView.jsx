import { useStudy } from '../../context/StudyContext'

export default function LibraryView() {
    const { state, dispatch } = useStudy()
    const { savedConcepts } = state

    const openConcept = (item) => {
        dispatch({ type: 'SET_CONCEPT', payload: item.concept })
        dispatch({ type: 'SET_CONCEPT_PAGE', payload: item.concept_page })
        dispatch({ type: 'SET_VIEW', payload: 'home' })
    }

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h2>📚 Your Library</h2>
                <button className="btn-outline" onClick={() => dispatch({ type: 'SET_VIEW', payload: 'home' })}>← Back</button>
            </div>

            {savedConcepts.length === 0 ? (
                <div className="study-card" style={{ textAlign: 'center', color: 'var(--green-sage)', padding: '48px' }}>
                    <p style={{ fontSize: '1.1rem' }}>No concepts saved yet.</p>
                    <p style={{ marginTop: '8px' }}>Start learning to build your library!</p>
                </div>
            ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '16px' }}>
                    {savedConcepts.map((item, i) => (
                        <div
                            key={i}
                            className="study-card"
                            onClick={() => openConcept(item)}
                            style={{ cursor: 'pointer', transition: 'transform 0.2s' }}
                            onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
                            onMouseLeave={e => e.currentTarget.style.transform = ''}
                        >
                            <h3 style={{ fontSize: '1rem', marginBottom: '8px' }}>{item.concept}</h3>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '0.85rem', color: 'var(--green-sage)' }}>
                                <span>✅ Score: {item.score}/10</span>
                                <span>📈 Difficulty: {item.difficulty_reached}</span>
                                <span>📅 {item.date_learned}</span>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}

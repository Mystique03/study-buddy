import './Header.css'

export default function Header({ onLibrary, onNewSession }) {
    return (
        <header className="summer-header">
            <div className="logo">
                <span className="lemon-icon">🍋</span>
                <h1>Study Buddy</h1>
            </div>
            <nav>
                <button className="btn-outline" onClick={onLibrary}>📚 Library</button>
                <button className="btn-primary" onClick={onNewSession}>+ New Session</button>
            </nav>
        </header>
    )
}
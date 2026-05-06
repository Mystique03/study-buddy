export default function VisualRenderer({ html, title = 'Visual Explanation' }) {
    if (!html) {
        return (
            <div className="visual-skeleton study-card" style={{ height: '400px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--green-sage)' }}>
                Generating visual...
            </div>
        )
    }

    return (
        <iframe
            srcDoc={html}
            title={title}
            sandbox="allow-scripts"
            style={{
                width: '100%',
                height: '400px',
                border: '1px solid var(--green-sage)',
                borderRadius: '24px',
                display: 'block',
                background: 'white',
            }}
        />
    )
}

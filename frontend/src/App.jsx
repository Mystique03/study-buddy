import { StudyProvider } from './context/StudyContext'
import Home from './pages/Home'

function App() {
    return (
        <StudyProvider>
            <div className="app">
                <Home />
            </div>
        </StudyProvider>
    )
}

export default App
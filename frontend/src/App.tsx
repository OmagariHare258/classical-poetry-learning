import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import LearningPage from './components/LearningPage'
import HomePage from './components/HomePage'
import CategoriesPage from './components/CategoriesPage'
import ImmersiveLearningPage from './components/ImmersiveLearningPage'
import CompletionPage from './components/CompletionPage'

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-red-50">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/categories" element={<CategoriesPage />} />
          <Route path="/learn/:poemId" element={<LearningPage />} />
          <Route path="/learning/:poemId" element={<LearningPage />} />
          <Route path="/immersive/:poemId" element={<ImmersiveLearningPage />} />
          <Route path="/completion/:poemId" element={<CompletionPage />} />
        </Routes>
      </div>
    </Router>
  )
}

export default App
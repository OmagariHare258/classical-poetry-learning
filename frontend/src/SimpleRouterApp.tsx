import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import SimpleHomePage from './components/SimpleHomePage'
import SimpleCategoriesPage from './components/SimpleCategoriesPage'
import SimpleLearningPage from './components/SimpleLearningPage'
import EnhancedImmersiveLearningPage from './components/EnhancedImmersiveLearningPage'
import SimpleCompletionPage from './components/SimpleCompletionPage'

function SimpleApp() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<SimpleHomePage />} />
        <Route path="/categories" element={<SimpleCategoriesPage />} />
        <Route path="/learn/:poemId" element={<SimpleLearningPage />} />
        <Route path="/learning/:poemId" element={<SimpleLearningPage />} />
        <Route path="/immersive/:poemId" element={<EnhancedImmersiveLearningPage />} />
        <Route path="/completion/:poemId" element={<SimpleCompletionPage />} />
      </Routes>
    </Router>
  )
}

export default SimpleApp

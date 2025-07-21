import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { BookOpen, Sparkles } from 'lucide-react'
import axios from 'axios'

interface Poem {
  id: string
  title: string
  author: string
  dynasty: string
  difficulty: 'easy' | 'medium' | 'hard'
  content: string
  translation?: string
}

const SimpleHomePage: React.FC = () => {
  const [poems, setPoems] = useState<Poem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchPoems = async () => {
      try {
        const response = await axios.get('/api/poems?limit=6')
        if (response.data.success) {
          setPoems(response.data.data)
        }
      } catch (error) {
        console.error('获取诗词列表失败:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchPoems()
  }, [])

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'bg-green-100 text-green-800'
      case 'medium': return 'bg-yellow-100 text-yellow-800'  
      case 'hard': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getDifficultyText = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return '简单'
      case 'medium': return '中等'
      case 'hard': return '困难'
      default: return difficulty
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-red-50">
      <div className="container mx-auto px-4 py-8">
        {/* 标题部分 */}
        <div className="text-center mb-12">
          <div className="flex justify-center items-center mb-6">
            <BookOpen className="h-12 w-12 text-amber-600 mr-3" />
            <h1 className="text-4xl font-bold text-gray-800">古诗文学习平台</h1>
          </div>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            通过互动学习和AI辅助，深度理解中华古典诗词的美妙意境
          </p>
        </div>

        {/* 功能卡片 */}
        <div className="grid md:grid-cols-2 gap-8 mb-12">
          <div className="bg-white rounded-xl shadow-lg p-8 hover:shadow-xl transition-shadow">
            <div className="flex items-center mb-4">
              <BookOpen className="h-8 w-8 text-blue-600 mr-3" />
              <h2 className="text-2xl font-semibold text-gray-800">传统学习</h2>
            </div>
            <p className="text-gray-600 mb-6">
              通过问答互动，逐步学习古诗词的内容、背景和意境
            </p>
            <Link
              to="/categories"
              className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              开始学习
            </Link>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-8 hover:shadow-xl transition-shadow">
            <div className="flex items-center mb-4">
              <Sparkles className="h-8 w-8 text-purple-600 mr-3" />
              <h2 className="text-2xl font-semibold text-gray-800">沉浸式体验</h2>
            </div>
            <p className="text-gray-600 mb-6">
              结合AI生成的意境图片，获得更加沉浸式的学习体验
            </p>
            <Link
              to="/categories"
              className="inline-flex items-center px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
            >
              体验学习
            </Link>
          </div>
        </div>

        {/* 诗词展示 */}
        <div className="bg-white rounded-xl shadow-lg p-8">
          <h2 className="text-2xl font-semibold text-gray-800 mb-6">精选诗词</h2>
          
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600 mx-auto mb-4"></div>
              <p className="text-gray-600">正在加载诗词...</p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {poems.map((poem) => (
                <div key={poem.id} className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
                  <div className="flex justify-between items-start mb-3">
                    <h3 className="text-lg font-semibold text-gray-800">{poem.title}</h3>
                    <span className={`px-2 py-1 rounded-full text-xs ${getDifficultyColor(poem.difficulty)}`}>
                      {getDifficultyText(poem.difficulty)}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mb-3">{poem.author} · {poem.dynasty}</p>
                  <p className="text-gray-700 text-sm leading-relaxed mb-4">{poem.content}</p>
                  {poem.translation && (
                    <p className="text-xs text-gray-500 mb-4">💭 {poem.translation}</p>
                  )}
                  <Link
                    to={`/learn/${poem.id}`}
                    className="inline-flex items-center text-amber-600 hover:text-amber-700 text-sm font-medium"
                  >
                    开始学习 →
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default SimpleHomePage

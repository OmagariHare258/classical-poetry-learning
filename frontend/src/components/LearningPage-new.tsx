import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Book, Heart, Star, Clock, User } from 'lucide-react'
import axios from 'axios'

interface Poem {
  id: string
  title: string
  author: string
  dynasty: string
  difficulty: 'easy' | 'medium' | 'hard'
  content: string
  translation: string
  description?: string
  tags?: string[]
  appreciation?: string
}

const LearningPage: React.FC = () => {
  const { poemId } = useParams<{ poemId: string }>()
  const navigate = useNavigate()
  
  const [poem, setPoem] = useState<Poem | null>(null)
  const [loading, setLoading] = useState(true)
  const [showTranslation, setShowTranslation] = useState(false)
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    if (poemId) {
      fetchPoem(poemId)
    }
  }, [poemId])

  const fetchPoem = async (id: string) => {
    try {
      setLoading(true)
      const response = await axios.get(`/api/poems/${id}`)
      if (response.data.success) {
        setPoem(response.data.data)
        // 模拟学习进度
        setProgress(Math.floor(Math.random() * 80) + 20)
      }
    } catch (error) {
      console.error('获取诗词详情失败:', error)
    } finally {
      setLoading(false)
    }
  }

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy':
        return 'bg-green-100 text-green-700 border-green-200'
      case 'medium':
        return 'bg-yellow-100 text-yellow-700 border-yellow-200'
      case 'hard':
        return 'bg-red-100 text-red-700 border-red-200'
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200'
    }
  }

  const getDifficultyText = (difficulty: string) => {
    switch (difficulty) {
      case 'easy':
        return '简单'
      case 'medium':
        return '中等'
      case 'hard':
        return '困难'
      default:
        return '未知'
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-amber-50 to-orange-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600 mx-auto mb-4"></div>
          <p className="text-gray-600">正在加载诗词内容...</p>
        </div>
      </div>
    )
  }

  if (!poem) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-amber-50 to-orange-50">
        <div className="text-center">
          <div className="text-6xl mb-4">📚</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">诗词未找到</h2>
          <p className="text-gray-600 mb-6">抱歉，无法找到您要学习的诗词</p>
          <button
            onClick={() => navigate('/')}
            className="bg-amber-600 text-white px-6 py-2 rounded-lg hover:bg-amber-700 transition-colors"
          >
            返回首页
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-red-50">
      {/* 头部导航 */}
      <header className="bg-white/90 backdrop-blur-sm border-b border-amber-200 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => navigate('/')}
              className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              <span>返回首页</span>
            </button>
            
            <div className="text-center">
              <h1 className="text-2xl font-bold text-gray-900">{poem.title}</h1>
              <p className="text-gray-600">{poem.author} · {poem.dynasty}朝</p>
            </div>
            
            <div className="flex items-center space-x-4">
              <span className={`px-3 py-1 rounded-full text-sm border ${getDifficultyColor(poem.difficulty)}`}>
                {getDifficultyText(poem.difficulty)}
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* 主要内容区域 */}
      <main className="max-w-6xl mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          
          {/* 左侧：诗词内容 */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-lg p-8 mb-6">
              <div className="text-center mb-8">
                <h2 className="text-3xl font-bold text-gray-900 mb-2">{poem.title}</h2>
                <div className="flex items-center justify-center space-x-4 text-gray-600 mb-6">
                  <div className="flex items-center space-x-1">
                    <User className="w-4 h-4" />
                    <span>{poem.author}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Clock className="w-4 h-4" />
                    <span>{poem.dynasty}朝</span>
                  </div>
                </div>
              </div>

              {/* 诗词原文 */}
              <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-lg p-6 mb-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                  <Book className="w-5 h-5 mr-2" />
                  原文
                </h3>
                <div className="text-gray-800 leading-relaxed">
                  {poem.content.split(' ').map((line, index) => (
                    <p key={index} className="text-lg mb-2 text-center font-serif">
                      {line}
                    </p>
                  ))}
                </div>
              </div>

              {/* 译文区域 */}
              <div className="bg-blue-50 rounded-lg p-6 mb-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-800 flex items-center">
                    <Heart className="w-5 h-5 mr-2" />
                    译文
                  </h3>
                  <button
                    onClick={() => setShowTranslation(!showTranslation)}
                    className="text-sm bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600 transition-colors"
                  >
                    {showTranslation ? '隐藏译文' : '显示译文'}
                  </button>
                </div>
                {showTranslation && (
                  <div className="text-gray-700 leading-relaxed">
                    <p>{poem.translation}</p>
                  </div>
                )}
              </div>

              {/* 作品描述 */}
              {poem.description && (
                <div className="bg-green-50 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center">
                    <Star className="w-5 h-5 mr-2" />
                    作品赏析
                  </h3>
                  <p className="text-gray-700 leading-relaxed">{poem.description}</p>
                </div>
              )}
            </div>
          </div>

          {/* 右侧：学习工具 */}
          <div className="space-y-6">
            
            {/* 学习进度 */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">学习进度</h3>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm text-gray-600 mb-1">
                    <span>完成度</span>
                    <span>{progress}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-green-500 h-2 rounded-full transition-all duration-500"
                      style={{ width: `${progress}%` }}
                    ></div>
                  </div>
                </div>
                <div className="text-sm text-gray-600">
                  <p>• 已阅读原文</p>
                  <p>• {showTranslation ? '已查看译文' : '未查看译文'}</p>
                  <p>• 学习时间: {Math.floor(Math.random() * 15) + 5}分钟</p>
                </div>
              </div>
            </div>

            {/* 标签信息 */}
            {poem.tags && poem.tags.length > 0 && (
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">诗词标签</h3>
                <div className="flex flex-wrap gap-2">
                  {poem.tags.map((tag, index) => (
                    <span 
                      key={index}
                      className="px-3 py-1 bg-amber-100 text-amber-700 rounded-full text-sm"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* 学习建议 */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">学习建议</h3>
              <div className="space-y-3 text-sm text-gray-600">
                <div className="flex items-start space-x-2">
                  <span className="text-amber-500">•</span>
                  <span>反复朗读，体会诗词的韵律美</span>
                </div>
                <div className="flex items-start space-x-2">
                  <span className="text-amber-500">•</span>
                  <span>结合作者生平理解创作背景</span>
                </div>
                <div className="flex items-start space-x-2">
                  <span className="text-amber-500">•</span>
                  <span>对比其他同类题材的作品</span>
                </div>
                <div className="flex items-start space-x-2">
                  <span className="text-amber-500">•</span>
                  <span>尝试背诵并理解其中的意境</span>
                </div>
              </div>
            </div>

            {/* 相关推荐 */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">继续学习</h3>
              <div className="space-y-3">
                <button
                  onClick={() => navigate('/')}
                  className="w-full bg-amber-500 text-white py-2 px-4 rounded-lg hover:bg-amber-600 transition-colors"
                >
                  浏览更多诗词
                </button>
                <button
                  onClick={() => setShowTranslation(!showTranslation)}
                  className="w-full bg-blue-500 text-white py-2 px-4 rounded-lg hover:bg-blue-600 transition-colors"
                >
                  练习模式（即将推出）
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

export default LearningPage

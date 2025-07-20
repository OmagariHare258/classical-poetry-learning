import React, { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { 
  Star, 
  Trophy, 
  BookOpen, 
  ArrowRight, 
  Award,
  Target,
  Clock,
  Heart
} from 'lucide-react'
import axios from 'axios'

interface Poem {
  id: string
  title: string
  author: string
  dynasty: string
  content: string[]
  translation?: string
  appreciation?: string
  difficulty: 'easy' | 'medium' | 'hard'
  tags?: string[]
}

interface CompletionStats {
  totalTime: number
  accuracy: number
  hintsUsed: number
  totalSteps: number
  completedSteps: number
}

const CompletionPage: React.FC = () => {
  const { poemId } = useParams<{ poemId: string }>()
  const navigate = useNavigate()
  
  const [poem, setPoem] = useState<Poem | null>(null)
  const [stats, setStats] = useState<CompletionStats>({
    totalTime: 0,
    accuracy: 0,
    hintsUsed: 0,
    totalSteps: 0,
    completedSteps: 0
  })
  const [recommendations, setRecommendations] = useState<Poem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (poemId) {
      fetchData()
    }
  }, [poemId])

  const fetchData = async () => {
    try {
      // 获取诗词数据
      const poemResponse = await axios.get(`/api/poems/${poemId}`)
      if (poemResponse.data.success) {
        setPoem(poemResponse.data.data)
      }

      // 获取学习统计数据（模拟）
      setStats({
        totalTime: Math.floor(Math.random() * 300) + 120, // 2-7分钟
        accuracy: Math.floor(Math.random() * 30) + 70, // 70-100%
        hintsUsed: Math.floor(Math.random() * 3),
        totalSteps: 4,
        completedSteps: 4
      })

      // 获取推荐诗词
      const recommendResponse = await axios.get('/api/poems')
      if (recommendResponse.data.success) {
        const allPoems = recommendResponse.data.data
        const otherPoems = allPoems.filter((p: Poem) => p.id !== poemId)
        setRecommendations(otherPoems.slice(0, 3))
      }
    } catch (error) {
      console.error('获取数据失败:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes}分${remainingSeconds}秒`
  }

  const getPerformanceLevel = (accuracy: number) => {
    if (accuracy >= 90) return { level: '优秀', color: 'text-green-400', emoji: '🎉' }
    if (accuracy >= 80) return { level: '良好', color: 'text-blue-400', emoji: '👍' }
    if (accuracy >= 70) return { level: '及格', color: 'text-yellow-400', emoji: '😊' }
    return { level: '需要努力', color: 'text-orange-400', emoji: '💪' }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 to-gray-800">
        <div className="text-center text-white">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-400 mx-auto mb-4"></div>
          <p>正在统计学习成果...</p>
        </div>
      </div>
    )
  }

  if (!poem) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 to-gray-800">
        <div className="text-center text-white">
          <p>数据加载失败</p>
          <button onClick={() => navigate('/')} className="mt-4 bg-yellow-600 text-white px-6 py-2 rounded-lg">
            返回首页
          </button>
        </div>
      </div>
    )
  }

  const performance = getPerformanceLevel(stats.accuracy)

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900">
      <div className="max-w-4xl mx-auto px-4 py-8">
        
        {/* 头部庆祝区域 */}
        <div className="text-center mb-12">
          <div className="mb-6">
            <Trophy className="w-20 h-20 text-yellow-400 mx-auto mb-4 animate-bounce" />
            <h1 className="text-4xl font-bold text-white mb-2">学习完成！</h1>
            <p className="text-xl text-white/80">恭喜你完成了《{poem.title}》的学习</p>
          </div>
          
          {/* 性能等级 */}
          <div className="inline-flex items-center space-x-2 bg-white/10 backdrop-blur-sm rounded-full px-6 py-3">
            <span className="text-2xl">{performance.emoji}</span>
            <span className={`text-lg font-semibold ${performance.color}`}>
              {performance.level}
            </span>
            <span className="text-white/80">({stats.accuracy}% 准确率)</span>
          </div>
        </div>

        {/* 学习统计 */}
        <div className="grid md:grid-cols-4 gap-6 mb-12">
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 text-center border border-white/20">
            <Clock className="w-8 h-8 text-blue-400 mx-auto mb-3" />
            <div className="text-2xl font-bold text-white mb-1">{formatTime(stats.totalTime)}</div>
            <div className="text-white/60 text-sm">学习时长</div>
          </div>
          
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 text-center border border-white/20">
            <Target className="w-8 h-8 text-green-400 mx-auto mb-3" />
            <div className="text-2xl font-bold text-white mb-1">{stats.accuracy}%</div>
            <div className="text-white/60 text-sm">准确率</div>
          </div>
          
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 text-center border border-white/20">
            <Award className="w-8 h-8 text-purple-400 mx-auto mb-3" />
            <div className="text-2xl font-bold text-white mb-1">{stats.completedSteps}/{stats.totalSteps}</div>
            <div className="text-white/60 text-sm">完成步骤</div>
          </div>
          
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 text-center border border-white/20">
            <Heart className="w-8 h-8 text-red-400 mx-auto mb-3" />
            <div className="text-2xl font-bold text-white mb-1">{stats.hintsUsed}</div>
            <div className="text-white/60 text-sm">使用提示</div>
          </div>
        </div>

        {/* 诗词回顾 */}
        <div className="bg-white/10 backdrop-blur-sm rounded-xl p-8 mb-12 border border-white/20">
          <h2 className="text-2xl font-bold text-white mb-6 text-center">诗词回顾</h2>
          
          <div className="max-w-2xl mx-auto">
            {/* 完整诗词 */}
            <div className="text-center mb-8">
              <h3 className="text-3xl font-bold text-white mb-2">{poem.title}</h3>
              <p className="text-xl text-white/80 mb-6">{poem.author} · {poem.dynasty}朝</p>
              
              <div className="space-y-3 mb-8">
                {poem.content.map((line, index) => (
                  <div key={index} className="text-2xl text-white font-medium tracking-wider">
                    {line}
                  </div>
                ))}
              </div>
            </div>
            
            {/* 翻译和赏析 */}
            {poem.translation && (
              <div className="mb-6">
                <h4 className="text-lg font-semibold text-white/90 mb-3">现代译文</h4>
                <p className="text-white/70 leading-relaxed bg-white/5 rounded-lg p-4">
                  {poem.translation}
                </p>
              </div>
            )}
            
            {poem.appreciation && (
              <div>
                <h4 className="text-lg font-semibold text-white/90 mb-3">文学赏析</h4>
                <p className="text-white/70 leading-relaxed bg-white/5 rounded-lg p-4">
                  {poem.appreciation}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* 继续学习推荐 */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-white mb-6 text-center">继续探索更多诗词</h2>
          
          <div className="grid md:grid-cols-3 gap-6">
            {recommendations.map((recPoem) => (
              <Link
                key={recPoem.id}
                to={`/immersive/${recPoem.id}`}
                className="group bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20 hover:bg-white/15 transition-all duration-300"
              >
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-xl font-semibold text-white group-hover:text-yellow-300 transition-colors">
                      {recPoem.title}
                    </h3>
                    <p className="text-white/60 text-sm">{recPoem.author} · {recPoem.dynasty}朝</p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                    recPoem.difficulty === 'easy' ? 'bg-green-500/20 text-green-300 border border-green-500/30' :
                    recPoem.difficulty === 'medium' ? 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/30' :
                    'bg-red-500/20 text-red-300 border border-red-500/30'
                  }`}>
                    {recPoem.difficulty === 'easy' ? '简单' : 
                     recPoem.difficulty === 'medium' ? '中等' : '困难'}
                  </span>
                </div>
                
                {recPoem.tags && (
                  <div className="flex flex-wrap gap-2 mb-4">
                    {recPoem.tags.slice(0, 3).map((tag, index) => (
                      <span 
                        key={index}
                        className="px-2 py-1 bg-white/10 text-white/60 rounded text-xs"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
                
                <div className="flex items-center justify-between">
                  <span className="text-sm text-white/60">点击开始沉浸式学习</span>
                  <ArrowRight className="w-5 h-5 text-yellow-400 group-hover:translate-x-1 transition-transform" />
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* 操作按钮 */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button
            onClick={() => navigate('/categories')}
            className="flex items-center justify-center space-x-2 bg-white/10 backdrop-blur-sm text-white px-8 py-4 rounded-xl hover:bg-white/15 transition-all duration-300 border border-white/20"
          >
            <BookOpen className="w-5 h-5" />
            <span>浏览更多诗词</span>
          </button>
          
          <button
            onClick={() => navigate('/')}
            className="flex items-center justify-center space-x-2 bg-gradient-to-r from-yellow-500 to-orange-500 text-white px-8 py-4 rounded-xl hover:from-yellow-600 hover:to-orange-600 transition-all duration-300 shadow-lg hover:shadow-xl"
          >
            <Star className="w-5 h-5" />
            <span>返回首页</span>
          </button>
          
          <Link
            to={`/immersive/${poemId}`}
            className="flex items-center justify-center space-x-2 bg-purple-600 text-white px-8 py-4 rounded-xl hover:bg-purple-700 transition-all duration-300"
          >
            <ArrowRight className="w-5 h-5" />
            <span>重新学习</span>
          </Link>
        </div>
      </div>
    </div>
  )
}

export default CompletionPage

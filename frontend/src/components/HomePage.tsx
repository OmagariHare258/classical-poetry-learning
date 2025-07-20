import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { 
  BookOpen, 
  Sparkles, 
  Cpu, 
  Zap, 
  Brain, 
  TrendingUp, 
  Award, 
  MessageCircle,
  Lightbulb,
  Filter,
  Star,
  Settings,
  FileText,
  ChevronDown
} from 'lucide-react'
import axios from 'axios'
import ApiConfigModal from './ApiConfigModal'
import EnvEditor from './EnvEditor'

interface Poem {
  id: string
  title: string
  author: string
  dynasty: string
  difficulty: 'easy' | 'medium' | 'hard'
  description?: string
  tags?: string[]
  translation?: string
  appreciation?: string
  coverImage?: string
}

interface N8nStatus {
  status: 'connected' | 'disconnected'
  activeWorkflows?: number
  error?: string
  version?: string
}

interface LearningAssistant {
  type: 'question' | 'explanation' | 'suggestion'
  question?: string
  suggestions?: string[]
  source: 'n8n' | 'fallback'
}

interface ProgressSummary {
  totalStudyTime: number
  poemsStudied: number
  averageScore: number
  studyStreak: number
  level: number
  badges: Array<{name: string, icon: string, description: string}>
}

const HomePage: React.FC = () => {
  const [poems, setPoems] = useState<Poem[]>([])
  const [recommendations, setRecommendations] = useState<Poem[]>([])
  const [n8nStatus, setN8nStatus] = useState<N8nStatus>({ status: 'disconnected' })
  const [learningAssistant, setLearningAssistant] = useState<LearningAssistant | null>(null)
  const [progressSummary, setProgressSummary] = useState<ProgressSummary | null>(null)
  const [loading, setLoading] = useState(true)
  const [loadingRecommendations, setLoadingRecommendations] = useState(false)
  const [loadingAssistant, setLoadingAssistant] = useState(false)
  const [showApiConfig, setShowApiConfig] = useState(false)
  const [showEnvEditor, setShowEnvEditor] = useState(false)
  const [showSettingsDropdown, setShowSettingsDropdown] = useState(false)

  useEffect(() => {
    fetchPoems()
    checkN8nStatus()
    fetchRecommendations()
    fetchProgressSummary()
  }, [])

  // 点击外部关闭下拉菜单
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showSettingsDropdown) {
        const target = event.target as Element
        if (!target.closest('.relative')) {
          setShowSettingsDropdown(false)
        }
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showSettingsDropdown])

  const fetchPoems = async () => {
    try {
      const response = await axios.get('/api/poems')
      if (response.data.success) {
        setPoems(response.data.data)
      }
    } catch (error) {
      console.error('获取诗词列表失败:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchProgressSummary = async () => {
    try {
      const response = await axios.post('/api/n8n/progress-analytics', {
        userId: 'demo-user',
        timeRange: '30days',
        analysisType: 'comprehensive'
      })
      if (response.data.success) {
        const data = response.data.data
        setProgressSummary({
          totalStudyTime: data.summary?.totalStudyTime || 1250,
          poemsStudied: data.summary?.poemsStudied || 15,
          averageScore: data.summary?.averageScore || 78,
          studyStreak: data.summary?.studyStreak || 12,
          level: data.growthReport?.level || 3,
          badges: data.growthReport?.badges || [
            { name: '坚持学习', icon: '🏆', description: '连续学习7天' },
            { name: '优秀学者', icon: '🎓', description: '平均分超过75分' }
          ]
        })
      }
    } catch (error) {
      console.error('获取学习进度失败:', error)
      setProgressSummary({
        totalStudyTime: 1250,
        poemsStudied: 15,
        averageScore: 78,
        studyStreak: 12,
        level: 3,
        badges: [
          { name: '坚持学习', icon: '🏆', description: '连续学习7天' },
          { name: '优秀学者', icon: '🎓', description: '平均分超过75分' }
        ]
      })
    }
  }

  const handleApiConfigSave = (config: any) => {
    console.log('API配置已保存:', config)
    // 重新检查n8n状态
    checkN8nStatus()
  }

  const fetchLearningAssistant = async (poemId: string, action: string = 'question') => {
    setLoadingAssistant(true)
    try {
      const response = await axios.post('/api/n8n/learning-assistant', {
        action,
        poemId,
        difficulty: 'medium'
      })
      if (response.data.success) {
        setLearningAssistant(response.data.data)
      }
    } catch (error) {
      console.error('获取学习助手失败:', error)
      setLearningAssistant({
        type: 'suggestion',
        suggestions: [
          '先通读全文，理解大意',
          '注意诗词的韵律节奏',
          '了解作者的时代背景',
          '体会诗词的情感表达'
        ],
        source: 'fallback'
      })
    } finally {
      setLoadingAssistant(false)
    }
  }

  const checkN8nStatus = async () => {
    try {
      const response = await axios.get('/api/n8n/status')
      setN8nStatus(response.data.data)
    } catch (error) {
      console.error('检查n8n状态失败:', error)
      setN8nStatus({ status: 'disconnected', error: '无法连接到n8n服务' })
    }
  }

  const fetchRecommendations = async () => {
    setLoadingRecommendations(true)
    try {
      const response = await axios.post('/api/n8n/get-recommendations', {
        userId: 'guest',
        preferences: {
          difficulty: 'medium',
          dynasty: '唐'
        }
      })
      if (response.data.success) {
        setRecommendations(response.data.data.recommendations || [])
      }
    } catch (error) {
      console.error('获取推荐失败:', error)
    } finally {
      setLoadingRecommendations(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600 mx-auto mb-4"></div>
          <p className="text-gray-600">正在加载古诗文学习平台...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-red-50">
      {/* 头部区域 */}
      <header className="bg-white/90 backdrop-blur-sm border-b border-amber-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex justify-between items-center">
            <div className="text-center flex-1">
              <h1 className="text-4xl font-black text-gray-900 mb-2" style={{fontFamily: 'system-ui, -apple-system, "Segoe UI", "Roboto", "Helvetica Neue", Arial, sans-serif', fontWeight: 900}}>
                Hi，Chinese
              </h1>
            </div>
            
            {/* n8n状态指示器和设置 */}
            <div className="flex items-center space-x-4">
              {/* 设置下拉菜单 */}
              <div className="relative">
                <button
                  onClick={() => setShowSettingsDropdown(!showSettingsDropdown)}
                  className="inline-flex items-center space-x-2 px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-full shadow-sm border transition-colors"
                  title="系统设置"
                >
                  <Settings className="w-4 h-4 text-gray-600" />
                  <span className="text-xs font-medium text-gray-700">设置</span>
                  <ChevronDown className="w-3 h-3 text-gray-600" />
                </button>
                
                {/* 设置下拉菜单 */}
                {showSettingsDropdown && (
                  <div className="absolute top-full right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border z-50">
                    <div className="py-1">
                      <button
                        onClick={() => {
                          setShowApiConfig(true)
                          setShowSettingsDropdown(false)
                        }}
                        className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center space-x-2"
                      >
                        <Settings className="w-4 h-4" />
                        <span>AI配置</span>
                      </button>
                      <button
                        onClick={() => {
                          setShowEnvEditor(true)
                          setShowSettingsDropdown(false)
                        }}
                        className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center space-x-2"
                      >
                        <FileText className="w-4 h-4" />
                        <span>环境配置</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
              
              <div className="inline-flex items-center space-x-2 px-3 py-2 bg-white rounded-full shadow-sm border">
                <Cpu className="w-4 h-4 text-blue-500" />
                <div className={`w-2 h-2 rounded-full ${
                  n8nStatus.status === 'connected' ? 'bg-green-500' : 'bg-red-500'
                }`}></div>
                <span className={`text-xs font-medium ${
                  n8nStatus.status === 'connected' ? 'text-green-700' : 'text-red-700'
                }`}>
                  AI工作流 {n8nStatus.status === 'connected' ? '已连接' : '未连接'}
                </span>
              </div>
              
              {/* 学习进度快览 */}
              {progressSummary && (
                <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-4 py-2 rounded-full shadow-lg">
                  <div className="flex items-center space-x-2">
                    <Star className="w-4 h-4" />
                    <span className="text-sm font-medium">Lv.{progressSummary.level}</span>
                    <span className="text-xs opacity-90">
                      {progressSummary.studyStreak}天连续学习
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* 智能功能仪表板 */}
      <section className="py-8 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-4 md:grid-cols-2 gap-6 mb-8">
            
            {/* 学习进度卡片 */}
            {progressSummary && (
              <div className="bg-white rounded-xl shadow-lg p-6 border border-blue-100">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-gray-800">学习进度</h3>
                  <TrendingUp className="w-5 h-5 text-blue-500" />
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">已学诗词</span>
                    <span className="font-medium">{progressSummary.poemsStudied}篇</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">平均分数</span>
                    <span className="font-medium text-green-600">{progressSummary.averageScore}分</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">学习时长</span>
                    <span className="font-medium">{Math.round(progressSummary.totalStudyTime/60)}小时</span>
                  </div>
                  <div className="pt-2">
                    <button 
                      onClick={() => fetchLearningAssistant('progress', 'analytics')}
                      className="w-full bg-blue-500 text-white py-2 rounded-lg text-sm hover:bg-blue-600 transition-colors"
                    >
                      查看详细分析
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* 智能推荐卡片 */}
            <div className="bg-white rounded-xl shadow-lg p-6 border border-purple-100">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-800">AI推荐</h3>
                <Brain className="w-5 h-5 text-purple-500" />
              </div>
              <div className="space-y-3">
                {loadingRecommendations ? (
                  <div className="text-center py-4">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-500 mx-auto"></div>
                    <p className="text-sm text-gray-500 mt-2">AI分析中...</p>
                  </div>
                ) : (
                  recommendations.slice(0, 2).map((poem) => (
                    <div key={poem.id} className="p-3 bg-purple-50 rounded-lg">
                      <h4 className="font-medium text-sm">{poem.title}</h4>
                      <p className="text-xs text-gray-600">{poem.author} · {poem.dynasty}</p>
                      <div className="mt-1">
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          poem.difficulty === 'easy' ? 'bg-green-100 text-green-700' :
                          poem.difficulty === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                          'bg-red-100 text-red-700'
                        }`}>
                          {poem.difficulty === 'easy' ? '简单' : 
                           poem.difficulty === 'medium' ? '中等' : '困难'}
                        </span>
                      </div>
                    </div>
                  ))
                )}
                <button 
                  onClick={fetchRecommendations}
                  className="w-full bg-purple-500 text-white py-2 rounded-lg text-sm hover:bg-purple-600 transition-colors"
                >
                  刷新推荐
                </button>
              </div>
            </div>

            {/* 学习助手卡片 */}
            <div className="bg-white rounded-xl shadow-lg p-6 border border-green-100">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-800">智能助手</h3>
                <MessageCircle className="w-5 h-5 text-green-500" />
              </div>
              <div className="space-y-3">
                {learningAssistant ? (
                  <div className="space-y-2">
                    {learningAssistant.question && (
                      <div className="p-3 bg-green-50 rounded-lg">
                        <p className="text-sm font-medium mb-2">💡 智能提问</p>
                        <p className="text-sm text-gray-700">{learningAssistant.question}</p>
                      </div>
                    )}
                    {learningAssistant.suggestions && (
                      <div className="space-y-1">
                        {learningAssistant.suggestions.slice(0, 2).map((suggestion, index) => (
                          <div key={index} className="text-xs text-gray-600 p-2 bg-gray-50 rounded">
                            • {suggestion}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-4">
                    <Lightbulb className="w-8 h-8 text-green-500 mx-auto mb-2" />
                    <p className="text-sm text-gray-600">点击获取智能学习建议</p>
                  </div>
                )}
                <button 
                  onClick={() => fetchLearningAssistant('ailianshuopian', 'question')}
                  disabled={loadingAssistant}
                  className="w-full bg-green-500 text-white py-2 rounded-lg text-sm hover:bg-green-600 transition-colors disabled:opacity-50"
                >
                  {loadingAssistant ? '思考中...' : '获取学习建议'}
                </button>
              </div>
            </div>

            {/* 成就徽章卡片 */}
            <div className="bg-white rounded-xl shadow-lg p-6 border border-yellow-100">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-800">成就徽章</h3>
                <Award className="w-5 h-5 text-yellow-500" />
              </div>
              <div className="space-y-3">
                {progressSummary?.badges && progressSummary.badges.length > 0 ? (
                  progressSummary.badges.slice(0, 3).map((badge, index) => (
                    <div key={index} className="flex items-center space-x-3 p-2 bg-yellow-50 rounded-lg">
                      <span className="text-lg">{badge.icon}</span>
                      <div>
                        <p className="text-sm font-medium">{badge.name}</p>
                        <p className="text-xs text-gray-600">{badge.description}</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-4">
                    <Award className="w-8 h-8 text-yellow-500 mx-auto mb-2" />
                    <p className="text-sm text-gray-600">努力学习获得徽章</p>
                  </div>
                )}
                <button className="w-full bg-yellow-500 text-white py-2 rounded-lg text-sm hover:bg-yellow-600 transition-colors">
                  查看所有成就
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 诗词展示区域 */}
      {/* 诗词列表区域 */}
      <section className="py-12 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-4 sm:mb-0">精选古诗文</h2>
            <div className="flex items-center space-x-3">
              <Link
                to="/categories"
                className="inline-flex items-center space-x-2 bg-gradient-to-r from-amber-500 to-orange-500 text-white px-6 py-3 rounded-xl hover:from-amber-600 hover:to-orange-600 transition-all duration-300 shadow-lg hover:shadow-xl"
              >
                <Filter className="w-5 h-5" />
                <span className="font-medium">分类查找</span>
              </Link>
              <div className="text-sm text-gray-600">
                共 {poems.length} 篇
              </div>
            </div>
          </div>

          {/* 诗词卡片网格 */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {poems.map((poem) => (
              <div
                key={poem.id}
                className="group bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden border"
              >
                <div className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-xl font-semibold text-gray-900 group-hover:text-amber-600 transition-colors">
                        {poem.title}
                      </h3>
                      <p className="text-gray-600 text-sm">
                        {poem.author} · {poem.dynasty}朝
                      </p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      poem.difficulty === 'easy' ? 'bg-green-100 text-green-700' :
                      poem.difficulty === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                      'bg-red-100 text-red-700'
                    }`}>
                      {poem.difficulty === 'easy' ? '简单' : 
                       poem.difficulty === 'medium' ? '中等' : '困难'}
                    </span>
                  </div>
                  
                  <p className="text-gray-700 text-sm mb-4 line-clamp-2">
                    {poem.description}
                  </p>
                  
                  {poem.tags && (
                    <div className="flex flex-wrap gap-2 mb-4">
                      {poem.tags.slice(0, 3).map((tag, index) => (
                        <span 
                          key={index}
                          className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                  
                  {/* 学习模式选择 */}
                  <div className="space-y-2">
                    <Link
                      to={`/immersive/${poem.id}`}
                      className="w-full flex items-center justify-center space-x-2 bg-gradient-to-r from-purple-500 to-blue-500 text-white py-2 px-4 rounded-lg hover:from-purple-600 hover:to-blue-600 transition-all duration-300 text-sm font-medium"
                    >
                      <Sparkles className="w-4 h-4" />
                      <span>沉浸式学习</span>
                    </Link>
                    
                    <Link
                      to={`/learning/${poem.id}`}
                      className="w-full flex items-center justify-center space-x-2 bg-gray-100 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-200 transition-colors text-sm"
                    >
                      <BookOpen className="w-4 h-4" />
                      <span>传统阅读</span>
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 页脚 */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid md:grid-cols-3 gap-8 mb-8">
            <div>
              <h3 className="text-lg font-semibold mb-4">关于平台</h3>
              <p className="text-gray-400 text-sm">
                基于AI技术的智能古诗文学习平台，致力于传承中华优秀传统文化，让每个人都能轻松领略古典文学之美。
              </p>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-4">学习功能</h3>
              <ul className="space-y-2 text-sm text-gray-400">
                <li>• 智能推荐系统</li>
                <li>• 个性化学习路径</li>
                <li>• 实时进度跟踪</li>
                <li>• AI学习助手</li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-4">技术支持</h3>
              <div className="flex items-center space-x-2 text-sm text-gray-400">
                <Zap className="w-4 h-4" />
                <span>n8n工作流引擎</span>
              </div>
              <div className="flex items-center space-x-2 text-sm text-gray-400 mt-2">
                <Cpu className="w-4 h-4" />
                <span>AI智能分析</span>
              </div>
            </div>
          </div>
          <div className="border-t border-gray-800 pt-8 text-center">
            <p className="text-gray-400 text-sm">
              © 2025 Hi，Chinese. 让古典文学在AI时代焕发新的生机.
            </p>
          </div>
        </div>
      </footer>

      {/* API配置模态框 */}
      <ApiConfigModal
        isOpen={showApiConfig}
        onClose={() => setShowApiConfig(false)}
        onSave={handleApiConfigSave}
      />

      {/* 环境配置编辑器 */}
      <EnvEditor
        isOpen={showEnvEditor}
        onClose={() => setShowEnvEditor(false)}
      />
    </div>
  )
}

export default HomePage

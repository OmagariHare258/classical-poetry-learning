import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { 
  BookOpen, 
  Search, 
  Filter,
  Star,
  Cpu,
  TrendingUp,
  Brain,
  Award
} from 'lucide-react'
import axios from 'axios'

interface Poem {
  id: string
  title: string
  author: string
  dynasty: string
  difficulty: 'easy' | 'medium' | 'hard'
  description?: string
  tags?: string[]
}

interface N8nStatus {
  status: 'connected' | 'disconnected'
  error?: string
}

const HomePage: React.FC = () => {
  const [poems, setPoems] = useState<Poem[]>([])
  const [n8nStatus, setN8nStatus] = useState<N8nStatus>({ status: 'disconnected' })
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    fetchPoems()
    checkN8nStatus()
  }, [])

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

  const checkN8nStatus = async () => {
    try {
      const response = await axios.get('/api/n8n/status')
      setN8nStatus(response.data.data)
    } catch (error) {
      setN8nStatus({ status: 'disconnected', error: '无法连接到n8n服务' })
    }
  }

  const filteredPoems = poems.filter(poem =>
    poem.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    poem.author.toLowerCase().includes(searchTerm.toLowerCase()) ||
    poem.dynasty.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const stats = {
    total: poems.length,
    easy: poems.filter(p => p.difficulty === 'easy').length,
    medium: poems.filter(p => p.difficulty === 'medium').length,
    hard: poems.filter(p => p.difficulty === 'hard').length,
    dynasties: [...new Set(poems.map(p => p.dynasty))].length
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-amber-50 to-orange-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600 mx-auto mb-4"></div>
          <p className="text-gray-600">正在加载古诗文学习平台...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-50">
      {/* 简洁头部 */}
      <header className="bg-white/90 backdrop-blur-sm border-b border-amber-200">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
            {/* 标题区域 */}
            <div className="text-center lg:text-left">
              <h1 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-2">
                古诗文学习平台
              </h1>
              <p className="text-gray-600">
                AI驱动 · 个性化学习 · 传承经典文化
              </p>
            </div>
            
            {/* 状态和统计 */}
            <div className="flex flex-col sm:flex-row items-center space-y-2 sm:space-y-0 sm:space-x-4">
              {/* n8n状态 */}
              <div className="flex items-center space-x-2 bg-white px-3 py-2 rounded-full shadow-sm border">
                <Cpu className="w-4 h-4 text-blue-500" />
                <div className={`w-2 h-2 rounded-full ${
                  n8nStatus.status === 'connected' ? 'bg-green-500' : 'bg-red-500'
                }`}></div>
                <span className={`text-xs font-medium ${
                  n8nStatus.status === 'connected' ? 'text-green-700' : 'text-red-700'
                }`}>
                  AI {n8nStatus.status === 'connected' ? '已连接' : '未连接'}
                </span>
              </div>

              {/* 快速统计 */}
              <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-4 py-2 rounded-full shadow-lg">
                <div className="flex items-center space-x-2 text-sm">
                  <BookOpen className="w-4 h-4" />
                  <span>共{stats.total}篇经典</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* 搜索栏 */}
      <section className="py-6 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="搜索诗词标题、作者或朝代..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-white rounded-xl shadow-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
            />
            <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
              <Link
                to="/categories"
                className="flex items-center space-x-1 text-amber-600 hover:text-amber-700 text-sm font-medium"
              >
                <Filter className="w-4 h-4" />
                <span>分类查找</span>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* 快速统计卡片 */}
      <section className="py-4 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="bg-white rounded-lg p-4 text-center shadow-sm">
              <div className="text-2xl font-bold text-blue-600">{stats.total}</div>
              <div className="text-sm text-gray-600">总数</div>
            </div>
            <div className="bg-white rounded-lg p-4 text-center shadow-sm">
              <div className="text-2xl font-bold text-green-600">{stats.easy}</div>
              <div className="text-sm text-gray-600">简单</div>
            </div>
            <div className="bg-white rounded-lg p-4 text-center shadow-sm">
              <div className="text-2xl font-bold text-yellow-600">{stats.medium}</div>
              <div className="text-sm text-gray-600">中等</div>
            </div>
            <div className="bg-white rounded-lg p-4 text-center shadow-sm">
              <div className="text-2xl font-bold text-red-600">{stats.hard}</div>
              <div className="text-sm text-gray-600">困难</div>
            </div>
            <div className="bg-white rounded-lg p-4 text-center shadow-sm">
              <div className="text-2xl font-bold text-purple-600">{stats.dynasties}</div>
              <div className="text-sm text-gray-600">朝代</div>
            </div>
          </div>
        </div>
      </section>

      {/* 诗词列表 */}
      <section className="py-6 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-800">
              {searchTerm ? `搜索结果 (${filteredPoems.length})` : '精选古诗文'}
            </h2>
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="text-amber-600 hover:text-amber-700 text-sm"
              >
                清除搜索
              </button>
            )}
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredPoems.map((poem) => (
              <Link
                key={poem.id}
                to={`/learning/${poem.id}`}
                className="group bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden border hover:border-amber-200"
              >
                <div className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1">
                      <h3 className="text-xl font-semibold text-gray-900 group-hover:text-amber-600 transition-colors mb-1">
                        {poem.title}
                      </h3>
                      <p className="text-gray-600 text-sm">
                        {poem.author} · {poem.dynasty}朝
                      </p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium flex-shrink-0 ml-2 ${
                      poem.difficulty === 'easy' ? 'bg-green-100 text-green-700' :
                      poem.difficulty === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                      'bg-red-100 text-red-700'
                    }`}>
                      {poem.difficulty === 'easy' ? '简单' : 
                       poem.difficulty === 'medium' ? '中等' : '困难'}
                    </span>
                  </div>
                  
                  {poem.description && (
                    <p className="text-gray-700 text-sm mb-4 line-clamp-2">
                      {poem.description}
                    </p>
                  )}
                  
                  {poem.tags && poem.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-4">
                      {poem.tags.slice(0, 3).map((tag, index) => (
                        <span 
                          key={index}
                          className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs"
                        >
                          {tag}
                        </span>
                      ))}
                      {poem.tags.length > 3 && (
                        <span className="text-xs text-gray-400">+{poem.tags.length - 3}</span>
                      )}
                    </div>
                  )}
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500">点击开始学习</span>
                    <BookOpen className="w-5 h-5 text-amber-600 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              </Link>
            ))}
          </div>

          {filteredPoems.length === 0 && searchTerm && (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">🔍</div>
              <h3 className="text-xl font-semibold text-gray-800 mb-2">未找到相关诗词</h3>
              <p className="text-gray-600">请尝试其他搜索关键词</p>
            </div>
          )}
        </div>
      </section>

      {/* 简洁页脚 */}
      <footer className="bg-gray-900 text-white py-8 mt-12">
        <div className="max-w-6xl mx-auto px-4 text-center">
          <div className="flex justify-center items-center space-x-6 mb-4">
            <div className="flex items-center space-x-2">
              <Brain className="w-4 h-4" />
              <span className="text-sm">AI智能学习</span>
            </div>
            <div className="flex items-center space-x-2">
              <TrendingUp className="w-4 h-4" />
              <span className="text-sm">进度跟踪</span>
            </div>
            <div className="flex items-center space-x-2">
              <Award className="w-4 h-4" />
              <span className="text-sm">成就系统</span>
            </div>
          </div>
          <p className="text-gray-400 text-sm">
            © 2025 古诗文学习平台 · 让古典文学在AI时代焕发新生机
          </p>
        </div>
      </footer>
    </div>
  )
}

export default HomePage

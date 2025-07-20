import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { 
  ArrowLeft, 
  BookOpen, 
  Filter,
  Grid,
  List,
  Search,
  Sparkles
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

type FilterType = 'all' | 'difficulty' | 'dynasty' | 'tags'
type ViewMode = 'grid' | 'list'

const CategoriesPage: React.FC = () => {
  const navigate = useNavigate()
  const [poems, setPoems] = useState<Poem[]>([])
  const [loading, setLoading] = useState(true)
  const [filterType, setFilterType] = useState<FilterType>('all')
  const [selectedFilter, setSelectedFilter] = useState<string>('all')
  const [viewMode, setViewMode] = useState<ViewMode>('grid')
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    fetchPoems()
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

  // 获取所有可用的筛选选项
  const getFilterOptions = () => {
    switch (filterType) {
      case 'difficulty':
        return [
          { value: 'all', label: '全部难度', count: poems.length },
          { value: 'easy', label: '简单', count: poems.filter(p => p.difficulty === 'easy').length },
          { value: 'medium', label: '中等', count: poems.filter(p => p.difficulty === 'medium').length },
          { value: 'hard', label: '困难', count: poems.filter(p => p.difficulty === 'hard').length }
        ]
      case 'dynasty':
        const dynasties = [...new Set(poems.map(p => p.dynasty))]
        return [
          { value: 'all', label: '全部朝代', count: poems.length },
          ...dynasties.map(d => ({
            value: d,
            label: `${d}朝`,
            count: poems.filter(p => p.dynasty === d).length
          }))
        ]
      case 'tags':
        const allTags = poems.flatMap(p => p.tags || [])
        const uniqueTags = [...new Set(allTags)]
        return [
          { value: 'all', label: '全部标签', count: poems.length },
          ...uniqueTags.map(t => ({
            value: t,
            label: t,
            count: poems.filter(p => p.tags?.includes(t)).length
          }))
        ]
      default:
        return [{ value: 'all', label: '全部诗词', count: poems.length }]
    }
  }

  // 筛选诗词
  const getFilteredPoems = () => {
    let filtered = poems

    // 应用分类筛选
    if (filterType !== 'all' && selectedFilter !== 'all') {
      switch (filterType) {
        case 'difficulty':
          filtered = filtered.filter(p => p.difficulty === selectedFilter)
          break
        case 'dynasty':
          filtered = filtered.filter(p => p.dynasty === selectedFilter)
          break
        case 'tags':
          filtered = filtered.filter(p => p.tags?.includes(selectedFilter))
          break
      }
    }

    // 应用搜索筛选
    if (searchTerm) {
      filtered = filtered.filter(poem =>
        poem.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        poem.author.toLowerCase().includes(searchTerm.toLowerCase()) ||
        poem.dynasty.toLowerCase().includes(searchTerm.toLowerCase()) ||
        poem.tags?.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
      )
    }

    return filtered
  }

  const filteredPoems = getFilteredPoems()
  const filterOptions = getFilterOptions()

  const handleFilterTypeChange = (type: FilterType) => {
    setFilterType(type)
    setSelectedFilter('all')
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-amber-50 to-orange-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600 mx-auto mb-4"></div>
          <p className="text-gray-600">正在加载分类信息...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-50">
      {/* 头部 */}
      <header className="bg-white/90 backdrop-blur-sm border-b border-amber-200">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => navigate('/')}
              className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              <span>返回首页</span>
            </button>
            
            <h1 className="text-2xl font-bold text-gray-900">分类查找</h1>
            
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded-lg ${viewMode === 'grid' ? 'bg-amber-100 text-amber-600' : 'text-gray-600 hover:bg-gray-100'}`}
              >
                <Grid className="w-5 h-5" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded-lg ${viewMode === 'list' ? 'bg-amber-100 text-amber-600' : 'text-gray-600 hover:bg-gray-100'}`}
              >
                <List className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex flex-col lg:flex-row gap-6">
          
          {/* 左侧筛选面板 */}
          <div className="lg:w-1/4">
            <div className="bg-white rounded-xl shadow-lg p-6 sticky top-6">
              
              {/* 搜索框 */}
              <div className="mb-6">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="text"
                    placeholder="搜索..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>

              {/* 筛选类型 */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center">
                  <Filter className="w-5 h-5 mr-2" />
                  筛选方式
                </h3>
                <div className="space-y-2">
                  {[
                    { value: 'all', label: '全部' },
                    { value: 'difficulty', label: '按难度' },
                    { value: 'dynasty', label: '按朝代' },
                    { value: 'tags', label: '按标签' }
                  ].map(option => (
                    <button
                      key={option.value}
                      onClick={() => handleFilterTypeChange(option.value as FilterType)}
                      className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${
                        filterType === option.value
                          ? 'bg-amber-100 text-amber-700 border border-amber-200'
                          : 'hover:bg-gray-50 text-gray-700'
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* 具体筛选选项 */}
              {filterType !== 'all' && (
                <div>
                  <h4 className="font-medium text-gray-700 mb-3">选择{filterType === 'difficulty' ? '难度' : filterType === 'dynasty' ? '朝代' : '标签'}</h4>
                  <div className="space-y-1 max-h-60 overflow-y-auto">
                    {filterOptions.map(option => (
                      <button
                        key={option.value}
                        onClick={() => setSelectedFilter(option.value)}
                        className={`w-full text-left px-3 py-2 rounded-lg transition-colors flex justify-between items-center ${
                          selectedFilter === option.value
                            ? 'bg-blue-100 text-blue-700 border border-blue-200'
                            : 'hover:bg-gray-50 text-gray-600'
                        }`}
                      >
                        <span className="text-sm">{option.label}</span>
                        <span className="text-xs bg-gray-200 text-gray-600 px-2 py-1 rounded-full">
                          {option.count}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* 右侧结果区域 */}
          <div className="lg:w-3/4">
            
            {/* 结果统计 */}
            <div className="bg-white rounded-xl shadow-lg p-4 mb-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-xl font-semibold text-gray-800">
                    找到 {filteredPoems.length} 篇诗词
                  </h2>
                  <p className="text-gray-600 text-sm">
                    {filterType !== 'all' && selectedFilter !== 'all' && (
                      <span>筛选条件：{filterOptions.find(o => o.value === selectedFilter)?.label} </span>
                    )}
                    {searchTerm && <span>搜索："{searchTerm}"</span>}
                  </p>
                </div>
                {(filterType !== 'all' || searchTerm) && (
                  <button
                    onClick={() => {
                      setFilterType('all')
                      setSelectedFilter('all')
                      setSearchTerm('')
                    }}
                    className="text-amber-600 hover:text-amber-700 text-sm font-medium mt-2 sm:mt-0"
                  >
                    清除所有筛选
                  </button>
                )}
              </div>
            </div>

            {/* 诗词列表 */}
            {viewMode === 'grid' ? (
              <div className="grid md:grid-cols-2 gap-6">
                {filteredPoems.map((poem) => (
                  <div
                    key={poem.id}
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
                          {poem.tags.slice(0, 4).map((tag, index) => (
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
            ) : (
              <div className="space-y-4">
                {filteredPoems.map((poem) => (
                  <div
                    key={poem.id}
                    className="group bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 p-6 border hover:border-amber-200"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-4 mb-2">
                          <h3 className="text-xl font-semibold text-gray-900 group-hover:text-amber-600 transition-colors">
                            {poem.title}
                          </h3>
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                            poem.difficulty === 'easy' ? 'bg-green-100 text-green-700' :
                            poem.difficulty === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                            'bg-red-100 text-red-700'
                          }`}>
                            {poem.difficulty === 'easy' ? '简单' : 
                             poem.difficulty === 'medium' ? '中等' : '困难'}
                          </span>
                        </div>
                        <p className="text-gray-600 text-sm mb-2">
                          {poem.author} · {poem.dynasty}朝
                        </p>
                        {poem.description && (
                          <p className="text-gray-700 text-sm mb-2 line-clamp-1">
                            {poem.description}
                          </p>
                        )}
                        {poem.tags && poem.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {poem.tags.slice(0, 5).map((tag, index) => (
                              <span 
                                key={index}
                                className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs"
                              >
                                {tag}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                      
                      {/* 学习模式选择 - 列表视图 */}
                      <div className="ml-4 flex space-x-2">
                        <Link
                          to={`/immersive/${poem.id}`}
                          className="flex items-center space-x-1 bg-gradient-to-r from-purple-500 to-blue-500 text-white py-2 px-3 rounded-lg hover:from-purple-600 hover:to-blue-600 transition-all duration-300 text-sm"
                        >
                          <Sparkles className="w-4 h-4" />
                          <span>沉浸式</span>
                        </Link>
                        
                        <Link
                          to={`/learning/${poem.id}`}
                          className="flex items-center space-x-1 bg-gray-100 text-gray-700 py-2 px-3 rounded-lg hover:bg-gray-200 transition-colors text-sm"
                        >
                          <BookOpen className="w-4 h-4" />
                          <span>传统</span>
                        </Link>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {filteredPoems.length === 0 && (
              <div className="text-center py-12 bg-white rounded-xl shadow-lg">
                <div className="text-6xl mb-4">📚</div>
                <h3 className="text-xl font-semibold text-gray-800 mb-2">未找到匹配的诗词</h3>
                <p className="text-gray-600 mb-4">请尝试调整筛选条件或搜索关键词</p>
                <button
                  onClick={() => {
                    setFilterType('all')
                    setSelectedFilter('all')
                    setSearchTerm('')
                  }}
                  className="bg-amber-600 text-white px-6 py-2 rounded-lg hover:bg-amber-700 transition-colors"
                >
                  重置筛选
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default CategoriesPage

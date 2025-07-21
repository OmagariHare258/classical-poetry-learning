import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'

interface Poem {
  id: number
  title: string
  author: string
  dynasty: string
  category: string
  difficulty: string
}

function SimpleCategoriesPage() {
  const [poems, setPoems] = useState<Poem[]>([])
  const [categories, setCategories] = useState<string[]>([])
  const [selectedCategory, setSelectedCategory] = useState<string>('全部')

  useEffect(() => {
    fetch('/api/poems')
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setPoems(data.data)
          // 提取分类
          const cats = ['全部', ...new Set(data.data.flatMap((p: Poem) => p.category.split(',')))]
          setCategories(cats as string[])
        }
      })
      .catch(err => console.error('获取诗词失败:', err))
  }, [])

  const filteredPoems = selectedCategory === '全部' 
    ? poems 
    : poems.filter(p => p.category.includes(selectedCategory))

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-red-50 p-6">
      <div className="max-w-6xl mx-auto">
        {/* 头部导航 */}
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-amber-900">诗词分类</h1>
          <Link 
            to="/" 
            className="px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors"
          >
            返回首页
          </Link>
        </div>

        {/* 分类选择 */}
        <div className="mb-8">
          <div className="flex flex-wrap gap-2">
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-4 py-2 rounded-full transition-colors ${
                  selectedCategory === cat
                    ? 'bg-amber-600 text-white'
                    : 'bg-white text-amber-800 hover:bg-amber-100'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* 诗词列表 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPoems.map(poem => (
            <div key={poem.id} className="bg-white rounded-lg p-6 shadow-lg hover:shadow-xl transition-shadow">
              <h3 className="text-xl font-bold text-amber-900 mb-2">{poem.title}</h3>
              <p className="text-amber-700 mb-2">{poem.dynasty} · {poem.author}</p>
              <div className="flex justify-between items-center mb-4">
                <span className={`px-2 py-1 rounded text-sm ${
                  poem.difficulty === 'easy' ? 'bg-green-100 text-green-800' :
                  poem.difficulty === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-red-100 text-red-800'
                }`}>
                  {poem.difficulty === 'easy' ? '简单' : 
                   poem.difficulty === 'medium' ? '中等' : '困难'}
                </span>
                <span className="text-sm text-amber-600">{poem.category}</span>
              </div>
              <Link 
                to={`/learn/${poem.id}`}
                className="w-full block text-center px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors"
              >
                开始学习
              </Link>
            </div>
          ))}
        </div>

        {filteredPoems.length === 0 && (
          <div className="text-center py-12">
            <p className="text-amber-700 text-lg">该分类下暂无诗词</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default SimpleCategoriesPage

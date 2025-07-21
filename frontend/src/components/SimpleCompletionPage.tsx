import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'

interface Poem {
  id: number
  title: string
  author: string
  dynasty: string
  content: string
  translation: string
  difficulty: string
  category: string
}

function SimpleCompletionPage() {
  const { poemId } = useParams<{ poemId: string }>()
  const [poem, setPoem] = useState<Poem | null>(null)
  const [score] = useState(Math.floor(Math.random() * 20) + 80) // 模拟得分

  useEffect(() => {
    if (poemId) {
      fetch(`/api/poems/${poemId}`)
        .then(res => res.json())
        .then(data => {
          if (data.success) {
            setPoem(data.data)
          }
        })
        .catch(err => console.error('获取诗词失败:', err))
    }
  }, [poemId])

  if (!poem) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 flex items-center justify-center">
        <div className="text-emerald-800 text-lg">加载中...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 p-6">
      <div className="max-w-4xl mx-auto">
        {/* 庆祝动效区域 */}
        <div className="text-center mb-12">
          <div className="text-6xl mb-4">🎉</div>
          <h1 className="text-4xl font-bold text-emerald-900 mb-2">学习完成！</h1>
          <p className="text-xl text-emerald-700">恭喜你完成了《{poem.title}》的学习</p>
        </div>

        {/* 成绩卡片 */}
        <div className="bg-white rounded-xl p-8 shadow-lg mb-8">
          <div className="text-center mb-6">
            <div className="text-5xl font-bold text-emerald-600 mb-2">{score}</div>
            <p className="text-lg text-emerald-800">学习得分</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <div className="text-center p-4 bg-emerald-50 rounded-lg">
              <div className="text-2xl font-bold text-emerald-700">100%</div>
              <div className="text-emerald-600">完成进度</div>
            </div>
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-700">5</div>
              <div className="text-blue-600">学习时长(分钟)</div>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <div className="text-2xl font-bold text-purple-700">
                {poem.difficulty === 'easy' ? '⭐' : 
                 poem.difficulty === 'medium' ? '⭐⭐' : '⭐⭐⭐'}
              </div>
              <div className="text-purple-600">难度等级</div>
            </div>
          </div>

          {/* 学习回顾 */}
          <div className="border-t pt-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4">学习回顾</h3>
            <div className="bg-gray-50 rounded-lg p-6">
              <div className="text-center mb-4">
                <h4 className="text-2xl font-bold text-gray-900 mb-2">{poem.title}</h4>
                <p className="text-gray-700">{poem.dynasty} · {poem.author}</p>
              </div>
              <div className="text-center text-lg leading-relaxed text-gray-800 font-serif">
                {poem.content}
              </div>
            </div>
          </div>
        </div>

        {/* 成就徽章 */}
        <div className="bg-white rounded-xl p-8 shadow-lg mb-8">
          <h3 className="text-xl font-bold text-gray-900 mb-6 text-center">获得成就</h3>
          <div className="flex justify-center space-x-6">
            <div className="text-center">
              <div className="w-16 h-16 bg-yellow-400 rounded-full flex items-center justify-center text-2xl mb-2">
                📚
              </div>
              <p className="text-sm text-gray-600">诗词学者</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-green-400 rounded-full flex items-center justify-center text-2xl mb-2">
                🎯
              </div>
              <p className="text-sm text-gray-600">专注学习</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-400 rounded-full flex items-center justify-center text-2xl mb-2">
                ⭐
              </div>
              <p className="text-sm text-gray-600">高分通过</p>
            </div>
          </div>
        </div>

        {/* 推荐和导航 */}
        <div className="bg-white rounded-xl p-8 shadow-lg">
          <h3 className="text-xl font-bold text-gray-900 mb-6 text-center">接下来做什么？</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Link 
              to="/categories"
              className="p-4 bg-blue-50 rounded-lg text-center hover:bg-blue-100 transition-colors"
            >
              <div className="text-2xl mb-2">📖</div>
              <div className="font-semibold text-blue-900">继续学习</div>
              <div className="text-sm text-blue-700">探索更多诗词</div>
            </Link>
            <Link 
              to={`/immersive/${poem.id}`}
              className="p-4 bg-purple-50 rounded-lg text-center hover:bg-purple-100 transition-colors"
            >
              <div className="text-2xl mb-2">🎨</div>
              <div className="font-semibold text-purple-900">沉浸体验</div>
              <div className="text-sm text-purple-700">重新体验这首诗</div>
            </Link>
            <Link 
              to="/"
              className="p-4 bg-emerald-50 rounded-lg text-center hover:bg-emerald-100 transition-colors"
            >
              <div className="text-2xl mb-2">🏠</div>
              <div className="font-semibold text-emerald-900">返回首页</div>
              <div className="text-sm text-emerald-700">查看学习统计</div>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

export default SimpleCompletionPage

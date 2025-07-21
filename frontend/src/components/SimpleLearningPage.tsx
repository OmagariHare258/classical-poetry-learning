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

function SimpleLearningPage() {
  const { poemId } = useParams<{ poemId: string }>()
  const [poem, setPoem] = useState<Poem | null>(null)
  const [showTranslation, setShowTranslation] = useState(false)
  const [reciteMode, setReciteMode] = useState(false)
  const [userInput, setUserInput] = useState('')
  const [showHints, setShowHints] = useState(false)
  const [reciteResult, setReciteResult] = useState<{
    correct: number
    total: number
    errors: string[]
  } | null>(null)

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

  // 默写检查函数
  const checkRecitation = () => {
    if (!poem || !userInput.trim()) return

    const originalText = poem.content.replace(/[，。！？；：、]/g, '').replace(/\s+/g, '')
    const userText = userInput.replace(/[，。！？；：、\s]/g, '')
    
    const errors: string[] = []
    let correct = 0
    const total = originalText.length

    // 逐字对比
    for (let i = 0; i < Math.max(originalText.length, userText.length); i++) {
      if (i >= originalText.length) {
        errors.push(`多写了"${userText[i]}"`)
      } else if (i >= userText.length) {
        errors.push(`漏写了"${originalText[i]}"`)
      } else if (originalText[i] === userText[i]) {
        correct++
      } else {
        errors.push(`第${i+1}个字：写成了"${userText[i]}"，应该是"${originalText[i]}"`)
      }
    }

    setReciteResult({ correct, total, errors })
  }

  // 重置默写
  const resetRecitation = () => {
    setUserInput('')
    setReciteResult(null)
    setShowHints(false)
  }

  // 显示提示
  const toggleHints = () => {
    setShowHints(!showHints)
  }

  if (!poem) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-red-50 flex items-center justify-center">
        <div className="text-amber-800 text-lg">加载中...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-red-50 p-6">
      <div className="max-w-4xl mx-auto">
        {/* 头部导航 */}
        <div className="flex items-center justify-between mb-8">
          <Link 
            to="/categories" 
            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
          >
            返回分类
          </Link>
          <Link 
            to="/" 
            className="px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors"
          >
            返回首页
          </Link>
        </div>

        {/* 诗词内容 */}
        <div className="bg-white rounded-xl p-8 shadow-lg mb-8">
          <div className="text-center mb-6">
            <h1 className="text-3xl font-bold text-amber-900 mb-2">{poem.title}</h1>
            <p className="text-lg text-amber-700">{poem.dynasty} · {poem.author}</p>
          </div>

          <div className="text-center mb-8">
            <div className="text-2xl leading-relaxed text-gray-800 font-serif whitespace-pre-line">
              {poem.content}
            </div>
          </div>

          <div className="text-center mb-6">
            <button
              onClick={() => setShowTranslation(!showTranslation)}
              className="px-6 py-3 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors"
            >
              {showTranslation ? '隐藏译文' : '显示译文'}
            </button>
          </div>

          {showTranslation && (
            <div className="bg-amber-50 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-amber-900 mb-3">译文：</h3>
              <p className="text-amber-800 leading-relaxed">{poem.translation}</p>
            </div>
          )}
        </div>

        {/* 学习功能 */}
        <div className="space-y-6">
          {/* 背诵练习模块 */}
          <div className="bg-white rounded-lg p-6 shadow-lg">
            <h3 className="text-xl font-bold text-amber-900 mb-4">默写练习</h3>
            
            {!reciteMode ? (
              <div>
                <p className="text-amber-700 mb-4">测试你对这首诗的记忆程度</p>
                <button 
                  onClick={() => setReciteMode(true)}
                  className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  开始默写
                </button>
              </div>
            ) : (
              <div>
                <div className="mb-4">
                  <h4 className="text-lg font-semibold text-amber-900 mb-2">请默写《{poem?.title}》</h4>
                  {showHints && (
                    <div className="bg-yellow-50 p-3 rounded mb-3 text-sm text-yellow-800">
                      提示：{poem?.dynasty} · {poem?.author} · 主题：{poem?.category}
                    </div>
                  )}
                  <textarea
                    value={userInput}
                    onChange={(e) => setUserInput(e.target.value)}
                    placeholder="请在这里默写诗词内容..."
                    className="w-full h-32 p-3 border border-amber-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 resize-none"
                    style={{ fontFamily: "'Noto Serif SC', serif" }}
                  />
                </div>
                
                <div className="flex space-x-3 mb-4">
                  <button
                    onClick={checkRecitation}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                    disabled={!userInput.trim()}
                  >
                    检查答案
                  </button>
                  <button
                    onClick={toggleHints}
                    className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors"
                  >
                    {showHints ? '隐藏提示' : '显示提示'}
                  </button>
                  <button
                    onClick={resetRecitation}
                    className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                  >
                    重新开始
                  </button>
                </div>

                {reciteResult && (
                  <div className={`p-4 rounded-lg ${
                    reciteResult.correct === reciteResult.total 
                      ? 'bg-green-50 border border-green-200' 
                      : 'bg-orange-50 border border-orange-200'
                  }`}>
                    <h5 className={`font-semibold mb-2 ${
                      reciteResult.correct === reciteResult.total ? 'text-green-800' : 'text-orange-800'
                    }`}>
                      默写结果
                    </h5>
                    <p className="text-sm mb-2">
                      正确率：{reciteResult.correct}/{reciteResult.total} 
                      ({Math.round((reciteResult.correct / reciteResult.total) * 100)}%)
                    </p>
                    
                    {reciteResult.correct === reciteResult.total ? (
                      <p className="text-green-700 font-medium">🎉 完全正确！你已经熟练掌握了这首诗！</p>
                    ) : (
                      <div>
                        <p className="text-orange-700 mb-2">需要改进的地方：</p>
                        <ul className="text-sm text-orange-600 list-disc list-inside space-y-1">
                          {reciteResult.errors.slice(0, 5).map((error, index) => (
                            <li key={index}>{error}</li>
                          ))}
                          {reciteResult.errors.length > 5 && (
                            <li>...还有{reciteResult.errors.length - 5}个错误</li>
                          )}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* 学习选项 */}
          <div className="bg-white rounded-lg p-6 shadow-lg">
            <h3 className="text-xl font-bold text-amber-900 mb-4">更多学习方式</h3>
            <div className="space-y-3">
              <Link 
                to={`/immersive/${poemId}`}
                className="block w-full px-4 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-center"
              >
                🎨 沉浸式学习
              </Link>
              <button
                onClick={() => setShowTranslation(!showTranslation)}
                className="w-full px-4 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
              >
                📖 {showTranslation ? '隐藏译文' : '显示译文'}
              </button>
            </div>
          </div>
        </div>

        {/* 学习信息 */}
        <div className="mt-8 bg-white rounded-lg p-6 shadow-lg">
          <div className="flex justify-between items-center">
            <div>
              <span className="text-sm text-amber-600">难度：</span>
              <span className={`ml-2 px-2 py-1 rounded text-sm ${
                poem.difficulty === 'easy' ? 'bg-green-100 text-green-800' :
                poem.difficulty === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                'bg-red-100 text-red-800'
              }`}>
                {poem.difficulty === 'easy' ? '简单' : 
                 poem.difficulty === 'medium' ? '中等' : '困难'}
              </span>
            </div>
            <div>
              <span className="text-sm text-amber-600">分类：{poem.category}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default SimpleLearningPage

import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'

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

interface LearningStep {
  lineIndex: number
  line: string
  blanks: Array<{
    position: number
    answer: string
    hint: string
  }>
  contextLines: string[]
  guidanceText: string
  candidates: string[]
}

interface AnswerFeedback {
  correct: boolean
  message: string
  explanation: string
}

function SimpleImmersiveLearningPage() {
  const { poemId } = useParams<{ poemId: string }>()
  const navigate = useNavigate()
  
  // 基础状态
  const [poem, setPoem] = useState<Poem | null>(null)
  const [loading, setLoading] = useState(true)
  const [currentStep, setCurrentStep] = useState(0)
  const [learningSteps, setLearningSteps] = useState<LearningStep[]>([])
  
  // 互动状态
  const [userAnswers, setUserAnswers] = useState<string[]>([])
  const [showFeedback, setShowFeedback] = useState(false)
  const [feedback, setFeedback] = useState<AnswerFeedback | null>(null)
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set())
  
  // UI状态
  const [showHint, setShowHint] = useState(false)
  const [backgroundImage, setBackgroundImage] = useState('')
  const [isGeneratingImage, setIsGeneratingImage] = useState(false)

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
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center">
        <div className="text-white text-lg">加载中...</div>
      </div>
    )
  }

  const steps = [
    { title: '诗词欣赏', description: '感受诗词的韵律之美' },
    { title: '逐句学习', description: '深入理解每一句含义' },
    { title: '背景介绍', description: '了解创作背景和意境' },
    { title: '记忆巩固', description: '通过练习加深印象' }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 text-white p-6">
      <div className="max-w-4xl mx-auto">
        {/* 头部导航 */}
        <div className="flex items-center justify-between mb-8">
          <Link 
            to={`/learn/${poemId}`}
            className="px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors"
          >
            返回普通学习
          </Link>
          <Link 
            to="/" 
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          >
            返回首页
          </Link>
        </div>

        {/* 进度指示器 */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-4">
            {steps.map((step, index) => (
              <div 
                key={index}
                className={`flex items-center ${
                  index === currentStep ? 'text-yellow-400' : 
                  index < currentStep ? 'text-green-400' : 'text-gray-400'
                }`}
              >
                <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center mr-2 ${
                  index === currentStep ? 'border-yellow-400 bg-yellow-400 text-purple-900' :
                  index < currentStep ? 'border-green-400 bg-green-400 text-purple-900' :
                  'border-gray-400'
                }`}>
                  {index < currentStep ? '✓' : index + 1}
                </div>
                <div className="hidden md:block">
                  <div className="font-semibold">{step.title}</div>
                  <div className="text-sm opacity-75">{step.description}</div>
                </div>
              </div>
            ))}
          </div>
          <div className="w-full bg-gray-700 rounded-full h-2">
            <div 
              className="bg-gradient-to-r from-purple-500 to-pink-500 h-2 rounded-full transition-all duration-500"
              style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
            ></div>
          </div>
        </div>

        {/* 主要内容区域 */}
        <div className="bg-black bg-opacity-30 rounded-xl p-8 backdrop-blur-sm border border-white border-opacity-20">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-yellow-400 to-pink-400 bg-clip-text text-transparent">
              {poem.title}
            </h1>
            <p className="text-xl text-gray-300">{poem.dynasty} · {poem.author}</p>
          </div>

          <div className="text-center mb-8">
            <div className="text-3xl leading-loose font-serif text-white whitespace-pre-line tracking-wide">
              {poem.content}
            </div>
          </div>

          {/* 当前步骤内容 */}
          <div className="mb-8">
            {currentStep === 0 && (
              <div className="text-center">
                <h3 className="text-2xl font-bold mb-4 text-yellow-400">诗词欣赏</h3>
                <p className="text-lg text-gray-300 leading-relaxed mb-6">
                  让我们静心感受这首诗的韵律之美。请慢慢朗读，体会诗人的情感。
                </p>
                <div className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg p-6">
                  <p className="text-white">🎵 建议配乐：古筝或古琴音乐</p>
                </div>
              </div>
            )}

            {currentStep === 1 && (
              <div className="text-center">
                <h3 className="text-2xl font-bold mb-4 text-yellow-400">逐句学习</h3>
                <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg p-6">
                  <h4 className="text-xl font-semibold mb-3 text-white">译文解析</h4>
                  <p className="text-gray-200 leading-relaxed">{poem.translation}</p>
                </div>
              </div>
            )}

            {currentStep === 2 && (
              <div className="text-center">
                <h3 className="text-2xl font-bold mb-4 text-yellow-400">背景介绍</h3>
                <div className="bg-gradient-to-r from-green-600 to-blue-600 rounded-lg p-6">
                  <p className="text-gray-200 leading-relaxed">
                    {poem.dynasty}代诗人{poem.author}的经典之作，体现了{poem.category.split(',')[0]}的美好意境。
                    这首诗以其独特的艺术表现力，成为中国古典诗歌的珍贵遗产。
                  </p>
                </div>
              </div>
            )}

            {currentStep === 3 && (
              <div className="text-center">
                <h3 className="text-2xl font-bold mb-4 text-yellow-400">记忆巩固</h3>
                <div className="bg-gradient-to-r from-yellow-600 to-red-600 rounded-lg p-6">
                  <p className="text-white mb-4">恭喜完成沉浸式学习！现在让我们巩固记忆。</p>
                  <Link 
                    to={`/completion/${poemId}`}
                    className="inline-block px-6 py-3 bg-white text-purple-900 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
                  >
                    完成学习
                  </Link>
                </div>
              </div>
            )}
          </div>

          {/* 控制按钮 */}
          <div className="flex justify-between">
            <button
              onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
              disabled={currentStep === 0}
              className="px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              上一步
            </button>
            <button
              onClick={() => setCurrentStep(Math.min(steps.length - 1, currentStep + 1))}
              disabled={currentStep === steps.length - 1}
              className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              下一步
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default SimpleImmersiveLearningPage

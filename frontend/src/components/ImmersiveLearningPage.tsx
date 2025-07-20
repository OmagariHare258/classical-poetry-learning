import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { 
  ArrowLeft, 
  ArrowRight, 
  Check, 
  Lightbulb,
  Brain,
  Sparkles
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

interface LearningStep {
  lineIndex: number
  line: string
  blanks: Array<{
    position: number
    answer: string
    hint?: string
  }>
  contextLines: string[]
  sceneryImage?: string
  guidanceText: string
  candidates: string[]
  distractors: string[]
}

interface AnswerFeedback {
  correct: boolean
  message: string
  explanation?: string
}

const ImmersiveLearningPage: React.FC = () => {
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
      fetchPoemData()
    }
  }, [poemId])

  useEffect(() => {
    if (poem && learningSteps.length > 0) {
      generateBackgroundImage()
    }
  }, [currentStep, learningSteps])

  const fetchPoemData = async () => {
    try {
      const response = await axios.get(`/api/poems/${poemId}`)
      if (response.data.success) {
        const poemData = response.data.data
        setPoem(poemData)
        generateLearningSteps(poemData)
      }
    } catch (error) {
      console.error('获取诗词数据失败:', error)
    } finally {
      setLoading(false)
    }
  }

  const generateLearningSteps = (poemData: Poem) => {
    const steps: LearningStep[] = []
    
    poemData.content.forEach((line, lineIndex) => {
      // 为每行创建填空练习
      const words = line.split('')
      const numBlanks = Math.min(2, Math.max(1, Math.floor(words.length / 3)))
      
      // 选择要挖空的位置（避免标点符号）
      const validPositions = words
        .map((char, index) => ({ char, index }))
        .filter(({ char }) => /[\u4e00-\u9fa5]/.test(char))
        .map(({ index }) => index)
      
      const blankPositions = validPositions
        .sort(() => Math.random() - 0.5)
        .slice(0, numBlanks)
        .sort((a, b) => a - b)

      const blanks = blankPositions.map(pos => ({
        position: pos,
        answer: words[pos],
        hint: generateHint(words[pos], line, poemData)
      }))

      // 生成候选字符（包括正确答案和干扰项）
      const candidates = new Set<string>()
      blanks.forEach(blank => candidates.add(blank.answer))
      
      // 添加干扰项
      const distractors = generateDistractors(blanks.map(b => b.answer), poemData)
      distractors.forEach(d => candidates.add(d))
      
      // 随机排序候选项
      const shuffledCandidates = Array.from(candidates).sort(() => Math.random() - 0.5)

      steps.push({
        lineIndex,
        line,
        blanks,
        contextLines: poemData.content.slice(0, lineIndex),
        guidanceText: generateGuidanceText(line, lineIndex, poemData),
        candidates: shuffledCandidates,
        distractors
      })
    })
    
    setLearningSteps(steps)
    setUserAnswers(new Array(steps.reduce((sum, step) => sum + step.blanks.length, 0)).fill(''))
  }

  const generateHint = (_char: string, _line: string, poem: Poem): string => {
    const hints = [
      `这个字在诗中表达了${poem.title}的主要情感`,
      `考虑${poem.dynasty}朝诗人${poem.author}的写作风格`,
      `这个字与整句的韵律和意境相关`,
      `想想这个字如何与前文呼应`,
      `这个字体现了${poem.tags?.[0] || '诗词'}的特点`
    ]
    return hints[Math.floor(Math.random() * hints.length)]
  }

  const generateGuidanceText = (_line: string, lineIndex: number, poem: Poem): string => {
    const guidanceTemplates = [
      `${poem.author}在这一句中想要表达什么样的画面或情感？`,
      `根据前面的诗句，这里应该用什么字来承接上下文的意境？`,
      `想象一下${poem.dynasty}朝的春天景色，作者会用什么字来描绘？`,
      `这句诗的韵律和节奏提示我们应该选择什么字？`,
      `从整首诗的主题来看，这个位置最适合什么字？`
    ]
    
    if (lineIndex === 0) {
      return `这是《${poem.title}》的开篇句，${poem.author}会如何开始这首诗？`
    } else if (lineIndex === poem.content.length - 1) {
      return `作为这首诗的结尾，${poem.author}想要表达什么样的感情或哲理？`
    }
    
    return guidanceTemplates[lineIndex % guidanceTemplates.length]
  }

  const generateDistractors = (correctAnswers: string[], _poem: Poem): string[] => {
    // 形近字、音近字、常见字等作为干扰项
    const commonChars = ['不', '是', '有', '在', '了', '我', '你', '他', '的', '一', '二', '三', '四', '五']
    const poetryChars = ['花', '月', '风', '雨', '山', '水', '云', '雪', '春', '秋', '夏', '冬', '红', '绿', '白', '黑']
    
    const distractors = new Set<string>()
    
    // 添加一些常见的干扰字符
    commonChars.forEach(char => {
      if (!correctAnswers.includes(char) && distractors.size < 6) {
        distractors.add(char)
      }
    })
    
    poetryChars.forEach(char => {
      if (!correctAnswers.includes(char) && distractors.size < 8) {
        distractors.add(char)
      }
    })
    
    return Array.from(distractors)
  }

  const generateBackgroundImage = async () => {
    if (!learningSteps[currentStep]) return
    
    setIsGeneratingImage(true)
    try {
      // 获取保存的API配置
      const savedConfig = localStorage.getItem('apiConfig')
      if (savedConfig) {
        try {
          const apiConfig = JSON.parse(savedConfig)
          console.log('使用API配置:', apiConfig.n8nUrl || 'default')
        } catch (error) {
          console.error('解析API配置失败:', error)
        }
      }
      
      // 调用n8n生成图片的工作流
      const step = learningSteps[currentStep]
      const prompt = `${poem?.title} ${poem?.author} ${step.line} 古风意境图 唯美 山水 ${poem?.tags?.join(' ')}`
      
      const response = await axios.post('/api/n8n/generate-image', {
        prompt,
        style: 'chinese_classical',
        poem_id: poemId,
        line_index: currentStep
      })
      
      if (response.data.success && response.data.data.image_url) {
        setBackgroundImage(response.data.data.image_url)
      } else {
        // 使用默认图片
        setBackgroundImage(`https://picsum.photos/800/600?random=${currentStep}`)
      }
    } catch (error) {
      console.error('生成背景图片失败:', error)
      // 使用默认图片
      setBackgroundImage(`https://picsum.photos/800/600?random=${currentStep}`)
    } finally {
      setIsGeneratingImage(false)
    }
  }

  const handleCharacterSelect = (char: string, blankIndex: number) => {
    if (showFeedback) return
    
    const step = learningSteps[currentStep]
    const newAnswers = [...userAnswers]
    const globalIndex = getGlobalAnswerIndex(currentStep, blankIndex)
    newAnswers[globalIndex] = char
    setUserAnswers(newAnswers)
    
    // 检查是否所有空格都已填写
    const currentStepAnswers = step.blanks.map((_, idx) => 
      newAnswers[getGlobalAnswerIndex(currentStep, idx)]
    )
    
    if (currentStepAnswers.every(answer => answer !== '')) {
      checkAnswers()
    }
  }

  const getGlobalAnswerIndex = (stepIndex: number, blankIndex: number): number => {
    let globalIndex = 0
    for (let i = 0; i < stepIndex; i++) {
      globalIndex += learningSteps[i].blanks.length
    }
    return globalIndex + blankIndex
  }

  const checkAnswers = async () => {
    const step = learningSteps[currentStep]
    const stepAnswers = step.blanks.map((_, idx) => 
      userAnswers[getGlobalAnswerIndex(currentStep, idx)]
    )
    
    const allCorrect = step.blanks.every((blank, idx) => 
      stepAnswers[idx] === blank.answer
    )
    
    if (allCorrect) {
      setFeedback({
        correct: true,
        message: '太棒了！你完全理解了这句诗的意境！',
        explanation: `"${step.line}" - ${generateExplanation(step)}`
      })
      setCompletedSteps(prev => new Set([...prev, currentStep]))
    } else {
      setFeedback({
        correct: false,
        message: '再想想看，也许从诗的整体意境来考虑？',
        explanation: generateHintExplanation(step, stepAnswers)
      })
    }
    
    setShowFeedback(true)
    
    // 向n8n发送学习进度
    try {
      await axios.post('/api/n8n/learning-progress', {
        poem_id: poemId,
        step_index: currentStep,
        correct: allCorrect,
        user_answers: stepAnswers,
        correct_answers: step.blanks.map(b => b.answer)
      })
    } catch (error) {
      console.error('发送学习进度失败:', error)
    }
  }

  const generateExplanation = (_step: LearningStep): string => {
    return `这句诗通过精心选择的字词，营造出独特的意境。每个字都承载着诗人的情感和对自然的观察。`
  }

  const generateHintExplanation = (step: LearningStep, userAnswers: string[]): string => {
    const wrongCount = step.blanks.filter((blank, idx) => userAnswers[idx] !== blank.answer).length
    if (wrongCount === 1) {
      return '你很接近了！再仔细考虑一下诗句的整体韵律和意境。'
    }
    return '别着急，古诗词的用字很有讲究，多从意境和音韵的角度思考。'
  }

  const goToNextStep = () => {
    if (currentStep < learningSteps.length - 1) {
      setCurrentStep(currentStep + 1)
      setShowFeedback(false)
      setFeedback(null)
      setShowHint(false)
    } else {
      // 学习完成
      navigate(`/completion/${poemId}`)
    }
  }

  const goToPreviousStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
      setShowFeedback(false)
      setFeedback(null)
      setShowHint(false)
    }
  }

  const renderBlankLine = () => {
    if (!learningSteps[currentStep]) return null
    
    const step = learningSteps[currentStep]
    const chars = step.line.split('')
    
    return (
      <div className="text-4xl font-bold text-white tracking-wider leading-relaxed">
        {chars.map((char, charIndex) => {
          const blankIndex = step.blanks.findIndex(blank => blank.position === charIndex)
          
          if (blankIndex !== -1) {
            const globalIndex = getGlobalAnswerIndex(currentStep, blankIndex)
            const userAnswer = userAnswers[globalIndex]
            
            return (
              <span
                key={charIndex}
                className={`inline-block w-12 h-12 mx-1 border-b-4 text-center ${
                  userAnswer 
                    ? 'border-yellow-400 bg-yellow-400/20' 
                    : 'border-white/60 bg-white/10'
                } rounded-lg backdrop-blur-sm transition-all duration-300`}
              >
                {userAnswer && (
                  <span className="text-yellow-300 font-bold">{userAnswer}</span>
                )}
              </span>
            )
          }
          
          return (
            <span key={charIndex} className="mx-1">
              {char}
            </span>
          )
        })}
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 to-gray-800">
        <div className="text-center text-white">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-400 mx-auto mb-4"></div>
          <p>正在准备沉浸式学习体验...</p>
        </div>
      </div>
    )
  }

  if (!poem || learningSteps.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 to-gray-800">
        <div className="text-center text-white">
          <p>诗词数据加载失败</p>
          <button 
            onClick={() => navigate('/')}
            className="mt-4 bg-yellow-600 text-white px-6 py-2 rounded-lg"
          >
            返回首页
          </button>
        </div>
      </div>
    )
  }

  const currentStepData = learningSteps[currentStep]

  return (
    <div className="min-h-screen bg-gray-900 overflow-hidden">
      {/* 背景图片层 */}
      <div 
        className="absolute inset-0 bg-cover bg-center transition-all duration-1000"
        style={{
          backgroundImage: backgroundImage ? `url(${backgroundImage})` : 'linear-gradient(135deg, #1a1a2e, #16213e)',
        }}
      >
        <div className="absolute inset-0 bg-black/50 backdrop-blur-sm"></div>
      </div>

      {/* 主要内容 */}
      <div className="relative z-10 min-h-screen flex">
        
        {/* 左侧学习区域 */}
        <div className="flex-1 flex flex-col justify-center p-8 lg:p-12">
          
          {/* 诗词信息 */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <button
                onClick={() => navigate('/')}
                className="flex items-center space-x-2 text-white/80 hover:text-white transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
                <span>返回</span>
              </button>
              
              <div className="text-right text-white/80">
                <div className="text-sm">
                  进度: {currentStep + 1} / {learningSteps.length} 
                  <span className="ml-2 text-green-400">
                    ({completedSteps.size} 已完成)
                  </span>
                </div>
                <div className="w-32 h-2 bg-white/20 rounded-full mt-1">
                  <div 
                    className="h-full bg-yellow-400 rounded-full transition-all duration-300"
                    style={{ width: `${((currentStep + 1) / learningSteps.length) * 100}%` }}
                  ></div>
                </div>
              </div>
            </div>
            
            <h1 className="text-3xl font-bold text-white mb-2">{poem.title}</h1>
            <p className="text-xl text-white/80">{poem.author} · {poem.dynasty}朝</p>
          </div>

          {/* 上下文显示 */}
          {currentStepData.contextLines.length > 0 && (
            <div className="mb-8 space-y-2">
              <h3 className="text-lg font-medium text-white/80 mb-3">已学过的诗句：</h3>
              {currentStepData.contextLines.map((line, index) => (
                <div key={index} className="text-xl text-white/60 font-medium">
                  {line}
                </div>
              ))}
            </div>
          )}

          {/* 当前学习句子 */}
          <div className="mb-8">
            <h3 className="text-lg font-medium text-white/80 mb-4">请完成这句诗：</h3>
            {renderBlankLine()}
          </div>

          {/* 引导性提示 */}
          <div className="mb-8">
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
              <div className="flex items-start space-x-3">
                <Lightbulb className="w-6 h-6 text-yellow-400 flex-shrink-0 mt-1" />
                <div>
                  <h4 className="text-white font-medium mb-2">思考提示</h4>
                  <p className="text-white/80 leading-relaxed">{currentStepData.guidanceText}</p>
                </div>
              </div>
              
              {showHint && currentStepData.blanks[0]?.hint && (
                <div className="mt-4 pt-4 border-t border-white/20">
                  <p className="text-yellow-200 text-sm">💡 {currentStepData.blanks[0].hint}</p>
                </div>
              )}
              
              {!showHint && (
                <button
                  onClick={() => setShowHint(true)}
                  className="mt-4 text-yellow-300 text-sm hover:text-yellow-200 transition-colors"
                >
                  需要更多提示？
                </button>
              )}
            </div>
          </div>

          {/* 反馈区域 */}
          {showFeedback && feedback && (
            <div className={`mb-8 p-6 rounded-xl backdrop-blur-sm border ${
              feedback.correct 
                ? 'bg-green-500/20 border-green-400/30' 
                : 'bg-orange-500/20 border-orange-400/30'
            }`}>
              <div className="flex items-start space-x-3">
                {feedback.correct ? (
                  <Check className="w-6 h-6 text-green-400 flex-shrink-0 mt-1" />
                ) : (
                  <Brain className="w-6 h-6 text-orange-400 flex-shrink-0 mt-1" />
                )}
                <div>
                  <h4 className={`font-medium mb-2 ${
                    feedback.correct ? 'text-green-300' : 'text-orange-300'
                  }`}>
                    {feedback.message}
                  </h4>
                  {feedback.explanation && (
                    <p className="text-white/80 text-sm leading-relaxed">
                      {feedback.explanation}
                    </p>
                  )}
                </div>
              </div>
              
              <div className="flex space-x-3 mt-4">
                {currentStep > 0 && (
                  <button
                    onClick={goToPreviousStep}
                    className="flex items-center space-x-2 bg-white/10 text-white px-4 py-2 rounded-lg hover:bg-white/20 transition-colors"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    <span>上一句</span>
                  </button>
                )}
                
                <button
                  onClick={feedback.correct ? goToNextStep : () => setShowFeedback(false)}
                  className={`flex items-center space-x-2 px-6 py-2 rounded-lg transition-colors ${
                    feedback.correct
                      ? 'bg-green-600 hover:bg-green-700 text-white'
                      : 'bg-orange-600 hover:bg-orange-700 text-white'
                  }`}
                >
                  {feedback.correct ? (
                    <>
                      <span>下一句</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  ) : (
                    <>
                      <span>重新尝试</span>
                      <Brain className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* 右侧字词候选区域 */}
        <div className="w-80 bg-black/30 backdrop-blur-sm border-l border-white/20 p-6 flex flex-col">
          
          {/* 候选字词标题 */}
          <div className="mb-6">
            <h3 className="text-xl font-bold text-white mb-2">选择合适的字</h3>
            <p className="text-white/60 text-sm">点击下方的字来填入空缺</p>
          </div>

          {/* 字词网格 */}
          <div className="flex-1">
            <div className="grid grid-cols-3 gap-3">
              {currentStepData.candidates.map((char, index) => (
                <button
                  key={index}
                  onClick={() => {
                    // 找到第一个未填写的空格
                    const firstEmptyBlank = currentStepData.blanks.findIndex((_, blankIdx) => {
                      const globalIdx = getGlobalAnswerIndex(currentStep, blankIdx)
                      return userAnswers[globalIdx] === ''
                    })
                    
                    if (firstEmptyBlank !== -1) {
                      handleCharacterSelect(char, firstEmptyBlank)
                    }
                  }}
                  disabled={showFeedback}
                  className={`w-full h-16 bg-white/10 hover:bg-white/20 border border-white/30 rounded-xl 
                    text-2xl font-bold text-white transition-all duration-200 transform hover:scale-105
                    disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none
                    ${userAnswers.includes(char) ? 'bg-yellow-500/30 border-yellow-400' : ''}
                  `}
                >
                  {char}
                </button>
              ))}
            </div>
          </div>

          {/* 辅助功能 */}
          <div className="mt-6 space-y-3">
            <button
              onClick={() => {
                // 清空当前步骤的答案
                const newAnswers = [...userAnswers]
                currentStepData.blanks.forEach((_, blankIdx) => {
                  const globalIdx = getGlobalAnswerIndex(currentStep, blankIdx)
                  newAnswers[globalIdx] = ''
                })
                setUserAnswers(newAnswers)
                setShowFeedback(false)
              }}
              className="w-full bg-red-500/20 border border-red-400/30 text-red-300 py-3 rounded-lg hover:bg-red-500/30 transition-colors"
            >
              清空重填
            </button>
            
            <div className="text-center text-white/40 text-xs">
              💡 选择体现诗意和韵律的字
            </div>
          </div>

          {/* 图片生成状态 */}
          {isGeneratingImage && (
            <div className="mt-4 flex items-center space-x-2 text-white/60 text-sm">
              <Sparkles className="w-4 h-4 animate-spin" />
              <span>AI正在生成意境图...</span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default ImmersiveLearningPage

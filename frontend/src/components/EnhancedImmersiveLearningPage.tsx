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

function EnhancedImmersiveLearningPage() {
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
      const response = await fetch(`/api/poems/${poemId}`)
      const data = await response.json()
      if (data.success) {
        const poemData = data.data
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
    const lines = poemData.content.split(/[，。！？；：、]/g).filter(line => line.trim())
    
    lines.forEach((line, lineIndex) => {
      if (!line.trim()) return
      
      const chars = line.trim().split('')
      
      // 智能选择挖空位置：优先选择名词、动词、形容词等关键词位置
      const keywordPositions = chars
        .map((char, index) => ({ char, index }))
        .filter(({ char, index }) => {
          // 只选择汉字
          if (!/[\u4e00-\u9fa5]/.test(char)) return false
          
          // 避免选择连词、助词等功能性字符
          const functionalChars = ['之', '者', '也', '矣', '乎', '哉', '兮', '耳', '而', '或', '与', '及', '以', '于', '其', '为', '则']
          if (functionalChars.includes(char)) return false
          
          // 优先选择诗歌中的核心意象字
          const imageWords = ['花', '月', '风', '雨', '山', '水', '云', '雪', '春', '秋', '夏', '冬', '日', '夜', '晓', '暮', '红', '绿', '白', '黑', '青', '明', '暗', '高', '低', '深', '浅', '远', '近', '来', '去', '归', '望', '听', '闻', '看', '思', '想', '梦', '愁', '喜', '悲', '乐']
          if (imageWords.includes(char)) return true
          
          // 避免选择位置词和时间词的某些常见字
          const commonPositionalWords = ['前', '后', '左', '右', '上', '下', '中', '内', '外']
          if (commonPositionalWords.includes(char) && index > 0) return false
          
          return true
        })
        .map(({ index }) => index)
      
      // 根据诗句长度确定挖空数量
      let numBlanks = 1
      if (chars.length >= 6) numBlanks = 2
      if (chars.length >= 10) numBlanks = 3
      numBlanks = Math.min(numBlanks, Math.floor(chars.length / 3))
      
      // 选择最有代表性的位置进行挖空
      const blankPositions = keywordPositions
        .sort(() => Math.random() - 0.5)
        .slice(0, numBlanks)
        .sort((a, b) => a - b)

      // 如果智能选择的位置不够，补充一些其他位置
      if (blankPositions.length < numBlanks) {
        const remainingPositions = chars
          .map((char, index) => ({ char, index }))
          .filter(({ char, index }) => 
            /[\u4e00-\u9fa5]/.test(char) && !blankPositions.includes(index)
          )
          .map(({ index }) => index)
        
        const additionalPositions = remainingPositions
          .sort(() => Math.random() - 0.5)
          .slice(0, numBlanks - blankPositions.length)
        
        blankPositions.push(...additionalPositions)
        blankPositions.sort((a, b) => a - b)
      }

      const blanks = blankPositions.map(pos => ({
        position: pos,
        answer: chars[pos],
        hint: generateAdvancedHint(chars[pos], line, poemData, pos)
      }))

      // 生成候选字符（更智能的干扰项）
      const candidates = new Set<string>()
      blanks.forEach(blank => candidates.add(blank.answer))
      
      const distractors = generateSmartDistractors(blanks.map(b => b.answer), poemData, line)
      distractors.forEach(d => candidates.add(d))
      
      const shuffledCandidates = Array.from(candidates).sort(() => Math.random() - 0.5)

      steps.push({
        lineIndex,
        line: line.trim(),
        blanks,
        contextLines: lines.slice(0, lineIndex).map(l => l.trim()),
        guidanceText: generateAdvancedGuidanceText(line, lineIndex, poemData),
        candidates: shuffledCandidates
      })
    })
    
    setLearningSteps(steps)
    setUserAnswers(new Array(steps.reduce((sum, step) => sum + step.blanks.length, 0)).fill(''))
  }

  // 高级提示生成
  const generateAdvancedHint = (char: string, line: string, poem: Poem, position: number): string => {
    const contextHints = [
      `这个字在"${line}"中起到关键作用，体现了${poem.category.split(',')[0]}的特色`,
      `考虑${poem.dynasty}朝的语言特点，这里需要一个表达情感的字`,
      `这个字与整句的音韵相配，读起来朗朗上口`,
      `根据《${poem.title}》的主题，这里应该用什么字来呼应？`,
      `诗人${poem.author}想要表达的意境需要这样一个字来点睛`
    ]
    return contextHints[position % contextHints.length]
  }

  // 智能干扰项生成
  const generateSmartDistractors = (correctAnswers: string[], poem: Poem, line: string): string[] => {
    const thematicWords: { [key: string]: string[] } = {
      '春天,写景': ['绿', '红', '花', '草', '柳', '桃', '燕', '莺', '暖', '软'],
      '思乡,夜景': ['月', '星', '夜', '梦', '思', '望', '远', '故', '乡', '泪'],
      '写物': ['白', '黑', '清', '浊', '大', '小', '高', '低', '美', '丑'],
      '秋天': ['黄', '金', '风', '叶', '霜', '雁', '菊', '桂', '凉', '寒'],
      '冬天': ['雪', '冰', '寒', '冷', '梅', '竹', '松', '白', '净', '静']
    }
    
    // 根据诗词类别选择相关的干扰词
    const categoryWords = thematicWords[poem.category] || []
    const commonPoetryWords = ['花', '月', '风', '雨', '山', '水', '云', '雪', '春', '秋', '红', '绿', '白', '黑']
    
    const distractors = new Set<string>()
    
    // 添加主题相关的干扰项
    categoryWords.forEach(word => {
      if (!correctAnswers.includes(word) && distractors.size < 8) {
        distractors.add(word)
      }
    })
    
    // 添加通用诗词字符
    commonPoetryWords.forEach(word => {
      if (!correctAnswers.includes(word) && distractors.size < 12) {
        distractors.add(word)
      }
    })
    
    return Array.from(distractors)
  }

  // 高级引导文本生成
  const generateAdvancedGuidanceText = (line: string, lineIndex: number, poem: Poem): string => {
    if (lineIndex === 0) {
      return `这是《${poem.title}》的开篇，${poem.author}想要为读者展现怎样的画面？`
    }
    
    if (lineIndex === 1) {
      return `承接开篇的意境，这一句会如何进一步描绘或深化主题？`
    }
    
    const advancedPrompts = [
      `从前面的诗句可以看出整体的情感基调，这句话会用什么字来呼应？`,
      `考虑${poem.dynasty}朝诗歌的特点和${poem.author}的风格，这里最合适的字是什么？`,
      `这句诗要表达的意境需要选择能够引起共鸣的字词`,
      `根据诗的韵律和节奏，这个位置需要什么样的字来保持美感？`
    ]
    
    return advancedPrompts[lineIndex % advancedPrompts.length]
  }

  const generateBackgroundImage = async () => {
    if (!learningSteps[currentStep]) return
    
    setIsGeneratingImage(true)
    try {
      // 尝试调用AI图片生成API
      const step = learningSteps[currentStep]
      const prompt = `${poem?.title} ${poem?.author} ${step.line} 古风意境图 中国画风格`
      
      const response = await fetch('/api/ai/generate-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt })
      })
      
      if (response.ok) {
        const data = await response.json()
        if (data.success && data.imageUrl) {
          setBackgroundImage(data.imageUrl)
        } else {
          // 使用默认意境图片
          setBackgroundImage(`https://picsum.photos/1200/800?random=${currentStep}&grayscale`)
        }
      } else {
        setBackgroundImage(`https://picsum.photos/1200/800?random=${currentStep}&grayscale`)
      }
    } catch (error) {
      console.error('生成背景图片失败:', error)
      setBackgroundImage(`https://picsum.photos/1200/800?random=${currentStep}&grayscale`)
    } finally {
      setIsGeneratingImage(false)
    }
  }

  const handleCharacterSelect = (char: string, blankIndex: number) => {
    if (showFeedback) return
    
    const newAnswers = [...userAnswers]
    const globalIndex = getGlobalAnswerIndex(currentStep, blankIndex)
    
    newAnswers[globalIndex] = char
    setUserAnswers(newAnswers)
  }

  const getGlobalAnswerIndex = (stepIndex: number, blankIndex: number): number => {
    let globalIndex = 0
    for (let i = 0; i < stepIndex; i++) {
      globalIndex += learningSteps[i].blanks.length
    }
    return globalIndex + blankIndex
  }

  const checkAnswers = () => {
    const step = learningSteps[currentStep]
    const stepAnswers = step.blanks.map((_, idx) => 
      userAnswers[getGlobalAnswerIndex(currentStep, idx)]
    )
    
    const correctAnswers: boolean[] = []
    const wrongAnswers: string[] = []
    let emptyAnswers = 0
    
    step.blanks.forEach((blank, idx) => {
      const userAnswer = stepAnswers[idx]
      const isCorrect = userAnswer === blank.answer
      correctAnswers.push(isCorrect)
      
      if (!userAnswer || userAnswer === '' || userAnswer === undefined) {
        emptyAnswers++
        wrongAnswers.push(`第${idx + 1}个空：未填写，正确答案是"${blank.answer}"`)
      } else if (!isCorrect) {
        wrongAnswers.push(`第${idx + 1}个空：填写了"${userAnswer}"，正确答案是"${blank.answer}"`)
      }
    })
    
    const allCorrect = correctAnswers.every(Boolean) && emptyAnswers === 0
    const correctCount = correctAnswers.filter(Boolean).length
    const totalCount = correctAnswers.length
    
    if (allCorrect) {
      setFeedback({
        correct: true,
        message: '🎉 太棒了！你完全理解了这句诗的意境！',
        explanation: `"${step.line}" - 这句诗通过精心选择的字词，营造出独特的诗意画面。每个字都恰到好处地表达了诗人的情感。`
      })
      setCompletedSteps(prev => new Set([...prev, currentStep]))
    } else {
      let encouragementMessage = ''
      if (emptyAnswers > 0) {
        encouragementMessage = `还有${emptyAnswers}个空格未填写，请继续完成。`
      } else if (correctCount === totalCount - 1) {
        encouragementMessage = '很接近了！只差一个字就完全正确了！'
      } else if (correctCount >= totalCount / 2) {
        encouragementMessage = '不错！你理解了大部分意思，再仔细想想剩下的字。'
      } else {
        encouragementMessage = '别着急，古诗词的用字很有讲究，从意境和韵律角度再想想。'
      }
      
      let detailedExplanation = encouragementMessage
      if (wrongAnswers.length > 0) {
        detailedExplanation += '\n\n具体情况：\n' + wrongAnswers.join('\n')
      }
      detailedExplanation += `\n\n💡 提示：这句"${step.line}"要表达的是${generateContextualHint(step, poem!)}`
      
      setFeedback({
        correct: false,
        message: `答对了 ${correctCount}/${totalCount} 个字${emptyAnswers > 0 ? `（${emptyAnswers}个未填写）` : ''}`,
        explanation: detailedExplanation
      })
    }
    
    setShowFeedback(true)
  }

  // 生成上下文提示
  const generateContextualHint = (step: LearningStep, poem: Poem): string => {
    const hints = [
      `${poem.category.split(',')[0]}的美好画面`,
      `${poem.dynasty}朝诗人的独特情怀`,
      `与"${poem.title}"主题相符的意境`,
      `体现诗人内心感受的词汇`,
      `符合古诗韵律美的用字`
    ]
    return hints[step.lineIndex % hints.length]
  }

  const goToNextStep = () => {
    if (currentStep < learningSteps.length - 1) {
      setCurrentStep(currentStep + 1)
      setShowFeedback(false)
      setFeedback(null)
      setShowHint(false)
    } else {
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

  const clearCurrentAnswers = () => {
    const step = learningSteps[currentStep]
    const newAnswers = [...userAnswers]
    step.blanks.forEach((_, blankIdx) => {
      const globalIdx = getGlobalAnswerIndex(currentStep, blankIdx)
      newAnswers[globalIdx] = ''
    })
    setUserAnswers(newAnswers)
    setShowFeedback(false)
  }

  const renderBlankLine = () => {
    if (!learningSteps[currentStep]) return null
    
    const step = learningSteps[currentStep]
    const chars = step.line.split('')
    
    return (
      <div className="text-lg sm:text-2xl lg:text-4xl font-bold text-white tracking-wider leading-relaxed text-center px-4">
        <div className="flex flex-wrap justify-center items-center gap-1 sm:gap-2">
          {chars.map((char, charIndex) => {
            const blankIndex = step.blanks.findIndex(blank => blank.position === charIndex)
            
            if (blankIndex !== -1) {
              const globalIndex = getGlobalAnswerIndex(currentStep, blankIndex)
              const userAnswer = userAnswers[globalIndex]
              
              return (
                <span
                  key={charIndex}
                  className={`inline-flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 border-b-4 text-center ${
                    userAnswer 
                      ? 'border-yellow-400 bg-yellow-400/30' 
                      : 'border-white/60 bg-white/15'
                  } rounded-lg shadow-md transition-all duration-300`}
                >
                  {userAnswer && (
                    <span className="text-yellow-300 font-bold text-sm sm:text-lg lg:text-xl">{userAnswer}</span>
                  )}
                </span>
              )
            }
            
            return (
              <span key={charIndex} className="inline-block">
                {char}
              </span>
            )
          })}
        </div>
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
          <Link 
            to="/"
            className="mt-4 bg-yellow-600 text-white px-6 py-2 rounded-lg inline-block"
          >
            返回首页
          </Link>
        </div>
      </div>
    )
  }

  const currentStepData = learningSteps[currentStep]

  return (
    <div className="min-h-screen bg-gray-900 overflow-auto">
      {/* 背景图片层 */}
      <div 
        className="fixed inset-0 w-full h-full bg-cover bg-center bg-no-repeat transition-all duration-1000"
        style={{
          backgroundImage: backgroundImage ? `url(${backgroundImage})` : 'linear-gradient(135deg, #1a1a2e, #16213e)',
          backgroundSize: 'cover',
          backgroundPosition: 'center center',
          backgroundAttachment: 'fixed'
        }}
      >
        <div className="absolute inset-0 bg-black/40"></div>
      </div>

      {/* 主要内容 */}
      <div className="relative z-10 min-h-screen flex flex-col lg:flex-row">
        
        {/* 左侧学习区域 */}
        <div className="flex-1 lg:flex-grow flex flex-col min-h-screen lg:min-h-0 p-4 md:p-6 lg:p-8">
          
          {/* 诗词信息和导航 */}
          <div className="flex-shrink-0 mb-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 space-y-2 sm:space-y-0">
              <Link
                to={`/learn/${poemId}`}
                className="flex items-center space-x-2 text-white/80 hover:text-white transition-colors"
              >
                <span>← 返回</span>
              </Link>
              
              <div className="text-left sm:text-right text-white/80 w-full sm:w-auto">
                <div className="text-sm mb-1">
                  进度: {currentStep + 1} / {learningSteps.length} 
                  <span className="ml-2 text-green-400">
                    ({completedSteps.size} 已完成)
                  </span>
                </div>
                <div className="w-full sm:w-32 h-2 bg-white/20 rounded-full">
                  <div 
                    className="h-full bg-yellow-400 rounded-full transition-all duration-300"
                    style={{ width: `${((currentStep + 1) / learningSteps.length) * 100}%` }}
                  ></div>
                </div>
              </div>
            </div>
            
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-white mb-2">{poem.title}</h1>
            <p className="text-base sm:text-lg lg:text-xl text-white/80">{poem.author} · {poem.dynasty}</p>
          </div>

          {/* 主要学习内容区域 */}
          <div className="flex-1 flex flex-col justify-center min-h-0 py-4">
            
            {/* 上下文显示 */}
            {currentStepData.contextLines.length > 0 && (
              <div className="mb-4 lg:mb-6 space-y-1 lg:space-y-2">
                <h3 className="text-xs sm:text-sm lg:text-base font-medium text-white/80 mb-2 lg:mb-3 text-center">已学过的诗句：</h3>
                {currentStepData.contextLines.map((line, index) => (
                  <div key={index} className="text-sm sm:text-base lg:text-xl text-white/60 font-medium text-center">
                    {line}
                  </div>
                ))}
              </div>
            )}

            {/* 当前学习句子 */}
            <div className="mb-4 lg:mb-6">
              <h3 className="text-xs sm:text-sm lg:text-base font-medium text-white/80 mb-3 lg:mb-4 text-center">请完成这句诗：</h3>
              {renderBlankLine()}
            </div>

          {/* 引导性提示 */}
          <div className="mb-4 lg:mb-8">
            <div className="bg-white/15 rounded-lg lg:rounded-xl p-3 lg:p-6 border border-white/30 shadow-lg">
              <div className="flex items-start space-x-2 lg:space-x-3">
                <span className="text-yellow-400 text-lg lg:text-xl">💡</span>
                <div className="flex-1 min-w-0">
                  <h4 className="text-white font-medium mb-1 lg:mb-2 text-sm lg:text-base">思考提示</h4>
                  <p className="text-white/80 leading-relaxed text-xs lg:text-sm">{currentStepData.guidanceText}</p>
                </div>
              </div>
              
              {showHint && currentStepData.blanks[0]?.hint && (
                <div className="mt-3 lg:mt-4 pt-3 lg:pt-4 border-t border-white/20">
                  <p className="text-yellow-200 text-xs lg:text-sm">💡 {currentStepData.blanks[0].hint}</p>
                </div>
              )}
              
              {!showHint && (
                <button
                  onClick={() => setShowHint(true)}
                  className="mt-3 lg:mt-4 text-yellow-300 text-xs lg:text-sm hover:text-yellow-200 transition-colors"
                >
                  需要更多提示？
                </button>
              )}
            </div>
          </div>

          {/* 反馈区域 */}
          {showFeedback && feedback && (
            <div className={`mb-4 lg:mb-8 p-3 lg:p-6 rounded-lg lg:rounded-xl border shadow-lg ${
              feedback.correct 
                ? 'bg-green-500/25 border-green-400/50' 
                : 'bg-orange-500/25 border-orange-400/50'
            }`}>
              <div className="flex items-start space-x-2 lg:space-x-3">
                <span className={`text-lg lg:text-xl ${feedback.correct ? 'text-green-400' : 'text-orange-400'}`}>
                  {feedback.correct ? '✓' : '🤔'}
                </span>
                <div className="flex-1 min-w-0">
                  <h4 className={`font-medium mb-1 lg:mb-2 text-sm lg:text-base ${
                    feedback.correct ? 'text-green-300' : 'text-orange-300'
                  }`}>
                    {feedback.message}
                  </h4>
                  <p className="text-white/80 text-xs lg:text-sm leading-relaxed">
                    {feedback.explanation}
                  </p>
                </div>
              </div>
              
              <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3 mt-3 lg:mt-4">
                {currentStep > 0 && (
                  <button
                    onClick={goToPreviousStep}
                    className="flex items-center justify-center space-x-2 bg-white/10 text-white px-3 lg:px-4 py-2 rounded-lg hover:bg-white/20 transition-colors text-sm"
                  >
                    <span>← 上一句</span>
                  </button>
                )}
                
                <button
                  onClick={feedback.correct ? goToNextStep : () => setShowFeedback(false)}
                  className={`flex items-center justify-center space-x-2 px-4 lg:px-6 py-2 rounded-lg transition-colors text-sm ${
                    feedback.correct
                      ? 'bg-green-600 hover:bg-green-700 text-white'
                      : 'bg-orange-600 hover:bg-orange-700 text-white'
                  }`}
                >
                  {feedback.correct ? (
                    <span>下一句 →</span>
                  ) : (
                    <span>重新尝试</span>
                  )}
                </button>
              </div>
            </div>
          )}
          
          </div> {/* 结束主要学习内容区域 */}
        </div> {/* 结束左侧学习区域 */}

        {/* 右侧字词候选区域 */}
        <div className="w-full lg:w-80 xl:w-96 bg-black/40 border-t lg:border-t-0 lg:border-l border-white/30 p-4 lg:p-6 flex flex-col shadow-xl">
          
          {/* 候选字词标题 */}
          <div className="flex-shrink-0 mb-4">
            <h3 className="text-base lg:text-xl font-bold text-white mb-2">选择合适的字</h3>
            <p className="text-white/70 text-xs lg:text-sm">点击下方的字来填入空缺</p>
          </div>

          {/* 字词网格 */}
          <div className="flex-1 flex flex-col justify-start lg:justify-center py-4">
            <div className="grid grid-cols-3 gap-2 lg:gap-3 max-w-sm mx-auto w-full">
              {currentStepData.candidates.map((char, index) => (
                <button
                  key={index}
                  onClick={() => {
                    // 找到第一个未填写的空格
                    const firstEmptyBlank = currentStepData.blanks.findIndex((_, blankIdx) => {
                      const globalIdx = getGlobalAnswerIndex(currentStep, blankIdx)
                      const currentAnswer = userAnswers[globalIdx]
                      return !currentAnswer || currentAnswer === ''
                    })
                    
                    if (firstEmptyBlank !== -1) {
                      handleCharacterSelect(char, firstEmptyBlank)
                    }
                  }}
                  disabled={showFeedback}
                  className={`w-full aspect-square bg-white/10 hover:bg-white/20 border border-white/30 rounded-lg lg:rounded-xl 
                    text-lg lg:text-2xl font-bold text-white transition-all duration-200 transform hover:scale-105
                    disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none
                    ${userAnswers.includes(char) ? 'bg-yellow-500/30 border-yellow-400' : ''}
                    min-h-[3rem] lg:min-h-[4rem]
                  `}
                >
                  {char}
                </button>
              ))}
            </div>
          </div>

          {/* 辅助功能 */}
          <div className="flex-shrink-0 mt-4 space-y-2 lg:space-y-3">
            <button
              onClick={() => {
                // 手动检查答案，即使有空格未填写
                if (!showFeedback) {
                  checkAnswers()
                }
              }}
              disabled={showFeedback}
              className="w-full bg-blue-500/20 border border-blue-400/30 text-blue-300 py-3 lg:py-4 rounded-lg hover:bg-blue-500/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium text-sm lg:text-base"
            >
              📝 提交答案
            </button>

            <button
              onClick={clearCurrentAnswers}
              className="w-full bg-red-500/20 border border-red-400/30 text-red-300 py-2 lg:py-3 rounded-lg hover:bg-red-500/30 transition-colors text-sm lg:text-base"
            >
              清空重填
            </button>
            
            <div className="text-center text-white/40 text-xs">
              💡 选择体现诗意和韵律的字
            </div>
          </div>

          {/* 图片生成状态 */}
          {isGeneratingImage && (
            <div className="mt-3 lg:mt-4 flex items-center space-x-2 text-white/60 text-xs lg:text-sm">
              <span className="animate-spin">✨</span>
              <span>AI正在生成意境图...</span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default EnhancedImmersiveLearningPage

import express from 'express'
import axios from 'axios'
import { validateN8nWorkflow, validateLearningProgress } from '../middleware/validation'
import { n8nConnectionManager } from '../services/N8nConnectionManager'

const router = express.Router()

// N8N服务器配置
const N8N_BASE_URL = process.env.N8N_BASE_URL || 'http://localhost:5678'
const N8N_API_KEY = process.env.N8N_API_KEY

// 创建N8N客户端
const n8nClient = axios.create({
  baseURL: N8N_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    ...(N8N_API_KEY && { 'X-N8N-API-KEY': N8N_API_KEY })
  },
  timeout: 30000
})

// n8n状态检查
router.get('/status', async (req, res) => {
  try {
    const health = await n8nConnectionManager.checkHealth();
    const status = n8nConnectionManager.getConnectionStatus();
    
    return res.json({
      success: true,
      health,
      connection: status,
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// 手动重连n8n
router.post('/reconnect', async (req, res) => {
  try {
    const connected = await n8nConnectionManager.reconnect();
    
    return res.json({
      success: connected,
      message: connected ? 'n8n重连成功' : 'n8n重连失败',
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// 触发学习流程工作流
router.post('/trigger/learning-flow', validateN8nWorkflow, async (req, res) => {
  try {
    const { poemId, stepId, userAction, data } = req.body

    const workflowData = {
      poemId,
      stepId,
      userAction, // 'start', 'answer', 'hint', 'next'
      timestamp: new Date().toISOString(),
      ...data
    }

    // 触发N8N工作流
    const response = await n8nClient.post('/webhook/learning-flow', workflowData)

    res.json({
      success: true,
      workflowId: response.data.workflowId,
      executionId: response.data.executionId,
      result: response.data.result
    })
  } catch (error) {
    console.error('触发学习流程失败:', error)
    res.status(500).json({ 
      error: '触发学习流程失败',
      details: error instanceof Error ? error.message : '未知错误'
    })
  }
})

// 触发AI内容生成工作流
router.post('/trigger/ai-generation', async (req, res) => {
  try {
    const { type, poemId, stepId, prompt, options = {} } = req.body

    const workflowData = {
      type, // 'hint', 'image', 'audio', 'analysis'
      poemId,
      stepId,
      prompt,
      options,
      timestamp: new Date().toISOString()
    }

    // 触发AI生成工作流
    const response = await n8nClient.post('/webhook/ai-generation', workflowData)

    res.json({
      success: true,
      workflowId: response.data.workflowId,
      executionId: response.data.executionId,
      result: response.data.result
    })
  } catch (error) {
    console.error('触发AI生成失败:', error)
    res.status(500).json({ 
      error: '触发AI生成失败',
      details: error instanceof Error ? error.message : '未知错误'
    })
  }
})

// 处理学习进度更新
router.post('/progress/update', validateLearningProgress, async (req, res) => {
  try {
    const progressData = {
      ...req.body,
      timestamp: new Date().toISOString(),
      sessionId: req.headers['x-session-id'] || 'anonymous'
    }

    // 触发进度更新工作流
    const response = await n8nClient.post('/webhook/progress-update', progressData)

    // 同时可以触发个性化推荐工作流
    if (progressData.stepId > 1) {
      n8nClient.post('/webhook/personalization', {
        userId: progressData.sessionId,
        poemId: progressData.poemId,
        performance: {
          accuracy: calculateAccuracy(progressData.userAnswers),
          timeSpent: progressData.timeSpent,
          hintsUsed: progressData.hintsUsed
        }
      }).catch(error => {
        console.warn('个性化推荐工作流触发失败:', error.message)
      })
    }

    res.json({
      success: true,
      message: '学习进度已更新',
      recommendations: response.data.recommendations
    })
  } catch (error) {
    console.error('更新学习进度失败:', error)
    res.status(500).json({ 
      error: '更新学习进度失败',
      details: error instanceof Error ? error.message : '未知错误'
    })
  }
})

// 生成意境图片
router.post('/generate-image', async (req, res) => {
  try {
    const { prompt, style, poem_id, line_index } = req.body

    // 构建图片生成请求
    const imageData = {
      prompt: prompt || '古风诗词意境图',
      style: style || 'chinese_classical',
      poem_id,
      line_index,
      timestamp: new Date().toISOString()
    }

    // 尝试调用N8N图片生成工作流
    try {
      const response = await n8nClient.post('/webhook/generate-image', imageData)
      
      if (response.data.success && response.data.image_url) {
        return res.json({
          success: true,
          data: {
            image_url: response.data.image_url,
            generation_time: response.data.generation_time,
            source: 'n8n_ai'
          }
        })
      }
    } catch (n8nError: any) {
      console.log('N8N图片生成失败，使用备用方案:', n8nError?.message || 'Unknown error')
    }

    // 备用方案：返回静态图片或使用其他图片服务
    const fallbackImages = [
      'https://picsum.photos/800/600?random=1',
      'https://picsum.photos/800/600?random=2',
      'https://picsum.photos/800/600?random=3',
      'https://picsum.photos/800/600?random=4',
      'https://picsum.photos/800/600?random=5'
    ]
    
    const randomIndex = Math.floor(Math.random() * fallbackImages.length)
    
    return res.json({
      success: true,
      data: {
        image_url: fallbackImages[randomIndex],
        generation_time: 500,
        source: 'fallback'
      }
    })

  } catch (error) {
    console.error('图片生成失败:', error)
    return res.status(500).json({ 
      success: false,
      error: '图片生成失败',
      details: error instanceof Error ? error.message : '未知错误'
    })
  }
})

// 沉浸式学习进度记录
router.post('/immersive-progress', async (req, res) => {
  try {
    const { poem_id, step_index, correct, user_answers, correct_answers } = req.body

    const progressData = {
      poem_id,
      step_index,
      correct,
      user_answers,
      correct_answers,
      accuracy: correct ? 100 : 0,
      timestamp: new Date().toISOString(),
      session_id: 'anonymous' // 简化处理
    }

    // 尝试发送到N8N进度跟踪工作流
    try {
      const response = await n8nClient.post('/webhook/immersive-progress', progressData)
      
      return res.json({
        success: true,
        message: '学习进度已记录',
        data: response.data
      })
    } catch (n8nError: any) {
      console.log('N8N进度记录失败，使用本地记录:', n8nError?.message || 'Unknown error')
    }

    // 备用方案：本地记录（这里可以存储到数据库）
    console.log('沉浸式学习进度记录:', progressData)
    
    return res.json({
      success: true,
      message: '学习进度已本地记录',
      data: progressData
    })

  } catch (error) {
    console.error('学习进度记录失败:', error)
    return res.status(500).json({ 
      success: false,
      error: '学习进度记录失败',
      details: error instanceof Error ? error.message : '未知错误'
    })
  }
})

// 获取工作流执行状态
router.get('/execution/:executionId/status', async (req, res) => {
  try {
    const { executionId } = req.params

    const response = await n8nClient.get(`/api/v1/executions/${executionId}`)

    res.json({
      executionId,
      status: response.data.finished ? 'completed' : 'running',
      result: response.data.data,
      startedAt: response.data.startedAt,
      finishedAt: response.data.finishedAt,
      error: response.data.error
    })
  } catch (error) {
    console.error('获取执行状态失败:', error)
    res.status(500).json({ 
      error: '获取执行状态失败',
      details: error instanceof Error ? error.message : '未知错误'
    })
  }
})

// 触发批量内容预生成工作流
router.post('/trigger/batch-pregeneration', async (req, res) => {
  try {
    const { poemIds, contentTypes = ['images', 'hints'] } = req.body

    const workflowData = {
      poemIds,
      contentTypes,
      priority: 'background',
      timestamp: new Date().toISOString()
    }

    // 触发批量预生成工作流
    const response = await n8nClient.post('/webhook/batch-pregeneration', workflowData)

    res.json({
      success: true,
      message: '批量预生成任务已启动',
      jobId: response.data.jobId,
      estimatedTime: response.data.estimatedTime
    })
  } catch (error) {
    console.error('触发批量预生成失败:', error)
    res.status(500).json({ 
      error: '触发批量预生成失败',
      details: error instanceof Error ? error.message : '未知错误'
    })
  }
})

// 获取工作流健康状态
router.get('/health', async (req, res) => {
  try {
    const response = await n8nClient.get('/healthz')
    
    res.json({
      n8nStatus: 'healthy',
      version: response.data.version,
      uptime: response.data.uptime,
      connectedAt: new Date().toISOString()
    })
  } catch (error) {
    console.error('N8N健康检查失败:', error)
    res.status(503).json({ 
      n8nStatus: 'unhealthy',
      error: error instanceof Error ? error.message : '连接失败'
    })
  }
})

// 获取可用工作流列表
router.get('/workflows', async (req, res) => {
  try {
    const response = await n8nClient.get('/api/v1/workflows')
    
    const poetryWorkflows = response.data.data.filter((workflow: any) => 
      workflow.name.includes('poetry') || 
      workflow.tags?.includes('poetry-learning')
    )

    res.json({
      workflows: poetryWorkflows.map((workflow: any) => ({
        id: workflow.id,
        name: workflow.name,
        active: workflow.active,
        tags: workflow.tags,
        updatedAt: workflow.updatedAt
      }))
    })
  } catch (error) {
    console.error('获取工作流列表失败:', error)
    res.status(500).json({ 
      error: '获取工作流列表失败',
      details: error instanceof Error ? error.message : '未知错误'
    })
  }
})

// 手动触发内容缓存清理
router.post('/trigger/cache-cleanup', async (req, res) => {
  try {
    const { type = 'all', olderThan = '7d' } = req.body

    const workflowData = {
      cleanupType: type, // 'images', 'audio', 'all'
      olderThan,
      timestamp: new Date().toISOString()
    }

    const response = await n8nClient.post('/webhook/cache-cleanup', workflowData)

    res.json({
      success: true,
      message: '缓存清理任务已启动',
      jobId: response.data.jobId
    })
  } catch (error) {
    console.error('触发缓存清理失败:', error)
    res.status(500).json({ 
      error: '触发缓存清理失败',
      details: error instanceof Error ? error.message : '未知错误'
    })
  }
})

// 获取个性化推荐
router.post('/get-recommendations', async (req, res) => {
  try {
    const { userId = 'anonymous', preferences = {}, currentPoem = null } = req.body

    const recommendationData = {
      userId,
      preferences,
      currentPoem,
      timestamp: new Date().toISOString()
    }

    // 尝试调用N8N推荐工作流
    try {
      const response = await n8nClient.post('/webhook/get-recommendations', recommendationData)
      
      return res.json({
        success: true,
        recommendations: response.data.recommendations || [],
        source: 'n8n_workflow'
      })
    } catch (n8nError: any) {
      console.log('N8N推荐工作流失败，使用备用方案:', n8nError?.message || 'Unknown error')
    }

    // 备用推荐方案
    const fallbackRecommendations = [
      { poemId: 1, title: '春晓', reason: '适合初学者，意境清新' },
      { poemId: 2, title: '静夜思', reason: '经典名篇，易于理解' },
      { poemId: 3, title: '登鹳雀楼', reason: '哲理深刻，适合进阶学习' }
    ]
    
    return res.json({
      success: true,
      recommendations: fallbackRecommendations,
      source: 'fallback'
    })

  } catch (error) {
    console.error('获取推荐失败:', error)
    return res.status(500).json({ 
      success: false,
      error: '获取推荐失败',
      details: error instanceof Error ? error.message : '未知错误'
    })
  }
})

// 进度分析
router.post('/progress-analytics', async (req, res) => {
  try {
    const { userId = 'anonymous', timeRange = '7d' } = req.body

    const analyticsData = {
      userId,
      timeRange,
      timestamp: new Date().toISOString()
    }

    // 尝试调用N8N分析工作流
    try {
      const response = await n8nClient.post('/webhook/progress-analytics', analyticsData)
      
      return res.json({
        success: true,
        analytics: response.data.analytics || {},
        source: 'n8n_workflow'
      })
    } catch (n8nError: any) {
      console.log('N8N分析工作流失败，使用备用方案:', n8nError?.message || 'Unknown error')
    }

    // 备用分析数据
    const fallbackAnalytics = {
      totalPoems: 5,
      completedPoems: 3,
      accuracyRate: 85,
      timeSpent: 1200,
      strengths: ['理解能力强', '记忆力好'],
      improvements: ['可以增加练习量', '注意诗词韵律']
    }
    
    return res.json({
      success: true,
      analytics: fallbackAnalytics,
      source: 'fallback'
    })

  } catch (error) {
    console.error('进度分析失败:', error)
    return res.status(500).json({ 
      success: false,
      error: '进度分析失败',
      details: error instanceof Error ? error.message : '未知错误'
    })
  }
})

// 学习助手
router.post('/learning-assistant', async (req, res) => {
  try {
    const { query, context = {}, userId = 'anonymous' } = req.body

    const assistantData = {
      query,
      context,
      userId,
      timestamp: new Date().toISOString()
    }

    // 尝试调用N8N学习助手工作流
    try {
      const response = await n8nClient.post('/webhook/learning-assistant', assistantData)
      
      return res.json({
        success: true,
        response: response.data.response || '很抱歉，我暂时无法回答您的问题。',
        source: 'n8n_workflow'
      })
    } catch (n8nError: any) {
      console.log('N8N学习助手工作流失败，使用备用方案:', n8nError?.message || 'Unknown error')
    }

    // 备用助手回复
    const fallbackResponse = '我是您的古诗词学习助手！您可以向我询问任何关于古诗词的问题，我会尽力为您解答。'
    
    return res.json({
      success: true,
      response: fallbackResponse,
      source: 'fallback'
    })

  } catch (error) {
    console.error('学习助手请求失败:', error)
    return res.status(500).json({ 
      success: false,
      error: '学习助手请求失败',
      details: error instanceof Error ? error.message : '未知错误'
    })
  }
})

// 学习进度记录
router.post('/learning-progress', async (req, res) => {
  try {
    const progressData = {
      ...req.body,
      timestamp: new Date().toISOString()
    }

    // 尝试发送到N8N进度工作流
    try {
      const response = await n8nClient.post('/webhook/learning-progress', progressData)
      
      return res.json({
        success: true,
        message: '学习进度已记录',
        data: response.data
      })
    } catch (n8nError: any) {
      console.log('N8N学习进度工作流失败，使用备用方案:', n8nError?.message || 'Unknown error')
    }

    // 备用方案：本地记录
    console.log('学习进度记录（本地）:', progressData)
    
    return res.json({
      success: true,
      message: '学习进度已本地记录',
      data: progressData
    })

  } catch (error) {
    console.error('学习进度记录失败:', error)
    return res.status(500).json({ 
      success: false,
      error: '学习进度记录失败',
      details: error instanceof Error ? error.message : '未知错误'
    })
  }
})

// 辅助函数：计算准确率
function calculateAccuracy(userAnswers: string[]): number {
  // 这里需要与正确答案比较，暂时返回模拟值
  return Math.random() * 100
}

// 错误处理中间件
router.use((error: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('N8N路由错误:', error)
  
  if (error.code === 'ECONNREFUSED') {
    return res.status(503).json({
      error: 'N8N服务不可用',
      message: '请检查N8N服务是否正在运行'
    })
  }
  
  if (error.response?.status === 401) {
    return res.status(401).json({
      error: 'N8N认证失败',
      message: '请检查API密钥配置'
    })
  }
  
  return res.status(500).json({
    error: 'N8N集成错误',
    details: error.message
  })
})

export default router
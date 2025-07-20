// AI服务路由 - 集成DeepSeek AI服务
import { Router } from 'express';
import { deepSeekAIManager } from '../services/DeepSeekAIManager';

const router = Router();

/**
 * AI服务健康检查
 */
router.get('/health', async (req, res) => {
  try {
    const deepSeekHealth = await deepSeekAIManager.checkHealth();
    
    return res.json({
      success: true,
      services: {
        deepseek: {
          status: deepSeekHealth ? 'healthy' : 'unavailable',
          info: deepSeekAIManager.getServiceInfo()
        }
      },
      primary_service: 'deepseek',
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * 生成AI文本内容
 */
router.post('/generate-text', async (req, res) => {
  try {
    const { prompt, options = {} } = req.body;
    
    if (!prompt) {
      return res.status(400).json({
        success: false,
        error: '缺少prompt参数'
      });
    }

    // 使用DeepSeek生成文本
    const result = await deepSeekAIManager.generateText({
      prompt,
      ...options
    });

    return res.json(result);
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      error: error.message,
      service: 'deepseek'
    });
  }
});

/**
 * 生成古诗文学习内容
 */
router.post('/generate-poetry-content', async (req, res) => {
  try {
    const { type, poem, context } = req.body;
    
    if (!type || !poem) {
      return res.status(400).json({
        success: false,
        error: '缺少type或poem参数'
      });
    }

    if (!['hint', 'explanation', 'question'].includes(type)) {
      return res.status(400).json({
        success: false,
        error: 'type参数必须是: hint, explanation, question之一'
      });
    }

    // 使用DeepSeek生成古诗文相关内容
    const result = await deepSeekAIManager.generatePoetryContent(type, poem, context);
    
    return res.json(result);
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * 生成个性化学习建议
 */
router.post('/generate-learning-advice', async (req, res) => {
  try {
    const { userProgress, preferences } = req.body;
    
    if (!userProgress) {
      return res.status(400).json({
        success: false,
        error: '缺少userProgress参数'
      });
    }

    const result = await deepSeekAIManager.generateLearningAdvice(userProgress, preferences || {});
    
    return res.json(result);
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * 获取AI服务配置信息
 */
router.get('/config', (req, res) => {
  return res.json({
    success: true,
    config: {
      primary_service: 'deepseek',
      services: {
        deepseek: deepSeekAIManager.getServiceInfo()
      },
      features: [
        '智能对话',
        '古诗文分析',
        '学习建议生成',
        '内容解释',
        '问题生成'
      ]
    }
  });
});

/**
 * 测试AI服务
 */
router.post('/test', async (req, res) => {
  try {
    const { prompt = '你好，请简单介绍一下你自己。' } = req.body;
    
    const result = await deepSeekAIManager.generateText({ prompt });
    
    return res.json({
      success: true,
      test_result: result,
      service: 'deepseek',
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      error: error.message,
      service: 'deepseek'
    });
  }
});

export default router;

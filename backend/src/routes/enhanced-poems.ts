import express from 'express';
import { databaseManager } from '../database/DatabaseManager';
import { chineseAIManager } from '../services/ChineseAIManager';
import { smartJudgeSystem } from '../services/SmartJudgeSystem';
import crypto from 'crypto';
import path from 'path';
import fs from 'fs';

const router = express.Router();

// 获取诗词列表（带评分信息）
router.get('/poems', async (req, res) => {
  try {
    // 先简单测试不带参数的查询
    const poems = await databaseManager.getPoems();
    
    // 为每首诗添加评分信息
    const poemsWithRatings = await Promise.all(
      poems.map(async (poem) => {
        const ratings = await databaseManager.getPoemRatings(poem.id);
        return {
          ...poem,
          ratings: {
            average_overall: ratings.average_overall,
            total_ratings: ratings.total_ratings
          }
        };
      })
    );

    res.json({
      success: true,
      data: poemsWithRatings,
      pagination: {
        page: 1,
        limit: poemsWithRatings.length,
        total: poemsWithRatings.length
      }
    });
  } catch (error) {
    console.error('获取诗词列表失败:', error);
    res.status(500).json({
      success: false,
      error: '获取诗词列表失败'
    });
  }
});

// 获取单首诗词详情（包含图片缓存和评分）
router.get('/poems/:id', async (req, res) => {
  try {
    const poemId = parseInt(req.params.id);
    const poem = await databaseManager.getPoemById(poemId);
    
    if (!poem) {
      res.status(404).json({
        success: false,
        error: '诗词不存在'
      });
      return;
    }

    // 获取评分信息
    const ratings = await databaseManager.getPoemRatings(poemId);
    
    // 检查是否有缓存的图片
    const imagePrompt = `${poem.title} ${poem.author} ${poem.content.substring(0, 20)}`;
    const cachedImage = await databaseManager.getImageFromCache(poemId, imagePrompt);

    res.json({
      success: true,
      data: {
        ...poem,
        ratings,
        cached_image: cachedImage
      }
    });
  } catch (error) {
    console.error('获取诗词详情失败:', error);
    res.status(500).json({
      success: false,
      error: '获取诗词详情失败'
    });
  }
});

// 智能学习分析接口（需求2：改进正误判断）
router.post('/poems/:id/analyze', async (req, res) => {
  try {
    const poemId = parseInt(req.params.id);
    const { userAnswers, userId = 'guest' } = req.body;

    const poem = await databaseManager.getPoemById(poemId);
    if (!poem) {
      res.status(404).json({
        success: false,
        error: '诗词不存在'
      });
      return;
    }

    // 使用智能判断系统分析答案
    const analysis = await smartJudgeSystem.analyzeUserAnswers(
      poemId,
      poem.content,
      userAnswers
    );

    // 保存学习记录
    await smartJudgeSystem.updateLearningStats(poemId, userId, analysis);

    res.json({
      success: true,
      data: analysis
    });
  } catch (error) {
    console.error('学习分析失败:', error);
    res.status(500).json({
      success: false,
      error: '学习分析失败'
    });
  }
});

// 生成AI图片（需求1&3：中国AI优先，缓存存储）
router.post('/poems/:id/generate-image', async (req, res) => {
  try {
    const poemId = parseInt(req.params.id);
    const { customPrompt, style = 'traditional', regenerate = false } = req.body;

    const poem = await databaseManager.getPoemById(poemId);
    if (!poem) {
      res.status(404).json({
        success: false,
        error: '诗词不存在'
      });
      return;
    }

    // 构建图片生成提示词
    const basePrompt = customPrompt || 
      `中国古典诗词意境图：${poem.title}，${poem.author}，${poem.content}。${style}风格，唯美意境，水墨画风`;

    // 检查缓存（除非强制重新生成）
    if (!regenerate) {
      const cachedImage = await databaseManager.getImageFromCache(poemId, basePrompt);
      if (cachedImage) {
        res.json({
          success: true,
          data: {
            image_url: cachedImage.image_url,
            caption: cachedImage.caption,
            cached: true,
            service: cachedImage.ai_service
          }
        });
        return;
      }
    }

    // 使用中国AI服务生成图片
    const imageResult = await chineseAIManager.generateImage({
      prompt: basePrompt,
      style: style,
      size: '1024x1024'
    });

    if (!imageResult.success) {
      res.status(500).json({
        success: false,
        error: imageResult.error || '图片生成失败'
      });
      return;
    }

    // 生成配文（需求4）
    const caption = await chineseAIManager.generateImageCaption(basePrompt, poem.content);

    // 保存到缓存
    const promptHash = crypto.createHash('md5').update(basePrompt).digest('hex');
    await databaseManager.saveImageToCache({
      poem_id: poemId,
      prompt_hash: promptHash,
      image_url: imageResult.data.url || imageResult.data[0]?.url || '',
      ai_service: imageResult.service,
      generation_params: { prompt: basePrompt, style },
      caption
    });

    res.json({
      success: true,
      data: {
        image_url: imageResult.data.url || imageResult.data[0]?.url || '',
        caption,
        cached: false,
        service: imageResult.service
      }
    });
  } catch (error) {
    console.error('图片生成失败:', error);
    res.status(500).json({
      success: false,
      error: '图片生成失败'
    });
  }
});

// 提交评分（需求5：星级评分系统）
router.post('/poems/:id/rating', async (req, res) => {
  try {
    const poemId = parseInt(req.params.id);
    const { 
      content_rating, 
      image_rating, 
      overall_rating, 
      comment, 
      user_id = 'guest' 
    } = req.body;

    // 验证评分范围
    if (
      !Number.isInteger(content_rating) || content_rating < 1 || content_rating > 5 ||
      !Number.isInteger(image_rating) || image_rating < 1 || image_rating > 5 ||
      !Number.isInteger(overall_rating) || overall_rating < 1 || overall_rating > 5
    ) {
      res.status(400).json({
        success: false,
        error: '评分必须是1-5的整数'
      });
      return;
    }

    const poem = await databaseManager.getPoemById(poemId);
    if (!poem) {
      res.status(404).json({
        success: false,
        error: '诗词不存在'
      });
      return;
    }

    // 保存评分
    await databaseManager.saveRating({
      poem_id: poemId,
      user_id,
      content_rating,
      image_rating,
      overall_rating,
      comment
    });

    // 返回更新后的评分统计
    const updatedRatings = await databaseManager.getPoemRatings(poemId);

    res.json({
      success: true,
      data: updatedRatings
    });
  } catch (error) {
    console.error('保存评分失败:', error);
    res.status(500).json({
      success: false,
      error: '保存评分失败'
    });
  }
});

// 获取诗词评分统计
router.get('/poems/:id/ratings', async (req, res) => {
  try {
    const poemId = parseInt(req.params.id);
    const ratings = await databaseManager.getPoemRatings(poemId);

    res.json({
      success: true,
      data: ratings
    });
  } catch (error) {
    console.error('获取评分统计失败:', error);
    res.status(500).json({
      success: false,
      error: '获取评分统计失败'
    });
  }
});

// 获取学习分析数据
router.get('/poems/:id/analytics', async (req, res) => {
  try {
    const poemId = parseInt(req.params.id);
    const analytics = await databaseManager.getLearningAnalytics(poemId);

    res.json({
      success: true,
      data: analytics
    });
  } catch (error) {
    console.error('获取学习分析失败:', error);
    res.status(500).json({
      success: false,
      error: '获取学习分析失败'
    });
  }
});

// AI文本生成（使用中国AI）
router.post('/ai/generate-text', async (req, res) => {
  try {
    const { prompt, temperature = 0.7, max_tokens = 1000 } = req.body;

    if (!prompt) {
      res.status(400).json({
        success: false,
        error: '提示词不能为空'
      });
      return;
    }

    const result = await chineseAIManager.generateText({
      prompt,
      temperature,
      max_tokens
    });

    res.json({
      success: result.success,
      data: result.data,
      service: result.service,
      error: result.error
    });
  } catch (error) {
    console.error('AI文本生成失败:', error);
    res.status(500).json({
      success: false,
      error: 'AI文本生成失败'
    });
  }
});

// 获取AI服务状态
router.get('/ai/services', async (req, res) => {
  try {
    const services = await databaseManager.getActiveAIServices();
    
    res.json({
      success: true,
      data: services
    });
  } catch (error) {
    console.error('获取AI服务失败:', error);
    res.status(500).json({
      success: false,
      error: '获取AI服务失败'
    });
  }
});

export default router;

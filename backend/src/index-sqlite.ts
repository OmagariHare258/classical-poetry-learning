import express, { Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import path from 'path';

import DatabaseManager from './database/DatabaseManager-sqlite';
import DeepSeekAIManager from './services/DeepSeekAIManager';
import n8nRouter from './routes/n8n';

// 加载环境变量
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// 全局变量
let dbManager: DatabaseManager;
let aiManager: DeepSeekAIManager;

// 中间件配置
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));
app.use(morgan('combined'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// 静态文件服务
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

console.log('🔧 环境变量检查:', {
  SQLITE_DB_PATH: process.env.SQLITE_DB_PATH || '使用默认路径',
  DEEPSEEK_API_KEY: process.env.DEEPSEEK_API_KEY ? '***已设置***' : '未设置',
  PORT: PORT
});

// 初始化数据库
async function initializeDatabase() {
  try {
    dbManager = new DatabaseManager();
    await dbManager.initialize();
    console.log('✅ SQLite数据库连接成功');
  } catch (error) {
    console.error('❌ SQLite数据库连接失败:', error);
    throw error;
  }
}

// 初始化AI服务
function initializeAI() {
  try {
    aiManager = new DeepSeekAIManager();
    console.log('✅ DeepSeek AI服务已初始化');
  } catch (error) {
    console.error('❌ DeepSeek AI服务初始化失败:', error);
  }
}

// === 基础路由 ===
app.get('/api/health', async (req: Request, res: Response) => {
  try {
    const dbStatus = await dbManager?.testConnection() || false;
    
    res.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      services: {
        database: dbStatus ? 'connected' : 'disconnected',
        ai: aiManager ? 'initialized' : 'not_initialized'
      }
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Health check failed',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// === 诗词相关路由 ===
app.get('/api/poems', async (req: Request, res: Response) => {
  try {
    const { search, difficulty, dynasty, category, limit } = req.query;
    
    let poems;
    if (search || difficulty || dynasty || category || limit) {
      poems = await dbManager.searchPoems(search as string || '', {
        difficulty: difficulty as string,
        dynasty: dynasty as string,
        category: category as string,
        limit: limit ? parseInt(limit as string) : undefined
      });
    } else {
      poems = await dbManager.getAllPoems();
    }
    
    res.json({
      success: true,
      data: poems,
      total: poems.length
    });
  } catch (error) {
    console.error('获取诗词列表失败:', error);
    res.status(500).json({
      success: false,
      message: '获取诗词列表失败',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

app.get('/api/poems/:id', async (req: Request, res: Response) => {
  try {
    const poemId = parseInt(req.params.id);
    const poem = await dbManager.getPoemById(poemId);
    
    if (!poem) {
      res.status(404).json({
        success: false,
        message: '诗词未找到'
      });
      return;
    }
    
    // 获取评分统计
    const ratingStats = await dbManager.getRatingStats(poemId);
    
    res.json({
      success: true,
      data: {
        ...poem,
        rating_stats: ratingStats
      }
    });
  } catch (error) {
    console.error('获取诗词详情失败:', error);
    res.status(500).json({
      success: false,
      message: '获取诗词详情失败',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

app.get('/api/poems-stats', async (req: Request, res: Response) => {
  try {
    const stats = await dbManager.getPoemStats();
    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('获取诗词统计失败:', error);
    res.status(500).json({
      success: false,
      message: '获取诗词统计失败',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// === AI服务相关路由 ===
app.get('/api/ai/health', async (req: Request, res: Response) => {
  try {
    if (!aiManager) {
      res.status(503).json({
        success: false,
        message: 'AI服务未初始化'
      });
      return;
    }

    // 测试AI服务连接
    const testResult = await aiManager.generateText({ 
      prompt: '测试', 
      max_tokens: 10 
    });
    
    res.json({
      success: true,
      data: {
        service: 'DeepSeek',
        status: 'connected',
        model: process.env.DEEPSEEK_MODEL || 'deepseek-chat',
        test_response: testResult.success ? 
          (testResult.data ? testResult.data.substring(0, 50) + '...' : 'Success') : 
          'Failed'
      }
    });
  } catch (error) {
    res.status(503).json({
      success: false,
      message: 'AI服务连接失败',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

app.post('/api/ai/generate-text', async (req: Request, res: Response) => {
  try {
    if (!aiManager) {
      res.status(503).json({
        success: false,
        message: 'AI服务未初始化'
      });
      return;
    }

    const { prompt, options = {} } = req.body;
    
    if (!prompt) {
      res.status(400).json({
        success: false,
        message: '缺少prompt参数'
      });
      return;
    }

    const result = await aiManager.generateText({ 
      prompt, 
      ...options 
    });
    
    res.json({
      success: true,
      data: {
        text: result.success ? result.data : '生成失败',
        service: 'DeepSeek',
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('AI文本生成失败:', error);
    res.status(500).json({
      success: false,
      message: 'AI文本生成失败',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

app.post('/api/ai/generate-poetry-content', async (req: Request, res: Response) => {
  try {
    if (!aiManager) {
      res.status(503).json({
        success: false,
        message: 'AI服务未初始化'
      });
      return;
    }

    const { type, poem } = req.body;
    
    if (!type || !poem) {
      res.status(400).json({
        success: false,
        message: '缺少type或poem参数'
      });
      return;
    }

    let prompt = '';
    switch (type) {
      case 'hint':
        prompt = `为古诗《${poem.title}》作者${poem.author}的诗句"${poem.content}"生成一个学习提示，帮助学生理解诗句意境，不超过50字。`;
        break;
      case 'explanation':
        prompt = `详细解释古诗《${poem.title}》作者${poem.author}的意境和表达的情感，包括创作背景和艺术特色，约200字。`;
        break;
      case 'question':
        prompt = `基于古诗《${poem.title}》作者${poem.author}，生成3个有趣的学习问题，帮助学生更好地理解这首诗。`;
        break;
      default:
        res.status(400).json({
          success: false,
          message: '无效的type参数，支持: hint, explanation, question'
        });
        return;
    }

    const result = await aiManager.generateText({ 
      prompt,
      max_tokens: type === 'explanation' ? 800 : 300,
      temperature: 0.7 
    });
    
    res.json({
      success: true,
      data: {
        type,
        content: result.success ? result.data : '生成失败',
        poem_info: {
          title: poem.title,
          author: poem.author
        },
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('AI古诗内容生成失败:', error);
    res.status(500).json({
      success: false,
      message: 'AI古诗内容生成失败',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// AI图片生成API
app.post('/api/ai/generate-image', async (req: Request, res: Response) => {
  try {
    const { prompt } = req.body;
    
    if (!prompt) {
      res.status(400).json({
        success: false,
        message: '缺少prompt参数'
      });
      return;
    }

    // 由于我们目前没有实际的AI图片生成服务，返回占位图片
    // 实际项目中可以集成DALL-E、Midjourney或其他AI图片生成服务
    console.log(`图片生成请求: ${prompt}`);
    
    // 模拟生成过程 - 触发重启
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // 返回适合古诗意境的占位图片
    const imageIndex = Math.floor(Math.random() * 10) + 1;
    const imageUrl = `https://picsum.photos/1200/800?random=${imageIndex}&blur=1`;
    
    res.json({
      success: true,
      data: {
        imageUrl,
        prompt: prompt,
        style: 'chinese_classical',
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('AI图片生成失败:', error);
    res.status(500).json({
      success: false,
      message: 'AI图片生成失败',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// === N8N 工作流路由 ===
app.use('/api/n8n', n8nRouter);

// === 学习记录相关路由 ===
app.post('/api/learning/record', async (req: Request, res: Response) => {
  try {
    const recordData = req.body;
    const recordId = await dbManager.saveLearningRecord(recordData);
    
    res.json({
      success: true,
      data: {
        record_id: recordId
      },
      message: '学习记录保存成功'
    });
  } catch (error) {
    console.error('保存学习记录失败:', error);
    res.status(500).json({
      success: false,
      message: '保存学习记录失败',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

app.get('/api/learning/history/:userId', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const { limit = 10 } = req.query;
    
    const history = await dbManager.getLearningHistory(userId, parseInt(limit as string));
    
    res.json({
      success: true,
      data: history
    });
  } catch (error) {
    console.error('获取学习历史失败:', error);
    res.status(500).json({
      success: false,
      message: '获取学习历史失败',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// === 评分相关路由 ===
app.post('/api/ratings', async (req: Request, res: Response) => {
  try {
    const ratingData = req.body;
    const ratingId = await dbManager.saveRating(ratingData);
    
    res.json({
      success: true,
      data: {
        rating_id: ratingId
      },
      message: '评分保存成功'
    });
  } catch (error) {
    console.error('保存评分失败:', error);
    res.status(500).json({
      success: false,
      message: '保存评分失败',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// === 图片缓存相关路由 ===
app.get('/api/images/cache/:poemId', async (req: Request, res: Response) => {
  try {
    const { poemId } = req.params;
    const { prompt } = req.query;
    
    if (!prompt) {
      res.status(400).json({
        success: false,
        message: '缺少prompt参数'
      });
      return;
    }
    
    const cachedImage = await dbManager.getImageFromCache(parseInt(poemId), prompt as string);
    
    if (cachedImage) {
      res.json({
        success: true,
        data: cachedImage,
        cached: true
      });
    } else {
      res.json({
        success: true,
        data: null,
        cached: false
      });
    }
  } catch (error) {
    console.error('获取图片缓存失败:', error);
    res.status(500).json({
      success: false,
      message: '获取图片缓存失败',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// === 错误处理中间件 ===
app.use((error: any, req: Request, res: Response, next: any) => {
  console.error('未处理的错误:', error);
  res.status(500).json({
    success: false,
    message: '服务器内部错误',
    error: process.env.NODE_ENV === 'development' ? error.message : '服务器错误'
  });
});

// 404 处理
app.use('*', (req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    message: '接口不存在',
    path: req.originalUrl
  });
});

// 启动服务器
async function startServer() {
  try {
    // 初始化服务
    await initializeDatabase();
    initializeAI();
    
    // 启动服务器
    app.listen(PORT, () => {
      console.log(`🚀 服务器运行在 http://localhost:${PORT}`);
      console.log('📚 API端点:');
      console.log(`   - 健康检查: http://localhost:${PORT}/api/health`);
      console.log(`   - AI健康检查: http://localhost:${PORT}/api/ai/health`);
      console.log(`   - 诗词列表: http://localhost:${PORT}/api/poems`);
      console.log(`   - 诗词统计: http://localhost:${PORT}/api/poems-stats`);
    });
  } catch (error) {
    console.error('❌ 服务器启动失败:', error);
    process.exit(1);
  }
}

// 优雅关闭
process.on('SIGINT', async () => {
  console.log('\n正在关闭服务器...');
  if (dbManager) {
    await dbManager.close();
  }
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\n正在关闭服务器...');
  if (dbManager) {
    await dbManager.close();
  }
  process.exit(0);
});

// 启动服务器
startServer();


import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import morgan from 'morgan'
import dotenv from 'dotenv'
import { Sequelize } from 'sequelize'

// import poemsRouter from './routes/poems';
import aiRouter from './routes/ai';
import n8nRouter from './routes/n8n';
import configRouter from './routes/config';

// 加载环境变量
dotenv.config()

const app = express()
const PORT = process.env.PORT || 5000

// 中间件
app.use(helmet())
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}))
app.use(morgan('combined'))
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))

// 静态文件服务
app.use('/uploads', express.static('uploads'))

// 数据库连接
const sequelize = new Sequelize(process.env.MYSQL_DATABASE || 'poetry_learning', process.env.MYSQL_USER || 'root', process.env.MYSQL_PASSWORD || '', {
  host: process.env.MYSQL_HOST || 'localhost',
  dialect: 'mysql',
  logging: false
})

const connectDB = async () => {
  try {
    await sequelize.authenticate()
    console.log('✅ MySQL 连接成功')
  } catch (error) {
    console.error('❌ MySQL 连接失败:', error)
    process.exit(1)
  }
}

// 路由
// app.use('/api/poems', poemRoutes)  // 暂时注释掉，需要修复MongoDB/Mongoose相关问题
app.use('/api/n8n', n8nRouter);
app.use('/api/ai', aiRouter);
app.use('/api/config', configRouter);

// 健康检查
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  })
})

// 404 处理
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'API 端点不存在',
    path: req.originalUrl
  })
})

// 错误处理中间件
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('服务器错误:', err)
  
  res.status(err.status || 500).json({
    error: process.env.NODE_ENV === 'production' ? '服务器内部错误' : err.message,
    ...(process.env.NODE_ENV !== 'production' && { stack: err.stack })
  })
})

// 启动服务器
const startServer = async () => {
  try {
    await connectDB()
    
    // 启动n8n自动连接
    const { n8nConnectionManager } = await import('./services/N8nConnectionManager');
    console.log('🔌 初始化n8n连接管理器...');
    n8nConnectionManager.startAutoConnection().catch(error => {
      console.error('⚠️ n8n自动连接启动失败:', error.message);
    });
    
    app.listen(PORT, () => {
      console.log(`🚀 服务器运行在 http://localhost:${PORT}`)
      console.log(`📚 API 文档: http://localhost:${PORT}/api/health`)
      console.log(`🌍 环境: ${process.env.NODE_ENV || 'development'}`)
      console.log(`🤖 AI服务: DeepSeek (${process.env.DEEPSEEK_API_KEY ? '已配置' : '未配置'})`)
      console.log(`🔗 n8n连接: 自动连接到 ${process.env.N8N_BASE_URL || 'http://localhost:5678'}`)
    })
  } catch (error) {
    console.error('❌ 服务器启动失败:', error)
    process.exit(1)
  }
}

startServer()

// 优雅关闭
process.on('SIGTERM', () => {
  console.log('🔄 收到 SIGTERM 信号，正在关闭服务器...')
  sequelize.close()
  process.exit(0)
})

process.on('SIGINT', () => {
  console.log('🔄 收到 SIGINT 信号，正在关闭服务器...')
  sequelize.close()
  process.exit(0)
})
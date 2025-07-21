import { Request, Response, NextFunction } from 'express'
import Joi from 'joi'

// 诗词查询参数验证
export const validatePoemQuery = (req: Request, res: Response, next: NextFunction) => {
  const schema = Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(50).default(10),
    difficulty: Joi.string().valid('easy', 'medium', 'hard'),
    dynasty: Joi.string().max(20),
    author: Joi.string().max(50),
    tags: Joi.alternatives().try(
      Joi.string(),
      Joi.array().items(Joi.string())
    ),
    search: Joi.string().max(100)
  })

  const { error, value } = schema.validate(req.query)
  
  if (error) {
    return res.status(400).json({
      error: '查询参数无效',
      details: error.details.map(detail => detail.message)
    })
  }

  req.query = value
  return next()
}

// 诗词ID验证
export const validatePoemId = (req: Request, res: Response, next: NextFunction) => {
  const schema = Joi.object({
    id: Joi.string().alphanum().min(1).max(50).required()
  })

  const { error } = schema.validate(req.params)
  
  if (error) {
    return res.status(400).json({
      error: '诗词ID无效',
      details: error.details.map(detail => detail.message)
    })
  }

  return next()
}

// N8N工作流验证
export const validateN8nWorkflow = (req: Request, res: Response, next: NextFunction) => {
  const schema = Joi.object({
    workflowId: Joi.string().required(),
    data: Joi.object().required()
  })

  const { error } = schema.validate(req.body)
  
  if (error) {
    return res.status(400).json({
      error: '工作流数据无效',
      details: error.details.map(detail => detail.message)
    })
  }

  return next()
}

// AI请求验证
export const validateAiRequest = (req: Request, res: Response, next: NextFunction) => {
  const schema = Joi.object({
    type: Joi.string().valid('generate-hint', 'generate-image', 'analyze-poem').required(),
    data: Joi.object().required()
  })

  const { error } = schema.validate(req.body)
  
  if (error) {
    return res.status(400).json({
      error: 'AI请求数据无效',
      details: error.details.map(detail => detail.message)
    })
  }

  return next()
}

// 生成提示验证
export const validateGenerateHint = (req: Request, res: Response, next: NextFunction) => {
  const schema = Joi.object({
    poemId: Joi.string().required(),
    stepId: Joi.number().integer().min(1).required(),
    context: Joi.array().items(Joi.string()),
    currentLine: Joi.string().required(),
    blanks: Joi.array().items(Joi.object({
      position: Joi.number().integer().min(0).required(),
      answer: Joi.string().required()
    })).required()
  })

  const { error } = schema.validate(req.body)
  
  if (error) {
    return res.status(400).json({
      error: '生成提示请求数据无效',
      details: error.details.map(detail => detail.message)
    })
  }

  return next()
}

// 生成图片验证
export const validateGenerateImage = (req: Request, res: Response, next: NextFunction) => {
  const schema = Joi.object({
    poemId: Joi.string().required(),
    stepId: Joi.number().integer().min(1).required(),
    description: Joi.string().max(1000).required(),
    style: Joi.string().valid('traditional', 'ink-painting', 'realistic', 'artistic').default('traditional'),
    size: Joi.string().valid('256x256', '512x512', '1024x1024').default('512x512')
  })

  const { error } = schema.validate(req.body)
  
  if (error) {
    return res.status(400).json({
      error: '生成图片请求数据无效',
      details: error.details.map(detail => detail.message)
    })
  }

  return next()
}

// 学习进度验证
export const validateLearningProgress = (req: Request, res: Response, next: NextFunction) => {
  const schema = Joi.object({
    poemId: Joi.string().required(),
    stepId: Joi.number().integer().min(1).required(),
    userAnswers: Joi.array().items(Joi.string()).required(),
    timeSpent: Joi.number().integer().min(0),
    hintsUsed: Joi.number().integer().min(0).default(0)
  })

  const { error } = schema.validate(req.body)
  
  if (error) {
    return res.status(400).json({
      error: '学习进度数据无效',
      details: error.details.map(detail => detail.message)
    })
  }

  return next()
}

// 通用错误处理
export const handleValidationError = (error: Joi.ValidationError, req: Request, res: Response, next: NextFunction) => {
  return res.status(400).json({
    error: '请求数据验证失败',
    details: error.details.map(detail => ({
      field: detail.path.join('.'),
      message: detail.message,
      value: detail.context?.value
    }))
  })
}

// 文件上传验证
export const validateFileUpload = (req: Request, res: Response, next: NextFunction) => {
  if (!req.file) {
    return res.status(400).json({ error: '未找到上传文件' })
  }

  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'audio/mpeg', 'audio/wav']
  const maxSize = 10 * 1024 * 1024 // 10MB

  if (!allowedTypes.includes(req.file.mimetype)) {
    return res.status(400).json({ 
      error: '不支持的文件类型',
      allowedTypes: allowedTypes
    })
  }

  if (req.file.size > maxSize) {
    return res.status(400).json({ 
      error: '文件大小超出限制',
      maxSize: '10MB'
    })
  }

  return next()
}
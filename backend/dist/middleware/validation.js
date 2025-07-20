"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateFileUpload = exports.handleValidationError = exports.validateLearningProgress = exports.validateGenerateImage = exports.validateGenerateHint = exports.validateAiRequest = exports.validateN8nWorkflow = exports.validatePoemId = exports.validatePoemQuery = void 0;
const joi_1 = __importDefault(require("joi"));
const validatePoemQuery = (req, res, next) => {
    const schema = joi_1.default.object({
        page: joi_1.default.number().integer().min(1).default(1),
        limit: joi_1.default.number().integer().min(1).max(50).default(10),
        difficulty: joi_1.default.string().valid('easy', 'medium', 'hard'),
        dynasty: joi_1.default.string().max(20),
        author: joi_1.default.string().max(50),
        tags: joi_1.default.alternatives().try(joi_1.default.string(), joi_1.default.array().items(joi_1.default.string())),
        search: joi_1.default.string().max(100)
    });
    const { error, value } = schema.validate(req.query);
    if (error) {
        return res.status(400).json({
            error: '查询参数无效',
            details: error.details.map(detail => detail.message)
        });
    }
    req.query = value;
    next();
};
exports.validatePoemQuery = validatePoemQuery;
const validatePoemId = (req, res, next) => {
    const schema = joi_1.default.object({
        id: joi_1.default.string().alphanum().min(1).max(50).required()
    });
    const { error } = schema.validate(req.params);
    if (error) {
        return res.status(400).json({
            error: '诗词ID无效',
            details: error.details.map(detail => detail.message)
        });
    }
    next();
};
exports.validatePoemId = validatePoemId;
const validateN8nWorkflow = (req, res, next) => {
    const schema = joi_1.default.object({
        workflowId: joi_1.default.string().required(),
        data: joi_1.default.object().required()
    });
    const { error } = schema.validate(req.body);
    if (error) {
        return res.status(400).json({
            error: '工作流数据无效',
            details: error.details.map(detail => detail.message)
        });
    }
    next();
};
exports.validateN8nWorkflow = validateN8nWorkflow;
const validateAiRequest = (req, res, next) => {
    const schema = joi_1.default.object({
        type: joi_1.default.string().valid('generate-hint', 'generate-image', 'analyze-poem').required(),
        data: joi_1.default.object().required()
    });
    const { error } = schema.validate(req.body);
    if (error) {
        return res.status(400).json({
            error: 'AI请求数据无效',
            details: error.details.map(detail => detail.message)
        });
    }
    next();
};
exports.validateAiRequest = validateAiRequest;
const validateGenerateHint = (req, res, next) => {
    const schema = joi_1.default.object({
        poemId: joi_1.default.string().required(),
        stepId: joi_1.default.number().integer().min(1).required(),
        context: joi_1.default.array().items(joi_1.default.string()),
        currentLine: joi_1.default.string().required(),
        blanks: joi_1.default.array().items(joi_1.default.object({
            position: joi_1.default.number().integer().min(0).required(),
            answer: joi_1.default.string().required()
        })).required()
    });
    const { error } = schema.validate(req.body);
    if (error) {
        return res.status(400).json({
            error: '生成提示请求数据无效',
            details: error.details.map(detail => detail.message)
        });
    }
    next();
};
exports.validateGenerateHint = validateGenerateHint;
const validateGenerateImage = (req, res, next) => {
    const schema = joi_1.default.object({
        poemId: joi_1.default.string().required(),
        stepId: joi_1.default.number().integer().min(1).required(),
        description: joi_1.default.string().max(1000).required(),
        style: joi_1.default.string().valid('traditional', 'ink-painting', 'realistic', 'artistic').default('traditional'),
        size: joi_1.default.string().valid('256x256', '512x512', '1024x1024').default('512x512')
    });
    const { error } = schema.validate(req.body);
    if (error) {
        return res.status(400).json({
            error: '生成图片请求数据无效',
            details: error.details.map(detail => detail.message)
        });
    }
    next();
};
exports.validateGenerateImage = validateGenerateImage;
const validateLearningProgress = (req, res, next) => {
    const schema = joi_1.default.object({
        poemId: joi_1.default.string().required(),
        stepId: joi_1.default.number().integer().min(1).required(),
        userAnswers: joi_1.default.array().items(joi_1.default.string()).required(),
        timeSpent: joi_1.default.number().integer().min(0),
        hintsUsed: joi_1.default.number().integer().min(0).default(0)
    });
    const { error } = schema.validate(req.body);
    if (error) {
        return res.status(400).json({
            error: '学习进度数据无效',
            details: error.details.map(detail => detail.message)
        });
    }
    next();
};
exports.validateLearningProgress = validateLearningProgress;
const handleValidationError = (error, req, res, next) => {
    return res.status(400).json({
        error: '请求数据验证失败',
        details: error.details.map(detail => ({
            field: detail.path.join('.'),
            message: detail.message,
            value: detail.context?.value
        }))
    });
};
exports.handleValidationError = handleValidationError;
const validateFileUpload = (req, res, next) => {
    if (!req.file) {
        return res.status(400).json({ error: '未找到上传文件' });
    }
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'audio/mpeg', 'audio/wav'];
    const maxSize = 10 * 1024 * 1024;
    if (!allowedTypes.includes(req.file.mimetype)) {
        return res.status(400).json({
            error: '不支持的文件类型',
            allowedTypes: allowedTypes
        });
    }
    if (req.file.size > maxSize) {
        return res.status(400).json({
            error: '文件大小超出限制',
            maxSize: '10MB'
        });
    }
    next();
};
exports.validateFileUpload = validateFileUpload;
//# sourceMappingURL=validation.js.map
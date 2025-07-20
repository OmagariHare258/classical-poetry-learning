"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const DeepSeekAIManager_1 = require("../services/DeepSeekAIManager");
const router = (0, express_1.Router)();
router.get('/health', async (req, res) => {
    try {
        const deepSeekHealth = await DeepSeekAIManager_1.deepSeekAIManager.checkHealth();
        return res.json({
            success: true,
            services: {
                deepseek: {
                    status: deepSeekHealth ? 'healthy' : 'unavailable',
                    info: DeepSeekAIManager_1.deepSeekAIManager.getServiceInfo()
                }
            },
            primary_service: 'deepseek',
            timestamp: new Date().toISOString()
        });
    }
    catch (error) {
        return res.status(500).json({
            success: false,
            error: error.message
        });
    }
});
router.post('/generate-text', async (req, res) => {
    try {
        const { prompt, options = {} } = req.body;
        if (!prompt) {
            return res.status(400).json({
                success: false,
                error: '缺少prompt参数'
            });
        }
        const result = await DeepSeekAIManager_1.deepSeekAIManager.generateText({
            prompt,
            ...options
        });
        return res.json(result);
    }
    catch (error) {
        return res.status(500).json({
            success: false,
            error: error.message,
            service: 'deepseek'
        });
    }
});
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
        const result = await DeepSeekAIManager_1.deepSeekAIManager.generatePoetryContent(type, poem, context);
        return res.json(result);
    }
    catch (error) {
        return res.status(500).json({
            success: false,
            error: error.message
        });
    }
});
router.post('/generate-learning-advice', async (req, res) => {
    try {
        const { userProgress, preferences } = req.body;
        if (!userProgress) {
            return res.status(400).json({
                success: false,
                error: '缺少userProgress参数'
            });
        }
        const result = await DeepSeekAIManager_1.deepSeekAIManager.generateLearningAdvice(userProgress, preferences || {});
        return res.json(result);
    }
    catch (error) {
        return res.status(500).json({
            success: false,
            error: error.message
        });
    }
});
router.get('/config', (req, res) => {
    return res.json({
        success: true,
        config: {
            primary_service: 'deepseek',
            services: {
                deepseek: DeepSeekAIManager_1.deepSeekAIManager.getServiceInfo()
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
router.post('/test', async (req, res) => {
    try {
        const { prompt = '你好，请简单介绍一下你自己。' } = req.body;
        const result = await DeepSeekAIManager_1.deepSeekAIManager.generateText({ prompt });
        return res.json({
            success: true,
            test_result: result,
            service: 'deepseek',
            timestamp: new Date().toISOString()
        });
    }
    catch (error) {
        return res.status(500).json({
            success: false,
            error: error.message,
            service: 'deepseek'
        });
    }
});
exports.default = router;
//# sourceMappingURL=ai.js.map
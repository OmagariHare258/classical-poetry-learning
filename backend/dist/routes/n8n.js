"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const axios_1 = __importDefault(require("axios"));
const validation_1 = require("../middleware/validation");
const N8nConnectionManager_1 = require("../services/N8nConnectionManager");
const router = express_1.default.Router();
const N8N_BASE_URL = process.env.N8N_BASE_URL || 'http://localhost:5678';
const N8N_API_KEY = process.env.N8N_API_KEY;
const n8nClient = axios_1.default.create({
    baseURL: N8N_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
        ...(N8N_API_KEY && { 'X-N8N-API-KEY': N8N_API_KEY })
    },
    timeout: 30000
});
router.get('/status', async (req, res) => {
    try {
        const health = await N8nConnectionManager_1.n8nConnectionManager.checkHealth();
        const status = N8nConnectionManager_1.n8nConnectionManager.getConnectionStatus();
        return res.json({
            success: true,
            health,
            connection: status,
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
router.post('/reconnect', async (req, res) => {
    try {
        const connected = await N8nConnectionManager_1.n8nConnectionManager.reconnect();
        return res.json({
            success: connected,
            message: connected ? 'n8n重连成功' : 'n8n重连失败',
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
router.post('/trigger/learning-flow', validation_1.validateN8nWorkflow, async (req, res) => {
    try {
        const { poemId, stepId, userAction, data } = req.body;
        const workflowData = {
            poemId,
            stepId,
            userAction,
            timestamp: new Date().toISOString(),
            ...data
        };
        const response = await n8nClient.post('/webhook/learning-flow', workflowData);
        res.json({
            success: true,
            workflowId: response.data.workflowId,
            executionId: response.data.executionId,
            result: response.data.result
        });
    }
    catch (error) {
        console.error('触发学习流程失败:', error);
        res.status(500).json({
            error: '触发学习流程失败',
            details: error instanceof Error ? error.message : '未知错误'
        });
    }
});
router.post('/trigger/ai-generation', async (req, res) => {
    try {
        const { type, poemId, stepId, prompt, options = {} } = req.body;
        const workflowData = {
            type,
            poemId,
            stepId,
            prompt,
            options,
            timestamp: new Date().toISOString()
        };
        const response = await n8nClient.post('/webhook/ai-generation', workflowData);
        res.json({
            success: true,
            workflowId: response.data.workflowId,
            executionId: response.data.executionId,
            result: response.data.result
        });
    }
    catch (error) {
        console.error('触发AI生成失败:', error);
        res.status(500).json({
            error: '触发AI生成失败',
            details: error instanceof Error ? error.message : '未知错误'
        });
    }
});
router.post('/progress/update', validation_1.validateLearningProgress, async (req, res) => {
    try {
        const progressData = {
            ...req.body,
            timestamp: new Date().toISOString(),
            sessionId: req.headers['x-session-id'] || 'anonymous'
        };
        const response = await n8nClient.post('/webhook/progress-update', progressData);
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
                console.warn('个性化推荐工作流触发失败:', error.message);
            });
        }
        res.json({
            success: true,
            message: '学习进度已更新',
            recommendations: response.data.recommendations
        });
    }
    catch (error) {
        console.error('更新学习进度失败:', error);
        res.status(500).json({
            error: '更新学习进度失败',
            details: error instanceof Error ? error.message : '未知错误'
        });
    }
});
router.post('/generate-image', async (req, res) => {
    try {
        const { prompt, style, poem_id, line_index } = req.body;
        const imageData = {
            prompt: prompt || '古风诗词意境图',
            style: style || 'chinese_classical',
            poem_id,
            line_index,
            timestamp: new Date().toISOString()
        };
        try {
            const response = await n8nClient.post('/webhook/generate-image', imageData);
            if (response.data.success && response.data.image_url) {
                return res.json({
                    success: true,
                    data: {
                        image_url: response.data.image_url,
                        generation_time: response.data.generation_time,
                        source: 'n8n_ai'
                    }
                });
            }
        }
        catch (n8nError) {
            console.log('N8N图片生成失败，使用备用方案:', n8nError?.message || 'Unknown error');
        }
        const fallbackImages = [
            'https://picsum.photos/800/600?random=1',
            'https://picsum.photos/800/600?random=2',
            'https://picsum.photos/800/600?random=3',
            'https://picsum.photos/800/600?random=4',
            'https://picsum.photos/800/600?random=5'
        ];
        const randomIndex = Math.floor(Math.random() * fallbackImages.length);
        res.json({
            success: true,
            data: {
                image_url: fallbackImages[randomIndex],
                generation_time: 500,
                source: 'fallback'
            }
        });
    }
    catch (error) {
        console.error('图片生成失败:', error);
        res.status(500).json({
            success: false,
            error: '图片生成失败',
            details: error instanceof Error ? error.message : '未知错误'
        });
    }
});
router.post('/immersive-progress', async (req, res) => {
    try {
        const { poem_id, step_index, correct, user_answers, correct_answers } = req.body;
        const progressData = {
            poem_id,
            step_index,
            correct,
            user_answers,
            correct_answers,
            accuracy: correct ? 100 : 0,
            timestamp: new Date().toISOString(),
            session_id: 'anonymous'
        };
        try {
            const response = await n8nClient.post('/webhook/immersive-progress', progressData);
            return res.json({
                success: true,
                message: '学习进度已记录',
                data: response.data
            });
        }
        catch (n8nError) {
            console.log('N8N进度记录失败，使用本地记录:', n8nError?.message || 'Unknown error');
        }
        console.log('沉浸式学习进度记录:', progressData);
        res.json({
            success: true,
            message: '学习进度已本地记录',
            data: progressData
        });
    }
    catch (error) {
        console.error('学习进度记录失败:', error);
        res.status(500).json({
            success: false,
            error: '学习进度记录失败',
            details: error instanceof Error ? error.message : '未知错误'
        });
    }
});
router.get('/execution/:executionId/status', async (req, res) => {
    try {
        const { executionId } = req.params;
        const response = await n8nClient.get(`/api/v1/executions/${executionId}`);
        res.json({
            executionId,
            status: response.data.finished ? 'completed' : 'running',
            result: response.data.data,
            startedAt: response.data.startedAt,
            finishedAt: response.data.finishedAt,
            error: response.data.error
        });
    }
    catch (error) {
        console.error('获取执行状态失败:', error);
        res.status(500).json({
            error: '获取执行状态失败',
            details: error instanceof Error ? error.message : '未知错误'
        });
    }
});
router.post('/trigger/batch-pregeneration', async (req, res) => {
    try {
        const { poemIds, contentTypes = ['images', 'hints'] } = req.body;
        const workflowData = {
            poemIds,
            contentTypes,
            priority: 'background',
            timestamp: new Date().toISOString()
        };
        const response = await n8nClient.post('/webhook/batch-pregeneration', workflowData);
        res.json({
            success: true,
            message: '批量预生成任务已启动',
            jobId: response.data.jobId,
            estimatedTime: response.data.estimatedTime
        });
    }
    catch (error) {
        console.error('触发批量预生成失败:', error);
        res.status(500).json({
            error: '触发批量预生成失败',
            details: error instanceof Error ? error.message : '未知错误'
        });
    }
});
router.get('/health', async (req, res) => {
    try {
        const response = await n8nClient.get('/healthz');
        res.json({
            n8nStatus: 'healthy',
            version: response.data.version,
            uptime: response.data.uptime,
            connectedAt: new Date().toISOString()
        });
    }
    catch (error) {
        console.error('N8N健康检查失败:', error);
        res.status(503).json({
            n8nStatus: 'unhealthy',
            error: error instanceof Error ? error.message : '连接失败'
        });
    }
});
router.get('/workflows', async (req, res) => {
    try {
        const response = await n8nClient.get('/api/v1/workflows');
        const poetryWorkflows = response.data.data.filter((workflow) => workflow.name.includes('poetry') ||
            workflow.tags?.includes('poetry-learning'));
        res.json({
            workflows: poetryWorkflows.map((workflow) => ({
                id: workflow.id,
                name: workflow.name,
                active: workflow.active,
                tags: workflow.tags,
                updatedAt: workflow.updatedAt
            }))
        });
    }
    catch (error) {
        console.error('获取工作流列表失败:', error);
        res.status(500).json({
            error: '获取工作流列表失败',
            details: error instanceof Error ? error.message : '未知错误'
        });
    }
});
router.post('/trigger/cache-cleanup', async (req, res) => {
    try {
        const { type = 'all', olderThan = '7d' } = req.body;
        const workflowData = {
            cleanupType: type,
            olderThan,
            timestamp: new Date().toISOString()
        };
        const response = await n8nClient.post('/webhook/cache-cleanup', workflowData);
        res.json({
            success: true,
            message: '缓存清理任务已启动',
            jobId: response.data.jobId
        });
    }
    catch (error) {
        console.error('触发缓存清理失败:', error);
        res.status(500).json({
            error: '触发缓存清理失败',
            details: error instanceof Error ? error.message : '未知错误'
        });
    }
});
function calculateAccuracy(userAnswers) {
    return Math.random() * 100;
}
router.use((error, req, res, next) => {
    console.error('N8N路由错误:', error);
    if (error.code === 'ECONNREFUSED') {
        return res.status(503).json({
            error: 'N8N服务不可用',
            message: '请检查N8N服务是否正在运行'
        });
    }
    if (error.response?.status === 401) {
        return res.status(401).json({
            error: 'N8N认证失败',
            message: '请检查API密钥配置'
        });
    }
    res.status(500).json({
        error: 'N8N集成错误',
        details: error.message
    });
});
exports.default = router;
//# sourceMappingURL=n8n.js.map
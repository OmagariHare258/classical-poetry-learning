"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const DatabaseManager_1 = require("../database/DatabaseManager");
const ChineseAIManager_1 = require("../services/ChineseAIManager");
const SmartJudgeSystem_1 = require("../services/SmartJudgeSystem");
const crypto_1 = __importDefault(require("crypto"));
const router = express_1.default.Router();
router.get('/poems', async (req, res) => {
    try {
        const poems = await DatabaseManager_1.databaseManager.getPoems();
        const poemsWithRatings = await Promise.all(poems.map(async (poem) => {
            const ratings = await DatabaseManager_1.databaseManager.getPoemRatings(poem.id);
            return {
                ...poem,
                ratings: {
                    average_overall: ratings.average_overall,
                    total_ratings: ratings.total_ratings
                }
            };
        }));
        res.json({
            success: true,
            data: poemsWithRatings,
            pagination: {
                page: 1,
                limit: poemsWithRatings.length,
                total: poemsWithRatings.length
            }
        });
    }
    catch (error) {
        console.error('获取诗词列表失败:', error);
        res.status(500).json({
            success: false,
            error: '获取诗词列表失败'
        });
    }
});
router.get('/poems/:id', async (req, res) => {
    try {
        const poemId = parseInt(req.params.id);
        const poem = await DatabaseManager_1.databaseManager.getPoemById(poemId);
        if (!poem) {
            res.status(404).json({
                success: false,
                error: '诗词不存在'
            });
            return;
        }
        const ratings = await DatabaseManager_1.databaseManager.getPoemRatings(poemId);
        const imagePrompt = `${poem.title} ${poem.author} ${poem.content.substring(0, 20)}`;
        const cachedImage = await DatabaseManager_1.databaseManager.getImageFromCache(poemId, imagePrompt);
        res.json({
            success: true,
            data: {
                ...poem,
                ratings,
                cached_image: cachedImage
            }
        });
    }
    catch (error) {
        console.error('获取诗词详情失败:', error);
        res.status(500).json({
            success: false,
            error: '获取诗词详情失败'
        });
    }
});
router.post('/poems/:id/analyze', async (req, res) => {
    try {
        const poemId = parseInt(req.params.id);
        const { userAnswers, userId = 'guest' } = req.body;
        const poem = await DatabaseManager_1.databaseManager.getPoemById(poemId);
        if (!poem) {
            res.status(404).json({
                success: false,
                error: '诗词不存在'
            });
            return;
        }
        const analysis = await SmartJudgeSystem_1.smartJudgeSystem.analyzeUserAnswers(poemId, poem.content, userAnswers);
        await SmartJudgeSystem_1.smartJudgeSystem.updateLearningStats(poemId, userId, analysis);
        res.json({
            success: true,
            data: analysis
        });
    }
    catch (error) {
        console.error('学习分析失败:', error);
        res.status(500).json({
            success: false,
            error: '学习分析失败'
        });
    }
});
router.post('/poems/:id/generate-image', async (req, res) => {
    try {
        const poemId = parseInt(req.params.id);
        const { customPrompt, style = 'traditional', regenerate = false } = req.body;
        const poem = await DatabaseManager_1.databaseManager.getPoemById(poemId);
        if (!poem) {
            res.status(404).json({
                success: false,
                error: '诗词不存在'
            });
            return;
        }
        const basePrompt = customPrompt ||
            `中国古典诗词意境图：${poem.title}，${poem.author}，${poem.content}。${style}风格，唯美意境，水墨画风`;
        if (!regenerate) {
            const cachedImage = await DatabaseManager_1.databaseManager.getImageFromCache(poemId, basePrompt);
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
        const imageResult = await ChineseAIManager_1.chineseAIManager.generateImage({
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
        const caption = await ChineseAIManager_1.chineseAIManager.generateImageCaption(basePrompt, poem.content);
        const promptHash = crypto_1.default.createHash('md5').update(basePrompt).digest('hex');
        await DatabaseManager_1.databaseManager.saveImageToCache({
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
    }
    catch (error) {
        console.error('图片生成失败:', error);
        res.status(500).json({
            success: false,
            error: '图片生成失败'
        });
    }
});
router.post('/poems/:id/rating', async (req, res) => {
    try {
        const poemId = parseInt(req.params.id);
        const { content_rating, image_rating, overall_rating, comment, user_id = 'guest' } = req.body;
        if (!Number.isInteger(content_rating) || content_rating < 1 || content_rating > 5 ||
            !Number.isInteger(image_rating) || image_rating < 1 || image_rating > 5 ||
            !Number.isInteger(overall_rating) || overall_rating < 1 || overall_rating > 5) {
            res.status(400).json({
                success: false,
                error: '评分必须是1-5的整数'
            });
            return;
        }
        const poem = await DatabaseManager_1.databaseManager.getPoemById(poemId);
        if (!poem) {
            res.status(404).json({
                success: false,
                error: '诗词不存在'
            });
            return;
        }
        await DatabaseManager_1.databaseManager.saveRating({
            poem_id: poemId,
            user_id,
            content_rating,
            image_rating,
            overall_rating,
            comment
        });
        const updatedRatings = await DatabaseManager_1.databaseManager.getPoemRatings(poemId);
        res.json({
            success: true,
            data: updatedRatings
        });
    }
    catch (error) {
        console.error('保存评分失败:', error);
        res.status(500).json({
            success: false,
            error: '保存评分失败'
        });
    }
});
router.get('/poems/:id/ratings', async (req, res) => {
    try {
        const poemId = parseInt(req.params.id);
        const ratings = await DatabaseManager_1.databaseManager.getPoemRatings(poemId);
        res.json({
            success: true,
            data: ratings
        });
    }
    catch (error) {
        console.error('获取评分统计失败:', error);
        res.status(500).json({
            success: false,
            error: '获取评分统计失败'
        });
    }
});
router.get('/poems/:id/analytics', async (req, res) => {
    try {
        const poemId = parseInt(req.params.id);
        const analytics = await DatabaseManager_1.databaseManager.getLearningAnalytics(poemId);
        res.json({
            success: true,
            data: analytics
        });
    }
    catch (error) {
        console.error('获取学习分析失败:', error);
        res.status(500).json({
            success: false,
            error: '获取学习分析失败'
        });
    }
});
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
        const result = await ChineseAIManager_1.chineseAIManager.generateText({
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
    }
    catch (error) {
        console.error('AI文本生成失败:', error);
        res.status(500).json({
            success: false,
            error: 'AI文本生成失败'
        });
    }
});
router.get('/ai/services', async (req, res) => {
    try {
        const services = await DatabaseManager_1.databaseManager.getActiveAIServices();
        res.json({
            success: true,
            data: services
        });
    }
    catch (error) {
        console.error('获取AI服务失败:', error);
        res.status(500).json({
            success: false,
            error: '获取AI服务失败'
        });
    }
});
exports.default = router;
//# sourceMappingURL=enhanced-poems.js.map
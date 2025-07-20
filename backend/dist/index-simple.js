"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config({ path: '.env' });
console.log('🔧 环境变量检查:', {
    DB_HOST: process.env.DB_HOST,
    DB_PORT: process.env.DB_PORT,
    DB_USER: process.env.DB_USER,
    DB_PASSWORD: process.env.DB_PASSWORD ? '***已设置***' : '未设置',
    DB_NAME: process.env.DB_NAME
});
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const axios_1 = __importDefault(require("axios"));
const DatabaseManager_1 = require("./database/DatabaseManager");
const enhanced_poems_1 = __importDefault(require("./routes/enhanced-poems"));
const ai_1 = __importDefault(require("./routes/ai"));
const app = (0, express_1.default)();
const PORT = process.env.PORT || 5000;
const N8N_URL = process.env.N8N_URL || 'http://localhost:5678';
app.use((0, cors_1.default)({
    origin: [
        'http://localhost:3000',
        'http://localhost:3001',
        process.env.FRONTEND_URL || 'http://localhost:3000'
    ],
    credentials: true
}));
app.use(express_1.default.json());
async function initializeDatabase() {
    try {
        await DatabaseManager_1.databaseManager.initialize();
        console.log('✅ MySQL数据库连接成功');
    }
    catch (error) {
        console.error('❌ MySQL数据库连接失败:', error);
        process.exit(1);
    }
}
app.get('/api/health', (req, res) => {
    res.json({
        status: 'ok',
        message: '古诗文学习平台后端服务运行正常 (MySQL版本)',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        database: 'MySQL',
        features: [
            '中国AI服务优先',
            '智能正误判断',
            '图片缓存系统',
            '图片配文生成',
            '星级评分机制'
        ]
    });
});
app.use('/api', enhanced_poems_1.default);
app.use('/api/ai', ai_1.default);
const mockPoems = [
    {
        id: 'chunxiao',
        title: '春晓',
        author: '孟浩然',
        dynasty: '唐',
        content: ['春眠不觉晓', '处处闻啼鸟', '夜来风雨声', '花落知多少'],
        difficulty: 'easy',
        tags: ['春天', '写景', '惜春'],
        translation: '春天睡觉不知不觉天已亮，到处都听到鸟儿的啼鸣声。回想昨夜的风雨声，不知道有多少花朵被吹落了。',
        appreciation: '这首诗通过春晨的所见所闻，表达了诗人对春光的珍惜和对自然的热爱。'
    },
    {
        id: 'jingye',
        title: '静夜思',
        author: '李白',
        dynasty: '唐',
        content: ['床前明月光', '疑是地上霜', '举头望明月', '低头思故乡'],
        difficulty: 'easy',
        tags: ['思乡', '月夜', '抒情'],
        translation: '明亮的月光洒在床前，像是地上结了一层霜。抬头望向天空的明月，低头思念远方的故乡。',
        appreciation: '李白用简洁的语言描绘了月夜思乡的情景，表达了游子对故乡深切的思念之情。'
    },
    {
        id: 'dengque',
        title: '登鹳雀楼',
        author: '王之涣',
        dynasty: '唐',
        content: ['白日依山尽', '黄河入海流', '欲穷千里目', '更上一层楼'],
        difficulty: 'medium',
        tags: ['登高', '哲理', '励志'],
        translation: '夕阳依傍着西山慢慢沉没，滔滔黄河朝着东海汹涌奔流。若想把千里的风光景物看够，那就要登上更高的一层城楼。',
        appreciation: '这首诗借登楼远望的经历，揭示了"站得高，看得远"的哲理，成为千古传诵的名句。'
    },
    {
        id: 'liangzhou',
        title: '凉州词',
        author: '王翰',
        dynasty: '唐',
        content: ['葡萄美酒夜光杯', '欲饮琵琶马上催', '醉卧沙场君莫笑', '古来征战几人回'],
        difficulty: 'medium',
        tags: ['边塞', '豪放', '战争'],
        translation: '新酿的葡萄美酒，盛满夜光杯；正想开怀畅饮，马上琵琶声频催。即使醉倒沙场，请君不要见笑；自古男儿出征，有几人活着归回？',
        appreciation: '这首诗描写了边塞将士的豪迈气概，表现了他们视死如归的英雄主义精神。'
    },
    {
        id: 'chibi',
        title: '赤壁',
        author: '杜牧',
        dynasty: '唐',
        content: ['折戟沉沙铁未销', '自将磨洗认前朝', '东风不与周郎便', '铜雀春深锁二乔'],
        difficulty: 'hard',
        tags: ['咏史', '怀古', '议论'],
        translation: '折断的戟沉没在沙中铁质仍未锈蚀，自己将它磨洗后认出是前朝遗物。如果东风不给周瑜以方便，铜雀台就会深深地锁住大乔小乔了。',
        appreciation: '诗人通过赤壁之战的史实，感叹历史的偶然性，体现了对英雄人物的景仰。'
    },
    {
        id: 'wanglushan',
        title: '望庐山瀑布',
        author: '李白',
        dynasty: '唐',
        content: ['日照香炉生紫烟', '遥看瀑布挂前川', '飞流直下三千尺', '疑是银河落九天'],
        difficulty: 'medium',
        tags: ['写景', '瀑布', '想象'],
        translation: '阳光照射香炉峰生出袅袅紫烟，远远望去瀑布像白练挂在山前。水流飞泻直下三千尺，好像是银河从九天垂落人间。',
        appreciation: '李白运用丰富的想象和夸张的手法，生动地描绘了庐山瀑布的壮观景象。'
    },
    {
        id: 'dushushanfang',
        title: '读书山房',
        author: '翁森',
        dynasty: '明',
        content: ['读书切戒在慌忙', '涵泳工夫兴味长', '未晓不妨权放过', '切身须要急思量'],
        difficulty: 'hard',
        tags: ['读书', '治学', '哲理'],
        translation: '读书最忌讳的是匆忙急躁，细心涵养的功夫能让兴趣持久。不明白的地方不妨暂时放过，切身相关的问题必须认真思考。',
        appreciation: '这首诗阐述了读书治学的方法，强调要细心涵养，不可急躁，体现了古人治学的智慧。'
    },
    {
        id: 'shanxing',
        title: '山行',
        author: '杜牧',
        dynasty: '唐',
        content: ['远上寒山石径斜', '白云深处有人家', '停车坐爱枫林晚', '霜叶红于二月花'],
        difficulty: 'easy',
        tags: ['秋景', '写景', '抒情'],
        translation: '沿着弯弯曲曲的小路上山，在那白云深处，还住着几户人家。停下车来，是因为喜爱这深秋枫林晚景。霜叶红艳，胜过二月春花。',
        appreciation: '诗人通过对秋山红叶的描绘，表达了对大自然美景的赞美和热爱之情。'
    },
    {
        id: 'ailianshuopian',
        title: '爱莲说(节选)',
        author: '周敦颐',
        dynasty: '宋',
        content: ['水陆草木之花', '可爱者甚蕃', '晋陶渊明独爱菊', '自李唐来世人甚爱牡丹', '予独爱莲之出淤泥而不染', '濯清涟而不妖'],
        difficulty: 'hard',
        tags: ['咏物', '哲理', '品德'],
        translation: '水上、陆地上各种草本木本的花，值得喜爱的很多。晋代的陶渊明唯独喜爱菊花。从李氏唐朝以来，世人大多喜爱牡丹。我唯独喜爱莲花从污泥中长出来，却不被污染。',
        appreciation: '通过对莲花品格的赞美，表达了作者不同流俗、洁身自好的品格追求。'
    }
];
app.get('/api/poems', (req, res) => {
    const { difficulty, dynasty, tag, page = 1, limit = 10 } = req.query;
    let filteredPoems = [...mockPoems];
    if (difficulty) {
        filteredPoems = filteredPoems.filter(poem => poem.difficulty === difficulty);
    }
    if (dynasty) {
        filteredPoems = filteredPoems.filter(poem => poem.dynasty === dynasty);
    }
    if (tag) {
        filteredPoems = filteredPoems.filter(poem => poem.tags.includes(tag));
    }
    const startIndex = (Number(page) - 1) * Number(limit);
    const endIndex = startIndex + Number(limit);
    const paginatedPoems = filteredPoems.slice(startIndex, endIndex);
    res.json({
        success: true,
        data: paginatedPoems,
        total: filteredPoems.length,
        page: Number(page),
        limit: Number(limit)
    });
});
app.get('/api/poems/:id', (req, res) => {
    const poem = mockPoems.find(p => p.id === req.params.id);
    if (poem) {
        res.json({
            success: true,
            data: poem
        });
    }
    else {
        res.status(404).json({
            success: false,
            error: '诗词不存在'
        });
    }
});
app.get('/api/poems/stats/overview', (req, res) => {
    const totalPoems = mockPoems.length;
    const difficultyStats = mockPoems.reduce((acc, poem) => {
        acc[poem.difficulty] = (acc[poem.difficulty] || 0) + 1;
        return acc;
    }, {});
    const dynastyStats = mockPoems.reduce((acc, poem) => {
        acc[poem.dynasty] = (acc[poem.dynasty] || 0) + 1;
        return acc;
    }, {});
    const allTags = mockPoems.flatMap(poem => poem.tags);
    const tagStats = allTags.reduce((acc, tag) => {
        acc[tag] = (acc[tag] || 0) + 1;
        return acc;
    }, {});
    res.json({
        success: true,
        data: {
            totalPoems,
            difficultyStats,
            dynastyStats,
            tagStats
        }
    });
});
app.get('/api/poems/search/suggestions', (req, res) => {
    const { q } = req.query;
    if (!q || q.length < 1) {
        return res.json({ success: true, data: [] });
    }
    const query = q.toLowerCase();
    const suggestions = mockPoems.filter(poem => poem.title.toLowerCase().includes(query) ||
        poem.author.toLowerCase().includes(query) ||
        poem.content.some(line => line.toLowerCase().includes(query))).slice(0, 5).map(poem => ({
        id: poem.id,
        title: poem.title,
        author: poem.author,
        dynasty: poem.dynasty
    }));
    return res.json({
        success: true,
        data: suggestions
    });
});
app.post('/api/n8n/generate-poem', async (req, res) => {
    try {
        const { theme, style, difficulty } = req.body;
        const response = await axios_1.default.post(`${N8N_URL}/webhook/generate-poem`, {
            theme,
            style,
            difficulty
        });
        return res.json({
            success: true,
            data: response.data
        });
    }
    catch (error) {
        console.error('调用n8n生成诗词失败:', error);
        return res.status(500).json({
            success: false,
            error: '生成诗词失败，请稍后重试'
        });
    }
});
app.post('/api/n8n/generate-image', async (req, res) => {
    try {
        const { poemId, description } = req.body;
        const response = await axios_1.default.post(`${N8N_URL}/webhook/generate-image`, {
            poemId,
            description
        });
        return res.json({
            success: true,
            data: response.data
        });
    }
    catch (error) {
        console.error('调用n8n生成图片失败:', error);
        return res.status(500).json({
            success: false,
            error: '生成图片失败，请稍后重试'
        });
    }
});
app.post('/api/n8n/track-progress', async (req, res) => {
    try {
        const { userId, poemId, action, score } = req.body;
        const response = await axios_1.default.post(`${N8N_URL}/webhook/track-progress`, {
            userId,
            poemId,
            action,
            score,
            timestamp: new Date().toISOString()
        });
        return res.json({
            success: true,
            data: response.data
        });
    }
    catch (error) {
        console.error('调用n8n追踪学习进度失败:', error);
        return res.status(500).json({
            success: false,
            error: '记录学习进度失败'
        });
    }
});
app.post('/api/n8n/get-recommendations', async (req, res) => {
    try {
        const { userId, preferences } = req.body;
        const response = await axios_1.default.post(`${N8N_URL}/webhook/get-recommendations`, {
            userId,
            preferences
        });
        return res.json({
            success: true,
            data: response.data
        });
    }
    catch (error) {
        console.error('调用n8n获取推荐失败:', error);
        const fallbackRecommendations = mockPoems
            .filter(poem => poem.difficulty === 'easy')
            .slice(0, 3);
        return res.json({
            success: true,
            data: {
                recommendations: fallbackRecommendations,
                source: 'fallback'
            }
        });
    }
});
app.get('/api/n8n/status', async (req, res) => {
    try {
        const response = await axios_1.default.get(`${N8N_URL}/`, { timeout: 3000 });
        if (response.status === 200) {
            return res.json({
                success: true,
                data: {
                    status: 'connected',
                    activeWorkflows: 0,
                    version: 'n8n服务正常运行'
                }
            });
        }
        else {
            throw new Error('n8n服务响应异常');
        }
    }
    catch (error) {
        return res.json({
            success: false,
            data: {
                status: 'disconnected',
                error: 'n8n服务不可用'
            }
        });
    }
});
app.post('/api/n8n/learning-assistant', async (req, res) => {
    try {
        const { action, poemId, question, difficulty } = req.body;
        const response = await axios_1.default.post(`${N8N_URL}/webhook/learning-assistant`, {
            action,
            poemId,
            question,
            difficulty,
            timestamp: new Date().toISOString()
        });
        return res.json({
            success: true,
            data: response.data
        });
    }
    catch (error) {
        const mockResponse = {
            type: req.body.action || 'suggestion',
            suggestions: [
                '多读几遍，理解诗意',
                '查阅作者背景资料',
                '注意古文的语言特色',
                '结合时代背景理解'
            ],
            timestamp: new Date().toISOString()
        };
        return res.json({
            success: true,
            data: {
                source: 'fallback',
                ...mockResponse
            }
        });
    }
});
app.post('/api/n8n/assessment', async (req, res) => {
    try {
        const { answers, poemId, testType } = req.body;
        const response = await axios_1.default.post(`${N8N_URL}/webhook/assessment`, {
            answers,
            poemId,
            testType,
            timestamp: new Date().toISOString()
        });
        return res.json({
            success: true,
            data: response.data
        });
    }
    catch (error) {
        const score = req.body.answers ?
            Math.min(100, 60 + req.body.answers.length * 10) : 0;
        const mockAssessment = {
            score: score,
            maxScore: 100,
            level: score >= 90 ? '优秀' : score >= 75 ? '良好' : score >= 60 ? '及格' : '需要努力',
            feedback: ['继续努力学习'],
            recommendations: ['多练习', '加强理解'],
            timestamp: new Date().toISOString()
        };
        return res.json({
            success: true,
            data: {
                source: 'fallback',
                ...mockAssessment
            }
        });
    }
});
app.post('/api/n8n/progress-analytics', async (req, res) => {
    try {
        const { userId, timeRange, analysisType } = req.body;
        const response = await axios_1.default.post(`${N8N_URL}/webhook/progress-analytics`, {
            userId,
            timeRange,
            analysisType,
            timestamp: new Date().toISOString()
        });
        return res.json({
            success: true,
            data: response.data
        });
    }
    catch (error) {
        const mockProgress = {
            userId: req.body.userId,
            summary: {
                totalStudyTime: 1250,
                poemsStudied: 15,
                averageScore: 78,
                studyStreak: 12
            },
            trends: {
                scoresTrend: 'improving',
                efficiency: 'medium'
            },
            insights: ['学习进步明显'],
            recommendations: ['保持当前学习方法'],
            timestamp: new Date().toISOString()
        };
        return res.json({
            success: true,
            data: {
                source: 'fallback',
                ...mockProgress
            }
        });
    }
});
app.use('*', (req, res) => {
    res.status(404).json({
        error: 'API 端点不存在',
        path: req.originalUrl
    });
});
async function startServer() {
    await initializeDatabase();
    app.listen(PORT, () => {
        console.log(`🚀 服务器运行在 http://localhost:${PORT}`);
        console.log(`📚 API 健康检查: http://localhost:${PORT}/api/health`);
        console.log(`🌍 环境: ${process.env.NODE_ENV || 'development'}`);
        console.log(`💾 数据库: MySQL`);
        console.log(`🤖 AI服务: 中国国内AI优先`);
    });
}
process.on('SIGINT', async () => {
    console.log('\n📴 正在关闭服务器...');
    await DatabaseManager_1.databaseManager.close();
    process.exit(0);
});
process.on('SIGTERM', async () => {
    console.log('\n📴 正在关闭服务器...');
    await DatabaseManager_1.databaseManager.close();
    process.exit(0);
});
startServer().catch(error => {
    console.error('❌ 服务器启动失败:', error);
    process.exit(1);
});
//# sourceMappingURL=index-simple.js.map
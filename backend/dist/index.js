"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const morgan_1 = __importDefault(require("morgan"));
const dotenv_1 = __importDefault(require("dotenv"));
const sequelize_1 = require("sequelize");
const ai_1 = __importDefault(require("./routes/ai"));
const n8n_1 = __importDefault(require("./routes/n8n"));
const config_1 = __importDefault(require("./routes/config"));
dotenv_1.default.config();
const app = (0, express_1.default)();
const PORT = process.env.PORT || 5000;
app.use((0, helmet_1.default)());
app.use((0, cors_1.default)({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true
}));
app.use((0, morgan_1.default)('combined'));
app.use(express_1.default.json({ limit: '10mb' }));
app.use(express_1.default.urlencoded({ extended: true, limit: '10mb' }));
app.use('/uploads', express_1.default.static('uploads'));
const sequelize = new sequelize_1.Sequelize(process.env.MYSQL_DATABASE || 'poetry_learning', process.env.MYSQL_USER || 'root', process.env.MYSQL_PASSWORD || '', {
    host: process.env.MYSQL_HOST || 'localhost',
    dialect: 'mysql',
    logging: false
});
const connectDB = async () => {
    try {
        await sequelize.authenticate();
        console.log('✅ MySQL 连接成功');
    }
    catch (error) {
        console.error('❌ MySQL 连接失败:', error);
        process.exit(1);
    }
};
app.use('/api/n8n', n8n_1.default);
app.use('/api/ai', ai_1.default);
app.use('/api/config', config_1.default);
app.get('/api/health', (req, res) => {
    res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        uptime: process.uptime()
    });
});
app.use('*', (req, res) => {
    res.status(404).json({
        error: 'API 端点不存在',
        path: req.originalUrl
    });
});
app.use((err, req, res, next) => {
    console.error('服务器错误:', err);
    res.status(err.status || 500).json({
        error: process.env.NODE_ENV === 'production' ? '服务器内部错误' : err.message,
        ...(process.env.NODE_ENV !== 'production' && { stack: err.stack })
    });
});
const startServer = async () => {
    try {
        await connectDB();
        const { n8nConnectionManager } = await Promise.resolve().then(() => __importStar(require('./services/N8nConnectionManager')));
        console.log('🔌 初始化n8n连接管理器...');
        n8nConnectionManager.startAutoConnection().catch(error => {
            console.error('⚠️ n8n自动连接启动失败:', error.message);
        });
        app.listen(PORT, () => {
            console.log(`🚀 服务器运行在 http://localhost:${PORT}`);
            console.log(`📚 API 文档: http://localhost:${PORT}/api/health`);
            console.log(`🌍 环境: ${process.env.NODE_ENV || 'development'}`);
            console.log(`🤖 AI服务: DeepSeek (${process.env.DEEPSEEK_API_KEY ? '已配置' : '未配置'})`);
            console.log(`🔗 n8n连接: 自动连接到 ${process.env.N8N_BASE_URL || 'http://localhost:5678'}`);
        });
    }
    catch (error) {
        console.error('❌ 服务器启动失败:', error);
        process.exit(1);
    }
};
startServer();
process.on('SIGTERM', () => {
    console.log('🔄 收到 SIGTERM 信号，正在关闭服务器...');
    sequelize.close();
    process.exit(0);
});
process.on('SIGINT', () => {
    console.log('🔄 收到 SIGINT 信号，正在关闭服务器...');
    sequelize.close();
    process.exit(0);
});
//# sourceMappingURL=index.js.map
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const router = (0, express_1.Router)();
const ENV_FILE_PATH = path_1.default.join(process.cwd(), '.env');
router.get('/env', async (req, res) => {
    try {
        if (!fs_1.default.existsSync(ENV_FILE_PATH)) {
            return res.status(404).json({
                success: false,
                error: '环境配置文件不存在'
            });
        }
        const content = fs_1.default.readFileSync(ENV_FILE_PATH, 'utf-8');
        return res.json({
            success: true,
            content: content,
            path: ENV_FILE_PATH,
            size: content.length
        });
    }
    catch (error) {
        console.error('❌ 读取.env文件失败:', error);
        return res.status(500).json({
            success: false,
            error: '读取配置文件失败: ' + error.message
        });
    }
});
router.post('/env', async (req, res) => {
    try {
        const { content } = req.body;
        if (typeof content !== 'string') {
            return res.status(400).json({
                success: false,
                error: '无效的文件内容'
            });
        }
        if (fs_1.default.existsSync(ENV_FILE_PATH)) {
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            const backupPath = `${ENV_FILE_PATH}.backup.${timestamp}`;
            fs_1.default.copyFileSync(ENV_FILE_PATH, backupPath);
            console.log(`📋 已创建备份文件: ${backupPath}`);
        }
        fs_1.default.writeFileSync(ENV_FILE_PATH, content, 'utf-8');
        console.log('✅ .env文件已更新');
        res.json({
            success: true,
            message: '配置文件保存成功',
            size: content.length
        });
        setTimeout(() => {
            console.log('🔄 配置文件已更新，准备重启服务器...');
            if (process.env.NODE_ENV === 'development') {
                process.exit(0);
            }
            else {
                process.kill(process.pid, 'SIGTERM');
            }
        }, 1000);
        return;
    }
    catch (error) {
        console.error('❌ 保存.env文件失败:', error);
        return res.status(500).json({
            success: false,
            error: '保存配置文件失败: ' + error.message
        });
    }
});
router.get('/env/info', async (req, res) => {
    try {
        if (!fs_1.default.existsSync(ENV_FILE_PATH)) {
            return res.status(404).json({
                success: false,
                error: '环境配置文件不存在'
            });
        }
        const stats = fs_1.default.statSync(ENV_FILE_PATH);
        const content = fs_1.default.readFileSync(ENV_FILE_PATH, 'utf-8');
        const lines = content.split('\n').filter(line => line.trim() && !line.trim().startsWith('#'));
        return res.json({
            success: true,
            info: {
                path: ENV_FILE_PATH,
                size: stats.size,
                lastModified: stats.mtime,
                configCount: lines.length,
                lineCount: content.split('\n').length
            }
        });
    }
    catch (error) {
        console.error('❌ 获取.env文件信息失败:', error);
        return res.status(500).json({
            success: false,
            error: '获取文件信息失败: ' + error.message
        });
    }
});
router.post('/env/validate', async (req, res) => {
    try {
        const { content } = req.body;
        if (typeof content !== 'string') {
            return res.status(400).json({
                success: false,
                error: '无效的文件内容'
            });
        }
        const errors = [];
        const warnings = [];
        const lines = content.split('\n');
        lines.forEach((line, index) => {
            const lineNumber = index + 1;
            const trimmedLine = line.trim();
            if (!trimmedLine || trimmedLine.startsWith('#')) {
                return;
            }
            if (!trimmedLine.includes('=')) {
                errors.push(`第 ${lineNumber} 行: 缺少等号 (=)`);
                return;
            }
            const [key, ...valueParts] = trimmedLine.split('=');
            const value = valueParts.join('=');
            if (!key.trim()) {
                errors.push(`第 ${lineNumber} 行: 缺少变量名`);
            }
            else if (!/^[A-Z_][A-Z0-9_]*$/i.test(key.trim())) {
                warnings.push(`第 ${lineNumber} 行: 变量名 "${key.trim()}" 建议使用大写字母和下划线`);
            }
            if (!value.trim()) {
                warnings.push(`第 ${lineNumber} 行: 变量 "${key.trim()}" 的值为空`);
            }
        });
        return res.json({
            success: true,
            valid: errors.length === 0,
            errors,
            warnings,
            lineCount: lines.length,
            configCount: lines.filter(line => line.trim() && !line.trim().startsWith('#') && line.includes('=')).length
        });
    }
    catch (error) {
        console.error('❌ 验证.env文件失败:', error);
        return res.status(500).json({
            success: false,
            error: '验证配置文件失败: ' + error.message
        });
    }
});
exports.default = router;
//# sourceMappingURL=config.js.map
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.databaseManager = void 0;
exports.getDatabaseManager = getDatabaseManager;
const promise_1 = __importDefault(require("mysql2/promise"));
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const crypto_1 = __importDefault(require("crypto"));
class DatabaseManager {
    constructor() {
        this.db = null;
        this.config = {
            host: process.env.DB_HOST || 'localhost',
            port: parseInt(process.env.DB_PORT || '3306'),
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '',
            database: process.env.DB_NAME || 'poetry_learning',
            charset: 'utf8mb4'
        };
        console.log('🔧 数据库配置:', {
            host: this.config.host,
            port: this.config.port,
            user: this.config.user,
            password: this.config.password ? '***已设置***' : '未设置',
            database: this.config.database
        });
    }
    async initialize() {
        try {
            const tempConnection = await promise_1.default.createConnection({
                host: this.config.host,
                port: this.config.port,
                user: this.config.user,
                password: this.config.password,
                charset: this.config.charset
            });
            await tempConnection.execute(`CREATE DATABASE IF NOT EXISTS ${this.config.database} CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
            await tempConnection.end();
            this.db = await promise_1.default.createConnection(this.config);
            const initSQL = fs_1.default.readFileSync(path_1.default.join(__dirname, 'init.sql'), 'utf-8');
            const statements = initSQL
                .split(';')
                .map(stmt => stmt.trim())
                .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));
            for (const statement of statements) {
                if (statement.trim()) {
                    try {
                        await this.db.execute(statement);
                    }
                    catch (error) {
                        if (error.code === 'ER_DUP_KEYNAME' ||
                            error.code === 'ER_TABLE_EXISTS_ERROR' ||
                            error.code === 'ER_DUP_ENTRY') {
                            console.log(`⚠️ 跳过重复创建: ${error.sqlMessage}`);
                            continue;
                        }
                        throw error;
                    }
                }
            }
            console.log('✅ MySQL数据库初始化完成');
        }
        catch (error) {
            console.error('❌ MySQL数据库初始化失败:', error);
            throw error;
        }
    }
    async getImageFromCache(poemId, prompt) {
        if (!this.db)
            await this.initialize();
        const promptHash = this.generatePromptHash(prompt);
        const [rows] = await this.db.execute('SELECT * FROM poem_images WHERE poem_id = ? AND prompt_hash = ?', [poemId, promptHash]);
        return rows.length > 0 ? rows[0] : null;
    }
    async saveImageToCache(imageData) {
        if (!this.db)
            await this.initialize();
        const [result] = await this.db.execute(`INSERT INTO poem_images 
       (poem_id, prompt_hash, image_url, image_path, ai_service, generation_params, caption)
       VALUES (?, ?, ?, ?, ?, ?, ?)`, [
            imageData.poem_id,
            imageData.prompt_hash,
            imageData.image_url,
            imageData.image_path,
            imageData.ai_service,
            JSON.stringify(imageData.generation_params),
            imageData.caption
        ]);
        return result.insertId;
    }
    async saveRating(rating) {
        if (!this.db)
            await this.initialize();
        await this.db.execute(`INSERT INTO poem_ratings 
       (poem_id, user_id, content_rating, image_rating, overall_rating, comment)
       VALUES (?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
       content_rating = VALUES(content_rating),
       image_rating = VALUES(image_rating), 
       overall_rating = VALUES(overall_rating),
       comment = VALUES(comment)`, [
            rating.poem_id,
            rating.user_id,
            rating.content_rating,
            rating.image_rating,
            rating.overall_rating,
            rating.comment
        ]);
    }
    async getPoemRatings(poemId) {
        if (!this.db)
            await this.initialize();
        const [averageRows] = await this.db.execute(`SELECT 
        AVG(content_rating) as avg_content,
        AVG(image_rating) as avg_image,
        AVG(overall_rating) as avg_overall,
        COUNT(*) as total
       FROM poem_ratings WHERE poem_id = ?`, [poemId]);
        const [ratingRows] = await this.db.execute('SELECT * FROM poem_ratings WHERE poem_id = ? ORDER BY created_at DESC', [poemId]);
        const averages = averageRows[0] || {};
        return {
            average_content: Math.round((averages.avg_content || 0) * 10) / 10,
            average_image: Math.round((averages.avg_image || 0) * 10) / 10,
            average_overall: Math.round((averages.avg_overall || 0) * 10) / 10,
            total_ratings: averages.total || 0,
            ratings: ratingRows
        };
    }
    async saveLearningRecord(record) {
        if (!this.db)
            await this.initialize();
        const [result] = await this.db.execute(`INSERT INTO user_learning_records 
       (user_id, poem_id, learning_mode, answers, score, accuracy_rate, completion_status, completion_time)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`, [
            record.user_id,
            record.poem_id,
            record.learning_mode,
            JSON.stringify(record.answers),
            record.score,
            record.accuracy_rate,
            record.completion_status,
            record.completion_time
        ]);
        await this.updateLearningAnalytics(record.poem_id, record.answers);
        return result.insertId;
    }
    async updateLearningAnalytics(poemId, answers) {
        if (!this.db)
            await this.initialize();
        for (const [position, answerData] of Object.entries(answers)) {
            const pos = parseInt(position);
            const data = answerData;
            await this.db.execute(`INSERT INTO learning_analytics 
         (poem_id, character_position, character_text, wrong_attempts, success_rate, common_mistakes)
         VALUES (?, ?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE
         wrong_attempts = VALUES(wrong_attempts),
         success_rate = VALUES(success_rate),
         common_mistakes = VALUES(common_mistakes)`, [
                poemId,
                pos,
                data.correct,
                JSON.stringify(data.attempts || []),
                data.success_rate || 0,
                JSON.stringify(data.mistakes || [])
            ]);
        }
    }
    async getLearningAnalytics(poemId) {
        if (!this.db)
            await this.initialize();
        const [rows] = await this.db.execute('SELECT * FROM learning_analytics WHERE poem_id = ? ORDER BY character_position', [poemId]);
        return rows.reduce((acc, item) => {
            acc[item.character_position] = {
                character: item.character_text,
                success_rate: item.success_rate,
                wrong_attempts: JSON.parse(item.wrong_attempts || '[]'),
                common_mistakes: JSON.parse(item.common_mistakes || '[]')
            };
            return acc;
        }, {});
    }
    async getActiveAIServices(type) {
        if (!this.db)
            await this.initialize();
        let query = 'SELECT * FROM ai_service_configs WHERE is_active = 1';
        const params = [];
        if (type) {
            query += ' AND (service_type = ? OR service_type = "both")';
            params.push(type);
        }
        query += ' ORDER BY priority ASC';
        const [rows] = await this.db.execute(query, params);
        return rows;
    }
    async updateAIServiceConfig(serviceName, config) {
        if (!this.db)
            await this.initialize();
        const setClause = Object.keys(config)
            .map(key => `${key} = ?`)
            .join(', ');
        const values = Object.values(config);
        values.push(serviceName);
        await this.db.execute(`UPDATE ai_service_configs SET ${setClause}, updated_at = CURRENT_TIMESTAMP WHERE service_name = ?`, values);
    }
    generatePromptHash(prompt) {
        return crypto_1.default.createHash('md5').update(prompt).digest('hex');
    }
    async getPoems(filters) {
        if (!this.db)
            await this.initialize();
        let query = 'SELECT * FROM poems';
        const params = [];
        const conditions = [];
        if (filters?.dynasty) {
            conditions.push('dynasty = ?');
            params.push(filters.dynasty);
        }
        if (filters?.difficulty) {
            conditions.push('difficulty = ?');
            params.push(filters.difficulty);
        }
        if (filters?.category) {
            conditions.push('category = ?');
            params.push(filters.category);
        }
        if (conditions.length > 0) {
            query += ' WHERE ' + conditions.join(' AND ');
        }
        query += ' ORDER BY id';
        const limit = parseInt(String(filters?.limit || 10));
        const offset = parseInt(String(filters?.offset || 0));
        query += ` LIMIT ${limit} OFFSET ${offset}`;
        console.log('执行SQL查询:', query);
        const [rows] = await this.db.execute(query);
        return rows;
    }
    async getPoemById(id) {
        if (!this.db)
            await this.initialize();
        const [rows] = await this.db.execute('SELECT * FROM poems WHERE id = ?', [id]);
        return rows.length > 0 ? rows[0] : null;
    }
    async close() {
        if (this.db) {
            await this.db.end();
            this.db = null;
        }
    }
}
let _databaseManager = null;
function getDatabaseManager() {
    if (!_databaseManager) {
        _databaseManager = new DatabaseManager();
    }
    return _databaseManager;
}
exports.databaseManager = getDatabaseManager();
//# sourceMappingURL=DatabaseManager.js.map
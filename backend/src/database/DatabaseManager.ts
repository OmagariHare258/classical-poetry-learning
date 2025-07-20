import mysql from 'mysql2/promise';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

export interface PoemImage {
  id?: number;
  poem_id: number;
  prompt_hash: string;
  image_url: string;
  image_path?: string;
  ai_service: string;
  generation_params?: any;
  caption?: string;
  created_at?: string;
}

export interface PoemRating {
  id?: number;
  poem_id: number;
  user_id: string;
  content_rating: number;
  image_rating: number;
  overall_rating: number;
  comment?: string;
  created_at?: string;
}

export interface LearningRecord {
  id?: number;
  user_id: string;
  poem_id: number;
  learning_mode: 'traditional' | 'immersive';
  answers: any;
  score: number;
  accuracy_rate: number;
  completion_status: 'started' | 'completed' | 'abandoned';
  start_time?: string;
  completion_time?: string;
}

export interface AIServiceConfig {
  id?: number;
  service_name: string;
  service_type: 'text' | 'image' | 'both';
  api_endpoint: string;
  api_key?: string;
  additional_params?: any;
  is_active: boolean;
  priority: number;
}

interface MySQLConfig {
  host: string;
  port: number;
  user: string;
  password: string;
  database: string;
  charset: string;
}

class DatabaseManager {
  private db: mysql.Connection | null = null;
  private config: MySQLConfig;

  constructor() {
    this.config = {
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '3306'),
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'poetry_learning',
      charset: 'utf8mb4'
    };
    
    // 调试信息
    console.log('🔧 数据库配置:', {
      host: this.config.host,
      port: this.config.port,
      user: this.config.user,
      password: this.config.password ? '***已设置***' : '未设置',
      database: this.config.database
    });
  }

  async initialize(): Promise<void> {
    try {
      // 先连接MySQL服务器（不指定数据库）
      const tempConnection = await mysql.createConnection({
        host: this.config.host,
        port: this.config.port,
        user: this.config.user,
        password: this.config.password,
        charset: this.config.charset
      });

      // 创建数据库（如果不存在）
      await tempConnection.execute(
        `CREATE DATABASE IF NOT EXISTS ${this.config.database} CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`
      );
      await tempConnection.end();

      // 连接到指定数据库
      this.db = await mysql.createConnection(this.config);

      // 执行初始化SQL
      const initSQL = fs.readFileSync(
        path.join(__dirname, 'init.sql'),
        'utf-8'
      );
      
      // 分割SQL语句并执行
      const statements = initSQL
        .split(';')
        .map(stmt => stmt.trim())
        .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));

      for (const statement of statements) {
        if (statement.trim()) {
          try {
            await this.db.execute(statement);
          } catch (error: any) {
            // 忽略重复索引、重复表等错误
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
    } catch (error) {
      console.error('❌ MySQL数据库初始化失败:', error);
      throw error;
    }
  }

  // 图片缓存相关方法 (需求3)
  async getImageFromCache(poemId: number, prompt: string): Promise<PoemImage | null> {
    if (!this.db) await this.initialize();
    
    const promptHash = this.generatePromptHash(prompt);
    const [rows] = await this.db!.execute(
      'SELECT * FROM poem_images WHERE poem_id = ? AND prompt_hash = ?',
      [poemId, promptHash]
    ) as mysql.RowDataPacket[][];
    
    return rows.length > 0 ? rows[0] as PoemImage : null;
  }

  async saveImageToCache(imageData: Omit<PoemImage, 'id' | 'created_at'>): Promise<number> {
    if (!this.db) await this.initialize();

    const [result] = await this.db!.execute(
      `INSERT INTO poem_images 
       (poem_id, prompt_hash, image_url, image_path, ai_service, generation_params, caption)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        imageData.poem_id,
        imageData.prompt_hash,
        imageData.image_url,
        imageData.image_path,
        imageData.ai_service,
        JSON.stringify(imageData.generation_params),
        imageData.caption
      ]
    ) as mysql.ResultSetHeader[];

    return result.insertId;
  }

  // 评分系统方法 (需求5)
  async saveRating(rating: Omit<PoemRating, 'id' | 'created_at'>): Promise<void> {
    if (!this.db) await this.initialize();

    await this.db!.execute(
      `INSERT INTO poem_ratings 
       (poem_id, user_id, content_rating, image_rating, overall_rating, comment)
       VALUES (?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
       content_rating = VALUES(content_rating),
       image_rating = VALUES(image_rating), 
       overall_rating = VALUES(overall_rating),
       comment = VALUES(comment)`,
      [
        rating.poem_id,
        rating.user_id,
        rating.content_rating,
        rating.image_rating,
        rating.overall_rating,
        rating.comment
      ]
    );
  }

  async getPoemRatings(poemId: number): Promise<{
    average_content: number;
    average_image: number;
    average_overall: number;
    total_ratings: number;
    ratings: PoemRating[];
  }> {
    if (!this.db) await this.initialize();

    const [averageRows] = await this.db!.execute(
      `SELECT 
        AVG(content_rating) as avg_content,
        AVG(image_rating) as avg_image,
        AVG(overall_rating) as avg_overall,
        COUNT(*) as total
       FROM poem_ratings WHERE poem_id = ?`,
      [poemId]
    ) as mysql.RowDataPacket[][];

    const [ratingRows] = await this.db!.execute(
      'SELECT * FROM poem_ratings WHERE poem_id = ? ORDER BY created_at DESC',
      [poemId]
    ) as mysql.RowDataPacket[][];

    const averages = averageRows[0] || {};

    return {
      average_content: Math.round((averages.avg_content || 0) * 10) / 10,
      average_image: Math.round((averages.avg_image || 0) * 10) / 10,
      average_overall: Math.round((averages.avg_overall || 0) * 10) / 10,
      total_ratings: averages.total || 0,
      ratings: ratingRows as PoemRating[]
    };
  }

  // 学习记录方法 (需求2: 改进正误判断)
  async saveLearningRecord(record: Omit<LearningRecord, 'id'>): Promise<number> {
    if (!this.db) await this.initialize();

    const [result] = await this.db!.execute(
      `INSERT INTO user_learning_records 
       (user_id, poem_id, learning_mode, answers, score, accuracy_rate, completion_status, completion_time)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        record.user_id,
        record.poem_id,
        record.learning_mode,
        JSON.stringify(record.answers),
        record.score,
        record.accuracy_rate,
        record.completion_status,
        record.completion_time
      ]
    ) as mysql.ResultSetHeader[];

    // 更新学习分析数据
    await this.updateLearningAnalytics(record.poem_id, record.answers);

    return result.insertId;
  }

  async updateLearningAnalytics(poemId: number, answers: any): Promise<void> {
    if (!this.db) await this.initialize();

    // 分析答案并更新统计数据
    for (const [position, answerData] of Object.entries(answers)) {
      const pos = parseInt(position);
      const data = answerData as any;
      
      await this.db!.execute(
        `INSERT INTO learning_analytics 
         (poem_id, character_position, character_text, wrong_attempts, success_rate, common_mistakes)
         VALUES (?, ?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE
         wrong_attempts = VALUES(wrong_attempts),
         success_rate = VALUES(success_rate),
         common_mistakes = VALUES(common_mistakes)`,
        [
          poemId,
          pos,
          data.correct,
          JSON.stringify(data.attempts || []),
          data.success_rate || 0,
          JSON.stringify(data.mistakes || [])
        ]
      );
    }
  }

  async getLearningAnalytics(poemId: number): Promise<any> {
    if (!this.db) await this.initialize();

    const [rows] = await this.db!.execute(
      'SELECT * FROM learning_analytics WHERE poem_id = ? ORDER BY character_position',
      [poemId]
    ) as mysql.RowDataPacket[][];

    return rows.reduce((acc: any, item: any) => {
      acc[item.character_position] = {
        character: item.character_text,
        success_rate: item.success_rate,
        wrong_attempts: JSON.parse(item.wrong_attempts || '[]'),
        common_mistakes: JSON.parse(item.common_mistakes || '[]')
      };
      return acc;
    }, {});
  }

  // AI服务配置方法 (需求1)
  async getActiveAIServices(type?: 'text' | 'image' | 'both'): Promise<AIServiceConfig[]> {
    if (!this.db) await this.initialize();

    let query = 'SELECT * FROM ai_service_configs WHERE is_active = 1';
    const params: any[] = [];

    if (type) {
      query += ' AND (service_type = ? OR service_type = "both")';
      params.push(type);
    }

    query += ' ORDER BY priority ASC';

    const [rows] = await this.db!.execute(query, params) as mysql.RowDataPacket[][];
    return rows as AIServiceConfig[];
  }

  async updateAIServiceConfig(serviceName: string, config: Partial<AIServiceConfig>): Promise<void> {
    if (!this.db) await this.initialize();

    const setClause = Object.keys(config)
      .map(key => `${key} = ?`)
      .join(', ');
    
    const values = Object.values(config);
    values.push(serviceName);

    await this.db!.execute(
      `UPDATE ai_service_configs SET ${setClause}, updated_at = CURRENT_TIMESTAMP WHERE service_name = ?`,
      values
    );
  }

  // 工具方法
  private generatePromptHash(prompt: string): string {
    return crypto.createHash('md5').update(prompt).digest('hex');
  }

  async getPoems(filters?: {
    dynasty?: string;
    difficulty?: string;
    category?: string;
    limit?: number;
    offset?: number;
  }): Promise<any[]> {
    if (!this.db) await this.initialize();

    let query = 'SELECT * FROM poems';
    const params: any[] = [];
    const conditions: string[] = [];

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

    // 默认限制为10条记录，避免返回过多数据
    const limit = parseInt(String(filters?.limit || 10));
    const offset = parseInt(String(filters?.offset || 0));
    
    // 直接构建SQL以避免参数绑定问题
    query += ` LIMIT ${limit} OFFSET ${offset}`;

    console.log('执行SQL查询:', query);
    const [rows] = await this.db!.execute(query) as mysql.RowDataPacket[][];
    return rows;
  }

  async getPoemById(id: number): Promise<any | null> {
    if (!this.db) await this.initialize();

    const [rows] = await this.db!.execute(
      'SELECT * FROM poems WHERE id = ?', 
      [id]
    ) as mysql.RowDataPacket[][];
    
    return rows.length > 0 ? rows[0] : null;
  }

  async close(): Promise<void> {
    if (this.db) {
      await this.db.end();
      this.db = null;
    }
  }
}

let _databaseManager: DatabaseManager | null = null;

export function getDatabaseManager(): DatabaseManager {
  if (!_databaseManager) {
    _databaseManager = new DatabaseManager();
  }
  return _databaseManager;
}

// 保持向后兼容
export const databaseManager = getDatabaseManager();

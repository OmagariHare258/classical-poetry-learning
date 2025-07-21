import sqlite3 from 'sqlite3';
import { Database, open } from 'sqlite';
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

interface SQLiteConfig {
  database: string;
}

class DatabaseManager {
  private db: Database | null = null;
  private config: SQLiteConfig;

  constructor() {
    const dbPath = process.env.SQLITE_DB_PATH || path.join(__dirname, '../../data/poetry_learning.sqlite');
    
    this.config = {
      database: dbPath
    };
    
    // 确保数据目录存在
    const dataDir = path.dirname(this.config.database);
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    
    // 调试信息
    console.log('🔧 SQLite数据库配置:', {
      database: this.config.database
    });
  }

  async initialize(): Promise<void> {
    try {
      // 打开SQLite数据库连接
      this.db = await open({
        filename: this.config.database,
        driver: sqlite3.Database
      });

      // 启用外键约束
      await this.db.exec('PRAGMA foreign_keys = ON');

      // 执行初始化SQL
      const initSQL = fs.readFileSync(
        path.join(__dirname, 'init-sqlite.sql'),
        'utf-8'
      );
      
      // 执行初始化脚本
      await this.db.exec(initSQL);

      console.log('✅ SQLite数据库初始化完成');
    } catch (error) {
      console.error('❌ SQLite数据库初始化失败:', error);
      throw error;
    }
  }

  // 图片缓存相关方法
  async getImageFromCache(poemId: number, prompt: string): Promise<PoemImage | null> {
    if (!this.db) await this.initialize();
    
    const promptHash = this.generatePromptHash(prompt);
    const result = await this.db!.get(
      'SELECT * FROM poem_images WHERE poem_id = ? AND prompt_hash = ?',
      [poemId, promptHash]
    );
    
    return result || null;
  }

  async cacheImage(imageData: Omit<PoemImage, 'id'>): Promise<number> {
    if (!this.db) await this.initialize();
    
    const result = await this.db!.run(
      `INSERT OR REPLACE INTO poem_images 
       (poem_id, prompt_hash, image_url, image_path, ai_service, generation_params, caption)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        imageData.poem_id,
        imageData.prompt_hash,
        imageData.image_url,
        imageData.image_path || null,
        imageData.ai_service,
        JSON.stringify(imageData.generation_params),
        imageData.caption || null
      ]
    );
    
    return result.lastID!;
  }

  // 评分相关方法
  async saveRating(ratingData: Omit<PoemRating, 'id'>): Promise<number> {
    if (!this.db) await this.initialize();
    
    const result = await this.db!.run(
      `INSERT OR REPLACE INTO poem_ratings 
       (poem_id, user_id, content_rating, image_rating, overall_rating, comment)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        ratingData.poem_id,
        ratingData.user_id,
        ratingData.content_rating,
        ratingData.image_rating,
        ratingData.overall_rating,
        ratingData.comment || null
      ]
    );
    
    return result.lastID!;
  }

  async getRatingStats(poemId: number): Promise<any> {
    if (!this.db) await this.initialize();
    
    const stats = await this.db!.get(
      `SELECT 
         AVG(content_rating) as avg_content_rating,
         AVG(image_rating) as avg_image_rating,
         AVG(overall_rating) as avg_overall_rating,
         COUNT(*) as total_ratings
       FROM poem_ratings 
       WHERE poem_id = ?`,
      [poemId]
    );
    
    return stats;
  }

  // 学习记录相关方法
  async saveLearningRecord(recordData: Omit<LearningRecord, 'id'>): Promise<number> {
    if (!this.db) await this.initialize();
    
    const result = await this.db!.run(
      `INSERT INTO user_learning_records 
       (user_id, poem_id, learning_mode, answers, score, accuracy_rate, completion_status, start_time, completion_time)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        recordData.user_id,
        recordData.poem_id,
        recordData.learning_mode,
        JSON.stringify(recordData.answers),
        recordData.score,
        recordData.accuracy_rate,
        recordData.completion_status,
        recordData.start_time || new Date().toISOString(),
        recordData.completion_time || null
      ]
    );
    
    return result.lastID!;
  }

  async getLearningHistory(userId: string, limit: number = 10): Promise<LearningRecord[]> {
    if (!this.db) await this.initialize();
    
    const records = await this.db!.all(
      `SELECT lr.*, p.title, p.author 
       FROM user_learning_records lr
       JOIN poems p ON lr.poem_id = p.id
       WHERE lr.user_id = ?
       ORDER BY lr.start_time DESC
       LIMIT ?`,
      [userId, limit]
    );
    
    return records.map((record: any) => ({
      ...record,
      answers: JSON.parse(record.answers || '{}')
    }));
  }

  // 诗词相关方法
  async getAllPoems(): Promise<any[]> {
    if (!this.db) await this.initialize();
    
    return await this.db!.all('SELECT * FROM poems ORDER BY id');
  }

  async getPoemById(id: number): Promise<any> {
    if (!this.db) await this.initialize();
    
    return await this.db!.get('SELECT * FROM poems WHERE id = ?', [id]);
  }

  async searchPoems(query: string, filters: any = {}): Promise<any[]> {
    if (!this.db) await this.initialize();
    
    let sql = `SELECT * FROM poems WHERE 1=1`;
    const params: any[] = [];
    
    if (query) {
      sql += ` AND (title LIKE ? OR author LIKE ? OR content LIKE ?)`;
      const searchTerm = `%${query}%`;
      params.push(searchTerm, searchTerm, searchTerm);
    }
    
    if (filters.difficulty) {
      sql += ` AND difficulty = ?`;
      params.push(filters.difficulty);
    }
    
    if (filters.dynasty) {
      sql += ` AND dynasty = ?`;
      params.push(filters.dynasty);
    }
    
    if (filters.category) {
      sql += ` AND category LIKE ?`;
      params.push(`%${filters.category}%`);
    }
    
    sql += ` ORDER BY id`;
    
    if (filters.limit) {
      sql += ` LIMIT ?`;
      params.push(filters.limit);
    }
    
    return await this.db!.all(sql, params);
  }

  async getPoemStats(): Promise<any> {
    if (!this.db) await this.initialize();
    
    const stats = await this.db!.get(`
      SELECT 
        COUNT(*) as total_poems,
        COUNT(DISTINCT author) as total_authors,
        COUNT(DISTINCT dynasty) as total_dynasties
      FROM poems
    `);
    
    const difficultyStats = await this.db!.all(`
      SELECT difficulty, COUNT(*) as count 
      FROM poems 
      GROUP BY difficulty
    `);
    
    return {
      ...stats,
      difficulty_distribution: difficultyStats
    };
  }

  // AI服务配置相关方法
  async getActiveAIServices(type?: string): Promise<AIServiceConfig[]> {
    if (!this.db) await this.initialize();
    
    let sql = 'SELECT * FROM ai_service_configs WHERE is_active = 1';
    const params: any[] = [];
    
    if (type) {
      sql += ` AND (service_type = ? OR service_type = 'both')`;
      params.push(type);
    }
    
    sql += ' ORDER BY priority ASC';
    
    const results = await this.db!.all(sql, params);
    
    return results.map((result: any) => ({
      ...result,
      additional_params: result.additional_params ? JSON.parse(result.additional_params) : null,
      is_active: Boolean(result.is_active)
    }));
  }

  async updateAIServiceConfig(id: number, config: Partial<AIServiceConfig>): Promise<void> {
    if (!this.db) await this.initialize();
    
    const setParts: string[] = [];
    const params: any[] = [];
    
    Object.entries(config).forEach(([key, value]) => {
      if (value !== undefined) {
        setParts.push(`${key} = ?`);
        if (key === 'additional_params' && typeof value === 'object') {
          params.push(JSON.stringify(value));
        } else if (key === 'is_active') {
          params.push(value ? 1 : 0);
        } else {
          params.push(value);
        }
      }
    });
    
    if (setParts.length > 0) {
      params.push(id);
      await this.db!.run(
        `UPDATE ai_service_configs SET ${setParts.join(', ')} WHERE id = ?`,
        params
      );
    }
  }

  // 学习分析相关方法
  async updateLearningAnalytics(poemId: number, position: number, character: string, isCorrect: boolean, userInput?: string): Promise<void> {
    if (!this.db) await this.initialize();
    
    // 获取现有记录
    const existing = await this.db!.get(
      'SELECT * FROM learning_analytics WHERE poem_id = ? AND character_position = ?',
      [poemId, position]
    );
    
    if (existing) {
      // 更新现有记录
      const wrongAttempts = JSON.parse(existing.wrong_attempts || '[]');
      const commonMistakes = JSON.parse(existing.common_mistakes || '{}');
      
      if (!isCorrect && userInput) {
        wrongAttempts.push(userInput);
        commonMistakes[userInput] = (commonMistakes[userInput] || 0) + 1;
      }
      
      await this.db!.run(
        `UPDATE learning_analytics 
         SET wrong_attempts = ?, common_mistakes = ?, updated_at = CURRENT_TIMESTAMP
         WHERE poem_id = ? AND character_position = ?`,
        [JSON.stringify(wrongAttempts), JSON.stringify(commonMistakes), poemId, position]
      );
    } else {
      // 创建新记录
      const wrongAttempts = !isCorrect && userInput ? [userInput] : [];
      const commonMistakes = !isCorrect && userInput ? { [userInput]: 1 } : {};
      
      await this.db!.run(
        `INSERT INTO learning_analytics 
         (poem_id, character_position, character_text, wrong_attempts, common_mistakes, success_rate)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [poemId, position, character, JSON.stringify(wrongAttempts), JSON.stringify(commonMistakes), isCorrect ? 100 : 0]
      );
    }
  }

  // 工具方法
  private generatePromptHash(prompt: string): string {
    return crypto.createHash('md5').update(prompt).digest('hex');
  }

  async close(): Promise<void> {
    if (this.db) {
      await this.db.close();
      this.db = null;
    }
  }

  // 测试连接
  async testConnection(): Promise<boolean> {
    try {
      if (!this.db) await this.initialize();
      await this.db!.get('SELECT 1');
      return true;
    } catch (error) {
      console.error('数据库连接测试失败:', error);
      return false;
    }
  }
}

export default DatabaseManager;

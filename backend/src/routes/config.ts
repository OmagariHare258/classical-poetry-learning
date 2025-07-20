// 配置管理路由 - 环境变量编辑
import { Router } from 'express';
import fs from 'fs';
import path from 'path';

const router = Router();

// .env 文件路径
const ENV_FILE_PATH = path.join(process.cwd(), '.env');

/**
 * 获取 .env 文件内容
 */
router.get('/env', async (req, res) => {
  try {
    // 检查文件是否存在
    if (!fs.existsSync(ENV_FILE_PATH)) {
      return res.status(404).json({
        success: false,
        error: '环境配置文件不存在'
      });
    }

    // 读取文件内容
    const content = fs.readFileSync(ENV_FILE_PATH, 'utf-8');
    
    return res.json({
      success: true,
      content: content,
      path: ENV_FILE_PATH,
      size: content.length
    });
  } catch (error: any) {
    console.error('❌ 读取.env文件失败:', error);
    return res.status(500).json({
      success: false,
      error: '读取配置文件失败: ' + error.message
    });
  }
});

/**
 * 保存 .env 文件内容
 */
router.post('/env', async (req, res) => {
  try {
    const { content } = req.body;
    
    if (typeof content !== 'string') {
      return res.status(400).json({
        success: false,
        error: '无效的文件内容'
      });
    }

    // 创建备份文件
    if (fs.existsSync(ENV_FILE_PATH)) {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const backupPath = `${ENV_FILE_PATH}.backup.${timestamp}`;
      fs.copyFileSync(ENV_FILE_PATH, backupPath);
      console.log(`📋 已创建备份文件: ${backupPath}`);
    }

    // 写入新内容
    fs.writeFileSync(ENV_FILE_PATH, content, 'utf-8');
    console.log('✅ .env文件已更新');

    // 返回成功响应
    res.json({
      success: true,
      message: '配置文件保存成功',
      size: content.length
    });

    // 延迟重启服务器以确保响应已发送
    setTimeout(() => {
      console.log('🔄 配置文件已更新，准备重启服务器...');
      if (process.env.NODE_ENV === 'development') {
        // 开发环境：通过 nodemon 重启
        process.exit(0);
      } else {
        // 生产环境：优雅重启
        process.kill(process.pid, 'SIGTERM');
      }
    }, 1000);

    return; // 确保函数有返回值

  } catch (error: any) {
    console.error('❌ 保存.env文件失败:', error);
    return res.status(500).json({
      success: false,
      error: '保存配置文件失败: ' + error.message
    });
  }
});

/**
 * 获取 .env 文件信息
 */
router.get('/env/info', async (req, res) => {
  try {
    if (!fs.existsSync(ENV_FILE_PATH)) {
      return res.status(404).json({
        success: false,
        error: '环境配置文件不存在'
      });
    }

    const stats = fs.statSync(ENV_FILE_PATH);
    const content = fs.readFileSync(ENV_FILE_PATH, 'utf-8');
    
    // 统计配置项数量
    const lines = content.split('\n').filter(line => 
      line.trim() && !line.trim().startsWith('#')
    );
    
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
  } catch (error: any) {
    console.error('❌ 获取.env文件信息失败:', error);
    return res.status(500).json({
      success: false,
      error: '获取文件信息失败: ' + error.message
    });
  }
});

/**
 * 验证 .env 文件内容格式
 */
router.post('/env/validate', async (req, res) => {
  try {
    const { content } = req.body;
    
    if (typeof content !== 'string') {
      return res.status(400).json({
        success: false,
        error: '无效的文件内容'
      });
    }

    const errors: string[] = [];
    const warnings: string[] = [];
    const lines = content.split('\n');
    
    lines.forEach((line, index) => {
      const lineNumber = index + 1;
      const trimmedLine = line.trim();
      
      // 跳过空行和注释
      if (!trimmedLine || trimmedLine.startsWith('#')) {
        return;
      }
      
      // 检查格式
      if (!trimmedLine.includes('=')) {
        errors.push(`第 ${lineNumber} 行: 缺少等号 (=)`);
        return;
      }
      
      const [key, ...valueParts] = trimmedLine.split('=');
      const value = valueParts.join('=');
      
      // 检查键名
      if (!key.trim()) {
        errors.push(`第 ${lineNumber} 行: 缺少变量名`);
      } else if (!/^[A-Z_][A-Z0-9_]*$/i.test(key.trim())) {
        warnings.push(`第 ${lineNumber} 行: 变量名 "${key.trim()}" 建议使用大写字母和下划线`);
      }
      
      // 检查值
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
      configCount: lines.filter(line => 
        line.trim() && !line.trim().startsWith('#') && line.includes('=')
      ).length
    });
    
  } catch (error: any) {
    console.error('❌ 验证.env文件失败:', error);
    return res.status(500).json({
      success: false,
      error: '验证配置文件失败: ' + error.message
    });
  }
});

export default router;

-- 古诗词学习平台数据库初始化脚本 (MySQL版本)
-- 创建时间: 2025年7月20日

-- 创建数据库（如果需要）
-- CREATE DATABASE IF NOT EXISTS poetry_learning CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
-- USE poetry_learning;

-- 诗词基础表
CREATE TABLE IF NOT EXISTS poems (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(100) NOT NULL,
    author VARCHAR(50) NOT NULL,
    dynasty VARCHAR(20) NOT NULL,
    content TEXT NOT NULL,
    translation TEXT,
    difficulty ENUM('easy', 'medium', 'hard') DEFAULT 'medium',
    category VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 生成图片缓存表 (需求3: 存储已绘制过的图片)
CREATE TABLE IF NOT EXISTS poem_images (
    id INT AUTO_INCREMENT PRIMARY KEY,
    poem_id INT NOT NULL,
    prompt_hash VARCHAR(64) NOT NULL COMMENT '提示词的MD5哈希，用于判断是否重复',
    image_url VARCHAR(500) NOT NULL,
    image_path VARCHAR(500) COMMENT '本地存储路径',
    ai_service VARCHAR(50) DEFAULT 'baidu' COMMENT '使用的AI服务 (需求1: 中国国内AI)',
    generation_params JSON COMMENT '生成参数',
    caption TEXT COMMENT '图片配文 (需求4)',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (poem_id) REFERENCES poems(id) ON DELETE CASCADE,
    UNIQUE KEY unique_poem_prompt (poem_id, prompt_hash)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 用户学习记录表
CREATE TABLE IF NOT EXISTS user_learning_records (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id VARCHAR(50) DEFAULT 'guest',
    poem_id INT NOT NULL,
    learning_mode ENUM('traditional', 'immersive') DEFAULT 'immersive',
    answers JSON COMMENT '存储用户答案',
    score INT DEFAULT 0,
    accuracy_rate DECIMAL(5,2) COMMENT '准确率 (需求2: 无法准确判断正误的改进)',
    completion_status ENUM('started', 'completed', 'abandoned') DEFAULT 'started',
    start_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completion_time TIMESTAMP NULL,
    FOREIGN KEY (poem_id) REFERENCES poems(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 星级评分表 (需求5: 星星评分机制)
CREATE TABLE IF NOT EXISTS poem_ratings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    poem_id INT NOT NULL,
    user_id VARCHAR(50) DEFAULT 'guest',
    content_rating INT CHECK(content_rating >= 1 AND content_rating <= 5) COMMENT '内容评分',
    image_rating INT CHECK(image_rating >= 1 AND image_rating <= 5) COMMENT '图片评分',
    overall_rating INT CHECK(overall_rating >= 1 AND overall_rating <= 5) COMMENT '整体评分',
    comment TEXT COMMENT '评价文字',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (poem_id) REFERENCES poems(id) ON DELETE CASCADE,
    UNIQUE KEY unique_user_poem_rating (poem_id, user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- AI服务配置表 (需求1: 中国国内AI配置)
CREATE TABLE IF NOT EXISTS ai_service_configs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    service_name VARCHAR(50) NOT NULL COMMENT 'baidu, ali, tencent, openai 等',
    service_type ENUM('text', 'image', 'both') NOT NULL,
    api_endpoint VARCHAR(200) NOT NULL,
    api_key VARCHAR(200),
    additional_params JSON COMMENT '额外参数配置',
    is_active BOOLEAN DEFAULT TRUE,
    priority INT DEFAULT 1 COMMENT '优先级，数字越小优先级越高',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 学习分析表 (需求2: 改进判断正误)
CREATE TABLE IF NOT EXISTS learning_analytics (
    id INT AUTO_INCREMENT PRIMARY KEY,
    poem_id INT NOT NULL,
    character_position INT NOT NULL COMMENT '字符位置',
    character_text VARCHAR(10) NOT NULL COMMENT '正确字符',
    wrong_attempts JSON COMMENT '错误尝试记录',
    success_rate DECIMAL(5,2) COMMENT '该位置的成功率',
    common_mistakes JSON COMMENT '常见错误',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (poem_id) REFERENCES poems(id) ON DELETE CASCADE,
    UNIQUE KEY unique_poem_position (poem_id, character_position)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 插入默认AI服务配置 (中国国内AI优先)
INSERT INTO ai_service_configs (service_name, service_type, api_endpoint, priority) VALUES
('baidu', 'both', 'https://aip.baidubce.com', 1),
('ali', 'both', 'https://dashscope.aliyuncs.com', 2),
('tencent', 'both', 'https://hunyuan.cloud.tencent.com', 3),
('openai', 'both', 'https://api.openai.com', 4)
ON DUPLICATE KEY UPDATE 
service_type = VALUES(service_type),
api_endpoint = VALUES(api_endpoint),
priority = VALUES(priority);

-- 插入示例诗词数据
INSERT INTO poems (id, title, author, dynasty, content, translation, difficulty, category) VALUES
(1, '静夜思', '李白', '唐', '床前明月光，疑是地上霜。举头望明月，低头思故乡。', '床前的明亮月光，好像是地上的霜花。抬头看那天上的明月，低头思念故乡。', 'easy', '思乡'),
(2, '春晓', '孟浩然', '唐', '春眠不觉晓，处处闻啼鸟。夜来风雨声，花落知多少。', '春天睡觉不知天亮，到处听到鸟儿啼叫。昨夜的风雨声，不知吹落了多少花朵。', 'easy', '春景'),
(3, '登鹳雀楼', '王之涣', '唐', '白日依山尽，黄河入海流。欲穷千里目，更上一层楼。', '夕阳依傍着西山慢慢地沉没，滔滔黄河朝着东海汹涌奔流。若想把千里的风光景物看够，那就要登上更高的一层城楼。', 'medium', '励志'),
(4, '相思', '王维', '唐', '红豆生南国，春来发几枝。愿君多采撷，此物最相思。', '红豆生长在南方，春天到了该长多少新枝呢？希望思念的人儿多多采集，小小红豆引人相思。', 'medium', '相思'),
(5, '望庐山瀑布', '李白', '唐', '日照香炉生紫烟，遥看瀑布挂前川。飞流直下三千尺，疑是银河落九天。', '香炉峰在阳光的照射下生起紫色烟霞，远远望见瀑布似白色绢绸悬挂在山前。高崖上飞腾直落的瀑布好像有几千尺，让人恍惚以为银河从天上泻落到人间。', 'hard', '山水')
ON DUPLICATE KEY UPDATE 
title = VALUES(title),
author = VALUES(author),
dynasty = VALUES(dynasty),
content = VALUES(content),
translation = VALUES(translation),
difficulty = VALUES(difficulty),
category = VALUES(category);

-- 创建索引提升查询性能
CREATE INDEX idx_poems_dynasty ON poems(dynasty);
CREATE INDEX idx_poems_difficulty ON poems(difficulty);
CREATE INDEX idx_poems_category ON poems(category);
CREATE INDEX idx_poem_images_poem_id ON poem_images(poem_id);
CREATE INDEX idx_poem_images_hash ON poem_images(prompt_hash);
CREATE INDEX idx_user_learning_poem_id ON user_learning_records(poem_id);
CREATE INDEX idx_user_learning_user_id ON user_learning_records(user_id);
CREATE INDEX idx_poem_ratings_poem_id ON poem_ratings(poem_id);
CREATE INDEX idx_learning_analytics_poem_id ON learning_analytics(poem_id);

-- 古诗词学习平台数据库初始化脚本 (SQLite版本)
-- 创建时间: 2025年7月21日

-- 启用外键约束
PRAGMA foreign_keys = ON;

-- 诗词基础表
CREATE TABLE IF NOT EXISTS poems (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title VARCHAR(100) NOT NULL,
    author VARCHAR(50) NOT NULL,
    dynasty VARCHAR(20) NOT NULL,
    content TEXT NOT NULL,
    translation TEXT,
    difficulty TEXT CHECK(difficulty IN ('easy', 'medium', 'hard')) DEFAULT 'medium',
    category VARCHAR(50),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 创建触发器来更新updated_at字段
CREATE TRIGGER IF NOT EXISTS update_poems_updated_at 
    AFTER UPDATE ON poems
BEGIN
    UPDATE poems SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

-- 生成图片缓存表
CREATE TABLE IF NOT EXISTS poem_images (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    poem_id INTEGER NOT NULL,
    prompt_hash VARCHAR(64) NOT NULL, -- 提示词的MD5哈希，用于判断是否重复
    image_url VARCHAR(500) NOT NULL,
    image_path VARCHAR(500), -- 本地存储路径
    ai_service VARCHAR(50) DEFAULT 'baidu', -- 使用的AI服务
    generation_params TEXT, -- 生成参数 (JSON)
    caption TEXT, -- 图片配文
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (poem_id) REFERENCES poems(id) ON DELETE CASCADE
);

-- 创建唯一索引
CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_poem_prompt ON poem_images(poem_id, prompt_hash);

-- 用户学习记录表
CREATE TABLE IF NOT EXISTS user_learning_records (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id VARCHAR(50) DEFAULT 'guest',
    poem_id INTEGER NOT NULL,
    learning_mode TEXT CHECK(learning_mode IN ('traditional', 'immersive')) DEFAULT 'immersive',
    answers TEXT, -- 存储用户答案 (JSON)
    score INTEGER DEFAULT 0,
    accuracy_rate DECIMAL(5,2), -- 准确率
    completion_status TEXT CHECK(completion_status IN ('started', 'completed', 'abandoned')) DEFAULT 'started',
    start_time DATETIME DEFAULT CURRENT_TIMESTAMP,
    completion_time DATETIME NULL,
    FOREIGN KEY (poem_id) REFERENCES poems(id) ON DELETE CASCADE
);

-- 星级评分表
CREATE TABLE IF NOT EXISTS poem_ratings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    poem_id INTEGER NOT NULL,
    user_id VARCHAR(50) DEFAULT 'guest',
    content_rating INTEGER CHECK(content_rating >= 1 AND content_rating <= 5), -- 内容评分
    image_rating INTEGER CHECK(image_rating >= 1 AND image_rating <= 5), -- 图片评分
    overall_rating INTEGER CHECK(overall_rating >= 1 AND overall_rating <= 5), -- 整体评分
    comment TEXT, -- 评价文字
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (poem_id) REFERENCES poems(id) ON DELETE CASCADE
);

-- 创建唯一索引
CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_user_poem_rating ON poem_ratings(poem_id, user_id);

-- AI服务配置表
CREATE TABLE IF NOT EXISTS ai_service_configs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    service_name VARCHAR(50) NOT NULL, -- baidu, ali, tencent, openai 等
    service_type TEXT CHECK(service_type IN ('text', 'image', 'both')) NOT NULL,
    api_endpoint VARCHAR(200) NOT NULL,
    api_key VARCHAR(200),
    additional_params TEXT, -- 额外参数配置 (JSON)
    is_active BOOLEAN DEFAULT TRUE,
    priority INTEGER DEFAULT 1, -- 优先级，数字越小优先级越高
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 创建触发器来更新updated_at字段
CREATE TRIGGER IF NOT EXISTS update_ai_service_configs_updated_at 
    AFTER UPDATE ON ai_service_configs
BEGIN
    UPDATE ai_service_configs SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

-- 学习分析表
CREATE TABLE IF NOT EXISTS learning_analytics (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    poem_id INTEGER NOT NULL,
    character_position INTEGER NOT NULL, -- 字符位置
    character_text VARCHAR(10) NOT NULL, -- 正确字符
    wrong_attempts TEXT, -- 错误尝试记录 (JSON)
    success_rate DECIMAL(5,2), -- 该位置的成功率
    common_mistakes TEXT, -- 常见错误 (JSON)
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (poem_id) REFERENCES poems(id) ON DELETE CASCADE
);

-- 创建唯一索引
CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_poem_position ON learning_analytics(poem_id, character_position);

-- 创建触发器来更新updated_at字段
CREATE TRIGGER IF NOT EXISTS update_learning_analytics_updated_at 
    AFTER UPDATE ON learning_analytics
BEGIN
    UPDATE learning_analytics SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

-- 插入默认AI服务配置 (中国国内AI优先)
INSERT OR IGNORE INTO ai_service_configs (service_name, service_type, api_endpoint, priority) VALUES
('baidu', 'both', 'https://aip.baidubce.com', 1),
('ali', 'both', 'https://dashscope.aliyuncs.com', 2),
('tencent', 'both', 'https://hunyuan.cloud.tencent.com', 3),
('openai', 'both', 'https://api.openai.com', 4);

-- 插入示例诗词数据
INSERT OR IGNORE INTO poems (id, title, author, dynasty, content, translation, difficulty, category) VALUES
(1, '春晓', '孟浩然', '唐', '春眠不觉晓，处处闻啼鸟。夜来风雨声，花落知多少。', '春天睡醒不觉天已大亮，到处听见悦耳的鸟叫声。夜里的风雨声，花儿凋零知多少。', 'easy', '春天,写景'),
(2, '静夜思', '李白', '唐', '床前明月光，疑是地上霜。举头望明月，低头思故乡。', '明亮的月光洒在窗台上，好像地上铺的一层霜。抬头仰望天空一轮明月，低头不禁思念起故乡。', 'easy', '思乡,夜景'),
(3, '登鹳雀楼', '王之涣', '唐', '白日依山尽，黄河入海流。欲穷千里目，更上一层楼。', '白色的太阳靠着山峦沉落，黄河向着大海奔流。若想把千里的风光景物看够，那就要登上更高的一层城楼。', 'medium', '哲理,写景'),
(4, '咏鹅', '骆宾王', '唐', '鹅，鹅，鹅，曲项向天歌。白毛浮绿水，红掌拨清波。', '白鹅啊白鹅，弯着脖子向天歌唱。洁白的羽毛浮在碧绿水面，红红的脚掌拨动着清清水波。', 'easy', '写物'),
(5, '悯农', '李绅', '唐', '锄禾日当午，汗滴禾下土。谁知盘中餐，粒粒皆辛苦。', '农民在正午烈日的暴晒下锄禾，汗水从身上滴在禾苗生长的土地上。又有谁知道盘中的饭食，每颗每粒都是农民用辛勤的劳动换来的呢？', 'medium', '励志,农事'),
(6, '江雪', '柳宗元', '唐', '千山鸟飞绝，万径人踪灭。孤舟蓑笠翁，独钓寒江雪。', '所有的山，飞鸟全都断绝；所有的路，不见人影踪迹。江上孤舟，渔翁披蓑戴笠；独自垂钓，不怕冰雪侵袭。', 'hard', '写景,孤独'),
(7, '赋得古原草送别', '白居易', '唐', '离离原上草，一岁一枯荣。野火烧不尽，春风吹又生。', '长长的原上草是多么茂盛，每年秋冬枯黄春来草色浓。无情的野火只能烧掉干叶，春风吹来大地又是绿茸茸。', 'medium', '送别,写景'),
(8, '望庐山瀑布', '李白', '唐', '日照香炉生紫烟，遥看瀑布挂前川。飞流直下三千尺，疑是银河落九天。', '香炉峰在阳光的照射下生起紫色烟霞，远远望见瀑布似白色绢绸悬挂在山前。高崖上飞腾直落的瀑布好像有三千尺，让人恍惚以为银河从天上泻落到人间。', 'medium', '写景,山水');

-- 创建索引以提高查询性能
CREATE INDEX IF NOT EXISTS idx_poems_author ON poems(author);
CREATE INDEX IF NOT EXISTS idx_poems_dynasty ON poems(dynasty);
CREATE INDEX IF NOT EXISTS idx_poems_difficulty ON poems(difficulty);
CREATE INDEX IF NOT EXISTS idx_poems_category ON poems(category);
CREATE INDEX IF NOT EXISTS idx_user_learning_records_user ON user_learning_records(user_id);
CREATE INDEX IF NOT EXISTS idx_user_learning_records_poem ON user_learning_records(poem_id);
CREATE INDEX IF NOT EXISTS idx_poem_ratings_poem ON poem_ratings(poem_id);
CREATE INDEX IF NOT EXISTS idx_poem_images_poem ON poem_images(poem_id);

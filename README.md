# Hi，Chinese - 古诗文智能学习平台

基于DeepSeek AI和n8n工作流的沉浸式古诗文学习平台，帮助学生从作者视角理解诗文意境。

## 🚀 项目特色

- 🎨 **沉浸式体验**: 横版布局，以古风图片为视觉中心
- 🧠 **情境理解**: 从作者视角出发，引导学生理解诗文意境
- 🎯 **挖空填词**: 单问题聚焦，配合智能字词候选
- 🤖 **AI驱动**: DeepSeek AI智能生成引导性提示和学习建议
- ⚡ **流畅体验**: 预生成内容，减少等待时间
- 🔄 **工作流自动化**: n8n自动连接和智能学习路径规划

## 🏗️ 技术架构

- **前端**: React + TypeScript + Tailwind CSS
- **后端**: Node.js + Express + SQLite
- **AI服务**: DeepSeek API (主要) + 国内AI服务 (备用)
- **工作流**: n8n (自动启动和连接)
- **数据库**: SQLite (轻量级嵌入式数据库)
- **图片生成**: AI驱动的古风图片生成

## 🔧 核心功能

### 1. AI智能对话
- **主要AI模型**: DeepSeek Chat
- **备用服务**: 百度文心一言、阿里通义千问
- **专业能力**: 古诗文分析、学习建议生成、内容解释

### 2. n8n工作流集成
- **自动连接**: 程序启动时自动连接n8n服务
- **状态监控**: 实时监控n8n连接状态
- **重连机制**: 自动重试和手动重连功能
- **工作流管理**: 智能推荐和学习进度追踪

### 3. 前端用户界面
- 左侧学习区：背景图片 + 上下文展示 + 挖空填词
- 右侧辅助区：智能字词候选 + 干扰项设计

### 4. 互动流程
- 单问题聚焦设计
- 即时AI反馈机制
- 渐进式学习路径

## 🚀 快速开始

### 环境要求

- **Node.js**: 18.0+
- **npm**: 8.0+
- **操作系统**: Windows 10/11, macOS, Linux
- **数据库**: SQLite (无需单独安装)

### 完整启动（推荐）

```bash
# Windows SQLite版本启动（推荐 - 无需MySQL）
npm run start:sqlite

# 或者传统MySQL版本启动
npm run start:with-n8n

# 手动分别启动各个服务：

# 1. 启动n8n工作流服务
npm run n8n

# 2. 启动后端服务 (SQLite版本)
cd backend
npm run dev-sqlite

# 3. 启动前端服务
cd frontend
npm run dev
```

### 环境配置

```bash
# 1. 复制环境变量模板
cp backend/.env.example backend/.env

# 2. 编辑环境变量文件，配置以下关键项：
# - DEEPSEEK_API_KEY: DeepSeek AI API密钥
# - SQLITE_DB_PATH: SQLite数据库文件路径（可选，默认：data/poetry_learning.sqlite）
# - N8N_API_KEY: n8n API密钥（可选）
```

### 访问地址

- **前端应用**: <http://localhost:3002> （自动分配可用端口）
- **后端API**: <http://localhost:5000>
- **n8n工作流**: <http://localhost:5678>
- **API健康检查**: <http://localhost:5000/api/health>
- **AI服务状态**: <http://localhost:5000/api/ai/health>
- **诗词数据**: <http://localhost:5000/api/poems>

## 🔥 新增功能

### DeepSeek AI集成

- ✅ **主要AI模型**: DeepSeek Chat，专业的中文古诗文理解能力
- ✅ **智能内容生成**: 古诗文解释、学习提示、问题生成
- ✅ **个性化建议**: 基于学习进度的个性化学习路径推荐
- ✅ **备用服务**: 集成国内AI服务作为备用方案
- ✅ **API健康监控**: 实时监控AI服务状态和响应性能

### n8n工作流自动化

- ✅ **自动连接**: 程序启动时自动连接n8n服务
- ✅ **状态监控**: 实时显示n8n连接状态和健康检查
- ✅ **重连机制**: 自动重试连接，支持手动重连
- ✅ **工作流管理**: 智能学习路径和进度追踪
- ✅ **API集成**: 完整的n8n REST API集成

### 扩展的诗词库

- 📚 新增6首经典古诗文（总计8首）
- 🏷️ 完善的标签系统（春天、思乡、哲理等）
- 📊 难度分级（入门、进阶、高级）
- 🏛️ 朝代分类（唐、明等）
- 📝 详细的翻译和赏析

### API增强

- 🔍 **智能搜索**: 支持标题、作者、内容的模糊搜索
- 📈 **统计分析**: 诗词数量、难度分布、标签统计
- 🎯 **高级筛选**: 按难度、朝代、标签筛选
- 📄 **分页支持**: 大量数据的分页展示
- 🤖 **AI驱动**: DeepSeek AI提供智能内容分析

## 📚 API文档

### AI服务接口

```bash
# AI服务健康检查
GET /api/ai/health

# 生成AI文本内容
POST /api/ai/generate-text
{
  "prompt": "请解释《春晓》这首诗的意境",
  "options": {
    "temperature": 0.7,
    "max_tokens": 1000
  }
}

# 生成古诗文学习内容
POST /api/ai/generate-poetry-content
{
  "type": "explanation", // hint | explanation | question
  "poem": {
    "title": "春晓",
    "author": "孟浩然",
    "content": "春眠不觉晓..."
  }
}
```

### n8n服务接口

```bash
# n8n连接状态
GET /api/n8n/status

# 手动重连n8n
POST /api/n8n/reconnect

# 触发学习工作流
POST /api/n8n/trigger/learning-flow
```

## 🛠️ 开发配置

### 环境变量说明

```env
# AI服务配置
DEEPSEEK_API_KEY=your_deepseek_api_key_here
DEEPSEEK_BASE_URL=https://api.deepseek.com
DEEPSEEK_MODEL=deepseek-chat

# n8n配置
N8N_BASE_URL=http://localhost:5678
N8N_API_KEY=your_n8n_api_key_here

# 数据库配置
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=poetry_learning
```

### 开发命令

```bash
# 安装所有依赖
npm run install:all

# 启动开发环境（包含n8n）
npm run dev

# 仅启动前端
npm run dev:frontend

# 仅启动后端
npm run dev:backend

# 仅启动n8n
npm run n8n

# 测试AI服务
npm run test:ai
```

## 示例：学习《春晓》

**第一步**：

- 图片：清晨卧房，窗外朦胧天色
- 诗句：`□□□□□，处处闻啼鸟`
- AI提示："这句诗描绘的是春天早晨一个常见的感受，你觉得作者在做什么呢？"
- 候选字：春、眠、不、觉、晓 + 干扰项

**第二步**：

- 图片：窗外鸟儿鸣叫景象
- 诗句：`春眠不觉晓，□□□□□`
- AI提示："睡醒之后，作者听到了什么声音，让他知道了外面的世界很热闹？"
- 候选字：处、闻、啼、鸟 + 干扰项

## 🤝 贡献指南

欢迎提交Issues和Pull Requests来改进这个项目！

## 📄 许可证

MIT License
# Hi，Chinese - 古诗文学习平台开发环境配置指南

## 📋 系统要求

- **Node.js**: 18.0+
- **MySQL**: 9.0+
- **npm**: 8.0+
- **操作系统**: Windows 10/11, macOS, Linux
- **可选**: Docker (用于n8n容器化部署)

## 🚀 快速开始

### 1. 克隆项目

```bash
git clone <repository-url>
cd classical-poetry-learning
```

### 2. 一键启动（Windows）

```bash
# 运行启动脚本（推荐）
scripts\start-all.bat
```

### 3. 手动启动（跨平台）

#### 安装依赖

```bash
# 安装根目录依赖
npm install

# 安装前端依赖
cd frontend
npm install
cd ..

# 安装后端依赖
cd backend
npm install
cd ..
```

#### 配置环境变量

```bash
# 复制环境变量模板
cp backend/.env.example backend/.env

# 编辑环境变量文件
# 重点配置：DEEPSEEK_API_KEY、DB_PASSWORD、N8N_API_KEY
```

#### 启动服务

```bash
# 启动所有服务（包含n8n）
npm run start:with-n8n

# 或分别启动
npm run dev:frontend  # 前端 (端口 3000)
npm run dev:backend   # 后端 (端口 5000)
npm run n8n          # n8n (端口 5678)
```

## 🗄️ 数据库配置

### MySQL 安装

#### Windows

1. 下载 [MySQL Community Server](https://dev.mysql.com/downloads/mysql/)
2. 安装并启动 MySQL 服务
3. 默认连接: `mysql://localhost:3306`

#### macOS (使用 Homebrew)

```bash
brew install mysql
brew services start mysql
```

#### Linux (Ubuntu)

```bash
sudo apt-get update
sudo apt-get install mysql-server
sudo systemctl start mysql
sudo systemctl enable mysql
```

### 初始化数据库

```bash
# Windows
scripts\init-db.bat

# macOS/Linux
cd backend
npm run init-db
```

## 🤖 AI服务配置

### DeepSeek API配置（主要）

1. 访问 [DeepSeek官网](https://platform.deepseek.com/) 注册账号
2. 获取API密钥
3. 在 `backend/.env` 中配置：

```env
DEEPSEEK_API_KEY=your_deepseek_api_key_here
DEEPSEEK_BASE_URL=https://api.deepseek.com
DEEPSEEK_MODEL=deepseek-chat
```

### 备用AI服务配置（可选）

```env
# 百度文心一言
BAIDU_API_KEY=your_baidu_api_key
BAIDU_SECRET_KEY=your_baidu_secret_key

# 阿里云通义千问
ALI_API_KEY=your_ali_api_key

# 腾讯云混元
TENCENT_SECRET_ID=your_tencent_secret_id
TENCENT_SECRET_KEY=your_tencent_secret_key
```

## 🔧 n8n工作流配置

### 本地n8n安装

```bash
# 全局安装n8n
npm install -g n8n

# 或使用项目依赖
npm run n8n
```

### Docker部署n8n（推荐）

```bash
# 运行n8n容器
npm run n8n:docker

# 或直接使用Docker命令
docker run -it --rm --name n8n -p 5678:5678 n8nio/n8n
```

### n8n配置

1. 访问 http://localhost:5678 设置n8n
2. 创建管理员账户
3. 可选：生成API密钥并配置到 `.env` 文件

```env
N8N_BASE_URL=http://localhost:5678
N8N_API_KEY=your_n8n_api_key_here
```

## 🔧 环境变量配置

编辑 `backend/.env` 文件：

```env
# 服务器配置
PORT=5000
NODE_ENV=development
FRONTEND_URL=http://localhost:3000

# 数据库配置
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=poetry_learning

# DeepSeek AI配置（必需）
DEEPSEEK_API_KEY=your_deepseek_api_key_here
DEEPSEEK_BASE_URL=https://api.deepseek.com
DEEPSEEK_MODEL=deepseek-chat

# n8n配置
N8N_BASE_URL=http://localhost:5678
N8N_API_KEY=your_n8n_api_key_here

# JWT配置
JWT_SECRET=your_jwt_secret_here
JWT_EXPIRES_IN=7d

# 文件上传配置
UPLOAD_MAX_SIZE=10485760
UPLOAD_ALLOWED_TYPES=image/jpeg,image/png,image/webp,audio/mpeg,audio/wav

# 缓存配置
REDIS_URL=redis://localhost:6379
CACHE_TTL=3600

# 日志配置
LOG_LEVEL=info
LOG_FILE=logs/app.log

# 安全配置
CORS_ORIGIN=http://localhost:3000
RATE_LIMIT_WINDOW=15
RATE_LIMIT_MAX=100
```

## ⚡ 开发命令

```bash
# 安装所有依赖
npm run install:all

# 启动开发环境（包含n8n）
npm run start:with-n8n

# 启动开发环境（不含n8n）
npm run dev

# 分别启动各服务
npm run dev:frontend
npm run dev:backend
npm run n8n

# 使用Docker启动n8n
npm run n8n:docker

# 构建生产版本
npm run build

# 测试AI服务
npm run test:ai
```

## 🧪 服务验证

### 验证后端服务

```bash
# 健康检查
curl http://localhost:5000/api/health

# AI服务状态
curl http://localhost:5000/api/ai/health

# n8n连接状态
curl http://localhost:5000/api/n8n/status
```

### 验证前端服务

访问 http://localhost:3000 查看前端应用

### 验证n8n服务

访问 http://localhost:5678 查看n8n管理界面

## 🐛 常见问题

### MySQL连接失败

1. 确保MySQL服务已启动
2. 检查用户名密码配置
3. 确认数据库已创建

### DeepSeek API调用失败

1. 检查API密钥是否正确
2. 确认网络连接正常
3. 查看API使用额度

### n8n连接超时

1. 确保n8n服务已启动
2. 检查端口5678是否被占用
3. 查看防火墙设置

### 端口冲突

修改 `.env` 文件中的端口配置：

```env
PORT=5001  # 后端端口
# 前端端口在 frontend/vite.config.ts 中修改
```

## 📱 生产部署

### 环境准备

```bash
# 设置生产环境
NODE_ENV=production

# 构建前端
cd frontend
npm run build

# 启动后端
cd backend
npm start
```

### Docker部署（推荐）

```dockerfile
# 参考项目根目录的 Dockerfile
docker build -t poetry-learning .
docker run -p 3000:3000 -p 5000:5000 poetry-learning
```

## 📚 API文档

启动服务后访问：

- 后端API文档: http://localhost:5000/api/health
- n8n API文档: http://localhost:5678/api/v1
- 前端应用: http://localhost:3000

## 🤝 贡献指南

1. Fork 项目
2. 创建功能分支
3. 提交代码
4. 发起 Pull Request

## 📄 许可证

MIT License

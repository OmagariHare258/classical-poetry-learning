@echo off
echo ========================================
echo Hi，Chinese - 古诗文学习平台
echo ========================================
echo.

echo 正在检查依赖...
if not exist "node_modules" (
    echo 安装项目依赖...
    call npm install
    if errorlevel 1 (
        echo 依赖安装失败！
        pause
        exit /b 1
    )
)

echo 正在检查前端依赖...
cd frontend
if not exist "node_modules" (
    echo 安装前端依赖...
    call npm install
    if errorlevel 1 (
        echo 前端依赖安装失败！
        pause
        exit /b 1
    )
)
cd ..

echo 正在检查后端依赖...
cd backend
if not exist "node_modules" (
    echo 安装后端依赖...
    call npm install
    if errorlevel 1 (
        echo 后端依赖安装失败！
        pause
        exit /b 1
    )
)
cd ..

echo.
echo 正在检查环境配置...
if not exist "backend\.env" (
    echo 创建后端环境配置文件...
    copy "backend\.env.example" "backend\.env"
    echo 请编辑 backend\.env 文件配置您的环境变量
    echo 特别是 DEEPSEEK_API_KEY 和 N8N_API_KEY
    pause
)

echo.
echo 正在启动服务...
echo.
echo [1/4] 启动 MySQL (请确保 MySQL 已安装并运行)

echo [2/4] 启动 n8n 工作流服务...
start "n8n工作流" cmd /k "echo 启动 n8n 服务... && npx n8n start"

echo 等待 n8n 服务启动...
timeout /t 8 /nobreak > nul

echo [3/4] 启动后端服务...
start "后端服务" cmd /k "cd backend && echo 启动后端服务... && npm run dev"

echo 等待后端服务启动...
timeout /t 5 /nobreak > nul

echo [4/4] 启动前端服务...
start "前端服务" cmd /k "cd frontend && echo 启动前端服务... && npm run dev"

echo 等待前端服务启动...
timeout /t 3 /nobreak > nul

echo.
echo ========================================
echo 服务启动完成！
echo ========================================
echo 前端地址: http://localhost:3000
echo 后端地址: http://localhost:5000
echo n8n工作流: http://localhost:5678
echo ========================================
echo.
echo AI服务配置:
echo - 主要模型: DeepSeek AI
echo - API端点: /api/ai/
echo - 健康检查: /api/ai/health
echo.
echo 按任意键打开前端页面...
pause > nul
start http://localhost:3000

echo.
echo 使用提示：
echo - n8n 管理界面: http://localhost:5678
echo - AI服务测试: POST http://localhost:5000/api/ai/test
echo - 请在 backend\.env 中配置 DEEPSEEK_API_KEY
echo - 按 Ctrl+C 可停止各个服务
echo.
pause
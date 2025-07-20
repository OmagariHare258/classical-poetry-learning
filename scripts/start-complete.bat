@echo off
echo ========================================
echo 古诗文学习平台 - 完整启动脚本
echo ========================================
echo.

echo [1/4] 启动后端服务...
cd backend
start "后端服务" cmd /k "npm run dev"
cd ..

echo 等待后端服务启动...
timeout /t 3 /nobreak > nul

echo [2/4] 启动前端服务...  
cd frontend
start "前端服务" cmd /k "npm run dev"
cd ..

echo 等待前端服务启动...
timeout /t 3 /nobreak > nul

echo [3/4] 启动n8n工作流服务...
start "n8n服务" cmd /k "npx n8n start"

echo 等待n8n服务启动...
timeout /t 5 /nobreak > nul

echo [4/4] 打开应用程序...
start http://localhost:3001
start http://localhost:5678

echo.
echo ========================================
echo 服务启动完成！
echo ========================================
echo 前端地址: http://localhost:3001
echo 后端地址: http://localhost:5000
echo n8n地址: http://localhost:5678
echo API状态: http://localhost:5000/api/health
echo n8n状态: http://localhost:5000/api/n8n/status
echo ========================================
echo.
echo 提示：
echo - 前端已集成n8n状态监控
echo - 支持AI智能推荐功能
echo - 工作流驱动的学习追踪
echo - 关闭各个窗口可停止对应服务
echo.
pause

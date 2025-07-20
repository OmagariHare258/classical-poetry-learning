@echo off
chcp 65001 >nul
echo ========================================
echo Hi，Chinese - 古诗文学习平台
echo 数据库初始化脚本
echo ========================================
echo.

echo 正在检查 MySQL 连接...
echo 请确保 MySQL 服务正在运行
echo.

echo 选择初始化选项：
echo [1] 初始化示例数据（推荐）
echo [2] 清空数据库并重新初始化
echo [3] 仅创建索引
echo [4] 退出
echo.
set /p choice=请输入选项 (1-4): 

if "%choice%"=="1" goto init_sample
if "%choice%"=="2" goto reset_db
if "%choice%"=="3" goto create_indexes
if "%choice%"=="4" goto exit

echo 无效选项，请重新运行脚本
pause
exit /b 1

:init_sample
echo.
echo 正在初始化示例数据...
cd backend
npm run init-db
if errorlevel 1 (
    echo 数据库初始化失败！
    pause
    exit /b 1
)
echo 示例数据初始化完成！
goto success

:reset_db
echo.
echo 警告：此操作将清空所有现有数据！
set /p confirm=确认继续？(y/N): 
if /i not "%confirm%"=="y" (
    echo 操作已取消
    pause
    exit /b 0
)
echo.
echo 正在清空数据库并重新初始化...
cd backend
npm run init-db -- --reset
if errorlevel 1 (
    echo 数据库重置失败！
    pause
    exit /b 1
)
echo 数据库重置完成！
goto success

:create_indexes
echo.
echo 正在创建数据库索引...
cd backend
npm run init-db -- --indexes-only
if errorlevel 1 (
    echo 索引创建失败！
    pause
    exit /b 1
)
echo 索引创建完成！
goto success

:success
echo.
echo ========================================
echo 数据库初始化成功！
echo ========================================
echo.
echo 已创建的示例诗词：
echo - 静夜思 (李白)
echo - 春晓 (孟浩然)
echo - 登鹳雀楼 (王之涣)
echo - 相思 (王维)
echo - 望庐山瀑布 (李白)
echo.
echo AI服务配置：
echo - 主要模型: DeepSeek AI
echo - 访问设置: 点击前端页面右上角设置按钮
echo.
echo 您现在可以：
echo 1. 启动应用: scripts\start-all-fixed.bat
echo 2. 访问前端: http://localhost:3000
echo 3. 查看API文档: http://localhost:5000/api/health
echo 4. n8n工作流: http://localhost:5678
echo.
pause
exit /b 0

:exit
echo 退出初始化脚本
exit /b 0
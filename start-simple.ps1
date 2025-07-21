# 古诗文学习平台 - 简化一键启动脚本
param(
    [string]$Mode = "all"  # all, backend, frontend, n8n
)

# 颜色输出函数
function Write-ColorOutput {
    param([string]$Message, [string]$Color = "Green")
    switch ($Color) {
        "Red" { Write-Host $Message -ForegroundColor Red }
        "Yellow" { Write-Host $Message -ForegroundColor Yellow }
        "Green" { Write-Host $Message -ForegroundColor Green }
        "Blue" { Write-Host $Message -ForegroundColor Blue }
        "Cyan" { Write-Host $Message -ForegroundColor Cyan }
        default { Write-Host $Message }
    }
}

try {
    Write-ColorOutput "🎯 古诗文学习平台 - 启动脚本" "Cyan"
    Write-ColorOutput "================================" "Cyan"
    
    # 检查当前目录
    if (-not (Test-Path "package.json")) {
        Write-ColorOutput "❌ 错误：请在项目根目录运行此脚本" "Red"
        exit 1
    }
    
    Write-ColorOutput "📁 项目根目录: $(Get-Location)" "Blue"
    Write-ColorOutput "🚀 启动模式: $Mode" "Blue"
    
    # 端口配置
    $ports = @{
        backend = 3001
        frontend = 5173
        n8n = 5678
    }
    
    # 检查并杀掉占用端口的进程
    function Stop-PortProcess {
        param([int]$Port)
        
        try {
            $processes = Get-NetTCPConnection -LocalPort $Port -ErrorAction SilentlyContinue | 
                        ForEach-Object { Get-Process -Id $_.OwningProcess -ErrorAction SilentlyContinue }
            
            foreach ($process in $processes) {
                if ($process) {
                    Write-ColorOutput "🔧 结束进程: $($process.Name) (PID: $($process.Id))" "Yellow"
                    Stop-Process -Id $process.Id -Force -ErrorAction SilentlyContinue
                }
            }
        } catch {
            # 忽略错误
        }
    }
    
    # 启动后端
    function Start-Backend {
        Write-ColorOutput "🔧 启动后端服务..." "Blue"
        
        Stop-PortProcess -Port $ports.backend
        
        Push-Location "backend"
        
        # 检查数据库
        $dbPath = "data\poetry_learning.sqlite"
        if (-not (Test-Path $dbPath)) {
            Write-ColorOutput "⚠️ 数据库文件不存在，正在创建..." "Yellow"
            if (Test-Path "data\complete_database.sql") {
                Get-Content "data\complete_database.sql" | sqlite3 $dbPath
                Write-ColorOutput "✅ 数据库初始化完成" "Green"
            }
        }
        
        # 安装依赖
        if (-not (Test-Path "node_modules")) {
            Write-ColorOutput "📦 安装后端依赖..." "Yellow"
            npm install | Out-Null
        }
        
        # 启动后端
        Write-ColorOutput "🚀 启动后端 API (端口 $($ports.backend))..." "Green"
        Start-Process -FilePath "cmd" -ArgumentList "/c", "ts-node src\index-sqlite.ts" -WindowStyle Hidden
        
        Pop-Location
        
        # 等待后端启动
        $waited = 0
        do {
            Start-Sleep -Seconds 1
            $waited++
            try {
                $response = Invoke-RestMethod -Uri "http://localhost:$($ports.backend)/api/health" -TimeoutSec 2
                if ($response.status -eq "ok") {
                    Write-ColorOutput "✅ 后端服务启动成功！" "Green"
                    return $true
                }
            } catch {
                # 继续等待
            }
        } while ($waited -lt 30)
        
        Write-ColorOutput "❌ 后端服务启动超时" "Red"
        return $false
    }
    
    # 启动前端
    function Start-Frontend {
        Write-ColorOutput "🔧 启动前端服务..." "Blue"
        
        Stop-PortProcess -Port $ports.frontend
        
        Push-Location "frontend"
        
        # 安装依赖
        if (-not (Test-Path "node_modules")) {
            Write-ColorOutput "📦 安装前端依赖..." "Yellow"
            npm install | Out-Null
        }
        
        # 启动前端
        Write-ColorOutput "🚀 启动前端开发服务器 (端口 $($ports.frontend))..." "Green"
        Start-Process -FilePath "cmd" -ArgumentList "/c", "npm run dev" -WindowStyle Hidden
        
        Pop-Location
        
        # 等待前端启动
        Start-Sleep -Seconds 5
        try {
            Invoke-WebRequest -Uri "http://localhost:$($ports.frontend)" -TimeoutSec 5 | Out-Null
            Write-ColorOutput "✅ 前端服务启动成功！" "Green"
            return $true
        } catch {
            Write-ColorOutput "⚠️ 前端服务启动中..." "Yellow"
            return $true
        }
    }
    
    # 启动n8n
    function Start-N8n {
        Write-ColorOutput "🔧 启动 n8n 工作流引擎..." "Blue"
        
        Stop-PortProcess -Port $ports.n8n
        
        # 检查n8n
        try {
            npx n8n --version | Out-Null
        } catch {
            Write-ColorOutput "📦 安装 n8n..." "Yellow"
            npm install -g n8n | Out-Null
        }
        
        # 启动n8n
        Write-ColorOutput "🚀 启动 n8n (端口 $($ports.n8n))..." "Green"
        Start-Process -FilePath "cmd" -ArgumentList "/c", "npx n8n start" -WindowStyle Hidden
        
        # 等待n8n启动
        Start-Sleep -Seconds 10
        try {
            Invoke-WebRequest -Uri "http://localhost:$($ports.n8n)" -TimeoutSec 5 | Out-Null
            Write-ColorOutput "✅ n8n 服务启动成功！" "Green"
            return $true
        } catch {
            Write-ColorOutput "⚠️ n8n 服务启动中..." "Yellow"
            return $true
        }
    }
    
    # 根据模式启动服务
    switch ($Mode.ToLower()) {
        "backend" {
            Start-Backend
        }
        "frontend" {
            Start-Frontend
        }
        "n8n" {
            Start-N8n
        }
        "all" {
            Write-ColorOutput "🚀 启动完整系统..." "Cyan"
            $backendSuccess = Start-Backend
            if ($backendSuccess) {
                Start-Sleep -Seconds 2
                Start-Frontend
                Start-Sleep -Seconds 2
                Start-N8n
            } else {
                Write-ColorOutput "❌ 后端启动失败，无法继续" "Red"
                exit 1
            }
        }
        default {
            Write-ColorOutput "❌ 无效的启动模式: $Mode" "Red"
            exit 1
        }
    }
    
    Write-ColorOutput ""
    Write-ColorOutput "🎉 启动完成！" "Green"
    Write-ColorOutput "================================" "Cyan"
    Write-ColorOutput "📚 后端 API: http://localhost:$($ports.backend)" "Cyan"
    Write-ColorOutput "🌐 前端应用: http://localhost:$($ports.frontend)" "Cyan"
    Write-ColorOutput "⚙️ n8n 工作流: http://localhost:$($ports.n8n)" "Cyan"
    Write-ColorOutput ""
    Write-ColorOutput "💡 提示：按任意键退出..." "Yellow"
    
    # 自动打开浏览器
    try {
        Start-Process "http://localhost:$($ports.frontend)"
        Write-ColorOutput "🔗 浏览器已自动打开" "Green"
    } catch {
        Write-ColorOutput "⚠️ 无法自动打开浏览器，请手动访问" "Yellow"
    }
    
    # 等待用户输入
    $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")

} catch {
    Write-ColorOutput "❌ 脚本执行出错: $($_.Exception.Message)" "Red"
    exit 1
}

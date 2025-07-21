# 古诗文学习平台 - 一键启动脚本
# 功能：启动完整的古诗文学习系统（前端 + 后端 + n8n）
# 优化版本：提升启动速度，增强错误处理

param(
    [string]$Mode = "all",  # all, backend, frontend, n8n
    [switch]$SkipDepsCheck = $false,
    [switch]$OpenBrowser,   # 默认为false，使用-OpenBrowser参数来启用
    [switch]$Verbose = $false,
    [string]$LogFile = "",  # 日志文件路径，留空则不记录日志
    [int]$StartupTimeout = 60  # 服务启动超时时间(秒)
)

# 颜色输出函数，支持同时写入日志文件
function Write-ColorOutput {
    param(
        [string]$Message, 
        [string]$Color = "Green",
        [switch]$NoNewLine = $false,
        [switch]$LogOnly = $false
    )
    
    # 生成时间戳
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    $logMessage = "[$timestamp] $Message"
    
    # 输出到控制台
    if (-not $LogOnly) {
        switch ($Color) {
            "Red" { Write-Host $Message -ForegroundColor Red -NoNewline:$NoNewLine }
            "Yellow" { Write-Host $Message -ForegroundColor Yellow -NoNewline:$NoNewLine }
            "Green" { Write-Host $Message -ForegroundColor Green -NoNewline:$NoNewLine }
            "Blue" { Write-Host $Message -ForegroundColor Blue -NoNewline:$NoNewLine }
            "Cyan" { Write-Host $Message -ForegroundColor Cyan -NoNewline:$NoNewLine }
            default { Write-Host $Message -NoNewline:$NoNewLine }
        }
    }
    
    # 写入日志文件
    if ($LogFile) {
        Add-Content -Path $LogFile -Value $logMessage -ErrorAction SilentlyContinue
    }
}

    # 全局变量
$Global:startTime = Get-Date
$Global:services = @{}  # 用于存储服务状态

# 错误处理
$ErrorActionPreference = "Stop"

# 初始化日志文件
if ($LogFile) {
    $LogFile = [System.IO.Path]::GetFullPath($LogFile)
    $logDir = Split-Path -Parent $LogFile
    if (-not (Test-Path $logDir)) {
        New-Item -Path $logDir -ItemType Directory -Force | Out-Null
    }
    Write-ColorOutput "📝 日志文件: $LogFile" "Blue" -LogOnly
    Write-ColorOutput "=== 古诗文学习平台启动日志 - $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss') ===" "Cyan" -LogOnly
}

try {
    Write-ColorOutput "🎯 古诗文学习平台 - 一键启动脚本" "Cyan"
    Write-ColorOutput "================================================" "Cyan"
    
    # 检查当前目录
    $rootPath = Get-Location
    if (-not (Test-Path "package.json")) {
        Write-ColorOutput "❌ 错误：请在项目根目录运行此脚本" "Red"
        exit 1
    }
    
    Write-ColorOutput "📁 项目根目录: $rootPath" "Blue"
    Write-ColorOutput "🚀 启动模式: $Mode" "Blue"
    Write-ColorOutput "⏱️ 最大启动等待时间: ${StartupTimeout}秒" "Blue"
    
    # 端口配置 - 使用固定端口
    $ports = @{
        backend = 3001
        frontend = 5173
        n8n = 5678
    }    # 辅助函数区域 ==================================================

    # 获取运行时间
    function Get-RunningTime {
        $elapsed = (Get-Date) - $Global:startTime
        return "{0:mm}:{0:ss}" -f $elapsed
    }
    
    # 检查端口占用（优化版）
    function Test-PortInUse {
        param([int]$Port)
        try {
            # 使用更高效的方式检查端口
            $tcpConnections = @(Get-NetTCPConnection -LocalPort $Port -ErrorAction SilentlyContinue)
            return $tcpConnections.Count -gt 0
        } catch {
            Write-ColorOutput "⚠️ 检查端口 $Port 时出错: $($_.Exception.Message)" "Yellow"
            return $false
        }
    }
    
    # 杀掉占用端口的进程 (优化版)
    function Stop-PortProcess {
        param(
            [int]$Port, 
            [string]$ServiceName,
            [switch]$Force = $false
        )
        
        if (Test-PortInUse -Port $Port) {
            Write-ColorOutput "⚠️ 端口 $Port ($ServiceName) 被占用，正在释放..." "Yellow"
            try {
                # 获取所有占用此端口的进程
                $processes = Get-NetTCPConnection -LocalPort $Port -ErrorAction SilentlyContinue | 
                             Select-Object -ExpandProperty OwningProcess -Unique | 
                             ForEach-Object { Get-Process -Id $_ -ErrorAction SilentlyContinue }
                
                if (-not $processes) {
                    Write-ColorOutput "⚠️ 未找到占用端口 $Port 的进程" "Yellow"
                    return
                }
                
                # 显示进程信息并确认是否终止
                foreach ($process in $processes) {
                    if ($process) {
                        if ($Force -or $ServiceName -eq $process.ProcessName) {
                            Write-ColorOutput "🔧 结束进程: $($process.Name) (PID: $($process.Id))" "Yellow"
                            Stop-Process -Id $process.Id -Force -ErrorAction SilentlyContinue
                            
                            # 等待进程彻底终止
                            $waitCount = 0
                            while ((Get-Process -Id $process.Id -ErrorAction SilentlyContinue) -and $waitCount -lt 5) {
                                Start-Sleep -Milliseconds 500
                                $waitCount++
                            }
                        }
                        else {
                            Write-ColorOutput "🛑 检测到非相关进程占用端口: $($process.Name) (PID: $($process.Id))" "Red"
                            Write-ColorOutput "   请手动关闭该进程或使用其他端口" "Yellow"
                        }
                    }
                }
                
                # 再次检查端口
                Start-Sleep -Milliseconds 500
                if (Test-PortInUse -Port $Port) {
                    Write-ColorOutput "⚠️ 端口 $Port 仍被占用，可能需要手动解决" "Red"
                } else {
                    Write-ColorOutput "✅ 端口 $Port 已释放" "Green"
                }
            } catch {
                Write-ColorOutput "⚠️ 无法释放端口 $Port : $($_.Exception)" "Red"
            }
        }
    }
    
    # 检查服务健康状态
    function Test-ServiceHealth {
        param(
            [string]$Name,
            [string]$Url,
            [int]$TimeoutSec = 5
        )
        
        try {
            $response = Invoke-RestMethod -Uri $Url -TimeoutSec $TimeoutSec -Method Get
            return $true
        } catch {
            return $false
        }
    }
    
    # 检查依赖
    if (-not $SkipDepsCheck) {
        Write-ColorOutput "📦 检查依赖..." "Blue"
        
        # 检查 Node.js
        try {
            $nodeVersion = node --version
            Write-ColorOutput "✅ Node.js: $nodeVersion" "Green"
        } catch {
            Write-ColorOutput "❌ Node.js 未安装或不在 PATH 中" "Red"
            exit 1
        }
        
        # 检查 npm
        try {
            $npmVersion = npm --version
            Write-ColorOutput "✅ npm: $npmVersion" "Green"
        } catch {
            Write-ColorOutput "❌ npm 未安装或不在 PATH 中" "Red"
            exit 1
        }
        
        # 检查 TypeScript 和 ts-node
        try {
            $tsVersion = npx tsc --version
            Write-ColorOutput "✅ TypeScript: $tsVersion" "Green"
        } catch {
            Write-ColorOutput "⚠️ TypeScript 未全局安装，正在安装..." "Yellow"
            npm install -g typescript ts-node
        }
    }
    
    # 启动后端服务
    function Start-Backend {
        Write-ColorOutput "🔧 启动后端服务 (⏱️ $(Get-RunningTime))..." "Blue"
        
        # 记录服务信息
        $Global:services["backend"] = @{
            "name" = "后端API服务"
            "port" = $ports.backend
            "url" = "http://localhost:$($ports.backend)"
            "healthUrl" = "http://localhost:$($ports.backend)/api/health"
            "status" = "starting"
            "job" = $null
            "startTime" = Get-Date
        }
        
        # 释放端口
        Stop-PortProcess -Port $ports.backend -ServiceName "node" -Force
        
        # 保存当前位置
        $currentLocation = Get-Location
        Set-Location "backend"
        
        try {
            # 检查数据库
            $dbPath = "data\poetry_learning.sqlite"
            if (-not (Test-Path $dbPath)) {
                Write-ColorOutput "⚠️ 数据库文件不存在，正在创建..." "Yellow"
                if (Test-Path "data\complete_database.sql") {
                    Write-ColorOutput "📝 从SQL脚本创建数据库..." "Blue"
                    try {
                        $sqliteCmd = Get-Command sqlite3 -ErrorAction SilentlyContinue
                        if ($sqliteCmd) {
                            Get-Content "data\complete_database.sql" | sqlite3 $dbPath
                            Write-ColorOutput "✅ 数据库初始化完成" "Green"
                        } else {
                            Write-ColorOutput "⚠️ 找不到sqlite3命令，尝试使用npm包..." "Yellow"
                            # 尝试使用node-sqlite3或其他方法
                            npx better-sqlite3-cli "data\complete_database.sql" $dbPath
                        }
                    } catch {
                        Write-ColorOutput "⚠️ 数据库创建出错: $($_.Exception.Message)" "Red"
                        return $false
                    }
                } else {
                    Write-ColorOutput "❌ 数据库脚本不存在" "Red"
                    return $false
                }
            }
            
            # 安装依赖 (使用并行方式)
            if (-not (Test-Path "node_modules")) {
                Write-ColorOutput "📦 安装后端依赖..." "Yellow"
                $npmInstallOutput = npm install --no-fund --loglevel=error
                if ($Verbose) {
                    $npmInstallOutput | ForEach-Object { Write-ColorOutput "   $_" "Blue" }
                }
            }
            
            # 启动后端作为后台作业
            Write-ColorOutput "🚀 启动后端 API (端口 $($ports.backend))..." "Green"
            $job = Start-Job -ScriptBlock {
                param($backendPath, $port)
                Set-Location $backendPath
                # 设置环境变量
                $env:PORT = $port
                # 启动服务
                ts-node "src\index-sqlite.ts"
            } -ArgumentList (Get-Location), $ports.backend
            
            # 保存作业引用
            $Global:services["backend"].job = $job
            
            # 恢复位置
            Set-Location $currentLocation
            
            # 等待后端启动 (使用进度条)
            $healthUrl = $Global:services["backend"].healthUrl
            $maxWait = $StartupTimeout
            $waited = 0
            $progressParams = @{
                Activity = "等待后端服务启动"
                Status = "检查健康状态..."
                PercentComplete = 0
            }
            
            Write-Progress @progressParams
            
            do {
                Start-Sleep -Milliseconds 500
                $waited += 0.5
                $progressParams.PercentComplete = [Math]::Min(100, ($waited / $maxWait) * 100)
                Write-Progress @progressParams
                
                try {
                    $healthCheck = Invoke-RestMethod -Uri $healthUrl -TimeoutSec 1 -ErrorAction SilentlyContinue
                    if ($healthCheck.status -eq "ok") {
                        Write-Progress -Activity "后端服务启动" -Status "已完成" -Completed
                        Write-ColorOutput "✅ 后端服务启动成功！(⏱️ $(Get-RunningTime))" "Green"
                        Write-ColorOutput "🔗 API地址: $($Global:services["backend"].url)" "Cyan"
                        $Global:services["backend"].status = "running"
                        return $true
                    }
                } catch {
                    # 继续等待
                }
            } while ($waited -lt $maxWait)
            
            Write-Progress -Activity "后端服务启动" -Status "失败" -Completed
            Write-ColorOutput "❌ 后端服务启动超时 (${maxWait}秒)" "Red"
            $Global:services["backend"].status = "failed"
            
            # 检查作业状态以获取更多信息
            $jobOutput = Receive-Job -Job $job
            if ($jobOutput -and $Verbose) {
                Write-ColorOutput "📃 后端启动日志:" "Yellow"
                $jobOutput | ForEach-Object { Write-ColorOutput "   $_" "Yellow" }
            }
            
            return $false
        }
        catch {
            Write-ColorOutput "❌ 后端启动失败: $($_.Exception.Message)" "Red"
            if ($Verbose) {
                Write-ColorOutput $_.Exception.StackTrace "Red"
            }
            # 恢复位置
            Set-Location $currentLocation
            $Global:services["backend"].status = "failed"
            return $false
        }
    }
    
    # 启动前端服务
    function Start-Frontend {
        Write-ColorOutput "🔧 启动前端服务 (⏱️ $(Get-RunningTime))..." "Blue"
        
        # 记录服务信息
        $Global:services["frontend"] = @{
            "name" = "前端应用"
            "port" = $ports.frontend
            "url" = "http://localhost:$($ports.frontend)"
            "status" = "starting"
            "job" = $null
            "startTime" = Get-Date
        }
        
        # 释放端口
        Stop-PortProcess -Port $ports.frontend -ServiceName "node" -Force
        
        # 保存当前位置
        $currentLocation = Get-Location
        Set-Location "frontend"
        
        try {
            # 安装依赖 (使用并行方式)
            if (-not (Test-Path "node_modules")) {
                Write-ColorOutput "📦 安装前端依赖..." "Yellow"
                $npmInstallOutput = npm install --no-fund --loglevel=error
                if ($Verbose) {
                    $npmInstallOutput | ForEach-Object { Write-ColorOutput "   $_" "Blue" }
                }
            }
            
            # 启动前端作为后台作业
            Write-ColorOutput "🚀 启动前端开发服务器 (端口 $($ports.frontend))..." "Green"
            $job = Start-Job -ScriptBlock {
                param($frontendPath, $port)
                Set-Location $frontendPath
                # 传递端口号
                $env:PORT = $port
                # 启动前端
                npm run dev -- --port $port
            } -ArgumentList (Get-Location), $ports.frontend
            
            # 保存作业引用
            $Global:services["frontend"].job = $job
            
            # 恢复位置
            Set-Location $currentLocation
            
            # 等待前端启动 (使用进度条)
            $frontendUrl = $Global:services["frontend"].url
            $maxWait = [Math]::Max(20, $StartupTimeout / 3) # 前端启动通常比较快
            $waited = 0
            $progressParams = @{
                Activity = "等待前端服务启动"
                Status = "检查可用性..."
                PercentComplete = 0
            }
            
            Write-Progress @progressParams
            
            do {
                Start-Sleep -Milliseconds 500
                $waited += 0.5
                $progressParams.PercentComplete = [Math]::Min(100, ($waited / $maxWait) * 100)
                Write-Progress @progressParams
                
                try {
                    $null = Invoke-WebRequest -Uri $frontendUrl -TimeoutSec 1 -Method Head -ErrorAction SilentlyContinue
                    Write-Progress -Activity "前端服务启动" -Status "已完成" -Completed
                    Write-ColorOutput "✅ 前端服务启动成功！(⏱️ $(Get-RunningTime))" "Green"
                    Write-ColorOutput "🔗 前端地址: $frontendUrl" "Cyan"
                    $Global:services["frontend"].status = "running"
                    return $true
                } catch {
                    # 检查作业是否仍在运行
                    if ($job.State -ne "Running") {
                        Write-ColorOutput "⚠️ 前端服务进程已停止" "Yellow"
                        $jobOutput = Receive-Job -Job $job -ErrorAction SilentlyContinue
                        if ($jobOutput -and $Verbose) {
                            Write-ColorOutput "📃 前端启动日志:" "Yellow"
                            $jobOutput | ForEach-Object { Write-ColorOutput "   $_" "Yellow" }
                        }
                    }
                    # 继续等待
                }
            } while ($waited -lt $maxWait)
            
            Write-Progress -Activity "前端服务启动" -Status "可能需要更多时间" -Completed
            Write-ColorOutput "⚠️ 前端服务启动中，可能需要更多时间... ($(Get-RunningTime))" "Yellow"
            Write-ColorOutput "🔗 请稍后访问: $frontendUrl" "Cyan"
            $Global:services["frontend"].status = "starting"
            return $true  # 即使还没完全启动，也返回成功
        }
        catch {
            Write-ColorOutput "⚠️ 前端启动过程中出现问题: $($_.Exception.Message)" "Yellow"
            if ($Verbose) {
                Write-ColorOutput $_.Exception.StackTrace "Yellow"
            }
            # 尝试继续运行，前端可能会自动恢复
            Write-ColorOutput "🔄 尝试继续运行..." "Blue"
            # 恢复位置
            Set-Location $currentLocation
            $Global:services["frontend"].status = "warning"
            return $true
        }
    }
    
    # 启动n8n服务
    function Start-N8n {
        Write-ColorOutput "🔧 启动 n8n 工作流引擎 (⏱️ $(Get-RunningTime))..." "Blue"
        
        # 记录服务信息
        $Global:services["n8n"] = @{
            "name" = "n8n工作流"
            "port" = $ports.n8n
            "url" = "http://localhost:$($ports.n8n)"
            "status" = "starting"
            "job" = $null
            "startTime" = Get-Date
        }
        
        # 释放端口
        Stop-PortProcess -Port $ports.n8n -ServiceName "node" -Force
        
        try {
            # 检查n8n是否已安装
            $n8nInstalled = $false
            try {
                $n8nVersion = npx n8n --version 2>$null
                if ($n8nVersion) {
                    Write-ColorOutput "✅ n8n: $n8nVersion" "Green"
                    $n8nInstalled = $true
                }
            } catch {
                # n8n 未安装
            }
            
            if (-not $n8nInstalled) {
                Write-ColorOutput "📦 安装 n8n..." "Yellow"
                try {
                    # 尝试全局安装
                    $installOutput = npm install -g n8n --no-fund --loglevel=error
                    if ($Verbose) {
                        $installOutput | ForEach-Object { Write-ColorOutput "   $_" "Blue" }
                    }
                    
                    # 验证安装
                    $n8nVersion = npx n8n --version 2>$null
                    if ($n8nVersion) {
                        Write-ColorOutput "✅ n8n 安装成功: $n8nVersion" "Green"
                    } else {
                        Write-ColorOutput "⚠️ n8n 安装可能不完整，尝试本地安装" "Yellow"
                        npm install n8n --no-fund --no-save --loglevel=error
                    }
                } catch {
                    Write-ColorOutput "⚠️ n8n 安装出现问题: $($_.Exception.Message)" "Yellow"
                    Write-ColorOutput "🔄 尝试本地安装..." "Blue"
                    npm install n8n --no-fund --no-save --loglevel=error
                }
            }
            
            # 启动n8n作为后台作业
            Write-ColorOutput "🚀 启动 n8n (端口 $($ports.n8n))..." "Green"
            $job = Start-Job -ScriptBlock {
                param($port)
                # 设置环境变量
                $env:N8N_PORT = $port
                $env:N8N_EDITOR_BASE_URL = "http://localhost:$port"
                
                # 启动n8n
                npx n8n start --port $port
            } -ArgumentList $ports.n8n
            
            # 保存作业引用
            $Global:services["n8n"].job = $job
            
            # 等待n8n启动 (使用进度条)
            $n8nUrl = $Global:services["n8n"].url
            $maxWait = $StartupTimeout  # n8n可能需要更长时间
            $waited = 0
            $progressParams = @{
                Activity = "等待n8n服务启动"
                Status = "检查可用性..."
                PercentComplete = 0
            }
            
            Write-Progress @progressParams
            
            do {
                Start-Sleep -Milliseconds 1000
                $waited++
                $progressParams.PercentComplete = [Math]::Min(100, ($waited / $maxWait) * 100)
                Write-Progress @progressParams
                
                try {
                    $null = Invoke-WebRequest -Uri $n8nUrl -TimeoutSec 2 -Method Head -ErrorAction SilentlyContinue
                    Write-Progress -Activity "n8n服务启动" -Status "已完成" -Completed
                    Write-ColorOutput "✅ n8n 服务启动成功！(⏱️ $(Get-RunningTime))" "Green"
                    Write-ColorOutput "🔗 n8n 地址: $n8nUrl" "Cyan"
                    $Global:services["n8n"].status = "running"
                    return $true
                } catch {
                    # 检查作业是否仍在运行
                    if ($job.State -ne "Running") {
                        Write-ColorOutput "⚠️ n8n 服务进程已停止" "Yellow"
                        break
                    }
                    # 继续等待
                }
                
                # 每10秒显示一次状态
                if ($waited % 10 -eq 0) {
                    Write-ColorOutput "⏳ 正在等待 n8n 启动... ($waited 秒)" "Blue"
                    # 检查作业输出
                    if ($Verbose) {
                        $jobOutput = Receive-Job -Job $job -Keep -ErrorAction SilentlyContinue
                        if ($jobOutput) {
                            $lastLines = $jobOutput | Select-Object -Last 3
                            $lastLines | ForEach-Object { Write-ColorOutput "   $_" "Blue" }
                        }
                    }
                }
            } while ($waited -lt $maxWait)
            
            Write-Progress -Activity "n8n服务启动" -Status "可能需要更多时间" -Completed
            Write-ColorOutput "⚠️ n8n 服务启动中，可能需要更多时间... ($(Get-RunningTime))" "Yellow"
            Write-ColorOutput "🔗 请稍后访问: $n8nUrl" "Cyan"
            $Global:services["n8n"].status = "starting"
            return $true  # 即使还没完全启动，也返回成功
        }
        catch {
            Write-ColorOutput "⚠️ n8n启动过程中出现问题: $($_.Exception.Message)" "Yellow"
            if ($Verbose) {
                Write-ColorOutput $_.Exception.StackTrace "Yellow"
            }
            $Global:services["n8n"].status = "warning"
            return $false
        }
    }
    
    # 显示服务状态
    function Show-ServiceStatus {
        Write-ColorOutput "" 
        Write-ColorOutput "🔍 服务状态 (⏱️ $(Get-RunningTime)):" "Cyan"
        Write-ColorOutput "------------------------------------------------" "Cyan"
        
        foreach ($svcKey in $Global:services.Keys) {
            $svc = $Global:services[$svcKey]
            $statusIcon = switch ($svc.status) {
                "running" { "✅" }
                "warning" { "⚠️" }
                "failed" { "❌" }
                "starting" { "⏳" }
                default { "❓" }
            }
            
            $statusColor = switch ($svc.status) {
                "running" { "Green" }
                "warning" { "Yellow" }
                "failed" { "Red" }
                "starting" { "Blue" }
                default { "White" }
            }
            
            # 计算运行时间
            $runTime = [Math]::Round(((Get-Date) - $svc.startTime).TotalSeconds, 1)
            
            Write-ColorOutput "$statusIcon $($svc.name) [$($svc.status)] - $($svc.url) (启动用时: ${runTime}秒)" $statusColor
        }
        Write-ColorOutput "------------------------------------------------" "Cyan"
    }

    # 根据模式启动服务
    $success = $true
    $startTime = Get-Date
    
    switch ($Mode.ToLower()) {
        "backend" {
            Write-ColorOutput "🚀 启动后端服务..." "Cyan"
            $success = Start-Backend
            if ($success) {
                Show-ServiceStatus
            }
        }
        "frontend" {
            Write-ColorOutput "🚀 启动前端应用..." "Cyan"
            $success = Start-Frontend
            if ($success) {
                Show-ServiceStatus
            }
        }
        "n8n" {
            Write-ColorOutput "🚀 启动n8n工作流引擎..." "Cyan"
            $success = Start-N8n
            if ($success) {
                Show-ServiceStatus
            }
        }
        "all" {
            Write-ColorOutput "🚀 启动完整系统..." "Cyan"
            # 后端是核心，必须成功
            $backendSuccess = Start-Backend
            if (-not $backendSuccess) {
                Write-ColorOutput "❌ 后端启动失败，无法继续" "Red"
                $success = $false
                break
            }
            # 前端和n8n可以并行启动，修正路径为绝对路径
            $scriptFullPath = $MyInvocation.MyCommand.Path
            $frontendJob = Start-ThreadJob -ScriptBlock {
                param($ScriptPath)
                & $ScriptPath -Mode frontend -SkipDepsCheck -Verbose:$Verbose
            } -ArgumentList $scriptFullPath
            # 先等待一下，避免端口冲突问题
            Start-Sleep -Seconds 2
            $n8nSuccess = Start-N8n
            # 等待前端任务完成
            Wait-Job $frontendJob | Out-Null
            $frontendOutput = Receive-Job $frontendJob
            Remove-Job $frontendJob
            if ($Verbose) {
                $frontendOutput | ForEach-Object { Write-ColorOutput "   $_" "Blue" }
            }
            $frontendSuccess = $Global:services.ContainsKey("frontend") -and 
                              ($Global:services["frontend"].status -eq "running" -or 
                               $Global:services["frontend"].status -eq "starting")
            # 显示整体状态
            Show-ServiceStatus
            $success = $backendSuccess -and ($frontendSuccess -or $n8nSuccess)
        }
        default {
            Write-ColorOutput "❌ 无效的启动模式: $Mode" "Red"
            Write-ColorOutput "支持的模式: all, backend, frontend, n8n" "Yellow"
            exit 1
        }
    }
    
    # 显示总耗时
    $totalTime = [Math]::Round(((Get-Date) - $startTime).TotalSeconds, 1)
    Write-ColorOutput "⏱️ 总启动时间: ${totalTime}秒" "Blue"
    
    # 定义停止所有服务的函数
    function Stop-AllServices {
        Write-ColorOutput "🛑 正在停止所有服务..." "Yellow"
        
        # 按照相反的顺序停止服务
        $services = @("n8n", "frontend", "backend")
        foreach ($svcName in $services) {
            if ($Global:services.ContainsKey($svcName)) {
                $svc = $Global:services[$svcName]
                if ($null -ne $svc.job) {
                    Write-ColorOutput "🛑 正在停止 $($svc.name)..." "Yellow"
                    Stop-Job -Job $svc.job -ErrorAction SilentlyContinue
                    Remove-Job -Job $svc.job -ErrorAction SilentlyContinue
                }
                
                # 释放端口
                if ($svc.port) {
                    Stop-PortProcess -Port $svc.port -ServiceName "node" -Force
                }
            }
        }
        
        # 清理所有其他作业
        Get-Job | Stop-Job -ErrorAction SilentlyContinue
        Get-Job | Remove-Job -ErrorAction SilentlyContinue
        
        Write-ColorOutput "✅ 所有服务已停止" "Green"
    }

    if ($success) {
        Write-ColorOutput "" 
        Write-ColorOutput "🎉 启动完成！" "Green"
        Write-ColorOutput "================================================" "Cyan"
        
        # 显示可用API和功能
        if ($Mode -eq "all" -or $Mode -eq "backend") {
            Write-ColorOutput "📚 后端 API 功能:" "Cyan"
            Write-ColorOutput "   - 健康检查: http://localhost:$($ports.backend)/api/health" "Blue"
            Write-ColorOutput "   - 诗词列表: http://localhost:$($ports.backend)/api/poems" "Blue"
            Write-ColorOutput "   - 随机诗词: http://localhost:$($ports.backend)/api/poems/random" "Blue"
            Write-ColorOutput "   - 诗词搜索: http://localhost:$($ports.backend)/api/poems/search?q=关键词" "Blue"
        }
        
        Write-ColorOutput "" 
        Write-ColorOutput "💡 使用提示：" "Yellow"
        Write-ColorOutput "   - 按 Ctrl+C 或运行 'esc' 命令停止所有服务" "Yellow"
        Write-ColorOutput "   - 输入 'status' 查看服务状态" "Yellow"
        Write-ColorOutput "   - 输入 'restart 服务名' 重启特定服务 (backend/frontend/n8n)" "Yellow"
        Write-ColorOutput "   - 输入 'logs 服务名' 查看服务日志" "Yellow"
        Write-ColorOutput "   - 输入 'help' 获取更多帮助" "Yellow"
        
        # 自动打开浏览器
        if ($OpenBrowser -and ($Mode -eq "all" -or $Mode -eq "frontend") -and 
            $Global:services.ContainsKey("frontend")) {
            Start-Sleep -Seconds 2
            try {
                Start-Process $Global:services["frontend"].url
                Write-ColorOutput "🔗 浏览器已自动打开" "Green"
            } catch {
                Write-ColorOutput "⚠️ 无法自动打开浏览器，请手动访问" "Yellow"
            }
        }
        
        # 如果是all模式，进入交互式会话
        if ($Mode -eq "all") {
            Write-ColorOutput "" 
            $continue = $true
            
            while ($continue) {
                Write-ColorOutput "古诗文学习平台 > " "Cyan" -NoNewLine
                $command = Read-Host
                
                switch -Regex ($command.ToLower()) {
                    "^exit|^quit|^q|^esc" { 
                        $continue = $false 
                        Stop-AllServices
                    }
                    "^status|^st|^s" { 
                        Show-ServiceStatus
                    }
                    "^restart backend|^r b" { 
                        Write-ColorOutput "🔄 重启后端服务..." "Yellow"
                        if ($Global:services.ContainsKey("backend")) {
                            Stop-Job -Job $Global:services["backend"].job -ErrorAction SilentlyContinue
                            Remove-Job -Job $Global:services["backend"].job -ErrorAction SilentlyContinue
                        }
                        Start-Backend
                    }
                    "^restart frontend|^r f" { 
                        Write-ColorOutput "🔄 重启前端服务..." "Yellow"
                        if ($Global:services.ContainsKey("frontend")) {
                            Stop-Job -Job $Global:services["frontend"].job -ErrorAction SilentlyContinue
                            Remove-Job -Job $Global:services["frontend"].job -ErrorAction SilentlyContinue
                        }
                        Start-Frontend
                    }
                    "^restart n8n|^r n" { 
                        Write-ColorOutput "🔄 重启n8n服务..." "Yellow"
                        if ($Global:services.ContainsKey("n8n")) {
                            Stop-Job -Job $Global:services["n8n"].job -ErrorAction SilentlyContinue
                            Remove-Job -Job $Global:services["n8n"].job -ErrorAction SilentlyContinue
                        }
                        Start-N8n
                    }
                    "^logs backend|^l b" {
                        Write-ColorOutput "📃 后端服务日志:" "Blue"
                        if ($Global:services.ContainsKey("backend") -and $Global:services["backend"].job) {
                            Receive-Job -Job $Global:services["backend"].job -Keep | ForEach-Object {
                                Write-ColorOutput "   $_" "Blue"
                            }
                        } else {
                            Write-ColorOutput "   没有可用的日志" "Yellow"
                        }
                    }
                    "^logs frontend|^l f" {
                        Write-ColorOutput "� 前端服务日志:" "Blue"
                        if ($Global:services.ContainsKey("frontend") -and $Global:services["frontend"].job) {
                            Receive-Job -Job $Global:services["frontend"].job -Keep | ForEach-Object {
                                Write-ColorOutput "   $_" "Blue"
                            }
                        } else {
                            Write-ColorOutput "   没有可用的日志" "Yellow"
                        }
                    }
                    "^logs n8n|^l n" {
                        Write-ColorOutput "📃 n8n服务日志:" "Blue"
                        if ($Global:services.ContainsKey("n8n") -and $Global:services["n8n"].job) {
                            Receive-Job -Job $Global:services["n8n"].job -Keep | ForEach-Object {
                                Write-ColorOutput "   $_" "Blue"
                            }
                        } else {
                            Write-ColorOutput "   没有可用的日志" "Yellow"
                        }
                    }
                    "^open|^o" {
                        if ($Global:services.ContainsKey("frontend")) {
                            Start-Process $Global:services["frontend"].url
                            Write-ColorOutput "🔗 已在浏览器中打开前端" "Green"
                        } else {
                            Write-ColorOutput "⚠️ 前端服务不可用" "Yellow"
                        }
                    }
                    "^help|^h|\?" {
                        Write-ColorOutput "" 
                        Write-ColorOutput "📚 可用命令:" "Cyan"
                        Write-ColorOutput "   status, s         - 显示所有服务的状态" "White"
                        Write-ColorOutput "   restart [服务名]   - 重启指定服务 (backend/frontend/n8n)" "White"
                        Write-ColorOutput "   logs [服务名]      - 显示指定服务的日志" "White"
                        Write-ColorOutput "   open              - 在浏览器中打开前端应用" "White"
                        Write-ColorOutput "   exit, quit, q     - 停止所有服务并退出" "White"
                        Write-ColorOutput "   help, h, ?        - 显示此帮助信息" "White"
                        Write-ColorOutput "" 
                    }
                    default {
                        if ($command -ne "") {
                            Write-ColorOutput "❓ 未知命令: $command" "Yellow"
                            Write-ColorOutput "   输入 'help' 获取可用命令列表" "Yellow"
                        }
                    }
                }
            }
        }
    } else {
        Write-ColorOutput "❌ 启动失败，请检查错误信息" "Red"
        
        # 显示失败服务的日志
        foreach ($svcKey in $Global:services.Keys) {
            $svc = $Global:services[$svcKey]
            if ($svc.status -eq "failed" -and $svc.job) {
                Write-ColorOutput "📃 $($svc.name) 启动日志:" "Red"
                Receive-Job -Job $svc.job | ForEach-Object {
                    Write-ColorOutput "   $_" "Yellow"
                }
            }
        }
        
        # 停止所有已启动的服务
        Stop-AllServices
        exit 1
    }

} catch {
    Write-ColorOutput "❌ 脚本执行出错: $($_.Exception.Message)" "Red"
    if ($Verbose) {
        Write-ColorOutput "详细错误信息:" "Red"
        Write-ColorOutput $_.Exception.StackTrace "Red"
    }
    exit 1
}

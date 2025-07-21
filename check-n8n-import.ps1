# n8n 工作流导入检查脚本

Write-Host "=== n8n 工作流导入状态检查 ===" -ForegroundColor Green

# 检查 n8n 服务状态
Write-Host "`n🔍 检查 n8n 服务状态..." -ForegroundColor Yellow

try {
    $response = Invoke-WebRequest -Uri "http://localhost:5678" -TimeoutSec 10 -UseBasicParsing -ErrorAction Stop
    Write-Host "✅ n8n 服务运行正常 (端口 5678)" -ForegroundColor Green
    $n8nRunning = $true
} catch {
    Write-Host "❌ n8n 服务未运行或不可访问" -ForegroundColor Red
    Write-Host "   请先启动 n8n: npx n8n start" -ForegroundColor Yellow
    $n8nRunning = $false
}

if ($n8nRunning) {
    Write-Host "`n📁 检查工作流文件完整性..." -ForegroundColor Yellow
    
    $workflowFiles = @(
        "01-ai-content-generator.json",
        "02-recommendation-system.json", 
        "03-learning-assistant.json",
        "04-progress-tracking.json",
        "05-analytics-system.json",
        "06-image-generation.json",
        "07-assessment-system.json"
    )
    
    $workflowPath = "c:\Users\Amleth\Desktop\workspace\classical-poetry-learning\n8n-workflows\"
    $foundFiles = 0
    
    foreach ($file in $workflowFiles) {
        $filePath = Join-Path $workflowPath $file
        if (Test-Path $filePath) {
            $fileSize = (Get-Item $filePath).Length
            Write-Host "✅ $file ($fileSize 字节)" -ForegroundColor Green
            $foundFiles++
        } else {
            Write-Host "❌ $file (未找到)" -ForegroundColor Red
        }
    }
    
    Write-Host "`n📊 工作流文件统计:" -ForegroundColor Cyan
    Write-Host "   找到文件: $foundFiles / $($workflowFiles.Count)" -ForegroundColor White
    
    if ($foundFiles -eq $workflowFiles.Count) {
        Write-Host "✅ 所有核心工作流文件就绪！" -ForegroundColor Green
    } else {
        Write-Host "⚠️  部分工作流文件缺失" -ForegroundColor Yellow
    }
    
    Write-Host "`n🧪 测试工作流端点可用性..." -ForegroundColor Yellow
    
    $endpoints = @(
        @{Name="AI内容生成"; Url="http://localhost:5678/webhook/ai-generation"; TestData='{"type":"test"}'},
        @{Name="推荐系统"; Url="http://localhost:5678/webhook/get-recommendations"; TestData='{"userId":"test"}'},
        @{Name="学习助手"; Url="http://localhost:5678/webhook/learning-assistant"; TestData='{"query":"test"}'},
        @{Name="进度跟踪"; Url="http://localhost:5678/webhook/track-progress"; TestData='{"userId":"test"}'},
        @{Name="数据分析"; Url="http://localhost:5678/webhook/analytics"; TestData='{"userId":"test"}'},
        @{Name="图像生成"; Url="http://localhost:5678/webhook/generate-image"; TestData='{"poemTitle":"test"}'}
    )
    
    $activeEndpoints = 0
    
    foreach ($endpoint in $endpoints) {
        try {
            $result = Invoke-RestMethod -Uri $endpoint.Url -Method POST -Body $endpoint.TestData -ContentType "application/json" -TimeoutSec 5 -ErrorAction Stop
            Write-Host "✅ $($endpoint.Name) - 响应正常" -ForegroundColor Green
            $activeEndpoints++
        } catch {
            Write-Host "❌ $($endpoint.Name) - 未响应或未激活" -ForegroundColor Red
        }
    }
    
    Write-Host "`n📈 端点测试结果:" -ForegroundColor Cyan
    Write-Host "   活跃端点: $activeEndpoints / $($endpoints.Count)" -ForegroundColor White
    
    Write-Host "`n📋 导入建议:" -ForegroundColor Cyan
    
    if ($activeEndpoints -eq 0) {
        Write-Host "🔴 需要导入并激活工作流！" -ForegroundColor Red
        Write-Host "   1. 访问 http://localhost:5678" -ForegroundColor White
        Write-Host "   2. 按顺序导入 01-07 工作流文件" -ForegroundColor White
        Write-Host "   3. 激活每个导入的工作流" -ForegroundColor White
    } elseif ($activeEndpoints -lt $endpoints.Count) {
        Write-Host "🟡 部分工作流已导入，建议补充剩余工作流" -ForegroundColor Yellow
        Write-Host "   继续导入未激活的工作流文件" -ForegroundColor White
    } else {
        Write-Host "🟢 所有核心工作流已成功导入并激活！" -ForegroundColor Green
        Write-Host "   可以开始在应用中使用 AI 功能了" -ForegroundColor White
    }
}

Write-Host "`n=== 检查完成 ===" -ForegroundColor Green
Write-Host "💡 提示：查看 IMPORT-WORKFLOWS.md 获取详细导入指南" -ForegroundColor Cyan

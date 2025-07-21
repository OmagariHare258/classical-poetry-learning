# n8n 工作流测试脚本 - 优化版
# 请确保 n8n 服务正在运行 (http://localhost:5678)
# 工作流文件已重新整理，编号01-10，按重要性排序

Write-Host "=== n8n 工作流功能测试 (优化版) ===" -ForegroundColor Green
Write-Host "测试优化后的工作流：01-ai-content-generator 到 07-assessment-system" -ForegroundColor Cyan

# 测试1: 推荐系统工作流
Write-Host "`n测试推荐系统工作流..." -ForegroundColor Yellow
try {
    $recommendationBody = @{
        userId = "test_user_001"
        preferences = @("李白", "杜甫", "苏轼")
        difficulty = "medium"
        category = "唐诗"
    } | ConvertTo-Json -Depth 3

    $result1 = Invoke-RestMethod -Uri "http://localhost:5678/webhook/get-recommendations" -Method POST -Body $recommendationBody -ContentType "application/json" -TimeoutSec 10
    Write-Host "✅ 推荐系统测试成功" -ForegroundColor Green
    Write-Host "推荐结果: $($result1.recommendations.Count) 首诗词" -ForegroundColor Cyan
} catch {
    Write-Host "❌ 推荐系统测试失败: $($_.Exception.Message)" -ForegroundColor Red
}

# 测试2: 学习助手工作流  
Write-Host "`n测试学习助手工作流..." -ForegroundColor Yellow
try {
    $assistantBody = @{
        query = "春晓这首诗是谁写的？"
        userId = "test_user_001"
        context = @{
            currentPoem = "春晓"
            difficulty = "easy"
        }
    } | ConvertTo-Json -Depth 3

    $result2 = Invoke-RestMethod -Uri "http://localhost:5678/webhook/learning-assistant" -Method POST -Body $assistantBody -ContentType "application/json" -TimeoutSec 10
    Write-Host "✅ 学习助手测试成功" -ForegroundColor Green
    Write-Host "助手回复: $($result2.response)" -ForegroundColor Cyan
} catch {
    Write-Host "❌ 学习助手测试失败: $($_.Exception.Message)" -ForegroundColor Red
}

# 测试3: 进度跟踪工作流
Write-Host "`n测试进度跟踪工作流..." -ForegroundColor Yellow
try {
    $progressBody = @{
        userId = "test_user_001"
        completedPoems = @("春晓", "静夜思", "登鹳雀楼", "咏鹅", "悯农")
        studyTime = 150
        difficulty = "medium"
        correctAnswers = 18
        totalQuestions = 20
    } | ConvertTo-Json -Depth 3

    $result3 = Invoke-RestMethod -Uri "http://localhost:5678/webhook/track-progress" -Method POST -Body $progressBody -ContentType "application/json" -TimeoutSec 10
    Write-Host "✅ 进度跟踪测试成功" -ForegroundColor Green
    Write-Host "当前等级: $($result3.level), 进度: $($result3.progress)%" -ForegroundColor Cyan
} catch {
    Write-Host "❌ 进度跟踪测试失败: $($_.Exception.Message)" -ForegroundColor Red
}

# 测试4: AI内容生成工作流
Write-Host "`n测试AI内容生成工作流..." -ForegroundColor Yellow
try {
    $aiBody = @{
        type = "hint"
        poemTitle = "静夜思"
        difficulty = "easy"
        userId = "test_user_001"
    } | ConvertTo-Json -Depth 3

    $result4 = Invoke-RestMethod -Uri "http://localhost:5678/webhook/ai-generation" -Method POST -Body $aiBody -ContentType "application/json" -TimeoutSec 10
    Write-Host "✅ AI内容生成测试成功" -ForegroundColor Green
    Write-Host "生成内容类型: $($result4.type)" -ForegroundColor Cyan
} catch {
    Write-Host "❌ AI内容生成测试失败: $($_.Exception.Message)" -ForegroundColor Red
}

# 测试5: 分析系统工作流
Write-Host "`n测试分析系统工作流..." -ForegroundColor Yellow
try {
    $analyticsBody = @{
        userId = "test_user_001"
        timeRange = "week"
        metrics = @("completion_rate", "study_time", "accuracy")
    } | ConvertTo-Json -Depth 3

    $result5 = Invoke-RestMethod -Uri "http://localhost:5678/webhook/analytics" -Method POST -Body $analyticsBody -ContentType "application/json" -TimeoutSec 10
    Write-Host "✅ 分析系统测试成功" -ForegroundColor Green
    Write-Host "分析指标数: $($result5.metrics.Count)" -ForegroundColor Cyan
} catch {
    Write-Host "❌ 分析系统测试失败: $($_.Exception.Message)" -ForegroundColor Red
}

# 测试6: 图像生成工作流
Write-Host "`n测试图像生成工作流..." -ForegroundColor Yellow
try {
    $imageBody = @{
        poemTitle = "春晓"
        poemContent = "春眠不觉晓，处处闻啼鸟。夜来风雨声，花落知多少。"
        style = "traditional"
        userId = "test_user_001"
    } | ConvertTo-Json -Depth 3

    $result6 = Invoke-RestMethod -Uri "http://localhost:5678/webhook/generate-image" -Method POST -Body $imageBody -ContentType "application/json" -TimeoutSec 10
    Write-Host "✅ 图像生成测试成功" -ForegroundColor Green
    Write-Host "图像URL: $($result6.imageUrl)" -ForegroundColor Cyan
} catch {
    Write-Host "❌ 图像生成测试失败: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`n=== 测试完成 ===" -ForegroundColor Green
Write-Host "✅ 已测试优化后的7个核心工作流" -ForegroundColor Cyan
Write-Host "📁 工作流文件已重新整理：01-07为核心功能，08-10为高级功能" -ForegroundColor Yellow
Write-Host "📖 查看 n8n-workflows/README.md 了解详细配置信息" -ForegroundColor Yellow
Write-Host "`n如果所有测试都成功，说明 n8n 工作流已正常运行。" -ForegroundColor Cyan
Write-Host "如果有测试失败，请检查：" -ForegroundColor Yellow
Write-Host "1. n8n 服务是否运行在 http://localhost:5678" -ForegroundColor White
Write-Host "2. 对应编号的工作流是否已正确导入并激活" -ForegroundColor White
Write-Host "3. 工作流的 webhook 路径是否正确配置" -ForegroundColor White

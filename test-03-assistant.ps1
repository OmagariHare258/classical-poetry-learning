# 测试 03-learning-assistant.json 文件

Write-Host "=== 测试学习助手工作流文件 ===" -ForegroundColor Green

# 检查文件是否存在和格式正确
$filePath = "c:\Users\Amleth\Desktop\workspace\classical-poetry-learning\n8n-workflows\03-learning-assistant.json"

if (Test-Path $filePath) {
    Write-Host "✅ 文件存在" -ForegroundColor Green
    
    try {
        $jsonContent = Get-Content $filePath -Raw | ConvertFrom-Json
        Write-Host "✅ JSON 格式正确" -ForegroundColor Green
        
        # 检查必需的字段
        if ($jsonContent.name) {
            Write-Host "✅ 工作流名称: $($jsonContent.name)" -ForegroundColor Green
        } else {
            Write-Host "❌ 缺少工作流名称" -ForegroundColor Red
        }
        
        if ($jsonContent.nodes) {
            Write-Host "✅ 节点数量: $($jsonContent.nodes.Count)" -ForegroundColor Green
        } else {
            Write-Host "❌ 缺少节点定义" -ForegroundColor Red
        }
        
        if ($jsonContent.connections) {
            Write-Host "✅ 连接定义存在" -ForegroundColor Green
        } else {
            Write-Host "❌ 缺少连接定义" -ForegroundColor Red
        }
        
        Write-Host "`n📋 工作流详情:" -ForegroundColor Cyan
        Write-Host "   名称: $($jsonContent.name)" -ForegroundColor White
        Write-Host "   节点数: $($jsonContent.nodes.Count)" -ForegroundColor White
        Write-Host "   版本: $($jsonContent.versionId)" -ForegroundColor White
        
        Write-Host "`n🚀 文件准备就绪，可以导入到 n8n!" -ForegroundColor Green
        
    } catch {
        Write-Host "❌ JSON 格式错误: $($_.Exception.Message)" -ForegroundColor Red
    }
} else {
    Write-Host "❌ 文件不存在: $filePath" -ForegroundColor Red
}

# 如果 n8n 正在运行，尝试测试端点
Write-Host "`n🔍 检查 n8n 服务状态..." -ForegroundColor Yellow

try {
    $testResponse = Invoke-WebRequest -Uri "http://localhost:5678" -TimeoutSec 5 -UseBasicParsing -ErrorAction Stop
    Write-Host "✅ n8n 服务正在运行" -ForegroundColor Green
    
    Write-Host "`n📌 导入步骤:" -ForegroundColor Cyan
    Write-Host "1. 在浏览器打开 http://localhost:5678" -ForegroundColor White
    Write-Host "2. 点击 '+ 新建' -> '导入工作流' -> '从文件导入'" -ForegroundColor White
    Write-Host "3. 选择文件: 03-learning-assistant.json" -ForegroundColor White
    Write-Host "4. 导入后激活工作流" -ForegroundColor White
    
} catch {
    Write-Host "❌ n8n 服务未运行" -ForegroundColor Red
    Write-Host "   请先运行: npx n8n start" -ForegroundColor Yellow
}

Write-Host "`n=== 测试完成 ===" -ForegroundColor Green

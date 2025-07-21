# 检查所有工作流文件的导入兼容性

Write-Host "=== n8n 工作流文件兼容性检查 ===" -ForegroundColor Green

$workflowPath = "c:\Users\Amleth\Desktop\workspace\classical-poetry-learning\n8n-workflows\"
$workflowFiles = @(
    "01-ai-content-generator.json",
    "02-recommendation-system.json", 
    "03-learning-assistant.json",
    "04-progress-tracking.json",
    "05-analytics-system.json",
    "06-image-generation.json",
    "07-assessment-system.json",
    "08-learning-flow.json",
    "09-immersive-image-generation.json",
    "10-immersive-progress-tracking.json"
)

$goodFiles = @()
$problemFiles = @()

foreach ($file in $workflowFiles) {
    $filePath = Join-Path $workflowPath $file
    
    if (Test-Path $filePath) {
        try {
            $jsonContent = Get-Content $filePath -Raw | ConvertFrom-Json
            $fileSize = (Get-Item $filePath).Length
            
            # 检查基本字段
            $hasName = $jsonContent.name -ne $null
            $hasNodes = $jsonContent.nodes -ne $null -and $jsonContent.nodes.Count -gt 0
            $hasConnections = $jsonContent.connections -ne $null
            
            # 检查复杂特性
            $hasHttpRequest = $false
            $hasComplexCode = $false
            $nodeCount = $jsonContent.nodes.Count
            
            foreach ($node in $jsonContent.nodes) {
                if ($node.type -eq "n8n-nodes-base.httpRequest") {
                    $hasHttpRequest = $true
                }
                if ($node.type -eq "n8n-nodes-base.code" -and $node.parameters.jsCode.Length -gt 1000) {
                    $hasComplexCode = $true
                }
            }
            
            if ($hasName -and $hasNodes -and $hasConnections) {
                $status = "✅"
                $issues = @()
                
                if ($hasHttpRequest) {
                    $issues += "HTTP请求节点"
                }
                if ($hasComplexCode) {
                    $issues += "复杂代码"
                }
                if ($nodeCount -gt 10) {
                    $issues += "节点过多"
                }
                
                if ($issues.Count -eq 0) {
                    $goodFiles += $file
                    Write-Host "$status $file ($fileSize 字节, $nodeCount 节点) - 兼容性良好" -ForegroundColor Green
                } else {
                    $problemFiles += @{File=$file; Issues=$issues; Size=$fileSize; Nodes=$nodeCount}
                    Write-Host "⚠️  $file ($fileSize 字节, $nodeCount 节点) - 可能问题: $($issues -join ', ')" -ForegroundColor Yellow
                }
            } else {
                $problemFiles += @{File=$file; Issues=@("结构不完整"); Size=$fileSize; Nodes=$nodeCount}
                Write-Host "❌ $file ($fileSize 字节) - 结构问题" -ForegroundColor Red
            }
            
        } catch {
            $problemFiles += @{File=$file; Issues=@("JSON格式错误"); Size=0; Nodes=0}
            Write-Host "❌ $file - JSON格式错误: $($_.Exception.Message)" -ForegroundColor Red
        }
    } else {
        Write-Host "❌ $file - 文件不存在" -ForegroundColor Red
    }
}

Write-Host "`n📊 检查结果总结:" -ForegroundColor Cyan
Write-Host "   ✅ 兼容性良好: $($goodFiles.Count) 个文件" -ForegroundColor Green
Write-Host "   ⚠️  可能有问题: $($problemFiles.Count) 个文件" -ForegroundColor Yellow

if ($goodFiles.Count -gt 0) {
    Write-Host "`n🟢 推荐优先导入的文件:" -ForegroundColor Green
    foreach ($file in $goodFiles) {
        Write-Host "   - $file" -ForegroundColor White
    }
}

if ($problemFiles.Count -gt 0) {
    Write-Host "`n🟡 需要注意的文件:" -ForegroundColor Yellow
    foreach ($item in $problemFiles) {
        Write-Host "   - $($item.File): $($item.Issues -join ', ')" -ForegroundColor White
    }
    
    Write-Host "`n💡 建议:" -ForegroundColor Cyan
    Write-Host "   1. 先导入✅标记的简单工作流" -ForegroundColor White
    Write-Host "   2. 确认基础功能正常后，再尝试⚠️标记的复杂工作流" -ForegroundColor White
    Write-Host "   3. 如遇到导入错误，可使用简化版本替代" -ForegroundColor White
}

Write-Host "`n=== 检查完成 ===" -ForegroundColor Green

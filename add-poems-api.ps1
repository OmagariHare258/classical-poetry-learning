# 通过API添加古诗文数据
Write-Host "📚 通过API添加古诗文数据" -ForegroundColor Green
Write-Host "================================" -ForegroundColor Green

$apiBase = "http://localhost:3001/api"

# 要添加的诗词数据
$poems = @(
    @{
        title = "早发白帝城"
        author = "李白" 
        dynasty = "唐"
        content = "朝辞白帝彩云间，千里江陵一日还。两岸猿声啼不住，轻舟已过万重山。"
        translation = "清晨告别五彩云霞映照的白帝城，千里之遥的江陵一天就能到达。两岸猿猴啼声还在耳边不断，轻快的小船已驶过万重青山。"
        difficulty = "medium"
        category = "豪放,山水"
    },
    @{
        title = "绝句"
        author = "杜甫"
        dynasty = "唐" 
        content = "两个黄鹂鸣翠柳，一行白鹭上青天。窗含西岭千秋雪，门泊东吴万里船。"
        translation = "两只黄鹂在翠绿的柳树间婉转地歌唱，一队整齐的白鹭直冲向蔚蓝的天空。我坐在窗前，可以望见西岭上堆积着终年不化的积雪，门前停泊着自万里外的东吴远行而来的船只。"
        difficulty = "medium"
        category = "写景,色彩"
    },
    @{
        title = "九月九日忆山东兄弟"
        author = "王维"
        dynasty = "唐"
        content = "独在异乡为异客，每逢佳节倍思亲。遥知兄弟登高处，遍插茱萸少一人。"
        translation = "独自远离家乡无法与家人团聚，每到重阳佳节倍加思念远方的亲人。远远想到兄弟们身佩茱萸登上高处，也会因为少我一人而生遗憾之情。"
        difficulty = "medium"
        category = "思亲,节日"
    },
    @{
        title = "忆江南"
        author = "白居易"
        dynasty = "唐"
        content = "江南好，风景旧曾谙。日出江花红胜火，春来江水绿如蓝。能不忆江南？"
        translation = "江南的风景多么美好，如画的风景久已熟悉。春天到来时，太阳从江面升起，把江边的鲜花照得比火红，碧绿的江水绿得胜过蓝草。怎能叫人不怀念江南？"
        difficulty = "easy"
        category = "江南,怀念"
    },
    @{
        title = "游子吟"
        author = "孟郊"
        dynasty = "唐"
        content = "慈母手中线，游子身上衣。临行密密缝，意恐迟迟归。谁言寸草心，报得三春晖。"
        translation = "慈母用手中的针线，为远行的儿子赶制身上的衣衫。临行前一针针密密地缝缀，怕的是儿子回来得晚衣服破损。有谁敢说，子女像小草那样微弱的孝心，能够报答得了像春晖普泽的慈母恩情呢？"
        difficulty = "easy"
        category = "母爱,亲情"
    }
)

# 检查API健康状态
Write-Host "🔍 检查API状态..." -ForegroundColor Cyan
try {
    $health = Invoke-RestMethod -Uri "$apiBase/health" -Method GET -TimeoutSec 5
    Write-Host "✅ API服务正常运行" -ForegroundColor Green
} catch {
    Write-Host "❌ API服务不可用: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "请确保后端服务在端口3001上运行" -ForegroundColor Yellow
    exit 1
}

# 获取现有诗词数量
Write-Host "`n📊 获取现有数据..." -ForegroundColor Cyan
try {
    $existingPoems = Invoke-RestMethod -Uri "$apiBase/poems" -Method GET -TimeoutSec 5
    Write-Host "现有诗词数量: $($existingPoems.Count)" -ForegroundColor Yellow
    
    if ($existingPoems.Count -gt 0) {
        Write-Host "现有诗词列表:" -ForegroundColor Yellow
        $existingPoems[0..2] | ForEach-Object {
            Write-Host "  $($_.title) - $($_.author)" -ForegroundColor Gray
        }
    }
} catch {
    Write-Host "⚠️  无法获取现有数据: $($_.Exception.Message)" -ForegroundColor Yellow
}

# 添加新诗词
Write-Host "`n📝 添加新诗词..." -ForegroundColor Cyan
$successCount = 0
$errorCount = 0

foreach ($poem in $poems) {
    try {
        Write-Host "添加: $($poem.title) - $($poem.author)" -ForegroundColor Gray
        
        $response = Invoke-RestMethod -Uri "$apiBase/poems" -Method POST -Body ($poem | ConvertTo-Json) -ContentType "application/json" -TimeoutSec 10
        
        Write-Host "✅ $($poem.title) 添加成功 (ID: $($response.id))" -ForegroundColor Green
        $successCount++
        
    } catch {
        $errorMessage = $_.Exception.Message
        if ($errorMessage -like "*already exists*" -or $errorMessage -like "*UNIQUE*") {
            Write-Host "⚠️  $($poem.title) 已存在" -ForegroundColor Yellow
        } else {
            Write-Host "❌ $($poem.title) 添加失败: $errorMessage" -ForegroundColor Red
            $errorCount++
        }
    }
}

# 最终统计
Write-Host "`n📊 添加结果统计:" -ForegroundColor Green
Write-Host "成功添加: $successCount 首" -ForegroundColor Green
Write-Host "添加失败: $errorCount 首" -ForegroundColor Red

# 获取最终数据统计
try {
    $finalPoems = Invoke-RestMethod -Uri "$apiBase/poems" -Method GET -TimeoutSec 5
    Write-Host "数据库总诗词: $($finalPoems.Count) 首" -ForegroundColor Cyan
    
    # 按朝代统计
    $dynastyStats = $finalPoems | Group-Object dynasty | Sort-Object Count -Descending
    Write-Host "`n朝代分布:" -ForegroundColor Cyan
    $dynastyStats | ForEach-Object {
        Write-Host "  $($_.Name): $($_.Count) 首" -ForegroundColor Gray
    }
    
} catch {
    Write-Host "⚠️  无法获取最终统计" -ForegroundColor Yellow
}

Write-Host "`n🎉 古诗文数据添加完成！" -ForegroundColor Green
Write-Host "现在可以在前端应用中看到这些新添加的诗词了。" -ForegroundColor Cyan

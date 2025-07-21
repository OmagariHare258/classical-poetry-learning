# PowerShell脚本：向SQLite数据库添加古诗文数据
# 文件：add-poems.ps1

Write-Host "📚 古诗文数据库管理工具" -ForegroundColor Green
Write-Host "=================================" -ForegroundColor Green

$dbPath = "C:\Users\Amleth\Desktop\workspace\classical-poetry-learning\backend\data\poetry_learning.sqlite"

# 检查数据库文件是否存在
if (-not (Test-Path $dbPath)) {
    Write-Host "❌ 数据库文件不存在: $dbPath" -ForegroundColor Red
    exit 1
}

Write-Host "✅ 数据库文件: $dbPath" -ForegroundColor Green

# 检查当前诗词数量
Write-Host "`n📊 当前数据统计:" -ForegroundColor Cyan
try {
    $currentCount = sqlite3 "$dbPath" "SELECT COUNT(*) FROM poems;"
    Write-Host "现有诗词数量: $currentCount" -ForegroundColor Yellow
    
    $dynastyStats = sqlite3 "$dbPath" "SELECT dynasty || ': ' || COUNT(*) FROM poems GROUP BY dynasty ORDER BY COUNT(*) DESC;"
    Write-Host "朝代分布:" -ForegroundColor Yellow
    $dynastyStats | ForEach-Object { Write-Host "  $_" -ForegroundColor Gray }
} catch {
    Write-Host "⚠️  无法读取现有数据，可能是新数据库" -ForegroundColor Yellow
}

# 添加新诗词
Write-Host "`n📝 正在添加新诗词..." -ForegroundColor Cyan

$poems = @(
    @{
        title = '早发白帝城'
        author = '李白'
        dynasty = '唐'
        content = '朝辞白帝彩云间，千里江陵一日还。两岸猿声啼不住，轻舟已过万重山。'
        translation = '清晨告别五彩云霞映照的白帝城，千里之遥的江陵一天就能到达。两岸猿猴啼声还在耳边不断，轻快的小船已驶过万重青山。'
        difficulty = 'medium'
        category = '豪放,山水'
    },
    @{
        title = '绝句'
        author = '杜甫'
        dynasty = '唐'
        content = '两个黄鹂鸣翠柳，一行白鹭上青天。窗含西岭千秋雪，门泊东吴万里船。'
        translation = '两只黄鹂在翠绿的柳树间婉转地歌唱，一队整齐的白鹭直冲向蔚蓝的天空。我坐在窗前，可以望见西岭上堆积着终年不化的积雪，门前停泊着自万里外的东吴远行而来的船只。'
        difficulty = 'medium'
        category = '写景,色彩'
    },
    @{
        title = '九月九日忆山东兄弟'
        author = '王维'
        dynasty = '唐'
        content = '独在异乡为异客，每逢佳节倍思亲。遥知兄弟登高处，遍插茱萸少一人。'
        translation = '独自远离家乡无法与家人团聚，每到重阳佳节倍加思念远方的亲人。远远想到兄弟们身佩茱萸登上高处，也会因为少我一人而生遗憾之情。'
        difficulty = 'medium'
        category = '思亲,节日'
    },
    @{
        title = '忆江南'
        author = '白居易'
        dynasty = '唐'
        content = '江南好，风景旧曾谙。日出江花红胜火，春来江水绿如蓝。能不忆江南？'
        translation = '江南的风景多么美好，如画的风景久已熟悉。春天到来时，太阳从江面升起，把江边的鲜花照得比火红，碧绿的江水绿得胜过蓝草。怎能叫人不怀念江南？'
        difficulty = 'easy'
        category = '江南,怀念'
    },
    @{
        title = '回乡偶书'
        author = '贺知章'
        dynasty = '唐'
        content = '少小离家老大回，乡音无改鬓毛衰。儿童相见不相识，笑问客从何处来。'
        translation = '我在年少时离开家乡，到了迟暮之年才回来。我的乡音虽未改变，但鬓角的毛发却已经疏落。儿童们看见我，没有一个认识的。他们笑着询问：这客人是从何处而来的呀？'
        difficulty = 'easy'
        category = '思乡,人生'
    },
    @{
        title = '游子吟'
        author = '孟郊'
        dynasty = '唐'
        content = '慈母手中线，游子身上衣。临行密密缝，意恐迟迟归。谁言寸草心，报得三春晖。'
        translation = '慈母用手中的针线，为远行的儿子赶制身上的衣衫。临行前一针针密密地缝缀，怕的是儿子回来得晚衣服破损。有谁敢说，子女像小草那样微弱的孝心，能够报答得了像春晖普泽的慈母恩情呢？'
        difficulty = 'easy'
        category = '母爱,亲情'
    },
    @{
        title = '小池'
        author = '杨万里'
        dynasty = '宋'
        content = '泉眼无声惜细流，树阴照水爱晴柔。小荷才露尖尖角，早有蜻蜓立上头。'
        translation = '泉眼悄然无声是因舍不得细细的水流，树阴倒映水面是喜爱晴天和风的轻柔。娇嫩的小荷叶刚从水面露出尖尖的角，早有一只调皮的小蜻蜓立在它的上头。'
        difficulty = 'easy'
        category = '夏天,荷花'
    },
    @{
        title = '元日'
        author = '王安石'
        dynasty = '宋'
        content = '爆竹声中一岁除，春风送暖入屠苏。千门万户曈曈日，总把新桃换旧符。'
        translation = '阵阵轰鸣的爆竹声中，旧的一年已经过去；和暖的春风吹来了新年，人们欢乐地畅饮着新酿的屠苏酒。初升的太阳照耀着千家万户，他们都忙着把旧的桃符取下，换上新的桃符。'
        difficulty = 'easy'
        category = '新年,节日'
    },
    @{
        title = '梅花'
        author = '王安石'
        dynasty = '宋'
        content = '墙角数枝梅，凌寒独自开。遥知不是雪，为有暗香来。'
        translation = '那墙角的几枝梅花，冒着严寒独自盛开。远远的就知道洁白的梅花不是雪，因为有梅花的幽香传来。'
        difficulty = 'easy'
        category = '梅花,品格'
    }
)

$successCount = 0
$skipCount = 0

foreach ($poem in $poems) {
    try {
        # 转义单引号
        $title = $poem.title -replace "'", "''"
        $author = $poem.author -replace "'", "''"
        $dynasty = $poem.dynasty -replace "'", "''"
        $content = $poem.content -replace "'", "''"
        $translation = $poem.translation -replace "'", "''"
        $difficulty = $poem.difficulty -replace "'", "''"
        $category = $poem.category -replace "'", "''"
        
        $sql = "INSERT OR IGNORE INTO poems (title, author, dynasty, content, translation, difficulty, category) VALUES ('$title', '$author', '$dynasty', '$content', '$translation', '$difficulty', '$category');"
        
        $result = sqlite3 "$dbPath" "$sql"
        
        # 检查是否真的插入了
        $checkSql = "SELECT COUNT(*) FROM poems WHERE title = '$title' AND author = '$author';"
        $exists = sqlite3 "$dbPath" "$checkSql"
        
        if ($exists -gt 0) {
            Write-Host "✅ $($poem.title) - $($poem.author)" -ForegroundColor Green
            $successCount++
        } else {
            Write-Host "⚠️  $($poem.title) - $($poem.author) (已存在)" -ForegroundColor Yellow
            $skipCount++
        }
    } catch {
        Write-Host "❌ $($poem.title) - $($poem.author): $($_.Exception.Message)" -ForegroundColor Red
    }
}

# 最终统计
Write-Host "`n📊 添加完成统计:" -ForegroundColor Green
Write-Host "成功添加: $successCount 首" -ForegroundColor Green
Write-Host "跳过重复: $skipCount 首" -ForegroundColor Yellow

$finalCount = sqlite3 "$dbPath" "SELECT COUNT(*) FROM poems;"
Write-Host "数据库总诗词: $finalCount 首" -ForegroundColor Cyan

Write-Host "`n最新朝代分布:" -ForegroundColor Cyan
$finalStats = sqlite3 "$dbPath" "SELECT dynasty || ': ' || COUNT(*) FROM poems GROUP BY dynasty ORDER BY COUNT(*) DESC;"
$finalStats | ForEach-Object { Write-Host "  $_" -ForegroundColor Gray }

Write-Host "`n🎉 古诗文数据添加完成！" -ForegroundColor Green

# n8n 工作流导入指南

## 最新优化的工作流文件

我已经创建了以下经过优化的 v2 版本工作流文件，这些文件解决了导入和连接问题：

### 新建的工作流文件：
1. **ai-content-generator.json** - AI内容生成工作流（7个节点）
2. **recommendation-system.json** - 推荐系统工作流（3个节点）  
3. **analytics-system.json** - 分析系统工作流（3个节点）
4. **learning-assistant-v2.json** - 学习助手工作流（3个节点）
5. **progress-tracking-v2.json** - 进度跟踪工作流（3个节点）
6. **image-generation-v2.json** - 图像生成工作流（3个节点）

## 导入步骤

### 1. 启动 n8n 服务
```powershell
# 在项目根目录运行
npx n8n start
```

### 2. 访问 n8n 界面
打开浏览器，访问：http://localhost:5678

### 3. 导入工作流
1. 点击右上角的 **"+ 新建"** 按钮
2. 选择 **"导入工作流"**
3. 选择 **"从文件导入"**
4. 浏览并选择工作流 JSON 文件
5. 点击 **"导入"**

### 4. 验证导入成功
导入后应该看到：
- ✅ 节点正确显示
- ✅ 节点之间有连接线
- ✅ 没有错误提示
- ✅ 可以点击各个节点查看配置

## 工作流说明

### AI内容生成工作流 (ai-content-generator.json)
- **用途**：生成提示、图像、分析等AI内容
- **触发器**：POST /webhook/ai-generation
- **节点数**：7个（包含条件判断逻辑）

### 推荐系统工作流 (recommendation-system.json)
- **用途**：根据用户喜好推荐诗词
- **触发器**：POST /webhook/get-recommendations
- **节点数**：3个（简单线性流程）

### 分析系统工作流 (analytics-system.json)
- **用途**：分析学习进度和提供洞察
- **触发器**：POST /webhook/analytics
- **节点数**：3个（数据处理和分析）

### 学习助手工作流 (learning-assistant-v2.json)
- **用途**：智能问答助手
- **触发器**：POST /webhook/learning-assistant
- **节点数**：3个（问答处理逻辑）

### 进度跟踪工作流 (progress-tracking-v2.json)
- **用途**：跟踪学习进度和成就
- **触发器**：POST /webhook/track-progress
- **节点数**：3个（进度计算）

### 图像生成工作流 (image-generation-v2.json)
- **用途**：为诗词生成配图
- **触发器**：POST /webhook/generate-image
- **节点数**：3个（图像生成处理）

## 激活工作流

导入成功后：
1. 在工作流编辑界面，点击右上角的 **"激活"** 开关
2. 确保开关变为绿色（已激活状态）
3. 保存工作流

## 测试工作流

### 使用 PowerShell 测试

```powershell
# 测试推荐系统
$body = @{
    userId = "test123"
    preferences = @("李白", "杜甫")
    difficulty = "medium"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:5678/webhook/get-recommendations" -Method POST -Body $body -ContentType "application/json"

# 测试学习助手
$assistantBody = @{
    query = "如何学习古诗词？"
    userId = "test123"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:5678/webhook/learning-assistant" -Method POST -Body $assistantBody -ContentType "application/json"

# 测试进度跟踪
$progressBody = @{
    userId = "test123"
    completedPoems = @("春晓", "静夜思", "登鹳雀楼")
    studyTime = 120
    difficulty = "medium"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:5678/webhook/track-progress" -Method POST -Body $progressBody -ContentType "application/json"
```

## 常见问题解决

### 问题1：导入时提示 "Problem importing workflow Required"
**解决方案**：使用最新的 v2 版本工作流文件，这些文件已修复格式问题

### 问题2：导入后看不到节点连接线
**解决方案**：v2 版本工作流已正确定义连接关系，导入后应显示连接线

### 问题3：节点类型不兼容
**解决方案**：v2 版本使用兼容的节点类型（n8n-nodes-base.code 替代 function）

### 问题4：Webhook 路径冲突
**解决方案**：每个工作流使用不同的 webhook 路径，避免冲突

## 后端集成

工作流激活后，可以通过以下方式调用：

### 方式1：直接调用 n8n webhook
```javascript
fetch('http://localhost:5678/webhook/get-recommendations', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId, preferences, difficulty })
})
```

### 方式2：通过后端API代理
```javascript
fetch('http://localhost:3000/api/n8n/recommendations', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId, preferences, difficulty })
})
```

## 下一步

1. **导入所有 v2 版本工作流**
2. **逐个激活工作流**
3. **使用提供的测试命令验证功能**
4. **在前端集成调用这些工作流**
5. **根据实际需求调整工作流逻辑**

如果导入或运行过程中遇到问题，请提供具体的错误信息，我会帮您进一步排查解决。

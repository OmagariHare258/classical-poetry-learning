# 🚀 n8n 工作流导入详细步骤

## 前置准备

### 1. 启动 n8n 服务

在项目根目录打开 PowerShell 或命令行：

```powershell
# 方法1：直接启动
npx n8n start

# 方法2：如果已安装全局 n8n
n8n start

# 方法3：使用 npm scripts（如果配置了）
npm run n8n
```

**等待服务启动完成**，看到类似输出：
```
n8n ready on 0.0.0.0, port 5678
Version: 1.x.x
```

### 2. 访问 n8n 管理界面

打开浏览器，访问：**http://localhost:5678**

## 📥 工作流导入步骤

### 步骤1：准备导入核心工作流

建议按以下顺序导入：

#### 🔥 第一批：核心功能（必须）
1. `01-ai-content-generator.json` - AI内容生成器
2. `02-recommendation-system.json` - 推荐系统
3. `03-learning-assistant.json` - 学习助手

#### 📊 第二批：数据功能（推荐）
4. `04-progress-tracking.json` - 进度跟踪
5. `05-analytics-system.json` - 数据分析
6. `07-assessment-system.json` - 评估系统

#### 🎨 第三批：增强功能（可选）
7. `06-image-generation.json` - 图像生成

### 步骤2：逐个导入工作流

#### 导入操作步骤：

1. **在 n8n 界面**，点击右上角 **"+ 新建"** 按钮
   
2. **选择导入方式**，点击 **"导入工作流"**

3. **选择导入源**，点击 **"从文件导入"**

4. **浏览选择文件**
   - 导航到：`c:\Users\Amleth\Desktop\workspace\classical-poetry-learning\n8n-workflows\`
   - 选择文件：`01-ai-content-generator.json`

5. **确认导入**，点击 **"导入"** 按钮

6. **验证导入结果**：
   - ✅ 看到工作流画布显示节点
   - ✅ 节点之间有连接线
   - ✅ 没有红色错误提示
   - ✅ 工作流名称显示为 "AI内容生成"

### 步骤3：激活工作流

**对每个成功导入的工作流**：

1. **确认配置正确**：点击各个节点检查配置
2. **激活工作流**：点击右上角的 **激活开关**
3. **确认激活成功**：开关变为绿色，显示 "Active"
4. **保存工作流**：Ctrl+S 或点击保存按钮

### 步骤4：重复导入其他工作流

对其他工作流重复步骤2-3：
- `02-recommendation-system.json`
- `03-learning-assistant.json` 
- `04-progress-tracking.json`
- `05-analytics-system.json`
- `06-image-generation.json`
- `07-assessment-system.json`

## 🔧 导入后验证

### 验证方法1：n8n 界面检查

在 n8n 主界面：
1. 点击 **"工作流"** 标签页
2. 确认看到所有导入的工作流
3. 检查每个工作流的状态为 **"Active"**（绿色）

### 验证方法2：运行测试脚本

```powershell
# 在项目根目录运行
.\test-n8n-workflows.ps1
```

**期望输出**：
```
=== n8n 工作流功能测试 (优化版) ===
✅ 推荐系统测试成功
✅ 学习助手测试成功
✅ 进度跟踪测试成功
✅ AI内容生成测试成功
✅ 分析系统测试成功
✅ 图像生成测试成功
=== 测试完成 ===
```

### 验证方法3：手动测试单个端点

```powershell
# 测试AI内容生成
$testData = @{
    type = "hint"
    poemTitle = "春晓"
    poemId = "spring_dawn"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:5678/webhook/ai-generation" -Method POST -Body $testData -ContentType "application/json"
```

## ❗ 常见问题解决

### 问题1：n8n 服务启动失败

**症状**：浏览器无法访问 http://localhost:5678

**解决方案**：
```powershell
# 检查端口占用
netstat -ano | findstr :5678

# 结束占用进程（如果有）
taskkill /f /pid [PID]

# 重新启动 n8n
npx n8n start
```

### 问题2：工作流导入失败

**症状**：提示 "Problem importing workflow" 或 "Invalid JSON"

**解决方案**：
1. 确认文件路径正确
2. 检查 JSON 文件格式（使用文本编辑器打开检查）
3. 尝试导入其他工作流文件
4. 重启 n8n 服务后重试

### 问题3：导入后看不到连接线

**症状**：节点显示正常，但节点间无连接线

**解决方案**：
1. **已解决**：新的工作流文件已修复此问题
2. 如仍有问题，尝试：
   - 刷新浏览器页面
   - 重新导入工作流
   - 检查浏览器控制台错误

### 问题4：工作流无法激活

**症状**：激活开关无法开启或显示错误

**解决方案**：
1. 检查 webhook 路径是否冲突
2. 确认所有节点配置完整
3. 查看 n8n 控制台错误信息
4. 尝试手动编辑节点配置

### 问题5：测试脚本失败

**症状**：运行测试脚本时连接超时或错误响应

**解决方案**：
```powershell
# 检查 n8n 服务状态
curl http://localhost:5678/healthz

# 检查特定工作流
curl -X POST http://localhost:5678/webhook/ai-generation -H "Content-Type: application/json" -d '{"type":"test"}'
```

## ✅ 导入成功标志

当您看到以下内容时，说明导入成功：

1. **n8n 界面**：
   - 工作流列表显示 7 个已激活的工作流
   - 每个工作流状态为绿色 "Active"
   - 工作流画布显示完整的节点连接图

2. **测试结果**：
   - 测试脚本全部通过（6个✅）
   - 每个 webhook 端点正常响应
   - 返回数据格式正确

3. **后端集成**：
   - 古诗词学习应用可以调用 n8n 功能
   - AI助手、推荐系统、进度跟踪等功能正常

## 🎉 完成后的下一步

导入成功后，您可以：

1. **集成到前端**：在 React 应用中调用这些 API
2. **自定义配置**：根据需要修改工作流逻辑
3. **添加高级功能**：导入 08-10 的高级工作流
4. **监控运行**：观察工作流的执行情况和性能

需要帮助的话，随时告诉我！

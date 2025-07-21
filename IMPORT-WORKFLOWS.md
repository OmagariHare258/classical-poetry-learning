# 🎯 n8n 工作流快速导入指南

## 🔧 第一步：确认 n8n 运行

### 启动 n8n（如果尚未启动）
```bash
npx n8n start
```

### 访问 n8n 界面
打开浏览器，访问：http://localhost:5678

## 📥 第二步：导入工作流

### 导入顺序（建议按此顺序）：

```
🔥 核心工作流（必须导入）
├── 01-ai-content-generator.json    ← AI内容生成
├── 02-recommendation-system.json   ← 智能推荐  
└── 03-learning-assistant.json      ← 学习助手

📊 数据工作流（建议导入）
├── 04-progress-tracking.json       ← 进度跟踪
├── 05-analytics-system.json        ← 数据分析
└── 07-assessment-system.json       ← 学习评估

🎨 增强工作流（可选导入）
└── 06-image-generation.json        ← 图像生成
```

### 具体操作步骤：

#### 1️⃣ 点击"新建"
在 n8n 界面右上角点击 `+ 新建` 按钮

#### 2️⃣ 选择"导入工作流"
在下拉菜单中选择 `导入工作流`

#### 3️⃣ 选择"从文件导入"
点击 `从文件导入` 选项

#### 4️⃣ 浏览并选择文件
导航到文件夹：
```
c:\Users\Amleth\Desktop\workspace\classical-poetry-learning\n8n-workflows\
```

选择文件：`01-ai-content-generator.json`

#### 5️⃣ 点击"导入"
确认导入，等待完成

#### 6️⃣ 验证导入成功
✅ 看到完整的工作流画布
✅ 节点之间有连接线
✅ 没有错误提示

#### 7️⃣ 激活工作流
点击右上角的 **激活开关**，确保变为绿色

#### 8️⃣ 保存工作流
按 `Ctrl+S` 保存

### 重复以上步骤导入其他文件

## ✅ 第三步：验证导入

### 方法1：在 n8n 界面检查
- 进入"工作流"页面
- 确认看到 7 个已激活的工作流（绿色状态）

### 方法2：运行测试脚本
```powershell
.\test-n8n-workflows.ps1
```

预期看到 6 个 ✅ 成功标记

## 🚨 常见问题

### 问题：03-learning-assistant.json 无法导入
**解决方案**：文件已修复！重新尝试导入：
```
✅ JSON 格式已修正
✅ 节点连接已优化  
✅ JavaScript 代码已简化
```

### 问题：08-learning-flow.json 导入出错
**解决方案**：已替换为简化版本！
```  
✅ 从复杂版本(15+节点)简化为3个节点
✅ 移除了HTTP请求等复杂功能
✅ 保留了核心学习流程逻辑
```

### 问题：09-immersive-image-generation.json 导入出错
**解决方案**：已修复并简化！
```
✅ 移除了不兼容的字段(meta, tags)
✅ 添加了缺失的节点ID
✅ 优化了连接结构
✅ 简化为6个标准节点
```

### 问题：10-immersive-progress-tracking.json 导入出错
**解决方案**：已重构为标准格式！
```
✅ 使用标准n8n节点类型
✅ 简化复杂的数据处理逻辑
✅ 优化为6个高效节点
✅ 完全兼容n8n导入格式
```

### 问题：n8n 端口被占用
```bash
# 查找占用 5678 端口的进程
netstat -ano | findstr :5678

# 结束进程（将 PID 替换为实际进程ID）
taskkill /f /pid [PID]
```

### 问题：导入时提示 JSON 错误
- 确保选择的是正确的 .json 文件
- 检查文件路径中没有特殊字符
- 尝试用记事本打开文件确认格式正确

### 问题：导入后看不到连接线
- 这是老版本问题，新的文件已修复
- 如仍有问题，尝试刷新浏览器

## 🎉 导入完成后

导入成功后，您将拥有：

- **7个核心工作流** 为古诗词学习平台提供AI支持
- **完整的API端点** 供前端调用
- **智能功能集** 包括推荐、助手、分析等

现在可以开始使用这些强大的AI工作流了！

---

📖 **更多详情请查看**：
- `docs/N8N_IMPORT_GUIDE.md` - 详细导入指南
- `n8n-workflows/README.md` - 工作流配置说明
- `n8n-workflows/QUICK-START.md` - 快速开始指南

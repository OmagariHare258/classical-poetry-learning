# n8n 工作流快速导入指南

## 🚀 一键导入核心工作流

### 步骤1：启动 n8n
```powershell
cd c:\Users\Amleth\Desktop\workspace\classical-poetry-learning
npx n8n start
```

### 步骤2：访问 n8n 管理界面
打开浏览器访问：http://localhost:5678

### 步骤3：按顺序导入核心工作流

#### 🔥 必需的核心工作流（优先导入）
1. **01-ai-content-generator.json** - AI内容生成器
2. **02-recommendation-system.json** - 推荐系统  
3. **03-learning-assistant.json** - 学习助手

#### 📊 数据处理工作流（次优先）
4. **04-progress-tracking.json** - 进度跟踪
5. **05-analytics-system.json** - 数据分析
6. **07-assessment-system.json** - 评估系统

#### 🎨 视觉增强工作流（可选）
7. **06-image-generation.json** - 图像生成

### 步骤4：激活工作流
- 导入每个工作流后，点击右上角的**激活**开关
- 确认开关变为绿色（已激活状态）

### 步骤5：测试工作流
```powershell
.\test-n8n-workflows.ps1
```

## 🎯 高级工作流（可选）

### 复杂功能工作流
8. **08-learning-flow.json** - 完整学习流程
9. **09-immersive-image-generation.json** - 沉浸式图像生成  
10. **10-immersive-progress-tracking.json** - 沉浸式进度跟踪

> **注意**：高级工作流功能更复杂，建议先导入和测试核心工作流后再考虑使用。

## ✅ 导入验证清单

- [ ] n8n 服务运行正常
- [ ] 01-07 核心工作流全部导入
- [ ] 所有工作流已激活（绿色开关）
- [ ] 测试脚本运行成功
- [ ] webhook 端点响应正常

## 🔧 故障排除

### 导入失败
- 确保文件为有效JSON格式
- 检查n8n版本兼容性
- 重启n8n服务后重试

### 工作流未激活
- 检查webhook路径是否冲突
- 确认所有节点配置正确
- 查看n8n控制台错误信息

### 测试失败
- 确认n8n运行在5678端口
- 检查防火墙设置
- 验证工作流webhook路径

## 📱 集成后端API

工作流激活后，可通过后端API调用：
```
POST http://localhost:3000/api/n8n/recommendations
POST http://localhost:3000/api/n8n/analytics  
POST http://localhost:3000/api/n8n/assistant
```

## 🎉 完成！

导入完成后，您的古诗词学习平台将具备完整的n8n智能工作流支持！

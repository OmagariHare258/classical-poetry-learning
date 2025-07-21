# n8n 工作流配置文件

## 基础工作流（必需）

### 01-ai-content-generator.json - AI内容生成器
- **功能**：根据请求类型生成提示、图片或默认回复
- **触发器**：POST /webhook/ai-generation
- **节点数**：7个
- **用途**：为学习提供AI辅助内容
- **状态**：✅ 已优化

### 02-recommendation-system.json - 推荐系统
- **功能**：基于用户偏好和难度推荐诗词
- **触发器**：POST /webhook/get-recommendations
- **节点数**：3个
- **用途**：个性化诗词推荐
- **状态**：✅ 已优化

### 03-learning-assistant.json - 学习助手
- **功能**：智能问答，帮助理解诗词内容
- **触发器**：POST /webhook/learning-assistant
- **节点数**：3个
- **用途**：回答学习相关问题
- **状态**：✅ 已优化

### 04-progress-tracking.json - 进度跟踪
- **功能**：跟踪学习进度，计算等级和成就
- **触发器**：POST /webhook/track-progress
- **节点数**：3个
- **用途**：监控学习进展
- **状态**：✅ 已优化

### 05-analytics-system.json - 数据分析
- **功能**：分析学习数据，提供洞察和趋势
- **触发器**：POST /webhook/analytics
- **节点数**：3个
- **用途**：学习数据分析
- **状态**：✅ 已优化

### 06-image-generation.json - 图像生成
- **功能**：为诗词生成配图，增强视觉体验
- **触发器**：POST /webhook/generate-image
- **节点数**：3个
- **用途**：诗词配图生成
- **状态**：✅ 已优化

### 07-assessment-system.json - 评估系统
- **功能**：智能评估学习效果和答题情况
- **触发器**：POST /webhook/assessment
- **节点数**：3个
- **用途**：学习成果评估
- **状态**：✅ 已优化

## 高级工作流（可选）

### 08-learning-flow.json - 完整学习流程
- **功能**：复合工作流，包含完整学习路径
- **触发器**：POST /webhook/learning-flow
- **节点数**：15+个
- **用途**：端到端学习体验
- **状态**：🔄 复杂工作流

### 09-immersive-image-generation.json - 沉浸式图像生成
- **功能**：高级图像生成，支持多种风格和场景
- **触发器**：POST /webhook/generate-image
- **节点数**：8+个
- **用途**：增强版配图生成
- **状态**：🔄 增强功能

### 10-immersive-progress-tracking.json - 沉浸式进度跟踪
- **功能**：高级进度分析，包含详细统计和预测
- **触发器**：POST /webhook/track-progress
- **节点数**：6+个
- **用途**：深度学习分析
- **状态**：🔄 增强功能

## 导入顺序建议

### 第一阶段：核心功能
1. `01-ai-content-generator.json`
2. `02-recommendation-system.json`
3. `03-learning-assistant.json`

### 第二阶段：数据功能
4. `04-progress-tracking.json`
5. `05-analytics-system.json`
6. `07-assessment-system.json`

### 第三阶段：视觉功能
7. `06-image-generation.json`

### 第四阶段：高级功能（可选）
8. `08-learning-flow.json`
9. `09-immersive-image-generation.json`
10. `10-immersive-progress-tracking.json`

## 配置说明

### 端点映射
- `/api/n8n/recommendations` → `02-recommendation-system.json`
- `/api/n8n/analytics` → `05-analytics-system.json`
- `/api/n8n/assistant` → `03-learning-assistant.json`
- `/api/n8n/generate` → `01-ai-content-generator.json`

### 激活建议
- 基础工作流：**必须激活**
- 高级工作流：**按需激活**
- 测试工作流：**开发时激活**

### 资源使用
- 轻量级：01-07 （推荐生产环境）
- 重量级：08-10 （适合功能丰富的环境）

## 维护说明

1. **定期更新**：根据用户反馈优化工作流逻辑
2. **性能监控**：监控各工作流的响应时间
3. **错误处理**：确保所有工作流都有适当的错误处理
4. **版本管理**：保持工作流版本的一致性

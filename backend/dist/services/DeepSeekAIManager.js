"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deepSeekAIManager = void 0;
const axios_1 = __importDefault(require("axios"));
class DeepSeekAIManager {
    constructor() {
        this.baseURL = process.env.DEEPSEEK_BASE_URL || 'https://api.deepseek.com';
        this.apiKey = process.env.DEEPSEEK_API_KEY || '';
        this.model = process.env.DEEPSEEK_MODEL || 'deepseek-chat';
        if (!this.apiKey) {
            console.warn('⚠️ DeepSeek API密钥未配置，AI功能将不可用');
        }
        else {
            console.log('✅ DeepSeek AI服务已初始化');
        }
    }
    async generateText(request) {
        try {
            console.log('🔍 DeepSeek生成文本请求:', {
                hasApiKey: !!this.apiKey,
                baseURL: this.baseURL,
                model: this.model,
                prompt: request.prompt?.substring(0, 50) + '...'
            });
            if (!this.apiKey) {
                throw new Error('DeepSeek API密钥未配置');
            }
            const messages = [];
            if (request.system_prompt) {
                messages.push({
                    role: 'system',
                    content: request.system_prompt
                });
            }
            messages.push({
                role: 'user',
                content: request.prompt
            });
            const response = await axios_1.default.post(`${this.baseURL}/v1/chat/completions`, {
                model: request.model || this.model,
                messages: messages,
                temperature: request.temperature || 0.7,
                max_tokens: request.max_tokens || 2000,
                stream: false
            }, {
                headers: {
                    'Authorization': `Bearer ${this.apiKey}`,
                    'Content-Type': 'application/json'
                },
                timeout: 30000
            });
            const result = response.data;
            if (result.choices && result.choices.length > 0) {
                return {
                    success: true,
                    data: result.choices[0].message.content,
                    service: 'deepseek',
                    tokens_used: result.usage?.total_tokens || 0
                };
            }
            else {
                throw new Error('DeepSeek API返回格式异常');
            }
        }
        catch (error) {
            console.error('❌ DeepSeek API调用失败:', error.message);
            return {
                success: false,
                error: error.response?.data?.error?.message || error.message || 'DeepSeek API调用失败',
                service: 'deepseek'
            };
        }
    }
    async generatePoetryContent(type, poem, context) {
        let systemPrompt = '';
        let userPrompt = '';
        switch (type) {
            case 'hint':
                systemPrompt = '你是一位经验丰富的古诗文教师，擅长用生动有趣的方式引导学生理解诗文意境。请给出简洁而富有启发性的提示。';
                userPrompt = `诗文：《${poem.title}》- ${poem.author}\n内容：${poem.content}\n\n请为这首诗生成一个学习提示，帮助学生理解诗文意境。提示应该简洁有趣，不超过50字。`;
                break;
            case 'explanation':
                systemPrompt = '你是一位古典文学专家，能够深入浅出地解释古诗文的含义、背景和艺术特色。';
                userPrompt = `诗文：《${poem.title}》- ${poem.author}\n内容：${poem.content}\n\n请提供这首诗的详细解释，包括：\n1. 诗文大意\n2. 创作背景\n3. 艺术特色\n4. 情感表达`;
                break;
            case 'question':
                systemPrompt = '你是一位古诗文教师，善于设计启发性的问题来引导学生思考和学习。';
                userPrompt = `诗文：《${poem.title}》- ${poem.author}\n内容：${poem.content}\n\n请为这首诗设计3-5个学习问题，帮助学生更好地理解和欣赏这首诗。问题应该层次分明，从基础理解到深度思考。`;
                break;
        }
        return await this.generateText({
            prompt: userPrompt,
            system_prompt: systemPrompt,
            temperature: 0.7,
            max_tokens: 1000
        });
    }
    async generateLearningAdvice(userProgress, preferences) {
        const systemPrompt = '你是一位AI学习顾问，专门为古诗文学习者提供个性化的学习建议和路径规划。';
        const userPrompt = `
用户学习进度：
- 已学诗文数量：${userProgress.learned_count || 0}
- 平均正确率：${userProgress.accuracy || 0}%
- 学习偏好：${preferences.preferred_topics?.join(', ') || '无特定偏好'}
- 难度偏好：${preferences.difficulty_level || '中等'}

请基于以上信息，为用户生成个性化的学习建议，包括：
1. 推荐的学习内容
2. 学习方法建议
3. 难度调整建议
4. 学习计划安排
`;
        return await this.generateText({
            prompt: userPrompt,
            system_prompt: systemPrompt,
            temperature: 0.6,
            max_tokens: 800
        });
    }
    async checkHealth() {
        try {
            if (!this.apiKey) {
                return false;
            }
            const response = await this.generateText({
                prompt: '你好，请简单回复"测试成功"',
                max_tokens: 50
            });
            return response.success;
        }
        catch (error) {
            console.error('❌ DeepSeek服务健康检查失败:', error);
            return false;
        }
    }
    getServiceInfo() {
        return {
            name: 'DeepSeek',
            model: this.model,
            baseURL: this.baseURL,
            configured: !!this.apiKey,
            features: ['文本生成', '对话理解', '古诗文分析', '学习建议']
        };
    }
}
exports.deepSeekAIManager = new DeepSeekAIManager();
exports.default = DeepSeekAIManager;
//# sourceMappingURL=DeepSeekAIManager.js.map
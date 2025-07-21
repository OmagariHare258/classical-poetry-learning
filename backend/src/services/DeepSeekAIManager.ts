// DeepSeek AI服务管理器 - 主要AI对话模型
import axios from 'axios';

export interface AITextRequest {
  prompt: string;
  model?: string;
  temperature?: number;
  max_tokens?: number;
  system_prompt?: string;
}

export interface AIServiceResponse {
  success: boolean;
  data?: any;
  error?: string;
  service: string;
  tokens_used?: number;
}

class DeepSeekAIManager {
  private baseURL: string;
  private apiKey: string;
  private model: string;
  private isInDemoMode: boolean;

  constructor() {
    this.baseURL = process.env.DEEPSEEK_BASE_URL || 'https://api.deepseek.com';
    this.apiKey = process.env.DEEPSEEK_API_KEY || 'demo_mode';  // 使用演示模式标记
    this.model = process.env.DEEPSEEK_MODEL || 'deepseek-chat';
    this.isInDemoMode = !this.apiKey || this.apiKey === 'demo_mode';
    
    if (this.isInDemoMode) {
      console.warn('⚠️ DeepSeek API密钥未配置，AI功能将以演示模式运行（返回模拟数据）');
    } else {
      console.log('✅ DeepSeek AI服务已初始化');
    }
  }
  
  /**
   * 演示模式 - 生成模拟AI响应
   */
  private generateDemoResponse(request: AITextRequest): AIServiceResponse {
    // 根据请求类型生成不同的模拟响应
    const prompt = request.prompt.toLowerCase();
    let response = '';
    
    if (prompt.includes('解释') || prompt.includes('分析')) {
      response = '这是一个演示模式的解释分析。由于未配置API密钥，系统目前运行在演示模式。这首诗描绘了作者对自然的热爱和对生活的感悟，表达了积极向上的人生态度。诗中运用了丰富的意象和精妙的比喻，语言简洁而有力。';
    } else if (prompt.includes('问题') || prompt.includes('练习')) {
      response = '演示模式问题：\n1. 这首诗的主要意象有哪些？\n2. 作者在诗中表达了怎样的情感？\n3. 请简要分析诗中的意境特点。';
    } else if (prompt.includes('提示') || prompt.includes('翻译')) {
      response = '演示模式提示：静心体会诗中的意境，注意作者如何通过自然景物表达内心情感。';
    } else {
      response = '这是演示模式的AI响应。要使用完整功能，请配置DeepSeek API密钥。';
    }
    
    return {
      success: true,
      data: {
        response: response,
        finish_reason: 'demo_mode'
      },
      service: 'deepseek_demo',
      tokens_used: 0
    };
  }

  /**
   * 生成AI文本内容
   */
  async generateText(request: AITextRequest): Promise<AIServiceResponse> {
    try {
      console.log('🔍 DeepSeek生成文本请求:', {
        hasApiKey: !this.isInDemoMode,
        baseURL: this.baseURL,
        model: this.model,
        prompt: request.prompt?.substring(0, 50) + '...'
      });

      // 如果是演示模式，返回模拟数据
      if (this.isInDemoMode) {
        console.log('🔍 使用演示模式，返回模拟数据');
        return this.generateDemoResponse(request);
      }

      const messages = [];

      // 添加系统提示
      if (request.system_prompt) {
        messages.push({
          role: 'system',
          content: request.system_prompt
        });
      }

      // 添加用户消息
      messages.push({
        role: 'user',
        content: request.prompt
      });

      const response = await axios.post(
        `${this.baseURL}/v1/chat/completions`,
        {
          model: request.model || this.model,
          messages: messages,
          temperature: request.temperature || 0.7,
          max_tokens: request.max_tokens || 2000,
          stream: false
        },
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json'
          },
          timeout: 30000 // 30秒超时
        }
      );

      const result = response.data;

      if (result.choices && result.choices.length > 0) {
        return {
          success: true,
          data: result.choices[0].message.content,
          service: 'deepseek',
          tokens_used: result.usage?.total_tokens || 0
        };
      } else {
        throw new Error('DeepSeek API返回格式异常');
      }
    } catch (error: any) {
      console.error('❌ DeepSeek API调用失败:', error.message);
      return {
        success: false,
        error: error.response?.data?.error?.message || error.message || 'DeepSeek API调用失败',
        service: 'deepseek'
      };
    }
  }

  /**
   * 生成古诗文学习相关内容
   */
  async generatePoetryContent(type: 'hint' | 'explanation' | 'question', poem: any, context?: any): Promise<AIServiceResponse> {
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

  /**
   * 生成个性化学习建议
   */
  async generateLearningAdvice(userProgress: any, preferences: any): Promise<AIServiceResponse> {
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

  /**
   * 检查服务状态
   */
  async checkHealth(): Promise<boolean> {
    try {
      if (!this.apiKey) {
        return false;
      }

      const response = await this.generateText({
        prompt: '你好，请简单回复"测试成功"',
        max_tokens: 50
      });

      return response.success;
    } catch (error) {
      console.error('❌ DeepSeek服务健康检查失败:', error);
      return false;
    }
  }

  /**
   * 获取服务信息
   */
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

// 导出单例实例
export const deepSeekAIManager = new DeepSeekAIManager();
export default DeepSeekAIManager;

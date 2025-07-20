// 中国AI服务管理器 (需求1: 优先使用中国国内AI)
import axios from 'axios';
import crypto from 'crypto';

export interface AITextRequest {
  prompt: string;
  model?: string;
  temperature?: number;
  max_tokens?: number;
}

export interface AIImageRequest {
  prompt: string;
  style?: string;
  size?: string;
  quality?: string;
}

export interface AIServiceResponse {
  success: boolean;
  data?: any;
  error?: string;
  service: string;
}

class ChineseAIManager {
  private services: Map<string, any> = new Map();

  constructor() {
    this.initializeServices();
  }

  private initializeServices() {
    // 百度文心一言和ERNIE-ViLG
    this.services.set('baidu', {
      text: {
        endpoint: 'https://aip.baidubce.com/rpc/2.0/ai_custom/v1/wenxinworkshop/chat/completions',
        getAccessToken: this.getBaiduAccessToken.bind(this)
      },
      image: {
        endpoint: 'https://aip.baidubce.com/rpc/2.0/ai_custom/v1/wenxinworkshop/text2image/sd_xl'
      }
    });

    // 阿里云通义千问和通义万象
    this.services.set('ali', {
      text: {
        endpoint: 'https://dashscope.aliyuncs.com/api/v1/services/aigc/text-generation/generation'
      },
      image: {
        endpoint: 'https://dashscope.aliyuncs.com/api/v1/services/aigc/text2image/image-synthesis'
      }
    });

    // 腾讯云混元大模型
    this.services.set('tencent', {
      text: {
        endpoint: 'https://hunyuan.tencentcloudapi.com'
      },
      image: {
        endpoint: 'https://aiart.tencentcloudapi.com'
      }
    });
  }

  // 百度AI服务
  private async getBaiduAccessToken(): Promise<string> {
    const apiKey = process.env.BAIDU_API_KEY;
    const secretKey = process.env.BAIDU_SECRET_KEY;
    
    if (!apiKey || !secretKey) {
      throw new Error('百度API密钥未配置');
    }

    try {
      const response = await axios.post(
        'https://aip.baidubce.com/oauth/2.0/token',
        null,
        {
          params: {
            grant_type: 'client_credentials',
            client_id: apiKey,
            client_secret: secretKey
          }
        }
      );
      
      return response.data.access_token;
    } catch (error) {
      throw new Error('获取百度access_token失败');
    }
  }

  async generateTextWithBaidu(request: AITextRequest): Promise<AIServiceResponse> {
    try {
      const accessToken = await this.getBaiduAccessToken();
      
      const response = await axios.post(
        `${this.services.get('baidu').text.endpoint}?access_token=${accessToken}`,
        {
          messages: [{
            role: 'user',
            content: request.prompt
          }],
          temperature: request.temperature || 0.7,
          max_output_tokens: request.max_tokens || 1000
        }
      );

      return {
        success: true,
        data: response.data.result,
        service: 'baidu'
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
        service: 'baidu'
      };
    }
  }

  async generateImageWithBaidu(request: AIImageRequest): Promise<AIServiceResponse> {
    try {
      const accessToken = await this.getBaiduAccessToken();
      
      const response = await axios.post(
        `${this.services.get('baidu').image.endpoint}?access_token=${accessToken}`,
        {
          prompt: request.prompt,
          width: 1024,
          height: 1024,
          style: request.style || 'Base',
          image_num: 1
        }
      );

      return {
        success: true,
        data: response.data.data,
        service: 'baidu'
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
        service: 'baidu'
      };
    }
  }

  // 阿里云AI服务
  async generateTextWithAli(request: AITextRequest): Promise<AIServiceResponse> {
    try {
      const apiKey = process.env.ALI_API_KEY;
      if (!apiKey) {
        throw new Error('阿里云API密钥未配置');
      }

      const response = await axios.post(
        this.services.get('ali').text.endpoint,
        {
          model: 'qwen-turbo',
          input: {
            messages: [{
              role: 'user',
              content: request.prompt
            }]
          },
          parameters: {
            temperature: request.temperature || 0.7,
            max_tokens: request.max_tokens || 1000
          }
        },
        {
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json'
          }
        }
      );

      return {
        success: true,
        data: response.data.output.text,
        service: 'ali'
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
        service: 'ali'
      };
    }
  }

  async generateImageWithAli(request: AIImageRequest): Promise<AIServiceResponse> {
    try {
      const apiKey = process.env.ALI_API_KEY;
      if (!apiKey) {
        throw new Error('阿里云API密钥未配置');
      }

      const response = await axios.post(
        this.services.get('ali').image.endpoint,
        {
          model: 'wanx-v1',
          input: {
            prompt: request.prompt,
            negative_prompt: '',
            style: request.style || '<auto>'
          },
          parameters: {
            size: request.size || '1024*1024',
            n: 1
          }
        },
        {
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json'
          }
        }
      );

      return {
        success: true,
        data: response.data.output.results,
        service: 'ali'
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
        service: 'ali'
      };
    }
  }

  // 腾讯云AI服务
  async generateTextWithTencent(request: AITextRequest): Promise<AIServiceResponse> {
    try {
      // 腾讯云API需要签名，这里简化处理
      return {
        success: false,
        error: '腾讯云API集成待完善',
        service: 'tencent'
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
        service: 'tencent'
      };
    }
  }

  // 通用接口：按优先级尝试各个AI服务
  async generateText(request: AITextRequest): Promise<AIServiceResponse> {
    const services = ['baidu', 'ali', 'tencent'];
    
    for (const service of services) {
      try {
        let result: AIServiceResponse;
        
        switch (service) {
          case 'baidu':
            result = await this.generateTextWithBaidu(request);
            break;
          case 'ali':
            result = await this.generateTextWithAli(request);
            break;
          case 'tencent':
            result = await this.generateTextWithTencent(request);
            break;
          default:
            continue;
        }
        
        if (result.success) {
          return result;
        }
      } catch (error) {
        console.log(`${service} AI服务失败，尝试下一个...`);
        continue;
      }
    }
    
    return {
      success: false,
      error: '所有中国AI服务都不可用',
      service: 'none'
    };
  }

  async generateImage(request: AIImageRequest): Promise<AIServiceResponse> {
    const services = ['baidu', 'ali'];
    
    for (const service of services) {
      try {
        let result: AIServiceResponse;
        
        switch (service) {
          case 'baidu':
            result = await this.generateImageWithBaidu(request);
            break;
          case 'ali':
            result = await this.generateImageWithAli(request);
            break;
          default:
            continue;
        }
        
        if (result.success) {
          return result;
        }
      } catch (error) {
        console.log(`${service} AI图片服务失败，尝试下一个...`);
        continue;
      }
    }
    
    return {
      success: false,
      error: '所有中国AI图片服务都不可用',
      service: 'none'
    };
  }

  // 获取配文生成 (需求4)
  async generateImageCaption(imagePrompt: string, poemContent: string): Promise<string> {
    const captionPrompt = `
请为这首古诗的配图生成一句简洁优美的配文：

古诗内容：${poemContent}
图片描述：${imagePrompt}

要求：
1. 配文要与诗词意境相符
2. 字数控制在10-20字
3. 语言要优美简洁
4. 突出诗词的主要情感或意象

请只返回配文内容，不要其他说明：
`;

    const result = await this.generateText({
      prompt: captionPrompt,
      temperature: 0.8,
      max_tokens: 100
    });

    if (result.success) {
      return result.data || '诗画相映，意境悠远';
    }
    
    return '诗画相映，意境悠远'; // 默认配文
  }
}

export const chineseAIManager = new ChineseAIManager();

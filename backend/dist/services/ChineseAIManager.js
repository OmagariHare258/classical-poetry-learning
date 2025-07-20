"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.chineseAIManager = void 0;
const axios_1 = __importDefault(require("axios"));
class ChineseAIManager {
    constructor() {
        this.services = new Map();
        this.initializeServices();
    }
    initializeServices() {
        this.services.set('baidu', {
            text: {
                endpoint: 'https://aip.baidubce.com/rpc/2.0/ai_custom/v1/wenxinworkshop/chat/completions',
                getAccessToken: this.getBaiduAccessToken.bind(this)
            },
            image: {
                endpoint: 'https://aip.baidubce.com/rpc/2.0/ai_custom/v1/wenxinworkshop/text2image/sd_xl'
            }
        });
        this.services.set('ali', {
            text: {
                endpoint: 'https://dashscope.aliyuncs.com/api/v1/services/aigc/text-generation/generation'
            },
            image: {
                endpoint: 'https://dashscope.aliyuncs.com/api/v1/services/aigc/text2image/image-synthesis'
            }
        });
        this.services.set('tencent', {
            text: {
                endpoint: 'https://hunyuan.tencentcloudapi.com'
            },
            image: {
                endpoint: 'https://aiart.tencentcloudapi.com'
            }
        });
    }
    async getBaiduAccessToken() {
        const apiKey = process.env.BAIDU_API_KEY;
        const secretKey = process.env.BAIDU_SECRET_KEY;
        if (!apiKey || !secretKey) {
            throw new Error('百度API密钥未配置');
        }
        try {
            const response = await axios_1.default.post('https://aip.baidubce.com/oauth/2.0/token', null, {
                params: {
                    grant_type: 'client_credentials',
                    client_id: apiKey,
                    client_secret: secretKey
                }
            });
            return response.data.access_token;
        }
        catch (error) {
            throw new Error('获取百度access_token失败');
        }
    }
    async generateTextWithBaidu(request) {
        try {
            const accessToken = await this.getBaiduAccessToken();
            const response = await axios_1.default.post(`${this.services.get('baidu').text.endpoint}?access_token=${accessToken}`, {
                messages: [{
                        role: 'user',
                        content: request.prompt
                    }],
                temperature: request.temperature || 0.7,
                max_output_tokens: request.max_tokens || 1000
            });
            return {
                success: true,
                data: response.data.result,
                service: 'baidu'
            };
        }
        catch (error) {
            return {
                success: false,
                error: error.message,
                service: 'baidu'
            };
        }
    }
    async generateImageWithBaidu(request) {
        try {
            const accessToken = await this.getBaiduAccessToken();
            const response = await axios_1.default.post(`${this.services.get('baidu').image.endpoint}?access_token=${accessToken}`, {
                prompt: request.prompt,
                width: 1024,
                height: 1024,
                style: request.style || 'Base',
                image_num: 1
            });
            return {
                success: true,
                data: response.data.data,
                service: 'baidu'
            };
        }
        catch (error) {
            return {
                success: false,
                error: error.message,
                service: 'baidu'
            };
        }
    }
    async generateTextWithAli(request) {
        try {
            const apiKey = process.env.ALI_API_KEY;
            if (!apiKey) {
                throw new Error('阿里云API密钥未配置');
            }
            const response = await axios_1.default.post(this.services.get('ali').text.endpoint, {
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
            }, {
                headers: {
                    'Authorization': `Bearer ${apiKey}`,
                    'Content-Type': 'application/json'
                }
            });
            return {
                success: true,
                data: response.data.output.text,
                service: 'ali'
            };
        }
        catch (error) {
            return {
                success: false,
                error: error.message,
                service: 'ali'
            };
        }
    }
    async generateImageWithAli(request) {
        try {
            const apiKey = process.env.ALI_API_KEY;
            if (!apiKey) {
                throw new Error('阿里云API密钥未配置');
            }
            const response = await axios_1.default.post(this.services.get('ali').image.endpoint, {
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
            }, {
                headers: {
                    'Authorization': `Bearer ${apiKey}`,
                    'Content-Type': 'application/json'
                }
            });
            return {
                success: true,
                data: response.data.output.results,
                service: 'ali'
            };
        }
        catch (error) {
            return {
                success: false,
                error: error.message,
                service: 'ali'
            };
        }
    }
    async generateTextWithTencent(request) {
        try {
            return {
                success: false,
                error: '腾讯云API集成待完善',
                service: 'tencent'
            };
        }
        catch (error) {
            return {
                success: false,
                error: error.message,
                service: 'tencent'
            };
        }
    }
    async generateText(request) {
        const services = ['baidu', 'ali', 'tencent'];
        for (const service of services) {
            try {
                let result;
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
            }
            catch (error) {
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
    async generateImage(request) {
        const services = ['baidu', 'ali'];
        for (const service of services) {
            try {
                let result;
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
            }
            catch (error) {
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
    async generateImageCaption(imagePrompt, poemContent) {
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
        return '诗画相映，意境悠远';
    }
}
exports.chineseAIManager = new ChineseAIManager();
//# sourceMappingURL=ChineseAIManager.js.map
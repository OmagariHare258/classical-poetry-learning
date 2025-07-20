"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const axios_1 = __importDefault(require("axios"));
const API_BASE = 'http://localhost:5000/api';
class AIServiceTester {
    constructor() {
        this.results = [];
    }
    async runAllTests() {
        console.log('🧪 开始AI服务功能测试...\n');
        await this.testBackendHealth();
        await this.testAIHealth();
        await this.testN8nStatus();
        await this.testAITextGeneration();
        await this.testPoetryContentGeneration();
        await this.testLearningAdvice();
        this.printResults();
    }
    async testBackendHealth() {
        try {
            const response = await axios_1.default.get(`${API_BASE}/health`, { timeout: 5000 });
            this.results.push({
                name: '后端服务健康检查',
                success: response.status === 200,
                message: response.status === 200 ? '服务正常运行' : `状态码: ${response.status}`,
                response: response.data
            });
        }
        catch (error) {
            this.results.push({
                name: '后端服务健康检查',
                success: false,
                message: `连接失败: ${error.message}`
            });
        }
    }
    async testAIHealth() {
        try {
            const response = await axios_1.default.get(`${API_BASE}/ai/health`, { timeout: 10000 });
            this.results.push({
                name: 'AI服务健康检查',
                success: response.data.success,
                message: response.data.success ? 'DeepSeek AI服务可用' : 'AI服务不可用',
                response: response.data
            });
        }
        catch (error) {
            this.results.push({
                name: 'AI服务健康检查',
                success: false,
                message: `AI服务检查失败: ${error.message}`
            });
        }
    }
    async testN8nStatus() {
        try {
            const response = await axios_1.default.get(`${API_BASE}/n8n/status`, { timeout: 10000 });
            const isHealthy = response.data.health?.status === 'healthy';
            this.results.push({
                name: 'n8n连接状态检查',
                success: isHealthy,
                message: isHealthy ? 'n8n服务连接正常' : `n8n状态: ${response.data.health?.status}`,
                response: response.data
            });
        }
        catch (error) {
            this.results.push({
                name: 'n8n连接状态检查',
                success: false,
                message: `n8n连接检查失败: ${error.message}`
            });
        }
    }
    async testAITextGeneration() {
        try {
            const response = await axios_1.default.post(`${API_BASE}/ai/generate-text`, {
                prompt: '请简单介绍一下古诗《春晓》',
                options: {
                    temperature: 0.7,
                    max_tokens: 200
                }
            }, { timeout: 30000 });
            const hasContent = response.data.success && response.data.data;
            this.results.push({
                name: 'AI文本生成测试',
                success: hasContent,
                message: hasContent ? 'AI文本生成成功' : '文本生成失败',
                response: hasContent ? {
                    content: response.data.data.substring(0, 100) + '...',
                    tokens: response.data.tokens_used
                } : response.data
            });
        }
        catch (error) {
            this.results.push({
                name: 'AI文本生成测试',
                success: false,
                message: `AI文本生成失败: ${error.message}`
            });
        }
    }
    async testPoetryContentGeneration() {
        try {
            const response = await axios_1.default.post(`${API_BASE}/ai/generate-poetry-content`, {
                type: 'hint',
                poem: {
                    title: '春晓',
                    author: '孟浩然',
                    content: '春眠不觉晓，处处闻啼鸟。夜来风雨声，花落知多少。'
                }
            }, { timeout: 30000 });
            const hasContent = response.data.success && response.data.data;
            this.results.push({
                name: '古诗文内容生成测试',
                success: hasContent,
                message: hasContent ? '古诗文分析生成成功' : '古诗文分析生成失败',
                response: hasContent ? {
                    hint: response.data.data.substring(0, 100) + '...'
                } : response.data
            });
        }
        catch (error) {
            this.results.push({
                name: '古诗文内容生成测试',
                success: false,
                message: `古诗文内容生成失败: ${error.message}`
            });
        }
    }
    async testLearningAdvice() {
        try {
            const response = await axios_1.default.post(`${API_BASE}/ai/generate-learning-advice`, {
                userProgress: {
                    learned_count: 3,
                    accuracy: 85,
                    last_session: '2024-01-20'
                },
                preferences: {
                    preferred_topics: ['春天', '思乡'],
                    difficulty_level: '中等'
                }
            }, { timeout: 30000 });
            const hasContent = response.data.success && response.data.data;
            this.results.push({
                name: '学习建议生成测试',
                success: hasContent,
                message: hasContent ? '个性化学习建议生成成功' : '学习建议生成失败',
                response: hasContent ? {
                    advice: response.data.data.substring(0, 100) + '...'
                } : response.data
            });
        }
        catch (error) {
            this.results.push({
                name: '学习建议生成测试',
                success: false,
                message: `学习建议生成失败: ${error.message}`
            });
        }
    }
    printResults() {
        console.log('\n📊 测试结果汇总:');
        console.log('='.repeat(60));
        let successCount = 0;
        this.results.forEach((result, index) => {
            const status = result.success ? '✅' : '❌';
            const number = (index + 1).toString().padStart(2, '0');
            console.log(`${number}. ${status} ${result.name}`);
            console.log(`    ${result.message}`);
            if (result.response && result.success) {
                console.log(`    响应: ${JSON.stringify(result.response, null, 2).substring(0, 200)}...`);
            }
            console.log('');
            if (result.success)
                successCount++;
        });
        console.log('='.repeat(60));
        console.log(`总测试数: ${this.results.length}`);
        console.log(`成功: ${successCount} ✅`);
        console.log(`失败: ${this.results.length - successCount} ❌`);
        console.log(`成功率: ${((successCount / this.results.length) * 100).toFixed(1)}%`);
        if (successCount === this.results.length) {
            console.log('\n🎉 所有测试通过！系统运行正常。');
        }
        else {
            console.log('\n⚠️ 部分测试失败，请检查相关服务配置。');
        }
    }
}
if (require.main === module) {
    const tester = new AIServiceTester();
    tester.runAllTests().catch(error => {
        console.error('❌ 测试执行失败:', error);
        process.exit(1);
    });
}
exports.default = AIServiceTester;
//# sourceMappingURL=test-ai-services.js.map
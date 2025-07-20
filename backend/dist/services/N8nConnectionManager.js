"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.n8nConnectionManager = void 0;
const axios_1 = __importDefault(require("axios"));
class N8nConnectionManager {
    constructor() {
        this.isConnected = false;
        this.connectionRetries = 0;
        this.maxRetries = 10;
        this.retryDelay = 5000;
        this.config = {
            baseURL: process.env.N8N_BASE_URL || 'http://localhost:5678',
            apiKey: process.env.N8N_API_KEY,
            timeout: 10000
        };
        console.log('🔧 n8n连接管理器初始化:', {
            baseURL: this.config.baseURL,
            hasApiKey: !!this.config.apiKey
        });
    }
    async startAutoConnection() {
        console.log('🚀 开始尝试连接n8n服务...');
        await this.attemptConnection();
        if (!this.isConnected) {
            this.startRetryLoop();
        }
    }
    async attemptConnection() {
        try {
            const health = await this.checkHealth();
            if (health.status === 'healthy') {
                this.isConnected = true;
                this.connectionRetries = 0;
                console.log('✅ n8n服务连接成功!');
                console.log(`📊 工作流数量: ${health.workflows || 0}`);
                return true;
            }
            else {
                throw new Error(health.message || 'n8n服务状态异常');
            }
        }
        catch (error) {
            this.isConnected = false;
            console.log(`❌ n8n连接失败 (尝试 ${this.connectionRetries + 1}/${this.maxRetries}): ${error.message}`);
            return false;
        }
    }
    startRetryLoop() {
        const retryInterval = setInterval(async () => {
            this.connectionRetries++;
            if (this.connectionRetries >= this.maxRetries) {
                console.log('❌ 已达到最大重试次数，停止尝试连接n8n');
                clearInterval(retryInterval);
                return;
            }
            console.log(`🔄 正在重试连接n8n... (${this.connectionRetries}/${this.maxRetries})`);
            const connected = await this.attemptConnection();
            if (connected) {
                console.log('🎉 n8n连接重试成功!');
                clearInterval(retryInterval);
            }
        }, this.retryDelay);
    }
    async checkHealth() {
        try {
            const headers = {
                'Content-Type': 'application/json'
            };
            if (this.config.apiKey) {
                headers['X-N8N-API-KEY'] = this.config.apiKey;
            }
            let response;
            try {
                response = await axios_1.default.get(`${this.config.baseURL}/healthz`, {
                    headers,
                    timeout: this.config.timeout
                });
            }
            catch (healthError) {
                response = await axios_1.default.get(`${this.config.baseURL}/api/v1/workflows`, {
                    headers,
                    timeout: this.config.timeout
                });
            }
            if (response.status === 200) {
                let workflowCount = 0;
                try {
                    const workflowsResponse = await axios_1.default.get(`${this.config.baseURL}/api/v1/workflows`, {
                        headers,
                        timeout: this.config.timeout
                    });
                    workflowCount = workflowsResponse.data?.data?.length || 0;
                }
                catch (workflowError) {
                    console.log('⚠️ 无法获取工作流信息，可能需要API密钥');
                }
                return {
                    status: 'healthy',
                    message: 'n8n服务运行正常',
                    workflows: workflowCount
                };
            }
            else {
                return {
                    status: 'unhealthy',
                    message: `n8n服务响应异常: ${response.status}`
                };
            }
        }
        catch (error) {
            if (error.code === 'ECONNREFUSED') {
                return {
                    status: 'unhealthy',
                    message: 'n8n服务未启动或端口不可访问'
                };
            }
            else if (error.code === 'ETIMEDOUT') {
                return {
                    status: 'unhealthy',
                    message: 'n8n服务连接超时'
                };
            }
            else {
                return {
                    status: 'unknown',
                    message: error.message || '未知错误'
                };
            }
        }
    }
    async executeWorkflow(workflowId, data) {
        try {
            if (!this.isConnected) {
                throw new Error('n8n服务未连接');
            }
            const headers = {
                'Content-Type': 'application/json'
            };
            if (this.config.apiKey) {
                headers['X-N8N-API-KEY'] = this.config.apiKey;
            }
            const response = await axios_1.default.post(`${this.config.baseURL}/api/v1/workflows/${workflowId}/execute`, data || {}, {
                headers,
                timeout: this.config.timeout * 3
            });
            return {
                success: true,
                data: response.data,
                executionId: response.data?.executionId
            };
        }
        catch (error) {
            console.error('❌ 工作流执行失败:', error.message);
            return {
                success: false,
                error: error.message
            };
        }
    }
    getConnectionStatus() {
        return {
            connected: this.isConnected,
            config: {
                baseURL: this.config.baseURL,
                hasApiKey: !!this.config.apiKey
            },
            retries: this.connectionRetries,
            maxRetries: this.maxRetries
        };
    }
    async reconnect() {
        console.log('🔄 手动重新连接n8n...');
        this.connectionRetries = 0;
        return await this.attemptConnection();
    }
}
exports.n8nConnectionManager = new N8nConnectionManager();
exports.default = N8nConnectionManager;
//# sourceMappingURL=N8nConnectionManager.js.map
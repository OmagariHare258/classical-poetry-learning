// n8n连接管理器 - 自动连接和状态监控
import axios from 'axios';

interface N8nConfig {
  baseURL: string;
  apiKey?: string;
  timeout: number;
}

interface N8nHealthResponse {
  status: 'healthy' | 'unhealthy' | 'unknown';
  message?: string;
  workflows?: number;
  executions?: number;
}

class N8nConnectionManager {
  private config: N8nConfig;
  private isConnected: boolean = false;
  private connectionRetries: number = 0;
  private maxRetries: number = 10;
  private retryDelay: number = 5000; // 5秒

  constructor() {
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

  /**
   * 启动自动连接
   */
  async startAutoConnection(): Promise<void> {
    console.log('🚀 开始尝试连接n8n服务...');
    
    // 立即尝试一次连接
    await this.attemptConnection();
    
    // 如果首次连接失败，开始重试机制
    if (!this.isConnected) {
      this.startRetryLoop();
    }
  }

  /**
   * 尝试连接n8n
   */
  private async attemptConnection(): Promise<boolean> {
    try {
      const health = await this.checkHealth();
      
      if (health.status === 'healthy') {
        this.isConnected = true;
        this.connectionRetries = 0;
        console.log('✅ n8n服务连接成功!');
        console.log(`📊 工作流数量: ${health.workflows || 0}`);
        return true;
      } else {
        throw new Error(health.message || 'n8n服务状态异常');
      }
    } catch (error: any) {
      this.isConnected = false;
      console.log(`❌ n8n连接失败 (尝试 ${this.connectionRetries + 1}/${this.maxRetries}): ${error.message}`);
      return false;
    }
  }

  /**
   * 重试连接循环
   */
  private startRetryLoop(): void {
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

  /**
   * 检查n8n健康状态
   */
  async checkHealth(): Promise<N8nHealthResponse> {
    try {
      const headers: any = {
        'Content-Type': 'application/json'
      };

      if (this.config.apiKey) {
        headers['X-N8N-API-KEY'] = this.config.apiKey;
      }

      // 尝试访问健康检查端点
      let response;
      try {
        response = await axios.get(`${this.config.baseURL}/healthz`, {
          headers,
          timeout: this.config.timeout
        });
      } catch (healthError) {
        // 如果健康检查端点不存在，尝试访问API端点
        response = await axios.get(`${this.config.baseURL}/api/v1/workflows`, {
          headers,
          timeout: this.config.timeout
        });
      }

      if (response.status === 200) {
        // 获取工作流数量
        let workflowCount = 0;
        try {
          const workflowsResponse = await axios.get(`${this.config.baseURL}/api/v1/workflows`, {
            headers,
            timeout: this.config.timeout
          });
          workflowCount = workflowsResponse.data?.data?.length || 0;
        } catch (workflowError) {
          console.log('⚠️ 无法获取工作流信息，可能需要API密钥');
        }

        return {
          status: 'healthy',
          message: 'n8n服务运行正常',
          workflows: workflowCount
        };
      } else {
        return {
          status: 'unhealthy',
          message: `n8n服务响应异常: ${response.status}`
        };
      }
    } catch (error: any) {
      if (error.code === 'ECONNREFUSED') {
        return {
          status: 'unhealthy',
          message: 'n8n服务未启动或端口不可访问'
        };
      } else if (error.code === 'ETIMEDOUT') {
        return {
          status: 'unhealthy',
          message: 'n8n服务连接超时'
        };
      } else {
        return {
          status: 'unknown',
          message: error.message || '未知错误'
        };
      }
    }
  }

  /**
   * 执行工作流
   */
  async executeWorkflow(workflowId: string, data?: any): Promise<any> {
    try {
      if (!this.isConnected) {
        throw new Error('n8n服务未连接');
      }

      const headers: any = {
        'Content-Type': 'application/json'
      };

      if (this.config.apiKey) {
        headers['X-N8N-API-KEY'] = this.config.apiKey;
      }

      const response = await axios.post(
        `${this.config.baseURL}/api/v1/workflows/${workflowId}/execute`,
        data || {},
        {
          headers,
          timeout: this.config.timeout * 3 // 执行时给更长时间
        }
      );

      return {
        success: true,
        data: response.data,
        executionId: response.data?.executionId
      };
    } catch (error: any) {
      console.error('❌ 工作流执行失败:', error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * 获取连接状态
   */
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

  /**
   * 手动重新连接
   */
  async reconnect(): Promise<boolean> {
    console.log('🔄 手动重新连接n8n...');
    this.connectionRetries = 0;
    return await this.attemptConnection();
  }
}

// 导出单例实例
export const n8nConnectionManager = new N8nConnectionManager();
export default N8nConnectionManager;

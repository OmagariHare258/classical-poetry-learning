interface N8nHealthResponse {
    status: 'healthy' | 'unhealthy' | 'unknown';
    message?: string;
    workflows?: number;
    executions?: number;
}
declare class N8nConnectionManager {
    private config;
    private isConnected;
    private connectionRetries;
    private maxRetries;
    private retryDelay;
    constructor();
    startAutoConnection(): Promise<void>;
    private attemptConnection;
    private startRetryLoop;
    checkHealth(): Promise<N8nHealthResponse>;
    executeWorkflow(workflowId: string, data?: any): Promise<any>;
    getConnectionStatus(): {
        connected: boolean;
        config: {
            baseURL: string;
            hasApiKey: boolean;
        };
        retries: number;
        maxRetries: number;
    };
    reconnect(): Promise<boolean>;
}
export declare const n8nConnectionManager: N8nConnectionManager;
export default N8nConnectionManager;
//# sourceMappingURL=N8nConnectionManager.d.ts.map
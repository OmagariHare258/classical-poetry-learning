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
declare class DeepSeekAIManager {
    private baseURL;
    private apiKey;
    private model;
    constructor();
    generateText(request: AITextRequest): Promise<AIServiceResponse>;
    generatePoetryContent(type: 'hint' | 'explanation' | 'question', poem: any, context?: any): Promise<AIServiceResponse>;
    generateLearningAdvice(userProgress: any, preferences: any): Promise<AIServiceResponse>;
    checkHealth(): Promise<boolean>;
    getServiceInfo(): {
        name: string;
        model: string;
        baseURL: string;
        configured: boolean;
        features: string[];
    };
}
export declare const deepSeekAIManager: DeepSeekAIManager;
export default DeepSeekAIManager;
//# sourceMappingURL=DeepSeekAIManager.d.ts.map
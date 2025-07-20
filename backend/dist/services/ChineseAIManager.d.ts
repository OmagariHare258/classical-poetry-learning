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
declare class ChineseAIManager {
    private services;
    constructor();
    private initializeServices;
    private getBaiduAccessToken;
    generateTextWithBaidu(request: AITextRequest): Promise<AIServiceResponse>;
    generateImageWithBaidu(request: AIImageRequest): Promise<AIServiceResponse>;
    generateTextWithAli(request: AITextRequest): Promise<AIServiceResponse>;
    generateImageWithAli(request: AIImageRequest): Promise<AIServiceResponse>;
    generateTextWithTencent(request: AITextRequest): Promise<AIServiceResponse>;
    generateText(request: AITextRequest): Promise<AIServiceResponse>;
    generateImage(request: AIImageRequest): Promise<AIServiceResponse>;
    generateImageCaption(imagePrompt: string, poemContent: string): Promise<string>;
}
export declare const chineseAIManager: ChineseAIManager;
export {};
//# sourceMappingURL=ChineseAIManager.d.ts.map
export interface PoemImage {
    id?: number;
    poem_id: number;
    prompt_hash: string;
    image_url: string;
    image_path?: string;
    ai_service: string;
    generation_params?: any;
    caption?: string;
    created_at?: string;
}
export interface PoemRating {
    id?: number;
    poem_id: number;
    user_id: string;
    content_rating: number;
    image_rating: number;
    overall_rating: number;
    comment?: string;
    created_at?: string;
}
export interface LearningRecord {
    id?: number;
    user_id: string;
    poem_id: number;
    learning_mode: 'traditional' | 'immersive';
    answers: any;
    score: number;
    accuracy_rate: number;
    completion_status: 'started' | 'completed' | 'abandoned';
    start_time?: string;
    completion_time?: string;
}
export interface AIServiceConfig {
    id?: number;
    service_name: string;
    service_type: 'text' | 'image' | 'both';
    api_endpoint: string;
    api_key?: string;
    additional_params?: any;
    is_active: boolean;
    priority: number;
}
declare class DatabaseManager {
    private db;
    private config;
    constructor();
    initialize(): Promise<void>;
    getImageFromCache(poemId: number, prompt: string): Promise<PoemImage | null>;
    saveImageToCache(imageData: Omit<PoemImage, 'id' | 'created_at'>): Promise<number>;
    saveRating(rating: Omit<PoemRating, 'id' | 'created_at'>): Promise<void>;
    getPoemRatings(poemId: number): Promise<{
        average_content: number;
        average_image: number;
        average_overall: number;
        total_ratings: number;
        ratings: PoemRating[];
    }>;
    saveLearningRecord(record: Omit<LearningRecord, 'id'>): Promise<number>;
    updateLearningAnalytics(poemId: number, answers: any): Promise<void>;
    getLearningAnalytics(poemId: number): Promise<any>;
    getActiveAIServices(type?: 'text' | 'image' | 'both'): Promise<AIServiceConfig[]>;
    updateAIServiceConfig(serviceName: string, config: Partial<AIServiceConfig>): Promise<void>;
    private generatePromptHash;
    getPoems(filters?: {
        dynasty?: string;
        difficulty?: string;
        category?: string;
        limit?: number;
        offset?: number;
    }): Promise<any[]>;
    getPoemById(id: number): Promise<any | null>;
    close(): Promise<void>;
}
export declare function getDatabaseManager(): DatabaseManager;
export declare const databaseManager: DatabaseManager;
export {};
//# sourceMappingURL=DatabaseManager.d.ts.map
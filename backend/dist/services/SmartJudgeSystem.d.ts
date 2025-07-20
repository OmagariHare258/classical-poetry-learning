interface CharacterAnalysis {
    position: number;
    character: string;
    userInput: string;
    isCorrect: boolean;
    similarity: number;
    commonMistakes: string[];
    hints: string[];
}
interface LearningAnalysis {
    totalCharacters: number;
    correctCount: number;
    partialCount: number;
    incorrectCount: number;
    accuracyRate: number;
    characterAnalyses: CharacterAnalysis[];
    suggestions: string[];
}
declare class SmartJudgeSystem {
    private similarCharacters;
    private semanticGroups;
    constructor();
    private initializeSimilarCharacters;
    private initializeSemanticGroups;
    private calculateSimilarity;
    private hasSameRadical;
    private hasSimilarTone;
    private generateHints;
    analyzeUserAnswers(poemId: number, correctContent: string, userAnswers: string[]): Promise<LearningAnalysis>;
    private generateSuggestions;
    updateLearningStats(poemId: number, userId: string, analysis: LearningAnalysis): Promise<void>;
}
export declare const smartJudgeSystem: SmartJudgeSystem;
export type { LearningAnalysis, CharacterAnalysis };
//# sourceMappingURL=SmartJudgeSystem.d.ts.map
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.smartJudgeSystem = void 0;
const DatabaseManager_1 = require("../database/DatabaseManager");
class SmartJudgeSystem {
    constructor() {
        this.similarCharacters = new Map();
        this.semanticGroups = new Map();
        this.initializeSimilarCharacters();
        this.initializeSemanticGroups();
    }
    initializeSimilarCharacters() {
        const similarPairs = [
            ['明', '朋'], ['月', '肉'], ['日', '曰'], ['天', '夫'],
            ['人', '入'], ['大', '太'], ['中', '忠'], ['心', '必'],
            ['青', '清'], ['情', '晴'], ['鸟', '乌'], ['马', '鸟'],
            ['春', '青'], ['花', '华'], ['风', '凤'], ['雨', '两'],
            ['山', '仙'], ['水', '永'], ['白', '自'], ['来', '末'],
            ['去', '云'], ['头', '买'], ['低', '底'], ['思', '斯'],
            ['故', '古'], ['乡', '香'], ['夜', '液'], ['声', '生'],
            ['知', '智'], ['多', '夕'], ['少', '沙'], ['处', '外'],
            ['闻', '间'], ['啼', '蹄'], ['落', '洛'], ['黄', '皇'],
            ['河', '何'], ['海', '梅'], ['流', '留'], ['望', '忘'],
            ['千', '干'], ['里', '理'], ['目', '眼'], ['更', '便'],
            ['上', '止'], ['层', '曾'], ['楼', '搂'], ['尽', '荆']
        ];
        similarPairs.forEach(([char1, char2]) => {
            if (!this.similarCharacters.has(char1)) {
                this.similarCharacters.set(char1, []);
            }
            if (!this.similarCharacters.has(char2)) {
                this.similarCharacters.set(char2, []);
            }
            this.similarCharacters.get(char1).push(char2);
            this.similarCharacters.get(char2).push(char1);
        });
    }
    initializeSemanticGroups() {
        const semanticGroups = [
            ['天', '空', '云', '风', '雨', '雪'],
            ['山', '水', '河', '海', '川', '流'],
            ['春', '夏', '秋', '冬', '季', '节'],
            ['花', '草', '树', '叶', '枝', '根'],
            ['月', '日', '星', '光', '明', '暗'],
            ['红', '绿', '青', '白', '黄', '黑'],
            ['大', '小', '长', '短', '高', '低'],
            ['来', '去', '出', '入', '上', '下'],
            ['思', '想', '念', '忆', '怀', '恋'],
            ['喜', '怒', '哀', '乐', '愁', '愉']
        ];
        semanticGroups.forEach(group => {
            group.forEach(char => {
                this.semanticGroups.set(char, group.filter(c => c !== char));
            });
        });
    }
    calculateSimilarity(correct, input) {
        if (correct === input)
            return 1.0;
        if (correct === '')
            return 0.0;
        if (input === '')
            return 0.0;
        let similarity = 0.0;
        if (this.similarCharacters.get(correct)?.includes(input)) {
            similarity = Math.max(similarity, 0.7);
        }
        if (this.semanticGroups.get(correct)?.includes(input)) {
            similarity = Math.max(similarity, 0.5);
        }
        if (this.hasSameRadical(correct, input)) {
            similarity = Math.max(similarity, 0.4);
        }
        if (this.hasSimilarTone(correct, input)) {
            similarity = Math.max(similarity, 0.3);
        }
        return similarity;
    }
    hasSameRadical(char1, char2) {
        const radicalGroups = [
            ['明', '晓', '昏', '暗', '晴', '时'],
            ['情', '怀', '思', '想', '愁', '怨'],
            ['花', '草', '菊', '荷', '莲', '梅'],
            ['河', '海', '湖', '江', '池', '流'],
            ['鸟', '鸡', '鸭', '鹅', '雁', '燕']
        ];
        return radicalGroups.some(group => group.includes(char1) && group.includes(char2));
    }
    hasSimilarTone(char1, char2) {
        const toneGroups = [
            ['明', '名', '鸣', '茗'],
            ['思', '私', '司', '丝'],
            ['花', '华', '话', '化'],
            ['风', '丰', '封', '峰'],
            ['月', '越', '乐', '岳']
        ];
        return toneGroups.some(group => group.includes(char1) && group.includes(char2));
    }
    generateHints(correct, userInput, position) {
        const hints = [];
        if (userInput === '') {
            hints.push('这个位置不能为空');
            hints.push(`正确答案是"${correct}"`);
            return hints;
        }
        const similarity = this.calculateSimilarity(correct, userInput);
        if (similarity >= 0.7) {
            hints.push('答案很接近了！注意字形的细微差别');
            if (this.similarCharacters.get(correct)?.includes(userInput)) {
                hints.push(`"${userInput}"和"${correct}"确实很相似，但在这里应该是"${correct}"`);
            }
        }
        else if (similarity >= 0.5) {
            hints.push('意思相近，但用字不对');
            if (this.semanticGroups.get(correct)?.includes(userInput)) {
                hints.push(`"${userInput}"和"${correct}"语义相关，但这里需要"${correct}"`);
            }
        }
        else if (similarity >= 0.3) {
            hints.push('字形或读音有相似之处');
            hints.push(`正确答案是"${correct}"`);
        }
        else {
            hints.push('答案偏差较大');
            hints.push(`这个位置应该是"${correct}"`);
            if (position > 0) {
                hints.push('可以结合前面的字来思考');
            }
        }
        return hints;
    }
    async analyzeUserAnswers(poemId, correctContent, userAnswers) {
        const correctChars = correctContent.replace(/[，。！？、；：]/g, '').split('');
        const characterAnalyses = [];
        let correctCount = 0;
        let partialCount = 0;
        let incorrectCount = 0;
        const historicalData = await DatabaseManager_1.databaseManager.getLearningAnalytics(poemId);
        for (let i = 0; i < correctChars.length; i++) {
            const correctChar = correctChars[i];
            const userInput = userAnswers[i] || '';
            const similarity = this.calculateSimilarity(correctChar, userInput);
            let isCorrect = false;
            if (similarity === 1.0) {
                correctCount++;
                isCorrect = true;
            }
            else if (similarity >= 0.5) {
                partialCount++;
            }
            else {
                incorrectCount++;
            }
            const commonMistakes = historicalData[i]?.common_mistakes || [];
            if (userInput !== correctChar && userInput !== '') {
                if (!commonMistakes.includes(userInput)) {
                    commonMistakes.push(userInput);
                }
            }
            characterAnalyses.push({
                position: i,
                character: correctChar,
                userInput,
                isCorrect,
                similarity,
                commonMistakes,
                hints: this.generateHints(correctChar, userInput, i)
            });
        }
        const totalCharacters = correctChars.length;
        const accuracyRate = totalCharacters > 0
            ? (correctCount + partialCount * 0.5) / totalCharacters
            : 0;
        const suggestions = this.generateSuggestions(characterAnalyses, accuracyRate);
        return {
            totalCharacters,
            correctCount,
            partialCount,
            incorrectCount,
            accuracyRate,
            characterAnalyses,
            suggestions
        };
    }
    generateSuggestions(analyses, accuracyRate) {
        const suggestions = [];
        if (accuracyRate >= 0.9) {
            suggestions.push('太棒了！你已经完全掌握了这首诗');
            suggestions.push('可以尝试学习更有挑战性的诗词');
        }
        else if (accuracyRate >= 0.7) {
            suggestions.push('不错的表现！还有几个字需要注意');
            const incorrectChars = analyses
                .filter(a => !a.isCorrect)
                .map(a => a.character);
            if (incorrectChars.length > 0) {
                suggestions.push(`特别注意这些字：${incorrectChars.join('、')}`);
            }
        }
        else if (accuracyRate >= 0.5) {
            suggestions.push('基本掌握，还需要多练习');
            suggestions.push('建议重点复习错误较多的部分');
            const similarErrors = analyses
                .filter(a => !a.isCorrect && a.similarity >= 0.5)
                .map(a => `"${a.userInput}"应该是"${a.character}"`);
            if (similarErrors.length > 0) {
                suggestions.push('这些字很接近了：' + similarErrors.join('；'));
            }
        }
        else {
            suggestions.push('需要更多练习，不要灰心！');
            suggestions.push('建议先熟读原文，理解诗词的意境');
            suggestions.push('可以尝试分段练习，逐步提高');
        }
        const formErrors = analyses.filter(a => !a.isCorrect && a.similarity >= 0.6).length;
        if (formErrors > 2) {
            suggestions.push('注意区分形似字，多观察字形细节');
        }
        const semanticErrors = analyses.filter(a => !a.isCorrect && a.similarity >= 0.4 && a.similarity < 0.6).length;
        if (semanticErrors > 2) {
            suggestions.push('理解诗词含义，避免用意思相近但不正确的字');
        }
        return suggestions;
    }
    async updateLearningStats(poemId, userId, analysis) {
        const answers = {};
        analysis.characterAnalyses.forEach(charAnalysis => {
            answers[charAnalysis.position] = {
                correct: charAnalysis.character,
                user_input: charAnalysis.userInput,
                is_correct: charAnalysis.isCorrect,
                similarity: charAnalysis.similarity,
                attempts: [charAnalysis.userInput].filter(input => input !== ''),
                success_rate: charAnalysis.isCorrect ? 1.0 : 0.0,
                mistakes: charAnalysis.isCorrect ? [] : [charAnalysis.userInput]
            };
        });
        await DatabaseManager_1.databaseManager.saveLearningRecord({
            user_id: userId,
            poem_id: poemId,
            learning_mode: 'immersive',
            answers,
            score: Math.round(analysis.accuracyRate * 100),
            accuracy_rate: analysis.accuracyRate,
            completion_status: analysis.accuracyRate >= 0.8 ? 'completed' : 'started',
            completion_time: analysis.accuracyRate >= 0.8 ? new Date().toISOString() : undefined
        });
    }
}
exports.smartJudgeSystem = new SmartJudgeSystem();
//# sourceMappingURL=SmartJudgeSystem.js.map
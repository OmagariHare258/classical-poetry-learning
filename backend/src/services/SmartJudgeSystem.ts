// 改进的学习正误判断系统 (需求2)
import { databaseManager } from '../database/DatabaseManager';

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

class SmartJudgeSystem {
  private similarCharacters: Map<string, string[]> = new Map();
  private semanticGroups: Map<string, string[]> = new Map();

  constructor() {
    this.initializeSimilarCharacters();
    this.initializeSemanticGroups();
  }

  // 初始化形似字对照表
  private initializeSimilarCharacters() {
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
      this.similarCharacters.get(char1)!.push(char2);
      this.similarCharacters.get(char2)!.push(char1);
    });
  }

  // 初始化语义相关字组
  private initializeSemanticGroups() {
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

  // 计算字符相似度
  private calculateSimilarity(correct: string, input: string): number {
    if (correct === input) return 1.0;
    if (correct === '') return 0.0;
    if (input === '') return 0.0;

    let similarity = 0.0;

    // 形似字判断 (相似度 0.7)
    if (this.similarCharacters.get(correct)?.includes(input)) {
      similarity = Math.max(similarity, 0.7);
    }

    // 语义相关判断 (相似度 0.5)
    if (this.semanticGroups.get(correct)?.includes(input)) {
      similarity = Math.max(similarity, 0.5);
    }

    // 偏旁部首相同 (相似度 0.4)
    if (this.hasSameRadical(correct, input)) {
      similarity = Math.max(similarity, 0.4);
    }

    // 声调相近 (相似度 0.3)
    if (this.hasSimilarTone(correct, input)) {
      similarity = Math.max(similarity, 0.3);
    }

    return similarity;
  }

  // 简单的偏旁部首检查 (可以进一步完善)
  private hasSameRadical(char1: string, char2: string): boolean {
    const radicalGroups = [
      ['明', '晓', '昏', '暗', '晴', '时'],
      ['情', '怀', '思', '想', '愁', '怨'],
      ['花', '草', '菊', '荷', '莲', '梅'],
      ['河', '海', '湖', '江', '池', '流'],
      ['鸟', '鸡', '鸭', '鹅', '雁', '燕']
    ];

    return radicalGroups.some(group => 
      group.includes(char1) && group.includes(char2)
    );
  }

  // 简单的声调检查 (可以接入真实的拼音库)
  private hasSimilarTone(char1: string, char2: string): boolean {
    const toneGroups = [
      ['明', '名', '鸣', '茗'], // ming
      ['思', '私', '司', '丝'], // si
      ['花', '华', '话', '化'], // hua
      ['风', '丰', '封', '峰'], // feng
      ['月', '越', '乐', '岳']  // yue
    ];

    return toneGroups.some(group => 
      group.includes(char1) && group.includes(char2)
    );
  }

  // 生成提示信息
  private generateHints(correct: string, userInput: string, position: number): string[] {
    const hints: string[] = [];

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
    } else if (similarity >= 0.5) {
      hints.push('意思相近，但用字不对');
      if (this.semanticGroups.get(correct)?.includes(userInput)) {
        hints.push(`"${userInput}"和"${correct}"语义相关，但这里需要"${correct}"`);
      }
    } else if (similarity >= 0.3) {
      hints.push('字形或读音有相似之处');
      hints.push(`正确答案是"${correct}"`);
    } else {
      hints.push('答案偏差较大');
      hints.push(`这个位置应该是"${correct}"`);
      
      // 根据位置给出上下文提示
      if (position > 0) {
        hints.push('可以结合前面的字来思考');
      }
    }

    return hints;
  }

  // 分析用户答案
  async analyzeUserAnswers(
    poemId: number, 
    correctContent: string, 
    userAnswers: string[]
  ): Promise<LearningAnalysis> {
    const correctChars = correctContent.replace(/[，。！？、；：]/g, '').split('');
    const characterAnalyses: CharacterAnalysis[] = [];
    
    let correctCount = 0;
    let partialCount = 0;
    let incorrectCount = 0;

    // 获取历史学习数据
    const historicalData = await databaseManager.getLearningAnalytics(poemId);

    for (let i = 0; i < correctChars.length; i++) {
      const correctChar = correctChars[i];
      const userInput = userAnswers[i] || '';
      const similarity = this.calculateSimilarity(correctChar, userInput);
      
      let isCorrect = false;
      if (similarity === 1.0) {
        correctCount++;
        isCorrect = true;
      } else if (similarity >= 0.5) {
        partialCount++;
      } else {
        incorrectCount++;
      }

      // 获取常见错误
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

    // 生成学习建议
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

  // 生成学习建议
  private generateSuggestions(analyses: CharacterAnalysis[], accuracyRate: number): string[] {
    const suggestions: string[] = [];

    if (accuracyRate >= 0.9) {
      suggestions.push('太棒了！你已经完全掌握了这首诗');
      suggestions.push('可以尝试学习更有挑战性的诗词');
    } else if (accuracyRate >= 0.7) {
      suggestions.push('不错的表现！还有几个字需要注意');
      
      const incorrectChars = analyses
        .filter(a => !a.isCorrect)
        .map(a => a.character);
      
      if (incorrectChars.length > 0) {
        suggestions.push(`特别注意这些字：${incorrectChars.join('、')}`);
      }
    } else if (accuracyRate >= 0.5) {
      suggestions.push('基本掌握，还需要多练习');
      suggestions.push('建议重点复习错误较多的部分');
      
      // 找出相似度较高但仍错误的字
      const similarErrors = analyses
        .filter(a => !a.isCorrect && a.similarity >= 0.5)
        .map(a => `"${a.userInput}"应该是"${a.character}"`);
      
      if (similarErrors.length > 0) {
        suggestions.push('这些字很接近了：' + similarErrors.join('；'));
      }
    } else {
      suggestions.push('需要更多练习，不要灰心！');
      suggestions.push('建议先熟读原文，理解诗词的意境');
      suggestions.push('可以尝试分段练习，逐步提高');
    }

    // 针对常见错误类型给建议
    const formErrors = analyses.filter(a => 
      !a.isCorrect && a.similarity >= 0.6
    ).length;
    
    if (formErrors > 2) {
      suggestions.push('注意区分形似字，多观察字形细节');
    }

    const semanticErrors = analyses.filter(a => 
      !a.isCorrect && a.similarity >= 0.4 && a.similarity < 0.6
    ).length;
    
    if (semanticErrors > 2) {
      suggestions.push('理解诗词含义，避免用意思相近但不正确的字');
    }

    return suggestions;
  }

  // 更新学习统计数据
  async updateLearningStats(
    poemId: number, 
    userId: string, 
    analysis: LearningAnalysis
  ): Promise<void> {
    const answers: any = {};
    
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

    await databaseManager.saveLearningRecord({
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

export const smartJudgeSystem = new SmartJudgeSystem();
export type { LearningAnalysis, CharacterAnalysis };

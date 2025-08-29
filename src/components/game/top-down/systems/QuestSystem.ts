import { QUEST_TYPES, QUEST_STATUS } from '../ref/constants';

// 任务目标接口
export interface QuestObjective {
  id: string;
  type: keyof typeof QUEST_TYPES;
  target: string; // 目标ID（敌人ID、物品ID、NPC ID等）
  required: number; // 需要完成的数量
  current: number; // 当前完成的数量
  description: string;
}

// 任务奖励接口
export interface QuestReward {
  experience: number;
  gold: number;
  items: Array<{
    id: string;
    quantity: number;
  }>;
  reputation?: number;
}

// 任务接口
export interface Quest {
  id: string;
  title: string;
  description: string;
  objectives: QuestObjective[];
  rewards: QuestReward;
  status: keyof typeof QUEST_STATUS;
  level: number;
  category: 'main' | 'side' | 'daily' | 'weekly';
  timeLimit?: number; // 时间限制（毫秒）
  startTime?: number; // 开始时间
  prerequisites?: string[]; // 前置任务ID
  repeatable: boolean; // 是否可重复
  giver: string; // 发布任务的NPC ID
  turnIn: string; // 交任务的NPC ID
}

/**
 * 任务系统
 * 管理游戏中的任务、进度跟踪和奖励发放
 */
export class QuestSystem {
  private activeQuests: Map<string, Quest>;
  private completedQuests: Set<string>;
  private questLog: Quest[];
  private experience: number;
  private level: number;

  constructor() {
    this.activeQuests = new Map();
    this.completedQuests = new Set();
    this.questLog = [];
    this.experience = 0;
    this.level = 1;
  }

  /**
   * 接受任务
   * @param quest - 任务对象
   * @returns 是否成功接受
   */
  acceptQuest(quest: Quest): boolean {
    // 检查前置任务
    if (quest.prerequisites) {
      for (const prereqId of quest.prerequisites) {
        if (!this.completedQuests.has(prereqId)) {
          return false;
        }
      }
    }

    // 检查等级要求
    if (this.level < quest.level) {
      return false;
    }

    // 检查是否已经接受过
    if (this.activeQuests.has(quest.id)) {
      return false;
    }

    // 检查是否已完成且不可重复
    if (this.completedQuests.has(quest.id) && !quest.repeatable) {
      return false;
    }

    // 接受任务
    const questCopy = { ...quest, status: QUEST_STATUS.IN_PROGRESS };
    this.activeQuests.set(quest.id, questCopy);
    this.questLog.push(questCopy);

    return true;
  }

  /**
   * 更新任务进度
   * @param type - 任务类型
   * @param target - 目标ID
   * @param amount - 完成数量
   */
  updateQuestProgress(type: keyof typeof QUEST_TYPES, target: string, amount: number = 1): void {
    for (const quest of this.activeQuests.values()) {
      for (const objective of quest.objectives) {
        if (objective.type === type && objective.target === target) {
          objective.current = Math.min(objective.current + amount, objective.required);
          
          // 检查任务是否完成
          if (this.isQuestComplete(quest)) {
            quest.status = QUEST_STATUS.COMPLETED;
          }
        }
      }
    }
  }

  /**
   * 检查任务是否完成
   * @param quest - 任务对象
   * @returns 是否完成
   */
  private isQuestComplete(quest: Quest): boolean {
    return quest.objectives.every(objective => objective.current >= objective.required);
  }

  /**
   * 完成任务
   * @param questId - 任务ID
   * @returns 任务奖励
   */
  completeQuest(questId: string): QuestReward | null {
    const quest = this.activeQuests.get(questId);
    if (!quest || quest.status !== QUEST_STATUS.COMPLETED) {
      return null;
    }

    // 发放奖励
    this.experience += quest.rewards.experience;
    this.levelUp();

    // 标记任务完成
    this.completedQuests.add(questId);
    this.activeQuests.delete(questId);

    // 从任务日志中移除
    const index = this.questLog.findIndex(q => q.id === questId);
    if (index !== -1) {
      this.questLog.splice(index, 1);
    }

    return quest.rewards;
  }

  /**
   * 放弃任务
   * @param questId - 任务ID
   * @returns 是否成功放弃
   */
  abandonQuest(questId: string): boolean {
    const quest = this.activeQuests.get(questId);
    if (!quest) {
      return false;
    }

    quest.status = QUEST_STATUS.FAILED;
    this.activeQuests.delete(questId);

    // 从任务日志中移除
    const index = this.questLog.findIndex(q => q.id === questId);
    if (index !== -1) {
      this.questLog.splice(index, 1);
    }

    return true;
  }

  /**
   * 获取活跃任务
   * @returns 活跃任务数组
   */
  getActiveQuests(): Quest[] {
    return Array.from(this.activeQuests.values());
  }

  /**
   * 获取已完成任务
   * @returns 已完成任务ID数组
   */
  getCompletedQuests(): string[] {
    return Array.from(this.completedQuests);
  }

  /**
   * 获取任务日志
   * @returns 任务日志数组
   */
  getQuestLog(): Quest[] {
    return [...this.questLog];
  }

  /**
   * 检查任务状态
   * @param questId - 任务ID
   * @returns 任务状态
   */
  getQuestStatus(questId: string): keyof typeof QUEST_STATUS | null {
    const activeQuest = this.activeQuests.get(questId);
    if (activeQuest) {
      return activeQuest.status;
    }

    if (this.completedQuests.has(questId)) {
      return QUEST_STATUS.COMPLETED;
    }

    return null;
  }

  /**
   * 获取任务进度
   * @param questId - 任务ID
   * @returns 任务进度信息
   */
  getQuestProgress(questId: string): { completed: number; total: number } | null {
    const quest = this.activeQuests.get(questId);
    if (!quest) {
      return null;
    }

    let completed = 0;
    let total = 0;

    for (const objective of quest.objectives) {
      completed += objective.current;
      total += objective.required;
    }

    return { completed, total };
  }

  /**
   * 等级提升
   */
  private levelUp(): void {
    const experienceNeeded = this.level * 100; // 简单的经验值计算
    if (this.experience >= experienceNeeded) {
      this.level++;
      this.experience -= experienceNeeded;
    }
  }

  /**
   * 获取玩家等级
   * @returns 玩家等级
   */
  getLevel(): number {
    return this.level;
  }

  /**
   * 获取玩家经验值
   * @returns 玩家经验值
   */
  getExperience(): number {
    return this.experience;
  }

  /**
   * 获取升级所需经验值
   * @returns 升级所需经验值
   */
  getExperienceToNextLevel(): number {
    return this.level * 100;
  }

  /**
   * 检查NPC是否有可用任务
   * @param npcId - NPC ID
   * @param availableQuests - 可用任务列表
   * @returns 可用任务数组
   */
  getAvailableQuestsForNPC(npcId: string, availableQuests: Quest[]): Quest[] {
    return availableQuests.filter(quest => {
      // 检查是否是此NPC发布的任务
      if (quest.giver !== npcId) {
        return false;
      }

      // 检查是否已经接受
      if (this.activeQuests.has(quest.id)) {
        return false;
      }

      // 检查是否已完成且不可重复
      if (this.completedQuests.has(quest.id) && !quest.repeatable) {
        return false;
      }

      // 检查前置任务
      if (quest.prerequisites) {
        for (const prereqId of quest.prerequisites) {
          if (!this.completedQuests.has(prereqId)) {
            return false;
          }
        }
      }

      // 检查等级要求
      if (this.level < quest.level) {
        return false;
      }

      return true;
    });
  }

  /**
   * 检查NPC是否有可交的任务
   * @param npcId - NPC ID
   * @returns 可交任务数组
   */
  getCompletableQuestsForNPC(npcId: string): Quest[] {
    return Array.from(this.activeQuests.values()).filter(quest => 
      quest.turnIn === npcId && quest.status === QUEST_STATUS.COMPLETED
    );
  }

  /**
   * 保存任务数据
   * @returns 任务数据
   */
  saveData() {
    return {
      activeQuests: Array.from(this.activeQuests.entries()),
      completedQuests: Array.from(this.completedQuests),
      questLog: this.questLog,
      experience: this.experience,
      level: this.level
    };
  }

  /**
   * 加载任务数据
   * @param data - 任务数据
   */
  loadData(data: any) {
    this.activeQuests = new Map(data.activeQuests || []);
    this.completedQuests = new Set(data.completedQuests || []);
    this.questLog = data.questLog || [];
    this.experience = data.experience || 0;
    this.level = data.level || 1;
  }
}
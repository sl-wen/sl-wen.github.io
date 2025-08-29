import { QUEST_TYPES, QUEST_STATUS } from '../ref/constants';
import { storage } from '../utils';

// 任务统计接口
export interface QuestStatistics {
  totalQuestsCompleted: number;
  totalExperienceGained: number;
  totalGoldEarned: number;
  totalItemsReceived: number;
  averageCompletionTime: number;
  questsByCategory: Record<string, number>;
  questsByDifficulty: Record<string, number>;
  completionRate: number;
  streakDays: number;
  lastCompletionDate: number;
}

// 任务通知接口
export interface QuestNotification {
  id: string;
  type: 'quest_available' | 'quest_completed' | 'quest_failed' | 'objective_completed' | 'reward_available';
  title: string;
  message: string;
  questId?: string;
  timestamp: number;
  isRead: boolean;
  priority: 'low' | 'medium' | 'high';
}

// 任务追踪接口
export interface QuestTracking {
  trackedQuestId: string | null;
  showObjectives: boolean;
  showProgress: boolean;
  showRewards: boolean;
  autoTrack: boolean;
}

// 任务过滤器接口
export interface QuestFilters {
  category: 'all' | 'main' | 'side' | 'daily' | 'weekly' | 'event' | 'seasonal' | 'achievement';
  difficulty: 'all' | 'easy' | 'normal' | 'hard' | 'expert' | 'legendary';
  status: 'all' | 'not_started' | 'in_progress' | 'completed' | 'failed';
  level: 'all' | number;
  tags: string[];
  faction: 'all' | string;
  showHidden: boolean;
  showSecret: boolean;
  showCompleted: boolean;
  showExpired: boolean;
}

// 任务排序接口
export interface QuestSorting {
  field: 'priority' | 'level' | 'category' | 'difficulty' | 'status' | 'time' | 'rewards';
  direction: 'asc' | 'desc';
}

// 任务目标接口
export interface QuestObjective {
  id: string;
  type: keyof typeof QUEST_TYPES;
  target: string; // 目标ID（敌人ID、物品ID、NPC ID等）
  required: number; // 需要完成的数量
  current: number; // 当前完成的数量
  description: string;
  // 新增属性
  optional?: boolean; // 是否可选目标
  hidden?: boolean; // 是否隐藏目标
  bonusReward?: QuestReward; // 额外奖励
  timeLimit?: number; // 目标时间限制
  location?: { x: number; y: number; map: string }; // 目标位置
  conditions?: QuestCondition[]; // 完成条件
  progress?: number; // 进度百分比
  isCompleted?: boolean; // 是否已完成
  completedTime?: number; // 完成时间
}

// 任务条件接口
export interface QuestCondition {
  type: 'level' | 'item' | 'skill' | 'reputation' | 'quest' | 'location' | 'time' | 'weather';
  value: any;
  operator: 'equals' | 'greater_than' | 'less_than' | 'contains' | 'not_equals' | 'between';
  description: string;
}

// 任务奖励接口
export interface QuestReward {
  experience: number;
  gold: number;
  items: Array<{
    id: string;
    quantity: number;
    quality?: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
  }>;
  reputation?: number;
  // 新增奖励类型
  skills?: string[]; // 技能奖励
  abilities?: string[]; // 能力奖励
  titles?: string[]; // 称号奖励
  achievements?: string[]; // 成就奖励
  currency?: {
    type: string;
    amount: number;
  }[];
  reputationPoints?: {
    faction: string;
    points: number;
  }[];
  unlockContent?: string[]; // 解锁内容
  teleportPoints?: string[]; // 传送点解锁
  specialRewards?: any[]; // 特殊奖励
}

// 任务链接口
export interface QuestChain {
  id: string;
  name: string;
  description: string;
  quests: string[]; // 任务ID数组
  currentQuestIndex: number;
  isCompleted: boolean;
  rewards: QuestReward;
  unlockCondition?: QuestCondition[];
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
  category: 'main' | 'side' | 'daily' | 'weekly' | 'event' | 'seasonal' | 'achievement';
  timeLimit?: number; // 时间限制（毫秒）
  startTime?: number; // 开始时间
  prerequisites?: string[]; // 前置任务ID
  repeatable: boolean; // 是否可重复
  giver: string; // 发布任务的NPC ID
  turnIn: string; // 交任务的NPC ID
  // 新增属性
  chainId?: string; // 任务链ID
  difficulty: 'easy' | 'normal' | 'hard' | 'expert' | 'legendary';
  tags: string[]; // 任务标签
  storyText?: string; // 剧情文本
  cutscene?: string; // 过场动画
  voiceActing?: string; // 配音文件
  backgroundMusic?: string; // 背景音乐
  weather?: string; // 天气要求
  timeOfDay?: 'day' | 'night' | 'dawn' | 'dusk' | 'any';
  location?: { x: number; y: number; map: string }; // 任务位置
  radius?: number; // 任务范围
  hidden?: boolean; // 是否隐藏任务
  secret?: boolean; // 是否秘密任务
  faction?: string; // 相关阵营
  reputation?: number; // 声望要求
  skillRequirements?: { skill: string; level: number }[]; // 技能要求
  itemRequirements?: { item: string; quantity: number }[]; // 物品要求
  partySize?: number; // 队伍大小要求
  pvp?: boolean; // 是否PVP任务
  seasonal?: boolean; // 是否季节性任务
  eventOnly?: boolean; // 是否活动专属
  priority?: number; // 任务优先级
  estimatedTime?: number; // 预估完成时间
  hints?: string[]; // 任务提示
  walkthrough?: string; // 任务攻略
  communityRating?: number; // 社区评分
  completionRate?: number; // 完成率
  averageTime?: number; // 平均完成时间
  createdBy?: string; // 创建者
  version?: string; // 版本号
  lastUpdated?: number; // 最后更新时间
  isActive?: boolean; // 是否激活
  isExpired?: boolean; // 是否过期
  expirationDate?: number; // 过期时间
  resetTime?: number; // 重置时间
  maxCompletions?: number; // 最大完成次数
  currentCompletions?: number; // 当前完成次数
  cooldown?: number; // 冷却时间
  lastCompletionTime?: number; // 上次完成时间
}

/**
 * 任务系统
 * 管理游戏中的任务、进度跟踪和奖励发放
 */
export class QuestSystem {
  private static instance: QuestSystem;
  private activeQuests: Map<string, Quest>;
  private completedQuests: Set<string>;
  private questLog: Quest[];
  private questChains: Map<string, QuestChain>;
  private experience: number;
  private level: number;
  // 新增属性
  private questHistory: Quest[];
  private questStatistics: QuestStatistics;
  private questNotifications: QuestNotification[];
  private questTracking: QuestTracking;
  private questFilters: QuestFilters;
  private questSorting: QuestSorting;

  private constructor() {
    this.activeQuests = new Map();
    this.completedQuests = new Set();
    this.questLog = [];
    this.questChains = new Map();
    this.questHistory = [];
    this.experience = 0;
    this.level = 1;
    
    // 初始化统计
    this.questStatistics = {
      totalQuestsCompleted: 0,
      totalExperienceGained: 0,
      totalGoldEarned: 0,
      totalItemsReceived: 0,
      averageCompletionTime: 0,
      questsByCategory: {},
      questsByDifficulty: {},
      completionRate: 0,
      streakDays: 0,
      lastCompletionDate: 0
    };
    
    // 初始化通知
    this.questNotifications = [];
    
    // 初始化追踪
    this.questTracking = {
      trackedQuestId: null,
      showObjectives: true,
      showProgress: true,
      showRewards: true,
      autoTrack: true
    };
    
    // 初始化过滤器
    this.questFilters = {
      category: 'all',
      difficulty: 'all',
      status: 'all',
      level: 'all',
      tags: [],
      faction: 'all',
      showHidden: false,
      showSecret: false,
      showCompleted: false,
      showExpired: false
    };
    
    // 初始化排序
    this.questSorting = {
      field: 'priority',
      direction: 'desc'
    };
  }

  public static getInstance(): QuestSystem {
    if (!QuestSystem.instance) {
      QuestSystem.instance = new QuestSystem();
    }
    return QuestSystem.instance;
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

  // 新增的高级任务方法

  /**
   * 创建任务链
   * @param chain - 任务链对象
   */
  createQuestChain(chain: QuestChain): void {
    this.questChains.set(chain.id, chain);
  }

  /**
   * 获取任务链
   * @param chainId - 任务链ID
   * @returns 任务链对象
   */
  getQuestChain(chainId: string): QuestChain | undefined {
    return this.questChains.get(chainId);
  }

  /**
   * 获取所有任务链
   * @returns 任务链数组
   */
  getAllQuestChains(): QuestChain[] {
    return Array.from(this.questChains.values());
  }

  /**
   * 更新任务链进度
   * @param chainId - 任务链ID
   */
  updateQuestChainProgress(chainId: string): void {
    const chain = this.questChains.get(chainId);
    if (!chain) return;

    // 检查当前任务是否完成
    const currentQuestId = chain.quests[chain.currentQuestIndex];
    if (currentQuestId && this.completedQuests.has(currentQuestId)) {
      chain.currentQuestIndex++;
      
      // 检查任务链是否完成
      if (chain.currentQuestIndex >= chain.quests.length) {
        chain.isCompleted = true;
        this.completeQuestChain(chainId);
      }
    }
  }

  /**
   * 完成任务链
   * @param chainId - 任务链ID
   * @returns 任务链奖励
   */
  completeQuestChain(chainId: string): QuestReward | null {
    const chain = this.questChains.get(chainId);
    if (!chain || !chain.isCompleted) return null;

    // 发放任务链奖励
    this.applyQuestRewards(chain.rewards);
    
    return chain.rewards;
  }

  /**
   * 检查任务条件
   * @param quest - 任务对象
   * @returns 是否满足条件
   */
  checkQuestConditions(quest: Quest): boolean {
    if (!quest.prerequisites) return true;

    // 检查前置任务
    for (const prereqId of quest.prerequisites) {
      if (!this.completedQuests.has(prereqId)) {
        return false;
      }
    }

    // 检查等级要求
    if (this.level < quest.level) {
      return false;
    }

    // 检查声望要求
    if (quest.reputation && quest.reputation > 0) {
      // 这里需要与声望系统集成
      return true; // 暂时返回true
    }

    // 检查技能要求
    if (quest.skillRequirements) {
      for (const skillReq of quest.skillRequirements) {
        // 这里需要与技能系统集成
        return true; // 暂时返回true
      }
    }

    // 检查物品要求
    if (quest.itemRequirements) {
      for (const itemReq of quest.itemRequirements) {
        // 这里需要与物品系统集成
        return true; // 暂时返回true
      }
    }

    return true;
  }

  /**
   * 应用任务奖励
   * @param rewards - 任务奖励
   */
  private applyQuestRewards(rewards: QuestReward): void {
    // 基础奖励
    this.experience += rewards.experience;
    this.questStatistics.totalExperienceGained += rewards.experience;
    this.questStatistics.totalGoldEarned += rewards.gold;
    this.questStatistics.totalItemsReceived += rewards.items.length;

    // 等级提升
    this.levelUp();

    // 物品奖励
    rewards.items.forEach(item => {
      // 这里需要与物品系统集成
      console.log(`获得物品: ${item.id} x${item.quantity}`);
    });

    // 技能奖励
    if (rewards.skills) {
      rewards.skills.forEach(skill => {
        // 这里需要与技能系统集成
        console.log(`获得技能: ${skill}`);
      });
    }

    // 能力奖励
    if (rewards.abilities) {
      rewards.abilities.forEach(ability => {
        // 这里需要与能力系统集成
        console.log(`获得能力: ${ability}`);
      });
    }

    // 称号奖励
    if (rewards.titles) {
      rewards.titles.forEach(title => {
        // 这里需要与称号系统集成
        console.log(`获得称号: ${title}`);
      });
    }

    // 成就奖励
    if (rewards.achievements) {
      rewards.achievements.forEach(achievement => {
        // 这里需要与成就系统集成
        console.log(`获得成就: ${achievement}`);
      });
    }

    // 声望奖励
    if (rewards.reputationPoints) {
      rewards.reputationPoints.forEach(rep => {
        // 这里需要与声望系统集成
        console.log(`获得声望: ${rep.faction} +${rep.points}`);
      });
    }

    // 解锁内容
    if (rewards.unlockContent) {
      rewards.unlockContent.forEach(content => {
        // 这里需要与内容解锁系统集成
        console.log(`解锁内容: ${content}`);
      });
    }

    // 传送点解锁
    if (rewards.teleportPoints) {
      rewards.teleportPoints.forEach(point => {
        // 这里需要与传送点系统集成
        console.log(`解锁传送点: ${point}`);
      });
    }
  }

  /**
   * 更新任务目标进度
   * @param objectiveId - 目标ID
   * @param amount - 完成数量
   */
  updateObjectiveProgress(objectiveId: string, amount: number = 1): void {
    for (const quest of this.activeQuests.values()) {
      const objective = quest.objectives.find(obj => obj.id === objectiveId);
      if (objective) {
        objective.current = Math.min(objective.current + amount, objective.required);
        objective.progress = (objective.current / objective.required) * 100;
        
        // 检查目标是否完成
        if (objective.current >= objective.required) {
          objective.isCompleted = true;
          objective.completedTime = Date.now();
          
          // 检查任务是否完成
          if (this.isQuestComplete(quest)) {
            quest.status = QUEST_STATUS.COMPLETED;
            this.onQuestCompleted(quest);
          }
        }
      }
    }
  }

  /**
   * 任务完成回调
   * @param quest - 完成的任务
   */
  private onQuestCompleted(quest: Quest): void {
    // 更新统计
    this.questStatistics.totalQuestsCompleted++;
    this.questStatistics.completionRate = (this.questStatistics.totalQuestsCompleted / this.questLog.length) * 100;
    
    // 添加到历史记录
    this.questHistory.push({ ...quest, completedTime: Date.now() });
    
    // 创建通知
    this.createNotification({
      id: `quest_completed_${quest.id}`,
      type: 'quest_completed',
      questId: quest.id,
      message: `任务完成: ${quest.title}`,
      timestamp: Date.now(),
      isRead: false,
      priority: 'high'
    });
    
    // 检查任务链进度
    if (quest.chainId) {
      this.updateQuestChainProgress(quest.chainId);
    }
    
    // 自动追踪下一个任务
    if (this.questTracking.autoTrack) {
      this.autoTrackNextQuest(quest);
    }
  }

  /**
   * 自动追踪下一个任务
   * @param completedQuest - 刚完成的任务
   */
  private autoTrackNextQuest(completedQuest: Quest): void {
    // 查找相关任务
    const relatedQuests = this.questLog.filter(quest => 
      quest.prerequisites?.includes(completedQuest.id) ||
      quest.chainId === completedQuest.chainId
    );
    
    if (relatedQuests.length > 0) {
      // 追踪优先级最高的任务
      const nextQuest = relatedQuests.sort((a, b) => (b.priority || 0) - (a.priority || 0))[0];
      this.trackQuest(nextQuest.id);
    }
  }

  /**
   * 追踪任务
   * @param questId - 任务ID
   */
  trackQuest(questId: string): void {
    this.questTracking.trackedQuestId = questId;
  }

  /**
   * 取消追踪任务
   */
  untrackQuest(): void {
    this.questTracking.trackedQuestId = null;
  }

  /**
   * 获取追踪的任务
   * @returns 追踪的任务
   */
  getTrackedQuest(): Quest | null {
    if (!this.questTracking.trackedQuestId) return null;
    return this.activeQuests.get(this.questTracking.trackedQuestId) || null;
  }

  /**
   * 创建通知
   * @param notification - 通知对象
   */
  createNotification(notification: QuestNotification): void {
    this.questNotifications.push(notification);
    
    // 限制通知数量
    if (this.questNotifications.length > 50) {
      this.questNotifications.shift();
    }
  }

  /**
   * 获取通知
   * @returns 通知数组
   */
  getNotifications(): QuestNotification[] {
    return this.questNotifications.filter(n => !n.isRead);
  }

  /**
   * 标记通知为已读
   * @param notificationId - 通知ID
   */
  markNotificationAsRead(notificationId: string): void {
    const notification = this.questNotifications.find(n => n.id === notificationId);
    if (notification) {
      notification.isRead = true;
    }
  }

  /**
   * 清除所有通知
   */
  clearNotifications(): void {
    this.questNotifications = [];
  }

  /**
   * 过滤任务
   * @param filters - 过滤器
   * @returns 过滤后的任务
   */
  filterQuests(filters: Partial<QuestFilters>): Quest[] {
    this.questFilters = { ...this.questFilters, ...filters };
    
    return this.questLog.filter(quest => {
      // 分类过滤
      if (filters.category && filters.category !== 'all' && quest.category !== filters.category) {
        return false;
      }
      
      // 难度过滤
      if (filters.difficulty && filters.difficulty !== 'all' && quest.difficulty !== filters.difficulty) {
        return false;
      }
      
      // 状态过滤
      if (filters.status && filters.status !== 'all' && quest.status !== filters.status) {
        return false;
      }
      
      // 等级过滤
      if (filters.level && filters.level !== 'all') {
        const levelRange = this.parseLevelFilter(filters.level);
        if (quest.level < levelRange.min || quest.level > levelRange.max) {
          return false;
        }
      }
      
      // 标签过滤
      if (filters.tags && filters.tags.length > 0) {
        const hasMatchingTag = filters.tags.some(tag => quest.tags.includes(tag));
        if (!hasMatchingTag) return false;
      }
      
      // 阵营过滤
      if (filters.faction && filters.faction !== 'all' && quest.faction !== filters.faction) {
        return false;
      }
      
      // 隐藏任务过滤
      if (!filters.showHidden && quest.hidden) {
        return false;
      }
      
      // 秘密任务过滤
      if (!filters.showSecret && quest.secret) {
        return false;
      }
      
      // 已完成任务过滤
      if (!filters.showCompleted && this.completedQuests.has(quest.id)) {
        return false;
      }
      
      // 过期任务过滤
      if (!filters.showExpired && quest.isExpired) {
        return false;
      }
      
      return true;
    });
  }

  /**
   * 解析等级过滤器
   * @param levelFilter - 等级过滤器
   * @returns 等级范围
   */
  private parseLevelFilter(levelFilter: string): { min: number; max: number } {
    switch (levelFilter) {
      case 'low': return { min: 1, max: 10 };
      case 'medium': return { min: 11, max: 30 };
      case 'high': return { min: 31, max: 50 };
      case 'max': return { min: 51, max: 999 };
      default: return { min: 1, max: 999 };
    }
  }

  /**
   * 排序任务
   * @param field - 排序字段
   * @param direction - 排序方向
   * @returns 排序后的任务
   */
  sortQuests(field: string, direction: 'asc' | 'desc' = 'desc'): Quest[] {
    this.questSorting = { field, direction };
    
    return this.questLog.sort((a, b) => {
      let aValue: any = a[field as keyof Quest];
      let bValue: any = b[field as keyof Quest];
      
      // 处理特殊字段
      switch (field) {
        case 'priority':
          aValue = a.priority || 0;
          bValue = b.priority || 0;
          break;
        case 'level':
          aValue = a.level;
          bValue = b.level;
          break;
        case 'difficulty':
          const difficultyOrder = { easy: 1, normal: 2, hard: 3, expert: 4, legendary: 5 };
          aValue = difficultyOrder[a.difficulty] || 0;
          bValue = difficultyOrder[b.difficulty] || 0;
          break;
        case 'category':
          const categoryOrder = { main: 1, side: 2, daily: 3, weekly: 4, event: 5, seasonal: 6, achievement: 7 };
          aValue = categoryOrder[a.category] || 0;
          bValue = categoryOrder[b.category] || 0;
          break;
      }
      
      if (direction === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });
  }

  /**
   * 获取任务统计
   * @returns 任务统计
   */
  getQuestStatistics(): QuestStatistics {
    return { ...this.questStatistics };
  }

  /**
   * 获取任务历史
   * @returns 任务历史
   */
  getQuestHistory(): Quest[] {
    return [...this.questHistory];
  }

  /**
   * 搜索任务
   * @param query - 搜索查询
   * @returns 搜索结果
   */
  searchQuests(query: string): Quest[] {
    const lowerQuery = query.toLowerCase();
    
    return this.questLog.filter(quest => 
      quest.title.toLowerCase().includes(lowerQuery) ||
      quest.description.toLowerCase().includes(lowerQuery) ||
      quest.tags.some(tag => tag.toLowerCase().includes(lowerQuery)) ||
      quest.storyText?.toLowerCase().includes(lowerQuery)
    );
  }

  /**
   * 获取推荐任务
   * @returns 推荐任务数组
   */
  getRecommendedQuests(): Quest[] {
    return this.questLog
      .filter(quest => 
        !this.activeQuests.has(quest.id) && 
        !this.completedQuests.has(quest.id) &&
        this.checkQuestConditions(quest)
      )
      .sort((a, b) => (b.priority || 0) - (a.priority || 0))
      .slice(0, 5);
  }

  /**
   * 保存任务数据
   */
  saveQuestData(): void {
    const questData = {
      activeQuests: Array.from(this.activeQuests.entries()),
      completedQuests: Array.from(this.completedQuests),
      questLog: this.questLog,
      questChains: Array.from(this.questChains.entries()),
      questHistory: this.questHistory,
      questStatistics: this.questStatistics,
      questNotifications: this.questNotifications,
      questTracking: this.questTracking,
      questFilters: this.questFilters,
      questSorting: this.questSorting,
      experience: this.experience,
      level: this.level,
      timestamp: Date.now()
    };
    
    storage.set('quest_data', questData);
  }

  /**
   * 加载任务数据
   */
  loadQuestData(): void {
    const questData = storage.get('quest_data', null);
    if (questData) {
      this.activeQuests = new Map(questData.activeQuests || []);
      this.completedQuests = new Set(questData.completedQuests || []);
      this.questLog = questData.questLog || [];
      this.questChains = new Map(questData.questChains || []);
      this.questHistory = questData.questHistory || [];
      this.questStatistics = questData.questStatistics || this.questStatistics;
      this.questNotifications = questData.questNotifications || [];
      this.questTracking = questData.questTracking || this.questTracking;
      this.questFilters = questData.questFilters || this.questFilters;
      this.questSorting = questData.questSorting || this.questSorting;
      this.experience = questData.experience || 0;
      this.level = questData.level || 1;
    }
  }
}
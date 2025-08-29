/**
 * 增强成就系统
 * 提供高级成就跟踪、进度系统、奖励、社交功能和详细分析
 */

import { storage } from '../utils';

// 成就类型
export type AchievementType = 'combat' | 'exploration' | 'collection' | 'crafting' | 'social' | 'progression' | 'challenge' | 'secret' | 'event' | 'mastery' | 'custom';

// 成就稀有度
export type AchievementRarity = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary' | 'mythic';

// 成就状态
export type AchievementStatus = 'locked' | 'in_progress' | 'completed' | 'claimed';

// 成就条件类型
export type ConditionType = 'count' | 'time' | 'distance' | 'damage' | 'currency' | 'experience' | 'level' | 'skill' | 'item' | 'quest' | 'location' | 'interaction' | 'combination' | 'sequence' | 'challenge' | 'social' | 'custom';

// 奖励类型
export type RewardType = 'experience' | 'currency' | 'item' | 'title' | 'cosmetic' | 'skill' | 'ability' | 'unlock' | 'badge' | 'custom';

// 成就条件
export interface AchievementCondition {
  id: string;
  type: ConditionType;
  target: string;
  value: number;
  currentValue: number;
  operator: 'equals' | 'greater_than' | 'less_than' | 'greater_equal' | 'less_equal' | 'between' | 'not_equals';
  isOptional: boolean;
  isHidden: boolean;
  description: string;
  metadata: Record<string, any>;
}

// 成就奖励
export interface AchievementReward {
  id: string;
  type: RewardType;
  value: number;
  itemId?: string;
  title?: string;
  cosmeticId?: string;
  skillId?: string;
  abilityId?: string;
  unlockId?: string;
  badgeId?: string;
  isClaimed: boolean;
  metadata: Record<string, any>;
}

// 成就进度
export interface AchievementProgress {
  achievementId: string;
  currentValue: number;
  targetValue: number;
  progress: number; // 0-100
  startTime: number;
  lastUpdateTime: number;
  completionTime?: number;
  isCompleted: boolean;
  isClaimed: boolean;
  attempts: number;
  metadata: Record<string, any>;
}

// 成就
export interface Achievement {
  id: string;
  name: string;
  description: string;
  type: AchievementType;
  rarity: AchievementRarity;
  category: string;
  subcategory?: string;
  icon: string;
  points: number;
  isSecret: boolean;
  isRepeatable: boolean;
  isTimeLimited: boolean;
  startTime?: number;
  endTime?: number;
  conditions: AchievementCondition[];
  rewards: AchievementReward[];
  prerequisites: string[]; // 前置成就ID
  unlocks: string[]; // 解锁的成就ID
  tags: string[];
  difficulty: 'easy' | 'medium' | 'hard' | 'expert' | 'master';
  estimatedTime: number; // 预计完成时间（分钟）
  popularity: number; // 获得该成就的玩家比例
  metadata: Record<string, any>;
}

// 成就系列
export interface AchievementSeries {
  id: string;
  name: string;
  description: string;
  achievements: string[];
  totalPoints: number;
  completedPoints: number;
  completionReward?: AchievementReward;
  isCompleted: boolean;
  metadata: Record<string, any>;
}

// 成就事件
export interface AchievementEvent {
  type: 'achievement_unlocked' | 'achievement_progress' | 'reward_claimed' | 'series_completed' | 'milestone_reached' | 'custom';
  achievementId: string;
  data?: any;
  timestamp: number;
}

// 成就统计
export interface AchievementStats {
  totalAchievements: number;
  unlockedAchievements: number;
  totalPoints: number;
  earnedPoints: number;
  completionRate: number;
  averageRarity: number;
  rarestAchievement?: Achievement;
  mostRecentAchievement?: Achievement;
  longestAchievement?: Achievement;
  fastestAchievement?: Achievement;
  favoriteCategory: string;
  achievementsByType: Record<AchievementType, number>;
  achievementsByRarity: Record<AchievementRarity, number>;
  achievementsByDifficulty: Record<string, number>;
  metadata: Record<string, any>;
}

// 成就配置
export interface AchievementConfig {
  autoTracking: boolean;
  showProgress: boolean;
  showHidden: boolean;
  notifications: boolean;
  soundEffects: boolean;
  visualEffects: boolean;
  socialFeatures: boolean;
  leaderboards: boolean;
  sharing: boolean;
  analytics: boolean;
}

// 成就比较
export interface AchievementComparison {
  id: string;
  name: string;
  description: string;
  playerStats: AchievementStats;
  globalStats: AchievementStats;
  rank: number;
  percentile: number;
  difference: Record<string, number>;
  metadata: Record<string, any>;
}

export class EnhancedAchievementSystem {
  private static instance: EnhancedAchievementSystem;
  private scene: Phaser.Scene | null = null;
  
  // 数据存储
  private achievements: Map<string, Achievement> = new Map();
  private progress: Map<string, AchievementProgress> = new Map();
  private series: Map<string, AchievementSeries> = new Map();
  private events: AchievementEvent[] = [];
  private callbacks: Map<string, (data: any) => void> = new Map();
  
  // 配置
  private config: AchievementConfig = {
    autoTracking: true,
    showProgress: true,
    showHidden: false,
    notifications: true,
    soundEffects: true,
    visualEffects: true,
    socialFeatures: true,
    leaderboards: true,
    sharing: true,
    analytics: true
  };
  
  // 统计
  private stats: AchievementStats = {
    totalAchievements: 0,
    unlockedAchievements: 0,
    totalPoints: 0,
    earnedPoints: 0,
    completionRate: 0,
    averageRarity: 0,
    rarestAchievement: undefined,
    mostRecentAchievement: undefined,
    longestAchievement: undefined,
    fastestAchievement: undefined,
    favoriteCategory: '',
    achievementsByType: {} as Record<AchievementType, number>,
    achievementsByRarity: {} as Record<AchievementRarity, number>,
    achievementsByDifficulty: {} as Record<string, number>,
    metadata: {}
  };

  private constructor() {
    this.initializeDefaultAchievements();
    this.initializeDefaultSeries();
    this.loadProgress();
  }

  public static getInstance(): EnhancedAchievementSystem {
    if (!EnhancedAchievementSystem.instance) {
      EnhancedAchievementSystem.instance = new EnhancedAchievementSystem();
    }
    return EnhancedAchievementSystem.instance;
  }

  /**
   * 初始化增强成就系统
   */
  public initialize(scene: Phaser.Scene): void {
    this.scene = scene;
    this.setupEventHandlers();
    this.updateStats();
    console.log('增强成就系统已初始化');
  }

  /**
   * 初始化默认成就
   */
  private initializeDefaultAchievements(): void {
    // 战斗成就
    this.addAchievement({
      id: 'first_blood',
      name: '初次见血',
      description: '击败第一个敌人',
      type: 'combat',
      rarity: 'common',
      category: 'combat',
      icon: 'sword',
      points: 10,
      isSecret: false,
      isRepeatable: false,
      isTimeLimited: false,
      conditions: [{
        id: 'enemies_defeated',
        type: 'count',
        target: 'enemies_defeated',
        value: 1,
        currentValue: 0,
        operator: 'greater_equal',
        isOptional: false,
        isHidden: false,
        description: '击败1个敌人',
        metadata: {}
      }],
      rewards: [{
        id: 'exp_reward',
        type: 'experience',
        value: 50,
        isClaimed: false,
        metadata: {}
      }],
      prerequisites: [],
      unlocks: ['combat_master'],
      tags: ['combat', 'beginner'],
      difficulty: 'easy',
      estimatedTime: 5,
      popularity: 0.95,
      metadata: {}
    });

    this.addAchievement({
      id: 'combat_master',
      name: '战斗大师',
      description: '击败100个敌人',
      type: 'combat',
      rarity: 'rare',
      category: 'combat',
      icon: 'crown',
      points: 100,
      isSecret: false,
      isRepeatable: false,
      isTimeLimited: false,
      conditions: [{
        id: 'enemies_defeated',
        type: 'count',
        target: 'enemies_defeated',
        value: 100,
        currentValue: 0,
        operator: 'greater_equal',
        isOptional: false,
        isHidden: false,
        description: '击败100个敌人',
        metadata: {}
      }],
      rewards: [{
        id: 'title_reward',
        type: 'title',
        title: '战斗大师',
        value: 100,
        isClaimed: false,
        metadata: {}
      }],
      prerequisites: ['first_blood'],
      unlocks: [],
      tags: ['combat', 'mastery'],
      difficulty: 'hard',
      estimatedTime: 120,
      popularity: 0.3,
      metadata: {}
    });

    // 探索成就
    this.addAchievement({
      id: 'explorer',
      name: '探索者',
      description: '发现10个新区域',
      type: 'exploration',
      rarity: 'uncommon',
      category: 'exploration',
      icon: 'compass',
      points: 50,
      isSecret: false,
      isRepeatable: false,
      isTimeLimited: false,
      conditions: [{
        id: 'areas_discovered',
        type: 'count',
        target: 'areas_discovered',
        value: 10,
        currentValue: 0,
        operator: 'greater_equal',
        isOptional: false,
        isHidden: false,
        description: '发现10个区域',
        metadata: {}
      }],
      rewards: [{
        id: 'currency_reward',
        type: 'currency',
        value: 200,
        isClaimed: false,
        metadata: {}
      }],
      prerequisites: [],
      unlocks: ['master_explorer'],
      tags: ['exploration', 'discovery'],
      difficulty: 'medium',
      estimatedTime: 60,
      popularity: 0.7,
      metadata: {}
    });

    // 收集成就
    this.addAchievement({
      id: 'collector',
      name: '收集者',
      description: '收集50个物品',
      type: 'collection',
      rarity: 'uncommon',
      category: 'collection',
      icon: 'backpack',
      points: 75,
      isSecret: false,
      isRepeatable: false,
      isTimeLimited: false,
      conditions: [{
        id: 'items_collected',
        type: 'count',
        target: 'items_collected',
        value: 50,
        currentValue: 0,
        operator: 'greater_equal',
        isOptional: false,
        isHidden: false,
        description: '收集50个物品',
        metadata: {}
      }],
      rewards: [{
        id: 'item_reward',
        type: 'item',
        itemId: 'collector_bag',
        value: 1,
        isClaimed: false,
        metadata: {}
      }],
      prerequisites: [],
      unlocks: ['hoarder'],
      tags: ['collection', 'items'],
      difficulty: 'medium',
      estimatedTime: 90,
      popularity: 0.6,
      metadata: {}
    });

    // 制作成就
    this.addAchievement({
      id: 'craftsman',
      name: '工匠',
      description: '制作20个物品',
      type: 'crafting',
      rarity: 'rare',
      category: 'crafting',
      icon: 'hammer',
      points: 80,
      isSecret: false,
      isRepeatable: false,
      isTimeLimited: false,
      conditions: [{
        id: 'items_crafted',
        type: 'count',
        target: 'items_crafted',
        value: 20,
        currentValue: 0,
        operator: 'greater_equal',
        isOptional: false,
        isHidden: false,
        description: '制作20个物品',
        metadata: {}
      }],
      rewards: [{
        id: 'skill_reward',
        type: 'skill',
        skillId: 'crafting_mastery',
        value: 1,
        isClaimed: false,
        metadata: {}
      }],
      prerequisites: [],
      unlocks: ['master_craftsman'],
      tags: ['crafting', 'skills'],
      difficulty: 'hard',
      estimatedTime: 150,
      popularity: 0.4,
      metadata: {}
    });

    // 社交成就
    this.addAchievement({
      id: 'social_butterfly',
      name: '社交蝴蝶',
      description: '与10个NPC对话',
      type: 'social',
      rarity: 'common',
      category: 'social',
      icon: 'chat',
      points: 25,
      isSecret: false,
      isRepeatable: false,
      isTimeLimited: false,
      conditions: [{
        id: 'npcs_talked',
        type: 'count',
        target: 'npcs_talked',
        value: 10,
        currentValue: 0,
        operator: 'greater_equal',
        isOptional: false,
        isHidden: false,
        description: '与10个NPC对话',
        metadata: {}
      }],
      rewards: [{
        id: 'cosmetic_reward',
        type: 'cosmetic',
        cosmeticId: 'social_badge',
        value: 1,
        isClaimed: false,
        metadata: {}
      }],
      prerequisites: [],
      unlocks: ['diplomat'],
      tags: ['social', 'npc'],
      difficulty: 'easy',
      estimatedTime: 30,
      popularity: 0.8,
      metadata: {}
    });

    // 进度成就
    this.addAchievement({
      id: 'level_up',
      name: '升级',
      description: '达到10级',
      type: 'progression',
      rarity: 'common',
      category: 'progression',
      icon: 'star',
      points: 30,
      isSecret: false,
      isRepeatable: false,
      isTimeLimited: false,
      conditions: [{
        id: 'player_level',
        type: 'level',
        target: 'player_level',
        value: 10,
        currentValue: 0,
        operator: 'greater_equal',
        isOptional: false,
        isHidden: false,
        description: '达到10级',
        metadata: {}
      }],
      rewards: [{
        id: 'ability_reward',
        type: 'ability',
        abilityId: 'level_boost',
        value: 1,
        isClaimed: false,
        metadata: {}
      }],
      prerequisites: [],
      unlocks: ['veteran'],
      tags: ['progression', 'level'],
      difficulty: 'easy',
      estimatedTime: 45,
      popularity: 0.9,
      metadata: {}
    });

    // 挑战成就
    this.addAchievement({
      id: 'speed_runner',
      name: '速通者',
      description: '在30分钟内完成主线任务',
      type: 'challenge',
      rarity: 'epic',
      category: 'challenge',
      icon: 'clock',
      points: 150,
      isSecret: false,
      isRepeatable: true,
      isTimeLimited: false,
      conditions: [{
        id: 'main_quest_time',
        type: 'time',
        target: 'main_quest_completion_time',
        value: 1800, // 30分钟
        currentValue: 0,
        operator: 'less_equal',
        isOptional: false,
        isHidden: false,
        description: '在30分钟内完成主线任务',
        metadata: {}
      }],
      rewards: [{
        id: 'title_reward',
        type: 'title',
        title: '速通者',
        value: 100,
        isClaimed: false,
        metadata: {}
      }],
      prerequisites: [],
      unlocks: [],
      tags: ['challenge', 'speed'],
      difficulty: 'expert',
      estimatedTime: 30,
      popularity: 0.1,
      metadata: {}
    });

    // 秘密成就
    this.addAchievement({
      id: 'secret_finder',
      name: '秘密发现者',
      description: '发现隐藏的秘密',
      type: 'secret',
      rarity: 'legendary',
      category: 'secret',
      icon: 'question_mark',
      points: 200,
      isSecret: true,
      isRepeatable: false,
      isTimeLimited: false,
      conditions: [{
        id: 'secrets_found',
        type: 'count',
        target: 'secrets_found',
        value: 1,
        currentValue: 0,
        operator: 'greater_equal',
        isOptional: false,
        isHidden: true,
        description: '发现隐藏的秘密',
        metadata: {}
      }],
      rewards: [{
        id: 'unlock_reward',
        type: 'unlock',
        unlockId: 'secret_area',
        value: 1,
        isClaimed: false,
        metadata: {}
      }],
      prerequisites: [],
      unlocks: [],
      tags: ['secret', 'hidden'],
      difficulty: 'master',
      estimatedTime: 300,
      popularity: 0.05,
      metadata: {}
    });

    // 事件成就
    this.addAchievement({
      id: 'event_participant',
      name: '活动参与者',
      description: '参与特殊事件',
      type: 'event',
      rarity: 'uncommon',
      category: 'event',
      icon: 'calendar',
      points: 60,
      isSecret: false,
      isRepeatable: true,
      isTimeLimited: true,
      startTime: Date.now(),
      endTime: Date.now() + 7 * 24 * 60 * 60 * 1000, // 7天后
      conditions: [{
        id: 'event_participation',
        type: 'count',
        target: 'event_participation',
        value: 1,
        currentValue: 0,
        operator: 'greater_equal',
        isOptional: false,
        isHidden: false,
        description: '参与特殊事件',
        metadata: {}
      }],
      rewards: [{
        id: 'event_reward',
        type: 'item',
        itemId: 'event_exclusive',
        value: 1,
        isClaimed: false,
        metadata: {}
      }],
      prerequisites: [],
      unlocks: [],
      tags: ['event', 'limited'],
      difficulty: 'medium',
      estimatedTime: 20,
      popularity: 0.5,
      metadata: {}
    });

    // 精通成就
    this.addAchievement({
      id: 'skill_master',
      name: '技能大师',
      description: '将任意技能提升到最高等级',
      type: 'mastery',
      rarity: 'mythic',
      category: 'mastery',
      icon: 'trophy',
      points: 500,
      isSecret: false,
      isRepeatable: false,
      isTimeLimited: false,
      conditions: [{
        id: 'skill_max_level',
        type: 'skill',
        target: 'any_skill_max_level',
        value: 1,
        currentValue: 0,
        operator: 'greater_equal',
        isOptional: false,
        isHidden: false,
        description: '将任意技能提升到最高等级',
        metadata: {}
      }],
      rewards: [{
        id: 'mastery_reward',
        type: 'title',
        title: '技能大师',
        value: 100,
        isClaimed: false,
        metadata: {}
      }],
      prerequisites: [],
      unlocks: [],
      tags: ['mastery', 'skill'],
      difficulty: 'master',
      estimatedTime: 1000,
      popularity: 0.02,
      metadata: {}
    });
  }

  /**
   * 初始化默认成就系列
   */
  private initializeDefaultSeries(): void {
    // 战斗系列
    this.addSeries({
      id: 'combat_series',
      name: '战斗系列',
      description: '完成所有战斗相关成就',
      achievements: ['first_blood', 'combat_master'],
      totalPoints: 110,
      completedPoints: 0,
      completionReward: {
        id: 'combat_series_reward',
        type: 'title',
        title: '战斗专家',
        value: 100,
        isClaimed: false,
        metadata: {}
      },
      isCompleted: false,
      metadata: {}
    });

    // 探索系列
    this.addSeries({
      id: 'exploration_series',
      name: '探索系列',
      description: '完成所有探索相关成就',
      achievements: ['explorer'],
      totalPoints: 50,
      completedPoints: 0,
      completionReward: {
        id: 'exploration_series_reward',
        type: 'cosmetic',
        cosmeticId: 'explorer_outfit',
        value: 1,
        isClaimed: false,
        metadata: {}
      },
      isCompleted: false,
      metadata: {}
    });

    // 收集系列
    this.addSeries({
      id: 'collection_series',
      name: '收集系列',
      description: '完成所有收集相关成就',
      achievements: ['collector'],
      totalPoints: 75,
      completedPoints: 0,
      completionReward: {
        id: 'collection_series_reward',
        type: 'item',
        itemId: 'collector_chest',
        value: 1,
        isClaimed: false,
        metadata: {}
      },
      isCompleted: false,
      metadata: {}
    });
  }

  /**
   * 设置事件处理器
   */
  private setupEventHandlers(): void {
    if (this.scene) {
      // 监听游戏事件
      this.scene.events.on('enemy-defeated', this.handleEnemyDefeated, this);
      this.scene.events.on('area-discovered', this.handleAreaDiscovered, this);
      this.scene.events.on('item-collected', this.handleItemCollected, this);
      this.scene.events.on('item-crafted', this.handleItemCrafted, this);
      this.scene.events.on('npc-talked', this.handleNPCTalked, this);
      this.scene.events.on('level-up', this.handleLevelUp, this);
      this.scene.events.on('quest-completed', this.handleQuestCompleted, this);
      this.scene.events.on('secret-found', this.handleSecretFound, this);
      this.scene.events.on('event-participated', this.handleEventParticipated, this);
      this.scene.events.on('skill-maxed', this.handleSkillMaxed, this);
    }
  }

  /**
   * 添加成就
   */
  public addAchievement(achievement: Achievement): void {
    this.achievements.set(achievement.id, achievement);
    
    // 初始化进度
    if (!this.progress.has(achievement.id)) {
      this.progress.set(achievement.id, {
        achievementId: achievement.id,
        currentValue: 0,
        targetValue: this.calculateTargetValue(achievement),
        progress: 0,
        startTime: Date.now(),
        lastUpdateTime: Date.now(),
        isCompleted: false,
        isClaimed: false,
        attempts: 0,
        metadata: {}
      });
    }
    
    this.addEvent('custom', { achievement });
  }

  /**
   * 获取成就
   */
  public getAchievement(achievementId: string): Achievement | undefined {
    return this.achievements.get(achievementId);
  }

  /**
   * 获取所有成就
   */
  public getAllAchievements(): Achievement[] {
    return Array.from(this.achievements.values());
  }

  /**
   * 获取成就进度
   */
  public getAchievementProgress(achievementId: string): AchievementProgress | undefined {
    return this.progress.get(achievementId);
  }

  /**
   * 更新成就进度
   */
  public updateProgress(achievementId: string, conditionId: string, value: number): void {
    const achievement = this.getAchievement(achievementId);
    const progress = this.getAchievementProgress(achievementId);
    
    if (!achievement || !progress) return;

    // 更新条件进度
    const condition = achievement.conditions.find(c => c.id === conditionId);
    if (condition) {
      condition.currentValue = value;
    }

    // 检查是否完成
    const isCompleted = this.checkAchievementCompletion(achievement);
    
    if (isCompleted && !progress.isCompleted) {
      progress.isCompleted = true;
      progress.completionTime = Date.now();
      this.unlockAchievement(achievement);
    }

    // 更新进度
    progress.currentValue = this.calculateCurrentValue(achievement);
    progress.targetValue = this.calculateTargetValue(achievement);
    progress.progress = Math.min(100, (progress.currentValue / progress.targetValue) * 100);
    progress.lastUpdateTime = Date.now();
    progress.attempts++;

    this.saveProgress();
    this.addEvent('achievement_progress', { achievementId, progress });
  }

  /**
   * 检查成就完成
   */
  private checkAchievementCompletion(achievement: Achievement): boolean {
    // 检查前置条件
    for (const prerequisiteId of achievement.prerequisites) {
      const prerequisiteProgress = this.getAchievementProgress(prerequisiteId);
      if (!prerequisiteProgress?.isCompleted) {
        return false;
      }
    }

    // 检查时间限制
    if (achievement.isTimeLimited) {
      const now = Date.now();
      if (achievement.startTime && now < achievement.startTime) return false;
      if (achievement.endTime && now > achievement.endTime) return false;
    }

    // 检查所有条件
    for (const condition of achievement.conditions) {
      if (condition.isOptional) continue;
      
      const isMet = this.checkCondition(condition);
      if (!isMet) return false;
    }

    return true;
  }

  /**
   * 检查条件
   */
  private checkCondition(condition: AchievementCondition): boolean {
    const { currentValue, value, operator } = condition;
    
    switch (operator) {
      case 'equals':
        return currentValue === value;
      case 'greater_than':
        return currentValue > value;
      case 'less_than':
        return currentValue < value;
      case 'greater_equal':
        return currentValue >= value;
      case 'less_equal':
        return currentValue <= value;
      case 'between':
        const min = condition.metadata.min || 0;
        const max = condition.metadata.max || value;
        return currentValue >= min && currentValue <= max;
      case 'not_equals':
        return currentValue !== value;
      default:
        return false;
    }
  }

  /**
   * 解锁成就
   */
  private unlockAchievement(achievement: Achievement): void {
    const progress = this.getAchievementProgress(achievement.id);
    if (!progress) return;

    // 触发解锁事件
    this.addEvent('achievement_unlocked', { achievement, progress });
    
    // 显示通知
    if (this.config.notifications) {
      this.showNotification(achievement);
    }

    // 播放音效
    if (this.config.soundEffects) {
      this.playUnlockSound(achievement.rarity);
    }

    // 显示特效
    if (this.config.visualEffects) {
      this.showUnlockEffect(achievement);
    }

    // 更新统计
    this.updateStats();

    // 检查系列完成
    this.checkSeriesCompletion(achievement);

    // 触发回调
    this.triggerCallback('achievement_unlocked', { achievement, progress });
  }

  /**
   * 显示通知
   */
  private showNotification(achievement: Achievement): void {
    if (this.scene) {
      this.scene.events.emit('show-achievement-notification', {
        title: achievement.name,
        description: achievement.description,
        rarity: achievement.rarity,
        points: achievement.points,
        icon: achievement.icon
      });
    }
  }

  /**
   * 播放解锁音效
   */
  private playUnlockSound(rarity: AchievementRarity): void {
    if (this.scene) {
      const soundMap = {
        common: 'achievement_common',
        uncommon: 'achievement_uncommon',
        rare: 'achievement_rare',
        epic: 'achievement_epic',
        legendary: 'achievement_legendary',
        mythic: 'achievement_mythic'
      };
      
      this.scene.events.emit('play-sound', {
        key: soundMap[rarity] || 'achievement_common',
        volume: 0.5
      });
    }
  }

  /**
   * 显示解锁特效
   */
  private showUnlockEffect(achievement: Achievement): void {
    if (this.scene) {
      const effectMap = {
        common: 0xffffff,
        uncommon: 0x00ff00,
        rare: 0x0080ff,
        epic: 0x8000ff,
        legendary: 0xff8000,
        mythic: 0xff0080
      };
      
      this.scene.events.emit('show-achievement-effect', {
        color: effectMap[achievement.rarity] || 0xffffff,
        duration: 2000,
        scale: 1.5
      });
    }
  }

  /**
   * 领取奖励
   */
  public claimReward(achievementId: string, rewardId: string): boolean {
    const achievement = this.getAchievement(achievementId);
    const progress = this.getAchievementProgress(achievementId);
    
    if (!achievement || !progress || !progress.isCompleted) {
      return false;
    }

    const reward = achievement.rewards.find(r => r.id === rewardId);
    if (!reward || reward.isClaimed) {
      return false;
    }

    // 发放奖励
    this.giveReward(reward);
    
    // 标记为已领取
    reward.isClaimed = true;
    progress.isClaimed = true;

    this.saveProgress();
    this.addEvent('reward_claimed', { achievementId, reward });
    
    return true;
  }

  /**
   * 发放奖励
   */
  private giveReward(reward: AchievementReward): void {
    if (this.scene) {
      this.scene.events.emit('give-achievement-reward', {
        type: reward.type,
        value: reward.value,
        itemId: reward.itemId,
        title: reward.title,
        cosmeticId: reward.cosmeticId,
        skillId: reward.skillId,
        abilityId: reward.abilityId,
        unlockId: reward.unlockId,
        badgeId: reward.badgeId
      });
    }
  }

  /**
   * 添加系列
   */
  public addSeries(series: AchievementSeries): void {
    this.series.set(series.id, series);
  }

  /**
   * 检查系列完成
   */
  private checkSeriesCompletion(achievement: Achievement): void {
    for (const series of Array.from(this.series.values())) {
      if (series.achievements.includes(achievement.id) && !series.isCompleted) {
        const allCompleted = series.achievements.every((achievementId: any) => {
          const progress = this.getAchievementProgress(achievementId);
          return progress?.isCompleted;
        });

        if (allCompleted) {
          series.isCompleted = true;
          this.addEvent('series_completed', { series });
          
          if (series.completionReward) {
            this.giveReward(series.completionReward);
          }
        }
      }
    }
  }

  /**
   * 计算目标值
   */
  private calculateTargetValue(achievement: Achievement): number {
    return achievement.conditions.reduce((total, condition) => {
      return total + condition.value;
    }, 0);
  }

  /**
   * 计算当前值
   */
  private calculateCurrentValue(achievement: Achievement): number {
    return achievement.conditions.reduce((total, condition) => {
      return total + condition.currentValue;
    }, 0);
  }

  /**
   * 更新统计
   */
  private updateStats(): void {
    const achievements = this.getAllAchievements();
    const progress = Array.from(this.progress.values());
    
    this.stats.totalAchievements = achievements.length;
    this.stats.unlockedAchievements = progress.filter(p => p.isCompleted).length;
    this.stats.completionRate = this.stats.totalAchievements > 0 
      ? (this.stats.unlockedAchievements / this.stats.totalAchievements) * 100 
      : 0;

    // 计算点数
    this.stats.totalPoints = achievements.reduce((total, achievement) => total + achievement.points, 0);
    this.stats.earnedPoints = achievements.reduce((total, achievement) => {
      const progress = this.getAchievementProgress(achievement.id);
      return total + (progress?.isCompleted ? achievement.points : 0);
    }, 0);

    // 计算平均稀有度
    const rarityValues = { common: 1, uncommon: 2, rare: 3, epic: 4, legendary: 5, mythic: 6 };
    const totalRarity = achievements.reduce((total, achievement) => {
      return total + (rarityValues[achievement.rarity] || 1);
    }, 0);
    this.stats.averageRarity = totalRarity / achievements.length;

    // 按类型统计
    this.stats.achievementsByType = {} as Record<AchievementType, number>;
    achievements.forEach(achievement => {
      this.stats.achievementsByType[achievement.type] = 
        (this.stats.achievementsByType[achievement.type] || 0) + 1;
    });

    // 按稀有度统计
    this.stats.achievementsByRarity = {} as Record<AchievementRarity, number>;
    achievements.forEach(achievement => {
      this.stats.achievementsByRarity[achievement.rarity] = 
        (this.stats.achievementsByRarity[achievement.rarity] || 0) + 1;
    });

    // 按难度统计
    this.stats.achievementsByDifficulty = {};
    achievements.forEach(achievement => {
      this.stats.achievementsByDifficulty[achievement.difficulty] = 
        (this.stats.achievementsByDifficulty[achievement.difficulty] || 0) + 1;
    });

    // 找到最稀有的成就
    const completedAchievements = achievements.filter(achievement => {
      const progress = this.getAchievementProgress(achievement.id);
      return progress?.isCompleted;
    });

    if (completedAchievements.length > 0) {
      this.stats.rarestAchievement = completedAchievements.reduce((rarest, current) => {
        const rarityValues = { common: 1, uncommon: 2, rare: 3, epic: 4, legendary: 5, mythic: 6 };
        return (rarityValues[current.rarity] || 1) > (rarityValues[rarest.rarity] || 1) ? current : rarest;
      });
    }
  }

  /**
   * 获取统计
   */
  public getStats(): AchievementStats {
    return { ...this.stats };
  }

  /**
   * 事件处理
   */
  private handleEnemyDefeated(data: any): void {
    this.updateProgress('first_blood', 'enemies_defeated', data.count || 1);
    this.updateProgress('combat_master', 'enemies_defeated', data.count || 1);
  }

  private handleAreaDiscovered(data: any): void {
    this.updateProgress('explorer', 'areas_discovered', data.count || 1);
  }

  private handleItemCollected(data: any): void {
    this.updateProgress('collector', 'items_collected', data.count || 1);
  }

  private handleItemCrafted(data: any): void {
    this.updateProgress('craftsman', 'items_crafted', data.count || 1);
  }

  private handleNPCTalked(data: any): void {
    this.updateProgress('social_butterfly', 'npcs_talked', data.count || 1);
  }

  private handleLevelUp(data: any): void {
    this.updateProgress('level_up', 'player_level', data.level || 1);
  }

  private handleQuestCompleted(data: any): void {
    if (data.questType === 'main' && data.completionTime) {
      this.updateProgress('speed_runner', 'main_quest_completion_time', data.completionTime);
    }
  }

  private handleSecretFound(data: any): void {
    this.updateProgress('secret_finder', 'secrets_found', data.count || 1);
  }

  private handleEventParticipated(data: any): void {
    this.updateProgress('event_participant', 'event_participation', data.count || 1);
  }

  private handleSkillMaxed(data: any): void {
    this.updateProgress('skill_master', 'skill_max_level', data.count || 1);
  }

  /**
   * 保存进度
   */
  private saveProgress(): void {
    const progressData = Array.from(this.progress.values());
    storage.set('achievement_progress', progressData);
  }

  /**
   * 加载进度
   */
  private loadProgress(): void {
    const progressData = storage.get('achievement_progress', []);
    progressData.forEach((data: any) => {
      this.progress.set(data.achievementId, data);
    });
  }

  /**
   * 添加事件
   */
  private addEvent(type: AchievementEvent['type'], data?: any): void {
    const event: AchievementEvent = {
      type,
      achievementId: data?.achievement?.id || data?.achievementId || 'unknown',
      data,
      timestamp: Date.now()
    };
    
    this.events.push(event);
    
    if (this.events.length > 1000) {
      this.events.shift();
    }
  }

  /**
   * 注册回调
   */
  public registerCallback(eventType: string, callback: (data: any) => void): void {
    this.callbacks.set(eventType, callback);
  }

  /**
   * 触发回调
   */
  private triggerCallback(eventType: string, data: any): void {
    const callback = this.callbacks.get(eventType);
    if (callback) {
      callback(data);
    }
  }

  /**
   * 获取成就事件
   */
  public getAchievementEvents(): AchievementEvent[] {
    return [...this.events];
  }

  /**
   * 清理资源
   */
  public destroy(): void {
    this.events = [];
    this.callbacks.clear();
    this.achievements.clear();
    this.progress.clear();
    this.series.clear();
    
    this.scene = null;
    console.log('增强成就系统已销毁');
  }
}
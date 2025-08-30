import * as Phaser from 'phaser';

// 成就类型枚举
export enum AchievementType {
  KILL_COUNT = 'kill_count',           // 击杀数量
  QUEST_COMPLETE = 'quest_complete',   // 任务完成
  ITEM_COLLECT = 'item_collect',       // 物品收集
  EXPLORE_AREA = 'explore_area',       // 区域探索
  LEVEL_UP = 'level_up',               // 等级提升
  CRAFT_ITEM = 'craft_item',           // 物品制作
  TIME_PLAYED = 'time_played',         // 游戏时间
  SPECIAL_EVENT = 'special_event'      // 特殊事件
}

// 成就稀有度枚举
export enum AchievementRarity {
  COMMON = 'common',       // 普通
  UNCOMMON = 'uncommon',   // 罕见
  RARE = 'rare',           // 稀有
  EPIC = 'epic',           // 史诗
  LEGENDARY = 'legendary'  // 传说
}

// 成就状态枚举
export enum AchievementStatus {
  LOCKED = 'locked',       // 未解锁
  UNLOCKED = 'unlocked',   // 已解锁
  COMPLETED = 'completed'  // 已完成
}

// 成就奖励接口
export interface AchievementReward {
  type: 'experience' | 'gold' | 'item' | 'title' | 'skill_point' | 'reputation';
  value: number | string;
  description: string;
}

// 成就进度接口
export interface AchievementProgress {
  current: number;
  target: number;
  percentage: number;
  lastUpdate: number;
}

// 成就接口
export interface Achievement {
  id: string;
  name: string;
  description: string;
  type: AchievementType;
  rarity: AchievementRarity;
  status: AchievementStatus;
  progress: AchievementProgress;
  rewards: AchievementReward[];
  icon: string;
  unlockDate?: number;
  completionDate?: number;
  isSecret?: boolean;
  prerequisites?: string[];
  category?: string;
}

// 成就事件接口
export interface AchievementEvent {
  type: string;
  achievement: Achievement;
  data?: any;
  timestamp: number;
}

// 成就统计接口
export interface AchievementStats {
  totalAchievements: number;
  unlockedAchievements: number;
  completionRate: number;
  totalRewards: number;
  rareAchievements: number;
  playTime: number;
  lastUnlockDate?: number;
}

export class AchievementSystem {
  private scene: Phaser.Scene;
  private achievements: Map<string, Achievement>;
  private eventListeners: Map<string, Function[]>;
  private stats: AchievementStats;
  private unlockQueue: Achievement[];
  private notificationQueue: AchievementEvent[];
  private lastUpdateTime: number;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.achievements = new Map();
    this.eventListeners = new Map();
    this.unlockQueue = [];
    this.notificationQueue = [];
    this.lastUpdateTime = 0;

    this.stats = {
      totalAchievements: 0,
      unlockedAchievements: 0,
      completionRate: 0,
      totalRewards: 0,
      rareAchievements: 0,
      playTime: 0
    };

    this.initializeAchievements();
    this.setupEventListeners();
  }

  /**
   * 初始化默认成就
   */
  private initializeAchievements(): void {
    // 击杀成就
    this.addAchievement({
      id: 'first_blood',
      name: '初次击杀',
      description: '击败第一个敌人',
      type: AchievementType.KILL_COUNT,
      rarity: AchievementRarity.COMMON,
      status: AchievementStatus.LOCKED,
      progress: { current: 0, target: 1, percentage: 0, lastUpdate: 0 },
      rewards: [
        { type: 'experience', value: 100, description: '获得100经验值' },
        { type: 'title', value: '新手战士', description: '解锁称号：新手战士' }
      ],
      icon: 'sword-icon',
      category: 'combat'
    });

    this.addAchievement({
      id: 'monster_hunter',
      name: '怪物猎人',
      description: '击败100个敌人',
      type: AchievementType.KILL_COUNT,
      rarity: AchievementRarity.UNCOMMON,
      status: AchievementStatus.LOCKED,
      progress: { current: 0, target: 100, percentage: 0, lastUpdate: 0 },
      rewards: [
        { type: 'experience', value: 1000, description: '获得1000经验值' },
        { type: 'gold', value: 500, description: '获得500金币' },
        { type: 'title', value: '怪物猎人', description: '解锁称号：怪物猎人' }
      ],
      icon: 'monster-icon',
      category: 'combat'
    });

    // 任务成就
    this.addAchievement({
      id: 'quest_starter',
      name: '任务新手',
      description: '完成第一个任务',
      type: AchievementType.QUEST_COMPLETE,
      rarity: AchievementRarity.COMMON,
      status: AchievementStatus.LOCKED,
      progress: { current: 0, target: 1, percentage: 0, lastUpdate: 0 },
      rewards: [
        { type: 'experience', value: 200, description: '获得200经验值' },
        { type: 'reputation', value: 50, description: '获得50声望' }
      ],
      icon: 'quest-icon',
      category: 'quest'
    });

    this.addAchievement({
      id: 'quest_master',
      name: '任务大师',
      description: '完成50个任务',
      type: AchievementType.QUEST_COMPLETE,
      rarity: AchievementRarity.RARE,
      status: AchievementStatus.LOCKED,
      progress: { current: 0, target: 50, percentage: 0, lastUpdate: 0 },
      rewards: [
        { type: 'experience', value: 5000, description: '获得5000经验值' },
        { type: 'gold', value: 2000, description: '获得2000金币' },
        { type: 'title', value: '任务大师', description: '解锁称号：任务大师' }
      ],
      icon: 'master-icon',
      category: 'quest'
    });

    // 收集成就
    this.addAchievement({
      id: 'collector',
      name: '收集者',
      description: '收集100个物品',
      type: AchievementType.ITEM_COLLECT,
      rarity: AchievementRarity.UNCOMMON,
      status: AchievementStatus.LOCKED,
      progress: { current: 0, target: 100, percentage: 0, lastUpdate: 0 },
      rewards: [
        { type: 'experience', value: 800, description: '获得800经验值' },
        { type: 'item', value: 'backpack_upgrade', description: '获得背包升级道具' }
      ],
      icon: 'collect-icon',
      category: 'collection'
    });

    // 探索成就
    this.addAchievement({
      id: 'explorer',
      name: '探索者',
      description: '探索10个不同区域',
      type: AchievementType.EXPLORE_AREA,
      rarity: AchievementRarity.RARE,
      status: AchievementStatus.LOCKED,
      progress: { current: 0, target: 10, percentage: 0, lastUpdate: 0 },
      rewards: [
        { type: 'experience', value: 1500, description: '获得1500经验值' },
        { type: 'title', value: '探索者', description: '解锁称号：探索者' }
      ],
      icon: 'map-icon',
      category: 'exploration'
    });

    // 等级成就
    this.addAchievement({
      id: 'level_10',
      name: '初级冒险者',
      description: '达到10级',
      type: AchievementType.LEVEL_UP,
      rarity: AchievementRarity.COMMON,
      status: AchievementStatus.LOCKED,
      progress: { current: 0, target: 10, percentage: 0, lastUpdate: 0 },
      rewards: [
        { type: 'experience', value: 500, description: '获得500经验值' },
        { type: 'skill_point', value: 5, description: '获得5个技能点' }
      ],
      icon: 'level-icon',
      category: 'progression'
    });

    this.addAchievement({
      id: 'level_50',
      name: '高级冒险者',
      description: '达到50级',
      type: AchievementType.LEVEL_UP,
      rarity: AchievementRarity.EPIC,
      status: AchievementStatus.LOCKED,
      progress: { current: 0, target: 50, percentage: 0, lastUpdate: 0 },
      rewards: [
        { type: 'experience', value: 10000, description: '获得10000经验值' },
        { type: 'skill_point', value: 20, description: '获得20个技能点' },
        { type: 'title', value: '高级冒险者', description: '解锁称号：高级冒险者' }
      ],
      icon: 'level-icon',
      category: 'progression'
    });

    // 制作成就
    this.addAchievement({
      id: 'craftsman',
      name: '工匠',
      description: '制作50个物品',
      type: AchievementType.CRAFT_ITEM,
      rarity: AchievementRarity.UNCOMMON,
      status: AchievementStatus.LOCKED,
      progress: { current: 0, target: 50, percentage: 0, lastUpdate: 0 },
      rewards: [
        { type: 'experience', value: 1200, description: '获得1200经验值' },
        { type: 'title', value: '工匠', description: '解锁称号：工匠' }
      ],
      icon: 'craft-icon',
      category: 'crafting'
    });

    // 时间成就
    this.addAchievement({
      id: 'dedicated_player',
      name: '忠实玩家',
      description: '游戏时间达到10小时',
      type: AchievementType.TIME_PLAYED,
      rarity: AchievementRarity.RARE,
      status: AchievementStatus.LOCKED,
      progress: { current: 0, target: 36000000, percentage: 0, lastUpdate: 0 }, // 10小时 = 36,000,000毫秒
      rewards: [
        { type: 'experience', value: 2000, description: '获得2000经验值' },
        { type: 'title', value: '忠实玩家', description: '解锁称号：忠实玩家' }
      ],
      icon: 'time-icon',
      category: 'time'
    });

    // 特殊成就
    this.addAchievement({
      id: 'legendary_warrior',
      name: '传奇战士',
      description: '同时拥有100级和击败1000个敌人',
      type: AchievementType.SPECIAL_EVENT,
      rarity: AchievementRarity.LEGENDARY,
      status: AchievementStatus.LOCKED,
      progress: { current: 0, target: 1, percentage: 0, lastUpdate: 0 },
      rewards: [
        { type: 'experience', value: 50000, description: '获得50000经验值' },
        { type: 'gold', value: 10000, description: '获得10000金币' },
        { type: 'title', value: '传奇战士', description: '解锁称号：传奇战士' }
      ],
      icon: 'legendary-icon',
      category: 'special',
      isSecret: true
    });

    this.updateStats();
  }

  /**
   * 设置事件监听器
   */
  private setupEventListeners(): void {
    // 监听游戏事件
    this.scene.events.on('enemy_killed', this.handleEnemyKilled, this);
    this.scene.events.on('quest_completed', this.handleQuestCompleted, this);
    this.scene.events.on('item_collected', this.handleItemCollected, this);
    this.scene.events.on('area_explored', this.handleAreaExplored, this);
    this.scene.events.on('level_up', this.handleLevelUp, this);
    this.scene.events.on('item_crafted', this.handleItemCrafted, this);
    this.scene.events.on('game_time_updated', this.handleGameTimeUpdated, this);
  }

  /**
   * 添加成就
   */
  public addAchievement(achievement: Achievement): void {
    this.achievements.set(achievement.id, achievement);
    this.updateStats();
  }

  /**
   * 更新成就进度
   */
  public updateProgress(achievementId: string, progress: number): void {
    const achievement = this.achievements.get(achievementId);
    if (!achievement || achievement.status !== AchievementStatus.LOCKED) {
      return;
    }

    achievement.progress.current = Math.min(progress, achievement.progress.target);
    achievement.progress.percentage = (achievement.progress.current / achievement.progress.target) * 100;
    achievement.progress.lastUpdate = Date.now();

    // 检查是否解锁
    if (achievement.progress.current >= achievement.progress.target) {
      this.unlockAchievement(achievementId);
    }

    this.emitEvent('progress_updated', { achievement });
  }

  /**
   * 解锁成就
   */
  public unlockAchievement(achievementId: string): void {
    const achievement = this.achievements.get(achievementId);
    if (!achievement || achievement.status !== AchievementStatus.LOCKED) {
      return;
    }

    achievement.status = AchievementStatus.UNLOCKED;
    achievement.unlockDate = Date.now();

    // 添加到解锁队列
    this.unlockQueue.push(achievement);

    // 发放奖励
    this.grantRewards(achievement);

    // 更新统计
    this.updateStats();

    // 发出事件
    this.emitEvent('achievement_unlocked', { achievement });

    // 显示通知
    this.showNotification(achievement);
  }

  /**
   * 完成成就
   */
  public completeAchievement(achievementId: string): void {
    const achievement = this.achievements.get(achievementId);
    if (!achievement || achievement.status !== AchievementStatus.UNLOCKED) {
      return;
    }

    achievement.status = AchievementStatus.COMPLETED;
    achievement.completionDate = Date.now();

    this.updateStats();
    this.emitEvent('achievement_completed', { achievement });
  }

  /**
   * 发放成就奖励
   */
  private grantRewards(achievement: Achievement): void {
    achievement.rewards.forEach(reward => {
      switch (reward.type) {
        case 'experience':
          this.scene.events.emit('add_experience', { amount: reward.value as number });
          break;
        case 'gold':
          this.scene.events.emit('add_gold', { amount: reward.value as number });
          break;
        case 'item':
          this.scene.events.emit('add_item', { itemId: reward.value as string });
          break;
        case 'title':
          this.scene.events.emit('unlock_title', { title: reward.value as string });
          break;
        case 'skill_point':
          this.scene.events.emit('add_skill_points', { amount: reward.value as number });
          break;
        case 'reputation':
          this.scene.events.emit('add_reputation', { amount: reward.value as number });
          break;
      }
    });
  }

  /**
   * 显示成就通知
   */
  private showNotification(achievement: Achievement): void {
    const event: AchievementEvent = {
      type: 'achievement_unlocked',
      achievement,
      timestamp: Date.now()
    };

    this.notificationQueue.push(event);
    this.scene.events.emit('show_achievement_notification', event);
  }

  /**
   * 处理敌人击杀事件
   */
  private handleEnemyKilled = (data: any): void => {
    this.updateProgress('first_blood', 1);
    this.updateProgress('monster_hunter', this.getKillCount() + 1);
    this.checkLegendaryWarrior();
  };

  /**
   * 处理任务完成事件
   */
  private handleQuestCompleted = (data: any): void => {
    this.updateProgress('quest_starter', 1);
    this.updateProgress('quest_master', this.getQuestCount() + 1);
  };

  /**
   * 处理物品收集事件
   */
  private handleItemCollected = (data: any): void => {
    this.updateProgress('collector', this.getItemCount() + 1);
  };

  /**
   * 处理区域探索事件
   */
  private handleAreaExplored = (data: any): void => {
    this.updateProgress('explorer', this.getExploredAreas() + 1);
  };

  /**
   * 处理等级提升事件
   */
  private handleLevelUp = (data: any): void => {
    const level = data.level || 1;
    this.updateProgress('level_10', level);
    this.updateProgress('level_50', level);
    this.checkLegendaryWarrior();
  };

  /**
   * 处理物品制作事件
   */
  private handleItemCrafted = (data: any): void => {
    this.updateProgress('craftsman', this.getCraftCount() + 1);
  };

  /**
   * 处理游戏时间更新事件
   */
  private handleGameTimeUpdated = (data: any): void => {
    const playTime = data.playTime || 0;
    this.updateProgress('dedicated_player', playTime);
  };

  /**
   * 检查传奇战士成就
   */
  private checkLegendaryWarrior(): void {
    const level = this.getPlayerLevel();
    const killCount = this.getKillCount();
    
    if (level >= 100 && killCount >= 1000) {
      this.updateProgress('legendary_warrior', 1);
    }
  }

  /**
   * 获取击杀数量
   */
  private getKillCount(): number {
    // 这里应该从游戏数据中获取实际的击杀数量
    return 0;
  }

  /**
   * 获取任务完成数量
   */
  private getQuestCount(): number {
    // 这里应该从游戏数据中获取实际的任务完成数量
    return 0;
  }

  /**
   * 获取物品收集数量
   */
  private getItemCount(): number {
    // 这里应该从游戏数据中获取实际的物品收集数量
    return 0;
  }

  /**
   * 获取探索区域数量
   */
  private getExploredAreas(): number {
    // 这里应该从游戏数据中获取实际的探索区域数量
    return 0;
  }

  /**
   * 获取玩家等级
   */
  private getPlayerLevel(): number {
    // 这里应该从游戏数据中获取实际的玩家等级
    return 1;
  }

  /**
   * 获取制作数量
   */
  private getCraftCount(): number {
    // 这里应该从游戏数据中获取实际的制作数量
    return 0;
  }

  /**
   * 更新统计信息
   */
  private updateStats(): void {
    const achievements = Array.from(this.achievements.values());
    
    this.stats.totalAchievements = achievements.length;
    this.stats.unlockedAchievements = achievements.filter(a => 
      a.status === AchievementStatus.UNLOCKED || a.status === AchievementStatus.COMPLETED
    ).length;
    this.stats.completionRate = (this.stats.unlockedAchievements / this.stats.totalAchievements) * 100;
    this.stats.rareAchievements = achievements.filter(a => 
      a.rarity === AchievementRarity.RARE || a.rarity === AchievementRarity.EPIC || a.rarity === AchievementRarity.LEGENDARY
    ).length;
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
   * 获取已解锁的成就
   */
  public getUnlockedAchievements(): Achievement[] {
    return Array.from(this.achievements.values()).filter(a => 
      a.status === AchievementStatus.UNLOCKED || a.status === AchievementStatus.COMPLETED
    );
  }

  /**
   * 获取成就统计
   */
  public getStats(): AchievementStats {
    return { ...this.stats };
  }

  /**
   * 获取稀有度颜色
   */
  public getRarityColor(rarity: AchievementRarity): string {
    switch (rarity) {
      case AchievementRarity.COMMON: return '#9d9d9d';
      case AchievementRarity.UNCOMMON: return '#1eff00';
      case AchievementRarity.RARE: return '#0070dd';
      case AchievementRarity.EPIC: return '#a335ee';
      case AchievementRarity.LEGENDARY: return '#ff8000';
      default: return '#ffffff';
    }
  }

  /**
   * 获取稀有度名称
   */
  public getRarityName(rarity: AchievementRarity): string {
    switch (rarity) {
      case AchievementRarity.COMMON: return '普通';
      case AchievementRarity.UNCOMMON: return '罕见';
      case AchievementRarity.RARE: return '稀有';
      case AchievementRarity.EPIC: return '史诗';
      case AchievementRarity.LEGENDARY: return '传说';
      default: return '未知';
    }
  }

  /**
   * 分享成就
   */
  public shareAchievement(achievementId: string): string {
    const achievement = this.achievements.get(achievementId);
    if (!achievement) {
      return '';
    }

    const shareText = `我在游戏中解锁了成就"${achievement.name}"！`;
    const shareUrl = `https://yourgame.com/achievement/${achievementId}`;
    
    return `${shareText} ${shareUrl}`;
  }

  /**
   * 导出成就数据
   */
  public exportData(): any {
    return {
      achievements: Array.from(this.achievements.values()),
      stats: this.stats,
      unlockQueue: this.unlockQueue,
      lastUpdateTime: this.lastUpdateTime
    };
  }

  /**
   * 导入成就数据
   */
  public importData(data: any): void {
    if (data.achievements) {
      data.achievements.forEach((achievement: Achievement) => {
        this.achievements.set(achievement.id, achievement);
      });
    }
    
    if (data.stats) {
      this.stats = { ...data.stats };
    }
    
    if (data.unlockQueue) {
      this.unlockQueue = [...data.unlockQueue];
    }
    
    if (data.lastUpdateTime) {
      this.lastUpdateTime = data.lastUpdateTime;
    }
  }

  /**
   * 注册事件监听器
   */
  public on(event: string, callback: (event: AchievementEvent) => void): void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, []);
    }
    this.eventListeners.get(event)!.push(callback);
  }

  /**
   * 移除事件监听器
   */
  public off(event: string, callback: (event: AchievementEvent) => void): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      const index = listeners.indexOf(callback);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    }
  }

  /**
   * 发出事件
   */
  private emitEvent(type: string, data: Partial<AchievementEvent>): void {
    const event: AchievementEvent = {
      type,
      achievement: data.achievement!,
      data: data.data,
      timestamp: Date.now()
    };

    const listeners = this.eventListeners.get(type);
    if (listeners) {
      listeners.forEach(callback => callback(event));
    }
  }

  /**
   * 更新系统
   */
  public update(time: number, delta: number): void {
    this.lastUpdateTime = time;

    // 处理解锁队列
    if (this.unlockQueue.length > 0) {
      const achievement = this.unlockQueue.shift();
      if (achievement) {
        // 这里可以添加解锁动画或音效
        this.scene.events.emit('achievement_unlocked_effect', { achievement });
      }
    }

    // 处理通知队列
    if (this.notificationQueue.length > 0) {
      const notification = this.notificationQueue.shift();
      if (notification) {
        // 这里可以添加通知显示逻辑
        this.scene.events.emit('show_achievement_notification', notification);
      }
    }
  }

  /**
   * 销毁系统
   */
  public destroy(): void {
    // 移除事件监听器
    this.scene.events.off('enemy_killed', this.handleEnemyKilled, this);
    this.scene.events.off('quest_completed', this.handleQuestCompleted, this);
    this.scene.events.off('item_collected', this.handleItemCollected, this);
    this.scene.events.off('area_explored', this.handleAreaExplored, this);
    this.scene.events.off('level_up', this.handleLevelUp, this);
    this.scene.events.off('item_crafted', this.handleItemCrafted, this);
    this.scene.events.off('game_time_updated', this.handleGameTimeUpdated, this);

    // 清理数据
    this.achievements.clear();
    this.eventListeners.clear();
    this.unlockQueue = [];
    this.notificationQueue = [];
  }
}
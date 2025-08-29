export interface GameStats {
  // 基础统计
  playTime: number; // 游戏时长（秒）
  startTime: number; // 开始时间戳
  
  // 战斗统计
  enemiesDefeated: number; // 击败敌人数量
  totalDamageDealt: number; // 造成的总伤害
  totalDamageTaken: number; // 受到的总伤害
  
  // 收集统计
  itemsCollected: number; // 收集物品数量
  coinsCollected: number; // 收集金币数量
  heartsCollected: number; // 收集心形数量
  
  // 探索统计
  mapsVisited: string[]; // 访问过的地图
  teleportsUsed: number; // 使用传送点次数
  
  // 任务统计
  questsCompleted: number; // 完成任务数量
  questsFailed: number; // 失败任务数量
  
  // 制作统计
  itemsCrafted: number; // 制作物品数量
  craftingAttempts: number; // 制作尝试次数
  
  // 商店统计
  itemsBought: number; // 购买物品数量
  itemsSold: number; // 出售物品数量
  totalSpent: number; // 总花费
  totalEarned: number; // 总收入
  
  // 成就统计
  achievements: string[]; // 获得的成就
  milestones: string[]; // 达到的里程碑
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  condition: (stats: GameStats) => boolean;
  reward?: {
    type: 'experience' | 'item' | 'ability';
    value: any;
  };
}

export class GameStatsManager {
  private static instance: GameStatsManager;
  private stats: GameStats;
  private achievements: Map<string, Achievement> = new Map();
  private onStatsChangeCallback?: (stats: GameStats) => void;
  private onAchievementUnlockedCallback?: (achievement: Achievement) => void;

  private constructor() {
    this.stats = this.getDefaultStats();
    this.initializeAchievements();
    this.loadStats();
  }

  public static getInstance(): GameStatsManager {
    if (!GameStatsManager.instance) {
      GameStatsManager.instance = new GameStatsManager();
    }
    return GameStatsManager.instance;
  }

  private getDefaultStats(): GameStats {
    return {
      playTime: 0,
      startTime: Date.now(),
      enemiesDefeated: 0,
      totalDamageDealt: 0,
      totalDamageTaken: 0,
      itemsCollected: 0,
      coinsCollected: 0,
      heartsCollected: 0,
      mapsVisited: [],
      teleportsUsed: 0,
      questsCompleted: 0,
      questsFailed: 0,
      itemsCrafted: 0,
      craftingAttempts: 0,
      itemsBought: 0,
      itemsSold: 0,
      totalSpent: 0,
      totalEarned: 0,
      achievements: [],
      milestones: []
    };
  }

  private initializeAchievements(): void {
    // 战斗成就
    this.addAchievement({
      id: 'first_blood',
      name: '初次战斗',
      description: '击败第一个敌人',
      condition: (stats) => stats.enemiesDefeated >= 1
    });

    this.addAchievement({
      id: 'warrior',
      name: '战士',
      description: '击败10个敌人',
      condition: (stats) => stats.enemiesDefeated >= 10
    });

    this.addAchievement({
      id: 'veteran',
      name: '老兵',
      description: '击败50个敌人',
      condition: (stats) => stats.enemiesDefeated >= 50
    });

    // 收集成就
    this.addAchievement({
      id: 'collector',
      name: '收集者',
      description: '收集10个物品',
      condition: (stats) => stats.itemsCollected >= 10
    });

    this.addAchievement({
      id: 'treasure_hunter',
      name: '宝藏猎人',
      description: '收集100个金币',
      condition: (stats) => stats.coinsCollected >= 100
    });

    // 探索成就
    this.addAchievement({
      id: 'explorer',
      name: '探索者',
      description: '访问3个不同的地图',
      condition: (stats) => stats.mapsVisited.length >= 3
    });

    this.addAchievement({
      id: 'adventurer',
      name: '冒险家',
      description: '访问所有地图',
      condition: (stats) => stats.mapsVisited.length >= 5
    });

    // 任务成就
    this.addAchievement({
      id: 'quest_master',
      name: '任务大师',
      description: '完成10个任务',
      condition: (stats) => stats.questsCompleted >= 10
    });

    // 制作成就
    this.addAchievement({
      id: 'craftsman',
      name: '工匠',
      description: '制作5个物品',
      condition: (stats) => stats.itemsCrafted >= 5
    });

    // 商店成就
    this.addAchievement({
      id: 'merchant',
      name: '商人',
      description: '进行10次交易',
      condition: (stats) => (stats.itemsBought + stats.itemsSold) >= 10
    });

    // 时间成就
    this.addAchievement({
      id: 'dedicated_player',
      name: '忠实玩家',
      description: '游戏时长超过1小时',
      condition: (stats) => stats.playTime >= 3600
    });
  }

  private addAchievement(achievement: Achievement): void {
    this.achievements.set(achievement.id, achievement);
  }

  // 统计更新方法
  public startGame(): void {
    this.stats.startTime = Date.now();
    this.saveStats();
  }

  public updatePlayTime(): void {
    if (this.stats.startTime > 0) {
      this.stats.playTime = Math.floor((Date.now() - this.stats.startTime) / 1000);
    }
  }

  public enemyDefeated(damage: number = 0): void {
    this.stats.enemiesDefeated++;
    if (damage > 0) {
      this.stats.totalDamageDealt += damage;
    }
    this.checkAchievements();
    this.saveStats();
  }

  public damageTaken(damage: number): void {
    this.stats.totalDamageTaken += damage;
    this.saveStats();
  }

  public itemCollected(itemType: string): void {
    this.stats.itemsCollected++;
    if (itemType === 'coin') {
      this.stats.coinsCollected++;
    } else if (itemType === 'heart') {
      this.stats.heartsCollected++;
    }
    this.checkAchievements();
    this.saveStats();
  }

  public mapVisited(mapKey: string): void {
    if (!this.stats.mapsVisited.includes(mapKey)) {
      this.stats.mapsVisited.push(mapKey);
      this.checkAchievements();
      this.saveStats();
    }
  }

  public teleportUsed(): void {
    this.stats.teleportsUsed++;
    this.saveStats();
  }

  public questCompleted(): void {
    this.stats.questsCompleted++;
    this.checkAchievements();
    this.saveStats();
  }

  public questFailed(): void {
    this.stats.questsFailed++;
    this.saveStats();
  }

  public itemCrafted(success: boolean): void {
    this.stats.craftingAttempts++;
    if (success) {
      this.stats.itemsCrafted++;
    }
    this.checkAchievements();
    this.saveStats();
  }

  public itemBought(cost: number): void {
    this.stats.itemsBought++;
    this.stats.totalSpent += cost;
    this.checkAchievements();
    this.saveStats();
  }

  public itemSold(earnings: number): void {
    this.stats.itemsSold++;
    this.stats.totalEarned += earnings;
    this.checkAchievements();
    this.saveStats();
  }

  // 成就检查
  private checkAchievements(): void {
    this.achievements.forEach((achievement, id) => {
      if (!this.stats.achievements.includes(id) && achievement.condition(this.stats)) {
        this.unlockAchievement(id);
      }
    });
  }

  private unlockAchievement(achievementId: string): void {
    const achievement = this.achievements.get(achievementId);
    if (achievement) {
      this.stats.achievements.push(achievementId);
      
      // 触发成就解锁事件
      if (this.onAchievementUnlockedCallback) {
        this.onAchievementUnlockedCallback(achievement);
      }

      // 触发UI更新事件
      const customEvent = new CustomEvent('achievement-unlocked', {
        detail: { achievement }
      });
      window.dispatchEvent(customEvent);

      console.log(`成就解锁: ${achievement.name} - ${achievement.description}`);
    }
  }

  // 数据持久化
  private saveStats(): void {
    try {
      localStorage.setItem('game_stats', JSON.stringify(this.stats));
      if (this.onStatsChangeCallback) {
        this.onStatsChangeCallback(this.stats);
      }
    } catch (error) {
      console.error('保存游戏统计失败:', error);
    }
  }

  private loadStats(): void {
    try {
      const savedStats = localStorage.getItem('game_stats');
      if (savedStats) {
        const parsedStats = JSON.parse(savedStats);
        this.stats = { ...this.getDefaultStats(), ...parsedStats };
      }
    } catch (error) {
      console.error('加载游戏统计失败:', error);
    }
  }

  // 公共方法
  public getStats(): GameStats {
    return { ...this.stats };
  }

  public getAchievements(): Achievement[] {
    return Array.from(this.achievements.values());
  }

  public getUnlockedAchievements(): Achievement[] {
    return this.stats.achievements
      .map(id => this.achievements.get(id))
      .filter(achievement => achievement !== undefined) as Achievement[];
  }

  public getProgress(achievementId: string): { current: number; target: number; percentage: number } {
    const achievement = this.achievements.get(achievementId);
    if (!achievement) {
      return { current: 0, target: 0, percentage: 0 };
    }

    // 根据成就类型计算进度
    let current = 0;
    let target = 1;

    switch (achievementId) {
      case 'first_blood':
      case 'warrior':
      case 'veteran':
        current = this.stats.enemiesDefeated;
        target = achievementId === 'first_blood' ? 1 : achievementId === 'warrior' ? 10 : 50;
        break;
      case 'collector':
        current = this.stats.itemsCollected;
        target = 10;
        break;
      case 'treasure_hunter':
        current = this.stats.coinsCollected;
        target = 100;
        break;
      case 'explorer':
      case 'adventurer':
        current = this.stats.mapsVisited.length;
        target = achievementId === 'explorer' ? 3 : 5;
        break;
      case 'quest_master':
        current = this.stats.questsCompleted;
        target = 10;
        break;
      case 'craftsman':
        current = this.stats.itemsCrafted;
        target = 5;
        break;
      case 'merchant':
        current = this.stats.itemsBought + this.stats.itemsSold;
        target = 10;
        break;
      case 'dedicated_player':
        current = this.stats.playTime;
        target = 3600;
        break;
    }

    return {
      current: Math.min(current, target),
      target,
      percentage: Math.min((current / target) * 100, 100)
    };
  }

  public resetStats(): void {
    this.stats = this.getDefaultStats();
    this.saveStats();
  }

  // 回调设置
  public setOnStatsChange(callback: (stats: GameStats) => void): void {
    this.onStatsChangeCallback = callback;
  }

  public setOnAchievementUnlocked(callback: (achievement: Achievement) => void): void {
    this.onAchievementUnlockedCallback = callback;
  }

  // 导出统计报告
  public generateReport(): string {
    const playTimeMinutes = Math.floor(this.stats.playTime / 60);
    const playTimeSeconds = this.stats.playTime % 60;

    return `
游戏统计报告
==============

游戏时长: ${playTimeMinutes}分${playTimeSeconds}秒
击败敌人: ${this.stats.enemiesDefeated}个
造成伤害: ${this.stats.totalDamageDealt}点
受到伤害: ${this.stats.totalDamageTaken}点

收集物品: ${this.stats.itemsCollected}个
收集金币: ${this.stats.coinsCollected}个
收集心形: ${this.stats.heartsCollected}个

访问地图: ${this.stats.mapsVisited.length}个
使用传送: ${this.stats.teleportsUsed}次

完成任务: ${this.stats.questsCompleted}个
失败任务: ${this.stats.questsFailed}个

制作物品: ${this.stats.itemsCrafted}个
制作尝试: ${this.stats.craftingAttempts}次

购买物品: ${this.stats.itemsBought}个
出售物品: ${this.stats.itemsSold}个
总花费: ${this.stats.totalSpent}金币
总收入: ${this.stats.totalEarned}金币

获得成就: ${this.stats.achievements.length}个
    `.trim();
  }
}
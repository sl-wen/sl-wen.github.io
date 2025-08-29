/**
 * 传送点系统
 * 负责管理游戏中的传送点、传送网络和传送效果
 */

import { storage } from '../utils';

// 传送点类型
export type TeleportType = 'normal' | 'fast_travel' | 'dungeon' | 'secret' | 'quest' | 'boss' | 'home' | 'shop' | 'crafting' | 'social';

// 传送点状态
export type TeleportStatus = 'locked' | 'unlocked' | 'discovered' | 'hidden' | 'broken' | 'maintenance';

// 传送条件
export interface TeleportCondition {
  type: 'level' | 'item' | 'quest' | 'reputation' | 'currency' | 'time' | 'weather' | 'party_size' | 'custom';
  value: any;
  operator: 'eq' | 'gt' | 'lt' | 'gte' | 'lte' | 'ne' | 'in' | 'not_in';
  description: string;
}

// 传送效果
export interface TeleportEffect {
  type: 'screen_fade' | 'particle_effect' | 'sound_effect' | 'camera_shake' | 'time_warp' | 'weather_change' | 'custom';
  duration: number;
  data?: any;
}

// 传送点数据
export interface TeleportPoint {
  id: string;
  name: string;
  description: string;
  type: TeleportType;
  status: TeleportStatus;
  
  // 位置信息
  sourceMap: string;
  sourceX: number;
  sourceY: number;
  targetMap: string;
  targetX: number;
  targetY: number;
  
  // 传送设置
  conditions: TeleportCondition[];
  effects: TeleportEffect[];
  cooldown: number;
  cost: number;
  currency: string;
  
  // 显示设置
  icon: string;
  color: string;
  visible: boolean;
  interactive: boolean;
  
  // 网络设置
  networkId?: string;
  networkName?: string;
  
  // 元数据
  tags: string[];
  metadata: Record<string, any>;
  
  // 统计信息
  usageCount: number;
  lastUsed: number;
  discoveredBy: string[];
}

// 传送网络
export interface TeleportNetwork {
  id: string;
  name: string;
  description: string;
  type: TeleportType;
  points: string[]; // 传送点ID列表
  unlocked: boolean;
  cost: number;
  currency: string;
  conditions: TeleportCondition[];
}

// 传送历史
export interface TeleportHistory {
  id: string;
  fromPoint: string;
  toPoint: string;
  fromMap: string;
  toMap: string;
  timestamp: number;
  cost: number;
  duration: number;
  playerLevel: number;
}

// 传送统计
export interface TeleportStats {
  totalTeleports: number;
  totalDistance: number;
  favoriteDestinations: string[];
  mostUsedNetworks: string[];
  totalCost: number;
  averageCooldown: number;
}

// 传送事件
export interface TeleportEvent {
  type: 'teleport_start' | 'teleport_complete' | 'teleport_failed' | 'point_discovered' | 'network_unlocked' | 'condition_met' | 'cooldown_expired';
  pointId: string;
  data?: any;
  timestamp: number;
}

export class TeleportSystem {
  private static instance: TeleportSystem;
  private scene: Phaser.Scene | null = null;
  
  // 数据存储
  private teleportPoints: Map<string, TeleportPoint> = new Map();
  private teleportNetworks: Map<string, TeleportNetwork> = new Map();
  private teleportHistory: TeleportHistory[] = [];
  private events: TeleportEvent[] = [];
  private callbacks: Map<string, (data: any) => void> = new Map();
  
  // 状态管理
  private isTeleporting: boolean = false;
  private currentTeleport: { pointId: string; startTime: number } | null = null;
  private cooldowns: Map<string, number> = new Map();
  private discoveredPoints: Set<string> = new Set();
  private unlockedNetworks: Set<string> = new Set();
  
  // 配置
  private config = {
    defaultCooldown: 5000,
    defaultCost: 0,
    defaultCurrency: 'gold',
    maxHistorySize: 100,
    maxEventsSize: 50,
    enableEffects: true,
    enableConditions: true,
    enableNetworks: true,
    enableHistory: true
  };
  
  // 统计信息
  private stats: TeleportStats = {
    totalTeleports: 0,
    totalDistance: 0,
    favoriteDestinations: [],
    mostUsedNetworks: [],
    totalCost: 0,
    averageCooldown: 0
  };

  private constructor() {
    this.loadData();
    this.initializeDefaultPoints();
    this.initializeDefaultNetworks();
  }

  public static getInstance(): TeleportSystem {
    if (!TeleportSystem.instance) {
      TeleportSystem.instance = new TeleportSystem();
    }
    return TeleportSystem.instance;
  }

  /**
   * 初始化传送系统
   */
  public initialize(scene: Phaser.Scene): void {
    this.scene = scene;
    this.setupEventHandlers();
    console.log('传送系统已初始化');
  }

  /**
   * 设置事件处理器
   */
  private setupEventHandlers(): void {
    if (!this.scene) return;

    // 监听玩家移动事件
    this.scene.events.on('player-moved', (position: { x: number; y: number }) => {
      this.checkTeleportPoints(position);
    });

    // 监听地图切换事件
    this.scene.events.on('map-changed', (data: { fromMap: string; toMap: string }) => {
      this.onMapChanged(data.fromMap, data.toMap);
    });
  }

  /**
   * 添加传送点
   */
  public addTeleportPoint(point: TeleportPoint): void {
    this.teleportPoints.set(point.id, point);
    this.addEvent('point_discovered', point.id, { point });
    console.log(`添加传送点: ${point.name}`);
  }

  /**
   * 获取传送点
   */
  public getTeleportPoint(pointId: string): TeleportPoint | undefined {
    return this.teleportPoints.get(pointId);
  }

  /**
   * 获取所有传送点
   */
  public getAllTeleportPoints(): TeleportPoint[] {
    return Array.from(this.teleportPoints.values());
  }

  /**
   * 获取地图上的传送点
   */
  public getTeleportPointsInMap(mapKey: string): TeleportPoint[] {
    return Array.from(this.teleportPoints.values()).filter(
      point => point.sourceMap === mapKey && point.visible
    );
  }

  /**
   * 检查位置是否有传送点
   */
  public getTeleportPointAt(x: number, y: number, mapKey: string): TeleportPoint | null {
    const points = this.getTeleportPointsInMap(mapKey);
    return points.find(point => point.sourceX === x && point.sourceY === y) || null;
  }

  /**
   * 执行传送
   */
  public async teleport(pointId: string, playerData?: any): Promise<boolean> {
    if (this.isTeleporting) {
      console.log('传送进行中，请稍候...');
      return false;
    }

    const point = this.teleportPoints.get(pointId);
    if (!point) {
      console.error(`传送点不存在: ${pointId}`);
      return false;
    }

    // 检查状态
    if (point.status === 'locked' || point.status === 'broken') {
      console.log(`传送点 ${point.name} 不可用`);
      return false;
    }

    // 检查冷却时间
    if (this.isOnCooldown(pointId)) {
      const remainingTime = this.getCooldownRemaining(pointId);
      console.log(`传送点冷却中，剩余时间: ${remainingTime}ms`);
      return false;
    }

    // 检查条件
    if (!this.checkConditions(point.conditions, playerData)) {
      console.log(`传送条件不满足: ${point.name}`);
      return false;
    }

    // 检查费用
    if (point.cost > 0) {
      if (!this.checkCost(point, playerData)) {
        console.log(`传送费用不足: ${point.cost} ${point.currency}`);
        return false;
      }
    }

    // 开始传送
    this.isTeleporting = true;
    this.currentTeleport = { pointId, startTime: Date.now() };
    
    this.addEvent('teleport_start', pointId, { point, playerData });

    try {
      // 播放传送效果
      if (this.config.enableEffects) {
        await this.playTeleportEffects(point.effects);
      }

      // 执行传送
      const success = await this.executeTeleport(point, playerData);

      if (success) {
        // 更新统计
        this.updateStats(point);
        
        // 设置冷却时间
        this.setCooldown(pointId, point.cooldown);
        
        // 记录历史
        if (this.config.enableHistory) {
          this.addToHistory(point, playerData);
        }

        this.addEvent('teleport_complete', pointId, { point, playerData });
        console.log(`传送成功: ${point.name}`);
      } else {
        this.addEvent('teleport_failed', pointId, { point, playerData });
        console.error(`传送失败: ${point.name}`);
      }

      return success;
    } catch (error) {
      console.error('传送过程中发生错误:', error);
      this.addEvent('teleport_failed', pointId, { point, playerData, error });
      return false;
    } finally {
      this.isTeleporting = false;
      this.currentTeleport = null;
    }
  }

  /**
   * 执行传送逻辑
   */
  private async executeTeleport(point: TeleportPoint, playerData?: any): Promise<boolean> {
    if (!this.scene) return false;

    try {
      // 扣除费用
      if (point.cost > 0) {
        this.deductCost(point, playerData);
      }

      // 切换地图
      this.scene.events.emit('change-map', {
        mapKey: point.targetMap,
        x: point.targetX,
        y: point.targetY,
        teleportPoint: point
      });

      // 播放传送音效
      this.scene.events.emit('play-sound', 'teleport');

      return true;
    } catch (error) {
      console.error('执行传送时发生错误:', error);
      return false;
    }
  }

  /**
   * 播放传送效果
   */
  private async playTeleportEffects(effects: TeleportEffect[]): Promise<void> {
    if (!this.scene) return;

    const promises = effects.map(effect => {
      return new Promise<void>((resolve) => {
        switch (effect.type) {
          case 'screen_fade':
            this.playScreenFade(effect);
            break;
          case 'particle_effect':
            this.playParticleEffect(effect);
            break;
          case 'sound_effect':
            this.playSoundEffect(effect);
            break;
          case 'camera_shake':
            this.playCameraShake(effect);
            break;
          case 'time_warp':
            this.playTimeWarp(effect);
            break;
          case 'weather_change':
            this.playWeatherChange(effect);
            break;
        }
        
        setTimeout(resolve, effect.duration);
      });
    });

    await Promise.all(promises);
  }

  /**
   * 屏幕淡入淡出效果
   */
  private playScreenFade(effect: TeleportEffect): void {
    if (!this.scene) return;

    const graphics = this.scene.add.graphics();
    graphics.fillStyle(0x000000, 0);
    graphics.fillRect(0, 0, this.scene.cameras.main.width, this.scene.cameras.main.height);

    this.scene.tweens.add({
      targets: graphics,
      alpha: 1,
      duration: effect.duration / 2,
      yoyo: true,
      ease: 'Power2',
      onComplete: () => {
        graphics.destroy();
      }
    });
  }

  /**
   * 粒子效果
   */
  private playParticleEffect(effect: TeleportEffect): void {
    if (!this.scene) return;

    // 暂时注释掉粒子效果，因为Phaser API不兼容
    // const particles = this.scene.add.particles('particle');
    // const emitter = particles.createEmitter({
    //   speed: 100,
    //   scale: { start: 0.5, end: 0 },
    //   alpha: { start: 1, end: 0 },
    //   lifespan: 1000,
    //   frequency: 50
    // });

    // setTimeout(() => {
    //   emitter.stop();
    //   setTimeout(() => particles.destroy(), 1000);
    // }, effect.duration);
  }

  /**
   * 音效
   */
  private playSoundEffect(effect: TeleportEffect): void {
    if (!this.scene) return;

    this.scene.events.emit('play-sound', 'teleport_effect');
  }

  /**
   * 相机震动
   */
  private playCameraShake(effect: TeleportEffect): void {
    if (!this.scene) return;

    this.scene.cameras.main.shake(effect.duration, 0.01);
  }

  /**
   * 时间扭曲效果
   */
  private playTimeWarp(effect: TeleportEffect): void {
    if (!this.scene) return;

    this.scene.tweens.add({
      targets: this.scene,
      timeScale: 0.5,
      duration: effect.duration / 2,
      yoyo: true,
      ease: 'Power2'
    });
  }

  /**
   * 天气变化
   */
  private playWeatherChange(effect: TeleportEffect): void {
    if (!this.scene) return;

    this.scene.events.emit('change-weather', effect.data);
  }

  /**
   * 检查传送条件
   */
  private checkConditions(conditions: TeleportCondition[], playerData?: any): boolean {
    if (!this.config.enableConditions) return true;
    if (!conditions || conditions.length === 0) return true;

    return conditions.every(condition => {
      const playerValue = this.getPlayerValue(condition.type, playerData);
      return this.evaluateCondition(condition, playerValue);
    });
  }

  /**
   * 获取玩家值
   */
  private getPlayerValue(type: string, playerData?: any): any {
    if (!playerData) return null;

    switch (type) {
      case 'level':
        return playerData.level || 1;
      case 'item':
        return playerData.inventory || [];
      case 'quest':
        return playerData.quests || [];
      case 'reputation':
        return playerData.reputation || {};
      case 'currency':
        return playerData.currency || {};
      case 'time':
        return Date.now();
      case 'weather':
        return playerData.weather || 'clear';
      case 'party_size':
        return playerData.partySize || 1;
      default:
        return playerData[type];
    }
  }

  /**
   * 评估条件
   */
  private evaluateCondition(condition: TeleportCondition, playerValue: any): boolean {
    switch (condition.operator) {
      case 'eq':
        return playerValue === condition.value;
      case 'gt':
        return playerValue > condition.value;
      case 'lt':
        return playerValue < condition.value;
      case 'gte':
        return playerValue >= condition.value;
      case 'lte':
        return playerValue <= condition.value;
      case 'ne':
        return playerValue !== condition.value;
      case 'in':
        return Array.isArray(condition.value) && condition.value.includes(playerValue);
      case 'not_in':
        return Array.isArray(condition.value) && !condition.value.includes(playerValue);
      default:
        return false;
    }
  }

  /**
   * 检查费用
   */
  private checkCost(point: TeleportPoint, playerData?: any): boolean {
    if (!playerData || !playerData.currency) return false;
    
    const playerCurrency = playerData.currency[point.currency] || 0;
    return playerCurrency >= point.cost;
  }

  /**
   * 扣除费用
   */
  private deductCost(point: TeleportPoint, playerData?: any): void {
    if (!playerData || !playerData.currency) return;
    
    if (playerData.currency[point.currency]) {
      playerData.currency[point.currency] -= point.cost;
    }
  }

  /**
   * 检查冷却时间
   */
  private isOnCooldown(pointId: string): boolean {
    const cooldownEnd = this.cooldowns.get(pointId);
    if (!cooldownEnd) return false;
    
    return Date.now() < cooldownEnd;
  }

  /**
   * 获取剩余冷却时间
   */
  private getCooldownRemaining(pointId: string): number {
    const cooldownEnd = this.cooldowns.get(pointId);
    if (!cooldownEnd) return 0;
    
    const remaining = cooldownEnd - Date.now();
    return Math.max(0, remaining);
  }

  /**
   * 设置冷却时间
   */
  private setCooldown(pointId: string, cooldown: number): void {
    const cooldownEnd = Date.now() + cooldown;
    this.cooldowns.set(pointId, cooldownEnd);
  }

  /**
   * 添加传送历史
   */
  private addToHistory(point: TeleportPoint, playerData?: any): void {
    const history: TeleportHistory = {
      id: `teleport_${Date.now()}`,
      fromPoint: point.id,
      toPoint: point.id,
      fromMap: point.sourceMap,
      toMap: point.targetMap,
      timestamp: Date.now(),
      cost: point.cost,
      duration: this.currentTeleport ? Date.now() - this.currentTeleport.startTime : 0,
      playerLevel: playerData?.level || 1
    };

    this.teleportHistory.push(history);
    
    // 限制历史记录大小
    if (this.teleportHistory.length > this.config.maxHistorySize) {
      this.teleportHistory.shift();
    }
  }

  /**
   * 更新统计信息
   */
  private updateStats(point: TeleportPoint): void {
    this.stats.totalTeleports++;
    this.stats.totalCost += point.cost;
    
    // 更新使用次数
    point.usageCount++;
    point.lastUsed = Date.now();
    
    // 更新最常用目的地
    this.updateFavoriteDestinations(point.targetMap);
    
    // 更新最常用网络
    if (point.networkId) {
      this.updateMostUsedNetworks(point.networkId);
    }
  }

  /**
   * 更新最常用目的地
   */
  private updateFavoriteDestinations(mapKey: string): void {
    const index = this.stats.favoriteDestinations.indexOf(mapKey);
    if (index > -1) {
      this.stats.favoriteDestinations.splice(index, 1);
    }
    this.stats.favoriteDestinations.unshift(mapKey);
    
    // 保持前10个
    this.stats.favoriteDestinations = this.stats.favoriteDestinations.slice(0, 10);
  }

  /**
   * 更新最常用网络
   */
  private updateMostUsedNetworks(networkId: string): void {
    const index = this.stats.mostUsedNetworks.indexOf(networkId);
    if (index > -1) {
      this.stats.mostUsedNetworks.splice(index, 1);
    }
    this.stats.mostUsedNetworks.unshift(networkId);
    
    // 保持前5个
    this.stats.mostUsedNetworks = this.stats.mostUsedNetworks.slice(0, 5);
  }

  /**
   * 检查传送点
   */
  private checkTeleportPoints(position: { x: number; y: number }): void {
    if (!this.scene) return;

    // 这里需要从场景获取当前地图
    const currentMap = 'current_map'; // 需要从场景获取
    const point = this.getTeleportPointAt(position.x, position.y, currentMap);
    
    if (point && point.interactive) {
      this.scene.events.emit('teleport-point-detected', point);
    }
  }

  /**
   * 地图切换处理
   */
  private onMapChanged(fromMap: string, toMap: string): void {
    // 更新发现的传送点
    const pointsInNewMap = this.getTeleportPointsInMap(toMap);
    pointsInNewMap.forEach(point => {
      if (!this.discoveredPoints.has(point.id)) {
        this.discoveredPoints.add(point.id);
        this.addEvent('point_discovered', point.id, { point });
      }
    });
  }

  /**
   * 添加传送网络
   */
  public addTeleportNetwork(network: TeleportNetwork): void {
    this.teleportNetworks.set(network.id, network);
    console.log(`添加传送网络: ${network.name}`);
  }

  /**
   * 解锁传送网络
   */
  public unlockNetwork(networkId: string): void {
    const network = this.teleportNetworks.get(networkId);
    if (!network) return;

    network.unlocked = true;
    this.unlockedNetworks.add(networkId);
    this.addEvent('network_unlocked', networkId, { network });
    console.log(`解锁传送网络: ${network.name}`);
  }

  /**
   * 获取传送网络
   */
  public getTeleportNetwork(networkId: string): TeleportNetwork | undefined {
    return this.teleportNetworks.get(networkId);
  }

  /**
   * 获取所有传送网络
   */
  public getAllTeleportNetworks(): TeleportNetwork[] {
    return Array.from(this.teleportNetworks.values());
  }

  /**
   * 获取传送历史
   */
  public getTeleportHistory(): TeleportHistory[] {
    return [...this.teleportHistory];
  }

  /**
   * 获取传送统计
   */
  public getTeleportStats(): TeleportStats {
    return { ...this.stats };
  }

  /**
   * 获取传送事件
   */
  public getTeleportEvents(): TeleportEvent[] {
    return [...this.events];
  }

  /**
   * 添加事件
   */
  private addEvent(type: TeleportEvent['type'], pointId: string, data?: any): void {
    const event: TeleportEvent = {
      type,
      pointId,
      data,
      timestamp: Date.now()
    };
    
    this.events.push(event);
    
    // 保持事件历史在合理范围内
    if (this.events.length > this.config.maxEventsSize) {
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
   * 初始化默认传送点
   */
  private initializeDefaultPoints(): void {
    // 村庄传送点
    this.addTeleportPoint({
      id: 'village_to_forest',
      name: '森林入口',
      description: '通往神秘森林的入口',
      type: 'normal',
      status: 'unlocked',
      sourceMap: 'village',
      sourceX: 15,
      sourceY: 5,
      targetMap: 'forest',
      targetX: 5,
      targetY: 15,
      conditions: [],
      effects: [
        { type: 'screen_fade', duration: 1000 },
        { type: 'sound_effect', duration: 500 }
      ],
      cooldown: 3000,
      cost: 0,
      currency: 'gold',
      icon: 'forest_icon',
      color: '#4CAF50',
      visible: true,
      interactive: true,
      tags: ['forest', 'entrance'],
      metadata: {},
      usageCount: 0,
      lastUsed: 0,
      discoveredBy: []
    });

    // 森林传送点
    this.addTeleportPoint({
      id: 'forest_to_cave',
      name: '洞穴入口',
      description: '通往黑暗洞穴的入口',
      type: 'dungeon',
      status: 'locked',
      sourceMap: 'forest',
      sourceX: 20,
      sourceY: 20,
      targetMap: 'cave',
      targetX: 10,
      targetY: 10,
      conditions: [
        { type: 'level', value: 5, operator: 'gte', description: '需要等级5' }
      ],
      effects: [
        { type: 'screen_fade', duration: 1500 },
        { type: 'particle_effect', duration: 1000 },
        { type: 'sound_effect', duration: 800 }
      ],
      cooldown: 5000,
      cost: 10,
      currency: 'gold',
      icon: 'cave_icon',
      color: '#795548',
      visible: true,
      interactive: true,
      tags: ['cave', 'dungeon'],
      metadata: {},
      usageCount: 0,
      lastUsed: 0,
      discoveredBy: []
    });

    // 快速传送点
    this.addTeleportPoint({
      id: 'village_fast_travel',
      name: '快速传送站',
      description: '快速传送到其他区域',
      type: 'fast_travel',
      status: 'unlocked',
      sourceMap: 'village',
      sourceX: 25,
      sourceY: 25,
      targetMap: 'village',
      targetX: 25,
      targetY: 25,
      conditions: [],
      effects: [
        { type: 'screen_fade', duration: 800 },
        { type: 'camera_shake', duration: 500 }
      ],
      cooldown: 10000,
      cost: 50,
      currency: 'gold',
      icon: 'fast_travel_icon',
      color: '#2196F3',
      visible: true,
      interactive: true,
      networkId: 'fast_travel_network',
      networkName: '快速传送网络',
      tags: ['fast_travel', 'hub'],
      metadata: {},
      usageCount: 0,
      lastUsed: 0,
      discoveredBy: []
    });
  }

  /**
   * 初始化默认传送网络
   */
  private initializeDefaultNetworks(): void {
    // 快速传送网络
    this.addTeleportNetwork({
      id: 'fast_travel_network',
      name: '快速传送网络',
      description: '连接主要区域的快速传送网络',
      type: 'fast_travel',
      points: ['village_fast_travel'],
      unlocked: true,
      cost: 0,
      currency: 'gold',
      conditions: []
    });

    // 地下城网络
    this.addTeleportNetwork({
      id: 'dungeon_network',
      name: '地下城网络',
      description: '连接各个地下城的传送网络',
      type: 'dungeon',
      points: ['forest_to_cave'],
      unlocked: false,
      cost: 100,
      currency: 'gold',
      conditions: [
        { type: 'level', value: 10, operator: 'gte', description: '需要等级10' }
      ]
    });
  }

  /**
   * 加载数据
   */
  private loadData(): void {
    const savedData = storage.get('teleport_data', null);
    if (savedData) {
      this.discoveredPoints = new Set((savedData as any).discoveredPoints || []);
      this.unlockedNetworks = new Set((savedData as any).unlockedNetworks || []);
      this.stats = savedData.stats || this.stats;
      this.teleportHistory = savedData.history || [];
    }
  }

  /**
   * 保存数据
   */
  private saveData(): void {
    const data = {
      discoveredPoints: Array.from(this.discoveredPoints),
      unlockedNetworks: Array.from(this.unlockedNetworks),
      stats: this.stats,
      history: this.teleportHistory
    };
    
    storage.set('teleport_data', data);
  }

  /**
   * 清理资源
   */
  public destroy(): void {
    this.saveData();
    
    this.teleportPoints.clear();
    this.teleportNetworks.clear();
    this.teleportHistory = [];
    this.events = [];
    this.callbacks.clear();
    this.cooldowns.clear();
    this.discoveredPoints.clear();
    this.unlockedNetworks.clear();
    
    this.scene = null;
    console.log('传送系统已销毁');
  }
}
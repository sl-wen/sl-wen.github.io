/**
 * 敌人AI系统
 * 负责管理敌人的AI行为、状态机和技能系统
 */

import { storage } from '../utils';

// AI状态类型
export type AIState = 'idle' | 'patrol' | 'chase' | 'attack' | 'retreat' | 'stunned' | 'dead' | 'search' | 'flee' | 'guard' | 'ambush' | 'call_reinforcements';

// AI行为类型
export type AIBehavior = 'passive' | 'aggressive' | 'defensive' | 'cowardly' | 'berserker' | 'tactical' | 'support' | 'leader';

// AI难度等级
export type AIDifficulty = 'easy' | 'normal' | 'hard' | 'expert' | 'boss';

// 敌人类型
export type EnemyType = 'slime' | 'goblin' | 'orc' | 'troll' | 'dragon' | 'undead' | 'beast' | 'humanoid' | 'elemental' | 'boss';

// AI状态数据
export interface AIStateData {
  state: AIState;
  duration: number;
  startTime: number;
  data?: any;
}

// AI行为配置
export interface AIBehaviorConfig {
  type: AIBehavior;
  difficulty: AIDifficulty;
  enemyType: EnemyType;
  
  // 基础属性
  patrolRadius: number;
  chaseDistance: number;
  attackDistance: number;
  retreatDistance: number;
  searchRadius: number;
  
  // 速度设置
  patrolSpeed: number;
  chaseSpeed: number;
  attackSpeed: number;
  retreatSpeed: number;
  
  // 时间设置
  idleTime: number;
  attackCooldown: number;
  skillCooldown: number;
  stunDuration: number;
  
  // 行为权重
  aggressionLevel: number; // 0-1
  fearLevel: number; // 0-1
  intelligenceLevel: number; // 0-1
  
  // 特殊能力
  canUseSkills: boolean;
  canCallReinforcements: boolean;
  canFlee: boolean;
  canGuard: boolean;
  canAmbush: boolean;
  
  // 技能配置
  skills: AISkill[];
  
  // 状态机配置
  stateTransitions: AIStateTransition[];
}

// AI技能
export interface AISkill {
  id: string;
  name: string;
  description: string;
  type: 'attack' | 'buff' | 'debuff' | 'heal' | 'summon' | 'movement' | 'special';
  
  // 技能属性
  damage: number;
  range: number;
  cooldown: number;
  manaCost: number;
  duration: number;
  
  // 使用条件
  conditions: AISkillCondition[];
  
  // 效果
  effects: AISkillEffect[];
  
  // 动画
  animation: string;
  sound: string;
  
  // 优先级
  priority: number;
}

// AI技能条件
export interface AISkillCondition {
  type: 'health' | 'mana' | 'distance' | 'target_health' | 'ally_count' | 'enemy_count' | 'time' | 'custom';
  operator: 'eq' | 'gt' | 'lt' | 'gte' | 'lte' | 'ne';
  value: any;
  description: string;
}

// AI技能效果
export interface AISkillEffect {
  type: 'damage' | 'heal' | 'buff' | 'debuff' | 'movement' | 'summon' | 'custom';
  target: 'self' | 'enemy' | 'ally' | 'area';
  value: any;
  duration: number;
}

// AI状态转换
export interface AIStateTransition {
  from: AIState;
  to: AIState;
  conditions: AIStateCondition[];
  priority: number;
}

// AI状态条件
export interface AIStateCondition {
  type: 'health' | 'distance' | 'time' | 'damage_taken' | 'ally_dead' | 'enemy_spotted' | 'custom';
  operator: 'eq' | 'gt' | 'lt' | 'gte' | 'lte' | 'ne';
  value: any;
  description: string;
}

// AI记忆
export interface AIMemory {
  lastSeenPlayer: { x: number; y: number; time: number };
  lastAttackedBy: { id: string; time: number; damage: number };
  lastSkillUsed: { skillId: string; time: number; success: boolean };
  knownThreats: Map<string, { threatLevel: number; lastSeen: number }>;
  patrolPoints: { x: number; y: number }[];
  escapeRoutes: { x: number; y: number }[];
}

// AI统计
export interface AIStats {
  totalDamageDealt: number;
  totalDamageTaken: number;
  skillsUsed: number;
  stateChanges: number;
  kills: number;
  deaths: number;
  timeAlive: number;
  distanceTraveled: number;
}

// AI事件
export interface AIEvent {
  type: 'state_change' | 'skill_used' | 'damage_dealt' | 'damage_taken' | 'target_spotted' | 'ally_dead' | 'custom';
  enemyId: string;
  data?: any;
  timestamp: number;
}

export class EnemyAISystem {
  private static instance: EnemyAISystem;
  private scene: Phaser.Scene | null = null;
  
  // 数据存储
  private enemyAIs: Map<string, any> = new Map();
  private behaviorConfigs: Map<string, AIBehaviorConfig> = new Map();
  private events: AIEvent[] = [];
  private callbacks: Map<string, (data: any) => void> = new Map();
  
  // 配置
  private config = {
    updateInterval: 100, // AI更新间隔
    maxMemorySize: 50,
    maxEventsSize: 100,
    enablePathfinding: true,
    enableSkills: true,
    enableMemory: true,
    enableStats: true
  };
  
  // 统计信息
  private globalStats: AIStats = {
    totalDamageDealt: 0,
    totalDamageTaken: 0,
    skillsUsed: 0,
    stateChanges: 0,
    kills: 0,
    deaths: 0,
    timeAlive: 0,
    distanceTraveled: 0
  };

  private constructor() {
    this.initializeDefaultBehaviors();
  }

  public static getInstance(): EnemyAISystem {
    if (!EnemyAISystem.instance) {
      EnemyAISystem.instance = new EnemyAISystem();
    }
    return EnemyAISystem.instance;
  }

  /**
   * 初始化AI系统
   */
  public initialize(scene: Phaser.Scene): void {
    this.scene = scene;
    this.setupEventHandlers();
    console.log('敌人AI系统已初始化');
  }

  /**
   * 设置事件处理器
   */
  private setupEventHandlers(): void {
    if (!this.scene) return;

    // 监听游戏事件
    this.scene.events.on('enemy-damaged', (data: any) => {
      this.onEnemyDamaged(data);
    });

    this.scene.events.on('enemy-killed', (data: any) => {
      this.onEnemyKilled(data);
    });

    this.scene.events.on('player-moved', (position: any) => {
      this.onPlayerMoved(position);
    });
  }

  /**
   * 注册敌人AI
   */
  public registerEnemy(enemy: any, behaviorType: string): void {
    const config = this.behaviorConfigs.get(behaviorType);
    if (!config) {
      console.error(`未找到AI行为配置: ${behaviorType}`);
      return;
    }

    const aiData = {
      enemy,
      config,
      currentState: {
        state: 'idle',
        duration: 0,
        startTime: Date.now(),
        data: {}
      },
      memory: this.createAIMemory(),
      stats: this.createAIStats(),
      lastUpdate: Date.now(),
      cooldowns: new Map<string, number>(),
      pathfinding: {
        currentPath: [],
        targetPosition: null,
        lastPathUpdate: 0
      }
    };

    this.enemyAIs.set(enemy.name, aiData);
    this.addEvent('custom', enemy.name, { type: 'enemy_registered', behaviorType });
    console.log(`注册敌人AI: ${enemy.name} (${behaviorType})`);
  }

  /**
   * 创建AI记忆
   */
  private createAIMemory(): AIMemory {
    return {
      lastSeenPlayer: { x: 0, y: 0, time: 0 },
      lastAttackedBy: { id: '', time: 0, damage: 0 },
      lastSkillUsed: { skillId: '', time: 0, success: false },
      knownThreats: new Map(),
      patrolPoints: [],
      escapeRoutes: []
    };
  }

  /**
   * 创建AI统计
   */
  private createAIStats(): AIStats {
    return {
      totalDamageDealt: 0,
      totalDamageTaken: 0,
      skillsUsed: 0,
      stateChanges: 0,
      kills: 0,
      deaths: 0,
      timeAlive: 0,
      distanceTraveled: 0
    };
  }

  /**
   * 更新AI系统
   */
  public update(): void {
    const currentTime = Date.now();
    
    this.enemyAIs.forEach((aiData, enemyId) => {
      if (currentTime - aiData.lastUpdate >= this.config.updateInterval) {
        this.updateEnemyAI(aiData, currentTime);
        aiData.lastUpdate = currentTime;
      }
    });
  }

  /**
   * 更新单个敌人AI
   */
  private updateEnemyAI(aiData: any, currentTime: number): void {
    const { enemy, config, currentState, memory, stats } = aiData;
    
    // 更新状态持续时间
    currentState.duration = currentTime - currentState.startTime;
    
    // 检查状态转换
    this.checkStateTransitions(aiData, currentTime);
    
    // 执行当前状态的行为
    this.executeStateBehavior(aiData, currentTime);
    
    // 更新技能冷却
    this.updateSkillCooldowns(aiData, currentTime);
    
    // 更新统计
    stats.timeAlive += this.config.updateInterval;
  }

  /**
   * 检查状态转换
   */
  private checkStateTransitions(aiData: any, currentTime: number): void {
    const { config, currentState, memory } = aiData;
    
    // 按优先级排序状态转换
    const transitions = config.stateTransitions
      .filter((t: any) => t.from === currentState.state)
      .sort((a: any, b: any) => b.priority - a.priority);
    
    for (const transition of transitions) {
      if (this.evaluateStateConditions(transition.conditions, aiData, currentTime)) {
        this.changeState(aiData, transition.to, currentTime);
        break;
      }
    }
  }

  /**
   * 评估状态条件
   */
  private evaluateStateConditions(conditions: AIStateCondition[], aiData: any, currentTime: number): boolean {
    return conditions.every(condition => {
      const value = this.getConditionValue(condition.type, aiData, currentTime);
      return this.evaluateCondition(condition, value);
    });
  }

  /**
   * 获取条件值
   */
  private getConditionValue(type: string, aiData: any, currentTime: number): any {
    const { enemy, memory, currentState } = aiData;
    
    switch (type) {
      case 'health':
        return enemy.health / enemy.maxHealth;
      case 'distance':
        return this.getDistanceToPlayer(enemy);
      case 'time':
        return currentState.duration;
      case 'damage_taken':
        return memory.lastAttackedBy.damage;
      case 'ally_dead':
        return this.getAllyCount(enemy);
      case 'enemy_spotted':
        return this.isPlayerVisible(enemy);
      default:
        return 0;
    }
  }

  /**
   * 评估条件
   */
  private evaluateCondition(condition: AIStateCondition, value: any): boolean {
    switch (condition.operator) {
      case 'eq':
        return value === condition.value;
      case 'gt':
        return value > condition.value;
      case 'lt':
        return value < condition.value;
      case 'gte':
        return value >= condition.value;
      case 'lte':
        return value <= condition.value;
      case 'ne':
        return value !== condition.value;
      default:
        return false;
    }
  }

  /**
   * 改变状态
   */
  private changeState(aiData: any, newState: AIState, currentTime: number): void {
    const { enemy, currentState, stats } = aiData;
    
    const oldState = currentState.state;
    currentState.state = newState;
    currentState.startTime = currentTime;
    currentState.duration = 0;
    currentState.data = {};
    
    stats.stateChanges++;
    
    this.addEvent('state_change', enemy.name, { 
      fromState: oldState, 
      toState: newState,
      enemy: enemy.name 
    });
    
    console.log(`敌人 ${enemy.name} 状态改变: ${oldState} -> ${newState}`);
  }

  /**
   * 执行状态行为
   */
  private executeStateBehavior(aiData: any, currentTime: number): void {
    const { enemy, config, currentState } = aiData;
    
    switch (currentState.state) {
      case 'idle':
        this.executeIdleBehavior(aiData, currentTime);
        break;
      case 'patrol':
        this.executePatrolBehavior(aiData, currentTime);
        break;
      case 'chase':
        this.executeChaseBehavior(aiData, currentTime);
        break;
      case 'attack':
        this.executeAttackBehavior(aiData, currentTime);
        break;
      case 'retreat':
        this.executeRetreatBehavior(aiData, currentTime);
        break;
      case 'search':
        this.executeSearchBehavior(aiData, currentTime);
        break;
      case 'flee':
        this.executeFleeBehavior(aiData, currentTime);
        break;
      case 'guard':
        this.executeGuardBehavior(aiData, currentTime);
        break;
      case 'ambush':
        this.executeAmbushBehavior(aiData, currentTime);
        break;
      case 'call_reinforcements':
        this.executeCallReinforcementsBehavior(aiData, currentTime);
        break;
    }
  }

  /**
   * 执行空闲行为
   */
  private executeIdleBehavior(aiData: any, currentTime: number): void {
    const { enemy, config, currentState } = aiData;
    
    if (currentState.duration >= config.idleTime) {
      this.changeState(aiData, 'patrol', currentTime);
    }
  }

  /**
   * 执行巡逻行为
   */
  private executePatrolBehavior(aiData: any, currentTime: number): void {
    const { enemy, config, memory, pathfinding } = aiData;
    
    // 检查是否看到玩家
    if (this.isPlayerVisible(enemy) && this.getDistanceToPlayer(enemy) <= config.chaseDistance) {
      this.updatePlayerMemory(aiData);
      this.changeState(aiData, 'chase', currentTime);
      return;
    }
    
    // 随机巡逻
    if (!this.isMoving(enemy)) {
      const patrolPoint = this.getRandomPatrolPoint(enemy, config.patrolRadius);
      this.moveTo(enemy, patrolPoint, config.patrolSpeed);
    }
  }

  /**
   * 执行追击行为
   */
  private executeChaseBehavior(aiData: any, currentTime: number): void {
    const { enemy, config, memory } = aiData;
    
    const distance = this.getDistanceToPlayer(enemy);
    
    if (distance <= config.attackDistance) {
      this.changeState(aiData, 'attack', currentTime);
      return;
    }
    
    if (distance > config.chaseDistance) {
      this.changeState(aiData, 'search', currentTime);
      return;
    }
    
    // 追击玩家
    const playerPosition = this.getPlayerPosition();
    this.moveTo(enemy, playerPosition, config.chaseSpeed);
    this.updatePlayerMemory(aiData);
  }

  /**
   * 执行攻击行为
   */
  private executeAttackBehavior(aiData: any, currentTime: number): void {
    const { enemy, config, memory } = aiData;
    
    const distance = this.getDistanceToPlayer(enemy);
    
    if (distance > config.attackDistance) {
      this.changeState(aiData, 'chase', currentTime);
      return;
    }
    
    // 检查是否可以使用技能
    if (config.canUseSkills && this.canUseSkill(enemy, currentTime)) {
      const skill = this.selectBestSkill(aiData, currentTime);
      if (skill) {
        this.useSkill(enemy, skill, currentTime);
        return;
      }
    }
    
    // 普通攻击
    if (this.canAttack(enemy, currentTime)) {
      this.performAttack(enemy, currentTime);
    }
  }

  /**
   * 执行撤退行为
   */
  private executeRetreatBehavior(aiData: any, currentTime: number): void {
    const { enemy, config, memory } = aiData;
    
    const distance = this.getDistanceToPlayer(enemy);
    
    if (distance >= config.retreatDistance) {
      this.changeState(aiData, 'idle', currentTime);
      return;
    }
    
    // 远离玩家
    const playerPosition = this.getPlayerPosition();
    const retreatDirection = this.getRetreatDirection(enemy, playerPosition);
    this.moveTo(enemy, retreatDirection, config.retreatSpeed);
  }

  /**
   * 执行搜索行为
   */
  private executeSearchBehavior(aiData: any, currentTime: number): void {
    const { enemy, config, memory, currentState } = aiData;
    
    // 检查是否找到玩家
    if (this.isPlayerVisible(enemy)) {
      this.changeState(aiData, 'chase', currentTime);
      return;
    }
    
    // 搜索玩家最后出现的位置
    if (!this.isMoving(enemy)) {
      const searchPoint = this.getSearchPoint(memory.lastSeenPlayer, config.searchRadius);
      this.moveTo(enemy, searchPoint, config.patrolSpeed);
    }
    
    // 搜索超时，回到巡逻
    if (currentState.duration > 10000) {
      this.changeState(aiData, 'patrol', currentTime);
    }
  }

  /**
   * 执行逃跑行为
   */
  private executeFleeBehavior(aiData: any, currentTime: number): void {
    const { enemy, config, memory } = aiData;
    
    if (!config.canFlee) {
      this.changeState(aiData, 'retreat', currentTime);
      return;
    }
    
    // 寻找逃跑路线
    const escapeRoute = this.findEscapeRoute(enemy);
    if (escapeRoute) {
      this.moveTo(enemy, escapeRoute, config.retreatSpeed);
    }
  }

  /**
   * 执行守卫行为
   */
  private executeGuardBehavior(aiData: any, currentTime: number): void {
    const { enemy, config, currentState } = aiData;
    
    if (!config.canGuard) {
      this.changeState(aiData, 'patrol', currentTime);
      return;
    }
    
    // 守卫特定区域
    const guardPosition = currentState.data.guardPosition || { x: enemy.x, y: enemy.y };
    const distanceFromGuard = this.getDistance(enemy, guardPosition);
    
    if (distanceFromGuard > 2) {
      this.moveTo(enemy, guardPosition, config.patrolSpeed);
    }
  }

  /**
   * 执行伏击行为
   */
  private executeAmbushBehavior(aiData: any, currentTime: number): void {
    const { enemy, config, currentState } = aiData;
    
    if (!config.canAmbush) {
      this.changeState(aiData, 'patrol', currentTime);
      return;
    }
    
    // 等待玩家进入伏击范围
    const distance = this.getDistanceToPlayer(enemy);
    if (distance <= config.attackDistance) {
      this.changeState(aiData, 'attack', currentTime);
    }
  }

  /**
   * 执行呼叫援军行为
   */
  private executeCallReinforcementsBehavior(aiData: any, currentTime: number): void {
    const { enemy, config } = aiData;
    
    if (!config.canCallReinforcements) {
      this.changeState(aiData, 'attack', currentTime);
      return;
    }
    
    // 呼叫援军
    this.callReinforcements(enemy);
    this.changeState(aiData, 'attack', currentTime);
  }

  /**
   * 选择最佳技能
   */
  private selectBestSkill(aiData: any, currentTime: number): AISkill | null {
    const { config, memory } = aiData;
    
    const availableSkills = config.skills.filter((skill: any) => 
      this.canUseSkill(skill, currentTime) && 
      this.evaluateSkillConditions(skill.conditions, aiData, currentTime)
    );
    
    if (availableSkills.length === 0) return null;
    
    // 按优先级排序
    availableSkills.sort((a: any, b: any) => b.priority - a.priority);
    
    return availableSkills[0];
  }

  /**
   * 使用技能
   */
  private useSkill(enemy: any, skill: AISkill, currentTime: number): void {
    const aiData = this.enemyAIs.get(enemy.name);
    if (!aiData) return;
    
    // 设置技能冷却
    aiData.cooldowns.set(skill.id, currentTime + skill.cooldown);
    
    // 播放技能动画
    if (skill.animation) {
      enemy.anims.play(skill.animation);
    }
    
    // 播放技能音效
    if (skill.sound && this.scene) {
      this.scene.events.emit('play-sound', skill.sound);
    }
    
    // 应用技能效果
    this.applySkillEffects(enemy, skill);
    
    // 更新统计
    aiData.stats.skillsUsed++;
    this.globalStats.skillsUsed++;
    
    // 更新记忆
    aiData.memory.lastSkillUsed = {
      skillId: skill.id,
      time: currentTime,
      success: true
    };
    
    this.addEvent('skill_used', enemy.name, { skill, enemy: enemy.name });
    console.log(`敌人 ${enemy.name} 使用技能: ${skill.name}`);
  }

  /**
   * 应用技能效果
   */
  private applySkillEffects(enemy: any, skill: AISkill): void {
    skill.effects.forEach(effect => {
      switch (effect.type) {
        case 'damage':
          this.dealDamage(enemy, effect.value);
          break;
        case 'heal':
          this.healEnemy(enemy, effect.value);
          break;
        case 'buff':
          this.applyBuff(enemy, effect);
          break;
        case 'debuff':
          this.applyDebuff(enemy, effect);
          break;
        case 'movement':
          this.moveEnemy(enemy, effect.value);
          break;
        case 'summon':
          this.summonAlly(enemy, effect.value);
          break;
      }
    });
  }

  /**
   * 更新技能冷却
   */
  private updateSkillCooldowns(aiData: any, currentTime: number): void {
    aiData.cooldowns.forEach((cooldownEnd: any, skillId: any) => {
      if (currentTime >= cooldownEnd) {
        aiData.cooldowns.delete(skillId);
      }
    });
  }

  /**
   * 检查是否可以使用技能
   */
  private canUseSkill(enemy: any, currentTime: number): boolean {
    const aiData = this.enemyAIs.get(enemy.name);
    if (!aiData) return false;
    
    return !aiData.cooldowns.has(enemy.name);
  }

  /**
   * 评估技能条件
   */
  private evaluateSkillConditions(conditions: AISkillCondition[], aiData: any, currentTime: number): boolean {
    return conditions.every(condition => {
      const value = this.getSkillConditionValue(condition.type, aiData, currentTime);
      return this.evaluateCondition(condition as AIStateCondition, value);
    });
  }

  /**
   * 获取技能条件值
   */
  private getSkillConditionValue(type: string, aiData: any, currentTime: number): any {
    const { enemy, memory } = aiData;
    
    switch (type) {
      case 'health':
        return enemy.health / enemy.maxHealth;
      case 'mana':
        return enemy.mana / enemy.maxMana;
      case 'distance':
        return this.getDistanceToPlayer(enemy);
      case 'target_health':
        return this.getPlayerHealth() / this.getPlayerMaxHealth();
      case 'ally_count':
        return this.getAllyCount(enemy);
      case 'enemy_count':
        return this.getEnemyCount(enemy);
      case 'time':
        return currentTime;
      default:
        return 0;
    }
  }

  /**
   * 工具方法
   */
  private getDistanceToPlayer(enemy: any): number {
    const playerPosition = this.getPlayerPosition();
    return this.getDistance(enemy, playerPosition);
  }

  private getDistance(obj1: any, obj2: any): number {
    const dx = obj1.x - obj2.x;
    const dy = obj1.y - obj2.y;
    return Math.sqrt(dx * dx + dy * dy);
  }

  private getPlayerPosition(): { x: number; y: number } {
    // 从场景获取玩家位置
    return { x: 0, y: 0 }; // 需要从场景获取
  }

  private getPlayerHealth(): number {
    return 100; // 需要从场景获取
  }

  private getPlayerMaxHealth(): number {
    return 100; // 需要从场景获取
  }

  private isPlayerVisible(enemy: any): boolean {
    // 检查玩家是否在视野范围内
    return this.getDistanceToPlayer(enemy) <= 10;
  }

  private isMoving(enemy: any): boolean {
    // 检查敌人是否在移动
    return false; // 需要从GridEngine获取
  }

  private moveTo(enemy: any, position: { x: number; y: number }, speed: number): void {
    // 移动敌人到指定位置
    if (this.scene) {
      this.scene.events.emit('move-enemy', { enemy, position, speed });
    }
  }

  private canAttack(enemy: any, currentTime: number): boolean {
    const aiData = this.enemyAIs.get(enemy.name);
    if (!aiData) return false;
    
    return currentTime - aiData.lastAttackTime >= aiData.config.attackCooldown;
  }

  private performAttack(enemy: any, currentTime: number): void {
    // 执行攻击
    if (this.scene) {
      this.scene.events.emit('enemy-attack', { enemy, time: currentTime });
    }
  }

  private dealDamage(enemy: any, damage: number): void {
    // 造成伤害
    if (this.scene) {
      this.scene.events.emit('enemy-damage', { enemy, damage });
    }
  }

  private healEnemy(enemy: any, amount: number): void {
    // 治疗敌人
    enemy.health = Math.min(enemy.health + amount, enemy.maxHealth);
  }

  private applyBuff(enemy: any, effect: AISkillEffect): void {
    // 应用增益效果
    if (this.scene) {
      this.scene.events.emit('enemy-buff', { enemy, effect });
    }
  }

  private applyDebuff(enemy: any, effect: AISkillEffect): void {
    // 应用减益效果
    if (this.scene) {
      this.scene.events.emit('enemy-debuff', { enemy, effect });
    }
  }

  private moveEnemy(enemy: any, movement: any): void {
    // 移动敌人
    this.moveTo(enemy, movement, 2);
  }

  private summonAlly(enemy: any, allyType: string): void {
    // 召唤盟友
    if (this.scene) {
      this.scene.events.emit('enemy-summon', { enemy, allyType });
    }
  }

  private getAllyCount(enemy: any): number {
    // 获取盟友数量
    return 0; // 需要从场景获取
  }

  private getEnemyCount(enemy: any): number {
    // 获取敌人数量
    return 0; // 需要从场景获取
  }

  private getRandomPatrolPoint(enemy: any, radius: number): { x: number; y: number } {
    const angle = Math.random() * Math.PI * 2;
    const distance = Math.random() * radius;
    return {
      x: enemy.x + Math.cos(angle) * distance,
      y: enemy.y + Math.sin(angle) * distance
    };
  }

  private getSearchPoint(lastSeen: any, radius: number): { x: number; y: number } {
    const angle = Math.random() * Math.PI * 2;
    const distance = Math.random() * radius;
    return {
      x: lastSeen.x + Math.cos(angle) * distance,
      y: lastSeen.y + Math.sin(angle) * distance
    };
  }

  private getRetreatDirection(enemy: any, playerPosition: any): { x: number; y: number } {
    const dx = enemy.x - playerPosition.x;
    const dy = enemy.y - playerPosition.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    return {
      x: enemy.x + (dx / distance) * 5,
      y: enemy.y + (dy / distance) * 5
    };
  }

  private findEscapeRoute(enemy: any): { x: number; y: number } | null {
    // 寻找逃跑路线
    return { x: enemy.x + 10, y: enemy.y + 10 };
  }

  private callReinforcements(enemy: any): void {
    // 呼叫援军
    if (this.scene) {
      this.scene.events.emit('enemy-call-reinforcements', { enemy });
    }
  }

  private updatePlayerMemory(aiData: any): void {
    const playerPosition = this.getPlayerPosition();
    aiData.memory.lastSeenPlayer = {
      x: playerPosition.x,
      y: playerPosition.y,
      time: Date.now()
    };
  }

  /**
   * 事件处理
   */
  private onEnemyDamaged(data: any): void {
    const { enemy, damage, attacker } = data;
    const aiData = this.enemyAIs.get(enemy.name);
    if (!aiData) return;
    
    aiData.stats.totalDamageTaken += damage;
    this.globalStats.totalDamageTaken += damage;
    
    aiData.memory.lastAttackedBy = {
      id: attacker?.name || 'unknown',
      time: Date.now(),
      damage
    };
    
    this.addEvent('damage_taken', enemy.name, { enemy: enemy.name, damage, attacker });
  }

  private onEnemyKilled(data: any): void {
    const { enemy, killer } = data;
    const aiData = this.enemyAIs.get(enemy.name);
    if (!aiData) return;
    
    aiData.stats.deaths++;
    this.globalStats.deaths++;
    
    this.addEvent('custom', enemy.name, { type: 'enemy_killed', enemy: enemy.name, killer });
  }

  private onPlayerMoved(position: any): void {
    // 更新所有敌人的玩家位置记忆
    this.enemyAIs.forEach((aiData, enemyId) => {
      if (this.isPlayerVisible(aiData.enemy)) {
        this.updatePlayerMemory(aiData);
      }
    });
  }

  /**
   * 初始化默认行为配置
   */
  private initializeDefaultBehaviors(): void {
    // 史莱姆行为配置
    this.behaviorConfigs.set('slime_passive', {
      type: 'passive',
      difficulty: 'easy',
      enemyType: 'slime',
      patrolRadius: 3,
      chaseDistance: 4,
      attackDistance: 1,
      retreatDistance: 6,
      searchRadius: 5,
      patrolSpeed: 1,
      chaseSpeed: 2,
      attackSpeed: 1,
      retreatSpeed: 3,
      idleTime: 3000,
      attackCooldown: 2000,
      skillCooldown: 5000,
      stunDuration: 1000,
      aggressionLevel: 0.3,
      fearLevel: 0.7,
      intelligenceLevel: 0.2,
      canUseSkills: false,
      canCallReinforcements: false,
      canFlee: true,
      canGuard: false,
      canAmbush: false,
      skills: [],
      stateTransitions: [
        {
          from: 'idle',
          to: 'patrol',
          conditions: [{ type: 'time', operator: 'gte', value: 3000, description: '空闲时间结束' }],
          priority: 1
        },
        {
          from: 'patrol',
          to: 'chase',
          conditions: [{ type: 'distance', operator: 'lte', value: 4, description: '发现玩家' }],
          priority: 2
        },
        {
          from: 'chase',
          to: 'attack',
          conditions: [{ type: 'distance', operator: 'lte', value: 1, description: '进入攻击范围' }],
          priority: 3
        },
        {
          from: 'attack',
          to: 'retreat',
          conditions: [{ type: 'health', operator: 'lt', value: 0.3, description: '血量过低' }],
          priority: 4
        }
      ]
    });

    // 哥布林行为配置
    this.behaviorConfigs.set('goblin_aggressive', {
      type: 'aggressive',
      difficulty: 'normal',
      enemyType: 'goblin',
      patrolRadius: 5,
      chaseDistance: 8,
      attackDistance: 2,
      retreatDistance: 10,
      searchRadius: 8,
      patrolSpeed: 2,
      chaseSpeed: 3,
      attackSpeed: 2,
      retreatSpeed: 4,
      idleTime: 2000,
      attackCooldown: 1500,
      skillCooldown: 3000,
      stunDuration: 800,
      aggressionLevel: 0.8,
      fearLevel: 0.3,
      intelligenceLevel: 0.6,
      canUseSkills: true,
      canCallReinforcements: true,
      canFlee: false,
      canGuard: true,
      canAmbush: true,
      skills: [
        {
          id: 'goblin_throw',
          name: '投掷石块',
          description: '向玩家投掷石块',
          type: 'attack',
          damage: 15,
          range: 5,
          cooldown: 3000,
          manaCost: 0,
          duration: 0,
          conditions: [
            { type: 'distance', operator: 'gte', value: 2, description: '距离玩家较远' }
          ],
          effects: [
            { type: 'damage', target: 'enemy', value: 15, duration: 0 }
          ],
          animation: 'goblin_throw',
          sound: 'goblin_throw',
          priority: 2
        }
      ],
      stateTransitions: [
        {
          from: 'idle',
          to: 'patrol',
          conditions: [{ type: 'time', operator: 'gte', value: 2000, description: '空闲时间结束' }],
          priority: 1
        },
        {
          from: 'patrol',
          to: 'chase',
          conditions: [{ type: 'distance', operator: 'lte', value: 8, description: '发现玩家' }],
          priority: 2
        },
        {
          from: 'chase',
          to: 'attack',
          conditions: [{ type: 'distance', operator: 'lte', value: 2, description: '进入攻击范围' }],
          priority: 3
        },
        {
          from: 'attack',
          to: 'call_reinforcements',
          conditions: [{ type: 'health', operator: 'lt', value: 0.5, description: '血量中等，呼叫援军' }],
          priority: 4
        }
      ]
    });
  }

  /**
   * 添加事件
   */
  private addEvent(type: AIEvent['type'], enemyId: string, data?: any): void {
    const event: AIEvent = {
      type,
      enemyId,
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
   * 获取AI数据
   */
  public getEnemyAI(enemyId: string): any {
    return this.enemyAIs.get(enemyId);
  }

  /**
   * 获取所有AI数据
   */
  public getAllEnemyAIs(): Map<string, any> {
    return this.enemyAIs;
  }

  /**
   * 获取AI事件
   */
  public getAIEvents(): AIEvent[] {
    return [...this.events];
  }

  /**
   * 获取AI统计
   */
  public getAIStats(): AIStats {
    return { ...this.globalStats };
  }

  /**
   * 清理资源
   */
  public destroy(): void {
    this.enemyAIs.clear();
    this.behaviorConfigs.clear();
    this.events = [];
    this.callbacks.clear();
    
    this.scene = null;
    console.log('敌人AI系统已销毁');
  }
}
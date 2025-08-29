import { COMBAT_RANGE, COMBAT_DAMAGE, COMBAT_COOLDOWN, ENEMY_DETECTION_RANGE } from '../ref/constants';

// 战斗实体接口
export interface CombatEntity {
  id: string;
  name: string;
  health: number;
  maxHealth: number;
  attack: number;
  defense: number;
  speed: number;
  level: number;
  position: { x: number; y: number };
  isPlayer: boolean;
  isAlive: boolean;
}

// 战斗动作接口
export interface CombatAction {
  type: 'attack' | 'defend' | 'item' | 'flee';
  target?: string;
  itemId?: string;
  damage?: number;
  healing?: number;
}

// 战斗结果接口
export interface CombatResult {
  attacker: string;
  target: string;
  action: CombatAction;
  damage: number;
  isCritical: boolean;
  targetDefeated: boolean;
  experience: number;
  gold: number;
  items: string[];
}

// 战斗状态接口
export interface CombatState {
  isInCombat: boolean;
  participants: CombatEntity[];
  currentTurn: number;
  turnOrder: string[];
  lastActionTime: number;
}

/**
 * 战斗系统
 * 处理游戏中的战斗逻辑、伤害计算和战斗结果
 */
export class CombatSystem {
  private combatState: CombatState;
  private lastAttackTime: number;
  private combatHistory: CombatResult[];

  constructor() {
    this.combatState = {
      isInCombat: false,
      participants: [],
      currentTurn: 0,
      turnOrder: [],
      lastActionTime: 0
    };
    this.lastAttackTime = 0;
    this.combatHistory = [];
  }

  /**
   * 开始战斗
   * @param player - 玩家实体
   * @param enemies - 敌人实体数组
   * @returns 是否成功开始战斗
   */
  startCombat(player: CombatEntity, enemies: CombatEntity[]): boolean {
    if (this.combatState.isInCombat) {
      return false;
    }

    // 检查是否有敌人在攻击范围内
    const nearbyEnemies = enemies.filter(enemy => 
      this.calculateDistance(player.position, enemy.position) <= ENEMY_DETECTION_RANGE
    );

    if (nearbyEnemies.length === 0) {
      return false;
    }

    // 初始化战斗状态
    this.combatState.isInCombat = true;
    this.combatState.participants = [player, ...nearbyEnemies];
    this.combatState.currentTurn = 0;
    this.combatState.turnOrder = this.calculateTurnOrder([player, ...nearbyEnemies]);
    this.combatState.lastActionTime = Date.now();

    return true;
  }

  /**
   * 结束战斗
   */
  endCombat(): void {
    this.combatState.isInCombat = false;
    this.combatState.participants = [];
    this.combatState.turnOrder = [];
    this.combatHistory = [];
  }

  /**
   * 执行攻击
   * @param attackerId - 攻击者ID
   * @param targetId - 目标ID
   * @returns 攻击结果
   */
  performAttack(attackerId: string, targetId: string): CombatResult | null {
    const attacker = this.findEntity(attackerId);
    const target = this.findEntity(targetId);

    if (!attacker || !target || !attacker.isAlive || !target.isAlive) {
      return null;
    }

    // 检查攻击冷却
    const now = Date.now();
    if (now - this.lastAttackTime < COMBAT_COOLDOWN) {
      return null;
    }

    // 检查攻击范围
    if (this.calculateDistance(attacker.position, target.position) > COMBAT_RANGE) {
      return null;
    }

    // 计算伤害
    const damage = this.calculateDamage(attacker, target);
    const isCritical = this.isCriticalHit(attacker);
    const finalDamage = isCritical ? Math.floor(damage * 1.5) : damage;

    // 应用伤害
    target.health = Math.max(0, target.health - finalDamage);
    if (target.health <= 0) {
      target.isAlive = false;
    }

    // 更新攻击时间
    this.lastAttackTime = now;

    // 创建战斗结果
    const result: CombatResult = {
      attacker: attackerId,
      target: targetId,
      action: { type: 'attack', damage: finalDamage },
      damage: finalDamage,
      isCritical,
      targetDefeated: !target.isAlive,
      experience: target.isAlive ? 0 : this.calculateExperience(target),
      gold: target.isAlive ? 0 : this.calculateGold(target),
      items: target.isAlive ? [] : this.generateLoot(target)
    };

    this.combatHistory.push(result);

    // 检查战斗是否结束
    this.checkCombatEnd();

    return result;
  }

  /**
   * 计算伤害
   * @param attacker - 攻击者
   * @param target - 目标
   * @returns 伤害值
   */
  private calculateDamage(attacker: CombatEntity, target: CombatEntity): number {
    const baseDamage = attacker.attack;
    const defense = target.defense;
    const levelDifference = attacker.level - target.level;
    
    // 基础伤害计算
    let damage = Math.max(1, baseDamage - defense);
    
    // 等级差异影响
    if (levelDifference > 0) {
      damage = Math.floor(damage * (1 + levelDifference * 0.1));
    } else if (levelDifference < 0) {
      damage = Math.floor(damage * (1 + levelDifference * 0.05));
    }
    
    // 随机波动 (±10%)
    const variation = 0.9 + Math.random() * 0.2;
    damage = Math.floor(damage * variation);
    
    return Math.max(1, damage);
  }

  /**
   * 检查是否暴击
   * @param attacker - 攻击者
   * @returns 是否暴击
   */
  private isCriticalHit(attacker: CombatEntity): boolean {
    // 基础暴击率 5%，每级增加 1%
    const criticalChance = 0.05 + (attacker.level - 1) * 0.01;
    return Math.random() < criticalChance;
  }

  /**
   * 计算经验值奖励
   * @param target - 被击败的目标
   * @returns 经验值
   */
  private calculateExperience(target: CombatEntity): number {
    return target.level * 10;
  }

  /**
   * 计算金币奖励
   * @param target - 被击败的目标
   * @returns 金币数量
   */
  private calculateGold(target: CombatEntity): number {
    return Math.floor(target.level * 5 + Math.random() * 10);
  }

  /**
   * 生成战利品
   * @param target - 被击败的目标
   * @returns 物品ID数组
   */
  private generateLoot(target: CombatEntity): string[] {
    const loot: string[] = [];
    
    // 根据敌人等级和类型生成战利品
    if (target.level >= 5) {
      loot.push('health_potion');
    }
    
    if (target.level >= 10) {
      loot.push('mana_potion');
    }
    
    // 随机掉落
    if (Math.random() < 0.3) {
      loot.push('coin');
    }
    
    return loot;
  }

  /**
   * 计算距离
   * @param pos1 - 位置1
   * @param pos2 - 位置2
   * @returns 距离
   */
  private calculateDistance(pos1: { x: number; y: number }, pos2: { x: number; y: number }): number {
    const dx = pos1.x - pos2.x;
    const dy = pos1.y - pos2.y;
    return Math.sqrt(dx * dx + dy * dy);
  }

  /**
   * 计算回合顺序
   * @param entities - 实体数组
   * @returns 回合顺序ID数组
   */
  private calculateTurnOrder(entities: CombatEntity[]): string[] {
    return entities
      .sort((a, b) => b.speed - a.speed)
      .map(entity => entity.id);
  }

  /**
   * 查找实体
   * @param id - 实体ID
   * @returns 实体对象
   */
  private findEntity(id: string): CombatEntity | undefined {
    return this.combatState.participants.find(entity => entity.id === id);
  }

  /**
   * 检查战斗是否结束
   */
  private checkCombatEnd(): void {
    const aliveParticipants = this.combatState.participants.filter(entity => entity.isAlive);
    const players = aliveParticipants.filter(entity => entity.isPlayer);
    const enemies = aliveParticipants.filter(entity => !entity.isPlayer);

    if (players.length === 0) {
      // 玩家失败
      this.endCombat();
    } else if (enemies.length === 0) {
      // 玩家胜利
      this.endCombat();
    }
  }

  /**
   * 获取战斗状态
   * @returns 战斗状态
   */
  getCombatState(): CombatState {
    return { ...this.combatState };
  }

  /**
   * 检查是否在战斗中
   * @returns 是否在战斗中
   */
  isInCombat(): boolean {
    return this.combatState.isInCombat;
  }

  /**
   * 获取战斗历史
   * @returns 战斗结果数组
   */
  getCombatHistory(): CombatResult[] {
    return [...this.combatHistory];
  }

  /**
   * 获取当前回合的实体
   * @returns 当前回合实体
   */
  getCurrentTurnEntity(): CombatEntity | null {
    if (!this.combatState.isInCombat || this.combatState.turnOrder.length === 0) {
      return null;
    }

    const currentEntityId = this.combatState.turnOrder[this.combatState.currentTurn];
    return this.findEntity(currentEntityId) || null;
  }

  /**
   * 下一回合
   */
  nextTurn(): void {
    if (!this.combatState.isInCombat) {
      return;
    }

    this.combatState.currentTurn = (this.combatState.currentTurn + 1) % this.combatState.turnOrder.length;
    this.combatState.lastActionTime = Date.now();
  }

  /**
   * 获取可用目标
   * @param attackerId - 攻击者ID
   * @returns 可用目标数组
   */
  getAvailableTargets(attackerId: string): CombatEntity[] {
    const attacker = this.findEntity(attackerId);
    if (!attacker) {
      return [];
    }

    return this.combatState.participants.filter(entity => 
      entity.id !== attackerId && 
      entity.isAlive && 
      this.calculateDistance(attacker.position, entity.position) <= COMBAT_RANGE
    );
  }

  /**
   * 保存战斗数据
   * @returns 战斗数据
   */
  saveData() {
    return {
      combatState: this.combatState,
      lastAttackTime: this.lastAttackTime,
      combatHistory: this.combatHistory
    };
  }

  /**
   * 加载战斗数据
   * @param data - 战斗数据
   */
  loadData(data: any) {
    this.combatState = data.combatState || this.combatState;
    this.lastAttackTime = data.lastAttackTime || 0;
    this.combatHistory = data.combatHistory || [];
  }
}
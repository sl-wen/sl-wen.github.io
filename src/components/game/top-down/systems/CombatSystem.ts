import { COMBAT_RANGE, COMBAT_DAMAGE, COMBAT_COOLDOWN, ENEMY_DETECTION_RANGE } from '../ref/constants';
import { storage } from '../utils';

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
  // 新增属性
  magicAttack?: number;
  magicDefense?: number;
  criticalRate?: number;
  criticalDamage?: number;
  dodgeRate?: number;
  blockRate?: number;
  statusEffects?: StatusEffect[];
  equipment?: Equipment;
  skills?: Skill[];
  experience?: number;
  maxExperience?: number;
  gold?: number;
  faction?: string;
  aiType?: 'aggressive' | 'defensive' | 'support' | 'flee';
  aggressionLevel?: number;
  fearThreshold?: number;
  lastActionTime?: number;
  actionCooldown?: number;
}

// 状态效果接口
export interface StatusEffect {
  id: string;
  name: string;
  type: 'buff' | 'debuff' | 'dot' | 'hot';
  duration: number;
  remainingTurns: number;
  effects: {
    attack?: number;
    defense?: number;
    speed?: number;
    health?: number;
    magicAttack?: number;
    magicDefense?: number;
    criticalRate?: number;
    dodgeRate?: number;
    blockRate?: number;
  };
  description: string;
  icon?: string;
}

// 装备接口
export interface Equipment {
  weapon?: Item;
  armor?: Item;
  helmet?: Item;
  boots?: Item;
  accessory1?: Item;
  accessory2?: Item;
}

// 物品接口
export interface Item {
  id: string;
  name: string;
  type: 'weapon' | 'armor' | 'helmet' | 'boots' | 'accessory' | 'consumable';
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
  level: number;
  stats: {
    attack?: number;
    defense?: number;
    magicAttack?: number;
    magicDefense?: number;
    criticalRate?: number;
    criticalDamage?: number;
    dodgeRate?: number;
    blockRate?: number;
    health?: number;
    speed?: number;
  };
  effects?: StatusEffect[];
  description: string;
  icon?: string;
}

// 技能接口
export interface Skill {
  id: string;
  name: string;
  type: 'physical' | 'magical' | 'support' | 'debuff';
  damage: number;
  healing?: number;
  mpCost: number;
  cooldown: number;
  currentCooldown: number;
  range: number;
  targetType: 'single' | 'all' | 'self' | 'enemy' | 'ally';
  effects?: StatusEffect[];
  description: string;
  icon?: string;
  animation?: string;
}

// 战斗动作接口
export interface CombatAction {
  type: 'attack' | 'defend' | 'item' | 'flee' | 'skill' | 'magic' | 'special';
  target?: string;
  itemId?: string;
  skillId?: string;
  damage?: number;
  healing?: number;
  effects?: StatusEffect[];
  isCritical?: boolean;
  isDodged?: boolean;
  isBlocked?: boolean;
}

// 战斗结果接口
export interface CombatResult {
  attacker: string;
  target: string;
  action: CombatAction;
  damage: number;
  healing?: number;
  isCritical: boolean;
  isDodged: boolean;
  isBlocked: boolean;
  targetDefeated: boolean;
  experience: number;
  gold: number;
  items: string[];
  statusEffectsApplied?: StatusEffect[];
  statusEffectsRemoved?: StatusEffect[];
  skillUsed?: Skill;
  comboCount?: number;
  chainReaction?: boolean;
  environmentalEffect?: string;
}

// 战斗状态接口
export interface CombatState {
  isInCombat: boolean;
  participants: CombatEntity[];
  currentTurn: number;
  turnOrder: string[];
  lastActionTime: number;
  // 新增属性
  phase: 'preparation' | 'action' | 'resolution' | 'cleanup';
  round: number;
  maxRounds: number;
  environment: CombatEnvironment;
  weather: 'clear' | 'rain' | 'storm' | 'fog';
  timeOfDay: 'day' | 'night' | 'dawn' | 'dusk';
  terrain: 'grass' | 'forest' | 'mountain' | 'water' | 'cave';
  chainReactionCount: number;
  comboMultiplier: number;
  lastComboTime: number;
}

// 战斗环境接口
export interface CombatEnvironment {
  type: string;
  effects: {
    attackBonus?: number;
    defenseBonus?: number;
    speedBonus?: number;
    magicBonus?: number;
    criticalBonus?: number;
    dodgeBonus?: number;
  };
  hazards?: string[];
  cover?: string[];
  interactiveElements?: string[];
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
      lastActionTime: 0,
      phase: 'preparation',
      round: 1,
      maxRounds: 50,
      environment: {
        type: 'default',
        effects: {},
        hazards: [],
        cover: [],
        interactiveElements: []
      },
      weather: 'clear',
      timeOfDay: 'day',
      terrain: 'grass',
      chainReactionCount: 0,
      comboMultiplier: 1.0,
      lastComboTime: 0
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

  // 新增的高级战斗方法

  /**
   * 执行技能攻击
   * @param attackerId - 攻击者ID
   * @param targetId - 目标ID
   * @param skillId - 技能ID
   * @returns 攻击结果
   */
  performSkillAttack(attackerId: string, targetId: string, skillId: string): CombatResult | null {
    const attacker = this.findEntity(attackerId);
    const target = this.findEntity(targetId);
    const skill = attacker?.skills?.find(s => s.id === skillId);

    if (!attacker || !target || !skill || !attacker.isAlive || !target.isAlive) {
      return null;
    }

    // 检查技能冷却
    if (skill.currentCooldown > 0) {
      return null;
    }

    // 检查MP消耗
    if (attacker.magicAttack && attacker.magicAttack < skill.mpCost) {
      return null;
    }

    // 检查攻击范围
    if (this.calculateDistance(attacker.position, target.position) > skill.range) {
      return null;
    }

    // 计算技能伤害
    const damage = this.calculateSkillDamage(attacker, target, skill);
    const isCritical = this.isCriticalHit(attacker);
    const finalDamage = isCritical ? Math.floor(damage * (attacker.criticalDamage || 1.5)) : damage;

    // 应用伤害
    target.health = Math.max(0, target.health - finalDamage);
    if (target.health <= 0) {
      target.isAlive = false;
    }

    // 消耗MP
    if (attacker.magicAttack) {
      attacker.magicAttack -= skill.mpCost;
    }

    // 设置技能冷却
    skill.currentCooldown = skill.cooldown;

    // 应用状态效果
    const statusEffectsApplied: StatusEffect[] = [];
    if (skill.effects) {
      skill.effects.forEach(effect => {
        const appliedEffect = this.applyStatusEffect(target, effect);
        if (appliedEffect) {
          statusEffectsApplied.push(appliedEffect);
        }
      });
    }

    // 创建战斗结果
    const result: CombatResult = {
      attacker: attackerId,
      target: targetId,
      action: { 
        type: 'skill', 
        skillId: skillId,
        damage: finalDamage,
        isCritical,
        effects: statusEffectsApplied
      },
      damage: finalDamage,
      isCritical,
      targetDefeated: !target.isAlive,
      experience: target.isAlive ? 0 : this.calculateExperience(target),
      gold: target.isAlive ? 0 : this.calculateGold(target),
      items: target.isAlive ? [] : this.generateLoot(target),
      statusEffectsApplied,
      skillUsed: skill
    };

    this.combatHistory.push(result);
    this.checkCombatEnd();

    return result;
  }

  /**
   * 计算技能伤害
   * @param attacker - 攻击者
   * @param target - 目标
   * @param skill - 技能
   * @returns 伤害值
   */
  private calculateSkillDamage(attacker: CombatEntity, target: CombatEntity, skill: Skill): number {
    let baseDamage = skill.damage;

    // 根据技能类型调整伤害
    switch (skill.type) {
      case 'physical':
        baseDamage += (attacker.attack || 0);
        baseDamage -= (target.defense || 0);
        break;
      case 'magical':
        baseDamage += (attacker.magicAttack || 0);
        baseDamage -= (target.magicDefense || 0);
        break;
      case 'support':
        return skill.healing || 0;
      case 'debuff':
        baseDamage = Math.floor(baseDamage * 0.7); // 减益技能伤害较低
        break;
    }

    // 环境效果影响
    baseDamage = this.applyEnvironmentalEffects(baseDamage, 'damage');

    // 随机波动 (±15%)
    const variation = 0.85 + Math.random() * 0.3;
    baseDamage = Math.floor(baseDamage * variation);

    return Math.max(1, baseDamage);
  }

  /**
   * 应用状态效果
   * @param target - 目标实体
   * @param effect - 状态效果
   * @returns 应用的状态效果
   */
  private applyStatusEffect(target: CombatEntity, effect: StatusEffect): StatusEffect | null {
    if (!target.statusEffects) {
      target.statusEffects = [];
    }

    // 检查是否已有相同效果
    const existingEffect = target.statusEffects.find(e => e.id === effect.id);
    if (existingEffect) {
      // 刷新持续时间
      existingEffect.remainingTurns = Math.max(existingEffect.remainingTurns, effect.duration);
      return existingEffect;
    }

    // 应用新效果
    const appliedEffect = { ...effect, remainingTurns: effect.duration };
    target.statusEffects.push(appliedEffect);

    // 立即应用效果
    this.applyEffectStats(target, effect.effects);

    return appliedEffect;
  }

  /**
   * 应用效果属性
   * @param target - 目标实体
   * @param effects - 效果属性
   */
  private applyEffectStats(target: CombatEntity, effects: any): void {
    if (effects.attack) target.attack += effects.attack;
    if (effects.defense) target.defense += effects.defense;
    if (effects.speed) target.speed += effects.speed;
    if (effects.health) {
      target.health = Math.min(target.maxHealth, target.health + effects.health);
    }
    if (effects.magicAttack) target.magicAttack = (target.magicAttack || 0) + effects.magicAttack;
    if (effects.magicDefense) target.magicDefense = (target.magicDefense || 0) + effects.magicDefense;
    if (effects.criticalRate) target.criticalRate = (target.criticalRate || 0) + effects.criticalRate;
    if (effects.dodgeRate) target.dodgeRate = (target.dodgeRate || 0) + effects.dodgeRate;
    if (effects.blockRate) target.blockRate = (target.blockRate || 0) + effects.blockRate;
  }

  /**
   * 移除状态效果
   * @param target - 目标实体
   * @param effectId - 效果ID
   */
  private removeStatusEffect(target: CombatEntity, effectId: string): void {
    if (!target.statusEffects) return;

    const effectIndex = target.statusEffects.findIndex(e => e.id === effectId);
    if (effectIndex !== -1) {
      const effect = target.statusEffects[effectIndex];
      
      // 移除效果属性
      this.removeEffectStats(target, effect.effects);
      
      target.statusEffects.splice(effectIndex, 1);
    }
  }

  /**
   * 移除效果属性
   * @param target - 目标实体
   * @param effects - 效果属性
   */
  private removeEffectStats(target: CombatEntity, effects: any): void {
    if (effects.attack) target.attack -= effects.attack;
    if (effects.defense) target.defense -= effects.defense;
    if (effects.speed) target.speed -= effects.speed;
    if (effects.magicAttack) target.magicAttack = Math.max(0, (target.magicAttack || 0) - effects.magicAttack);
    if (effects.magicDefense) target.magicDefense = Math.max(0, (target.magicDefense || 0) - effects.magicDefense);
    if (effects.criticalRate) target.criticalRate = Math.max(0, (target.criticalRate || 0) - effects.criticalRate);
    if (effects.dodgeRate) target.dodgeRate = Math.max(0, (target.dodgeRate || 0) - effects.dodgeRate);
    if (effects.blockRate) target.blockRate = Math.max(0, (target.blockRate || 0) - effects.blockRate);
  }

  /**
   * 更新状态效果
   */
  updateStatusEffects(): void {
    this.combatState.participants.forEach(entity => {
      if (!entity.statusEffects) return;

      const effectsToRemove: string[] = [];
      
      entity.statusEffects.forEach(effect => {
        effect.remainingTurns--;
        
        // 处理持续效果
        if (effect.type === 'dot' && effect.remainingTurns > 0) {
          // 持续伤害
          const dotDamage = Math.floor((effect.effects.health || 0) * -1);
          entity.health = Math.max(0, entity.health + dotDamage);
        } else if (effect.type === 'hot' && effect.remainingTurns > 0) {
          // 持续治疗
          const hotHealing = effect.effects.health || 0;
          entity.health = Math.min(entity.maxHealth, entity.health + hotHealing);
        }
        
        if (effect.remainingTurns <= 0) {
          effectsToRemove.push(effect.id);
        }
      });

      // 移除过期效果
      effectsToRemove.forEach(effectId => {
        this.removeStatusEffect(entity, effectId);
      });
    });
  }

  /**
   * 检查闪避
   * @param attacker - 攻击者
   * @param target - 目标
   * @returns 是否闪避
   */
  private checkDodge(attacker: CombatEntity, target: CombatEntity): boolean {
    const dodgeRate = target.dodgeRate || 0;
    const accuracy = 100 - (attacker.criticalRate || 0); // 简化精度计算
    const finalDodgeChance = Math.max(0, dodgeRate - accuracy);
    
    return Math.random() * 100 < finalDodgeChance;
  }

  /**
   * 检查格挡
   * @param target - 目标
   * @returns 是否格挡
   */
  private checkBlock(target: CombatEntity): boolean {
    const blockRate = target.blockRate || 0;
    return Math.random() * 100 < blockRate;
  }

  /**
   * 应用环境效果
   * @param value - 原始值
   * @param type - 效果类型
   * @returns 调整后的值
   */
  private applyEnvironmentalEffects(value: number, type: string): number {
    const env = this.combatState.environment;
    
    switch (type) {
      case 'damage':
        if (env.effects.attackBonus) value += env.effects.attackBonus;
        break;
      case 'defense':
        if (env.effects.defenseBonus) value += env.effects.defenseBonus;
        break;
      case 'speed':
        if (env.effects.speedBonus) value += env.effects.speedBonus;
        break;
      case 'magic':
        if (env.effects.magicBonus) value += env.effects.magicBonus;
        break;
      case 'critical':
        if (env.effects.criticalBonus) value += env.effects.criticalBonus;
        break;
      case 'dodge':
        if (env.effects.dodgeBonus) value += env.effects.dodgeBonus;
        break;
    }
    
    return value;
  }

  /**
   * 设置战斗环境
   * @param environment - 环境配置
   */
  setCombatEnvironment(environment: CombatEnvironment): void {
    this.combatState.environment = environment;
  }

  /**
   * 设置天气
   * @param weather - 天气类型
   */
  setWeather(weather: 'clear' | 'rain' | 'storm' | 'fog'): void {
    this.combatState.weather = weather;
  }

  /**
   * 设置地形
   * @param terrain - 地形类型
   */
  setTerrain(terrain: 'grass' | 'forest' | 'mountain' | 'water' | 'cave'): void {
    this.combatState.terrain = terrain;
  }

  /**
   * 执行连击
   * @param attackerId - 攻击者ID
   * @param targets - 目标数组
   * @returns 连击结果
   */
  performCombo(attackerId: string, targets: string[]): CombatResult[] {
    const results: CombatResult[] = [];
    let comboCount = 0;

    targets.forEach((targetId, index) => {
      const result = this.performAttack(attackerId, targetId);
      if (result) {
        comboCount++;
        result.comboCount = comboCount;
        results.push(result);
        
        // 连击伤害递增
        if (comboCount > 1) {
          const damageIncrease = 1 + (comboCount - 1) * 0.2; // 每次连击增加20%伤害
          result.damage = Math.floor(result.damage * damageIncrease);
        }
      }
    });

    // 更新连击状态
    this.combatState.comboMultiplier = 1 + comboCount * 0.1;
    this.combatState.lastComboTime = Date.now();

    return results;
  }

  /**
   * 执行连锁反应
   * @param triggerId - 触发者ID
   * @param chainTargets - 连锁目标
   * @returns 连锁结果
   */
  performChainReaction(triggerId: string, chainTargets: string[]): CombatResult[] {
    const results: CombatResult[] = [];
    let chainCount = 0;

    chainTargets.forEach(targetId => {
      const result = this.performAttack(triggerId, targetId);
      if (result) {
        chainCount++;
        result.chainReaction = true;
        results.push(result);
      }
    });

    this.combatState.chainReactionCount = chainCount;
    return results;
  }

  /**
   * 获取可用技能
   * @param entityId - 实体ID
   * @returns 可用技能列表
   */
  getAvailableSkills(entityId: string): Skill[] {
    const entity = this.findEntity(entityId);
    if (!entity || !entity.skills) return [];

    return entity.skills.filter(skill => 
      skill.currentCooldown === 0 && 
      (entity.magicAttack || 0) >= skill.mpCost
    );
  }

  /**
   * 获取状态效果
   * @param entityId - 实体ID
   * @returns 状态效果列表
   */
  getStatusEffects(entityId: string): StatusEffect[] {
    const entity = this.findEntity(entityId);
    return entity?.statusEffects || [];
  }

  /**
   * 获取战斗统计
   * @returns 战斗统计信息
   */
  getCombatStats(): any {
    const totalDamage = this.combatHistory.reduce((sum, result) => sum + result.damage, 0);
    const criticalHits = this.combatHistory.filter(result => result.isCritical).length;
    const totalHealing = this.combatHistory.reduce((sum, result) => sum + (result.healing || 0), 0);
    const combos = this.combatHistory.filter(result => result.comboCount && result.comboCount > 1).length;
    const chainReactions = this.combatHistory.filter(result => result.chainReaction).length;

    return {
      totalDamage,
      criticalHits,
      totalHealing,
      combos,
      chainReactions,
      totalActions: this.combatHistory.length,
      averageDamage: this.combatHistory.length > 0 ? Math.floor(totalDamage / this.combatHistory.length) : 0,
      criticalRate: this.combatHistory.length > 0 ? (criticalHits / this.combatHistory.length) * 100 : 0
    };
  }

  /**
   * 保存战斗数据
   */
  saveCombatData(): void {
    const combatData = {
      state: this.combatState,
      history: this.combatHistory,
      stats: this.getCombatStats(),
      timestamp: Date.now()
    };
    
    storage.set('combat_data', combatData);
  }

  /**
   * 加载战斗数据
   */
  loadCombatData(): void {
    const combatData = storage.get('combat_data', null);
    if (combatData) {
      this.combatState = combatData.state;
      this.combatHistory = combatData.history;
    }
  }
}
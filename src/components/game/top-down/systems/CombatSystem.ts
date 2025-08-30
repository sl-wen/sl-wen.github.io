import * as Phaser from 'phaser';
import { MoveDirection } from './PlayerController';

// 战斗状态枚举
export enum CombatState {
  IDLE = 'idle',
  ATTACKING = 'attacking',
  DEFENDING = 'defending',
  STUNNED = 'stunned',
  DEAD = 'dead'
}

// 攻击类型枚举
export enum AttackType {
  MELEE = 'melee',
  RANGED = 'ranged',
  MAGIC = 'magic',
  SPECIAL = 'special'
}

// 伤害类型枚举
export enum DamageType {
  PHYSICAL = 'physical',
  MAGICAL = 'magical',
  TRUE = 'true',
  FIRE = 'fire',
  ICE = 'ice',
  LIGHTNING = 'lightning'
}

// 战斗实体接口
export interface CombatEntity {
  id: string;
  sprite: Phaser.GameObjects.Sprite;
  health: number;
  maxHealth: number;
  attack: number;
  defense: number;
  speed: number;
  level: number;
  experience: number;
  state: CombatState;
  team: 'player' | 'enemy' | 'neutral';
  position: { x: number; y: number };
}

// 攻击配置接口
export interface AttackConfig {
  type: AttackType;
  damageType: DamageType;
  baseDamage: number;
  range: number;
  cooldown: number;
  criticalChance: number;
  criticalMultiplier: number;
  animationDuration: number;
  soundKey: string;
  effectKey: string;
}

// 伤害信息接口
export interface DamageInfo {
  amount: number;
  type: DamageType;
  isCritical: boolean;
  isBlocked: boolean;
  isDodged: boolean;
  position: { x: number; y: number };
  target: CombatEntity;
  attacker: CombatEntity;
}

// 战斗事件接口
export interface CombatEvent {
  type: 'attack' | 'damage' | 'heal' | 'death' | 'level_up';
  entity: CombatEntity;
  target?: CombatEntity;
  damage?: DamageInfo;
  healAmount?: number;
  experience?: number;
}

export class CombatSystem {
  private static instance: CombatSystem;
  private scene: Phaser.Scene;
  private entities: Map<string, CombatEntity> = new Map();
  private attackConfigs: Map<string, AttackConfig> = new Map();
  private damageTexts: Phaser.GameObjects.Text[] = [];
  private combatEffects: Phaser.GameObjects.Sprite[] = [];
  private eventListeners: Map<string, ((event: CombatEvent) => void)[]> = new Map();
  private attackCooldowns: Map<string, number> = new Map();
  private lastUpdateTime: number = 0;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.initializeAttackConfigs();
    this.setupEventListeners();
  }

  // 单例模式
  public static getInstance(scene?: Phaser.Scene): CombatSystem {
    if (!CombatSystem.instance && scene) {
      CombatSystem.instance = new CombatSystem(scene);
    }
    return CombatSystem.instance;
  }

  // 初始化攻击配置
  private initializeAttackConfigs(): void {
    // 近战攻击
    this.attackConfigs.set('melee_basic', {
      type: AttackType.MELEE,
      damageType: DamageType.PHYSICAL,
      baseDamage: 10,
      range: 32,
      cooldown: 500,
      criticalChance: 0.15,
      criticalMultiplier: 2.0,
      animationDuration: 300,
      soundKey: 'sfx-attack',
      effectKey: 'attack-effect'
    });

    // 远程攻击
    this.attackConfigs.set('ranged_basic', {
      type: AttackType.RANGED,
      damageType: DamageType.PHYSICAL,
      baseDamage: 8,
      range: 128,
      cooldown: 800,
      criticalChance: 0.20,
      criticalMultiplier: 2.5,
      animationDuration: 400,
      soundKey: 'sfx-ranged',
      effectKey: 'ranged-effect'
    });

    // 魔法攻击
    this.attackConfigs.set('magic_fire', {
      type: AttackType.MAGIC,
      damageType: DamageType.FIRE,
      baseDamage: 15,
      range: 96,
      cooldown: 1200,
      criticalChance: 0.25,
      criticalMultiplier: 2.0,
      animationDuration: 600,
      soundKey: 'sfx-magic',
      effectKey: 'fire-effect'
    });

    // 特殊攻击
    this.attackConfigs.set('special_spin', {
      type: AttackType.SPECIAL,
      damageType: DamageType.PHYSICAL,
      baseDamage: 20,
      range: 64,
      cooldown: 2000,
      criticalChance: 0.30,
      criticalMultiplier: 3.0,
      animationDuration: 800,
      soundKey: 'sfx-special',
      effectKey: 'spin-effect'
    });
  }

  // 设置事件监听器
  private setupEventListeners(): void {
    // 监听攻击输入
    if (this.scene.input.keyboard) {
      this.scene.input.keyboard.on('keydown-SPACE', () => {
        this.handlePlayerAttack('melee_basic');
      });

      this.scene.input.keyboard.on('keydown-R', () => {
        this.handlePlayerAttack('ranged_basic');
      });

      this.scene.input.keyboard.on('keydown-F', () => {
        this.handlePlayerAttack('magic_fire');
      });

      this.scene.input.keyboard.on('keydown-Q', () => {
        this.handlePlayerAttack('special_spin');
      });
    }
  }

  // 注册战斗实体
  public registerEntity(entity: CombatEntity): void {
    this.entities.set(entity.id, entity);
    console.log(`Combat entity registered: ${entity.id}`);
  }

  // 注销战斗实体
  public unregisterEntity(entityId: string): void {
    this.entities.delete(entityId);
    this.attackCooldowns.delete(entityId);
    console.log(`Combat entity unregistered: ${entityId}`);
  }

  // 处理玩家攻击
  private handlePlayerAttack(attackKey: string): void {
    const player = this.entities.get('player');
    if (!player || player.state !== CombatState.IDLE) {
      return;
    }

    // 检查冷却时间
    if (this.isOnCooldown('player', attackKey)) {
      return;
    }

    // 寻找目标
    const target = this.findNearestEnemy(player);
    if (!target) {
      return;
    }

    // 执行攻击
    this.performAttack(player, target, attackKey);
  }

  // 寻找最近的敌人
  private findNearestEnemy(attacker: CombatEntity): CombatEntity | null {
    let nearestEnemy: CombatEntity | null = null;
    let nearestDistance = Infinity;

    this.entities.forEach(entity => {
      if (entity.team !== attacker.team && entity.state !== CombatState.DEAD) {
        const distance = Phaser.Math.Distance.Between(
          attacker.position.x, attacker.position.y,
          entity.position.x, entity.position.y
        );

        if (distance < nearestDistance) {
          nearestDistance = distance;
          nearestEnemy = entity;
        }
      }
    });

    return nearestEnemy;
  }

  // 执行攻击
  public performAttack(attacker: CombatEntity, target: CombatEntity, attackKey: string): void {
    const config = this.attackConfigs.get(attackKey);
    if (!config) {
      console.error(`Attack config not found: ${attackKey}`);
      return;
    }

    // 检查距离
    const distance = Phaser.Math.Distance.Between(
      attacker.position.x, attacker.position.y,
      target.position.x, target.position.y
    );

    if (distance > config.range) {
      console.log('Target out of range');
      return;
    }

    // 设置冷却时间
    this.setCooldown(attacker.id, attackKey, config.cooldown);

    // 更新攻击者状态
    attacker.state = CombatState.ATTACKING;

    // 播放攻击动画
    this.playAttackAnimation(attacker, config);

    // 播放攻击音效
    this.playAttackSound(config.soundKey);

    // 创建攻击特效
    this.createAttackEffect(attacker, target, config);

    // 延迟计算伤害（等待动画播放）
    this.scene.time.delayedCall(config.animationDuration * 0.5, () => {
      const damage = this.calculateDamage(attacker, target, config);
      this.applyDamage(target, damage);
    });

    // 恢复攻击者状态
    this.scene.time.delayedCall(config.animationDuration, () => {
      attacker.state = CombatState.IDLE;
    });
  }

  // 播放攻击动画
  private playAttackAnimation(attacker: CombatEntity, config: AttackConfig): void {
    const direction = this.getDirectionToTarget(attacker, this.findNearestEnemy(attacker));
    let animationKey = '';

    switch (config.type) {
      case AttackType.MELEE:
        animationKey = `hero_attack_${direction}`;
        break;
      case AttackType.RANGED:
        animationKey = `hero_ranged_${direction}`;
        break;
      case AttackType.MAGIC:
        animationKey = `hero_magic_${direction}`;
        break;
      case AttackType.SPECIAL:
        animationKey = 'hero_special_spin';
        break;
    }

    if (animationKey) {
      attacker.sprite.play(animationKey, true);
    }
  }

  // 获取朝向目标的方向
  private getDirectionToTarget(attacker: CombatEntity, target: CombatEntity | null): string {
    if (!target) return 'down';

    const deltaX = target.position.x - attacker.position.x;
    const deltaY = target.position.y - attacker.position.y;

    if (Math.abs(deltaX) > Math.abs(deltaY)) {
      return deltaX > 0 ? 'right' : 'left';
    } else {
      return deltaY > 0 ? 'down' : 'up';
    }
  }

  // 播放攻击音效
  private playAttackSound(soundKey: string): void {
    try {
      this.scene.sound.play(soundKey);
    } catch (error) {
      console.warn(`Sound not found: ${soundKey}`);
    }
  }

  // 创建攻击特效
  private createAttackEffect(attacker: CombatEntity, target: CombatEntity, config: AttackConfig): void {
    const effect = this.scene.add.sprite(
      target.position.x,
      target.position.y,
      config.effectKey
    );

    effect.setDepth(100);
    effect.play(config.effectKey, true);

    // 特效动画完成后销毁
    effect.once('animationcomplete', () => {
      effect.destroy();
    });

    this.combatEffects.push(effect);
  }

  // 计算伤害
  private calculateDamage(attacker: CombatEntity, target: CombatEntity, config: AttackConfig): DamageInfo {
    // 基础伤害
    let damage = config.baseDamage + attacker.attack - target.defense;
    damage = Math.max(1, damage); // 最小伤害为1

    // 暴击判定
    const isCritical = Math.random() < config.criticalChance;
    if (isCritical) {
      damage = Math.floor(damage * config.criticalMultiplier);
    }

    // 闪避判定
    const dodgeChance = target.speed * 0.01; // 速度影响闪避率
    const isDodged = Math.random() < dodgeChance;

    // 格挡判定
    const blockChance = target.defense * 0.005; // 防御影响格挡率
    const isBlocked = Math.random() < blockChance;

    if (isDodged) {
      damage = 0;
    } else if (isBlocked) {
      damage = Math.floor(damage * 0.5);
    }

    return {
      amount: damage,
      type: config.damageType,
      isCritical,
      isBlocked,
      isDodged,
      position: { x: target.position.x, y: target.position.y },
      target,
      attacker
    };
  }

  // 应用伤害
  private applyDamage(target: CombatEntity, damage: DamageInfo): void {
    if (damage.isDodged) {
      this.showDodgeText(target);
      return;
    }

    // 减少生命值
    target.health = Math.max(0, target.health - damage.amount);

    // 显示伤害数字
    this.showDamageText(damage);

    // 播放受伤动画
    this.playDamageAnimation(target, damage);

    // 发送伤害事件
    this.emitEvent('damage', {
      type: 'damage',
      entity: target,
      target,
      damage
    });

    // 检查死亡
    if (target.health <= 0) {
      this.handleDeath(target);
    } else {
      // 播放受伤音效
      this.playDamageSound(damage);
    }
  }

  // 显示伤害数字
  private showDamageText(damage: DamageInfo): void {
    const { target, amount, isCritical, isBlocked, isDodged } = damage;
    
    if (isDodged) {
      this.showDodgeText(target);
      return;
    }

    const text = this.scene.add.text(
      target.position.x + (Math.random() - 0.5) * 20,
      target.position.y - 20,
      amount.toString(),
      {
        fontSize: isCritical ? '24px' : '16px',
        color: this.getDamageColor(damage.type),
        fontFamily: 'Arial',
        stroke: '#000000',
        strokeThickness: 2
      }
    );

    text.setOrigin(0.5);
    text.setDepth(1000);

    // 添加特殊效果
    if (isCritical) {
      text.setScale(1.5);
      this.scene.tweens.add({
        targets: text,
        scale: 1,
        duration: 300,
        ease: 'Back.easeOut'
      });
    }

    if (isBlocked) {
      text.setText(`BLOCKED ${amount}`);
    }

    // 动画效果
    this.scene.tweens.add({
      targets: text,
      y: text.y - 50,
      alpha: 0,
      duration: 1000,
      ease: 'Power2',
      onComplete: () => {
        text.destroy();
      }
    });

    this.damageTexts.push(text);
  }

  // 显示闪避文本
  private showDodgeText(target: CombatEntity): void {
    const text = this.scene.add.text(
      target.position.x,
      target.position.y - 20,
      'DODGE!',
      {
        fontSize: '16px',
        color: '#00ff00',
        fontFamily: 'Arial',
        stroke: '#000000',
        strokeThickness: 2
      }
    );

    text.setOrigin(0.5);
    text.setDepth(1000);

    this.scene.tweens.add({
      targets: text,
      y: text.y - 30,
      alpha: 0,
      duration: 800,
      ease: 'Power2',
      onComplete: () => {
        text.destroy();
      }
    });
  }

  // 获取伤害颜色
  private getDamageColor(damageType: DamageType): string {
    const colors = {
      [DamageType.PHYSICAL]: '#ffffff',
      [DamageType.MAGICAL]: '#ff00ff',
      [DamageType.TRUE]: '#ffff00',
      [DamageType.FIRE]: '#ff4400',
      [DamageType.ICE]: '#00ffff',
      [DamageType.LIGHTNING]: '#ffff00'
    };
    return colors[damageType] || '#ffffff';
  }

  // 播放受伤动画
  private playDamageAnimation(target: CombatEntity, damage: DamageInfo): void {
    // 闪烁效果
    this.scene.tweens.add({
      targets: target.sprite,
      alpha: 0.5,
      duration: 100,
      yoyo: true,
      repeat: 2
    });

    // 震动效果
    this.scene.tweens.add({
      targets: target.sprite,
      x: target.sprite.x + 2,
      duration: 50,
      yoyo: true,
      repeat: 3
    });
  }

  // 播放受伤音效
  private playDamageSound(damage: DamageInfo): void {
    const soundKey = damage.isCritical ? 'sfx-critical' : 'sfx-damage';
    try {
      this.scene.sound.play(soundKey);
    } catch (error) {
      console.warn(`Sound not found: ${soundKey}`);
    }
  }

  // 处理死亡
  private handleDeath(entity: CombatEntity): void {
    entity.state = CombatState.DEAD;

    // 播放死亡动画
    entity.sprite.play('death', true);

    // 播放死亡音效
    try {
      this.scene.sound.play('sfx-death');
    } catch (error) {
      console.warn('Death sound not found');
    }

    // 发送死亡事件
    this.emitEvent('death', {
      type: 'death',
      entity
    });

    // 如果是敌人死亡，给予经验值
    if (entity.team === 'enemy') {
      const player = this.entities.get('player');
      if (player) {
        const experience = entity.level * 10;
        this.giveExperience(player, experience);
      }
    }

    // 延迟销毁实体
    this.scene.time.delayedCall(2000, () => {
      this.unregisterEntity(entity.id);
      entity.sprite.destroy();
    });
  }

  // 给予经验值
  private giveExperience(entity: CombatEntity, amount: number): void {
    entity.experience += amount;

    // 检查升级
    const experienceNeeded = entity.level * 100;
    if (entity.experience >= experienceNeeded) {
      this.levelUp(entity);
    }

    // 发送经验事件
    this.emitEvent('heal', {
      type: 'heal',
      entity,
      experience: amount
    });
  }

  // 升级
  private levelUp(entity: CombatEntity): void {
    entity.level++;
    entity.experience = 0;
    entity.maxHealth += 10;
    entity.health = entity.maxHealth;
    entity.attack += 2;
    entity.defense += 1;
    entity.speed += 1;

    // 播放升级音效
    try {
      this.scene.sound.play('sfx-levelup');
    } catch (error) {
      console.warn('Level up sound not found');
    }

    // 显示升级文本
    this.showLevelUpText(entity);

    // 发送升级事件
    this.emitEvent('level_up', {
      type: 'level_up',
      entity
    });
  }

  // 显示升级文本
  private showLevelUpText(entity: CombatEntity): void {
    const text = this.scene.add.text(
      entity.position.x,
      entity.position.y - 40,
      'LEVEL UP!',
      {
        fontSize: '20px',
        color: '#ffff00',
        fontFamily: 'Arial',
        stroke: '#000000',
        strokeThickness: 3
      }
    );

    text.setOrigin(0.5);
    text.setDepth(1000);

    this.scene.tweens.add({
      targets: text,
      y: text.y - 40,
      alpha: 0,
      duration: 1500,
      ease: 'Power2',
      onComplete: () => {
        text.destroy();
      }
    });
  }

  // 检查冷却时间
  private isOnCooldown(entityId: string, attackKey: string): boolean {
    const cooldownKey = `${entityId}_${attackKey}`;
    const cooldownEnd = this.attackCooldowns.get(cooldownKey);
    return cooldownEnd ? Date.now() < cooldownEnd : false;
  }

  // 设置冷却时间
  private setCooldown(entityId: string, attackKey: string, duration: number): void {
    const cooldownKey = `${entityId}_${attackKey}`;
    this.attackCooldowns.set(cooldownKey, Date.now() + duration);
  }

  // 更新方法
  public update(time: number, delta: number): void {
    this.lastUpdateTime = time;

    // 清理过期的伤害文本
    this.damageTexts = this.damageTexts.filter(text => text.active);

    // 清理过期的战斗特效
    this.combatEffects = this.combatEffects.filter(effect => effect.active);

    // 更新AI（如果有的话）
    this.updateAI();
  }

  // 更新AI
  private updateAI(): void {
    this.entities.forEach(entity => {
      if (entity.team === 'enemy' && entity.state === CombatState.IDLE) {
        this.updateEnemyAI(entity);
      }
    });
  }

  // 更新敌人AI
  private updateEnemyAI(enemy: CombatEntity): void {
    const player = this.entities.get('player');
    if (!player || player.state === CombatState.DEAD) {
      return;
    }

    const distance = Phaser.Math.Distance.Between(
      enemy.position.x, enemy.position.y,
      player.position.x, player.position.y
    );

    // 简单的AI：在范围内就攻击
    if (distance < 64) {
      this.performAttack(enemy, player, 'melee_basic');
    }
  }

  // 事件监听
  public on(event: string, callback: (event: CombatEvent) => void): void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, []);
    }
    this.eventListeners.get(event)!.push(callback);
  }

  public off(event: string, callback: (event: CombatEvent) => void): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      const index = listeners.indexOf(callback);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    }
  }

  // 发送事件
  private emitEvent(type: string, data: Partial<CombatEvent>): void {
    const event: CombatEvent = {
      type: type as any,
      entity: data.entity!,
      ...data
    };

    const listeners = this.eventListeners.get(type);
    if (listeners) {
      listeners.forEach(callback => {
        try {
          callback(event);
        } catch (error) {
          console.error('Error in combat event listener:', error);
        }
      });
    }
  }

  // 获取实体
  public getEntity(entityId: string): CombatEntity | undefined {
    return this.entities.get(entityId);
  }

  // 获取所有实体
  public getAllEntities(): CombatEntity[] {
    return Array.from(this.entities.values());
  }

  // 获取攻击配置
  public getAttackConfig(attackKey: string): AttackConfig | undefined {
    return this.attackConfigs.get(attackKey);
  }

  // 添加攻击配置
  public addAttackConfig(attackKey: string, config: AttackConfig): void {
    this.attackConfigs.set(attackKey, config);
  }

  // 开始战斗
  public startCombat(playerEntity: CombatEntity, enemies: CombatEntity[]): void {
    // 添加玩家实体
    this.entities.set(playerEntity.id, playerEntity);
    
    // 添加敌人实体
    enemies.forEach(enemy => {
      this.entities.set(enemy.id, enemy);
    });
    
    // 发送战斗开始事件
    this.emitEvent('combat_started', { entity: playerEntity });
  }

  // 获取战斗状态
  public getCombatState(): any {
    return {
      entities: Array.from(this.entities.values()),
      activeCombat: this.entities.size > 1
    };
  }

  // 获取战斗历史
  public getCombatHistory(): any[] {
    // 这里可以返回战斗历史记录
    return [];
  }

  // 保存数据
  public saveData(): any {
    return {
      entities: Array.from(this.entities.entries()),
      attackCooldowns: Array.from(this.attackCooldowns.entries())
    };
  }

  // 加载数据
  public loadData(data: any): void {
    if (data.entities) {
      this.entities = new Map(data.entities);
    }
    if (data.attackCooldowns) {
      this.attackCooldowns = new Map(data.attackCooldowns);
    }
  }

  // 销毁
  public destroy(): void {
    // 清理所有文本和特效
    this.damageTexts.forEach(text => text.destroy());
    this.combatEffects.forEach(effect => effect.destroy());

    // 清理事件监听器
    if (this.scene.input.keyboard) {
      this.scene.input.keyboard.off('keydown-SPACE');
      this.scene.input.keyboard.off('keydown-R');
      this.scene.input.keyboard.off('keydown-F');
      this.scene.input.keyboard.off('keydown-Q');
    }

    // 清理数据
    this.entities.clear();
    this.attackConfigs.clear();
    this.attackCooldowns.clear();
    this.eventListeners.clear();
    this.damageTexts = [];
    this.combatEffects = [];
  }
}
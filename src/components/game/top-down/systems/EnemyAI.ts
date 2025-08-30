import * as Phaser from 'phaser';
import { CombatEntity, CombatState } from './CombatSystem';

// AI类型枚举
export enum AIType {
  PASSIVE = 'passive',
  AGGRESSIVE = 'aggressive',
  DEFENSIVE = 'defensive',
  SUPPORT = 'support',
  FLEE = 'flee',
  BOSS = 'boss'
}

// AI状态枚举
export enum AIState {
  IDLE = 'idle',
  PATROLLING = 'patrolling',
  CHASING = 'chasing',
  ATTACKING = 'attacking',
  RETREATING = 'retreating',
  SEARCHING = 'searching',
  STUNNED = 'stunned'
}

// AI行为配置
export interface AIBehavior {
  type: AIType;
  detectionRange: number;
  attackRange: number;
  chaseRange: number;
  retreatHealth: number;
  aggressionLevel: number;
  fearThreshold: number;
  patrolRadius: number;
  patrolSpeed: number;
  groupBehavior: boolean;
  callForHelp: boolean;
  helpRange: number;
}

// AI目标接口
export interface AITarget {
  entity: CombatEntity;
  distance: number;
  priority: number;
  lastSeen: number;
}

// AI事件接口
export interface AIEvent {
  type: 'detect' | 'attack' | 'retreat' | 'patrol' | 'group';
  entity: CombatEntity;
  target?: CombatEntity;
  position?: { x: number; y: number };
}

export class EnemyAI {
  private scene: Phaser.Scene;
  private entities: Map<string, CombatEntity> = new Map();
  private aiBehaviors: Map<string, AIBehavior> = new Map();
  private aiStates: Map<string, AIState> = new Map();
  private aiTargets: Map<string, AITarget> = new Map();
  private patrolPoints: Map<string, { x: number; y: number }[]> = new Map();
  private groupMembers: Map<string, string[]> = new Map();
  private eventListeners: Map<string, ((event: AIEvent) => void)[]> = new Map();
  private lastUpdateTime: number = 0;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  // 注册AI实体
  public registerAI(entity: CombatEntity, behavior: AIBehavior): void {
    this.entities.set(entity.id, entity);
    this.aiBehaviors.set(entity.id, behavior);
    this.aiStates.set(entity.id, AIState.IDLE);
    this.aiTargets.set(entity.id, null as any);
    
    // 初始化巡逻点
    this.initializePatrolPoints(entity, behavior);
    
    // 初始化群组
    if (behavior.groupBehavior) {
      this.initializeGroup(entity);
    }

    console.log(`AI registered: ${entity.id} (${behavior.type})`);
  }

  // 注销AI实体
  public unregisterAI(entityId: string): void {
    this.entities.delete(entityId);
    this.aiBehaviors.delete(entityId);
    this.aiStates.delete(entityId);
    this.aiTargets.delete(entityId);
    this.patrolPoints.delete(entityId);
    
    // 从群组中移除
    this.removeFromGroup(entityId);

    console.log(`AI unregistered: ${entityId}`);
  }

  // 初始化巡逻点
  private initializePatrolPoints(entity: CombatEntity, behavior: AIBehavior): void {
    const points: { x: number; y: number }[] = [];
    const centerX = entity.position.x;
    const centerY = entity.position.y;
    const radius = behavior.patrolRadius;

    // 生成4个巡逻点
    for (let i = 0; i < 4; i++) {
      const angle = (i * Math.PI * 2) / 4;
      const x = centerX + Math.cos(angle) * radius;
      const y = centerY + Math.sin(angle) * radius;
      points.push({ x, y });
    }

    this.patrolPoints.set(entity.id, points);
  }

  // 初始化群组
  private initializeGroup(entity: CombatEntity): void {
    const behavior = this.aiBehaviors.get(entity.id);
    if (!behavior?.groupBehavior) return;

    // 寻找附近的群组成员
    const nearbyMembers: string[] = [];
    this.entities.forEach(otherEntity => {
      if (otherEntity.id !== entity.id && otherEntity.team === entity.team) {
        const distance = Phaser.Math.Distance.Between(
          entity.position.x, entity.position.y,
          otherEntity.position.x, otherEntity.position.y
        );

        if (distance <= behavior.helpRange) {
          nearbyMembers.push(otherEntity.id);
        }
      }
    });

    this.groupMembers.set(entity.id, nearbyMembers);
  }

  // 从群组中移除
  private removeFromGroup(entityId: string): void {
    this.groupMembers.forEach((members, groupId) => {
      const index = members.indexOf(entityId);
      if (index > -1) {
        members.splice(index, 1);
      }
    });
  }

  // 更新AI
  public update(time: number, delta: number): void {
    this.lastUpdateTime = time;

    this.entities.forEach(entity => {
      if (entity.state === CombatState.DEAD) return;

      const behavior = this.aiBehaviors.get(entity.id);
      const currentState = this.aiStates.get(entity.id);

      if (!behavior || !currentState) return;

      // 更新AI状态
      this.updateAIState(entity, behavior, currentState);

      // 执行AI行为
      this.executeAIBehavior(entity, behavior, currentState);
    });
  }

  // 更新AI状态
  private updateAIState(entity: CombatEntity, behavior: AIBehavior, currentState: AIState): void {
    const player = this.findPlayer();
    if (!player) return;

    const distance = Phaser.Math.Distance.Between(
      entity.position.x, entity.position.y,
      player.position.x, player.position.y
    );

    let newState = currentState;

    switch (currentState) {
      case AIState.IDLE:
        if (distance <= behavior.detectionRange) {
          newState = AIState.CHASING;
          this.emitEvent('detect', { type: 'detect', entity, target: player });
        } else if (behavior.type !== AIType.PASSIVE) {
          newState = AIState.PATROLLING;
        }
        break;

      case AIState.PATROLLING:
        if (distance <= behavior.detectionRange) {
          newState = AIState.CHASING;
          this.emitEvent('detect', { type: 'detect', entity, target: player });
        }
        break;

      case AIState.CHASING:
        if (distance <= behavior.attackRange) {
          newState = AIState.ATTACKING;
        } else if (distance > behavior.chaseRange) {
          newState = AIState.SEARCHING;
        }
        break;

      case AIState.ATTACKING:
        if (distance > behavior.attackRange) {
          newState = AIState.CHASING;
        } else if (entity.health <= behavior.retreatHealth) {
          newState = AIState.RETREATING;
          this.emitEvent('retreat', { type: 'retreat', entity });
        }
        break;

      case AIState.RETREATING:
        if (distance > behavior.chaseRange) {
          newState = AIState.IDLE;
        }
        break;

      case AIState.SEARCHING:
        if (distance <= behavior.detectionRange) {
          newState = AIState.CHASING;
        } else {
          // 搜索一段时间后回到巡逻
          setTimeout(() => {
            this.aiStates.set(entity.id, AIState.PATROLLING);
          }, 5000);
        }
        break;

      case AIState.STUNNED:
        // 眩晕状态持续一段时间
        setTimeout(() => {
          this.aiStates.set(entity.id, AIState.IDLE);
        }, 2000);
        break;
    }

    if (newState !== currentState) {
      this.aiStates.set(entity.id, newState);
    }
  }

  // 执行AI行为
  private executeAIBehavior(entity: CombatEntity, behavior: AIBehavior, state: AIState): void {
    switch (state) {
      case AIState.IDLE:
        this.executeIdleBehavior(entity, behavior);
        break;
      case AIState.PATROLLING:
        this.executePatrolBehavior(entity, behavior);
        break;
      case AIState.CHASING:
        this.executeChaseBehavior(entity, behavior);
        break;
      case AIState.ATTACKING:
        this.executeAttackBehavior(entity, behavior);
        break;
      case AIState.RETREATING:
        this.executeRetreatBehavior(entity, behavior);
        break;
      case AIState.SEARCHING:
        this.executeSearchBehavior(entity, behavior);
        break;
    }
  }

  // 执行待机行为
  private executeIdleBehavior(entity: CombatEntity, behavior: AIBehavior): void {
    // 待机时随机移动或原地等待
    if (Math.random() < 0.1) { // 10%概率移动
      const randomAngle = Math.random() * Math.PI * 2;
      const moveX = Math.cos(randomAngle) * 16;
      const moveY = Math.sin(randomAngle) * 16;
      
      this.moveTowards(entity, {
        x: entity.position.x + moveX,
        y: entity.position.y + moveY
      });
    }
  }

  // 执行巡逻行为
  private executePatrolBehavior(entity: CombatEntity, behavior: AIBehavior): void {
    const patrolPoints = this.patrolPoints.get(entity.id);
    if (!patrolPoints) return;

    // 获取当前巡逻点
    const currentPointIndex = this.getCurrentPatrolPointIndex(entity, patrolPoints);
    const targetPoint = patrolPoints[currentPointIndex];

    // 移动到巡逻点
    this.moveTowards(entity, targetPoint, behavior.patrolSpeed);

    // 检查是否到达巡逻点
    const distance = Phaser.Math.Distance.Between(
      entity.position.x, entity.position.y,
      targetPoint.x, targetPoint.y
    );

    if (distance < 16) {
      // 移动到下一个巡逻点
      const nextIndex = (currentPointIndex + 1) % patrolPoints.length;
      this.setCurrentPatrolPoint(entity, nextIndex);
    }
  }

  // 执行追击行为
  private executeChaseBehavior(entity: CombatEntity, behavior: AIBehavior): void {
    const player = this.findPlayer();
    if (!player) return;

    // 移动到玩家位置
    this.moveTowards(entity, player.position);

    // 如果是群组AI，呼叫帮助
    if (behavior.groupBehavior && behavior.callForHelp) {
      this.callForHelp(entity, player);
    }
  }

  // 执行攻击行为
  private executeAttackBehavior(entity: CombatEntity, behavior: AIBehavior): void {
    const player = this.findPlayer();
    if (!player) return;

    // 根据AI类型选择攻击策略
    switch (behavior.type) {
      case AIType.AGGRESSIVE:
        this.performAggressiveAttack(entity, player);
        break;
      case AIType.DEFENSIVE:
        this.performDefensiveAttack(entity, player);
        break;
      case AIType.SUPPORT:
        this.performSupportAction(entity, player);
        break;
      case AIType.BOSS:
        this.performBossAttack(entity, player);
        break;
      default:
        this.performBasicAttack(entity, player);
        break;
    }
  }

  // 执行撤退行为
  private executeRetreatBehavior(entity: CombatEntity, behavior: AIBehavior): void {
    const player = this.findPlayer();
    if (!player) return;

    // 远离玩家
    const angle = Phaser.Math.Angle.Between(
      player.position.x, player.position.y,
      entity.position.x, entity.position.y
    );

    const retreatDistance = 64;
    const retreatX = entity.position.x + Math.cos(angle) * retreatDistance;
    const retreatY = entity.position.y + Math.sin(angle) * retreatDistance;

    this.moveTowards(entity, { x: retreatX, y: retreatY });
  }

  // 执行搜索行为
  private executeSearchBehavior(entity: CombatEntity, behavior: AIBehavior): void {
    // 在最后看到玩家的位置附近搜索
    const lastKnownPosition = this.aiTargets.get(entity.id)?.lastSeen;
    if (lastKnownPosition) {
      const searchRadius = 32;
      const searchX = lastKnownPosition + (Math.random() - 0.5) * searchRadius;
      const searchY = lastKnownPosition + (Math.random() - 0.5) * searchRadius;
      
      this.moveTowards(entity, { x: searchX, y: searchY });
    }
  }

  // 移动到目标位置
  private moveTowards(entity: CombatEntity, target: { x: number; y: number }, speed: number = 1): void {
    const angle = Phaser.Math.Angle.Between(
      entity.position.x, entity.position.y,
      target.x, target.y
    );

    const moveSpeed = speed * 60; // 基础移动速度
    const moveX = Math.cos(angle) * moveSpeed * 0.016; // 60FPS
    const moveY = Math.sin(angle) * moveSpeed * 0.016;

    entity.position.x += moveX;
    entity.position.y += moveY;

    // 更新精灵位置
    entity.sprite.setPosition(entity.position.x, entity.position.y);

    // 播放移动动画
    this.playMoveAnimation(entity, angle);
  }

  // 播放移动动画
  private playMoveAnimation(entity: CombatEntity, angle: number): void {
    const degrees = Phaser.Math.RadToDeg(angle);
    let direction = 'down';

    if (degrees >= -45 && degrees < 45) direction = 'right';
    else if (degrees >= 45 && degrees < 135) direction = 'down';
    else if (degrees >= 135 && degrees < 225) direction = 'left';
    else if (degrees >= 225 && degrees < 315) direction = 'up';

    const animationKey = `enemy_walk_${direction}`;
    entity.sprite.play(animationKey, true);
  }

  // 执行攻击
  private performBasicAttack(entity: CombatEntity, target: CombatEntity): void {
    // 基础攻击逻辑
    this.emitEvent('attack', { type: 'attack', entity, target });
  }

  // 执行激进攻击
  private performAggressiveAttack(entity: CombatEntity, target: CombatEntity): void {
    // 激进AI会连续攻击
    if (Math.random() < 0.3) { // 30%概率连续攻击
      this.emitEvent('attack', { type: 'attack', entity, target });
    }
  }

  // 执行防御攻击
  private performDefensiveAttack(entity: CombatEntity, target: CombatEntity): void {
    // 防御AI会保持距离
    const distance = Phaser.Math.Distance.Between(
      entity.position.x, entity.position.y,
      target.position.x, target.position.y
    );

    if (distance > 48) { // 保持距离
      this.moveTowards(entity, target.position);
    } else {
      this.emitEvent('attack', { type: 'attack', entity, target });
    }
  }

  // 执行支援行动
  private performSupportAction(entity: CombatEntity, target: CombatEntity): void {
    // 支援AI会治疗队友或提供增益
    const allies = this.findNearbyAllies(entity);
    if (allies.length > 0) {
      // 治疗或支援队友
      this.emitEvent('attack', { type: 'attack', entity, target: allies[0] });
    } else {
      this.performBasicAttack(entity, target);
    }
  }

  // 执行Boss攻击
  private performBossAttack(entity: CombatEntity, target: CombatEntity): void {
    // Boss AI有特殊攻击模式
    const healthPercentage = entity.health / entity.maxHealth;
    
    if (healthPercentage < 0.3) {
      // 低血量时使用特殊技能
      this.emitEvent('attack', { type: 'attack', entity, target });
    } else {
      // 正常攻击模式
      this.performBasicAttack(entity, target);
    }
  }

  // 呼叫帮助
  private callForHelp(entity: CombatEntity, target: CombatEntity): void {
    const behavior = this.aiBehaviors.get(entity.id);
    if (!behavior?.callForHelp) return;

    const allies = this.findNearbyAllies(entity);
    allies.forEach(ally => {
      // 通知盟友有敌人
      this.aiStates.set(ally.id, AIState.CHASING);
      this.aiTargets.set(ally.id, {
        entity: target,
        distance: Phaser.Math.Distance.Between(
          ally.position.x, ally.position.y,
          target.position.x, target.position.y
        ),
        priority: 1,
        lastSeen: Date.now()
      });
    });

    this.emitEvent('group', { type: 'group', entity, target });
  }

  // 寻找玩家
  private findPlayer(): CombatEntity | null {
    return this.entities.get('player') || null;
  }

  // 寻找附近的盟友
  private findNearbyAllies(entity: CombatEntity): CombatEntity[] {
    const allies: CombatEntity[] = [];
    const behavior = this.aiBehaviors.get(entity.id);
    
    if (!behavior) return allies;

    this.entities.forEach(ally => {
      if (ally.id !== entity.id && ally.team === entity.team) {
        const distance = Phaser.Math.Distance.Between(
          entity.position.x, entity.position.y,
          ally.position.x, ally.position.y
        );

        if (distance <= behavior.helpRange) {
          allies.push(ally);
        }
      }
    });

    return allies;
  }

  // 获取当前巡逻点索引
  private getCurrentPatrolPointIndex(entity: CombatEntity, patrolPoints: { x: number; y: number }[]): number {
    // 这里可以实现更复杂的巡逻点管理
    // 暂时返回随机索引
    return Math.floor(Math.random() * patrolPoints.length);
  }

  // 设置当前巡逻点
  private setCurrentPatrolPoint(entity: CombatEntity, index: number): void {
    // 这里可以实现巡逻点状态管理
  }

  // 设置AI状态
  public setAIState(entityId: string, state: AIState): void {
    this.aiStates.set(entityId, state);
  }

  // 获取AI状态
  public getAIState(entityId: string): AIState | undefined {
    return this.aiStates.get(entityId);
  }

  // 设置AI目标
  public setAITarget(entityId: string, target: AITarget): void {
    this.aiTargets.set(entityId, target);
  }

  // 获取AI目标
  public getAITarget(entityId: string): AITarget | undefined {
    return this.aiTargets.get(entityId);
  }

  // 事件监听
  public on(event: string, callback: (event: AIEvent) => void): void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, []);
    }
    this.eventListeners.get(event)!.push(callback);
  }

  public off(event: string, callback: (event: AIEvent) => void): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      const index = listeners.indexOf(callback);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    }
  }

  // 发送事件
  private emitEvent(type: string, data: Partial<AIEvent>): void {
    const event: AIEvent = {
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
          console.error('Error in AI event listener:', error);
        }
      });
    }
  }

  // 获取所有AI实体
  public getAllAIEntities(): CombatEntity[] {
    return Array.from(this.entities.values());
  }

  // 获取AI行为配置
  public getAIBehavior(entityId: string): AIBehavior | undefined {
    return this.aiBehaviors.get(entityId);
  }

  // 设置AI行为配置
  public setAIBehavior(entityId: string, behavior: AIBehavior): void {
    this.aiBehaviors.set(entityId, behavior);
  }

  // 销毁
  public destroy(): void {
    this.entities.clear();
    this.aiBehaviors.clear();
    this.aiStates.clear();
    this.aiTargets.clear();
    this.patrolPoints.clear();
    this.groupMembers.clear();
    this.eventListeners.clear();
  }
}
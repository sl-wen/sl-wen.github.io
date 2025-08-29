/**
 * 地图交互管理系统
 * 负责处理地图交互、可破坏物体、隐藏区域、动态地图元素等
 */

import { storage } from '../utils';

// 交互对象类型
export enum InteractionType {
  DESTRUCTIBLE = 'destructible',
  HIDDEN_AREA = 'hidden_area',
  DYNAMIC_ELEMENT = 'dynamic_element',
  TRIGGER = 'trigger',
  COLLECTIBLE = 'collectible',
  PUZZLE = 'puzzle',
  DOOR = 'door',
  CHEST = 'chest',
  SIGN = 'sign',
  SWITCH = 'switch',
}

// 交互对象状态
export enum InteractionState {
  INTACT = 'intact',
  DESTROYED = 'destroyed',
  OPENED = 'opened',
  ACTIVATED = 'activated',
  COLLECTED = 'collected',
  SOLVED = 'solved',
  LOCKED = 'locked',
  UNLOCKED = 'unlocked',
}

// 交互对象接口
export interface InteractionObject {
  id: string;
  type: InteractionType;
  x: number;
  y: number;
  width: number;
  height: number;
  state: InteractionState;
  properties: {
    health?: number;
    maxHealth?: number;
    requiredItem?: string;
    requiredLevel?: number;
    reward?: string;
    rewardAmount?: number;
    message?: string;
    eventName?: string;
    respawnTime?: number;
    animationKey?: string;
    soundEffect?: string;
    particleEffect?: string;
    isHidden?: boolean;
    revealCondition?: string;
    puzzleData?: any;
  };
  lastInteractionTime?: number;
  interactionCount?: number;
}

// 地图事件接口
export interface MapEvent {
  id: string;
  name: string;
  type: 'trigger' | 'condition' | 'sequence';
  conditions: MapEventCondition[];
  actions: MapEventAction[];
  isActive: boolean;
  isCompleted: boolean;
  triggerCount: number;
  maxTriggers?: number;
}

// 地图事件条件
export interface MapEventCondition {
  type: 'item_required' | 'level_required' | 'quest_completed' | 'interaction_count' | 'time_of_day' | 'weather';
  value: any;
  operator: 'equals' | 'greater_than' | 'less_than' | 'contains' | 'not_equals';
}

// 地图事件动作
export interface MapEventAction {
  type: 'spawn_item' | 'spawn_enemy' | 'change_lighting' | 'play_sound' | 'show_message' | 'teleport' | 'unlock_area' | 'trigger_quest';
  data: any;
  delay?: number;
}

// 地图状态数据
export interface MapState {
  mapKey: string;
  interactions: Map<string, InteractionObject>;
  events: Map<string, MapEvent>;
  dynamicElements: Map<string, any>;
  lastSaveTime: number;
}

export class MapInteractionManager {
  private static instance: MapInteractionManager;
  private currentMapState: MapState | null = null;
  private scene: Phaser.Scene | null = null;
  private interactionObjects: Map<string, InteractionObject> = new Map();
  private mapEvents: Map<string, MapEvent> = new Map();
  private dynamicElements: Map<string, Phaser.GameObjects.GameObject> = new Map();
  private onInteractionCallback?: (interaction: InteractionObject) => void;
  private onEventTriggeredCallback?: (event: MapEvent) => void;

  private constructor() {}

  public static getInstance(): MapInteractionManager {
    if (!MapInteractionManager.instance) {
      MapInteractionManager.instance = new MapInteractionManager();
    }
    return MapInteractionManager.instance;
  }

  /**
   * 初始化地图交互管理器
   */
  public initialize(scene: Phaser.Scene): void {
    this.scene = scene;
    console.log('MapInteractionManager: 初始化完成');
  }

  /**
   * 加载地图交互数据
   */
  public loadMapInteractions(mapKey: string): void {
    this.currentMapState = this.loadMapState(mapKey);
    this.interactionObjects = this.currentMapState.interactions;
    this.mapEvents = this.currentMapState.events;
    
    // 创建交互对象
    this.createInteractionObjects();
    
    // 激活地图事件
    this.activateMapEvents();
    
    console.log(`MapInteractionManager: 加载地图 ${mapKey} 的交互数据`);
  }

  /**
   * 创建交互对象
   */
  private createInteractionObjects(): void {
    this.interactionObjects.forEach((interaction, id) => {
      this.createInteractionObject(interaction);
    });
  }

  /**
   * 创建单个交互对象
   */
  private createInteractionObject(interaction: InteractionObject): void {
    if (!this.scene) return;

    let gameObject: Phaser.GameObjects.GameObject;

    switch (interaction.type) {
      case InteractionType.DESTRUCTIBLE:
        gameObject = this.createDestructibleObject(interaction);
        break;
      case InteractionType.HIDDEN_AREA:
        gameObject = this.createHiddenArea(interaction);
        break;
      case InteractionType.DYNAMIC_ELEMENT:
        gameObject = this.createDynamicElement(interaction);
        break;
      case InteractionType.TRIGGER:
        gameObject = this.createTrigger(interaction);
        break;
      case InteractionType.COLLECTIBLE:
        gameObject = this.createCollectible(interaction);
        break;
      case InteractionType.PUZZLE:
        gameObject = this.createPuzzle(interaction);
        break;
      case InteractionType.DOOR:
        gameObject = this.createDoor(interaction);
        break;
      case InteractionType.CHEST:
        gameObject = this.createChest(interaction);
        break;
      case InteractionType.SIGN:
        gameObject = this.createSign(interaction);
        break;
      case InteractionType.SWITCH:
        gameObject = this.createSwitch(interaction);
        break;
      default:
        return;
    }

    if (gameObject) {
      this.dynamicElements.set(interaction.id, gameObject);
    }
  }

  /**
   * 创建可破坏物体
   */
  private createDestructibleObject(interaction: InteractionObject): Phaser.GameObjects.GameObject {
    if (!this.scene) return null as any;

    const sprite = this.scene.physics.add.sprite(
      interaction.x * 16 + 8,
      interaction.y * 16 + 8,
      'destructible_objects'
    );

    sprite.setData('interaction', interaction);
    sprite.setData('health', interaction.properties.health || 100);
    sprite.setData('maxHealth', interaction.properties.maxHealth || 100);

    // 设置碰撞
    this.scene.physics.add.existing(sprite);
    (sprite.body as Phaser.Physics.Arcade.Body).setImmovable(true);

    // 添加交互事件
    sprite.setInteractive();
    sprite.on('pointerdown', () => {
      this.interactWithObject(interaction.id);
    });

    return sprite;
  }

  /**
   * 创建隐藏区域
   */
  private createHiddenArea(interaction: InteractionObject): Phaser.GameObjects.GameObject {
    if (!this.scene) return null as any;

    const zone = this.scene.add.zone(
      interaction.x * 16 + interaction.width / 2,
      interaction.y * 16 + interaction.height / 2,
      interaction.width,
      interaction.height
    );

    zone.setData('interaction', interaction);
    zone.setData('isHidden', interaction.properties.isHidden || false);

    // 设置交互
    this.scene.physics.add.existing(zone);
    (zone.body as Phaser.Physics.Arcade.Body).setImmovable(true);

    return zone;
  }

  /**
   * 创建动态元素
   */
  private createDynamicElement(interaction: InteractionObject): Phaser.GameObjects.GameObject {
    if (!this.scene) return null as any;

    const sprite = this.scene.add.sprite(
      interaction.x * 16 + 8,
      interaction.y * 16 + 8,
      interaction.properties.animationKey || 'dynamic_element'
    );

    sprite.setData('interaction', interaction);

    // 播放动画
    if (interaction.properties.animationKey) {
      sprite.play(interaction.properties.animationKey);
    }

    return sprite;
  }

  /**
   * 创建触发器
   */
  private createTrigger(interaction: InteractionObject): Phaser.GameObjects.GameObject {
    if (!this.scene) return null as any;

    const zone = this.scene.add.zone(
      interaction.x * 16 + interaction.width / 2,
      interaction.y * 16 + interaction.height / 2,
      interaction.width,
      interaction.height
    );

    zone.setData('interaction', interaction);
    zone.setData('eventName', interaction.properties.eventName);

    // 设置物理碰撞
    this.scene.physics.add.existing(zone);
    (zone.body as Phaser.Physics.Arcade.Body).setImmovable(true);

    return zone;
  }

  /**
   * 创建可收集物品
   */
  private createCollectible(interaction: InteractionObject): Phaser.GameObjects.GameObject {
    if (!this.scene) return null as any;

    const sprite = this.scene.physics.add.sprite(
      interaction.x * 16 + 8,
      interaction.y * 16 + 8,
      'collectibles'
    );

    sprite.setData('interaction', interaction);
    sprite.setData('reward', interaction.properties.reward);
    sprite.setData('rewardAmount', interaction.properties.rewardAmount);

    // 播放收集动画
    if (interaction.properties.animationKey) {
      sprite.play(interaction.properties.animationKey);
    }

    return sprite;
  }

  /**
   * 创建谜题
   */
  private createPuzzle(interaction: InteractionObject): Phaser.GameObjects.GameObject {
    if (!this.scene) return null as any;

    const sprite = this.scene.add.sprite(
      interaction.x * 16 + 8,
      interaction.y * 16 + 8,
      'puzzles'
    );

    sprite.setData('interaction', interaction);
    sprite.setData('puzzleData', interaction.properties.puzzleData);

    // 设置交互
    sprite.setInteractive();
    sprite.on('pointerdown', () => {
      this.interactWithPuzzle(interaction.id);
    });

    return sprite;
  }

  /**
   * 创建门
   */
  private createDoor(interaction: InteractionObject): Phaser.GameObjects.GameObject {
    if (!this.scene) return null as any;

    const sprite = this.scene.physics.add.sprite(
      interaction.x * 16 + 8,
      interaction.y * 16 + 8,
      'doors'
    );

    sprite.setData('interaction', interaction);
    sprite.setData('requiredItem', interaction.properties.requiredItem);
    sprite.setData('requiredLevel', interaction.properties.requiredLevel);

    // 设置碰撞
    this.scene.physics.add.existing(sprite);
    (sprite.body as Phaser.Physics.Arcade.Body).setImmovable(true);

    // 设置交互
    sprite.setInteractive();
    sprite.on('pointerdown', () => {
      this.interactWithDoor(interaction.id);
    });

    return sprite;
  }

  /**
   * 创建宝箱
   */
  private createChest(interaction: InteractionObject): Phaser.GameObjects.GameObject {
    if (!this.scene) return null as any;

    const sprite = this.scene.physics.add.sprite(
      interaction.x * 16 + 8,
      interaction.y * 16 + 8,
      'chests'
    );

    sprite.setData('interaction', interaction);
    sprite.setData('reward', interaction.properties.reward);
    sprite.setData('rewardAmount', interaction.properties.rewardAmount);

    // 设置交互
    sprite.setInteractive();
    sprite.on('pointerdown', () => {
      this.interactWithChest(interaction.id);
    });

    return sprite;
  }

  /**
   * 创建标志
   */
  private createSign(interaction: InteractionObject): Phaser.GameObjects.GameObject {
    if (!this.scene) return null as any;

    const sprite = this.scene.add.sprite(
      interaction.x * 16 + 8,
      interaction.y * 16 + 8,
      'signs'
    );

    sprite.setData('interaction', interaction);
    sprite.setData('message', interaction.properties.message);

    // 设置交互
    sprite.setInteractive();
    sprite.on('pointerdown', () => {
      this.interactWithSign(interaction.id);
    });

    return sprite;
  }

  /**
   * 创建开关
   */
  private createSwitch(interaction: InteractionObject): Phaser.GameObjects.GameObject {
    if (!this.scene) return null as any;

    const sprite = this.scene.add.sprite(
      interaction.x * 16 + 8,
      interaction.y * 16 + 8,
      'switches'
    );

    sprite.setData('interaction', interaction);
    sprite.setData('eventName', interaction.properties.eventName);

    // 设置交互
    sprite.setInteractive();
    sprite.on('pointerdown', () => {
      this.interactWithSwitch(interaction.id);
    });

    return sprite;
  }

  /**
   * 与对象交互
   */
  public interactWithObject(interactionId: string): void {
    const interaction = this.interactionObjects.get(interactionId);
    if (!interaction) return;

    const now = Date.now();
    const timeSinceLastInteraction = now - (interaction.lastInteractionTime || 0);

    // 检查交互冷却时间
    if (interaction.properties.respawnTime && timeSinceLastInteraction < interaction.properties.respawnTime) {
      return;
    }

    switch (interaction.type) {
      case InteractionType.DESTRUCTIBLE:
        this.handleDestructibleInteraction(interaction);
        break;
      case InteractionType.HIDDEN_AREA:
        this.handleHiddenAreaInteraction(interaction);
        break;
      case InteractionType.DYNAMIC_ELEMENT:
        this.handleDynamicElementInteraction(interaction);
        break;
      case InteractionType.TRIGGER:
        this.handleTriggerInteraction(interaction);
        break;
      case InteractionType.COLLECTIBLE:
        this.handleCollectibleInteraction(interaction);
        break;
      case InteractionType.PUZZLE:
        this.handlePuzzleInteraction(interaction);
        break;
      case InteractionType.DOOR:
        this.handleDoorInteraction(interaction);
        break;
      case InteractionType.CHEST:
        this.handleChestInteraction(interaction);
        break;
      case InteractionType.SIGN:
        this.handleSignInteraction(interaction);
        break;
      case InteractionType.SWITCH:
        this.handleSwitchInteraction(interaction);
        break;
    }

    // 更新交互状态
    interaction.lastInteractionTime = now;
    interaction.interactionCount = (interaction.interactionCount || 0) + 1;

    // 触发回调
    if (this.onInteractionCallback) {
      this.onInteractionCallback(interaction);
    }

    // 保存状态
    this.saveMapState();
  }

  /**
   * 处理可破坏物体交互
   */
  private handleDestructibleInteraction(interaction: InteractionObject): void {
    if (!this.scene) return;

    const gameObject = this.dynamicElements.get(interaction.id);
    if (!gameObject) return;

    const currentHealth = gameObject.getData('health') || 0;
    const damage = 25; // 基础伤害

    if (currentHealth <= damage) {
      // 物体被破坏
      interaction.state = InteractionState.DESTROYED;
      
      // 播放破坏动画和音效
      if (interaction.properties.soundEffect) {
        this.scene.sound.play(interaction.properties.soundEffect);
      }

      if (interaction.properties.particleEffect) {
        this.createParticleEffect(gameObject.x, gameObject.y, interaction.properties.particleEffect);
      }

      // 生成掉落物品
      if (interaction.properties.reward) {
        this.spawnReward(interaction.x, interaction.y, interaction.properties.reward, interaction.properties.rewardAmount);
      }

      // 隐藏物体
      gameObject.setVisible(false);
    } else {
      // 减少生命值
      gameObject.setData('health', currentHealth - damage);
      
      // 播放受伤动画
      if (gameObject instanceof Phaser.GameObjects.Sprite) {
        gameObject.play('destructible_damage');
      }
    }
  }

  /**
   * 处理隐藏区域交互
   */
  private handleHiddenAreaInteraction(interaction: InteractionObject): void {
    if (!this.scene) return;

    const gameObject = this.dynamicElements.get(interaction.id);
    if (!gameObject) return;

    // 检查揭示条件
    if (this.checkRevealCondition(interaction.properties.revealCondition)) {
      interaction.state = InteractionState.ACTIVATED;
      gameObject.setData('isHidden', false);
      
      // 显示隐藏内容
      this.revealHiddenContent(interaction);
    }
  }

  /**
   * 处理动态元素交互
   */
  private handleDynamicElementInteraction(interaction: InteractionObject): void {
    if (!this.scene) return;

    const gameObject = this.dynamicElements.get(interaction.id);
    if (!gameObject) return;

    // 播放交互动画
    if (interaction.properties.animationKey) {
      if (gameObject instanceof Phaser.GameObjects.Sprite) {
        gameObject.play(interaction.properties.animationKey);
      }
    }

    // 播放音效
    if (interaction.properties.soundEffect) {
      this.scene.sound.play(interaction.properties.soundEffect);
    }

    // 触发事件
    if (interaction.properties.eventName) {
      this.triggerMapEvent(interaction.properties.eventName);
    }
  }

  /**
   * 处理触发器交互
   */
  private handleTriggerInteraction(interaction: InteractionObject): void {
    if (interaction.properties.eventName) {
      this.triggerMapEvent(interaction.properties.eventName);
    }
  }

  /**
   * 处理可收集物品交互
   */
  private handleCollectibleInteraction(interaction: InteractionObject): void {
    if (!this.scene) return;

    const gameObject = this.dynamicElements.get(interaction.id);
    if (!gameObject) return;

    // 给予奖励
    if (interaction.properties.reward && interaction.properties.rewardAmount) {
      this.giveReward(interaction.properties.reward, interaction.properties.rewardAmount);
    }

    // 播放收集动画和音效
    if (interaction.properties.soundEffect) {
      this.scene.sound.play(interaction.properties.soundEffect);
    }

    // 隐藏物品
    interaction.state = InteractionState.COLLECTED;
    gameObject.setVisible(false);

    // 设置重生时间
    if (interaction.properties.respawnTime) {
      this.scene.time.delayedCall(interaction.properties.respawnTime, () => {
        this.respawnCollectible(interaction.id);
      });
    }
  }

  /**
   * 处理谜题交互
   */
  private handlePuzzleInteraction(interaction: InteractionObject): void {
    // 显示谜题界面
    this.showPuzzleInterface(interaction);
  }

  /**
   * 处理门交互
   */
  private handleDoorInteraction(interaction: InteractionObject): void {
    // 检查开门条件
    if (this.checkDoorRequirements(interaction)) {
      interaction.state = InteractionState.OPENED;
      this.openDoor(interaction);
    } else {
      this.showDoorRequirements(interaction);
    }
  }

  /**
   * 处理宝箱交互
   */
  private handleChestInteraction(interaction: InteractionObject): void {
    if (interaction.state === InteractionState.OPENED) {
      return; // 已经打开
    }

    // 给予奖励
    if (interaction.properties.reward && interaction.properties.rewardAmount) {
      this.giveReward(interaction.properties.reward, interaction.properties.rewardAmount);
    }

    // 播放开箱动画和音效
    if (!this.scene) return;
    
    if (interaction.properties.soundEffect) {
      this.scene.sound.play(interaction.properties.soundEffect);
    }

    const gameObject = this.dynamicElements.get(interaction.id);
    if (gameObject instanceof Phaser.GameObjects.Sprite) {
      gameObject.play('chest_open');
    }

    interaction.state = InteractionState.OPENED;
  }

  /**
   * 处理标志交互
   */
  private handleSignInteraction(interaction: InteractionObject): void {
    if (interaction.properties.message) {
      this.showMessage(interaction.properties.message);
    }
  }

  /**
   * 处理开关交互
   */
  private handleSwitchInteraction(interaction: InteractionObject): void {
    if (!this.scene) return;

    const gameObject = this.dynamicElements.get(interaction.id);
    if (!gameObject) return;

    // 切换状态
    interaction.state = interaction.state === InteractionState.ACTIVATED 
      ? InteractionState.INTACT 
      : InteractionState.ACTIVATED;

    // 播放切换动画
    if (gameObject instanceof Phaser.GameObjects.Sprite) {
      gameObject.play(interaction.state === InteractionState.ACTIVATED ? 'switch_on' : 'switch_off');
    }

    // 触发事件
    if (interaction.properties.eventName) {
      this.triggerMapEvent(interaction.properties.eventName);
    }
  }

  /**
   * 与谜题交互
   */
  private interactWithPuzzle(puzzleId: string): void {
    const interaction = this.interactionObjects.get(puzzleId);
    if (!interaction) return;

    this.handlePuzzleInteraction(interaction);
  }

  /**
   * 与门交互
   */
  private interactWithDoor(doorId: string): void {
    const interaction = this.interactionObjects.get(doorId);
    if (!interaction) return;

    this.handleDoorInteraction(interaction);
  }

  /**
   * 与宝箱交互
   */
  private interactWithChest(chestId: string): void {
    const interaction = this.interactionObjects.get(chestId);
    if (!interaction) return;

    this.handleChestInteraction(interaction);
  }

  /**
   * 与标志交互
   */
  private interactWithSign(signId: string): void {
    const interaction = this.interactionObjects.get(signId);
    if (!interaction) return;

    this.handleSignInteraction(interaction);
  }

  /**
   * 与开关交互
   */
  private interactWithSwitch(switchId: string): void {
    const interaction = this.interactionObjects.get(switchId);
    if (!interaction) return;

    this.handleSwitchInteraction(interaction);
  }

  /**
   * 激活地图事件
   */
  private activateMapEvents(): void {
    this.mapEvents.forEach((event, id) => {
      if (event.isActive && !event.isCompleted) {
        this.setupEventTriggers(event);
      }
    });
  }

  /**
   * 设置事件触发器
   */
  private setupEventTriggers(event: MapEvent): void {
    // 根据事件类型设置触发器
    switch (event.type) {
      case 'trigger':
        this.setupTriggerEvent(event);
        break;
      case 'condition':
        this.setupConditionEvent(event);
        break;
      case 'sequence':
        this.setupSequenceEvent(event);
        break;
    }
  }

  /**
   * 设置触发事件
   */
  private setupTriggerEvent(event: MapEvent): void {
    // 查找相关的交互对象作为触发器
    this.interactionObjects.forEach((interaction) => {
      if (interaction.properties.eventName === event.name) {
        // 设置触发器
        const gameObject = this.dynamicElements.get(interaction.id);
        if (gameObject) {
          gameObject.setData('event', event);
        }
      }
    });
  }

  /**
   * 设置条件事件
   */
  private setupConditionEvent(event: MapEvent): void {
    // 条件事件需要定期检查条件
    if (this.scene) {
      this.scene.time.addEvent({
        delay: 1000,
        callback: () => this.checkEventConditions(event),
        callbackScope: this,
        loop: true,
      });
    }
  }

  /**
   * 设置序列事件
   */
  private setupSequenceEvent(event: MapEvent): void {
    // 序列事件需要按顺序执行
    event.actions.forEach((action, index) => {
      if (action.delay) {
        if (this.scene) {
          this.scene.time.delayedCall(action.delay, () => {
            this.executeEventAction(action);
          });
        }
      }
    });
  }

  /**
   * 检查事件条件
   */
  private checkEventConditions(event: MapEvent): boolean {
    const allConditionsMet = event.conditions.every(condition => {
      return this.evaluateCondition(condition);
    });

    if (allConditionsMet) {
      this.executeEventActions(event);
      return true;
    }

    return false;
  }

  /**
   * 评估条件
   */
  private evaluateCondition(condition: MapEventCondition): boolean {
    // 这里需要根据具体的条件类型进行评估
    // 暂时返回true，实际实现需要与游戏系统集成
    return true;
  }

  /**
   * 执行事件动作
   */
  private executeEventActions(event: MapEvent): void {
    event.actions.forEach(action => {
      this.executeEventAction(action);
    });

    event.triggerCount++;
    if (event.maxTriggers && event.triggerCount >= event.maxTriggers) {
      event.isCompleted = true;
    }

    // 触发回调
    if (this.onEventTriggeredCallback) {
      this.onEventTriggeredCallback(event);
    }
  }

  /**
   * 执行单个事件动作
   */
  private executeEventAction(action: MapEventAction): void {
    if (!this.scene) return;

    switch (action.type) {
      case 'spawn_item':
        this.spawnItem(action.data);
        break;
      case 'spawn_enemy':
        this.spawnEnemy(action.data);
        break;
      case 'change_lighting':
        this.changeLighting(action.data);
        break;
      case 'play_sound':
        this.scene.sound.play(action.data);
        break;
      case 'show_message':
        this.showMessage(action.data);
        break;
      case 'teleport':
        this.triggerTeleport(action.data);
        break;
      case 'unlock_area':
        this.unlockArea(action.data);
        break;
      case 'trigger_quest':
        this.triggerQuest(action.data);
        break;
    }
  }

  /**
   * 触发地图事件
   */
  public triggerMapEvent(eventName: string): void {
    const event = this.mapEvents.get(eventName);
    if (event && event.isActive && !event.isCompleted) {
      this.executeEventActions(event);
    }
  }

  /**
   * 辅助方法
   */
  private createParticleEffect(x: number, y: number, effectName: string): void {
    if (!this.scene) return;
    // 创建粒子效果
  }

  private spawnReward(x: number, y: number, rewardType: string, amount: number): void {
    if (!this.scene) return;
    // 生成奖励物品
  }

  private checkRevealCondition(condition: string): boolean {
    // 检查揭示条件
    return true;
  }

  private revealHiddenContent(interaction: InteractionObject): void {
    // 显示隐藏内容
  }

  private giveReward(rewardType: string, amount: number): void {
    // 给予奖励
  }

  private respawnCollectible(interactionId: string): void {
    const interaction = this.interactionObjects.get(interactionId);
    if (!interaction) return;

    interaction.state = InteractionState.INTACT;
    const gameObject = this.dynamicElements.get(interactionId);
    if (gameObject) {
      gameObject.setVisible(true);
    }
  }

  private showPuzzleInterface(interaction: InteractionObject): void {
    // 显示谜题界面
  }

  private checkDoorRequirements(interaction: InteractionObject): boolean {
    // 检查开门条件
    return true;
  }

  private openDoor(interaction: InteractionObject): void {
    // 开门
  }

  private showDoorRequirements(interaction: InteractionObject): void {
    // 显示开门要求
  }

  private showMessage(message: string): void {
    // 显示消息
  }

  private spawnItem(data: any): void {
    // 生成物品
  }

  private spawnEnemy(data: any): void {
    // 生成敌人
  }

  private changeLighting(data: any): void {
    // 改变光照
  }

  private triggerTeleport(data: any): void {
    // 触发传送
  }

  private unlockArea(data: any): void {
    // 解锁区域
  }

  private triggerQuest(data: any): void {
    // 触发任务
  }

  /**
   * 加载地图状态
   */
  private loadMapState(mapKey: string): MapState {
    const savedState = storage.get(`map_state_${mapKey}`, null);
    
    if (savedState) {
      return savedState;
    }

    // 创建新的地图状态
    return {
      mapKey,
      interactions: new Map(),
      events: new Map(),
      dynamicElements: new Map(),
      lastSaveTime: Date.now(),
    };
  }

  /**
   * 保存地图状态
   */
  private saveMapState(): void {
    if (!this.currentMapState) return;

    this.currentMapState.lastSaveTime = Date.now();
    storage.set(`map_state_${this.currentMapState.mapKey}`, this.currentMapState);
  }

  /**
   * 设置交互回调
   */
  public setOnInteractionCallback(callback: (interaction: InteractionObject) => void): void {
    this.onInteractionCallback = callback;
  }

  /**
   * 设置事件触发回调
   */
  public setOnEventTriggeredCallback(callback: (event: MapEvent) => void): void {
    this.onEventTriggeredCallback = callback;
  }

  /**
   * 获取交互对象
   */
  public getInteractionObject(id: string): InteractionObject | undefined {
    return this.interactionObjects.get(id);
  }

  /**
   * 获取所有交互对象
   */
  public getAllInteractionObjects(): Map<string, InteractionObject> {
    return this.interactionObjects;
  }

  /**
   * 获取地图事件
   */
  public getMapEvent(id: string): MapEvent | undefined {
    return this.mapEvents.get(id);
  }

  /**
   * 获取所有地图事件
   */
  public getAllMapEvents(): Map<string, MapEvent> {
    return this.mapEvents;
  }

  /**
   * 清理资源
   */
  public destroy(): void {
    this.dynamicElements.forEach(gameObject => {
      gameObject.destroy();
    });
    this.dynamicElements.clear();
    this.interactionObjects.clear();
    this.mapEvents.clear();
    this.scene = null;
  }
}
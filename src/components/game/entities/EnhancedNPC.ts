import * as Phaser from 'phaser';
import { GameManager } from '../systems/GameManager';
import { AudioManager } from '../systems/AudioManager';
import { AnimationManager } from '../systems/AnimationManager';

/**
 * NPC类型枚举
 */
export enum NPCType {
  FARMER = 'farmer',
  MERCHANT = 'merchant',
  CHEF = 'chef',
  ANIMAL = 'animal',
  VILLAGER = 'villager'
}

/**
 * NPC状态枚举
 */
export enum NPCState {
  IDLE = 'idle',
  WALKING = 'walking',
  WORKING = 'working',
  TALKING = 'talking',
  SLEEPING = 'sleeping'
}

/**
 * 对话选项接口
 */
export interface DialogueOption {
  text: string;
  action?: string;
  condition?: () => boolean;
  response: string;
}

/**
 * 任务接口
 */
export interface Quest {
  id: string;
  title: string;
  description: string;
  objectives: string[];
  rewards: { itemId: string; quantity: number }[];
  isCompleted: boolean;
  isActive: boolean;
}

/**
 * 增强型NPC类
 * 参考top-down-react-phaser-game的NPC系统，提供更丰富的交互功能
 */
export class EnhancedNPC extends Phaser.Physics.Arcade.Sprite {
  private npcType: NPCType;
  private npcName: string;
  private currentState: NPCState = NPCState.IDLE;
  private gameManager: GameManager;
  private audioManager: AudioManager;
  private animationManager: AnimationManager;

  // 对话系统
  private dialogues: Map<string, string[]> = new Map();
  private dialogueOptions: DialogueOption[] = [];
  private currentDialogueIndex = 0;
  private isInConversation = false;

  // 任务系统
  private quests: Quest[] = [];
  private availableQuests: Quest[] = [];

  // 行为系统
  private behaviorTimer: Phaser.Time.TimerEvent | null = null;
  private walkPath: { x: number; y: number }[] = [];
  private currentPathIndex = 0;
  private homePosition: { x: number; y: number };
  private workPosition: { x: number; y: number } | null = null;

  // 商店系统（用于商人NPC）
  private shopItems: { itemId: string; price: number; stock: number }[] = [];
  private isShopOpen = false;

  // 情感系统
  private mood: number = 50; // 0-100，影响对话和价格
  private friendship: number = 0; // 与玩家的友好度

  // 时间系统
  private schedule: Map<number, { action: string; location?: { x: number; y: number } }> = new Map();
  private currentHour = 8; // 默认早上8点

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    npcType: NPCType,
    name: string
  ) {
    super(scene, x, y, `npc_${npcType}`);

    this.npcType = npcType;
    this.npcName = name;
    this.homePosition = { x, y };
    this.gameManager = GameManager.getInstance();
    // 从GameManager获取共享的系统实例，避免重复创建
    this.audioManager = (scene as any).audioManager || new AudioManager(scene);
    this.animationManager = (scene as any).animationManager || new AnimationManager(scene);

    // 添加到场景
    scene.add.existing(this);
    scene.physics.add.existing(this);

    // 设置物理属性
    this.setCollideWorldBounds(true);
    this.setDepth(5);
    this.setInteractive();

    // 初始化NPC
    this.initializeNPC();
    this.setupBehavior();
    this.setupInteractions();
  }

  /**
   * 初始化NPC特定属性
   */
  private initializeNPC(): void {
    switch (this.npcType) {
      case NPCType.FARMER:
        this.initializeFarmer();
        break;
      case NPCType.MERCHANT:
        this.initializeMerchant();
        break;
      case NPCType.CHEF:
        this.initializeChef();
        break;
      case NPCType.ANIMAL:
        this.initializeAnimal();
        break;
      case NPCType.VILLAGER:
        this.initializeVillager();
        break;
    }
  }

  /**
   * 初始化农夫NPC
   */
  private initializeFarmer(): void {
    this.workPosition = { x: this.x + 100, y: this.y + 50 };
    
    this.dialogues.set('greeting', [
      '你好！欢迎来到我的农场！',
      '今天的天气很适合种植呢。',
      '需要一些种植的建议吗？'
    ]);

    this.dialogues.set('farming_tips', [
      '记住要定期给作物浇水。',
      '使用肥料可以让作物长得更快。',
      '不同的作物有不同的生长周期。'
    ]);

    this.quests.push({
      id: 'first_harvest',
      title: '第一次收获',
      description: '种植并收获你的第一个作物',
      objectives: ['种植任意作物', '等待作物成熟', '收获作物'],
      rewards: [{ itemId: 'gold', quantity: 50 }],
      isCompleted: false,
      isActive: false
    });

    // 设置农夫的日程表
    this.schedule.set(6, { action: 'wake_up' });
    this.schedule.set(7, { action: 'work', location: this.workPosition });
    this.schedule.set(12, { action: 'lunch', location: this.homePosition });
    this.schedule.set(13, { action: 'work', location: this.workPosition });
    this.schedule.set(18, { action: 'dinner', location: this.homePosition });
    this.schedule.set(22, { action: 'sleep' });
  }

  /**
   * 初始化商人NPC
   */
  private initializeMerchant(): void {
    this.dialogues.set('greeting', [
      '欢迎来到我的商店！',
      '我有很多有用的物品出售。',
      '看看有什么你需要的吧！'
    ]);

    this.shopItems = [
      { itemId: 'carrot_seed', price: 10, stock: 50 },
      { itemId: 'tomato_seed', price: 15, stock: 30 },
      { itemId: 'wheat_seed', price: 8, stock: 100 },
      { itemId: 'fertilizer', price: 25, stock: 20 },
      { itemId: 'watering_can', price: 100, stock: 5 }
    ];
  }

  /**
   * 初始化厨师NPC
   */
  private initializeChef(): void {
    this.workPosition = { x: this.x - 50, y: this.y };

    this.dialogues.set('greeting', [
      '啊，一位新的厨师朋友！',
      '我可以教你一些美味的食谱。',
      '新鲜的食材总是最好的！'
    ]);

    this.quests.push({
      id: 'cooking_lesson',
      title: '烹饪课程',
      description: '学习制作你的第一道菜',
      objectives: ['收集食材', '使用烹饪台', '制作料理'],
      rewards: [{ itemId: 'recipe_book', quantity: 1 }],
      isCompleted: false,
      isActive: false
    });
  }

  /**
   * 初始化动物NPC
   */
  private initializeAnimal(): void {
    this.dialogues.set('greeting', [
      '*动物发出友好的声音*',
      '*似乎想要一些食物*',
      '*看起来很开心*'
    ]);

    // 动物有随机移动行为
    this.setupRandomMovement();
  }

  /**
   * 初始化村民NPC
   */
  private initializeVillager(): void {
    this.dialogues.set('greeting', [
      '你好！你是新来的吗？',
      '这里是个很棒的地方。',
      '希望你能喜欢这里的生活！'
    ]);
  }

  /**
   * 设置行为模式
   */
  private setupBehavior(): void {
    // 设置定时行为更新
    this.behaviorTimer = this.scene.time.addEvent({
      delay: 5000, // 每5秒更新一次行为
      callback: this.updateBehavior,
      callbackScope: this,
      loop: true
    });
  }

  /**
   * 设置交互
   */
  private setupInteractions(): void {
    this.on('pointerdown', this.onInteract, this);
    
    // 监听游戏管理器事件
    this.gameManager.on('player-interact', this.checkPlayerInteraction, this);
    this.gameManager.on('time-changed', this.onTimeChange, this);
  }

  /**
   * 更新行为
   */
  private updateBehavior(): void {
    if (this.isInConversation) return;

    // 根据时间执行不同行为
    const currentSchedule = this.schedule.get(this.currentHour);
    if (currentSchedule) {
      this.executeScheduledAction(currentSchedule);
    } else {
      // 默认行为
      this.performIdleBehavior();
    }

    // 更新情绪（随机波动）
    this.mood = Phaser.Math.Clamp(this.mood + (Math.random() - 0.5) * 5, 0, 100);
  }

  /**
   * 执行计划行为
   */
  private executeScheduledAction(schedule: { action: string; location?: { x: number; y: number } }): void {
    switch (schedule.action) {
      case 'work':
        if (schedule.location) {
          this.moveToLocation(schedule.location);
          this.currentState = NPCState.WORKING;
        }
        break;
      case 'sleep':
        this.moveToLocation(this.homePosition);
        this.currentState = NPCState.SLEEPING;
        break;
      case 'wake_up':
        this.currentState = NPCState.IDLE;
        break;
      default:
        if (schedule.location) {
          this.moveToLocation(schedule.location);
        }
        this.currentState = NPCState.IDLE;
    }
  }

  /**
   * 执行空闲行为
   */
  private performIdleBehavior(): void {
    const random = Math.random();
    
    if (random < 0.3) {
      // 30% 概率随机移动
      this.performRandomMovement();
    } else if (random < 0.5) {
      // 20% 概率播放空闲动画
      this.playIdleAnimation();
    }
    // 50% 概率什么都不做
  }

  /**
   * 随机移动
   */
  private performRandomMovement(): void {
    const range = 100;
    const targetX = this.homePosition.x + (Math.random() - 0.5) * range;
    const targetY = this.homePosition.y + (Math.random() - 0.5) * range;
    
    this.moveToLocation({ x: targetX, y: targetY });
    this.currentState = NPCState.WALKING;
  }

  /**
   * 移动到指定位置
   */
  private moveToLocation(location: { x: number; y: number }): void {
    const distance = Phaser.Math.Distance.Between(this.x, this.y, location.x, location.y);
    
    if (distance > 10) {
      // 使用补间动画移动
      this.scene.tweens.add({
        targets: this,
        x: location.x,
        y: location.y,
        duration: distance * 10, // 根据距离调整时间
        ease: 'Power2',
        onComplete: () => {
          this.currentState = NPCState.IDLE;
        }
      });
    }
  }

  /**
   * 播放空闲动画
   */
  private playIdleAnimation(): void {
    const animationKey = `npc_${this.npcType}_idle`;
    if (this.animationManager) {
      this.animationManager.playAnimation(this, animationKey, true);
    }
  }

  /**
   * 设置随机移动（用于动物）
   */
  private setupRandomMovement(): void {
    if (this.npcType === NPCType.ANIMAL) {
      this.scene.time.addEvent({
        delay: 3000,
        callback: this.performRandomMovement,
        callbackScope: this,
        loop: true
      });
    }
  }

  /**
   * 处理交互
   */
  private onInteract(): void {
    if (this.isInConversation) return;

    this.startConversation();
    this.audioManager.playSoundEffect('ui_click');
  }

  /**
   * 检查玩家交互
   */
  private checkPlayerInteraction(): void {
    // 检查玩家是否在交互范围内
    const gameScene = this.gameManager.getGameScene();
    if (gameScene && (gameScene as any).cat) {
      const player = (gameScene as any).cat;
      const distance = Phaser.Math.Distance.Between(this.x, this.y, player.x, player.y);
      
      if (distance < 50) { // 50像素交互范围
        this.onInteract();
      }
    }
  }

  /**
   * 开始对话
   */
  private startConversation(): void {
    this.isInConversation = true;
    this.currentDialogueIndex = 0;
    this.currentState = NPCState.TALKING;

    const greetings = this.dialogues.get('greeting') || ['你好！'];
    this.showDialogue(greetings[0]);

    // 增加友好度
    this.friendship = Math.min(this.friendship + 1, 100);
  }

  /**
   * 显示对话
   */
  private showDialogue(text: string): void {
    // 发送对话事件给UI系统
    const uiScene = this.gameManager.getUIScene();
    if (uiScene) {
      uiScene.events.emit('show-dialogue', {
        speaker: this.npcName,
        text: text,
        options: this.getDialogueOptions()
      });
    }
  }

  /**
   * 获取对话选项
   */
  private getDialogueOptions(): DialogueOption[] {
    const options: DialogueOption[] = [
      {
        text: '再见',
        action: 'end_conversation',
        response: '再见！祝你有美好的一天！'
      }
    ];

    // 根据NPC类型添加特定选项
    switch (this.npcType) {
      case NPCType.MERCHANT:
        options.unshift({
          text: '我想买些东西',
          action: 'open_shop',
          response: '当然！看看我的商品吧。'
        });
        break;
      case NPCType.FARMER:
        options.unshift({
          text: '请教我一些种植技巧',
          action: 'farming_tips',
          response: '我很乐意分享我的经验！'
        });
        break;
      case NPCType.CHEF:
        options.unshift({
          text: '教我做菜吧',
          action: 'cooking_lesson',
          response: '好的！让我教你一些基础的烹饪技巧。'
        });
        break;
    }

    // 添加任务相关选项
    if (this.availableQuests.length > 0) {
      options.unshift({
        text: '有什么我可以帮忙的吗？',
        action: 'show_quests',
        response: '确实有一些事情需要帮助...'
      });
    }

    return options;
  }

  /**
   * 处理对话选择
   */
  public handleDialogueChoice(choice: string): void {
    switch (choice) {
      case 'open_shop':
        this.openShop();
        break;
      case 'farming_tips':
        this.showFarmingTips();
        break;
      case 'cooking_lesson':
        this.startCookingLesson();
        break;
      case 'show_quests':
        this.showAvailableQuests();
        break;
      case 'end_conversation':
        this.endConversation();
        break;
    }
  }

  /**
   * 打开商店
   */
  private openShop(): void {
    this.isShopOpen = true;
    const uiScene = this.gameManager.getUIScene();
    if (uiScene) {
      uiScene.events.emit('open-shop', {
        npcName: this.npcName,
        items: this.shopItems,
        mood: this.mood,
        friendship: this.friendship
      });
    }
  }

  /**
   * 显示种植技巧
   */
  private showFarmingTips(): void {
    const tips = this.dialogues.get('farming_tips') || ['种植需要耐心和细心。'];
    const randomTip = tips[Math.floor(Math.random() * tips.length)];
    this.showDialogue(randomTip);
  }

  /**
   * 开始烹饪课程
   */
  private startCookingLesson(): void {
    // 激活烹饪任务
    const cookingQuest = this.quests.find(q => q.id === 'cooking_lesson');
    if (cookingQuest && !cookingQuest.isActive) {
      cookingQuest.isActive = true;
      this.availableQuests.push(cookingQuest);
    }
    
    this.showDialogue('让我教你如何制作简单的料理...');
  }

  /**
   * 显示可用任务
   */
  private showAvailableQuests(): void {
    const uiScene = this.gameManager.getUIScene();
    if (uiScene) {
      uiScene.events.emit('show-quests', {
        npcName: this.npcName,
        quests: this.availableQuests
      });
    }
  }

  /**
   * 结束对话
   */
  private endConversation(): void {
    this.isInConversation = false;
    this.currentState = NPCState.IDLE;
    
    const uiScene = this.gameManager.getUIScene();
    if (uiScene) {
      uiScene.events.emit('hide-dialogue');
    }
  }

  /**
   * 时间变化处理
   */
  private onTimeChange(timeData: { hour: number; isDay: boolean }): void {
    this.currentHour = timeData.hour;
  }

  /**
   * 更新方法
   */
  public update(): void {
    // 更新动画状态
    this.updateAnimationState();
  }

  /**
   * 更新动画状态
   */
  private updateAnimationState(): void {
    const animationKey = `npc_${this.npcType}_${this.currentState}`;
    if (this.animationManager) {
      this.animationManager.playAnimation(this, animationKey, true);
    }
  }

  /**
   * 获取NPC信息
   */
  public getNPCInfo(): {
    name: string;
    type: NPCType;
    mood: number;
    friendship: number;
    isInConversation: boolean;
    currentState: NPCState;
  } {
    return {
      name: this.npcName,
      type: this.npcType,
      mood: this.mood,
      friendship: this.friendship,
      isInConversation: this.isInConversation,
      currentState: this.currentState
    };
  }

  /**
   * 销毁NPC
   */
  public destroy(): void {
    if (this.behaviorTimer) {
      this.behaviorTimer.destroy();
    }
    
    this.gameManager.off('player-interact', this.checkPlayerInteraction, this);
    this.gameManager.off('time-changed', this.onTimeChange, this);
    
    super.destroy();
  }
}
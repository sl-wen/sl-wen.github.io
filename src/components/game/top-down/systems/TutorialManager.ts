export interface TutorialStep {
  id: string;
  title: string;
  description: string;
  type: 'info' | 'interactive' | 'highlight' | 'complete';
  target?: string; // 目标元素或区域
  position?: { x: number; y: number };
  required?: boolean; // 是否必须完成
  condition?: () => boolean; // 完成条件
  onComplete?: () => void; // 完成回调
  onSkip?: () => void; // 跳过回调
}

export interface Tutorial {
  id: string;
  name: string;
  description: string;
  steps: TutorialStep[];
  isCompleted: boolean;
  isSkippable: boolean;
  autoStart: boolean;
}

export class TutorialManager {
  private static instance: TutorialManager;
  private tutorials: Map<string, Tutorial> = new Map();
  private currentTutorial: Tutorial | null = null;
  private currentStepIndex: number = 0;
  private isActive: boolean = false;
  private onTutorialEventCallback?: (event: string, data: any) => void;

  private constructor() {
    this.initializeTutorials();
  }

  public static getInstance(): TutorialManager {
    if (!TutorialManager.instance) {
      TutorialManager.instance = new TutorialManager();
    }
    return TutorialManager.instance;
  }

  private initializeTutorials(): void {
    // 基础操作教程
    this.addTutorial({
      id: 'basic_controls',
      name: '基础操作教程',
      description: '学习游戏的基本操作',
      isCompleted: false,
      isSkippable: true,
      autoStart: true,
      steps: [
        {
          id: 'welcome',
          title: '欢迎来到游戏世界！',
          description: '让我们开始学习游戏的基本操作。按空格键继续。',
          type: 'info',
          required: true
        },
        {
          id: 'movement',
          title: '角色移动',
          description: '使用WASD键或方向键来移动角色。试试移动一下！',
          type: 'interactive',
          required: true,
          condition: () => {
            // 检查是否移动过
            return this.hasPlayerMoved();
          }
        },
        {
          id: 'attack',
          title: '攻击敌人',
          description: '按空格键攻击敌人。你需要先获得武器才能攻击。',
          type: 'info',
          required: false
        },
        {
          id: 'interact',
          title: '与NPC交互',
          description: '按回车键与NPC对话或与物品交互。',
          type: 'info',
          required: false
        },
        {
          id: 'inventory',
          title: '打开背包',
          description: '按I键打开背包查看物品。',
          type: 'interactive',
          required: true,
          condition: () => {
            return this.hasOpenedInventory();
          }
        },
        {
          id: 'menu',
          title: '游戏菜单',
          description: '按ESC键打开游戏菜单。',
          type: 'interactive',
          required: true,
          condition: () => {
            return this.hasOpenedMenu();
          }
        }
      ]
    });

    // 战斗教程
    this.addTutorial({
      id: 'combat_tutorial',
      name: '战斗教程',
      description: '学习如何与敌人战斗',
      isCompleted: false,
      isSkippable: true,
      autoStart: false,
      steps: [
        {
          id: 'find_enemy',
          title: '寻找敌人',
          description: '在地图上寻找敌人。敌人通常有红色、绿色或黄色的颜色。',
          type: 'info',
          required: true
        },
        {
          id: 'approach_enemy',
          title: '接近敌人',
          description: '移动到敌人附近，但不要直接接触。',
          type: 'interactive',
          required: true,
          condition: () => {
            return this.isNearEnemy();
          }
        },
        {
          id: 'attack_timing',
          title: '攻击时机',
          description: '等待敌人攻击后，按空格键进行反击。',
          type: 'interactive',
          required: true,
          condition: () => {
            return this.hasAttackedEnemy();
          }
        },
        {
          id: 'collect_loot',
          title: '收集战利品',
          description: '击败敌人后，收集掉落的物品。',
          type: 'info',
          required: false
        }
      ]
    });

    // 收集教程
    this.addTutorial({
      id: 'collection_tutorial',
      name: '收集教程',
      description: '学习如何收集物品',
      isCompleted: false,
      isSkippable: true,
      autoStart: false,
      steps: [
        {
          id: 'find_items',
          title: '寻找物品',
          description: '在地图上寻找可以收集的物品，如金币和心形。',
          type: 'info',
          required: true
        },
        {
          id: 'collect_coin',
          title: '收集金币',
          description: '移动到金币上自动收集。',
          type: 'interactive',
          required: true,
          condition: () => {
            return this.hasCollectedCoin();
          }
        },
        {
          id: 'collect_heart',
          title: '收集心形',
          description: '收集心形可以恢复生命值。',
          type: 'interactive',
          required: true,
          condition: () => {
            return this.hasCollectedHeart();
          }
        },
        {
          id: 'special_items',
          title: '特殊物品',
          description: '注意收集特殊物品，如心形容器和武器。',
          type: 'info',
          required: false
        }
      ]
    });

    // 制作教程
    this.addTutorial({
      id: 'crafting_tutorial',
      name: '制作教程',
      description: '学习如何制作物品',
      isCompleted: false,
      isSkippable: true,
      autoStart: false,
      steps: [
        {
          id: 'open_crafting',
          title: '打开制作界面',
          description: '按I键打开背包，然后点击制作标签页。',
          type: 'interactive',
          required: true,
          condition: () => {
            return this.hasOpenedCrafting();
          }
        },
        {
          id: 'select_recipe',
          title: '选择配方',
          description: '选择一个可制作的配方。',
          type: 'interactive',
          required: true,
          condition: () => {
            return this.hasSelectedRecipe();
          }
        },
        {
          id: 'craft_item',
          title: '制作物品',
          description: '点击制作按钮开始制作。',
          type: 'interactive',
          required: true,
          condition: () => {
            return this.hasCraftedItem();
          }
        },
        {
          id: 'crafting_success',
          title: '制作成功',
          description: '制作完成后，物品会自动添加到背包中。',
          type: 'info',
          required: false
        }
      ]
    });

    // 商店教程
    this.addTutorial({
      id: 'shop_tutorial',
      name: '商店教程',
      description: '学习如何与商店交易',
      isCompleted: false,
      isSkippable: true,
      autoStart: false,
      steps: [
        {
          id: 'find_shop',
          title: '寻找商店',
          description: '在地图上寻找商店NPC。',
          type: 'info',
          required: true
        },
        {
          id: 'talk_to_shopkeeper',
          title: '与店主对话',
          description: '按回车键与店主对话。',
          type: 'interactive',
          required: true,
          condition: () => {
            return this.hasTalkedToShopkeeper();
          }
        },
        {
          id: 'buy_item',
          title: '购买物品',
          description: '选择要购买的物品并确认。',
          type: 'interactive',
          required: true,
          condition: () => {
            return this.hasBoughtItem();
          }
        },
        {
          id: 'sell_item',
          title: '出售物品',
          description: '选择要出售的物品并确认。',
          type: 'interactive',
          required: true,
          condition: () => {
            return this.hasSoldItem();
          }
        }
      ]
    });
  }

  private addTutorial(tutorial: Tutorial): void {
    this.tutorials.set(tutorial.id, tutorial);
  }

  // 开始教程
  public startTutorial(tutorialId: string): boolean {
    const tutorial = this.tutorials.get(tutorialId);
    if (!tutorial || tutorial.isCompleted) {
      return false;
    }

    this.currentTutorial = tutorial;
    this.currentStepIndex = 0;
    this.isActive = true;

    this.triggerTutorialEvent('tutorial-started', { tutorial });
    this.showCurrentStep();

    return true;
  }

  // 显示当前步骤
  private showCurrentStep(): void {
    if (!this.currentTutorial || this.currentStepIndex >= this.currentTutorial.steps.length) {
      this.completeTutorial();
      return;
    }

    const step = this.currentTutorial.steps[this.currentStepIndex];
    this.triggerTutorialEvent('step-shown', { step, stepIndex: this.currentStepIndex });
  }

  // 下一步
  public nextStep(): void {
    if (!this.currentTutorial) return;

    const currentStep = this.currentTutorial.steps[this.currentStepIndex];
    if (currentStep.onComplete) {
      currentStep.onComplete();
    }

    this.currentStepIndex++;
    this.showCurrentStep();
  }

  // 上一步
  public previousStep(): void {
    if (!this.currentTutorial || this.currentStepIndex <= 0) return;

    this.currentStepIndex--;
    this.showCurrentStep();
  }

  // 跳过教程
  public skipTutorial(): void {
    if (!this.currentTutorial) return;

    if (this.currentTutorial.isSkippable) {
      const currentStep = this.currentTutorial.steps[this.currentStepIndex];
      if (currentStep.onSkip) {
        currentStep.onSkip();
      }

      this.triggerTutorialEvent('tutorial-skipped', { tutorial: this.currentTutorial });
      this.completeTutorial();
    }
  }

  // 完成教程
  private completeTutorial(): void {
    if (!this.currentTutorial) return;

    this.currentTutorial.isCompleted = true;
    this.saveTutorialProgress();

    this.triggerTutorialEvent('tutorial-completed', { tutorial: this.currentTutorial });
    
    this.isActive = false;
    this.currentTutorial = null;
    this.currentStepIndex = 0;
  }

  // 检查步骤完成条件
  public checkStepCondition(): boolean {
    if (!this.currentTutorial) return false;

    const step = this.currentTutorial.steps[this.currentStepIndex];
    if (!step.condition) return true;

    return step.condition();
  }

  // 获取当前教程信息
  public getCurrentTutorial(): { tutorial: Tutorial | null; step: TutorialStep | null; stepIndex: number } {
    if (!this.currentTutorial) {
      return { tutorial: null, step: null, stepIndex: 0 };
    }

    const step = this.currentTutorial.steps[this.currentStepIndex] || null;
    return {
      tutorial: this.currentTutorial,
      step,
      stepIndex: this.currentStepIndex
    };
  }

  // 获取所有教程
  public getAllTutorials(): Tutorial[] {
    return Array.from(this.tutorials.values());
  }

  // 获取教程进度
  public getTutorialProgress(): { completed: number; total: number; percentage: number } {
    const tutorials = this.getAllTutorials();
    const completed = tutorials.filter(t => t.isCompleted).length;
    const total = tutorials.length;
    const percentage = total > 0 ? (completed / total) * 100 : 0;

    return { completed, total, percentage };
  }

  // 重置教程进度
  public resetTutorialProgress(): void {
    this.tutorials.forEach(tutorial => {
      tutorial.isCompleted = false;
    });
    this.saveTutorialProgress();
  }

  // 检查是否应该自动开始教程
  public checkAutoStartTutorials(): void {
    this.tutorials.forEach(tutorial => {
      if (tutorial.autoStart && !tutorial.isCompleted && !this.isActive) {
        this.startTutorial(tutorial.id);
      }
    });
  }

  // 触发教程事件
  private triggerTutorialEvent(event: string, data: any): void {
    if (this.onTutorialEventCallback) {
      this.onTutorialEventCallback(event, data);
    }

    const customEvent = new CustomEvent(`tutorial-${event}`, { detail: data });
    window.dispatchEvent(customEvent);
  }

  // 设置事件回调
  public setOnTutorialEvent(callback: (event: string, data: any) => void): void {
    this.onTutorialEventCallback = callback;
  }

  // 条件检查方法（这些方法需要根据实际游戏状态实现）
  private hasPlayerMoved(): boolean {
    // 检查玩家是否移动过
    return false; // 需要根据实际游戏状态实现
  }

  private hasOpenedInventory(): boolean {
    // 检查是否打开过背包
    return false; // 需要根据实际游戏状态实现
  }

  private hasOpenedMenu(): boolean {
    // 检查是否打开过菜单
    return false; // 需要根据实际游戏状态实现
  }

  private isNearEnemy(): boolean {
    // 检查是否接近敌人
    return false; // 需要根据实际游戏状态实现
  }

  private hasAttackedEnemy(): boolean {
    // 检查是否攻击过敌人
    return false; // 需要根据实际游戏状态实现
  }

  private hasCollectedCoin(): boolean {
    // 检查是否收集过金币
    return false; // 需要根据实际游戏状态实现
  }

  private hasCollectedHeart(): boolean {
    // 检查是否收集过心形
    return false; // 需要根据实际游戏状态实现
  }

  private hasOpenedCrafting(): boolean {
    // 检查是否打开过制作界面
    return false; // 需要根据实际游戏状态实现
  }

  private hasSelectedRecipe(): boolean {
    // 检查是否选择过配方
    return false; // 需要根据实际游戏状态实现
  }

  private hasCraftedItem(): boolean {
    // 检查是否制作过物品
    return false; // 需要根据实际游戏状态实现
  }

  private hasTalkedToShopkeeper(): boolean {
    // 检查是否与店主对话过
    return false; // 需要根据实际游戏状态实现
  }

  private hasBoughtItem(): boolean {
    // 检查是否购买过物品
    return false; // 需要根据实际游戏状态实现
  }

  private hasSoldItem(): boolean {
    // 检查是否出售过物品
    return false; // 需要根据实际游戏状态实现
  }

  // 数据持久化
  private saveTutorialProgress(): void {
    try {
      const progress = Array.from(this.tutorials.values()).map(tutorial => ({
        id: tutorial.id,
        isCompleted: tutorial.isCompleted
      }));
      localStorage.setItem('tutorial_progress', JSON.stringify(progress));
    } catch (error) {
      console.error('保存教程进度失败:', error);
    }
  }

  private loadTutorialProgress(): void {
    try {
      const savedProgress = localStorage.getItem('tutorial_progress');
      if (savedProgress) {
        const progress = JSON.parse(savedProgress);
        progress.forEach((item: any) => {
          const tutorial = this.tutorials.get(item.id);
          if (tutorial) {
            tutorial.isCompleted = item.isCompleted;
          }
        });
      }
    } catch (error) {
      console.error('加载教程进度失败:', error);
    }
  }

  // 初始化时加载进度
  public initialize(): void {
    this.loadTutorialProgress();
  }
}
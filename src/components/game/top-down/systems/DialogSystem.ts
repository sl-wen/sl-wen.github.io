/**
 * 对话框系统
 * 处理游戏中的对话、分支对话、条件对话、动画文本等功能
 */

import { storage } from '../utils';

// 对话节点类型
export type DialogNodeType = 'text' | 'choice' | 'condition' | 'action' | 'branch' | 'loop' | 'end';

// 对话节点
export interface DialogNode {
  id: string;
  type: DialogNodeType;
  text?: string;
  speaker?: string;
  voiceFile?: string;
  animation?: string;
  duration?: number;
  autoAdvance?: boolean;
  choices?: DialogChoice[];
  conditions?: DialogCondition[];
  actions?: DialogAction[];
  nextNode?: string;
  branches?: DialogBranch[];
  loopCount?: number;
  maxLoops?: number;
  metadata?: Record<string, any>;
}

// 对话选择
export interface DialogChoice {
  id: string;
  text: string;
  condition?: DialogCondition;
  action?: DialogAction;
  nextNode: string;
  icon?: string;
  disabled?: boolean;
  tooltip?: string;
}

// 对话条件
export interface DialogCondition {
  type: 'quest' | 'item' | 'level' | 'reputation' | 'flag' | 'time' | 'weather' | 'location' | 'custom';
  target: string;
  operator: 'equals' | 'not_equals' | 'greater_than' | 'less_than' | 'contains' | 'not_contains' | 'exists' | 'not_exists';
  value: any;
  customFunction?: () => boolean;
}

// 对话动作
export interface DialogAction {
  type: 'give_item' | 'take_item' | 'start_quest' | 'complete_quest' | 'change_reputation' | 'set_flag' | 'teleport' | 'play_sound' | 'show_effect' | 'custom';
  target: string;
  value: any;
  customFunction?: () => void;
}

// 对话分支
export interface DialogBranch {
  condition: DialogCondition;
  nextNode: string;
}

// 对话状态
export interface DialogState {
  currentNode: string;
  visitedNodes: Set<string>;
  choiceHistory: string[];
  dialogHistory: DialogHistoryEntry[];
  flags: Record<string, any>;
  startTime: number;
  endTime?: number;
}

// 对话历史条目
export interface DialogHistoryEntry {
  id: string;
  speaker: string;
  text: string;
  timestamp: number;
  choices?: string[];
  selectedChoice?: string;
}

// 对话配置
export interface DialogConfig {
  // 显示设置
  display: {
    fontSize: number;
    fontFamily: string;
    textColor: string;
    backgroundColor: string;
    borderColor: string;
    borderWidth: number;
    padding: number;
    margin: number;
    maxWidth: number;
    maxHeight: number;
    position: 'top' | 'bottom' | 'center';
    animation: 'fade' | 'slide' | 'typewriter' | 'none';
    animationSpeed: number;
  };
  
  // 音频设置
  audio: {
    enableVoice: boolean;
    voiceVolume: number;
    textSoundVolume: number;
    autoPlayVoice: boolean;
    voiceDelay: number;
  };
  
  // 交互设置
  interaction: {
    autoAdvance: boolean;
    autoAdvanceDelay: number;
    skipEnabled: boolean;
    skipSpeed: number;
    choiceTimeout: number;
    maxChoices: number;
  };
  
  // 历史设置
  history: {
    enableHistory: boolean;
    maxHistoryEntries: number;
    saveHistory: boolean;
    showHistory: boolean;
  };
  
  // 调试设置
  debug: {
    showNodeIds: boolean;
    logDialogEvents: boolean;
    enableDebugMode: boolean;
  };
}

// 对话事件
export interface DialogEvent {
  type: 'start' | 'end' | 'next' | 'choice' | 'condition' | 'action' | 'branch' | 'error';
  nodeId: string;
  data?: any;
  timestamp: number;
}

export class DialogSystem {
  private static instance: DialogSystem;
  private config: DialogConfig;
  private dialogs: Map<string, DialogNode[]> = new Map();
  private currentDialog: string | null = null;
  private currentState: DialogState | null = null;
  private isActive = false;
  private scene: Phaser.Scene | null = null;
  private dialogContainer: Phaser.GameObjects.Container | null = null;
  private textObject: Phaser.GameObjects.Text | null = null;
  private backgroundObject: Phaser.GameObjects.Rectangle | null = null;
  private choiceContainer: Phaser.GameObjects.Container | null = null;
  private events: DialogEvent[] = [];
  private callbacks: Map<string, (data: any) => void> = new Map();
  
  // 动画状态
  private animationState = {
    isAnimating: false,
    currentChar: 0,
    animationTimer: 0,
    typewriterSpeed: 50
  };

  private constructor() {
    this.config = this.getDefaultConfig();
    this.loadConfig();
    this.loadDialogs();
  }

  public static getInstance(): DialogSystem {
    if (!DialogSystem.instance) {
      DialogSystem.instance = new DialogSystem();
    }
    return DialogSystem.instance;
  }

  /**
   * 获取默认配置
   */
  private getDefaultConfig(): DialogConfig {
    return {
      display: {
        fontSize: 16,
        fontFamily: 'Arial',
        textColor: '#ffffff',
        backgroundColor: '#000000',
        borderColor: '#ffffff',
        borderWidth: 2,
        padding: 10,
        margin: 20,
        maxWidth: 600,
        maxHeight: 200,
        position: 'bottom',
        animation: 'typewriter',
        animationSpeed: 50
      },
      audio: {
        enableVoice: true,
        voiceVolume: 0.8,
        textSoundVolume: 0.3,
        autoPlayVoice: true,
        voiceDelay: 0
      },
      interaction: {
        autoAdvance: false,
        autoAdvanceDelay: 3000,
        skipEnabled: true,
        skipSpeed: 10,
        choiceTimeout: 0,
        maxChoices: 4
      },
      history: {
        enableHistory: true,
        maxHistoryEntries: 100,
        saveHistory: true,
        showHistory: false
      },
      debug: {
        showNodeIds: false,
        logDialogEvents: false,
        enableDebugMode: false
      }
    };
  }

  /**
   * 加载配置
   */
  private loadConfig(): void {
    const savedConfig = storage.get('dialog_config', null);
    if (savedConfig) {
      this.config = { ...this.config, ...(savedConfig as any) };
    }
  }

  /**
   * 保存配置
   */
  private saveConfig(): void {
    storage.set('dialog_config', this.config);
  }

  /**
   * 加载对话数据
   */
  private loadDialogs(): void {
    const savedDialogs = storage.get('dialog_data', null);
    if (savedDialogs) {
      this.dialogs = new Map(savedDialogs);
    }
  }

  /**
   * 保存对话数据
   */
  private saveDialogs(): void {
    storage.set('dialog_data', Array.from(this.dialogs.entries()));
  }

  /**
   * 初始化对话框系统
   * @param scene - Phaser场景
   */
  initialize(scene: Phaser.Scene): void {
    this.scene = scene;
    this.setupInputHandlers();
    console.log('对话框系统已初始化');
  }

  /**
   * 设置输入处理器
   */
  private setupInputHandlers(): void {
    if (!this.scene) return;
    
    // 空格键继续对话
    this.scene.input.keyboard?.on('keydown-SPACE', () => {
      if (this.isActive) {
        this.nextDialog();
      }
    });
    
    // 回车键继续对话
    this.scene.input.keyboard?.on('keydown-ENTER', () => {
      if (this.isActive) {
        this.nextDialog();
      }
    });
    
    // ESC键跳过对话
    this.scene.input.keyboard?.on('keydown-ESC', () => {
      if (this.isActive && this.config.interaction.skipEnabled) {
        this.skipDialog();
      }
    });
  }

  /**
   * 开始对话
   * @param dialogId - 对话ID
   * @param startNode - 开始节点ID
   * @returns 是否成功开始
   */
  startDialog(dialogId: string, startNode: string = 'start'): boolean {
    if (!this.scene || this.isActive) {
      return false;
    }

    const dialog = this.dialogs.get(dialogId);
    if (!dialog) {
      console.error(`对话不存在: ${dialogId}`);
      return false;
    }

    const startDialogNode = dialog.find(node => node.id === startNode);
    if (!startDialogNode) {
      console.error(`开始节点不存在: ${startNode}`);
      return false;
    }

    this.currentDialog = dialogId;
    this.currentState = {
      currentNode: startNode,
      visitedNodes: new Set(),
      choiceHistory: [],
      dialogHistory: [],
      flags: {},
      startTime: Date.now()
    };

    this.isActive = true;
    this.createDialogUI();
    this.displayNode(startDialogNode);
    
    this.addEvent('start', startNode);
    console.log(`开始对话: ${dialogId} (节点: ${startNode})`);
    
    return true;
  }

  /**
   * 结束对话
   */
  endDialog(): void {
    if (!this.isActive) return;

    if (this.currentState) {
      this.currentState.endTime = Date.now();
      
      // 保存对话历史
      if (this.config.history.saveHistory) {
        this.saveDialogHistory();
      }
    }

    this.destroyDialogUI();
    this.isActive = false;
    this.currentDialog = null;
    this.currentState = null;
    
    this.addEvent('end', '');
    console.log('对话已结束');
  }

  /**
   * 下一个对话
   */
  nextDialog(): void {
    if (!this.isActive || !this.currentState || !this.currentDialog) return;

    const dialog = this.dialogs.get(this.currentDialog);
    if (!dialog) return;

    const currentNode = dialog.find(node => node.id === this.currentState!.currentNode);
    if (!currentNode) return;

    // 如果正在动画，跳过动画
    if (this.animationState.isAnimating) {
      this.skipAnimation();
      return;
    }

    // 处理节点类型
    switch (currentNode.type) {
      case 'text':
        this.handleTextNode(currentNode);
        break;
      case 'choice':
        this.handleChoiceNode(currentNode);
        break;
      case 'condition':
        this.handleConditionNode(currentNode);
        break;
      case 'action':
        this.handleActionNode(currentNode);
        break;
      case 'branch':
        this.handleBranchNode(currentNode);
        break;
      case 'loop':
        this.handleLoopNode(currentNode);
        break;
      case 'end':
        this.handleEndNode(currentNode);
        break;
    }
  }

  /**
   * 处理文本节点
   */
  private handleTextNode(node: DialogNode): void {
    if (node.autoAdvance) {
      // 自动前进
      setTimeout(() => {
        this.advanceToNextNode(node);
      }, node.duration || this.config.interaction.autoAdvanceDelay);
    } else {
      // 等待用户输入
      this.showContinuePrompt();
    }
  }

  /**
   * 处理选择节点
   */
  private handleChoiceNode(node: DialogNode): void {
    if (!node.choices || node.choices.length === 0) {
      this.advanceToNextNode(node);
      return;
    }

    this.displayChoices(node.choices);
  }

  /**
   * 处理条件节点
   */
  private handleConditionNode(node: DialogNode): void {
    if (!node.conditions || node.conditions.length === 0) {
      this.advanceToNextNode(node);
      return;
    }

    const result = this.evaluateConditions(node.conditions);
    if (result) {
      this.advanceToNextNode(node);
    } else {
      this.endDialog();
    }
  }

  /**
   * 处理动作节点
   */
  private handleActionNode(node: DialogNode): void {
    if (!node.actions || node.actions.length === 0) {
      this.advanceToNextNode(node);
      return;
    }

    this.executeActions(node.actions);
    this.advanceToNextNode(node);
  }

  /**
   * 处理分支节点
   */
  private handleBranchNode(node: DialogNode): void {
    if (!node.branches || node.branches.length === 0) {
      this.advanceToNextNode(node);
      return;
    }

    for (const branch of node.branches) {
      if (this.evaluateCondition(branch.condition)) {
        this.currentState!.currentNode = branch.nextNode;
        this.nextDialog();
        return;
      }
    }

    // 如果没有匹配的分支，使用默认下一个节点
    this.advanceToNextNode(node);
  }

  /**
   * 处理循环节点
   */
  private handleLoopNode(node: DialogNode): void {
    if (!this.currentState) return;

    const loopCount = this.currentState.flags[`loop_${node.id}`] || 0;
    const maxLoops = node.maxLoops || 1;

    if (loopCount < maxLoops) {
      this.currentState.flags[`loop_${node.id}`] = loopCount + 1;
      this.advanceToNextNode(node);
    } else {
      // 循环结束，清除循环计数
      delete this.currentState.flags[`loop_${node.id}`];
      this.advanceToNextNode(node);
    }
  }

  /**
   * 处理结束节点
   */
  private handleEndNode(node: DialogNode): void {
    this.endDialog();
  }

  /**
   * 前进到下一个节点
   */
  private advanceToNextNode(currentNode: DialogNode): void {
    if (!this.currentState) return;

    const nextNodeId = currentNode.nextNode;
    if (!nextNodeId) {
      this.endDialog();
      return;
    }

    const dialog = this.dialogs.get(this.currentDialog!);
    if (!dialog) return;

    const nextNode = dialog.find(node => node.id === nextNodeId);
    if (!nextNode) {
      console.error(`下一个节点不存在: ${nextNodeId}`);
      this.endDialog();
      return;
    }

    this.currentState.currentNode = nextNodeId;
    this.currentState.visitedNodes.add(nextNodeId);
    this.displayNode(nextNode);
    
    this.addEvent('next', nextNodeId);
  }

  /**
   * 显示节点
   */
  private displayNode(node: DialogNode): void {
    if (!this.scene || !this.dialogContainer) return;

    // 清除当前显示
    this.clearDisplay();

    // 显示文本
    if (node.text) {
      this.displayText(node.text, node.speaker);
    }

    // 播放语音
    if (node.voiceFile && this.config.audio.enableVoice) {
      this.playVoice(node.voiceFile);
    }

    // 播放动画
    if (node.animation) {
      this.playAnimation(node.animation);
    }

    // 添加到历史记录
    if (this.config.history.enableHistory && node.text) {
      this.addToHistory(node);
    }
  }

  /**
   * 显示文本
   */
  private displayText(text: string, speaker?: string): void {
    if (!this.scene || !this.textObject) return;

    const displayText = speaker ? `${speaker}: ${text}` : text;
    
    if (this.config.display.animation === 'typewriter') {
      this.startTypewriterAnimation(displayText);
    } else {
      this.textObject.setText(displayText);
    }
  }

  /**
   * 开始打字机动画
   */
  private startTypewriterAnimation(text: string): void {
    if (!this.textObject) return;

    this.animationState.isAnimating = true;
    this.animationState.currentChar = 0;
    this.animationState.animationTimer = 0;

    const animate = () => {
      if (!this.animationState.isAnimating || !this.textObject) return;

      this.animationState.animationTimer += this.animationState.typewriterSpeed;
      
      if (this.animationState.animationTimer >= this.config.display.animationSpeed) {
        this.animationState.currentChar++;
        this.animationState.animationTimer = 0;
        
        const currentText = text.substring(0, this.animationState.currentChar);
        this.textObject.setText(currentText);
        
        // 播放打字音效
        if (this.config.audio.textSoundVolume > 0) {
          this.playTextSound();
        }
        
        if (this.animationState.currentChar >= text.length) {
          this.animationState.isAnimating = false;
        } else {
          setTimeout(animate, this.config.display.animationSpeed);
        }
      } else {
        setTimeout(animate, this.animationState.typewriterSpeed);
      }
    };

    animate();
  }

  /**
   * 跳过动画
   */
  private skipAnimation(): void {
    if (!this.textObject) return;

    this.animationState.isAnimating = false;
    const currentNode = this.getCurrentNode();
    if (currentNode && currentNode.text) {
      const displayText = currentNode.speaker ? `${currentNode.speaker}: ${currentNode.text}` : currentNode.text;
      this.textObject.setText(displayText);
    }
  }

  /**
   * 显示选择
   */
  private displayChoices(choices: DialogChoice[]): void {
    if (!this.scene || !this.choiceContainer) return;

    // 过滤可用选择
    const availableChoices = choices.filter(choice => {
      if (choice.disabled) return false;
      if (choice.condition) {
        return this.evaluateCondition(choice.condition);
      }
      return true;
    });

    if (availableChoices.length === 0) {
      this.advanceToNextNode(this.getCurrentNode()!);
      return;
    }

    // 创建选择按钮
    availableChoices.forEach((choice, index) => {
      const button = this.createChoiceButton(choice, index);
      this.choiceContainer!.add(button);
    });
  }

  /**
   * 创建选择按钮
   */
  private createChoiceButton(choice: DialogChoice, index: number): Phaser.GameObjects.Container {
    if (!this.scene) throw new Error('Scene not available');

    const container = this.scene.add.container(0, index * 40);
    
    // 背景
    const background = this.scene.add.rectangle(0, 0, 200, 35, 0x333333, 0.8);
    background.setStrokeStyle(2, 0xffffff);
    
    // 文本
    const text = this.scene.add.text(0, 0, choice.text, {
      fontSize: '14px',
      color: '#ffffff'
    });
    text.setOrigin(0.5);
    
    // 图标
    if (choice.icon) {
      const icon = this.scene.add.image(-90, 0, choice.icon);
      icon.setScale(0.5);
      container.add(icon);
    }
    
    container.add([background, text]);
    
    // 交互
    background.setInteractive();
    background.on('pointerdown', () => {
      this.selectChoice(choice);
    });
    
    return container;
  }

  /**
   * 选择选项
   */
  private selectChoice(choice: DialogChoice): void {
    if (!this.currentState) return;

    // 执行选择动作
    if (choice.action) {
      this.executeAction(choice.action);
    }

    // 记录选择历史
    this.currentState.choiceHistory.push(choice.id);
    this.currentState.currentNode = choice.nextNode;

    // 清除选择显示
    this.clearChoices();

    // 继续对话
    this.nextDialog();
    
    this.addEvent('choice', choice.id);
  }

  /**
   * 评估条件
   */
  private evaluateCondition(condition: DialogCondition): boolean {
    switch (condition.type) {
      case 'quest':
        return this.evaluateQuestCondition(condition);
      case 'item':
        return this.evaluateItemCondition(condition);
      case 'level':
        return this.evaluateLevelCondition(condition);
      case 'reputation':
        return this.evaluateReputationCondition(condition);
      case 'flag':
        return this.evaluateFlagCondition(condition);
      case 'time':
        return this.evaluateTimeCondition(condition);
      case 'weather':
        return this.evaluateWeatherCondition(condition);
      case 'location':
        return this.evaluateLocationCondition(condition);
      case 'custom':
        return condition.customFunction ? condition.customFunction() : false;
      default:
        return false;
    }
  }

  /**
   * 评估多个条件
   */
  private evaluateConditions(conditions: DialogCondition[]): boolean {
    return conditions.every(condition => this.evaluateCondition(condition));
  }

  /**
   * 评估任务条件
   */
  private evaluateQuestCondition(condition: DialogCondition): boolean {
    // 这里需要集成任务系统
    return true;
  }

  /**
   * 评估物品条件
   */
  private evaluateItemCondition(condition: DialogCondition): boolean {
    // 这里需要集成背包系统
    return true;
  }

  /**
   * 评估等级条件
   */
  private evaluateLevelCondition(condition: DialogCondition): boolean {
    // 这里需要集成玩家系统
    return true;
  }

  /**
   * 评估声望条件
   */
  private evaluateReputationCondition(condition: DialogCondition): boolean {
    // 这里需要集成声望系统
    return true;
  }

  /**
   * 评估标志条件
   */
  private evaluateFlagCondition(condition: DialogCondition): boolean {
    if (!this.currentState) return false;
    
    const flagValue = this.currentState.flags[condition.target];
    
    switch (condition.operator) {
      case 'equals':
        return flagValue === condition.value;
      case 'not_equals':
        return flagValue !== condition.value;
      case 'greater_than':
        return flagValue > condition.value;
      case 'less_than':
        return flagValue < condition.value;
      case 'exists':
        return flagValue !== undefined;
      case 'not_exists':
        return flagValue === undefined;
      default:
        return false;
    }
  }

  /**
   * 评估时间条件
   */
  private evaluateTimeCondition(condition: DialogCondition): boolean {
    const currentTime = new Date();
    const hour = currentTime.getHours();
    
    switch (condition.operator) {
      case 'greater_than':
        return hour > condition.value;
      case 'less_than':
        return hour < condition.value;
      default:
        return false;
    }
  }

  /**
   * 评估天气条件
   */
  private evaluateWeatherCondition(condition: DialogCondition): boolean {
    // 这里需要集成天气系统
    return true;
  }

  /**
   * 评估位置条件
   */
  private evaluateLocationCondition(condition: DialogCondition): boolean {
    // 这里需要集成地图系统
    return true;
  }

  /**
   * 执行动作
   */
  private executeAction(action: DialogAction): void {
    switch (action.type) {
      case 'give_item':
        this.executeGiveItemAction(action);
        break;
      case 'take_item':
        this.executeTakeItemAction(action);
        break;
      case 'start_quest':
        this.executeStartQuestAction(action);
        break;
      case 'complete_quest':
        this.executeCompleteQuestAction(action);
        break;
      case 'change_reputation':
        this.executeChangeReputationAction(action);
        break;
      case 'set_flag':
        this.executeSetFlagAction(action);
        break;
      case 'teleport':
        this.executeTeleportAction(action);
        break;
      case 'play_sound':
        this.executePlaySoundAction(action);
        break;
      case 'show_effect':
        this.executeShowEffectAction(action);
        break;
      case 'custom':
        if (action.customFunction) {
          action.customFunction();
        }
        break;
    }
  }

  /**
   * 执行多个动作
   */
  private executeActions(actions: DialogAction[]): void {
    actions.forEach(action => this.executeAction(action));
  }

  /**
   * 执行给予物品动作
   */
  private executeGiveItemAction(action: DialogAction): void {
    // 这里需要集成背包系统
    console.log(`给予物品: ${action.target} x${action.value}`);
  }

  /**
   * 执行拿走物品动作
   */
  private executeTakeItemAction(action: DialogAction): void {
    // 这里需要集成背包系统
    console.log(`拿走物品: ${action.target} x${action.value}`);
  }

  /**
   * 执行开始任务动作
   */
  private executeStartQuestAction(action: DialogAction): void {
    // 这里需要集成任务系统
    console.log(`开始任务: ${action.target}`);
  }

  /**
   * 执行完成任务动作
   */
  private executeCompleteQuestAction(action: DialogAction): void {
    // 这里需要集成任务系统
    console.log(`完成任务: ${action.target}`);
  }

  /**
   * 执行改变声望动作
   */
  private executeChangeReputationAction(action: DialogAction): void {
    // 这里需要集成声望系统
    console.log(`改变声望: ${action.target} +${action.value}`);
  }

  /**
   * 执行设置标志动作
   */
  private executeSetFlagAction(action: DialogAction): void {
    if (!this.currentState) return;
    
    this.currentState.flags[action.target] = action.value;
    console.log(`设置标志: ${action.target} = ${action.value}`);
  }

  /**
   * 执行传送动作
   */
  private executeTeleportAction(action: DialogAction): void {
    // 这里需要集成地图系统
    console.log(`传送到: ${action.target}`);
  }

  /**
   * 执行播放音效动作
   */
  private executePlaySoundAction(action: DialogAction): void {
    if (!this.scene) return;
    
    this.scene.sound.play(action.target, { volume: this.config.audio.voiceVolume });
  }

  /**
   * 执行显示特效动作
   */
  private executeShowEffectAction(action: DialogAction): void {
    // 这里可以添加特效系统
    console.log(`显示特效: ${action.target}`);
  }

  /**
   * 创建对话框UI
   */
  private createDialogUI(): void {
    if (!this.scene) return;

    this.dialogContainer = this.scene.add.container(0, 0);
    
    // 背景
    this.backgroundObject = this.scene.add.rectangle(
      this.scene.cameras.main.width / 2,
      this.scene.cameras.main.height - this.config.display.margin - this.config.display.maxHeight / 2,
      this.config.display.maxWidth,
      this.config.display.maxHeight,
      parseInt(this.config.display.backgroundColor.replace('#', '0x')),
      0.8
    );
    this.backgroundObject.setStrokeStyle(
      this.config.display.borderWidth,
      parseInt(this.config.display.borderColor.replace('#', '0x'))
    );
    
    // 文本
    this.textObject = this.scene.add.text(
      this.scene.cameras.main.width / 2,
      this.scene.cameras.main.height - this.config.display.margin - this.config.display.maxHeight / 2,
      '',
      {
        fontSize: `${this.config.display.fontSize}px`,
        fontFamily: this.config.display.fontFamily,
        color: this.config.display.textColor,
        wordWrap: { width: this.config.display.maxWidth - this.config.display.padding * 2 }
      }
    );
    this.textObject.setOrigin(0.5);
    
    // 选择容器
    this.choiceContainer = this.scene.add.container(
      this.scene.cameras.main.width / 2,
      this.scene.cameras.main.height - this.config.display.margin - this.config.display.maxHeight - 50
    );
    
    this.dialogContainer.add([this.backgroundObject, this.textObject, this.choiceContainer]);
    this.dialogContainer.setDepth(1000);
    this.dialogContainer.setScrollFactor(0);
  }

  /**
   * 销毁对话框UI
   */
  private destroyDialogUI(): void {
    if (this.dialogContainer) {
      this.dialogContainer.destroy();
      this.dialogContainer = null;
      this.textObject = null;
      this.backgroundObject = null;
      this.choiceContainer = null;
    }
  }

  /**
   * 清除显示
   */
  private clearDisplay(): void {
    if (this.textObject) {
      this.textObject.setText('');
    }
    this.clearChoices();
  }

  /**
   * 清除选择
   */
  private clearChoices(): void {
    if (this.choiceContainer) {
      this.choiceContainer.removeAll(true);
    }
  }

  /**
   * 显示继续提示
   */
  private showContinuePrompt(): void {
    if (!this.textObject) return;
    
    const currentText = this.textObject.text;
    this.textObject.setText(currentText + '\n\n[按空格键继续]');
  }

  /**
   * 播放语音
   */
  private playVoice(voiceFile: string): void {
    if (!this.scene || !this.config.audio.enableVoice) return;
    
    setTimeout(() => {
      this.scene!.sound.play(voiceFile, { volume: this.config.audio.voiceVolume });
    }, this.config.audio.voiceDelay);
  }

  /**
   * 播放动画
   */
  private playAnimation(animation: string): void {
    // 这里可以添加动画系统
    console.log(`播放动画: ${animation}`);
  }

  /**
   * 播放文本音效
   */
  private playTextSound(): void {
    if (!this.scene) return;
    
    this.scene.sound.play('text_sound', { volume: this.config.audio.textSoundVolume });
  }

  /**
   * 跳过对话
   */
  private skipDialog(): void {
    if (!this.isActive) return;
    
    this.endDialog();
  }

  /**
   * 获取当前节点
   */
  private getCurrentNode(): DialogNode | null {
    if (!this.currentDialog || !this.currentState) return null;
    
    const dialog = this.dialogs.get(this.currentDialog);
    if (!dialog) return null;
    
    return dialog.find(node => node.id === this.currentState!.currentNode) || null;
  }

  /**
   * 添加到历史记录
   */
  private addToHistory(node: DialogNode): void {
    if (!this.currentState) return;
    
    const historyEntry: DialogHistoryEntry = {
      id: node.id,
      speaker: node.speaker || '系统',
      text: node.text || '',
      timestamp: Date.now(),
      choices: node.choices?.map(choice => choice.text),
      selectedChoice: undefined
    };
    
    this.currentState.dialogHistory.push(historyEntry);
    
    // 限制历史记录数量
    if (this.currentState.dialogHistory.length > this.config.history.maxHistoryEntries) {
      this.currentState.dialogHistory.shift();
    }
  }

  /**
   * 保存对话历史
   */
  private saveDialogHistory(): void {
    if (!this.currentState) return;
    
    const historyKey = `dialog_history_${this.currentDialog}`;
    storage.set(historyKey, this.currentState.dialogHistory);
  }

  /**
   * 添加事件
   */
  private addEvent(type: DialogEvent['type'], nodeId: string, data?: any): void {
    const event: DialogEvent = {
      type,
      nodeId,
      data,
      timestamp: Date.now()
    };
    
    this.events.push(event);
    
    if (this.config.debug.logDialogEvents) {
      console.log('对话事件:', event);
    }
  }

  /**
   * 注册回调
   */
  registerCallback(eventType: string, callback: (data: any) => void): void {
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
   * 添加对话
   */
  addDialog(dialogId: string, nodes: DialogNode[]): void {
    this.dialogs.set(dialogId, nodes);
    this.saveDialogs();
  }

  /**
   * 获取对话
   */
  getDialog(dialogId: string): DialogNode[] | undefined {
    return this.dialogs.get(dialogId);
  }

  /**
   * 删除对话
   */
  removeDialog(dialogId: string): void {
    this.dialogs.delete(dialogId);
    this.saveDialogs();
  }

  /**
   * 获取配置
   */
  getConfig(): DialogConfig {
    return { ...this.config };
  }

  /**
   * 更新配置
   */
  updateConfig(config: Partial<DialogConfig>): void {
    this.config = { ...this.config, ...config };
    this.saveConfig();
  }

  /**
   * 获取当前状态
   */
  getCurrentState(): DialogState | null {
    return this.currentState ? { ...this.currentState } : null;
  }

  /**
   * 获取事件历史
   */
  getEvents(): DialogEvent[] {
    return [...this.events];
  }

  /**
   * 是否处于活动状态
   */
  isDialogActive(): boolean {
    return this.isActive;
  }

  /**
   * 清理资源
   */
  destroy(): void {
    this.endDialog();
    this.dialogs.clear();
    this.events = [];
    this.callbacks.clear();
    this.scene = null;
  }
}
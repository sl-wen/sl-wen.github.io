import * as Phaser from 'phaser';

// 任务类型枚举
export enum QuestType {
  KILL = 'kill',
  COLLECT = 'collect',
  EXPLORE = 'explore',
  ESCORT = 'escort',
  DELIVERY = 'delivery',
  CRAFT = 'craft',
  TALK = 'talk',
  TIMED = 'timed'
}

// 任务状态枚举
export enum QuestStatus {
  NOT_STARTED = 'not_started',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  FAILED = 'failed',
  REWARDED = 'rewarded'
}

// 任务目标接口
export interface QuestObjective {
  id: string;
  type: QuestType;
  description: string;
  target: string;
  current: number;
  required: number;
  completed: boolean;
  location?: { x: number; y: number };
  timeLimit?: number;
}

// 任务奖励接口
export interface QuestReward {
  experience: number;
  gold: number;
  items: { itemId: string; quantity: number }[];
  reputation?: { faction: string; amount: number };
  skillPoints?: number;
  title?: string;
}

// 任务接口
export interface Quest {
  id: string;
  title: string;
  description: string;
  type: QuestType;
  level: number;
  status: QuestStatus;
  objectives: QuestObjective[];
  rewards: QuestReward;
  prerequisites: string[];
  timeLimit?: number;
  startTime?: number;
  completedTime?: number;
  giver: string;
  receiver: string;
  location: { x: number; y: number };
  isRepeatable: boolean;
  isMainQuest: boolean;
  isHidden: boolean;
  dialogue: {
    start: string[];
    progress: string[];
    complete: string[];
    fail: string[];
  };
}

// 任务事件接口
export interface QuestEvent {
  type: 'started' | 'updated' | 'completed' | 'failed' | 'rewarded';
  quest: Quest;
  objective?: QuestObjective;
  progress?: number;
}

export class QuestSystem {
  private scene: Phaser.Scene;
  private quests: Map<string, Quest> = new Map();
  private activeQuests: Map<string, Quest> = new Map();
  private completedQuests: Set<string> = new Set();
  private failedQuests: Set<string> = new Set();
  private eventListeners: Map<string, ((event: QuestEvent) => void)[]> = new Map();
  private questTemplates: Map<string, Quest> = new Map();

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.initializeQuestTemplates();
  }

  // 初始化任务模板
  private initializeQuestTemplates(): void {
    // 击杀任务
    this.addQuestTemplate({
      id: 'quest_kill_goblins',
      title: '清除哥布林',
      description: '消灭10只哥布林，保护村庄安全',
      type: QuestType.KILL,
      level: 1,
      status: QuestStatus.NOT_STARTED,
      objectives: [
        {
          id: 'kill_goblins',
          type: QuestType.KILL,
          description: '消灭哥布林',
          target: 'goblin',
          current: 0,
          required: 10,
          completed: false
        }
      ],
      rewards: {
        experience: 100,
        gold: 50,
        items: [{ itemId: 'health_potion', quantity: 3 }]
      },
      prerequisites: [],
      giver: 'village_elder',
      receiver: 'player',
      location: { x: 100, y: 100 },
      isRepeatable: false,
      isMainQuest: true,
      isHidden: false,
      dialogue: {
        start: ['村庄最近被哥布林骚扰，请帮助我们清除它们。'],
        progress: ['继续努力，还有更多哥布林需要消灭。'],
        complete: ['干得好！村庄现在安全了。'],
        fail: ['任务失败了，哥布林仍然在威胁村庄。']
      }
    });

    // 收集任务
    this.addQuestTemplate({
      id: 'quest_collect_herbs',
      title: '收集草药',
      description: '收集5株红色草药，用于制作药水',
      type: QuestType.COLLECT,
      level: 1,
      status: QuestStatus.NOT_STARTED,
      objectives: [
        {
          id: 'collect_herbs',
          type: QuestType.COLLECT,
          description: '收集红色草药',
          target: 'herb_red',
          current: 0,
          required: 5,
          completed: false,
          location: { x: 200, y: 150 }
        }
      ],
      rewards: {
        experience: 80,
        gold: 30,
        items: [{ itemId: 'health_potion', quantity: 2 }]
      },
      prerequisites: [],
      giver: 'alchemist',
      receiver: 'player',
      location: { x: 150, y: 120 },
      isRepeatable: true,
      isMainQuest: false,
      isHidden: false,
      dialogue: {
        start: ['我需要一些红色草药来制作药水，你能帮我收集吗？'],
        progress: ['继续寻找草药，它们通常生长在森林中。'],
        complete: ['谢谢！这些草药正是我需要的。'],
        fail: ['时间到了，我没有收到足够的草药。']
      }
    });

    // 探索任务
    this.addQuestTemplate({
      id: 'quest_explore_cave',
      title: '探索洞穴',
      description: '探索神秘洞穴，寻找宝藏',
      type: QuestType.EXPLORE,
      level: 5,
      status: QuestStatus.NOT_STARTED,
      objectives: [
        {
          id: 'explore_cave',
          type: QuestType.EXPLORE,
          description: '探索洞穴',
          target: 'cave_entrance',
          current: 0,
          required: 1,
          completed: false,
          location: { x: 300, y: 200 }
        }
      ],
      rewards: {
        experience: 200,
        gold: 100,
        items: [{ itemId: 'sword_basic', quantity: 1 }]
      },
      prerequisites: ['quest_kill_goblins'],
      giver: 'adventurer',
      receiver: 'player',
      location: { x: 250, y: 180 },
      isRepeatable: false,
      isMainQuest: true,
      isHidden: false,
      dialogue: {
        start: ['我听说洞穴里有宝藏，但我太老了。你能帮我探索吗？'],
        progress: ['小心洞穴里的危险生物。'],
        complete: ['你找到了宝藏！真是了不起的冒险者。'],
        fail: ['洞穴太危险了，任务失败了。']
      }
    });

    // 护送任务
    this.addQuestTemplate({
      id: 'quest_escort_merchant',
      title: '护送商人',
      description: '护送商人安全到达下一个村庄',
      type: QuestType.ESCORT,
      level: 3,
      status: QuestStatus.NOT_STARTED,
      objectives: [
        {
          id: 'escort_merchant',
          type: QuestType.ESCORT,
          description: '护送商人',
          target: 'merchant',
          current: 0,
          required: 1,
          completed: false,
          location: { x: 400, y: 300 }
        }
      ],
      rewards: {
        experience: 150,
        gold: 75,
        items: [{ itemId: 'armor_leather', quantity: 1 }]
      },
      prerequisites: [],
      timeLimit: 300000, // 5分钟
      giver: 'merchant',
      receiver: 'player',
      location: { x: 350, y: 280 },
      isRepeatable: false,
      isMainQuest: false,
      isHidden: false,
      dialogue: {
        start: ['我需要一个保镖护送我到下一个村庄，你能帮助我吗？'],
        progress: ['请保护我，路上可能有强盗。'],
        complete: ['谢谢你安全护送我到达目的地。'],
        fail: ['护送失败了，我受伤了。']
      }
    });

    // 时间限制任务
    this.addQuestTemplate({
      id: 'quest_timed_delivery',
      title: '紧急配送',
      description: '在限定时间内将重要信件送到目的地',
      type: QuestType.TIMED,
      level: 2,
      status: QuestStatus.NOT_STARTED,
      objectives: [
        {
          id: 'deliver_letter',
          type: QuestType.DELIVERY,
          description: '配送信件',
          target: 'letter',
          current: 0,
          required: 1,
          completed: false,
          location: { x: 500, y: 400 },
          timeLimit: 120000 // 2分钟
        }
      ],
      rewards: {
        experience: 120,
        gold: 60,
        items: [{ itemId: 'health_potion', quantity: 1 }]
      },
      prerequisites: [],
      timeLimit: 120000,
      giver: 'postmaster',
      receiver: 'player',
      location: { x: 450, y: 380 },
      isRepeatable: true,
      isMainQuest: false,
      isHidden: false,
      dialogue: {
        start: ['这封信必须在2分钟内送到，时间很紧急！'],
        progress: ['快一点，时间不多了！'],
        complete: ['准时送达！你真是可靠的配送员。'],
        fail: ['太晚了，信件没有及时送达。']
      }
    });
  }

  // 添加任务模板
  public addQuestTemplate(template: Quest): void {
    this.questTemplates.set(template.id, template);
  }

  // 开始任务
  public startQuest(questId: string): boolean {
    const template = this.questTemplates.get(questId);
    if (!template) {
      console.error(`Quest template not found: ${questId}`);
      return false;
    }

    // 检查前置条件
    if (!this.checkPrerequisites(template.prerequisites)) {
      console.log(`Quest prerequisites not met: ${questId}`);
      return false;
    }

    // 检查是否已经接受过
    if (this.activeQuests.has(questId) || this.completedQuests.has(questId)) {
      console.log(`Quest already active or completed: ${questId}`);
      return false;
    }

    // 创建任务实例
    const quest: Quest = {
      ...template,
      status: QuestStatus.IN_PROGRESS,
      startTime: Date.now()
    };

    this.quests.set(questId, quest);
    this.activeQuests.set(questId, quest);

    // 发送开始事件
    this.emitEvent('started', { type: 'started', quest });

    console.log(`Quest started: ${quest.title}`);
    return true;
  }

  // 更新任务进度
  public updateQuestProgress(questId: string, objectiveId: string, progress: number): boolean {
    const quest = this.activeQuests.get(questId);
    if (!quest) return false;

    const objective = quest.objectives.find(obj => obj.id === objectiveId);
    if (!objective) return false;

    const oldProgress = objective.current;
    objective.current = Math.min(objective.current + progress, objective.required);
    objective.completed = objective.current >= objective.required;

    // 检查任务是否完成
    const allCompleted = quest.objectives.every(obj => obj.completed);
    if (allCompleted && quest.status === QuestStatus.IN_PROGRESS) {
      this.completeQuest(questId);
    }

    // 发送更新事件
    this.emitEvent('updated', {
      type: 'updated',
      quest,
      objective,
      progress: objective.current - oldProgress
    });

    return true;
  }

  // 完成任务
  public completeQuest(questId: string): boolean {
    const quest = this.activeQuests.get(questId);
    if (!quest) return false;

    quest.status = QuestStatus.COMPLETED;
    quest.completedTime = Date.now();

    // 发送完成事件
    this.emitEvent('completed', { type: 'completed', quest });

    console.log(`Quest completed: ${quest.title}`);
    return true;
  }

  // 失败任务
  public failQuest(questId: string): boolean {
    const quest = this.activeQuests.get(questId);
    if (!quest) return false;

    quest.status = QuestStatus.FAILED;

    this.activeQuests.delete(questId);
    this.failedQuests.add(questId);

    // 发送失败事件
    this.emitEvent('failed', { type: 'failed', quest });

    console.log(`Quest failed: ${quest.title}`);
    return true;
  }

  // 领取任务奖励
  public claimQuestReward(questId: string): boolean {
    const quest = this.quests.get(questId);
    if (!quest || quest.status !== QuestStatus.COMPLETED) {
      return false;
    }

    quest.status = QuestStatus.REWARDED;

    this.activeQuests.delete(questId);
    this.completedQuests.add(questId);

    // 发送奖励事件
    this.emitEvent('rewarded', { type: 'rewarded', quest });

    console.log(`Quest reward claimed: ${quest.title}`);
    return true;
  }

  // 检查前置条件
  private checkPrerequisites(prerequisites: string[]): boolean {
    return prerequisites.every(prereqId => this.completedQuests.has(prereqId));
  }

  // 获取可用任务
  public getAvailableQuests(): Quest[] {
    const available: Quest[] = [];

    this.questTemplates.forEach(template => {
      if (template.isHidden) return;

      // 检查是否已经接受或完成
      if (this.activeQuests.has(template.id) || this.completedQuests.has(template.id)) {
        return;
      }

      // 检查前置条件
      if (this.checkPrerequisites(template.prerequisites)) {
        available.push(template);
      }
    });

    return available;
  }

  // 获取活跃任务
  public getActiveQuests(): Quest[] {
    return Array.from(this.activeQuests.values());
  }

  // 获取已完成任务
  public getCompletedQuests(): Quest[] {
    return Array.from(this.completedQuests).map(id => this.quests.get(id)!);
  }

  // 获取失败任务
  public getFailedQuests(): Quest[] {
    return Array.from(this.failedQuests).map(id => this.quests.get(id)!);
  }

  // 获取任务
  public getQuest(questId: string): Quest | undefined {
    return this.quests.get(questId);
  }

  // 获取任务模板
  public getQuestTemplate(questId: string): Quest | undefined {
    return this.questTemplates.get(questId);
  }

  // 检查任务状态
  public getQuestStatus(questId: string): QuestStatus | undefined {
    const quest = this.quests.get(questId);
    return quest?.status;
  }

  // 获取任务进度
  public getQuestProgress(questId: string): { completed: number; total: number; percentage: number } {
    const quest = this.activeQuests.get(questId);
    if (!quest) return { completed: 0, total: 0, percentage: 0 };

    const completed = quest.objectives.filter(obj => obj.completed).length;
    const total = quest.objectives.length;
    const percentage = total > 0 ? (completed / total) * 100 : 0;

    return { completed, total, percentage };
  }

  // 检查任务是否过期
  public checkQuestTimeLimit(questId: string): boolean {
    const quest = this.activeQuests.get(questId);
    if (!quest || !quest.timeLimit || !quest.startTime) return false;

    const elapsed = Date.now() - quest.startTime;
    return elapsed > quest.timeLimit;
  }

  // 更新任务时间限制
  public updateQuestTimeLimits(): void {
    this.activeQuests.forEach((quest, questId) => {
      if (quest.timeLimit && this.checkQuestTimeLimit(questId)) {
        this.failQuest(questId);
      }
    });
  }

  // 重置任务
  public resetQuest(questId: string): boolean {
    const quest = this.quests.get(questId);
    if (!quest || !quest.isRepeatable) return false;

    // 移除任务状态
    this.activeQuests.delete(questId);
    this.completedQuests.delete(questId);
    this.failedQuests.delete(questId);
    this.quests.delete(questId);

    console.log(`Quest reset: ${quest.title}`);
    return true;
  }

  // 获取任务对话
  public getQuestDialogue(questId: string, stage: 'start' | 'progress' | 'complete' | 'fail'): string[] {
    const quest = this.quests.get(questId) || this.questTemplates.get(questId);
    return quest?.dialogue[stage] || [];
  }

  // 事件监听
  public on(event: string, callback: (event: QuestEvent) => void): void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, []);
    }
    this.eventListeners.get(event)!.push(callback);
  }

  public off(event: string, callback: (event: QuestEvent) => void): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      const index = listeners.indexOf(callback);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    }
  }

  // 发送事件
  private emitEvent(type: string, data: Partial<QuestEvent>): void {
    const event: QuestEvent = {
      type: type as any,
      quest: data.quest!,
      ...data
    };

    const listeners = this.eventListeners.get(type);
    if (listeners) {
      listeners.forEach(callback => {
        try {
          callback(event);
        } catch (error) {
          console.error('Error in quest event listener:', error);
        }
      });
    }
  }

  // 更新方法
  public update(time: number, delta: number): void {
    // 更新任务时间限制
    this.updateQuestTimeLimits();
  }

  // 保存数据
  public saveData(): any {
    return {
      quests: Array.from(this.quests.entries()),
      activeQuests: Array.from(this.activeQuests.keys()),
      completedQuests: Array.from(this.completedQuests),
      failedQuests: Array.from(this.failedQuests)
    };
  }

  // 加载数据
  public loadData(data: any): void {
    if (data.quests) {
      this.quests = new Map(data.quests);
    }
    if (data.activeQuests) {
      this.activeQuests = new Map();
      data.activeQuests.forEach((questId: string) => {
        const quest = this.quests.get(questId);
        if (quest) {
          this.activeQuests.set(questId, quest);
        }
      });
    }
    if (data.completedQuests) {
      this.completedQuests = new Set(data.completedQuests);
    }
    if (data.failedQuests) {
      this.failedQuests = new Set(data.failedQuests);
    }
  }

  // 销毁
  public destroy(): void {
    this.quests.clear();
    this.activeQuests.clear();
    this.completedQuests.clear();
    this.failedQuests.clear();
    this.questTemplates.clear();
    this.eventListeners.clear();
  }
}
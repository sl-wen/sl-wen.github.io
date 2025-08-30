import * as Phaser from 'phaser';

// 存档类型枚举
export enum SaveType {
  MANUAL = 'manual',       // 手动存档
  AUTO = 'auto',          // 自动存档
  QUICK = 'quick',        // 快速存档
  CHECKPOINT = 'checkpoint' // 检查点存档
}

// 存档状态枚举
export enum SaveStatus {
  VALID = 'valid',         // 有效
  CORRUPTED = 'corrupted', // 损坏
  INCOMPLETE = 'incomplete' // 不完整
}

// 存档数据接口
export interface SaveData {
  // 基本信息
  id: string;
  name: string;
  type: SaveType;
  status: SaveStatus;
  createdAt: number;
  updatedAt: number;
  playTime: number;
  version: string;
  
  // 游戏数据
  playerData: PlayerSaveData;
  worldData: WorldSaveData;
  inventoryData: InventorySaveData;
  questData: QuestSaveData;
  achievementData: AchievementSaveData;
  settingsData: SettingsSaveData;
  
  // 元数据
  checksum: string;
  size: number;
  description?: string;
  tags?: string[];
}

// 玩家存档数据
export interface PlayerSaveData {
  // 基本信息
  name: string;
  level: number;
  experience: number;
  health: number;
  maxHealth: number;
  mana: number;
  maxMana: number;
  
  // 位置信息
  position: {
    x: number;
    y: number;
    mapId: string;
  };
  
  // 属性
  stats: {
    strength: number;
    agility: number;
    intelligence: number;
    vitality: number;
    luck: number;
  };
  
  // 装备
  equipment: {
    weapon: string | null;
    armor: string | null;
    helmet: string | null;
    boots: string | null;
    accessory1: string | null;
    accessory2: string | null;
    ring1: string | null;
    ring2: string | null;
    amulet: string | null;
  };
  
  // 技能
  skills: {
    [skillId: string]: {
      level: number;
      experience: number;
    };
  };
  
  // 状态
  status: {
    isAlive: boolean;
    isInCombat: boolean;
    isMoving: boolean;
    isInteracting: boolean;
  };
  
  // 成就和统计
  achievements: string[];
  statistics: {
    enemiesKilled: number;
    itemsCollected: number;
    questsCompleted: number;
    areasExplored: number;
    itemsCrafted: number;
    playTime: number;
  };
}

// 世界存档数据
export interface WorldSaveData {
  // 地图数据
  maps: {
    [mapId: string]: {
      explored: boolean;
      discovered: boolean;
      lastVisited: number;
      objects: {
        [objectId: string]: {
          type: string;
          position: { x: number; y: number };
          state: any;
          destroyed: boolean;
        };
      };
      npcs: {
        [npcId: string]: {
          position: { x: number; y: number };
          state: any;
          dialogue: any;
        };
      };
    };
  };
  
  // 时间数据
  time: {
    gameTime: number;
    realTime: number;
    day: number;
    hour: number;
    minute: number;
  };
  
  // 天气数据
  weather: {
    type: string;
    intensity: number;
    duration: number;
  };
  
  // 事件数据
  events: {
    [eventId: string]: {
      triggered: boolean;
      completed: boolean;
      data: any;
    };
  };
}

// 背包存档数据
export interface InventorySaveData {
  // 背包物品
  items: {
    [slotId: string]: {
      itemId: string;
      quantity: number;
      durability: number;
      enchantments: any[];
    };
  };
  
  // 背包配置
  config: {
    maxSlots: number;
    maxWeight: number;
    currentWeight: number;
  };
  
  // 金币
  gold: number;
  
  // 仓库
  storage: {
    [storageId: string]: {
      items: { [slotId: string]: any };
      maxSlots: number;
    };
  };
}

// 任务存档数据
export interface QuestSaveData {
  // 活跃任务
  activeQuests: {
    [questId: string]: {
      status: string;
      progress: { [objectiveId: string]: number };
      startTime: number;
      timeLimit?: number;
    };
  };
  
  // 已完成任务
  completedQuests: {
    [questId: string]: {
      completedTime: number;
      rewards: any[];
    };
  };
  
  // 失败任务
  failedQuests: {
    [questId: string]: {
      failedTime: number;
      reason: string;
    };
  };
  
  // 任务日志
  questLog: {
    maxQuests: number;
    questOrder: string[];
  };
}

// 成就存档数据
export interface AchievementSaveData {
  // 成就进度
  achievements: {
    [achievementId: string]: {
      status: string;
      progress: {
        current: number;
        target: number;
        percentage: number;
      };
      unlockDate?: number;
      completionDate?: number;
    };
  };
  
  // 成就统计
  statistics: {
    totalAchievements: number;
    unlockedAchievements: number;
    completionRate: number;
    rareAchievements: number;
  };
}

// 设置存档数据
export interface SettingsSaveData {
  // 音频设置
  audio: {
    masterVolume: number;
    musicVolume: number;
    sfxVolume: number;
    voiceVolume: number;
    musicEnabled: boolean;
    sfxEnabled: boolean;
    voiceEnabled: boolean;
  };
  
  // 视频设置
  video: {
    resolution: string;
    fullscreen: boolean;
    vsync: boolean;
    quality: string;
    brightness: number;
    contrast: number;
  };
  
  // 控制设置
  controls: {
    keyBindings: { [action: string]: string };
    mouseSensitivity: number;
    invertY: boolean;
    gamepadEnabled: boolean;
  };
  
  // 游戏设置
  game: {
    language: string;
    difficulty: string;
    autoSave: boolean;
    autoSaveInterval: number;
    showHints: boolean;
    showTutorial: boolean;
    uiScale: number;
  };
}

// 存档事件接口
export interface SaveEvent {
  type: string;
  saveData: SaveData;
  data?: any;
  timestamp: number;
}

export class SaveSystem {
  private scene: Phaser.Scene;
  private saveSlots: Map<string, SaveData>;
  private autoSaveSlot: string;
  private quickSaveSlot: string;
  private currentSaveId: string | null;
  private eventListeners: Map<string, Function[]>;
  private autoSaveInterval: number;
  private autoSaveTimer: number;
  private encryptionKey: string;
  private maxSaveSlots: number;
  private saveVersion: string;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.saveSlots = new Map();
    this.autoSaveSlot = 'auto_save';
    this.quickSaveSlot = 'quick_save';
    this.currentSaveId = null;
    this.eventListeners = new Map();
    this.autoSaveInterval = 5 * 60 * 1000; // 5分钟
    this.autoSaveTimer = 0;
    this.encryptionKey = 'your-secret-key-here';
    this.maxSaveSlots = 10;
    this.saveVersion = '1.0.0';

    this.initializeSaveSystem();
    this.setupEventListeners();
  }

  /**
   * 初始化存档系统
   */
  private initializeSaveSystem(): void {
    // 加载现有存档
    this.loadAllSaves();
    
    // 创建默认存档槽位
    this.createDefaultSaveSlots();
    
    // 验证存档完整性
    this.validateAllSaves();
  }

  /**
   * 设置事件监听器
   */
  private setupEventListeners(): void {
    // 监听游戏事件
    this.scene.events.on('player_data_changed', this.handlePlayerDataChanged, this);
    this.scene.events.on('world_data_changed', this.handleWorldDataChanged, this);
    this.scene.events.on('inventory_changed', this.handleInventoryChanged, this);
    this.scene.events.on('quest_updated', this.handleQuestUpdated, this);
    this.scene.events.on('achievement_unlocked', this.handleAchievementUnlocked, this);
    this.scene.events.on('settings_changed', this.handleSettingsChanged, this);
  }

  /**
   * 创建默认存档槽位
   */
  private createDefaultSaveSlots(): void {
    // 创建自动存档槽位
    if (!this.saveSlots.has(this.autoSaveSlot)) {
      this.createSaveSlot(this.autoSaveSlot, '自动存档', SaveType.AUTO);
    }

    // 创建快速存档槽位
    if (!this.saveSlots.has(this.quickSaveSlot)) {
      this.createSaveSlot(this.quickSaveSlot, '快速存档', SaveType.QUICK);
    }
  }

  /**
   * 创建存档槽位
   */
  public createSaveSlot(slotId: string, name: string, type: SaveType): SaveData | null {
    if (this.saveSlots.size >= this.maxSaveSlots) {
      console.warn('存档槽位已满');
      return null;
    }

    const saveData: SaveData = {
      id: slotId,
      name,
      type,
      status: SaveStatus.VALID,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      playTime: 0,
      version: this.saveVersion,
      
      playerData: this.createDefaultPlayerData(),
      worldData: this.createDefaultWorldData(),
      inventoryData: this.createDefaultInventoryData(),
      questData: this.createDefaultQuestData(),
      achievementData: this.createDefaultAchievementData(),
      settingsData: this.createDefaultSettingsData(),
      
      checksum: '',
      size: 0
    };

    // 计算校验和
    saveData.checksum = this.calculateChecksum(saveData);
    saveData.size = this.calculateSaveSize(saveData);

    this.saveSlots.set(slotId, saveData);
    this.saveToStorage(saveData);
    
    this.emitEvent('save_created', { saveData });
    return saveData;
  }

  /**
   * 创建默认玩家数据
   */
  private createDefaultPlayerData(): PlayerSaveData {
    return {
      name: '冒险者',
      level: 1,
      experience: 0,
      health: 100,
      maxHealth: 100,
      mana: 50,
      maxMana: 50,
      
      position: {
        x: 0,
        y: 0,
        mapId: 'starting_area'
      },
      
      stats: {
        strength: 10,
        agility: 10,
        intelligence: 10,
        vitality: 10,
        luck: 10
      },
      
      equipment: {
        weapon: null,
        armor: null,
        helmet: null,
        boots: null,
        accessory1: null,
        accessory2: null,
        ring1: null,
        ring2: null,
        amulet: null
      },
      
      skills: {},
      
      status: {
        isAlive: true,
        isInCombat: false,
        isMoving: false,
        isInteracting: false
      },
      
      achievements: [],
      statistics: {
        enemiesKilled: 0,
        itemsCollected: 0,
        questsCompleted: 0,
        areasExplored: 0,
        itemsCrafted: 0,
        playTime: 0
      }
    };
  }

  /**
   * 创建默认世界数据
   */
  private createDefaultWorldData(): WorldSaveData {
    return {
      maps: {
        'starting_area': {
          explored: true,
          discovered: true,
          lastVisited: Date.now(),
          objects: {},
          npcs: {}
        }
      },
      
      time: {
        gameTime: 0,
        realTime: Date.now(),
        day: 1,
        hour: 6,
        minute: 0
      },
      
      weather: {
        type: 'clear',
        intensity: 0,
        duration: 0
      },
      
      events: {}
    };
  }

  /**
   * 创建默认背包数据
   */
  private createDefaultInventoryData(): InventorySaveData {
    return {
      items: {},
      config: {
        maxSlots: 20,
        maxWeight: 100,
        currentWeight: 0
      },
      gold: 0,
      storage: {}
    };
  }

  /**
   * 创建默认任务数据
   */
  private createDefaultQuestData(): QuestSaveData {
    return {
      activeQuests: {},
      completedQuests: {},
      failedQuests: {},
      questLog: {
        maxQuests: 10,
        questOrder: []
      }
    };
  }

  /**
   * 创建默认成就数据
   */
  private createDefaultAchievementData(): AchievementSaveData {
    return {
      achievements: {},
      statistics: {
        totalAchievements: 0,
        unlockedAchievements: 0,
        completionRate: 0,
        rareAchievements: 0
      }
    };
  }

  /**
   * 创建默认设置数据
   */
  private createDefaultSettingsData(): SettingsSaveData {
    return {
      audio: {
        masterVolume: 1.0,
        musicVolume: 0.8,
        sfxVolume: 1.0,
        voiceVolume: 1.0,
        musicEnabled: true,
        sfxEnabled: true,
        voiceEnabled: true
      },
      
      video: {
        resolution: '1920x1080',
        fullscreen: false,
        vsync: true,
        quality: 'high',
        brightness: 1.0,
        contrast: 1.0
      },
      
      controls: {
        keyBindings: {
          moveUp: 'W',
          moveDown: 'S',
          moveLeft: 'A',
          moveRight: 'D',
          interact: 'E',
          attack: 'SPACE',
          inventory: 'I',
          quest: 'L',
          map: 'M',
          menu: 'ESC'
        },
        mouseSensitivity: 1.0,
        invertY: false,
        gamepadEnabled: true
      },
      
      game: {
        language: 'zh-CN',
        difficulty: 'normal',
        autoSave: true,
        autoSaveInterval: 5,
        showHints: true,
        showTutorial: true,
        uiScale: 1.0
      }
    };
  }

  /**
   * 保存游戏
   */
  public saveGame(slotId: string, name?: string): boolean {
    const saveData = this.saveSlots.get(slotId);
    if (!saveData) {
      console.error('存档槽位不存在:', slotId);
      return false;
    }

    try {
      // 收集当前游戏数据
      saveData.playerData = this.collectPlayerData();
      saveData.worldData = this.collectWorldData();
      saveData.inventoryData = this.collectInventoryData();
      saveData.questData = this.collectQuestData();
      saveData.achievementData = this.collectAchievementData();
      saveData.settingsData = this.collectSettingsData();

      // 更新元数据
      saveData.updatedAt = Date.now();
      saveData.playTime = this.getTotalPlayTime();
      saveData.checksum = this.calculateChecksum(saveData);
      saveData.size = this.calculateSaveSize(saveData);

      // 保存到存储
      this.saveToStorage(saveData);
      
      this.currentSaveId = slotId;
      this.emitEvent('game_saved', { saveData });
      
      console.log('游戏已保存:', slotId);
      return true;
    } catch (error) {
      console.error('保存游戏失败:', error);
      saveData.status = SaveStatus.CORRUPTED;
      this.emitEvent('save_failed', { saveData, error });
      return false;
    }
  }

  /**
   * 加载游戏
   */
  public loadGame(slotId: string): boolean {
    const saveData = this.saveSlots.get(slotId);
    if (!saveData) {
      console.error('存档不存在:', slotId);
      return false;
    }

    // 验证存档完整性
    if (!this.validateSave(saveData)) {
      console.error('存档损坏:', slotId);
      return false;
    }

    try {
      // 恢复游戏数据
      this.restorePlayerData(saveData.playerData);
      this.restoreWorldData(saveData.worldData);
      this.restoreInventoryData(saveData.inventoryData);
      this.restoreQuestData(saveData.questData);
      this.restoreAchievementData(saveData.achievementData);
      this.restoreSettingsData(saveData.settingsData);

      this.currentSaveId = slotId;
      this.emitEvent('game_loaded', { saveData });
      
      console.log('游戏已加载:', slotId);
      return true;
    } catch (error) {
      console.error('加载游戏失败:', error);
      this.emitEvent('load_failed', { saveData, error });
      return false;
    }
  }

  /**
   * 自动保存
   */
  public autoSave(): boolean {
    if (!this.saveSlots.has(this.autoSaveSlot)) {
      this.createSaveSlot(this.autoSaveSlot, '自动存档', SaveType.AUTO);
    }
    
    return this.saveGame(this.autoSaveSlot);
  }

  /**
   * 快速保存
   */
  public quickSave(): boolean {
    if (!this.saveSlots.has(this.quickSaveSlot)) {
      this.createSaveSlot(this.quickSaveSlot, '快速存档', SaveType.QUICK);
    }
    
    return this.saveGame(this.quickSaveSlot);
  }

  /**
   * 删除存档
   */
  public deleteSave(slotId: string): boolean {
    if (!this.saveSlots.has(slotId)) {
      return false;
    }

    const saveData = this.saveSlots.get(slotId)!;
    this.saveSlots.delete(slotId);
    this.removeFromStorage(slotId);
    
    this.emitEvent('save_deleted', { saveData });
    return true;
  }

  /**
   * 复制存档
   */
  public copySave(sourceSlotId: string, targetSlotId: string): boolean {
    const sourceSave = this.saveSlots.get(sourceSlotId);
    if (!sourceSave) {
      return false;
    }

    const copiedSave: SaveData = {
      ...sourceSave,
      id: targetSlotId,
      name: `${sourceSave.name} (副本)`,
      createdAt: Date.now(),
      updatedAt: Date.now()
    };

    copiedSave.checksum = this.calculateChecksum(copiedSave);
    copiedSave.size = this.calculateSaveSize(copiedSave);

    this.saveSlots.set(targetSlotId, copiedSave);
    this.saveToStorage(copiedSave);
    
    this.emitEvent('save_copied', { sourceSave, copiedSave });
    return true;
  }

  /**
   * 导出存档
   */
  public exportSave(slotId: string): string {
    const saveData = this.saveSlots.get(slotId);
    if (!saveData) {
      throw new Error('存档不存在');
    }

    const exportData = {
      ...saveData,
      exportedAt: Date.now(),
      exportVersion: this.saveVersion
    };

    const jsonString = JSON.stringify(exportData, null, 2);
    return this.encryptData(jsonString);
  }

  /**
   * 导入存档
   */
  public importSave(encryptedData: string, targetSlotId: string): boolean {
    try {
      const decryptedData = this.decryptData(encryptedData);
      const importData = JSON.parse(decryptedData);

      // 验证导入数据
      if (!this.validateImportData(importData)) {
        throw new Error('导入数据格式无效');
      }

      const saveData: SaveData = {
        ...importData,
        id: targetSlotId,
        updatedAt: Date.now()
      };

      saveData.checksum = this.calculateChecksum(saveData);
      saveData.size = this.calculateSaveSize(saveData);

      this.saveSlots.set(targetSlotId, saveData);
      this.saveToStorage(saveData);
      
      this.emitEvent('save_imported', { saveData });
      return true;
    } catch (error) {
      console.error('导入存档失败:', error);
      return false;
    }
  }

  /**
   * 收集玩家数据
   */
  private collectPlayerData(): PlayerSaveData {
    // 这里应该从游戏系统中收集实际的玩家数据
    // 暂时返回默认数据
    return this.createDefaultPlayerData();
  }

  /**
   * 收集世界数据
   */
  private collectWorldData(): WorldSaveData {
    // 这里应该从游戏系统中收集实际的世界数据
    return this.createDefaultWorldData();
  }

  /**
   * 收集背包数据
   */
  private collectInventoryData(): InventorySaveData {
    // 这里应该从游戏系统中收集实际的背包数据
    return this.createDefaultInventoryData();
  }

  /**
   * 收集任务数据
   */
  private collectQuestData(): QuestSaveData {
    // 这里应该从游戏系统中收集实际的任务数据
    return this.createDefaultQuestData();
  }

  /**
   * 收集成就数据
   */
  private collectAchievementData(): AchievementSaveData {
    // 这里应该从游戏系统中收集实际的成就数据
    return this.createDefaultAchievementData();
  }

  /**
   * 收集设置数据
   */
  private collectSettingsData(): SettingsSaveData {
    // 这里应该从游戏系统中收集实际的设置数据
    return this.createDefaultSettingsData();
  }

  /**
   * 恢复玩家数据
   */
  private restorePlayerData(playerData: PlayerSaveData): void {
    // 这里应该将数据恢复到游戏系统中
    this.scene.events.emit('restore_player_data', { playerData });
  }

  /**
   * 恢复世界数据
   */
  private restoreWorldData(worldData: WorldSaveData): void {
    // 这里应该将数据恢复到游戏系统中
    this.scene.events.emit('restore_world_data', { worldData });
  }

  /**
   * 恢复背包数据
   */
  private restoreInventoryData(inventoryData: InventorySaveData): void {
    // 这里应该将数据恢复到游戏系统中
    this.scene.events.emit('restore_inventory_data', { inventoryData });
  }

  /**
   * 恢复任务数据
   */
  private restoreQuestData(questData: QuestSaveData): void {
    // 这里应该将数据恢复到游戏系统中
    this.scene.events.emit('restore_quest_data', { questData });
  }

  /**
   * 恢复成就数据
   */
  private restoreAchievementData(achievementData: AchievementSaveData): void {
    // 这里应该将数据恢复到游戏系统中
    this.scene.events.emit('restore_achievement_data', { achievementData });
  }

  /**
   * 恢复设置数据
   */
  private restoreSettingsData(settingsData: SettingsSaveData): void {
    // 这里应该将数据恢复到游戏系统中
    this.scene.events.emit('restore_settings_data', { settingsData });
  }

  /**
   * 计算校验和
   */
  private calculateChecksum(saveData: SaveData): string {
    const dataString = JSON.stringify(saveData);
    let hash = 0;
    for (let i = 0; i < dataString.length; i++) {
      const char = dataString.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // 转换为32位整数
    }
    return hash.toString(16);
  }

  /**
   * 计算存档大小
   */
  private calculateSaveSize(saveData: SaveData): number {
    return JSON.stringify(saveData).length;
  }

  /**
   * 验证存档
   */
  private validateSave(saveData: SaveData): boolean {
    const expectedChecksum = this.calculateChecksum(saveData);
    return saveData.checksum === expectedChecksum;
  }

  /**
   * 验证导入数据
   */
  private validateImportData(data: any): boolean {
    return data && 
           typeof data.id === 'string' &&
           typeof data.name === 'string' &&
           typeof data.playerData === 'object' &&
           typeof data.worldData === 'object';
  }

  /**
   * 加密数据
   */
  private encryptData(data: string): string {
    // 简单的Base64编码，实际应用中应该使用更安全的加密方法
    return btoa(data);
  }

  /**
   * 解密数据
   */
  private decryptData(encryptedData: string): string {
    // 简单的Base64解码
    return atob(encryptedData);
  }

  /**
   * 获取总游戏时间
   */
  private getTotalPlayTime(): number {
    // 这里应该计算实际的游戏时间
    return 0;
  }

  /**
   * 保存到本地存储
   */
  private saveToStorage(saveData: SaveData): void {
    try {
      const key = `game_save_${saveData.id}`;
      const data = this.encryptData(JSON.stringify(saveData));
      localStorage.setItem(key, data);
    } catch (error) {
      console.error('保存到本地存储失败:', error);
    }
  }

  /**
   * 从本地存储加载
   */
  private loadFromStorage(slotId: string): SaveData | null {
    try {
      const key = `game_save_${slotId}`;
      const data = localStorage.getItem(key);
      if (!data) return null;

      const decryptedData = this.decryptData(data);
      return JSON.parse(decryptedData);
    } catch (error) {
      console.error('从本地存储加载失败:', error);
      return null;
    }
  }

  /**
   * 从本地存储删除
   */
  private removeFromStorage(slotId: string): void {
    try {
      const key = `game_save_${slotId}`;
      localStorage.removeItem(key);
    } catch (error) {
      console.error('从本地存储删除失败:', error);
    }
  }

  /**
   * 加载所有存档
   */
  private loadAllSaves(): void {
    // 从本地存储加载所有存档
    for (let i = 0; i < this.maxSaveSlots; i++) {
      const slotId = `save_${i}`;
      const saveData = this.loadFromStorage(slotId);
      if (saveData) {
        this.saveSlots.set(slotId, saveData);
      }
    }

    // 加载特殊存档
    const autoSave = this.loadFromStorage(this.autoSaveSlot);
    if (autoSave) {
      this.saveSlots.set(this.autoSaveSlot, autoSave);
    }

    const quickSave = this.loadFromStorage(this.quickSaveSlot);
    if (quickSave) {
      this.saveSlots.set(this.quickSaveSlot, quickSave);
    }
  }

  /**
   * 验证所有存档
   */
  private validateAllSaves(): void {
    for (const [slotId, saveData] of this.saveSlots) {
      if (!this.validateSave(saveData)) {
        saveData.status = SaveStatus.CORRUPTED;
        console.warn('存档损坏:', slotId);
      }
    }
  }

  /**
   * 事件处理器
   */
  private handlePlayerDataChanged = (data: any): void => {
    if (this.currentSaveId) {
      this.autoSave();
    }
  };

  private handleWorldDataChanged = (data: any): void => {
    if (this.currentSaveId) {
      this.autoSave();
    }
  };

  private handleInventoryChanged = (data: any): void => {
    if (this.currentSaveId) {
      this.autoSave();
    }
  };

  private handleQuestUpdated = (data: any): void => {
    if (this.currentSaveId) {
      this.autoSave();
    }
  };

  private handleAchievementUnlocked = (data: any): void => {
    if (this.currentSaveId) {
      this.autoSave();
    }
  };

  private handleSettingsChanged = (data: any): void => {
    if (this.currentSaveId) {
      this.autoSave();
    }
  };

  /**
   * 获取存档列表
   */
  public getSaveList(): SaveData[] {
    return Array.from(this.saveSlots.values());
  }

  /**
   * 获取存档
   */
  public getSave(slotId: string): SaveData | undefined {
    return this.saveSlots.get(slotId);
  }

  /**
   * 获取当前存档ID
   */
  public getCurrentSaveId(): string | null {
    return this.currentSaveId;
  }

  /**
   * 设置自动保存间隔
   */
  public setAutoSaveInterval(interval: number): void {
    this.autoSaveInterval = interval;
  }

  /**
   * 注册事件监听器
   */
  public on(event: string, callback: (event: SaveEvent) => void): void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, []);
    }
    this.eventListeners.get(event)!.push(callback);
  }

  /**
   * 移除事件监听器
   */
  public off(event: string, callback: (event: SaveEvent) => void): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      const index = listeners.indexOf(callback);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    }
  }

  /**
   * 发出事件
   */
  private emitEvent(type: string, data: Partial<SaveEvent>): void {
    const event: SaveEvent = {
      type,
      saveData: data.saveData!,
      data: data.data,
      timestamp: Date.now()
    };

    const listeners = this.eventListeners.get(type);
    if (listeners) {
      listeners.forEach(callback => callback(event));
    }
  }

  /**
   * 更新系统
   */
  public update(time: number, delta: number): void {
    // 自动保存计时器
    if (this.autoSaveInterval > 0) {
      this.autoSaveTimer += delta;
      if (this.autoSaveTimer >= this.autoSaveInterval) {
        this.autoSave();
        this.autoSaveTimer = 0;
      }
    }
  }

  /**
   * 销毁系统
   */
  public destroy(): void {
    // 移除事件监听器
    this.scene.events.off('player_data_changed', this.handlePlayerDataChanged, this);
    this.scene.events.off('world_data_changed', this.handleWorldDataChanged, this);
    this.scene.events.off('inventory_changed', this.handleInventoryChanged, this);
    this.scene.events.off('quest_updated', this.handleQuestUpdated, this);
    this.scene.events.off('achievement_unlocked', this.handleAchievementUnlocked, this);
    this.scene.events.off('settings_changed', this.handleSettingsChanged, this);

    // 清理数据
    this.saveSlots.clear();
    this.eventListeners.clear();
  }
}
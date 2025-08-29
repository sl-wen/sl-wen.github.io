/**
 * 存档系统
 * 处理游戏存档、读档、自动存档、云同步等功能
 */

import { storage } from '../utils';

// 存档数据类型
export interface SaveData {
  // 基础信息
  saveId: string;
  saveName: string;
  saveTime: number;
  gameVersion: string;
  playTime: number;
  lastPlayTime: number;
  
  // 玩家数据
  player: PlayerSaveData;
  
  // 游戏状态
  gameState: GameStateSaveData;
  
  // 系统数据
  systems: SystemsSaveData;
  
  // 元数据
  metadata: SaveMetadata;
  
  // 校验数据
  checksum: string;
  encrypted: boolean;
  compressed: boolean;
}

// 玩家存档数据
export interface PlayerSaveData {
  // 基础属性
  id: string;
  name: string;
  level: number;
  experience: number;
  maxExperience: number;
  health: number;
  maxHealth: number;
  mana: number;
  maxMana: number;
  gold: number;
  
  // 位置信息
  position: { x: number; y: number; map: string };
  direction: 'up' | 'down' | 'left' | 'right';
  
  // 属性
  stats: {
    attack: number;
    defense: number;
    speed: number;
    magicAttack: number;
    magicDefense: number;
    criticalRate: number;
    criticalDamage: number;
    dodgeRate: number;
    blockRate: number;
  };
  
  // 装备
  equipment: {
    weapon?: string;
    armor?: string;
    helmet?: string;
    boots?: string;
    accessory1?: string;
    accessory2?: string;
  };
  
  // 技能
  skills: string[];
  
  // 状态效果
  statusEffects: any[];
  
  // 成就
  achievements: string[];
  
  // 称号
  titles: string[];
  
  // 声望
  reputation: Record<string, number>;
}

// 游戏状态存档数据
export interface GameStateSaveData {
  // 当前场景
  currentScene: string;
  currentMap: string;
  
  // 游戏进度
  gameProgress: {
    mainQuestProgress: number;
    sideQuestProgress: number;
    explorationProgress: number;
    completionRate: number;
  };
  
  // 世界状态
  worldState: {
    timeOfDay: 'day' | 'night' | 'dawn' | 'dusk';
    weather: 'clear' | 'rain' | 'storm' | 'fog';
    season: 'spring' | 'summer' | 'autumn' | 'winter';
    dayCount: number;
    gameTime: number;
  };
  
  // 地图状态
  mapStates: Record<string, MapStateData>;
  
  // 事件状态
  eventFlags: Record<string, boolean>;
  
  // 对话历史
  dialogueHistory: DialogueEntry[];
  
  // 游戏设置
  settings: GameSettings;
}

// 地图状态数据
export interface MapStateData {
  mapId: string;
  explored: boolean;
  completionRate: number;
  discoveredSecrets: string[];
  unlockedAreas: string[];
  destroyedObjects: string[];
  collectedItems: string[];
  npcStates: Record<string, NPCStateData>;
  enemyStates: Record<string, EnemyStateData>;
  lastVisitTime: number;
}

// NPC状态数据
export interface NPCStateData {
  npcId: string;
  position: { x: number; y: number };
  health: number;
  dialogueProgress: number;
  relationship: number;
  questsGiven: string[];
  questsCompleted: string[];
  lastInteractionTime: number;
}

// 敌人状态数据
export interface EnemyStateData {
  enemyId: string;
  position: { x: number; y: number };
  health: number;
  isAlive: boolean;
  respawnTime: number;
  lastDefeatTime: number;
  defeatCount: number;
}

// 对话条目
export interface DialogueEntry {
  id: string;
  npcId: string;
  dialogue: string;
  timestamp: number;
  choices: string[];
  selectedChoice?: string;
}

// 游戏设置
export interface GameSettings {
  audio: {
    masterVolume: number;
    musicVolume: number;
    sfxVolume: number;
    voiceVolume: number;
  };
  graphics: {
    resolution: string;
    fullscreen: boolean;
    vsync: boolean;
    quality: 'low' | 'medium' | 'high' | 'ultra';
  };
  gameplay: {
    difficulty: 'easy' | 'normal' | 'hard' | 'expert';
    autoSave: boolean;
    autoSaveInterval: number;
    showHints: boolean;
    showTutorial: boolean;
  };
  controls: {
    keyBindings: Record<string, string>;
    mouseSensitivity: number;
    invertY: boolean;
  };
}

// 系统存档数据
export interface SystemsSaveData {
  // 背包系统
  inventory: {
    items: any[];
    capacity: number;
    maxCapacity: number;
  };
  
  // 任务系统
  quests: {
    activeQuests: any[];
    completedQuests: string[];
    questProgress: Record<string, any>;
  };
  
  // 战斗系统
  combat: {
    combatHistory: any[];
    statistics: any;
    unlockedSkills: string[];
  };
  
  // 地图系统
  maps: {
    discoveredMaps: string[];
    unlockedTeleports: string[];
    mapInteractions: Record<string, any>;
  };
  
  // 商店系统
  shops: {
    shopInventories: Record<string, any[]>;
    shopRelationships: Record<string, number>;
    purchaseHistory: any[];
  };
  
  // 制作系统
  crafting: {
    knownRecipes: string[];
    craftingLevel: number;
    craftingExperience: number;
  };
  
  // 统计系统
  statistics: {
    playTime: number;
    distanceTraveled: number;
    enemiesDefeated: number;
    itemsCollected: number;
    questsCompleted: number;
    achievementsUnlocked: number;
  };
}

// 存档元数据
export interface SaveMetadata {
  // 创建信息
  createdBy: string;
  createdTime: number;
  createdVersion: string;
  
  // 修改信息
  lastModifiedBy: string;
  lastModifiedTime: number;
  lastModifiedVersion: string;
  
  // 游戏信息
  gameMode: 'story' | 'sandbox' | 'challenge' | 'multiplayer';
  difficulty: string;
  characterClass?: string;
  
  // 技术信息
  fileSize: number;
  compressionRatio?: number;
  encryptionType?: string;
  
  // 标签
  tags: string[];
  
  // 描述
  description: string;
  
  // 缩略图
  thumbnail?: string;
  
  // 云同步信息
  cloudSync: {
    synced: boolean;
    lastSyncTime: number;
    syncVersion: number;
    cloudProvider?: string;
  };
}

// 存档槽位信息
export interface SaveSlot {
  slotId: number;
  saveData?: SaveData;
  isEmpty: boolean;
  lastUsedTime: number;
  playTime: number;
  characterName: string;
  characterLevel: number;
  saveName: string;
  thumbnail?: string;
}

// 存档配置
export interface SaveConfig {
  maxSaveSlots: number;
  autoSaveEnabled: boolean;
  autoSaveInterval: number; // 毫秒
  maxAutoSaves: number;
  cloudSyncEnabled: boolean;
  encryptionEnabled: boolean;
  compressionEnabled: boolean;
  backupEnabled: boolean;
  maxBackups: number;
}

export class SaveSystem {
  private static instance: SaveSystem;
  private saveSlots: Map<number, SaveSlot>;
  private currentSaveSlot: number | null;
  private autoSaveTimer: NodeJS.Timeout | null;
  private config: SaveConfig;
  private saveCallbacks: Map<string, () => any>;
  private loadCallbacks: Map<string, (data: any) => void>;

  private constructor() {
    this.saveSlots = new Map();
    this.currentSaveSlot = null;
    this.autoSaveTimer = null;
    this.saveCallbacks = new Map();
    this.loadCallbacks = new Map();
    
    // 默认配置
    this.config = {
      maxSaveSlots: 10,
      autoSaveEnabled: true,
      autoSaveInterval: 300000, // 5分钟
      maxAutoSaves: 5,
      cloudSyncEnabled: false,
      encryptionEnabled: false,
      compressionEnabled: true,
      backupEnabled: true,
      maxBackups: 3
    };
    
    this.initializeSaveSlots();
    this.loadSaveConfig();
  }

  public static getInstance(): SaveSystem {
    if (!SaveSystem.instance) {
      SaveSystem.instance = new SaveSystem();
    }
    return SaveSystem.instance;
  }

  /**
   * 初始化存档槽位
   */
  private initializeSaveSlots(): void {
    for (let i = 1; i <= this.config.maxSaveSlots; i++) {
      this.saveSlots.set(i, {
        slotId: i,
        isEmpty: true,
        lastUsedTime: 0,
        playTime: 0,
        characterName: '',
        characterLevel: 1,
        saveName: `存档 ${i}`
      });
    }
    
    this.loadSaveSlots();
  }

  /**
   * 加载存档配置
   */
  private loadSaveConfig(): void {
    const savedConfig = storage.get('save_config', null);
    if (savedConfig) {
      this.config = { ...this.config, ...savedConfig };
    }
  }

  /**
   * 保存存档配置
   */
  private saveSaveConfig(): void {
    storage.set('save_config', this.config);
  }

  /**
   * 加载存档槽位
   */
  private loadSaveSlots(): void {
    const savedSlots = storage.get('save_slots', null);
    if (savedSlots) {
      this.saveSlots = new Map(savedSlots);
    }
  }

  /**
   * 保存存档槽位
   */
  private saveSaveSlots(): void {
    storage.set('save_slots', Array.from(this.saveSlots.entries()));
  }

  /**
   * 创建存档
   * @param slotId - 存档槽位ID
   * @param saveName - 存档名称
   * @returns 是否成功
   */
  async createSave(slotId: number, saveName: string): Promise<boolean> {
    if (!this.saveSlots.has(slotId)) {
      console.error(`存档槽位 ${slotId} 不存在`);
      return false;
    }

    try {
      // 收集存档数据
      const saveData = await this.collectSaveData(slotId, saveName);
      
      // 压缩数据
      if (this.config.compressionEnabled) {
        saveData.compressed = true;
        // 这里可以添加压缩逻辑
      }
      
      // 加密数据
      if (this.config.encryptionEnabled) {
        saveData.encrypted = true;
        // 这里可以添加加密逻辑
      }
      
      // 生成校验和
      saveData.checksum = this.generateChecksum(saveData);
      
      // 保存到槽位
      const slot = this.saveSlots.get(slotId)!;
      slot.saveData = saveData;
      slot.isEmpty = false;
      slot.lastUsedTime = Date.now();
      slot.playTime = saveData.playTime;
      slot.characterName = saveData.player.name;
      slot.characterLevel = saveData.player.level;
      slot.saveName = saveName;
      
      // 保存槽位信息
      this.saveSaveSlots();
      
      // 保存存档数据
      await this.saveToStorage(slotId, saveData);
      
      // 创建备份
      if (this.config.backupEnabled) {
        await this.createBackup(slotId);
      }
      
      // 云同步
      if (this.config.cloudSyncEnabled) {
        await this.syncToCloud(slotId);
      }
      
      this.currentSaveSlot = slotId;
      console.log(`存档创建成功: ${saveName} (槽位 ${slotId})`);
      return true;
      
    } catch (error) {
      console.error('创建存档失败:', error);
      return false;
    }
  }

  /**
   * 加载存档
   * @param slotId - 存档槽位ID
   * @returns 存档数据
   */
  async loadSave(slotId: number): Promise<SaveData | null> {
    if (!this.saveSlots.has(slotId)) {
      console.error(`存档槽位 ${slotId} 不存在`);
      return null;
    }

    const slot = this.saveSlots.get(slotId)!;
    if (slot.isEmpty) {
      console.error(`存档槽位 ${slotId} 为空`);
      return null;
    }

    try {
      // 从存储加载存档数据
      const saveData = await this.loadFromStorage(slotId);
      if (!saveData) {
        console.error(`无法加载存档数据 (槽位 ${slotId})`);
        return null;
      }
      
      // 验证校验和
      if (!this.validateChecksum(saveData)) {
        console.error(`存档数据损坏 (槽位 ${slotId})`);
        return null;
      }
      
      // 解密数据
      if (saveData.encrypted) {
        // 这里可以添加解密逻辑
      }
      
      // 解压数据
      if (saveData.compressed) {
        // 这里可以添加解压逻辑
      }
      
      // 应用存档数据
      await this.applySaveData(saveData);
      
      this.currentSaveSlot = slotId;
      console.log(`存档加载成功: ${slot.saveName} (槽位 ${slotId})`);
      return saveData;
      
    } catch (error) {
      console.error('加载存档失败:', error);
      return null;
    }
  }

  /**
   * 删除存档
   * @param slotId - 存档槽位ID
   * @returns 是否成功
   */
  async deleteSave(slotId: number): Promise<boolean> {
    if (!this.saveSlots.has(slotId)) {
      return false;
    }

    try {
      // 删除存档数据
      await this.deleteFromStorage(slotId);
      
      // 重置槽位
      const slot = this.saveSlots.get(slotId)!;
      slot.saveData = undefined;
      slot.isEmpty = true;
      slot.lastUsedTime = 0;
      slot.playTime = 0;
      slot.characterName = '';
      slot.characterLevel = 1;
      slot.saveName = `存档 ${slotId}`;
      slot.thumbnail = undefined;
      
      // 保存槽位信息
      this.saveSaveSlots();
      
      console.log(`存档删除成功 (槽位 ${slotId})`);
      return true;
      
    } catch (error) {
      console.error('删除存档失败:', error);
      return false;
    }
  }

  /**
   * 自动存档
   */
  async autoSave(): Promise<boolean> {
    if (!this.config.autoSaveEnabled || !this.currentSaveSlot) {
      return false;
    }

    const slot = this.saveSlots.get(this.currentSaveSlot);
    if (!slot || slot.isEmpty) {
      return false;
    }

    try {
      // 创建自动存档
      const autoSaveName = `${slot.saveName} (自动存档)`;
      const success = await this.createSave(this.currentSaveSlot, autoSaveName);
      
      if (success) {
        console.log('自动存档完成');
      }
      
      return success;
      
    } catch (error) {
      console.error('自动存档失败:', error);
      return false;
    }
  }

  /**
   * 开始自动存档
   */
  startAutoSave(): void {
    if (!this.config.autoSaveEnabled) return;
    
    this.stopAutoSave();
    
    this.autoSaveTimer = setInterval(() => {
      this.autoSave();
    }, this.config.autoSaveInterval);
    
    console.log('自动存档已启动');
  }

  /**
   * 停止自动存档
   */
  stopAutoSave(): void {
    if (this.autoSaveTimer) {
      clearInterval(this.autoSaveTimer);
      this.autoSaveTimer = null;
      console.log('自动存档已停止');
    }
  }

  /**
   * 收集存档数据
   * @param slotId - 存档槽位ID
   * @param saveName - 存档名称
   * @returns 存档数据
   */
  private async collectSaveData(slotId: number, saveName: string): Promise<SaveData> {
    const now = Date.now();
    
    // 收集玩家数据
    const playerData = await this.collectPlayerData();
    
    // 收集游戏状态数据
    const gameStateData = await this.collectGameStateData();
    
    // 收集系统数据
    const systemsData = await this.collectSystemsData();
    
    // 创建存档数据
    const saveData: SaveData = {
      saveId: `save_${slotId}_${now}`,
      saveName,
      saveTime: now,
      gameVersion: '1.0.0', // 从游戏配置获取
      playTime: this.getPlayTime(),
      lastPlayTime: now,
      
      player: playerData,
      gameState: gameStateData,
      systems: systemsData,
      
      metadata: {
        createdBy: 'player',
        createdTime: now,
        createdVersion: '1.0.0',
        lastModifiedBy: 'player',
        lastModifiedTime: now,
        lastModifiedVersion: '1.0.0',
        gameMode: 'story',
        difficulty: 'normal',
        fileSize: 0,
        tags: [],
        description: '',
        cloudSync: {
          synced: false,
          lastSyncTime: 0,
          syncVersion: 1
        }
      },
      
      checksum: '',
      encrypted: false,
      compressed: false
    };
    
    return saveData;
  }

  /**
   * 收集玩家数据
   * @returns 玩家存档数据
   */
  private async collectPlayerData(): Promise<PlayerSaveData> {
    // 这里需要从各个系统收集玩家数据
    // 暂时返回示例数据
    return {
      id: 'player_1',
      name: '冒险者',
      level: 1,
      experience: 0,
      maxExperience: 100,
      health: 100,
      maxHealth: 100,
      mana: 50,
      maxMana: 50,
      gold: 0,
      position: { x: 0, y: 0, map: 'village' },
      direction: 'down',
      stats: {
        attack: 10,
        defense: 5,
        speed: 100,
        magicAttack: 0,
        magicDefense: 0,
        criticalRate: 5,
        criticalDamage: 150,
        dodgeRate: 5,
        blockRate: 0
      },
      equipment: {},
      skills: [],
      statusEffects: [],
      achievements: [],
      titles: [],
      reputation: {}
    };
  }

  /**
   * 收集游戏状态数据
   * @returns 游戏状态存档数据
   */
  private async collectGameStateData(): Promise<GameStateSaveData> {
    // 这里需要从游戏状态收集数据
    return {
      currentScene: 'CompleteGameScene',
      currentMap: 'village',
      gameProgress: {
        mainQuestProgress: 0,
        sideQuestProgress: 0,
        explorationProgress: 0,
        completionRate: 0
      },
      worldState: {
        timeOfDay: 'day',
        weather: 'clear',
        season: 'spring',
        dayCount: 1,
        gameTime: 0
      },
      mapStates: {},
      eventFlags: {},
      dialogueHistory: [],
      settings: {
        audio: { masterVolume: 100, musicVolume: 80, sfxVolume: 100, voiceVolume: 100 },
        graphics: { resolution: '1920x1080', fullscreen: false, vsync: true, quality: 'high' },
        gameplay: { difficulty: 'normal', autoSave: true, autoSaveInterval: 300000, showHints: true, showTutorial: true },
        controls: { keyBindings: {}, mouseSensitivity: 1, invertY: false }
      }
    };
  }

  /**
   * 收集系统数据
   * @returns 系统存档数据
   */
  private async collectSystemsData(): Promise<SystemsSaveData> {
    // 这里需要从各个系统收集数据
    return {
      inventory: { items: [], capacity: 20, maxCapacity: 20 },
      quests: { activeQuests: [], completedQuests: [], questProgress: {} },
      combat: { combatHistory: [], statistics: {}, unlockedSkills: [] },
      maps: { discoveredMaps: ['village'], unlockedTeleports: [], mapInteractions: {} },
      shops: { shopInventories: {}, shopRelationships: {}, purchaseHistory: [] },
      crafting: { knownRecipes: [], craftingLevel: 1, craftingExperience: 0 },
      statistics: {
        playTime: 0,
        distanceTraveled: 0,
        enemiesDefeated: 0,
        itemsCollected: 0,
        questsCompleted: 0,
        achievementsUnlocked: 0
      }
    };
  }

  /**
   * 应用存档数据
   * @param saveData - 存档数据
   */
  private async applySaveData(saveData: SaveData): Promise<void> {
    // 应用玩家数据
    await this.applyPlayerData(saveData.player);
    
    // 应用游戏状态数据
    await this.applyGameStateData(saveData.gameState);
    
    // 应用系统数据
    await this.applySystemsData(saveData.systems);
  }

  /**
   * 应用玩家数据
   * @param playerData - 玩家数据
   */
  private async applyPlayerData(playerData: PlayerSaveData): Promise<void> {
    // 这里需要将数据应用到各个系统
    console.log('应用玩家数据:', playerData.name);
  }

  /**
   * 应用游戏状态数据
   * @param gameStateData - 游戏状态数据
   */
  private async applyGameStateData(gameStateData: GameStateSaveData): Promise<void> {
    // 这里需要将数据应用到游戏状态
    console.log('应用游戏状态数据:', gameStateData.currentMap);
  }

  /**
   * 应用系统数据
   * @param systemsData - 系统数据
   */
  private async applySystemsData(systemsData: SystemsSaveData): Promise<void> {
    // 这里需要将数据应用到各个系统
    console.log('应用系统数据');
  }

  /**
   * 生成校验和
   * @param saveData - 存档数据
   * @returns 校验和
   */
  private generateChecksum(saveData: SaveData): string {
    // 简单的校验和生成
    const dataString = JSON.stringify(saveData);
    let checksum = 0;
    for (let i = 0; i < dataString.length; i++) {
      checksum += dataString.charCodeAt(i);
    }
    return checksum.toString(16);
  }

  /**
   * 验证校验和
   * @param saveData - 存档数据
   * @returns 是否有效
   */
  private validateChecksum(saveData: SaveData): boolean {
    const expectedChecksum = saveData.checksum;
    const actualChecksum = this.generateChecksum(saveData);
    return expectedChecksum === actualChecksum;
  }

  /**
   * 保存到存储
   * @param slotId - 存档槽位ID
   * @param saveData - 存档数据
   */
  private async saveToStorage(slotId: number, saveData: SaveData): Promise<void> {
    const key = `save_data_${slotId}`;
    storage.set(key, saveData);
  }

  /**
   * 从存储加载
   * @param slotId - 存档槽位ID
   * @returns 存档数据
   */
  private async loadFromStorage(slotId: number): Promise<SaveData | null> {
    const key = `save_data_${slotId}`;
    return storage.get(key, null);
  }

  /**
   * 从存储删除
   * @param slotId - 存档槽位ID
   */
  private async deleteFromStorage(slotId: number): Promise<void> {
    const key = `save_data_${slotId}`;
    storage.remove(key);
  }

  /**
   * 创建备份
   * @param slotId - 存档槽位ID
   */
  private async createBackup(slotId: number): Promise<void> {
    const saveData = await this.loadFromStorage(slotId);
    if (saveData) {
      const backupKey = `save_backup_${slotId}_${Date.now()}`;
      storage.set(backupKey, saveData);
      
      // 清理旧备份
      this.cleanupOldBackups(slotId);
    }
  }

  /**
   * 清理旧备份
   * @param slotId - 存档槽位ID
   */
  private cleanupOldBackups(slotId: number): void {
    // 这里可以添加清理逻辑
  }

  /**
   * 同步到云端
   * @param slotId - 存档槽位ID
   */
  private async syncToCloud(slotId: number): Promise<void> {
    // 这里可以添加云同步逻辑
    console.log(`同步存档到云端 (槽位 ${slotId})`);
  }

  /**
   * 获取游戏时间
   * @returns 游戏时间（毫秒）
   */
  private getPlayTime(): number {
    // 这里需要从游戏统计系统获取
    return 0;
  }

  /**
   * 获取存档槽位
   * @returns 存档槽位数组
   */
  getSaveSlots(): SaveSlot[] {
    return Array.from(this.saveSlots.values());
  }

  /**
   * 获取存档槽位
   * @param slotId - 存档槽位ID
   * @returns 存档槽位
   */
  getSaveSlot(slotId: number): SaveSlot | undefined {
    return this.saveSlots.get(slotId);
  }

  /**
   * 获取当前存档槽位
   * @returns 当前存档槽位ID
   */
  getCurrentSaveSlot(): number | null {
    return this.currentSaveSlot;
  }

  /**
   * 获取存档配置
   * @returns 存档配置
   */
  getSaveConfig(): SaveConfig {
    return { ...this.config };
  }

  /**
   * 更新存档配置
   * @param config - 新配置
   */
  updateSaveConfig(config: Partial<SaveConfig>): void {
    this.config = { ...this.config, ...config };
    this.saveSaveConfig();
    
    // 如果禁用了自动存档，停止定时器
    if (!this.config.autoSaveEnabled) {
      this.stopAutoSave();
    }
  }

  /**
   * 注册保存回调
   * @param systemName - 系统名称
   * @param callback - 保存回调
   */
  registerSaveCallback(systemName: string, callback: () => any): void {
    this.saveCallbacks.set(systemName, callback);
  }

  /**
   * 注册加载回调
   * @param systemName - 系统名称
   * @param callback - 加载回调
   */
  registerLoadCallback(systemName: string, callback: (data: any) => void): void {
    this.loadCallbacks.set(systemName, callback);
  }

  /**
   * 导出存档
   * @param slotId - 存档槽位ID
   * @returns 存档文件数据
   */
  async exportSave(slotId: number): Promise<string> {
    const saveData = await this.loadFromStorage(slotId);
    if (!saveData) {
      throw new Error('存档不存在');
    }
    
    return JSON.stringify(saveData, null, 2);
  }

  /**
   * 导入存档
   * @param slotId - 存档槽位ID
   * @param saveDataString - 存档文件数据
   * @returns 是否成功
   */
  async importSave(slotId: number, saveDataString: string): Promise<boolean> {
    try {
      const saveData: SaveData = JSON.parse(saveDataString);
      
      // 验证存档数据
      if (!this.validateSaveData(saveData)) {
        throw new Error('存档数据无效');
      }
      
      // 保存到指定槽位
      await this.saveToStorage(slotId, saveData);
      
      // 更新槽位信息
      const slot = this.saveSlots.get(slotId)!;
      slot.saveData = saveData;
      slot.isEmpty = false;
      slot.lastUsedTime = Date.now();
      slot.playTime = saveData.playTime;
      slot.characterName = saveData.player.name;
      slot.characterLevel = saveData.player.level;
      slot.saveName = saveData.saveName;
      
      this.saveSaveSlots();
      
      return true;
      
    } catch (error) {
      console.error('导入存档失败:', error);
      return false;
    }
  }

  /**
   * 验证存档数据
   * @param saveData - 存档数据
   * @returns 是否有效
   */
  private validateSaveData(saveData: any): saveData is SaveData {
    // 这里可以添加更详细的验证逻辑
    return saveData && 
           typeof saveData.saveId === 'string' &&
           typeof saveData.player === 'object' &&
           typeof saveData.gameState === 'object' &&
           typeof saveData.systems === 'object';
  }

  /**
   * 清理资源
   */
  destroy(): void {
    this.stopAutoSave();
    this.saveCallbacks.clear();
    this.loadCallbacks.clear();
  }
}
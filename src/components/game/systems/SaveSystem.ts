import { CatStats, CropType, FarmPlot, InventoryItem, ToolType } from '../types/GameTypes';

/**
 * 游戏存档数据接口
 */
export interface GameSaveData {
    version: string;
    timestamp: number;
    playTime: number;
    playerData: {
      stats: CatStats;
      position: { x: number; y: number };
      currentTool: ToolType | null;
      inventory: InventoryItem[];
      unlockedRecipes: string[];
      achievements: string[];
    };
    farmData: {
      plots: Array<{
        x: number;
        y: number;
        isPlowed: boolean;
        soilQuality: number;
        crop?: {
          type: CropType;
          stage: number;
          growthTime: number;
          waterLevel: number;
          fertilized: boolean;
          quality: number;
        };
      }>;
      season: string;
      day: number;
      weather: string;
    };
    gameSettings: {
      difficulty: string;
      autoSave: boolean;
      soundEnabled: boolean;
      musicVolume: number;
      sfxVolume: number;
      language: string;
    };
    statistics: {
      cropsPlanted: number;
      cropsHarvested: number;
      recipesCooked: number;
      distanceWalked: number;
      timeSpentFarming: number;
    };
}

/**
 * 存档系统类
 * 参考top-down-react-phaser-game的存档处理方式
 * 提供完整的游戏状态保存和加载功能
 */
export class SaveSystem {
  private static readonly SAVE_KEY = 'cat-farm-game-save';
  private static readonly SETTINGS_KEY = 'cat-farm-game-settings';
  private static readonly MAX_SAVE_SLOTS = 3;
  private static readonly AUTOSAVE_INTERVAL = 5 * 60 * 1000; // 5分钟自动保存

  private autosaveTimer: NodeJS.Timeout | null = null;
  private isAutoSaveEnabled = true;

  /**
   * 初始化存档系统
   */
  public initialize(): void {
    this.startAutoSave();
    console.log('SaveSystem initialized');
  }

  /**
   * 保存游戏数据
   */
  public async saveGame(slotIndex: number = 0, gameData: GameSaveData): Promise<boolean> {
    try {
      // 验证存档槽位
      if (slotIndex < 0 || slotIndex >= SaveSystem.MAX_SAVE_SLOTS) {
        throw new Error(`Invalid save slot: ${slotIndex}`);
      }

      // 添加保存时间戳和版本信息
      const saveData: GameSaveData = {
        ...gameData,
        version: '1.0.0',
        timestamp: Date.now()
      };

      // 获取现有存档
      const existingSaves = this.getAllSaves();
      existingSaves[slotIndex] = saveData;

      // 保存到本地存储
      const saveString = JSON.stringify(existingSaves);
      localStorage.setItem(SaveSystem.SAVE_KEY, saveString);

      // 验证保存是否成功
      const verification = localStorage.getItem(SaveSystem.SAVE_KEY);
      if (!verification) {
        throw new Error('Save verification failed');
      }

      console.log(`Game saved successfully to slot ${slotIndex}`);
      return true;

    } catch (error) {
      console.error('Failed to save game:', error);
      return false;
    }
  }

  /**
   * 加载游戏数据
   */
  public async loadGame(slotIndex: number = 0): Promise<GameSaveData | null> {
    try {
      // 验证存档槽位
      if (slotIndex < 0 || slotIndex >= SaveSystem.MAX_SAVE_SLOTS) {
        throw new Error(`Invalid save slot: ${slotIndex}`);
      }

      const allSaves = this.getAllSaves();
      const saveData = allSaves[slotIndex];

      if (!saveData) {
        console.warn(`No save data found in slot ${slotIndex}`);
        return null;
      }

      // 验证存档版本兼容性
      if (!this.isVersionCompatible(saveData.version)) {
        console.warn(`Save version ${saveData.version} is not compatible with current version`);
        // 这里可以添加版本迁移逻辑
        return null;
      }

      console.log(`Game loaded successfully from slot ${slotIndex}`);
      return saveData;

    } catch (error) {
      console.error('Failed to load game:', error);
      return null;
    }
  }

  /**
   * 获取所有存档
   */
  public getAllSaves(): (GameSaveData | null)[] {
    try {
      const saveString = localStorage.getItem(SaveSystem.SAVE_KEY);
      if (!saveString) {
        return new Array(SaveSystem.MAX_SAVE_SLOTS).fill(null);
      }

      const saves = JSON.parse(saveString);
      
      // 确保返回正确数量的存档槽
      const result = new Array(SaveSystem.MAX_SAVE_SLOTS).fill(null);
      for (let i = 0; i < Math.min(saves.length, SaveSystem.MAX_SAVE_SLOTS); i++) {
        result[i] = saves[i];
      }

      return result;

    } catch (error) {
      console.error('Failed to get all saves:', error);
      return new Array(SaveSystem.MAX_SAVE_SLOTS).fill(null);
    }
  }

  /**
   * 删除存档
   */
  public deleteSave(slotIndex: number): boolean {
    try {
      if (slotIndex < 0 || slotIndex >= SaveSystem.MAX_SAVE_SLOTS) {
        throw new Error(`Invalid save slot: ${slotIndex}`);
      }

      const allSaves = this.getAllSaves();
      allSaves[slotIndex] = null;

      const saveString = JSON.stringify(allSaves);
      localStorage.setItem(SaveSystem.SAVE_KEY, saveString);

      console.log(`Save slot ${slotIndex} deleted successfully`);
      return true;

    } catch (error) {
      console.error('Failed to delete save:', error);
      return false;
    }
  }

  /**
   * 检查存档槽是否为空
   */
  public isSlotEmpty(slotIndex: number): boolean {
    const saves = this.getAllSaves();
    return saves[slotIndex] === null;
  }

  /**
   * 获取存档信息摘要
   */
  public getSaveSummary(slotIndex: number): {
    exists: boolean;
    timestamp?: number;
    playTime?: number;
    playerLevel?: number;
    farmProgress?: number;
  } {
    const saves = this.getAllSaves();
    const save = saves[slotIndex];

    if (!save) {
      return { exists: false };
    }

    return {
      exists: true,
      timestamp: save.timestamp,
      playTime: save.playTime,
      playerLevel: save.playerData.stats.level,
      farmProgress: this.calculateFarmProgress(save)
    };
  }

  /**
   * 计算农场进度百分比
   */
  private calculateFarmProgress(save: GameSaveData): number {
    const totalPlots = save.farmData.plots.length;
    const plowtedPlots = save.farmData.plots.filter(plot => plot.isPlowed).length;
    const cropsPlanted = save.farmData.plots.filter(plot => plot.crop).length;
    
    // 简单的进度计算：耕地占50%，种植占50%
    const plowProgress = (plowtedPlots / totalPlots) * 50;
    const cropProgress = (cropsPlanted / totalPlots) * 50;
    
    return Math.round(plowProgress + cropProgress);
  }

  /**
   * 自动保存
   */
  public async autoSave(gameData: GameSaveData): Promise<void> {
    if (!this.isAutoSaveEnabled) return;

    try {
      // 使用最后一个存档槽进行自动保存
      const autoSaveSlot = SaveSystem.MAX_SAVE_SLOTS - 1;
      await this.saveGame(autoSaveSlot, {
        ...gameData,
        gameSettings: {
          ...gameData.gameSettings,
          autoSave: true
        }
      });

      console.log('Auto-save completed');
    } catch (error) {
      console.error('Auto-save failed:', error);
    }
  }

  /**
   * 启动自动保存定时器
   */
  public startAutoSave(): void {
    if (this.autosaveTimer) {
      clearInterval(this.autosaveTimer);
    }

    this.autosaveTimer = setInterval(() => {
      // 这里需要从游戏中获取当前状态数据
      // 由于这是一个静态系统，需要通过事件或回调来获取数据
      this.requestAutoSave();
    }, SaveSystem.AUTOSAVE_INTERVAL);
  }

  /**
   * 停止自动保存
   */
  public stopAutoSave(): void {
    if (this.autosaveTimer) {
      clearInterval(this.autosaveTimer);
      this.autosaveTimer = null;
    }
  }

  /**
   * 请求自动保存（通过事件系统）
   */
  private requestAutoSave(): void {
    // 发送自动保存请求事件
    if (typeof window !== 'undefined' && window.dispatchEvent) {
      const autoSaveEvent = new CustomEvent('game-autosave-request');
      window.dispatchEvent(autoSaveEvent);
    }
  }

  /**
   * 设置自动保存开关
   */
  public setAutoSaveEnabled(enabled: boolean): void {
    this.isAutoSaveEnabled = enabled;
    if (enabled) {
      this.startAutoSave();
    } else {
      this.stopAutoSave();
    }
  }

  /**
   * 导出存档（用于备份）
   */
  public exportSave(slotIndex: number): string | null {
    try {
      const saves = this.getAllSaves();
      const save = saves[slotIndex];
      
      if (!save) {
        return null;
      }

      return btoa(JSON.stringify(save));
    } catch (error) {
      console.error('Failed to export save:', error);
      return null;
    }
  }

  /**
   * 导入存档
   */
  public importSave(slotIndex: number, exportedData: string): boolean {
    try {
      const saveData = JSON.parse(atob(exportedData)) as GameSaveData;
      
      // 验证导入数据的完整性
      if (!this.validateSaveData(saveData)) {
        throw new Error('Invalid save data structure');
      }

      this.saveGame(slotIndex, saveData);
      return true;
    } catch (error) {
      console.error('Failed to import save:', error);
      return false;
    }
  }

  /**
   * 验证存档数据完整性
   */
  private validateSaveData(data: any): data is GameSaveData {
    return (
      data &&
      typeof data.version === 'string' &&
      typeof data.timestamp === 'number' &&
      typeof data.playTime === 'number' &&
      data.playerData &&
      data.farmData &&
      data.gameSettings &&
      data.statistics
    );
  }

  /**
   * 检查版本兼容性
   */
  private isVersionCompatible(saveVersion: string): boolean {
    // 简单的版本检查，实际项目中可能需要更复杂的逻辑
    const currentVersion = '1.0.0';
    const [saveMajor, saveMinor] = saveVersion.split('.').map(Number);
    const [currentMajor, currentMinor] = currentVersion.split('.').map(Number);

    // 主版本号必须相同，次版本号可以向下兼容
    return saveMajor === currentMajor && saveMinor <= currentMinor;
  }

  /**
   * 保存游戏设置
   */
  public saveSettings(settings: any): boolean {
    try {
      localStorage.setItem(SaveSystem.SETTINGS_KEY, JSON.stringify(settings));
      return true;
    } catch (error) {
      console.error('Failed to save settings:', error);
      return false;
    }
  }

  /**
   * 加载游戏设置
   */
  public loadSettings(): any | null {
    try {
      const settingsString = localStorage.getItem(SaveSystem.SETTINGS_KEY);
      return settingsString ? JSON.parse(settingsString) : null;
    } catch (error) {
      console.error('Failed to load settings:', error);
      return null;
    }
  }

  /**
   * 清除所有存档数据
   */
  public clearAllSaves(): boolean {
    try {
      localStorage.removeItem(SaveSystem.SAVE_KEY);
      localStorage.removeItem(SaveSystem.SETTINGS_KEY);
      console.log('All save data cleared');
      return true;
    } catch (error) {
      console.error('Failed to clear save data:', error);
      return false;
    }
  }

  /**
   * 获取存储使用情况
   */
  public getStorageInfo(): {
    used: number;
    available: number;
    percentage: number;
  } {
    try {
      let used = 0;
      let available = 0;

      // 计算已使用的存储空间
      for (let key in localStorage) {
        if (localStorage.hasOwnProperty(key)) {
          used += localStorage[key].length;
        }
      }

      // 估算可用空间（大多数浏览器限制为5-10MB）
      const estimatedLimit = 5 * 1024 * 1024; // 5MB
      available = estimatedLimit - used;
      const percentage = (used / estimatedLimit) * 100;

      return {
        used: Math.round(used / 1024), // KB
        available: Math.round(available / 1024), // KB
        percentage: Math.round(percentage)
      };
    } catch (error) {
      console.error('Failed to get storage info:', error);
      return { used: 0, available: 0, percentage: 0 };
    }
  }

  /**
   * 销毁存档系统
   */
  public destroy(): void {
    this.stopAutoSave();
  }
}
import * as Phaser from 'phaser';
import GameScene from '../scenes/GameScene';
import { UIScene } from '../scenes/UIScene';
import { PreloadScene } from '../scenes/PreloadScene';

/**
 * 游戏管理器类 - 核心系统管理器
 * 
 * 参考 top-down-react-phaser-game 的架构设计，采用单例模式统一管理游戏状态、
 * 事件系统和场景间通信。这个类是整个游戏的中枢神经系统，负责协调各个
 * 子系统的工作。
 * 
 * 主要功能：
 * - 🎮 游戏状态管理：暂停、恢复、保存、加载
 * - 📡 事件系统：统一的事件发射和监听机制
 * - 🔗 场景通信：优化场景间的数据传递和同步
 * - 💾 数据持久化：游戏进度的自动保存和恢复
 * - 🏗️ 系统协调：各子系统的初始化和生命周期管理
 * 
 * 设计模式：
 * - 单例模式：确保全局唯一的游戏状态
 * - 观察者模式：事件驱动的系统通信
 * - 状态模式：游戏状态的管理和切换
 */
export class GameManager {
  private static instance: GameManager;
  private gameScene: GameScene | null = null;
  private uiScene: UIScene | null = null;
  private preloadScene: PreloadScene | null = null;
  
  // 游戏状态管理
  private gameState: {
    isPaused: boolean;
    isLoading: boolean;
    currentSeason: string;
    gameTime: number;
    playerData: any;
  } = {
    isPaused: false,
    isLoading: false,
    currentSeason: 'spring',
    gameTime: 0,
    playerData: null
  };

  // 事件系统
  private eventEmitter: Phaser.Events.EventEmitter;

  private constructor() {
    this.eventEmitter = new Phaser.Events.EventEmitter();
  }

  public static getInstance(): GameManager {
    if (!GameManager.instance) {
      GameManager.instance = new GameManager();
    }
    return GameManager.instance;
  }

  /**
   * 初始化游戏管理器
   * @param scenes 场景引用
   */
  public initialize(scenes: {
    gameScene?: GameScene;
    uiScene?: UIScene;
    preloadScene?: PreloadScene;
  }) {
    this.gameScene = scenes.gameScene || null;
    this.uiScene = scenes.uiScene || null;
    this.preloadScene = scenes.preloadScene || null;
    
    console.log('GameManager initialized with scenes:', {
      gameScene: !!this.gameScene,
      uiScene: !!this.uiScene,
      preloadScene: !!this.preloadScene
    });
  }

  /**
   * 获取游戏场景引用
   */
  public getGameScene(): GameScene | null {
    return this.gameScene;
  }

  /**
   * 获取UI场景引用
   */
  public getUIScene(): UIScene | null {
    return this.uiScene;
  }

  /**
   * 事件发射器
   */
  public emit(event: string, ...args: any[]): void {
    this.eventEmitter.emit(event, ...args);
  }

  /**
   * 事件监听器
   */
  public on(event: string, callback: Function, context?: any): void {
    this.eventEmitter.on(event, callback, context);
  }

  /**
   * 移除事件监听器
   */
  public off(event: string, callback?: Function, context?: any): void {
    this.eventEmitter.off(event, callback, context);
  }

  /**
   * 暂停游戏
   */
  public pauseGame(): void {
    this.gameState.isPaused = true;
    if (this.gameScene && this.gameScene.scene.isActive()) {
      this.gameScene.scene.pause();
    }
    this.emit('game-paused');
  }

  /**
   * 恢复游戏
   */
  public resumeGame(): void {
    this.gameState.isPaused = false;
    if (this.gameScene && this.gameScene.scene.isPaused()) {
      this.gameScene.scene.resume();
    }
    this.emit('game-resumed');
  }

  /**
   * 获取游戏状态
   */
  public getGameState() {
    return { ...this.gameState };
  }

  /**
   * 更新游戏状态
   */
  public updateGameState(updates: Partial<typeof this.gameState>): void {
    Object.assign(this.gameState, updates);
    this.emit('game-state-changed', this.gameState);
  }

  /**
   * 保存游戏数据
   */
  public saveGame(): void {
    try {
      const saveData = {
        gameState: this.gameState,
        playerData: this.gameState.playerData,
        timestamp: Date.now()
      };
      
      localStorage.setItem('farm-game-save', JSON.stringify(saveData));
      this.emit('game-saved');
      console.log('Game saved successfully');
    } catch (error) {
      console.error('Failed to save game:', error);
      this.emit('save-error', error);
    }
  }

  /**
   * 加载游戏数据
   */
  public loadGame(): boolean {
    try {
      const saveData = localStorage.getItem('farm-game-save');
      if (saveData) {
        const parsed = JSON.parse(saveData);
        this.gameState = { ...this.gameState, ...parsed.gameState };
        this.emit('game-loaded', parsed);
        console.log('Game loaded successfully');
        return true;
      }
      return false;
    } catch (error) {
      console.error('Failed to load game:', error);
      this.emit('load-error', error);
      return false;
    }
  }

  /**
   * 重置游戏
   */
  public resetGame(): void {
    this.gameState = {
      isPaused: false,
      isLoading: false,
      currentSeason: 'spring',
      gameTime: 0,
      playerData: null
    };
    
    localStorage.removeItem('farm-game-save');
    this.emit('game-reset');
    console.log('Game reset');
  }

  /**
   * 场景间通信
   */
  public sendToScene(sceneKey: string, event: string, ...args: any[]): void {
    if (sceneKey === 'GameScene' && this.gameScene) {
      this.gameScene.events.emit(event, ...args);
    } else if (sceneKey === 'UIScene' && this.uiScene) {
      this.uiScene.events.emit(event, ...args);
    } else if (sceneKey === 'PreloadScene' && this.preloadScene) {
      this.preloadScene.events.emit(event, ...args);
    }
  }

  /**
   * 销毁游戏管理器
   */
  public destroy(): void {
    this.eventEmitter.removeAllListeners();
    this.gameScene = null;
    this.uiScene = null;
    this.preloadScene = null;
  }
}
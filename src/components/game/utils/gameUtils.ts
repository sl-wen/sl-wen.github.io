import { GameSize } from '../types/GameTypes';

// 计算游戏尺寸
export const calculateGameSize = (): GameSize => {
  const width = 1280;
  const height = 900;
  const multiplier = 1;

  return {
    width,
    height,
    multiplier,
  };
};

// 检测是否为移动设备
export const isMobileDevice = (): boolean => {
  const userAgent = navigator.userAgent.toLowerCase();
  const isMobileDevice = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent);
  const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  return isMobileDevice || isTouchDevice;
};

// 获取移动设备游戏尺寸
export const getMobileGameSize = (): GameSize => {
  return {
    width: 400,
    height: 600,
    multiplier: 1,
  };
};

// 获取桌面设备游戏尺寸
export const getDesktopGameSize = (): GameSize => {
  return {
    width: 1280,
    height: 900,
    multiplier: 1,
  };
};

// 根据设备类型获取游戏尺寸
export const getGameSizeByDevice = (): GameSize => {
  return isMobileDevice() ? getMobileGameSize() : getDesktopGameSize();
};

// 创建自定义事件
export const createCustomEvent = (eventName: string, detail: any): CustomEvent => {
  return new CustomEvent(eventName, {
    detail,
  });
};

// 分发游戏事件
export const dispatchGameEvent = (eventName: string, detail: any): void => {
  const event = createCustomEvent(eventName, detail);
  window.dispatchEvent(event);
};

// 游戏常量
export const GAME_CONSTANTS = {
  TILE_SIZE: 32,
  PLAYER_SPEED: 200,
  DIALOG_SPEED: 50,
  MENU_ANIMATION_DURATION: 300,
  HEALTH_BAR_WIDTH: 200,
  HEALTH_BAR_HEIGHT: 20,
  COIN_ICON_SIZE: 32,
} as const;

// 游戏状态常量
export const GAME_STATES = {
  BOOT: 'BOOT',
  MAIN_MENU: 'MAIN_MENU',
  PLAYING: 'PLAYING',
  PAUSED: 'PAUSED',
  GAME_OVER: 'GAME_OVER',
} as const;

// 输入控制常量
export const INPUT_KEYS = {
  UP: ['W', 'w', 'ArrowUp'],
  DOWN: ['S', 's', 'ArrowDown'],
  LEFT: ['A', 'a', 'ArrowLeft'],
  RIGHT: ['D', 'd', 'ArrowRight'],
  ACTION: ['Space', ' '],
  MENU: ['Escape', 'Escape'],
} as const;

// 游戏资源路径
export const ASSET_PATHS = {
  IMAGES: '/game/assets/images/',
  SPRITES: '/game/assets/sprites/',
  TILESETS: '/game/assets/tilesets/',
  FONTS: '/game/assets/fonts/',
} as const;

// 游戏配置
export const GAME_CONFIG = {
  TITLE: 'Top-Down RPG Game',
  VERSION: '1.0.0',
  AUTHOR: 'Game Developer',
  DESCRIPTION: 'A top-down RPG game built with React, TypeScript, and Phaser',
} as const;

// 游戏状态管理
export class GameStateManager {
  private static instance: GameStateManager;
  private state: any = {};

  private constructor() {}

  static getInstance(): GameStateManager {
    if (!GameStateManager.instance) {
      GameStateManager.instance = new GameStateManager();
    }
    return GameStateManager.instance;
  }

  setState(key: string, value: any): void {
    this.state[key] = value;
  }

  getState(key: string): any {
    return this.state[key];
  }

  getFullState(): any {
    return { ...this.state };
  }

  clearState(): void {
    this.state = {};
  }
}

// 游戏事件管理器
export class GameEventManager {
  private static instance: GameEventManager;
  private listeners: Map<string, Function[]> = new Map();

  private constructor() {}

  static getInstance(): GameEventManager {
    if (!GameEventManager.instance) {
      GameEventManager.instance = new GameEventManager();
    }
    return GameEventManager.instance;
  }

  on(event: string, callback: Function): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event)!.push(callback);
  }

  off(event: string, callback: Function): void {
    if (this.listeners.has(event)) {
      const callbacks = this.listeners.get(event)!;
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
    }
  }

  emit(event: string, data?: any): void {
    if (this.listeners.has(event)) {
      this.listeners.get(event)!.forEach(callback => {
        callback(data);
      });
    }
  }

  clear(): void {
    this.listeners.clear();
  }
}

// 游戏数据持久化
export class GameDataManager {
  private static instance: GameDataManager;
  private storageKey = 'top-down-rpg-save';

  private constructor() {}

  static getInstance(): GameDataManager {
    if (!GameDataManager.instance) {
      GameDataManager.instance = new GameDataManager();
    }
    return GameDataManager.instance;
  }

  saveGame(data: any): void {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(data));
    } catch (error) {
      console.error('Failed to save game data:', error);
    }
  }

  loadGame(): any {
    try {
      const data = localStorage.getItem(this.storageKey);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error('Failed to load game data:', error);
      return null;
    }
  }

  clearSave(): void {
    try {
      localStorage.removeItem(this.storageKey);
    } catch (error) {
      console.error('Failed to clear save data:', error);
    }
  }

  hasSave(): boolean {
    return localStorage.getItem(this.storageKey) !== null;
  }
}

// 游戏性能监控
export class PerformanceMonitor {
  private static instance: PerformanceMonitor;
  private metrics: Map<string, number[]> = new Map();

  private constructor() {}

  static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor();
    }
    return PerformanceMonitor.instance;
  }

  startTimer(name: string): void {
    this.metrics.set(name, [performance.now()]);
  }

  endTimer(name: string): number {
    const metric = this.metrics.get(name);
    if (metric && metric.length > 0) {
      const duration = performance.now() - metric[0];
      metric.push(duration);
      return duration;
    }
    return 0;
  }

  getAverageTime(name: string): number {
    const metric = this.metrics.get(name);
    if (metric && metric.length > 1) {
      const times = metric.slice(1);
      return times.reduce((sum, time) => sum + time, 0) / times.length;
    }
    return 0;
  }

  clearMetrics(): void {
    this.metrics.clear();
  }
}
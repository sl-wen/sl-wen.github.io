import * as Phaser from 'phaser';

// 屏幕尺寸枚举
export enum ScreenSize {
  SMALL = 'small',      // 320x240
  MEDIUM = 'medium',    // 640x480
  LARGE = 'large',      // 800x600
  XLARGE = 'xlarge',    // 1024x768
  FULLSCREEN = 'fullscreen'
}

// 设备类型枚举
export enum DeviceType {
  MOBILE = 'mobile',
  TABLET = 'tablet',
  DESKTOP = 'desktop'
}

// 方向枚举
export enum Orientation {
  PORTRAIT = 'portrait',
  LANDSCAPE = 'landscape'
}

// 窗口配置接口
export interface WindowConfig {
  width: number;
  height: number;
  scale: number;
  deviceType: DeviceType;
  orientation: Orientation;
  screenSize: ScreenSize;
  isFullscreen: boolean;
  pixelArt: boolean;
  autoRound: boolean;
}

// 窗口事件接口
export interface WindowEvent {
  type: 'resize' | 'orientation' | 'fullscreen' | 'device';
  oldConfig: WindowConfig;
  newConfig: WindowConfig;
}

// 预设尺寸配置
export const PRESET_SIZES = {
  [ScreenSize.SMALL]: { width: 320, height: 240, scale: 1 },
  [ScreenSize.MEDIUM]: { width: 640, height: 480, scale: 1 },
  [ScreenSize.LARGE]: { width: 800, height: 600, scale: 1 },
  [ScreenSize.XLARGE]: { width: 1024, height: 768, scale: 1 }
};

export class WindowManager {
  private static instance: WindowManager;
  private game: Phaser.Game | null = null;
  private config: WindowConfig;
  private eventListeners: Map<string, ((event: WindowEvent) => void)[]> = new Map();
  private resizeTimeout: NodeJS.Timeout | null = null;
  private isInitialized = false;

  constructor() {
    this.config = this.getDefaultConfig();
  }

  // 单例模式
  public static getInstance(): WindowManager {
    if (!WindowManager.instance) {
      WindowManager.instance = new WindowManager();
    }
    return WindowManager.instance;
  }

  // 初始化窗口管理器
  public initialize(game: Phaser.Game): void {
    this.game = game;
    this.config = this.calculateOptimalConfig();
    this.setupEventListeners();
    this.applyConfig();
    this.isInitialized = true;

    console.log('🖥️ WindowManager: 初始化完成', this.config);
  }

  // 获取默认配置
  private getDefaultConfig(): WindowConfig {
    return {
      width: 800,
      height: 600,
      scale: 1,
      deviceType: DeviceType.DESKTOP,
      orientation: Orientation.LANDSCAPE,
      screenSize: ScreenSize.LARGE,
      isFullscreen: false,
      pixelArt: true,
      autoRound: true
    };
  }

  // 计算最优配置
  private calculateOptimalConfig(): WindowConfig {
    const screenWidth = window.innerWidth;
    const screenHeight = window.innerHeight;
    const deviceType = this.detectDeviceType();
    const orientation = this.detectOrientation();
    const isFullscreen = this.isFullscreen();

    // 计算可用空间
    const availableWidth = screenWidth - 20; // 留出边距
    const availableHeight = screenHeight - 20;

    // 根据设备类型和方向计算游戏尺寸
    let gameWidth: number;
    let gameHeight: number;
    let scale: number;
    let screenSize: ScreenSize;

    if (deviceType === DeviceType.MOBILE) {
      if (orientation === Orientation.PORTRAIT) {
        // 移动端竖屏：使用较小的尺寸
        gameWidth = Math.min(availableWidth, 400);
        gameHeight = Math.min(availableHeight, 600);
        scale = Math.min(gameWidth / 320, gameHeight / 480);
        screenSize = ScreenSize.SMALL;
      } else {
        // 移动端横屏：使用中等尺寸
        gameWidth = Math.min(availableWidth, 600);
        gameHeight = Math.min(availableHeight, 400);
        scale = Math.min(gameWidth / 640, gameHeight / 480);
        screenSize = ScreenSize.MEDIUM;
      }
    } else if (deviceType === DeviceType.TABLET) {
      // 平板：使用大尺寸
      gameWidth = Math.min(availableWidth, 800);
      gameHeight = Math.min(availableHeight, 600);
      scale = Math.min(gameWidth / 800, gameHeight / 600);
      screenSize = ScreenSize.LARGE;
    } else {
      // 桌面：使用大尺寸或超大尺寸
      if (availableWidth >= 1024 && availableHeight >= 768) {
        gameWidth = Math.min(availableWidth, 1024);
        gameHeight = Math.min(availableHeight, 768);
        scale = Math.min(gameWidth / 1024, gameHeight / 768);
        screenSize = ScreenSize.XLARGE;
      } else {
        gameWidth = Math.min(availableWidth, 800);
        gameHeight = Math.min(availableHeight, 600);
        scale = Math.min(gameWidth / 800, gameHeight / 600);
        screenSize = ScreenSize.LARGE;
      }
    }

    // 确保尺寸是16的倍数（像素艺术要求）
    gameWidth = Math.floor(gameWidth / 16) * 16;
    gameHeight = Math.floor(gameHeight / 16) * 16;

    // 限制缩放范围
    scale = Math.max(0.5, Math.min(scale, 4));

    return {
      width: gameWidth,
      height: gameHeight,
      scale,
      deviceType,
      orientation,
      screenSize,
      isFullscreen,
      pixelArt: true,
      autoRound: true
    };
  }

  // 检测设备类型
  private detectDeviceType(): DeviceType {
    const userAgent = navigator.userAgent.toLowerCase();
    const isMobile = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent);
    const isTablet = /ipad|android(?=.*\b(?!.*mobile))/i.test(userAgent);
    
    if (isTablet) return DeviceType.TABLET;
    if (isMobile) return DeviceType.MOBILE;
    return DeviceType.DESKTOP;
  }

  // 检测方向
  private detectOrientation(): Orientation {
    return window.innerWidth > window.innerHeight ? Orientation.LANDSCAPE : Orientation.PORTRAIT;
  }

  // 检测是否全屏
  private isFullscreen(): boolean {
    return !!(document.fullscreenElement || (document as any).webkitFullscreenElement);
  }

  // 设置事件监听器
  private setupEventListeners(): void {
    // 窗口大小变化
    window.addEventListener('resize', this.handleResize.bind(this));
    
    // 方向变化
    window.addEventListener('orientationchange', this.handleOrientationChange.bind(this));
    
    // 全屏变化
    document.addEventListener('fullscreenchange', this.handleFullscreenChange.bind(this));
    document.addEventListener('webkitfullscreenchange', this.handleFullscreenChange.bind(this));
  }

  // 处理窗口大小变化
  private handleResize(): void {
    if (this.resizeTimeout) {
      clearTimeout(this.resizeTimeout);
    }

    this.resizeTimeout = setTimeout(() => {
      const oldConfig = { ...this.config };
      this.config = this.calculateOptimalConfig();
      
      if (this.hasConfigChanged(oldConfig, this.config)) {
        this.applyConfig();
        this.emitEvent('resize', oldConfig, this.config);
      }
    }, 100);
  }

  // 处理方向变化
  private handleOrientationChange(): void {
    setTimeout(() => {
      const oldConfig = { ...this.config };
      this.config = this.calculateOptimalConfig();
      
      if (oldConfig.orientation !== this.config.orientation) {
        this.applyConfig();
        this.emitEvent('orientation', oldConfig, this.config);
      }
    }, 500); // 延迟处理，等待方向变化完成
  }

  // 处理全屏变化
  private handleFullscreenChange(): void {
    const oldConfig = { ...this.config };
    this.config.isFullscreen = this.isFullscreen();
    
    if (oldConfig.isFullscreen !== this.config.isFullscreen) {
      this.applyConfig();
      this.emitEvent('fullscreen', oldConfig, this.config);
    }
  }

  // 检查配置是否发生变化
  private hasConfigChanged(oldConfig: WindowConfig, newConfig: WindowConfig): boolean {
    return (
      oldConfig.width !== newConfig.width ||
      oldConfig.height !== newConfig.height ||
      oldConfig.scale !== newConfig.scale ||
      oldConfig.deviceType !== newConfig.deviceType ||
      oldConfig.orientation !== newConfig.orientation ||
      oldConfig.screenSize !== newConfig.screenSize ||
      oldConfig.isFullscreen !== newConfig.isFullscreen
    );
  }

  // 应用配置
  private applyConfig(): void {
    if (!this.game) return;

    // 更新游戏配置
    this.game.scale.setGameSize(this.config.width, this.config.height);
    this.game.scale.setZoom(this.config.scale);
    
    // 设置像素艺术模式
    // this.game.scale.setPixelArt(this.config.pixelArt); // Phaser method not available
    this.game.scale.autoRound = this.config.autoRound;

    // 设置缩放模式
    if (this.config.deviceType === DeviceType.MOBILE) {
      this.game.scale.scaleMode = Phaser.Scale.FIT;
      this.game.scale.autoCenter = Phaser.Scale.CENTER_BOTH;
    } else {
      this.game.scale.scaleMode = Phaser.Scale.FIT;
      this.game.scale.autoCenter = Phaser.Scale.CENTER_BOTH;
    }

    console.log('🔄 WindowManager: 应用新配置', this.config);
  }

  // 切换到指定尺寸
  public setScreenSize(screenSize: ScreenSize): void {
    const preset = (PRESET_SIZES as any)[screenSize];
    if (!preset) return;

    const oldConfig = { ...this.config };
    this.config.width = preset.width;
    this.config.height = preset.height;
    this.config.scale = preset.scale;
    this.config.screenSize = screenSize;

    this.applyConfig();
    this.emitEvent('resize', oldConfig, this.config);
  }

  // 切换全屏
  public toggleFullscreen(): void {
    if (this.config.isFullscreen) {
      this.exitFullscreen();
    } else {
      this.enterFullscreen();
    }
  }

  // 进入全屏
  public enterFullscreen(): void {
    const element = document.documentElement;
    
    if (element.requestFullscreen) {
      element.requestFullscreen();
    } else if ((element as any).webkitRequestFullscreen) {
      (element as any).webkitRequestFullscreen();
    } else if ((element as any).mozRequestFullScreen) {
      (element as any).mozRequestFullScreen();
    } else if ((element as any).msRequestFullscreen) {
      (element as any).msRequestFullscreen();
    }
  }

  // 退出全屏
  public exitFullscreen(): void {
    if (document.exitFullscreen) {
      document.exitFullscreen();
    } else if ((document as any).webkitExitFullscreen) {
      (document as any).webkitExitFullscreen();
    } else if ((document as any).mozCancelFullScreen) {
      (document as any).mozCancelFullScreen();
    } else if ((document as any).msExitFullscreen) {
      (document as any).msExitFullscreen();
    }
  }

  // 获取当前配置
  public getConfig(): WindowConfig {
    return { ...this.config };
  }

  // 获取游戏尺寸
  public getGameSize(): { width: number; height: number } {
    return {
      width: this.config.width,
      height: this.config.height
    };
  }

  // 获取设备类型
  public getDeviceType(): DeviceType {
    return this.config.deviceType;
  }

  // 获取方向
  public getOrientation(): Orientation {
    return this.config.orientation;
  }

  // 是否为移动设备
  public isMobile(): boolean {
    return this.config.deviceType === DeviceType.MOBILE;
  }

  // 是否为平板设备
  public isTablet(): boolean {
    return this.config.deviceType === DeviceType.TABLET;
  }

  // 是否为桌面设备
  public isDesktop(): boolean {
    return this.config.deviceType === DeviceType.DESKTOP;
  }

  // 是否为竖屏
  public isPortrait(): boolean {
    return this.config.orientation === Orientation.PORTRAIT;
  }

  // 是否为横屏
  public isLandscape(): boolean {
    return this.config.orientation === Orientation.LANDSCAPE;
  }

  // 是否为全屏
  public isFullscreenMode(): boolean {
    return this.config.isFullscreen;
  }

  // 事件监听
  public on(event: string, callback: (event: WindowEvent) => void): void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, []);
    }
    this.eventListeners.get(event)!.push(callback);
  }

  public off(event: string, callback: (event: WindowEvent) => void): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      const index = listeners.indexOf(callback);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    }
  }

  // 发送事件
  private emitEvent(type: string, oldConfig: WindowConfig, newConfig: WindowConfig): void {
    const event: WindowEvent = {
      type: type as any,
      oldConfig,
      newConfig
    };

    const listeners = this.eventListeners.get(type);
    if (listeners) {
      listeners.forEach(callback => {
        try {
          callback(event);
        } catch (error) {
          console.error('Error in window event listener:', error);
        }
      });
    }
  }

  // 销毁
  public destroy(): void {
    if (this.resizeTimeout) {
      clearTimeout(this.resizeTimeout);
    }

    window.removeEventListener('resize', this.handleResize.bind(this));
    window.removeEventListener('orientationchange', this.handleOrientationChange.bind(this));
    document.removeEventListener('fullscreenchange', this.handleFullscreenChange.bind(this));
    document.removeEventListener('webkitfullscreenchange', this.handleFullscreenChange.bind(this));

    this.eventListeners.clear();
    this.game = null;
    this.isInitialized = false;

    console.log('🗑️ WindowManager: 销毁完成');
  }
}

// 工具函数：创建窗口管理器
export function createWindowManager(game: Phaser.Game): WindowManager {
  const manager = WindowManager.getInstance();
  manager.initialize(game);
  return manager;
}

// 工具函数：获取响应式尺寸
export function getResponsiveSize(): { width: number; height: number; scale: number } {
  const screenWidth = window.innerWidth;
  const screenHeight = window.innerHeight;
  
  // 计算可用空间
  const availableWidth = screenWidth - 20;
  const availableHeight = screenHeight - 20;
  
  // 保持16:9的宽高比
  const aspectRatio = 16 / 9;
  let gameWidth = availableWidth;
  let gameHeight = gameWidth / aspectRatio;
  
  if (gameHeight > availableHeight) {
    gameHeight = availableHeight;
    gameWidth = gameHeight * aspectRatio;
  }
  
  // 确保尺寸是16的倍数
  gameWidth = Math.floor(gameWidth / 16) * 16;
  gameHeight = Math.floor(gameHeight / 16) * 16;
  
  // 计算缩放
  const scale = Math.min(gameWidth / 800, gameHeight / 600);
  
  return {
    width: gameWidth,
    height: gameHeight,
    scale: Math.max(0.5, Math.min(scale, 4))
  };
}
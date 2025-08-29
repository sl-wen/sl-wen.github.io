/**
 * 移动端适配系统
 * 负责管理游戏在移动设备上的适配，包括触摸控制、响应式UI、设备检测、性能优化等
 */

import { storage } from '../utils';

// 设备类型
export type DeviceType = 'mobile' | 'tablet' | 'desktop' | 'tv' | 'unknown';

// 操作系统类型
export type OSType = 'ios' | 'android' | 'windows' | 'macos' | 'linux' | 'unknown';

// 浏览器类型
export type BrowserType = 'chrome' | 'safari' | 'firefox' | 'edge' | 'opera' | 'unknown';

// 屏幕方向
export type ScreenOrientation = 'portrait' | 'landscape' | 'auto';

// 触摸控制类型
export type TouchControlType = 'joystick' | 'buttons' | 'gesture' | 'hybrid';

// 性能模式
export type PerformanceMode = 'low' | 'medium' | 'high' | 'auto';

// 设备信息
export interface DeviceInfo {
  type: DeviceType;
  os: OSType;
  browser: BrowserType;
  screenWidth: number;
  screenHeight: number;
  pixelRatio: number;
  orientation: ScreenOrientation;
  isTouch: boolean;
  isRetina: boolean;
  isFullscreen: boolean;
  userAgent: string;
  capabilities: DeviceCapabilities;
}

// 设备能力
export interface DeviceCapabilities {
  touch: boolean;
  multiTouch: boolean;
  accelerometer: boolean;
  gyroscope: boolean;
  vibration: boolean;
  geolocation: boolean;
  camera: boolean;
  microphone: boolean;
  webGL: boolean;
  webAudio: boolean;
  localStorage: boolean;
  sessionStorage: boolean;
  indexedDB: boolean;
  serviceWorker: boolean;
  pushNotification: boolean;
}

// 移动端配置
export interface MobileConfig {
  // 基础配置
  enableTouchControls: boolean;
  enableGestures: boolean;
  enableVibration: boolean;
  enableFullscreen: boolean;
  enableOrientationLock: boolean;
  
  // 性能配置
  performanceMode: PerformanceMode;
  targetFPS: number;
  enableBatteryOptimization: boolean;
  enableMemoryOptimization: boolean;
  
  // UI配置
  uiScale: number;
  buttonSize: number;
  joystickSize: number;
  safeAreaMargin: number;
  
  // 触摸配置
  touchControlType: TouchControlType;
  touchSensitivity: number;
  touchDeadZone: number;
  multiTouchEnabled: boolean;
  
  // 音频配置
  enableAudio: boolean;
  audioQuality: 'low' | 'medium' | 'high';
  enableHapticFeedback: boolean;
}

// 触摸控制配置
export interface TouchControlConfig {
  type: TouchControlType;
  position: 'left' | 'right' | 'bottom' | 'custom';
  size: number;
  opacity: number;
  sensitivity: number;
  deadZone: number;
  autoHide: boolean;
  customPosition?: { x: number; y: number };
}

// 手势配置
export interface GestureConfig {
  enabled: boolean;
  swipeThreshold: number;
  pinchThreshold: number;
  longPressDuration: number;
  doubleTapDelay: number;
}

// 性能配置
export interface PerformanceConfig {
  mode: PerformanceMode;
  targetFPS: number;
  maxParticles: number;
  maxEffects: number;
  textureQuality: 'low' | 'medium' | 'high';
  audioQuality: 'low' | 'medium' | 'high';
  enableShadows: boolean;
  enablePostProcessing: boolean;
}

// 移动端事件
export interface MobileEvent {
  type: 'orientation_change' | 'resize' | 'touch_start' | 'touch_end' | 'gesture_detected' | 'performance_warning' | 'battery_low' | 'custom';
  data?: any;
  timestamp: number;
}

// 移动端统计
export interface MobileStats {
  deviceInfo: DeviceInfo;
  performance: {
    fps: number;
    memoryUsage: number;
    batteryLevel: number;
    temperature: number;
  };
  touchStats: {
    totalTouches: number;
    averageTouchDuration: number;
    gestureCount: number;
  };
  sessionStats: {
    sessionDuration: number;
    orientationChanges: number;
    performanceWarnings: number;
  };
}

export class MobileAdapterSystem {
  private static instance: MobileAdapterSystem;
  private scene: Phaser.Scene | null = null;
  
  // 数据存储
  private deviceInfo: DeviceInfo;
  private config: MobileConfig;
  private events: MobileEvent[] = [];
  private callbacks: Map<string, (data: any) => void> = new Map();
  
  // 状态管理
  private isInitialized: boolean = false;
  private isFullscreen: boolean = false;
  private currentOrientation: ScreenOrientation = 'portrait';
  private batteryLevel: number = 100;
  private temperature: number = 25;
  
  // 性能监控
  private performanceTimer: number = 0;
  private fpsHistory: number[] = [];
  private memoryHistory: number[] = [];
  
  // 触摸统计
  private touchStats = {
    totalTouches: 0,
    touchStartTime: 0,
    touchDurations: [] as number[],
    gestureCount: 0
  };
  
  // 会话统计
  private sessionStats = {
    startTime: Date.now(),
    orientationChanges: 0,
    performanceWarnings: 0
  };

  private constructor() {
    this.deviceInfo = this.detectDevice();
    this.config = this.getDefaultConfig();
    this.setupEventListeners();
  }

  public static getInstance(): MobileAdapterSystem {
    if (!MobileAdapterSystem.instance) {
      MobileAdapterSystem.instance = new MobileAdapterSystem();
    }
    return MobileAdapterSystem.instance;
  }

  /**
   * 初始化移动端适配系统
   */
  public initialize(scene: Phaser.Scene): void {
    this.scene = scene;
    this.isInitialized = true;
    this.applyMobileConfig();
    this.startPerformanceMonitoring();
    console.log('移动端适配系统已初始化');
  }

  /**
   * 检测设备信息
   */
  private detectDevice(): DeviceInfo {
    const userAgent = navigator.userAgent;
    const screenWidth = window.screen.width;
    const screenHeight = window.screen.height;
    const pixelRatio = window.devicePixelRatio || 1;
    
    // 检测设备类型
    let deviceType: DeviceType = 'unknown';
    if (/Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent)) {
      if (/iPad|Android.*Tablet/i.test(userAgent)) {
        deviceType = 'tablet';
      } else {
        deviceType = 'mobile';
      }
    } else if (/TV|SmartTV/i.test(userAgent)) {
      deviceType = 'tv';
    } else {
      deviceType = 'desktop';
    }
    
    // 检测操作系统
    let os: OSType = 'unknown';
    if (/Android/i.test(userAgent)) {
      os = 'android';
    } else if (/iPhone|iPad|iPod/i.test(userAgent)) {
      os = 'ios';
    } else if (/Windows/i.test(userAgent)) {
      os = 'windows';
    } else if (/Mac OS X/i.test(userAgent)) {
      os = 'macos';
    } else if (/Linux/i.test(userAgent)) {
      os = 'linux';
    }
    
    // 检测浏览器
    let browser: BrowserType = 'unknown';
    if (/Chrome/i.test(userAgent)) {
      browser = 'chrome';
    } else if (/Safari/i.test(userAgent) && !/Chrome/i.test(userAgent)) {
      browser = 'safari';
    } else if (/Firefox/i.test(userAgent)) {
      browser = 'firefox';
    } else if (/Edge/i.test(userAgent)) {
      browser = 'edge';
    } else if (/Opera|OPR/i.test(userAgent)) {
      browser = 'opera';
    }
    
    // 检测屏幕方向
    const orientation: ScreenOrientation = screenWidth > screenHeight ? 'landscape' : 'portrait';
    
    // 检测触摸支持
    const isTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    
    // 检测Retina屏幕
    const isRetina = pixelRatio > 1;
    
    // 检测全屏状态
    const isFullscreen = !!(document.fullscreenElement || (document as any).webkitFullscreenElement);
    
    // 检测设备能力
    const capabilities = this.detectCapabilities();
    
    return {
      type: deviceType,
      os,
      browser,
      screenWidth,
      screenHeight,
      pixelRatio,
      orientation,
      isTouch,
      isRetina,
      isFullscreen,
      userAgent,
      capabilities
    };
  }

  /**
   * 检测设备能力
   */
  private detectCapabilities(): DeviceCapabilities {
    return {
      touch: 'ontouchstart' in window,
      multiTouch: navigator.maxTouchPoints > 1,
      accelerometer: 'DeviceMotionEvent' in window,
      gyroscope: 'DeviceOrientationEvent' in window,
      vibration: 'vibrate' in navigator,
      geolocation: 'geolocation' in navigator,
      camera: 'getUserMedia' in navigator,
      microphone: 'getUserMedia' in navigator,
      webGL: this.detectWebGL(),
      webAudio: 'AudioContext' in window || 'webkitAudioContext' in window,
      localStorage: this.testLocalStorage(),
      sessionStorage: this.testSessionStorage(),
      indexedDB: 'indexedDB' in window,
      serviceWorker: 'serviceWorker' in navigator,
      pushNotification: 'PushManager' in window
    };
  }

  /**
   * 检测WebGL支持
   */
  private detectWebGL(): boolean {
    try {
      const canvas = document.createElement('canvas');
      return !!(window.WebGLRenderingContext && 
        (canvas.getContext('webgl') || canvas.getContext('experimental-webgl')));
    } catch (e) {
      return false;
    }
  }

  /**
   * 测试localStorage
   */
  private testLocalStorage(): boolean {
    try {
      const test = 'test';
      localStorage.setItem(test, test);
      localStorage.removeItem(test);
      return true;
    } catch (e) {
      return false;
    }
  }

  /**
   * 测试sessionStorage
   */
  private testSessionStorage(): boolean {
    try {
      const test = 'test';
      sessionStorage.setItem(test, test);
      sessionStorage.removeItem(test);
      return true;
    } catch (e) {
      return false;
    }
  }

  /**
   * 获取默认配置
   */
  private getDefaultConfig(): MobileConfig {
    const isMobile = this.deviceInfo.type === 'mobile' || this.deviceInfo.type === 'tablet';
    
    return {
      enableTouchControls: isMobile,
      enableGestures: isMobile,
      enableVibration: isMobile && this.deviceInfo.capabilities.vibration,
      enableFullscreen: isMobile,
      enableOrientationLock: isMobile,
      performanceMode: isMobile ? 'auto' : 'high',
      targetFPS: isMobile ? 30 : 60,
      enableBatteryOptimization: isMobile,
      enableMemoryOptimization: isMobile,
      uiScale: isMobile ? 0.8 : 1.0,
      buttonSize: isMobile ? 60 : 40,
      joystickSize: isMobile ? 120 : 80,
      safeAreaMargin: isMobile ? 20 : 10,
      touchControlType: isMobile ? 'joystick' : 'buttons',
      touchSensitivity: 1.0,
      touchDeadZone: 10,
      multiTouchEnabled: this.deviceInfo.capabilities.multiTouch,
      enableAudio: true,
      audioQuality: isMobile ? 'medium' : 'high',
      enableHapticFeedback: isMobile && this.deviceInfo.capabilities.vibration
    };
  }

  /**
   * 设置事件监听器
   */
  private setupEventListeners(): void {
    // 屏幕方向变化
    window.addEventListener('orientationchange', () => {
      this.onOrientationChange();
    });

    // 窗口大小变化
    window.addEventListener('resize', () => {
      this.onResize();
    });

    // 全屏变化
    document.addEventListener('fullscreenchange', () => {
      this.onFullscreenChange();
    });

    // 电池状态变化
    if ('getBattery' in navigator) {
      (navigator as any).getBattery().then((battery: any) => {
        this.batteryLevel = battery.level * 100;
        battery.addEventListener('levelchange', () => {
          this.batteryLevel = battery.level * 100;
          this.onBatteryChange();
        });
      });
    }

    // 设备运动
    if (this.deviceInfo.capabilities.accelerometer) {
      window.addEventListener('devicemotion', (event) => {
        this.onDeviceMotion(event);
      });
    }

    // 设备方向
    if (this.deviceInfo.capabilities.gyroscope) {
      window.addEventListener('deviceorientation', (event) => {
        this.onDeviceOrientation(event);
      });
    }
  }

  /**
   * 应用移动端配置
   */
  private applyMobileConfig(): void {
    if (!this.scene) return;

    // 设置游戏配置
    this.scene.game.config = {
      ...this.scene.game.config,
      type: Phaser.AUTO,
      scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH,
        width: this.deviceInfo.screenWidth,
        height: this.deviceInfo.screenHeight,
        min: {
          width: 320,
          height: 240
        },
        max: {
          width: this.deviceInfo.screenWidth,
          height: this.deviceInfo.screenHeight
        }
      },
      input: {
        touch: this.config.enableTouchControls,
        keyboard: true,
        mouse: !this.config.enableTouchControls
      },
      physics: {
        default: 'arcade',
        arcade: {
          gravity: { y: 0 },
          debug: false
        }
      },
      render: {
        pixelArt: true,
        antialias: !this.config.enableMemoryOptimization,
        roundPixels: true,
        powerPreference: this.config.enableBatteryOptimization ? 'low-power' : 'default'
      }
    };

    // 设置触摸控制
    if (this.config.enableTouchControls) {
      this.setupTouchControls();
    }

    // 设置性能优化
    this.applyPerformanceOptimization();
  }

  /**
   * 设置触摸控制
   */
  private setupTouchControls(): void {
    if (!this.scene) return;

    // 设置触摸事件
    this.scene.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      this.onTouchStart(pointer);
    });

    this.scene.input.on('pointerup', (pointer: Phaser.Input.Pointer) => {
      this.onTouchEnd(pointer);
    });

    this.scene.input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
      this.onTouchMove(pointer);
    });

    // 设置手势识别
    if (this.config.enableGestures) {
      this.setupGestureRecognition();
    }
  }

  /**
   * 设置手势识别
   */
  private setupGestureRecognition(): void {
    // 这里可以集成手势识别库
    // 例如：hammer.js 或其他手势库
    console.log('手势识别已启用');
  }

  /**
   * 应用性能优化
   */
  private applyPerformanceOptimization(): void {
    if (!this.scene) return;

    const performanceConfig = this.getPerformanceConfig();

    // 设置目标FPS
    this.scene.game.loop.targetFps = performanceConfig.targetFPS;

    // 设置渲染质量
    if (performanceConfig.textureQuality === 'low') {
      this.scene.game.renderer.setTextureQuality('low');
    }

    // 设置音频质量
    if (performanceConfig.audioQuality === 'low') {
      // 降低音频质量
      this.scene.sound.setVolume(0.5);
    }

    // 禁用阴影
    if (!performanceConfig.enableShadows) {
      // 禁用阴影渲染
    }

    // 禁用后处理
    if (!performanceConfig.enablePostProcessing) {
      // 禁用后处理效果
    }
  }

  /**
   * 获取性能配置
   */
  private getPerformanceConfig(): PerformanceConfig {
    const mode = this.config.performanceMode;
    
    switch (mode) {
      case 'low':
        return {
          mode: 'low',
          targetFPS: 30,
          maxParticles: 50,
          maxEffects: 5,
          textureQuality: 'low',
          audioQuality: 'low',
          enableShadows: false,
          enablePostProcessing: false
        };
      case 'medium':
        return {
          mode: 'medium',
          targetFPS: 45,
          maxParticles: 100,
          maxEffects: 10,
          textureQuality: 'medium',
          audioQuality: 'medium',
          enableShadows: false,
          enablePostProcessing: false
        };
      case 'high':
        return {
          mode: 'high',
          targetFPS: 60,
          maxParticles: 200,
          maxEffects: 20,
          textureQuality: 'high',
          audioQuality: 'high',
          enableShadows: true,
          enablePostProcessing: true
        };
      case 'auto':
      default:
        // 根据设备性能自动调整
        const isLowEnd = this.deviceInfo.type === 'mobile' && this.deviceInfo.screenWidth < 400;
        return isLowEnd ? this.getPerformanceConfig() : this.getPerformanceConfig();
    }
  }

  /**
   * 开始性能监控
   */
  private startPerformanceMonitoring(): void {
    if (!this.scene) return;

    this.scene.time.addEvent({
      delay: 1000,
      callback: this.updatePerformanceStats,
      callbackScope: this,
      loop: true
    });
  }

  /**
   * 更新性能统计
   */
  private updatePerformanceStats(): void {
    if (!this.scene) return;

    // 更新FPS
    const fps = this.scene.game.loop.actualFps;
    this.fpsHistory.push(fps);
    if (this.fpsHistory.length > 10) {
      this.fpsHistory.shift();
    }

    // 更新内存使用
    if ('memory' in performance) {
      const memory = (performance as any).memory;
      this.memoryHistory.push(memory.usedJSHeapSize / 1024 / 1024); // MB
      if (this.memoryHistory.length > 10) {
        this.memoryHistory.shift();
      }
    }

    // 检查性能警告
    const avgFPS = this.fpsHistory.reduce((a, b) => a + b, 0) / this.fpsHistory.length;
    if (avgFPS < this.config.targetFPS * 0.8) {
      this.onPerformanceWarning('low_fps', { current: avgFPS, target: this.config.targetFPS });
    }
  }

  /**
   * 事件处理
   */
  private onOrientationChange(): void {
    this.currentOrientation = window.innerWidth > window.innerHeight ? 'landscape' : 'portrait';
    this.sessionStats.orientationChanges++;
    
    this.addEvent('orientation_change', { orientation: this.currentOrientation });
    
    // 重新应用配置
    this.applyMobileConfig();
    
    console.log(`屏幕方向变化: ${this.currentOrientation}`);
  }

  private onResize(): void {
    this.addEvent('resize', { width: window.innerWidth, height: window.innerHeight });
    
    // 重新计算UI布局
    this.updateUILayout();
  }

  private onFullscreenChange(): void {
    this.isFullscreen = !!(document.fullscreenElement || (document as any).webkitFullscreenElement);
    
    this.addEvent('fullscreen_change', { isFullscreen: this.isFullscreen });
    
    // 重新应用配置
    this.applyMobileConfig();
  }

  private onBatteryChange(): void {
    this.addEvent('battery_change', { level: this.batteryLevel });
    
    if (this.batteryLevel < 20) {
      this.addEvent('battery_low', { level: this.batteryLevel });
      this.enableBatterySavingMode();
    }
  }

  private onDeviceMotion(event: DeviceMotionEvent): void {
    // 处理设备运动事件
    if (event.acceleration) {
      const { x, y, z } = event.acceleration;
      // 可以用于倾斜控制或其他运动相关功能
    }
  }

  private onDeviceOrientation(event: DeviceOrientationEvent): void {
    // 处理设备方向事件
    const { alpha, beta, gamma } = event;
    // 可以用于陀螺仪控制或其他方向相关功能
  }

  private onTouchStart(pointer: Phaser.Input.Pointer): void {
    this.touchStats.totalTouches++;
    this.touchStats.touchStartTime = Date.now();
    
    this.addEvent('touch_start', { pointer: pointer.id, x: pointer.x, y: pointer.y });
  }

  private onTouchEnd(pointer: Phaser.Input.Pointer): void {
    const duration = Date.now() - this.touchStats.touchStartTime;
    this.touchStats.touchDurations.push(duration);
    
    if (this.touchStats.touchDurations.length > 100) {
      this.touchStats.touchDurations.shift();
    }
    
    this.addEvent('touch_end', { pointer: pointer.id, duration });
  }

  private onTouchMove(pointer: Phaser.Input.Pointer): void {
    // 处理触摸移动事件
  }

  private onPerformanceWarning(type: string, data: any): void {
    this.sessionStats.performanceWarnings++;
    
    this.addEvent('performance_warning', { type, data });
    
    // 自动调整性能设置
    this.autoAdjustPerformance();
  }

  /**
   * 启用电池节能模式
   */
  private enableBatterySavingMode(): void {
    console.log('启用电池节能模式');
    
    // 降低FPS
    if (this.scene) {
      this.scene.game.loop.targetFps = 20;
    }
    
    // 降低音频质量
    if (this.scene) {
      this.scene.sound.setVolume(0.3);
    }
    
    // 禁用不必要的效果
    this.config.enableVibration = false;
    this.config.enableHapticFeedback = false;
  }

  /**
   * 自动调整性能
   */
  private autoAdjustPerformance(): void {
    if (this.config.performanceMode !== 'auto') return;

    const avgFPS = this.fpsHistory.reduce((a, b) => a + b, 0) / this.fpsHistory.length;
    
    if (avgFPS < 25) {
      // 降低性能设置
      this.config.performanceMode = 'low';
      this.applyPerformanceOptimization();
    } else if (avgFPS > 50) {
      // 提高性能设置
      this.config.performanceMode = 'high';
      this.applyPerformanceOptimization();
    }
  }

  /**
   * 更新UI布局
   */
  private updateUILayout(): void {
    // 重新计算UI元素位置和大小
    const safeArea = this.getSafeArea();
    
    // 更新按钮位置
    this.updateButtonLayout(safeArea);
    
    // 更新摇杆位置
    this.updateJoystickLayout(safeArea);
  }

  /**
   * 获取安全区域
   */
  private getSafeArea(): { top: number; right: number; bottom: number; left: number } {
    const margin = this.config.safeAreaMargin;
    
    return {
      top: margin,
      right: margin,
      bottom: margin,
      left: margin
    };
  }

  /**
   * 更新按钮布局
   */
  private updateButtonLayout(safeArea: any): void {
    // 根据安全区域更新按钮位置
    console.log('更新按钮布局');
  }

  /**
   * 更新摇杆布局
   */
  private updateJoystickLayout(safeArea: any): void {
    // 根据安全区域更新摇杆位置
    console.log('更新摇杆布局');
  }

  /**
   * 请求全屏
   */
  public requestFullscreen(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.config.enableFullscreen) {
        reject(new Error('全屏功能已禁用'));
        return;
      }

      const element = document.documentElement;
      
      if (element.requestFullscreen) {
        element.requestFullscreen().then(resolve).catch(reject);
      } else if ((element as any).webkitRequestFullscreen) {
        (element as any).webkitRequestFullscreen().then(resolve).catch(reject);
      } else if ((element as any).mozRequestFullScreen) {
        (element as any).mozRequestFullScreen().then(resolve).catch(reject);
      } else {
        reject(new Error('浏览器不支持全屏'));
      }
    });
  }

  /**
   * 退出全屏
   */
  public exitFullscreen(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (document.exitFullscreen) {
        document.exitFullscreen().then(resolve).catch(reject);
      } else if ((document as any).webkitExitFullscreen) {
        (document as any).webkitExitFullscreen().then(resolve).catch(reject);
      } else if ((document as any).mozCancelFullScreen) {
        (document as any).mozCancelFullScreen().then(resolve).catch(reject);
      } else {
        reject(new Error('浏览器不支持退出全屏'));
      }
    });
  }

  /**
   * 锁定屏幕方向
   */
  public lockOrientation(orientation: ScreenOrientation): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.config.enableOrientationLock) {
        reject(new Error('屏幕方向锁定已禁用'));
        return;
      }

      if ('orientation' in screen) {
        (screen as any).orientation.lock(orientation).then(resolve).catch(reject);
      } else {
        reject(new Error('浏览器不支持屏幕方向锁定'));
      }
    });
  }

  /**
   * 解锁屏幕方向
   */
  public unlockOrientation(): Promise<void> {
    return new Promise((resolve, reject) => {
      if ('orientation' in screen) {
        (screen as any).orientation.unlock();
        resolve();
      } else {
        reject(new Error('浏览器不支持屏幕方向解锁'));
      }
    });
  }

  /**
   * 振动反馈
   */
  public vibrate(pattern: number | number[]): void {
    if (!this.config.enableVibration || !this.deviceInfo.capabilities.vibration) {
      return;
    }

    if ('vibrate' in navigator) {
      navigator.vibrate(pattern);
    }
  }

  /**
   * 触觉反馈
   */
  public hapticFeedback(type: 'light' | 'medium' | 'heavy'): void {
    if (!this.config.enableHapticFeedback) {
      return;
    }

    // 使用Web Haptics API
    if ('vibrate' in navigator) {
      const patterns = {
        light: [10],
        medium: [20],
        heavy: [30]
      };
      
      navigator.vibrate(patterns[type]);
    }
  }

  /**
   * 获取设备信息
   */
  public getDeviceInfo(): DeviceInfo {
    return { ...this.deviceInfo };
  }

  /**
   * 获取配置
   */
  public getConfig(): MobileConfig {
    return { ...this.config };
  }

  /**
   * 更新配置
   */
  public updateConfig(newConfig: Partial<MobileConfig>): void {
    this.config = { ...this.config, ...newConfig };
    this.applyMobileConfig();
    
    // 保存配置
    this.saveConfig();
  }

  /**
   * 保存配置
   */
  private saveConfig(): void {
    if (this.deviceInfo.capabilities.localStorage) {
      localStorage.setItem('mobileConfig', JSON.stringify(this.config));
    }
  }

  /**
   * 加载配置
   */
  private loadConfig(): void {
    if (this.deviceInfo.capabilities.localStorage) {
      const saved = localStorage.getItem('mobileConfig');
      if (saved) {
        try {
          const savedConfig = JSON.parse(saved);
          this.config = { ...this.config, ...savedConfig };
        } catch (e) {
          console.warn('加载移动端配置失败:', e);
        }
      }
    }
  }

  /**
   * 获取移动端统计
   */
  public getMobileStats(): MobileStats {
    const avgTouchDuration = this.touchStats.touchDurations.length > 0
      ? this.touchStats.touchDurations.reduce((a, b) => a + b, 0) / this.touchStats.touchDurations.length
      : 0;

    const avgFPS = this.fpsHistory.length > 0
      ? this.fpsHistory.reduce((a, b) => a + b, 0) / this.fpsHistory.length
      : 60;

    const avgMemory = this.memoryHistory.length > 0
      ? this.memoryHistory.reduce((a, b) => a + b, 0) / this.memoryHistory.length
      : 0;

    return {
      deviceInfo: this.deviceInfo,
      performance: {
        fps: avgFPS,
        memoryUsage: avgMemory,
        batteryLevel: this.batteryLevel,
        temperature: this.temperature
      },
      touchStats: {
        totalTouches: this.touchStats.totalTouches,
        averageTouchDuration: avgTouchDuration,
        gestureCount: this.touchStats.gestureCount
      },
      sessionStats: {
        sessionDuration: Date.now() - this.sessionStats.startTime,
        orientationChanges: this.sessionStats.orientationChanges,
        performanceWarnings: this.sessionStats.performanceWarnings
      }
    };
  }

  /**
   * 添加事件
   */
  private addEvent(type: MobileEvent['type'], data?: any): void {
    const event: MobileEvent = {
      type,
      data,
      timestamp: Date.now()
    };
    
    this.events.push(event);
    
    // 保持事件历史在合理范围内
    if (this.events.length > 100) {
      this.events.shift();
    }
  }

  /**
   * 注册回调
   */
  public registerCallback(eventType: string, callback: (data: any) => void): void {
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
   * 获取移动端事件
   */
  public getMobileEvents(): MobileEvent[] {
    return [...this.events];
  }

  /**
   * 清理资源
   */
  public destroy(): void {
    this.events = [];
    this.callbacks.clear();
    this.fpsHistory = [];
    this.memoryHistory = [];
    
    this.scene = null;
    this.isInitialized = false;
    console.log('移动端适配系统已销毁');
  }
}
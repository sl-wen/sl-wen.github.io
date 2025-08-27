import * as Phaser from 'phaser';
import { GameManager } from './GameManager';

/**
 * 性能等级枚举
 */
export enum PerformanceLevel {
  HIGH = 'high',
  MEDIUM = 'medium',
  LOW = 'low',
  ULTRA_LOW = 'ultra_low'
}

/**
 * 性能监控数据接口
 */
export interface PerformanceMetrics {
  fps: number;
  frameTime: number;
  memoryUsage: number;
  renderCalls: number;
  particleCount: number;
  gameObjectCount: number;
  textureMemory: number;
}

/**
 * 性能优化器类 - 自适应性能管理系统
 * 
 * 参考 top-down-react-phaser-game 的性能优化策略，实现智能的性能监控和
 * 自适应优化。系统会实时监测游戏性能指标，并根据设备性能动态调整
 * 游戏设置，确保在各种设备上都能获得流畅的游戏体验。
 * 
 * 核心功能：
 * - 📊 实时监控：FPS、帧时间、内存使用、渲染调用等关键指标
 * - 🔄 自适应调整：根据性能表现自动升级或降级画质设置
 * - 📱 设备识别：自动检测设备类型和性能水平
 * - 🎯 分级优化：高、中、低、超低四档性能等级
 * - 🎮 LOD系统：基于距离的细节层次优化
 * - 💾 内存管理：智能的资源清理和垃圾回收
 * 
 * 优化策略：
 * - 粒子系统：动态调整粒子数量和生命周期
 * - 动画系统：基于性能调整动画帧率和复杂度
 * - 渲染优化：批处理、视距裁剪、纹理质量调整
 * - 移动端优化：专门的移动设备优化策略
 * - 内存优化：定期清理未使用的资源和缓存
 * 
 * 性能等级：
 * - HIGH: 高端设备，全效果渲染
 * - MEDIUM: 中端设备，平衡画质与性能
 * - LOW: 低端设备，优先保证流畅度
 * - ULTRA_LOW: 超低端设备，最小化资源使用
 */
export class PerformanceOptimizer {
  private scene: Phaser.Scene;
  private gameManager: GameManager;
  
  // 性能监控
  private currentLevel: PerformanceLevel = PerformanceLevel.HIGH;
  private performanceMetrics: PerformanceMetrics = {
    fps: 60,
    frameTime: 16.67,
    memoryUsage: 0,
    renderCalls: 0,
    particleCount: 0,
    gameObjectCount: 0,
    textureMemory: 0
  };
  
  private fpsHistory: number[] = [];
  private frameTimeHistory: number[] = [];
  private lastPerformanceCheck: number = 0;
  private performanceCheckInterval: number = 5000; // 5秒检查一次
  
  // 优化设置
  private optimizationSettings = {
    [PerformanceLevel.HIGH]: {
      maxParticles: 200,
      particleLifespan: 5000,
      animationFrameRate: 60,
      shadowQuality: 'high',
      antiAliasing: true,
      vsync: true,
      maxLights: 10,
      textureFiltering: 'linear',
      renderScale: 1.0,
      cullingDistance: 1000,
      lodDistance: 500
    },
    [PerformanceLevel.MEDIUM]: {
      maxParticles: 100,
      particleLifespan: 3000,
      animationFrameRate: 30,
      shadowQuality: 'medium',
      antiAliasing: true,
      vsync: true,
      maxLights: 6,
      textureFiltering: 'linear',
      renderScale: 0.9,
      cullingDistance: 800,
      lodDistance: 400
    },
    [PerformanceLevel.LOW]: {
      maxParticles: 50,
      particleLifespan: 2000,
      animationFrameRate: 20,
      shadowQuality: 'low',
      antiAliasing: false,
      vsync: false,
      maxLights: 3,
      textureFiltering: 'nearest',
      renderScale: 0.8,
      cullingDistance: 600,
      lodDistance: 300
    },
    [PerformanceLevel.ULTRA_LOW]: {
      maxParticles: 20,
      particleLifespan: 1000,
      animationFrameRate: 15,
      shadowQuality: 'none',
      antiAliasing: false,
      vsync: false,
      maxLights: 1,
      textureFiltering: 'nearest',
      renderScale: 0.7,
      cullingDistance: 400,
      lodDistance: 200
    }
  };

  // 移动端特殊优化
  private mobileOptimizations = {
    reducedParticles: 0.5, // 移动端粒子数量减半
    lowerFrameRate: 30,    // 移动端目标帧率
    disableComplexShaders: true,
    enableBatching: true,
    reduceTextureQuality: true,
    disablePostProcessing: true
  };

  // 性能阈值
  private performanceThresholds = {
    fpsLow: 45,      // FPS低于45时降级
    fpsHigh: 55,     // FPS高于55时升级
    frameTimeHigh: 20, // 帧时间超过20ms时降级
    memoryHigh: 100 * 1024 * 1024, // 内存超过100MB时优化
  };

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.gameManager = GameManager.getInstance();
    
    this.initialize();
  }

  /**
   * 初始化性能优化器
   */
  private initialize(): void {
    this.detectDeviceCapabilities();
    this.setupPerformanceMonitoring();
    this.applyInitialOptimizations();
    
    console.log(`PerformanceOptimizer initialized at ${this.currentLevel} level`);
  }

  /**
   * 检测设备性能
   */
  private detectDeviceCapabilities(): void {
    const isMobile = this.isMobileDevice();
    const deviceMemory = (navigator as any).deviceMemory || 4; // GB
    const hardwareConcurrency = navigator.hardwareConcurrency || 4;
    
    // 基于设备信息设置初始性能等级
    if (isMobile) {
      if (deviceMemory <= 2) {
        this.currentLevel = PerformanceLevel.ULTRA_LOW;
      } else if (deviceMemory <= 4) {
        this.currentLevel = PerformanceLevel.LOW;
      } else {
        this.currentLevel = PerformanceLevel.MEDIUM;
      }
    } else {
      if (deviceMemory <= 4 && hardwareConcurrency <= 2) {
        this.currentLevel = PerformanceLevel.LOW;
      } else if (deviceMemory <= 8 && hardwareConcurrency <= 4) {
        this.currentLevel = PerformanceLevel.MEDIUM;
      } else {
        this.currentLevel = PerformanceLevel.HIGH;
      }
    }

    console.log('Device capabilities detected:', {
      isMobile,
      deviceMemory,
      hardwareConcurrency,
      initialLevel: this.currentLevel
    });
  }

  /**
   * 检测是否为移动设备
   */
  private isMobileDevice(): boolean {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  }

  /**
   * 设置性能监控
   */
  private setupPerformanceMonitoring(): void {
    // 监控FPS
    this.scene.time.addEvent({
      delay: 100, // 每100ms检查一次
      callback: this.updatePerformanceMetrics,
      callbackScope: this,
      loop: true
    });

    // 定期性能评估
    this.scene.time.addEvent({
      delay: this.performanceCheckInterval,
      callback: this.evaluatePerformance,
      callbackScope: this,
      loop: true
    });
  }

  /**
   * 更新性能指标
   */
  private updatePerformanceMetrics(): void {
    const game = this.scene.game;
    
    // 更新FPS
    this.performanceMetrics.fps = game.loop.actualFps;
    this.performanceMetrics.frameTime = game.loop.delta;
    
    // 更新历史记录
    this.fpsHistory.push(this.performanceMetrics.fps);
    this.frameTimeHistory.push(this.performanceMetrics.frameTime);
    
    // 保持历史记录长度
    if (this.fpsHistory.length > 300) { // 30秒历史
      this.fpsHistory.shift();
      this.frameTimeHistory.shift();
    }

    // 更新游戏对象数量
    this.performanceMetrics.gameObjectCount = this.scene.children.length;
    
    // 更新内存使用情况（如果可用）
    if ((performance as any).memory) {
      this.performanceMetrics.memoryUsage = (performance as any).memory.usedJSHeapSize;
    }

    // 发送性能数据事件
    this.gameManager.emit('performance-updated', this.performanceMetrics);
  }

  /**
   * 评估性能并调整设置
   */
  private evaluatePerformance(): void {
    const avgFps = this.calculateAverageFPS();
    const avgFrameTime = this.calculateAverageFrameTime();
    
    // 性能评估逻辑
    if (avgFps < this.performanceThresholds.fpsLow || avgFrameTime > this.performanceThresholds.frameTimeHigh) {
      this.downgradePerformance();
    } else if (avgFps > this.performanceThresholds.fpsHigh && avgFrameTime < this.performanceThresholds.frameTimeHigh * 0.8) {
      this.upgradePerformance();
    }

    // 内存压力检查
    if (this.performanceMetrics.memoryUsage > this.performanceThresholds.memoryHigh) {
      this.optimizeMemoryUsage();
    }

    console.log(`Performance evaluation: FPS=${avgFps.toFixed(1)}, FrameTime=${avgFrameTime.toFixed(1)}ms, Level=${this.currentLevel}`);
  }

  /**
   * 计算平均FPS
   */
  private calculateAverageFPS(): number {
    if (this.fpsHistory.length === 0) return 60;
    return this.fpsHistory.reduce((sum, fps) => sum + fps, 0) / this.fpsHistory.length;
  }

  /**
   * 计算平均帧时间
   */
  private calculateAverageFrameTime(): number {
    if (this.frameTimeHistory.length === 0) return 16.67;
    return this.frameTimeHistory.reduce((sum, time) => sum + time, 0) / this.frameTimeHistory.length;
  }

  /**
   * 降级性能设置
   */
  private downgradePerformance(): void {
    const levels = [PerformanceLevel.HIGH, PerformanceLevel.MEDIUM, PerformanceLevel.LOW, PerformanceLevel.ULTRA_LOW];
    const currentIndex = levels.indexOf(this.currentLevel);
    
    if (currentIndex < levels.length - 1) {
      this.currentLevel = levels[currentIndex + 1];
      this.applyPerformanceSettings();
      
      this.gameManager.emit('performance-downgraded', this.currentLevel);
      console.log(`Performance downgraded to ${this.currentLevel}`);
    }
  }

  /**
   * 升级性能设置
   */
  private upgradePerformance(): void {
    const levels = [PerformanceLevel.HIGH, PerformanceLevel.MEDIUM, PerformanceLevel.LOW, PerformanceLevel.ULTRA_LOW];
    const currentIndex = levels.indexOf(this.currentLevel);
    
    if (currentIndex > 0) {
      this.currentLevel = levels[currentIndex - 1];
      this.applyPerformanceSettings();
      
      this.gameManager.emit('performance-upgraded', this.currentLevel);
      console.log(`Performance upgraded to ${this.currentLevel}`);
    }
  }

  /**
   * 应用初始优化
   */
  private applyInitialOptimizations(): void {
    this.applyPerformanceSettings();
    
    if (this.isMobileDevice()) {
      this.applyMobileOptimizations();
    }
  }

  /**
   * 应用性能设置
   */
  private applyPerformanceSettings(): void {
    const settings = this.optimizationSettings[this.currentLevel];
    
    // 应用粒子系统优化
    this.optimizeParticles(settings.maxParticles, settings.particleLifespan);
    
    // 应用动画优化
    this.optimizeAnimations(settings.animationFrameRate);
    
    // 应用渲染优化
    this.optimizeRendering(settings);
    
    // 应用视距优化
    this.optimizeCulling(settings.cullingDistance, settings.lodDistance);
  }

  /**
   * 优化粒子系统
   */
  private optimizeParticles(maxParticles: number, lifespan: number): void {
    // 限制粒子发射器数量和生命周期
    this.scene.children.list.forEach(child => {
      if (child instanceof Phaser.GameObjects.Particles.ParticleEmitter) {
        child.setConfig({
          maxParticles: maxParticles,
          lifespan: lifespan
        });
      }
    });
  }

  /**
   * 优化动画
   */
  private optimizeAnimations(frameRate: number): void {
    // 调整动画帧率
    Object.keys(this.scene.anims.anims.entries).forEach(key => {
      const anim = this.scene.anims.get(key);
      if (anim) {
        anim.frameRate = Math.min(anim.frameRate, frameRate);
      }
    });
  }

  /**
   * 优化渲染
   */
  private optimizeRendering(settings: any): void {
    const game = this.scene.game;
    const renderer = game.renderer;
    
    // 设置渲染比例
    if (settings.renderScale < 1.0) {
      game.scale.setZoom(settings.renderScale);
    }
    
    // WebGL特定优化
    if (renderer instanceof Phaser.Renderer.WebGL.WebGLRenderer) {
      // 批处理优化
      renderer.config.batchSize = this.currentLevel === PerformanceLevel.HIGH ? 4096 : 2048;
      
      // 纹理过滤
      if (settings.textureFiltering === 'nearest') {
        // 设置最近邻过滤以提高性能
        renderer.gl.texParameteri(renderer.gl.TEXTURE_2D, renderer.gl.TEXTURE_MIN_FILTER, renderer.gl.NEAREST);
        renderer.gl.texParameteri(renderer.gl.TEXTURE_2D, renderer.gl.TEXTURE_MAG_FILTER, renderer.gl.NEAREST);
      }
    }
  }

  /**
   * 优化视距裁剪
   */
  private optimizeCulling(cullingDistance: number, lodDistance: number): void {
    // 设置相机视距裁剪
    this.scene.cameras.main.setBounds(
      -cullingDistance, -cullingDistance,
      this.scene.cameras.main.width + cullingDistance * 2,
      this.scene.cameras.main.height + cullingDistance * 2
    );
    
    // 实现LOD系统
    this.implementLODSystem(lodDistance);
  }

  /**
   * 实现LOD系统
   */
  private implementLODSystem(lodDistance: number): void {
    const camera = this.scene.cameras.main;
    const cameraCenter = { x: camera.midPoint.x, y: camera.midPoint.y };
    
    this.scene.children.list.forEach(child => {
      if (child instanceof Phaser.GameObjects.Sprite) {
        const distance = Phaser.Math.Distance.Between(
          cameraCenter.x, cameraCenter.y,
          child.x, child.y
        );
        
        // 根据距离调整细节级别
        if (distance > lodDistance) {
          // 远距离：降低细节
          child.setScale(Math.max(0.5, child.scaleX * 0.8));
          if (child.anims && child.anims.isPlaying) {
            child.anims.setTimeScale(0.5); // 减慢动画
          }
        } else {
          // 近距离：正常细节
          child.setScale(1.0);
          if (child.anims && child.anims.isPlaying) {
            child.anims.setTimeScale(1.0);
          }
        }
      }
    });
  }

  /**
   * 应用移动端优化
   */
  private applyMobileOptimizations(): void {
    // 降低目标帧率
    this.scene.game.loop.targetFps = this.mobileOptimizations.lowerFrameRate;
    
    // 禁用复杂效果
    if (this.mobileOptimizations.disablePostProcessing) {
      // 禁用后处理效果
      this.scene.cameras.main.clearFX();
    }
    
    // 启用批处理
    if (this.mobileOptimizations.enableBatching) {
      const renderer = this.scene.game.renderer;
      if (renderer instanceof Phaser.Renderer.WebGL.WebGLRenderer) {
        renderer.config.batchSize = 2048; // 增加批处理大小
      }
    }
    
    console.log('Mobile optimizations applied');
  }

  /**
   * 优化内存使用
   */
  private optimizeMemoryUsage(): void {
    // 清理未使用的纹理
    this.scene.textures.list.forEach((texture, key) => {
      if (key.startsWith('temp_') || key.startsWith('cache_')) {
        this.scene.textures.remove(key);
      }
    });
    
    // 清理音频缓存
    Object.keys(this.scene.cache.audio.entries).forEach(key => {
      const audio = this.scene.cache.audio.get(key);
      if (audio && !audio.isPlaying) {
        this.scene.cache.audio.remove(key);
      }
    });
    
    // 强制垃圾回收（如果支持）
    if ((window as any).gc) {
      (window as any).gc();
    }
    
    console.log('Memory optimization performed');
  }

  /**
   * 手动设置性能等级
   */
  public setPerformanceLevel(level: PerformanceLevel): void {
    this.currentLevel = level;
    this.applyPerformanceSettings();
    
    this.gameManager.emit('performance-level-changed', level);
    console.log(`Performance level manually set to ${level}`);
  }

  /**
   * 获取当前性能等级
   */
  public getCurrentPerformanceLevel(): PerformanceLevel {
    return this.currentLevel;
  }

  /**
   * 获取性能指标
   */
  public getPerformanceMetrics(): PerformanceMetrics {
    return { ...this.performanceMetrics };
  }

  /**
   * 获取性能历史
   */
  public getPerformanceHistory(): { fps: number[]; frameTime: number[] } {
    return {
      fps: [...this.fpsHistory],
      frameTime: [...this.frameTimeHistory]
    };
  }

  /**
   * 启用/禁用自动优化
   */
  public setAutoOptimizationEnabled(enabled: boolean): void {
    if (enabled) {
      this.setupPerformanceMonitoring();
    } else {
      this.scene.time.removeAllEvents();
    }
  }

  /**
   * 获取优化建议
   */
  public getOptimizationSuggestions(): string[] {
    const suggestions: string[] = [];
    const avgFps = this.calculateAverageFPS();
    
    if (avgFps < 30) {
      suggestions.push('考虑降低游戏画质设置');
      suggestions.push('关闭不必要的视觉效果');
      suggestions.push('减少屏幕上的游戏对象数量');
    }
    
    if (this.performanceMetrics.memoryUsage > 50 * 1024 * 1024) {
      suggestions.push('清理浏览器缓存');
      suggestions.push('关闭其他标签页');
    }
    
    if (this.isMobileDevice()) {
      suggestions.push('确保设备有足够的电量');
      suggestions.push('关闭后台应用以释放内存');
    }
    
    return suggestions;
  }

  /**
   * 销毁优化器
   */
  public destroy(): void {
    this.scene.time.removeAllEvents();
    this.fpsHistory = [];
    this.frameTimeHistory = [];
  }
}
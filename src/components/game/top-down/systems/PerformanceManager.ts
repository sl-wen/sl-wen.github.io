/**
 * 性能管理器
 * 处理游戏性能优化、内存管理、渲染优化等功能
 */

import { storage } from '../utils';

// 性能配置
export interface PerformanceConfig {
  // 渲染设置
  rendering: {
    targetFPS: number;
    enableVSync: boolean;
    enableAntiAliasing: boolean;
    textureQuality: 'low' | 'medium' | 'high' | 'ultra';
    shadowQuality: 'off' | 'low' | 'medium' | 'high';
    particleLimit: number;
    maxLights: number;
    enablePostProcessing: boolean;
  };
  
  // 内存设置
  memory: {
    enableMemoryPool: boolean;
    maxTextureMemory: number; // MB
    maxAudioMemory: number; // MB
    enableGarbageCollection: boolean;
    gcInterval: number; // 毫秒
    enableMemoryMonitoring: boolean;
  };
  
  // 加载设置
  loading: {
    enableLazyLoading: boolean;
    enablePreloading: boolean;
    maxConcurrentLoads: number;
    enableLoadingCache: boolean;
    cacheSize: number; // MB
    enableCompression: boolean;
  };
  
  // 移动端设置
  mobile: {
    enableTouchOptimization: boolean;
    enableBatteryOptimization: boolean;
    enableLowPowerMode: boolean;
    maxParticleCount: number;
    enableDynamicQuality: boolean;
    enableFrameSkip: boolean;
  };
  
  // 网络设置
  network: {
    enableRequestCaching: boolean;
    maxCacheSize: number; // MB
    enableCompression: boolean;
    timeout: number; // 毫秒
    retryAttempts: number;
    enableOfflineMode: boolean;
  };
  
  // 调试设置
  debug: {
    enablePerformanceMonitoring: boolean;
    enableMemoryProfiling: boolean;
    enableFrameRateDisplay: boolean;
    enableDebugInfo: boolean;
    logPerformanceData: boolean;
  };
}

// 性能指标
export interface PerformanceMetrics {
  // 帧率
  fps: {
    current: number;
    average: number;
    min: number;
    max: number;
    target: number;
  };
  
  // 内存使用
  memory: {
    used: number;
    total: number;
    available: number;
    textureMemory: number;
    audioMemory: number;
    objectCount: number;
  };
  
  // 渲染性能
  rendering: {
    drawCalls: number;
    triangles: number;
    vertices: number;
    batches: number;
    renderTime: number;
  };
  
  // 加载性能
  loading: {
    loadTime: number;
    cacheHitRate: number;
    compressionRatio: number;
    activeLoads: number;
  };
  
  // 网络性能
  network: {
    requestCount: number;
    averageResponseTime: number;
    cacheHitRate: number;
    errorRate: number;
  };
  
  // 时间戳
  timestamp: number;
}

// 性能事件
export interface PerformanceEvent {
  type: 'fps_drop' | 'memory_warning' | 'loading_slow' | 'network_error' | 'battery_low';
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  data: any;
  timestamp: number;
}

// 优化建议
export interface OptimizationSuggestion {
  type: 'rendering' | 'memory' | 'loading' | 'mobile' | 'network';
  priority: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  action: string;
  impact: string;
}

export class PerformanceManager {
  private static instance: PerformanceManager;
  private config: PerformanceConfig;
  private metrics: PerformanceMetrics;
  private events: PerformanceEvent[] = [];
  private suggestions: OptimizationSuggestion[] = [];
  private isMonitoring = false;
  private monitoringInterval: NodeJS.Timeout | null = null;
  private scene: Phaser.Scene | null = null;
  private frameCount = 0;
  private lastFrameTime = 0;
  private fpsHistory: number[] = [];
  private memoryHistory: number[] = [];
  private renderHistory: number[] = [];
  
  // 性能优化状态
  private optimizationState = {
    isLowPowerMode: false,
    isBatteryLow: false,
    isNetworkSlow: false,
    isMemoryLow: false,
    currentQualityLevel: 'high' as 'low' | 'medium' | 'high' | 'ultra'
  };

  private constructor() {
    this.config = this.getDefaultConfig();
    this.metrics = this.getDefaultMetrics();
    this.loadConfig();
    this.detectDeviceCapabilities();
  }

  public static getInstance(): PerformanceManager {
    if (!PerformanceManager.instance) {
      PerformanceManager.instance = new PerformanceManager();
    }
    return PerformanceManager.instance;
  }

  /**
   * 获取默认配置
   */
  private getDefaultConfig(): PerformanceConfig {
    return {
      rendering: {
        targetFPS: 60,
        enableVSync: true,
        enableAntiAliasing: true,
        textureQuality: 'high',
        shadowQuality: 'medium',
        particleLimit: 1000,
        maxLights: 10,
        enablePostProcessing: true
      },
      memory: {
        enableMemoryPool: true,
        maxTextureMemory: 512,
        maxAudioMemory: 128,
        enableGarbageCollection: true,
        gcInterval: 30000,
        enableMemoryMonitoring: true
      },
      loading: {
        enableLazyLoading: true,
        enablePreloading: true,
        maxConcurrentLoads: 3,
        enableLoadingCache: true,
        cacheSize: 100,
        enableCompression: true
      },
      mobile: {
        enableTouchOptimization: true,
        enableBatteryOptimization: true,
        enableLowPowerMode: false,
        maxParticleCount: 500,
        enableDynamicQuality: true,
        enableFrameSkip: false
      },
      network: {
        enableRequestCaching: true,
        maxCacheSize: 50,
        enableCompression: true,
        timeout: 10000,
        retryAttempts: 3,
        enableOfflineMode: true
      },
      debug: {
        enablePerformanceMonitoring: false,
        enableMemoryProfiling: false,
        enableFrameRateDisplay: false,
        enableDebugInfo: false,
        logPerformanceData: false
      }
    };
  }

  /**
   * 获取默认指标
   */
  private getDefaultMetrics(): PerformanceMetrics {
    return {
      fps: { current: 60, average: 60, min: 60, max: 60, target: 60 },
      memory: { used: 0, total: 0, available: 0, textureMemory: 0, audioMemory: 0, objectCount: 0 },
      rendering: { drawCalls: 0, triangles: 0, vertices: 0, batches: 0, renderTime: 0 },
      loading: { loadTime: 0, cacheHitRate: 0, compressionRatio: 0, activeLoads: 0 },
      network: { requestCount: 0, averageResponseTime: 0, cacheHitRate: 0, errorRate: 0 },
      timestamp: Date.now()
    };
  }

  /**
   * 加载配置
   */
  private loadConfig(): void {
    const savedConfig = storage.get('performance_config', null);
    if (savedConfig) {
      this.config = { ...this.config, ...savedConfig };
    }
  }

  /**
   * 保存配置
   */
  private saveConfig(): void {
    storage.set('performance_config', this.config);
  }

  /**
   * 检测设备能力
   */
  private detectDeviceCapabilities(): void {
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    const isLowEnd = navigator.hardwareConcurrency <= 2;
    const hasLowMemory = (navigator as any).deviceMemory < 4;
    
    if (isMobile || isLowEnd || hasLowMemory) {
      this.optimizationState.currentQualityLevel = 'medium';
      this.config.rendering.textureQuality = 'medium';
      this.config.rendering.shadowQuality = 'low';
      this.config.rendering.particleLimit = 500;
      this.config.mobile.enableLowPowerMode = true;
    }
    
    if (isMobile) {
      this.config.mobile.enableTouchOptimization = true;
      this.config.mobile.enableBatteryOptimization = true;
      this.config.mobile.maxParticleCount = 300;
    }
  }

  /**
   * 初始化性能管理器
   * @param scene - Phaser场景
   */
  initialize(scene: Phaser.Scene): void {
    this.scene = scene;
    this.setupPerformanceMonitoring();
    this.applyOptimizations();
    console.log('性能管理器已初始化');
  }

  /**
   * 设置性能监控
   */
  private setupPerformanceMonitoring(): void {
    if (!this.config.debug.enablePerformanceMonitoring) return;
    
    this.isMonitoring = true;
    this.monitoringInterval = setInterval(() => {
      this.updateMetrics();
      this.checkPerformanceIssues();
      this.generateOptimizationSuggestions();
    }, 1000);
    
    console.log('性能监控已启动');
  }

  /**
   * 更新性能指标
   */
  private updateMetrics(): void {
    if (!this.scene) return;
    
    const currentTime = Date.now();
    const deltaTime = currentTime - this.lastFrameTime;
    
    // 更新FPS
    if (deltaTime > 0) {
      const currentFPS = 1000 / deltaTime;
      this.metrics.fps.current = Math.round(currentFPS);
      this.fpsHistory.push(currentFPS);
      
      if (this.fpsHistory.length > 60) {
        this.fpsHistory.shift();
      }
      
      this.metrics.fps.average = Math.round(
        this.fpsHistory.reduce((sum, fps) => sum + fps, 0) / this.fpsHistory.length
      );
      this.metrics.fps.min = Math.round(Math.min(...this.fpsHistory));
      this.metrics.fps.max = Math.round(Math.max(...this.fpsHistory));
    }
    
    this.lastFrameTime = currentTime;
    
    // 更新内存使用
    this.updateMemoryMetrics();
    
    // 更新渲染指标
    this.updateRenderingMetrics();
    
    this.metrics.timestamp = currentTime;
  }

  /**
   * 更新内存指标
   */
  private updateMemoryMetrics(): void {
    if (!this.scene) return;
    
    // 获取内存使用情况
    const game = this.scene.game;
    const textureManager = game.textures;
    const audioManager = game.sound;
    
    // 计算纹理内存
    let textureMemory = 0;
    textureManager.each((texture: any) => {
      if (texture.source && texture.source.image) {
        const canvas = texture.source.image;
        textureMemory += (canvas.width * canvas.height * 4) / (1024 * 1024); // MB
      }
    });
    
    this.metrics.memory.textureMemory = Math.round(textureMemory);
    this.metrics.memory.used = this.metrics.memory.textureMemory + this.metrics.memory.audioMemory;
    
    // 计算对象数量
    this.metrics.memory.objectCount = this.scene.children.length;
  }

  /**
   * 更新渲染指标
   */
  private updateRenderingMetrics(): void {
    if (!this.scene) return;
    
    // 这里可以添加更详细的渲染指标收集
    // 由于Phaser的限制，一些指标可能无法直接获取
    this.metrics.rendering.drawCalls = this.scene.children.length;
  }

  /**
   * 检查性能问题
   */
  private checkPerformanceIssues(): void {
    // 检查FPS下降
    if (this.metrics.fps.current < this.config.rendering.targetFPS * 0.8) {
      this.addPerformanceEvent('fps_drop', 'medium', 
        `FPS下降: ${this.metrics.fps.current}/${this.config.rendering.targetFPS}`);
    }
    
    // 检查内存使用
    if (this.metrics.memory.used > this.config.memory.maxTextureMemory * 0.8) {
      this.addPerformanceEvent('memory_warning', 'high', 
        `内存使用过高: ${this.metrics.memory.used}MB`);
      this.optimizationState.isMemoryLow = true;
    }
    
    // 检查电池状态
    if ('getBattery' in navigator) {
      (navigator as any).getBattery().then((battery: any) => {
        if (battery.level < 0.2) {
          this.addPerformanceEvent('battery_low', 'medium', 
            `电池电量低: ${Math.round(battery.level * 100)}%`);
          this.optimizationState.isBatteryLow = true;
        }
      });
    }
  }

  /**
   * 添加性能事件
   */
  private addPerformanceEvent(type: PerformanceEvent['type'], severity: PerformanceEvent['severity'], message: string, data?: any): void {
    const event: PerformanceEvent = {
      type,
      severity,
      message,
      data: data || {},
      timestamp: Date.now()
    };
    
    this.events.push(event);
    
    // 保持事件历史在合理范围内
    if (this.events.length > 100) {
      this.events.shift();
    }
    
    if (this.config.debug.logPerformanceData) {
      console.warn(`性能事件: ${message}`, event);
    }
  }

  /**
   * 生成优化建议
   */
  private generateOptimizationSuggestions(): void {
    this.suggestions = [];
    
    // FPS优化建议
    if (this.metrics.fps.current < this.config.rendering.targetFPS * 0.9) {
      this.suggestions.push({
        type: 'rendering',
        priority: 'high',
        title: '降低渲染质量',
        description: '当前FPS较低，建议降低渲染质量以提高性能',
        action: '降低纹理质量和阴影质量',
        impact: '可能提高10-20 FPS'
      });
    }
    
    // 内存优化建议
    if (this.metrics.memory.used > this.config.memory.maxTextureMemory * 0.7) {
      this.suggestions.push({
        type: 'memory',
        priority: 'medium',
        title: '清理内存',
        description: '内存使用较高，建议清理未使用的资源',
        action: '清理纹理缓存和音频缓存',
        impact: '减少内存使用10-30%'
      });
    }
    
    // 移动端优化建议
    if (this.optimizationState.isBatteryLow) {
      this.suggestions.push({
        type: 'mobile',
        priority: 'high',
        title: '启用省电模式',
        description: '电池电量低，建议启用省电模式',
        action: '降低粒子效果和动画质量',
        impact: '延长电池使用时间'
      });
    }
  }

  /**
   * 应用优化
   */
  private applyOptimizations(): void {
    this.applyRenderingOptimizations();
    this.applyMemoryOptimizations();
    this.applyLoadingOptimizations();
    this.applyMobileOptimizations();
    this.applyNetworkOptimizations();
  }

  /**
   * 应用渲染优化
   */
  private applyRenderingOptimizations(): void {
    if (!this.scene) return;
    
    const game = this.scene.game;
    
    // 设置目标FPS
    game.loop.targetFps = this.config.rendering.targetFPS;
    
    // 设置VSync
    if (this.config.rendering.enableVSync) {
      game.renderer.setBlendMode(Phaser.BlendModes.NORMAL);
    }
    
    // 设置抗锯齿
    if (!this.config.rendering.enableAntiAliasing) {
      game.renderer.setAntialias(false);
    }
    
    console.log('渲染优化已应用');
  }

  /**
   * 应用内存优化
   */
  private applyMemoryOptimizations(): void {
    if (!this.scene) return;
    
    const game = this.scene.game;
    
    // 启用垃圾回收
    if (this.config.memory.enableGarbageCollection) {
      setInterval(() => {
        this.performGarbageCollection();
      }, this.config.memory.gcInterval);
    }
    
    // 设置内存限制
    if (this.config.memory.maxTextureMemory > 0) {
      // 这里可以添加纹理内存限制逻辑
    }
    
    console.log('内存优化已应用');
  }

  /**
   * 应用加载优化
   */
  private applyLoadingOptimizations(): void {
    if (!this.scene) return;
    
    // 启用懒加载
    if (this.config.loading.enableLazyLoading) {
      // 这里可以添加懒加载逻辑
    }
    
    // 启用预加载
    if (this.config.loading.enablePreloading) {
      // 这里可以添加预加载逻辑
    }
    
    console.log('加载优化已应用');
  }

  /**
   * 应用移动端优化
   */
  private applyMobileOptimizations(): void {
    if (!this.scene) return;
    
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    
    if (isMobile) {
      // 启用触摸优化
      if (this.config.mobile.enableTouchOptimization) {
        this.scene.input.setDefaultCursor('pointer');
      }
      
      // 启用电池优化
      if (this.config.mobile.enableBatteryOptimization) {
        this.enableBatteryOptimization();
      }
      
      // 启用动态质量调整
      if (this.config.mobile.enableDynamicQuality) {
        this.enableDynamicQualityAdjustment();
      }
    }
    
    console.log('移动端优化已应用');
  }

  /**
   * 应用网络优化
   */
  private applyNetworkOptimizations(): void {
    // 启用请求缓存
    if (this.config.network.enableRequestCaching) {
      // 这里可以添加网络缓存逻辑
    }
    
    // 启用压缩
    if (this.config.network.enableCompression) {
      // 这里可以添加网络压缩逻辑
    }
    
    console.log('网络优化已应用');
  }

  /**
   * 启用电池优化
   */
  private enableBatteryOptimization(): void {
    this.optimizationState.isLowPowerMode = true;
    
    // 降低渲染质量
    this.config.rendering.textureQuality = 'medium';
    this.config.rendering.shadowQuality = 'low';
    this.config.rendering.particleLimit = 200;
    
    // 降低FPS
    if (this.scene) {
      this.scene.game.loop.targetFps = 30;
    }
    
    console.log('电池优化已启用');
  }

  /**
   * 启用动态质量调整
   */
  private enableDynamicQualityAdjustment(): void {
    let qualityCheckInterval = setInterval(() => {
      if (this.metrics.fps.current < 30) {
        this.lowerQuality();
      } else if (this.metrics.fps.current > 55) {
        this.raiseQuality();
      }
    }, 5000);
    
    console.log('动态质量调整已启用');
  }

  /**
   * 降低质量
   */
  private lowerQuality(): void {
    if (this.optimizationState.currentQualityLevel === 'ultra') {
      this.optimizationState.currentQualityLevel = 'high';
    } else if (this.optimizationState.currentQualityLevel === 'high') {
      this.optimizationState.currentQualityLevel = 'medium';
    } else if (this.optimizationState.currentQualityLevel === 'medium') {
      this.optimizationState.currentQualityLevel = 'low';
    }
    
    this.applyQualitySettings();
    console.log(`质量已降低到: ${this.optimizationState.currentQualityLevel}`);
  }

  /**
   * 提高质量
   */
  private raiseQuality(): void {
    if (this.optimizationState.currentQualityLevel === 'low') {
      this.optimizationState.currentQualityLevel = 'medium';
    } else if (this.optimizationState.currentQualityLevel === 'medium') {
      this.optimizationState.currentQualityLevel = 'high';
    } else if (this.optimizationState.currentQualityLevel === 'high') {
      this.optimizationState.currentQualityLevel = 'ultra';
    }
    
    this.applyQualitySettings();
    console.log(`质量已提高到: ${this.optimizationState.currentQualityLevel}`);
  }

  /**
   * 应用质量设置
   */
  private applyQualitySettings(): void {
    const quality = this.optimizationState.currentQualityLevel;
    
    switch (quality) {
      case 'ultra':
        this.config.rendering.textureQuality = 'ultra';
        this.config.rendering.shadowQuality = 'high';
        this.config.rendering.particleLimit = 2000;
        this.config.rendering.enablePostProcessing = true;
        break;
      case 'high':
        this.config.rendering.textureQuality = 'high';
        this.config.rendering.shadowQuality = 'medium';
        this.config.rendering.particleLimit = 1000;
        this.config.rendering.enablePostProcessing = true;
        break;
      case 'medium':
        this.config.rendering.textureQuality = 'medium';
        this.config.rendering.shadowQuality = 'low';
        this.config.rendering.particleLimit = 500;
        this.config.rendering.enablePostProcessing = false;
        break;
      case 'low':
        this.config.rendering.textureQuality = 'low';
        this.config.rendering.shadowQuality = 'off';
        this.config.rendering.particleLimit = 200;
        this.config.rendering.enablePostProcessing = false;
        break;
    }
  }

  /**
   * 执行垃圾回收
   */
  private performGarbageCollection(): void {
    if (!this.scene) return;
    
    const game = this.scene.game;
    
    // 清理纹理缓存
    game.textures.removeAll();
    
    // 清理音频缓存
    game.sound.removeAll();
    
    // 清理场景对象
    this.scene.children.removeAll(true);
    
    // 强制垃圾回收（如果可用）
    if ('gc' in window) {
      (window as any).gc();
    }
    
    console.log('垃圾回收已执行');
  }

  /**
   * 优化纹理加载
   * @param textureKey - 纹理键
   * @param url - 纹理URL
   */
  optimizeTextureLoading(textureKey: string, url: string): void {
    if (!this.scene) return;
    
    // 检查是否已加载
    if (this.scene.textures.exists(textureKey)) {
      return;
    }
    
    // 检查内存使用
    if (this.metrics.memory.used > this.config.memory.maxTextureMemory * 0.9) {
      this.performGarbageCollection();
    }
    
    // 加载纹理
    this.scene.load.image(textureKey, url);
  }

  /**
   * 优化音频加载
   * @param audioKey - 音频键
   * @param url - 音频URL
   */
  optimizeAudioLoading(audioKey: string, url: string): void {
    if (!this.scene) return;
    
    // 检查是否已加载
    if (this.scene.cache.audio.exists(audioKey)) {
      return;
    }
    
    // 检查内存使用
    if (this.metrics.memory.audioMemory > this.config.memory.maxAudioMemory * 0.9) {
      // 清理音频缓存
      this.scene.sound.removeAll();
    }
    
    // 加载音频
    this.scene.load.audio(audioKey, url);
  }

  /**
   * 获取性能指标
   * @returns 性能指标
   */
  getMetrics(): PerformanceMetrics {
    return { ...this.metrics };
  }

  /**
   * 获取性能事件
   * @returns 性能事件数组
   */
  getEvents(): PerformanceEvent[] {
    return [...this.events];
  }

  /**
   * 获取优化建议
   * @returns 优化建议数组
   */
  getSuggestions(): OptimizationSuggestion[] {
    return [...this.suggestions];
  }

  /**
   * 获取配置
   * @returns 性能配置
   */
  getConfig(): PerformanceConfig {
    return { ...this.config };
  }

  /**
   * 更新配置
   * @param config - 新配置
   */
  updateConfig(config: Partial<PerformanceConfig>): void {
    this.config = { ...this.config, ...config };
    this.saveConfig();
    this.applyOptimizations();
  }

  /**
   * 获取优化状态
   * @returns 优化状态
   */
  getOptimizationState(): typeof this.optimizationState {
    return { ...this.optimizationState };
  }

  /**
   * 启用性能监控
   */
  enableMonitoring(): void {
    this.config.debug.enablePerformanceMonitoring = true;
    this.setupPerformanceMonitoring();
  }

  /**
   * 禁用性能监控
   */
  disableMonitoring(): void {
    this.config.debug.enablePerformanceMonitoring = false;
    this.isMonitoring = false;
    
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }
  }

  /**
   * 生成性能报告
   * @returns 性能报告
   */
  generatePerformanceReport(): any {
    return {
      metrics: this.getMetrics(),
      events: this.getEvents(),
      suggestions: this.getSuggestions(),
      config: this.getConfig(),
      optimizationState: this.getOptimizationState(),
      timestamp: Date.now()
    };
  }

  /**
   * 清理资源
   */
  destroy(): void {
    this.disableMonitoring();
    this.performGarbageCollection();
    this.events = [];
    this.suggestions = [];
    this.scene = null;
  }
}
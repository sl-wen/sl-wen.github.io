/**
 * 屏幕效果系统
 * 负责管理游戏中的所有屏幕级视觉效果，包括闪烁、淡入淡出、震动、故障等效果
 */

import { storage } from '../utils';

// 屏幕效果类型
export type ScreenEffectType = 'flash' | 'fade' | 'shake' | 'glitch' | 'blur' | 'chromatic' | 'vignette' | 'scanlines' | 'noise' | 'custom';

// 效果触发时机
export type EffectTrigger = 'instant' | 'delayed' | 'continuous' | 'pulse' | 'wave' | 'random';

// 效果混合模式
export type EffectBlendMode = 'normal' | 'add' | 'multiply' | 'screen' | 'overlay' | 'darken' | 'lighten';

// 震动类型
export type ShakeType = 'horizontal' | 'vertical' | 'circular' | 'random' | 'intense' | 'gentle';

// 故障类型
export type GlitchType = 'horizontal' | 'vertical' | 'rgb_shift' | 'noise' | 'scanlines' | 'digital' | 'analog';

// 屏幕效果配置
export interface ScreenEffectConfig {
  id: string;
  name: string;
  description: string;
  type: ScreenEffectType;
  
  // 基础配置
  duration: number;
  delay: number;
  intensity: number;
  color: number;
  alpha: number;
  
  // 触发配置
  trigger: EffectTrigger;
  repeat: number;
  repeatDelay: number;
  
  // 混合模式
  blendMode: EffectBlendMode;
  
  // 位置和大小
  x: number;
  y: number;
  width: number;
  height: number;
  
  // 高级配置
  advanced: {
    ease?: string;
    onStart?: () => void;
    onUpdate?: (progress: number) => void;
    onComplete?: () => void;
    customShader?: string;
  };
  
  // 类型特定配置
  shake?: {
    type: ShakeType;
    frequency: number;
    decay: number;
    intensity?: number;
  };
  
  glitch?: {
    type: GlitchType;
    intensity: number;
    frequency: number;
    offset: number;
  };
  
  blur?: {
    radius: number;
    quality: number;
  };
  
  chromatic?: {
    redOffset: number;
    greenOffset: number;
    blueOffset: number;
  };
}

// 屏幕效果实例
export interface ScreenEffect {
  id: string;
  config: ScreenEffectConfig;
  graphics: Phaser.GameObjects.Graphics | null;
  tween: Phaser.Tweens.Tween | null | undefined;
  scene: Phaser.Scene;
  isActive: boolean;
  startTime: number;
  endTime: number;
  repeatCount: number;
  metadata: Record<string, any>;
}

// 屏幕效果预设
export interface ScreenEffectPreset {
  id: string;
  name: string;
  description: string;
  category: string;
  config: ScreenEffectConfig;
  tags: string[];
}

// 屏幕效果事件
export interface ScreenEffectEvent {
  type: 'effect_started' | 'effect_stopped' | 'effect_completed' | 'effect_repeated' | 'custom';
  effectId: string;
  data?: any;
  timestamp: number;
}

// 屏幕效果统计
export interface ScreenEffectStats {
  totalEffects: number;
  activeEffects: number;
  effectsByType: Record<ScreenEffectType, number>;
  performance: {
    fps: number;
    memoryUsage: number;
    cpuUsage: number;
  };
}

export class ScreenEffectSystem {
  private static instance: ScreenEffectSystem;
  private scene: Phaser.Scene | null = null;
  
  // 数据存储
  private effects: Map<string, ScreenEffect> = new Map();
  private presets: Map<string, ScreenEffectPreset> = new Map();
  private events: ScreenEffectEvent[] = [];
  private callbacks: Map<string, (data: any) => void> = new Map();
  
  // 配置
  private config = {
    maxEffects: 10,
    maxEventsSize: 100,
    enablePerformanceMonitoring: true,
    enableAutoCleanup: true,
    cleanupInterval: 5000, // 5秒
    performanceThreshold: 30 // FPS阈值
  };
  
  // 统计信息
  private stats: ScreenEffectStats = {
    totalEffects: 0,
    activeEffects: 0,
    effectsByType: {} as Record<ScreenEffectType, number>,
    performance: {
      fps: 60,
      memoryUsage: 0,
      cpuUsage: 0
    }
  };
  
  // 性能监控
  private performanceTimer: number = 0;
  private cleanupTimer: number = 0;

  private constructor() {
    this.initializeDefaultPresets();
  }

  public static getInstance(): ScreenEffectSystem {
    if (!ScreenEffectSystem.instance) {
      ScreenEffectSystem.instance = new ScreenEffectSystem();
    }
    return ScreenEffectSystem.instance;
  }

  /**
   * 初始化屏幕效果系统
   */
  public initialize(scene: Phaser.Scene): void {
    this.scene = scene;
    this.setupEventHandlers();
    this.startPerformanceMonitoring();
    console.log('屏幕效果系统已初始化');
  }

  /**
   * 设置事件处理器
   */
  private setupEventHandlers(): void {
    if (!this.scene) return;

    // 监听游戏事件
    this.scene.events.on('player-damaged', (data: any) => {
      this.onPlayerDamaged(data);
    });

    this.scene.events.on('player-healed', (data: any) => {
      this.onPlayerHealed(data);
    });

    this.scene.events.on('level-up', (data: any) => {
      this.onLevelUp(data);
    });

    this.scene.events.on('quest-completed', (data: any) => {
      this.onQuestCompleted(data);
    });

    this.scene.events.on('combat-critical', (data: any) => {
      this.onCombatCritical(data);
    });
  }

  /**
   * 创建屏幕效果
   */
  public createEffect(config: ScreenEffectConfig): string {
    if (!this.scene) {
      console.error('屏幕效果系统未初始化');
      return '';
    }

    if (this.effects.size >= this.config.maxEffects) {
      console.warn('屏幕效果数量已达上限');
      return '';
    }

    const effectId = `screen_effect_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // 创建图形对象
    const graphics = this.scene.add.graphics();
    graphics.setDepth(1000); // 确保在最上层
    
    // 创建效果对象
    const effect: ScreenEffect = {
      id: effectId,
      config,
      graphics,
      tween: null,
      scene: this.scene,
      isActive: true,
      startTime: Date.now(),
      endTime: Date.now() + config.duration,
      repeatCount: 0,
      metadata: {}
    };

    this.effects.set(effectId, effect);
    this.stats.totalEffects++;
    this.stats.activeEffects++;
    this.updateStatsByType(config.type, 1);
    
    // 应用效果
    this.applyEffect(effect);
    
    this.addEvent('effect_started', effectId, { config });
    console.log(`创建屏幕效果: ${config.name}`);
    
    return effectId;
  }

  /**
   * 应用屏幕效果
   */
  private applyEffect(effect: ScreenEffect): void {
    const { config, graphics } = effect;
    
    if (!graphics) return;

    switch (config.type) {
      case 'flash':
        this.applyFlashEffect(effect);
        break;
      case 'fade':
        this.applyFadeEffect(effect);
        break;
      case 'shake':
        this.applyShakeEffect(effect);
        break;
      case 'glitch':
        this.applyGlitchEffect(effect);
        break;
      case 'blur':
        this.applyBlurEffect(effect);
        break;
      case 'chromatic':
        this.applyChromaticEffect(effect);
        break;
      case 'vignette':
        this.applyVignetteEffect(effect);
        break;
      case 'scanlines':
        this.applyScanlinesEffect(effect);
        break;
      case 'noise':
        this.applyNoiseEffect(effect);
        break;
      case 'custom':
        this.applyCustomEffect(effect);
        break;
    }
  }

  /**
   * 应用闪烁效果
   */
  private applyFlashEffect(effect: ScreenEffect): void {
    const { config, graphics } = effect;
    
    if (!graphics) return;

    // 创建闪烁图形
    graphics.clear();
    graphics.fillStyle(config.color, config.alpha);
    graphics.fillRect(config.x, config.y, config.width, config.height);
    graphics.setBlendMode(config.blendMode);

    // 创建闪烁动画
    effect.tween = this.scene?.tweens.add({
      targets: graphics,
      alpha: 0,
      duration: config.duration,
      delay: config.delay,
      ease: config.advanced.ease || 'Power2',
      onUpdate: config.advanced.onUpdate,
      onComplete: () => {
        this.completeEffect(effect);
        if (config.advanced.onComplete) {
          config.advanced.onComplete();
        }
      }
    });
  }

  /**
   * 应用淡入淡出效果
   */
  private applyFadeEffect(effect: ScreenEffect): void {
    const { config, graphics } = effect;
    
    if (!graphics) return;

    // 创建淡入淡出图形
    graphics.clear();
    graphics.fillStyle(config.color, 0);
    graphics.fillRect(config.x, config.y, config.width, config.height);
    graphics.setBlendMode(config.blendMode);

    // 创建淡入淡出动画
    const halfDuration = config.duration / 2;
    
    effect.tween = this.scene?.tweens.add({
      targets: graphics,
      alpha: config.alpha,
      duration: halfDuration,
      delay: config.delay,
      ease: config.advanced.ease || 'Power2',
      onUpdate: config.advanced.onUpdate,
      onComplete: () => {
        // 淡出
        this.scene?.tweens.add({
          targets: graphics,
          alpha: 0,
          duration: halfDuration,
          ease: config.advanced.ease || 'Power2',
          onComplete: () => {
            this.completeEffect(effect);
            if (config.advanced.onComplete) {
              config.advanced.onComplete();
            }
          }
        });
      }
    });
  }

  /**
   * 应用震动效果
   */
  private applyShakeEffect(effect: ScreenEffect): void {
    const { config } = effect;
    
    if (!this.scene) return;

    const shakeConfig = config.shake;
    if (!shakeConfig) return;

    // 应用相机震动
    this.scene.cameras.main.shake(
      config.duration,
      shakeConfig.intensity || 0.01,
      true,
      () => {
        // 震动完成回调
      }
    );

    // 设置完成回调
    this.scene.time.delayedCall(config.duration + config.delay, () => {
      this.completeEffect(effect);
      if (config.advanced.onComplete) {
        config.advanced.onComplete();
      }
    });
  }

  /**
   * 应用故障效果
   */
  private applyGlitchEffect(effect: ScreenEffect): void {
    const { config, graphics } = effect;
    
    if (!graphics) return;

    const glitchConfig = config.glitch;
    if (!glitchConfig) return;

    // 创建故障图形
    graphics.clear();
    graphics.fillStyle(config.color, config.alpha);
    
    // 根据故障类型创建不同的效果
    switch (glitchConfig.type) {
      case 'horizontal':
        this.createHorizontalGlitch(graphics, config, glitchConfig);
        break;
      case 'vertical':
        this.createVerticalGlitch(graphics, config, glitchConfig);
        break;
      case 'rgb_shift':
        this.createRGBShiftGlitch(graphics, config, glitchConfig);
        break;
      case 'scanlines':
        this.createScanlinesGlitch(graphics, config, glitchConfig);
        break;
      default:
        this.createNoiseGlitch(graphics, config, glitchConfig);
        break;
    }

    graphics.setBlendMode(config.blendMode);

    // 创建故障动画
    effect.tween = this.scene?.tweens.add({
      targets: graphics,
      alpha: 0,
      duration: config.duration,
      delay: config.delay,
      ease: config.advanced.ease || 'Power2',
      onUpdate: config.advanced.onUpdate,
      onComplete: () => {
        this.completeEffect(effect);
        if (config.advanced.onComplete) {
          config.advanced.onComplete();
        }
      }
    });
  }

  /**
   * 创建水平故障
   */
  private createHorizontalGlitch(graphics: Phaser.GameObjects.Graphics, config: ScreenEffectConfig, glitchConfig: any): void {
    const lineHeight = 2;
    const numLines = Math.floor(config.height / lineHeight);
    
    for (let i = 0; i < numLines; i++) {
      if (Math.random() < glitchConfig.intensity) {
        const y = config.y + i * lineHeight;
        const offset = (Math.random() - 0.5) * glitchConfig.offset;
        graphics.fillRect(config.x + offset, y, config.width, lineHeight);
      }
    }
  }

  /**
   * 创建垂直故障
   */
  private createVerticalGlitch(graphics: Phaser.GameObjects.Graphics, config: ScreenEffectConfig, glitchConfig: any): void {
    const lineWidth = 2;
    const numLines = Math.floor(config.width / lineWidth);
    
    for (let i = 0; i < numLines; i++) {
      if (Math.random() < glitchConfig.intensity) {
        const x = config.x + i * lineWidth;
        const offset = (Math.random() - 0.5) * glitchConfig.offset;
        graphics.fillRect(x, config.y + offset, lineWidth, config.height);
      }
    }
  }

  /**
   * 创建RGB偏移故障
   */
  private createRGBShiftGlitch(graphics: Phaser.GameObjects.Graphics, config: ScreenEffectConfig, glitchConfig: any): void {
    // 红色通道
    graphics.fillStyle(0xff0000, config.alpha * 0.5);
    graphics.fillRect(config.x + glitchConfig.offset, config.y, config.width, config.height);
    
    // 绿色通道
    graphics.fillStyle(0x00ff00, config.alpha * 0.5);
    graphics.fillRect(config.x, config.y, config.width, config.height);
    
    // 蓝色通道
    graphics.fillStyle(0x0000ff, config.alpha * 0.5);
    graphics.fillRect(config.x - glitchConfig.offset, config.y, config.width, config.height);
  }

  /**
   * 创建扫描线故障
   */
  private createScanlinesGlitch(graphics: Phaser.GameObjects.Graphics, config: ScreenEffectConfig, glitchConfig: any): void {
    const lineHeight = 1;
    const numLines = Math.floor(config.height / lineHeight);
    
    for (let i = 0; i < numLines; i += 2) {
      const y = config.y + i * lineHeight;
      graphics.fillRect(config.x, y, config.width, lineHeight);
    }
  }

  /**
   * 创建噪点故障
   */
  private createNoiseGlitch(graphics: Phaser.GameObjects.Graphics, config: ScreenEffectConfig, glitchConfig: any): void {
    const pixelSize = 2;
    const numPixels = Math.floor((config.width * config.height) / (pixelSize * pixelSize));
    
    for (let i = 0; i < numPixels; i++) {
      if (Math.random() < glitchConfig.intensity) {
        const x = config.x + Math.random() * config.width;
        const y = config.y + Math.random() * config.height;
        graphics.fillRect(x, y, pixelSize, pixelSize);
      }
    }
  }

  /**
   * 应用模糊效果
   */
  private applyBlurEffect(effect: ScreenEffect): void {
    // 模糊效果需要后处理着色器，这里使用简单的图形效果模拟
    const { config, graphics } = effect;
    
    if (!graphics) return;

    const blurConfig = config.blur;
    if (!blurConfig) return;

    // 创建多层模糊图形
    for (let i = 0; i < blurConfig.quality; i++) {
      const offset = i * blurConfig.radius / blurConfig.quality;
      const alpha = config.alpha / blurConfig.quality;
      
      graphics.fillStyle(config.color, alpha);
      graphics.fillRect(
        config.x - offset,
        config.y - offset,
        config.width + offset * 2,
        config.height + offset * 2
      );
    }

    graphics.setBlendMode(config.blendMode);

    // 创建模糊动画
    effect.tween = this.scene?.tweens.add({
      targets: graphics,
      alpha: 0,
      duration: config.duration,
      delay: config.delay,
      ease: config.advanced.ease || 'Power2',
      onUpdate: config.advanced.onUpdate,
      onComplete: () => {
        this.completeEffect(effect);
        if (config.advanced.onComplete) {
          config.advanced.onComplete();
        }
      }
    });
  }

  /**
   * 应用色差效果
   */
  private applyChromaticEffect(effect: ScreenEffect): void {
    const { config, graphics } = effect;
    
    if (!graphics) return;

    const chromaticConfig = config.chromatic;
    if (!chromaticConfig) return;

    // 创建RGB分离效果
    graphics.fillStyle(0xff0000, config.alpha * 0.3);
    graphics.fillRect(config.x + chromaticConfig.redOffset, config.y, config.width, config.height);
    
    graphics.fillStyle(0x00ff00, config.alpha * 0.3);
    graphics.fillRect(config.x + chromaticConfig.greenOffset, config.y, config.width, config.height);
    
    graphics.fillStyle(0x0000ff, config.alpha * 0.3);
    graphics.fillRect(config.x + chromaticConfig.blueOffset, config.y, config.width, config.height);

    graphics.setBlendMode(config.blendMode);

    // 创建色差动画
    effect.tween = this.scene?.tweens.add({
      targets: graphics,
      alpha: 0,
      duration: config.duration,
      delay: config.delay,
      ease: config.advanced.ease || 'Power2',
      onUpdate: config.advanced.onUpdate,
      onComplete: () => {
        this.completeEffect(effect);
        if (config.advanced.onComplete) {
          config.advanced.onComplete();
        }
      }
    });
  }

  /**
   * 应用暗角效果
   */
  private applyVignetteEffect(effect: ScreenEffect): void {
    const { config, graphics } = effect;
    
    if (!graphics) return;

    // 创建径向渐变暗角
    const centerX = config.x + config.width / 2;
    const centerY = config.y + config.height / 2;
    const radius = Math.max(config.width, config.height) / 2;

    for (let i = 0; i < 10; i++) {
      const currentRadius = radius * (i / 10);
      const alpha = config.alpha * (1 - i / 10);
      
      graphics.fillStyle(config.color, alpha);
      graphics.fillCircle(centerX, centerY, currentRadius);
    }

    graphics.setBlendMode(config.blendMode);

    // 创建暗角动画
    effect.tween = this.scene?.tweens.add({
      targets: graphics,
      alpha: 0,
      duration: config.duration,
      delay: config.delay,
      ease: config.advanced.ease || 'Power2',
      onUpdate: config.advanced.onUpdate,
      onComplete: () => {
        this.completeEffect(effect);
        if (config.advanced.onComplete) {
          config.advanced.onComplete();
        }
      }
    });
  }

  /**
   * 应用扫描线效果
   */
  private applyScanlinesEffect(effect: ScreenEffect): void {
    const { config, graphics } = effect;
    
    if (!graphics) return;

    // 创建扫描线
    const lineHeight = 2;
    const numLines = Math.floor(config.height / lineHeight);
    
    for (let i = 0; i < numLines; i += 2) {
      const y = config.y + i * lineHeight;
      graphics.fillStyle(config.color, config.alpha);
      graphics.fillRect(config.x, y, config.width, lineHeight);
    }

    graphics.setBlendMode(config.blendMode);

    // 创建扫描线动画
    effect.tween = this.scene?.tweens.add({
      targets: graphics,
      alpha: 0,
      duration: config.duration,
      delay: config.delay,
      ease: config.advanced.ease || 'Power2',
      onUpdate: config.advanced.onUpdate,
      onComplete: () => {
        this.completeEffect(effect);
        if (config.advanced.onComplete) {
          config.advanced.onComplete();
        }
      }
    });
  }

  /**
   * 应用噪点效果
   */
  private applyNoiseEffect(effect: ScreenEffect): void {
    const { config, graphics } = effect;
    
    if (!graphics) return;

    // 创建噪点
    const pixelSize = 1;
    const numPixels = Math.floor((config.width * config.height) / (pixelSize * pixelSize));
    
    for (let i = 0; i < numPixels; i++) {
      if (Math.random() < config.intensity) {
        const x = config.x + Math.random() * config.width;
        const y = config.y + Math.random() * config.height;
        const alpha = Math.random() * config.alpha;
        
        graphics.fillStyle(config.color, alpha);
        graphics.fillRect(x, y, pixelSize, pixelSize);
      }
    }

    graphics.setBlendMode(config.blendMode);

    // 创建噪点动画
    effect.tween = this.scene?.tweens.add({
      targets: graphics,
      alpha: 0,
      duration: config.duration,
      delay: config.delay,
      ease: config.advanced.ease || 'Power2',
      onUpdate: config.advanced.onUpdate,
      onComplete: () => {
        this.completeEffect(effect);
        if (config.advanced.onComplete) {
          config.advanced.onComplete();
        }
      }
    });
  }

  /**
   * 应用自定义效果
   */
  private applyCustomEffect(effect: ScreenEffect): void {
    const { config } = effect;
    
    if (config.advanced.onStart) {
      config.advanced.onStart();
    }

    // 自定义效果需要用户自己实现
    this.scene?.time.delayedCall(config.duration + config.delay, () => {
      this.completeEffect(effect);
      if (config.advanced.onComplete) {
        config.advanced.onComplete();
      }
    });
  }

  /**
   * 完成效果
   */
  private completeEffect(effect: ScreenEffect): void {
    if (effect.config.repeat > 0 && effect.repeatCount < effect.config.repeat) {
      // 重复效果
      effect.repeatCount++;
      this.scene?.time.delayedCall(effect.config.repeatDelay, () => {
        this.applyEffect(effect);
      });
      this.addEvent('effect_repeated', effect.id, { effect, repeatCount: effect.repeatCount });
    } else {
      // 停止效果
      this.stopEffect(effect.id);
    }
  }

  /**
   * 停止屏幕效果
   */
  public stopEffect(effectId: string): boolean {
    const effect = this.effects.get(effectId);
    if (!effect || !effect.isActive) {
      return false;
    }

    if (effect.tween) {
      effect.tween.stop();
      effect.tween.destroy();
    }

    if (effect.graphics) {
      effect.graphics.destroy();
    }

    effect.isActive = false;
    effect.endTime = Date.now();
    this.stats.activeEffects--;
    
    this.addEvent('effect_stopped', effectId, { effect });
    console.log(`停止屏幕效果: ${effect.config.name}`);
    
    return true;
  }

  /**
   * 使用预设创建效果
   */
  public createEffectFromPreset(presetId: string): string {
    const preset = this.presets.get(presetId);
    if (!preset) {
      console.error(`未找到屏幕效果预设: ${presetId}`);
      return '';
    }

    return this.createEffect(preset.config);
  }

  /**
   * 创建受伤闪烁效果
   */
  public createDamageFlashEffect(intensity: number = 0.3): string {
    const effectId = this.createEffectFromPreset('damage_flash');
    
    if (effectId) {
      const effect = this.effects.get(effectId);
      if (effect) {
        effect.config.intensity = intensity;
        effect.metadata.damageIntensity = intensity;
      }
    }
    
    return effectId;
  }

  /**
   * 创建升级闪光效果
   */
  public createLevelUpFlashEffect(): string {
    return this.createEffectFromPreset('level_up_flash');
  }

  /**
   * 创建任务完成效果
   */
  public createQuestCompleteEffect(): string {
    return this.createEffectFromPreset('quest_complete_effect');
  }

  /**
   * 创建暴击效果
   */
  public createCriticalEffect(): string {
    return this.createEffectFromPreset('critical_effect');
  }

  /**
   * 创建场景切换效果
   */
  public createSceneTransitionEffect(): string {
    return this.createEffectFromPreset('scene_transition');
  }

  /**
   * 停止所有效果
   */
  public stopAllEffects(): void {
    this.effects.forEach((effect, effectId) => {
      this.stopEffect(effectId);
    });
  }

  /**
   * 停止指定类型的效果
   */
  public stopEffectsByType(type: ScreenEffectType): void {
    this.effects.forEach((effect, effectId) => {
      if (effect.config.type === type && effect.isActive) {
        this.stopEffect(effectId);
      }
    });
  }

  /**
   * 获取活跃效果
   */
  public getActiveEffects(): ScreenEffect[] {
    return Array.from(this.effects.values()).filter(effect => effect.isActive);
  }

  /**
   * 获取效果统计
   */
  public getEffectStats(): ScreenEffectStats {
    return { ...this.stats };
  }

  /**
   * 添加屏幕效果预设
   */
  public addPreset(preset: ScreenEffectPreset): void {
    this.presets.set(preset.id, preset);
    console.log(`添加屏幕效果预设: ${preset.name}`);
  }

  /**
   * 获取屏幕效果预设
   */
  public getPreset(presetId: string): ScreenEffectPreset | undefined {
    return this.presets.get(presetId);
  }

  /**
   * 获取所有预设
   */
  public getAllPresets(): ScreenEffectPreset[] {
    return Array.from(this.presets.values());
  }

  /**
   * 事件处理
   */
  private onPlayerDamaged(data: any): void {
    const { damage } = data;
    const intensity = Math.min(damage / 100, 0.8); // 根据伤害计算强度
    this.createDamageFlashEffect(intensity);
  }

  private onPlayerHealed(data: any): void {
    this.createEffectFromPreset('heal_effect');
  }

  private onLevelUp(data: any): void {
    this.createLevelUpFlashEffect();
  }

  private onQuestCompleted(data: any): void {
    this.createQuestCompleteEffect();
  }

  private onCombatCritical(data: any): void {
    this.createCriticalEffect();
  }

  /**
   * 开始性能监控
   */
  private startPerformanceMonitoring(): void {
    if (!this.config.enablePerformanceMonitoring) return;

    this.scene?.time.addEvent({
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
    this.stats.performance.fps = this.scene.game.loop.actualFps;

    // 检查性能阈值
    if (this.stats.performance.fps < this.config.performanceThreshold) {
      this.optimizePerformance();
    }
  }

  /**
   * 性能优化
   */
  private optimizePerformance(): void {
    console.log('性能优化: 减少屏幕效果');
    
    // 停止低优先级的效果
    const lowPriorityEffects = Array.from(this.effects.values())
      .filter(effect => effect.isActive && effect.config.type === 'noise')
      .slice(0, 2);
    
    lowPriorityEffects.forEach(effect => {
      this.stopEffect(effect.id);
    });
  }

  /**
   * 更新类型统计
   */
  private updateStatsByType(type: ScreenEffectType, delta: number): void {
    this.stats.effectsByType[type] = (this.stats.effectsByType[type] || 0) + delta;
  }

  /**
   * 初始化默认预设
   */
  private initializeDefaultPresets(): void {
    // 受伤闪烁效果
    this.addPreset({
      id: 'damage_flash',
      name: '受伤闪烁',
      description: '玩家受伤时的红色闪烁效果',
      category: 'combat',
      config: {
        id: 'damage_flash',
        name: '受伤闪烁',
        description: '玩家受伤时的红色闪烁效果',
        type: 'flash',
        duration: 200,
        delay: 0,
        intensity: 0.3,
        color: 0xff0000,
        alpha: 0.3,
        trigger: 'instant',
        repeat: 1,
        repeatDelay: 0,
        blendMode: 'add',
        x: 0,
        y: 0,
        width: 800,
        height: 600,
        advanced: {}
      },
      tags: ['combat', 'damage', 'red', 'flash']
    });

    // 升级闪光效果
    this.addPreset({
      id: 'level_up_flash',
      name: '升级闪光',
      description: '角色升级时的金色闪光效果',
      category: 'ui',
      config: {
        id: 'level_up_flash',
        name: '升级闪光',
        description: '角色升级时的金色闪光效果',
        type: 'flash',
        duration: 500,
        delay: 0,
        intensity: 0.5,
        color: 0xffff00,
        alpha: 0.5,
        trigger: 'instant',
        repeat: 2,
        repeatDelay: 100,
        blendMode: 'add',
        x: 0,
        y: 0,
        width: 800,
        height: 600,
        advanced: {}
      },
      tags: ['ui', 'level_up', 'yellow', 'flash']
    });

    // 任务完成效果
    this.addPreset({
      id: 'quest_complete_effect',
      name: '任务完成',
      description: '任务完成时的庆祝效果',
      category: 'ui',
      config: {
        id: 'quest_complete_effect',
        name: '任务完成',
        description: '任务完成时的庆祝效果',
        type: 'fade',
        duration: 1000,
        delay: 0,
        intensity: 0.4,
        color: 0x00ffff,
        alpha: 0.4,
        trigger: 'instant',
        repeat: 1,
        repeatDelay: 0,
        blendMode: 'add',
        x: 0,
        y: 0,
        width: 800,
        height: 600,
        advanced: {}
      },
      tags: ['ui', 'quest', 'cyan', 'fade']
    });

    // 暴击效果
    this.addPreset({
      id: 'critical_effect',
      name: '暴击效果',
      description: '暴击攻击时的屏幕震动效果',
      category: 'combat',
      config: {
        id: 'critical_effect',
        name: '暴击效果',
        description: '暴击攻击时的屏幕震动效果',
        type: 'shake',
        duration: 300,
        delay: 0,
        intensity: 0.02,
        color: 0xffffff,
        alpha: 0,
        trigger: 'instant',
        repeat: 1,
        repeatDelay: 0,
        blendMode: 'normal',
        x: 0,
        y: 0,
        width: 800,
        height: 600,
        shake: {
          type: 'intense',
          frequency: 0.1,
          decay: 0.9
        },
        advanced: {}
      },
      tags: ['combat', 'critical', 'shake']
    });

    // 场景切换效果
    this.addPreset({
      id: 'scene_transition',
      name: '场景切换',
      description: '场景切换时的淡入淡出效果',
      category: 'ui',
      config: {
        id: 'scene_transition',
        name: '场景切换',
        description: '场景切换时的淡入淡出效果',
        type: 'fade',
        duration: 500,
        delay: 0,
        intensity: 1,
        color: 0x000000,
        alpha: 1,
        trigger: 'instant',
        repeat: 1,
        repeatDelay: 0,
        blendMode: 'normal',
        x: 0,
        y: 0,
        width: 800,
        height: 600,
        advanced: {}
      },
      tags: ['ui', 'transition', 'fade', 'black']
    });

    // 治疗效果
    this.addPreset({
      id: 'heal_effect',
      name: '治疗效果',
      description: '治疗时的绿色闪光效果',
      category: 'combat',
      config: {
        id: 'heal_effect',
        name: '治疗效果',
        description: '治疗时的绿色闪光效果',
        type: 'flash',
        duration: 300,
        delay: 0,
        intensity: 0.3,
        color: 0x00ff00,
        alpha: 0.3,
        trigger: 'instant',
        repeat: 1,
        repeatDelay: 0,
        blendMode: 'add',
        x: 0,
        y: 0,
        width: 800,
        height: 600,
        advanced: {}
      },
      tags: ['combat', 'heal', 'green', 'flash']
    });
  }

  /**
   * 添加事件
   */
  private addEvent(type: ScreenEffectEvent['type'], effectId: string, data?: any): void {
    const event: ScreenEffectEvent = {
      type,
      effectId,
      data,
      timestamp: Date.now()
    };
    
    this.events.push(event);
    
    // 保持事件历史在合理范围内
    if (this.events.length > this.config.maxEventsSize) {
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
   * 获取屏幕效果事件
   */
  public getScreenEffectEvents(): ScreenEffectEvent[] {
    return [...this.events];
  }

  /**
   * 清理资源
   */
  public destroy(): void {
    this.stopAllEffects();
    this.effects.clear();
    this.presets.clear();
    this.events = [];
    this.callbacks.clear();
    
    this.scene = null;
    console.log('屏幕效果系统已销毁');
  }
}
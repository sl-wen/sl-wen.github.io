/**
 * 粒子效果系统
 * 负责管理游戏中的所有粒子效果，包括战斗、环境、UI等效果
 */

import { storage } from '../utils';

// 粒子类型
export type ParticleType = 'combat' | 'environment' | 'ui' | 'magic' | 'explosion' | 'trail' | 'weather' | 'custom';

// 粒子发射器类型
export type EmitterType = 'point' | 'circle' | 'rectangle' | 'line' | 'arc' | 'random';

// 粒子生命周期
export type ParticleLifecycle = 'instant' | 'duration' | 'continuous' | 'burst' | 'wave';

// 粒子行为
export type ParticleBehavior = 'gravity' | 'bounce' | 'fade' | 'scale' | 'rotate' | 'color' | 'velocity' | 'custom';

// 粒子配置
export interface ParticleConfig {
  id: string;
  name: string;
  description: string;
  type: ParticleType;
  texture: string;
  frame?: string | number;
  
  // 发射器配置
  emitter: {
    type: EmitterType;
    x: number;
    y: number;
    width?: number;
    height?: number;
    radius?: number;
    angle?: number;
    arc?: number;
  };
  
  // 粒子配置
  particle: {
    quantity: number;
    frequency: number;
    lifespan: number;
    speed: number;
    speedVariation: number;
    angle: number;
    angleVariation: number;
    scale: number;
    scaleVariation: number;
    alpha: number;
    alphaVariation: number;
    tint: number;
    tintVariation: number;
    blendMode: string;
    gravity: number;
    bounce: number;
    friction: number;
  };
  
  // 生命周期配置
  lifecycle: {
    type: ParticleLifecycle;
    duration: number;
    delay: number;
    repeat: number;
    repeatDelay: number;
  };
  
  // 行为配置
  behaviors: ParticleBehavior[];
  
  // 高级配置
  advanced: {
    emitZone?: any;
    deathZone?: any;
    blendMode?: string;
    onEmit?: (particle: any, emitter: any) => void;
    onUpdate?: (particle: any, emitter: any) => void;
    onDeath?: (particle: any, emitter: any) => void;
  };
}

// 粒子效果
export interface ParticleEffect {
  id: string;
  config: ParticleConfig;
  emitter: Phaser.GameObjects.Particles.ParticleEmitter | null;
  scene: Phaser.Scene;
  isActive: boolean;
  startTime: number;
  endTime: number;
  repeatCount: number;
  metadata: Record<string, any>;
}

// 粒子预设
export interface ParticlePreset {
  id: string;
  name: string;
  description: string;
  category: string;
  config: ParticleConfig;
  tags: string[];
}

// 粒子事件
export interface ParticleEvent {
  type: 'effect_started' | 'effect_stopped' | 'effect_completed' | 'particle_emitted' | 'particle_died' | 'custom';
  effectId: string;
  data?: any;
  timestamp: number;
}

// 粒子统计
export interface ParticleStats {
  totalEffects: number;
  activeEffects: number;
  totalParticles: number;
  activeParticles: number;
  effectsByType: Record<ParticleType, number>;
  performance: {
    fps: number;
    memoryUsage: number;
    cpuUsage: number;
  };
}

export class ParticleSystem {
  private static instance: ParticleSystem;
  private scene: Phaser.Scene | null = null;
  
  // 数据存储
  private effects: Map<string, ParticleEffect> = new Map();
  private presets: Map<string, ParticlePreset> = new Map();
  private events: ParticleEvent[] = [];
  private callbacks: Map<string, (data: any) => void> = new Map();
  
  // 配置
  private config = {
    maxEffects: 50,
    maxParticles: 1000,
    maxEventsSize: 100,
    enablePerformanceMonitoring: true,
    enableAutoCleanup: true,
    cleanupInterval: 5000, // 5秒
    performanceThreshold: 30 // FPS阈值
  };
  
  // 统计信息
  private stats: ParticleStats = {
    totalEffects: 0,
    activeEffects: 0,
    totalParticles: 0,
    activeParticles: 0,
    effectsByType: {} as Record<ParticleType, number>,
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

  public static getInstance(): ParticleSystem {
    if (!ParticleSystem.instance) {
      ParticleSystem.instance = new ParticleSystem();
    }
    return ParticleSystem.instance;
  }

  /**
   * 初始化粒子系统
   */
  public initialize(scene: Phaser.Scene): void {
    this.scene = scene;
    this.setupEventHandlers();
    this.startPerformanceMonitoring();
    console.log('粒子效果系统已初始化');
  }

  /**
   * 设置事件处理器
   */
  private setupEventHandlers(): void {
    if (!this.scene) return;

    // 监听游戏事件
    this.scene.events.on('combat-attack', (data: any) => {
      this.onCombatAttack(data);
    });

    this.scene.events.on('item-used', (data: any) => {
      this.onItemUsed(data);
    });

    this.scene.events.on('level-up', (data: any) => {
      this.onLevelUp(data);
    });

    this.scene.events.on('quest-completed', (data: any) => {
      this.onQuestCompleted(data);
    });
  }

  /**
   * 创建粒子效果
   */
  public createEffect(config: ParticleConfig, x: number, y: number): string {
    if (!this.scene) {
      console.error('粒子系统未初始化');
      return '';
    }

    if (this.effects.size >= this.config.maxEffects) {
      console.warn('粒子效果数量已达上限');
      return '';
    }

    const effectId = `effect_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // 创建粒子发射器
    const emitterConfig = this.createEmitterConfig(config, x, y);
    const emitter = this.scene.add.particles(x, y, config.texture, emitterConfig);
    
    // 设置生命周期
    if (config.lifecycle.type === 'duration') {
      this.scene.time.delayedCall(config.lifecycle.duration, () => {
        this.stopEffect(effectId);
      });
    }

    // 创建效果对象
    const effect: ParticleEffect = {
      id: effectId,
      config,
      emitter,
      scene: this.scene,
      isActive: true,
      startTime: Date.now(),
      endTime: config.lifecycle.type === 'duration' ? Date.now() + config.lifecycle.duration : 0,
      repeatCount: 0,
      metadata: {}
    };

    this.effects.set(effectId, effect);
    this.stats.totalEffects++;
    this.stats.activeEffects++;
    this.updateStatsByType(config.type, 1);
    
    this.addEvent('effect_started', effectId, { config, x, y });
    console.log(`创建粒子效果: ${config.name} at (${x}, ${y})`);
    
    return effectId;
  }

  /**
   * 创建发射器配置
   */
  private createEmitterConfig(config: ParticleConfig, x: number, y: number): any {
    const emitterConfig: any = {
      frame: config.frame,
      quantity: config.particle.quantity,
      frequency: config.particle.frequency,
      lifespan: config.particle.lifespan,
      speed: { min: config.particle.speed - config.particle.speedVariation, max: config.particle.speed + config.particle.speedVariation },
      angle: { min: config.particle.angle - config.particle.angleVariation, max: config.particle.angle + config.particle.angleVariation },
      scale: { min: config.particle.scale - config.particle.scaleVariation, max: config.particle.scale + config.particle.scaleVariation },
      alpha: { min: config.particle.alpha - config.particle.alphaVariation, max: config.particle.alpha + config.particle.alphaVariation },
      tint: config.particle.tint,
      blendMode: config.particle.blendMode,
      gravityY: config.particle.gravity,
      bounce: config.particle.bounce,
      friction: config.particle.friction,
      onEmit: config.advanced.onEmit,
      onUpdate: config.advanced.onUpdate,
      onDeath: config.advanced.onDeath
    };

    // 设置发射区域
    switch (config.emitter.type) {
      case 'point':
        emitterConfig.emitZone = { type: 'random', source: new Phaser.Geom.Point(x, y) };
        break;
      case 'circle':
        emitterConfig.emitZone = { type: 'random', source: new Phaser.Geom.Circle(x, y, config.emitter.radius || 10) };
        break;
      case 'rectangle':
        emitterConfig.emitZone = { type: 'random', source: new Phaser.Geom.Rectangle(x, y, config.emitter.width || 10, config.emitter.height || 10) };
        break;
      case 'line':
        emitterConfig.emitZone = { type: 'random', source: new Phaser.Geom.Line(x, y, x + (config.emitter.width || 10), y) };
        break;
      case 'arc':
        emitterConfig.emitZone = { type: 'random', source: new Phaser.Geom.Circle(x, y, config.emitter.radius || 10) };
        emitterConfig.angle = { min: config.emitter.angle || 0, max: (config.emitter.angle || 0) + (config.emitter.arc || 360) };
        break;
      case 'random':
        emitterConfig.emitZone = { type: 'random', source: new Phaser.Geom.Rectangle(x - 10, y - 10, 20, 20) };
        break;
    }

    return emitterConfig;
  }

  /**
   * 停止粒子效果
   */
  public stopEffect(effectId: string): boolean {
    const effect = this.effects.get(effectId);
    if (!effect || !effect.isActive) {
      return false;
    }

    if (effect.emitter) {
      effect.emitter.stop();
      effect.emitter.destroy();
    }

    effect.isActive = false;
    effect.endTime = Date.now();
    this.stats.activeEffects--;
    
    this.addEvent('effect_stopped', effectId, { effect });
    console.log(`停止粒子效果: ${effect.config.name}`);
    
    return true;
  }

  /**
   * 暂停粒子效果
   */
  public pauseEffect(effectId: string): boolean {
    const effect = this.effects.get(effectId);
    if (!effect || !effect.isActive) {
      return false;
    }

    if (effect.emitter) {
      effect.emitter.pause();
    }

    console.log(`暂停粒子效果: ${effect.config.name}`);
    return true;
  }

  /**
   * 恢复粒子效果
   */
  public resumeEffect(effectId: string): boolean {
    const effect = this.effects.get(effectId);
    if (!effect || !effect.isActive) {
      return false;
    }

    if (effect.emitter) {
      effect.emitter.resume();
    }

    console.log(`恢复粒子效果: ${effect.config.name}`);
    return true;
  }

  /**
   * 使用预设创建效果
   */
  public createEffectFromPreset(presetId: string, x: number, y: number): string {
    const preset = this.presets.get(presetId);
    if (!preset) {
      console.error(`未找到粒子预设: ${presetId}`);
      return '';
    }

    return this.createEffect(preset.config, x, y);
  }

  /**
   * 创建战斗攻击效果
   */
  public createCombatAttackEffect(x: number, y: number, damage: number, isCritical: boolean = false): string {
    const presetId = isCritical ? 'critical_attack' : 'normal_attack';
    const effectId = this.createEffectFromPreset(presetId, x, y);
    
    if (effectId) {
      const effect = this.effects.get(effectId);
      if (effect) {
        effect.metadata.damage = damage;
        effect.metadata.isCritical = isCritical;
      }
    }
    
    return effectId;
  }

  /**
   * 创建治疗效果
   */
  public createHealEffect(x: number, y: number, healAmount: number): string {
    const effectId = this.createEffectFromPreset('heal', x, y);
    
    if (effectId) {
      const effect = this.effects.get(effectId);
      if (effect) {
        effect.metadata.healAmount = healAmount;
      }
    }
    
    return effectId;
  }

  /**
   * 创建爆炸效果
   */
  public createExplosionEffect(x: number, y: number, radius: number = 50): string {
    const effectId = this.createEffectFromPreset('explosion', x, y);
    
    if (effectId) {
      const effect = this.effects.get(effectId);
      if (effect) {
        effect.metadata.radius = radius;
        // 调整发射器半径
        if (effect.emitter && effect.config.emitter.type === 'circle') {
          effect.config.emitter.radius = radius;
        }
      }
    }
    
    return effectId;
  }

  /**
   * 创建魔法效果
   */
  public createMagicEffect(x: number, y: number, spellType: string): string {
    const presetId = `magic_${spellType}`;
    const effectId = this.createEffectFromPreset(presetId, x, y);
    
    if (effectId) {
      const effect = this.effects.get(effectId);
      if (effect) {
        effect.metadata.spellType = spellType;
      }
    }
    
    return effectId;
  }

  /**
   * 创建环境效果
   */
  public createEnvironmentalEffect(x: number, y: number, effectType: string): string {
    const presetId = `environment_${effectType}`;
    const effectId = this.createEffectFromPreset(presetId, x, y);
    
    if (effectId) {
      const effect = this.effects.get(effectId);
      if (effect) {
        effect.metadata.effectType = effectType;
      }
    }
    
    return effectId;
  }

  /**
   * 创建UI效果
   */
  public createUIEffect(x: number, y: number, uiType: string): string {
    const presetId = `ui_${uiType}`;
    const effectId = this.createEffectFromPreset(presetId, x, y);
    
    if (effectId) {
      const effect = this.effects.get(effectId);
      if (effect) {
        effect.metadata.uiType = uiType;
      }
    }
    
    return effectId;
  }

  /**
   * 创建轨迹效果
   */
  public createTrailEffect(target: any, trailType: string = 'default'): string {
    const presetId = `trail_${trailType}`;
    const effectId = this.createEffectFromPreset(presetId, target.x, target.y);
    
    if (effectId) {
      const effect = this.effects.get(effectId);
      if (effect) {
        effect.metadata.target = target;
        effect.metadata.trailType = trailType;
        
        // 绑定到目标位置
        if (effect.emitter) {
          effect.emitter.setPosition(target.x, target.y);
        }
      }
    }
    
    return effectId;
  }

  /**
   * 更新轨迹效果位置
   */
  public updateTrailEffect(effectId: string, x: number, y: number): void {
    const effect = this.effects.get(effectId);
    if (!effect || !effect.isActive) return;

    if (effect.emitter) {
      effect.emitter.setPosition(x, y);
    }
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
  public stopEffectsByType(type: ParticleType): void {
    this.effects.forEach((effect, effectId) => {
      if (effect.config.type === type && effect.isActive) {
        this.stopEffect(effectId);
      }
    });
  }

  /**
   * 获取活跃效果
   */
  public getActiveEffects(): ParticleEffect[] {
    return Array.from(this.effects.values()).filter(effect => effect.isActive);
  }

  /**
   * 获取效果统计
   */
  public getEffectStats(): ParticleStats {
    return { ...this.stats };
  }

  /**
   * 添加粒子预设
   */
  public addPreset(preset: ParticlePreset): void {
    this.presets.set(preset.id, preset);
    console.log(`添加粒子预设: ${preset.name}`);
  }

  /**
   * 获取粒子预设
   */
  public getPreset(presetId: string): ParticlePreset | undefined {
    return this.presets.get(presetId);
  }

  /**
   * 获取所有预设
   */
  public getAllPresets(): ParticlePreset[] {
    return Array.from(this.presets.values());
  }

  /**
   * 按类型获取预设
   */
  public getPresetsByType(type: ParticleType): ParticlePreset[] {
    return Array.from(this.presets.values()).filter(preset => preset.config.type === type);
  }

  /**
   * 按分类获取预设
   */
  public getPresetsByCategory(category: string): ParticlePreset[] {
    return Array.from(this.presets.values()).filter(preset => preset.category === category);
  }

  /**
   * 搜索预设
   */
  public searchPresets(query: string): ParticlePreset[] {
    const lowerQuery = query.toLowerCase();
    return Array.from(this.presets.values()).filter(preset =>
      preset.name.toLowerCase().includes(lowerQuery) ||
      preset.description.toLowerCase().includes(lowerQuery) ||
      preset.tags.some(tag => tag.toLowerCase().includes(lowerQuery))
    );
  }

  /**
   * 事件处理
   */
  private onCombatAttack(data: any): void {
    const { x, y, damage, isCritical } = data;
    this.createCombatAttackEffect(x, y, damage, isCritical);
  }

  private onItemUsed(data: any): void {
    const { item, x, y } = data;
    if (item.effects) {
      // 根据物品效果创建相应的粒子效果
      item.effects.forEach((effect: any) => {
        if (effect.type === 'heal') {
          this.createHealEffect(x, y, effect.value);
        }
      });
    }
  }

  private onLevelUp(data: any): void {
    const { x, y } = data;
    this.createEffectFromPreset('level_up', x, y);
  }

  private onQuestCompleted(data: any): void {
    const { x, y } = data;
    this.createEffectFromPreset('quest_complete', x, y);
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

    // 更新活跃粒子数量
    let activeParticles = 0;
    this.effects.forEach(effect => {
      if (effect.isActive && effect.emitter) {
        activeParticles += effect.emitter.alive.length();
      }
    });
    this.stats.activeParticles = activeParticles;

    // 检查性能阈值
    if (this.stats.performance.fps < this.config.performanceThreshold) {
      this.optimizePerformance();
    }
  }

  /**
   * 性能优化
   */
  private optimizePerformance(): void {
    console.log('性能优化: 减少粒子效果');
    
    // 停止低优先级的效果
    const lowPriorityEffects = Array.from(this.effects.values())
      .filter(effect => effect.isActive && effect.config.type === 'environment')
      .slice(0, 5);
    
    lowPriorityEffects.forEach(effect => {
      this.stopEffect(effect.id);
    });
  }

  /**
   * 自动清理
   */
  private autoCleanup(): void {
    if (!this.config.enableAutoCleanup) return;

    const now = Date.now();
    const effectsToRemove: string[] = [];

    this.effects.forEach((effect, effectId) => {
      if (!effect.isActive && now - effect.endTime > 30000) { // 30秒后清理
        effectsToRemove.push(effectId);
      }
    });

    effectsToRemove.forEach(effectId => {
      this.effects.delete(effectId);
      this.stats.totalEffects--;
    });
  }

  /**
   * 更新类型统计
   */
  private updateStatsByType(type: ParticleType, delta: number): void {
    this.stats.effectsByType[type] = (this.stats.effectsByType[type] || 0) + delta;
  }

  /**
   * 初始化默认预设
   */
  private initializeDefaultPresets(): void {
    // 战斗效果预设
    this.addPreset({
      id: 'normal_attack',
      name: '普通攻击',
      description: '普通攻击的粒子效果',
      category: 'combat',
      config: {
        id: 'normal_attack',
        name: '普通攻击',
        description: '普通攻击的粒子效果',
        type: 'combat',
        texture: 'sparkle',
        emitter: { type: 'point', x: 0, y: 0 },
        particle: {
          quantity: 10,
          frequency: 50,
          lifespan: 500,
          speed: 100,
          speedVariation: 20,
          angle: 0,
          angleVariation: 360,
          scale: 0.5,
          scaleVariation: 0.2,
          alpha: 1,
          alphaVariation: 0.3,
          tint: 0xffffff,
          tintVariation: 0,
          blendMode: 'ADD',
          gravity: 0,
          bounce: 0,
          friction: 0.98
        },
        lifecycle: { type: 'instant', duration: 500, delay: 0, repeat: 1, repeatDelay: 0 },
        behaviors: ['fade', 'scale'],
        advanced: {}
      },
      tags: ['combat', 'attack', 'normal']
    });

    this.addPreset({
      id: 'critical_attack',
      name: '暴击攻击',
      description: '暴击攻击的粒子效果',
      category: 'combat',
      config: {
        id: 'critical_attack',
        name: '暴击攻击',
        description: '暴击攻击的粒子效果',
        type: 'combat',
        texture: 'sparkle',
        emitter: { type: 'circle', x: 0, y: 0, radius: 20 },
        particle: {
          quantity: 20,
          frequency: 30,
          lifespan: 800,
          speed: 150,
          speedVariation: 30,
          angle: 0,
          angleVariation: 360,
          scale: 0.8,
          scaleVariation: 0.3,
          alpha: 1,
          alphaVariation: 0.2,
          tint: 0xff0000,
          tintVariation: 0x333333,
          blendMode: 'ADD',
          gravity: 0,
          bounce: 0,
          friction: 0.95
        },
        lifecycle: { type: 'instant', duration: 800, delay: 0, repeat: 1, repeatDelay: 0 },
        behaviors: ['fade', 'scale', 'color'],
        advanced: {}
      },
      tags: ['combat', 'attack', 'critical']
    });

    // 治疗效果预设
    this.addPreset({
      id: 'heal',
      name: '治疗效果',
      description: '治疗效果的粒子',
      category: 'magic',
      config: {
        id: 'heal',
        name: '治疗效果',
        description: '治疗效果的粒子',
        type: 'magic',
        texture: 'sparkle',
        emitter: { type: 'point', x: 0, y: 0 },
        particle: {
          quantity: 15,
          frequency: 100,
          lifespan: 1000,
          speed: 50,
          speedVariation: 10,
          angle: 270,
          angleVariation: 30,
          scale: 0.6,
          scaleVariation: 0.2,
          alpha: 1,
          alphaVariation: 0.3,
          tint: 0x00ff00,
          tintVariation: 0x333333,
          blendMode: 'ADD',
          gravity: -50,
          bounce: 0,
          friction: 0.99
        },
        lifecycle: { type: 'instant', duration: 1000, delay: 0, repeat: 1, repeatDelay: 0 },
        behaviors: ['fade', 'scale', 'gravity'],
        advanced: {}
      },
      tags: ['magic', 'heal', 'green']
    });

    // 爆炸效果预设
    this.addPreset({
      id: 'explosion',
      name: '爆炸效果',
      description: '爆炸的粒子效果',
      category: 'explosion',
      config: {
        id: 'explosion',
        name: '爆炸效果',
        description: '爆炸的粒子效果',
        type: 'explosion',
        texture: 'sparkle',
        emitter: { type: 'circle', x: 0, y: 0, radius: 10 },
        particle: {
          quantity: 30,
          frequency: 10,
          lifespan: 1200,
          speed: 200,
          speedVariation: 50,
          angle: 0,
          angleVariation: 360,
          scale: 1,
          scaleVariation: 0.5,
          alpha: 1,
          alphaVariation: 0.4,
          tint: 0xff6600,
          tintVariation: 0x666666,
          blendMode: 'ADD',
          gravity: 0,
          bounce: 0.3,
          friction: 0.9
        },
        lifecycle: { type: 'instant', duration: 1200, delay: 0, repeat: 1, repeatDelay: 0 },
        behaviors: ['fade', 'scale', 'bounce'],
        advanced: {}
      },
      tags: ['explosion', 'fire', 'orange']
    });

    // 升级效果预设
    this.addPreset({
      id: 'level_up',
      name: '升级效果',
      description: '角色升级的粒子效果',
      category: 'ui',
      config: {
        id: 'level_up',
        name: '升级效果',
        description: '角色升级的粒子效果',
        type: 'ui',
        texture: 'sparkle',
        emitter: { type: 'circle', x: 0, y: 0, radius: 30 },
        particle: {
          quantity: 25,
          frequency: 50,
          lifespan: 1500,
          speed: 80,
          speedVariation: 20,
          angle: 270,
          angleVariation: 60,
          scale: 0.7,
          scaleVariation: 0.3,
          alpha: 1,
          alphaVariation: 0.3,
          tint: 0xffff00,
          tintVariation: 0x333333,
          blendMode: 'ADD',
          gravity: -30,
          bounce: 0,
          friction: 0.98
        },
        lifecycle: { type: 'instant', duration: 1500, delay: 0, repeat: 1, repeatDelay: 0 },
        behaviors: ['fade', 'scale', 'gravity'],
        advanced: {}
      },
      tags: ['ui', 'level_up', 'yellow']
    });

    // 任务完成效果预设
    this.addPreset({
      id: 'quest_complete',
      name: '任务完成',
      description: '任务完成的粒子效果',
      category: 'ui',
      config: {
        id: 'quest_complete',
        name: '任务完成',
        description: '任务完成的粒子效果',
        type: 'ui',
        texture: 'sparkle',
        emitter: { type: 'point', x: 0, y: 0 },
        particle: {
          quantity: 20,
          frequency: 100,
          lifespan: 2000,
          speed: 60,
          speedVariation: 15,
          angle: 0,
          angleVariation: 360,
          scale: 0.8,
          scaleVariation: 0.4,
          alpha: 1,
          alphaVariation: 0.4,
          tint: 0x00ffff,
          tintVariation: 0x333333,
          blendMode: 'ADD',
          gravity: 0,
          bounce: 0,
          friction: 0.99
        },
        lifecycle: { type: 'instant', duration: 2000, delay: 0, repeat: 1, repeatDelay: 0 },
        behaviors: ['fade', 'scale'],
        advanced: {}
      },
      tags: ['ui', 'quest', 'cyan']
    });
  }

  /**
   * 添加事件
   */
  private addEvent(type: ParticleEvent['type'], effectId: string, data?: any): void {
    const event: ParticleEvent = {
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
   * 获取粒子事件
   */
  public getParticleEvents(): ParticleEvent[] {
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
    console.log('粒子效果系统已销毁');
  }
}
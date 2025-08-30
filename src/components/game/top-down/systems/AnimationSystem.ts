import * as Phaser from 'phaser';

// 动画类型枚举
export enum AnimationType {
  CHARACTER = 'character',     // 角色动画
  ENVIRONMENT = 'environment', // 环境动画
  EFFECT = 'effect',          // 特效动画
  TRANSITION = 'transition',  // 过场动画
  UI = 'ui'                   // UI动画
}

// 动画状态枚举
export enum AnimationState {
  IDLE = 'idle',              // 空闲
  PLAYING = 'playing',        // 播放中
  PAUSED = 'paused',          // 暂停
  STOPPED = 'stopped',        // 停止
  COMPLETED = 'completed'     // 完成
}

// 动画循环模式枚举
export enum LoopMode {
  NONE = 'none',              // 不循环
  LOOP = 'loop',              // 循环
  PING_PONG = 'ping_pong',    // 往返循环
  REPEAT = 'repeat'           // 重复指定次数
}

// 缓动函数类型
export enum EaseType {
  LINEAR = 'linear',
  QUAD_IN = 'quadIn',
  QUAD_OUT = 'quadOut',
  QUAD_IN_OUT = 'quadInOut',
  CUBIC_IN = 'cubicIn',
  CUBIC_OUT = 'cubicOut',
  CUBIC_IN_OUT = 'cubicInOut',
  ELASTIC_IN = 'elasticIn',
  ELASTIC_OUT = 'elasticOut',
  ELASTIC_IN_OUT = 'elasticInOut',
  BOUNCE_IN = 'bounceIn',
  BOUNCE_OUT = 'bounceOut',
  BOUNCE_IN_OUT = 'bounceInOut'
}

// 动画帧接口
export interface AnimationFrame {
  index: number;
  duration: number;
  x?: number;
  y?: number;
  scale?: number;
  rotation?: number;
  alpha?: number;
  tint?: number;
  callback?: () => void;
}

// 动画配置接口
export interface AnimationConfig {
  key: string;
  type: AnimationType;
  frames: AnimationFrame[];
  frameRate: number;
  loop: LoopMode;
  repeatCount?: number;
  yoyo?: boolean;
  onStart?: () => void;
  onUpdate?: (progress: number) => void;
  onComplete?: () => void;
  onRepeat?: () => void;
}

// 角色动画配置
export interface CharacterAnimationConfig extends AnimationConfig {
  type: AnimationType.CHARACTER;
  // 角色特定属性
  direction?: 'up' | 'down' | 'left' | 'right';
  isMoving?: boolean;
  isAttacking?: boolean;
  isCasting?: boolean;
  isDead?: boolean;
}

// 环境动画配置
export interface EnvironmentAnimationConfig extends AnimationConfig {
  type: AnimationType.ENVIRONMENT;
  // 环境特定属性
  weather?: 'rain' | 'snow' | 'wind' | 'sunny';
  timeOfDay?: 'morning' | 'afternoon' | 'evening' | 'night';
  season?: 'spring' | 'summer' | 'autumn' | 'winter';
}

// 特效动画配置
export interface EffectAnimationConfig extends AnimationConfig {
  type: AnimationType.EFFECT;
  // 特效特定属性
  effectType?: 'explosion' | 'magic' | 'heal' | 'damage' | 'buff' | 'debuff';
  intensity?: number;
  radius?: number;
  color?: number;
  particles?: boolean;
}

// 过场动画配置
export interface TransitionAnimationConfig extends AnimationConfig {
  type: AnimationType.TRANSITION;
  // 过场特定属性
  transitionType?: 'fade' | 'slide' | 'zoom' | 'dissolve' | 'wipe';
  direction?: 'in' | 'out';
  duration: number;
  ease?: EaseType;
}

// 动画实例接口
export interface AnimationInstance {
  id: string;
  config: AnimationConfig;
  state: AnimationState;
  currentFrame: number;
  progress: number;
  elapsedTime: number;
  sprite?: Phaser.GameObjects.Sprite;
  timeline?: Phaser.Tweens.Timeline;
  onComplete?: () => void;
}

// 动画事件接口
export interface AnimationEvent {
  type: string;
  animationId: string;
  config: AnimationConfig;
  data?: any;
  timestamp: number;
}

export class AnimationSystem {
  private scene: Phaser.Scene;
  private animations: Map<string, AnimationInstance>;
  private eventListeners: Map<string, Function[]>;
  private frameRate: number;
  private globalSpeed: number;
  private isPaused: boolean;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.animations = new Map();
    this.eventListeners = new Map();
    this.frameRate = 60;
    this.globalSpeed = 1.0;
    this.isPaused = false;

    this.initializeAnimations();
    this.setupEventListeners();
  }

  /**
   * 初始化默认动画
   */
  private initializeAnimations(): void {
    // 初始化角色动画
    this.initializeCharacterAnimations();
    
    // 初始化环境动画
    this.initializeEnvironmentAnimations();
    
    // 初始化特效动画
    this.initializeEffectAnimations();
    
    // 初始化过场动画
    this.initializeTransitionAnimations();
  }

  /**
   * 初始化角色动画
   */
  private initializeCharacterAnimations(): void {
    // 角色空闲动画
    this.createAnimation({
      key: 'player_idle',
      type: AnimationType.CHARACTER,
      frames: [
        { index: 0, duration: 1000 },
        { index: 1, duration: 1000 },
        { index: 2, duration: 1000 },
        { index: 1, duration: 1000 }
      ],
      frameRate: 4,
      loop: LoopMode.LOOP
    });

    // 角色移动动画
    this.createAnimation({
      key: 'player_walk',
      type: AnimationType.CHARACTER,
      frames: [
        { index: 3, duration: 200 },
        { index: 4, duration: 200 },
        { index: 5, duration: 200 },
        { index: 6, duration: 200 }
      ],
      frameRate: 8,
      loop: LoopMode.LOOP
    });

    // 角色攻击动画
    this.createAnimation({
      key: 'player_attack',
      type: AnimationType.CHARACTER,
      frames: [
        { index: 7, duration: 150 },
        { index: 8, duration: 150 },
        { index: 9, duration: 300 },
        { index: 10, duration: 150 }
      ],
      frameRate: 8,
      loop: LoopMode.NONE
    });

    // 角色施法动画
    this.createAnimation({
      key: 'player_cast',
      type: AnimationType.CHARACTER,
      frames: [
        { index: 11, duration: 200 },
        { index: 12, duration: 200 },
        { index: 13, duration: 400 },
        { index: 14, duration: 200 }
      ],
      frameRate: 6,
      loop: LoopMode.NONE
    });

    // 角色死亡动画
    this.createAnimation({
      key: 'player_death',
      type: AnimationType.CHARACTER,
      frames: [
        { index: 15, duration: 300 },
        { index: 16, duration: 300 },
        { index: 17, duration: 300 },
        { index: 18, duration: 500 }
      ],
      frameRate: 4,
      loop: LoopMode.NONE
    });
  }

  /**
   * 初始化环境动画
   */
  private initializeEnvironmentAnimations(): void {
    // 下雨动画
    this.createAnimation({
      key: 'rain',
      type: AnimationType.ENVIRONMENT,
      frames: [
        { index: 0, duration: 100, y: -2 },
        { index: 1, duration: 100, y: -4 },
        { index: 2, duration: 100, y: -6 }
      ],
      frameRate: 10,
      loop: LoopMode.LOOP
    });

    // 下雪动画
    this.createAnimation({
      key: 'snow',
      type: AnimationType.ENVIRONMENT,
      frames: [
        { index: 3, duration: 200, y: -1, x: 0.5 },
        { index: 4, duration: 200, y: -2, x: -0.5 },
        { index: 5, duration: 200, y: -3, x: 1 }
      ],
      frameRate: 5,
      loop: LoopMode.LOOP
    });

    // 风吹动画
    this.createAnimation({
      key: 'wind',
      type: AnimationType.ENVIRONMENT,
      frames: [
        { index: 6, duration: 500, x: 2 },
        { index: 7, duration: 500, x: 4 },
        { index: 8, duration: 500, x: 2 }
      ],
      frameRate: 2,
      loop: LoopMode.LOOP
    });

    // 昼夜循环动画
    this.createAnimation({
      key: 'day_night_cycle',
      type: AnimationType.ENVIRONMENT,
      frames: [
        { index: 9, duration: 60000, alpha: 1.0 },   // 白天
        { index: 10, duration: 30000, alpha: 0.7 },  // 黄昏
        { index: 11, duration: 60000, alpha: 0.3 },  // 夜晚
        { index: 12, duration: 30000, alpha: 0.7 }   // 黎明
      ],
      frameRate: 1,
      loop: LoopMode.LOOP
    });
  }

  /**
   * 初始化特效动画
   */
  private initializeEffectAnimations(): void {
    // 爆炸特效
    this.createAnimation({
      key: 'explosion',
      type: AnimationType.EFFECT,
      frames: [
        { index: 0, duration: 100, scale: 0.5 },
        { index: 1, duration: 100, scale: 1.0 },
        { index: 2, duration: 100, scale: 1.5 },
        { index: 3, duration: 200, scale: 2.0, alpha: 0.8 },
        { index: 4, duration: 200, scale: 2.5, alpha: 0.6 },
        { index: 5, duration: 300, scale: 3.0, alpha: 0.4 }
      ],
      frameRate: 8,
      loop: LoopMode.NONE
    });

    // 治疗特效
    this.createAnimation({
      key: 'heal',
      type: AnimationType.EFFECT,
      frames: [
        { index: 6, duration: 200, y: 0, alpha: 0.8 },
        { index: 7, duration: 200, y: -10, alpha: 1.0 },
        { index: 8, duration: 200, y: -20, alpha: 0.8 },
        { index: 9, duration: 200, y: -30, alpha: 0.6 },
        { index: 10, duration: 200, y: -40, alpha: 0.4 }
      ],
      frameRate: 6,
      loop: LoopMode.NONE
    });

    // 魔法特效
    this.createAnimation({
      key: 'magic',
      type: AnimationType.EFFECT,
      frames: [
        { index: 11, duration: 150, rotation: 0, scale: 0.8 },
        { index: 12, duration: 150, rotation: 0.5, scale: 1.0 },
        { index: 13, duration: 150, rotation: 1.0, scale: 1.2 },
        { index: 14, duration: 150, rotation: 1.5, scale: 1.0 },
        { index: 15, duration: 150, rotation: 2.0, scale: 0.8 }
      ],
      frameRate: 8,
      loop: LoopMode.LOOP
    });

    // 伤害数字
    this.createAnimation({
      key: 'damage_number',
      type: AnimationType.EFFECT,
      frames: [
        { index: 16, duration: 200, y: 0, alpha: 1.0, scale: 1.0 },
        { index: 17, duration: 200, y: -10, alpha: 1.0, scale: 1.2 },
        { index: 18, duration: 200, y: -20, alpha: 0.8, scale: 1.0 },
        { index: 19, duration: 200, y: -30, alpha: 0.6, scale: 0.8 }
      ],
      frameRate: 6,
      loop: LoopMode.NONE
    });
  }

  /**
   * 初始化过场动画
   */
  private initializeTransitionAnimations(): void {
    // 淡入淡出
    this.createAnimation({
      key: 'fade_in',
      type: AnimationType.TRANSITION,
      frames: [
        { index: 0, duration: 500, alpha: 0.0 },
        { index: 1, duration: 500, alpha: 1.0 }
      ],
      frameRate: 2,
      loop: LoopMode.NONE,
      duration: 1000,
      ease: EaseType.QUAD_IN_OUT
    });

    this.createAnimation({
      key: 'fade_out',
      type: AnimationType.TRANSITION,
      frames: [
        { index: 0, duration: 500, alpha: 1.0 },
        { index: 1, duration: 500, alpha: 0.0 }
      ],
      frameRate: 2,
      loop: LoopMode.NONE,
      duration: 1000,
      ease: EaseType.QUAD_IN_OUT
    });

    // 滑动过场
    this.createAnimation({
      key: 'slide_in_left',
      type: AnimationType.TRANSITION,
      frames: [
        { index: 0, duration: 300, x: -800 },
        { index: 1, duration: 300, x: 0 }
      ],
      frameRate: 4,
      loop: LoopMode.NONE,
      duration: 600,
      ease: EaseType.CUBIC_OUT
    });

    this.createAnimation({
      key: 'slide_out_right',
      type: AnimationType.TRANSITION,
      frames: [
        { index: 0, duration: 300, x: 0 },
        { index: 1, duration: 300, x: 800 }
      ],
      frameRate: 4,
      loop: LoopMode.NONE,
      duration: 600,
      ease: EaseType.CUBIC_IN
    });

    // 缩放过场
    this.createAnimation({
      key: 'zoom_in',
      type: AnimationType.TRANSITION,
      frames: [
        { index: 0, duration: 400, scale: 0.0 },
        { index: 1, duration: 400, scale: 1.0 }
      ],
      frameRate: 3,
      loop: LoopMode.NONE,
      duration: 800,
      ease: EaseType.BOUNCE_OUT
    });

    this.createAnimation({
      key: 'zoom_out',
      type: AnimationType.TRANSITION,
      frames: [
        { index: 0, duration: 400, scale: 1.0 },
        { index: 1, duration: 400, scale: 0.0 }
      ],
      frameRate: 3,
      loop: LoopMode.NONE,
      duration: 800,
      ease: EaseType.BOUNCE_IN
    });
  }

  /**
   * 设置事件监听器
   */
  private setupEventListeners(): void {
    // 监听游戏事件
    this.scene.events.on('character_moved', this.handleCharacterMoved, this);
    this.scene.events.on('character_attacked', this.handleCharacterAttacked, this);
    this.scene.events.on('character_cast', this.handleCharacterCast, this);
    this.scene.events.on('character_died', this.handleCharacterDied, this);
    this.scene.events.on('weather_changed', this.handleWeatherChanged, this);
    this.scene.events.on('time_changed', this.handleTimeChanged, this);
    this.scene.events.on('effect_triggered', this.handleEffectTriggered, this);
    this.scene.events.on('transition_started', this.handleTransitionStarted, this);
  }

  /**
   * 创建动画
   */
  public createAnimation(config: AnimationConfig): string {
    const animationId = `${config.key}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const animation: AnimationInstance = {
      id: animationId,
      config,
      state: AnimationState.IDLE,
      currentFrame: 0,
      progress: 0,
      elapsedTime: 0
    };

    this.animations.set(animationId, animation);
    this.emitEvent('animation_created', { animationId, config });
    
    return animationId;
  }

  /**
   * 播放动画
   */
  public playAnimation(animationId: string, sprite?: Phaser.GameObjects.Sprite, onComplete?: () => void): boolean {
    const animation = this.animations.get(animationId);
    if (!animation) {
      console.error('动画不存在:', animationId);
      return false;
    }

    animation.state = AnimationState.PLAYING;
    animation.currentFrame = 0;
    animation.progress = 0;
    animation.elapsedTime = 0;
    animation.sprite = sprite;
    animation.onComplete = onComplete;

    // 创建时间轴
    if (sprite && animation.config.type === AnimationType.TRANSITION) {
      this.createTimelineAnimation(animation);
    }

    this.emitEvent('animation_started', { animationId, config: animation.config });
    
    if (animation.config.onStart) {
      animation.config.onStart();
    }

    return true;
  }

  /**
   * 创建时间轴动画（用于过场动画）
   */
  private createTimelineAnimation(animation: AnimationInstance): void {
    if (!animation.sprite) return;

    const config = animation.config as TransitionAnimationConfig;
    const timeline = this.scene.tweens.createTimeline();

    // 根据过场类型创建不同的动画
    switch (config.transitionType) {
      case 'fade':
        timeline.add({
          targets: animation.sprite,
          alpha: config.direction === 'in' ? 1 : 0,
          duration: config.duration,
          ease: config.ease || EaseType.LINEAR
        });
        break;

      case 'slide':
        const startX = config.direction === 'in' ? -800 : 0;
        const endX = config.direction === 'in' ? 0 : 800;
        timeline.add({
          targets: animation.sprite,
          x: { from: startX, to: endX },
          duration: config.duration,
          ease: config.ease || EaseType.CUBIC_OUT
        });
        break;

      case 'zoom':
        const startScale = config.direction === 'in' ? 0 : 1;
        const endScale = config.direction === 'in' ? 1 : 0;
        timeline.add({
          targets: animation.sprite,
          scale: { from: startScale, to: endScale },
          duration: config.duration,
          ease: config.ease || EaseType.BOUNCE_OUT
        });
        break;
    }

    timeline.on('complete', () => {
      animation.state = AnimationState.COMPLETED;
      this.emitEvent('animation_completed', { animationId: animation.id, config: animation.config });
      
      if (animation.onComplete) {
        animation.onComplete();
      }
      
      if (animation.config.onComplete) {
        animation.config.onComplete();
      }
    });

    animation.timeline = timeline;
    timeline.play();
  }

  /**
   * 暂停动画
   */
  public pauseAnimation(animationId: string): boolean {
    const animation = this.animations.get(animationId);
    if (!animation || animation.state !== AnimationState.PLAYING) {
      return false;
    }

    animation.state = AnimationState.PAUSED;
    
    if (animation.timeline) {
      animation.timeline.pause();
    }

    this.emitEvent('animation_paused', { animationId, config: animation.config });
    return true;
  }

  /**
   * 恢复动画
   */
  public resumeAnimation(animationId: string): boolean {
    const animation = this.animations.get(animationId);
    if (!animation || animation.state !== AnimationState.PAUSED) {
      return false;
    }

    animation.state = AnimationState.PLAYING;
    
    if (animation.timeline) {
      animation.timeline.resume();
    }

    this.emitEvent('animation_resumed', { animationId, config: animation.config });
    return true;
  }

  /**
   * 停止动画
   */
  public stopAnimation(animationId: string): boolean {
    const animation = this.animations.get(animationId);
    if (!animation) {
      return false;
    }

    animation.state = AnimationState.STOPPED;
    
    if (animation.timeline) {
      animation.timeline.stop();
    }

    this.emitEvent('animation_stopped', { animationId, config: animation.config });
    return true;
  }

  /**
   * 设置动画速度
   */
  public setAnimationSpeed(animationId: string, speed: number): boolean {
    const animation = this.animations.get(animationId);
    if (!animation) {
      return false;
    }

    if (animation.timeline) {
      animation.timeline.timeScale = speed;
    }

    this.emitEvent('animation_speed_changed', { animationId, speed, config: animation.config });
    return true;
  }

  /**
   * 设置全局动画速度
   */
  public setGlobalSpeed(speed: number): void {
    this.globalSpeed = Math.max(0, speed);
    
    // 更新所有正在播放的动画
    for (const [animationId, animation] of this.animations) {
      if (animation.state === AnimationState.PLAYING && animation.timeline) {
        animation.timeline.timeScale = this.globalSpeed;
      }
    }

    this.emitEvent('global_speed_changed', { speed: this.globalSpeed });
  }

  /**
   * 暂停所有动画
   */
  public pauseAllAnimations(): void {
    this.isPaused = true;
    
    for (const [animationId, animation] of this.animations) {
      if (animation.state === AnimationState.PLAYING) {
        this.pauseAnimation(animationId);
      }
    }

    this.emitEvent('all_animations_paused', {});
  }

  /**
   * 恢复所有动画
   */
  public resumeAllAnimations(): void {
    this.isPaused = false;
    
    for (const [animationId, animation] of this.animations) {
      if (animation.state === AnimationState.PAUSED) {
        this.resumeAnimation(animationId);
      }
    }

    this.emitEvent('all_animations_resumed', {});
  }

  /**
   * 停止所有动画
   */
  public stopAllAnimations(): void {
    for (const [animationId, animation] of this.animations) {
      if (animation.state === AnimationState.PLAYING || animation.state === AnimationState.PAUSED) {
        this.stopAnimation(animationId);
      }
    }

    this.emitEvent('all_animations_stopped', {});
  }

  /**
   * 获取动画状态
   */
  public getAnimationState(animationId: string): AnimationState | null {
    const animation = this.animations.get(animationId);
    return animation ? animation.state : null;
  }

  /**
   * 获取动画进度
   */
  public getAnimationProgress(animationId: string): number {
    const animation = this.animations.get(animationId);
    return animation ? animation.progress : 0;
  }

  /**
   * 事件处理器
   */
  private handleCharacterMoved = (data: any): void => {
    const { characterId, direction, isMoving } = data;
    
    if (isMoving) {
      this.playAnimation('player_walk', data.sprite);
    } else {
      this.playAnimation('player_idle', data.sprite);
    }
  };

  private handleCharacterAttacked = (data: any): void => {
    this.playAnimation('player_attack', data.sprite, () => {
      // 攻击动画完成后播放空闲动画
      this.playAnimation('player_idle', data.sprite);
    });
  };

  private handleCharacterCast = (data: any): void => {
    this.playAnimation('player_cast', data.sprite, () => {
      // 施法动画完成后播放空闲动画
      this.playAnimation('player_idle', data.sprite);
    });
  };

  private handleCharacterDied = (data: any): void => {
    this.playAnimation('player_death', data.sprite);
  };

  private handleWeatherChanged = (data: any): void => {
    const { weather } = data;
    
    // 停止当前天气动画
    this.stopAllAnimations();
    
    // 播放新的天气动画
    switch (weather) {
      case 'rain':
        this.playAnimation('rain', data.sprite);
        break;
      case 'snow':
        this.playAnimation('snow', data.sprite);
        break;
      case 'wind':
        this.playAnimation('wind', data.sprite);
        break;
    }
  };

  private handleTimeChanged = (data: any): void => {
    const { timeOfDay } = data;
    
    // 更新昼夜循环动画
    this.playAnimation('day_night_cycle', data.sprite);
  };

  private handleEffectTriggered = (data: any): void => {
    const { effectType, position } = data;
    
    let animationKey = '';
    switch (effectType) {
      case 'explosion':
        animationKey = 'explosion';
        break;
      case 'heal':
        animationKey = 'heal';
        break;
      case 'magic':
        animationKey = 'magic';
        break;
      case 'damage':
        animationKey = 'damage_number';
        break;
    }
    
    if (animationKey) {
      this.playAnimation(animationKey, data.sprite);
    }
  };

  private handleTransitionStarted = (data: any): void => {
    const { transitionType, direction } = data;
    
    const animationKey = `${transitionType}_${direction}`;
    this.playAnimation(animationKey, data.sprite, data.onComplete);
  };

  /**
   * 注册事件监听器
   */
  public on(event: string, callback: (event: AnimationEvent) => void): void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, []);
    }
    this.eventListeners.get(event)!.push(callback);
  }

  /**
   * 移除事件监听器
   */
  public off(event: string, callback: (event: AnimationEvent) => void): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      const index = listeners.indexOf(callback);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    }
  }

  /**
   * 发出事件
   */
  private emitEvent(type: string, data: Partial<AnimationEvent>): void {
    const event: AnimationEvent = {
      type,
      animationId: data.animationId!,
      config: data.config!,
      data: data.data,
      timestamp: Date.now()
    };

    const listeners = this.eventListeners.get(type);
    if (listeners) {
      listeners.forEach(callback => callback(event));
    }
  }

  /**
   * 更新系统
   */
  public update(time: number, delta: number): void {
    if (this.isPaused) return;

    // 更新所有正在播放的动画
    for (const [animationId, animation] of this.animations) {
      if (animation.state === AnimationState.PLAYING) {
        this.updateAnimation(animation, delta);
      }
    }
  }

  /**
   * 更新单个动画
   */
  private updateAnimation(animation: AnimationInstance, delta: number): void {
    const config = animation.config;
    const adjustedDelta = delta * this.globalSpeed;
    
    animation.elapsedTime += adjustedDelta;
    
    // 计算当前帧
    const totalDuration = config.frames.reduce((sum, frame) => sum + frame.duration, 0);
    const currentTime = animation.elapsedTime % totalDuration;
    
    let accumulatedTime = 0;
    for (let i = 0; i < config.frames.length; i++) {
      const frame = config.frames[i];
      accumulatedTime += frame.duration;
      
      if (currentTime <= accumulatedTime) {
        if (animation.currentFrame !== i) {
          animation.currentFrame = i;
          this.applyFrame(animation, frame);
        }
        break;
      }
    }
    
    // 更新进度
    animation.progress = (animation.elapsedTime / totalDuration) % 1;
    
    // 检查循环
    if (animation.elapsedTime >= totalDuration) {
      this.handleAnimationLoop(animation);
    }
    
    // 调用更新回调
    if (config.onUpdate) {
      config.onUpdate(animation.progress);
    }
  }

  /**
   * 应用动画帧
   */
  private applyFrame(animation: AnimationInstance, frame: AnimationFrame): void {
    if (!animation.sprite) return;
    
    // 应用帧属性
    if (frame.x !== undefined) animation.sprite.x += frame.x;
    if (frame.y !== undefined) animation.sprite.y += frame.y;
    if (frame.scale !== undefined) animation.sprite.setScale(frame.scale);
    if (frame.rotation !== undefined) animation.sprite.rotation = frame.rotation;
    if (frame.alpha !== undefined) animation.sprite.alpha = frame.alpha;
    if (frame.tint !== undefined) animation.sprite.setTint(frame.tint);
    
    // 执行帧回调
    if (frame.callback) {
      frame.callback();
    }
  }

  /**
   * 处理动画循环
   */
  private handleAnimationLoop(animation: AnimationInstance): void {
    const config = animation.config;
    
    switch (config.loop) {
      case LoopMode.NONE:
        animation.state = AnimationState.COMPLETED;
        this.emitEvent('animation_completed', { animationId: animation.id, config });
        
        if (animation.onComplete) {
          animation.onComplete();
        }
        
        if (config.onComplete) {
          config.onComplete();
        }
        break;
        
      case LoopMode.LOOP:
        animation.elapsedTime = 0;
        animation.currentFrame = 0;
        animation.progress = 0;
        
        if (config.onRepeat) {
          config.onRepeat();
        }
        break;
        
      case LoopMode.PING_PONG:
        // 实现往返循环逻辑
        break;
        
      case LoopMode.REPEAT:
        if (config.repeatCount && config.repeatCount > 0) {
          config.repeatCount--;
          animation.elapsedTime = 0;
          animation.currentFrame = 0;
          animation.progress = 0;
        } else {
          animation.state = AnimationState.COMPLETED;
          this.emitEvent('animation_completed', { animationId: animation.id, config });
          
          if (animation.onComplete) {
            animation.onComplete();
          }
          
          if (config.onComplete) {
            config.onComplete();
          }
        }
        break;
    }
  }

  /**
   * 销毁系统
   */
  public destroy(): void {
    // 停止所有动画
    this.stopAllAnimations();
    
    // 移除事件监听器
    this.scene.events.off('character_moved', this.handleCharacterMoved, this);
    this.scene.events.off('character_attacked', this.handleCharacterAttacked, this);
    this.scene.events.off('character_cast', this.handleCharacterCast, this);
    this.scene.events.off('character_died', this.handleCharacterDied, this);
    this.scene.events.off('weather_changed', this.handleWeatherChanged, this);
    this.scene.events.off('time_changed', this.handleTimeChanged, this);
    this.scene.events.off('effect_triggered', this.handleEffectTriggered, this);
    this.scene.events.off('transition_started', this.handleTransitionStarted, this);

    // 清理数据
    this.animations.clear();
    this.eventListeners.clear();
  }
}
import * as Phaser from 'phaser';

/**
 * 动画管理器类
 * 参考top-down-react-phaser-game的动画处理方式
 * 统一管理游戏中的所有动画，包括角色、作物、UI等
 */
export class AnimationManager {
  private scene: Phaser.Scene;
  private animationConfigs: Map<string, Phaser.Types.Animations.Animation> = new Map();
  private activeAnimations: Map<string, Phaser.GameObjects.GameObject[]> = new Map();

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.setupAnimations();
  }

  /**
   * 设置所有动画配置
   */
  private setupAnimations(): void {
    this.setupCatAnimations();
    this.setupCropAnimations();
    this.setupUIAnimations();
    this.setupEffectAnimations();
  }

  /**
   * 设置小猫动画
   */
  private setupCatAnimations(): void {
    const catAnimations = [
      {
        key: 'cat_idle_down',
        frames: this.scene.anims.generateFrameNumbers('cat_spritesheet', { start: 0, end: 3 }),
        frameRate: 4,
        repeat: -1
      },
      {
        key: 'cat_idle_up',
        frames: this.scene.anims.generateFrameNumbers('cat_spritesheet', { start: 4, end: 7 }),
        frameRate: 4,
        repeat: -1
      },
      {
        key: 'cat_idle_left',
        frames: this.scene.anims.generateFrameNumbers('cat_spritesheet', { start: 8, end: 11 }),
        frameRate: 4,
        repeat: -1
      },
      {
        key: 'cat_idle_right',
        frames: this.scene.anims.generateFrameNumbers('cat_spritesheet', { start: 12, end: 15 }),
        frameRate: 4,
        repeat: -1
      },
      {
        key: 'cat_walk_down',
        frames: this.scene.anims.generateFrameNumbers('cat_spritesheet', { start: 16, end: 23 }),
        frameRate: 12,
        repeat: -1
      },
      {
        key: 'cat_walk_up',
        frames: this.scene.anims.generateFrameNumbers('cat_spritesheet', { start: 24, end: 31 }),
        frameRate: 12,
        repeat: -1
      },
      {
        key: 'cat_walk_left',
        frames: this.scene.anims.generateFrameNumbers('cat_spritesheet', { start: 32, end: 39 }),
        frameRate: 12,
        repeat: -1
      },
      {
        key: 'cat_walk_right',
        frames: this.scene.anims.generateFrameNumbers('cat_spritesheet', { start: 40, end: 47 }),
        frameRate: 12,
        repeat: -1
      },
      {
        key: 'cat_action',
        frames: this.scene.anims.generateFrameNumbers('cat_spritesheet', { start: 48, end: 55 }),
        frameRate: 8,
        repeat: 0
      },
      {
        key: 'cat_happy',
        frames: this.scene.anims.generateFrameNumbers('cat_spritesheet', { start: 56, end: 63 }),
        frameRate: 6,
        repeat: 2
      }
    ];

    this.createAnimations(catAnimations);
  }

  /**
   * 设置作物动画
   */
  private setupCropAnimations(): void {
    const crops = ['carrot', 'tomato', 'wheat', 'corn', 'strawberry', 'lettuce', 'potato', 'pumpkin'];
    
    crops.forEach(cropType => {
      // 生长阶段动画
      const growthStages = [
        {
          key: `${cropType}_seed`,
          frames: [{ key: `${cropType}_stages`, frame: 0 }],
          frameRate: 1,
          repeat: 0
        },
        {
          key: `${cropType}_sprout`,
          frames: [{ key: `${cropType}_stages`, frame: 1 }],
          frameRate: 1,
          repeat: 0
        },
        {
          key: `${cropType}_growing`,
          frames: this.scene.anims.generateFrameNumbers(`${cropType}_stages`, { start: 2, end: 3 }),
          frameRate: 2,
          repeat: -1
        },
        {
          key: `${cropType}_mature`,
          frames: this.scene.anims.generateFrameNumbers(`${cropType}_stages`, { start: 4, end: 5 }),
          frameRate: 1,
          repeat: -1
        },
        {
          key: `${cropType}_withered`,
          frames: [{ key: `${cropType}_stages`, frame: 6 }],
          frameRate: 1,
          repeat: 0
        }
      ];

      this.createAnimations(growthStages);

      // 收获动画
      const harvestAnim = {
        key: `${cropType}_harvest`,
        frames: this.scene.anims.generateFrameNumbers(`${cropType}_harvest`, { start: 0, end: 7 }),
        frameRate: 12,
        repeat: 0
      };

      this.createAnimation(harvestAnim);
    });
  }

  /**
   * 设置UI动画
   */
  private setupUIAnimations(): void {
    const uiAnimations = [
      {
        key: 'button_hover',
        frames: this.scene.anims.generateFrameNumbers('ui_button', { start: 0, end: 2 }),
        frameRate: 6,
        repeat: 0
      },
      {
        key: 'button_click',
        frames: this.scene.anims.generateFrameNumbers('ui_button', { start: 3, end: 5 }),
        frameRate: 12,
        repeat: 0
      },
      {
        key: 'inventory_open',
        frames: this.scene.anims.generateFrameNumbers('inventory_panel', { start: 0, end: 4 }),
        frameRate: 15,
        repeat: 0
      },
      {
        key: 'inventory_close',
        frames: this.scene.anims.generateFrameNumbers('inventory_panel', { start: 4, end: 0 }),
        frameRate: 15,
        repeat: 0
      },
      {
        key: 'notification_appear',
        frames: this.scene.anims.generateFrameNumbers('notification', { start: 0, end: 3 }),
        frameRate: 10,
        repeat: 0
      },
      {
        key: 'notification_disappear',
        frames: this.scene.anims.generateFrameNumbers('notification', { start: 3, end: 0 }),
        frameRate: 10,
        repeat: 0
      }
    ];

    this.createAnimations(uiAnimations);
  }

  /**
   * 设置特效动画
   */
  private setupEffectAnimations(): void {
    const effectAnimations = [
      {
        key: 'water_splash',
        frames: this.scene.anims.generateFrameNumbers('water_effect', { start: 0, end: 7 }),
        frameRate: 16,
        repeat: 0
      },
      {
        key: 'fertilizer_sparkle',
        frames: this.scene.anims.generateFrameNumbers('fertilizer_effect', { start: 0, end: 11 }),
        frameRate: 20,
        repeat: 0
      },
      {
        key: 'harvest_glow',
        frames: this.scene.anims.generateFrameNumbers('harvest_effect', { start: 0, end: 9 }),
        frameRate: 15,
        repeat: 0
      },
      {
        key: 'cooking_steam',
        frames: this.scene.anims.generateFrameNumbers('cooking_effect', { start: 0, end: 15 }),
        frameRate: 12,
        repeat: -1
      },
      {
        key: 'level_up',
        frames: this.scene.anims.generateFrameNumbers('levelup_effect', { start: 0, end: 19 }),
        frameRate: 20,
        repeat: 0
      },
      {
        key: 'coin_collect',
        frames: this.scene.anims.generateFrameNumbers('coin_effect', { start: 0, end: 7 }),
        frameRate: 16,
        repeat: 0
      }
    ];

    this.createAnimations(effectAnimations);
  }

  /**
   * 创建单个动画
   */
  private createAnimation(config: any): void {
    try {
      if (!this.scene.anims.exists(config.key)) {
        this.scene.anims.create(config);
        this.animationConfigs.set(config.key, config);
        console.log(`Animation created: ${config.key}`);
      }
    } catch (error) {
      console.warn(`Failed to create animation ${config.key}:`, error);
    }
  }

  /**
   * 批量创建动画
   */
  private createAnimations(configs: any[]): void {
    configs.forEach(config => this.createAnimation(config));
  }

  /**
   * 播放动画
   */
  public playAnimation(gameObject: Phaser.GameObjects.GameObject, animationKey: string, ignoreIfPlaying: boolean = false): boolean {
    try {
      if (gameObject instanceof Phaser.GameObjects.Sprite) {
        if (this.scene.anims.exists(animationKey)) {
          gameObject.play(animationKey, ignoreIfPlaying);
          this.trackAnimation(animationKey, gameObject);
          return true;
        } else {
          console.warn(`Animation ${animationKey} does not exist`);
        }
      }
    } catch (error) {
      console.error(`Failed to play animation ${animationKey}:`, error);
    }
    return false;
  }

  /**
   * 播放动画链（连续播放多个动画）
   */
  public playAnimationChain(gameObject: Phaser.GameObjects.GameObject, animationKeys: string[], delay: number = 0): void {
    if (animationKeys.length === 0) return;

    const playNext = (index: number) => {
      if (index >= animationKeys.length) return;

      const currentKey = animationKeys[index];
      this.playAnimation(gameObject, currentKey);

      if (gameObject instanceof Phaser.GameObjects.Sprite) {
        gameObject.once('animationcomplete-' + currentKey, () => {
          if (index + 1 < animationKeys.length) {
            if (delay > 0) {
              this.scene.time.delayedCall(delay, () => playNext(index + 1));
            } else {
              playNext(index + 1);
            }
          }
        });
      }
    };

    playNext(0);
  }

  /**
   * 停止动画
   */
  public stopAnimation(gameObject: Phaser.GameObjects.GameObject): void {
    if (gameObject instanceof Phaser.GameObjects.Sprite) {
      gameObject.stop();
      this.untrackAnimation(gameObject);
    }
  }

  /**
   * 暂停动画
   */
  public pauseAnimation(gameObject: Phaser.GameObjects.GameObject): void {
    if (gameObject instanceof Phaser.GameObjects.Sprite && gameObject.anims.isPlaying) {
      gameObject.anims.pause();
    }
  }

  /**
   * 恢复动画
   */
  public resumeAnimation(gameObject: Phaser.GameObjects.GameObject): void {
    if (gameObject instanceof Phaser.GameObjects.Sprite && gameObject.anims.isPaused) {
      gameObject.anims.resume();
    }
  }

  /**
   * 设置动画速度
   */
  public setAnimationSpeed(gameObject: Phaser.GameObjects.GameObject, speed: number): void {
    if (gameObject instanceof Phaser.GameObjects.Sprite && gameObject.anims.currentAnim) {
      gameObject.anims.timeScale = speed;
    }
  }

  /**
   * 跟踪活跃动画
   */
  private trackAnimation(animationKey: string, gameObject: Phaser.GameObjects.GameObject): void {
    if (!this.activeAnimations.has(animationKey)) {
      this.activeAnimations.set(animationKey, []);
    }
    const objects = this.activeAnimations.get(animationKey)!;
    if (!objects.includes(gameObject)) {
      objects.push(gameObject);
    }
  }

  /**
   * 取消跟踪动画
   */
  private untrackAnimation(gameObject: Phaser.GameObjects.GameObject): void {
    this.activeAnimations.forEach((objects, key) => {
      const index = objects.indexOf(gameObject);
      if (index !== -1) {
        objects.splice(index, 1);
        if (objects.length === 0) {
          this.activeAnimations.delete(key);
        }
      }
    });
  }

  /**
   * 创建补间动画
   */
  public createTween(config: Phaser.Types.Tweens.TweenBuilderConfig): Phaser.Tweens.Tween {
    return this.scene.tweens.add(config);
  }

  /**
   * 创建淡入效果
   */
  public fadeIn(gameObject: Phaser.GameObjects.GameObject, duration: number = 500, delay: number = 0): Phaser.Tweens.Tween {
    if ('setAlpha' in gameObject) {
      (gameObject as any).setAlpha(0);
    }
    return this.createTween({
      targets: gameObject,
      alpha: 1,
      duration: duration,
      delay: delay,
      ease: 'Power2'
    });
  }

  /**
   * 创建淡出效果
   */
  public fadeOut(gameObject: Phaser.GameObjects.GameObject, duration: number = 500, delay: number = 0): Phaser.Tweens.Tween {
    return this.createTween({
      targets: gameObject,
      alpha: 0,
      duration: duration,
      delay: delay,
      ease: 'Power2'
    });
  }

  /**
   * 创建缩放动画
   */
  public scaleAnimation(gameObject: Phaser.GameObjects.GameObject, targetScale: number, duration: number = 300): Phaser.Tweens.Tween {
    return this.createTween({
      targets: gameObject,
      scaleX: targetScale,
      scaleY: targetScale,
      duration: duration,
      ease: 'Back.easeOut'
    });
  }

  /**
   * 创建弹跳效果
   */
  public bounceEffect(gameObject: Phaser.GameObjects.GameObject, intensity: number = 0.2, duration: number = 600): Phaser.Tweens.Tween {
    const originalScale = (gameObject as any).scaleX || 1;
    return this.createTween({
      targets: gameObject,
      scaleX: originalScale + intensity,
      scaleY: originalScale + intensity,
      duration: duration / 2,
      ease: 'Power2',
      yoyo: true,
      repeat: 0
    });
  }

  /**
   * 创建摇摆效果
   */
  public shakeEffect(gameObject: Phaser.GameObjects.GameObject, intensity: number = 5, duration: number = 300): Phaser.Tweens.Tween {
    const originalX = (gameObject as any).x || 0;
    return this.createTween({
      targets: gameObject,
      x: originalX + intensity,
      duration: duration / 8,
      ease: 'Power2',
      yoyo: true,
      repeat: 7,
      onComplete: () => {
        if ('setX' in gameObject) {
          (gameObject as any).setX(originalX);
        }
      }
    });
  }

  /**
   * 创建浮动效果
   */
  public floatEffect(gameObject: Phaser.GameObjects.GameObject, amplitude: number = 5, duration: number = 2000): Phaser.Tweens.Tween {
    const originalY = (gameObject as any).y || 0;
    return this.createTween({
      targets: gameObject,
      y: originalY - amplitude,
      duration: duration / 2,
      ease: 'Sine.easeInOut',
      yoyo: true,
      repeat: -1
    });
  }

  /**
   * 创建旋转动画
   */
  public rotateAnimation(gameObject: Phaser.GameObjects.GameObject, angle: number, duration: number = 1000): Phaser.Tweens.Tween {
    return this.createTween({
      targets: gameObject,
      rotation: angle,
      duration: duration,
      ease: 'Power2'
    });
  }

  /**
   * 获取动画状态
   */
  public getAnimationStatus(animationKey: string): { exists: boolean; activeCount: number } {
    const exists = this.scene.anims.exists(animationKey);
    const activeObjects = this.activeAnimations.get(animationKey) || [];
    return {
      exists,
      activeCount: activeObjects.length
    };
  }

  /**
   * 暂停所有动画
   */
  public pauseAllAnimations(): void {
    this.activeAnimations.forEach(objects => {
      objects.forEach(obj => {
        if (obj instanceof Phaser.GameObjects.Sprite) {
          this.pauseAnimation(obj);
        }
      });
    });
    this.scene.tweens.pauseAll();
  }

  /**
   * 恢复所有动画
   */
  public resumeAllAnimations(): void {
    this.activeAnimations.forEach(objects => {
      objects.forEach(obj => {
        if (obj instanceof Phaser.GameObjects.Sprite) {
          this.resumeAnimation(obj);
        }
      });
    });
    this.scene.tweens.resumeAll();
  }

  /**
   * 销毁动画管理器
   */
  public destroy(): void {
    this.scene.tweens.killAll();
    this.activeAnimations.clear();
    this.animationConfigs.clear();
  }
}
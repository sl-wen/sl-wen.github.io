import * as Phaser from 'phaser';
import { GridEngine } from 'grid-engine';

// 移动方向枚举
export enum MoveDirection {
  NONE = 'none',
  UP = 'up',
  DOWN = 'down',
  LEFT = 'left',
  RIGHT = 'right',
  UP_LEFT = 'up-left',
  UP_RIGHT = 'up-right',
  DOWN_LEFT = 'down-left',
  DOWN_RIGHT = 'down-right'
}

// 移动状态枚举
export enum MoveState {
  IDLE = 'idle',
  WALKING = 'walking',
  RUNNING = 'running',
  INTERACTING = 'interacting',
  ATTACKING = 'attacking'
}

// 输入类型枚举
export enum InputType {
  KEYBOARD = 'keyboard',
  TOUCH = 'touch',
  GAMEPAD = 'gamepad'
}

// 玩家控制器配置
export interface PlayerControllerConfig {
  moveSpeed: number;
  runSpeed: number;
  interactionRange: number;
  animationSpeed: number;
  enable8Direction: boolean;
  enableRunning: boolean;
  enableSmoothMovement: boolean;
}

// 移动事件接口
export interface MoveEvent {
  direction: MoveDirection;
  state: MoveState;
  position: { x: number; y: number };
  velocity: { x: number; y: number };
}

// 交互事件接口
export interface InteractionEvent {
  type: 'npc' | 'item' | 'door' | 'chest' | 'trigger';
  target: Phaser.GameObjects.GameObject;
  position: { x: number; y: number };
  distance: number;
}

export class PlayerController {
  private scene: Phaser.Scene;
  private player: Phaser.GameObjects.Sprite;
  private gridEngine: GridEngine;
  private config: PlayerControllerConfig;
  
  // 输入状态
  private inputKeys: Map<string, Phaser.Input.Keyboard.Key> = new Map();
  private currentDirection: MoveDirection = MoveDirection.NONE;
  private currentState: MoveState = MoveState.IDLE;
  private isRunning: boolean = false;
  private isInteracting: boolean = false;
  
  // 动画状态
  private animations: Map<MoveDirection, string> = new Map();
  private currentAnimation: string = '';
  
  // 交互状态
  private nearbyObjects: Phaser.GameObjects.GameObject[] = [];
  private interactionTarget: Phaser.GameObjects.GameObject | null = null;
  
  // 事件监听器
  private eventListeners: Map<string, ((event: any) => void)[]> = new Map();
  
  // 移动相关
  private moveVelocity: { x: number; y: number } = { x: 0, y: 0 };
  private targetPosition: { x: number; y: number } | null = null;
  private smoothMovement: boolean = false;

  constructor(
    scene: Phaser.Scene,
    player: Phaser.GameObjects.Sprite,
    gridEngine: GridEngine,
    config: Partial<PlayerControllerConfig> = {}
  ) {
    this.scene = scene;
    this.player = player;
    this.gridEngine = gridEngine;
    
    this.config = {
      moveSpeed: 120,
      runSpeed: 200,
      interactionRange: 32,
      animationSpeed: 8,
      enable8Direction: true,
      enableRunning: true,
      enableSmoothMovement: true,
      ...config
    };

    this.smoothMovement = this.config.enableSmoothMovement;
    this.initializeInput();
    this.initializeAnimations();
    this.setupEventListeners();
  }

  // 初始化输入系统
  private initializeInput(): void {
    // WASD 键
    this.inputKeys.set('W', this.scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W));
    this.inputKeys.set('A', this.scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A));
    this.inputKeys.set('S', this.scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S));
    this.inputKeys.set('D', this.scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D));
    
    // 方向键
    this.inputKeys.set('UP', this.scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.UP));
    this.inputKeys.set('DOWN', this.scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.DOWN));
    this.inputKeys.set('LEFT', this.scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.LEFT));
    this.inputKeys.set('RIGHT', this.scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.RIGHT));
    
    // 功能键
    this.inputKeys.set('SPACE', this.scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE));
    this.inputKeys.set('SHIFT', this.scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SHIFT));
    this.inputKeys.set('E', this.scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.E));
    
    // 设置按键重复
    Object.values(this.inputKeys).forEach(key => {
      key.setRepeat(0, 50); // 50ms 延迟后开始重复
    });
  }

  // 初始化动画
  private initializeAnimations(): void {
    // 8方向动画映射
    this.animations.set(MoveDirection.UP, 'hero_walk_up');
    this.animations.set(MoveDirection.DOWN, 'hero_walk_down');
    this.animations.set(MoveDirection.LEFT, 'hero_walk_left');
    this.animations.set(MoveDirection.RIGHT, 'hero_walk_right');
    this.animations.set(MoveDirection.UP_LEFT, 'hero_walk_up_left');
    this.animations.set(MoveDirection.UP_RIGHT, 'hero_walk_up_right');
    this.animations.set(MoveDirection.DOWN_LEFT, 'hero_walk_down_left');
    this.animations.set(MoveDirection.DOWN_RIGHT, 'hero_walk_down_right');
    
    // 默认动画
    this.currentAnimation = 'hero_idle';
    this.player.play(this.currentAnimation);
  }

  // 设置事件监听器
  private setupEventListeners(): void {
    // 监听网格引擎移动事件
    this.gridEngine.movementStarted().subscribe(({ charId }) => {
      if (charId === 'player') {
        this.onMovementStarted();
      }
    });

    this.gridEngine.movementStopped().subscribe(({ charId }) => {
      if (charId === 'player') {
        this.onMovementStopped();
      }
    });

    // 监听交互事件
    this.scene.input.keyboard.on('keydown-SPACE', () => {
      this.interact();
    });

    this.scene.input.keyboard.on('keydown-E', () => {
      this.interact();
    });
  }

  // 更新方法 - 在场景的 update 中调用
  public update(time: number, delta: number): void {
    if (this.currentState === MoveState.INTERACTING || this.currentState === MoveState.ATTACKING) {
      return; // 交互或攻击时不允许移动
    }

    this.handleInput();
    this.updateMovement(delta);
    this.updateAnimation();
    this.updateInteraction();
  }

  // 处理输入
  private handleInput(): void {
    // 检查运行键
    this.isRunning = this.config.enableRunning && 
      (this.inputKeys.get('SHIFT')?.isDown || false);

    // 获取移动方向
    const direction = this.getInputDirection();
    
    if (direction !== MoveDirection.NONE) {
      this.move(direction);
    } else {
      this.stop();
    }
  }

  // 获取输入方向
  private getInputDirection(): MoveDirection {
    const up = this.inputKeys.get('W')?.isDown || this.inputKeys.get('UP')?.isDown || false;
    const down = this.inputKeys.get('S')?.isDown || this.inputKeys.get('DOWN')?.isDown || false;
    const left = this.inputKeys.get('A')?.isDown || this.inputKeys.get('LEFT')?.isDown || false;
    const right = this.inputKeys.get('D')?.isDown || this.inputKeys.get('RIGHT')?.isDown || false;

    if (!up && !down && !left && !right) {
      return MoveDirection.NONE;
    }

    if (this.config.enable8Direction) {
      // 8方向移动
      if (up && left) return MoveDirection.UP_LEFT;
      if (up && right) return MoveDirection.UP_RIGHT;
      if (down && left) return MoveDirection.DOWN_LEFT;
      if (down && right) return MoveDirection.DOWN_RIGHT;
    }

    // 4方向移动
    if (up) return MoveDirection.UP;
    if (down) return MoveDirection.DOWN;
    if (left) return MoveDirection.LEFT;
    if (right) return MoveDirection.RIGHT;

    return MoveDirection.NONE;
  }

  // 移动
  private move(direction: MoveDirection): void {
    if (this.currentDirection === direction && this.currentState === MoveState.WALKING) {
      return; // 已经在移动中，方向相同
    }

    this.currentDirection = direction;
    this.currentState = this.isRunning ? MoveState.RUNNING : MoveState.WALKING;

    // 计算移动速度
    const speed = this.isRunning ? this.config.runSpeed : this.config.moveSpeed;

    // 使用网格引擎移动
    if (this.smoothMovement) {
      this.moveSmooth(direction, speed);
    } else {
      this.moveGrid(direction);
    }

    // 发送移动事件
    this.emitEvent('move', {
      direction,
      state: this.currentState,
      position: { x: this.player.x, y: this.player.y },
      velocity: this.moveVelocity
    });
  }

  // 网格移动
  private moveGrid(direction: MoveDirection): void {
    const directionMap = {
      [MoveDirection.UP]: 'up',
      [MoveDirection.DOWN]: 'down',
      [MoveDirection.LEFT]: 'left',
      [MoveDirection.RIGHT]: 'right',
      [MoveDirection.UP_LEFT]: 'up-left',
      [MoveDirection.UP_RIGHT]: 'up-right',
      [MoveDirection.DOWN_LEFT]: 'down-left',
      [MoveDirection.DOWN_RIGHT]: 'down-right'
    };

    const gridDirection = directionMap[direction];
    if (gridDirection) {
      this.gridEngine.move('player', gridDirection);
    }
  }

  // 平滑移动
  private moveSmooth(direction: MoveDirection, speed: number): void {
    const speedPerSecond = speed / 1000; // 转换为每毫秒的速度
    
    // 计算移动向量
    const vector = this.getDirectionVector(direction);
    this.moveVelocity.x = vector.x * speedPerSecond;
    this.moveVelocity.y = vector.y * speedPerSecond;

    // 更新目标位置
    this.targetPosition = {
      x: this.player.x + this.moveVelocity.x,
      y: this.player.y + this.moveVelocity.y
    };
  }

  // 获取方向向量
  private getDirectionVector(direction: MoveDirection): { x: number; y: number } {
    const vectors = {
      [MoveDirection.UP]: { x: 0, y: -1 },
      [MoveDirection.DOWN]: { x: 0, y: 1 },
      [MoveDirection.LEFT]: { x: -1, y: 0 },
      [MoveDirection.RIGHT]: { x: 1, y: 0 },
      [MoveDirection.UP_LEFT]: { x: -0.707, y: -0.707 },
      [MoveDirection.UP_RIGHT]: { x: 0.707, y: -0.707 },
      [MoveDirection.DOWN_LEFT]: { x: -0.707, y: 0.707 },
      [MoveDirection.DOWN_RIGHT]: { x: 0.707, y: 0.707 }
    };

    return vectors[direction] || { x: 0, y: 0 };
  }

  // 停止移动
  private stop(): void {
    if (this.currentState === MoveState.IDLE) {
      return;
    }

    this.currentDirection = MoveDirection.NONE;
    this.currentState = MoveState.IDLE;
    this.moveVelocity = { x: 0, y: 0 };
    this.targetPosition = null;

    // 停止网格引擎移动
    this.gridEngine.stopMovement('player');

    // 发送停止事件
    this.emitEvent('stop', {
      direction: MoveDirection.NONE,
      state: MoveState.IDLE,
      position: { x: this.player.x, y: this.player.y },
      velocity: { x: 0, y: 0 }
    });
  }

  // 更新移动
  private updateMovement(delta: number): void {
    if (this.smoothMovement && this.targetPosition && this.currentState !== MoveState.IDLE) {
      // 平滑移动更新
      const newX = this.player.x + this.moveVelocity.x * delta;
      const newY = this.player.y + this.moveVelocity.y * delta;

      // 检查碰撞
      if (this.canMoveTo(newX, newY)) {
        this.player.setPosition(newX, newY);
      } else {
        this.stop();
      }
    }
  }

  // 检查是否可以移动到指定位置
  private canMoveTo(x: number, y: number): boolean {
    // 这里可以添加碰撞检测逻辑
    // 暂时返回 true，实际应该检查地图碰撞
    return true;
  }

  // 更新动画
  private updateAnimation(): void {
    let animationKey = 'hero_idle';

    if (this.currentState !== MoveState.IDLE) {
      animationKey = this.animations.get(this.currentDirection) || 'hero_walk_down';
      
      // 运行动画
      if (this.isRunning) {
        animationKey = animationKey.replace('walk', 'run');
      }
    }

    // 播放动画
    if (this.currentAnimation !== animationKey) {
      this.currentAnimation = animationKey;
      this.player.play(animationKey, true);
    }
  }

  // 更新交互
  private updateInteraction(): void {
    // 检测附近的交互对象
    this.detectNearbyObjects();
    
    // 更新交互提示
    this.updateInteractionHint();
  }

  // 检测附近对象
  private detectNearbyObjects(): void {
    this.nearbyObjects = [];
    this.interactionTarget = null;

    // 获取场景中的所有可交互对象
    const interactableObjects = this.scene.children.list.filter(obj => 
      obj.getData('interactable') === true
    ) as Phaser.GameObjects.GameObject[];

    let closestDistance = this.config.interactionRange;
    let closestObject: Phaser.GameObjects.GameObject | null = null;

    interactableObjects.forEach(obj => {
      const distance = Phaser.Math.Distance.Between(
        this.player.x, this.player.y,
        obj.x, obj.y
      );

      if (distance <= this.config.interactionRange) {
        this.nearbyObjects.push(obj);

        if (distance < closestDistance) {
          closestDistance = distance;
          closestObject = obj;
        }
      }
    });

    this.interactionTarget = closestObject;
  }

  // 更新交互提示
  private updateInteractionHint(): void {
    // 这里可以显示交互提示UI
    if (this.interactionTarget) {
      // 显示交互提示
      this.emitEvent('interaction-hint', {
        target: this.interactionTarget,
        show: true
      });
    } else {
      // 隐藏交互提示
      this.emitEvent('interaction-hint', {
        target: null,
        show: false
      });
    }
  }

  // 交互
  public interact(): void {
    if (this.currentState === MoveState.INTERACTING) {
      return; // 正在交互中
    }

    if (this.interactionTarget) {
      this.currentState = MoveState.INTERACTING;
      
      // 发送交互事件
      this.emitEvent('interact', {
        type: this.interactionTarget.getData('interactionType') || 'unknown',
        target: this.interactionTarget,
        position: { x: this.player.x, y: this.player.y },
        distance: Phaser.Math.Distance.Between(
          this.player.x, this.player.y,
          this.interactionTarget.x, this.interactionTarget.y
        )
      });

      // 播放交互动画
      this.player.play('hero_interact', true);
      
      // 交互完成后恢复
      this.scene.time.delayedCall(500, () => {
        this.currentState = MoveState.IDLE;
      });
    }
  }

  // 攻击
  public attack(): void {
    if (this.currentState === MoveState.ATTACKING) {
      return; // 正在攻击中
    }

    this.currentState = MoveState.ATTACKING;
    
    // 发送攻击事件
    this.emitEvent('attack', {
      direction: this.currentDirection,
      position: { x: this.player.x, y: this.player.y }
    });

    // 播放攻击动画
    this.player.play('hero_attack', true);
    
    // 攻击完成后恢复
    this.scene.time.delayedCall(300, () => {
      this.currentState = MoveState.IDLE;
    });
  }

  // 移动开始事件
  private onMovementStarted(): void {
    this.currentState = this.isRunning ? MoveState.RUNNING : MoveState.WALKING;
  }

  // 移动停止事件
  private onMovementStopped(): void {
    this.currentState = MoveState.IDLE;
    this.currentDirection = MoveDirection.NONE;
  }

  // 事件监听
  public on(event: string, callback: (event: any) => void): void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, []);
    }
    this.eventListeners.get(event)!.push(callback);
  }

  public off(event: string, callback: (event: any) => void): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      const index = listeners.indexOf(callback);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    }
  }

  // 发送事件
  private emitEvent(type: string, data: any): void {
    const listeners = this.eventListeners.get(type);
    if (listeners) {
      listeners.forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error('Error in player controller event listener:', error);
        }
      });
    }
  }

  // 获取当前状态
  public getCurrentState(): MoveState {
    return this.currentState;
  }

  public getCurrentDirection(): MoveDirection {
    return this.currentDirection;
  }

  public isMoving(): boolean {
    return this.currentState === MoveState.WALKING || this.currentState === MoveState.RUNNING;
  }

  public isRunning(): boolean {
    return this.isRunning;
  }

  // 设置配置
  public setConfig(config: Partial<PlayerControllerConfig>): void {
    this.config = { ...this.config, ...config };
  }

  // 销毁
  public destroy(): void {
    // 清理输入键
    Object.values(this.inputKeys).forEach(key => {
      key.destroy();
    });
    this.inputKeys.clear();

    // 清理事件监听器
    this.eventListeners.clear();

    // 停止移动
    this.stop();
  }
}
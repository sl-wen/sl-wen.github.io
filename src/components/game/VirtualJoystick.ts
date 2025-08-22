import * as Phaser from 'phaser';

// 虚拟摇杆接口定义
interface JoystickVector {
  x: number;
  y: number;
}

interface JoystickConfig {
  x: number;
  y: number;
  radius: number;
  knobRadius: number;
  deadZone: number;
  scene: Phaser.Scene;
}

// 全新的虚拟摇杆类 - 简化的事件处理，防止卡死
export class VirtualJoystick {
  private scene: Phaser.Scene;
  private config: JoystickConfig;
  
  // 视觉元素
  private base!: Phaser.GameObjects.Circle;
  private knob!: Phaser.GameObjects.Circle;
  private outerRing!: Phaser.GameObjects.Circle;
  private container!: Phaser.GameObjects.Container;
  
  // 状态管理
  private isActive: boolean = false;
  private activePointerId: number | null = null;
  private vector: JoystickVector = { x: 0, y: 0 };
  private lastUpdateTime: number = 0;
  
  // 事件回调
  private onMove: ((vector: JoystickVector) => void) | null = null;
  private onStart: (() => void) | null = null;
  private onEnd: (() => void) | null = null;

  constructor(config: JoystickConfig) {
    this.scene = config.scene;
    this.config = config;
    this.create();
    this.setupEventHandlers();
  }

  private create() {
    // 创建容器
    this.container = this.scene.add.container(this.config.x, this.config.y);
    this.container.setDepth(1000);
    this.container.setScrollFactor(0);

    // 外圈指示器 - 半透明边界
    this.outerRing = this.scene.add.circle(0, 0, this.config.radius + 5, 0x4a90e2, 0.1);
    this.outerRing.setStrokeStyle(1, 0x4a90e2, 0.3);

    // 摇杆底座 - 简洁设计
    this.base = this.scene.add.circle(0, 0, this.config.radius, 0x000000, 0.3);
    this.base.setStrokeStyle(2, 0x4a90e2, 0.6);

    // 摇杆手柄 - 清晰可见
    this.knob = this.scene.add.circle(0, 0, this.config.knobRadius, 0x74b9ff, 0.9);
    this.knob.setStrokeStyle(2, 0xffffff, 0.8);

    // 添加到容器
    this.container.add([this.outerRing, this.base, this.knob]);

    // 设置交互区域 - 扩大触摸范围
    const interactiveArea = this.scene.add.circle(0, 0, this.config.radius + 20, 0x000000, 0);
    interactiveArea.setInteractive();
    this.container.add(interactiveArea);

    // 存储交互区域引用
    (this as any).interactiveArea = interactiveArea;
  }

  private setupEventHandlers() {
    const interactiveArea = (this as any).interactiveArea;

    // 简化的触摸开始处理
    interactiveArea.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      this.handleTouchStart(pointer);
    });

    // 全局移动监听
    this.scene.input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
      this.handleTouchMove(pointer);
    });

    // 全局释放监听
    this.scene.input.on('pointerup', (pointer: Phaser.Input.Pointer) => {
      this.handleTouchEnd(pointer);
    });

    // 额外的安全释放监听
    this.scene.input.on('pointerupoutside', (pointer: Phaser.Input.Pointer) => {
      this.handleTouchEnd(pointer);
    });

    // 取消事件监听
    this.scene.input.on('pointercancel', (pointer: Phaser.Input.Pointer) => {
      this.handleTouchEnd(pointer);
    });
  }

  private handleTouchStart(pointer: Phaser.Input.Pointer) {
    // 防止多点触控冲突
    if (this.isActive && this.activePointerId !== null) {
      return;
    }

    // 计算距离，确保在有效范围内
    const distance = Phaser.Math.Distance.Between(
      pointer.x, 
      pointer.y, 
      this.container.x, 
      this.container.y
    );

    if (distance <= this.config.radius + 25) {
      this.isActive = true;
      this.activePointerId = pointer.id;
      this.lastUpdateTime = this.scene.time.now;

      // 视觉反馈
      this.knob.setFillStyle(0xa29bfe, 1);
      this.knob.setScale(1.1);
      this.base.setStrokeStyle(3, 0x74b9ff, 0.8);

      // 触发开始回调
      if (this.onStart) {
        this.onStart();
      }

      // 立即更新位置
      this.updateKnobPosition(pointer);
    }
  }

  private handleTouchMove(pointer: Phaser.Input.Pointer) {
    if (!this.isActive || this.activePointerId !== pointer.id) {
      return;
    }

    this.lastUpdateTime = this.scene.time.now;
    this.updateKnobPosition(pointer);
  }

  private handleTouchEnd(pointer: Phaser.Input.Pointer) {
    if (!this.isActive || this.activePointerId !== pointer.id) {
      return;
    }

    this.resetJoystick();
  }

  private updateKnobPosition(pointer: Phaser.Input.Pointer) {
    const deltaX = pointer.x - this.container.x;
    const deltaY = pointer.y - this.container.y;
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

    // 限制在摇杆范围内
    const maxDistance = this.config.radius - this.config.knobRadius;
    let knobX = deltaX;
    let knobY = deltaY;

    if (distance > maxDistance) {
      const ratio = maxDistance / distance;
      knobX *= ratio;
      knobY *= ratio;
    }

    // 更新手柄位置
    this.knob.x = knobX;
    this.knob.y = knobY;

    // 计算标准化向量
    const normalizedDistance = Math.min(distance / maxDistance, 1);
    
    if (normalizedDistance > this.config.deadZone) {
      this.vector.x = (knobX / maxDistance);
      this.vector.y = (knobY / maxDistance);
    } else {
      this.vector.x = 0;
      this.vector.y = 0;
    }

    // 触发移动回调
    if (this.onMove) {
      this.onMove({ ...this.vector });
    }
  }

  private resetJoystick() {
    this.isActive = false;
    this.activePointerId = null;
    this.vector = { x: 0, y: 0 };

    // 动画回到中心
    this.scene.tweens.add({
      targets: this.knob,
      x: 0,
      y: 0,
      scaleX: 1,
      scaleY: 1,
      duration: 200,
      ease: 'Back.easeOut'
    });

    // 重置视觉状态
    this.knob.setFillStyle(0x74b9ff, 0.9);
    this.base.setStrokeStyle(2, 0x4a90e2, 0.6);

    // 触发结束回调
    if (this.onEnd) {
      this.onEnd();
    }

    // 最终确保移动回调被调用
    if (this.onMove) {
      this.onMove({ x: 0, y: 0 });
    }
  }

  // 公共方法
  public setPosition(x: number, y: number) {
    this.container.setPosition(x, y);
    this.config.x = x;
    this.config.y = y;
  }

  public setVisible(visible: boolean) {
    this.container.setVisible(visible);
  }

  public getVector(): JoystickVector {
    return { ...this.vector };
  }

  public isJoystickActive(): boolean {
    return this.isActive;
  }

  // 事件监听器设置
  public onMoveCallback(callback: (vector: JoystickVector) => void) {
    this.onMove = callback;
  }

  public onStartCallback(callback: () => void) {
    this.onStart = callback;
  }

  public onEndCallback(callback: () => void) {
    this.onEnd = callback;
  }

  // 更新摇杆位置以适应屏幕变化
  public updateLayout(screenWidth: number, screenHeight: number) {
    const isPortrait = screenHeight > screenWidth;
    const isMobile = screenWidth < 768;
    
    let newX: number, newY: number;
    
    if (isMobile) {
      if (isPortrait) {
        // 竖屏：左下角，但避开底部导航
        newX = Math.max(this.config.radius + 30, screenWidth * 0.15);
        newY = screenHeight - this.config.radius - 80;
      } else {
        // 横屏：左下角，标准位置
        newX = this.config.radius + 40;
        newY = screenHeight - this.config.radius - 50;
      }
    } else {
      // 桌面端：固定位置
      newX = this.config.radius + 50;
      newY = screenHeight - this.config.radius - 60;
    }

    // 确保不超出边界
    newX = Math.max(this.config.radius + 20, Math.min(newX, screenWidth - this.config.radius - 20));
    newY = Math.max(this.config.radius + 20, Math.min(newY, screenHeight - this.config.radius - 20));

    this.setPosition(newX, newY);
  }

  // 清理资源
  public destroy() {
    if (this.container) {
      this.container.destroy();
    }
    
    // 清理回调
    this.onMove = null;
    this.onStart = null;
    this.onEnd = null;
  }

  // 紧急重置 - 解决卡死问题
  public emergencyReset() {
    console.log('🚨 Emergency reset triggered for joystick');
    
    // 强制重置所有状态
    this.isActive = false;
    this.activePointerId = null;
    this.vector = { x: 0, y: 0 };
    
    // 立即重置视觉状态
    if (this.knob) {
      this.knob.setPosition(0, 0);
      this.knob.setScale(1);
      this.knob.setFillStyle(0x74b9ff, 0.9);
    }
    
    if (this.base) {
      this.base.setStrokeStyle(2, 0x4a90e2, 0.6);
    }
    
    // 确保移动回调被调用
    if (this.onMove) {
      this.onMove({ x: 0, y: 0 });
    }
  }

  // 获取摇杆状态信息（用于调试）
  public getDebugInfo() {
    return {
      isActive: this.isActive,
      activePointerId: this.activePointerId,
      vector: this.vector,
      position: { x: this.container.x, y: this.container.y },
      lastUpdateTime: this.lastUpdateTime,
      timeSinceLastUpdate: this.scene.time.now - this.lastUpdateTime
    };
  }
}
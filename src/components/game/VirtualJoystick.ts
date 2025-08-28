　  import * as Phaser from 'phaser';

/**
 * 虚拟摇杆向量接口
 * 定义摇杆的X和Y方向输入值
 */
interface JoystickVector {
  x: number;  // X方向输入值（-1到1）
  y: number;  // Y方向输入值（-1到1）
}

/**
 * 虚拟摇杆配置接口
 * 定义摇杆的位置、大小和场景引用
 */
interface JoystickConfig {
  x: number;           // 摇杆X坐标
  y: number;           // 摇杆Y坐标
  radius: number;      // 摇杆底座半径
  knobRadius: number;  // 摇杆手柄半径
  deadZone: number;    // 死区大小（防止误触）
  scene: Phaser.Scene; // 游戏场景引用
}

/**
 * 虚拟摇杆类
 * 为移动设备提供触摸控制的虚拟摇杆
 * 简化的事件处理，防止卡死
 */
export class VirtualJoystick {
  private scene: Phaser.Scene;
  private config: JoystickConfig;

  // 视觉元素
  private base!: Phaser.GameObjects.Arc;
  private knob!: Phaser.GameObjects.Arc;
  private outerRing!: Phaser.GameObjects.Arc;
  private container!: Phaser.GameObjects.Container;

  // 状态管理
  private isActive: boolean = false;
  private activePointerId: number | null = null;
  private vector: JoystickVector = { x: 0, y: 0 };
  private lastUpdateTime: number = 0;
  private isFullscreen: boolean = false;
  private touchCount: number = 0; // 触摸计数器，用于调试

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

    // 外圈指示器 - 更明显的边界提示
    this.outerRing = this.scene.add.circle(0, 0, this.config.radius + 8, 0x4a90e2, 0.15);
    this.outerRing.setStrokeStyle(2, 0x4a90e2, 0.4);

    // 摇杆底座 - 增强视觉效果
    this.base = this.scene.add.circle(0, 0, this.config.radius, 0x000000, 0.4);
    this.base.setStrokeStyle(3, 0x4a90e2, 0.7);

    // 摇杆手柄 - 更清晰的反馈
    this.knob = this.scene.add.circle(0, 0, this.config.knobRadius, 0x74b9ff, 1.0);
    this.knob.setStrokeStyle(3, 0xffffff, 1.0);

    // 添加到容器
    this.container.add([this.outerRing, this.base, this.knob]);

    // 设置交互区域 - 大幅扩大触摸范围提高响应性，为更大摇杆增加更大缓冲区
    const interactiveArea = this.scene.add.circle(0, 0, this.config.radius + 60, 0x000000, 0);
    interactiveArea.setInteractive();
    this.container.add(interactiveArea);

    // 存储交互区域引用
    (this as unknown as { interactiveArea: Phaser.GameObjects.Arc }).interactiveArea = interactiveArea;
  }

  private setupEventHandlers() {
    const interactiveArea = (this as unknown as { interactiveArea: Phaser.GameObjects.Arc }).interactiveArea;

    // 优化的触摸开始处理 - 提高响应性
    interactiveArea.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      // 立即处理，不延迟
      this.handleTouchStart(pointer);
    });

    // 添加更积极的触摸检测 - 监听整个摇杆容器区域
    this.container.setInteractive();
    this.container.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      if (!this.isActive) {
        this.handleTouchStart(pointer);
      }
    });

    // 全局移动监听 - 提高更新频率
    this.scene.input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
      this.handleTouchMove(pointer);
    });

    // 全局释放监听 - 只在真正的触摸结束时重置
    this.scene.input.on('pointerup', (pointer: Phaser.Input.Pointer) => {
      this.handleTouchEnd(pointer);
    });

    // 只保留真正必要的事件监听器
    // 移除pointerupoutside和pointercancel，因为它们可能在用户仍在触摸时误触发
    // this.scene.input.on('pointerupoutside', (pointer: Phaser.Input.Pointer) => {
    //   this.handleTouchEnd(pointer);
    // });

    // this.scene.input.on('pointercancel', (pointer: Phaser.Input.Pointer) => {
    //   this.handleTouchEnd(pointer);
    // });

    // 添加离开事件监听，但只在真正离开游戏区域时才重置
    // 移除过于敏感的pointerout事件，防止向下移动时误触发重置
    // this.scene.input.on('pointerout', (pointer: Phaser.Input.Pointer) => {
    //   if (this.isActive && this.activePointerId === pointer.id) {
    //     this.handleTouchEnd(pointer);
    //   }
    // });
  }

  /**
   * 处理触摸开始事件
   * @param pointer 触摸指针对象
   */
  private handleTouchStart(pointer: Phaser.Input.Pointer) {
    // 防止多点触控冲突
    if (this.isActive && this.activePointerId !== null) {
      return;  // 如果摇杆已经激活且不是同一个指针，则忽略
    }

    try {
      // 获取正确的触摸坐标（考虑全屏模式）
      const touchCoords = this.getTouchCoordinates(pointer);

      // 验证坐标有效性
      if (!isFinite(touchCoords.x) || !isFinite(touchCoords.y)) {
        console.warn('Invalid touch coordinates detected, ignoring touch start');
        return;
      }

      // 计算距离，确保在有效范围内
      const distance = Phaser.Math.Distance.Between(
        touchCoords.x,        // 触摸点X坐标
        touchCoords.y,        // 触摸点Y坐标
        this.container.x,     // 摇杆中心X坐标
        this.container.y      // 摇杆中心Y坐标
      );

      // 设置触摸范围 - 现在可以更宽松，因为我们不会在移动过程中重置
      const touchRange = this.config.radius + (this.isFullscreen ? 120 : 100);

      if (distance <= touchRange) {  // 在有效触摸范围内
        this.isActive = true;                    // 激活摇杆
        this.activePointerId = pointer.id;       // 记录指针ID
        this.lastUpdateTime = this.scene.time.now;  // 记录最后更新时间

        // 增强视觉反馈 - 改变手柄颜色和大小，提供更明显的触摸响应
        this.knob.setFillStyle(0x00ff88, 1);     // 设置手柄填充颜色为亮绿色，表示激活
        this.knob.setScale(1.25);                // 手柄放大1.25倍，更加明显
        this.base.setStrokeStyle(5, 0x00ff88, 1.0);  // 底座边框变绿并加粗
        this.outerRing.setStrokeStyle(4, 0x00ff88, 0.8); // 外圈变绿并加粗
        
        // 添加脉冲效果，增强视觉反馈
        this.scene.tweens.add({
          targets: this.outerRing,
          alpha: 0.3,
          duration: 200,
          yoyo: true,
          repeat: -1
        });

        // 添加触觉反馈
        this.triggerHapticFeedback([30]);

        // 触发开始回调
        if (this.onStart) {
          this.onStart();  // 调用开始回调函数
        }

        // 立即更新位置
        this.updateKnobPosition(pointer);  // 更新手柄位置

        // 增加触摸计数
        this.touchCount++;
        
        console.debug(`🎮 Joystick activated! Touch #${this.touchCount}, distance: ${distance.toFixed(2)}, range: ${touchRange}, fullscreen: ${this.isFullscreen}`);
      } else {
        console.debug(`❌ Touch outside joystick range: ${distance.toFixed(2)} > ${touchRange} (fullscreen: ${this.isFullscreen})`);
      }
    } catch (error) {
      console.error('Error in handleTouchStart:', error);
      // 发生错误时执行紧急重置
      this.emergencyReset();
    }
  }

  /**
   * 处理触摸移动事件 - 优化版本
   * @param pointer 触摸指针对象
   */
  private handleTouchMove(pointer: Phaser.Input.Pointer) {
    if (!this.isActive || this.activePointerId !== pointer.id) {
      return;  // 如果摇杆未激活或不是同一个指针，则忽略
    }

    try {
      const currentTime = this.scene.time.now;
      
      // 限制更新频率，避免过度计算（60FPS对应约16.67ms间隔）
      if (currentTime - this.lastUpdateTime < 8) { // 约120FPS更新频率，提高响应性
        return;
      }
      
      this.lastUpdateTime = currentTime;  // 更新最后更新时间
      
      // 移除距离检测重置逻辑 - 只有停止触摸时才重置
      // 无论摇杆移动到多远都继续跟踪，直到用户停止触摸
      
      this.updateKnobPosition(pointer);   // 更新手柄位置
    } catch (error) {
      console.error('Error in handleTouchMove:', error);
      // 发生错误时执行紧急重置
      this.emergencyReset();
    }
  }

  /**
   * 处理触摸结束事件
   * @param pointer 触摸指针对象
   */
  private handleTouchEnd(pointer: Phaser.Input.Pointer) {
    // 严格检查：只有当前激活的指针才能触发重置
    if (!this.isActive || this.activePointerId !== pointer.id) {
      return;  // 如果摇杆未激活或不是同一个指针，则忽略
    }

    console.debug(`🎮 Joystick touch ended for pointer ${pointer.id}, resetting joystick`);
    this.resetJoystick();  // 重置摇杆状态
  }

  /**
   * 更新手柄位置
   * 根据触摸位置计算手柄的新位置和输入向量
   * @param pointer 触摸指针对象
   */
  private updateKnobPosition(pointer: Phaser.Input.Pointer) {
    // 获取正确的触摸坐标（考虑全屏模式）
    const touchCoords = this.getTouchCoordinates(pointer);

    // 验证坐标有效性
    if (!isFinite(touchCoords.x) || !isFinite(touchCoords.y)) {
      console.warn('Invalid touch coordinates in updateKnobPosition, resetting joystick');
      this.emergencyReset();
      return;
    }

    const deltaX = touchCoords.x - this.container.x;  // 计算X方向偏移
    const deltaY = touchCoords.y - this.container.y;  // 计算Y方向偏移
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);  // 计算触摸点到中心的距离

    // 验证距离有效性
    if (!isFinite(distance)) {
      console.warn('Invalid distance calculated, resetting joystick');
      this.emergencyReset();
      return;
    }

    // 手柄位置跟随触摸点，但仍限制在合理范围内以保持视觉效果
    const maxDistance = this.config.radius - this.config.knobRadius;  // 最大移动距离
    let knobX = deltaX;  // 手柄X位置
    let knobY = deltaY;  // 手柄Y位置

    // 保持手柄在摇杆底座范围内，但允许更大的输入检测范围
    if (distance > maxDistance) {
      const ratio = maxDistance / distance;  // 计算缩放比例
      knobX *= ratio;  // 限制X位置
      knobY *= ratio;  // 限制Y位置
    }

    // 更新手柄位置
    this.knob.x = knobX;  // 设置手柄X坐标
    this.knob.y = knobY;  // 设置手柄Y坐标

    // 计算标准化向量 - 基于实际触摸距离而不是手柄位置
    const normalizedDistance = Math.min(distance / maxDistance, 2);  // 允许超出范围的输入，最大2倍

    // 降低死区阈值，提高小幅度移动的响应性
    const adjustedDeadZone = this.config.deadZone * 0.3; // 将死区大幅减少
    
    if (distance > adjustedDeadZone * maxDistance) {
      // 基于实际触摸位置计算输入向量，而不是限制后的手柄位置
      const inputStrength = Math.min(normalizedDistance, 1.5); // 最大1.5倍强度
      this.vector.x = (deltaX / distance) * inputStrength;
      this.vector.y = (deltaY / distance) * inputStrength;
    } else {
      this.vector.x = 0;  // 在死区内，输入值为0
      this.vector.y = 0;  // 在死区内，输入值为0
    }

    // 验证向量有效性
    if (!isFinite(this.vector.x) || !isFinite(this.vector.y)) {
      console.warn('Invalid vector calculated, using zero vector');
      this.vector.x = 0;
      this.vector.y = 0;
    }

    // 触发移动回调
    if (this.onMove) {
      this.onMove({ ...this.vector });
    }
  }

  /**
   * 重置摇杆状态
   * 将摇杆恢复到初始状态
   */
  private resetJoystick() {
    this.isActive = false;                    // 取消激活状态
    this.activePointerId = null;              // 清空指针ID
    this.vector = { x: 0, y: 0 };            // 重置输入向量

    // 动画回到中心
    this.scene.tweens.add({
      targets: this.knob,                     // 动画目标：手柄
      x: 0,                                   // 回到中心X坐标
      y: 0,                                   // 回到中心Y坐标
      scaleX: 1,                              // 恢复原始X缩放
      scaleY: 1,                              // 恢复原始Y缩放
      duration: 200,                          // 动画持续时间200ms
      ease: 'Back.easeOut'                    // 弹性缓动效果
    });

    // 重置视觉状态
    this.knob.setFillStyle(0x74b9ff, 1.0);   // 恢复手柄颜色
    this.base.setStrokeStyle(3, 0x4a90e2, 0.7);  // 恢复底座边框
    this.outerRing.setStrokeStyle(2, 0x4a90e2, 0.4); // 恢复外圈
    
    // 停止所有与外圈相关的动画效果
    this.scene.tweens.killTweensOf(this.outerRing);
    this.outerRing.setAlpha(0.15); // 恢复原始透明度

    // 添加释放时的触觉反馈
    this.triggerHapticFeedback([20]);

    // 触发结束回调
    if (this.onEnd) {
      this.onEnd();  // 调用结束回调函数
    }

    // 最终确保移动回调被调用
    if (this.onMove) {
      this.onMove({ x: 0, y: 0 });  // 发送零向量，表示停止移动
    }
  }

  /**
   * 设置摇杆位置
   * @param x 新的X坐标
   * @param y 新的Y坐标
   */
  public setPosition(x: number, y: number) {
    this.container.setPosition(x, y);  // 设置容器位置
    this.config.x = x;                 // 更新配置中的X坐标
    this.config.y = y;                 // 更新配置中的Y坐标
  }

  /**
   * 设置摇杆可见性
   * @param visible 是否可见
   */
  public setVisible(visible: boolean) {
    this.container.setVisible(visible);  // 设置容器可见性
  }

  /**
   * 获取当前输入向量
   * @returns 输入向量的副本
   */
  public getVector(): JoystickVector {
    return { ...this.vector };  // 返回向量副本，防止外部修改
  }

  /**
   * 检查摇杆是否激活
   * @returns 摇杆是否处于激活状态
   */
  public isJoystickActive(): boolean {
    return this.isActive;  // 返回激活状态
  }

  /**
   * 设置移动回调函数
   * @param callback 移动回调函数
   */
  public onMoveCallback(callback: (vector: JoystickVector) => void) {
    this.onMove = callback;  // 设置移动回调
  }

  /**
   * 设置开始回调函数
   * @param callback 开始回调函数
   */
  public onStartCallback(callback: () => void) {
    this.onStart = callback;  // 设置开始回调
  }

  /**
   * 设置结束回调函数
   * @param callback 结束回调函数
   */
  public onEndCallback(callback: () => void) {
    this.onEnd = callback;  // 设置结束回调
  }

  /**
   * 更新摇杆位置以适应屏幕变化
   * 委托给UILayoutManager进行统一的位置管理
   * @param screenWidth 屏幕宽度
   * @param screenHeight 屏幕高度
   */
  public updateLayout(screenWidth: number, screenHeight: number) {
    // 委托给场景中的UILayoutManager进行位置计算
    // 这样避免了重复的位置计算逻辑
    if (this.isFullscreen) {
      this.adjustForFullscreen();
    } else {
      this.adjustForNormalMode();
    }

    console.log(`Joystick layout updated: fullscreen=${this.isFullscreen}`);
  }

  /**
   * 清理资源
   * 销毁摇杆对象并清理所有回调
   */
  public destroy() {
    if (this.container) {
      this.container.destroy();  // 销毁容器及其所有子对象
    }

    // 清理回调
    this.onMove = null;   // 清空移动回调
    this.onStart = null;  // 清空开始回调
    this.onEnd = null;    // 清空结束回调
  }

  /**
   * 紧急重置 - 解决卡死问题
   * 强制重置摇杆状态，用于处理异常情况
   */
  public emergencyReset() {
    console.log('🚨 Emergency reset triggered for joystick');  // 紧急重置日志

    // 强制重置所有状态
    this.isActive = false;                    // 取消激活状态
    this.activePointerId = null;              // 清空指针ID
    this.vector = { x: 0, y: 0 };            // 重置输入向量

    // 立即重置视觉状态
    if (this.knob) {
      this.knob.setPosition(0, 0);            // 手柄回到中心
      this.knob.setScale(1);                  // 恢复原始大小
      this.knob.setFillStyle(0x74b9ff, 0.9); // 恢复原始颜色
    }

    if (this.base) {
      this.base.setStrokeStyle(2, 0x4a90e2, 0.6);  // 恢复底座边框
    }

    if (this.outerRing) {
      this.outerRing.setStrokeStyle(2, 0x4a90e2, 0.4);  // 恢复外圈
    }

    // 重新调整位置（考虑当前全屏状态）
    if (this.isFullscreen) {
      this.adjustForFullscreen();
    } else {
      this.adjustForNormalMode();
    }

    // 确保移动回调被调用
    if (this.onMove) {
      this.onMove({ x: 0, y: 0 });  // 发送零向量，表示停止移动
    }

    console.log('🔧 Joystick emergency reset completed');
  }

  /**
   * 处理视口变化
   * 当屏幕旋转或尺寸改变时调用
   */
  public handleViewportChange() {
    // 延迟处理，确保DOM更新完成
    setTimeout(() => {
      if (typeof window === 'undefined') return;
      const screenWidth = window.innerWidth;
      const screenHeight = window.innerHeight;

      // 更新布局
      this.updateLayout(screenWidth, screenHeight);

      // 如果摇杆处于激活状态，执行紧急重置以避免位置错误
      if (this.isActive) {
        console.log('🔄 Viewport changed while joystick active, resetting...');
        this.emergencyReset();
      }

      console.log(`📱 Viewport changed: ${screenWidth}x${screenHeight}, fullscreen: ${this.isFullscreen}`);
    }, 100);
  }

  /**
   * 获取摇杆状态信息（用于调试）
   * @returns 摇杆的调试信息
   */
  public getDebugInfo() {
    const canvas = this.scene.game.canvas;
    const canvasRect = canvas ? canvas.getBoundingClientRect() : null;

    return {
      isActive: this.isActive,                                    // 激活状态
      activePointerId: this.activePointerId,                     // 当前指针ID
      vector: this.vector,                                        // 当前输入向量
      position: { x: this.container.x, y: this.container.y },    // 摇杆位置
      lastUpdateTime: this.lastUpdateTime,                       // 最后更新时间
      timeSinceLastUpdate: this.scene.time.now - this.lastUpdateTime,  // 距离上次更新的时间
      isFullscreen: this.isFullscreen,                           // 全屏状态
      touchCount: this.touchCount,                               // 触摸计数
      deadZone: this.config.deadZone,                           // 死区大小
      radius: this.config.radius,                               // 摇杆半径
      knobRadius: this.config.knobRadius,                       // 手柄半径
      gameSize: {                                                 // 游戏尺寸
        width: this.scene.scale.gameSize.width,
        height: this.scene.scale.gameSize.height
      },
      viewportSize: {                                            // 视口尺寸
        width: typeof window !== 'undefined' ? window.innerWidth : 800,
        height: typeof window !== 'undefined' ? window.innerHeight : 600
      },
      canvasRect: canvasRect ? {                                 // 画布位置和尺寸
        left: canvasRect.left,
        top: canvasRect.top,
        width: canvasRect.width,
        height: canvasRect.height
      } : null,
      scale: {                                                   // 缩放信息
        x: this.container.scaleX,
        y: this.container.scaleY
      },
      performance: {                                             // 性能信息
        updateFrequency: this.lastUpdateTime > 0 ? 1000 / (this.scene.time.now - this.lastUpdateTime) : 0
      }
    };
  }

  /**
   * 获取性能统计信息
   * @returns 性能统计
   */
  public getPerformanceStats() {
    return {
      touchCount: this.touchCount,
      isResponsive: this.scene.time.now - this.lastUpdateTime < 100,
      averageUpdateInterval: this.lastUpdateTime > 0 ? this.scene.time.now - this.lastUpdateTime : 0,
      isActive: this.isActive,
      hasValidVector: isFinite(this.vector.x) && isFinite(this.vector.y)
    };
  }

  /**
   * 验证全屏模式状态
   * @returns 全屏模式验证结果
   */
  public validateFullscreenState(): { isValid: boolean; issues: string[] } {
    const issues: string[] = [];

    // 检查画布状态
    const canvas = this.scene.game.canvas;
    if (!canvas) {
      issues.push('Canvas not available');
    } else {
      const canvasRect = canvas.getBoundingClientRect();
      if (canvasRect.width === 0 || canvasRect.height === 0) {
        issues.push('Canvas has zero dimensions');
      }
    }

    // 检查容器状态
    if (!this.container) {
      issues.push('Joystick container not initialized');
    } else {
      if (!isFinite(this.container.x) || !isFinite(this.container.y)) {
        issues.push('Invalid container position');
      }
    }

    // 检查游戏尺寸
    const gameSize = this.scene.scale.gameSize;
    if (!gameSize || gameSize.width === 0 || gameSize.height === 0) {
      issues.push('Invalid game size');
    }

    // 检查视口尺寸
    if (typeof window !== 'undefined' && (window.innerWidth === 0 || window.innerHeight === 0)) {
      issues.push('Invalid viewport size');
    }

    return {
      isValid: issues.length === 0,
      issues
    };
  }

  /**
   * 设置全屏状态
   * @param isFullscreen 是否处于全屏模式
   */
  setFullscreenMode(isFullscreen: boolean) {
    const wasFullscreen = this.isFullscreen;
    this.isFullscreen = isFullscreen;

    // 只在状态真正改变时才调整
    if (wasFullscreen !== isFullscreen) {
      console.log(`Virtual joystick fullscreen mode changed: ${wasFullscreen} -> ${isFullscreen}`);

      // 如果摇杆当前处于激活状态，先执行紧急重置
      if (this.isActive) {
        console.log('Joystick was active during fullscreen change, performing emergency reset');
        this.emergencyReset();
      }

      // 延迟调整以确保DOM更新完成
      setTimeout(() => {
        if (isFullscreen) {
          this.adjustForFullscreen();
        } else {
          this.adjustForNormalMode();
        }

        // 强制刷新事件处理器
        this.refreshEventHandlers();
      }, 100);
    }
  }

  /**
   * 调整摇杆以适应全屏模式
   * 使用UILayoutManager的统一定位逻辑
   */
  private adjustForFullscreen() {
    if (typeof window === 'undefined') return;
    
    // 获取UILayoutManager的推荐位置
    const uiLayoutManager = (this.scene as any).uiLayoutManager;
    if (uiLayoutManager) {
      const position = uiLayoutManager.getJoystickPosition(this.config.radius);
      this.container.setPosition(position.x, position.y);
      this.config.x = position.x;
      this.config.y = position.y;
    }

    // 设置全屏模式的视觉属性
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const isLandscape = viewportWidth > viewportHeight;
    const scaleFactor = this.calculateOptimalScale(isLandscape);
    
    this.container.setScale(scaleFactor);
    this.container.setAlpha(0.9);
    this.container.setDepth(10000);

    console.log(`Fullscreen joystick positioned using UILayoutManager`);
  }

  /**
   * 调整摇杆以适应正常模式
   * 使用UILayoutManager的统一定位逻辑
   */
  private adjustForNormalMode() {
    // 获取UILayoutManager的推荐位置
    const uiLayoutManager = (this.scene as any).uiLayoutManager;
    if (uiLayoutManager) {
      const position = uiLayoutManager.getJoystickPosition(this.config.radius);
      this.container.setPosition(position.x, position.y);
      this.config.x = position.x;
      this.config.y = position.y;
    }

    // 设置正常模式的视觉属性
    this.container.setScale(1.0);
    this.container.setAlpha(0.8);
    this.container.setDepth(1000);

    console.log(`Normal mode joystick positioned using UILayoutManager`);
  }

  /**
   * 获取安全区域插入值
   * @param side 安全区域边（top, bottom, left, right）
   * @returns 安全区域插入值（像素）
   */
  private getSafeAreaInset(side: 'top' | 'bottom' | 'left' | 'right'): number {
    try {
      // 尝试获取CSS环境变量
      const insetValue = getComputedStyle(document.documentElement)
        .getPropertyValue(`env(safe-area-inset-${side})`);

      if (insetValue && insetValue !== '') {
        const value = parseInt(insetValue.replace('px', '')) || 0;
        if (value > 0) return value;
      }
    } catch (error) {
      console.debug('Could not get safe area inset:', error);
    }

    // 检测设备类型和方向
    const isMobile = typeof navigator !== 'undefined' && /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    const isIOS = typeof navigator !== 'undefined' && /iPhone|iPad|iPod/i.test(navigator.userAgent);
    const isAndroid = typeof navigator !== 'undefined' && /Android/i.test(navigator.userAgent);
    const viewportWidth = typeof window !== 'undefined' ? window.innerWidth : 800;
    const viewportHeight = typeof window !== 'undefined' ? window.innerHeight : 600;
    const isLandscape = viewportWidth > viewportHeight;

    if (!isMobile) {
      // 桌面端基本不需要安全区域
      return side === 'bottom' ? 20 : 10;
    }

    // 移动端回退值
    switch (side) {
      case 'top':
        if (isIOS) {
          // iPhone X系列及以上有刘海
          return isLandscape ? 0 : 44;
        } else if (isAndroid) {
          return isLandscape ? 24 : 32;
        }
        return 24;

      case 'bottom':
        if (isIOS) {
          // iPhone X系列有Home indicator
          return isLandscape ? 21 : 34;
        } else if (isAndroid) {
          // Android导航栏
          return isLandscape ? 48 : 56;
        }
        return 48;

      case 'left':
      case 'right':
        if (isIOS && isLandscape) {
          // iPhone X系列横屏时左右有安全区域
          return 44;
        }
        return 0;

      default:
        return 0;
    }
  }

  /**
   * 触发触觉反馈（振动）
   * @param pattern 振动模式数组
   */
  private triggerHapticFeedback(pattern: number[]) {
    try {
      // 检查设备是否支持振动
      if ('vibrate' in navigator && navigator.vibrate) {
        navigator.vibrate(pattern);
      }
    } catch (error) {
      // 静默处理振动错误，避免影响游戏体验
      console.debug('Haptic feedback not available:', error);
    }
  }

  /**
   * 计算最优的摇杆缩放比例
   * @param isLandscape 是否为横屏模式
   * @returns 缩放比例
   */
  private calculateOptimalScale(isLandscape: boolean): number {
    const viewportWidth = typeof window !== 'undefined' ? window.innerWidth : 800;
    const viewportHeight = typeof window !== 'undefined' ? window.innerHeight : 600;
    const isMobile = typeof navigator !== 'undefined' && /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

    // 基础缩放比例
    let baseScale = 1.0;

    if (isMobile) {
      // 移动设备：根据屏幕尺寸调整
      const screenSize = Math.min(viewportWidth, viewportHeight);

      if (screenSize <= 375) {
        // 小屏设备 (iPhone SE等)
        baseScale = isLandscape ? 1.0 : 1.1;
      } else if (screenSize <= 414) {
        // 中等屏设备 (iPhone 8 Plus等)
        baseScale = isLandscape ? 1.1 : 1.2;
      } else if (screenSize <= 768) {
        // 大屏手机或小平板
        baseScale = isLandscape ? 1.2 : 1.3;
      } else {
        // 大平板
        baseScale = isLandscape ? 1.3 : 1.4;
      }
    } else {
      // 桌面设备：保持适中的大小
      baseScale = 1.1;
    }

    // 在全屏模式下稍微增大一点
    return this.isFullscreen ? baseScale * 1.1 : baseScale;
  }

  /**
   * 刷新事件处理器
   * 在全屏模式切换时重新设置事件监听
   */
  private refreshEventHandlers() {
    console.log('Refreshing virtual joystick event handlers');

    // 获取交互区域
    const interactiveArea = (this as unknown as { interactiveArea: Phaser.GameObjects.Arc }).interactiveArea;
    if (!interactiveArea) {
      console.warn('Interactive area not found, cannot refresh event handlers');
      return;
    }

    // 移除现有的事件监听器
    interactiveArea.removeAllListeners();
    this.scene.input.off('pointermove');
    this.scene.input.off('pointerup');
    // 不移除pointerupoutside和pointercancel，因为我们已经不再使用它们
    // this.scene.input.off('pointerupoutside');
    // this.scene.input.off('pointercancel');
    // 不重新添加pointerout监听器，因为我们已经移除了它

    // 重新设置事件处理器
    this.setupEventHandlers();

    console.log('Virtual joystick event handlers refreshed');
  }

  /**
   * 计算响应因子 - 提高小幅度移动的灵敏度
   * @param normalizedDistance 标准化距离
   * @param deadZone 死区大小
   * @returns 响应因子
   */
  private calculateResponseFactor(normalizedDistance: number, deadZone: number): number {
    // 使用平方根函数提高小幅度移动的响应性
    const adjustedDistance = (normalizedDistance - deadZone) / (1 - deadZone);
    return Math.sqrt(adjustedDistance) * 1.2; // 1.2倍增强响应性
  }

  // 移除距离检测方法 - 不再需要在移动过程中检查距离
  // 现在只有在真正停止触摸时才重置摇杆

  /**
   * 获取正确的触摸坐标
   * 处理全屏模式下的坐标转换
   * @param pointer 触摸指针对象
   * @returns 转换后的坐标
   */
  private getTouchCoordinates(pointer: Phaser.Input.Pointer): { x: number; y: number } {
    if (this.isFullscreen) {
      // 全屏模式下，需要使用原始DOM事件坐标进行精确转换
      const canvas = this.scene.game.canvas;
      if (!canvas) {
        console.warn('Canvas not available, using pointer coordinates directly');
        return { x: pointer.x, y: pointer.y };
      }

      const canvasRect = canvas.getBoundingClientRect();

      // 尝试获取原始DOM事件坐标
      let rawX, rawY;

      // 如果有原始事件，使用原始事件的坐标
      if (pointer.event && 'clientX' in pointer.event && 'clientY' in pointer.event) {
        rawX = pointer.event.clientX;
        rawY = pointer.event.clientY;
      } else if (pointer.event && 'touches' in pointer.event && pointer.event.touches.length > 0) {
        // 触摸事件
        const touch = pointer.event.touches[0];
        rawX = touch.clientX;
        rawY = touch.clientY;
      } else {
        // 回退到pointer坐标，但需要考虑Phaser可能已经进行的变换
        rawX = pointer.x;
        rawY = pointer.y;

        // 如果Phaser已经进行了坐标转换，我们需要逆向转换
        const gameWidth = this.scene.scale.gameSize.width;
        const gameHeight = this.scene.scale.gameSize.height;
        const reverseScaleX = canvasRect.width / gameWidth;
        const reverseScaleY = canvasRect.height / gameHeight;

        rawX = rawX * reverseScaleX + canvasRect.left;
        rawY = rawY * reverseScaleY + canvasRect.top;
      }

      // 计算相对于画布的坐标
      const canvasX = rawX - canvasRect.left;
      const canvasY = rawY - canvasRect.top;

      // 获取游戏的实际尺寸和画布尺寸
      const gameWidth = this.scene.scale.gameSize.width;
      const gameHeight = this.scene.scale.gameSize.height;

      // 计算缩放比例
      const scaleX = gameWidth / canvasRect.width;
      const scaleY = gameHeight / canvasRect.height;

      // 转换为游戏坐标系
      const gameX = canvasX * scaleX;
      const gameY = canvasY * scaleY;

      console.debug(`Fullscreen coords: raw(${rawX}, ${rawY}) -> canvas(${canvasX}, ${canvasY}) -> game(${gameX}, ${gameY})`);

      return {
        x: gameX,
        y: gameY
      };
    } else {
      // 正常模式下，直接使用pointer坐标
      return {
        x: pointer.x,
        y: pointer.y
      };
    }
  }
}
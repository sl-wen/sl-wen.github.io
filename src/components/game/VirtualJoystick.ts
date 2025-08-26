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
  
  // 拖拽移动相关状态
  private isDraggingJoystick: boolean = false;
  private dragStartTime: number = 0;
  private longPressThreshold: number = 500; // 长按阈值（毫秒）
  private dragThreshold: number = 10; // 拖拽阈值（像素）
  private dragStartPos: { x: number; y: number } = { x: 0, y: 0 };

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

    // 设置交互区域 - 扩大触摸范围
    const interactiveArea = this.scene.add.circle(0, 0, this.config.radius + 20, 0x000000, 0);
    interactiveArea.setInteractive();
    this.container.add(interactiveArea);

    // 存储交互区域引用
    (this as unknown as { interactiveArea: Phaser.GameObjects.Arc }).interactiveArea = interactiveArea;
  }

  private setupEventHandlers() {
    const interactiveArea = (this as unknown as { interactiveArea: Phaser.GameObjects.Arc }).interactiveArea;

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

  /**
   * 处理触摸开始事件
   * @param pointer 触摸指针对象
   */
  private handleTouchStart(pointer: Phaser.Input.Pointer) {
    // 防止多点触控冲突
    if (this.isActive && this.activePointerId !== null) {
      return;  // 如果摇杆已经激活且不是同一个指针，则忽略
    }

    // 使用统一的坐标转换方法
    const adjustedPos = this.adjustPointerCoordinates(pointer);
    const adjustedPointerX = adjustedPos.x;
    const adjustedPointerY = adjustedPos.y;

    // 计算距离，确保在有效范围内
    const distance = Phaser.Math.Distance.Between(
      adjustedPointerX,     // 调整后的触摸点X坐标
      adjustedPointerY,     // 调整后的触摸点Y坐标
      this.container.x,     // 摇杆中心X坐标
      this.container.y      // 摇杆中心Y坐标
    );

    if (distance <= this.config.radius + 25) {  // 在有效触摸范围内
      // 记录拖拽开始信息
      this.dragStartTime = this.scene.time.now;
      this.dragStartPos = { x: adjustedPointerX, y: adjustedPointerY };
      this.isDraggingJoystick = false; // 初始不是拖拽状态
      
      this.isActive = true;                    // 激活摇杆
      this.activePointerId = pointer.id;       // 记录指针ID
      this.lastUpdateTime = this.scene.time.now;  // 记录最后更新时间

      // 增强视觉反馈 - 改变手柄颜色和大小
      this.knob.setFillStyle(0xa29bfe, 1);     // 设置手柄填充颜色为紫色
      this.knob.setScale(1.15);                // 手柄放大1.15倍，更明显
      this.base.setStrokeStyle(4, 0x74b9ff, 0.9);  // 底座边框加粗并变亮
      this.outerRing.setStrokeStyle(3, 0x74b9ff, 0.6); // 外圈也变亮

      // 添加触觉反馈
      this.triggerHapticFeedback([30]);

      // 触发开始回调
      if (this.onStart) {
        this.onStart();  // 调用开始回调函数
      }

      // 立即更新位置
      this.updateKnobPositionWithCoords(adjustedPointerX, adjustedPointerY);  // 使用调整后的坐标更新手柄位置
    }
  }

  /**
   * 处理触摸移动事件
   * @param pointer 触摸指针对象
   */
  private handleTouchMove(pointer: Phaser.Input.Pointer) {
    if (!this.isActive || this.activePointerId !== pointer.id) {
      return;  // 如果摇杆未激活或不是同一个指针，则忽略
    }

    this.lastUpdateTime = this.scene.time.now;  // 更新最后更新时间
    
    // 使用统一的坐标转换方法
    const adjustedPos = this.adjustPointerCoordinates(pointer);
    const adjustedPointerX = adjustedPos.x;
    const adjustedPointerY = adjustedPos.y;
    
    // 检查是否应该进入拖拽模式
    if (!this.isDraggingJoystick) {
      const timeSinceStart = this.scene.time.now - this.dragStartTime;
      const dragDistance = Phaser.Math.Distance.Between(
        adjustedPointerX, adjustedPointerY,
        this.dragStartPos.x, this.dragStartPos.y
      );
      
      // 如果长按时间足够或者拖拽距离足够，进入拖拽模式
      if (timeSinceStart > this.longPressThreshold || dragDistance > this.dragThreshold) {
        this.isDraggingJoystick = true;
        
        // 视觉反馈：摇杆进入拖拽模式
        this.base.setStrokeStyle(5, 0xffd700, 0.8); // 金色边框表示拖拽模式
        this.outerRing.setStrokeStyle(4, 0xffd700, 0.6);
        this.container.setAlpha(0.9); // 稍微提高透明度
        
        // 触觉反馈
        this.triggerHapticFeedback([50, 50, 50]);
        
        console.log('Joystick entered drag mode');
      }
    }
    
    if (this.isDraggingJoystick) {
      // 拖拽模式：移动整个摇杆
      this.moveJoystickTo(adjustedPointerX, adjustedPointerY);
    } else {
      // 正常模式：更新手柄位置
      this.updateKnobPositionWithCoords(adjustedPointerX, adjustedPointerY);
    }
  }

  /**
   * 处理触摸结束事件
   * @param pointer 触摸指针对象
   */
  private handleTouchEnd(pointer: Phaser.Input.Pointer) {
    if (!this.isActive || this.activePointerId !== pointer.id) {
      return;  // 如果摇杆未激活或不是同一个指针，则忽略
    }

    this.resetJoystick();  // 重置摇杆状态
  }

  /**
   * 更新手柄位置
   * 根据触摸位置计算手柄的新位置和输入向量
   * @param pointer 触摸指针对象
   */
  private updateKnobPosition(pointer: Phaser.Input.Pointer) {
    // 使用统一的坐标转换方法
    const adjustedPos = this.adjustPointerCoordinates(pointer);
    this.updateKnobPositionWithCoords(adjustedPos.x, adjustedPos.y);
  }

  /**
   * 更新手柄位置（使用具体坐标）
   * 根据给定坐标计算手柄的新位置和输入向量
   * @param pointerX 触摸点X坐标
   * @param pointerY 触摸点Y坐标
   */
  private updateKnobPositionWithCoords(pointerX: number, pointerY: number) {
    const deltaX = pointerX - this.container.x;  // 计算X方向偏移
    const deltaY = pointerY - this.container.y;  // 计算Y方向偏移
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);  // 计算触摸点到中心的距离

    // 限制在摇杆范围内
    const maxDistance = this.config.radius - this.config.knobRadius;  // 最大移动距离
    let knobX = deltaX;  // 手柄X位置
    let knobY = deltaY;  // 手柄Y位置

    if (distance > maxDistance) {
      const ratio = maxDistance / distance;  // 计算缩放比例
      knobX *= ratio;  // 限制X位置
      knobY *= ratio;  // 限制Y位置
    }

    // 更新手柄位置
    this.knob.x = knobX;  // 设置手柄X坐标
    this.knob.y = knobY;  // 设置手柄Y坐标

    // 计算标准化向量
    const normalizedDistance = Math.min(distance / maxDistance, 1);  // 标准化距离（0-1）

    if (normalizedDistance > this.config.deadZone) {
      this.vector.x = (knobX / maxDistance);  // 计算X方向输入值（-1到1）
      this.vector.y = (knobY / maxDistance);  // 计算Y方向输入值（-1到1）
    } else {
      this.vector.x = 0;  // 在死区内，输入值为0
      this.vector.y = 0;  // 在死区内，输入值为0
    }

    // 触发移动回调
    if (this.onMove) {
      this.onMove({ ...this.vector });
    }
  }

  /**
   * 移动摇杆到指定位置
   * @param targetX 目标X坐标
   * @param targetY 目标Y坐标
   */
  private moveJoystickTo(targetX: number, targetY: number) {
    // 获取屏幕边界信息
    const gameWidth = this.scene.scale.gameSize.width;
    const gameHeight = this.scene.scale.gameSize.height;
    const radius = this.config.radius;
    const margin = 20;
    
    // 限制摇杆位置在屏幕边界内
    const newX = Math.max(radius + margin, Math.min(targetX, gameWidth - radius - margin));
    const newY = Math.max(radius + margin, Math.min(targetY, gameHeight - radius - margin));
    
    // 更新摇杆位置
    this.setPosition(newX, newY);
    
    // 重置手柄到中心位置（拖拽时手柄应该保持在中心）
    this.knob.setPosition(0, 0);
    this.vector = { x: 0, y: 0 };
    
    // 通知移动回调
    if (this.onMove) {
      this.onMove({ x: 0, y: 0 });
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
    
    // 重置拖拽状态
    this.isDraggingJoystick = false;
    this.dragStartTime = 0;
    this.dragStartPos = { x: 0, y: 0 };

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
    this.container.setAlpha(this.isFullscreen ? 0.85 : 0.8); // 恢复透明度

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
    
    console.log('Joystick reset, drag mode disabled');
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
   * 根据屏幕尺寸和方向调整摇杆位置
   * @param screenWidth 屏幕宽度
   * @param screenHeight 屏幕高度
   */
  public updateLayout(screenWidth: number, screenHeight: number) {
    const isPortrait = screenHeight > screenWidth;  // 判断是否为竖屏
    const isMobile = screenWidth < 768;             // 判断是否为移动设备

    let newX: number, newY: number;  // 新的位置坐标

    if (isMobile) {
      if (isPortrait) {
        // 竖屏：左下角，但避开底部导航
        newX = Math.max(this.config.radius + 30, screenWidth * 0.15);  // 确保不贴边
        newY = screenHeight - this.config.radius - 80;                  // 避开底部导航栏
      } else {
        // 横屏：左下角，标准位置
        newX = this.config.radius + 40;  // 标准左边距
        newY = screenHeight - this.config.radius - 50;  // 标准下边距
      }
    } else {
      // 桌面端：固定位置
      newX = this.config.radius + 50;  // 桌面端左边距
      newY = screenHeight - this.config.radius - 60;  // 桌面端下边距
    }

    // 确保不超出边界
    newX = Math.max(this.config.radius + 20, Math.min(newX, screenWidth - this.config.radius - 20));  // 限制X坐标范围
    newY = Math.max(this.config.radius + 20, Math.min(newY, screenHeight - this.config.radius - 20)); // 限制Y坐标范围

    this.setPosition(newX, newY);  // 设置新位置
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

    // 确保移动回调被调用
    if (this.onMove) {
      this.onMove({ x: 0, y: 0 });  // 发送零向量，表示停止移动
    }
  }

  /**
   * 检查摇杆是否处于拖拽模式
   * @returns 摇杆是否处于拖拽状态
   */
  public isDragging(): boolean {
    return this.isDraggingJoystick;
  }

  /**
   * 获取摇杆状态信息（用于调试）
   * @returns 摇杆的调试信息
   */
  public getDebugInfo() {
    return {
      isActive: this.isActive,                                    // 激活状态
      activePointerId: this.activePointerId,                     // 当前指针ID
      vector: this.vector,                                        // 当前输入向量
      position: { x: this.container.x, y: this.container.y },    // 摇杆位置
      lastUpdateTime: this.lastUpdateTime,                       // 最后更新时间
      timeSinceLastUpdate: this.scene.time.now - this.lastUpdateTime,  // 距离上次更新的时间
      isDragging: this.isDraggingJoystick,                      // 拖拽状态
      dragStartTime: this.dragStartTime                          // 拖拽开始时间
    };
  }

  /**
   * 设置全屏状态
   * @param isFullscreen 是否处于全屏模式
   */
  setFullscreenMode(isFullscreen: boolean) {
    this.isFullscreen = isFullscreen;
    
    // 在全屏模式下调整摇杆位置和大小
    if (isFullscreen) {
      this.adjustForFullscreen();
    } else {
      this.adjustForNormalMode();
    }
  }

  /**
   * 调整摇杆以适应全屏模式
   */
  private adjustForFullscreen() {
    // 在全屏模式下，摇杆可能需要重新定位
    const gameWidth = this.scene.scale.gameSize.width;
    const gameHeight = this.scene.scale.gameSize.height;
    
    // 获取实际屏幕尺寸
    const screenWidth = window.innerWidth;
    const screenHeight = window.innerHeight;
    
    // 增加全屏模式下的底部安全距离，使摇杆向上移动
    const safeAreaBottom = Math.max(80, screenHeight * 0.12); // 增加底部安全区域
    const safeAreaLeft = Math.max(40, screenWidth * 0.06);    // 增加左侧安全区域
    
    // 计算相对于游戏坐标系的位置
    const scaleX = gameWidth / screenWidth;
    const scaleY = gameHeight / screenHeight;
    
    const newX = (safeAreaLeft + this.config.radius) * scaleX;
    const newY = (screenHeight - safeAreaBottom - this.config.radius) * scaleY;
    
    this.container.setPosition(newX, newY);
    
    // 根据屏幕大小调整摇杆尺寸，在全屏模式下稍微增大
    const scaleFactor = Math.min(screenWidth / 800, screenHeight / 600) * 1.3; // 增加缩放因子
    this.container.setScale(Math.max(1.1, Math.min(1.6, scaleFactor))); // 提高最小和最大缩放值
    
    // 在全屏模式下保持较好的可见性
    this.container.setAlpha(0.85); // 提高透明度
    
    console.log(`Joystick adjusted for fullscreen: position(${newX}, ${newY}), scale(${scaleFactor})`);
  }

  /**
   * 调整摇杆以适应正常模式
   */
  private adjustForNormalMode() {
    // 恢复原始配置
    this.container.setPosition(this.config.x, this.config.y);
    this.container.setScale(1.0);
    this.container.setAlpha(0.8);
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
   * 转换触摸坐标以适应全屏模式
   * @param pointer 触摸指针对象
   * @returns 调整后的坐标
   */
  private adjustPointerCoordinates(pointer: Phaser.Input.Pointer): { x: number; y: number } {
    let adjustedX = pointer.x;
    let adjustedY = pointer.y;
    
    if (this.isFullscreen) {
      try {
        // 获取游戏画布的实际位置和缩放
        const canvas = this.scene.game.canvas;
        const canvasRect = canvas.getBoundingClientRect();
        
        // 计算缩放比例
        const scaleX = canvas.width / canvasRect.width;
        const scaleY = canvas.height / canvasRect.height;
        
        // 调整坐标以适应全屏模式
        adjustedX = (pointer.x - canvasRect.left) * scaleX;
        adjustedY = (pointer.y - canvasRect.top) * scaleY;
        
        // 确保坐标在有效范围内
        adjustedX = Math.max(0, Math.min(adjustedX, canvas.width));
        adjustedY = Math.max(0, Math.min(adjustedY, canvas.height));
        
      } catch (error) {
        console.warn('Error adjusting pointer coordinates:', error);
        // 降级到原始坐标
        adjustedX = pointer.x;
        adjustedY = pointer.y;
      }
    }
    
    return { x: adjustedX, y: adjustedY };
  }
}
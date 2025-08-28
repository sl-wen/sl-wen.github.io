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
  
  // 调试元素
  private debugTouchIndicator?: Phaser.GameObjects.Arc;
  private debugElementPool: Phaser.GameObjects.Arc[] = []; // 调试元素对象池

  // 状态管理
  private isActive: boolean = false;
  private activePointerId: number | null = null;
  private vector: JoystickVector = { x: 0, y: 0 };
  private lastUpdateTime: number = 0;
  private isFullscreen: boolean = false;
  private touchCount: number = 0; // 触摸计数器，用于调试
  private debugMode: boolean = true; // 调试模式开关
  private sensitivity: number = 1.0; // 灵敏度设置
  private smoothing: number = 0.2; // 平滑度设置
  private lastVector: JoystickVector = { x: 0, y: 0 }; // 上一帧的向量，用于平滑

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
    this.container.setScrollFactor(0); // 固定在屏幕上，不随相机移动

    // 外圈指示器 - 更明显的边界提示
    this.outerRing = this.scene.add.circle(0, 0, this.config.radius + 8, 0x4a90e2, 0.15);
    this.outerRing.setStrokeStyle(2, 0x4a90e2, 0.4);
    this.outerRing.setScrollFactor(0); // 确保固定在屏幕上

    // 摇杆底座 - 增强视觉效果
    this.base = this.scene.add.circle(0, 0, this.config.radius, 0x000000, 0.4);
    this.base.setStrokeStyle(3, 0x4a90e2, 0.7);
    this.base.setScrollFactor(0); // 确保固定在屏幕上

    // 摇杆手柄 - 更清晰的反馈
    this.knob = this.scene.add.circle(0, 0, this.config.knobRadius, 0x74b9ff, 1.0);
    this.knob.setStrokeStyle(3, 0xffffff, 1.0);
    this.knob.setScrollFactor(0); // 确保固定在屏幕上

    // 添加到容器
    this.container.add([this.outerRing, this.base, this.knob]);

    // 设置交互区域 - 大幅扩大触摸范围提高响应性，为更大摇杆增加更大缓冲区
    const interactiveArea = this.scene.add.circle(0, 0, this.config.radius + 60, 0x000000, 0);
    interactiveArea.setInteractive();
    interactiveArea.setScrollFactor(0); // 确保交互区域也固定在屏幕上
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
      // 获取相机信息用于调试
      const camera = this.scene.cameras.main;
      
      // 获取正确的触摸坐标（考虑全屏模式和相机滚动）
      const touchCoords = this.getTouchCoordinates(pointer);

      // 验证坐标有效性
      if (!isFinite(touchCoords.x) || !isFinite(touchCoords.y)) {
        console.warn('Invalid touch coordinates detected, ignoring touch start');
        return;
      }

      // 获取摇杆在屏幕坐标系中的实际位置
      // 由于摇杆使用setScrollFactor(0)，其显示位置不受相机影响
      // 但container.x和container.y可能仍然是相对于世界坐标的
      const joystickScreenX = this.getJoystickScreenPosition().x;
      const joystickScreenY = this.getJoystickScreenPosition().y;
      
      // 计算距离，确保在有效范围内
      const distance = Phaser.Math.Distance.Between(
        touchCoords.x,        // 触摸点X坐标（屏幕坐标系）
        touchCoords.y,        // 触摸点Y坐标（屏幕坐标系）
        joystickScreenX,      // 摇杆中心X坐标（屏幕坐标系）
        joystickScreenY       // 摇杆中心Y坐标（屏幕坐标系）
      );

      // 详细的坐标对比调试信息
      const phaserCoords = this.getPhaserScreenCoordinates(pointer, camera);
      console.debug(`🎮 Touch coordinates comparison:
        - Pointer world: (${pointer.x.toFixed(1)}, ${pointer.y.toFixed(1)})
        - Touch screen (used): (${touchCoords.x.toFixed(1)}, ${touchCoords.y.toFixed(1)})
        - Phaser screen: (${phaserCoords.x.toFixed(1)}, ${phaserCoords.y.toFixed(1)})
        - Camera scroll: (${camera.scrollX.toFixed(1)}, ${camera.scrollY.toFixed(1)})
        - Camera zoom: ${camera.zoom}
        - Joystick center: (${joystickScreenX.toFixed(1)}, ${joystickScreenY.toFixed(1)})
        - Container position: (${this.container.x.toFixed(1)}, ${this.container.y.toFixed(1)})
        - Distance to center: ${distance.toFixed(1)}
        - Touch method: ${touchCoords.x === phaserCoords.x ? 'Phaser' : 'DOM'}
        - Fullscreen: ${this.isFullscreen}`);

      // 设置触摸范围 - 现在可以更宽松，因为我们不会在移动过程中重置
      const touchRange = this.config.radius + (this.isFullscreen ? 120 : 100);

      if (distance <= touchRange) {  // 在有效触摸范围内
        this.isActive = true;                    // 激活摇杆
        this.activePointerId = pointer.id;       // 记录指针ID
        this.lastUpdateTime = this.scene.time.now;  // 记录最后更新时间

        // 增强视觉反馈 - 流畅的颜色和大小变化
        this.scene.tweens.add({
          targets: this.knob,
          fillColor: 0x00ff88,  // 变为亮绿色
          scaleX: 1.3,
          scaleY: 1.3,
          duration: 150,
          ease: 'Back.easeOut'
        });
        
        this.scene.tweens.add({
          targets: this.base,
          strokeColor: 0x00ff88,  // 底座边框变绿
          duration: 150,
          ease: 'Power2.easeOut'
        });
        
        // 添加更流畅的脉冲效果
        this.scene.tweens.add({
          targets: this.outerRing,
          alpha: 0.4,
          scaleX: 1.1,
          scaleY: 1.1,
          duration: 300,
          yoyo: true,
          repeat: -1,
          ease: 'Sine.easeInOut'
        });

        // 添加触觉反馈 - 开始触摸时轻微振动
        this.triggerHapticFeedback([25], 'light');

        // 创建调试触摸指示器（如果启用调试模式）
        if (this.debugMode) {
          this.createDebugTouchIndicator(touchCoords.x, touchCoords.y);
        }

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
      
      // 动态调整更新频率：移动时更高频率，静止时降低频率
      const minUpdateInterval = this.isActive && (Math.abs(this.vector.x) > 0.1 || Math.abs(this.vector.y) > 0.1) ? 8 : 16;
      if (currentTime - this.lastUpdateTime < minUpdateInterval) {
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

    // 获取摇杆的实际屏幕位置
    const joystickScreenPos = this.getJoystickScreenPosition();
    const deltaX = touchCoords.x - joystickScreenPos.x;  // 计算X方向偏移
    const deltaY = touchCoords.y - joystickScreenPos.y;  // 计算Y方向偏移
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
    
    let newVector = { x: 0, y: 0 };
    
    if (distance > adjustedDeadZone * maxDistance) {
      // 基于实际触摸位置计算输入向量，应用灵敏度
      const inputStrength = Math.min(normalizedDistance * this.sensitivity, 1.8); // 最大1.8倍强度，支持灵敏度调节
      newVector.x = (deltaX / distance) * inputStrength;
      newVector.y = (deltaY / distance) * inputStrength;
    }

    // 验证向量有效性
    if (!isFinite(newVector.x) || !isFinite(newVector.y)) {
      console.warn('Invalid vector calculated, using zero vector');
      newVector = { x: 0, y: 0 };
    }

    // 应用平滑处理
    if (this.smoothing > 0) {
      this.vector.x = this.lerp(this.lastVector.x, newVector.x, 1 - this.smoothing);
      this.vector.y = this.lerp(this.lastVector.y, newVector.y, 1 - this.smoothing);
    } else {
      this.vector.x = newVector.x;
      this.vector.y = newVector.y;
    }

    // 保存当前向量用于下次平滑
    this.lastVector = { ...this.vector };

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

    // 清理调试元素
    this.clearDebugElements();

    // 先停止所有现有动画，避免新旧动画相互干扰造成闪烁
    this.scene.tweens.killTweensOf([this.knob, this.base, this.outerRing]);

    // 平滑动画回到中心与还原视觉状态（无振动、无闪烁）
    this.scene.tweens.add({
      targets: this.knob,
      x: 0,
      y: 0,
      scaleX: 1,
      scaleY: 1,
      fillColor: 0x74b9ff,
      duration: 180,
      ease: 'Power2.easeOut'
    });

    this.scene.tweens.add({
      targets: this.base,
      strokeColor: 0x4a90e2,
      duration: 180,
      ease: 'Power2.easeOut'
    });

    this.scene.tweens.add({
      targets: this.outerRing,
      alpha: 0.15,
      scaleX: 1.0,
      scaleY: 1.0,
      duration: 180,
      ease: 'Power2.easeOut'
    });

    // 触发结束回调
    if (this.onEnd) {
      this.onEnd();
    }

    // 确保移动回调归零
    if (this.onMove) {
      this.onMove({ x: 0, y: 0 });
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
   * 强制更新摇杆位置
   * 在相机移动后调用，确保摇杆位置正确
   */
  public forceUpdatePosition() {
    const uiLayoutManager = (this.scene as any).uiLayoutManager;
    if (uiLayoutManager) {
      const newPosition = uiLayoutManager.getJoystickPosition(this.config.radius);
      this.setPosition(newPosition.x, newPosition.y);
      console.log(`🔄 Joystick position force updated to: (${newPosition.x.toFixed(2)}, ${newPosition.y.toFixed(2)})`);
    }
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
   * 设置调试模式
   * @param enabled 是否启用调试模式
   */
  public setDebugMode(enabled: boolean) {
    this.debugMode = enabled;
    if (!enabled) {
      this.clearDebugElements(); // 关闭调试模式时清理调试元素
    }
  }

  /**
   * 设置摇杆灵敏度
   * @param sensitivity 灵敏度 (0.1 - 2.0)
   */
  public setSensitivity(sensitivity: number) {
    this.sensitivity = Math.max(0.1, Math.min(2.0, sensitivity));
    console.log(`🎮 Joystick sensitivity set to: ${this.sensitivity}`);
  }

  /**
   * 设置摇杆平滑度
   * @param smoothing 平滑度 (0 - 0.8)
   */
  public setSmoothing(smoothing: number) {
    this.smoothing = Math.max(0, Math.min(0.8, smoothing));
    console.log(`🎮 Joystick smoothing set to: ${this.smoothing}`);
  }

  /**
   * 获取摇杆配置
   */
  public getJoystickConfig() {
    return {
      sensitivity: this.sensitivity,
      smoothing: this.smoothing,
      debugMode: this.debugMode,
      radius: this.config.radius,
      knobRadius: this.config.knobRadius,
      deadZone: this.config.deadZone,
      isActive: this.isActive,
      touchCount: this.touchCount
    };
  }

  /**
   * 获取摇杆在屏幕坐标系中的实际位置
   * 考虑scrollFactor(0)的影响，返回真实的屏幕坐标
   */
  private getJoystickScreenPosition(): { x: number; y: number } {
    // 由于摇杆使用了setScrollFactor(0)，它在屏幕上的位置应该是固定的
    // 但是container.x和container.y可能受到初始设置时相机位置的影响
    
    const camera = this.scene.cameras.main;
    
    // 方法1：直接使用容器坐标（如果摇杆是在相机滚动为0时创建的）
    let screenX = this.container.x;
    let screenY = this.container.y;
    
    // 方法2：如果摇杆位置包含了初始相机偏移，需要校正
    // 检查是否需要校正：如果摇杆位置看起来不合理，尝试校正
    if (screenX < 0 || screenX > this.scene.scale.gameSize.width || 
        screenY < 0 || screenY > this.scene.scale.gameSize.height) {
      console.warn('Joystick position seems incorrect, attempting correction');
      // 使用UILayoutManager重新计算位置
      const uiLayoutManager = (this.scene as any).uiLayoutManager;
      if (uiLayoutManager) {
        const correctedPosition = uiLayoutManager.getJoystickPosition(this.config.radius);
        screenX = correctedPosition.x;
        screenY = correctedPosition.y;
        
        // 更新容器位置
        this.container.setPosition(screenX, screenY);
        this.config.x = screenX;
        this.config.y = screenY;
        
        console.log(`Corrected joystick position to: (${screenX.toFixed(2)}, ${screenY.toFixed(2)})`);
      }
    }
    
    return { x: screenX, y: screenY };
  }

  /**
   * 测试坐标转换准确性
   * 在摇杆中心创建一个测试点，验证触摸检测是否准确
   */
  public testCoordinateAccuracy() {
    if (!this.debugMode) return;
    
    console.log('🧪 Testing coordinate accuracy...');
    
    // 获取摇杆的实际屏幕位置
    const screenPos = this.getJoystickScreenPosition();
    
    // 创建一个测试指示器在摇杆中心
    const testIndicator = this.scene.add.circle(screenPos.x, screenPos.y, 5, 0x00ff00, 1.0);
    testIndicator.setStrokeStyle(2, 0x000000, 1.0);
    testIndicator.setDepth(10002);
    testIndicator.setScrollFactor(0);
    
    // 记录详细的位置信息
    this.logJoystickPositionDebug();
    
    console.log(`🎯 Green test indicator placed at joystick screen position: (${screenPos.x.toFixed(2)}, ${screenPos.y.toFixed(2)})`);
    console.log(`📍 Container position: (${this.container.x.toFixed(2)}, ${this.container.y.toFixed(2)})`);
    console.log('👆 Touch the green dot and compare with the red touch indicator position');
    
    // 5秒后自动清理
    this.scene.time.delayedCall(5000, () => {
      testIndicator.destroy();
      console.log('🧪 Coordinate accuracy test completed');
    });
  }

  /**
   * 全面的坐标系统测试
   * 创建多个测试点来验证不同的坐标转换方法
   */
  public comprehensiveCoordinateTest() {
    if (!this.debugMode) return;
    
    console.log('🔬 Starting comprehensive coordinate test...');
    
    const camera = this.scene.cameras.main;
    const canvas = this.scene.game.canvas;
    
    // 创建多个测试点使用不同的坐标计算方法
    const testPoints: { name: string; x: number; y: number; color: number }[] = [];
    
    // 方法1：直接使用容器坐标
    testPoints.push({
      name: 'Container Direct',
      x: this.container.x,
      y: this.container.y,
      color: 0x00ff00
    });
    
    // 方法2：使用getJoystickScreenPosition
    const screenPos = this.getJoystickScreenPosition();
    testPoints.push({
      name: 'Screen Position',
      x: screenPos.x,
      y: screenPos.y,
      color: 0x0000ff
    });
    
    // 方法3：使用UILayoutManager计算的位置
    const uiLayoutManager = (this.scene as any).uiLayoutManager;
    if (uiLayoutManager) {
      const layoutPos = uiLayoutManager.getJoystickPosition(this.config.radius);
      testPoints.push({
        name: 'Layout Manager',
        x: layoutPos.x,
        y: layoutPos.y,
        color: 0xff0000
      });
    }
    
    // 方法4：考虑相机变换的位置
    testPoints.push({
      name: 'Camera Adjusted',
      x: this.config.x - camera.scrollX,
      y: this.config.y - camera.scrollY,
      color: 0xffff00
    });
    
    // 创建测试指示器
    const indicators: Phaser.GameObjects.Arc[] = [];
    testPoints.forEach((point, index) => {
      const indicator = this.scene.add.circle(point.x, point.y, 8 + index * 2, point.color, 0.7);
      indicator.setStrokeStyle(2, 0x000000, 1.0);
      indicator.setDepth(10003 + index);
      indicator.setScrollFactor(0);
      indicators.push(indicator);
      
      console.log(`${point.name}: (${point.x.toFixed(2)}, ${point.y.toFixed(2)})`);
    });
    
    // 输出详细的系统信息
    console.log(`📊 System Information:
      - Camera scroll: (${camera.scrollX.toFixed(2)}, ${camera.scrollY.toFixed(2)})
      - Camera zoom: ${camera.zoom}
      - Game size: ${this.scene.scale.gameSize.width}x${this.scene.scale.gameSize.height}
      - Canvas size: ${canvas ? `${canvas.width}x${canvas.height}` : 'N/A'}
      - Canvas client: ${canvas ? `${canvas.clientWidth}x${canvas.clientHeight}` : 'N/A'}
      - Container scroll factor: (${this.container.scrollFactorX}, ${this.container.scrollFactorY})
      - Config position: (${this.config.x}, ${this.config.y})`);
    
    // 10秒后清理
    this.scene.time.delayedCall(10000, () => {
      indicators.forEach(indicator => indicator.destroy());
      console.log('🔬 Comprehensive coordinate test completed');
    });
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
   * 创建调试触摸指示器（使用对象池优化性能）
   * 显示实际的触摸位置，用于调试坐标转换问题
   * @param x 触摸X坐标
   * @param y 触摸Y坐标
   */
  private createDebugTouchIndicator(x: number, y: number) {
    // 清理之前的指示器
    if (this.debugTouchIndicator) {
      this.returnToPool(this.debugTouchIndicator);
    }

    // 从对象池获取或创建新的指示器
    this.debugTouchIndicator = this.getFromPool();
    this.debugTouchIndicator.setPosition(x, y);
    this.debugTouchIndicator.setVisible(true);
    this.debugTouchIndicator.setAlpha(0.8);
    this.debugTouchIndicator.setScale(1.0);

    // 添加脉冲动画
    this.scene.tweens.add({
      targets: this.debugTouchIndicator,
      scaleX: 1.5,
      scaleY: 1.5,
      alpha: 0.3,
      duration: 300,
      yoyo: true,
      repeat: 2,
      onComplete: () => {
        // 动画完成后回收到对象池
        if (this.debugTouchIndicator) {
          this.returnToPool(this.debugTouchIndicator);
          this.debugTouchIndicator = undefined;
        }
      }
    });

    // 同时显示摇杆中心位置的调试信息
    this.logJoystickPositionDebug();

    console.debug(`🔴 Debug touch indicator created at (${x.toFixed(2)}, ${y.toFixed(2)})`);
  }

  /**
   * 从对象池获取调试元素
   */
  private getFromPool(): Phaser.GameObjects.Arc {
    if (this.debugElementPool.length > 0) {
      return this.debugElementPool.pop()!;
    } else {
      // 创建新的调试元素
      const indicator = this.scene.add.circle(0, 0, 10, 0xff0000, 0.8);
      indicator.setStrokeStyle(2, 0xffffff, 1.0);
      indicator.setDepth(10001);
      indicator.setScrollFactor(0);
      return indicator;
    }
  }

  /**
   * 将调试元素回收到对象池
   */
  private returnToPool(indicator: Phaser.GameObjects.Arc) {
    indicator.setVisible(false);
    this.scene.tweens.killTweensOf(indicator);
    if (this.debugElementPool.length < 3) { // 限制池大小
      this.debugElementPool.push(indicator);
    } else {
      indicator.destroy();
    }
  }

  /**
   * 记录摇杆位置调试信息
   */
  private logJoystickPositionDebug() {
    const camera = this.scene.cameras.main;
    const canvas = this.scene.game.canvas;
    
    console.debug(`🎮 Joystick Position Debug:
      - Container position: (${this.container.x.toFixed(2)}, ${this.container.y.toFixed(2)})
      - Container world position: (${(this.container.x + camera.scrollX).toFixed(2)}, ${(this.container.y + camera.scrollY).toFixed(2)})
      - Container scroll factor: (${this.container.scrollFactorX}, ${this.container.scrollFactorY})
      - Camera scroll: (${camera.scrollX.toFixed(2)}, ${camera.scrollY.toFixed(2)})
      - Camera zoom: ${camera.zoom}
      - Game size: ${this.scene.scale.gameSize.width}x${this.scene.scale.gameSize.height}
      - Canvas size: ${canvas ? `${canvas.width}x${canvas.height}` : 'N/A'}
      - Canvas client size: ${canvas ? `${canvas.clientWidth}x${canvas.clientHeight}` : 'N/A'}`);
  }

  /**
   * 清理调试元素
   */
  private clearDebugElements() {
    if (this.debugTouchIndicator) {
      this.returnToPool(this.debugTouchIndicator);
      this.debugTouchIndicator = undefined;
    }
    
    // 清理对象池
    this.debugElementPool.forEach(element => element.destroy());
    this.debugElementPool = [];
  }

  /**
   * 清理资源
   * 销毁摇杆对象并清理所有回调
   */
  public destroy() {
    // 清理调试元素
    this.clearDebugElements();

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
   * @param intensity 强度级别 ('light' | 'medium' | 'heavy')
   */
  private triggerHapticFeedback(pattern: number[], intensity: 'light' | 'medium' | 'heavy' = 'medium') {
    try {
      // 检查设备是否支持振动
      if ('vibrate' in navigator && navigator.vibrate) {
        // 根据强度调整振动模式
        const adjustedPattern = pattern.map(duration => {
          switch (intensity) {
            case 'light': return Math.max(5, duration * 0.5);
            case 'heavy': return duration * 1.5;
            default: return duration;
          }
        });
        navigator.vibrate(adjustedPattern);
      }

      // 尝试使用Web Vibration API的新特性
      if ('vibrate' in navigator && typeof (navigator as any).vibrate === 'function') {
        (navigator as any).vibrate(pattern);
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
   * 线性插值函数
   * @param a 起始值
   * @param b 目标值
   * @param t 插值因子 (0-1)
   * @returns 插值结果
   */
  private lerp(a: number, b: number, t: number): number {
    return a + (b - a) * Math.max(0, Math.min(1, t));
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
   * 获取正确的触摸坐标 - 简化版本
   * 使用最直接的方法获取屏幕坐标
   * @param pointer 触摸指针对象
   * @returns 转换后的坐标（屏幕坐标系）
   */
  private getTouchCoordinates(pointer: Phaser.Input.Pointer): { x: number; y: number } {
    const camera = this.scene.cameras.main;
    const canvas = this.scene.game.canvas;
    
    // 方法1：尝试使用DOM事件的原始坐标（最准确）
    if (canvas && pointer.event) {
      const canvasRect = canvas.getBoundingClientRect();
      let clientX: number, clientY: number;
      
      // 获取DOM事件坐标
      if ('clientX' in pointer.event && 'clientY' in pointer.event) {
        clientX = pointer.event.clientX;
        clientY = pointer.event.clientY;
      } else if ('touches' in pointer.event && pointer.event.touches.length > 0) {
        const touch = pointer.event.touches[0];
        clientX = touch.clientX;
        clientY = touch.clientY;
      } else {
        // 回退到Phaser坐标
        return this.getPhaserScreenCoordinates(pointer, camera);
      }
      
      // 将DOM坐标转换为游戏屏幕坐标
      const canvasX = clientX - canvasRect.left;
      const canvasY = clientY - canvasRect.top;
      
      // 计算缩放比例
      const gameWidth = this.scene.scale.gameSize.width;
      const gameHeight = this.scene.scale.gameSize.height;
      const scaleX = gameWidth / canvasRect.width;
      const scaleY = gameHeight / canvasRect.height;
      
      const screenX = canvasX * scaleX;
      const screenY = canvasY * scaleY;
      
      console.debug(`DOM touch: client(${clientX.toFixed(1)}, ${clientY.toFixed(1)}) -> canvas(${canvasX.toFixed(1)}, ${canvasY.toFixed(1)}) -> screen(${screenX.toFixed(1)}, ${screenY.toFixed(1)})`);
      
      return { x: screenX, y: screenY };
    }
    
    // 方法2：回退到Phaser坐标转换
    return this.getPhaserScreenCoordinates(pointer, camera);
  }

  /**
   * 使用Phaser内置方法获取屏幕坐标
   * @param pointer 触摸指针
   * @param camera 相机对象
   * @returns 屏幕坐标
   */
  private getPhaserScreenCoordinates(pointer: Phaser.Input.Pointer, camera: Phaser.Cameras.Scene2D.Camera): { x: number; y: number } {
    // 对于固定在屏幕上的UI，直接使用指针的屏幕坐标
    const screenX = pointer.x;
    const screenY = pointer.y;
    console.debug(`Phaser touch (screen): (${screenX.toFixed(1)}, ${screenY.toFixed(1)})`);
    return { x: screenX, y: screenY };
  }
}
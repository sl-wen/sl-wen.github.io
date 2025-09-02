/**
 * 游戏输入管理器
 * 
 * 负责处理游戏中的所有输入操作，包括：
 * - 键盘输入（WASD、方向键、空格键、回车键）
 * - 虚拟摇杆输入（触摸屏）
 * - 动作按钮输入
 * - 输入优先级管理
 * 
 * 使用方法：
 * 1. 在游戏场景中创建实例：this.inputManager = new InputManager(this);
 * 2. 在游戏循环中调用相应方法获取输入状态
 * 3. 在场景销毁时调用 destroy() 方法清理资源
 * 
 * 输入优先级：
 * 虚拟摇杆 > 键盘输入（触摸屏操作优先于键盘操作）
 */

class InputManager {
  /**
   * 构造函数
   * @param {Phaser.Scene} scene - 游戏场景对象
   */
  constructor(scene) {
    this.scene = scene;
    
    // 输入状态管理
    this.virtualJoystickDirection = null;  // 虚拟摇杆方向
    this.virtualJoystickVector = null;      // 虚拟摇杆向量信息 { dx, dy, angle }
    this.keyboardDirection = null;          // 键盘方向
    this.currentDirection = null;           // 当前有效方向
    this.actionButtonPressed = false;       // 动作按钮是否被按下
    
    // 初始化键盘输入
    this.initializeKeyboardInput();
    
    // 设置输入事件监听
    this.setupInputListeners();
  }

  /**
   * 初始化键盘输入
   * 设置各种按键的监听
   */
  initializeKeyboardInput() {
    // 功能键
    this.enterKey = this.scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ENTER);
    this.spaceKey = this.scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
    
    // 方向键
    this.cursors = this.scene.input.keyboard.createCursorKeys();
    
    // WASD 键（作为方向键的替代）
    this.wasd = this.scene.input.keyboard.addKeys({
      up: Phaser.Input.Keyboard.KeyCodes.W,
      down: Phaser.Input.Keyboard.KeyCodes.S,
      left: Phaser.Input.Keyboard.KeyCodes.A,
      right: Phaser.Input.Keyboard.KeyCodes.D,
    });
  }

  /**
   * 设置输入事件监听器
   * 监听来自 React 组件的输入事件
   */
  setupInputListeners() {
    // 监听虚拟摇杆方向变化
    window.addEventListener('virtual-joystick-direction', (event) => {
      const { direction, dx, dy, angle } = event.detail || {};
      this.virtualJoystickDirection = direction;
      // 如果提供了向量信息，则记录用于角度/主轴判断
      if (typeof dx === 'number' && typeof dy === 'number') {
        this.virtualJoystickVector = { dx, dy, angle };
      } else {
        this.virtualJoystickVector = null;
      }
      this.updateCurrentDirection();
    });

    // 监听动作按钮
    window.addEventListener('action-button-pressed', (event) => {
      // 模拟空格键按下
      this.actionButtonPressed = true;
      // 延迟重置，避免重复触发
      setTimeout(() => {
        this.actionButtonPressed = false;
      }, 100);
    });

    // 监听键盘输入
    this.scene.input.keyboard.on('keydown', (event) => {
      this.updateKeyboardDirection();
    });

    this.scene.input.keyboard.on('keyup', (event) => {
      this.updateKeyboardDirection();
    });
  }

  /**
   * 更新键盘方向状态
   * 检测当前按下的方向键
   */
  updateKeyboardDirection() {
    let direction = null;

    const left = this.cursors.left.isDown || this.wasd.left.isDown;
    const right = this.cursors.right.isDown || this.wasd.right.isDown;
    const up = this.cursors.up.isDown || this.wasd.up.isDown;
    const down = this.cursors.down.isDown || this.wasd.down.isDown;

    // 支持斜方向（组合键）
    if (up && left && !right && !down) {
      direction = 'up-left';
    } else if (up && right && !left && !down) {
      direction = 'up-right';
    } else if (down && left && !right && !up) {
      direction = 'down-left';
    } else if (down && right && !left && !up) {
      direction = 'down-right';
    } else if (left && !right) {
      direction = 'left';
    } else if (right && !left) {
      direction = 'right';
    } else if (up && !down) {
      direction = 'up';
    } else if (down && !up) {
      direction = 'down';
    }
    
    this.keyboardDirection = direction;
    this.updateCurrentDirection();
  }

  /**
   * 更新当前有效方向
   * 根据输入优先级确定最终的方向
   */
  updateCurrentDirection() {
    // 虚拟摇杆优先级高于键盘（保持原始 8 向，用于移动逻辑）
    const sourceDirection = this.virtualJoystickDirection ?? this.keyboardDirection;
    this.currentDirection = sourceDirection;
  }

  /**
   * 获取当前方向
   * @returns {string|null} 当前方向（始终归一为 'up' | 'down' | 'left' | 'right' 或 null）
   */
  getCurrentDirection() {
    return this.currentDirection;
  }

  /**
   * 检查指定方向是否被按下
   * @param {string} direction - 要检查的方向
   * @returns {boolean} 如果指定方向被按下则返回 true
   */
  isDirectionPressed(direction) {
    return this.currentDirection === direction;
  }

  /**
   * 检查是否有任何方向被按下
   * @returns {boolean} 如果有方向被按下则返回 true
   */
  isAnyDirectionPressed() {
    return this.currentDirection !== null;
  }

  /**
   * 检查回车键是否刚被按下
   * @returns {boolean} 如果回车键刚被按下则返回 true
   */
  isEnterJustDown() {
    return Phaser.Input.Keyboard.JustDown(this.enterKey);
  }

  /**
   * 检查空格键或动作按钮是否刚被按下
   * @returns {boolean} 如果空格键或动作按钮刚被按下则返回 true
   */
  isSpaceJustDown() {
    // 消费一次性动作按钮按下（移动端），避免同一帧被多处处理（交互与攻击同时触发）
    if (this.actionButtonPressed) {
      this.actionButtonPressed = false;
      return true;
    }
    // 键盘空格键使用 Phaser 的一次性 JustDown 语义
    return Phaser.Input.Keyboard.JustDown(this.spaceKey);
  }

  /**
   * 清理资源
   * 注意：这里不需要移除事件监听器，因为事件监听器是在window上全局添加的
   * 如果需要清理，可以在组件卸载时处理
   */
  destroy() {
    // 注意：这里不需要移除事件监听器，因为事件监听器是在window上全局添加的
    // 如果需要清理，可以在组件卸载时处理
  }

  /**
   * 将 8 向方向归一化为 4 向方向。
   * 若提供 dx/dy，则根据主轴（|dx| vs |dy|）和符号来决定最贴近摇杆朝向的 4 向方向。
   * 若仅提供合成字符串（如 'up-left'），则采用合理的回退映射。
   * @param {string|null} direction
   * @param {{dx:number,dy:number,angle?:number}|null} vector
   * @returns {string|null}
   */
  normalizeToCardinal(direction, vector) {
    if (!direction) return null;
    // 已是 4 向
    if (direction === 'up' || direction === 'down' || direction === 'left' || direction === 'right') {
      return direction;
    }

    // 优先使用摇杆的向量信息
    if (vector && typeof vector.dx === 'number' && typeof vector.dy === 'number') {
      const { dx, dy } = vector;
      if (Math.abs(dx) >= Math.abs(dy)) {
        return dx >= 0 ? 'right' : 'left';
      }
      return dy >= 0 ? 'down' : 'up';
    }

    // 回退：仅根据合成方向名进行近似映射（垂直优先，避免左右抖动）
    switch (direction) {
      case 'up-left':
      case 'up-right':
        return 'up';
      case 'down-left':
      case 'down-right':
        return 'down';
      default:
        return null;
    }
  }

  /** 获取当前方向的 4 向表示（用于选择 4 向素材） */
  getCurrentCardinalDirection() {
    return this.normalizeToCardinal(this.currentDirection, this.virtualJoystickVector);
  }

  /** 获取最近一次虚拟摇杆向量（dx/dy/angle），若无则返回 null */
  getLastJoystickVector() {
    return this.virtualJoystickVector || null;
  }
}

export default InputManager;
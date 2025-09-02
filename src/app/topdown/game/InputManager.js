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
      this.virtualJoystickDirection = event.detail.direction;
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
    
    // 检测方向键或 WASD 键的按下状态
    if (this.cursors.left.isDown || this.wasd.left.isDown) {
      direction = 'left';
    } else if (this.cursors.right.isDown || this.wasd.right.isDown) {
      direction = 'right';
    } else if (this.cursors.up.isDown || this.wasd.up.isDown) {
      direction = 'up';
    } else if (this.cursors.down.isDown || this.wasd.down.isDown) {
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
    // 虚拟摇杆优先级高于键盘
    this.currentDirection = this.virtualJoystickDirection || this.keyboardDirection;
  }

  /**
   * 获取当前方向
   * @returns {string|null} 当前方向（'up', 'down', 'left', 'right' 或 null）
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
    // 支持动作按钮和空格键
    return this.actionButtonPressed || Phaser.Input.Keyboard.JustDown(this.spaceKey);
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
}

export default InputManager;
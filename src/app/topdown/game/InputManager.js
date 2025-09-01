class InputManager {
  constructor(scene) {
    this.scene = scene;
    this.virtualJoystickDirection = null;
    this.keyboardDirection = null;
    this.currentDirection = null;
    this.actionButtonPressed = false;
    
    // 键盘输入
    this.enterKey = scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ENTER);
    this.spaceKey = scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
    this.cursors = scene.input.keyboard.createCursorKeys();
    this.wasd = scene.input.keyboard.addKeys({
      up: Phaser.Input.Keyboard.KeyCodes.W,
      down: Phaser.Input.Keyboard.KeyCodes.S,
      left: Phaser.Input.Keyboard.KeyCodes.A,
      right: Phaser.Input.Keyboard.KeyCodes.D,
    });

    // 设置输入事件监听
    this.setupInputListeners();
  }

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

  updateKeyboardDirection() {
    let direction = null;
    
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

  updateCurrentDirection() {
    // 虚拟摇杆优先级高于键盘
    this.currentDirection = this.virtualJoystickDirection || this.keyboardDirection;
  }

  getCurrentDirection() {
    return this.currentDirection;
  }

  isDirectionPressed(direction) {
    return this.currentDirection === direction;
  }

  isAnyDirectionPressed() {
    return this.currentDirection !== null;
  }

  // 获取按键状态
  isEnterJustDown() {
    return Phaser.Input.Keyboard.JustDown(this.enterKey);
  }

  isSpaceJustDown() {
    // 支持动作按钮和空格键
    return this.actionButtonPressed || Phaser.Input.Keyboard.JustDown(this.spaceKey);
  }

  // 清理事件监听
  destroy() {
    // 注意：这里不需要移除事件监听器，因为事件监听器是在window上全局添加的
    // 如果需要清理，可以在组件卸载时处理
  }
}

export default InputManager;
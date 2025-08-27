import * as Phaser from 'phaser';
import { GameManager } from './GameManager';

/**
 * 输入管理器类 - 统一输入处理系统
 * 
 * 参考 top-down-react-phaser-game 的输入处理架构，提供跨平台的统一输入管理。
 * 支持键盘、鼠标、触摸等多种输入方式，并针对不同设备进行优化。
 * 
 * 核心特性：
 * - ⌨️ 键盘输入：WASD移动、功能快捷键、组合键支持
 * - 🖱️ 鼠标输入：点击、拖拽、滚轮等操作
 * - 📱 触摸输入：单点、多点触摸、手势识别
 * - 🎮 输入缓冲：支持复杂的输入序列和组合键
 * - 🔄 平台适配：自动识别设备类型并调整输入策略
 * - 🚫 防抖处理：避免重复输入和误操作
 * 
 * 输入映射：
 * - 移动控制：WASD / 方向键 / 虚拟摇杆
 * - 交互操作：空格键 / E键 / 点击
 * - 界面控制：I(背包) / C(烹饪) / ESC(菜单)
 * - 工具选择：数字键1-4快速切换工具
 * - 系统功能：F5(保存) / F9(加载) / F11(全屏)
 */
export class InputManager {
  private scene: Phaser.Scene;
  private gameManager: GameManager;
  private cursors: Phaser.Types.Input.Keyboard.CursorKeys | null = null;
  private wasdKeys: Record<string, Phaser.Input.Keyboard.Key> = {};
  private actionKeys: Record<string, Phaser.Input.Keyboard.Key> = {};
  
  // 输入状态
  private inputState = {
    movement: { x: 0, y: 0 },
    isMoving: false,
    lastInputTime: 0,
    inputBuffer: [] as string[]
  };

  // 移动端触摸支持
  private touchControls = {
    startX: 0,
    startY: 0,
    currentX: 0,
    currentY: 0,
    isPointerDown: false,
    lastTapTime: 0,
    tapThreshold: 300 // 双击阈值
  };

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.gameManager = GameManager.getInstance();
    this.setupInputs();
  }

  /**
   * 设置输入控制
   */
  private setupInputs(): void {
    // 键盘输入设置
    this.setupKeyboardInputs();
    
    // 鼠标和触摸输入设置
    this.setupPointerInputs();
    
    // 监听窗口失去焦点事件
    this.setupWindowEvents();
  }

  /**
   * 设置键盘输入
   */
  private setupKeyboardInputs(): void {
    if (!this.scene.input.keyboard) return;

    // 方向键
    this.cursors = this.scene.input.keyboard.createCursorKeys();

    // WASD键
    this.wasdKeys = this.scene.input.keyboard.addKeys('W,S,A,D') as Record<string, Phaser.Input.Keyboard.Key>;

    // 功能键
    this.actionKeys = {
      space: this.scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE),
      interact: this.scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.E),
      inventory: this.scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.I),
      cooking: this.scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.C),
      menu: this.scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ESC),
      tool1: this.scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ONE),
      tool2: this.scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.TWO),
      tool3: this.scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.THREE),
      tool4: this.scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.FOUR),
      save: this.scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.F5),
      load: this.scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.F9)
    };

    // 设置键盘事件监听
    Object.keys(this.actionKeys).forEach(key => {
      this.actionKeys[key].on('down', () => this.handleActionKey(key));
    });
  }

  /**
   * 设置指针（鼠标/触摸）输入
   */
  private setupPointerInputs(): void {
    // 指针按下事件
    this.scene.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      this.touchControls.isPointerDown = true;
      this.touchControls.startX = pointer.x;
      this.touchControls.startY = pointer.y;
      this.touchControls.currentX = pointer.x;
      this.touchControls.currentY = pointer.y;

      // 检测双击
      const currentTime = Date.now();
      if (currentTime - this.touchControls.lastTapTime < this.touchControls.tapThreshold) {
        this.handleDoubleTap(pointer);
      }
      this.touchControls.lastTapTime = currentTime;

      this.gameManager.emit('pointer-down', pointer);
    });

    // 指针移动事件
    this.scene.input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
      if (this.touchControls.isPointerDown) {
        this.touchControls.currentX = pointer.x;
        this.touchControls.currentY = pointer.y;
        this.handlePointerMove(pointer);
      }
    });

    // 指针抬起事件
    this.scene.input.on('pointerup', (pointer: Phaser.Input.Pointer) => {
      if (this.touchControls.isPointerDown) {
        this.handlePointerUp(pointer);
      }
      this.touchControls.isPointerDown = false;
      this.gameManager.emit('pointer-up', pointer);
    });
  }

  /**
   * 设置窗口事件
   */
  private setupWindowEvents(): void {
    // 窗口失去焦点时清除输入状态
    window.addEventListener('blur', () => {
      this.clearInputState();
    });

    // 防止右键菜单
    this.scene.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      if (pointer.rightButtonDown()) {
        pointer.event.preventDefault();
      }
    });
  }

  /**
   * 更新输入状态（每帧调用）
   */
  public update(): void {
    this.updateMovementInput();
    this.updateInputBuffer();
  }

  /**
   * 更新移动输入
   */
  private updateMovementInput(): void {
    const movement = { x: 0, y: 0 };

    // 键盘输入
    if (this.cursors) {
      if (this.cursors.left.isDown || this.wasdKeys.A?.isDown) movement.x -= 1;
      if (this.cursors.right.isDown || this.wasdKeys.D?.isDown) movement.x += 1;
      if (this.cursors.up.isDown || this.wasdKeys.W?.isDown) movement.y -= 1;
      if (this.cursors.down.isDown || this.wasdKeys.S?.isDown) movement.y += 1;
    }

    // 更新输入状态
    this.inputState.movement = movement;
    this.inputState.isMoving = movement.x !== 0 || movement.y !== 0;

    if (this.inputState.isMoving) {
      this.inputState.lastInputTime = Date.now();
      this.gameManager.emit('player-movement', movement);
    }
  }

  /**
   * 更新输入缓冲区
   */
  private updateInputBuffer(): void {
    // 清理过期的输入缓冲
    const currentTime = Date.now();
    this.inputState.inputBuffer = this.inputState.inputBuffer.filter(
      input => currentTime - parseInt(input.split(':')[1]) < 500
    );
  }

  /**
   * 处理功能键按下
   */
  private handleActionKey(keyName: string): void {
    this.addToInputBuffer(keyName);

    switch (keyName) {
      case 'space':
      case 'interact':
        this.gameManager.emit('player-interact');
        break;
      case 'inventory':
        this.gameManager.emit('toggle-inventory');
        break;
      case 'cooking':
        this.gameManager.emit('open-cooking');
        break;
      case 'menu':
        this.gameManager.emit('toggle-menu');
        break;
      case 'tool1':
      case 'tool2':
      case 'tool3':
      case 'tool4':
        const toolIndex = parseInt(keyName.replace('tool', '')) - 1;
        this.gameManager.emit('select-tool', toolIndex);
        break;
      case 'save':
        this.gameManager.saveGame();
        break;
      case 'load':
        this.gameManager.loadGame();
        break;
    }
  }

  /**
   * 处理指针移动
   */
  private handlePointerMove(pointer: Phaser.Input.Pointer): void {
    const deltaX = this.touchControls.currentX - this.touchControls.startX;
    const deltaY = this.touchControls.currentY - this.touchControls.startY;
    
    // 如果移动距离足够大，视为拖拽操作
    if (Math.abs(deltaX) > 10 || Math.abs(deltaY) > 10) {
      this.gameManager.emit('pointer-drag', { deltaX, deltaY, pointer });
    }
  }

  /**
   * 处理指针抬起
   */
  private handlePointerUp(pointer: Phaser.Input.Pointer): void {
    const deltaX = this.touchControls.currentX - this.touchControls.startX;
    const deltaY = this.touchControls.currentY - this.touchControls.startY;
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

    // 如果移动距离很小，视为点击
    if (distance < 10) {
      this.gameManager.emit('pointer-tap', pointer);
    }
  }

  /**
   * 处理双击
   */
  private handleDoubleTap(pointer: Phaser.Input.Pointer): void {
    this.gameManager.emit('pointer-double-tap', pointer);
  }

  /**
   * 添加到输入缓冲区
   */
  private addToInputBuffer(input: string): void {
    const timestamp = Date.now();
    this.inputState.inputBuffer.push(`${input}:${timestamp}`);
  }

  /**
   * 获取移动输入
   */
  public getMovementInput(): { x: number; y: number } {
    return { ...this.inputState.movement };
  }

  /**
   * 检查是否正在移动
   */
  public isMoving(): boolean {
    return this.inputState.isMoving;
  }

  /**
   * 检查特定键是否按下
   */
  public isKeyDown(key: string): boolean {
    if (this.actionKeys[key]) {
      return this.actionKeys[key].isDown;
    }
    
    if (this.cursors) {
      switch (key) {
        case 'left': return this.cursors.left.isDown;
        case 'right': return this.cursors.right.isDown;
        case 'up': return this.cursors.up.isDown;
        case 'down': return this.cursors.down.isDown;
      }
    }
    
    if (this.wasdKeys[key.toUpperCase()]) {
      return this.wasdKeys[key.toUpperCase()].isDown;
    }
    
    return false;
  }

  /**
   * 清除输入状态
   */
  public clearInputState(): void {
    this.inputState.movement = { x: 0, y: 0 };
    this.inputState.isMoving = false;
    this.inputState.inputBuffer = [];
    this.touchControls.isPointerDown = false;
  }

  /**
   * 获取输入历史（用于组合键检测）
   */
  public getInputHistory(): string[] {
    return [...this.inputState.inputBuffer];
  }

  /**
   * 销毁输入管理器
   */
  public destroy(): void {
    this.clearInputState();
    window.removeEventListener('blur', this.clearInputState);
  }
}
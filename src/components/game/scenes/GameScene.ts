import * as Phaser from 'phaser';
import { CookingStation } from '../entities/CookingStation';
import { FarmPlot } from '../entities/FarmPlot';
import { InventoryManager } from '../entities/InventoryManager';
import { Cat } from '../entities/Player';
import { TileMapManager } from '../entities/TileMapManager';
import { FarmLayoutManager } from '../FarmLayoutManager';
import { SeasonType, WeatherSystem } from '../systems/WeatherSystem';
import { CropType, ToolType } from '../types/GameTypes';
import { UILayoutManager } from '../UILayoutManager';
import { ResourceLoader } from '../utils/ResourceLoader';
import { TileResourceConfig } from '../utils/TileResourceConfig';
import { VirtualJoystick } from '../VirtualJoystick';

/**
 * 游戏主场景类
 * 负责管理整个游戏的核心逻辑，包括玩家控制、农场交互、UI管理等
 */
export class GameScene extends Phaser.Scene {
  // 游戏实体
  private cat!: Cat;                                    // 玩家角色（小猫）
  private farmPlots!: Phaser.GameObjects.Group;        // 农田地块组
  private cookingStations!: Phaser.GameObjects.Group;  // 烹饪站组
  private decorations!: Phaser.GameObjects.Group;      // 装饰物组
  private inventoryManager!: InventoryManager;         // 背包管理器

  // 键盘控制系统
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;  // 方向键
  private wasdKeys!: Record<string, Phaser.Input.Keyboard.Key>;  // WASD键
  private interactKey!: Phaser.Input.Keyboard.Key;           // 交互键（空格）
  private inventoryKey!: Phaser.Input.Keyboard.Key;          // 背包键（I）
  private cookingKey!: Phaser.Input.Keyboard.Key;            // 烹饪键（C）

  // 移动端控制系统
  private virtualJoystick!: VirtualJoystick;                // 虚拟摇杆
  private uiLayoutManager!: UILayoutManager;                 // UI布局管理器
  private farmLayoutManager!: FarmLayoutManager;             // 农场布局管理器
  private tileMapManager!: TileMapManager;                   // 瓦片地图管理器
  private weatherSystem!: WeatherSystem;                     // 天气系统
  private actionButtons: Phaser.GameObjects.Container[] = []; // 动作按钮数组

  // 游戏状态属性
  private currentTool: ToolType | null = null;                                    // 当前选择的工具
  private toolTooltip: Phaser.GameObjects.Text | null = null;                    // 工具提示文本
  private hapticEnabled: boolean = false;                                        // 触觉反馈开关
  private particlePool: Phaser.GameObjects.Particles.ParticleEmitter[] = [];     // 粒子效果池（性能优化）
  private performanceMode: 'high' | 'medium' | 'low' = 'high';                   // 性能模式
  private frameCounter: number = 0;                                              // 帧计数器
  private lastFPSCheck: number = 0;                                              // 上次FPS检查时间
  private lastTapTime: number = 0;                                               // 上次点击时间（双击重置）
  private emergencyResetEnabled: boolean = true;                                 // 紧急重置开关
  private orientationHandlers: { orientationChange: () => void; resize: () => void } | null = null; // 屏幕方向变化处理器

  /**
   * 构造函数
   */
  constructor() {
    super({ key: 'GameScene' });
  }

  /**
   * 场景创建方法 - 游戏初始化入口
   * 负责创建所有游戏元素和设置游戏系统
   */
  async create() {
    console.log('GameScene create() called');

    try {
      // 初始化背包系统
      console.log('Initializing inventory system...');
      this.inventoryManager = new InventoryManager();
      this.inventoryManager.addTestItems(); // 添加测试物品
      console.log('Inventory system initialized');

      // 创建游戏世界背景
      console.log('Creating game world background...');
      this.createWorldBackground();
      console.log('Game world background created');

      // 初始化UI布局管理器（优先初始化）
      console.log('Initializing UI layout manager...');
      this.uiLayoutManager = new UILayoutManager(this);
      console.log('UI layout manager initialized');

      // 初始化瓦片地图管理器
      console.log('Initializing tile map manager...');
      this.tileMapManager = new TileMapManager(this);
      await this.loadTileResources();
      this.tileMapManager.createDefaultFarmMap();
      console.log('Tile map manager initialized');

      // 初始化农场布局管理器
      console.log('Initializing farm layout manager...');
      this.farmLayoutManager = new FarmLayoutManager(this);
      console.log('Farm layout manager initialized');

      // 初始化天气系统
      console.log('Initializing weather system...');
      this.weatherSystem = new WeatherSystem(this);
      this.setupWeatherEventHandlers();
      console.log('Weather system initialized');

      // 创建玩家角色（小猫）
      console.log('Creating cat player...');
      this.cat = new Cat(this, 200, 200);
      console.log('Cat player created successfully');

      // 创建农田地块组
      this.farmPlots = this.add.group();
      this.createFarmPlots();

      // 创建烹饪站组
      this.cookingStations = this.add.group();
      this.createCookingStations();

      // 使用新的布局管理器创建装饰物组
      this.decorations = this.farmLayoutManager.createFarmLayout();

      // 设置输入控制（包含平台检测）
      this.setupInput();

      // 仅在移动端平台设置移动端控制
      const screenInfo = this.uiLayoutManager.getScreenInfo();
      if (screenInfo.isMobile) {
        try {
          this.setupMobileControls();
        } catch (error) {
          console.warn('Virtual joystick failed:', error);
        }
      } else {
        console.log('Desktop platform detected, skipping mobile controls setup');
      }

      // 设置相机（改进的响应式行为）
      this.setupCamera();

      // 添加屏幕方向变化处理
      this.setupOrientationHandling();

      // 设置碰撞检测
      this.setupCollisions();

      // 设置事件监听器
      this.setupEventListeners();

      // 添加氛围效果
      this.createAtmosphere();

      // 添加增强的环境效果
      // 环境效果已移除，使用简化的性能优化

      // 设置性能监控
      this.setupPerformanceMonitoring();

      console.log('GameScene initialization completed successfully');
    } catch (error) {
      console.error('GameScene initialization failed:', error);

      // 创建最小化的备用场景
      this.add.text(50, 50, '游戏初始化失败', { fontSize: '24px', color: '#ff0000' });
      this.add.text(50, 80, '请刷新页面重试', { fontSize: '16px', color: '#ffffff' });
      this.add.text(50, 110, `错误: ${error}`, { fontSize: '12px', color: '#ffff00' });
    }
  }



  /**
   * 创建游戏世界背景
   * 包括基础地面纹理和环境装饰
   */
  private createWorldBackground() {
    // 创建基础背景颜色
    this.cameras.main.setBackgroundColor('#4a7c59'); // 深绿色背景，模拟草地

    // 创建地面纹理（使用现有的农田纹理作为地面）
    const groundTileSize = 64; // 地面瓦片大小
    const worldWidth = 1200;   // 世界宽度
    const worldHeight = 800;   // 世界高度

    // 创建地面瓦片
    for (let x = 0; x < worldWidth; x += groundTileSize) {
      for (let y = 0; y < worldHeight; y += groundTileSize) {
        // 使用空农田纹理作为基础地面
        const groundTile = this.add.image(x, y, 'farm_plot_empty');
        groundTile.setOrigin(0, 0);
        groundTile.setAlpha(0.3); // 设置透明度，作为背景层
        groundTile.setDepth(-100); // 确保在最底层
      }
    }

    // 设置世界边界
    this.physics.world.setBounds(0, 0, worldWidth, worldHeight);
  }

  /**
   * 创建农田地块
   * 使用农场布局管理器获取位置并创建农田地块
   */
  private createFarmPlots() {
    // 使用新的农场布局管理器来获取农田位置
    const plotPositions = this.farmLayoutManager.getFarmPlotPositions();

    console.log(`Creating ${plotPositions.length} farm plots using new layout manager`);

    // 遍历位置数组，在每个位置创建农田地块
    plotPositions.forEach(pos => {
      const plot = new FarmPlot(this, pos.x, pos.y);
      this.farmPlots.add(plot);
    });

    console.log(`Created ${this.farmPlots.children.size} farm plots`);
  }

  /**
   * 创建烹饪站
   * 使用农场布局管理器获取位置并创建烹饪站
   */
  private createCookingStations() {
    // 使用新的农场布局管理器来获取烹饪站位置
    const stationPositions = this.farmLayoutManager.getCookingStationPositions();

    console.log(`Creating ${stationPositions.length} cooking stations using new layout manager`);

    // 遍历位置数组，在每个位置创建烹饪站
    stationPositions.forEach((pos, index) => {
      const station = new CookingStation(this, pos.x, pos.y);
      this.cookingStations.add(station);
      console.log(`Created cooking station ${index + 1} at (${pos.x}, ${pos.y})`);
    });
  }

  /**
 * 验证农田位置是否有效的辅助函数
 * 确保农田不会与UI元素重叠
 */
  private isValidPlotPosition(x: number, y: number, screenWidth: number, screenHeight: number): boolean {
    const margin = 100; // 与UI元素的安全边距

    // 检查与摇杆区域的距离（左下角）
    const joystickArea = { x: 0, y: screenHeight - 150, width: 200, height: 150 };
    if (x < joystickArea.x + joystickArea.width && y > joystickArea.y) {
      return false;
    }

    // 检查与动作按钮区域的距离（右下角）
    const buttonArea = { x: screenWidth - 200, y: screenHeight - 200, width: 200, height: 200 };
    if (x > buttonArea.x && y > buttonArea.y) {
      return false;
    }

    // 确保与屏幕边缘的最小距离
    return x > margin && y > margin &&
      x < screenWidth - margin && y < screenHeight - margin;
  }







  /**
   * 设置输入控制系统
   * 根据平台类型设置不同的控制方式（PC端键盘，移动端触摸）
   */
  private setupInput() {
    // UI布局管理器已经在create()中初始化，直接使用
    const screenInfo = this.uiLayoutManager.getScreenInfo();

    if (!screenInfo.isMobile) {
      // 桌面端：设置键盘控制
      console.log('Setting up keyboard controls for desktop');
      this.cursors = this.input.keyboard!.createCursorKeys();                    // 方向键
      this.wasdKeys = this.input.keyboard!.addKeys('W,S,A,D') as Record<string, Phaser.Input.Keyboard.Key>;                   // WASD键
      this.interactKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);  // 空格键（交互）
      this.inventoryKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.I);     // I键（背包）
      this.cookingKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.C);       // C键（烹饪）

      // 紧急重置键（ESC）
      const emergencyResetKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.ESC);
      emergencyResetKey.on('down', () => {
        console.log('Emergency reset triggered by ESC key');
        this.executeEmergencyReset('ESC键');
      });

      // 工具选择键（1-4）
      this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.ONE).on('down', () => {
        this.selectTool(ToolType.HOE);           // 1键：锄头
      });

      this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.TWO).on('down', () => {
        this.selectTool(ToolType.WATERING_CAN);  // 2键：水壶
      });

      this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.THREE).on('down', () => {
        this.selectTool(ToolType.FERTILIZER);    // 3键：肥料
      });

      this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.FOUR).on('down', () => {
        this.selectTool(ToolType.SEEDS);         // 4键：种子
      });

      // 背包键
      this.inventoryKey.on('down', () => {
        this.toggleInventory();
      });

      // 烹饪键
      this.cookingKey.on('down', () => {
        this.openCookingInterface();
      });
    } else {
      // 移动端：不设置键盘控制，只使用触摸控制
      console.log('Skipping keyboard controls for mobile platform');
      // 为移动端设置默认值以避免错误
      this.cursors = {} as any;
      this.wasdKeys = {} as any;
      this.interactKey = {} as any;
      this.inventoryKey = {} as any;
      this.cookingKey = {} as any;
    }
  }

  /**
   * 执行紧急重置
   * 当游戏出现问题时，重置玩家位置和相机
   */
  private executeEmergencyReset(reason: string) {
    console.log(`Emergency reset triggered: ${reason}`);

    // 重置玩家位置
    if (this.cat) {
      this.cat.setPosition(200, 200);
      this.cat.setVelocity(0, 0);
    }

    // 重置相机位置
    if (this.cameras.main) {
      this.cameras.main.setScroll(0, 0);
    }

    // 显示通知
    this.showNotification('游戏已重置');

    // 触觉反馈
    if (this.hapticEnabled && navigator.vibrate) {
      navigator.vibrate([100, 50, 100]);
    }
  }

  /**
   * 设置移动端控制系统
   * 初始化虚拟摇杆、动作按钮和触摸交互
   */
  private setupMobileControls() {
    // UI布局管理器已经在create()中初始化，直接使用
    this.initializeVirtualJoystick();    // 初始化虚拟摇杆
    this.setupActionButtons();           // 设置动作按钮

    // 增强的触摸输入处理（世界交互）
    this.setupWorldTouchHandling();

    console.log('New mobile control system initialized successfully');
  }



  /**
   * 初始化虚拟摇杆
   * 为移动设备创建虚拟摇杆控制
   */
  private initializeVirtualJoystick() {
    const screenInfo = this.uiLayoutManager.getScreenInfo();

    // 只在移动设备上创建摇杆
    if (!screenInfo.isMobile) {
      console.log('Desktop detected, skipping virtual joystick');
      return;
    }

    // 根据屏幕方向调整摇杆大小
    const joystickRadius = screenInfo.isPortrait ? 60 : 70;
    const knobRadius = joystickRadius * 0.4;
    const position = this.uiLayoutManager.getJoystickPosition(joystickRadius);

    // 创建虚拟摇杆实例
    this.virtualJoystick = new VirtualJoystick({
      x: position.x,
      y: position.y,
      radius: joystickRadius,
      knobRadius: knobRadius,
      deadZone: 0.15,  // 死区，防止误触
      scene: this
    });

    // 设置摇杆回调 - 只记录状态，不直接设置速度
    this.virtualJoystick.onStartCallback(() => {
      console.log('Virtual joystick activated');
    });

    this.virtualJoystick.onEndCallback(() => {
      console.log('Virtual joystick deactivated');
    });

    console.log('Virtual joystick initialized at position:', position);
  }

  // 设置动作按钮
  private setupActionButtons() {
    const screenInfo = this.uiLayoutManager.getScreenInfo();

    // 只在移动设备上创建动作按钮
    if (!screenInfo.isMobile) {
      return;
    }

    const buttonSize = screenInfo.isPortrait ? 50 : 60;
    const buttons = [
      { id: 'interact', icon: '🐾', action: () => this.handleInteraction() },
      { id: 'inventory', icon: '🎒', action: () => this.toggleInventory() },
      { id: 'cooking', icon: '🍳', action: () => this.openCookingInterface() }
    ];

    const positions = this.uiLayoutManager.getActionButtonsPosition(buttonSize, buttons.length);

    this.actionButtons = buttons.map((button, index) => {
      const position = positions[index];
      const container = this.add.container(position.x, position.y);
      container.setDepth(1000);
      container.setScrollFactor(0);

      // 按钮背景
      const bg = this.add.circle(0, 0, buttonSize / 2, 0x000000, 0.4);
      bg.setStrokeStyle(2, 0x4a90e2, 0.7);

      // 按钮图标
      const icon = this.add.text(0, 0, button.icon, {
        fontSize: `${buttonSize * 0.4}px`,
        color: '#ffffff'
      });
      icon.setOrigin(0.5);

      container.add([bg, icon]);

      // 设置交互
      bg.setInteractive();
      bg.on('pointerdown', () => {
        // 视觉反馈
        bg.setFillStyle(0x4a90e2, 0.6);
        icon.setScale(1.1);

        // 执行动作
        button.action();

        // 重置视觉状态
        this.time.delayedCall(150, () => {
          bg.setFillStyle(0x000000, 0.4);
          icon.setScale(1);
        });
      });

      return container;
    });

    console.log('Action buttons created at positions:', positions);
  }

  // 设置世界触摸处理
  private setupWorldTouchHandling() {
    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      // 检查是否在UI控件区域内
      if (this.isPointerInUIArea(pointer)) {
        return;
      }

      const worldPoint = this.cameras.main.getWorldPoint(pointer.x, pointer.y);
      const distance = Phaser.Math.Distance.Between(
        this.cat.x, this.cat.y, worldPoint.x, worldPoint.y
      );

      // 如果点击靠近玩家，执行交互而不是移动
      if (distance < 50) {
        this.handleInteraction();
      } else if (!this.uiLayoutManager.getIsMobile()) {
        // 桌面端：点击移动（移动端使用摇杆）
        this.movePlayerTowards(worldPoint.x, worldPoint.y);
      }
    });
  }

  // 检查指针是否在UI区域内
  private isPointerInUIArea(pointer: Phaser.Input.Pointer): boolean {
    // 检查摇杆区域
    if (this.virtualJoystick && this.virtualJoystick.isJoystickActive()) {
      return true;
    }

    // 检查动作按钮区域
    for (const button of this.actionButtons) {
      const bounds = button.getBounds();
      if (bounds.contains(pointer.x, pointer.y)) {
        return true;
      }
    }

    return false;
  }

  // 简化的玩家移动方法
  private movePlayerTowards(targetX: number, targetY: number) {
    if (!this.cat || this.cat.isActing) {
      return;
    }

    const distance = Phaser.Math.Distance.Between(this.cat.x, this.cat.y, targetX, targetY);
    if (distance < 20) {
      return;
    }

    const angle = Phaser.Math.Angle.Between(this.cat.x, this.cat.y, targetX, targetY);
    const speed = 120;

    this.cat.setVelocity(
      Math.cos(angle) * speed,
      Math.sin(angle) * speed
    );

    // 停止移动当接近目标时
    this.time.delayedCall(distance / speed * 1000, () => {
      if (this.cat) {
        this.cat.setVelocity(0, 0);
      }
    });
  }

  // Helper function to get tool icons
  private getToolIcon(tool: ToolType): string {
    const icons = {
      [ToolType.HOE]: '🔨',
      [ToolType.WATERING_CAN]: '💧',
      [ToolType.FERTILIZER]: '🌱',
      [ToolType.SEEDS]: '🌰'
    };
    return icons[tool] || '🔧';
  }

  /**
   * 处理玩家交互
   * 增强的交互系统，提供更好的反馈效果
   */
  /**
   * 处理玩家交互
   * 检测玩家周围的交互对象并执行相应的交互逻辑
   */
  private handleInteraction() {
    const interactionRange = 80;  // 交互范围（像素）
    const catPosition = { x: this.cat.x, y: this.cat.y };  // 小猫当前位置
    let interactionFound = false;  // 是否找到交互对象

    // 检查农田地块交互 - 优先处理农田
    this.farmPlots.children.entries.forEach((plot: any) => {
      const distance = Phaser.Math.Distance.Between(
        catPosition.x, catPosition.y, plot.x, plot.y
      );

      if (distance <= interactionRange) {
        this.handleFarmPlotInteractionWithFeedback(plot);  // 处理农田交互并显示反馈
        interactionFound = true;  // 标记找到交互对象
      }
    });

    // 检查烹饪站交互（如果没有找到农田交互）
    if (!interactionFound) {
      this.cookingStations.children.entries.forEach((station: any) => {
        const cookingStation = station as CookingStation;  // 类型断言为烹饪站
        const distance = Phaser.Math.Distance.Between(
          catPosition.x, catPosition.y, cookingStation.x, cookingStation.y
        );

        if (distance <= interactionRange) {
          this.handleCookingStationInteractionWithFeedback(cookingStation);  // 处理烹饪站交互
          interactionFound = true;  // 标记找到交互对象
        }
      });
    }

    // 如果没有找到特定交互，显示通用提示
    if (!interactionFound) {
      this.showInteractionHint();  // 显示交互提示
    }

    // 为交互添加触觉反馈（移动端振动）
    if (interactionFound && this.hapticEnabled && navigator.vibrate) {
      navigator.vibrate([50, 50, 100]);  // 振动模式：50ms振动，50ms暂停，100ms振动
    }
  }

  /**
   * 处理农田地块交互并显示反馈效果
   * @param plot 农田地块对象
   */
  private handleFarmPlotInteractionWithFeedback(plot: any) {
    // 创建交互指示器（植物图标）
    const indicator = this.add.text(plot.x, plot.y - 50, '🌱', {
      fontSize: '32px',
      color: '#2ecc71'  // 绿色
    });
    indicator.setOrigin(0.5);  // 居中对齐
    indicator.setDepth(1000);  // 高渲染层级

    // 动画效果：向上移动、放大、淡出
    this.tweens.add({
      targets: indicator,
      y: indicator.y - 20,      // 向上移动20像素
      scaleX: 1.5,              // X轴放大1.5倍
      scaleY: 1.5,              // Y轴放大1.5倍
      alpha: 0,                 // 淡出到透明
      duration: 1000,           // 动画持续1秒
      ease: 'Power2',           // 缓动函数
      onComplete: () => indicator.destroy()  // 动画完成后销毁
    });

    // 发出农田交互事件
    this.events.emit('farm-plot-interaction', {
      plot: plot  // 传递农田地块对象
    });
  }

  /**
   * 处理烹饪站交互并显示反馈效果
   * @param station 烹饪站对象
   */
  private handleCookingStationInteractionWithFeedback(station: CookingStation) {
    // 创建烹饪指示器（锅具图标）
    const indicator = this.add.text(station.x, station.y - 50, '🍳', {
      fontSize: '32px',
      color: '#e67e22'  // 橙色
    });
    indicator.setOrigin(0.5);  // 居中对齐
    indicator.setDepth(1000);  // 高渲染层级

    // 动画效果：向上移动、放大、淡出
    this.tweens.add({
      targets: indicator,
      y: indicator.y - 20,      // 向上移动20像素
      scaleX: 1.5,              // X轴放大1.5倍
      scaleY: 1.5,              // Y轴放大1.5倍
      alpha: 0,                 // 淡出到透明
      duration: 1000,           // 动画持续1秒
      ease: 'Power2',           // 缓动函数
      onComplete: () => indicator.destroy()  // 动画完成后销毁
    });

    // 发出烹饪站交互事件
    this.events.emit('cooking-station-interaction', {
      station: station  // 传递烹饪站对象
    });
  }

  /**
   * 显示交互提示
   * 当没有找到特定交互对象时显示通用提示
   */
  private showInteractionHint() {
    // 显示交互可用提示（灯泡图标）
    const hint = this.add.text(this.cat.x, this.cat.y - 80, '💡', {
      fontSize: '24px',
      color: '#f1c40f'  // 黄色
    });
    hint.setOrigin(0.5);  // 居中对齐
    hint.setDepth(1000);  // 高渲染层级

    // 动画效果：向上移动并淡出
    this.tweens.add({
      targets: hint,
      y: hint.y - 15,           // 向上移动15像素
      alpha: 0,                 // 淡出到透明
      duration: 800,            // 动画持续0.8秒
      ease: 'Power2',           // 缓动函数
      onComplete: () => hint.destroy()  // 动画完成后销毁
    });
  }

  /**
   * 设置性能监控和优化
   * 监控FPS并根据性能调整游戏设置
   */
  private setupPerformanceMonitoring() {
    // 监控FPS并相应调整性能
    this.time.addEvent({
      delay: 1000,  // 每秒检查一次
      callback: () => {
        const currentTime = this.time.now;

        if (currentTime - this.lastFPSCheck > 5000) { // 每5秒检查一次FPS
          const fps = this.game.loop.actualFps;  // 获取实际FPS
          this.adjustPerformanceMode(fps);       // 根据FPS调整性能模式
          this.lastFPSCheck = currentTime;       // 更新上次检查时间

          // 如果FPS极低，启动紧急优化机制
          if (fps < 10) {
            console.warn('Critical performance detected, implementing emergency optimizations');
            this.emergencyPerformanceOptimization();
          }
        }
      },
      loop: true  // 循环执行
    });

    // 内存清理定时器
    this.time.addEvent({
      delay: 30000, // 每30秒执行一次
      callback: () => {
        this.cleanupResources();  // 清理资源
      },
      loop: true  // 循环执行
    });
  }

  /**
   * 紧急性能优化
   * 当FPS极低时启动的紧急优化措施
   */
  private emergencyPerformanceOptimization() {
    // 禁用所有粒子效果
    this.particlePool.forEach(particles => {
      if (particles && particles.destroy) {
        particles.destroy();  // 销毁粒子效果
      }
    });
    this.particlePool = [];  // 清空粒子池

    // 降低动画质量
    this.tweens.timeScale = 0.3;  // 动画速度降低到30%

    this.showNotification('⚠️ 已启用紧急性能优化模式');
  }

  /**
   * 资源清理
   * 定期清理不再使用的资源以释放内存
   */
  private cleanupResources() {
    // 清理旧的粒子效果
    this.particlePool = this.particlePool.filter(particles => {
      if (particles && particles.active) {
        return true;  // 保留活跃的粒子
      } else {
        if (particles && particles.destroy) {
          particles.destroy();  // 销毁不活跃的粒子
        }
        return false;  // 从数组中移除
      }
    });

    // 如果可用，强制垃圾回收
    if (window.gc) {
      window.gc();  // 触发垃圾回收
    }
  }

  /**
   * 根据FPS调整性能模式
   * @param fps 当前FPS值
   */
  private adjustPerformanceMode(fps: number) {
    let newMode: 'high' | 'medium' | 'low' = 'high';  // 默认高性能模式

    if (fps < 30) {
      newMode = 'low';      // FPS低于30时使用低性能模式
    } else if (fps < 45) {
      newMode = 'medium';   // FPS低于45时使用中等性能模式
    }

    if (newMode !== this.performanceMode) {
      this.performanceMode = newMode;           // 更新性能模式
      this.applyPerformanceSettings();          // 应用新的性能设置
      console.log(`Performance mode adjusted to: ${newMode} (FPS: ${fps.toFixed(1)})`);
    }
  }

  /**
   * 应用性能设置
   * 根据当前性能模式调整游戏质量
   */
  private applyPerformanceSettings() {
    switch (this.performanceMode) {
      case 'low':
        // 低性能模式：减少粒子效果和动画质量
        this.particlePool.forEach(particles => particles.setQuantity(1));  // 粒子数量设为1
        this.tweens.timeScale = 0.5;  // 动画速度降低到50%
        break;
      case 'medium':
        // 中等性能模式：适度减少效果
        this.particlePool.forEach(particles => particles.setQuantity(2));  // 粒子数量设为2
        this.tweens.timeScale = 0.8;  // 动画速度降低到80%
        break;
      case 'high':
        // 高性能模式：全质量
        this.tweens.timeScale = 1;  // 动画速度100%
        break;
    }
  }

  /**
   * 更新响应式UI
   * 根据屏幕尺寸和方向调整UI元素位置
   */
  private updateResponsiveUI() {
    // 使用新的布局管理器更新UI - 确保uiLayoutManager已初始化
    if (!this.uiLayoutManager) {
      return; // 如果还没初始化，跳过这次更新
    }

    const screenInfo = this.uiLayoutManager.getScreenInfo();  // 获取屏幕信息

    // 更新虚拟摇杆位置（仅移动端）
    if (this.virtualJoystick && screenInfo.isMobile) {
      this.virtualJoystick.updateLayout(screenInfo.width, screenInfo.height);  // 更新摇杆布局
    }

    // 更新动作按钮位置（仅移动端）
    if (this.actionButtons.length > 0 && screenInfo.isMobile) {
      const buttonSize = screenInfo.isPortrait ? 50 : 60;  // 根据屏幕方向调整按钮大小
      const positions = this.uiLayoutManager.getActionButtonsPosition(buttonSize, this.actionButtons.length);  // 获取按钮位置

      this.actionButtons.forEach((button, index) => {
        if (positions[index]) {
          this.tweens.add({
            targets: button,
            x: positions[index].x,      // 目标X坐标
            y: positions[index].y,      // 目标Y坐标
            duration: 300,              // 动画持续300ms
            ease: 'Power2.easeOut'      // 缓动函数
          });
        }
      });
    }
  }

  /**
   * 平滑更新按钮位置的辅助函数
   * @param buttonObj 按钮对象
   * @param newX 新的X坐标
   * @param newY 新的Y坐标
   */
  private updateButtonPosition(buttonObj: any, newX: number, newY: number) {
    if (!buttonObj) return;  // 如果按钮对象不存在，直接返回

    const elements = [buttonObj.button, buttonObj.shadow, buttonObj.inner, buttonObj.icon];  // 按钮的所有元素
    const duration = 300;  // 动画持续时间

    elements.forEach(element => {
      if (element) {
        this.tweens.add({
          targets: element,
          x: newX + (element === buttonObj.shadow ? 2 : 0),  // 阴影元素偏移2像素
          y: newY + (element === buttonObj.shadow ? 2 : 0),  // 阴影元素偏移2像素
          duration: duration,                                  // 动画持续时间
          ease: 'Power2.easeOut'                              // 缓动函数
        });
      }
    });

    // 更新存储的位置信息
    if (buttonObj.x !== undefined) buttonObj.x = newX;  // 更新X坐标
    if (buttonObj.y !== undefined) buttonObj.y = newY;  // 更新Y坐标
  }

  /**
   * 设置摄像机
   * 配置响应式摄像机跟随和缩放，考虑开发者工具遮挡
   */
  private setupCamera() {
    // 改进的摄像机设置，具有响应式行为
    const screenWidth = this.cameras.main.width;   // 屏幕宽度
    const screenHeight = this.cameras.main.height; // 屏幕高度

    // 检测是否在开发环境中（可能打开开发者工具）
    const isDevelopment = window.location.hostname === 'localhost' ||
      window.location.hostname === '127.0.0.1' ||
      window.location.port !== '';

    // 根据屏幕尺寸动态调整缩放
    const baseZoom = Math.min(screenWidth / 800, screenHeight / 600);  // 基础缩放比例
    const optimalZoom = Math.max(0.8, Math.min(2.0, baseZoom * 1.2));  // 最优缩放比例（0.8-2.0之间）

    this.cameras.main.startFollow(this.cat);      // 开始跟随小猫
    this.cameras.main.setZoom(optimalZoom);       // 设置缩放比例

    // 根据屏幕尺寸动态设置世界边界
    // 在开发环境中，确保游戏内容不会被开发者工具遮挡
    const effectiveWidth = isDevelopment ? Math.min(screenWidth, 1200) : screenWidth;
    const worldWidth = Math.max(1000, effectiveWidth * 1.5);   // 世界宽度（至少1000像素）
    const worldHeight = Math.max(800, screenHeight * 1.5);  // 世界高度（至少800像素）
    this.cameras.main.setBounds(0, 0, worldWidth, worldHeight);  // 设置摄像机边界

    // 平滑摄像机跟随
    this.cameras.main.setLerp(0.1, 0.1);        // 设置线性插值（平滑跟随）
    this.cameras.main.setDeadzone(100, 100);     // 设置死区（避免微小移动）

    // 在开发环境中，限制摄像机右边界以避免内容被遮挡
    if (isDevelopment) {
      const maxRightBound = Math.min(worldWidth, screenWidth - 400); // 预留400像素给开发者工具
      this.cameras.main.setBounds(0, 0, maxRightBound, worldHeight);
    }
  }

  /**
   * 设置屏幕方向变化处理
   * 监听屏幕方向变化并相应调整UI布局
   */
  private setupOrientationHandling() {
    // 监听屏幕方向变化
    const handleOrientationChange = () => {
      // 延迟300ms等待浏览器完成方向变化
      this.time.delayedCall(300, () => {
        console.log('Orientation changed, updating UI layout');
        this.updateResponsiveUI();  // 更新响应式UI

        // 更新摄像机边界和缩放
        this.setupCamera();  // 重新设置摄像机

        // 显示简短通知
        this.showNotification('🔄 界面已适配新屏幕方向');
      });
    };

    // 添加方向变化事件监听器
    window.addEventListener('orientationchange', handleOrientationChange);  // 监听方向变化
    window.addEventListener('resize', handleOrientationChange);             // 监听窗口大小变化

    // 存储处理器以便清理
    this.orientationHandlers = {
      orientationChange: handleOrientationChange,  // 方向变化处理器
      resize: handleOrientationChange              // 大小变化处理器
    };
  }

  /**
   * 设置碰撞检测
   * 配置游戏对象之间的碰撞关系
   */
  private setupCollisions() {
    // 小猫与装饰物的碰撞检测
    this.physics.add.collider(this.cat, this.decorations);  // 添加小猫和装饰物的碰撞器
  }

  /**
   * 设置事件监听器
   * 监听游戏中的各种事件并执行相应处理
   */
  private setupEventListeners() {
    // 农田地块交互事件
    this.events.on('farm-plot-interaction', (data: any) => {
      this.handleFarmPlotInteraction(data.plot);  // 处理农田交互
    });

    // 烹饪站交互事件
    this.events.on('cooking-station-interaction', (data: any) => {
      this.handleCookingStationInteraction(data.station);  // 处理烹饪站交互
    });

    // 烹饪完成事件
    this.events.on('cooking-completed', (data: any) => {
      this.handleCookingCompletion(data.recipe, data.result);  // 处理烹饪完成
    });

    // 小猫升级事件
    this.events.on('cat-level-up', (level: number) => {
      this.showNotification(`🎉 小猫升级了！现在是 ${level} 级！`);  // 显示升级通知
    });

    // 小猫疲劳事件
    this.events.on('cat-tired', () => {
      this.showNotification('😴 小猫累了，需要休息一下！');  // 显示疲劳通知
    });
  }

  /**
   * 创建氛围效果
   * 添加环境粒子效果（蝴蝶、树叶等）增强游戏氛围
   */
  private createAtmosphere() {
    // 添加环境粒子（蝴蝶、树叶等）
    const butterflies = this.add.particles(0, 0, 'sparkle', {
      x: { min: 0, max: 800 },        // X坐标范围
      y: { min: 0, max: 600 },        // Y坐标范围
      scale: { start: 0.1, end: 0.3 }, // 缩放范围
      alpha: { start: 0.8, end: 0.3 }, // 透明度范围
      tint: [0xFFD700, 0xFF69B4, 0x87CEEB], // 颜色数组（金色、粉色、天蓝色）
      lifespan: 5000,                 // 生命周期5秒
      frequency: 2000,                // 生成频率2秒
      quantity: 1,                    // 每次生成1个粒子
      speed: { min: 20, max: 40 },    // 速度范围
      gravityY: -10                   // 向上的重力（模拟飘浮）
    });
    butterflies.setDepth(15);  // 设置渲染深度
  }

  /**
   * 选择工具
   * @param tool 要选择的工具类型
   */
  private selectTool(tool: ToolType) {
    this.currentTool = tool;           // 设置当前工具
    this.cat.setCurrentTool(tool);     // 让小猫使用该工具

    const toolNames = {
      [ToolType.HOE]: '锄头',           // 锄头工具
      [ToolType.WATERING_CAN]: '水壶',  // 水壶工具
      [ToolType.FERTILIZER]: '肥料',    // 肥料工具
      [ToolType.SEEDS]: '种子'          // 种子工具
    };

    this.showNotification(`选择了 ${toolNames[tool]}`);  // 显示工具选择通知
  }

  /**
   * 处理农田地块交互
   * @param plot 农田地块对象
   */
  private handleFarmPlotInteraction(plot: FarmPlot) {
    if (!this.cat.canPerformAction()) {
      this.showNotification('小猫太累了，无法工作！');  // 显示疲劳提示
      return;
    }

    switch (this.currentTool) {
      case ToolType.HOE:  // 锄头工具
        if (plot.canPlow()) {  // 检查是否可以耕地
          if (this.cat.performAction('dig')) {  // 小猫执行挖掘动作
            this.time.delayedCall(1000, () => {  // 延迟1秒执行耕地
              plot.plow();                       // 耕地
              this.showNotification('土地已耕好！');  // 显示成功通知
              this.cat.gainExperience(5);        // 获得经验值
            });
          }
        } else {
          this.showNotification('这块地已经耕过了！');  // 显示已耕地提示
        }
        break;

      case ToolType.WATERING_CAN:  // 水壶工具
        if (plot.canWater()) {  // 检查是否可以浇水
          if (this.cat.performAction('water')) {  // 小猫执行浇水动作
            this.time.delayedCall(800, () => {  // 延迟0.8秒执行浇水
              plot.waterCrop();                 // 浇水
              this.showNotification('作物已浇水！');  // 显示成功通知
              this.cat.gainExperience(2);       // 获得经验值
            });
          }
        } else {
          this.showNotification('这里没有作物需要浇水！');  // 显示无法浇水提示
        }
        break;

      case ToolType.FERTILIZER:  // 肥料工具
        if (plot.canFertilize()) {  // 检查是否可以施肥
          if (this.cat.performAction('water')) {  // 小猫执行施肥动作
            this.time.delayedCall(800, () => {  // 延迟0.8秒执行施肥
              plot.fertilizeCrop();             // 施肥
              this.showNotification('作物已施肥！');  // 显示成功通知
              this.cat.gainExperience(3);       // 获得经验值
            });
          }
        } else {
          this.showNotification('这里没有作物需要施肥！');  // 显示无法施肥提示
        }
        break;

      case ToolType.SEEDS:  // 种子工具
        if (plot.canPlant()) {  // 检查是否可以种植
          this.showSeedSelectionMenu(plot);  // 显示种子选择菜单
        } else {
          this.showNotification('这块地还没有耕好或已经种了作物！');  // 显示无法种植提示
        }
        break;

      default:  // 默认情况（无工具或空手）
        if (plot.canHarvest()) {  // 检查是否可以收获
          if (this.cat.performAction('harvest')) {  // 小猫执行收获动作
            this.time.delayedCall(600, () => {  // 延迟0.6秒执行收获
              const result = plot.harvestCrop();  // 收获作物
              if (result && result.success) {  // 如果收获成功
                const crop = plot.getCrop();  // 获取作物信息
                if (crop) {
                  const cropData = crop.getCropData();  // 获取作物数据
                  this.inventoryManager.addHarvestedCrop(cropData.type, result.yield, result.quality);  // 添加到背包
                  this.showNotification(`收获了 ${result.yield} 个作物！品质：${result.quality}`);  // 显示收获通知
                  this.cat.gainExperience(10);  // 获得经验值
                  this.cat.gainHappiness(10);   // 获得快乐值
                }
              }
            });
          }
        }
        break;
    }
  }

  /**
   * 处理烹饪站交互
   * @param cookingStation 烹饪站对象
   */
  private handleCookingStationInteraction(cookingStation: CookingStation) {
    if (cookingStation.isCookingInProgress()) {  // 检查是否正在烹饪
      this.showNotification('烹饪正在进行中...');  // 显示烹饪中提示
      return;
    }

    this.showCookingMenu(cookingStation);  // 显示烹饪菜单
  }

  /**
   * 处理烹饪完成
   * @param recipe 烹饪配方
   * @param result 烹饪结果
   */
  private handleCookingCompletion(recipe: any, result: any) {
    // 将烹饪好的食物添加到背包
    this.inventoryManager.addCookedFood(
      result.itemId,        // 物品ID
      recipe.name,          // 食物名称
      result.quantity,      // 数量
      recipe.description    // 描述
    );

    this.showNotification(`🍽️ ${recipe.name} 制作完成！`);  // 显示完成通知
    this.cat.gainExperience(15);                           // 获得经验值
    this.cat.gainHappiness(recipe.happinessBonus);        // 获得快乐值加成
    this.cat.restoreEnergy(recipe.energyBonus);           // 恢复体力值
  }

  /**
   * 显示种子选择菜单
   * @param plot 农田地块对象
   */
  private showSeedSelectionMenu(plot: FarmPlot) {
    // 简单的种子选择 - 目前默认种植胡萝卜
    // 在完整实现中，这会显示一个UI菜单
    const seeds = this.inventoryManager.getItemsByType('seed');  // 获取所有种子
    if (seeds.length > 0) {  // 如果有种子
      const seedItem = seeds[0];  // 选择第一个种子
      const cropType = seedItem.id.replace('_seeds', '') as CropType;  // 提取作物类型

      if (this.inventoryManager.removeItem(seedItem.id, 1)) {  // 从背包移除1个种子
        plot.plantCrop(cropType);  // 种植作物
        this.showNotification(`种植了 ${seedItem.name}！`);  // 显示种植通知
        this.cat.gainExperience(5);  // 获得经验值
      }
    } else {
      this.showNotification('没有种子可以种植！');  // 显示无种子提示
    }
  }

  /**
   * 显示烹饪菜单
   * @param cookingStation 烹饪站对象
   */
  private showCookingMenu(cookingStation: CookingStation) {
    // 简单的烹饪 - 如果有材料就制作胡萝卜汤
    // 在完整实现中，这会显示一个烹饪UI
    const availableRecipes = cookingStation.getAvailableRecipes(this.inventoryManager.getAllItems());  // 获取可用配方

    if (availableRecipes.length > 0) {  // 如果有可用配方
      const recipe = availableRecipes[0];  // 选择第一个配方

      if (this.inventoryManager.consumeIngredients(recipe.ingredients)) {  // 消耗材料
        cookingStation.startCooking(recipe);  // 开始烹饪
        this.showNotification(`开始制作 ${recipe.name}...`);  // 显示开始烹饪通知
      }
    } else {
      this.showNotification('没有足够的材料制作任何料理！');  // 显示材料不足提示
    }
  }



  /**
   * 处理触摸交互
   * @param worldX 世界坐标X
   * @param worldY 世界坐标Y
   */
  private handleTouchInteraction(worldX: number, worldY: number) {
    const distance = Phaser.Math.Distance.Between(
      this.cat.x, this.cat.y, worldX, worldY  // 计算小猫与触摸点的距离
    );

    if (distance < 50) {  // 如果距离小于50像素
      this.handleInteraction();  // 执行交互
    } else {
      this.movePlayerTowards(worldX, worldY);  // 移动到触摸点
    }
  }





  /**
   * 切换背包界面
   */
  private toggleInventory() {
    // 向UI场景发送切换背包事件
    this.scene.get('UIScene').events.emit('toggle-inventory', this.inventoryManager.getAllItems());
  }

  /**
   * 打开烹饪界面
   */
  private openCookingInterface() {
    // 向UI场景发送打开烹饪界面事件
    this.scene.get('UIScene').events.emit('open-cooking', {
      recipes: this.cookingStations.children.entries[0] ?
        (this.cookingStations.children.entries[0] as CookingStation).getAllRecipes() : [],  // 获取所有配方
      inventory: this.inventoryManager.getAllItems()  // 获取所有物品
    });
  }

  /**
   * 显示通知
   * @param text 通知文本
   */
  public showNotification(text: string) {
    // 向UI场景发送通知事件
    this.scene.get('UIScene').events.emit('show-notification', text);
  }

  /**
   * 显示对话框
   * @param text 对话框文本
   */
  public showDialogue(text: string) {
    // 向UI场景发送对话框事件
    this.scene.get('UIScene').events.emit('show-dialogue', text);
  }

  /**
   * 游戏主更新循环
   * 每帧执行，处理玩家输入、移动和游戏状态更新
   */
  update() {
    // 性能监控 - 限制重操作的更新频率
    this.frameCounter++;  // 帧计数器递增

    // 处理玩家移动 - 平台特定的控制逻辑
    let moveX = 0;  // X方向移动值
    let moveY = 0;  // Y方向移动值

    // 获取平台信息 - 确保uiLayoutManager已初始化
    if (!this.uiLayoutManager) {
      return; // 如果还没初始化，跳过这次更新
    }

    const screenInfo = this.uiLayoutManager.getScreenInfo();  // 获取屏幕信息

    if (screenInfo.isMobile) {
      // 移动端：只使用虚拟摇杆
      if (this.virtualJoystick) {
        const joystickVector = this.virtualJoystick.getVector();  // 获取摇杆向量
        moveX = joystickVector.x;  // 设置X方向移动
        moveY = joystickVector.y;  // 设置Y方向移动
      }
    } else {
      // PC端：只使用键盘（增加健壮性检查）
      const hasCursors = !!this.cursors && (this.cursors as any).left && (this.cursors as any).right && (this.cursors as any).up && (this.cursors as any).down;
      const hasWASD = !!this.wasdKeys && (this.wasdKeys as any).A && (this.wasdKeys as any).D && (this.wasdKeys as any).W && (this.wasdKeys as any).S;

      if ((hasCursors && this.cursors.left!.isDown) || (hasWASD && this.wasdKeys.A!.isDown)) {
        moveX = -1;  // 向左移动
      } else if ((hasCursors && this.cursors.right!.isDown) || (hasWASD && this.wasdKeys.D!.isDown)) {
        moveX = 1;   // 向右移动
      }

      if ((hasCursors && this.cursors.up!.isDown) || (hasWASD && this.wasdKeys.W!.isDown)) {
        moveY = -1;  // 向上移动
      } else if ((hasCursors && this.cursors.down!.isDown) || (hasWASD && this.wasdKeys.S!.isDown)) {
        moveY = 1;   // 向下移动
      }
    }

    // 应用移动 - 使用改进的移动系统（在小猫存在时）
    if (this.cat) {
      if (Math.abs(moveX) > 0.01 || Math.abs(moveY) > 0.01) {  // 如果有移动输入
        this.cat.move(moveX, moveY);  // 让小猫移动
      } else if (typeof (this.cat as any).smoothStop === 'function') {
        // 使用平滑停止而非立即停止，增加游戏手感
        this.cat.smoothStop(0.88);  // 使用稍高的减速率
      }

      // 更新小猫状态
      if (typeof this.cat.update === 'function') {
        this.cat.update();
      }
    }

    // 更新瓦片地图系统（动画、效果等）
    if (this.tileMapManager) {
      this.tileMapManager.update(this.time.now, this.game.loop.delta);
    }

    // 更新天气系统
    if (this.weatherSystem) {
      this.weatherSystem.update(this.time.now, this.game.loop.delta);
    }

    // 性能优化的更新 - 非关键元素每几帧更新一次
    if (this.frameCounter % 3 === 0) {  // 每3帧更新一次
      // 更新农田地块（降低频率以提高性能）
      if (this.farmPlots && this.farmPlots.children && Array.isArray((this.farmPlots.children as any).entries)) {
        this.farmPlots.children.entries.forEach((plot: any) => {
          if (plot && typeof plot.update === 'function') {
            plot.update();  // 更新农田地块
          }
        });
      }
    }

    if (this.frameCounter % 5 === 0) {  // 每5帧更新一次
      // 更新烹饪站（更低频率）
      if (this.cookingStations && this.cookingStations.children && Array.isArray((this.cookingStations.children as any).entries)) {
        this.cookingStations.children.entries.forEach((station: any) => {
          if (station && typeof station.update === 'function') {
            station.update();  // 更新烹饪站
          }
        });
      }
    }

    // 处理交互键（仅桌面端）
    if (!screenInfo.isMobile && this.interactKey && typeof (this.interactKey as any)._justDown !== 'undefined' && Phaser.Input.Keyboard.JustDown(this.interactKey)) {
      this.handleInteraction();  // 执行交互
    }

    // 更新响应式UI元素
    this.updateResponsiveUI();  // 更新UI布局
  }

  /**
   * 场景清理 - 场景销毁时调用
   */
  destroy() {
    // 清理新的控制系统
    if (this.virtualJoystick) {
      this.virtualJoystick.destroy();  // 销毁虚拟摇杆
    }

    if (this.uiLayoutManager) {
      this.uiLayoutManager.destroy();  // 销毁UI布局管理器
    }

    // 清理天气系统
    if (this.weatherSystem) {
      this.weatherSystem.destroy();  // 销毁天气系统
    }

    // 清理瓦片地图管理器
    if (this.tileMapManager) {
      this.tileMapManager.destroy();  // 销毁瓦片地图管理器
    }

    // 清理新的动作按钮
    this.actionButtons.forEach(button => {
      if (button && button.destroy) {
        button.destroy();  // 销毁动作按钮
      }
    });



    // 清理粒子池
    this.particlePool.forEach(particles => {
      if (particles && particles.destroy) {
        particles.destroy();  // 销毁粒子效果
      }
    });
    this.particlePool = [];  // 清空粒子池

    // 清理工具提示
    if (this.toolTooltip) {
      this.toolTooltip.destroy();  // 销毁工具提示
      this.toolTooltip = null;
    }

    // 清理方向变化处理器
    if (this.orientationHandlers) {
      window.removeEventListener('orientationchange', this.orientationHandlers.orientationChange);  // 移除方向变化监听
      window.removeEventListener('resize', this.orientationHandlers.resize);                       // 移除大小变化监听
      this.orientationHandlers = null;  // 清空处理器引用
    }

    // 确保小猫停止移动
    if (this.cat) {
      this.cat.setVelocity(0, 0);  // 设置速度为0
    }

    console.log('GameScene cleanup completed');  // 记录清理完成
  }

  /**
   * 加载瓦片资源
   * 使用ResourceLoader加载所有需要的瓦片纹理
   */
  private async loadTileResources(): Promise<void> {
    try {
      console.log('Loading tile resources...');

      const resourceLoader = ResourceLoader.getInstance();
      const tileResources = TileResourceConfig.getPreloadTileResources();

      // 添加瓦片资源到加载队列
      resourceLoader.addResources(tileResources);

      // 设置进度回调
      resourceLoader.setProgressCallback((progress) => {
        console.log(`Tile loading progress: ${progress.percentage}% - ${progress.currentResource}`);
      });

      // 开始加载资源
      await resourceLoader.loadResources();

      // 将加载的资源注册到Phaser场景
      this.registerTileTextures(resourceLoader);

      console.log('Tile resources loaded successfully');
    } catch (error) {
      console.error('Failed to load tile resources:', error);
      // 即使加载失败，也继续游戏，使用默认纹理
    }
  }

  /**
   * 将加载的瓦片纹理注册到Phaser场景
   */
  private registerTileTextures(resourceLoader: ResourceLoader): void {
    const tileResources = TileResourceConfig.getPreloadTileResources();

    tileResources.forEach(resource => {
      const spritesheetData = resourceLoader.getResource(resource.key);

      if (spritesheetData && spritesheetData.image && resource.frameConfig) {
        // 将图像添加到Phaser纹理管理器
        if (!this.textures.exists(resource.key)) {
          this.textures.addImage(resource.key, spritesheetData.image);

          // 如果是精灵图集，创建帧数据
          if (resource.type === 'spritesheet') {
            this.textures.get(resource.key).add('__BASE', 0, 0, 0,
              spritesheetData.image.width, spritesheetData.image.height);

            // 生成精灵帧
            const frameWidth = resource.frameConfig.frameWidth;
            const frameHeight = resource.frameConfig.frameHeight;
            const cols = Math.floor(spritesheetData.image.width / frameWidth);
            const rows = Math.floor(spritesheetData.image.height / frameHeight);

            for (let row = 0; row < rows; row++) {
              for (let col = 0; col < cols; col++) {
                const frameIndex = row * cols + col;
                const frameName = frameIndex.toString();

                this.textures.get(resource.key).add(
                  frameName,
                  0,
                  col * frameWidth,
                  row * frameHeight,
                  frameWidth,
                  frameHeight
                );
              }
            }
          }
        }
      }
    });
  }

  /**
   * 设置天气事件处理器
   */
  private setupWeatherEventHandlers(): void {
    // 监听天气变化事件
    this.events.on('weatherChanged', (weather: any) => {
      console.log(`Weather changed to: ${weather.type} (intensity: ${weather.intensity})`);

      // 天气对农作物的影响
      this.applyWeatherEffectsToFarm(weather);

      // 显示天气提示
      this.showWeatherNotification(weather);
    });

    // 监听季节变化事件
    this.events.on('seasonChanged', (season: SeasonType) => {
      console.log(`Season changed to: ${season}`);

      // 季节对农作物的影响
      this.applySeasonEffectsToFarm(season);

      // 显示季节提示
      this.showSeasonNotification(season);
    });
  }

  /**
   * 应用天气对农场的影响
   */
  private applyWeatherEffectsToFarm(weather: any): void {
    this.farmPlots.children.entries.forEach((plot: any) => {
      if (plot.applyWeatherEffect) {
        plot.applyWeatherEffect(weather);
      }
    });
  }

  /**
   * 应用季节对农场的影响
   */
  private applySeasonEffectsToFarm(season: SeasonType): void {
    const seasonConfig = this.weatherSystem.getSeasonConfig(season);

    this.farmPlots.children.entries.forEach((plot: any) => {
      if (plot.applySeasonEffect) {
        plot.applySeasonEffect(seasonConfig);
      }
    });
  }

  /**
   * 显示天气通知
   */
  private showWeatherNotification(weather: any): void {
    const weatherNames = {
      sunny: '☀️ 晴天',
      cloudy: '☁️ 多云',
      rainy: '🌧️ 雨天',
      stormy: '⛈️ 暴风雨',
      snowy: '❄️ 下雪',
      foggy: '🌫️ 雾天'
    };

    const weatherName = weatherNames[weather.type as keyof typeof weatherNames] || weather.type;

    // 创建通知文本
    const notification = this.add.text(
      this.cameras.main.width / 2,
      100,
      `天气变化: ${weatherName}`,
      {
        fontSize: '24px',
        color: '#ffffff',
        backgroundColor: '#000000',
        padding: { x: 20, y: 10 }
      }
    );

    notification.setOrigin(0.5);
    notification.setDepth(2000);

    // 淡入淡出动画
    notification.setAlpha(0);
    this.tweens.add({
      targets: notification,
      alpha: 1,
      duration: 500,
      ease: 'Power2',
      yoyo: true,
      hold: 2000,
      onComplete: () => {
        notification.destroy();
      }
    });
  }

  /**
   * 显示季节通知
   */
  private showSeasonNotification(season: SeasonType): void {
    const seasonNames = {
      spring: '🌸 春天',
      summer: '☀️ 夏天',
      autumn: '🍂 秋天',
      winter: '❄️ 冬天'
    };

    const seasonName = seasonNames[season];

    // 创建通知文本
    const notification = this.add.text(
      this.cameras.main.width / 2,
      150,
      `季节更替: ${seasonName}`,
      {
        fontSize: '28px',
        color: '#ffffff',
        backgroundColor: '#4a5568',
        padding: { x: 25, y: 15 }
      }
    );

    notification.setOrigin(0.5);
    notification.setDepth(2000);

    // 季节变化特效
    notification.setAlpha(0);
    notification.setScale(0.5);
    this.tweens.add({
      targets: notification,
      alpha: 1,
      scale: 1,
      duration: 800,
      ease: 'Back',
      yoyo: true,
      hold: 3000,
      onComplete: () => {
        notification.destroy();
      }
    });
  }
}
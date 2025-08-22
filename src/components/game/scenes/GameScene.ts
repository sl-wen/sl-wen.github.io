import * as Phaser from 'phaser';
import { CookingStation } from '../entities/CookingStation';
import { FarmPlot } from '../entities/FarmPlot';
import { InventoryManager } from '../entities/InventoryManager';
import { Cat } from '../entities/Player';
import { CropType, ToolType } from '../types/GameTypes';
import { UILayoutManager } from '../UILayoutManager';
import { VirtualJoystick } from '../VirtualJoystick';

export class GameScene extends Phaser.Scene {
  private cat!: Cat;
  private farmPlots!: Phaser.GameObjects.Group;
  private cookingStations!: Phaser.GameObjects.Group;
  private decorations!: Phaser.GameObjects.Group;
  private inventoryManager!: InventoryManager;

  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private wasdKeys!: any;
  private interactKey!: Phaser.Input.Keyboard.Key;
  private inventoryKey!: Phaser.Input.Keyboard.Key;
  private cookingKey!: Phaser.Input.Keyboard.Key;
  // 新的控制系统
  private virtualJoystick!: VirtualJoystick;
  private uiLayoutManager!: UILayoutManager;
  private actionButtons: Phaser.GameObjects.Container[] = [];

  // Game state properties
  private currentTool: ToolType | null = null;
  private toolTooltip: Phaser.GameObjects.Text | null = null;
  private hapticEnabled: boolean = false;
  private particlePool: Phaser.GameObjects.Particles.ParticleEmitter[] = []; // Particle effect pool for performance
  private performanceMode: 'high' | 'medium' | 'low' = 'high'; // Performance mode
  private frameCounter: number = 0;
  private lastFPSCheck: number = 0;
  private lastTapTime: number = 0; // For double-tap emergency reset
  private emergencyResetEnabled: boolean = true;
  private orientationHandlers: any = null; // Store orientation change handlers

  constructor() {
    super({ key: 'GameScene' });
  }

  create() {
    console.log('GameScene create() called');

    try {
      // Initialize inventory system
      console.log('Initializing inventory system...');
      this.inventoryManager = new InventoryManager();
      this.inventoryManager.addTestItems(); // Add some test items
      console.log('Inventory system initialized');

      // Create cat player
      console.log('Creating cat player...');
      this.cat = new Cat(this, 200, 200);
      console.log('Cat player created successfully');

      // Create farm plots group
      this.farmPlots = this.add.group();
      this.createFarmPlots();

      // Create cooking stations group
      this.cookingStations = this.add.group();
      this.createCookingStations();

      // Create decorations group
      this.decorations = this.add.group();
      this.createFarmDecorations();

      // Setup input (includes platform detection)
      this.setupInput();

      // Setup mobile controls only for mobile platforms
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

      // Setup camera with improved responsive behavior
      this.setupCamera();

      // Add orientation change handling
      this.setupOrientationHandling();

      // Setup collisions
      this.setupCollisions();

      // Setup event listeners
      this.setupEventListeners();

      // Add atmospheric effects
      this.createAtmosphere();

      // Add enhanced ambient effects
      // 环境效果已移除，使用简化的性能优化

      // Setup performance monitoring
      this.setupPerformanceMonitoring();

      console.log('GameScene initialization completed successfully');
    } catch (error) {
      console.error('GameScene initialization failed:', error);

      // Create a minimal fallback scene
      this.add.text(50, 50, '游戏初始化失败', { fontSize: '24px', color: '#ff0000' });
      this.add.text(50, 80, '请刷新页面重试', { fontSize: '16px', color: '#ffffff' });
      this.add.text(50, 110, `错误: ${error}`, { fontSize: '12px', color: '#ffff00' });
    }
  }



  private createFarmPlots() {
    // 重新设计农田布局 - 放置在土地区域（下方40%区域）
    const screenWidth = this.cameras.main.width;
    const screenHeight = this.cameras.main.height;

    // 土地区域 - 下方40%区域
    const farmArea = {
      x: screenWidth * 0.1,
      y: screenHeight * 0.5,
      width: screenWidth * 0.8,
      height: screenHeight * 0.4
    };

    const plotSpacing = 60;

    // 在土地区域内创建农田网格
    const startX = farmArea.x + 50;
    const startY = farmArea.y + 50;
    const endX = farmArea.x + farmArea.width - 50;
    const endY = farmArea.y + farmArea.height - 50;

    // 计算可以放置的农田数量
    const cols = Math.floor((endX - startX) / plotSpacing);
    const rows = Math.floor((endY - startY) / plotSpacing);

    console.log(`Creating farm plots: ${cols} cols x ${rows} rows in farm area`);

    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const x = startX + (col * plotSpacing);
        const y = startY + (row * plotSpacing);

        // 确保农田在土地区域内
        if (x >= startX && x <= endX && y >= startY && y <= endY) {
          const plot = new FarmPlot(this, x, y);
          this.farmPlots.add(plot);
        }
      }
    }

    console.log(`Created ${this.farmPlots.children.size} farm plots`);
  }

  private createCookingStations() {
    // 重新设计烹饪站位置 - 放置在房子区域附近
    const screenWidth = this.cameras.main.width;
    const screenHeight = this.cameras.main.height;

    // 房子区域附近的位置
    const stationPositions = [
      // 房子区域内的烹饪站
      {
        x: screenWidth * 0.25,
        y: screenHeight * 0.25
      },
      // 道路附近的烹饪站
      {
        x: screenWidth * 0.45,
        y: screenHeight * 0.3
      }
    ];

    stationPositions.forEach((pos, index) => {
      const station = new CookingStation(this, pos.x, pos.y);
      this.cookingStations.add(station);
      console.log(`Created cooking station ${index + 1} at (${pos.x}, ${pos.y})`);
    });
  }

  // Helper function to validate plot positions
  private isValidPlotPosition(x: number, y: number, screenWidth: number, screenHeight: number): boolean {
    const margin = 100; // Safety margin from UI elements

    // Check distance from likely joystick position (bottom-left)
    const joystickArea = { x: 0, y: screenHeight - 150, width: 200, height: 150 };
    if (x < joystickArea.x + joystickArea.width && y > joystickArea.y) {
      return false;
    }

    // Check distance from likely action button area (bottom-right)
    const buttonArea = { x: screenWidth - 200, y: screenHeight - 200, width: 200, height: 200 };
    if (x > buttonArea.x && y > buttonArea.y) {
      return false;
    }

    // Ensure minimum distance from screen edges
    return x > margin && y > margin &&
      x < screenWidth - margin && y < screenHeight - margin;
  }

  private createFarmDecorations() {
    const screenWidth = this.cameras.main.width;
    const screenHeight = this.cameras.main.height;

    // 计算各个区域的位置和大小

    // 房子区域 - 左上角 20%
    const houseArea = {
      x: screenWidth * 0.1,
      y: screenHeight * 0.1,
      width: screenWidth * 0.3,
      height: screenHeight * 0.3
    };

    // 池塘区域 - 右上角 20%
    const pondArea = {
      x: screenWidth * 0.6,
      y: screenHeight * 0.1,
      width: screenWidth * 0.3,
      height: screenHeight * 0.3
    };

    // 土地区域 - 下方 40%
    const farmArea = {
      x: screenWidth * 0.1,
      y: screenHeight * 0.5,
      width: screenWidth * 0.8,
      height: screenHeight * 0.4
    };

    // 道路区域 - 连接各个区域 20%
    const roadArea = {
      x: screenWidth * 0.4,
      y: screenHeight * 0.1,
      width: screenWidth * 0.2,
      height: screenHeight * 0.8
    };

    // 创建房子区域
    this.createHouseArea(houseArea);

    // 创建池塘区域
    this.createPondArea(pondArea);

    // 创建道路系统
    this.createRoadSystem(roadArea);

    // 创建农场区域装饰
    this.createFarmAreaDecorations(farmArea);

    // 添加一些装饰性树木和花朵
    this.createDecorativeElements();
  }

  private createHouseArea(area: { x: number; y: number; width: number; height: number }) {
    // 主房子
    const house = this.add.sprite(area.x + area.width * 0.5, area.y + area.height * 0.7, 'farm_house');
    house.setOrigin(0.5, 1);
    house.setDepth(8);
    house.setScale(1.2);
    this.decorations.add(house);

    // 房子前的花园
    const gardenPositions = [
      { x: area.x + area.width * 0.3, y: area.y + area.height * 0.8 },
      { x: area.x + area.width * 0.7, y: area.y + area.height * 0.8 },
      { x: area.x + area.width * 0.5, y: area.y + area.height * 0.9 }
    ];

    gardenPositions.forEach(pos => {
      const flower = this.add.sprite(pos.x, pos.y, 'farm_flower');
      flower.setOrigin(0.5, 1);
      flower.setDepth(3);
      this.decorations.add(flower);
    });

    // 房子旁边的小仓库
    const barn = this.add.sprite(area.x + area.width * 0.8, area.y + area.height * 0.6, 'farm_barn');
    barn.setOrigin(0.5, 1);
    barn.setDepth(8);
    barn.setScale(0.8);
    this.decorations.add(barn);
  }

  private createPondArea(area: { x: number; y: number; width: number; height: number }) {
    // 主池塘
    const pond = this.add.circle(area.x + area.width * 0.5, area.y + area.height * 0.5, area.width * 0.3, 0x4a90e2, 0.6);
    pond.setStrokeStyle(3, 0x74b9ff, 0.8);
    pond.setDepth(5);
    this.decorations.add(pond);

    // 池塘边的石头
    const stonePositions = [
      { x: area.x + area.width * 0.3, y: area.y + area.height * 0.4 },
      { x: area.x + area.width * 0.7, y: area.y + area.height * 0.6 },
      { x: area.x + area.width * 0.2, y: area.y + area.height * 0.7 }
    ];

    stonePositions.forEach(pos => {
      const stone = this.add.circle(pos.x, pos.y, 8, 0x95a5a6, 0.8);
      stone.setDepth(6);
      this.decorations.add(stone);
    });

    // 池塘边的水井
    const well = this.add.sprite(area.x + area.width * 0.8, area.y + area.height * 0.7, 'farm_well');
    well.setOrigin(0.5, 1);
    well.setDepth(6);
    this.decorations.add(well);

    // 添加水波纹动画效果
    this.createPondAnimation(area.x + area.width * 0.5, area.y + area.height * 0.5);
  }

  private createPondAnimation(centerX: number, centerY: number) {
    // 创建水波纹效果
    this.time.addEvent({
      delay: 2000,
      callback: () => {
        const ripple = this.add.circle(centerX, centerY, 5, 0x74b9ff, 0.3);
        ripple.setDepth(4);

        this.tweens.add({
          targets: ripple,
          scaleX: 3,
          scaleY: 3,
          alpha: 0,
          duration: 1500,
          ease: 'Power2',
          onComplete: () => ripple.destroy()
        });
      },
      loop: true
    });
  }

  private createRoadSystem(area: { x: number; y: number; width: number; height: number }) {
    // 主道路 - 垂直连接
    const mainRoad = this.add.rectangle(area.x + area.width * 0.5, area.y + area.height * 0.5, area.width, area.height, 0x8b4513, 0.7);
    mainRoad.setDepth(2);
    this.decorations.add(mainRoad);

    // 道路装饰线
    const roadLines = [
      { x: area.x + area.width * 0.3, y: area.y + area.height * 0.5 },
      { x: area.x + area.width * 0.7, y: area.y + area.height * 0.5 }
    ];

    roadLines.forEach(pos => {
      const line = this.add.rectangle(pos.x, pos.y, 4, area.height, 0xffffff, 0.8);
      line.setDepth(3);
      this.decorations.add(line);
    });

    // 道路交叉点
    const crossroad = this.add.circle(area.x + area.width * 0.5, area.y + area.height * 0.5, 15, 0x8b4513, 0.8);
    crossroad.setDepth(3);
    this.decorations.add(crossroad);
  }

  private createFarmAreaDecorations(area: { x: number; y: number; width: number; height: number }) {
    // 农场区域的装饰性元素

    // 风车
    const windmill = this.add.sprite(area.x + area.width * 0.8, area.y + area.height * 0.2, 'farm_windmill');
    windmill.setOrigin(0.5, 1);
    windmill.setDepth(9);
    this.decorations.add(windmill);

    // 创建风车动画
    this.anims.create({
      key: 'windmill_spin',
      frames: this.anims.generateFrameNumbers('farm_windmill', { start: 0, end: 7 }),
      frameRate: 4,
      repeat: -1
    });
    windmill.play('windmill_spin');

    // 农场边界围栏
    const fencePositions = [
      // 上边界
      { x: area.x + area.width * 0.1, y: area.y + area.height * 0.1 },
      { x: area.x + area.width * 0.3, y: area.y + area.height * 0.1 },
      { x: area.x + area.width * 0.5, y: area.y + area.height * 0.1 },
      { x: area.x + area.width * 0.7, y: area.y + area.height * 0.1 },
      { x: area.x + area.width * 0.9, y: area.y + area.height * 0.1 },
      // 下边界
      { x: area.x + area.width * 0.1, y: area.y + area.height * 0.9 },
      { x: area.x + area.width * 0.3, y: area.y + area.height * 0.9 },
      { x: area.x + area.width * 0.5, y: area.y + area.height * 0.9 },
      { x: area.x + area.width * 0.7, y: area.y + area.height * 0.9 },
      { x: area.x + area.width * 0.9, y: area.y + area.height * 0.9 }
    ];

    fencePositions.forEach(pos => {
      const fence = this.add.rectangle(pos.x, pos.y, 8, 20, 0x8b4513, 0.8);
      fence.setDepth(4);
      this.decorations.add(fence);
    });
  }

  private createDecorativeElements() {
    // 添加装饰性树木
    const treePositions = [
      { x: 80, y: 400 }, { x: 150, y: 500 }, { x: 600, y: 150 },
      { x: 750, y: 350 }, { x: 200, y: 600 }, { x: 550, y: 600 }
    ];

    treePositions.forEach(pos => {
      const tree = this.add.sprite(pos.x, pos.y, 'farm_tree');
      tree.setOrigin(0.5, 1);
      tree.setDepth(7);
      this.decorations.add(tree);

      // Add physics body for collision
      this.physics.add.existing(tree, true);
    });

    // 添加装饰性花朵
    const flowerPositions = [
      { x: 120, y: 250 }, { x: 300, y: 180 }, { x: 500, y: 300 },
      { x: 350, y: 450 }, { x: 680, y: 280 }
    ];

    flowerPositions.forEach(pos => {
      const flower = this.add.sprite(pos.x, pos.y, 'farm_flower');
      flower.setOrigin(0.5, 1);
      flower.setDepth(3);
      this.decorations.add(flower);
    });
  }

  private setupInput() {
    // 初始化UI布局管理器以获取平台信息
    this.initializeUILayoutManager();
    const screenInfo = this.uiLayoutManager.getScreenInfo();

    if (!screenInfo.isMobile) {
      // 桌面端：设置键盘控制
      console.log('Setting up keyboard controls for desktop');
      this.cursors = this.input.keyboard!.createCursorKeys();
      this.wasdKeys = this.input.keyboard!.addKeys('W,S,A,D');
      this.interactKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
      this.inventoryKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.I);
      this.cookingKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.C);

      // Emergency reset key (ESC)
      const emergencyResetKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.ESC);
      emergencyResetKey.on('down', () => {
        console.log('Emergency reset triggered by ESC key');
        this.executeEmergencyReset('ESC键');
      });

      // Tool selection keys
      this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.ONE).on('down', () => {
        this.selectTool(ToolType.HOE);
      });

      this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.TWO).on('down', () => {
        this.selectTool(ToolType.WATERING_CAN);
      });

      this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.THREE).on('down', () => {
        this.selectTool(ToolType.FERTILIZER);
      });

      this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.FOUR).on('down', () => {
        this.selectTool(ToolType.SEEDS);
      });

      // Inventory key
      this.inventoryKey.on('down', () => {
        this.toggleInventory();
      });

      // Cooking key
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

  // Execute emergency reset
  private executeEmergencyReset(reason: string) {
    console.log(`Emergency reset triggered: ${reason}`);

    // Reset player position
    if (this.cat) {
      this.cat.setPosition(200, 200);
      this.cat.setVelocity(0, 0);
    }

    // Reset camera
    if (this.cameras.main) {
      this.cameras.main.setScroll(0, 0);
    }

    // Show notification
    this.showNotification('游戏已重置');

    // Haptic feedback
    if (this.hapticEnabled && navigator.vibrate) {
      navigator.vibrate([100, 50, 100]);
    }
  }

  private setupMobileControls() {
    // Import and initialize the new systems
    this.initializeUILayoutManager();
    this.initializeVirtualJoystick();
    this.setupActionButtons();

    // Enhanced touch input for world interactions
    this.setupWorldTouchHandling();

    console.log('New mobile control system initialized successfully');
  }

  // 初始化UI布局管理器
  private initializeUILayoutManager() {
    this.uiLayoutManager = new UILayoutManager(this);
    console.log('UI Layout Manager initialized');
  }

  // 初始化新的虚拟摇杆
  private initializeVirtualJoystick() {
    const screenInfo = this.uiLayoutManager.getScreenInfo();

    // 只在移动设备上创建摇杆
    if (!screenInfo.isMobile) {
      console.log('Desktop detected, skipping virtual joystick');
      return;
    }

    const joystickRadius = screenInfo.isPortrait ? 60 : 70;
    const knobRadius = joystickRadius * 0.4;
    const position = this.uiLayoutManager.getJoystickPosition(joystickRadius);

    this.virtualJoystick = new VirtualJoystick({
      x: position.x,
      y: position.y,
      radius: joystickRadius,
      knobRadius: knobRadius,
      deadZone: 0.15,
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

  // Enhanced interaction system with better feedback
  private handleInteraction() {
    const interactionRange = 80;
    const catPosition = { x: this.cat.x, y: this.cat.y };
    let interactionFound = false;

    // Check for farm plot interactions
    this.farmPlots.children.entries.forEach((plot: any) => {
      const distance = Phaser.Math.Distance.Between(
        catPosition.x, catPosition.y, plot.x, plot.y
      );

      if (distance <= interactionRange) {
        this.handleFarmPlotInteractionWithFeedback(plot);
        interactionFound = true;
      }
    });

    // Check for cooking station interactions
    if (!interactionFound) {
      this.cookingStations.children.entries.forEach((station: any) => {
        const distance = Phaser.Math.Distance.Between(
          catPosition.x, catPosition.y, station.x, station.y
        );

        if (distance <= interactionRange) {
          this.handleCookingStationInteractionWithFeedback(station);
          interactionFound = true;
        }
      });
    }

    // If no specific interaction, show general feedback
    if (!interactionFound) {
      this.showInteractionHint();
    }

    // Add haptic feedback for interactions
    if (interactionFound && this.hapticEnabled && navigator.vibrate) {
      navigator.vibrate([50, 50, 100]);
    }
  }

  private handleFarmPlotInteractionWithFeedback(plot: any) {
    // Create interaction indicator
    const indicator = this.add.text(plot.x, plot.y - 50, '🌱', {
      fontSize: '32px',
      color: '#2ecc71'
    });
    indicator.setOrigin(0.5);
    indicator.setDepth(1000);

    // Animate indicator
    this.tweens.add({
      targets: indicator,
      y: indicator.y - 20,
      scaleX: 1.5,
      scaleY: 1.5,
      alpha: 0,
      duration: 1000,
      ease: 'Power2',
      onComplete: () => indicator.destroy()
    });

    // Emit the actual interaction event
    this.events.emit('farm-plot-interaction', {
      plot: plot
    });
  }

  private handleCookingStationInteractionWithFeedback(station: any) {
    // Create cooking indicator
    const indicator = this.add.text(station.x, station.y - 50, '🍳', {
      fontSize: '32px',
      color: '#e67e22'
    });
    indicator.setOrigin(0.5);
    indicator.setDepth(1000);

    // Animate indicator
    this.tweens.add({
      targets: indicator,
      y: indicator.y - 20,
      scaleX: 1.5,
      scaleY: 1.5,
      alpha: 0,
      duration: 1000,
      ease: 'Power2',
      onComplete: () => indicator.destroy()
    });

    // Emit the actual interaction event
    this.events.emit('cooking-station-interaction', {
      station: station
    });
  }

  private showInteractionHint() {
    // Show a subtle hint that interaction is available
    const hint = this.add.text(this.cat.x, this.cat.y - 80, '💡', {
      fontSize: '24px',
      color: '#f1c40f'
    });
    hint.setOrigin(0.5);
    hint.setDepth(1000);

    this.tweens.add({
      targets: hint,
      y: hint.y - 15,
      alpha: 0,
      duration: 800,
      ease: 'Power2',
      onComplete: () => hint.destroy()
    });
  }

  // Performance monitoring and optimization
  private setupPerformanceMonitoring() {
    // Monitor FPS and adjust performance accordingly
    this.time.addEvent({
      delay: 1000,
      callback: () => {
        const currentTime = this.time.now;

        if (currentTime - this.lastFPSCheck > 5000) { // Check every 5 seconds
          const fps = this.game.loop.actualFps;
          this.adjustPerformanceMode(fps);
          this.lastFPSCheck = currentTime;

          // Emergency restart mechanism if FPS is critically low
          if (fps < 10) {
            console.warn('Critical performance detected, implementing emergency optimizations');
            this.emergencyPerformanceOptimization();
          }
        }
      },
      loop: true
    });

    // Memory cleanup timer
    this.time.addEvent({
      delay: 30000, // Every 30 seconds
      callback: () => {
        this.cleanupResources();
      },
      loop: true
    });
  }

  // Emergency performance optimization
  private emergencyPerformanceOptimization() {
    // Disable all particle effects
    this.particlePool.forEach(particles => {
      if (particles && particles.destroy) {
        particles.destroy();
      }
    });
    this.particlePool = [];

    // Reduce animation quality
    this.tweens.timeScale = 0.3;

    this.showNotification('⚠️ 已启用紧急性能优化模式');
  }

  // Resource cleanup
  private cleanupResources() {
    // Clean up old particles
    this.particlePool = this.particlePool.filter(particles => {
      if (particles && particles.active) {
        return true;
      } else {
        if (particles && particles.destroy) {
          particles.destroy();
        }
        return false;
      }
    });

    // Force garbage collection if available
    if (window.gc) {
      window.gc();
    }
  }

  private adjustPerformanceMode(fps: number) {
    let newMode: 'high' | 'medium' | 'low' = 'high';

    if (fps < 30) {
      newMode = 'low';
    } else if (fps < 45) {
      newMode = 'medium';
    }

    if (newMode !== this.performanceMode) {
      this.performanceMode = newMode;
      this.applyPerformanceSettings();
      console.log(`Performance mode adjusted to: ${newMode} (FPS: ${fps.toFixed(1)})`);
    }
  }

  private applyPerformanceSettings() {
    switch (this.performanceMode) {
      case 'low':
        // Reduce particle effects
        this.particlePool.forEach(particles => particles.setQuantity(1));
        // Reduce animation quality
        this.tweens.timeScale = 0.5;
        break;
      case 'medium':
        this.particlePool.forEach(particles => particles.setQuantity(2));
        this.tweens.timeScale = 0.8;
        break;
      case 'high':
        // Full quality
        this.tweens.timeScale = 1;
        break;
    }
  }

  private updateResponsiveUI() {
    // 使用新的布局管理器更新UI
    if (this.uiLayoutManager) {
      const screenInfo = this.uiLayoutManager.getScreenInfo();

      // 更新虚拟摇杆位置
      if (this.virtualJoystick && screenInfo.isMobile) {
        this.virtualJoystick.updateLayout(screenInfo.width, screenInfo.height);
      }

      // 更新动作按钮位置
      if (this.actionButtons.length > 0 && screenInfo.isMobile) {
        const buttonSize = screenInfo.isPortrait ? 50 : 60;
        const positions = this.uiLayoutManager.getActionButtonsPosition(buttonSize, this.actionButtons.length);

        this.actionButtons.forEach((button, index) => {
          if (positions[index]) {
            this.tweens.add({
              targets: button,
              x: positions[index].x,
              y: positions[index].y,
              duration: 300,
              ease: 'Power2.easeOut'
            });
          }
        });
      }
    }
  }

  // Helper function to smoothly update button positions
  private updateButtonPosition(buttonObj: any, newX: number, newY: number) {
    if (!buttonObj) return;

    const elements = [buttonObj.button, buttonObj.shadow, buttonObj.inner, buttonObj.icon];
    const duration = 300;

    elements.forEach(element => {
      if (element) {
        this.tweens.add({
          targets: element,
          x: newX + (element === buttonObj.shadow ? 2 : 0),
          y: newY + (element === buttonObj.shadow ? 2 : 0),
          duration: duration,
          ease: 'Power2.easeOut'
        });
      }
    });

    // Update stored position
    if (buttonObj.x !== undefined) buttonObj.x = newX;
    if (buttonObj.y !== undefined) buttonObj.y = newY;
  }

  private setupCamera() {
    // Improved camera setup with responsive behavior
    const screenWidth = this.cameras.main.width;
    const screenHeight = this.cameras.main.height;

    // Dynamic zoom based on screen size
    const baseZoom = Math.min(screenWidth / 800, screenHeight / 600);
    const optimalZoom = Math.max(0.8, Math.min(2.0, baseZoom * 1.2));

    this.cameras.main.startFollow(this.cat);
    this.cameras.main.setZoom(optimalZoom);

    // Dynamic world bounds based on screen size
    const worldWidth = Math.max(1000, screenWidth * 1.5);
    const worldHeight = Math.max(800, screenHeight * 1.5);
    this.cameras.main.setBounds(0, 0, worldWidth, worldHeight);

    // Smooth camera following
    this.cameras.main.setLerp(0.1, 0.1);
    this.cameras.main.setDeadzone(100, 100);
  }

  // Setup orientation change handling
  private setupOrientationHandling() {
    // Listen for screen orientation changes
    const handleOrientationChange = () => {
      // Delay to allow browser to complete orientation change
      this.time.delayedCall(300, () => {
        console.log('Orientation changed, updating UI layout');
        this.updateResponsiveUI();

        // Update camera bounds and zoom
        this.setupCamera();

        // Show brief notification
        this.showNotification('🔄 界面已适配新屏幕方向');
      });
    };

    // Add event listeners for orientation changes
    window.addEventListener('orientationchange', handleOrientationChange);
    window.addEventListener('resize', handleOrientationChange);

    // Store handlers for cleanup
    this.orientationHandlers = {
      orientationChange: handleOrientationChange,
      resize: handleOrientationChange
    };
  }

  private setupCollisions() {
    // Collision between cat and decorations
    this.physics.add.collider(this.cat, this.decorations);
  }

  private setupEventListeners() {
    // Farm plot interaction events
    this.events.on('farm-plot-interaction', (data: any) => {
      this.handleFarmPlotInteraction(data.plot);
    });

    // Cooking station interaction events
    this.events.on('cooking-station-interaction', (cookingStation: CookingStation) => {
      this.handleCookingStationInteraction(cookingStation);
    });

    // Cooking completion events
    this.events.on('cooking-completed', (data: any) => {
      this.handleCookingCompletion(data.recipe, data.result);
    });

    // Cat level up events
    this.events.on('cat-level-up', (level: number) => {
      this.showNotification(`🎉 小猫升级了！现在是 ${level} 级！`);
    });

    // Cat tired events
    this.events.on('cat-tired', () => {
      this.showNotification('😴 小猫累了，需要休息一下！');
    });
  }

  private createAtmosphere() {
    // Add ambient particles (butterflies, leaves, etc.)
    const butterflies = this.add.particles(0, 0, 'sparkle', {
      x: { min: 0, max: 800 },
      y: { min: 0, max: 600 },
      scale: { start: 0.1, end: 0.3 },
      alpha: { start: 0.8, end: 0.3 },
      tint: [0xFFD700, 0xFF69B4, 0x87CEEB],
      lifespan: 5000,
      frequency: 2000,
      quantity: 1,
      speed: { min: 20, max: 40 },
      gravityY: -10
    });
    butterflies.setDepth(15);
  }

  private selectTool(tool: ToolType) {
    this.currentTool = tool;
    this.cat.setCurrentTool(tool);

    const toolNames = {
      [ToolType.HOE]: '锄头',
      [ToolType.WATERING_CAN]: '水壶',
      [ToolType.FERTILIZER]: '肥料',
      [ToolType.SEEDS]: '种子'
    };

    this.showNotification(`选择了 ${toolNames[tool]}`);
  }

  private handleFarmPlotInteraction(plot: FarmPlot) {
    if (!this.cat.canPerformAction()) {
      this.showNotification('小猫太累了，无法工作！');
      return;
    }

    switch (this.currentTool) {
      case ToolType.HOE:
        if (plot.canPlow()) {
          if (this.cat.performAction('dig')) {
            this.time.delayedCall(1000, () => {
              plot.plow();
              this.showNotification('土地已耕好！');
              this.cat.gainExperience(5);
            });
          }
        } else {
          this.showNotification('这块地已经耕过了！');
        }
        break;

      case ToolType.WATERING_CAN:
        if (plot.canWater()) {
          if (this.cat.performAction('water')) {
            this.time.delayedCall(800, () => {
              plot.waterCrop();
              this.showNotification('作物已浇水！');
              this.cat.gainExperience(2);
            });
          }
        } else {
          this.showNotification('这里没有作物需要浇水！');
        }
        break;

      case ToolType.FERTILIZER:
        if (plot.canFertilize()) {
          if (this.cat.performAction('water')) {
            this.time.delayedCall(800, () => {
              plot.fertilizeCrop();
              this.showNotification('作物已施肥！');
              this.cat.gainExperience(3);
            });
          }
        } else {
          this.showNotification('这里没有作物需要施肥！');
        }
        break;

      case ToolType.SEEDS:
        if (plot.canPlant()) {
          this.showSeedSelectionMenu(plot);
        } else {
          this.showNotification('这块地还没有耕好或已经种了作物！');
        }
        break;

      default:
        if (plot.canHarvest()) {
          if (this.cat.performAction('harvest')) {
            this.time.delayedCall(600, () => {
              const result = plot.harvestCrop();
              if (result && result.success) {
                const crop = plot.getCrop();
                if (crop) {
                  const cropData = crop.getCropData();
                  this.inventoryManager.addHarvestedCrop(cropData.type, result.yield, result.quality);
                  this.showNotification(`收获了 ${result.yield} 个作物！品质：${result.quality}`);
                  this.cat.gainExperience(10);
                  this.cat.gainHappiness(10);
                }
              }
            });
          }
        }
        break;
    }
  }

  private handleCookingStationInteraction(cookingStation: CookingStation) {
    if (cookingStation.isCookingInProgress()) {
      this.showNotification('烹饪正在进行中...');
      return;
    }

    this.showCookingMenu(cookingStation);
  }

  private handleCookingCompletion(recipe: any, result: any) {
    // Add cooked food to inventory
    this.inventoryManager.addCookedFood(
      result.itemId,
      recipe.name,
      result.quantity,
      recipe.description
    );

    this.showNotification(`🍽️ ${recipe.name} 制作完成！`);
    this.cat.gainExperience(15);
    this.cat.gainHappiness(recipe.happinessBonus);
    this.cat.restoreEnergy(recipe.energyBonus);
  }

  private showSeedSelectionMenu(plot: FarmPlot) {
    // Simple seed selection - plant carrot by default for now
    // In a full implementation, this would show a UI menu
    const seeds = this.inventoryManager.getItemsByType('seed');
    if (seeds.length > 0) {
      const seedItem = seeds[0];
      const cropType = seedItem.id.replace('_seeds', '') as CropType;

      if (this.inventoryManager.removeItem(seedItem.id, 1)) {
        plot.plantCrop(cropType);
        this.showNotification(`种植了 ${seedItem.name}！`);
        this.cat.gainExperience(5);
      }
    } else {
      this.showNotification('没有种子可以种植！');
    }
  }

  private showCookingMenu(cookingStation: CookingStation) {
    // Simple cooking - make carrot soup if ingredients available
    // In a full implementation, this would show a cooking UI
    const availableRecipes = cookingStation.getAvailableRecipes(this.inventoryManager.getAllItems());

    if (availableRecipes.length > 0) {
      const recipe = availableRecipes[0];

      if (this.inventoryManager.consumeIngredients(recipe.ingredients)) {
        cookingStation.startCooking(recipe);
        this.showNotification(`开始制作 ${recipe.name}...`);
      }
    } else {
      this.showNotification('没有足够的材料制作任何料理！');
    }
  }



  private handleTouchInteraction(worldX: number, worldY: number) {
    const distance = Phaser.Math.Distance.Between(
      this.cat.x, this.cat.y, worldX, worldY
    );

    if (distance < 50) {
      this.handleInteraction();
    } else {
      this.movePlayerTowards(worldX, worldY);
    }
  }





  private toggleInventory() {
    // Emit event to UI scene to toggle inventory
    this.scene.get('UIScene').events.emit('toggle-inventory', this.inventoryManager.getAllItems());
  }

  private openCookingInterface() {
    // Emit event to UI scene to open cooking interface
    this.scene.get('UIScene').events.emit('open-cooking', {
      recipes: this.cookingStations.children.entries[0] ?
        (this.cookingStations.children.entries[0] as CookingStation).getAllRecipes() : [],
      inventory: this.inventoryManager.getAllItems()
    });
  }

  public showNotification(text: string) {
    // Emit notification to UI scene
    this.scene.get('UIScene').events.emit('show-notification', text);
  }

  public showDialogue(text: string) {
    // Emit dialogue to UI scene
    this.scene.get('UIScene').events.emit('show-dialogue', text);
  }

  update() {
    // Performance monitoring - limit update frequency for heavy operations
    this.frameCounter++;

    // Handle player movement - 平台特定的控制逻辑
    let moveX = 0;
    let moveY = 0;

    // 获取平台信息
    const screenInfo = this.uiLayoutManager.getScreenInfo();

    if (screenInfo.isMobile) {
      // 移动端：只使用虚拟摇杆
      if (this.virtualJoystick) {
        const joystickVector = this.virtualJoystick.getVector();
        moveX = joystickVector.x;
        moveY = joystickVector.y;
      }
    } else {
      // PC端：只使用键盘
      if (this.cursors.left.isDown || this.wasdKeys.A.isDown) {
        moveX = -1;
      } else if (this.cursors.right.isDown || this.wasdKeys.D.isDown) {
        moveX = 1;
      }

      if (this.cursors.up.isDown || this.wasdKeys.W.isDown) {
        moveY = -1;
      } else if (this.cursors.down.isDown || this.wasdKeys.S.isDown) {
        moveY = 1;
      }
    }

    // 应用移动
    if (Math.abs(moveX) > 0.01 || Math.abs(moveY) > 0.01) {
      this.cat.move(moveX, moveY);
    } else {
      this.cat.stop();
    }

    // Update cat
    this.cat.update();

    // Performance optimized updates - only update every few frames for non-critical elements
    if (this.frameCounter % 3 === 0) {
      // Update farm plots (less frequent for performance)
      this.farmPlots.children.entries.forEach((plot: any) => {
        if (plot.update) {
          plot.update();
        }
      });
    }

    if (this.frameCounter % 5 === 0) {
      // Update cooking stations (even less frequent)
      this.cookingStations.children.entries.forEach((station: any) => {
        if (station.update) {
          station.update();
        }
      });
    }

    // Handle interaction key (only for desktop)
    if (!screenInfo.isMobile && Phaser.Input.Keyboard.JustDown(this.interactKey)) {
      this.handleInteraction();
    }

    // Update responsive UI elements
    this.updateResponsiveUI();
  }

  // Scene cleanup - called when scene is destroyed
  destroy() {
    // 清理新的控制系统
    if (this.virtualJoystick) {
      this.virtualJoystick.destroy();
    }

    if (this.uiLayoutManager) {
      this.uiLayoutManager.destroy();
    }

    // 清理新的动作按钮
    this.actionButtons.forEach(button => {
      if (button && button.destroy) {
        button.destroy();
      }
    });



    // Clean up particle pool
    this.particlePool.forEach(particles => {
      if (particles && particles.destroy) {
        particles.destroy();
      }
    });
    this.particlePool = [];

    // Clean up tooltips
    if (this.toolTooltip) {
      this.toolTooltip.destroy();
      this.toolTooltip = null;
    }

    // Clean up orientation handlers
    if (this.orientationHandlers) {
      window.removeEventListener('orientationchange', this.orientationHandlers.orientationChange);
      window.removeEventListener('resize', this.orientationHandlers.resize);
      this.orientationHandlers = null;
    }

    // Ensure cat movement is stopped
    if (this.cat) {
      this.cat.setVelocity(0, 0);
    }

    console.log('GameScene cleanup completed');
  }




}
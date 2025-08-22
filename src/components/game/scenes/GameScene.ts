import * as Phaser from 'phaser';
import { Cat } from '../entities/Player';
import { FarmPlot } from '../entities/FarmPlot';
import { CookingStation } from '../entities/CookingStation';
import { InventoryManager } from '../entities/InventoryManager';
import { CropType, ToolType } from '../types/GameTypes';
import { VirtualJoystick } from '../VirtualJoystick';
import { UILayoutManager } from '../UILayoutManager';

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
  
  // 保留的旧属性（兼容性）
  private virtualControls!: any;
  private touchStartPos: { x: number; y: number } | null = null;
  private currentTool: ToolType | null = null;
  private toolTooltip: Phaser.GameObjects.Text | null = null;
  private hapticEnabled: boolean = false;
  private useSimpleTouch: boolean = false; // Toggle for simple touch controls like original RPG
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

    // Setup input
    this.setupInput();
    
    // Setup mobile controls with error handling
    try {
      this.setupMobileControls();
      // Test joystick functionality after a short delay
      this.time.delayedCall(1000, () => {
        this.testJoystickFunctionality();
      });
    } catch (error) {
      console.warn('Virtual joystick failed, falling back to simple touch controls:', error);
      this.useSimpleTouch = true;
      this.setupSimpleTouchControls();
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
    this.createAmbientEffects();

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
    // Create farm plots with improved layout that avoids UI conflicts
    const screenWidth = this.cameras.main.width;
    const screenHeight = this.cameras.main.height;
    
    // Calculate safe areas for farm plots (avoiding UI elements)
    const uiSafeMargin = 120; // Margin to avoid UI elements
    const plotSize = 40;
    const plotSpacing = 60;
    
    // Define farming areas that don't conflict with UI
    const farmingAreas = [
      // Main farming area (center-left)
      {
        startX: 180,
        startY: 160,
        cols: 4,
        rows: 3,
        name: 'main_farm'
      },
      // Secondary farming area (center-right, avoiding action buttons)
      {
        startX: Math.min(450, screenWidth - uiSafeMargin - plotSpacing * 3),
        startY: 180,
        cols: 3,
        rows: 3,
        name: 'secondary_farm'
      },
      // Upper farming area (if screen is tall enough)
      {
        startX: 300,
        startY: 80,
        cols: 3,
        rows: 2,
        name: 'upper_farm'
      }
    ];
    
    farmingAreas.forEach(area => {
      // Only create area if it fits within screen bounds
      const areaWidth = area.cols * plotSpacing;
      const areaHeight = area.rows * plotSpacing;
      
      if (area.startX + areaWidth < screenWidth - uiSafeMargin && 
          area.startY + areaHeight < screenHeight - uiSafeMargin) {
        
        for (let row = 0; row < area.rows; row++) {
          for (let col = 0; col < area.cols; col++) {
            const x = area.startX + (col * plotSpacing);
            const y = area.startY + (row * plotSpacing);
            
            // Ensure plot doesn't conflict with UI areas
            if (this.isValidPlotPosition(x, y, screenWidth, screenHeight)) {
              const plot = new FarmPlot(this, x, y);
              this.farmPlots.add(plot);
            }
          }
        }
      }
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

  private createCookingStations() {
    // Add cooking stations with improved positioning to avoid UI conflicts
    const screenWidth = this.cameras.main.width;
    const screenHeight = this.cameras.main.height;
    const uiSafeMargin = 120;
    
    // Position cooking stations in safe areas
    const stationPositions = [
      // Station 1: Upper-left area
      {
        x: Math.max(150, uiSafeMargin),
        y: Math.max(120, 80)
      },
      // Station 2: Center area, avoiding both joystick and action buttons
      {
        x: Math.min(screenWidth / 2, screenWidth - uiSafeMargin - 50),
        y: Math.max(screenHeight / 2 - 100, 150)
      }
    ];
    
    // Only add stations that fit within safe boundaries
    stationPositions.forEach((pos, index) => {
      if (this.isValidPlotPosition(pos.x, pos.y, screenWidth, screenHeight)) {
        const station = new CookingStation(this, pos.x, pos.y);
        this.cookingStations.add(station);
      }
    });
    
    // Ensure we have at least one cooking station
    if (this.cookingStations.children.size === 0) {
      // Fallback position in center of screen
      const fallbackX = screenWidth / 2;
      const fallbackY = Math.max(200, screenHeight / 3);
      const fallbackStation = new CookingStation(this, fallbackX, fallbackY);
      this.cookingStations.add(fallbackStation);
    }
  }

  private createFarmDecorations() {
    // Add farm house
    const farmHouse = this.add.sprite(100, 150, 'farm_house');
    farmHouse.setOrigin(0.5, 1);
    farmHouse.setDepth(8);
    this.decorations.add(farmHouse);

    // Add barn
    const barn = this.add.sprite(700, 200, 'farm_barn');
    barn.setOrigin(0.5, 1);
    barn.setDepth(8);
    this.decorations.add(barn);

    // Add well
    const well = this.add.sprite(400, 350, 'farm_well');
    well.setOrigin(0.5, 1);
    well.setDepth(6);
    this.decorations.add(well);

    // Add trees
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

    // Add flowers
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

    // Add animated windmill
    const windmill = this.add.sprite(600, 250, 'farm_windmill');
    windmill.setOrigin(0.5, 1);
    windmill.setDepth(9);
    this.decorations.add(windmill);

    // Create windmill animation
    this.anims.create({
      key: 'windmill_spin',
      frames: this.anims.generateFrameNumbers('farm_windmill', { start: 0, end: 7 }),
      frameRate: 4,
      repeat: -1
    });
    windmill.play('windmill_spin');
  }

  private setupInput() {
    // Keyboard controls
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

    // 设置摇杆回调
    this.virtualJoystick.onMoveCallback((vector) => {
      if (this.cat && !this.cat.isActing) {
        const speed = 120;
        const velocityX = vector.x * speed;
        const velocityY = vector.y * speed;
        this.cat.setVelocity(velocityX, velocityY);
      }
    });

    this.virtualJoystick.onEndCallback(() => {
      if (this.cat) {
        this.cat.setVelocity(0, 0);
      }
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



  // Test if joystick is working properly
  private testJoystickFunctionality() {
    if (!this.virtualControls || !this.virtualControls.joystickKnob) {
      console.warn('Joystick elements not found, switching to simple touch controls');
      this.switchToSimpleTouch();
      return;
    }

    // Check if joystick elements are properly positioned
    const knob = this.virtualControls.joystickKnob;
    const center = this.virtualControls.joystickCenter;
    
    if (!knob.x || !knob.y || !center.x || !center.y) {
      console.warn('Joystick positioning issue detected, switching to simple touch controls');
      this.switchToSimpleTouch();
      return;
    }

    // Test touch detection
    const testDistance = Phaser.Math.Distance.Between(
      center.x, center.y, center.x + 50, center.y + 50
    );
    
    if (testDistance === 0) {
      console.warn('Joystick distance calculation issue, switching to simple touch controls');
      this.switchToSimpleTouch();
      return;
    }

    console.log('Joystick functionality test passed');
  }

  // Switch to simple touch controls as fallback
  private switchToSimpleTouch() {
    this.useSimpleTouch = true;
    
    // Clean up existing virtual controls
    if (this.virtualControls) {
      Object.values(this.virtualControls).forEach((element: any) => {
        if (element && element.destroy) {
          element.destroy();
        } else if (Array.isArray(element)) {
          element.forEach((item: any) => {
            if (item && item.destroy) item.destroy();
          });
        }
      });
      this.virtualControls = null;
    }
    
    // Setup simple touch controls
    this.setupSimpleTouchControls();
    
         // Show notification to user
     this.showNotification('已切换到简单触摸控制模式');
   }

     // Create modern control mode toggle button
  private createControlModeToggle() {
    // Create settings panel container
    const settingsPanel = this.add.container(60, 60);
    settingsPanel.setScrollFactor(0);
    settingsPanel.setDepth(1000);

    // Modern toggle button with glassmorphism
    const toggleButtonShadow = this.add.circle(2, 2, 28, 0x000000, 0.3);
    const toggleButton = this.add.circle(0, 0, 28, 0x6c5ce7, 0.85);
    toggleButton.setInteractive();
    toggleButton.setStrokeStyle(2, 0x74b9ff, 0.8);

    // Inner gradient ring
    const toggleInner = this.add.circle(0, 0, 20, 0x74b9ff, 0.3);

    const toggleText = this.add.text(0, 0, '🎮', {
      fontSize: '18px',
      color: '#ffffff'
    });
    toggleText.setOrigin(0.5);

    // Add emergency reset button next to toggle
    const resetButtonShadow = this.add.circle(62, 2, 22, 0x000000, 0.3);
    const resetButton = this.add.circle(60, 0, 22, 0xe74c3c, 0.85);
    resetButton.setInteractive();
    resetButton.setStrokeStyle(2, 0xff6b6b, 0.8);

    const resetInner = this.add.circle(60, 0, 16, 0xff6b6b, 0.3);
    const resetText = this.add.text(60, 0, '🔄', {
      fontSize: '14px',
      color: '#ffffff'
    });
    resetText.setOrigin(0.5);

    // Emergency reset functionality
    resetButton.on('pointerdown', () => {
      this.executeEmergencyReset('重置按钮');
      
      // Visual feedback
      this.triggerActionHaptic('button_press');
      this.tweens.add({
        targets: [resetButton, resetInner, resetText],
        scaleX: 0.8,
        scaleY: 0.8,
        duration: 100,
        yoyo: true,
        ease: 'Back.easeOut'
      });
    });

    // Add subtle breathing animation
    this.tweens.add({
      targets: [toggleButton, toggleInner],
      scaleX: 1.05,
      scaleY: 1.05,
      duration: 2000,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });

    // Reset button pulse animation
    this.tweens.add({
      targets: [resetButton, resetInner],
      scaleX: 1.03,
      scaleY: 1.03,
      duration: 1500,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });

    // Toggle functionality with enhanced feedback
    toggleButton.on('pointerdown', () => {
      this.useSimpleTouch = !this.useSimpleTouch;
      
      // Enhanced visual feedback
      this.triggerActionHaptic('button_press');
      
      if (this.useSimpleTouch) {
        toggleText.setText('👆');
        toggleButton.setFillStyle(0xe17055, 0.85);
        toggleInner.setFillStyle(0xff7675, 0.3);
        this.switchToSimpleTouch();
      } else {
        toggleText.setText('🎮');
        toggleButton.setFillStyle(0x6c5ce7, 0.85);
        toggleInner.setFillStyle(0x74b9ff, 0.3);
        this.switchToJoystickMode();
      }
      
      // Enhanced press animation
      this.tweens.add({
        targets: [toggleButton, toggleInner, toggleText],
        scaleX: 0.9,
        scaleY: 0.9,
        duration: 100,
        yoyo: true,
        ease: 'Back.easeOut'
      });

      // Create ripple effect
      const ripple = this.add.circle(0, 0, 10, 0xffffff, 0.6);
      ripple.setDepth(1005);
      settingsPanel.add(ripple);
      
      this.tweens.add({
        targets: ripple,
        scaleX: 3,
        scaleY: 3,
        alpha: 0,
        duration: 300,
        ease: 'Power2',
        onComplete: () => ripple.destroy()
      });
    });

    // Add all elements to panel
    settingsPanel.add([toggleButtonShadow, toggleButton, toggleInner, toggleText, 
                       resetButtonShadow, resetButton, resetInner, resetText]);

    // Store reference for cleanup
    if (!this.actionButtons) this.actionButtons = {};
    this.actionButtons.modeToggle = { 
      panel: settingsPanel,
      button: toggleButton, 
      text: toggleText,
      inner: toggleInner,
      resetButton: resetButton,
      resetText: resetText,
      resetInner: resetInner
    };
  }

     // Switch to joystick mode
  private switchToJoystickMode() {
    // Clean up simple touch handlers and any existing joystick
    this.input.removeAllListeners('pointerdown');
    this.cleanupExistingJoystick();
    
    // Ensure cat movement is stopped
    this.cat.setVelocity(0, 0);
    
    // Recreate virtual joystick
    this.createEnhancedVirtualJoystick();
    this.createEnhancedActionButtons();
    
    // Restore enhanced touch input
    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      if (this.isInVirtualControlsArea(pointer.x, pointer.y)) {
        return;
      }
      const worldPoint = this.cameras.main.getWorldPoint(pointer.x, pointer.y);
      this.handleEnhancedTouchInteraction(worldPoint.x, worldPoint.y, pointer);
    });
    
    this.showNotification('已切换到虚拟摇杆模式');
  }

  private createEnhancedVirtualJoystick() {
    // Clean up any existing joystick to prevent conflicts
    this.cleanupExistingJoystick();
    
    // Improved responsive positioning logic
    const screenWidth = this.cameras.main.width;
    const screenHeight = this.cameras.main.height;
    const isLandscape = screenWidth > screenHeight;
    const isMobile = screenWidth < 768; // Mobile breakpoint
    
    // Dynamic sizing based on screen size
    const baseSize = Math.min(screenWidth, screenHeight);
    const joystickRadius = Math.max(50, Math.min(80, baseSize * 0.08)); // 8% of smaller dimension
    const knobRadius = joystickRadius * 0.4; // 40% of joystick radius
    
    // Smart positioning to avoid conflicts
    const minPadding = 20;
    const safePadding = isMobile ? 40 : 60;
    
    // Calculate optimal joystick position
    let joystickX, joystickY;
    
    if (isLandscape) {
      // Landscape: position in bottom-left with more space from edges
      joystickX = Math.max(safePadding + joystickRadius, joystickRadius + minPadding);
      joystickY = screenHeight - safePadding - joystickRadius;
    } else {
      // Portrait: position lower and more centered to avoid thumb reach issues
      joystickX = Math.max(safePadding + joystickRadius, screenWidth * 0.2);
      joystickY = Math.min(screenHeight - safePadding - joystickRadius, screenHeight * 0.85);
    }
    
    // Ensure joystick doesn't go off-screen
    joystickX = Math.min(joystickX, screenWidth - joystickRadius - minPadding);
    joystickY = Math.max(joystickY, joystickRadius + minPadding);

    // Modern joystick base with improved visual design
    const joystickBase = this.add.circle(joystickX, joystickY, joystickRadius, 0x000000, 0.25);
    joystickBase.setScrollFactor(0);
    joystickBase.setDepth(1000);
    joystickBase.setStrokeStyle(2, 0x4a90e2, 0.5);

    // Add gradient inner ring for depth
    const joystickInner = this.add.circle(joystickX, joystickY, joystickRadius - 6, 0x1a1a2e, 0.3);
    joystickInner.setScrollFactor(0);
    joystickInner.setDepth(1001);
    joystickInner.setStrokeStyle(1, 0x6c5ce7, 0.4);

    // Enhanced joystick knob with better visual feedback
    const joystickKnob = this.add.circle(joystickX, joystickY, knobRadius, 0x4a90e2, 0.8);
    joystickKnob.setScrollFactor(0);
    joystickKnob.setDepth(1002);
    joystickKnob.setStrokeStyle(2, 0x74b9ff, 0.9);

    // Subtle shadow for depth
    const knobShadow = this.add.circle(joystickX + 1, joystickY + 1, knobRadius, 0x000000, 0.15);
    knobShadow.setScrollFactor(0);
    knobShadow.setDepth(999);

    // Direction indicator dots with improved positioning
    const dotRadius = Math.max(3, joystickRadius * 0.06);
    const dotDistance = joystickRadius - 12;
    const dotPositions = [
      { x: 0, y: -dotDistance }, // Top
      { x: dotDistance * 0.7, y: -dotDistance * 0.7 }, // Top-right
      { x: dotDistance, y: 0 }, // Right
      { x: dotDistance * 0.7, y: dotDistance * 0.7 }, // Bottom-right
      { x: 0, y: dotDistance }, // Bottom
      { x: -dotDistance * 0.7, y: dotDistance * 0.7 }, // Bottom-left
      { x: -dotDistance, y: 0 }, // Left
      { x: -dotDistance * 0.7, y: -dotDistance * 0.7 } // Top-left
    ];

    const directionDots = dotPositions.map((pos, index) => {
      const dot = this.add.circle(joystickX + pos.x, joystickY + pos.y, dotRadius, 0x74b9ff, 0.4);
      dot.setScrollFactor(0);
      dot.setDepth(998);
      
      // Subtle pulsing animation
      this.tweens.add({
        targets: dot,
        alpha: 0.2,
        duration: 1500 + (index * 100),
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut'
      });
      
      return dot;
    });

    // Store virtual controls with improved configuration
    this.virtualControls = {
      joystickBase,
      joystickInner,
      joystickKnob,
      knobShadow,
      directionDots,
      joystickCenter: { x: joystickX, y: joystickY },
      isDragging: false,
      joystickVector: { x: 0, y: 0 },
      deadZone: 0.12, // Optimized dead zone
      maxDistance: joystickRadius - knobRadius - 3,
      lastInputTime: 0,
      isStuck: false,
      activePointerId: null,
      stuckDetectionTimer: null,
      // New properties for better conflict resolution
      touchArea: {
        x: joystickX - joystickRadius - 20,
        y: joystickY - joystickRadius - 20,
        width: (joystickRadius + 20) * 2,
        height: (joystickRadius + 20) * 2
      }
    };

    // Enhanced joystick input handling with better conflict prevention
    joystickBase.setInteractive({ useHandCursor: false });
    joystickKnob.setInteractive({ useHandCursor: false });

    const handleJoystickStart = (pointer: Phaser.Input.Pointer) => {
      // Prevent event bubbling
      pointer.event?.preventDefault();
      pointer.event?.stopPropagation();
      
      const distance = Phaser.Math.Distance.Between(
        pointer.x, pointer.y, joystickX, joystickY
      );
      
      // Improved touch detection area with better boundaries
      if (distance <= joystickRadius + 25) {
        // Prevent multiple pointers from controlling the same joystick
        if (this.virtualControls.activePointerId !== null && 
            this.virtualControls.activePointerId !== pointer.id) {
          return;
        }
        
        // Immediate state update to prevent conflicts
        this.virtualControls.isDragging = true;
        this.virtualControls.activePointerId = pointer.id;
        this.virtualControls.lastInputTime = this.time.now;
        this.virtualControls.isStuck = false;
        
        // Visual feedback
        joystickKnob.setFillStyle(0x74b9ff, 1);
        joystickKnob.setScale(1.05); // Reduced scale for subtler feedback
        
        // Haptic feedback
        this.triggerActionHaptic('joystick_start');
        
        // Smooth activation animation
        this.tweens.add({
          targets: joystickKnob,
          scaleX: 1.1,
          scaleY: 1.1,
          duration: 150,
          ease: 'Back.easeOut'
        });
        
        // Clear any existing stuck detection
        this.clearStuckDetection();
        this.startStuckDetection();
      }
    };

    // Attach to both joystick elements for better touch detection
    joystickBase.on('pointerdown', handleJoystickStart);
    joystickKnob.on('pointerdown', handleJoystickStart);

    // Enhanced pointer move handler with improved stability
    const handlePointerMove = (pointer: Phaser.Input.Pointer) => {
      if (!this.virtualControls || 
          !this.virtualControls.isDragging || 
          this.virtualControls.activePointerId !== pointer.id) {
        return;
      }

      // Prevent default touch behavior
      pointer.event?.preventDefault();
      
      // Update input tracking
      this.virtualControls.lastInputTime = this.time.now;
      this.virtualControls.isStuck = false;
      
      const centerX = this.virtualControls.joystickCenter.x;
      const centerY = this.virtualControls.joystickCenter.y;
      
      let deltaX = pointer.x - centerX;
      let deltaY = pointer.y - centerY;
      
      const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
      const maxDistance = this.virtualControls.maxDistance;
      
      // Constrain movement within joystick bounds
      if (distance > maxDistance) {
        const ratio = maxDistance / distance;
        deltaX *= ratio;
        deltaY *= ratio;
      }
      
      // Smooth knob movement with improved interpolation
      const lerpFactor = 0.85; // Faster response
      joystickKnob.x = Phaser.Math.Linear(joystickKnob.x, centerX + deltaX, lerpFactor);
      joystickKnob.y = Phaser.Math.Linear(joystickKnob.y, centerY + deltaY, lerpFactor);
      
      // Calculate normalized vector with improved responsiveness
      const normalizedDistance = Math.min(distance / maxDistance, 1);
      if (normalizedDistance > this.virtualControls.deadZone) {
        // Improved control curve for better feel
        const controlFactor = Math.pow(normalizedDistance, 0.8); // Slight curve for natural feel
        
        this.virtualControls.joystickVector.x = (deltaX / maxDistance) * controlFactor;
        this.virtualControls.joystickVector.y = (deltaY / maxDistance) * controlFactor;
      } else {
        this.virtualControls.joystickVector.x = 0;
        this.virtualControls.joystickVector.y = 0;
      }

      // Update direction indicators
      this.updateDirectionIndicators(deltaX, deltaY);
    };

    this.input.on('pointermove', handlePointerMove);

    // Improved pointer up handler with better reset logic
    const resetJoystick = (pointer?: Phaser.Input.Pointer) => {
      // Only reset if it's the active pointer or no specific pointer
      if (pointer && this.virtualControls.activePointerId !== null && 
          this.virtualControls.activePointerId !== pointer.id) {
        return;
      }
      
      if (this.virtualControls.isDragging || this.virtualControls.isStuck) {
        // Immediate state reset
        this.virtualControls.isDragging = false;
        this.virtualControls.activePointerId = null;
        this.virtualControls.isStuck = false;
        
        // Immediately stop movement
        this.virtualControls.joystickVector = { x: 0, y: 0 };
        this.virtualControls.lastInputTime = 0;
        
        // Clear stuck detection
        this.clearStuckDetection();
        
        // Smooth return animation
        this.tweens.killTweensOf(joystickKnob);
        this.tweens.add({
          targets: joystickKnob,
          x: joystickX,
          y: joystickY,
          scaleX: 1,
          scaleY: 1,
          duration: 200,
          ease: 'Back.easeOut',
          onComplete: () => {
            // Ensure final state is correct
            joystickKnob.x = joystickX;
            joystickKnob.y = joystickY;
            joystickKnob.setScale(1);
            joystickKnob.setFillStyle(0x4a90e2, 0.8);
            
            // Final safety check
            if (this.virtualControls) {
              this.virtualControls.joystickVector = { x: 0, y: 0 };
            }
          }
        });
        
        // Reset visual state
        joystickKnob.setFillStyle(0x4a90e2, 0.8);
        
        // Haptic feedback
        this.triggerActionHaptic('joystick_release');
        
        // Reset direction indicators
        this.resetDirectionIndicators();
      }
    };

    this.input.on('pointerup', resetJoystick);
    this.input.on('pointerupoutside', resetJoystick);
    
    // Add window focus/blur handlers to prevent stuck state
    window.addEventListener('blur', () => resetJoystick());
    window.addEventListener('focus', () => resetJoystick());
  }

  // Helper function to reset direction indicators
  private resetDirectionIndicators() {
    if (this.virtualControls && this.virtualControls.directionDots) {
      this.virtualControls.directionDots.forEach((dot: any) => {
        dot.setAlpha(0.4);
        dot.setScale(1);
      });
    }
  }

  // Improved direction indicator updates with better visual feedback
  private updateDirectionIndicators(deltaX: number, deltaY: number) {
    if (!this.virtualControls || !this.virtualControls.directionDots) return;
    
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
    const maxDistance = this.virtualControls.maxDistance;
    const normalizedDistance = Math.min(distance / maxDistance, 1);
    
    // Calculate angle for directional highlighting
    const angle = Math.atan2(deltaY, deltaX);
    const directions = [
      -Math.PI/2,        // Top (0)
      -Math.PI/4,        // Top-right (1)
      0,                 // Right (2)
      Math.PI/4,         // Bottom-right (3)
      Math.PI/2,         // Bottom (4)
      3*Math.PI/4,       // Bottom-left (5)
      Math.PI,           // Left (6)
      -3*Math.PI/4       // Top-left (7)
    ];
    
    this.virtualControls.directionDots.forEach((dot: any, index: number) => {
      // Calculate how close this direction is to the current angle
      let angleDiff = Math.abs(angle - directions[index]);
      if (angleDiff > Math.PI) angleDiff = 2 * Math.PI - angleDiff;
      
      // Highlight dots based on direction and intensity
      const maxAngleDiff = Math.PI / 3; // 60 degrees
      const intensity = Math.max(0, 1 - (angleDiff / maxAngleDiff)) * normalizedDistance;
      
      dot.setAlpha(0.2 + intensity * 0.8);
      dot.setScale(1 + intensity * 0.3);
    });
  }

  // Enhanced conflict detection for virtual controls area
  private isInVirtualControlsArea(x: number, y: number): boolean {
    if (!this.virtualControls) return false;
    
    // Check joystick area with improved bounds
    if (this.virtualControls.touchArea) {
      const area = this.virtualControls.touchArea;
      if (x >= area.x && x <= area.x + area.width &&
          y >= area.y && y <= area.y + area.height) {
        return true;
      }
    }
    
    // Check action buttons area
    if (this.actionButtons && this.actionButtons.layout) {
      const layout = this.actionButtons.layout;
      const buttonMargin = 30; // Extra margin for button area
      
      // Primary button area
      const primaryArea = {
        x: layout.primaryX - layout.buttonSize/2 - buttonMargin,
        y: layout.primaryY - layout.buttonSize/2 - buttonMargin,
        width: layout.buttonSize + buttonMargin * 2,
        height: layout.buttonSize + buttonMargin * 2
      };
      
      if (x >= primaryArea.x && x <= primaryArea.x + primaryArea.width &&
          y >= primaryArea.y && y <= primaryArea.y + primaryArea.height) {
        return true;
      }
      
      // Secondary buttons area
      const secondaryArea = {
        x: layout.secondaryX - layout.smallButtonSize - buttonMargin,
        y: layout.secondaryY - layout.smallButtonSize - buttonMargin,
        width: layout.smallButtonSize * 3 + buttonMargin * 2,
        height: layout.smallButtonSize * 2 + buttonMargin * 2
      };
      
      if (x >= secondaryArea.x && x <= secondaryArea.x + secondaryArea.width &&
          y >= secondaryArea.y && y <= secondaryArea.y + secondaryArea.height) {
        return true;
      }
    }
    
    return false;
  }

  // Improved stuck detection with better timing
  private startStuckDetection() {
    this.clearStuckDetection(); // Clear any existing timer
    
    this.virtualControls.stuckDetectionTimer = this.time.addEvent({
      delay: 800, // Increased delay to reduce false positives
      callback: () => {
        if (!this.virtualControls || !this.virtualControls.isDragging) return;
        
        const timeSinceLastInput = this.time.now - this.virtualControls.lastInputTime;
        
        // More lenient stuck detection - only trigger if truly stuck
        if (timeSinceLastInput > 1000 && this.virtualControls.isDragging) {
          console.warn('Joystick appears to be stuck, performing emergency reset');
          this.virtualControls.isStuck = true;
          this.emergencyJoystickReset('stuck_detection');
        }
      },
      loop: true
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

  private createEnhancedActionButtons() {
    // Dynamic sizing based on screen size
    const screenWidth = this.cameras.main.width;
    const screenHeight = this.cameras.main.height;
    const isLandscape = screenWidth > screenHeight;
    const isMobile = screenWidth < 768;
    
    // Responsive button sizing
    const baseSize = Math.min(screenWidth, screenHeight);
    const buttonSize = Math.max(45, Math.min(65, baseSize * 0.08));
    const smallButtonSize = buttonSize * 0.75;
    
    // Smart positioning to avoid joystick conflicts
    const minPadding = 15;
    const safePadding = isMobile ? 35 : 50;
    
    // Calculate button positions based on layout
    let primaryButtonX, primaryButtonY;
    let secondaryStartX, secondaryStartY;
    
    if (isLandscape) {
      // Landscape: buttons on right side, avoiding joystick area
      primaryButtonX = screenWidth - safePadding - buttonSize/2;
      primaryButtonY = screenHeight - safePadding - buttonSize/2;
      
      // Secondary buttons above primary button
      secondaryStartX = primaryButtonX;
      secondaryStartY = primaryButtonY - buttonSize - 15;
    } else {
      // Portrait: buttons on right side, lower position
      primaryButtonX = Math.min(screenWidth - safePadding - buttonSize/2, screenWidth - buttonSize/2 - minPadding);
      primaryButtonY = Math.min(screenHeight - safePadding - buttonSize/2, screenHeight * 0.8);
      
      // Secondary buttons in a compact arrangement
      secondaryStartX = primaryButtonX - buttonSize - 10;
      secondaryStartY = primaryButtonY;
    }

    // Create action buttons container for better organization
    this.actionButtons = {
      interact: null,
      inventory: null,
      cooking: null,
      tools: [],
      // Store positioning info for responsive updates
      layout: {
        isLandscape,
        isMobile,
        buttonSize,
        smallButtonSize,
        primaryX: primaryButtonX,
        primaryY: primaryButtonY,
        secondaryX: secondaryStartX,
        secondaryY: secondaryStartY
      }
    };

    // Main interact button with enhanced visual design
    const interactButtonShadow = this.add.circle(primaryButtonX + 2, primaryButtonY + 2, buttonSize/2, 0x000000, 0.25);
    interactButtonShadow.setScrollFactor(0);
    interactButtonShadow.setDepth(1009);

    const interactButton = this.add.circle(primaryButtonX, primaryButtonY, buttonSize/2, 0x27ae60, 0.85);
    interactButton.setScrollFactor(0);
    interactButton.setDepth(1010);
    interactButton.setStrokeStyle(2, 0x2ecc71, 0.8);
    interactButton.setInteractive();

    // Inner glow effect
    const interactInner = this.add.circle(primaryButtonX, primaryButtonY, buttonSize/2 - 8, 0x2ecc71, 0.3);
    interactInner.setScrollFactor(0);
    interactInner.setDepth(1011);

    const interactIcon = this.add.text(primaryButtonX, primaryButtonY, '🐾', {
      fontSize: `${Math.max(16, buttonSize * 0.35)}px`,
      color: '#ffffff'
    });
    interactIcon.setOrigin(0.5);
    interactIcon.setScrollFactor(0);
    interactIcon.setDepth(1012);

    // Enhanced interaction feedback
    interactButton.on('pointerdown', () => {
      this.handleInteraction();
      
      // Visual feedback
      this.tweens.add({
        targets: [interactButton, interactInner],
        scaleX: 0.9,
        scaleY: 0.9,
        duration: 100,
        yoyo: true,
        ease: 'Power2'
      });
      
      this.triggerActionHaptic('button_press');
    });

    this.actionButtons.interact = {
      button: interactButton,
      shadow: interactButtonShadow,
      inner: interactInner,
      icon: interactIcon
    };

    // Inventory button with improved positioning
    const inventoryButtonX = isLandscape ? secondaryStartX : secondaryStartX;
    const inventoryButtonY = isLandscape ? secondaryStartY : secondaryStartY;
    
    const inventoryButtonShadow = this.add.circle(inventoryButtonX + 2, inventoryButtonY + 2, smallButtonSize/2, 0x000000, 0.25);
    inventoryButtonShadow.setScrollFactor(0);
    inventoryButtonShadow.setDepth(1009);

    const inventoryButton = this.add.circle(inventoryButtonX, inventoryButtonY, smallButtonSize/2, 0x3498db, 0.85);
    inventoryButton.setScrollFactor(0);
    inventoryButton.setDepth(1010);
    inventoryButton.setStrokeStyle(2, 0x74b9ff, 0.8);
    inventoryButton.setInteractive();

    const inventoryInner = this.add.circle(inventoryButtonX, inventoryButtonY, smallButtonSize/2 - 6, 0x74b9ff, 0.3);
    inventoryInner.setScrollFactor(0);
    inventoryInner.setDepth(1011);

    const inventoryIcon = this.add.text(inventoryButtonX, inventoryButtonY, '🎒', {
      fontSize: `${Math.max(14, smallButtonSize * 0.35)}px`,
      color: '#ffffff'
    });
    inventoryIcon.setOrigin(0.5);
    inventoryIcon.setScrollFactor(0);
    inventoryIcon.setDepth(1012);

    inventoryButton.on('pointerdown', () => {
      this.toggleInventory();
      
      this.tweens.add({
        targets: [inventoryButton, inventoryInner],
        scaleX: 0.9,
        scaleY: 0.9,
        duration: 100,
        yoyo: true,
        ease: 'Power2'
      });
      
      this.triggerActionHaptic('button_press');
    });

    this.actionButtons.inventory = {
      button: inventoryButton,
      shadow: inventoryButtonShadow,
      inner: inventoryInner,
      icon: inventoryIcon
    };

    // Cooking button with smart positioning
    const cookingButtonX = isLandscape ? secondaryStartX : secondaryStartX - smallButtonSize - 10;
    const cookingButtonY = isLandscape ? secondaryStartY - smallButtonSize - 15 : secondaryStartY;
    
    const cookingButtonShadow = this.add.circle(cookingButtonX + 2, cookingButtonY + 2, smallButtonSize/2, 0x000000, 0.25);
    cookingButtonShadow.setScrollFactor(0);
    cookingButtonShadow.setDepth(1009);

    const cookingButton = this.add.circle(cookingButtonX, cookingButtonY, smallButtonSize/2, 0xe67e22, 0.85);
    cookingButton.setScrollFactor(0);
    cookingButton.setDepth(1010);
    cookingButton.setStrokeStyle(2, 0xf39c12, 0.8);
    cookingButton.setInteractive();

    const cookingInner = this.add.circle(cookingButtonX, cookingButtonY, smallButtonSize/2 - 6, 0xf39c12, 0.3);
    cookingInner.setScrollFactor(0);
    cookingInner.setDepth(1011);

    const cookingIcon = this.add.text(cookingButtonX, cookingButtonY, '🍳', {
      fontSize: `${Math.max(14, smallButtonSize * 0.35)}px`,
      color: '#ffffff'
    });
    cookingIcon.setOrigin(0.5);
    cookingIcon.setScrollFactor(0);
    cookingIcon.setDepth(1012);

    cookingButton.on('pointerdown', () => {
      this.openCookingInterface();
      
      this.tweens.add({
        targets: [cookingButton, cookingInner],
        scaleX: 0.9,
        scaleY: 0.9,
        duration: 100,
        yoyo: true,
        ease: 'Power2'
      });
      
      this.triggerActionHaptic('button_press');
    });

    this.actionButtons.cooking = {
      button: cookingButton,
      shadow: cookingButtonShadow,
      inner: cookingInner,
      icon: cookingIcon
    };

    // Tool selection buttons with improved layout
    const tools = ['watering_can', 'hoe', 'fertilizer'];
    const toolButtonSize = Math.max(35, smallButtonSize * 0.8);
    
    // Position tool buttons in a row above other buttons
    const toolStartX = isLandscape ? secondaryStartX - (toolButtonSize + 5) * 2 : primaryButtonX - (toolButtonSize + 5) * 2;
    const toolStartY = isLandscape ? secondaryStartY - smallButtonSize - 35 : primaryButtonY - buttonSize - 20;
    
    tools.forEach((tool, index) => {
      const toolX = toolStartX + (index * (toolButtonSize + 8));
      const toolY = toolStartY;
      
      // Ensure tool buttons don't go off-screen
      const adjustedX = Math.max(toolButtonSize/2 + minPadding, Math.min(toolX, screenWidth - toolButtonSize/2 - minPadding));
      const adjustedY = Math.max(toolButtonSize/2 + minPadding, toolY);
      
      const toolButtonShadow = this.add.circle(adjustedX + 1, adjustedY + 1, toolButtonSize/2, 0x000000, 0.2);
      toolButtonShadow.setScrollFactor(0);
      toolButtonShadow.setDepth(1009);

      const toolButton = this.add.circle(adjustedX, adjustedY, toolButtonSize/2, 0x95a5a6, 0.8);
      toolButton.setScrollFactor(0);
      toolButton.setDepth(1010);
      toolButton.setStrokeStyle(1, 0xbdc3c7, 0.6);
      toolButton.setInteractive();

      const toolIcon = this.add.text(adjustedX, adjustedY, this.getToolIcon(tool as ToolType), {
        fontSize: `${Math.max(12, toolButtonSize * 0.4)}px`,
        color: '#ffffff'
      });
      toolIcon.setOrigin(0.5);
      toolIcon.setScrollFactor(0);
      toolIcon.setDepth(1012);

      toolButton.on('pointerdown', () => {
        this.selectTool(tool as ToolType);
        
        this.tweens.add({
          targets: toolButton,
          scaleX: 0.85,
          scaleY: 0.85,
          duration: 80,
          yoyo: true,
          ease: 'Power2'
        });
        
        this.triggerActionHaptic('tool_select');
      });

      this.actionButtons.tools.push({
        type: tool,
        button: toolButton,
        shadow: toolButtonShadow,
        icon: toolIcon,
        x: adjustedX,
        y: adjustedY
      });
    });
  }

  private addButtonPressEffect(button: Phaser.GameObjects.GameObject, innerElement?: Phaser.GameObjects.GameObject) {
    if (button instanceof Phaser.GameObjects.Shape) {
      // Enhanced press effect with multiple elements
      const targets = innerElement ? [button, innerElement] : [button];
      
      // Scale down and back up for press effect
      this.tweens.add({
        targets: targets,
        scaleX: 0.85,
        scaleY: 0.85,
        duration: 120,
        yoyo: true,
        ease: 'Back.easeOut'
      });

      // Add ripple effect
      const ripple = this.add.circle(button.x, button.y, 10, 0xffffff, 0.6);
      ripple.setScrollFactor(0);
      ripple.setDepth(1005);
      
      this.tweens.add({
        targets: ripple,
        scaleX: 3,
        scaleY: 3,
        alpha: 0,
        duration: 300,
        ease: 'Power2',
        onComplete: () => ripple.destroy()
      });

      // Enhanced color flash effect
      const originalColor = button.fillColor;
      const originalAlpha = button.alpha;
      button.setFillStyle(0xffffff, 0.9);
      
      this.time.delayedCall(120, () => {
        button.setFillStyle(originalColor, originalAlpha);
      });

      // Haptic feedback if available
      if (this.hapticEnabled) {
        this.triggerHapticFeedback(25);
      }
    }
  }

  private handleInteractionWithFeedback() {
    // Enhanced visual feedback for interaction
    const feedbackIcons = ['✨', '💫', '🌟'];
    const randomIcon = feedbackIcons[Math.floor(Math.random() * feedbackIcons.length)];
    
    const feedback = this.add.text(this.cat.x, this.cat.y - 40, randomIcon, {
      fontSize: '28px',
      color: '#f1c40f'
    });
    feedback.setOrigin(0.5);
    feedback.setDepth(1000);

    // Create interaction ripple effect
    const ripple = this.add.circle(this.cat.x, this.cat.y, 5, 0xf1c40f, 0.7);
    ripple.setDepth(999);
    
    this.tweens.add({
      targets: ripple,
      scaleX: 4,
      scaleY: 4,
      alpha: 0,
      duration: 500,
      ease: 'Power2',
      onComplete: () => ripple.destroy()
    });

    // Enhanced feedback animation with bounce
    this.tweens.add({
      targets: feedback,
      y: feedback.y - 40,
      alpha: 0,
      scaleX: 1.5,
      scaleY: 1.5,
      duration: 1000,
      ease: 'Back.easeOut',
      onComplete: () => feedback.destroy()
    });

    // Add screen shake for impactful interactions
    this.cameras.main.shake(100, 0.005);

    this.handleInteraction();
  }

  private selectToolWithFeedback(tool: ToolType, toolName: string) {
    this.selectTool(tool);
    
    // Show tool selection notification
    this.showNotification(`🔧 选择了${toolName}`);
    
    // Add sparkle effect around cat
    this.createSparkleEffect(this.cat.x, this.cat.y);
  }

  private highlightSelectedTool(selectedButton: Phaser.GameObjects.Shape, selectedIndex: number) {
    // Reset all tool buttons
    this.actionButtons.tools.forEach((toolBtn: any, index: number) => {
      if (index === selectedIndex) {
        // Highlight selected tool
        toolBtn.button.setStrokeStyle(3, 0xf1c40f, 1);
        toolBtn.button.setScale(1.1);
      } else {
        // Reset other tools
        toolBtn.button.setStrokeStyle(2, toolBtn.button.fillColor, 1);
        toolBtn.button.setScale(1);
      }
    });
  }

  private showToolTooltip(toolName: string, x: number, y: number) {
    this.toolTooltip = this.add.text(x - 80, y, toolName, {
      fontSize: '12px',
      color: '#ffffff',
      backgroundColor: 'rgba(0,0,0,0.8)',
      padding: { x: 8, y: 4 }
    });
    this.toolTooltip.setOrigin(0.5);
    this.toolTooltip.setScrollFactor(0);
    this.toolTooltip.setDepth(1002);
  }

  private hideToolTooltip() {
    if (this.toolTooltip) {
      this.toolTooltip.destroy();
      this.toolTooltip = null;
    }
  }

  private createSparkleEffect(x: number, y: number) {
    const sparkles = this.add.particles(x, y, 'sparkle', {
      scale: { start: 0.3, end: 0 },
      speed: { min: 50, max: 100 },
      lifespan: 600,
      quantity: 8
    });

    this.time.delayedCall(800, () => {
      sparkles.destroy();
    });
  }

  private handleEnhancedTouchInteraction(worldX: number, worldY: number, pointer: Phaser.Input.Pointer) {
    // Create enhanced touch ripple effect
    const ripple = this.add.circle(pointer.x, pointer.y, 8, 0x74b9ff, 0.7);
    ripple.setScrollFactor(0);
    ripple.setDepth(999);

    // Create secondary ripple for depth
    const ripple2 = this.add.circle(pointer.x, pointer.y, 5, 0xffffff, 0.8);
    ripple2.setScrollFactor(0);
    ripple2.setDepth(1000);

    this.tweens.add({
      targets: ripple,
      scaleX: 5,
      scaleY: 5,
      alpha: 0,
      duration: 400,
      ease: 'Power2',
      onComplete: () => ripple.destroy()
    });

    this.tweens.add({
      targets: ripple2,
      scaleX: 3,
      scaleY: 3,
      alpha: 0,
      duration: 250,
      ease: 'Power2',
      onComplete: () => ripple2.destroy()
    });

    // Add movement trail effect
    this.createMovementTrail(worldX, worldY);

    // Check for interactions with farm objects
    this.handleTouchInteraction(worldX, worldY);
  }

  // Create movement trail effect
  private createMovementTrail(targetX: number, targetY: number) {
    const distance = Phaser.Math.Distance.Between(this.cat.x, this.cat.y, targetX, targetY);
    
    if (distance > 50) {
      // Create dotted line trail
      const steps = Math.min(Math.floor(distance / 30), 8);
      
      for (let i = 1; i <= steps; i++) {
        const progress = i / steps;
        const trailX = this.cat.x + (targetX - this.cat.x) * progress;
        const trailY = this.cat.y + (targetY - this.cat.y) * progress;
        
        const dot = this.add.circle(trailX, trailY, 3, 0x74b9ff, 0.5);
        dot.setDepth(5);
        
        this.tweens.add({
          targets: dot,
          alpha: 0,
          scaleX: 0,
          scaleY: 0,
          duration: 1000 + (i * 100),
          ease: 'Power2',
          onComplete: () => dot.destroy()
        });
      }
    }
  }

  private setupHapticFeedback() {
    // Enhanced haptic feedback setup for supported devices
    if ('vibrate' in navigator) {
      this.hapticEnabled = true;
      console.log('Haptic feedback enabled');
    }
  }

  private triggerHapticFeedback(pattern: number | number[] = 50) {
    if (this.hapticEnabled && 'vibrate' in navigator) {
      navigator.vibrate(pattern);
    }
  }

  // Enhanced haptic patterns for different actions
  private triggerActionHaptic(action: string) {
    if (!this.hapticEnabled) return;
    
    const patterns = {
      'interact': [30],
      'move': [10],
      'button_press': [25],
      'success': [50, 50, 50],
      'error': [100, 50, 100],
      'level_up': [200, 100, 200, 100, 200]
    };
    
    const pattern = patterns[action as keyof typeof patterns] || [50];
         navigator.vibrate(pattern);
   }

   // Particle effect management for better performance
   private createManagedParticles(x: number, y: number, config: any) {
     // Limit active particles for performance
     if (this.particlePool.length > 5) {
       const oldParticles = this.particlePool.shift();
       if (oldParticles) {
         oldParticles.destroy();
       }
     }

     const particles = this.add.particles(x, y, 'grass', config);
     this.particlePool.push(particles);

     // Auto-cleanup after lifespan
     this.time.delayedCall(config.lifespan || 1000, () => {
       const index = this.particlePool.indexOf(particles);
       if (index > -1) {
         this.particlePool.splice(index, 1);
         particles.destroy();
       }
     });

     return particles;
   }

   // Enhanced ambient effects for atmosphere
   private createAmbientEffects() {
     // Floating sparkles
     this.time.addEvent({
       delay: 3000,
       callback: () => {
         if (Math.random() < 0.3) {
           const x = this.cat.x + (Math.random() - 0.5) * 200;
           const y = this.cat.y + (Math.random() - 0.5) * 200;
           
           this.createManagedParticles(x, y, {
             scale: { start: 0.2, end: 0 },
             alpha: { start: 0.8, end: 0 },
             tint: [0xffd700, 0xffffff, 0x74b9ff],
             lifespan: 2000,
             quantity: 1,
             speed: { min: 20, max: 40 },
             gravityY: -20
           });
         }
       },
       loop: true
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
    
    // Switch to simple touch controls to reduce complexity
    if (!this.useSimpleTouch) {
      this.switchToSimpleTouch();
    }
    
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
  private updateButtonPosition(buttonObj: any, newX: number, newY: number, size: number) {
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
    if (interactionFound) {
      this.triggerHapticFeedback([50, 50, 100]);
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
      plot: plot,
      plotData: plot.plotData,
      crop: plot.crop
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

    // Animate indicator with cooking steam effect
    this.tweens.add({
      targets: indicator,
      y: indicator.y - 30,
      scaleX: 1.2,
      scaleY: 1.2,
      alpha: 0,
      duration: 1200,
      ease: 'Power2',
      onComplete: () => indicator.destroy()
    });

    // Add steam particles
    const steam = this.add.particles(station.x, station.y - 20, 'sparkle', {
      scale: { start: 0.1, end: 0.3 },
      alpha: { start: 0.8, end: 0 },
      speed: { min: 20, max: 40 },
      lifespan: 1000,
      quantity: 3,
      frequency: 200
    });

    this.time.delayedCall(1500, () => {
      steam.destroy();
    });

    // Emit the actual cooking interaction event
    this.events.emit('cooking-station-interaction', station);
  }

  private showInteractionHint() {
    const hints = [
      '🌱 靠近农田进行种植',
      '💧 给作物浇水让它们成长',
      '🍳 在烹饪台制作美食',
      '🏃‍♀️ 探索农场发现更多秘密'
    ];

    const randomHint = hints[Math.floor(Math.random() * hints.length)];
    this.showNotification(randomHint);

    // Create floating hint near the cat
    const hint = this.add.text(this.cat.x, this.cat.y - 60, '❓', {
      fontSize: '24px',
      color: '#3498db'
    });
    hint.setOrigin(0.5);
    hint.setDepth(1000);

    this.tweens.add({
      targets: hint,
      y: hint.y - 20,
      alpha: 0,
      duration: 1500,
      ease: 'Power2',
      onComplete: () => hint.destroy()
    });
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
      this.handleFarmPlotInteraction(data.plot, data.plotData, data.crop);
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

  private handleFarmPlotInteraction(plot: FarmPlot, plotData: any, crop: any) {
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



  private isInVirtualControlsArea(x: number, y: number): boolean {
    // Check if touch is in virtual joystick area (left side)
    if (this.virtualControls) {
      const joystickDistance = Phaser.Math.Distance.Between(
        x, y, this.virtualControls.joystickCenter.x, this.virtualControls.joystickCenter.y
      );
      if (joystickDistance <= 130) return true; // Increased area for better touch detection
    }

    // Check if touch is in action buttons area (right side) - updated for new positioning
    const rightEdge = this.cameras.main.width;
    const bottomEdge = this.cameras.main.height;
    const padding = 50;
    
    // Main action buttons area - adjusted for new padding
    if (x > rightEdge - padding - 120 && y > bottomEdge - padding - 200) {
      return true;
    }

    // Tool panel area (left side of action buttons) - adjusted for new positioning
    if (x > rightEdge - padding - 250 && x < rightEdge - padding - 120 && y > bottomEdge - padding - 180) {
      return true;
    }

    return false;
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
    
    // Handle player movement
    let moveX = 0;
    let moveY = 0;

    // Keyboard input
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

    // 新的虚拟摇杆输入处理 - 简化且可靠
    if (this.virtualJoystick) {
      const joystickVector = this.virtualJoystick.getVector();
      
      // 摇杆输入会直接在回调中处理玩家移动
      // 这里只需要处理键盘输入与摇杆输入的协调
      if (Math.abs(joystickVector.x) > 0.01 || Math.abs(joystickVector.y) > 0.01) {
        // 摇杆激活时，忽略键盘输入以避免冲突
        moveX = 0;
        moveY = 0;
      }
    }

    // Apply movement with performance optimization
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

    // Handle interaction key
    if (Phaser.Input.Keyboard.JustDown(this.interactKey)) {
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
    
    // Clean up old joystick resources
    this.cleanupExistingJoystick();
    
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

  // Clean up existing joystick to prevent conflicts
  private cleanupExistingJoystick() {
    if (this.virtualControls) {
      // Clear stuck detection timer
      this.clearStuckDetection();
      
      // Stop all movement immediately
      if (this.cat) {
        this.cat.setVelocity(0, 0);
      }
      
      // Destroy visual elements safely
      const elementsToDestroy = [
        this.virtualControls.joystickBase,
        this.virtualControls.joystickInner,
        this.virtualControls.joystickKnob,
        this.virtualControls.knobShadow
      ];
      
      elementsToDestroy.forEach(element => {
        if (element && element.destroy) {
          element.destroy();
        }
      });
      
      // Destroy direction dots array
      if (this.virtualControls.directionDots) {
        this.virtualControls.directionDots.forEach((dot: any) => {
          if (dot && dot.destroy) dot.destroy();
        });
      }
      
      this.virtualControls = null;
    }
  }

  // Clear stuck detection timer
  private clearStuckDetection() {
    if (this.virtualControls && this.virtualControls.stuckDetectionTimer) {
      this.virtualControls.stuckDetectionTimer.destroy();
      this.virtualControls.stuckDetectionTimer = null;
    }
  }

  // Emergency joystick reset with comprehensive cleanup
  private emergencyJoystickReset(trigger: string) {
    if (!this.virtualControls) return;
    
    console.log(`Emergency joystick reset triggered by: ${trigger}`);
    
    // Immediate state cleanup
    this.virtualControls.isDragging = false;
    this.virtualControls.activePointerId = null;
    this.virtualControls.isStuck = false;
    this.virtualControls.joystickVector = { x: 0, y: 0 };
    this.virtualControls.lastInputTime = 0;
    
    // Stop cat movement immediately
    if (this.cat) {
      this.cat.setVelocity(0, 0);
    }
    
    // Clear detection timer
    this.clearStuckDetection();
    
    // Reset knob position with animation
    const centerX = this.virtualControls.joystickCenter.x;
    const centerY = this.virtualControls.joystickCenter.y;
    
    this.tweens.killTweensOf(this.virtualControls.joystickKnob);
    this.tweens.add({
      targets: this.virtualControls.joystickKnob,
      x: centerX,
      y: centerY,
      scaleX: 1,
      scaleY: 1,
      duration: 200,
      ease: 'Back.easeOut',
      onComplete: () => {
        if (this.virtualControls) {
          this.virtualControls.joystickKnob.setFillStyle(0x4a90e2, 0.8);
          this.resetDirectionIndicators();
        }
      }
    });
    
    // Visual feedback
    const centerScreenX = this.cameras.main.width / 2;
    const centerScreenY = this.cameras.main.height / 2;
    
    const resetText = this.add.text(centerScreenX, centerScreenY, '🔄 操控杆已重置', {
      fontSize: '20px',
      color: '#27ae60',
      backgroundColor: 'rgba(0,0,0,0.8)',
      padding: { x: 12, y: 6 }
    });
    resetText.setOrigin(0.5);
    resetText.setScrollFactor(0);
    resetText.setDepth(2000);
    
    this.tweens.add({
      targets: resetText,
      alpha: 0,
      y: centerScreenY - 50,
      duration: 1500,
      ease: 'Power2.easeOut',
      onComplete: () => resetText.destroy()
    });
    
    // Restart detection
    this.startStuckDetection();
    
    // Haptic feedback
    this.triggerActionHaptic('success');
  }

  // Check for double-tap emergency reset
  private checkForEmergencyReset(pointer: Phaser.Input.Pointer): boolean {
    if (!this.emergencyResetEnabled) return false;
    
    const currentTime = this.time.now;
    const timeSinceLastTap = currentTime - this.lastTapTime;
    
    // Double-tap detection (within 400ms for more reliable detection)
    if (timeSinceLastTap < 400 && timeSinceLastTap > 50) {
      // Check if tap is in the center area (not on UI elements)
      const centerX = this.cameras.main.width / 2;
      const centerY = this.cameras.main.height / 2;
      const tapDistance = Phaser.Math.Distance.Between(pointer.x, pointer.y, centerX, centerY);
      
      // Only trigger if tapping in center area and not on virtual controls
      if (tapDistance < 120 && !this.isInVirtualControlsArea(pointer.x, pointer.y)) {
        console.log('Emergency reset triggered by double-tap in center area');
        this.emergencyJoystickReset('双击屏幕中央');
        
        // Temporarily disable to prevent spam
        this.emergencyResetEnabled = false;
        this.time.delayedCall(2000, () => {
          this.emergencyResetEnabled = true;
        });
        
        this.lastTapTime = 0;
        return true;
      }
    }
    
    this.lastTapTime = currentTime;
    return false;
  }
}
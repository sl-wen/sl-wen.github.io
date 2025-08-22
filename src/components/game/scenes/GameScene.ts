import * as Phaser from 'phaser';
import { Cat } from '../entities/Player';
import { FarmPlot } from '../entities/FarmPlot';
import { CookingStation } from '../entities/CookingStation';
import { InventoryManager } from '../entities/InventoryManager';
import { CropType, ToolType } from '../types/GameTypes';

export class GameScene extends Phaser.Scene {
  private cat!: Cat;
  private farmPlots!: Phaser.GameObjects.Group;
  private cookingStations!: Phaser.GameObjects.Group;
  private decorations!: Phaser.GameObjects.Group;
  private inventoryManager!: InventoryManager;
  private tilemap!: Phaser.Tilemaps.Tilemap;
  private groundLayer!: Phaser.Tilemaps.TilemapLayer;
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private wasdKeys!: any;
  private interactKey!: Phaser.Input.Keyboard.Key;
  private inventoryKey!: Phaser.Input.Keyboard.Key;
  private cookingKey!: Phaser.Input.Keyboard.Key;
  private virtualControls!: any;
  private touchStartPos: { x: number; y: number } | null = null;
  private currentTool: ToolType | null = null;
  private actionButtons: any;
  private toolTooltip: Phaser.GameObjects.Text | null = null;
  private hapticEnabled: boolean = false;

  constructor() {
    super({ key: 'GameScene' });
  }

  create() {
    // Create farm tilemap
    this.createFarmTilemap();

    // Initialize inventory system
    this.inventoryManager = new InventoryManager();
    this.inventoryManager.addTestItems(); // Add some test items

    // Create cat player
    this.cat = new Cat(this, 200, 200);

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
    
    // Setup mobile controls
    this.setupMobileControls();

    // Setup camera
    this.setupCamera();

    // Setup collisions
    this.setupCollisions();

    // Setup event listeners
    this.setupEventListeners();

    // Add atmospheric effects
    this.createAtmosphere();
  }

  private createFarmTilemap() {
    const mapData = this.registry.get('mapData');

    // Create tilemap from data
    this.tilemap = this.make.tilemap({
      data: mapData,
      tileWidth: 32,
      tileHeight: 32
    });

    // Add farm tilesets
    const grassTileset = this.tilemap.addTilesetImage('farm_grass');
    const dirtTileset = this.tilemap.addTilesetImage('farm_dirt');
    const pathTileset = this.tilemap.addTilesetImage('farm_stone_path');
    const waterTileset = this.tilemap.addTilesetImage('farm_water');
    const fenceTileset = this.tilemap.addTilesetImage('farm_fence');

    // Create layers
    this.groundLayer = this.tilemap.createLayer(0, [grassTileset!, dirtTileset!, pathTileset!, waterTileset!, fenceTileset!])!;

    // Set collision properties
    this.groundLayer.setCollisionByExclusion([0, 1, 2]); // Grass, dirt, and paths are walkable
    this.groundLayer.setCollisionBetween(3, 4); // Water and fence are obstacles
  }

  private createFarmPlots() {
    // Create farm plots in designated areas (where tile type is 5 in the map)
    const mapData = this.registry.get('mapData');
    
    for (let y = 0; y < mapData.length; y++) {
      for (let x = 0; x < mapData[y].length; x++) {
        if (mapData[y][x] === 5) { // Farm plot area
          const worldX = x * 32 + 16;
          const worldY = y * 32 + 32;
          
          const plot = new FarmPlot(this, worldX, worldY);
          this.farmPlots.add(plot);
        }
      }
    }
  }

  private createCookingStations() {
    // Add cooking stations around the farm
    const cookingStation1 = new CookingStation(this, 150, 300);
    this.cookingStations.add(cookingStation1);

    const cookingStation2 = new CookingStation(this, 650, 400);
    this.cookingStations.add(cookingStation2);
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
    // Create enhanced virtual joystick for mobile
    this.createEnhancedVirtualJoystick();
    
    // Create improved action buttons with better layout
    this.createEnhancedActionButtons();

    // Enhanced touch input for interactions with better feedback
    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      if (this.isInVirtualControlsArea(pointer.x, pointer.y)) {
        return;
      }

      const worldPoint = this.cameras.main.getWorldPoint(pointer.x, pointer.y);
      
      // Enhanced touch interaction with visual feedback
      this.handleEnhancedTouchInteraction(worldPoint.x, worldPoint.y, pointer);
    });

    // Add haptic feedback for supported devices
    this.setupHapticFeedback();
  }

  private createEnhancedVirtualJoystick() {
    const padding = 60; // Increased padding for better visibility
    const joystickRadius = 70;
    const knobRadius = 28;
    
    // Ensure joystick is fully visible with safe area consideration
    const joystickX = Math.max(padding + joystickRadius, joystickRadius + 20);
    const joystickY = Math.min(this.cameras.main.height - padding - joystickRadius, this.cameras.main.height - joystickRadius - 20);

    // Enhanced joystick base with gradient and glow effect
    const joystickBase = this.add.circle(joystickX, joystickY, joystickRadius, 0x1a1a1a, 0.4);
    joystickBase.setScrollFactor(0);
    joystickBase.setDepth(1000);
    joystickBase.setStrokeStyle(4, 0x4a90e2, 0.8);

    // Add inner circle for better visual depth
    const joystickInner = this.add.circle(joystickX, joystickY, joystickRadius - 10, 0x2c3e50, 0.3);
    joystickInner.setScrollFactor(0);
    joystickInner.setDepth(1001);

    // Enhanced knob with better visual feedback
    const joystickKnob = this.add.circle(joystickX, joystickY, knobRadius, 0x4a90e2, 0.9);
    joystickKnob.setScrollFactor(0);
    joystickKnob.setDepth(1002);
    joystickKnob.setStrokeStyle(3, 0x74b9ff, 1);

    // Add direction indicator dots
    const dotPositions = [
      { x: 0, y: -joystickRadius + 15 }, // Top
      { x: joystickRadius - 15, y: 0 }, // Right
      { x: 0, y: joystickRadius - 15 }, // Bottom
      { x: -joystickRadius + 15, y: 0 } // Left
    ];

    const directionDots = dotPositions.map(pos => {
      const dot = this.add.circle(joystickX + pos.x, joystickY + pos.y, 3, 0x74b9ff, 0.6);
      dot.setScrollFactor(0);
      dot.setDepth(1001);
      return dot;
    });

    this.virtualControls = {
      joystickBase,
      joystickInner,
      joystickKnob,
      directionDots,
      joystickCenter: { x: joystickX, y: joystickY },
      isDragging: false,
      joystickVector: { x: 0, y: 0 },
      deadZone: 0.2, // Add dead zone for better control
      maxDistance: joystickRadius - knobRadius - 5,
      lastInputTime: 0 // Track last input time to prevent stuck movement
    };

    // Enhanced joystick input handling
    joystickBase.setInteractive();
    joystickKnob.setInteractive();

    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      const distance = Phaser.Math.Distance.Between(
        pointer.x, pointer.y, joystickX, joystickY
      );
      
      if (distance <= joystickRadius + 30) {
        this.virtualControls.isDragging = true;
        this.virtualControls.lastInputTime = this.time.now; // Update input time
        joystickKnob.setFillStyle(0x74b9ff, 1);
        joystickKnob.setScale(1.1);
        
        // Add glow effect
        const glowTween = this.tweens.add({
          targets: joystickKnob,
          scaleX: 1.15,
          scaleY: 1.15,
          duration: 100,
          yoyo: true,
          repeat: 0
        });
      }
    });

    this.input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
      if (!this.virtualControls.isDragging) return;

      this.virtualControls.lastInputTime = this.time.now; // Update input time
      
      const centerX = this.virtualControls.joystickCenter.x;
      const centerY = this.virtualControls.joystickCenter.y;
      
      let deltaX = pointer.x - centerX;
      let deltaY = pointer.y - centerY;
      
      const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
      const maxDistance = this.virtualControls.maxDistance;
      
      if (distance > maxDistance) {
        deltaX = (deltaX / distance) * maxDistance;
        deltaY = (deltaY / distance) * maxDistance;
      }
      
      joystickKnob.x = centerX + deltaX;
      joystickKnob.y = centerY + deltaY;
      
      // Calculate normalized vector with dead zone
      const normalizedDistance = Math.min(distance / maxDistance, 1);
      if (normalizedDistance > this.virtualControls.deadZone) {
        this.virtualControls.joystickVector.x = (deltaX / maxDistance) * normalizedDistance;
        this.virtualControls.joystickVector.y = (deltaY / maxDistance) * normalizedDistance;
      } else {
        this.virtualControls.joystickVector.x = 0;
        this.virtualControls.joystickVector.y = 0;
      }

      // Update direction dots opacity based on direction
      this.updateDirectionIndicators(deltaX, deltaY);
    });

    const resetJoystick = () => {
      if (this.virtualControls.isDragging) {
        this.virtualControls.isDragging = false;
        
        // Immediately reset vector to prevent stuck movement
        this.virtualControls.joystickVector = { x: 0, y: 0 };
        this.virtualControls.lastInputTime = 0;
        
        // Stop any existing tweens to prevent conflicts
        this.tweens.killTweensOf(joystickKnob);
        
        // Smooth return animation
        this.tweens.add({
          targets: joystickKnob,
          x: joystickX,
          y: joystickY,
          scaleX: 1,
          scaleY: 1,
          duration: 200,
          ease: 'Back.easeOut'
        });
        
        joystickKnob.setFillStyle(0x4a90e2, 0.9);
        
        // Reset direction dots
        directionDots.forEach(dot => dot.setAlpha(0.6));
      }
    };

    this.input.on('pointerup', resetJoystick);
    this.input.on('pointerupoutside', resetJoystick); // Handle when pointer leaves game area
  }

  private updateDirectionIndicators(deltaX: number, deltaY: number) {
    if (!this.virtualControls.directionDots) return;
    
    const angle = Math.atan2(deltaY, deltaX);
    const directions = [
      { angle: -Math.PI / 2, index: 0 }, // Top
      { angle: 0, index: 1 }, // Right
      { angle: Math.PI / 2, index: 2 }, // Bottom
      { angle: Math.PI, index: 3 } // Left
    ];

    directions.forEach(dir => {
      const angleDiff = Math.abs(Phaser.Math.Angle.ShortestBetween(angle, dir.angle));
      const alpha = Math.max(0.3, 1 - (angleDiff / (Math.PI / 4)));
      this.virtualControls.directionDots[dir.index].setAlpha(alpha);
    });
  }

  private createEnhancedActionButtons() {
    const buttonSize = 60;
    const smallButtonSize = 45;
    const padding = 50; // Increased padding to ensure buttons are in safe area
    const rightEdge = this.cameras.main.width - padding;
    const bottomEdge = this.cameras.main.height - padding;

    // Create action buttons container for better organization
    this.actionButtons = {
      interact: null,
      inventory: null,
      cooking: null,
      tools: []
    };

    // Main interact button with enhanced visual design - positioned safely in bottom right
    const interactButtonX = Math.min(rightEdge - buttonSize/2, this.cameras.main.width - buttonSize/2 - 10);
    const interactButtonY = Math.min(bottomEdge - buttonSize/2, this.cameras.main.height - buttonSize/2 - 10);
    
    const interactButton = this.add.circle(interactButtonX, interactButtonY, buttonSize/2, 0x27ae60, 0.9);
    interactButton.setScrollFactor(0);
    interactButton.setDepth(1000);
    interactButton.setInteractive();
    interactButton.setStrokeStyle(3, 0x2ecc71, 1);

    // Add pulse animation to interact button
    this.tweens.add({
      targets: interactButton,
      scaleX: 1.05,
      scaleY: 1.05,
      duration: 1000,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });

    const interactText = this.add.text(interactButtonX, interactButtonY, '🐾', {
      fontSize: '28px',
      color: '#ffffff'
    });
    interactText.setOrigin(0.5);
    interactText.setScrollFactor(0);
    interactText.setDepth(1001);

    interactButton.on('pointerdown', () => {
      this.handleInteractionWithFeedback();
      this.addButtonPressEffect(interactButton);
    });

    this.actionButtons.interact = { button: interactButton, text: interactText };

    // Secondary action buttons (Inventory and Cooking)
    const secondaryButtons = [
      { key: 'inventory', icon: '🎒', color: 0x8e44ad, action: () => this.toggleInventory() },
      { key: 'cooking', icon: '🍳', color: 0xe67e22, action: () => this.openCookingInterface() }
    ];

    secondaryButtons.forEach((btnData, index) => {
      const buttonX = Math.min(rightEdge - smallButtonSize/2, this.cameras.main.width - smallButtonSize/2 - 10);
      const buttonY = Math.min(bottomEdge - buttonSize - 20 - (index * (smallButtonSize + 15)), 
                               this.cameras.main.height - buttonSize - 20 - (index * (smallButtonSize + 15)) - 10);

      const button = this.add.circle(buttonX, buttonY, smallButtonSize/2, btnData.color, 0.9);
      button.setScrollFactor(0);
      button.setDepth(1000);
      button.setInteractive();
      button.setStrokeStyle(2, btnData.color, 1);

      const text = this.add.text(buttonX, buttonY, btnData.icon, {
        fontSize: '20px',
        color: '#ffffff'
      });
      text.setOrigin(0.5);
      text.setScrollFactor(0);
      text.setDepth(1001);

      button.on('pointerdown', () => {
        btnData.action();
        this.addButtonPressEffect(button);
      });

      this.actionButtons[btnData.key] = { button, text };
    });

    // Tool selection buttons with improved layout
    const tools = [
      { tool: ToolType.HOE, icon: '🔨', color: 0x8B4513, name: '锄头' },
      { tool: ToolType.WATERING_CAN, icon: '💧', color: 0x2196F3, name: '水壶' },
      { tool: ToolType.FERTILIZER, icon: '🌱', color: 0x4CAF50, name: '肥料' },
      { tool: ToolType.SEEDS, icon: '🌰', color: 0xFF9800, name: '种子' }
    ];

    // Create tool selector panel - positioned safely away from edges
    const toolPanelWidth = 60;
    const toolPanelHeight = tools.length * (smallButtonSize + 10) + 20;
    const toolPanelX = Math.min(rightEdge - buttonSize - toolPanelWidth - 20, 
                                this.cameras.main.width - buttonSize - toolPanelWidth - 30);
    const toolPanelY = Math.min(bottomEdge - toolPanelHeight/2, 
                                this.cameras.main.height - toolPanelHeight/2 - 20);

    // Tool panel background
    const toolPanel = this.add.graphics();
    toolPanel.fillStyle(0x2c3e50, 0.8);
    toolPanel.fillRoundedRect(toolPanelX - toolPanelWidth/2, toolPanelY - toolPanelHeight/2, toolPanelWidth, toolPanelHeight, 10);
    toolPanel.lineStyle(2, 0x34495e, 1);
    toolPanel.strokeRoundedRect(toolPanelX - toolPanelWidth/2, toolPanelY - toolPanelHeight/2, toolPanelWidth, toolPanelHeight, 10);
    toolPanel.setScrollFactor(0);
    toolPanel.setDepth(999);

    tools.forEach((toolData, index) => {
      const buttonX = toolPanelX;
      const buttonY = toolPanelY - toolPanelHeight/2 + 30 + (index * (smallButtonSize + 10));

      const button = this.add.circle(buttonX, buttonY, (smallButtonSize-10)/2, toolData.color, 0.9);
      button.setScrollFactor(0);
      button.setDepth(1000);
      button.setInteractive();
      button.setStrokeStyle(2, toolData.color, 1);

      const text = this.add.text(buttonX, buttonY, toolData.icon, {
        fontSize: '16px',
        color: '#ffffff'
      });
      text.setOrigin(0.5);
      text.setScrollFactor(0);
      text.setDepth(1001);

      // Tool selection feedback
      button.on('pointerdown', () => {
        this.selectToolWithFeedback(toolData.tool, toolData.name);
        this.addButtonPressEffect(button);
        this.highlightSelectedTool(button, index);
      });

      // Add hover effects
      button.on('pointerover', () => {
        button.setScale(1.1);
        this.showToolTooltip(toolData.name, buttonX, buttonY);
      });

      button.on('pointerout', () => {
        button.setScale(1);
        this.hideToolTooltip();
      });

      this.actionButtons.tools.push({ button, text, tool: toolData.tool });
    });
  }

  private addButtonPressEffect(button: Phaser.GameObjects.GameObject) {
    if (button instanceof Phaser.GameObjects.Shape) {
      // Scale down and back up for press effect
      this.tweens.add({
        targets: button,
        scaleX: 0.9,
        scaleY: 0.9,
        duration: 100,
        yoyo: true,
        ease: 'Power2'
      });

      // Add color flash effect
      const originalColor = button.fillColor;
      button.setFillStyle(0xffffff, 0.8);
      this.time.delayedCall(100, () => {
        button.setFillStyle(originalColor, 0.9);
      });
    }
  }

  private handleInteractionWithFeedback() {
    // Add visual feedback for interaction
    const feedback = this.add.text(this.cat.x, this.cat.y - 40, '✨', {
      fontSize: '24px',
      color: '#f1c40f'
    });
    feedback.setOrigin(0.5);
    feedback.setDepth(1000);

    // Animate feedback
    this.tweens.add({
      targets: feedback,
      y: feedback.y - 30,
      alpha: 0,
      duration: 800,
      ease: 'Power2',
      onComplete: () => feedback.destroy()
    });

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
    this.actionButtons.tools.forEach((toolBtn, index) => {
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
    // Create touch ripple effect
    const ripple = this.add.circle(pointer.x, pointer.y, 5, 0x74b9ff, 0.6);
    ripple.setScrollFactor(0);
    ripple.setDepth(999);

    this.tweens.add({
      targets: ripple,
      scaleX: 4,
      scaleY: 4,
      alpha: 0,
      duration: 300,
      ease: 'Power2',
      onComplete: () => ripple.destroy()
    });

    // Check for interactions with farm objects
    this.handleTouchInteraction(worldX, worldY);
  }

  private setupHapticFeedback() {
    // Setup haptic feedback for supported devices
    if ('vibrate' in navigator) {
      this.hapticEnabled = true;
    }
  }

  private triggerHapticFeedback(pattern: number | number[] = 50) {
    if (this.hapticEnabled && 'vibrate' in navigator) {
      navigator.vibrate(pattern);
    }
  }

  private updateResponsiveUI() {
    // Update UI elements based on screen size changes
    const currentWidth = this.cameras.main.width;
    const currentHeight = this.cameras.main.height;

    // Update virtual controls position if screen size changed
    if (this.virtualControls) {
      const padding = 60; // Increased padding for better visibility
      const joystickRadius = 70;
      // Ensure joystick is fully visible with safe area consideration
      const newJoystickX = Math.max(padding + joystickRadius, joystickRadius + 20);
      const newJoystickY = Math.min(currentHeight - padding - joystickRadius, currentHeight - joystickRadius - 20);

      // Update joystick position smoothly
      if (this.virtualControls.joystickCenter.x !== newJoystickX || 
          this.virtualControls.joystickCenter.y !== newJoystickY) {
        
        this.virtualControls.joystickCenter.x = newJoystickX;
        this.virtualControls.joystickCenter.y = newJoystickY;
        
        // Update all joystick elements
        this.virtualControls.joystickBase.x = newJoystickX;
        this.virtualControls.joystickBase.y = newJoystickY;
        this.virtualControls.joystickInner.x = newJoystickX;
        this.virtualControls.joystickInner.y = newJoystickY;
        
        if (!this.virtualControls.isDragging) {
          this.virtualControls.joystickKnob.x = newJoystickX;
          this.virtualControls.joystickKnob.y = newJoystickY;
        }

        // Update direction dots
        const dotPositions = [
          { x: 0, y: -joystickRadius + 15 },
          { x: joystickRadius - 15, y: 0 },
          { x: 0, y: joystickRadius - 15 },
          { x: -joystickRadius + 15, y: 0 }
        ];

        this.virtualControls.directionDots.forEach((dot: any, index: number) => {
          dot.x = newJoystickX + dotPositions[index].x;
          dot.y = newJoystickY + dotPositions[index].y;
        });
      }
    }

    // Update action buttons position
    if (this.actionButtons) {
      const padding = 50; // Increased padding to ensure buttons are in safe area
      const rightEdge = currentWidth - padding;
      const bottomEdge = currentHeight - padding;
      const buttonSize = 60;
      const smallButtonSize = 45;

      // Update main interact button
      if (this.actionButtons.interact) {
        const interactButtonX = Math.min(rightEdge - buttonSize/2, currentWidth - buttonSize/2 - 10);
        const interactButtonY = Math.min(bottomEdge - buttonSize/2, currentHeight - buttonSize/2 - 10);
        
        this.actionButtons.interact.button.x = interactButtonX;
        this.actionButtons.interact.button.y = interactButtonY;
        this.actionButtons.interact.text.x = interactButtonX;
        this.actionButtons.interact.text.y = interactButtonY;
      }

      // Update secondary buttons
      ['inventory', 'cooking'].forEach((key, index) => {
        if (this.actionButtons[key]) {
          const buttonX = Math.min(rightEdge - smallButtonSize/2, currentWidth - smallButtonSize/2 - 10);
          const buttonY = Math.min(bottomEdge - buttonSize - 20 - (index * (smallButtonSize + 15)), 
                                   currentHeight - buttonSize - 20 - (index * (smallButtonSize + 15)) - 10);
          
          this.actionButtons[key].button.x = buttonX;
          this.actionButtons[key].button.y = buttonY;
          this.actionButtons[key].text.x = buttonX;
          this.actionButtons[key].text.y = buttonY;
        }
      });
    }
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
    this.cameras.main.startFollow(this.cat);
    this.cameras.main.setZoom(1.5);
    this.cameras.main.setBounds(0, 0, this.tilemap.widthInPixels, this.tilemap.heightInPixels);
  }

  private setupCollisions() {
    // Collision between cat and tilemap
    this.physics.add.collider(this.cat, this.groundLayer);

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
      x: { min: 0, max: this.tilemap.widthInPixels },
      y: { min: 0, max: this.tilemap.heightInPixels },
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

  private handleInteraction() {
    // General interaction handler
    const nearbyPlots = this.farmPlots.children.entries.filter((plot: any) => {
      const distance = Phaser.Math.Distance.Between(
        this.cat.x, this.cat.y, plot.x, plot.y
      );
      return distance < 50;
    });

    if (nearbyPlots.length > 0) {
      const plot = nearbyPlots[0] as FarmPlot;
      plot.emit('pointerdown');
    }

    const nearbyCookingStations = this.cookingStations.children.entries.filter((station: any) => {
      const distance = Phaser.Math.Distance.Between(
        this.cat.x, this.cat.y, station.x, station.y
      );
      return distance < 50;
    });

    if (nearbyCookingStations.length > 0) {
      const station = nearbyCookingStations[0] as CookingStation;
      station.emit('pointerdown');
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

  private movePlayerTowards(x: number, y: number) {
    const angle = Phaser.Math.Angle.Between(this.cat.x, this.cat.y, x, y);
    const moveX = Math.cos(angle);
    const moveY = Math.sin(angle);
    
    this.cat.move(moveX, moveY);
    
    // Stop when close enough
    this.time.delayedCall(1000, () => {
      this.cat.stop();
    });
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

    // Enhanced virtual joystick input with smooth movement
    if (this.virtualControls && this.virtualControls.joystickVector) {
      // Check for stuck movement - reset if no input for too long
      const timeSinceLastInput = this.time.now - this.virtualControls.lastInputTime;
      if (timeSinceLastInput > 100 && !this.virtualControls.isDragging) {
        this.virtualControls.joystickVector.x = 0;
        this.virtualControls.joystickVector.y = 0;
      }
      
      const joystickStrength = Math.sqrt(
        this.virtualControls.joystickVector.x ** 2 + this.virtualControls.joystickVector.y ** 2
      );
      
      if (joystickStrength > this.virtualControls.deadZone) {
        // Use smooth movement based on joystick distance
        moveX = this.virtualControls.joystickVector.x;
        moveY = this.virtualControls.joystickVector.y;
        
        // Add subtle haptic feedback during movement
        if (this.hapticEnabled && joystickStrength > 0.8) {
          if (Math.random() < 0.05) { // Occasional feedback to avoid spam
            this.triggerHapticFeedback(10);
          }
        }
      } else {
        // Ensure movement is completely stopped when in dead zone
        this.virtualControls.joystickVector.x = 0;
        this.virtualControls.joystickVector.y = 0;
      }
    }

    // Apply movement
    if (moveX !== 0 || moveY !== 0) {
      this.cat.move(moveX, moveY);
    } else {
      this.cat.stop();
    }

    // Update cat
    this.cat.update();

    // Update farm plots
    this.farmPlots.children.entries.forEach((plot: any) => {
      if (plot.update) {
        plot.update();
      }
    });

    // Update cooking stations
    this.cookingStations.children.entries.forEach((station: any) => {
      if (station.update) {
        station.update();
      }
    });

    // Handle interaction key
    if (Phaser.Input.Keyboard.JustDown(this.interactKey)) {
      this.handleInteraction();
    }

    // Update responsive UI elements
    this.updateResponsiveUI();
  }
}
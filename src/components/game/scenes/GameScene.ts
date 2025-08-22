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
    // Create virtual joystick for mobile
    this.createVirtualJoystick();
    
    // Create action buttons
    this.createActionButtons();

    // Touch input for interactions
    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      if (this.isInVirtualControlsArea(pointer.x, pointer.y)) {
        return;
      }

      const worldPoint = this.cameras.main.getWorldPoint(pointer.x, pointer.y);
      
      // Check for interactions with farm objects
      this.handleTouchInteraction(worldPoint.x, worldPoint.y);
    });
  }

  private createVirtualJoystick() {
    const padding = 60;
    const joystickRadius = 60;
    const knobRadius = 25;
    
    const joystickX = padding + joystickRadius;
    const joystickY = this.cameras.main.height - padding - joystickRadius;

    const joystickBase = this.add.circle(joystickX, joystickY, joystickRadius, 0x000000, 0.3);
    joystickBase.setScrollFactor(0);
    joystickBase.setDepth(1000);
    joystickBase.setStrokeStyle(3, 0x4a5568, 0.8);

    const joystickKnob = this.add.circle(joystickX, joystickY, knobRadius, 0x4a5568, 0.8);
    joystickKnob.setScrollFactor(0);
    joystickKnob.setDepth(1001);
    joystickKnob.setStrokeStyle(2, 0x718096, 1);

    this.virtualControls = {
      joystickBase,
      joystickKnob,
      joystickCenter: { x: joystickX, y: joystickY },
      isDragging: false,
      joystickVector: { x: 0, y: 0 }
    };

    // Joystick input handling
    joystickBase.setInteractive();
    joystickKnob.setInteractive();

    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      const distance = Phaser.Math.Distance.Between(
        pointer.x, pointer.y, joystickX, joystickY
      );
      
      if (distance <= joystickRadius + 20) {
        this.virtualControls.isDragging = true;
        joystickKnob.setFillStyle(0x718096, 1);
      }
    });

    this.input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
      if (!this.virtualControls.isDragging) return;

      const centerX = this.virtualControls.joystickCenter.x;
      const centerY = this.virtualControls.joystickCenter.y;
      
      let deltaX = pointer.x - centerX;
      let deltaY = pointer.y - centerY;
      
      const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
      const maxDistance = joystickRadius - knobRadius;
      
      if (distance > maxDistance) {
        deltaX = (deltaX / distance) * maxDistance;
        deltaY = (deltaY / distance) * maxDistance;
      }
      
      joystickKnob.x = centerX + deltaX;
      joystickKnob.y = centerY + deltaY;
      
      // Update movement vector
      this.virtualControls.joystickVector.x = deltaX / maxDistance;
      this.virtualControls.joystickVector.y = deltaY / maxDistance;
    });

    this.input.on('pointerup', () => {
      if (this.virtualControls.isDragging) {
        this.virtualControls.isDragging = false;
        joystickKnob.setFillStyle(0x4a5568, 0.8);
        joystickKnob.x = joystickX;
        joystickKnob.y = joystickY;
        this.virtualControls.joystickVector.x = 0;
        this.virtualControls.joystickVector.y = 0;
      }
    });
  }

  private createActionButtons() {
    const buttonSize = 50;
    const padding = 20;
    const rightEdge = this.cameras.main.width - padding;
    const bottomEdge = this.cameras.main.height - padding;

    // Interact button
    const interactButton = this.add.circle(rightEdge - buttonSize, bottomEdge - buttonSize, buttonSize / 2, 0x4CAF50, 0.8);
    interactButton.setScrollFactor(0);
    interactButton.setDepth(1000);
    interactButton.setInteractive();

    const interactText = this.add.text(rightEdge - buttonSize, bottomEdge - buttonSize, '🐾', {
      fontSize: '24px',
      color: '#ffffff'
    });
    interactText.setOrigin(0.5);
    interactText.setScrollFactor(0);
    interactText.setDepth(1001);

    interactButton.on('pointerdown', () => {
      this.handleInteraction();
    });

    // Tool selection buttons
    const tools = [
      { tool: ToolType.HOE, icon: '🔨', color: 0x8B4513 },
      { tool: ToolType.WATERING_CAN, icon: '💧', color: 0x2196F3 },
      { tool: ToolType.FERTILIZER, icon: '🌱', color: 0x4CAF50 },
      { tool: ToolType.SEEDS, icon: '🌰', color: 0xFF9800 }
    ];

    tools.forEach((toolData, index) => {
      const buttonX = rightEdge - buttonSize;
      const buttonY = bottomEdge - (buttonSize * 2.5) - (index * (buttonSize + 10));

      const button = this.add.circle(buttonX, buttonY, buttonSize / 2, toolData.color, 0.8);
      button.setScrollFactor(0);
      button.setDepth(1000);
      button.setInteractive();

      const text = this.add.text(buttonX, buttonY, toolData.icon, {
        fontSize: '20px',
        color: '#ffffff'
      });
      text.setOrigin(0.5);
      text.setScrollFactor(0);
      text.setDepth(1001);

      button.on('pointerdown', () => {
        this.selectTool(toolData.tool);
      });
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
    const padding = 120;
    const rightEdge = this.cameras.main.width - padding;
    const bottomEdge = this.cameras.main.height - padding;
    
    return (x < padding && y > bottomEdge) || (x > rightEdge && y > bottomEdge);
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

    // Virtual joystick input
    if (this.virtualControls && (Math.abs(this.virtualControls.joystickVector.x) > 0.1 || Math.abs(this.virtualControls.joystickVector.y) > 0.1)) {
      moveX = this.virtualControls.joystickVector.x;
      moveY = this.virtualControls.joystickVector.y;
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
  }
}
import * as Phaser from 'phaser';
import { Chest } from '../entities/Chest';
import { NPC } from '../entities/NPC';
import { Player } from '../entities/Player';

export class GameScene extends Phaser.Scene {
  private player!: Player;
  private npcs!: Phaser.GameObjects.Group;
  private chests!: Phaser.GameObjects.Group;
  private tilemap!: Phaser.Tilemaps.Tilemap;
  private groundLayer!: Phaser.Tilemaps.TilemapLayer;
  private obstacleLayer!: Phaser.Tilemaps.TilemapLayer;
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private wasdKeys!: any;
  private interactKey!: Phaser.Input.Keyboard.Key;
  private investigateKey!: Phaser.Input.Keyboard.Key;
  private virtualControls!: any;
  private touchStartPos: { x: number; y: number } | null = null;

  constructor() {
    super({ key: 'GameScene' });
  }

  create() {
    // Create tilemap
    this.createTilemap();

    // Create player
    this.player = new Player(this, 100, 100);

    // Create NPCs group
    this.npcs = this.add.group();
    this.createNPCs();

    // Create chests group
    this.chests = this.add.group();
    this.createChests();

    // Setup input
    this.setupInput();
    
    // Setup mobile controls
    this.setupMobileControls();

    // Setup camera
    this.setupCamera();

    // Setup collisions
    this.setupCollisions();

    // Add some atmospheric effects
    this.createAtmosphere();
  }

  private createTilemap() {
    const mapData = this.registry.get('mapData');

    // Create tilemap from data
    this.tilemap = this.make.tilemap({
      data: mapData,
      tileWidth: 32,
      tileHeight: 32
    });

    // Add tilesets
    const grassTileset = this.tilemap.addTilesetImage('grass');
    const stoneTileset = this.tilemap.addTilesetImage('stone'); 
    const waterTileset = this.tilemap.addTilesetImage('water');
    const treeTileset = this.tilemap.addTilesetImage('tree');

    // Create layers
    this.groundLayer = this.tilemap.createLayer(0, [grassTileset!, stoneTileset!, waterTileset!, treeTileset!])!;

    // Set tile properties
    this.groundLayer.setCollisionByExclusion([0]); // Everything except grass is collidable
    
    // Set specific collision properties
    this.groundLayer.setCollisionBetween(1, 3); // Stone, water, and trees are collidable

    // Add some decorative trees
    this.addTrees();
  }

  private addTrees() {
    // Add some additional decorative trees as sprites (in addition to tilemap trees)
    const treePositions = [
      { x: 250, y: 200 },
      { x: 450, y: 280 },
      { x: 650, y: 350 },
      { x: 200, y: 500 },
      { x: 700, y: 180 }
    ];

    treePositions.forEach(pos => {
      const tree = this.add.sprite(pos.x, pos.y, 'tree');
      tree.setOrigin(0.5, 1);
      tree.setDepth(5); // Trees should be behind player but above ground
      this.physics.add.existing(tree, true); // Static body
    });
  }

  private createNPCs() {
    // Create some NPCs
    const npcData = [
      { x: 300, y: 200, dialogue: '你好！欢迎来到这个RPG世界！' },
      { x: 500, y: 350, dialogue: '我是一个友好的NPC，很高兴见到你！' },
      { x: 150, y: 300, dialogue: '这里有很多宝藏等待发现呢！' }
    ];

    npcData.forEach(data => {
      const npc = new NPC(this, data.x, data.y, data.dialogue);
      this.npcs.add(npc);
    });
  }

  private createChests() {
    // Create treasure chests with various rewards
    const chestData = [
      { x: 250, y: 400, treasure: '金币 x50' },
      { x: 550, y: 250, treasure: '生命药水' },
      { x: 350, y: 450, treasure: '魔法卷轴' },
      { x: 150, y: 200, treasure: '生命药水' },
      { x: 650, y: 400, treasure: '魔法卷轴' },
      { x: 450, y: 150, treasure: '金币 x100' }
    ];

    chestData.forEach(data => {
      const chest = new Chest(this, data.x, data.y, data.treasure);
      this.chests.add(chest);
    });
  }

  private setupInput() {
    // Setup cursor keys
    this.cursors = this.input.keyboard!.createCursorKeys();

    // Setup WASD keys
    this.wasdKeys = this.input.keyboard!.addKeys('W,S,A,D');

    // Setup interaction keys
    this.interactKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
    this.investigateKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.E);

    // Setup mobile touch controls
    this.setupMobileControls();
  }

  private setupMobileControls() {
    // Initialize virtual controls
    this.virtualControls = {
      up: false,
      down: false,
      left: false,
      right: false,
      interact: false
    };

    // Create virtual D-pad for mobile
    this.createVirtualDPad();

    // Enhanced touch/click to move and interact
    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      // Ignore if touching virtual controls area
      if (this.isInVirtualControlsArea(pointer.x, pointer.y)) {
        return;
      }

      const worldPoint = this.cameras.main.getWorldPoint(pointer.x, pointer.y);
      
      // Check if touching a chest directly
      let chestTouched = false;
      this.chests.children.entries.forEach((chest: any) => {
        const chestDistance = Phaser.Math.Distance.Between(
          worldPoint.x, worldPoint.y, chest.x, chest.y
        );
        
        if (chestDistance < 40 && !chest.isChestOpened()) {
          chest.interact();
          chestTouched = true;
        }
      });

      // Check if touching an NPC directly
      let npcTouched = false;
      this.npcs.children.entries.forEach((npc: any) => {
        const npcDistance = Phaser.Math.Distance.Between(
          worldPoint.x, worldPoint.y, npc.x, npc.y
        );
        
        if (npcDistance < 40) {
          npc.interact();
          npcTouched = true;
        }
      });

      // If no direct interaction, handle movement
      if (!chestTouched && !npcTouched) {
        const distance = Phaser.Math.Distance.Between(
          this.player.x, this.player.y, worldPoint.x, worldPoint.y
        );

        // If clicking close to player, try to interact with nearby objects
        if (distance < 50) {
          this.checkInteractions();
        } else {
          // Move towards clicked position
          this.movePlayerTowards(worldPoint.x, worldPoint.y);
        }
      }
    });

    // Add long press support for mobile interaction
    let longPressTimer: Phaser.Time.TimerEvent | null = null;
    
    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      if (this.isInVirtualControlsArea(pointer.x, pointer.y)) {
        return;
      }

      // Start long press timer
      longPressTimer = this.time.delayedCall(500, () => {
        // Long press detected - show nearby interactables
        this.highlightNearbyInteractables();
      });
    });

    this.input.on('pointerup', () => {
      // Cancel long press timer
      if (longPressTimer) {
        longPressTimer.destroy();
        longPressTimer = null;
      }
    });
  }

  private createVirtualDPad() {
    const padding = 60;
    const buttonSize = 40;
    const dpadSize = 140;
    
    // D-pad background
    const dpadBg = this.add.circle(padding + dpadSize/2, this.cameras.main.height - padding - dpadSize/2, dpadSize/2, 0x000000, 0.2);
    dpadBg.setScrollFactor(0);
    dpadBg.setDepth(1000);

    // Direction buttons
    const directions = [
      { key: 'up', x: 0, y: -buttonSize, angle: 0 },
      { key: 'down', x: 0, y: buttonSize, angle: 180 },
      { key: 'left', x: -buttonSize, y: 0, angle: 270 },
      { key: 'right', x: buttonSize, y: 0, angle: 90 }
    ];

    directions.forEach(dir => {
      const button = this.add.circle(
        dpadBg.x + dir.x,
        dpadBg.y + dir.y,
        buttonSize/2,
        0x4a5568,
        0.7
      );
      button.setScrollFactor(0);
      button.setDepth(1001);
      button.setInteractive();

      // Add arrow indicator
      const arrow = this.add.triangle(
        button.x,
        button.y,
        0, -6, -4, 4, 4, 4,
        0xffffff
      );
      arrow.setScrollFactor(0);
      arrow.setDepth(1002);
      arrow.setRotation(Phaser.Math.DegToRad(dir.angle));

      // Touch events
      button.on('pointerdown', () => {
        this.virtualControls[dir.key] = true;
        button.setFillStyle(0x718096, 1);
      });

      button.on('pointerup', () => {
        this.virtualControls[dir.key] = false;
        button.setFillStyle(0x4a5568, 0.7);
      });

      button.on('pointerout', () => {
        this.virtualControls[dir.key] = false;
        button.setFillStyle(0x4a5568, 0.7);
      });
    });

    // Action button (interact)
    const actionButton = this.add.circle(
      this.cameras.main.width - padding - buttonSize,
      this.cameras.main.height - padding - buttonSize,
      buttonSize,
      0x2563eb,
      0.7
    );
    actionButton.setScrollFactor(0);
    actionButton.setDepth(1001);
    actionButton.setInteractive();

    // Action button text
    const actionText = this.add.text(
      actionButton.x,
      actionButton.y,
      'A',
      {
        fontSize: '20px',
        color: '#ffffff',
        fontStyle: 'bold'
      }
    );
    actionText.setScrollFactor(0);
    actionText.setDepth(1002);
    actionText.setOrigin(0.5);

    actionButton.on('pointerdown', () => {
      this.virtualControls.interact = true;
      actionButton.setFillStyle(0x3b82f6, 1);
      this.checkInteractions();
    });

    actionButton.on('pointerup', () => {
      this.virtualControls.interact = false;
      actionButton.setFillStyle(0x2563eb, 0.7);
    });
  }

  private isInVirtualControlsArea(x: number, y: number): boolean {
    const padding = 60;
    const dpadSize = 140;
    const buttonSize = 40;
    
    // Check D-pad area
    const dpadCenterX = padding + dpadSize/2;
    const dpadCenterY = this.cameras.main.height - padding - dpadSize/2;
    const dpadDistance = Phaser.Math.Distance.Between(x, y, dpadCenterX, dpadCenterY);
    
    // Check action button area
    const actionX = this.cameras.main.width - padding - buttonSize;
    const actionY = this.cameras.main.height - padding - buttonSize;
    const actionDistance = Phaser.Math.Distance.Between(x, y, actionX, actionY);
    
    return dpadDistance < dpadSize/2 + 20 || actionDistance < buttonSize + 20;
  }

  private movePlayerTowards(targetX: number, targetY: number) {
    const angle = Phaser.Math.Angle.Between(this.player.x, this.player.y, targetX, targetY);
    const speed = 160;

    this.player.setVelocity(
      Math.cos(angle) * speed,
      Math.sin(angle) * speed
    );

    // Set direction based on angle
    if (Math.abs(angle) < Math.PI / 4) {
      this.player.setDirection('right');
    } else if (Math.abs(angle) > 3 * Math.PI / 4) {
      this.player.setDirection('left');
    } else if (angle > 0) {
      this.player.setDirection('down');
    } else {
      this.player.setDirection('up');
    }

    // Stop movement after a short time
    this.time.delayedCall(300, () => {
      this.player.setVelocity(0);
    });
  }

  private setupCamera() {
    // Make camera follow player
    this.cameras.main.startFollow(this.player);
    this.cameras.main.setLerp(0.1, 0.1);

    // Set world bounds
    this.cameras.main.setBounds(0, 0, this.tilemap.widthInPixels, this.tilemap.heightInPixels);
  }

  private setupCollisions() {
    // Player collision with tilemap
    this.physics.add.collider(this.player, this.groundLayer);

    // Player collision with trees
    this.physics.world.setBounds(0, 0, this.tilemap.widthInPixels, this.tilemap.heightInPixels);
  }

  private createAtmosphere() {
    // Add some particle effects for atmosphere
    const particles = this.add.particles(0, 0, 'grass', {
      x: { min: 0, max: this.tilemap.widthInPixels },
      y: { min: 0, max: this.tilemap.heightInPixels },
      scale: { start: 0.1, end: 0 },
      alpha: { start: 0.3, end: 0 },
      lifespan: 3000,
      frequency: 2000,
      quantity: 1
    });

    particles.setDepth(-1);
  }

  update() {
    // Update player
    this.player.update();

    // Update chests with player proximity
    this.chests.children.entries.forEach((chest: any) => {
      chest.update();
      chest.checkPlayerProximity(this.player.x, this.player.y);
    });

    // Handle input
    this.handleInput();

    // Check interactions only when keys are pressed
    if (Phaser.Input.Keyboard.JustDown(this.interactKey) ||
        Phaser.Input.Keyboard.JustDown(this.investigateKey)) {
      this.checkInteractions();
    }
  }

  private handleInput() {
    const speed = 160;

    // Reset velocity
    this.player.setVelocity(0);

    let isMoving = false;
    let direction = this.player.getDirection();

    // Handle movement with WASD, arrow keys, or virtual controls
    if (this.cursors.left?.isDown || this.wasdKeys.A.isDown || this.virtualControls.left) {
      this.player.setVelocityX(-speed);
      direction = 'left';
      isMoving = true;
    } else if (this.cursors.right?.isDown || this.wasdKeys.D.isDown || this.virtualControls.right) {
      this.player.setVelocityX(speed);
      direction = 'right';
      isMoving = true;
    }

    if (this.cursors.up?.isDown || this.wasdKeys.W.isDown || this.virtualControls.up) {
      this.player.setVelocityY(-speed);
      direction = 'up';
      isMoving = true;
    } else if (this.cursors.down?.isDown || this.wasdKeys.S.isDown || this.virtualControls.down) {
      this.player.setVelocityY(speed);
      direction = 'down';
      isMoving = true;
    }

    // Update player direction and animation
    this.player.setDirection(direction);
    this.player.setMoving(isMoving);
  }

  private checkInteractions() {
    // Check NPC interactions
    this.npcs.children.entries.forEach((npc: any) => {
      const distance = Phaser.Math.Distance.Between(
        this.player.x, this.player.y, npc.x, npc.y
      );

      if (distance < 50) {
        npc.interact();
      }
    });

    // Check chest interactions
    this.chests.children.entries.forEach((chest: any) => {
      const distance = Phaser.Math.Distance.Between(
        this.player.x, this.player.y, chest.x, chest.y
      );

      if (distance < 60 && !chest.isChestOpened()) {
        chest.interact();
      }
    });
  }

  private highlightNearbyInteractables() {
    // Highlight all chests and NPCs within interaction range
    this.chests.children.entries.forEach((chest: any) => {
      const distance = Phaser.Math.Distance.Between(
        this.player.x, this.player.y, chest.x, chest.y
      );
      
      if (distance < 100 && !chest.isChestOpened()) {
        chest.showRangeIndicator(true);
        chest.showIndicator(true);
        
        // Auto-hide after 3 seconds
        this.time.delayedCall(3000, () => {
          if (distance > 60) {
            chest.showRangeIndicator(false);
            chest.showIndicator(false);
          }
        });
      }
    });

    this.npcs.children.entries.forEach((npc: any) => {
      const distance = Phaser.Math.Distance.Between(
        this.player.x, this.player.y, npc.x, npc.y
      );
      
      if (distance < 100) {
        npc.showIndicator(true);
        
        // Auto-hide after 3 seconds
        this.time.delayedCall(3000, () => {
          if (distance > 50) {
            npc.showIndicator(false);
          }
        });
      }
    });
  }

  // Public method to show dialogue
  public showDialogue(text: string) {
    this.scene.get('UIScene').events.emit('showDialogue', text);
  }

  // Public method to show notification
  public showNotification(text: string) {
    this.scene.get('UIScene').events.emit('showNotification', text);
  }
}
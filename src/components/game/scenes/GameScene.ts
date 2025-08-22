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

    // Create virtual joystick for mobile
    this.createVirtualJoystick();

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

  private createVirtualJoystick() {
    const padding = 60;
    const joystickRadius = 60;
    const knobRadius = 25;
    
    // Joystick position
    const joystickX = padding + joystickRadius;
    const joystickY = this.cameras.main.height - padding - joystickRadius;

    // Joystick base (outer circle)
    const joystickBase = this.add.circle(joystickX, joystickY, joystickRadius, 0x000000, 0.3);
    joystickBase.setScrollFactor(0);
    joystickBase.setDepth(1000);
    joystickBase.setStrokeStyle(3, 0x4a5568, 0.8);

    // Joystick knob (inner circle)
    const joystickKnob = this.add.circle(joystickX, joystickY, knobRadius, 0x4a5568, 0.8);
    joystickKnob.setScrollFactor(0);
    joystickKnob.setDepth(1001);
    joystickKnob.setStrokeStyle(2, 0x718096, 1);

    // Store references
    (this as any).joystickBase = joystickBase;
    (this as any).joystickKnob = joystickKnob;
    (this as any).joystickCenter = { x: joystickX, y: joystickY };
    (this as any).isDragging = false;
    (this as any).joystickVector = { x: 0, y: 0 };

    // Make joystick interactive
    joystickBase.setInteractive();
    joystickKnob.setInteractive();

    // Joystick input handling
    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      const distance = Phaser.Math.Distance.Between(
        pointer.x, pointer.y, joystickX, joystickY
      );
      
      if (distance <= joystickRadius + 20) {
        (this as any).isDragging = true;
        joystickKnob.setFillStyle(0x718096, 1);
      }
    });

    this.input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
      if (!(this as any).isDragging) return;

      const centerX = (this as any).joystickCenter.x;
      const centerY = (this as any).joystickCenter.y;
      
      // Calculate vector from center to pointer
      let deltaX = pointer.x - centerX;
      let deltaY = pointer.y - centerY;
      
      // Limit knob movement to joystick radius
      const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
      const maxDistance = joystickRadius - knobRadius;
      
      if (distance > maxDistance) {
        deltaX = (deltaX / distance) * maxDistance;
        deltaY = (deltaY / distance) * maxDistance;
      }
      
      // Update knob position
      joystickKnob.x = centerX + deltaX;
      joystickKnob.y = centerY + deltaY;
      
      // Calculate normalized vector (-1 to 1)
      const normalizedX = deltaX / maxDistance;
      const normalizedY = deltaY / maxDistance;
      
      (this as any).joystickVector = { x: normalizedX, y: normalizedY };
      
      // Update virtual controls based on joystick position
      const deadZone = 0.2;
      this.virtualControls.left = normalizedX < -deadZone;
      this.virtualControls.right = normalizedX > deadZone;
      this.virtualControls.up = normalizedY < -deadZone;
      this.virtualControls.down = normalizedY > deadZone;
    });

    this.input.on('pointerup', () => {
      if (!(this as any).isDragging) return;
      
      (this as any).isDragging = false;
      
      // Reset knob to center
      const centerX = (this as any).joystickCenter.x;
      const centerY = (this as any).joystickCenter.y;
      
      this.tweens.add({
        targets: joystickKnob,
        x: centerX,
        y: centerY,
        duration: 150,
        ease: 'Back.easeOut'
      });
      
      joystickKnob.setFillStyle(0x4a5568, 0.8);
      
      // Reset virtual controls
      this.virtualControls.left = false;
      this.virtualControls.right = false;
      this.virtualControls.up = false;
      this.virtualControls.down = false;
      
      (this as any).joystickVector = { x: 0, y: 0 };
    });

    // Action button (interact) - keep this separate
    const buttonSize = 40;
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
    actionButton.setStrokeStyle(2, 0x3b82f6, 1);

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
    const joystickRadius = 60;
    const buttonSize = 40;
    
    // Check joystick area
    const joystickCenterX = padding + joystickRadius;
    const joystickCenterY = this.cameras.main.height - padding - joystickRadius;
    const joystickDistance = Phaser.Math.Distance.Between(x, y, joystickCenterX, joystickCenterY);
    
    // Check action button area
    const actionX = this.cameras.main.width - padding - buttonSize;
    const actionY = this.cameras.main.height - padding - buttonSize;
    const actionDistance = Phaser.Math.Distance.Between(x, y, actionX, actionY);
    
    return joystickDistance < joystickRadius + 20 || actionDistance < buttonSize + 20;
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

    // Handle joystick input with analog movement
    if ((this as any).joystickVector) {
      const vector = (this as any).joystickVector;
      const deadZone = 0.1;
      
      if (Math.abs(vector.x) > deadZone || Math.abs(vector.y) > deadZone) {
        // Apply analog movement with joystick vector
        this.player.setVelocityX(vector.x * speed);
        this.player.setVelocityY(vector.y * speed);
        isMoving = true;
        
        // Determine direction based on strongest axis
        if (Math.abs(vector.x) > Math.abs(vector.y)) {
          direction = vector.x > 0 ? 'right' : 'left';
        } else {
          direction = vector.y > 0 ? 'down' : 'up';
        }
      }
    }

    // Handle keyboard input (fallback for desktop)
    if (!isMoving) {
      if (this.cursors.left?.isDown || this.wasdKeys.A.isDown) {
        this.player.setVelocityX(-speed);
        direction = 'left';
        isMoving = true;
      } else if (this.cursors.right?.isDown || this.wasdKeys.D.isDown) {
        this.player.setVelocityX(speed);
        direction = 'right';
        isMoving = true;
      }

      if (this.cursors.up?.isDown || this.wasdKeys.W.isDown) {
        this.player.setVelocityY(-speed);
        direction = 'up';
        isMoving = true;
      } else if (this.cursors.down?.isDown || this.wasdKeys.S.isDown) {
        this.player.setVelocityY(speed);
        direction = 'down';
        isMoving = true;
      }
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
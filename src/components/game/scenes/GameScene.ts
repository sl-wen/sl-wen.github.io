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

    // Create layers
    this.groundLayer = this.tilemap.createLayer(0, [grassTileset!, stoneTileset!, waterTileset!])!;

    // Set tile properties
    this.groundLayer.setCollisionByExclusion([0]); // Everything except grass is collidable

    // Add some decorative trees
    this.addTrees();
  }

  private addTrees() {
    // Add some trees as obstacles
    const treePositions = [
      { x: 200, y: 150 },
      { x: 400, y: 200 },
      { x: 600, y: 300 },
      { x: 150, y: 400 },
      { x: 500, y: 450 }
    ];

    treePositions.forEach(pos => {
      const tree = this.add.sprite(pos.x, pos.y, 'tree');
      tree.setOrigin(0.5, 1);
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
    // Create some treasure chests
    const chestData = [
      { x: 250, y: 400, treasure: '金币 x50' },
      { x: 550, y: 250, treasure: '生命药水' },
      { x: 350, y: 450, treasure: '魔法卷轴' }
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
    // Touch/click to move
    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      const worldPoint = this.cameras.main.getWorldPoint(pointer.x, pointer.y);
      const distance = Phaser.Math.Distance.Between(
        this.player.x, this.player.y, worldPoint.x, worldPoint.y
      );

      // If clicking close to player, interact instead of move
      if (distance < 50) {
        this.checkInteractions();
      } else {
        // Move towards clicked position
        this.movePlayerTowards(worldPoint.x, worldPoint.y);
      }
    });
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

    // Handle input
    this.handleInput();

    // Check interactions
    this.checkInteractions();
  }

  private handleInput() {
    const speed = 160;

    // Reset velocity
    this.player.setVelocity(0);

    // Handle movement with WASD or arrow keys
    if (this.cursors.left?.isDown || this.wasdKeys.A.isDown) {
      this.player.setVelocityX(-speed);
      this.player.setDirection('left');
    } else if (this.cursors.right?.isDown || this.wasdKeys.D.isDown) {
      this.player.setVelocityX(speed);
      this.player.setDirection('right');
    }

    if (this.cursors.up?.isDown || this.wasdKeys.W.isDown) {
      this.player.setVelocityY(-speed);
      this.player.setDirection('up');
    } else if (this.cursors.down?.isDown || this.wasdKeys.S.isDown) {
      this.player.setVelocityY(speed);
      this.player.setDirection('down');
    }
  }

  private checkInteractions() {
    // Check if interact key is pressed
    if (Phaser.Input.Keyboard.JustDown(this.interactKey) ||
      Phaser.Input.Keyboard.JustDown(this.investigateKey)) {

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

        if (distance < 50) {
          chest.interact();
        }
      });
    }
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
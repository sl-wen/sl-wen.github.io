import * as Phaser from 'phaser';

export default class GameScene extends Phaser.Scene {
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private wasd!: any;
  private player!: Phaser.Physics.Arcade.Sprite;
  private map!: Phaser.Tilemaps.Tilemap;
  private groundLayer!: Phaser.Tilemaps.TilemapLayer | null;
  private objectsLayer!: Phaser.Tilemaps.TilemapLayer | null;

  constructor() {
    super({ key: 'GameScene' });
  }

  create(): void {
    // 设置输入控制
    this.setupInput();

    // 创建地图
    this.createMap();

    // 创建玩家
    this.createPlayer();

    // 设置相机
    this.setupCamera();

    // 设置GridEngine
    this.setupGridEngine();
  }

  update(): void {
    if (!this.player) return;

    // 处理玩家移动
    this.handlePlayerMovement();
  }

  private setupInput(): void {
    this.cursors = this.input.keyboard!.createCursorKeys();
    this.wasd = this.input.keyboard!.addKeys({
      up: Phaser.Input.Keyboard.KeyCodes.W,
      down: Phaser.Input.Keyboard.KeyCodes.S,
      left: Phaser.Input.Keyboard.KeyCodes.A,
      right: Phaser.Input.Keyboard.KeyCodes.D,
    });
  }

  private createMap(): void {
    // 创建地图
    this.map = this.make.tilemap({ key: 'map' });
    
    // 添加瓦片集
    const tileset = this.map.addTilesetImage('tileset', 'main_tileset');
    
    if (!tileset) {
      console.error('Failed to load tileset');
      return;
    }

    // 创建图层
    this.groundLayer = this.map.createLayer('Ground', tileset, 0, 0);
    this.objectsLayer = this.map.createLayer('Objects', tileset, 0, 0);

    if (this.groundLayer) {
      this.groundLayer.setCollisionByProperty({ collides: true });
    }
  }

  private createPlayer(): void {
    // 创建玩家精灵
    this.player = this.physics.add.sprite(100, 100, 'player', 'hero_idle_down_01');
    this.player.setCollideWorldBounds(true);

    // 设置玩家动画
    this.setupPlayerAnimations();
  }

  private setupPlayerAnimations(): void {
    // 玩家向下行走动画
    this.anims.create({
      key: 'player_down',
      frames: this.anims.generateFrameNames('player', {
        prefix: 'hero_walking_down_',
        start: 1,
        end: 2,
        zeroPad: 2
      }),
      frameRate: 8,
      repeat: -1
    });

    // 玩家向上行走动画
    this.anims.create({
      key: 'player_up',
      frames: this.anims.generateFrameNames('player', {
        prefix: 'hero_walking_up_',
        start: 1,
        end: 2,
        zeroPad: 2
      }),
      frameRate: 8,
      repeat: -1
    });

    // 玩家向左行走动画
    this.anims.create({
      key: 'player_left',
      frames: this.anims.generateFrameNames('player', {
        prefix: 'hero_walking_left_',
        start: 1,
        end: 2,
        zeroPad: 2
      }),
      frameRate: 8,
      repeat: -1
    });

    // 玩家向右行走动画
    this.anims.create({
      key: 'player_right',
      frames: this.anims.generateFrameNames('player', {
        prefix: 'hero_walking_right_',
        start: 1,
        end: 2,
        zeroPad: 2
      }),
      frameRate: 8,
      repeat: -1
    });

    // 玩家站立动画
    this.anims.create({
      key: 'player_idle',
      frames: [{ key: 'player', frame: 'hero_idle_down_01' }],
      frameRate: 1
    });
  }

  private setupCamera(): void {
    // 设置相机跟随玩家
    this.cameras.main.startFollow(this.player);
    this.cameras.main.setZoom(1);
  }

  private setupGridEngine(): void {
    // 初始化GridEngine
    const gridEngine = this.plugins.get('gridEngine') as any;
    
    gridEngine.create(this.map, {
      characters: [
        {
          id: 'player',
          sprite: this.player,
          walkingAnimationMapping: 6,
          startPosition: { x: 5, y: 5 },
        },
      ],
    });
  }

  private handlePlayerMovement(): void {
    const speed = 160;
    let velocityX = 0;
    let velocityY = 0;

    // 处理键盘输入
    if (this.cursors.left.isDown || this.wasd.left.isDown) {
      velocityX = -speed;
      this.player.anims.play('player_left', true);
    } else if (this.cursors.right.isDown || this.wasd.right.isDown) {
      velocityX = speed;
      this.player.anims.play('player_right', true);
    }

    if (this.cursors.up.isDown || this.wasd.up.isDown) {
      velocityY = -speed;
      if (velocityX === 0) {
        this.player.anims.play('player_up', true);
      }
    } else if (this.cursors.down.isDown || this.wasd.down.isDown) {
      velocityY = speed;
      if (velocityX === 0) {
        this.player.anims.play('player_down', true);
      }
    }

    // 设置玩家速度
    this.player.setVelocity(velocityX, velocityY);

    // 如果没有移动，播放站立动画
    if (velocityX === 0 && velocityY === 0) {
      this.player.anims.play('player_idle', true);
    }
  }
}
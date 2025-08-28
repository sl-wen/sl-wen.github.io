import * as Phaser from 'phaser';
import { Player } from '../entities/Player';
import { NPC } from '../entities/NPC';
import { WorldMap } from '../systems/WorldMap';

export class TopDownGameScene extends Phaser.Scene {
  private player!: Player;
  private npcs: NPC[] = [];
  private worldMap!: WorldMap;
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private wasdKeys!: {
    W: Phaser.Input.Keyboard.Key;
    A: Phaser.Input.Keyboard.Key;
    S: Phaser.Input.Keyboard.Key;
    D: Phaser.Input.Keyboard.Key;
  };

  constructor() {
    super({ key: 'TopDownGameScene' });
  }

  preload(): void {
    // 加载游戏资源
    this.loadAssets();
  }

  create(): void {
    // 创建世界地图
    this.createWorld();
    
    // 创建玩家
    this.createPlayer();
    
    // 创建NPC
    this.createNPCs();
    
    // 设置相机
    this.setupCamera();
    
    // 设置输入控制
    this.setupInput();
    
    // 设置碰撞检测
    this.setupCollisions();
    
    // 设置UI
    this.setupUI();
  }

  update(): void {
    // 更新玩家移动
    this.updatePlayerMovement();
    
    // 更新NPC行为
    this.updateNPCs();
  }

  private loadAssets(): void {
    // 创建占位符资源
    this.createPlaceholderAssets();
  }

  private createPlaceholderAssets(): void {
    // 创建玩家精灵占位符
    const playerGraphics = this.add.graphics();
    playerGraphics.fillStyle(0x00ff00); // 绿色
    playerGraphics.fillRect(0, 0, 32, 32);
    playerGraphics.generateTexture('player', 32, 32);
    playerGraphics.destroy();

    // 创建地图瓦片占位符
    const tilesGraphics = this.add.graphics();
    tilesGraphics.fillStyle(0x8B4513); // 棕色
    tilesGraphics.fillRect(0, 0, 32, 32);
    tilesGraphics.generateTexture('tiles', 32, 32);
    tilesGraphics.destroy();

    // 创建NPC精灵占位符
    const npcGraphics = this.add.graphics();
    npcGraphics.fillStyle(0xff0000); // 红色
    npcGraphics.fillRect(0, 0, 32, 32);
    npcGraphics.generateTexture('npc', 32, 32);
    npcGraphics.destroy();

    // 创建UI面板占位符
    const uiGraphics = this.add.graphics();
    uiGraphics.fillStyle(0x000000, 0.8);
    uiGraphics.fillRect(0, 0, 200, 50);
    uiGraphics.generateTexture('ui-panel', 200, 50);
    uiGraphics.destroy();
  }

  private createWorld(): void {
    // 创建世界地图
    this.worldMap = new WorldMap(this);
    this.worldMap.create();
  }

  private createPlayer(): void {
    // 创建玩家角色
    this.player = new Player(this, 400, 300);
    this.add.existing(this.player);
  }

  private createNPCs(): void {
    // 创建NPC
    const npcPositions = [
      { x: 200, y: 200 },
      { x: 600, y: 400 },
      { x: 300, y: 500 }
    ];

    npcPositions.forEach(pos => {
      const npc = new NPC(this, pos.x, pos.y);
      this.npcs.push(npc);
      this.add.existing(npc);
    });
  }

  private setupCamera(): void {
    // 设置相机跟随玩家
    this.cameras.main.startFollow(this.player, true, 0.1, 0.1);
    
    // 设置相机边界
    this.cameras.main.setBounds(0, 0, 1600, 1200);
  }

  private setupInput(): void {
    // 设置键盘输入
    this.cursors = this.input.keyboard!.createCursorKeys();
    this.wasdKeys = this.input.keyboard!.addKeys('W,A,S,D') as any;
  }

  private setupCollisions(): void {
    // 设置玩家与地图的碰撞
    this.physics.add.collider(this.player, this.worldMap.getCollisionLayer());
    
    // 设置玩家与NPC的碰撞
    this.npcs.forEach(npc => {
      this.physics.add.collider(this.player, npc, this.handlePlayerNPCCollision, undefined, this);
    });
  }

  private setupUI(): void {
    // 创建UI面板
    const uiPanel = this.add.image(100, 50, 'ui-panel');
    uiPanel.setScrollFactor(0);
    uiPanel.setDepth(100);
  }

  private updatePlayerMovement(): void {
    if (!this.player) return;

    // 获取输入
    const left = this.cursors.left.isDown || this.wasdKeys.A.isDown;
    const right = this.cursors.right.isDown || this.wasdKeys.D.isDown;
    const up = this.cursors.up.isDown || this.wasdKeys.W.isDown;
    const down = this.cursors.down.isDown || this.wasdKeys.S.isDown;

    // 更新玩家移动
    this.player.handleMovement(left, right, up, down);
  }

  private updateNPCs(): void {
    // 更新所有NPC的行为
    this.npcs.forEach(npc => {
      npc.update();
    });
  }

  private handlePlayerNPCCollision(player: Player, npc: NPC): void {
    // 处理玩家与NPC的碰撞
    console.log('玩家与NPC碰撞');
    
    // 可以在这里触发对话或其他交互
    if (this.input.keyboard!.justPressed(Phaser.Input.Keyboard.KeyCodes.SPACE)) {
      npc.startDialogue();
    }
  }

  public getPlayer(): Player {
    return this.player;
  }

  public getNPCs(): NPC[] {
    return this.npcs;
  }

  public getWorldMap(): WorldMap {
    return this.worldMap;
  }
}

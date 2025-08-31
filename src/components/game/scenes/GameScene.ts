import Phaser from 'phaser';
import GridEngine from 'grid-engine';
import { GAME_CONSTANTS, DIALOG_CONFIG, GAME_EVENTS } from '../constants/gameConstants';

export default class GameScene extends Phaser.Scene {
  private player!: Phaser.GameObjects.Sprite;
  private npcs: Phaser.GameObjects.Sprite[] = [];
  private items: Phaser.GameObjects.Sprite[] = [];
  private map!: Phaser.Tilemaps.Tilemap;
  private groundLayer!: Phaser.Tilemaps.TilemapLayer;
  private objectsLayer!: Phaser.Tilemaps.TilemapLayer;
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private wasdKeys!: any;
  private spaceKey!: Phaser.Input.Keyboard.Key;
  private escKey!: Phaser.Input.Keyboard.Key;
  private gameState: any = {
    health: 100,
    maxHealth: 100,
    coins: 0,
    hasSword: false,
    canPush: false,
    currentDialog: null,
    isInDialog: false,
    isPaused: false
  };

  constructor() {
    super({ key: 'GameScene' });
  }

  create(): void {
    // 创建地图
    this.createMap();

    // 创建角色
    this.createPlayer();
    this.createNPCs();
    this.createItems();

    // 设置输入控制
    this.setupInput();

    // 设置GridEngine
    this.setupGridEngine();

    // 设置UI
    this.setupUI();

    // 设置事件监听
    this.setupEventListeners();

    // 设置相机
    this.setupCamera();

    // 添加淡入效果
    this.cameras.main.fadeIn(500, 0, 0, 0);
  }

  update(): void {
    if (this.gameState.isPaused || this.gameState.isInDialog) {
      return;
    }

    this.handlePlayerMovement();
    this.handlePlayerInteraction();
  }

  private createMap(): void {
    // 创建地图
    this.map = this.make.tilemap({ key: 'map' });
    
    // 添加瓦片集
    const mainTileset = this.map.addTilesetImage('main_tileset', 'main_tileset');
    const objectsTileset = this.map.addTilesetImage('objects_tileset', 'objects_tileset');

    // 创建图层
    this.groundLayer = this.map.createLayer('ground', mainTileset!);
    this.objectsLayer = this.map.createLayer('objects', objectsTileset!);

    // 设置碰撞
    this.objectsLayer.setCollisionByProperty({ collides: true });
  }

  private createPlayer(): void {
    // 创建玩家精灵
    this.player = this.add.sprite(320, 320, 'player');
    this.player.setOrigin(0.5);
    this.player.play('player_idle');

    // 设置玩家物理属性
    this.physics.add.existing(this.player);
    (this.player.body as Phaser.Physics.Arcade.Body).setCollideWorldBounds(true);
  }

  private createNPCs(): void {
    // 创建NPC位置配置
    const npcConfigs = [
      { key: 'npc_01', x: 400, y: 320, name: 'npc_01' },
      { key: 'npc_02', x: 480, y: 400, name: 'npc_02' },
      { key: 'npc_03', x: 320, y: 480, name: 'npc_03' },
      { key: 'npc_04', x: 560, y: 320, name: 'npc_04' }
    ];

    npcConfigs.forEach(config => {
      const npc = this.add.sprite(config.x, config.y, config.key);
      npc.setOrigin(0.5);
      npc.play(`${config.key}_idle`);
      npc.setData('name', config.name);
      npc.setData('dialog', DIALOG_CONFIG[config.name as keyof typeof DIALOG_CONFIG]);
      
      this.npcs.push(npc);
    });
  }

  private createItems(): void {
    // 创建物品
    const itemConfigs = [
      { key: 'sword', x: 640, y: 320, name: 'sword' },
      { key: 'book', x: 400, y: 480, name: 'book_01' },
      { key: 'sign', x: 480, y: 240, name: 'sign_01' }
    ];

    itemConfigs.forEach(config => {
      const item = this.add.sprite(config.x, config.y, config.key);
      item.setOrigin(0.5);
      item.setData('name', config.name);
      item.setData('dialog', DIALOG_CONFIG[config.name as keyof typeof DIALOG_CONFIG]);
      
      this.items.push(item);
    });
  }

  private setupInput(): void {
    // 设置键盘输入
    this.cursors = this.input.keyboard!.createCursorKeys();
    this.wasdKeys = this.input.keyboard!.addKeys('W,S,A,D');
    this.spaceKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
    this.escKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.ESC);
  }

  private setupGridEngine(): void {
    // 这里将设置GridEngine插件
    // 由于GridEngine需要特定的配置，我们将在后续实现
  }

  private setupUI(): void {
    // 更新UI显示
    this.updateUI();
  }

  private setupEventListeners(): void {
    // 监听游戏事件
    window.addEventListener(GAME_EVENTS.MENU_ITEM_SELECTED, this.handleMenuSelection.bind(this));
    window.addEventListener(GAME_EVENTS.DIALOG_FINISHED, this.handleDialogFinished.bind(this));
  }

  private setupCamera(): void {
    // 设置相机跟随玩家
    this.cameras.main.startFollow(this.player);
    this.cameras.main.setBounds(0, 0, this.map.widthInPixels, this.map.heightInPixels);
  }

  private handlePlayerMovement(): void {
    const speed = GAME_CONSTANTS.PLAYER_SPEED;
    const playerBody = this.player.body as Phaser.Physics.Arcade.Body;

    // 重置速度
    playerBody.setVelocity(0);

    // 处理输入
    let moving = false;
    let direction = '';

    if (this.cursors.left.isDown || this.wasdKeys.A.isDown) {
      playerBody.setVelocityX(-speed);
      direction = 'left';
      moving = true;
    } else if (this.cursors.right.isDown || this.wasdKeys.D.isDown) {
      playerBody.setVelocityX(speed);
      direction = 'right';
      moving = true;
    }

    if (this.cursors.up.isDown || this.wasdKeys.W.isDown) {
      playerBody.setVelocityY(-speed);
      direction = 'up';
      moving = true;
    } else if (this.cursors.down.isDown || this.wasdKeys.S.isDown) {
      playerBody.setVelocityY(speed);
      direction = 'down';
      moving = true;
    }

    // 播放动画
    if (moving) {
      this.player.play(`player_${direction}`);
    } else {
      this.player.play('player_idle');
    }
  }

  private handlePlayerInteraction(): void {
    if (Phaser.Input.Keyboard.JustDown(this.spaceKey)) {
      this.interactWithNearbyObjects();
    }

    if (Phaser.Input.Keyboard.JustDown(this.escKey)) {
      this.togglePauseMenu();
    }
  }

  private interactWithNearbyObjects(): void {
    const interactionRange = 32;
    const playerX = this.player.x;
    const playerY = this.player.y;

    // 检查NPC交互
    this.npcs.forEach(npc => {
      const distance = Phaser.Math.Distance.Between(playerX, playerY, npc.x, npc.y);
      if (distance <= interactionRange) {
        this.startDialog(npc.getData('name'));
        return;
      }
    });

    // 检查物品交互
    this.items.forEach(item => {
      const distance = Phaser.Math.Distance.Between(playerX, playerY, item.x, item.y);
      if (distance <= interactionRange) {
        this.startDialog(item.getData('name'));
        this.collectItem(item);
        return;
      }
    });
  }

  private startDialog(characterName: string): void {
    if (this.gameState.isInDialog) return;

    this.gameState.isInDialog = true;
    this.gameState.currentDialog = characterName;

    // 触发对话框事件
    const event = new CustomEvent(GAME_EVENTS.NEW_DIALOG, {
      detail: { characterName }
    });
    window.dispatchEvent(event);
  }

  private collectItem(item: Phaser.GameObjects.Sprite): void {
    const itemName = item.getData('name');
    
    switch (itemName) {
      case 'sword':
        this.gameState.hasSword = true;
        break;
      case 'push':
        this.gameState.canPush = true;
        break;
      default:
        this.gameState.coins++;
        break;
    }

    // 移除物品
    item.destroy();
    this.items = this.items.filter(i => i !== item);

    // 更新UI
    this.updateUI();
  }

  private togglePauseMenu(): void {
    this.gameState.isPaused = !this.gameState.isPaused;

    if (this.gameState.isPaused) {
      // 显示暂停菜单
      const event = new CustomEvent(GAME_EVENTS.MENU_ITEMS, {
        detail: {
          menuItems: [
            { id: 'resume', label: 'RESUME', action: 'resume_game' },
            { id: 'settings', label: 'SETTINGS', action: 'open_settings' },
            { id: 'main_menu', label: 'MAIN MENU', action: 'return_to_main' }
          ],
          menuPosition: 'center'
        }
      });
      window.dispatchEvent(event);
    }
  }

  private handleMenuSelection(event: any): void {
    const { selectedItem } = event.detail;

    switch (selectedItem.action) {
      case 'resume_game':
        this.gameState.isPaused = false;
        break;
      case 'return_to_main':
        this.scene.start('MainMenuScene');
        break;
      default:
        console.warn('Unknown menu action:', selectedItem.action);
    }
  }

  private handleDialogFinished(): void {
    this.gameState.isInDialog = false;
    this.gameState.currentDialog = null;
  }

  private updateUI(): void {
    // 更新血量显示
    const healthEvent = new CustomEvent(GAME_EVENTS.HERO_HEALTH, {
      detail: {
        healthStates: [{
          current: this.gameState.health,
          max: this.gameState.maxHealth
        }]
      }
    });
    window.dispatchEvent(healthEvent);

    // 更新金币显示
    const coinEvent = new CustomEvent(GAME_EVENTS.HERO_COIN, {
      detail: {
        heroCoins: this.gameState.coins
      }
    });
    window.dispatchEvent(coinEvent);
  }
}
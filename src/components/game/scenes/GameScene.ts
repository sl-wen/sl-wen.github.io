import Phaser from 'phaser';
import GridEngine from 'grid-engine';
import { GAME_CONSTANTS, DIALOG_CONFIG, GAME_EVENTS } from '../constants/gameConstants';

export default class GameScene extends Phaser.Scene {
  // 输入控制
  private enterKey!: Phaser.Input.Keyboard.Key;
  private spaceKey!: Phaser.Input.Keyboard.Key;
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private wasd!: any;
  private isSpaceJustDown = false;

  // 游戏状态
  private isShowingDialog = false;
  private isTeleporting = false;
  private isAttacking = false;

  // 游戏对象
  private heroSprite!: Phaser.Physics.Arcade.Sprite & {
    health: number;
    maxHealth: number;
    coin: number;
    canPush: boolean;
    haveSword: boolean;
    restoreHealth: (restore: number) => void;
    increaseMaxHealth: (increase: number) => void;
    collectCoin: (coinQuantity: number) => void;
    takeDamage: (damage: number) => void;
  };
  private map!: Phaser.Tilemaps.Tilemap;
  private groundLayer!: Phaser.Tilemaps.TilemapLayer;
  private objectsLayer!: Phaser.Tilemaps.TilemapLayer;
  
  // 组
  private itemsSprites!: Phaser.GameObjects.Group;
  private npcSprites!: Phaser.GameObjects.Group;

  // 初始化数据
  private initData: any = {};

  constructor() {
    super({ key: 'GameScene' });
  }

  init(data: any): void {
    this.initData = data;
  }

  create(): void {
    const camera = this.cameras.main;
    
    // 获取英雄状态
    const heroStatus = this.initData.heroStatus || {
      position: { x: 20, y: 20 },
      frame: 'hero_idle_down_01',
      facingDirection: 'down',
      health: 100,
      maxHealth: 100,
      coin: 0,
      canPush: false,
      haveSword: false
    };

    camera.fadeIn(GAME_CONSTANTS.GAMEPLAY.SCENE_FADE_TIME);

    // 设置输入控制
    this.setupInput();

    // 创建地图
    this.createMap();

    // 创建英雄
    this.createHero(heroStatus);

    // 创建物品
    this.createItems();

    // 创建NPC
    this.createNPCs();

    // 设置相机
    this.setupCamera();

    // 设置GridEngine
    this.setupGridEngine();

    // 设置碰撞检测
    this.setupCollisions();

    // 设置动画
    this.setupAnimations();
  }

  update(): void {
    this.isSpaceJustDown = Phaser.Input.Keyboard.JustDown(this.spaceKey);

    if (this.isTeleporting || this.isAttacking || this.isShowingDialog) {
      return;
    }

    // 处理攻击
    const gridEngine = this.plugins.get('gridEngine') as any;
    if (gridEngine && !gridEngine.isMoving('hero') && this.isSpaceJustDown && this.heroSprite.haveSword) {
      const facingDirection = gridEngine.getFacingDirection('hero');
      this.heroSprite.anims.play(`hero_attack_${facingDirection}`);
      this.isAttacking = true;
      return;
    }

    // 处理移动
    this.handleMovement();
  }

  private setupInput(): void {
    if (this.input.keyboard) {
      this.enterKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ENTER);
      this.spaceKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
      this.cursors = this.input.keyboard.createCursorKeys();
      this.wasd = this.input.keyboard.addKeys(['W', 'A', 'S', 'D']) as any;
    }
  }

  private createMap(): void {
    this.map = this.make.tilemap({ key: 'map' });
    const mainTileset = this.map.addTilesetImage('main_tileset', 'main_tileset');

    if (mainTileset) {
      const groundLayer = this.map.createLayer('ground', mainTileset);
      const objectsLayer = this.map.createLayer('objects', mainTileset);
      
      if (groundLayer) this.groundLayer = groundLayer;
      if (objectsLayer) this.objectsLayer = objectsLayer;

      this.objectsLayer.setCollisionByProperty({ collides: true });
    }
  }

  private createHero(heroStatus: any): void {
    const { position, frame, health, maxHealth, coin, canPush, haveSword } = heroStatus;

    this.heroSprite = this.physics.add.sprite(0, 0, 'player', frame) as any;
    this.heroSprite.setDepth(1);
    
    // 设置英雄属性
    this.heroSprite.health = health;
    this.heroSprite.maxHealth = maxHealth;
    this.heroSprite.coin = coin;
    this.heroSprite.canPush = canPush;
    this.heroSprite.haveSword = haveSword;

    // 更新UI
    this.updateHeroHealthUI(this.calculateHeroHealthStates());
    this.updateHeroCoinUI(coin);

    // 设置物理属性
    if (this.heroSprite.body) {
      this.heroSprite.body.setSize(14, 14);
      this.heroSprite.body.setOffset(9, 13);
    }

    // 设置英雄方法
    this.setupHeroMethods();
  }

  private setupHeroMethods(): void {
    // 恢复血量
    this.heroSprite.restoreHealth = (restore: number) => {
      this.heroSprite.health = Math.min(this.heroSprite.health + restore, this.heroSprite.maxHealth);
      this.updateHeroHealthUI(this.calculateHeroHealthStates());
    };

    // 增加最大血量
    this.heroSprite.increaseMaxHealth = (increase: number) => {
      this.heroSprite.maxHealth += increase;
      this.updateHeroHealthUI(this.calculateHeroHealthStates());
    };

    // 收集金币
    this.heroSprite.collectCoin = (coinQuantity: number) => {
      this.heroSprite.coin = Math.min(this.heroSprite.coin + coinQuantity, 999);
      this.updateHeroCoinUI(this.heroSprite.coin);
    };

    // 受到伤害
    this.heroSprite.takeDamage = (damage: number) => {
      this.time.delayedCall(180, () => {
        this.heroSprite.health -= damage;
        if (this.heroSprite.health <= 0) {
          this.cameras.main.fadeOut(GAME_CONSTANTS.GAMEPLAY.SCENE_FADE_TIME);
          this.updateHeroHealthUI([]);
          this.updateHeroCoinUI(null);
          this.time.delayedCall(GAME_CONSTANTS.GAMEPLAY.SCENE_FADE_TIME, () => {
            this.isTeleporting = false;
            this.scene.start('GameOverScene');
          });
        } else {
          this.updateHeroHealthUI(this.calculateHeroHealthStates());
          this.tweens.add({
            targets: this.heroSprite,
            alpha: 0,
            ease: Phaser.Math.Easing.Elastic.InOut,
            duration: 70,
            repeat: 1,
            yoyo: true,
          });
        }
      });
    };
  }

  private createItems(): void {
    this.itemsSprites = this.add.group();

    // 创建一些测试物品
    const testItems = [
      { x: 400, y: 300, type: 'coin' },
      { x: 450, y: 350, type: 'heart' },
      { x: 500, y: 400, type: 'sword' }
    ];

    testItems.forEach(item => {
      const sprite = this.physics.add.sprite(item.x, item.y, item.type);
      sprite.setDepth(1);
      sprite.setOrigin(0, 1);
      (sprite as any).itemType = item.type;
      this.itemsSprites.add(sprite);
    });
  }

  private createNPCs(): void {
    this.npcSprites = this.add.group();

    // 创建NPC
    const npcConfigs = [
      { key: 'npc_01', x: 400, y: 320, name: 'npc_01' },
      { key: 'npc_02', x: 480, y: 400, name: 'npc_02' }
    ];

    npcConfigs.forEach(config => {
      const npc = this.physics.add.sprite(config.x, config.y, config.key, `${config.key}_idle_down_01`);
      npc.body.setSize(14, 14);
      npc.body.setOffset(9, 13);
      npc.setData('name', config.name);
      npc.setData('dialog', DIALOG_CONFIG[config.name as keyof typeof DIALOG_CONFIG]);
      this.npcSprites.add(npc);
    });
  }

  private setupCamera(): void {
    const camera = this.cameras.main;
    camera.startFollow(this.heroSprite, true);
    camera.setFollowOffset(-this.heroSprite.width, -this.heroSprite.height);
    
    if (this.map) {
      camera.setBounds(
        0,
        0,
        Math.max(this.map.widthInPixels, this.game.scale.gameSize.width),
        Math.max(this.map.heightInPixels, this.game.scale.gameSize.height)
      );
    }
  }

  private setupGridEngine(): void {
    if (!this.map) return;

    const gridEngineConfig = {
      characters: [
        {
          id: 'hero',
          sprite: this.heroSprite,
          startPosition: this.initData.heroStatus?.position || { x: 20, y: 20 },
          offsetY: 4,
        },
      ],
    };

    // 使用GridEngine插件
    const gridEngine = this.plugins.get('gridEngine') as any;
    if (gridEngine) {
      gridEngine.create(this.map, gridEngineConfig);
    } else {
      console.warn('GridEngine plugin not available');
    }
  }

  private setupCollisions(): void {
    // 英雄与物品碰撞
    this.physics.add.overlap(this.heroSprite, this.itemsSprites, (objA, objB) => {
      const item = [objA, objB].find((obj) => obj !== this.heroSprite);
      if (!item) return;

      this.handleItemCollection(item);
    });

    // 英雄与NPC碰撞
    this.physics.add.overlap(this.heroSprite, this.npcSprites, (objA, objB) => {
      if (this.isShowingDialog) return;

      const npc = [objA, objB].find((obj) => obj !== this.heroSprite);
      if (!npc) return;

      if (Phaser.Input.Keyboard.JustDown(this.enterKey)) {
        this.startDialog((npc as any).getData('name'));
      }
    });
  }

  private setupAnimations(): void {
    // 设置动画完成事件
    this.heroSprite.on('animationcomplete', (animation: any) => {
      if (animation.key.includes('attack')) {
        this.isAttacking = false;
      }
    });
  }

  private handleMovement(): void {
    const gridEngine = this.plugins.get('gridEngine') as any;
    if (!gridEngine) return;

    if (this.cursors.left.isDown || this.wasd.A.isDown) {
      gridEngine.move('hero', 'left');
    } else if (this.cursors.right.isDown || this.wasd.D.isDown) {
      gridEngine.move('hero', 'right');
    } else if (this.cursors.up.isDown || this.wasd.W.isDown) {
      gridEngine.move('hero', 'up');
    } else if (this.cursors.down.isDown || this.wasd.S.isDown) {
      gridEngine.move('hero', 'down');
    }
  }

  private handleItemCollection(item: any): void {
    switch (item.itemType) {
      case 'heart':
        this.heroSprite.restoreHealth(20);
        break;
      case 'coin':
        this.heroSprite.collectCoin(1);
        break;
      case 'sword':
        this.heroSprite.haveSword = true;
        this.startDialog('sword');
        break;
    }

    item.setVisible(false);
    item.destroy();
  }

  private startDialog(characterName: string): void {
    const customEvent = new CustomEvent('new-dialog', {
      detail: { characterName }
    });
    window.dispatchEvent(customEvent);
    this.isShowingDialog = true;

    const dialogBoxFinishedEventListener = () => {
      window.removeEventListener(`${characterName}-dialog-finished`, dialogBoxFinishedEventListener);
      this.time.delayedCall(100, () => {
        this.isShowingDialog = false;
      });
    };
    window.addEventListener(`${characterName}-dialog-finished`, dialogBoxFinishedEventListener);
  }

  private calculateHeroHealthStates(): any[] {
    return [{
      current: this.heroSprite.health,
      max: this.heroSprite.maxHealth
    }];
  }

  private updateHeroHealthUI(healthStates: any[]): void {
    const customEvent = new CustomEvent('hero-health', {
      detail: { healthStates }
    });
    window.dispatchEvent(customEvent);
  }

  private updateHeroCoinUI(coins: number | null): void {
    const customEvent = new CustomEvent('hero-coin', {
      detail: { heroCoins: coins }
    });
    window.dispatchEvent(customEvent);
  }
}
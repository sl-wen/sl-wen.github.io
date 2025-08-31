import Phaser from 'phaser';

export default class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: 'BootScene' });
  }

  preload(): void {
    // 创建加载进度条
    const progressBar = this.add.graphics();
    const progressBox = this.add.graphics();
    progressBox.fillStyle(0x222222, 0.8);
    progressBox.fillRect(240, 270, 320, 50);

    const width = this.cameras.main.width;
    const height = this.cameras.main.height;
    const loadingText = this.make.text({
      x: width / 2,
      y: height / 2 - 50,
      text: 'Loading...',
      style: {
        font: '20px monospace',
        color: '#ffffff'
      }
    });
    loadingText.setOrigin(0.5, 0.5);

    const percentText = this.make.text({
      x: width / 2,
      y: height / 2 - 5,
      text: '0%',
      style: {
        font: '18px monospace',
        color: '#ffffff'
      }
    });
    percentText.setOrigin(0.5, 0.5);

    const assetText = this.make.text({
      x: width / 2,
      y: height / 2 + 50,
      text: '',
      style: {
        font: '14px monospace',
        color: '#ffffff'
      }
    });
    assetText.setOrigin(0.5, 0.5);

    // 监听加载进度
    this.load.on('progress', (value: number) => {
      progressBar.clear();
      progressBar.fillStyle(0xffffff, 1);
      progressBar.fillRect(250, 280, 300 * value, 30);
      percentText.setText(Math.floor(value * 100) + '%');
    });

    this.load.on('fileprogress', (file: any) => {
      assetText.setText('Loading asset: ' + file.key);
    });

    this.load.on('complete', () => {
      progressBar.destroy();
      progressBox.destroy();
      loadingText.destroy();
      percentText.destroy();
      assetText.destroy();
    });

    // 加载字体 - 使用CSS加载而不是Phaser
    // this.load.webfont('Press Start 2P', 'https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap');

    // 加载图片资源
    this.load.image('dialog_border', '/game/assets/images/dialog_borderbox.png');
    this.load.image('menu_background', '/game/assets/images/main_menu_background.png');
    this.load.image('game_over_background', '/game/assets/images/game_over_background.png');
    this.load.image('main_menu_background', '/game/assets/images/main_menu_background.png');

    // 加载精灵资源 - 使用atlas格式
    this.load.atlas('player', '/game/assets/sprites/atlas/hero.png', '/game/assets/sprites/atlas/hero.json');
    this.load.atlas('npc_01', '/game/assets/sprites/atlas/npc_01.png', '/game/assets/sprites/atlas/npc_01.json');
    this.load.atlas('npc_02', '/game/assets/sprites/atlas/npc_01.png', '/game/assets/sprites/atlas/npc_01.json'); // 暂时使用npc_01
    this.load.atlas('npc_03', '/game/assets/sprites/atlas/npc_01.png', '/game/assets/sprites/atlas/npc_01.json'); // 暂时使用npc_01
    this.load.atlas('npc_04', '/game/assets/sprites/atlas/npc_01.png', '/game/assets/sprites/atlas/npc_01.json'); // 暂时使用npc_01

    this.load.image('sword', '/game/assets/images/sword.png');
    this.load.image('coin', '/game/assets/images/coin.png');
    this.load.image('heart', '/game/assets/images/health.png');
    this.load.image('book', '/game/assets/images/push.png'); // 暂时使用push图标
    this.load.image('sign', '/game/assets/images/push.png'); // 暂时使用push图标

    // 加载瓦片集
    this.load.image('main_tileset', '/game/assets/sprites/maps/tilesets/tileset.png');
    this.load.image('objects_tileset', '/game/assets/sprites/maps/tilesets/tileset.png'); // 暂时使用主瓦片集

    // 加载地图数据
    this.load.tilemapTiledJSON('map', '/game/assets/maps/main_map.json');
  }

  create(): void {
    // 创建角色动画
    this.createPlayerAnimations();
    this.createNPCAnimations();

    // 设置全局字体
    // 暂时注释掉字体配置，使用默认字体
    // this.cache.bitmapFont.add('PressStart2P', Phaser.GameObjects.RetroFont.Parse(this, {
    //   image: 'font',
    //   width: 8,
    //   height: 8,
    //   chars: Phaser.GameObjects.RetroFont.TEXT_SET6,
    //   charsPerRow: 10,
    //   spacing: { x: 0, y: 0 }
    // }));

    // 启动主菜单场景
    this.scene.start('MainMenuScene');
  }

  private createPlayerAnimations(): void {
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

  private createNPCAnimations(): void {
    const npcs = ['npc_01', 'npc_02', 'npc_03', 'npc_04'];

    npcs.forEach(npc => {
      // NPC向下行走动画
      this.anims.create({
        key: `${npc}_down`,
        frames: this.anims.generateFrameNames(npc, {
          prefix: 'npc_01_walking_down_',
          start: 1,
          end: 2,
          zeroPad: 2
        }),
        frameRate: 6,
        repeat: -1
      });

      // NPC向上行走动画
      this.anims.create({
        key: `${npc}_up`,
        frames: this.anims.generateFrameNames(npc, {
          prefix: 'npc_01_walking_up_',
          start: 1,
          end: 2,
          zeroPad: 2
        }),
        frameRate: 6,
        repeat: -1
      });

      // NPC向左行走动画
      this.anims.create({
        key: `${npc}_left`,
        frames: this.anims.generateFrameNames(npc, {
          prefix: 'npc_01_walking_left_',
          start: 1,
          end: 2,
          zeroPad: 2
        }),
        frameRate: 6,
        repeat: -1
      });

      // NPC向右行走动画
      this.anims.create({
        key: `${npc}_right`,
        frames: this.anims.generateFrameNames(npc, {
          prefix: 'npc_01_walking_right_',
          start: 1,
          end: 2,
          zeroPad: 2
        }),
        frameRate: 6,
        repeat: -1
      });

      // NPC站立动画
      this.anims.create({
        key: `${npc}_idle`,
        frames: [{ key: npc, frame: 'npc_01_idle_down_01' }],
        frameRate: 1
      });
    });
  }
}
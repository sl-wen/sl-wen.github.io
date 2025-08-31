import Phaser from 'phaser';
import { GAME_ASSETS, GAME_CONSTANTS } from '../constants/gameConstants';

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

    // 加载字体
    this.load.webfont('Press Start 2P', 'https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap');

    // 加载图片资源
    this.load.image('dialog_border', GAME_ASSETS.IMAGES.DIALOG_BORDER);
    this.load.image('menu_background', GAME_ASSETS.IMAGES.MENU_BACKGROUND);
    this.load.image('game_over_background', GAME_ASSETS.IMAGES.GAME_OVER_BACKGROUND);
    this.load.image('main_menu_background', GAME_ASSETS.IMAGES.MAIN_MENU_BACKGROUND);

    // 加载精灵资源
    this.load.spritesheet('player', GAME_ASSETS.SPRITES.PLAYER, { 
      frameWidth: 32, 
      frameHeight: 32 
    });
    this.load.spritesheet('npc_01', GAME_ASSETS.SPRITES.NPC_01, { 
      frameWidth: 32, 
      frameHeight: 32 
    });
    this.load.spritesheet('npc_02', GAME_ASSETS.SPRITES.NPC_02, { 
      frameWidth: 32, 
      frameHeight: 32 
    });
    this.load.spritesheet('npc_03', GAME_ASSETS.SPRITES.NPC_03, { 
      frameWidth: 32, 
      frameHeight: 32 
    });
    this.load.spritesheet('npc_04', GAME_ASSETS.SPRITES.NPC_04, { 
      frameWidth: 32, 
      frameHeight: 32 
    });
    this.load.image('sword', GAME_ASSETS.SPRITES.SWORD);
    this.load.image('coin', GAME_ASSETS.SPRITES.COIN);
    this.load.image('heart', GAME_ASSETS.SPRITES.HEART);
    this.load.image('book', GAME_ASSETS.SPRITES.BOOK);
    this.load.image('sign', GAME_ASSETS.SPRITES.SIGN);

    // 加载瓦片集
    this.load.image('main_tileset', GAME_ASSETS.TILESETS.MAIN_TILESET);
    this.load.image('objects_tileset', GAME_ASSETS.TILESETS.OBJECTS_TILESET);

    // 加载地图数据
    this.load.tilemapTiledJSON('map', '/game/assets/maps/main_map.json');
  }

  create(): void {
    // 创建角色动画
    this.createPlayerAnimations();
    this.createNPCAnimations();

    // 设置全局字体
    this.cache.bitmapFont.add('PressStart2P', Phaser.GameObjects.RetroFont.Parse(this, {
      image: 'font',
      width: 8,
      height: 8,
      chars: Phaser.GameObjects.RetroFont.TEXT_SET6,
      charsPerRow: 10,
      spacing: { x: 0, y: 0 }
    }));

    // 启动主菜单场景
    this.scene.start('MainMenuScene');
  }

  private createPlayerAnimations(): void {
    // 玩家向下行走动画
    this.anims.create({
      key: 'player_down',
      frames: this.anims.generateFrameNumbers('player', { start: 0, end: 3 }),
      frameRate: 8,
      repeat: -1
    });

    // 玩家向上行走动画
    this.anims.create({
      key: 'player_up',
      frames: this.anims.generateFrameNumbers('player', { start: 4, end: 7 }),
      frameRate: 8,
      repeat: -1
    });

    // 玩家向左行走动画
    this.anims.create({
      key: 'player_left',
      frames: this.anims.generateFrameNumbers('player', { start: 8, end: 11 }),
      frameRate: 8,
      repeat: -1
    });

    // 玩家向右行走动画
    this.anims.create({
      key: 'player_right',
      frames: this.anims.generateFrameNumbers('player', { start: 12, end: 15 }),
      frameRate: 8,
      repeat: -1
    });

    // 玩家站立动画
    this.anims.create({
      key: 'player_idle',
      frames: [{ key: 'player', frame: 0 }],
      frameRate: 1
    });
  }

  private createNPCAnimations(): void {
    const npcs = ['npc_01', 'npc_02', 'npc_03', 'npc_04'];
    
    npcs.forEach(npc => {
      // NPC向下行走动画
      this.anims.create({
        key: `${npc}_down`,
        frames: this.anims.generateFrameNumbers(npc, { start: 0, end: 3 }),
        frameRate: 6,
        repeat: -1
      });

      // NPC向上行走动画
      this.anims.create({
        key: `${npc}_up`,
        frames: this.anims.generateFrameNumbers(npc, { start: 4, end: 7 }),
        frameRate: 6,
        repeat: -1
      });

      // NPC向左行走动画
      this.anims.create({
        key: `${npc}_left`,
        frames: this.anims.generateFrameNumbers(npc, { start: 8, end: 11 }),
        frameRate: 6,
        repeat: -1
      });

      // NPC向右行走动画
      this.anims.create({
        key: `${npc}_right`,
        frames: this.anims.generateFrameNumbers(npc, { start: 12, end: 15 }),
        frameRate: 6,
        repeat: -1
      });

      // NPC站立动画
      this.anims.create({
        key: `${npc}_idle`,
        frames: [{ key: npc, frame: 0 }],
        frameRate: 1
      });
    });
  }
}
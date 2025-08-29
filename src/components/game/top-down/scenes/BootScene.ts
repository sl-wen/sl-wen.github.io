import * as Phaser from 'phaser';

export default class BootScene extends Phaser.Scene {
  constructor() {
    super('BootScene');
  }

  preload() {
    const fontSize = 16;

    // 设置加载进度条
    const progressBar = this.add.graphics();
    const progressBox = this.add.graphics();
    const { width: gameWidth, height: gameHeight } = this.cameras.main;

    const barPositionX = Math.ceil((gameWidth - (gameWidth * 0.7)) / 2);
    progressBox.fillStyle(0x222222, 0.8);
    progressBox.fillRect(
      barPositionX,
      Math.ceil(gameHeight / 6),
      Math.ceil(gameWidth * 0.7),
      Math.ceil(gameHeight / 10)
    );

    const loadingText = this.add.text(
      gameWidth / 2,
      Math.ceil(gameHeight / 10),
      'loading...',
      {
        fontFamily: '"Press Start 2P"',
        fontSize: `${fontSize}px`,
        color: '#ffffff',
      }
    );

    loadingText.setOrigin(0.5);
    loadingText.setResolution(30);

    const percentText = this.add.text(
      gameWidth / 2,
      Math.ceil((gameHeight / 6) + (fontSize / 2) + (gameHeight / 60)),
      '0%',
      {
        fontFamily: '"Press Start 2P"',
        fontSize: `${fontSize}px`,
        color: '#ffffff',
      }
    );

    percentText.setOrigin(0.5);
    percentText.setResolution(30);

    const assetText = this.add.text(
      gameWidth / 2,
      Math.ceil(gameHeight / 3),
      '',
      {
        fontFamily: '"Press Start 2P"',
        fontSize: `${fontSize / 2}px`,
        color: '#ffffff',
      }
    );

    assetText.setOrigin(0.5);
    assetText.setResolution(30);

    this.load.on('progress', (value: number) => {
      progressBar.clear();
      progressBar.fillStyle(0xFFFFFF, 1);
      progressBar.fillRect(
        barPositionX,
        Math.ceil(gameHeight / 6),
        Math.ceil(gameWidth * 0.7) * value,
        Math.ceil(gameHeight / 10)
      );
      percentText.setText(`${Number.parseInt((value * 100).toString(), 10)}%`);
    });

    this.load.on('fileprogress', (file: any) => {
      assetText.setText(`loading: ${file.key}`);
    });

    this.load.on('complete', () => {
      progressBar.destroy();
      progressBox.destroy();
      percentText.destroy();
      assetText.destroy();
    });

    // 加载地图资源
    this.loadTilemaps();
    
    // 加载角色资源
    this.loadCharacters();
    
    // 加载物品资源
    this.loadItems();
    
    // 加载UI资源
    this.loadUI();
    
    // 加载音效资源
    this.loadAudio();
  }

  private loadTilemaps() {
    // 地图文件
    this.load.tilemapTiledJSON('home_page_city', '/assets/topdown/maps/cities/home_page_city.json');
    this.load.tilemapTiledJSON('home_page_city_house_01', '/assets/topdown/maps/houses/home_page_city_house_01.json');
    this.load.tilemapTiledJSON('home_page_city_house_02', '/assets/topdown/maps/houses/home_page_city_house_02.json');
    this.load.tilemapTiledJSON('home_page_city_house_03', '/assets/topdown/maps/houses/home_page_city_house_03.json');
    
    // 瓦片集
    this.load.image('tileset', '/assets/topdown/maps/tilesets/tileset.png');
  }

  private loadCharacters() {
    // 英雄角色
    this.load.atlas('hero', '/assets/topdown/sprites/atlas/hero.png', '/assets/topdown/sprites/atlas/hero.json');
    
    // 敌人
    this.load.atlas('slime', '/assets/topdown/sprites/atlas/slime.png', '/assets/topdown/sprites/atlas/slime.json');
    
    // NPC角色
    this.load.atlas('npc_01', '/assets/topdown/sprites/atlas/npc_01.png', '/assets/topdown/sprites/atlas/npc_01.json');
    this.load.atlas('npc_02', '/assets/topdown/sprites/atlas/npc_02.png', '/assets/topdown/sprites/atlas/npc_02.json');
    this.load.atlas('npc_03', '/assets/topdown/sprites/atlas/npc_03.png', '/assets/topdown/sprites/atlas/npc_03.json');
    this.load.atlas('npc_04', '/assets/topdown/sprites/atlas/npc_04.png', '/assets/topdown/sprites/atlas/npc_04.json');
  }

  private loadItems() {
    // 物品
    this.load.atlas('heart', '/assets/topdown/sprites/atlas/heart.png', '/assets/topdown/sprites/atlas/heart.json');
    this.load.atlas('coin', '/assets/topdown/sprites/atlas/coin.png', '/assets/topdown/sprites/atlas/coin.json');
    
    // 装备
    this.load.image('heart_container', '/assets/topdown/images/heart_container.png');
    this.load.image('sword', '/assets/topdown/images/sword.png');
    this.load.image('push', '/assets/topdown/images/push.png');
  }

  private loadUI() {
    // UI背景
    this.load.image('main_menu_background', '/assets/topdown/images/main_menu_background.png');
    this.load.image('game_over_background', '/assets/topdown/images/game_over_background.png');
    this.load.image('game_logo', '/assets/topdown/images/game_logo.png');
    this.load.image('dialog_borderbox', '/assets/topdown/images/dialog_borderbox.png');
  }

  private loadAudio() {
    // 背景音乐
    this.load.audio('bgm_menu', '/assets/topdown/audio/bgm_menu.mp3');
    this.load.audio('bgm_village', '/assets/topdown/audio/bgm_village.mp3');
    this.load.audio('bgm_forest', '/assets/topdown/audio/bgm_forest.mp3');
    this.load.audio('bgm_cave', '/assets/topdown/audio/bgm_cave.mp3');
    this.load.audio('bgm_battle', '/assets/topdown/audio/bgm_battle.mp3');
    
    // 音效
    this.load.audio('sfx_move', '/assets/topdown/audio/sfx_move.mp3');
    this.load.audio('sfx_attack', '/assets/topdown/audio/sfx_attack.mp3');
    this.load.audio('sfx_pickup', '/assets/topdown/audio/sfx_pickup.mp3');
    this.load.audio('sfx_damage', '/assets/topdown/audio/sfx_damage.mp3');
    this.load.audio('sfx_levelup', '/assets/topdown/audio/sfx_levelup.mp3');
    this.load.audio('sfx_ui_click', '/assets/topdown/audio/sfx_ui_click.mp3');
    this.load.audio('sfx_ui_hover', '/assets/topdown/audio/sfx_ui_hover.mp3');
  }

  create() {
    console.log('BootScene: 资源加载完成，启动主菜单');
    this.scene.start('MainMenuScene');
  }
}
import * as Phaser from 'phaser';

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

    this.load.on('fileprogress', (file: { key: string }) => {
      assetText.setText('Loading asset: ' + file.key);
    });

    this.load.on('complete', () => {
      progressBar.destroy();
      progressBox.destroy();
      loadingText.destroy();
      percentText.destroy();
      assetText.destroy();
    });

    // 加载精灵资源
    this.load.atlas('player', '/game/assets/sprites/atlas/hero.png', '/game/assets/sprites/atlas/hero.json');

    // 加载瓦片集
    this.load.image('main_tileset', '/game/assets/sprites/maps/tilesets/tileset.png');

    // 加载地图数据
    this.load.tilemapTiledJSON('map', '/game/assets/maps/main_map.json');
  }

  create(): void {
    // 创建角色动画
    this.createPlayerAnimations();

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
}
import * as Phaser from 'phaser';
import { SpriteAtlasManager } from '../utils/SpriteAtlasManager';

/**
 * 预加载场景类
 * 负责加载游戏所需的所有资源文件，包括图片、音频、动画等
 * 显示加载进度条，确保所有资源加载完成后才进入游戏
 */
export class PreloadScene extends Phaser.Scene {
  /**
   * 构造函数
   */
  constructor() {
    super({ key: 'PreloadScene' }); // 场景标识符
  }

  /**
   * 预加载阶段
   * 加载所有游戏资源并显示加载进度
   */
  preload() {
    // 创建加载进度条界面
    const width = this.cameras.main.width; // 获取摄像机宽度
    const height = this.cameras.main.height; // 获取摄像机高度

    // 创建进度条图形对象
    const progressBar = this.add.graphics();
    const progressBox = this.add.graphics();
    progressBox.fillStyle(0x222222, 0.8); // 深灰色背景，80%透明度
    progressBox.fillRect(width / 2 - 160, height / 2 - 25, 320, 50); // 居中的矩形框

    // 创建加载文本提示
    const loadingText = this.make.text({
      x: width / 2,
      y: height / 2 - 50,
      text: '正在加载小猫农场...',
      style: {
        font: '20px monospace', // 等宽字体
        color: '#ffffff' // 白色文字
      }
    });
    loadingText.setOrigin(0.5, 0.5); // 设置文本居中对齐

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

    // Load progress events
    this.load.on('progress', (value: number) => {
      percentText.setText(Math.floor(value * 100) + '%');
      progressBar.clear();
      progressBar.fillStyle(0x4ecdc4, 1);
      progressBar.fillRect(width / 2 - 150, height / 2 - 15, 300 * value, 30);
      console.log(`Loading progress: ${Math.floor(value * 100)}%`);
    });

    this.load.on('complete', () => {
      console.log('All assets loaded successfully');
      percentText.setText('100%');

      // Clean up loading UI
      progressBar.destroy();
      progressBox.destroy();
      loadingText.destroy();
      percentText.destroy();
    });

    this.load.on('loaderror', (file: any) => {
      console.error('Failed to load asset:', file.src || file.key);
      // Continue loading other assets even if one fails
    });

    this.load.on('fileprogress', (file: any) => {
      console.log(`Loading file: ${file.key} - ${file.src}`);
    });

    // Load sprite assets
    this.loadSpriteAssets();


  }

  /**
   * 加载精灵资源
   * 加载游戏所需的所有图片和动画资源
   */
  private loadSpriteAssets() {
    console.log('Loading sprite assets...');

    // 加载小猫角色精灵（使用player作为备用）
    this.load.image('cat', '/assets/farm-assets/cat/cat-0.png');

    // 加载小猫动画精灵表（使用player动画作为备用）
    this.load.spritesheet('cat_walk', '/assets/farm-assets/cat/cat-1.png', {
      frameWidth: 16,    // 帧宽度
      frameHeight: 16    // 帧高度
    });

    this.load.spritesheet('cat_actions', '/assets/farm-assets/cat/cat-2.png', {
      frameWidth: 16,    // 帧宽度
      frameHeight: 16    // 帧高度
    });

    console.log('Cat sprites loaded successfully');

    // Load farm plot sprites (using existing tiles as fallback)
    this.load.image('farm_plot_empty', '/assets/farm-assets/farmplants/framplant-0.png');
    this.load.image('farm_plot_plowed', '/assets/farm-assets/farmplants/framplant-1.png');
    this.load.image('farm_plot_planted', '/assets/farm-assets/farmplants/framplant-2.png');

    this.load.image('fence', '/assets/farm-assets/fence/fence-0.png');
    this.load.image('fence', '/assets/farm-assets/fence/fence-1.png');

  }

}
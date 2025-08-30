import * as Phaser from 'phaser';
import { ResourceLoader, ResourceType, createResourceLoader } from '../systems/ResourceLoader';

export default class BootScene extends Phaser.Scene {
  private resourceLoader!: ResourceLoader;
  private progressBar!: Phaser.GameObjects.Graphics;
  private progressBox!: Phaser.GameObjects.Graphics;
  private loadingText!: Phaser.GameObjects.Text;
  private percentText!: Phaser.GameObjects.Text;
  private assetText!: Phaser.GameObjects.Text;

  constructor() {
    super('BootScene');
  }

  preload() {
    console.log('🎮 BootScene: 开始资源加载');
    
    // 创建资源加载器
    this.resourceLoader = createResourceLoader(this.game, {
      maxConcurrent: 3,
      retryDelay: 2000,
      timeout: 30000,
      enableCache: true,
      enableCompression: true
    });

    // 设置场景
    this.resourceLoader.setScene(this);

    // 设置加载进度UI
    this.setupLoadingUI();

    // 添加自定义资源
    this.addCustomResources();

    // 开始加载
    this.startResourceLoading();
  }

  private setupLoadingUI() {
    const fontSize = 16;
    const { width: gameWidth, height: gameHeight } = this.cameras.main;

    // 进度条背景
    this.progressBox = this.add.graphics();
    const barPositionX = Math.ceil((gameWidth - (gameWidth * 0.7)) / 2);
    this.progressBox.fillStyle(0x222222, 0.8);
    this.progressBox.fillRect(
      barPositionX,
      Math.ceil(gameHeight / 6),
      Math.ceil(gameWidth * 0.7),
      Math.ceil(gameHeight / 10)
    );

    // 加载文本
    this.loadingText = this.add.text(
      gameWidth / 2,
      Math.ceil(gameHeight / 10),
      '正在加载游戏资源...',
      {
        fontFamily: '"Press Start 2P"',
        fontSize: `${fontSize}px`,
        color: '#ffffff',
      }
    );
    this.loadingText.setOrigin(0.5);
    this.loadingText.setResolution(30);

    // 百分比文本
    this.percentText = this.add.text(
      gameWidth / 2,
      Math.ceil((gameHeight / 6) + (fontSize / 2) + (gameHeight / 60)),
      '0%',
      {
        fontFamily: '"Press Start 2P"',
        fontSize: `${fontSize}px`,
        color: '#ffffff',
      }
    );
    this.percentText.setOrigin(0.5);
    this.percentText.setResolution(30);

    // 当前加载项文本
    this.assetText = this.add.text(
      gameWidth / 2,
      Math.ceil(gameHeight / 3),
      '',
      {
        fontFamily: '"Press Start 2P"',
        fontSize: `${fontSize / 2}px`,
        color: '#ffffff',
      }
    );
    this.assetText.setOrigin(0.5);
    this.assetText.setResolution(30);

    // 进度条
    this.progressBar = this.add.graphics();
  }

  private addCustomResources() {
    // 资源已经在 createResourceLoader 中预定义了，这里不需要重复添加
    console.log('🎮 BootScene: 使用预定义的资源列表');
  }



  private async startResourceLoading() {
    try {
      // 监听加载进度
      this.resourceLoader.on('progress', (event) => {
        this.updateLoadingProgress(event.progress!);
        // 发送进度事件到游戏引擎
        this.game.events.emit('load-progress', event.progress);
      });

      // 监听加载完成
      this.resourceLoader.on('complete', (event) => {
        console.log('✅ 资源加载完成:', event.progress);
        // 发送完成事件到游戏引擎
        this.game.events.emit('load-complete', event.progress);
        this.onLoadingComplete();
      });

      // 监听加载错误
      this.resourceLoader.on('error', (event) => {
        console.error('❌ 资源加载错误:', event.error);
        this.onLoadingError(event.error!);
      });

      // 监听重试
      this.resourceLoader.on('retry', (event) => {
        console.log('🔄 重试加载资源:', event.item?.key);
        this.updateLoadingProgress(event.progress!);
      });

      // 开始加载
      await this.resourceLoader.startLoading();

    } catch (error) {
      console.error('❌ 资源加载器启动失败:', error);
      this.onLoadingError(error instanceof Error ? error.message : 'Unknown error');
    }
  }

  private updateLoadingProgress(progress: any) {
    const { width: gameWidth, height: gameHeight } = this.cameras.main;
    const barPositionX = Math.ceil((gameWidth - (gameWidth * 0.7)) / 2);

    // 更新进度条
    this.progressBar.clear();
    this.progressBar.fillStyle(0xFFFFFF, 1);
    this.progressBar.fillRect(
      barPositionX,
      Math.ceil(gameHeight / 6),
      Math.ceil(gameWidth * 0.7) * (progress.percentage / 100),
      Math.ceil(gameHeight / 10)
    );

    // 更新百分比
    this.percentText.setText(`${progress.percentage}%`);

    // 更新当前加载项
    if (progress.currentItem) {
      this.assetText.setText(`正在加载: ${progress.currentItem.key}`);
    }

    // 更新加载文本
    if (progress.failed > 0) {
      this.loadingText.setText(`加载中... (${progress.failed} 个失败)`);
      this.loadingText.setColor('#ff6b6b');
    } else if (progress.retrying > 0) {
      this.loadingText.setText(`重试中... (${progress.retrying} 个重试)`);
      this.loadingText.setColor('#ffd93d');
    } else {
      this.loadingText.setText('正在加载游戏资源...');
      this.loadingText.setColor('#ffffff');
    }

    // 添加统计信息
    const statsText = `${progress.loaded}/${progress.total} 资源已加载`;
    if (progress.estimatedTime && progress.estimatedTime > 0) {
      const timeText = this.formatTime(progress.estimatedTime);
      this.assetText.setText(`${this.assetText.text}\n${statsText} • 预计剩余: ${timeText}`);
    }
  }

  private formatTime(ms: number): string {
    if (ms < 1000) return `${ms}ms`;
    if (ms < 60000) return `${Math.round(ms / 1000)}s`;
    return `${Math.round(ms / 60000)}m ${Math.round((ms % 60000) / 1000)}s`;
  }

  private onLoadingComplete() {
    console.log('🎉 BootScene: 所有资源加载完成');
    
    // 清理加载UI
    this.cleanupLoadingUI();
    
    // 启动主菜单场景
    this.scene.start('MainMenuScene');
  }

  private onLoadingError(error: string) {
    console.error('❌ BootScene: 资源加载失败:', error);
    
    // 显示错误信息
    this.loadingText.setText('资源加载失败');
    this.loadingText.setColor('#ff6b6b');
    this.assetText.setText(`错误: ${error}\n请刷新页面重试`);
    this.assetText.setColor('#ff6b6b');

    // 5秒后自动重试
    setTimeout(() => {
      console.log('🔄 自动重试资源加载...');
      this.scene.restart();
    }, 5000);
  }

  private cleanupLoadingUI() {
    if (this.progressBar) this.progressBar.destroy();
    if (this.progressBox) this.progressBox.destroy();
    if (this.loadingText) this.loadingText.destroy();
    if (this.percentText) this.percentText.destroy();
    if (this.assetText) this.assetText.destroy();
  }

  create() {
    // 这个方法现在由 onLoadingComplete 处理
    console.log('🎮 BootScene: 场景创建完成');
  }

  destroy() {
    // 清理资源加载器
    if (this.resourceLoader) {
      this.resourceLoader.destroy();
    }
    
    // 清理UI
    this.cleanupLoadingUI();
    
    console.log('🗑️ BootScene: 场景销毁完成');
  }
}
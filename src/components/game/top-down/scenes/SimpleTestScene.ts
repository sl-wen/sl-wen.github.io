import * as Phaser from 'phaser';

export default class SimpleTestScene extends Phaser.Scene {
  constructor() {
    super('SimpleTestScene');
  }

  preload() {
    console.log('🎮 SimpleTestScene: 开始预加载');
    
    // 只加载一个简单的图片来测试
    this.load.image('test-image', '/assets/topdown/images/main_menu_background.png');
  }

  create() {
    console.log('🎮 SimpleTestScene: 场景创建');
    
    // 添加一个简单的文本
    this.add.text(400, 300, '游戏引擎测试成功!', {
      fontSize: '32px',
      color: '#ffffff'
    }).setOrigin(0.5);

    // 添加一个简单的图片
    this.add.image(400, 400, 'test-image').setScale(0.5);

    // 3秒后切换到主菜单
    this.time.delayedCall(3000, () => {
      console.log('🎮 SimpleTestScene: 切换到主菜单');
      this.scene.start('MainMenuScene');
    });
  }
}
import * as Phaser from 'phaser';

export default class MainMenuScene extends Phaser.Scene {
  constructor() {
    super({ key: 'MainMenuScene' });
  }

  create(): void {
    // 设置背景色
    this.cameras.main.setBackgroundColor('#000000');

    // 添加标题
    const title = this.add.text(
      this.cameras.main.width / 2,
      200,
      'Top-Down Game',
      {
        fontSize: '48px',
        color: '#ffffff',
        stroke: '#000000',
        strokeThickness: 4
      }
    );
    title.setOrigin(0.5);

    // 创建开始按钮
    const startButton = this.add.text(
      this.cameras.main.width / 2,
      350,
      'START GAME',
      {
        fontSize: '32px',
        color: '#ffff00',
        stroke: '#000000',
        strokeThickness: 2
      }
    );
    startButton.setOrigin(0.5);
    startButton.setInteractive();

    // 添加悬停效果
    startButton.on('pointerover', () => {
      startButton.setColor('#ffffff');
    });

    startButton.on('pointerout', () => {
      startButton.setColor('#ffff00');
    });

    startButton.on('pointerdown', () => {
      this.scene.start('GameScene');
    });

    // 添加说明文字
    const instructions = this.add.text(
      this.cameras.main.width / 2,
      450,
      'Use WASD or Arrow Keys to move\nPress SPACE to interact',
      {
        fontSize: '16px',
        color: '#cccccc',
        align: 'center'
      }
    );
    instructions.setOrigin(0.5);
  }
}
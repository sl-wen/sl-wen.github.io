import * as Phaser from 'phaser';
import { GAME_CONSTANTS, MENU_CONFIG } from '../constants/gameConstants';

export default class GameOverScene extends Phaser.Scene {
  private restartButton!: Phaser.GameObjects.Text;
  private mainMenuButton!: Phaser.GameObjects.Text;
  private selectedIndex: number = 0;
  private menuItems: Phaser.GameObjects.Text[] = [];

  constructor() {
    super({ key: 'GameOverScene' });
  }

  create(): void {
    // 添加背景
    this.add.image(0, 0, 'game_over_background').setOrigin(0, 0);

    // 添加游戏结束标题
    const title = this.add.text(
      this.cameras.main.width / 2,
      150,
      'GAME OVER',
      {
        fontFamily: GAME_CONSTANTS.FONTS.PRIMARY,
        fontSize: '48px',
        color: '#ff0000',
        stroke: '#000000',
        strokeThickness: 6
      }
    );
    title.setOrigin(0.5);

    // 添加游戏统计信息
    this.addGameStats();

    // 创建菜单项
    this.createMenuItems();

    // 设置输入控制
    this.setupInput();

    // 添加淡入效果
    this.cameras.main.fadeIn(1000, 0, 0, 0);
  }

  private addGameStats(): void {
    // 这里可以添加游戏统计信息，比如得分、游戏时间等
    const statsY = 250;
    const stats = [
      'Game Statistics:',
      'Time Played: 00:00:00',
      'Items Collected: 0',
      'NPCs Talked: 0',
      'Areas Explored: 1'
    ];

    stats.forEach((stat, index) => {
      const text = this.add.text(
        this.cameras.main.width / 2,
        statsY + (index * 30),
        stat,
        {
          fontFamily: GAME_CONSTANTS.FONTS.SECONDARY,
          fontSize: index === 0 ? '20px' : '16px',
          color: '#ffffff',
          align: 'center'
        }
      );
      text.setOrigin(0.5);
    });
  }

  private createMenuItems(): void {
    const menuConfig = MENU_CONFIG.GAME_OVER_MENU;
    const startY = 450;
    const spacing = 60;

    menuConfig.forEach((item, index) => {
      const menuItem = this.add.text(
        this.cameras.main.width / 2,
        startY + (index * spacing),
        item.label,
        {
          fontFamily: GAME_CONSTANTS.FONTS.PRIMARY,
          fontSize: '24px',
          color: index === 0 ? '#ffff00' : '#ffffff',
          stroke: '#000000',
          strokeThickness: 2
        }
      );
      menuItem.setOrigin(0.5);
      menuItem.setInteractive();

      // 添加悬停效果
      menuItem.on('pointerover', () => {
        this.selectMenuItem(index);
      });

      menuItem.on('pointerdown', () => {
        this.handleMenuItemClick(item.action);
      });

      this.menuItems.push(menuItem);
    });

    this.selectedIndex = 0;
  }

  private setupInput(): void {
    // 键盘控制
    this.input.keyboard?.on('keydown-UP', () => {
      this.selectMenuItem(Math.max(0, this.selectedIndex - 1));
    });

    this.input.keyboard?.on('keydown-DOWN', () => {
      this.selectMenuItem(Math.min(this.menuItems.length - 1, this.selectedIndex + 1));
    });

    this.input.keyboard?.on('keydown-ENTER', () => {
      const selectedItem = MENU_CONFIG.GAME_OVER_MENU[this.selectedIndex];
      this.handleMenuItemClick(selectedItem.action);
    });

    this.input.keyboard?.on('keydown-SPACE', () => {
      const selectedItem = MENU_CONFIG.GAME_OVER_MENU[this.selectedIndex];
      this.handleMenuItemClick(selectedItem.action);
    });
  }

  private selectMenuItem(index: number): void {
    // 重置所有菜单项颜色
    this.menuItems.forEach((item, i) => {
      item.setColor(i === index ? '#ffff00' : '#ffffff');
    });

    this.selectedIndex = index;

    // 播放选择音效
    // this.sound.play('menu_select');
  }

  private handleMenuItemClick(action: string): void {
    // 播放点击音效
    // this.sound.play('menu_click');

    switch (action) {
      case 'restart_game':
        this.restartGame();
        break;
      case 'return_to_main':
        this.returnToMainMenu();
        break;
      default:
        console.warn('Unknown menu action:', action);
    }
  }

  private restartGame(): void {
    // 添加淡出效果
    this.cameras.main.fadeOut(500, 0, 0, 0);
    
    this.cameras.main.once('camerafadeoutcomplete', () => {
      this.scene.start('GameScene');
    });
  }

  private returnToMainMenu(): void {
    // 添加淡出效果
    this.cameras.main.fadeOut(500, 0, 0, 0);
    
    this.cameras.main.once('camerafadeoutcomplete', () => {
      this.scene.start('MainMenuScene');
    });
  }
}
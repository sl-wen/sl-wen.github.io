import Phaser from 'phaser';
import { GAME_CONSTANTS, MENU_CONFIG } from '../constants/gameConstants';

export default class MainMenuScene extends Phaser.Scene {
  private startButton!: Phaser.GameObjects.Text;
  private settingsButton!: Phaser.GameObjects.Text;
  private creditsButton!: Phaser.GameObjects.Text;
  private selectedIndex: number = 0;
  private menuItems: Phaser.GameObjects.Text[] = [];

  constructor() {
    super({ key: 'MainMenuScene' });
  }

  create(): void {
    // 添加背景
    this.add.image(0, 0, 'main_menu_background').setOrigin(0, 0);

    // 添加标题
    const title = this.add.text(
      this.cameras.main.width / 2,
      100,
      GAME_CONSTANTS.TITLE,
      {
        fontFamily: GAME_CONSTANTS.FONTS.PRIMARY,
        fontSize: '32px',
        color: '#ffffff',
        stroke: '#000000',
        strokeThickness: 4
      }
    );
    title.setOrigin(0.5);

    // 创建菜单项
    this.createMenuItems();

    // 设置输入控制
    this.setupInput();

    // 添加版本信息
    const versionText = this.add.text(
      this.cameras.main.width - 20,
      this.cameras.main.height - 20,
      `v${GAME_CONSTANTS.VERSION}`,
      {
        fontFamily: GAME_CONSTANTS.FONTS.SECONDARY,
        fontSize: '12px',
        color: '#ffffff'
      }
    );
    versionText.setOrigin(1);

    // 添加作者信息
    const authorText = this.add.text(
      20,
      this.cameras.main.height - 20,
      `By ${GAME_CONSTANTS.AUTHOR}`,
      {
        fontFamily: GAME_CONSTANTS.FONTS.SECONDARY,
        fontSize: '12px',
        color: '#ffffff'
      }
    );
    authorText.setOrigin(0, 1);
  }

  private createMenuItems(): void {
    const menuConfig = MENU_CONFIG.MAIN_MENU;
    const startY = 300;
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
      const selectedItem = MENU_CONFIG.MAIN_MENU[this.selectedIndex];
      this.handleMenuItemClick(selectedItem.action);
    });

    this.input.keyboard?.on('keydown-SPACE', () => {
      const selectedItem = MENU_CONFIG.MAIN_MENU[this.selectedIndex];
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
      case 'start_game':
        this.startGame();
        break;
      case 'open_settings':
        this.openSettings();
        break;
      case 'show_credits':
        this.showCredits();
        break;
      default:
        console.warn('Unknown menu action:', action);
    }
  }

  private startGame(): void {
    // 添加淡出效果
    this.cameras.main.fadeOut(500, 0, 0, 0);
    
    this.cameras.main.once('camerafadeoutcomplete', () => {
      this.scene.start('GameScene');
    });
  }

  private openSettings(): void {
    // 显示设置菜单
    this.showSettingsMenu();
  }

  private showCredits(): void {
    // 显示制作人员名单
    this.showCreditsScreen();
  }

  private showSettingsMenu(): void {
    // 创建设置菜单UI
    const settingsMenu = this.add.container(0, 0);

    // 背景遮罩
    const background = this.add.rectangle(
      0, 0,
      this.cameras.main.width,
      this.cameras.main.height,
      0x000000, 0.8
    );
    background.setOrigin(0, 0);

    // 设置标题
    const title = this.add.text(
      this.cameras.main.width / 2,
      200,
      'SETTINGS',
      {
        fontFamily: GAME_CONSTANTS.FONTS.PRIMARY,
        fontSize: '28px',
        color: '#ffffff'
      }
    );
    title.setOrigin(0.5);

    // 返回按钮
    const backButton = this.add.text(
      this.cameras.main.width / 2,
      500,
      'BACK',
      {
        fontFamily: GAME_CONSTANTS.FONTS.PRIMARY,
        fontSize: '20px',
        color: '#ffffff'
      }
    );
    backButton.setOrigin(0.5);
    backButton.setInteractive();

    backButton.on('pointerdown', () => {
      settingsMenu.destroy();
    });

    settingsMenu.add([background, title, backButton]);
  }

  private showCreditsScreen(): void {
    // 创建制作人员名单UI
    const creditsContainer = this.add.container(0, 0);

    // 背景遮罩
    const background = this.add.rectangle(
      0, 0,
      this.cameras.main.width,
      this.cameras.main.height,
      0x000000, 0.9
    );
    background.setOrigin(0, 0);

    // 制作人员名单
    const credits = [
      'CREDITS',
      '',
      'Game Developer',
      'Based on original by blopa',
      '',
      'Special Thanks:',
      'Phaser.io - photonstorm',
      'Grid Engine - Annoraaq',
      'Sprites - ArMM1998, PixElthen',
      'Backgrounds - jkjkke, KnoblePersona',
      '',
      'Press any key to return'
    ];

    credits.forEach((line, index) => {
      const text = this.add.text(
        this.cameras.main.width / 2,
        150 + (index * 30),
        line,
        {
          fontFamily: GAME_CONSTANTS.FONTS.PRIMARY,
          fontSize: index === 0 ? '24px' : '16px',
          color: '#ffffff',
          align: 'center'
        }
      );
      text.setOrigin(0.5);
      creditsContainer.add(text);
    });

    creditsContainer.add(background);

    // 监听任意键返回
    const returnHandler = () => {
      creditsContainer.destroy();
      this.input.keyboard?.off('keydown', returnHandler);
    };

    this.input.keyboard?.on('keydown', returnHandler);
  }
}
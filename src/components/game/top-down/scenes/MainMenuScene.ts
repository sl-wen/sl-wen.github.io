import * as Phaser from 'phaser';
import { SoundManager } from '../systems/SoundManager';

export default class MainMenuScene extends Phaser.Scene {
  private soundManager: SoundManager;

  constructor() {
    super('MainMenuScene');
  }

  preload() {
    // 主菜单场景不需要额外加载资源
  }

  create() {
    console.log('MainMenuScene: 创建主菜单');
    
    const { width: gameWidth, height: gameHeight } = this.cameras.main;

    // 添加游戏Logo
    this.add.image(gameWidth / 2, Math.ceil(gameHeight / 10), 'game_logo')
      .setOrigin(0.5, 0)
      .setDepth(1);

    // 添加背景图片
    const scale = Math.max(Math.ceil(gameWidth / 480), Math.ceil(gameHeight / 216));
    this.add.image(0, 0, 'main_menu_background')
      .setScale(scale)
      .setDepth(0)
      .setOrigin(0, 0);

    // 初始化音效管理器
    this.soundManager = SoundManager.getInstance();
    this.soundManager.initialize(this);
    
    // 播放主菜单背景音乐
    this.soundManager.playBackgroundMusic('menu');

    // 触发菜单事件
    const customEvent = new CustomEvent('menu-items', {
      detail: {
        menuItems: ['开始游戏', '设置', '退出'],
        menuPosition: 'center',
      },
    });

    window.dispatchEvent(customEvent);

    // 监听菜单选择事件
    const gameMenuSelectedEventListener = ({ detail }: any) => {
      switch (detail.selectedItem) {
        case '开始游戏': {
          this.soundManager.playSoundEffect('ui_click');
          this.scene.start('CompleteGameScene', {
            heroStatus: {
              position: { x: 4, y: 3 },
              previousPosition: { x: 4, y: 3 },
              frame: 'hero_idle_down_01',
              facingDirection: 'down',
              health: 100,
              maxHealth: 100,
              coin: 0,
              canPush: false,
              haveSword: false,
              level: 1,
              experience: 0
            },
            mapKey: 'home_page_city_house_01',
          });
          break;
        }

        case '设置': {
          this.soundManager.playSoundEffect('ui_click');
          // 触发设置菜单事件
          const settingsEvent = new CustomEvent('show-settings', {
            detail: { show: true }
          });
          window.dispatchEvent(settingsEvent);
          break;
        }

        case '退出': {
          this.soundManager.playSoundEffect('ui_click');
          // 在Web环境中，重新加载页面
          window.location.reload();
          break;
        }

        default: {
          break;
        }
      }

      window.removeEventListener('menu-item-selected', gameMenuSelectedEventListener);
    };

    window.addEventListener('menu-item-selected', gameMenuSelectedEventListener);

    // 添加键盘快捷键
    this.input.keyboard.on('keydown-ENTER', () => {
      this.soundManager.playSoundEffect('ui_click');
      this.scene.start('CompleteGameScene', {
        heroStatus: {
          position: { x: 4, y: 3 },
          previousPosition: { x: 4, y: 3 },
          frame: 'hero_idle_down_01',
          facingDirection: 'down',
          health: 100,
          maxHealth: 100,
          coin: 0,
          canPush: false,
          haveSword: false,
          level: 1,
          experience: 0
        },
        mapKey: 'home_page_city_house_01',
      });
    });

    // 添加版本信息
    this.add.text(
      gameWidth - 10,
      gameHeight - 10,
      'v3.0.0',
      {
        fontFamily: '"Press Start 2P"',
        fontSize: '8px',
        fill: '#ffffff',
        color: '#ffffff',
      }
    ).setOrigin(1, 1).setDepth(2);

    // 添加提示文本
    this.add.text(
      gameWidth / 2,
      gameHeight - 30,
      '按回车键快速开始游戏',
      {
        fontFamily: '"Press Start 2P"',
        fontSize: '8px',
        fill: '#ffffff',
        color: '#ffffff',
      }
    ).setOrigin(0.5, 0.5).setDepth(2);
  }

  update() {
    // 主菜单场景的更新逻辑
  }
}
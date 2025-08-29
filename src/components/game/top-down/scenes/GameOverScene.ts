import * as Phaser from 'phaser';
import { SoundManager } from '../systems/SoundManager';

export default class GameOverScene extends Phaser.Scene {
  private soundManager!: SoundManager;

  constructor() {
    super('GameOverScene');
  }

  preload() {
    // 游戏结束场景不需要额外加载资源
  }

  create() {
    console.log('GameOverScene: 游戏结束');
    
    const fontSize = 24;
    const { width: gameWidth, height: gameHeight } = this.cameras.main;

    // 初始化音效管理器
    this.soundManager = SoundManager.getInstance();
    this.soundManager.initialize(this);

    // 添加游戏结束文本
    const gameOverText = this.add.text(
      gameWidth / 2,
      Math.ceil(gameHeight / 5),
      '游戏结束',
      {
        fontFamily: '"Press Start 2P"',
        fontSize: `${fontSize}px`,
        color: '#ffffff',
      }
    ).setDepth(10).setOrigin(0.5, 0.5);

    // 添加背景图片
    const scale = Math.max(Math.ceil(gameWidth / 220), Math.ceil(gameHeight / 124));
    this.add.image(0, 0, 'game_over_background')
      .setScale(scale)
      .setDepth(0)
      .setOrigin(0, 0);

    // 添加游戏统计信息
    this.addGameStats();

    // 触发菜单事件
    const customEvent = new CustomEvent('menu-items', {
      detail: {
        menuItems: ['重新开始', '返回主菜单', '退出游戏'],
        menuPosition: 'center',
      },
    });

    window.dispatchEvent(customEvent);

    // 监听菜单选择事件
    const gameMenuSelectedEventListener = ({ detail }: any) => {
      switch (detail.selectedItem) {
        case '重新开始': {
          this.soundManager.playSoundEffect('ui_click');
          // 重新开始游戏，保持当前角色状态
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

        case '返回主菜单': {
          this.soundManager.playSoundEffect('ui_click');
          this.scene.start('MainMenuScene');
          break;
        }

        case '退出游戏': {
          this.soundManager.playSoundEffect('ui_click');
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
    this.input.keyboard?.on('keydown-R', () => {
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

    this.input.keyboard?.on('keydown-M', () => {
      this.soundManager.playSoundEffect('ui_click');
      this.scene.start('MainMenuScene');
    });

    this.input.keyboard?.on('keydown-ESC', () => {
      this.soundManager.playSoundEffect('ui_click');
      window.location.reload();
    });

    // 添加提示文本
    this.add.text(
      gameWidth / 2,
      gameHeight - 40,
      'R: 重新开始 | M: 主菜单 | ESC: 退出',
      {
        fontFamily: '"Press Start 2P"',
        fontSize: '8px',
        color: '#ffffff',
      }
    ).setOrigin(0.5, 0.5).setDepth(2);
  }

  private addGameStats() {
    const { width: gameWidth, height: gameHeight } = this.cameras.main;
    
    // 这里可以添加游戏统计信息，比如：
    // - 游戏时长
    // - 击败敌人数量
    // - 收集物品数量
    // - 完成的任务数量
    // - 获得的经验值
    
    const statsText = this.add.text(
      gameWidth / 2,
      gameHeight / 2,
      '游戏统计\n\n击败敌人: 0\n收集物品: 0\n完成任务: 0\n游戏时长: 0分钟',
      {
        fontFamily: '"Press Start 2P"',
        fontSize: '12px',
        color: '#ffffff',
        align: 'center',
      }
    ).setOrigin(0.5, 0.5).setDepth(2);
  }

  update() {
    // 游戏结束场景的更新逻辑
  }
}
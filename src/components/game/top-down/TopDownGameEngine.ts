import * as Phaser from 'phaser';
import { TopDownGameScene } from './scenes/TopDownGameScene';
// 引用场景集成
import BootScene from './ref/scenes/BootScene';
import MainMenuScene from './ref/scenes/MainMenuScene';
import GameOverScene from './ref/scenes/GameOverScene';
import GameScene from './ref/scenes/GameScene';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import GridEngine from 'grid-engine';

export interface GameConfig {
  width: number;
  height: number;
  parent: HTMLElement;
  type: number;
  backgroundColor: string;
  physics: {
    default: string;
    arcade: {
      gravity: { x: number; y: number };
      debug: boolean;
    };
  };
  scene: any;
}

export class TopDownGameEngine {
  private game: Phaser.Game;
  private scene: TopDownGameScene;

  constructor(container: HTMLElement, config: GameConfig) {
    console.log('TopDownGameEngine: 开始创建游戏实例');
    
    // 创建Phaser游戏配置
    const gameConfig: Phaser.Types.Core.GameConfig = {
      type: Phaser.AUTO,
      width: config.width,
      height: config.height,
      parent: container,
      backgroundColor: config.backgroundColor,
      physics: {
        default: 'arcade',
        arcade: {
          gravity: { x: 0, y: 0 },
          debug: false
        }
      },
      scene: [BootScene, MainMenuScene, GameScene, GameOverScene],
      scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH
      },
      plugins: {
        scene: [
          {
            key: 'gridEngine',
            plugin: GridEngine,
            mapping: 'gridEngine',
          },
        ],
      },
      render: {
        pixelArt: true,
        antialias: false
      },
      input: {
        touch: {
          capture: false // 不捕获所有触摸事件，允许事件冒泡到UI层
        },
        keyboard: true,
        mouse: true,
        gamepad: false
      }
    };

    // 创建游戏实例
    this.game = new Phaser.Game(gameConfig);
    
    // 设置画布样式，确保触摸事件能够正确传播
    const canvas = this.game.canvas;
    if (canvas) {
      canvas.style.touchAction = 'manipulation';
      canvas.style.webkitTouchCallout = 'none';
      canvas.style.webkitUserSelect = 'none';
      canvas.style.userSelect = 'none';
    }
    
    // 监听场景启动事件
    this.game.events.on('start', (scene: Phaser.Scene) => {
      console.log('TopDownGameEngine: 场景启动:', scene.scene.key);
    });
    
    // 监听场景创建事件
    this.game.events.on('create', (scene: Phaser.Scene) => {
      console.log('TopDownGameEngine: 场景创建:', scene.scene.key);
    });
    
    // 确保BootScene启动
    if (this.game.scene.isActive('BootScene')) {
      console.log('TopDownGameEngine: BootScene已激活');
    } else {
      console.log('TopDownGameEngine: 启动BootScene');
      this.game.scene.start('BootScene');
    }
    
    // 不再使用占位 TopDownGameScene，这里由 BootScene 启动
    // 保留引用为兼容接口
    this.scene = (null as unknown) as TopDownGameScene;
  }

  public destroy(): void {
    if (this.game) {
      this.game.destroy(true);
    }
  }

  public getGame(): Phaser.Game {
    return this.game;
  }

  public getScene(): TopDownGameScene {
    return this.scene;
  }

  public pause(): void {
    this.game.scene.pause('TopDownGameScene');
  }

  public resume(): void {
    this.game.scene.resume('TopDownGameScene');
  }
}

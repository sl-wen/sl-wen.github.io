import * as Phaser from 'phaser';
import { TopDownGameScene } from './scenes/TopDownGameScene';
// Reference scenes integration
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import BootScene from './ref/scenes/BootScene.js';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import MainMenuScene from './ref/scenes/MainMenuScene.js';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import GameOverScene from './ref/scenes/GameOverScene.js';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import GameScene from './ref/scenes/GameScene.js';
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
      }
    };

    // 创建游戏实例
    this.game = new Phaser.Game(gameConfig);
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

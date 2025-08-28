import * as Phaser from 'phaser';
import { TopDownGameScene } from './scenes/TopDownGameScene';

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
      scene: TopDownGameScene,
      scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH
      },
      render: {
        pixelArt: true,
        antialias: false
      }
    };

    // 创建游戏实例
    this.game = new Phaser.Game(gameConfig);
    
    // 获取场景引用
    this.scene = this.game.scene.getScene('TopDownGameScene') as TopDownGameScene;
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

  import * as Phaser from 'phaser';
import { GameScene } from './scenes/GameScene';
import { PreloadScene } from './scenes/PreloadScene';
import { UIScene } from './scenes/UIScene';

export class RPGGame {
  public game: Phaser.Game;

  constructor(container: HTMLElement) {
    const config: Phaser.Types.Core.GameConfig = {
      type: Phaser.AUTO,
      width: 800,
      height: 600,
      parent: container,
      backgroundColor: '#2c3e50',
      scale: {
        mode: Phaser.Scale.RESIZE,
        autoCenter: Phaser.Scale.CENTER_BOTH,
        width: 800,
        height: 600,
        min: {
          width: 360,
          height: 360
        },
        max: {
          width: 2048,
          height: 1536
        },
        // Enable fullscreen on mobile
        fullscreenTarget: container,
        expandParent: true,
        autoRound: true
      },
      physics: {
        default: 'arcade',
        arcade: {
          gravity: { x: 0, y: 0 },
          debug: false
        }
      },
      scene: [PreloadScene, GameScene, UIScene],
      render: {
        pixelArt: true,
        antialias: false
      }
    };

    this.game = new Phaser.Game(config);
  }

  destroy() {
    if (this.game) {
      this.game.destroy(true);
    }
  }
}
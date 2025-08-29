import * as Phaser from 'phaser';
import GridEngine from 'grid-engine';

// 导入所有场景
import BootScene from './scenes/BootScene';
import MainMenuScene from './scenes/MainMenuScene';
import CompleteGameScene from './scenes/CompleteGameScene';
import GameOverScene from './scenes/GameOverScene';

interface GameConfig {
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
  scene: any[];
}

export class TopDownGameEngine {
  private game: Phaser.Game;
  private scene: any;

  constructor(container: HTMLElement, config: GameConfig) {
    console.log('TopDownGameEngine: 初始化游戏引擎');

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
      scene: [
        BootScene,
        MainMenuScene,
        CompleteGameScene,
        GameOverScene
      ],
      scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH
      },
      plugins: {
        scene: [
          {
            key: 'gridEngine',
            plugin: GridEngine,
            mapping: 'gridEngine'
          }
        ]
      },
      render: {
        pixelArt: true,
        antialias: false
      },
      input: {
        touch: {
          capture: false
        },
        keyboard: true,
        mouse: true,
        gamepad: false
      },
      audio: {
        disableWebAudio: false
      }
    };

    this.game = new Phaser.Game(gameConfig);

    // 设置Canvas样式以支持触摸事件
    const canvas = this.game.canvas;
    if (canvas) {
      canvas.style.touchAction = 'none';
      canvas.style.userSelect = 'none';
      canvas.style.webkitUserSelect = 'none';
      canvas.style.webkitTouchCallout = 'none';
    }

    // 监听游戏事件
    this.game.events.on('start', (scene: Phaser.Scene) => {
      console.log(`场景启动: ${scene.scene.key}`);
    });

    this.game.events.on('create', (scene: Phaser.Scene) => {
      console.log(`场景创建: ${scene.scene.key}`);
    });

    // 启动BootScene
    if (this.game.scene.isActive('BootScene')) {
      console.log('BootScene已激活');
    } else {
      this.game.scene.start('BootScene');
    }

    this.scene = null;
  }

  destroy(): void {
    if (this.game) {
      this.game.destroy(true);
      this.game = null;
    }
  }

  getGame(): Phaser.Game | null {
    return this.game;
  }

  getScene(): any {
    return this.scene;
  }

  pause(): void {
    if (this.game) {
      this.game.scene.pause();
    }
  }

  resume(): void {
    if (this.game) {
      this.game.scene.resume();
    }
  }

  // 场景管理方法
  startScene(sceneKey: string, data?: any): void {
    if (this.game) {
      this.game.scene.start(sceneKey, data);
    }
  }

  pauseScene(sceneKey: string): void {
    if (this.game) {
      this.game.scene.pause(sceneKey);
    }
  }

  resumeScene(sceneKey: string): void {
    if (this.game) {
      this.game.scene.resume(sceneKey);
    }
  }

  stopScene(sceneKey: string): void {
    if (this.game) {
      this.game.scene.stop(sceneKey);
    }
  }

  // 游戏状态方法
  isRunning(): boolean {
    return this.game !== null && !this.game.isDestroyed;
  }

  getGameSize(): { width: number; height: number } {
    if (this.game) {
      return {
        width: this.game.scale.width,
        height: this.game.scale.height
      };
    }
    return { width: 0, height: 0 };
  }

  // 调试方法
  enableDebug(): void {
    if (this.game && this.game.physics) {
      this.game.physics.config.debug = true;
    }
  }

  disableDebug(): void {
    if (this.game && this.game.physics) {
      this.game.physics.config.debug = false;
    }
  }
}

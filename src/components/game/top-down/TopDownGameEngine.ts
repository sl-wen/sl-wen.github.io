import GridEngine from 'grid-engine';
import * as Phaser from 'phaser';

// 导入所有场景
import BootScene from './scenes/BootScene';
import CompleteGameScene from './scenes/CompleteGameScene';
import GameOverScene from './scenes/GameOverScene';
import MainMenuScene from './scenes/MainMenuScene';
import SimpleTestScene from './scenes/SimpleTestScene';

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
  private game: Phaser.Game | null;
  private scene: any;

  constructor(container: HTMLElement, config: GameConfig) {
    console.log('🎮 [DEBUG] TopDownGameEngine: 初始化游戏引擎');
    console.log('📋 [DEBUG] 游戏配置:', {
      container: container,
      config: config,
      containerRect: container.getBoundingClientRect(),
      containerStyle: window.getComputedStyle(container)
    });

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
        SimpleTestScene,
        BootScene,
        MainMenuScene,
        CompleteGameScene,
        GameOverScene
      ],
      scale: {
        mode: Phaser.Scale.RESIZE,
        autoCenter: Phaser.Scale.CENTER_BOTH,
        width: config.width,
        height: config.height,
        min: {
          width: 320,
          height: 180
        },
        max: {
          width: 2560,
          height: 1440
        },
        expandParent: true,
        autoRound: true
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
    
    // 启动测试场景
    this.game.scene.start('SimpleTestScene');

    console.log('🎯 [DEBUG] Phaser游戏创建完成:', {
      game: this.game,
      canvas: this.game.canvas,
      canvasRect: this.game.canvas?.getBoundingClientRect(),
      canvasStyle: this.game.canvas ? window.getComputedStyle(this.game.canvas) : null,
      scale: this.game.scale,
      scaleSize: {
        width: this.game.scale.width,
        height: this.game.scale.height
      }
    });

    // 设置Canvas样式以支持触摸事件
    const canvas = this.game.canvas;
    if (canvas) {
      canvas.style.touchAction = 'none';
      canvas.style.userSelect = 'none';
      canvas.style.webkitUserSelect = 'none';
      (canvas.style as any).webkitTouchCallout = 'none';

      console.log('🎨 [DEBUG] Canvas样式设置完成:', {
        canvas: canvas,
        finalStyle: {
          touchAction: canvas.style.touchAction,
          userSelect: canvas.style.userSelect,
          webkitUserSelect: canvas.style.webkitUserSelect,
          width: canvas.style.width,
          height: canvas.style.height
        }
      });
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
    return this.game as Phaser.Game | null;
  }

  getScene(): any {
    return this.scene;
  }

  pause(): void {
    if (this.game) {
      this.game.scene.pause('BootScene');
    }
  }

  resume(): void {
    if (this.game) {
      this.game.scene.resume('BootScene');
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
    return this.game !== null && !(this.game as any).isDestroyed;
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
    if (this.game && (this.game as any).physics) {
      (this.game as any).physics.config.debug = true;
    }
  }

  disableDebug(): void {
    if (this.game && (this.game as any).physics) {
      (this.game as any).physics.config.debug = false;
    }
  }
}

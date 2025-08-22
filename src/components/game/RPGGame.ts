import * as Phaser from 'phaser';
import { GameScene } from './scenes/GameScene';
import { PreloadScene } from './scenes/PreloadScene';
import { UIScene } from './scenes/UIScene';

// RPG游戏主类 - 负责初始化和管理整个Phaser游戏实例
export class RPGGame {
  public game: Phaser.Game; // Phaser游戏实例的公共引用

  // 构造函数 - 创建并配置Phaser游戏实例
  constructor(container: HTMLElement) {
    // Phaser游戏配置对象 - 定义游戏的各项参数和设置
    const config: Phaser.Types.Core.GameConfig = {
      type: Phaser.AUTO, // 自动选择渲染器（WebGL优先，Canvas备用）
      width: 800, // 游戏画布基础宽度
      height: 600, // 游戏画布基础高度
      parent: container, // 游戏挂载的DOM容器元素
      backgroundColor: '#87CEEB', // 天空蓝色背景，符合农场主题

      // 缩放和响应式配置 - 确保游戏在不同设备上正常显示
      scale: {
        mode: Phaser.Scale.RESIZE, // 响应式缩放模式，跟随容器大小变化
        autoCenter: Phaser.Scale.CENTER_BOTH, // 在容器中居中显示
        width: 800, // 缩放基准宽度
        height: 600, // 缩放基准高度
        min: {
          width: 360, // 最小宽度，确保移动端可用性
          height: 360 // 最小高度，确保移动端可用性
        },
        max: {
          width: 2048, // 最大宽度，适配大屏设备
          height: 1536 // 最大高度，适配大屏设备
        },
        fullscreenTarget: container, // 全屏模式的目标容器
        expandParent: true, // 允许扩展父容器
        autoRound: true // 自动取整，避免模糊
      },

      // 物理引擎配置 - 设置游戏的物理系统
      physics: {
        default: 'arcade', // 使用Arcade物理引擎（轻量级，适合2D游戏）
        arcade: {
          gravity: { x: 0, y: 0 }, // 无重力设置（俯视角游戏）
          debug: false // 关闭物理调试显示（生产环境）
        }
      },

      // 游戏场景配置 - 定义游戏的各个场景及加载顺序
      scene: [PreloadScene, GameScene, UIScene],
      // PreloadScene: 资源预加载场景
      // GameScene: 主游戏场景，包含游戏逻辑
      // UIScene: 用户界面场景，管理UI元素

      // 渲染配置 - 优化像素艺术风格的显示
      render: {
        pixelArt: true, // 启用像素艺术模式，保持像素清晰
        antialias: false // 关闭抗锯齿，保持像素风格
      }
    };

    // 创建Phaser游戏实例
    this.game = new Phaser.Game(config);
  }

  // 销毁游戏实例 - 清理资源，防止内存泄漏
  destroy() {
    if (this.game) {
      this.game.destroy(true); // 完全销毁游戏实例和相关资源
    }
  }
}
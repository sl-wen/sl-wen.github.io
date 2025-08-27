import * as Phaser from 'phaser';
import { GameScene } from './scenes/GameScene';
import { PreloadScene } from './scenes/PreloadScene';
import { UIScene } from './scenes/UIScene';

/**
 * RPG游戏主类
 * 负责初始化和管理整个Phaser游戏实例
 * 包括游戏配置、场景管理、资源清理等
 */
export class RPGGame {
  public game: Phaser.Game;  // Phaser游戏实例的公共引用

  /**
   * 设置全屏模式
   * 通知游戏场景全屏状态变化
   * @param isFullscreen 是否处于全屏模式
   */
  public setFullscreenMode(isFullscreen: boolean) {
    try {
      // 检查游戏实例是否存在
      if (!this.game) {
        console.warn('Game instance is not initialized, skipping fullscreen mode setting');
        return;
      }

      // 检查场景管理器是否存在
      if (!this.game.scene) {
        console.warn('Game scene manager is not initialized, skipping fullscreen mode setting');
        return;
      }

      // 获取当前活跃的GameScene
      const gameScene = this.game.scene.getScene('GameScene');
      if (gameScene && typeof (gameScene as any).setFullscreenMode === 'function') {
        (gameScene as any).setFullscreenMode(isFullscreen);
        console.log(`RPGGame fullscreen mode set to: ${isFullscreen}`);
      } else {
        console.warn('GameScene not found or setFullscreenMode method not available');
      }
    } catch (error) {
      console.error('Error setting fullscreen mode in RPGGame:', error);
      // Don't throw the error to prevent application crash
    }
  }

  /**
   * 构造函数
   * 创建并配置Phaser游戏实例
   * @param container 游戏容器DOM元素
   */
  constructor(container: HTMLElement) {
    console.log('RPGGame constructor called with container:', container);
    console.log('Container details:', {
      tagName: container?.tagName,        // 容器标签名
      id: container?.id,                  // 容器ID
      className: container?.className,    // 容器类名
      clientWidth: container?.clientWidth,    // 客户端宽度
      clientHeight: container?.clientHeight,  // 客户端高度
      offsetWidth: container?.offsetWidth,    // 偏移宽度
      offsetHeight: container?.offsetHeight,  // 偏移高度
      parentElement: container?.parentElement // 父元素
    });

    if (!container) {
      throw new Error('Game container element is required');  // 容器元素必需
    }

    if (!container.parentElement) {
      throw new Error('Game container must be attached to DOM');  // 容器必须附加到DOM
    }

    if (container.clientWidth === 0 || container.clientHeight === 0) {
      console.warn('Container has zero dimensions, this may cause rendering issues');  // 容器尺寸为0可能导致渲染问题
    }

    // Phaser游戏配置对象 - 定义游戏的各项参数和设置
    const config: Phaser.Types.Core.GameConfig = {
      type: Phaser.AUTO,        // 自动选择渲染器（WebGL优先，Canvas备用）
      width: 800,               // 游戏画布基础宽度
      height: 600,              // 游戏画布基础高度
      parent: container,        // 游戏挂载的DOM容器元素
      backgroundColor: '#87CEEB', // 天空蓝色背景，符合农场主题

      // 缩放和响应式配置 - 确保游戏在不同设备上正常显示
      scale: {
        mode: Phaser.Scale.RESIZE,           // 响应式缩放模式，跟随容器大小变化
        autoCenter: Phaser.Scale.CENTER_BOTH, // 在容器中居中显示
        width: 800,                          // 缩放基准宽度
        height: 600,                         // 缩放基准高度
        min: {
          width: 360,   // 最小宽度，确保移动端可用性
          height: 360   // 最小高度，确保移动端可用性
        },
        max: {
          width: 2048,  // 最大宽度，适配大屏设备
          height: 1536  // 最大高度，适配大屏设备
        },
        fullscreenTarget: container,  // 全屏模式的目标容器
        expandParent: true,           // 允许扩展父容器
        autoRound: true               // 自动取整，避免模糊
      },

      // 物理引擎配置 - 设置游戏的物理系统
      physics: {
        default: 'arcade',  // 使用Arcade物理引擎（轻量级，适合2D游戏）
        arcade: {
          gravity: { x: 0, y: 0 },  // 无重力设置（俯视角游戏）
          debug: false,             // 关闭物理调试显示（生产环境）
          timeScale: 1,             // 物理时间缩放
          overlapBias: 4,           // 重叠偏差，提高碰撞检测精度
          tileBias: 16              // 瓦片偏差，优化瓦片地图碰撞
        }
      },

      // 游戏场景配置 - 定义游戏的各个场景及加载顺序
      scene: [PreloadScene, GameScene, UIScene],  // 场景加载顺序
      // PreloadScene: 资源预加载场景
      // GameScene: 主游戏场景，包含游戏逻辑
      // UIScene: 用户界面场景，管理UI元素

      // 渲染配置 - 优化像素艺术风格的显示和性能
      render: {
        pixelArt: true,                           // 启用像素艺术模式，保持像素清晰
        antialias: false,                         // 关闭抗锯齿，保持像素风格
        roundPixels: true,                        // 像素取整，避免模糊
        transparent: false,                       // 关闭透明度，提高性能
        clearBeforeRender: true,                  // 每帧清除画布，避免残影
        premultipliedAlpha: false,                // 关闭预乘Alpha，提高兼容性
        failIfMajorPerformanceCaveat: false,      // 即使性能较差也继续运行
        powerPreference: 'high-performance',      // 优先使用高性能GPU
        desynchronized: true                      // 允许异步渲染，提高性能
      },

      // 输入配置 - 优化触摸和鼠标输入
      input: {
        activePointers: 3,    // 支持多点触控，最多3个触点
        smoothFactor: 0.2,    // 输入平滑因子，减少抖动
        windowEvents: false,  // 不监听窗口事件，避免冲突
        keyboard: true,       // 启用键盘输入
        mouse: true,          // 启用鼠标输入
        touch: true,          // 启用触摸输入
        gamepad: false        // 关闭手柄支持，减少资源占用
      },

      // 音频配置 - 优化音频性能
      audio: {
        disableWebAudio: false,  // 启用Web Audio API
        noAudio: false           // 不禁用音频
      },

      // 横幅配置 - 隐藏Phaser启动横幅
      banner: {
        hidePhaser: true,                                    // 隐藏Phaser标识
        text: '#ffffff',                                     // 横幅文字颜色
        background: ['#16213e', '#1a252f', '#0f172a']       // 横幅背景色
      },

      // 性能优化配置
      fps: {
        target: 60,              // 目标帧率
        forceSetTimeOut: false,  // 不强制使用setTimeout
        deltaHistory: 10,        // 帧时间历史记录数量
        panicMax: 120,           // 最大恐慌值，防止帧率过低时卡死
        smoothStep: true         // 平滑帧时间步进
      },

      // 加载器配置 - 优化资源加载
      loader: {
        baseURL: '',                    // 基础URL
        path: '',                       // 资源路径
        maxParallelDownloads: 4,        // 最大并行下载数
        crossOrigin: 'anonymous',       // 跨域设置
        timeout: 10000                  // 加载超时时间（10秒）
      },

      // DOM配置 - 优化DOM元素创建
      dom: {
        createContainer: false,  // 不创建额外的DOM容器
        behindCanvas: false      // DOM元素不在画布后面
      }
    };

    // 创建Phaser游戏实例
    try {
      console.log('Creating Phaser game with config:', config);
      console.log('Container element before game creation:', container);
      console.log('Container is attached to DOM:', !!container.parentElement);
      console.log('Container dimensions:', {
        clientWidth: container.clientWidth,    // 客户端宽度
        clientHeight: container.clientHeight,  // 客户端高度
        offsetWidth: container.offsetWidth,    // 偏移宽度
        offsetHeight: container.offsetHeight   // 偏移高度
      });

      this.game = new Phaser.Game(config);  // 创建Phaser游戏实例
      console.log('Phaser game instance created successfully:', this.game);
      console.log('Game canvas created:', this.game.canvas);
      console.log('Game config applied:', this.game.config);
    } catch (error) {
      console.error('Failed to create Phaser game:', error);
      console.error('Error details:', {
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        container: container,
        containerParent: container.parentElement
      });
      throw new Error(`Phaser game creation failed: ${error instanceof Error ? error.message : String(error)}`);
    }

    // 添加游戏事件监听器
    this.game.events.on('ready', () => {
      console.log('Game initialized successfully');  // 游戏初始化成功
    });

    this.game.events.on('destroy', () => {
      console.log('Game destroyed');  // 游戏销毁
    });

    this.game.events.on('boot', () => {
      console.log('Game boot complete');  // 游戏启动完成
    });

    this.game.events.on('prestep', () => {
      // 游戏运行中
    });

    this.game.events.on('step', () => {
      // 游戏步进
    });

    // 监听窗口大小变化，动态调整游戏尺寸
    if (typeof window !== 'undefined') {
      window.addEventListener('resize', this.handleResize.bind(this));           // 窗口大小变化
      window.addEventListener('orientationchange', this.handleResize.bind(this)); // 屏幕方向变化
    }
  }

  /**
   * 处理窗口大小变化
   * 动态调整游戏尺寸以适应新的窗口大小
   */
  private handleResize() {
    if (this.game && this.game.scale) {
      // 延迟调整大小，等待浏览器完成布局
      setTimeout(() => {
        this.game.scale.refresh();  // 刷新游戏缩放
      }, 100);  // 延迟100ms
    }
  }

  /**
   * 销毁游戏实例
   * 清理资源，防止内存泄漏
   */
  destroy() {
    if (this.game) {
      // 移除事件监听器
      if (typeof window !== 'undefined') {
        window.removeEventListener('resize', this.handleResize.bind(this));           // 移除窗口大小变化监听
        window.removeEventListener('orientationchange', this.handleResize.bind(this)); // 移除方向变化监听
      }

      // 销毁游戏实例
      this.game.destroy(true);  // 完全销毁游戏实例和相关资源
    }
  }
}
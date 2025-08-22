import * as Phaser from 'phaser';
import { GameScene } from './scenes/GameScene';
import { PreloadScene } from './scenes/PreloadScene';
import { UIScene } from './scenes/UIScene';

// RPG游戏主类 - 负责初始化和管理整个Phaser游戏实例
export class RPGGame {
  public game: Phaser.Game; // Phaser游戏实例的公共引用

  // 构造函数 - 创建并配置Phaser游戏实例
  constructor(container: HTMLElement) {
    console.log('RPGGame constructor called with container:', container);
    console.log('Container details:', {
      tagName: container?.tagName,
      id: container?.id,
      className: container?.className,
      clientWidth: container?.clientWidth,
      clientHeight: container?.clientHeight,
      offsetWidth: container?.offsetWidth,
      offsetHeight: container?.offsetHeight,
      parentElement: container?.parentElement
    });
    
    if (!container) {
      throw new Error('Game container element is required');
    }
    
    if (!container.parentElement) {
      throw new Error('Game container must be attached to DOM');
    }
    
    if (container.clientWidth === 0 || container.clientHeight === 0) {
      console.warn('Container has zero dimensions, this may cause rendering issues');
    }
    
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
          debug: false, // 关闭物理调试显示（生产环境）
          timeScale: 1, // 物理时间缩放
          overlapBias: 4, // 重叠偏差，提高碰撞检测精度
          tileBias: 16 // 瓦片偏差，优化瓦片地图碰撞
        }
      },

      // 游戏场景配置 - 定义游戏的各个场景及加载顺序
      scene: [PreloadScene, GameScene, UIScene],
      // PreloadScene: 资源预加载场景
      // GameScene: 主游戏场景，包含游戏逻辑
      // UIScene: 用户界面场景，管理UI元素

      // 渲染配置 - 优化像素艺术风格的显示和性能
      render: {
        pixelArt: true, // 启用像素艺术模式，保持像素清晰
        antialias: false, // 关闭抗锯齿，保持像素风格
        roundPixels: true, // 像素取整，避免模糊
        transparent: false, // 关闭透明度，提高性能
        clearBeforeRender: true, // 每帧清除画布，避免残影
        premultipliedAlpha: false, // 关闭预乘Alpha，提高兼容性
        failIfMajorPerformanceCaveat: false, // 即使性能较差也继续运行
        powerPreference: 'high-performance', // 优先使用高性能GPU
        desynchronized: true // 允许异步渲染，提高性能
      },

      // 输入配置 - 优化触摸和鼠标输入
      input: {
        activePointers: 3, // 支持多点触控，最多3个触点
        smoothFactor: 0.2, // 输入平滑因子，减少抖动
        windowEvents: false, // 不监听窗口事件，避免冲突
        keyboard: true, // 启用键盘输入
        mouse: true, // 启用鼠标输入
        touch: true, // 启用触摸输入
        gamepad: false // 关闭手柄支持，减少资源占用
      },

      // 音频配置 - 优化音频性能
      audio: {
        disableWebAudio: false, // 启用Web Audio API
        noAudio: false // 不禁用音频
      },

      // 横幅配置 - 隐藏Phaser启动横幅
      banner: {
        hidePhaser: true, // 隐藏Phaser标识
        text: '#ffffff', // 横幅文字颜色
        background: ['#16213e', '#1a252f', '#0f172a'] // 横幅背景色
      },

      // 性能优化配置
      fps: {
        target: 60, // 目标帧率
        forceSetTimeOut: false, // 不强制使用setTimeout
        deltaHistory: 10, // 帧时间历史记录数量
        panicMax: 120, // 最大恐慌值，防止帧率过低时卡死
        smoothStep: true // 平滑帧时间步进
      },

      // 加载器配置 - 优化资源加载
      loader: {
        baseURL: '', // 基础URL
        path: '', // 资源路径
        maxParallelDownloads: 4, // 最大并行下载数
        crossOrigin: 'anonymous', // 跨域设置
        timeout: 10000 // 加载超时时间（10秒）
      },

      // DOM配置 - 优化DOM元素创建
      dom: {
        createContainer: false, // 不创建额外的DOM容器
        behindCanvas: false // DOM元素不在画布后面
      }
    };

    // 创建Phaser游戏实例
    try {
      console.log('Creating Phaser game with config:', config);
      console.log('Container element before game creation:', container);
      console.log('Container is attached to DOM:', !!container.parentElement);
      console.log('Container dimensions:', {
        clientWidth: container.clientWidth,
        clientHeight: container.clientHeight,
        offsetWidth: container.offsetWidth,
        offsetHeight: container.offsetHeight
      });
      
      this.game = new Phaser.Game(config);
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

    // 添加错误处理
    this.game.events.on('ready', () => {
      console.log('Game initialized successfully');
    });

    this.game.events.on('destroy', () => {
      console.log('Game destroyed');
    });

    this.game.events.on('boot', () => {
      console.log('Game boot complete');
    });

    this.game.events.on('prestep', () => {
      // Game is running
    });

    this.game.events.on('step', () => {
      // Game step
    });

    // 监听窗口大小变化，动态调整游戏尺寸
    window.addEventListener('resize', this.handleResize.bind(this));
    window.addEventListener('orientationchange', this.handleResize.bind(this));
  }

  // 处理窗口大小变化
  private handleResize() {
    if (this.game && this.game.scale) {
      // 延迟调整大小，等待浏览器完成布局
      setTimeout(() => {
        this.game.scale.refresh();
      }, 100);
    }
  }

  // 销毁游戏实例 - 清理资源，防止内存泄漏
  destroy() {
    if (this.game) {
      // 移除事件监听器
      window.removeEventListener('resize', this.handleResize.bind(this));
      window.removeEventListener('orientationchange', this.handleResize.bind(this));
      
      // 销毁游戏实例
      this.game.destroy(true); // 完全销毁游戏实例和相关资源
    }
  }
}
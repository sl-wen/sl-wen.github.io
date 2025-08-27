import React, { useEffect, useRef } from 'react';
import * as Phaser from 'phaser';
import { FlexibleTileManager, FlexibleMapData } from '../FlexibleTileManager';
import { useGameTileIntegration, TileManagerAdapter } from '../GameTileIntegration';

/**
 * 瓦片系统使用示例
 * 展示如何在现有游戏中集成新的瓦片管理系统
 */

/**
 * 示例游戏场景，展示如何使用新的瓦片系统
 */
class TileSystemExampleScene extends Phaser.Scene {
  private tileManager!: FlexibleTileManager;
  private player!: Phaser.GameObjects.Sprite;
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private adapter!: TileManagerAdapter;

  constructor() {
    super({ key: 'TileSystemExampleScene' });
  }

  preload() {
    // 预加载玩家精灵
    this.load.spritesheet('player', '/assets/sprites/player.png', {
      frameWidth: 32,
      frameHeight: 32
    });

    // 预加载瓦片纹理（这些应该在实际项目中正确配置）
    this.load.image('grass_v2_1', '/assets/tiles/grass_1.png');
    this.load.image('water_tiles', '/assets/tiles/water.png');
    this.load.image('path_tiles', '/assets/tiles/path.png');
    this.load.image('stone_tiles', '/assets/tiles/stone.png');
    this.load.image('soil_tiles', '/assets/tiles/soil.png');
    this.load.image('sand_tiles', '/assets/tiles/sand.png');
    this.load.image('bush_tiles', '/assets/tiles/bush.png');
  }

  create() {
    // 创建瓦片管理器
    this.tileManager = new FlexibleTileManager(this);
    this.adapter = new TileManagerAdapter(this, this.tileManager);

    // 创建示例地图
    const mapData = this.createExampleMap();
    this.tileManager.loadMap(mapData);

    // 创建玩家
    this.createPlayer();

    // 设置相机
    this.setupCamera();

    // 设置输入
    this.setupInput();

    // 添加UI信息
    this.createUI();
  }

  /**
   * 创建示例地图数据
   */
  private createExampleMap(): FlexibleMapData {
    const width = 30;
    const height = 20;
    const tiles = Array(height).fill(null).map(() => Array(width).fill(0));

    // 创建一个有趣的地图布局
    this.createMapFeatures(tiles, width, height);

    return {
      config: {
        width,
        height,
        tileWidth: 16,
        tileHeight: 16,
        layers: [
          {
            name: 'terrain',
            tiles,
            depth: 1,
            visible: true,
            opacity: 1.0
          }
        ]
      },
      metadata: {
        name: '示例地图',
        description: '展示瓦片系统功能的示例地图',
        version: '1.0.0',
        createdAt: new Date().toISOString(),
        modifiedAt: new Date().toISOString()
      }
    };
  }

  /**
   * 创建地图特征
   */
  private createMapFeatures(tiles: number[][], width: number, height: number) {
    // 添加边界围栏
    for (let x = 0; x < width; x++) {
      tiles[0][x] = 3; // 上边界
      tiles[height - 1][x] = 3; // 下边界
    }
    for (let y = 0; y < height; y++) {
      tiles[y][0] = 3; // 左边界
      tiles[y][width - 1] = 3; // 右边界
    }

    // 添加中央湖泊
    const lakeX = Math.floor(width / 2);
    const lakeY = Math.floor(height / 2);
    const lakeRadius = 3;
    for (let y = lakeY - lakeRadius; y <= lakeY + lakeRadius; y++) {
      for (let x = lakeX - lakeRadius; x <= lakeX + lakeRadius; x++) {
        if (x >= 1 && x < width - 1 && y >= 1 && y < height - 1) {
          const distance = Math.sqrt((x - lakeX) ** 2 + (y - lakeY) ** 2);
          if (distance <= lakeRadius) {
            tiles[y][x] = 1; // 水域
          }
        }
      }
    }

    // 添加道路网络
    const roadY = Math.floor(height * 0.3);
    for (let x = 1; x < width - 1; x++) {
      tiles[roadY][x] = 2; // 水平道路
    }

    const roadX = Math.floor(width * 0.7);
    for (let y = 1; y < height - 1; y++) {
      tiles[y][roadX] = 2; // 垂直道路
    }

    // 添加农田区域
    for (let y = Math.floor(height * 0.6); y < height - 1; y++) {
      for (let x = 2; x < Math.floor(width * 0.6); x++) {
        if (tiles[y][x] === 0) {
          tiles[y][x] = 4; // 土壤
        }
      }
    }

    // 添加一些随机灌木
    for (let i = 0; i < 10; i++) {
      const x = Math.floor(Math.random() * (width - 2)) + 1;
      const y = Math.floor(Math.random() * (height - 2)) + 1;
      if (tiles[y][x] === 0) {
        tiles[y][x] = 7; // 灌木
      }
    }
  }

  /**
   * 创建玩家
   */
  private createPlayer() {
    this.player = this.add.sprite(100, 100, 'player');
    this.player.setScale(1);
    this.player.setDepth(10);

    // 创建玩家动画（如果精灵表可用）
    if (!this.anims.exists('player_idle')) {
      this.anims.create({
        key: 'player_idle',
        frames: this.anims.generateFrameNumbers('player', { start: 0, end: 3 }),
        frameRate: 4,
        repeat: -1
      });
    }

    this.player.play('player_idle');
  }

  /**
   * 设置相机
   */
  private setupCamera() {
    const mapBounds = this.tileManager.getMapBounds();
    if (mapBounds) {
      this.cameras.main.setBounds(0, 0, mapBounds.width, mapBounds.height);
      this.cameras.main.startFollow(this.player);
      this.cameras.main.setZoom(2);
    }
  }

  /**
   * 设置输入控制
   */
  private setupInput() {
    this.cursors = this.input.keyboard!.createCursorKeys();

    // 添加WASD控制
    const wasd = this.input.keyboard!.addKeys('W,S,A,D');
    (this.cursors as any).w = wasd.W;
    (this.cursors as any).s = wasd.S;
    (this.cursors as any).a = wasd.A;
    (this.cursors as any).d = wasd.D;
  }

  /**
   * 创建UI信息
   */
  private createUI() {
    // 添加指令文本
    const instructionsText = this.add.text(10, 10, [
      '使用箭头键或WASD移动',
      '红色区域：不可通行',
      '蓝色区域：水源',
      '绿色区域：可种植',
      '黄色区域：道路'
    ], {
      fontSize: '12px',
      color: '#000000',
      backgroundColor: '#ffffff',
      padding: { x: 10, y: 10 }
    });
    instructionsText.setScrollFactor(0);
    instructionsText.setDepth(100);

    // 添加位置信息文本
    this.positionText = this.add.text(10, 150, '', {
      fontSize: '12px',
      color: '#000000',
      backgroundColor: '#ffffff',
      padding: { x: 10, y: 5 }
    });
    this.positionText.setScrollFactor(0);
    this.positionText.setDepth(100);
  }

  private positionText!: Phaser.GameObjects.Text;

  update() {
    this.handlePlayerMovement();
    this.updateUI();
  }

  /**
   * 处理玩家移动
   */
  private handlePlayerMovement() {
    const speed = 100;
    let velocityX = 0;
    let velocityY = 0;

    // 检查输入
    if (this.cursors.left.isDown || (this.cursors as any).a.isDown) {
      velocityX = -speed;
    } else if (this.cursors.right.isDown || (this.cursors as any).d.isDown) {
      velocityX = speed;
    }

    if (this.cursors.up.isDown || (this.cursors as any).w.isDown) {
      velocityY = -speed;
    } else if (this.cursors.down.isDown || (this.cursors as any).s.isDown) {
      velocityY = speed;
    }

    // 计算新位置
    const deltaTime = this.game.loop.delta / 1000;
    const newX = this.player.x + velocityX * deltaTime;
    const newY = this.player.y + velocityY * deltaTime;

    // 检查碰撞
    if (!this.adapter.checkCollision(newX - 8, newY - 8, 16, 16)) {
      this.player.x = newX;
      this.player.y = newY;

      // 创建移动粒子效果
      if (velocityX !== 0 || velocityY !== 0) {
        this.adapter.createTileParticles(this.player.x, this.player.y + 8);
      }
    }
  }

  /**
   * 更新UI信息
   */
  private updateUI() {
    const tileProps = this.tileManager.getTilePropertiesAt(this.player.x, this.player.y);
    const isNearWater = this.adapter.isNearWater(this.player.x, this.player.y);

    this.positionText.setText([
      `位置: (${Math.floor(this.player.x)}, ${Math.floor(this.player.y)})`,
      `瓦片类型: ${tileProps?.type || '未知'}`,
      `可行走: ${tileProps?.walkable ? '是' : '否'}`,
      `可种植: ${tileProps?.farmable ? '是' : '否'}`,
      `水源: ${tileProps?.waterSource ? '是' : '否'}`,
      `靠近水源: ${isNearWater ? '是' : '否'}`
    ]);
  }

  destroy() {
    if (this.adapter) {
      this.adapter.destroy();
    }
    if (this.tileManager) {
      this.tileManager.destroy();
    }
    super.destroy();
  }
}

/**
 * 瓦片系统使用示例组件
 */
interface TileSystemUsageProps {
  className?: string;
}

export const TileSystemUsage: React.FC<TileSystemUsageProps> = ({ className = '' }) => {
  const gameRef = useRef<Phaser.Game | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!canvasRef.current) return;

    const config: Phaser.Types.Core.GameConfig = {
      type: Phaser.AUTO,
      width: 800,
      height: 600,
      canvas: canvasRef.current,
      scene: TileSystemExampleScene,
      physics: {
        default: 'arcade',
        arcade: {
          gravity: { y: 0 },
          debug: false
        }
      },
      backgroundColor: '#87CEEB'
    };

    gameRef.current = new Phaser.Game(config);

    return () => {
      if (gameRef.current) {
        gameRef.current.destroy(true);
        gameRef.current = null;
      }
    };
  }, []);

  return (
    <div className={`tile-system-usage ${className}`}>
      <div className="mb-4">
        <h2 className="text-2xl font-bold mb-2">瓦片系统使用示例</h2>
        <p className="text-gray-600">
          这个示例展示了如何在游戏中使用新的瓦片管理系统。
          玩家可以在地图上移动，系统会自动检测碰撞和瓦片属性。
        </p>
      </div>
      
      <div className="border border-gray-300 rounded-lg overflow-hidden">
        <canvas
          ref={canvasRef}
          className="block"
          style={{ imageRendering: 'pixelated' }}
        />
      </div>

      <div className="mt-4 p-4 bg-gray-50 rounded-lg">
        <h3 className="font-semibold mb-2">功能特性：</h3>
        <ul className="list-disc list-inside text-sm space-y-1">
          <li>✅ 灵活的瓦片定义系统</li>
          <li>✅ 自动碰撞检测</li>
          <li>✅ 瓦片属性查询（可行走、可种植、水源等）</li>
          <li>✅ 适配器模式，兼容现有代码</li>
          <li>✅ 粒子效果集成</li>
          <li>✅ 地图边界管理</li>
          <li>✅ 实时瓦片信息显示</li>
        </ul>
      </div>
    </div>
  );
};

export default TileSystemUsage;
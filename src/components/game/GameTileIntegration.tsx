import React, { useEffect, useRef, useState } from 'react';
import * as Phaser from 'phaser';
import { FlexibleTileManager, FlexibleMapData } from './FlexibleTileManager';
import { TileMapManager } from './entities/TileMapManager';

/**
 * 游戏瓦片集成组件
 * 将新的灵活瓦片管理器集成到现有游戏中
 */

interface GameTileIntegrationProps {
  scene?: Phaser.Scene;
  mapData?: FlexibleMapData;
  onTileManagerReady?: (tileManager: FlexibleTileManager) => void;
  onMapLoad?: (mapData: FlexibleMapData) => void;
  className?: string;
}

/**
 * 游戏瓦片集成钩子
 * 提供在现有游戏场景中使用新瓦片系统的功能
 */
export const useGameTileIntegration = (scene: Phaser.Scene | null) => {
  const [tileManager, setTileManager] = useState<FlexibleTileManager | null>(null);
  const [currentMapData, setCurrentMapData] = useState<FlexibleMapData | null>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    if (!scene) return;

    // 创建新的瓦片管理器
    const manager = new FlexibleTileManager(scene);
    setTileManager(manager);
    setIsReady(true);

    return () => {
      manager.destroy();
      setTileManager(null);
      setIsReady(false);
    };
  }, [scene]);

  /**
   * 加载地图数据
   */
  const loadMap = (mapData: FlexibleMapData) => {
    if (tileManager) {
      tileManager.loadMap(mapData);
      setCurrentMapData(mapData);
    }
  };

  /**
   * 创建默认地图
   */
  const createDefaultMap = (width: number = 32, height: number = 24) => {
    if (tileManager) {
      const defaultMapData = tileManager.createDefaultMap(width, height);
      tileManager.loadMap(defaultMapData);
      setCurrentMapData(defaultMapData);
      return defaultMapData;
    }
    return null;
  };

  /**
   * 获取瓦片属性
   */
  const getTilePropertiesAt = (worldX: number, worldY: number) => {
    return tileManager?.getTilePropertiesAt(worldX, worldY) || null;
  };

  /**
   * 检查位置是否可行走
   */
  const isWalkable = (worldX: number, worldY: number) => {
    return tileManager?.isWalkable(worldX, worldY) || false;
  };

  /**
   * 检查位置是否可种植
   */
  const isFarmable = (worldX: number, worldY: number) => {
    return tileManager?.isFarmable(worldX, worldY) || false;
  };

  /**
   * 检查位置是否是水源
   */
  const isWaterSource = (worldX: number, worldY: number) => {
    return tileManager?.isWaterSource(worldX, worldY) || false;
  };

  /**
   * 设置瓦片
   */
  const setTile = (tileX: number, tileY: number, tileId: number) => {
    tileManager?.setTile(tileX, tileY, tileId);
  };

  /**
   * 获取地图边界
   */
  const getMapBounds = () => {
    return tileManager?.getMapBounds() || null;
  };

  return {
    tileManager,
    currentMapData,
    isReady,
    loadMap,
    createDefaultMap,
    getTilePropertiesAt,
    isWalkable,
    isFarmable,
    isWaterSource,
    setTile,
    getMapBounds
  };
};

/**
 * 瓦片管理器适配器
 * 将新的FlexibleTileManager适配为现有TileMapManager接口
 */
export class TileManagerAdapter {
  private flexibleTileManager: FlexibleTileManager;
  private scene: Phaser.Scene;

  constructor(scene: Phaser.Scene, flexibleTileManager: FlexibleTileManager) {
    this.scene = scene;
    this.flexibleTileManager = flexibleTileManager;
  }

  /**
   * 适配现有的获取瓦片属性方法
   */
  getTilePropertiesAtWorldPos(x: number, y: number) {
    return this.flexibleTileManager.getTilePropertiesAt(x, y);
  }

  /**
   * 适配现有的碰撞检测方法
   */
  checkCollision(x: number, y: number, width: number, height: number): boolean {
    // 检查矩形区域内是否有不可行走的瓦片
    const tileWidth = 16; // 假设瓦片宽度为16像素
    const tileHeight = 16; // 假设瓦片高度为16像素
    
    const startTileX = Math.floor(x / tileWidth);
    const startTileY = Math.floor(y / tileHeight);
    const endTileX = Math.floor((x + width) / tileWidth);
    const endTileY = Math.floor((y + height) / tileHeight);

    for (let tileY = startTileY; tileY <= endTileY; tileY++) {
      for (let tileX = startTileX; tileX <= endTileX; tileX++) {
        const worldX = tileX * tileWidth;
        const worldY = tileY * tileHeight;
        
        if (!this.flexibleTileManager.isWalkable(worldX, worldY)) {
          return true; // 发生碰撞
        }
      }
    }

    return false; // 没有碰撞
  }

  /**
   * 适配现有的获取地图边界方法
   */
  getMapBounds() {
    return this.flexibleTileManager.getMapBounds();
  }

  /**
   * 适配现有的种植检查方法
   */
  canPlantAt(x: number, y: number): boolean {
    return this.flexibleTileManager.isFarmable(x, y);
  }

  /**
   * 适配现有的水源检查方法
   */
  isNearWater(x: number, y: number, radius: number = 50): boolean {
    // 检查指定半径内是否有水源
    const checkRadius = 5; // 检查5个瓦片的半径
    const tileSize = 16;
    
    for (let dy = -checkRadius; dy <= checkRadius; dy++) {
      for (let dx = -checkRadius; dx <= checkRadius; dx++) {
        const checkX = x + dx * tileSize;
        const checkY = y + dy * tileSize;
        const distance = Math.sqrt(dx * dx + dy * dy) * tileSize;
        
        if (distance <= radius && this.flexibleTileManager.isWaterSource(checkX, checkY)) {
          return true;
        }
      }
    }
    
    return false;
  }

  /**
   * 创建粒子效果（适配现有的瓦片交互）
   */
  createTileParticles(x: number, y: number, particleKey: string = 'grass') {
    const properties = this.flexibleTileManager.getTilePropertiesAt(x, y);
    
    if (properties) {
      // 根据瓦片类型选择合适的粒子效果
      let effectKey = particleKey;
      switch (properties.type) {
        case 'water':
          effectKey = 'water_splash';
          break;
        case 'soil':
        case 'tilled_dirt':
          effectKey = 'dirt';
          break;
        case 'grass':
          effectKey = 'grass';
          break;
        default:
          effectKey = 'dust';
      }

      // 创建粒子效果
      if (this.scene.textures.exists(effectKey)) {
        const particles = this.scene.add.particles(x, y, effectKey, {
          speed: { min: 20, max: 50 },
          scale: { start: 0.3, end: 0 },
          lifespan: 300,
          quantity: 3
        });

        // 自动销毁粒子系统
        this.scene.time.delayedCall(500, () => {
          particles.destroy();
        });
      }
    }
  }

  /**
   * 获取瓦片中心位置
   */
  getTileCenterAt(x: number, y: number): { x: number; y: number } {
    const tileSize = 16;
    const tileX = Math.floor(x / tileSize);
    const tileY = Math.floor(y / tileSize);
    
    return {
      x: tileX * tileSize + tileSize / 2,
      y: tileY * tileSize + tileSize / 2
    };
  }

  /**
   * 销毁适配器
   */
  destroy() {
    // 清理资源
  }
}

/**
 * 游戏瓦片集成组件
 */
export const GameTileIntegration: React.FC<GameTileIntegrationProps> = ({
  scene,
  mapData,
  onTileManagerReady,
  onMapLoad,
  className = ''
}) => {
  const tileManagerRef = useRef<FlexibleTileManager | null>(null);
  const adapterRef = useRef<TileManagerAdapter | null>(null);

  useEffect(() => {
    if (!scene) return;

    // 创建瓦片管理器
    const tileManager = new FlexibleTileManager(scene);
    tileManagerRef.current = tileManager;

    // 创建适配器
    const adapter = new TileManagerAdapter(scene, tileManager);
    adapterRef.current = adapter;

    // 通知外部组件瓦片管理器已准备就绪
    onTileManagerReady?.(tileManager);

    return () => {
      adapter.destroy();
      tileManager.destroy();
      tileManagerRef.current = null;
      adapterRef.current = null;
    };
  }, [scene, onTileManagerReady]);

  useEffect(() => {
    if (mapData && tileManagerRef.current) {
      tileManagerRef.current.loadMap(mapData);
      onMapLoad?.(mapData);
    }
  }, [mapData, onMapLoad]);

  return (
    <div className={`tile-integration ${className}`}>
      {/* 这个组件主要用于逻辑集成，不需要渲染UI */}
    </div>
  );
};

/**
 * 地图数据转换工具
 */
export class MapDataConverter {
  /**
   * 将旧的FarmLayoutManager数据转换为新的FlexibleMapData格式
   */
  static convertFromFarmLayout(farmAreas: any[]): FlexibleMapData {
    // 创建默认地图尺寸
    const width = 40;
    const height = 30;
    const tiles = Array(height).fill(null).map(() => Array(width).fill(0));

    // 根据农场区域填充瓦片
    farmAreas.forEach(area => {
      const startX = Math.floor(area.x / 16);
      const startY = Math.floor(area.y / 16);
      const endX = Math.min(width - 1, Math.floor((area.x + area.width) / 16));
      const endY = Math.min(height - 1, Math.floor((area.y + area.height) / 16));

      let tileId = 0;
      switch (area.type) {
        case 'house':
          tileId = 0; // 草地
          break;
        case 'pond':
          tileId = 1; // 水域
          break;
        case 'farm':
          tileId = 4; // 土壤
          break;
        case 'road':
          tileId = 2; // 道路
          break;
        case 'forest':
          tileId = 7; // 灌木
          break;
      }

      for (let y = startY; y <= endY; y++) {
        for (let x = startX; x <= endX; x++) {
          if (x >= 0 && x < width && y >= 0 && y < height) {
            tiles[y][x] = tileId;
          }
        }
      }
    });

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
        name: '转换的农场地图',
        description: '从FarmLayoutManager转换而来',
        version: '1.0.0',
        createdAt: new Date().toISOString(),
        modifiedAt: new Date().toISOString()
      }
    };
  }

  /**
   * 将FlexibleMapData转换为简化的地图数据
   */
  static simplifyMapData(mapData: FlexibleMapData): {
    width: number;
    height: number;
    tiles: number[][];
    walkableMap: boolean[][];
    farmableMap: boolean[][];
    waterSourceMap: boolean[][];
  } {
    const { width, height, layers } = mapData.config;
    const terrainLayer = layers.find(l => l.name === 'terrain') || layers[0];
    
    const walkableMap = Array(height).fill(null).map(() => Array(width).fill(true));
    const farmableMap = Array(height).fill(null).map(() => Array(width).fill(false));
    const waterSourceMap = Array(height).fill(null).map(() => Array(width).fill(false));

    // 根据瓦片类型生成属性地图
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const tileId = terrainLayer.tiles[y][x];
        
        switch (tileId) {
          case 0: // 草地
            walkableMap[y][x] = true;
            farmableMap[y][x] = true;
            break;
          case 1: // 水域
            walkableMap[y][x] = false;
            waterSourceMap[y][x] = true;
            break;
          case 2: // 道路
            walkableMap[y][x] = true;
            break;
          case 3: // 栅栏
            walkableMap[y][x] = false;
            break;
          case 4: // 土壤
            walkableMap[y][x] = true;
            farmableMap[y][x] = true;
            break;
          case 5: // 耕地
            walkableMap[y][x] = true;
            farmableMap[y][x] = true;
            break;
          case 6: // 沙地
            walkableMap[y][x] = true;
            break;
          case 7: // 灌木
            walkableMap[y][x] = false;
            break;
        }
      }
    }

    return {
      width,
      height,
      tiles: terrainLayer.tiles,
      walkableMap,
      farmableMap,
      waterSourceMap
    };
  }
}

export default GameTileIntegration;
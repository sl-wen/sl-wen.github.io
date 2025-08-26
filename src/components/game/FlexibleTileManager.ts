import * as Phaser from 'phaser';
import { TileType, TileProperties } from './entities/TileMapManager';

/**
 * 灵活的瓦片管理器
 * 支持自由定义地图布局，替代固定的农场布局
 */

/**
 * 瓦片定义接口
 */
export interface FlexibleTileDefinition {
  id: number;
  type: TileType;
  textureKey: string;
  name: string;
  description: string;
  properties: TileProperties;
  variations?: string[];  // 纹理变体
  animationFrames?: number[];
}

/**
 * 地图配置接口
 */
export interface FlexibleMapConfig {
  width: number;          // 地图宽度（瓦片数量）
  height: number;         // 地图高度（瓦片数量）
  tileWidth: number;      // 瓦片宽度（像素）
  tileHeight: number;     // 瓦片高度（像素）
  layers: FlexibleMapLayer[];
}

/**
 * 地图图层接口
 */
export interface FlexibleMapLayer {
  name: string;
  tiles: number[][];      // 二维瓦片数组
  depth: number;          // 渲染深度
  visible: boolean;
  opacity: number;
}

/**
 * 地图数据保存格式
 */
export interface FlexibleMapData {
  config: FlexibleMapConfig;
  metadata: {
    name: string;
    description: string;
    version: string;
    createdAt: string;
    modifiedAt: string;
    author?: string;
  };
}

/**
 * 预定义瓦片类型
 */
export const FLEXIBLE_TILE_DEFINITIONS: FlexibleTileDefinition[] = [
  {
    id: 0,
    type: TileType.GRASS,
    textureKey: 'grass_v2_1',
    name: '草地',
    description: '基础草地地形',
    properties: {
      type: TileType.GRASS,
      walkable: true,
      farmable: true,
      waterSource: false,
      textureKey: 'grass_v2_1'
    },
    variations: ['grass_v2_1', 'grass_v2_2', 'grass_v2_3', 'grass_v2_4', 'grass_v2_5']
  },
  {
    id: 1,
    type: TileType.WATER,
    textureKey: 'water_tiles',
    name: '水域',
    description: '水体，不可通行',
    properties: {
      type: TileType.WATER,
      walkable: false,
      farmable: false,
      waterSource: true,
      textureKey: 'water_tiles',
      animationFrames: [0, 1, 2, 3]
    },
    animationFrames: [0, 1, 2, 3]
  },
  {
    id: 2,
    type: TileType.PATH,
    textureKey: 'path_tiles',
    name: '道路',
    description: '石头铺成的道路',
    properties: {
      type: TileType.PATH,
      walkable: true,
      farmable: false,
      waterSource: false,
      textureKey: 'path_tiles'
    }
  },
  {
    id: 3,
    type: TileType.STONE,
    textureKey: 'stone_tiles',
    name: '栅栏/石墙',
    description: '阻挡通行的障碍物',
    properties: {
      type: TileType.STONE,
      walkable: false,
      farmable: false,
      waterSource: false,
      textureKey: 'stone_tiles'
    }
  },
  {
    id: 4,
    type: TileType.SOIL,
    textureKey: 'soil_tiles',
    name: '肥沃土壤',
    description: '适合种植的土壤',
    properties: {
      type: TileType.SOIL,
      walkable: true,
      farmable: true,
      waterSource: false,
      textureKey: 'soil_tiles'
    }
  },
  {
    id: 5,
    type: TileType.TILLED_DIRT,
    textureKey: 'tilled_dirt_tiles',
    name: '耕地',
    description: '已耕作的土地',
    properties: {
      type: TileType.TILLED_DIRT,
      walkable: true,
      farmable: true,
      waterSource: false,
      textureKey: 'tilled_dirt_tiles'
    }
  },
  {
    id: 6,
    type: TileType.SAND,
    textureKey: 'sand_tiles',
    name: '沙地',
    description: '沙质地面',
    properties: {
      type: TileType.SAND,
      walkable: true,
      farmable: false,
      waterSource: false,
      textureKey: 'sand_tiles'
    }
  },
  {
    id: 7,
    type: TileType.BUSH,
    textureKey: 'bush_tiles',
    name: '灌木',
    description: '装饰性灌木',
    properties: {
      type: TileType.BUSH,
      walkable: false,
      farmable: false,
      waterSource: false,
      textureKey: 'bush_tiles'
    }
  }
];

/**
 * 灵活瓦片管理器类
 */
export class FlexibleTileManager {
  private scene: Phaser.Scene;
  private mapConfig: FlexibleMapConfig | null = null;
  private tileDefinitions: Map<number, FlexibleTileDefinition> = new Map();
  private renderedLayers: Map<string, Phaser.GameObjects.Container> = new Map();
  private animatedTiles: Phaser.GameObjects.Sprite[] = [];
  private debugMode: boolean = false;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.initializeTileDefinitions();
  }

  /**
   * 初始化瓦片定义
   */
  private initializeTileDefinitions(): void {
    FLEXIBLE_TILE_DEFINITIONS.forEach(definition => {
      this.tileDefinitions.set(definition.id, definition);
    });
  }

  /**
   * 加载地图数据
   */
  public loadMap(mapData: FlexibleMapData): void {
    this.clearMap();
    this.mapConfig = mapData.config;
    this.renderAllLayers();
  }

  /**
   * 创建默认地图
   */
  public createDefaultMap(width: number, height: number): FlexibleMapData {
    // 创建基础草地图层
    const grassTiles = Array(height).fill(null).map(() => Array(width).fill(0));
    
    // 创建一些示例布局
    this.addWaterFeature(grassTiles, width, height);
    this.addPathNetwork(grassTiles, width, height);
    this.addFences(grassTiles, width, height);

    const mapConfig: FlexibleMapConfig = {
      width,
      height,
      tileWidth: 16,
      tileHeight: 16,
      layers: [
        {
          name: 'terrain',
          tiles: grassTiles,
          depth: 1,
          visible: true,
          opacity: 1.0
        }
      ]
    };

    return {
      config: mapConfig,
      metadata: {
        name: '默认农场地图',
        description: '自动生成的示例地图',
        version: '1.0.0',
        createdAt: new Date().toISOString(),
        modifiedAt: new Date().toISOString()
      }
    };
  }

  /**
   * 添加水体特征
   */
  private addWaterFeature(tiles: number[][], width: number, height: number): void {
    const centerX = Math.floor(width * 0.7);
    const centerY = Math.floor(height * 0.3);
    const radius = Math.min(width, height) * 0.1;

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const distance = Math.sqrt((x - centerX) ** 2 + (y - centerY) ** 2);
        if (distance <= radius) {
          tiles[y][x] = 1; // 水域
        }
      }
    }
  }

  /**
   * 添加道路网络
   */
  private addPathNetwork(tiles: number[][], width: number, height: number): void {
    // 垂直主路
    const mainRoadX = Math.floor(width * 0.4);
    for (let y = 0; y < height; y++) {
      tiles[y][mainRoadX] = 2; // 道路
    }

    // 水平主路
    const mainRoadY = Math.floor(height * 0.6);
    for (let x = 0; x < width; x++) {
      tiles[mainRoadY][x] = 2; // 道路
    }
  }

  /**
   * 添加栅栏
   */
  private addFences(tiles: number[][], width: number, height: number): void {
    // 边界栅栏
    for (let x = 0; x < width; x++) {
      if (tiles[0][x] === 0) tiles[0][x] = 3; // 上边界
      if (tiles[height - 1][x] === 0) tiles[height - 1][x] = 3; // 下边界
    }
    
    for (let y = 0; y < height; y++) {
      if (tiles[y][0] === 0) tiles[y][0] = 3; // 左边界
      if (tiles[y][width - 1] === 0) tiles[y][width - 1] = 3; // 右边界
    }
  }

  /**
   * 渲染所有图层
   */
  private renderAllLayers(): void {
    if (!this.mapConfig) return;

    this.mapConfig.layers.forEach(layer => {
      if (layer.visible) {
        this.renderLayer(layer);
      }
    });

    this.setupAnimations();
  }

  /**
   * 渲染单个图层
   */
  private renderLayer(layer: FlexibleMapLayer): void {
    const container = this.scene.add.container(0, 0);
    container.setDepth(layer.depth);
    container.setAlpha(layer.opacity);

    for (let y = 0; y < this.mapConfig!.height; y++) {
      for (let x = 0; x < this.mapConfig!.width; x++) {
        const tileId = layer.tiles[y][x];
        const definition = this.tileDefinitions.get(tileId);
        
        if (definition) {
          const sprite = this.createTileSprite(x, y, definition);
          if (sprite) {
            container.add(sprite);
          }
        }
      }
    }

    this.renderedLayers.set(layer.name, container);
  }

  /**
   * 创建瓦片精灵
   */
  private createTileSprite(x: number, y: number, definition: FlexibleTileDefinition): Phaser.GameObjects.Sprite | null {
    if (!this.mapConfig) return null;

    const worldX = x * this.mapConfig.tileWidth + this.mapConfig.tileWidth / 2;
    const worldY = y * this.mapConfig.tileHeight + this.mapConfig.tileHeight / 2;

    // 选择纹理键
    let textureKey = definition.textureKey;
    if (definition.variations && definition.variations.length > 0) {
      // 使用位置作为种子来选择变体，确保一致性
      const seed = x * 1000 + y;
      const variationIndex = seed % definition.variations.length;
      textureKey = definition.variations[variationIndex];
    }

    // 检查纹理是否存在
    if (!this.scene.textures.exists(textureKey)) {
      if (this.debugMode) {
        console.warn(`Texture ${textureKey} not found, using fallback`);
      }
      // 创建简单的颜色方块作为后备
      return this.createFallbackTile(worldX, worldY, definition);
    }

    const sprite = this.scene.add.sprite(worldX, worldY, textureKey);
    
    // 如果有动画帧，添加到动画瓦片列表
    if (definition.animationFrames && definition.animationFrames.length > 0) {
      this.animatedTiles.push(sprite);
    }

    return sprite;
  }

  /**
   * 创建后备瓦片（用于纹理缺失时）
   */
  private createFallbackTile(x: number, y: number, definition: FlexibleTileDefinition): Phaser.GameObjects.Rectangle {
    const color = this.getTileColor(definition.type);
    const rect = this.scene.add.rectangle(x, y, this.mapConfig!.tileWidth, this.mapConfig!.tileHeight, color);
    
    if (this.debugMode) {
      rect.setStrokeStyle(1, 0x000000, 0.5);
    }
    
    return rect;
  }

  /**
   * 获取瓦片类型对应的颜色
   */
  private getTileColor(tileType: TileType): number {
    switch (tileType) {
      case TileType.GRASS: return 0x90EE90;
      case TileType.WATER: return 0x4169E1;
      case TileType.PATH: return 0xD2B48C;
      case TileType.STONE: return 0x696969;
      case TileType.SOIL: return 0x8B4513;
      case TileType.TILLED_DIRT: return 0x654321;
      case TileType.SAND: return 0xF4A460;
      case TileType.BUSH: return 0x228B22;
      default: return 0xFFFFFF;
    }
  }

  /**
   * 设置动画
   */
  private setupAnimations(): void {
    this.animatedTiles.forEach(sprite => {
      if (sprite.texture.key === 'water_tiles') {
        // 水的动画
        if (!this.scene.anims.exists('water_flow')) {
          this.scene.anims.create({
            key: 'water_flow',
            frames: this.scene.anims.generateFrameNumbers('water_tiles', { start: 0, end: 3 }),
            frameRate: 4,
            repeat: -1
          });
        }
        sprite.play('water_flow');
      }
    });
  }

  /**
   * 获取指定位置的瓦片属性
   */
  public getTilePropertiesAt(worldX: number, worldY: number, layerName: string = 'terrain'): TileProperties | null {
    if (!this.mapConfig) return null;

    const tileX = Math.floor(worldX / this.mapConfig.tileWidth);
    const tileY = Math.floor(worldY / this.mapConfig.tileHeight);

    const layer = this.mapConfig.layers.find(l => l.name === layerName);
    if (!layer || tileY < 0 || tileY >= layer.tiles.length || tileX < 0 || tileX >= layer.tiles[0].length) {
      return null;
    }

    const tileId = layer.tiles[tileY][tileX];
    const definition = this.tileDefinitions.get(tileId);
    
    return definition ? definition.properties : null;
  }

  /**
   * 检查指定位置是否可行走
   */
  public isWalkable(worldX: number, worldY: number): boolean {
    const properties = this.getTilePropertiesAt(worldX, worldY);
    return properties ? properties.walkable : false;
  }

  /**
   * 检查指定位置是否可种植
   */
  public isFarmable(worldX: number, worldY: number): boolean {
    const properties = this.getTilePropertiesAt(worldX, worldY);
    return properties ? properties.farmable : false;
  }

  /**
   * 检查指定位置是否是水源
   */
  public isWaterSource(worldX: number, worldY: number): boolean {
    const properties = this.getTilePropertiesAt(worldX, worldY);
    return properties ? properties.waterSource : false;
  }

  /**
   * 设置瓦片
   */
  public setTile(tileX: number, tileY: number, tileId: number, layerName: string = 'terrain'): void {
    if (!this.mapConfig) return;

    const layer = this.mapConfig.layers.find(l => l.name === layerName);
    if (!layer || tileY < 0 || tileY >= layer.tiles.length || tileX < 0 || tileX >= layer.tiles[0].length) {
      return;
    }

    layer.tiles[tileY][tileX] = tileId;
    this.refreshTileAt(tileX, tileY, layerName);
  }

  /**
   * 刷新指定位置的瓦片显示
   */
  private refreshTileAt(tileX: number, tileY: number, layerName: string): void {
    // 这里可以实现局部刷新逻辑
    // 目前简单重新渲染整个图层
    const container = this.renderedLayers.get(layerName);
    if (container) {
      container.destroy(true);
      this.renderedLayers.delete(layerName);
    }

    const layer = this.mapConfig!.layers.find(l => l.name === layerName);
    if (layer) {
      this.renderLayer(layer);
    }
  }

  /**
   * 清除地图
   */
  public clearMap(): void {
    this.renderedLayers.forEach(container => {
      container.destroy(true);
    });
    this.renderedLayers.clear();
    this.animatedTiles = [];
    this.mapConfig = null;
  }

  /**
   * 导出地图数据
   */
  public exportMapData(): FlexibleMapData | null {
    if (!this.mapConfig) return null;

    return {
      config: this.mapConfig,
      metadata: {
        name: '导出的地图',
        description: '通过FlexibleTileManager导出',
        version: '1.0.0',
        createdAt: new Date().toISOString(),
        modifiedAt: new Date().toISOString()
      }
    };
  }

  /**
   * 获取地图边界
   */
  public getMapBounds(): { width: number; height: number } | null {
    if (!this.mapConfig) return null;

    return {
      width: this.mapConfig.width * this.mapConfig.tileWidth,
      height: this.mapConfig.height * this.mapConfig.tileHeight
    };
  }

  /**
   * 启用/禁用调试模式
   */
  public setDebugMode(enabled: boolean): void {
    this.debugMode = enabled;
  }

  /**
   * 获取瓦片定义
   */
  public getTileDefinitions(): FlexibleTileDefinition[] {
    return Array.from(this.tileDefinitions.values());
  }

  /**
   * 销毁管理器
   */
  public destroy(): void {
    this.clearMap();
    this.tileDefinitions.clear();
  }
}

export default FlexibleTileManager;
import { GridEngine } from 'grid-engine';
import * as Phaser from 'phaser';

// 地图类型枚举
export enum MapType {
  VILLAGE = 'village',
  FOREST = 'forest',
  CAVE = 'cave',
  DUNGEON = 'dungeon',
  SHOP = 'shop',
  HOUSE = 'house'
}

// 地图配置接口
export interface MapConfig {
  key: string;
  type: MapType;
  tileset: string;
  width: number;
  height: number;
  tileWidth: number;
  tileHeight: number;
  layers: string[];
  spawnPoints: { [key: string]: { x: number; y: number; direction?: string } };
  transitions: MapTransition[];
  preload: boolean;
  chunked: boolean;
  chunkSize: number;
}

// 地图转换接口
export interface MapTransition {
  from: { x: number; y: number; width: number; height: number };
  to: { mapKey: string; x: number; y: number; direction: string };
  trigger: 'position' | 'interaction' | 'script';
}

// 地图块接口
export interface MapChunk {
  x: number;
  y: number;
  width: number;
  height: number;
  layers: Phaser.Tilemaps.TilemapLayer[];
  loaded: boolean;
  visible: boolean;
}

// 地图加载事件
export interface MapLoadEvent {
  type: 'loading' | 'loaded' | 'error' | 'transition';
  mapKey: string;
  progress?: number;
  error?: string;
  fromMap?: string;
  toMap?: string;
}

export class MapSystem {
  private scene: Phaser.Scene;
  private gridEngine: GridEngine;
  private configs: Map<string, MapConfig> = new Map();
  private currentMap: string | null = null;
  private currentMapConfig: MapConfig | null = null;
  private tilemap: Phaser.Tilemaps.Tilemap | null = null;
  private chunks: Map<string, MapChunk> = new Map();
  private eventListeners: Map<string, ((event: MapLoadEvent) => void)[]> = new Map();
  private loadingMaps: Set<string> = new Set();
  private preloadedMaps: Set<string> = new Set();

  constructor(scene: Phaser.Scene, gridEngine: GridEngine) {
    this.scene = scene;
    this.gridEngine = gridEngine;
    this.initializeDefaultMaps();
  }

  // 初始化默认地图配置
  private initializeDefaultMaps(): void {
    const defaultMaps: MapConfig[] = [
      {
        key: 'home_page_city',
        type: MapType.VILLAGE,
        tileset: 'tileset',
        width: 50,
        height: 50,
        tileWidth: 16,
        tileHeight: 16,
        layers: ['ground', 'walls', 'objects', 'collisions'],
        spawnPoints: {
          default: { x: 25, y: 25 },
          from_house_01: { x: 15, y: 15 },
          from_house_02: { x: 35, y: 15 },
          from_house_03: { x: 25, y: 35 }
        },
        transitions: [
          {
            from: { x: 15, y: 15, width: 2, height: 2 },
            to: { mapKey: 'home_page_city_house_01', x: 5, y: 5, direction: 'down' },
            trigger: 'position'
          },
          {
            from: { x: 35, y: 15, width: 2, height: 2 },
            to: { mapKey: 'home_page_city_house_02', x: 5, y: 5, direction: 'down' },
            trigger: 'position'
          },
          {
            from: { x: 25, y: 35, width: 2, height: 2 },
            to: { mapKey: 'home_page_city_house_03', x: 5, y: 5, direction: 'up' },
            trigger: 'position'
          }
        ],
        preload: true,
        chunked: false,
        chunkSize: 16
      },
      {
        key: 'home_page_city_house_01',
        type: MapType.HOUSE,
        tileset: 'tileset',
        width: 10,
        height: 12,
        tileWidth: 16,
        tileHeight: 16,
        layers: ['ground', 'walls', 'objects', 'collisions'],
        spawnPoints: {
          default: { x: 5, y: 6 },
          from_city: { x: 4, y: 3, direction: 'up' }
        },
        transitions: [
          {
            from: { x: 4, y: 3, width: 2, height: 2 },
            to: { mapKey: 'home_page_city', x: 15, y: 15, direction: 'down' },
            trigger: 'position'
          }
        ],
        preload: true,
        chunked: false,
        chunkSize: 16
      },
      {
        key: 'home_page_city_house_02',
        type: MapType.HOUSE,
        tileset: 'tileset',
        width: 10,
        height: 12,
        tileWidth: 16,
        tileHeight: 16,
        layers: ['ground', 'walls', 'objects', 'collisions'],
        spawnPoints: {
          default: { x: 5, y: 6 },
          from_city: { x: 4, y: 3, direction: 'up' }
        },
        transitions: [
          {
            from: { x: 4, y: 3, width: 2, height: 2 },
            to: { mapKey: 'home_page_city', x: 35, y: 15, direction: 'down' },
            trigger: 'position'
          }
        ],
        preload: true,
        chunked: false,
        chunkSize: 16
      },
      {
        key: 'home_page_city_house_03',
        type: MapType.HOUSE,
        tileset: 'tileset',
        width: 10,
        height: 12,
        tileWidth: 16,
        tileHeight: 16,
        layers: ['ground', 'walls', 'objects', 'collisions'],
        spawnPoints: {
          default: { x: 5, y: 6 },
          from_city: { x: 4, y: 3, direction: 'up' }
        },
        transitions: [
          {
            from: { x: 4, y: 3, width: 2, height: 2 },
            to: { mapKey: 'home_page_city', x: 25, y: 35, direction: 'down' },
            trigger: 'position'
          }
        ],
        preload: true,
        chunked: false,
        chunkSize: 16
      }
    ];

    defaultMaps.forEach(config => {
      this.configs.set(config.key, config);
    });
  }

  // 添加地图配置
  public addMapConfig(config: MapConfig): void {
    this.configs.set(config.key, config);
  }

  // 加载地图
  public async loadMap(mapKey: string, spawnPoint: string = 'default'): Promise<boolean> {
    const config = this.configs.get(mapKey);
    if (!config) {
      console.error(`Map config not found: ${mapKey}`);
      return false;
    }

    if (this.loadingMaps.has(mapKey)) {
      console.warn(`Map ${mapKey} is already loading`);
      return false;
    }

    this.loadingMaps.add(mapKey);
    this.emitEvent('loading', { type: 'loading', mapKey });

    try {
      // 卸载当前地图
      if (this.currentMap) {
        await this.unloadCurrentMap();
      }

      // 加载新地图
      await this.loadMapData(config);

      // 设置网格引擎
      await this.setupGridEngine(config, spawnPoint);

      // 设置地图块
      if (config.chunked) {
        this.setupChunks(config);
      }

      // 更新状态
      this.currentMap = mapKey;
      this.currentMapConfig = config;

      this.emitEvent('loaded', { type: 'loaded', mapKey });
      console.log(`Map ${mapKey} loaded successfully`);

      return true;

    } catch (error) {
      console.error(`Failed to load map ${mapKey}:`, error);
      this.emitEvent('error', {
        type: 'error',
        mapKey,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      return false;
    } finally {
      this.loadingMaps.delete(mapKey);
    }
  }

  // 加载地图数据
  private async loadMapData(config: MapConfig): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        // 创建瓦片地图
        this.tilemap = this.scene.make.tilemap({ key: config.key });

        // 添加瓦片集
        this.tilemap.addTilesetImage(config.tileset);

        // 创建图层
        config.layers.forEach(layerName => {
          if (this.tilemap) {
            const layer = this.tilemap.createLayer(layerName, config.tileset);
            if (layer) {
              layer.setCollisionByProperty({ collides: true });
            }
          }
        });

        resolve();
      } catch (error) {
        reject(error);
      }
    });
  }

  // 设置网格引擎
  private async setupGridEngine(config: MapConfig, spawnPoint: string): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        // 创建网格引擎配置
        const gridEngineConfig = {
          characters: [
            {
              id: 'player',
              sprite: 'hero' as any,
              walkingAnimationMapping: 6,
              startPosition: config.spawnPoints[spawnPoint] || config.spawnPoints.default,
              speed: 4
            }
          ],
          numberOfDirections: 8,
          characterCollisionStrategy: 1 as any,
          tileWidth: config.tileWidth,
          tileHeight: config.tileHeight
        };

        // 设置网格引擎
        if (this.tilemap) {
          this.gridEngine.create(this.tilemap, gridEngineConfig);
        }

        resolve();
      } catch (error) {
        reject(error);
      }
    });
  }

  // 设置地图块
  private setupChunks(config: MapConfig): void {
    this.chunks.clear();

    const chunkSize = config.chunkSize;
    const chunksX = Math.ceil(config.width / chunkSize);
    const chunksY = Math.ceil(config.height / chunkSize);

    for (let x = 0; x < chunksX; x++) {
      for (let y = 0; y < chunksY; y++) {
        const chunkKey = `${x}_${y}`;
        const chunk: MapChunk = {
          x: x * chunkSize,
          y: y * chunkSize,
          width: Math.min(chunkSize, config.width - x * chunkSize),
          height: Math.min(chunkSize, config.height - y * chunkSize),
          layers: [],
          loaded: false,
          visible: false
        };

        this.chunks.set(chunkKey, chunk);
      }
    }
  }

  // 卸载当前地图
  private async unloadCurrentMap(): Promise<void> {
    if (!this.currentMap) return;

    // 停止网格引擎
    this.gridEngine.stopMovement('player');

    // 销毁瓦片地图
    if (this.tilemap) {
      this.tilemap.destroy();
      this.tilemap = null;
    }

    // 清理地图块
    this.chunks.clear();

    // 清理场景中的地图对象
    this.scene.children.removeAll(true);

    console.log(`Map ${this.currentMap} unloaded`);
  }

  // 预加载地图
  public async preloadMap(mapKey: string): Promise<boolean> {
    if (this.preloadedMaps.has(mapKey)) {
      return true;
    }

    const config = this.configs.get(mapKey);
    if (!config || !config.preload) {
      return false;
    }

    try {
      // 预加载地图资源
      await this.preloadMapResources(config);
      this.preloadedMaps.add(mapKey);
      console.log(`Map ${mapKey} preloaded`);
      return true;
    } catch (error) {
      console.error(`Failed to preload map ${mapKey}:`, error);
      return false;
    }
  }

  // 预加载地图资源
  private async preloadMapResources(config: MapConfig): Promise<void> {
    return new Promise((resolve) => {
      // 这里可以添加资源预加载逻辑
      // 比如预加载地图相关的精灵、音效等
      setTimeout(resolve, 100);
    });
  }

  // 检查地图转换
  public checkTransitions(playerPosition: { x: number; y: number }): void {
    if (!this.currentMapConfig) return;

    this.currentMapConfig.transitions.forEach(transition => {
      if (this.isInTransitionArea(playerPosition, transition.from)) {
        this.transitionToMap(transition.to);
      }
    });
  }

  // 检查是否在转换区域内
  private isInTransitionArea(position: { x: number; y: number }, area: { x: number; y: number; width: number; height: number }): boolean {
    return position.x >= area.x &&
      position.x < area.x + area.width &&
      position.y >= area.y &&
      position.y < area.y + area.height;
  }

  // 转换到新地图
  private async transitionToMap(transition: { mapKey: string; x: number; y: number; direction: string }): Promise<void> {
    const fromMap = this.currentMap;
    const toMap = transition.mapKey;

    console.log(`Transitioning from ${fromMap} to ${toMap}`);

    // 发送转换事件
    this.emitEvent('transition', {
      type: 'transition',
      mapKey: toMap,
      fromMap: fromMap || undefined,
      toMap
    });

    // 加载新地图
    await this.loadMap(toMap, `from_${fromMap?.replace('home_page_city_', '')}`);
  }

  // 获取当前地图
  public getCurrentMap(): string | null {
    return this.currentMap;
  }

  // 获取当前地图配置
  public getCurrentMapConfig(): MapConfig | null {
    return this.currentMapConfig;
  }

  // 获取地图配置
  public getMapConfig(mapKey: string): MapConfig | undefined {
    return this.configs.get(mapKey);
  }

  // 获取所有地图配置
  public getAllMapConfigs(): Map<string, MapConfig> {
    return new Map(this.configs);
  }

  // 检查地图是否已加载
  public isMapLoaded(mapKey: string): boolean {
    return this.currentMap === mapKey;
  }

  // 检查地图是否已预加载
  public isMapPreloaded(mapKey: string): boolean {
    return this.preloadedMaps.has(mapKey);
  }

  // 获取玩家位置
  public getPlayerPosition(): { x: number; y: number } | null {
    try {
      return this.gridEngine.getPosition('player');
    } catch {
      return null;
    }
  }

  // 设置玩家位置
  public setPlayerPosition(x: number, y: number): void {
    try {
      this.gridEngine.setPosition('player', { x, y });
    } catch (error) {
      console.error('Failed to set player position:', error);
    }
  }

  // 更新方法
  public update(time: number, delta: number): void {
    // 检查地图转换
    const playerPosition = this.getPlayerPosition();
    if (playerPosition) {
      this.checkTransitions(playerPosition);
    }

    // 更新地图块可见性
    this.updateChunkVisibility();
  }

  // 更新地图块可见性
  private updateChunkVisibility(): void {
    if (!this.currentMapConfig?.chunked) return;

    const playerPosition = this.getPlayerPosition();
    if (!playerPosition) return;

    const chunkSize = this.currentMapConfig.chunkSize;
    const playerChunkX = Math.floor(playerPosition.x / chunkSize);
    const playerChunkY = Math.floor(playerPosition.y / chunkSize);
    const viewDistance = 2; // 可见距离

    this.chunks.forEach((chunk, key) => {
      const chunkX = parseInt(key.split('_')[0]);
      const chunkY = parseInt(key.split('_')[1]);

      const distance = Math.max(Math.abs(chunkX - playerChunkX), Math.abs(chunkY - playerChunkY));
      const shouldBeVisible = distance <= viewDistance;

      if (chunk.visible !== shouldBeVisible) {
        chunk.visible = shouldBeVisible;
        chunk.layers.forEach(layer => {
          layer.setVisible(shouldBeVisible);
        });
      }
    });
  }

  // 事件监听
  public on(event: string, callback: (event: MapLoadEvent) => void): void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, []);
    }
    this.eventListeners.get(event)!.push(callback);
  }

  public off(event: string, callback: (event: MapLoadEvent) => void): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      const index = listeners.indexOf(callback);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    }
  }

  // 发送事件
  private emitEvent(type: string, data: Partial<MapLoadEvent>): void {
    const event: MapLoadEvent = {
      type: type as any,
      mapKey: data.mapKey || '',
      ...data
    };

    const listeners = this.eventListeners.get(type);
    if (listeners) {
      listeners.forEach(callback => {
        try {
          callback(event);
        } catch (error) {
          console.error('Error in map system event listener:', error);
        }
      });
    }
  }

  // 销毁
  public destroy(): void {
    this.unloadCurrentMap();
    this.configs.clear();
    this.chunks.clear();
    this.eventListeners.clear();
    this.loadingMaps.clear();
    this.preloadedMaps.clear();
  }
}
import * as Phaser from 'phaser';

/**
 * 瓦片类型枚举
 * 定义游戏中可用的各种瓦片类型
 */
export enum TileType {
    GRASS = 'grass',
    DIRT = 'dirt',
    TILLED_DIRT = 'tilled_dirt',
    STONE = 'stone',
    WATER = 'water',
    SAND = 'sand',
    DARKER_GRASS = 'darker_grass',
    SOIL = 'soil',
    BUSH = 'bush',
    HILL = 'hill',
    PATH = 'path'
}

/**
 * 瓦片属性接口
 * 定义每个瓦片的基本属性
 */
export interface TileProperties {
    type: TileType;
    walkable: boolean;          // 是否可行走
    farmable: boolean;          // 是否可种植
    waterSource: boolean;       // 是否是水源
    textureKey: string;         // 纹理键名
    frameIndex?: number;        // 帧索引（用于动画瓦片）
    animationFrames?: number[]; // 动画帧数组
}

/**
 * 瓦片地图数据接口
 */
export interface TileMapData {
    width: number;              // 地图宽度（瓦片数量）
    height: number;             // 地图高度（瓦片数量）
    tileWidth: number;          // 单个瓦片宽度（像素）
    tileHeight: number;         // 单个瓦片高度（像素）
    layers: TileLayer[];        // 图层数组
}

/**
 * 瓦片图层接口
 */
export interface TileLayer {
    name: string;               // 图层名称
    data: number[];             // 瓦片数据（一维数组）
    visible: boolean;           // 是否可见
    opacity: number;            // 透明度
    depth: number;              // 渲染深度
}

/**
 * 瓦片地图管理器
 * 负责管理游戏中的瓦片地图系统，包括瓦片渲染、碰撞检测、动画等
 */
export class TileMapManager {
    private scene: Phaser.Scene;
    private tileProperties: Map<number, TileProperties> = new Map();
    private tilemap: Phaser.Tilemaps.Tilemap | null = null;
    private tileset: Phaser.Tilemaps.Tileset | null = null;
    private layers: Map<string, Phaser.Tilemaps.TilemapLayer> = new Map();
    private animatedTiles: Map<string, Phaser.GameObjects.Sprite[]> = new Map();
    
    // 瓦片尺寸配置
    private readonly TILE_WIDTH = 32;
    private readonly TILE_HEIGHT = 32;

    constructor(scene: Phaser.Scene) {
        this.scene = scene;
        this.initializeTileProperties();
    }

    /**
     * 初始化瓦片属性
     * 定义所有瓦片类型的基本属性
     */
    private initializeTileProperties(): void {
        // 草地瓦片
        this.tileProperties.set(1, {
            type: TileType.GRASS,
            walkable: true,
            farmable: false,
            waterSource: false,
            textureKey: 'grass_tiles'
        });

        // 深色草地瓦片
        this.tileProperties.set(2, {
            type: TileType.DARKER_GRASS,
            walkable: true,
            farmable: false,
            waterSource: false,
            textureKey: 'darker_grass_tiles'
        });

        // 泥土瓦片
        this.tileProperties.set(3, {
            type: TileType.DIRT,
            walkable: true,
            farmable: true,
            waterSource: false,
            textureKey: 'soil_tiles'
        });

        // 耕地瓦片
        this.tileProperties.set(4, {
            type: TileType.TILLED_DIRT,
            walkable: true,
            farmable: true,
            waterSource: false,
            textureKey: 'tilled_dirt_tiles'
        });

        // 石头瓦片
        this.tileProperties.set(5, {
            type: TileType.STONE,
            walkable: false,
            farmable: false,
            waterSource: false,
            textureKey: 'stone_tiles'
        });

        // 水瓦片（带动画）
        this.tileProperties.set(6, {
            type: TileType.WATER,
            walkable: false,
            farmable: false,
            waterSource: true,
            textureKey: 'water_tiles',
            animationFrames: [0, 1, 2, 3]
        });

        // 灌木瓦片
        this.tileProperties.set(7, {
            type: TileType.BUSH,
            walkable: false,
            farmable: false,
            waterSource: false,
            textureKey: 'bush_tiles'
        });

        // 小径瓦片
        this.tileProperties.set(8, {
            type: TileType.PATH,
            walkable: true,
            farmable: false,
            waterSource: false,
            textureKey: 'path_tiles'
        });
    }

    /**
     * 检查瓦片资源是否已加载
     * 验证所有必需的瓦片纹理是否可用
     */
    private checkTileAssets(): boolean {
        const requiredTextures = [
            'grass_tiles', 'darker_grass_tiles', 'soil_tiles', 
            'stone_tiles', 'bush_tiles', 'tilled_dirt_tiles',
            'water_tiles', 'path_tiles'
        ];

        return requiredTextures.every(texture => {
            const exists = this.scene.textures.exists(texture);
            if (!exists) {
                console.warn(`Tile texture not found: ${texture}`);
            }
            return exists;
        });
    }

    /**
     * 创建瓦片地图
     * 根据提供的地图数据创建瓦片地图
     */
    createTileMap(mapData: TileMapData): void {
        // 检查资源是否已加载
        if (!this.checkTileAssets()) {
            console.warn('Some tile assets are missing, creating map with available assets');
        }

        // 创建瓦片地图配置
        const tilemapConfig = {
            tileWidth: mapData.tileWidth,
            tileHeight: mapData.tileHeight,
            width: mapData.width,
            height: mapData.height
        };

        // 创建空白瓦片地图
        this.tilemap = this.scene.make.tilemap(tilemapConfig);

        // 为每个图层创建瓦片集和图层
        mapData.layers.forEach(layerData => {
            this.createTileLayer(layerData, mapData);
        });

        // 设置碰撞属性
        this.setupCollisions();

        // 创建动画瓦片
        this.createAnimatedTiles();
    }

    /**
     * 创建瓦片图层
     */
    private createTileLayer(layerData: TileLayer, mapData: TileMapData): void {
        if (!this.tilemap) return;

        // 为每种瓦片类型创建瓦片集
        const tilesetKeys = ['grass_tiles', 'darker_grass_tiles', 'soil_tiles', 'stone_tiles', 'bush_tiles', 'tilled_dirt_tiles', 'water_tiles', 'path_tiles'];
        const tilesets: Phaser.Tilemaps.Tileset[] = [];
        
        tilesetKeys.forEach(key => {
            if (this.scene.textures.exists(key)) {
                const tileset = this.tilemap!.addTilesetImage(key, key, this.TILE_WIDTH, this.TILE_HEIGHT);
                if (tileset) {
                    tilesets.push(tileset);
                }
            }
        });

        // 使用手动方式创建图层，因为我们需要设置瓦片数据
        if (tilesets.length > 0) {
            // 创建空白图层
            const layer = this.tilemap.createBlankLayer(layerData.name, tilesets);
            
            if (layer) {
                // 设置图层数据
                this.setLayerData(layer, layerData.data, mapData.width, mapData.height);
                
                // 设置图层属性
                layer.setVisible(layerData.visible);
                layer.setAlpha(layerData.opacity);
                layer.setDepth(layerData.depth);
                
                this.layers.set(layerData.name, layer);
            }
        }
    }

    /**
     * 设置图层瓦片数据
     */
    private setLayerData(layer: Phaser.Tilemaps.TilemapLayer, data: number[], width: number, height: number): void {
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                const index = y * width + x;
                const tileId = data[index];
                
                if (tileId > 0) {
                    // 根据瓦片ID选择合适的瓦片集和帧
                    const tileInfo = this.getTileInfo(tileId);
                    if (tileInfo) {
                        layer.putTileAt(tileInfo.frameIndex, x, y);
                    }
                }
            }
        }
    }

    /**
     * 根据瓦片ID获取瓦片信息
     */
    private getTileInfo(tileId: number): { textureKey: string; frameIndex: number } | null {
        const properties = this.tileProperties.get(tileId);
        if (!properties) return null;

        // 简单的帧索引映射，可以根据需要扩展
        let frameIndex = 0;
        switch (properties.type) {
            case TileType.GRASS:
                frameIndex = 0;
                break;
            case TileType.DARKER_GRASS:
                frameIndex = 0;
                break;
            case TileType.DIRT:
                frameIndex = 0;
                break;
            case TileType.TILLED_DIRT:
                frameIndex = 0;
                break;
            case TileType.STONE:
                frameIndex = 0;
                break;
            case TileType.WATER:
                frameIndex = 0;
                break;
            case TileType.BUSH:
                frameIndex = 0;
                break;
            case TileType.PATH:
                frameIndex = 0;
                break;
        }

        return {
            textureKey: properties.textureKey,
            frameIndex: frameIndex
        };
    }

    /**
     * 设置碰撞属性
     */
    private setupCollisions(): void {
        this.layers.forEach(layer => {
            // 设置不可行走的瓦片为碰撞瓦片
            layer.setCollisionByProperty({ walkable: false });
        });
    }

    /**
     * 创建动画瓦片
     */
    private createAnimatedTiles(): void {
        // 创建水瓦片动画
        if (this.scene.textures.exists('water_tiles')) {
            this.scene.anims.create({
                key: 'water_animation',
                frames: this.scene.anims.generateFrameNumbers('water_tiles', { start: 0, end: 3 }),
                frameRate: 4,
                repeat: -1
            });
        }
    }

    /**
     * 创建默认农场地图
     * 创建一个基础的农场地图布局
     */
    createDefaultFarmMap(width: number = 50, height: number = 40): void {
        const mapData: TileMapData = {
            width: width,
            height: height,
            tileWidth: this.TILE_WIDTH,
            tileHeight: this.TILE_HEIGHT,
            layers: [
                {
                    name: 'background',
                    data: this.generateBackgroundLayer(width, height),
                    visible: true,
                    opacity: 1.0,
                    depth: 1
                },
                {
                    name: 'terrain',
                    data: this.generateTerrainLayer(width, height),
                    visible: true,
                    opacity: 1.0,
                    depth: 2
                },
                {
                    name: 'decorations',
                    data: this.generateDecorationLayer(width, height),
                    visible: true,
                    opacity: 1.0,
                    depth: 3
                }
            ]
        };

        this.createTileMap(mapData);
    }

    /**
     * 生成背景图层
     */
    private generateBackgroundLayer(width: number, height: number): number[] {
        const data: number[] = [];
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                // 使用草地作为基础背景
                data.push(1); // 草地瓦片ID
            }
        }
        return data;
    }

    /**
     * 生成地形图层
     */
    private generateTerrainLayer(width: number, height: number): number[] {
        const data: number[] = [];
        
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                let tileId = 0; // 0 表示空瓦片（透明）
                
                // 创建池塘区域
                if (x >= 35 && x <= 45 && y >= 5 && y <= 15) {
                    tileId = 6; // 水瓦片
                }
                // 创建农田区域
                else if (x >= 30 && x <= 48 && y >= 20 && y <= 35) {
                    tileId = 3; // 泥土瓦片
                }
                // 创建小径
                else if ((x >= 20 && x <= 25 && y >= 0 && y <= height) || 
                         (y >= 15 && y <= 20 && x >= 0 && x <= width)) {
                    tileId = 8; // 小径瓦片
                }
                // 添加一些石头障碍
                else if (Math.random() < 0.02) {
                    tileId = 5; // 石头瓦片
                }
                // 添加一些灌木装饰
                else if (Math.random() < 0.01) {
                    tileId = 7; // 灌木瓦片
                }
                
                data.push(tileId);
            }
        }
        return data;
    }

    /**
     * 生成装饰图层
     */
    private generateDecorationLayer(width: number, height: number): number[] {
        const data: number[] = [];
        
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                let tileId = 0; // 默认空瓦片
                
                // 在边界添加深色草地
                if (x === 0 || x === width - 1 || y === 0 || y === height - 1) {
                    tileId = 2; // 深色草地
                }
                
                data.push(tileId);
            }
        }
        return data;
    }

    /**
     * 获取指定位置的瓦片属性
     */
    getTilePropertiesAt(x: number, y: number, layerName: string = 'terrain'): TileProperties | null {
        const layer = this.layers.get(layerName);
        if (!layer) return null;

        const tile = layer.getTileAtWorldXY(x, y);
        if (!tile) return null;

        return this.tileProperties.get(tile.index) || null;
    }

    /**
     * 检查指定位置是否可行走
     */
    isWalkable(x: number, y: number): boolean {
        const properties = this.getTilePropertiesAt(x, y);
        return properties ? properties.walkable : true;
    }

    /**
     * 检查指定位置是否可种植
     */
    isFarmable(x: number, y: number): boolean {
        const properties = this.getTilePropertiesAt(x, y);
        return properties ? properties.farmable : false;
    }

    /**
     * 检查指定位置是否是水源
     */
    isWaterSource(x: number, y: number): boolean {
        const properties = this.getTilePropertiesAt(x, y);
        return properties ? properties.waterSource : false;
    }

    /**
     * 设置瓦片类型
     */
    setTile(x: number, y: number, tileId: number, layerName: string = 'terrain'): void {
        const layer = this.layers.get(layerName);
        if (!layer || !this.tilemap) return;

        const tileX = Math.floor(x / this.TILE_WIDTH);
        const tileY = Math.floor(y / this.TILE_HEIGHT);
        
        layer.putTileAt(tileId, tileX, tileY);
    }

    /**
     * 获取瓦片地图的边界
     */
    getBounds(): Phaser.Geom.Rectangle {
        if (!this.tilemap) {
            return new Phaser.Geom.Rectangle(0, 0, 0, 0);
        }

        return new Phaser.Geom.Rectangle(
            0,
            0,
            this.tilemap.widthInPixels,
            this.tilemap.heightInPixels
        );
    }

    /**
     * 销毁瓦片地图管理器
     */
    destroy(): void {
        this.layers.forEach(layer => {
            layer.destroy();
        });
        this.layers.clear();

        this.animatedTiles.forEach(sprites => {
            sprites.forEach(sprite => sprite.destroy());
        });
        this.animatedTiles.clear();

        if (this.tilemap) {
            this.tilemap.destroy();
            this.tilemap = null;
        }

        this.tileProperties.clear();
    }

    /**
     * 更新动画瓦片
     */
    update(time: number, delta: number): void {
        // 这里可以添加瓦片动画更新逻辑
        // 例如水波纹动画、风吹草动等
    }

    /**
     * 获取所有图层
     */
    getLayers(): Map<string, Phaser.Tilemaps.TilemapLayer> {
        return this.layers;
    }

    /**
     * 获取瓦片地图实例
     */
    getTilemap(): Phaser.Tilemaps.Tilemap | null {
        return this.tilemap;
    }
}
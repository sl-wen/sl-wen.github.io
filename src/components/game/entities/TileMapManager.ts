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

    // 通过 Grass_tiles_v2.png 选出的 11 个 16x16 帧索引（运行时计算）
    private grassFrameIndices: number[] = [];
    private grassEdgeIndices: number[] = [];
    private debugEnabled: boolean = false;
    private debugLogCount: number = 0;

    // 使用 atlas 直接渲染（经由 PreloadScene 提取的纹理）
    private grassAtlasKeys: string[] = [
        'grass_v2_1', 'grass_v2_2', 'grass_v2_3', 'grass_v2_4', 'grass_v2_5',
        'grass_v2_6', 'grass_v2_7', 'grass_v2_8', 'grass_v2_9', 'grass_v2_10', 'grass_v2_11'
    ];
    private grassAtlasEdgeKeys: string[] = ['grass_v2_1', 'grass_v2_2', 'grass_v2_3', 'grass_v2_4'];
    private grassContainer: Phaser.GameObjects.Container | null = null;

    // 瓦片尺寸配置
    private readonly TILE_WIDTH = 16;
    private readonly TILE_HEIGHT = 16;

    constructor(scene: Phaser.Scene) {
        this.scene = scene;
        this.computeGrassFrameIndices();

        // 读取本地开关：localStorage.tileDebug === '1' 时开启瓦片调试日志
        if (typeof window !== 'undefined') {
            try {
                this.debugEnabled = localStorage.getItem('tileDebug') === '1';
            } catch (_) { /* ignore */ }
        }
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

        // 使用 atlas 直接渲染背景层
        const bgLayer = mapData.layers.find(l => l.name === 'background');
        if (bgLayer) {
            this.renderGrassAtlasLayer(bgLayer, mapData);
        }

        // 其他图层仍可按原 tilemap 方式渲染（目前只处理非 background 名称）
        mapData.layers.filter(l => l.name !== 'background').forEach(layerData => {
            this.createTileLayer(layerData, mapData);
        });

        // 设置碰撞属性（如有需要可开启）
        // this.setupCollisions();

        // 创建动画瓦片（如有需要可开启）
        this.createAnimatedTiles();
    }

    /**
     * 创建瓦片图层
     */
    private createTileLayer(layerData: TileLayer, mapData: TileMapData): void {
        if (!this.tilemap) return;

        // 选取一个可用的瓦片集（使用单一 tileset 避免多集索引问题）
        const candidateKeys = ['grass_tiles', 'soil_tiles', 'darker_grass_tiles', 'tilled_dirt_tiles', 'stone_tiles', 'bush_tiles', 'water_tiles', 'path_tiles'];
        const selectedKey = candidateKeys.find(key => this.scene.textures.exists(key));
        if (!selectedKey) {
            console.warn('No tileset textures available for layer', layerData.name);
            return;
        }

        const tileset = this.tilemap.addTilesetImage(selectedKey, selectedKey, this.TILE_WIDTH, this.TILE_HEIGHT);
        if (!tileset) {
            console.warn('Failed to create tileset for', selectedKey);
            return;
        }

        // 正确传入尺寸创建空白图层
        const layer = this.tilemap.createBlankLayer(
            layerData.name,
            tileset,
            0,
            0,
            mapData.width,
            mapData.height,
            this.TILE_WIDTH,
            this.TILE_HEIGHT
        );

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

    /**
     * 设置图层瓦片数据
     */
    private setLayerData(layer: Phaser.Tilemaps.TilemapLayer, data: number[], width: number, height: number): void {
        if (!Array.isArray(data) || data.length < width * height) {
            console.warn('TileMapManager.setLayerData: data size mismatch', { dataLength: data ? data.length : -1, expected: width * height, width, height });
        }

        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                const index = y * width + x;
                const tileId = data[index] ?? 0;

                if (tileId > 0) {
                    try {
                        const frameIndex = this.chooseGrassFrameIndex(x, y, width, height);
                        this.debugTileChoice(x, y, frameIndex, 'grass_tiles');
                        layer.putTileAt(frameIndex, x, y);
                    } catch (e) {
                        console.warn('putTileAt failed', { x, y, tileId }, e);
                    }
                }
            }
        }
    }

    /**
     * 使用 atlas 的独立纹理直接渲染草地背景
     */
    private renderGrassAtlasLayer(layerData: TileLayer, mapData: TileMapData): void {
        // 清理旧容器
        if (this.grassContainer) {
            this.grassContainer.destroy(true);
        }
        this.grassContainer = this.scene.add.container(0, 0);
        this.grassContainer.setDepth(layerData.depth);

        for (let y = 0; y < mapData.height; y++) {
            for (let x = 0; x < mapData.width; x++) {
                const index = y * mapData.width + x;
                const tileId = layerData.data[index] ?? 0;
                if (tileId <= 0) continue;

                const key = this.chooseGrassAtlasKey(x, y, mapData.width, mapData.height);
                // 若纹理不存在则跳过
                if (!this.scene.textures.exists(key)) continue;

                const img = this.scene.add.image(
                    x * this.TILE_WIDTH + this.TILE_WIDTH / 2,
                    y * this.TILE_HEIGHT + this.TILE_HEIGHT / 2,
                    key
                );
                img.setOrigin(0.5, 0.5);
                img.setDisplaySize(this.TILE_WIDTH, this.TILE_HEIGHT);
                this.grassContainer.add(img);
            }
        }
    }

    /**
     * 根据瓦片ID获取瓦片信息
     */
    private getTileInfoById(tileId: number): { textureKey: string; frameIndex: number } | null {
        const properties = this.tileProperties.get(tileId);
        if (!properties) return null;

        // 简单的帧索引映射，可以根据需要扩展
        let frameIndex = 0;
        switch (properties.type) {
            case TileType.GRASS:
                frameIndex = 0; // 默认索引，后续在 setLayerData 中替换为更合适的帧
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
     * 计算草地11个帧在 spritesheet 中的索引
     */
    private computeGrassFrameIndices(): void {
        try {
            if (!this.scene.textures.exists('grass_tiles')) {
                if (this.debugEnabled) {
                    console.warn('[TileMapManager] texture "grass_tiles" not found when computing indices');
                }
                return;
            }
            const texture = this.scene.textures.get('grass_tiles');
            // 通过 __BASE 源图片拿尺寸
            const source = texture.getSourceImage() as HTMLImageElement;
            const cols = Math.floor(source.width / this.TILE_WIDTH);
            if (this.debugEnabled) {
                console.log('[TileMapManager] grass source size:', source.width, 'x', source.height, 'tile:', this.TILE_WIDTH, 'cols:', cols);
            }

            // 用户在多图集工具里导出的 11 个坐标（单位像素）
            const coords = [
                { x: 0, y: 80 },
                { x: 24, y: 80 },
                { x: 48, y: 80 },
                { x: 64, y: 80 },
                { x: 0, y: 96 },
                { x: 48, y: 96 },
                { x: 80, y: 96 },
                { x: 80, y: 80 },
                { x: 64, y: 96 },
                { x: 32, y: 96 },
                { x: 16, y: 96 }
            ];

            this.grassFrameIndices = coords.map(c => {
                const col = Math.floor(c.x / this.TILE_WIDTH);
                const row = Math.floor(c.y / this.TILE_HEIGHT);
                // Tilemap tileset 索引从 1 开始
                return row * cols + col + 1;
            });

            // 简单划分：前4个作为边缘候选，其余用于中心随机
            this.grassEdgeIndices = this.grassFrameIndices.slice(0, Math.min(4, this.grassFrameIndices.length));

            if (this.debugEnabled) {
                console.log('[TileMapManager] grassFrameIndices:', [...this.grassFrameIndices], 'edge:', [...this.grassEdgeIndices]);
            }
        } catch (e) {
            console.warn('computeGrassFrameIndices failed', e);
            this.grassFrameIndices = [];
            this.grassEdgeIndices = [];
        }
    }

    /**
     * 根据位置选择草地帧索引（边缘更稳定、中心更随机）
     */
    private chooseGrassFrameIndex(x: number, y: number, width: number, height: number): number {
        // 如果没有可用索引，回退到0
        if (this.grassFrameIndices.length === 0) return 0;

        const isEdge = (x === 0 || y === 0 || x === width - 1 || y === height - 1);
        if (isEdge && this.grassEdgeIndices.length > 0) {
            const idx = Math.floor(Math.random() * this.grassEdgeIndices.length);
            return this.grassEdgeIndices[idx];
        }

        const idx = Math.floor(Math.random() * this.grassFrameIndices.length);
        return this.grassFrameIndices[idx];
    }

    /**
     * 调试输出：记录瓦片选择
     */
    private debugTileChoice(x: number, y: number, frameIndex: number, textureKey: string): void {
        if (!this.debugEnabled) return;
        // 限制日志量，边缘必打，内部抽样
        const isEdge = (x === 0 || y === 0 || !this.tilemap || x === this.tilemap.width - 1 || y === this.tilemap.height - 1);
        const sampled = ((x + y) % 19 === 0);
        if (isEdge || sampled) {
            if (this.debugLogCount < 500) {
                console.log(`[TileDebug] (${x},${y}) -> texture=${textureKey || 'N/A'} frame=${frameIndex ?? 'N/A'}`);
                this.debugLogCount++;
            }
        }
    }

    /**
     * 选择 atlas 的草地纹理 key
     */
    private chooseGrassAtlasKey(x: number, y: number, width: number, height: number): string {
        const isEdge = (x === 0 || y === 0 || x === width - 1 || y === height - 1);
        if (isEdge && this.grassAtlasEdgeKeys.length > 0) {
            const idx = Math.floor(Math.random() * this.grassAtlasEdgeKeys.length);
            return this.grassAtlasEdgeKeys[idx];
        }
        const idx = Math.floor(Math.random() * this.grassAtlasKeys.length);
        return this.grassAtlasKeys[idx];
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
     * 创建全草地图
     * 用草地填满整个地图，不包含水、道路或装饰
     * 现在会根据屏幕尺寸动态调整地图大小以确保完整覆盖
     */
    public createAllGrassMap(width?: number, height?: number): void {
        // 如果没有提供尺寸，则根据屏幕尺寸计算
        if (width === undefined || height === undefined) {
            const screenDimensions = this.calculateOptimalMapSize();
            width = screenDimensions.width;
            height = screenDimensions.height;
        }

        const data: number[] = new Array(width * height).fill(1); // 1 = GRASS

        const mapData: TileMapData = {
            width,
            height,
            tileWidth: this.TILE_WIDTH,
            tileHeight: this.TILE_HEIGHT,
            layers: [
                { name: 'background', data, visible: true, opacity: 1, depth: 1 }
            ]
        };

        this.createTileMap(mapData);

        // 记录地图尺寸用于边界设置
        this.mapWidth = width;
        this.mapHeight = height;

        console.log(`Created grass map with dimensions: ${width}x${height} tiles (${width * this.TILE_WIDTH}x${height * this.TILE_HEIGHT} pixels)`);
    }

    // 记录地图尺寸
    private mapWidth: number = 0;
    private mapHeight: number = 0;

    /**
     * 获取地图的像素尺寸
     * @returns 地图的像素宽度和高度
     */
    public getPixelSize(): { width: number; height: number } {
        return {
            width: this.mapWidth * this.TILE_WIDTH,
            height: this.mapHeight * this.TILE_HEIGHT
        };
    }

    /**
     * 计算最佳地图尺寸以覆盖整个屏幕
     * 根据当前屏幕尺寸和设备类型动态计算地图大小
     */
    private calculateOptimalMapSize(): { width: number; height: number } {
        // 获取屏幕尺寸
        const screenWidth = this.scene.cameras.main.width;
        const screenHeight = this.scene.cameras.main.height;
        
        // 检测设备类型
        const isMobile = screenWidth < 768;
        const isPortrait = screenHeight > screenWidth;
        
        // 计算需要的瓦片数量，确保完全覆盖屏幕
        // 添加额外的缓冲区以确保在所有设备上都有足够的覆盖
        const bufferMultiplier = isMobile ? 1.5 : 1.3;
        
        let tilesWidth = Math.ceil((screenWidth * bufferMultiplier) / this.TILE_WIDTH);
        let tilesHeight = Math.ceil((screenHeight * bufferMultiplier) / this.TILE_HEIGHT);
        
        // 为移动设备设置最小尺寸，确保有足够的游戏空间
        if (isMobile) {
            if (isPortrait) {
                // 竖屏模式：确保有足够的垂直空间
                tilesWidth = Math.max(tilesWidth, 50);
                tilesHeight = Math.max(tilesHeight, 70);
            } else {
                // 横屏模式：确保有足够的水平空间
                tilesWidth = Math.max(tilesWidth, 80);
                tilesHeight = Math.max(tilesHeight, 45);
            }
        } else {
            // 桌面端：使用默认的较大尺寸
            tilesWidth = Math.max(tilesWidth, 60);
            tilesHeight = Math.max(tilesHeight, 40);
        }
        
        // 设置合理的最大值以避免性能问题
        tilesWidth = Math.min(tilesWidth, 120);
        tilesHeight = Math.min(tilesHeight, 80);
        
        console.log(`Screen: ${screenWidth}x${screenHeight}, Mobile: ${isMobile}, Portrait: ${isPortrait}`);
        console.log(`Calculated optimal map size: ${tilesWidth}x${tilesHeight} tiles`);
        
        return {
            width: tilesWidth,
            height: tilesHeight
        };
    }

    /**
     * 重新创建草地图以适应新的屏幕尺寸
     * 在屏幕方向改变或窗口大小调整时调用
     */
    public refreshGrassMapForNewScreenSize(): void {
        console.log('Refreshing grass map for new screen size...');
        
        // 清除现有的瓦片地图
        if (this.tilemap) {
            this.tilemap.destroy();
            this.tilemap = null;
        }
        
        // 重新创建草地图
        this.createAllGrassMap();
        
        // 更新物理世界和摄像机边界
        const mapSize = this.getPixelSize();
        this.scene.physics.world.setBounds(0, 0, mapSize.width, mapSize.height);
        this.scene.cameras.main.setBounds(0, 0, mapSize.width, mapSize.height);
        
        console.log(`Grass map refreshed with new size: ${mapSize.width}x${mapSize.height} pixels`);
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

    /**
     * 高级碰撞检测 - 检查玩家是否可以移动到指定位置
     */
    canMoveTo(x: number, y: number, playerWidth: number = 32, playerHeight: number = 32): boolean {
        const tileX = Math.floor(x / this.TILE_WIDTH);
        const tileY = Math.floor(y / this.TILE_HEIGHT);

        // 检查玩家占用的所有瓦片
        const tilesWidth = Math.ceil(playerWidth / this.TILE_WIDTH);
        const tilesHeight = Math.ceil(playerHeight / this.TILE_HEIGHT);

        for (let dy = 0; dy < tilesHeight; dy++) {
            for (let dx = 0; dx < tilesWidth; dx++) {
                const checkX = (tileX + dx) * this.TILE_WIDTH;
                const checkY = (tileY + dy) * this.TILE_HEIGHT;

                if (!this.isWalkable(checkX, checkY)) {
                    return false;
                }
            }
        }

        return true;
    }


    /**
     * 瓦片交互处理
     */
    interactWithTile(x: number, y: number, tool: string): boolean {
        const properties = this.getTilePropertiesAt(x, y);
        if (!properties) return false;

        switch (tool) {
            case 'hoe':
                // 锄头可以将泥土变为耕地
                if (properties.type === TileType.DIRT) {
                    this.setTile(x, y, 4); // 设置为耕地
                    return true;
                }
                break;

            case 'watering_can':
                // 水壶可以给耕地浇水
                if (properties.type === TileType.TILLED_DIRT) {
                    // 添加浇水效果
                    this.addWateringEffect(x, y);
                    return true;
                }
                break;

            case 'seeds':
                // 种子可以种植在耕地上
                if (properties.type === TileType.TILLED_DIRT) {
                    // 种植逻辑由其他系统处理
                    return true;
                }
                break;
        }

        return false;
    }

    /**
     * 添加浇水视觉效果
     */
    private addWateringEffect(x: number, y: number): void {
        // 创建水滴粒子效果
        const tileX = Math.floor(x / this.TILE_WIDTH) * this.TILE_WIDTH + this.TILE_WIDTH / 2;
        const tileY = Math.floor(y / this.TILE_HEIGHT) * this.TILE_HEIGHT + this.TILE_HEIGHT / 2;

        // 创建简单的水滴效果
        for (let i = 0; i < 5; i++) {
            const droplet = this.scene.add.circle(
                tileX + (Math.random() - 0.5) * 20,
                tileY + (Math.random() - 0.5) * 20,
                2,
                0x4A90E2
            );

            // 水滴动画
            this.scene.tweens.add({
                targets: droplet,
                alpha: 0,
                scaleX: 0.5,
                scaleY: 0.5,
                duration: 500,
                ease: 'Power2',
                onComplete: () => {
                    droplet.destroy();
                }
            });
        }
    }

    /**
     * 获取瓦片在指定位置的详细信息
     */
    getTileInfo(x: number, y: number): {
        tileX: number;
        tileY: number;
        worldX: number;
        worldY: number;
        properties: TileProperties | null;
        layer: string | null;
    } {
        const tileX = Math.floor(x / this.TILE_WIDTH);
        const tileY = Math.floor(y / this.TILE_HEIGHT);
        const worldX = tileX * this.TILE_WIDTH;
        const worldY = tileY * this.TILE_HEIGHT;

        let properties: TileProperties | null = null;
        let layer: string | null = null;

        // 检查所有图层找到第一个非空瓦片（避免 for..of 迭代 Map）
        this.layers.forEach((tileLayer, layerName) => {
            if (properties !== null) {
                return;
            }
            const tile = tileLayer.getTileAt(tileX, tileY);
            if (tile && tile.index > 0) {
                properties = this.tileProperties.get(tile.index) || null;
                layer = layerName;
            }
        });

        return {
            tileX,
            tileY,
            worldX,
            worldY,
            properties,
            layer
        };
    }
}
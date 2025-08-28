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
    private waterContainer: Phaser.GameObjects.Container | null = null;
    private waterBackdrop: Phaser.GameObjects.TileSprite | null = null;
    private waterBackdropUpdate?: (time: number, delta: number) => void;
    private gridGraphics: Phaser.GameObjects.Graphics | null = null;
    private debugTextContainer: Phaser.GameObjects.Container | null = null;
    private mapOriginX: number = 0;
    private mapOriginY: number = 0;

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
        // 将草地容器整体移动到地图原点，这样子元素用局部坐标即可
        this.grassContainer.setPosition(this.mapOriginX, this.mapOriginY);

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

        // 调试：绘制网格与瓦片文字
        if (this.debugEnabled) {
            this.renderDebugGrid(mapData.width, mapData.height);
            this.renderTileDebugTexts(mapData.width, mapData.height);
        }
    }

    /**
     * 调试渲染：绘制瓦片网格
     */
    private renderDebugGrid(width: number, height: number): void {
        if (this.gridGraphics) {
            this.gridGraphics.destroy();
        }
        const g = this.scene.add.graphics();
        g.setDepth(10000);
        g.lineStyle(1, 0xff0000, 0.25);

        // 竖线
        for (let x = 0; x <= width; x++) {
            const px = x * this.TILE_WIDTH;
            g.beginPath();
            g.moveTo(this.mapOriginX + px, this.mapOriginY + 0);
            g.lineTo(this.mapOriginX + px, this.mapOriginY + height * this.TILE_HEIGHT);
            g.strokePath();
        }
        // 横线
        for (let y = 0; y <= height; y++) {
            const py = y * this.TILE_HEIGHT;
            g.beginPath();
            g.moveTo(this.mapOriginX + 0, this.mapOriginY + py);
            g.lineTo(this.mapOriginX + width * this.TILE_WIDTH, this.mapOriginY + py);
            g.strokePath();
        }

        this.gridGraphics = g;
        // 确保在场景最上层
        this.scene.children.bringToTop(this.gridGraphics);
    }

    /**
     * 调试渲染：在每个瓦片中心标注 纹理key 与 (x,y) 坐标
     */
    private renderTileDebugTexts(width: number, height: number): void {
        if (this.debugTextContainer) {
            this.debugTextContainer.destroy(true);
        }
        this.debugTextContainer = this.scene.add.container(0, 0);
        this.debugTextContainer.setDepth(10001);
        this.debugTextContainer.setPosition(this.mapOriginX, this.mapOriginY);

        const style: Phaser.Types.GameObjects.Text.TextStyle = {
            fontFamily: 'monospace',
            fontSize: '8px',
            color: '#000',
            backgroundColor: 'rgba(255,255,255,0.6)'
        };

        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                const key = this.chooseGrassAtlasKey(x, y, width, height);
                const text = this.scene.add.text(
                    x * this.TILE_WIDTH + 1,
                    y * this.TILE_HEIGHT + 1,
                    `${key}\n(${x},${y})`,
                    style
                );
                text.setOrigin(0, 0);
                text.setDepth(1000);
                this.debugTextContainer.add(text);
            }
        }

        // 确保文字容器处于最上层
        this.scene.children.bringToTop(this.debugTextContainer);
    }

    /**
     * 在地图边缘渲染一圈水瓦片
     * 目的：当精灵走到边界时，边界以内显示水面，避免空白
     */
    private renderWaterBorder(width: number, height: number): void {
        try {
            // 清理旧容器
            if (this.waterContainer) {
                this.waterContainer.destroy(true);
            }
            this.waterContainer = this.scene.add.container(0, 0);
            // 放在草地之上、其他元素之下，略高于背景层
            this.waterContainer.setDepth(2);

            // 若无水纹理，直接返回
            const hasWater = this.scene.textures.exists('water_tiles');
            const useAnim = hasWater && this.scene.anims.exists('water_animation');

            const addWaterAt = (x: number, y: number) => {
                const worldX = x * this.TILE_WIDTH + this.TILE_WIDTH / 2;
                const worldY = y * this.TILE_HEIGHT + this.TILE_HEIGHT / 2;
                if (useAnim) {
                    const spr = this.scene.add.sprite(worldX, worldY, 'water_tiles', 0);
                    spr.setOrigin(0.5, 0.5);
                    spr.setDisplaySize(this.TILE_WIDTH, this.TILE_HEIGHT);
                    spr.play('water_animation');
                    this.waterContainer!.add(spr);
                } else if (hasWater) {
                    const spr = this.scene.add.image(worldX, worldY, 'water_tiles', 0 as any);
                    spr.setOrigin(0.5, 0.5);
                    spr.setDisplaySize(this.TILE_WIDTH, this.TILE_HEIGHT);
                    this.waterContainer!.add(spr);
                }
            };

            // 顶边与底边
            for (let x = 0; x < width; x++) {
                addWaterAt(x, 0);
                addWaterAt(x, height - 1);
            }
            // 左右边（排除四角已添加）
            for (let y = 1; y < height - 1; y++) {
                addWaterAt(0, y);
                addWaterAt(width - 1, y);
            }
        } catch (e) {
            console.warn('renderWaterBorder failed:', e);
        }
    }

    /**
     * 创建/更新“无限海面”背景：用 TileSprite 铺满整个视口，并根据相机滚动平移纹理
     * 位于最底层（草地下方），看起来像边界外延伸的海
     */
    private ensureInfiniteWaterBackdrop(): void {
        const hasWaterTexture = this.scene.textures.exists('water_tiles');

        const cam = this.scene.cameras.main;
        const margin = 32; // 四周留边，避免裁剪
        const width = Math.max(1, Math.ceil(cam.width + margin * 2));
        const height = Math.max(1, Math.ceil(cam.height + margin * 2));

        // 首次创建
        if (!this.waterBackdrop) {
            // 若无水纹理，使用一个1x1像素的动态纹理临时生成平铺背景
            let textureKey = 'water_tiles';
            if (!hasWaterTexture) {
                textureKey = '__solid_water_fallback__';
                if (!this.scene.textures.exists(textureKey)) {
                    const canvasTexture = this.scene.textures.createCanvas(textureKey, 2, 2);
                    if (canvasTexture) {
                        const ctx = canvasTexture.getContext();
                        ctx.fillStyle = '#3a7bd5';
                        ctx.fillRect(0, 0, 2, 2);
                        canvasTexture.refresh();
                    }
                }
            }

            // 若有多帧可用则默认使用第一帧，否则不指定帧名
            let waterFrame: any = undefined;
            if (hasWaterTexture) {
                try {
                    const names = (this.scene.textures.get('water_tiles') as any).getFrameNames?.() || [];
                    waterFrame = names.length ? names[0] : undefined;
                } catch (_) { /* ignore */ }
            }
            this.waterBackdrop = this.scene.add.tileSprite(0, 0, width, height, textureKey, waterFrame);
            this.waterBackdrop.setOrigin(0, 0);
            this.waterBackdrop.setScrollFactor(0); // 固定在屏幕
            this.waterBackdrop.setDepth(0); // 草地在1层，本层在其下方

            // 同步相机滚动到贴图偏移，制造“无限”效果
            this.waterBackdropUpdate = () => {
                if (!this.waterBackdrop) return;
                this.waterBackdrop.tilePositionX = cam.scrollX;
                this.waterBackdrop.tilePositionY = cam.scrollY;
                // 由于固定在屏幕，保持左上角位置为 -margin，确保边缘不露底
                this.waterBackdrop.x = -margin;
                this.waterBackdrop.y = -margin;
            };
            this.scene.events.on('update', this.waterBackdropUpdate);
        }

        // 尺寸变化时调整大小并保持居中
        if (this.waterBackdrop) {
            // 左上对齐并覆盖整个视口，外加边距
            this.waterBackdrop.x = -margin;
            this.waterBackdrop.y = -margin;
            this.waterBackdrop.displayWidth = width;
            this.waterBackdrop.displayHeight = height;
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
        // 创建水瓦片动画（健壮性处理：无多帧时跳过；已存在时不重复创建）
        if (!this.scene.textures.exists('water_tiles')) {
            return;
        }

        // 防止重复注册
        if (this.scene.anims.exists('water_animation')) {
            return;
        }

        try {
            const texture: any = this.scene.textures.get('water_tiles');
            const frameNames: string[] = typeof texture.getFrameNames === 'function' ? texture.getFrameNames() : [];
            const available = frameNames.length;

            if (available >= 2) {
                const numeric = frameNames.every(n => /^\d+$/.test(n));
                const frames = (numeric
                    ? frameNames
                    : frameNames.slice(0, Math.min(4, available))
                ).map((n: string) => ({ key: 'water_tiles', frame: numeric ? parseInt(n, 10) : n }));

                this.scene.anims.create({
                    key: 'water_animation',
                    frames,
                    frameRate: 4,
                    repeat: -1
                });
            } else {
                // 单帧水纹理：不创建动画，避免 Frame "0" not found 错误
            }
        } catch (e) {
            console.warn('createAnimatedTiles skipped due to texture/frames issue:', e);
        }
    }

    /**
     * 创建全草地图
     * 用草地填满整个地图，不包含水、道路或装饰
     * 现在会根据屏幕尺寸动态调整地图大小以确保完整覆盖
     */
    public createAllGrassMap(width?: number, height?: number): void {
        // 固定默认地图尺寸；若外部传入则以传入为准
        if (width === undefined || height === undefined) {
            width = 10;
            height = 10;
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

        // 计算使地图居中的偏移，让地图出现在当前视口中央
        const cam = this.scene.cameras.main;
        const mapPixelWidth = width * this.TILE_WIDTH;
        const mapPixelHeight = height * this.TILE_HEIGHT;
        // 使用相机滚动与视口尺寸计算，使地图在当前视口中心
        const zoom = cam.zoom || 1;
        const worldViewWidth = cam.width / zoom;
        const worldViewHeight = cam.height / zoom;
        this.mapOriginX = Math.floor(cam.scrollX + (worldViewWidth - mapPixelWidth) / 2);
        this.mapOriginY = Math.floor(cam.scrollY + (worldViewHeight - mapPixelHeight) / 2);

        this.createTileMap(mapData);

        // 固定地图为实体边界，边界外由无限海面承接；不再渲染一圈水瓦片

        // 创建/更新无限海面背景（在最底层）
        this.ensureInfiniteWaterBackdrop();

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
     * 获取地图的像素边界（包含原点偏移），用于设置物理世界/相机边界
     */
    public getMapBoundsPixels(): Phaser.Geom.Rectangle {
        return new Phaser.Geom.Rectangle(
            this.mapOriginX,
            this.mapOriginY,
            this.mapWidth * this.TILE_WIDTH,
            this.mapHeight * this.TILE_HEIGHT
        );
    }

    /**
     * 获取地图中心点（像素坐标）
     */
    public getMapCenter(): { x: number; y: number } {
        return {
            x: this.mapOriginX + (this.mapWidth * this.TILE_WIDTH) / 2,
            y: this.mapOriginY + (this.mapHeight * this.TILE_HEIGHT) / 2
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
        // 增加更大的缓冲区以确保草地完全覆盖屏幕
        const bufferMultiplier = isMobile ? 2.5 : 2.0;

        let tilesWidth = Math.ceil((screenWidth * bufferMultiplier) / this.TILE_WIDTH);
        let tilesHeight = Math.ceil((screenHeight * bufferMultiplier) / this.TILE_HEIGHT);

        // 为移动设备设置更大的最小尺寸，确保草地完全覆盖
        if (isMobile) {
            if (isPortrait) {
                // 竖屏模式：增加更多瓦片确保完全覆盖
                tilesWidth = Math.max(tilesWidth, 80);
                tilesHeight = Math.max(tilesHeight, 120);
            } else {
                // 横屏模式：增加更多瓦片确保完全覆盖
                tilesWidth = Math.max(tilesWidth, 120);
                tilesHeight = Math.max(tilesHeight, 80);
            }
        } else {
            // 桌面端：使用更大的尺寸确保完全覆盖
            tilesWidth = Math.max(tilesWidth, 100);
            tilesHeight = Math.max(tilesHeight, 80);
        }

        // 设置更大的最大值以确保完全覆盖，同时避免严重的性能问题
        tilesWidth = Math.min(tilesWidth, 200);
        tilesHeight = Math.min(tilesHeight, 150);

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

        // 更新物理世界和摄像机边界（参考项目方案）
        const bounds = this.getMapBoundsPixels();
        this.scene.physics.world.setBounds(bounds.x, bounds.y, bounds.width, bounds.height);
        this.scene.cameras.main.setBounds(bounds.x, bounds.y, bounds.width, bounds.height);

        console.log(`Grass map refreshed with new size: ${bounds.width}x${bounds.height} pixels at (${bounds.x},${bounds.y})`);

        // 也更新无限海面背景以匹配新的屏幕尺寸
        this.ensureInfiniteWaterBackdrop();
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

        if (this.waterBackdropUpdate) {
            this.scene.events.off('update', this.waterBackdropUpdate);
            this.waterBackdropUpdate = undefined;
        }
        if (this.waterBackdrop) {
            this.waterBackdrop.destroy();
            this.waterBackdrop = null;
        }

        if (this.gridGraphics) {
            this.gridGraphics.destroy();
            this.gridGraphics = null;
        }
        if (this.debugTextContainer) {
            this.debugTextContainer.destroy(true);
            this.debugTextContainer = null;
        }
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

    /**
     * 更新背景草地以适应全屏模式
     * 在全屏模式下扩展草地背景以覆盖整个屏幕
     * @param isFullscreen 是否处于全屏模式
     */
    updateBackgroundForFullscreen(isFullscreen: boolean): void {
        if (!this.grassContainer) return;

        try {
            if (isFullscreen) {
                // 获取当前屏幕尺寸
                const screenWidth = this.scene.scale.width;
                const screenHeight = this.scene.scale.height;

                // 计算需要多少瓦片来覆盖整个屏幕
                const tilesNeededX = Math.ceil(screenWidth / this.TILE_WIDTH) + 2; // 多2个瓦片确保覆盖
                const tilesNeededY = Math.ceil(screenHeight / this.TILE_HEIGHT) + 2; // 多2个瓦片确保覆盖

                // 清除现有的草地背景
                this.grassContainer.removeAll(true);

                // 重新渲染扩展的草地背景
                for (let y = -1; y < tilesNeededY; y++) { // 从-1开始确保完全覆盖
                    for (let x = -1; x < tilesNeededX; x++) { // 从-1开始确保完全覆盖
                        const key = this.chooseGrassAtlasKey(x, y, tilesNeededX, tilesNeededY);

                        // 检查纹理是否存在
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

                console.log(`Background grass extended for fullscreen: ${tilesNeededX}x${tilesNeededY} tiles`);
            } else {
                // 非全屏模式下恢复原始大小的背景
                // 这里可以重新加载原始的地图数据，或者保持当前大小
                console.log('Background grass restored to normal size');
            }
        } catch (error) {
            console.error('Error updating background for fullscreen:', error);
        }

        // 同时确保无限海面背景覆盖当前视口
        this.ensureInfiniteWaterBackdrop();
    }
}
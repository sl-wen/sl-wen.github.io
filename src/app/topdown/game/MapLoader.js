/**
 * 地图加载器 MapLoader
 * 
 * 统一处理 Tiled 地图的加载、图块集配置、图层创建和碰撞检测
 * 专为 Phaser 3 + GridEngine 架构设计
 * 
 * 主要功能：
 * - 加载 Tiled 导出的 JSON 地图文件
 * - 自动配置图块集和图层
 * - 提取碰撞瓦片信息
 * - 支持调试模式输出详细信息
 * 
 * 使用方法：
 * 1. 在 BootScene 中预加载地图：
 *    this.load.tilemapTiledJSON('map', '/topdown/game/map.json');
 * 2. 在 GameScene 中加载地图：
 *    const { map, layers, collidableTileIds } = MapLoader.load(this, 'map', { debug: true });
 * 
 * 注意事项：
 * - 图块集名称必须与预加载的资源键名一致
 * - 支持多图块集的复合地图
 * - 自动处理碰撞属性和图层深度设置
 */
export default class MapLoader {
    /**
     * 加载 Tiled 地图并配置碰撞检测
     * 
     * 这是 MapLoader 的核心方法，负责完整的地图加载流程
     * 
     * @param {Phaser.Scene} scene - 游戏场景实例
     * @param {string} mapKey - 地图资源键名（需在 BootScene 中预加载）
     * @param {Object} options - 配置选项
     * @param {boolean} [options.debug=false] - 是否启用调试模式
     * @param {Set<string>} [options.blockingTilesetNames] - 需要设置碰撞的图块集名称
     * 
     * @returns {Object} 地图加载结果对象
     * @returns {Phaser.Tilemaps.Tilemap} returns.map - 加载的地图实例
     * @returns {Record<string, Phaser.Tilemaps.Tileset>} returns.tilesets - 图块集映射表
     * @returns {Phaser.Tilemaps.TilemapLayer[]} returns.layers - 创建的图层数组
     * @returns {Set<number>} returns.collidableTileIds - 可碰撞瓦片ID集合
     * 
     * 使用示例：
     * ```javascript
     * // 在 GameScene.create() 中调用
     * const { map, layers, collidableTileIds } = MapLoader.load(this, 'map', { 
     *   debug: true,
     *   blockingTilesetNames: new Set(['Walls', 'Obstacles'])
     * });
     * 
     * // 使用返回的数据
     * this.map = map;
     * this.collidableTileIds = collidableTileIds;
     * layers.forEach(layer => {
     *   this.physics.add.collider(this.player, layer);
     * });
     * ```
     */
    static load(scene, mapKey, options = {}) {
        const { debug = false } = options;
        const blockingTilesetNames = options.blockingTilesetNames || new Set(['Fences', 'House', 'House Decoration', 'interaction']);

        const map = scene.make.tilemap({ key: mapKey });
        const collidableTileIds = new Set();

        if (debug) {
            // eslint-disable-next-line no-console
            console.log('[MapLoader] Loading map:', mapKey);
        }

        // Add tilesets by name (names must match preloaded keys)
        const addedTilesets = {};
        if (Array.isArray(map.tilesets) && map.tilesets.length > 0) {
            map.tilesets.forEach((tileset) => {
                const tilesetName = tileset.name;
                try {
                    addedTilesets[tilesetName] = map.addTilesetImage(tilesetName, tilesetName);
                } catch (e) {
                    // eslint-disable-next-line no-console
                    console.warn('[MapLoader] Failed to add tileset:', tilesetName, e);
                }
            });
        } else {
            try {
                addedTilesets.tileset = map.addTilesetImage('tileset', 'tileset');
            } catch (_) { /* noop */ }
        }

        const tilesetArray = Object.values(addedTilesets);
        const createdLayers = [];

        // Create layers in original order, configure collisions
        for (let i = 0; i < map.layers.length; i += 1) {
            const layerData = map.layers[i];
            const layer = map.createLayer(i, tilesetArray.length > 0 ? tilesetArray : 'tileset', 0, 0);
            if (!layer) {
                // eslint-disable-next-line no-console
                console.error('[MapLoader] Failed to create layer:', layerData?.name);
                continue;
            }

            createdLayers.push(layer);

            // Ensure deterministic draw order via depth matching original layer index
            try { layer.setDepth(i); } catch (_) { /* noop */ }

            // Hide pure collision layers by convention
            const layerNameLower = String(layerData?.name || '').toLowerCase();
            if (layerNameLower.includes('collision')) {
                layer.setVisible(false);
            }

            // Special-case: ensure Fence layer is collidable
            // Some maps may not have tile properties set, so we enforce collisions by layer name
            if (layerNameLower === 'fence') {
                try {
                    layer.forEachTile((tile) => {
                        if (tile && tile.index >= 0) {
                            tile.setCollision(true);
                            // Also mark a property so engines that rely on properties can detect it
                            // Note: Phaser Tile properties are mutable at runtime
                            // eslint-disable-next-line no-param-reassign
                            tile.properties = tile.properties || {};
                            // eslint-disable-next-line no-param-reassign
                            tile.properties.ge_collide = true;
                            collidableTileIds.add(tile.index);
                        }
                    });
                } catch (_) { /* noop */ }
            }

            // 1) Tile-level property based collisions
            try {
                layer.setCollisionByProperty({ ge_collide: true });
                layer.forEachTile((tile) => {
                    if (tile && tile.index >= 0 && tile.properties?.ge_collide) {
                        collidableTileIds.add(tile.index);
                    }
                });
            } catch (_) { /* noop */ }

            // 2) Layer-level ge_collide flag => all non-empty tiles collide
            try {
                const hasLayerGeCollide = Array.isArray(layerData.properties)
                    && layerData.properties.some((p) => p?.name === 'ge_collide' && p?.value === true);
                if (hasLayerGeCollide) {
                    layer.forEachTile((tile) => {
                        if (tile && tile.index >= 0) {
                            tile.setCollision(true);
                            collidableTileIds.add(tile.index);
                        }
                    });
                }
            } catch (_) { /* noop */ }

            // 3) Fallback: by tileset name treat as blocking
            try {
                layer.forEachTile((tile) => {
                    const tilesetName = tile?.tileset?.name;
                    if (!tile || tile.index < 0 || !tilesetName) return;
                    if (blockingTilesetNames.has(tilesetName)) {
                        tile.setCollision(true);
                        collidableTileIds.add(tile.index);
                    }
                });
            } catch (_) { /* noop */ }

            // 4) Apply collision groups from Tiled, if present
            try {
                if (typeof layer.setCollisionFromCollisionGroup === 'function') {
                    layer.setCollisionFromCollisionGroup(true, true);
                } else if (typeof map.setCollisionFromCollisionGroup === 'function') {
                    map.setCollisionFromCollisionGroup(true, true, layer);
                }
            } catch (_) { /* noop */ }

            // 5) Explicit obstacle tile ids used by existing maps (170) + hide when in special layers
            try {
                const explicitObstacleIds = [170];
                if (layerData.name === 'Objects' || layerData.name === 'Collision' || layerData.name === 'Farmable') {
                    explicitObstacleIds.forEach((id) => {
                        layer.setCollision(id);
                    });
                    layer.forEachTile((tile) => {
                        if (!tile || tile.index < 0) return;
                        if (explicitObstacleIds.includes(tile.index)) {
                            tile.setVisible(false);
                            collidableTileIds.add(tile.index);
                        }
                    });
                }
                // Global safety net for these ids
                layer.forEachTile((tile) => {
                    if (!tile || tile.index < 0) return;
                    if (explicitObstacleIds.includes(tile.index)) {
                        tile.setCollision(true);
                        collidableTileIds.add(tile.index);
                    }
                });
            } catch (_) { /* noop */ }
        }

        return {
            map,
            tilesets: addedTilesets,
            layers: createdLayers,
            collidableTileIds,
        };
    }
}


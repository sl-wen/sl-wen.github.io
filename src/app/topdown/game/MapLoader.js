/**
 * MapLoader
 *
 * 统一加载 Tiled 地图（JSON）、图块集、图层，并提取碰撞瓦片 ID，供 Phaser 3 + GridEngine 使用。
 *
 * 简化的碰撞策略（推荐）：
 * 1) 在 Tiled 的“瓦片”或“图层”上设置自定义属性 `ge_collide: true` 作为阻挡依据；
 * 2) 本模块仅读取上述属性，收集瓦片 ID 到 Set，并返回给上层；
 * 3) GridEngine 使用 `collisionTiles` 判定移动阻挡；无需额外 Arcade Physics 碰撞配置。
 */
export default class MapLoader {
    /**
     * Load a Tiled map (exported JSON) and configure collisions.
     *
     * @param {Phaser.Scene} scene
     * @param {string} mapKey - Key preloaded via scene.load.tilemapTiledJSON
     * @param {object} options
     * @param {boolean} [options.debug=false]
     * @param {Set<string>} [options.blockingTilesetNames]
     * @returns {{
     *   map: Phaser.Tilemaps.Tilemap,
     *   tilesets: Record<string, Phaser.Tilemaps.Tileset>,
     *   layers: Phaser.Tilemaps.TilemapLayer[],
     *   collidableTileIds: Set<number>
     * }}
     */
    static load(scene, mapKey, options = {}) {
        const { debug = false } = options;

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

        // 按原始顺序创建图层，并从属性中提取碰撞瓦片
        for (let i = 0; i < map.layers.length; i += 1) {
            const layerData = map.layers[i];
            const layer = map.createLayer(i, tilesetArray.length > 0 ? tilesetArray : 'tileset', 0, 0);
            if (!layer) {
                // eslint-disable-next-line no-console
                console.error('[MapLoader] Failed to create layer:', layerData?.name);
                continue;
            }

            createdLayers.push(layer);

            // 约定：名称包含 "collision" 的图层仅用于阻挡，不参与渲染
            const layerNameLower = String(layerData?.name || '').toLowerCase();
            if (layerNameLower.includes('collision')) {
                layer.setVisible(false);
            }

            // 1) 瓦片级：基于瓦片属性 ge_collide: true 的阻挡
            try {
                layer.setCollisionByProperty({ ge_collide: true });
                layer.forEachTile((tile) => {
                    if (tile && tile.index >= 0 && tile.properties?.ge_collide) {
                        collidableTileIds.add(tile.index);
                    }
                });
            } catch (_) { /* noop */ }

            // 2) 图层级：若图层属性 ge_collide: true，则该图层所有“非空”瓦片均为阻挡
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
        }

        return {
            map,
            tilesets: addedTilesets,
            layers: createdLayers,
            collidableTileIds,
        };
    }
}


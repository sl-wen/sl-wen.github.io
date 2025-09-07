/**
 * MapLoader
 *
 * Centralizes loading of Tiled tilemaps, tilesets, layers and collision extraction
 * for Phaser 3 + GridEngine.
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
        const blockingTilesetNames = options.blockingTilesetNames || new Set(['Fences', 'House', 'House Decoration', 'interaction']);

        const map = scene.make.tilemap({ key: mapKey });
        const collidableTileIds = new Set();

        // 移除日志输出，保持静默加载

        // Add tilesets by name (names must match preloaded keys)
        const addedTilesets = {};
        if (Array.isArray(map.tilesets) && map.tilesets.length > 0) {
            map.tilesets.forEach((tileset) => {
                const tilesetName = tileset.name;
                try {
                    addedTilesets[tilesetName] = map.addTilesetImage(tilesetName, tilesetName);
                } catch (e) { /* noop */ }
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
            if (!layer) { continue; }

            createdLayers.push(layer);

            // Hide pure collision layers by convention
            const layerNameLower = String(layerData?.name || '').toLowerCase();
            if (layerNameLower.includes('collision')) {
                layer.setVisible(false);
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

            // 5) Explicit obstacle tile ids used by existing maps (169,170) + hide when in special layers
            try {
                const explicitObstacleIds = [169, 170];
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


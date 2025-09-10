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

        // 步骤1：添加图块集到地图
        // 图块集名称必须与在 BootScene 中预加载的资源键名完全一致
        // 例如：this.load.image('House', '/path/to/house.png') 对应 tileset.name = 'House'
        const addedTilesets = {};
        if (Array.isArray(map.tilesets) && map.tilesets.length > 0) {
            // 遍历地图中定义的所有图块集
            map.tilesets.forEach((tileset) => {
                const tilesetName = tileset.name;
                try {
                    // 将图块集图像添加到 Phaser 地图中
                    // 第一个参数：Tiled 中的图块集名称
                    // 第二个参数：预加载时使用的资源键名（必须相同）
                    addedTilesets[tilesetName] = map.addTilesetImage(tilesetName, tilesetName);
                } catch (e) {
                    // eslint-disable-next-line no-console
                    console.warn('[MapLoader] 添加图块集失败:', tilesetName, e);
                    console.warn('[MapLoader] 请检查 BootScene 中是否正确预加载了该图块集资源');
                }
            });
        } else {
            // 兼容性处理：如果地图没有定义图块集，尝试使用默认的 'tileset'
            try {
                addedTilesets.tileset = map.addTilesetImage('tileset', 'tileset');
            } catch (_) { /* 忽略默认图块集加载失败 */ }
        }

        const tilesetArray = Object.values(addedTilesets);
        const createdLayers = [];

        // 步骤2：按原始顺序创建图层并配置碰撞检测
        for (let i = 0; i < map.layers.length; i += 1) {
            const layerData = map.layers[i];
            // 创建图层：使用索引、图块集数组、位置坐标
            const layer = map.createLayer(i, tilesetArray.length > 0 ? tilesetArray : 'tileset', 0, 0);
            if (!layer) {
                // eslint-disable-next-line no-console
                console.error('[MapLoader] 创建图层失败:', layerData?.name);
                console.error('[MapLoader] 可能原因：图块集未正确加载或图层数据损坏');
                continue;
            }

            createdLayers.push(layer);

            // 设置图层深度，确保渲染顺序与 Tiled 中的图层顺序一致
            // 深度值越大，图层渲染越靠前（覆盖其他图层）
            try { layer.setDepth(i); } catch (_) { /* 忽略深度设置失败 */ }

            // 按命名约定隐藏纯碰撞图层
            // 包含 'collision' 关键词的图层通常用于碰撞检测，不需要显示
            const layerNameLower = String(layerData?.name || '').toLowerCase();
            if (layerNameLower.includes('collision')) {
                layer.setVisible(false);
                if (debug) {
                    // eslint-disable-next-line no-console
                    console.log('[MapLoader] 隐藏碰撞图层:', layerData?.name);
                }
            }

            // 步骤3：特殊处理 - 确保 Fence 图层的碰撞检测
            // 某些地图可能没有设置瓦片属性，因此通过图层名称强制启用碰撞
            if (layerNameLower === 'fence') {
                try {
                    layer.forEachTile((tile) => {
                        if (tile && tile.index >= 0) {
                            // 设置瓦片的碰撞属性
                            tile.setCollision(true);
                            // 同时标记属性，供依赖属性的引擎检测使用
                            // 注意：Phaser 瓦片属性在运行时是可变的
                            // eslint-disable-next-line no-param-reassign
                            tile.properties = tile.properties || {};
                            // eslint-disable-next-line no-param-reassign
                            tile.properties.ge_collide = true;
                            // 记录可碰撞的瓦片ID供后续使用
                            collidableTileIds.add(tile.index);
                        }
                    });
                    if (debug) {
                        // eslint-disable-next-line no-console
                        console.log('[MapLoader] 为 Fence 图层强制启用碰撞检测');
                    }
                } catch (_) { /* 忽略 Fence 图层处理失败 */ }
            }

            // 步骤4：基于瓦片级属性的碰撞检测
            // 检查每个瓦片的 ge_collide 属性，如果为 true 则启用碰撞
            try {
                layer.setCollisionByProperty({ ge_collide: true });
                layer.forEachTile((tile) => {
                    if (tile && tile.index >= 0 && tile.properties?.ge_collide) {
                        collidableTileIds.add(tile.index);
                        if (debug) {
                            // eslint-disable-next-line no-console
                            console.log(`[MapLoader] 瓦片 ${tile.index} 通过属性启用碰撞`);
                        }
                    }
                });
            } catch (_) { /* 忽略瓦片属性碰撞设置失败 */ }

            // 步骤5：基于图层级 ge_collide 标志的碰撞检测
            // 如果整个图层标记了 ge_collide=true，则该图层所有非空瓦片都启用碰撞
            try {
                const hasLayerGeCollide = Array.isArray(layerData.properties)
                    && layerData.properties.some((p) => p?.name === 'ge_collide' && p?.value === true);
                if (hasLayerGeCollide) {
                    if (debug) {
                        // eslint-disable-next-line no-console
                        console.log(`[MapLoader] 图层 "${layerData?.name}" 启用全图层碰撞`);
                    }
                    layer.forEachTile((tile) => {
                        if (tile && tile.index >= 0) {
                            tile.setCollision(true);
                            collidableTileIds.add(tile.index);
                        }
                    });
                }
            } catch (_) { /* 忽略图层级碰撞设置失败 */ }

            // 步骤6：基于图块集名称的回退碰撞检测
            // 如果瓦片所属的图块集名称在阻挡列表中，则启用碰撞
            // 默认阻挡图块集：Fences, House, House Decoration, interaction
            try {
                layer.forEachTile((tile) => {
                    const tilesetName = tile?.tileset?.name;
                    if (!tile || tile.index < 0 || !tilesetName) return;
                    if (blockingTilesetNames.has(tilesetName)) {
                        tile.setCollision(true);
                        collidableTileIds.add(tile.index);
                        if (debug) {
                            // eslint-disable-next-line no-console
                            console.log(`[MapLoader] 图块集 "${tilesetName}" 中的瓦片 ${tile.index} 启用碰撞`);
                        }
                    }
                });
            } catch (_) { /* 忽略图块集碰撞设置失败 */ }

            // 步骤7：应用 Tiled 中的碰撞组设置（如果存在）
            // Tiled 编辑器支持为瓦片设置碰撞组，这里尝试应用这些设置
            try {
                if (typeof layer.setCollisionFromCollisionGroup === 'function') {
                    layer.setCollisionFromCollisionGroup(true, true);
                    if (debug) {
                        // eslint-disable-next-line no-console
                        console.log(`[MapLoader] 为图层 "${layerData?.name}" 应用 Tiled 碰撞组设置`);
                    }
                } else if (typeof map.setCollisionFromCollisionGroup === 'function') {
                    map.setCollisionFromCollisionGroup(true, true, layer);
                    if (debug) {
                        // eslint-disable-next-line no-console
                        console.log(`[MapLoader] 为图层 "${layerData?.name}" 应用全局碰撞组设置`);
                    }
                }
            } catch (_) { /* 忽略碰撞组设置失败 */ }

            // 步骤8：处理特定障碍物瓦片ID（兼容现有地图）
            // 某些现有地图使用特定的瓦片ID（如170）作为障碍物标识
            try {
                const explicitObstacleIds = [170]; // 硬编码的障碍物瓦片ID列表
                
                // 在特殊图层中隐藏这些障碍物瓦片并启用碰撞
                if (layerData.name === 'Objects' || layerData.name === 'Collision' || layerData.name === 'Farmable') {
                    explicitObstacleIds.forEach((id) => {
                        layer.setCollision(id);
                    });
                    layer.forEachTile((tile) => {
                        if (!tile || tile.index < 0) return;
                        if (explicitObstacleIds.includes(tile.index)) {
                            tile.setVisible(false); // 隐藏障碍物瓦片（仅保留碰撞）
                            collidableTileIds.add(tile.index);
                            if (debug) {
                                // eslint-disable-next-line no-console
                                console.log(`[MapLoader] 隐藏特殊障碍物瓦片 ${tile.index} 在图层 "${layerData.name}"`);
                            }
                        }
                    });
                }
                
                // 全局安全网：确保这些ID在所有图层中都启用碰撞
                layer.forEachTile((tile) => {
                    if (!tile || tile.index < 0) return;
                    if (explicitObstacleIds.includes(tile.index)) {
                        tile.setCollision(true);
                        collidableTileIds.add(tile.index);
                    }
                });
            } catch (_) { /* 忽略特殊障碍物处理失败 */ }
        }

        // 调试信息输出
        if (debug) {
            // eslint-disable-next-line no-console
            console.log('[MapLoader] 地图加载完成');
            // eslint-disable-next-line no-console
            console.log('[MapLoader] 创建的图层数量:', createdLayers.length);
            // eslint-disable-next-line no-console
            console.log('[MapLoader] 可碰撞瓦片ID数量:', collidableTileIds.size);
            // eslint-disable-next-line no-console
            console.log('[MapLoader] 可碰撞瓦片ID列表:', Array.from(collidableTileIds).sort((a, b) => a - b));
        }

        return {
            map,                    // Phaser 地图实例
            tilesets: addedTilesets, // 图块集映射表 {名称: Tileset对象}
            layers: createdLayers,   // 创建的图层数组
            collidableTileIds,      // 可碰撞瓦片ID集合
        };
    }
}

/**
 * MapLoader 碰撞检测流程说明
 * ================================
 * 
 * MapLoader 采用多层次的碰撞检测策略，按优先级顺序处理：
 * 
 * 1. 特殊图层处理（Fence）
 *    - 对名为 'fence' 的图层强制启用所有瓦片的碰撞
 *    - 适用于围栏、边界等必须阻挡的元素
 * 
 * 2. 瓦片级属性检测
 *    - 检查每个瓦片的 'ge_collide' 属性
 *    - 在 Tiled 中可为单个瓦片设置自定义属性
 *    - 优先级最高，可精确控制每个瓦片的碰撞
 * 
 * 3. 图层级属性检测
 *    - 检查图层的 'ge_collide' 属性
 *    - 如果图层标记了此属性，该图层所有非空瓦片都启用碰撞
 *    - 适用于整层都是障碍物的情况
 * 
 * 4. 图块集名称匹配
 *    - 根据瓦片所属的图块集名称判断是否启用碰撞
 *    - 默认阻挡图块集：'Fences', 'House', 'House Decoration', 'interaction'
 *    - 可通过 options.blockingTilesetNames 自定义
 * 
 * 5. Tiled 碰撞组
 *    - 应用 Tiled 编辑器中设置的碰撞组
 *    - 支持 Tiled 的内置碰撞检测功能
 * 
 * 6. 特殊瓦片ID处理
 *    - 处理硬编码的障碍物瓦片ID（如170）
 *    - 在特定图层中隐藏这些瓦片但保留碰撞
 *    - 兼容现有地图的特殊需求
 * 
 * 使用建议：
 * - 优先使用瓦片/图层属性方式，便于在 Tiled 中可视化编辑
 * - 图块集名称匹配适用于统一风格的障碍物
 * - 特殊瓦片ID仅用于兼容性，新地图应避免使用
 * 
 * 调试技巧：
 * - 启用 debug 选项查看详细的碰撞设置过程
 * - 检查返回的 collidableTileIds 确认碰撞设置是否正确
 * - 在 Phaser 中启用物理调试可视化碰撞边界
 */


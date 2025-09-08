/**
 * 主游戏场景 GameScene
 * 
 * 职责：
 * - 加载并实例化地图（Tiled 导出的 tilemap）
 * - 创建主角、NPC、敌人、物品以及对应动画
 * - 建立碰撞体与交互触发器（对话、传送、可破坏草丛、可推动箱子等）
 * - 处理输入（由 InputManager 统一管理），驱动 GridEngine 网格移动
 * - 维护角色生命值、金币等状态并通过自定义事件同步到 React UI
 * - 处理敌人 AI（随机巡逻、追踪玩家、攻击节奏）
 * - 处理场景切换（传送门）与相机跟随/边界
 * 
 * 使用方法（开发者视角）：
 * 1. 在 `App.js` 的 Phaser 配置中将本场景加入 scene 数组（已完成）。
 * 2. 通过 `MainMenuScene` 开始游戏时调用：
 *    this.scene.start('GameScene', {
 *      catStatus: { position, previousPosition, frame, facingDirection, coin, haveSword },
 *      mapKey: 'your_map_key_from_BootScene',
 *    });
 * 3. 地图资源需在 `BootScene` 预加载，并确保 Tiled 中 tileset 名称与此处 `addTilesetImage` 匹配。
 * 5. 输入与移动：
 *    - 键盘 WASD/方向键 与 触摸（虚拟摇杆/动作按钮）均通过 `InputManager` 统一处理。
 *    - 在 `update()` 中读取当前方向并调用 `gridEngine.move('cat', direction)`。
 * 
 * 常见问题排查：
 * - 人物无法从传送门离开当前房间：检查 `Player` 对象层是否存在 teleportTo 对象，格式是否正确；检查 tileset 名称是否与 `BootScene` 加载一致。
 * - 图块显示异常：核对 Tiled 中 tileset 的名称与 `addTilesetImage` 所用 key 保持一致。
 *
 * 使用说明（运行与集成）：
 * - 启动顺序：先在 `BootScene` 预加载资源与 tilemap，再在 `MainMenuScene` 进入 `GameScene`。
 * - 场景入参：通过 `this.scene.start('GameScene', { catStatus, mapKey })` 传入角色状态与地图 key。
 * - 依赖系统：
 *   1) GridEngine 用于网格化移动。
 *   2) InputManager 统一键盘/手柄/触屏输入，提供“JustDown”与当前方向枚举。
 *   3) Phaser Physics（Arcade）用于碰撞检测、重叠触发器（对话/道具/元素/敌人）。
 *   4) React UI 通过 window 自定义事件监听游戏状态（血量、金币、动作上下文、对话）。
 * - Tiled 规范：
 *   - tileset 名称需与 `BootScene` 中 `this.load.image(key)` 的 key 保持一致。
 *   - 对象层名固定为 `Player`，对象属性键使用：`dialog`、`itemData`。
 * - 自定义事件（供 React 侧监听）：
 *   - `cat-coin`：detail: { catCoins: number|null }
 *   - `action-context`：detail: { context: 'talk'|'interact'|'none' }
 *   - `new-dialog`：detail: { characterName: string }；完成事件为 `${characterName}-dialog-finished`
 * - 常用调试：将 Phaser 物理 debug 设为 true，可在全局 window 访问 `phaserGame` 与可视化碰撞体。
 *
 * 注意事项与陷阱：
 * - Tiled 图层若未绑定 tileset 名称，代码会回退到默认 `tileset`，需保证存在此 key。
 * - 自动寻路：用户手动输入会打断 `moveTo`，并隐藏落点高亮。
 */
import { Scene } from 'phaser';
import {
    NPC_MOVEMENT_RANDOM,
    SCENE_FADE_TIME,
} from '../constants';
import InputManager from '../InputManager';
import MapLoader from '../MapLoader';
import { createInteractiveGameObject } from '../utils';

// 将 8 向方向归一为 4 向（用于动画/朝向显示）
let lastCardinal = 'down';
function toCardinal(dir) {
    if (!dir) return lastCardinal;
    if (dir === 'up' || dir === 'right' || dir === 'down' || dir === 'left') {
        lastCardinal = dir;
        return dir;
    }
    if (dir.includes('up')) { lastCardinal = 'up'; return 'up'; }
    if (dir.includes('down')) { lastCardinal = 'down'; return 'down'; }
    if (dir.includes('left')) { lastCardinal = 'left'; return 'left'; }
    if (dir.includes('right')) { lastCardinal = 'right'; return 'right'; }
    return lastCardinal;
}

export default class GameScene extends Scene {
    constructor() {
        super('GameScene');
    }

    inputManager = null;
    isShowingDialog = false;
    isTeleporting = false;
    isAutoMoving = false;
    autoMoveTargetHighlight = null;
    npcSprites = null;
    farmManager = null;
    farmlandGraphics = null;

    init(data) {
        this.initData = data;
    }

    lastCardinal = 'down';
    toCardinal(dir) {
        if (!dir) return lastCardinal;
        if (dir === 'up' || dir === 'right' || dir === 'down' || dir === 'left') {
            lastCardinal = dir;
            return dir;
        }
        // 斜向 → 4 向（可改成水平优先）
        if (dir.includes('up')) { lastCardinal = 'up'; return 'up'; }
        if (dir.includes('down')) { lastCardinal = 'down'; return 'down'; }
        if (dir.includes('left')) { lastCardinal = 'left'; return 'left'; }
        if (dir.includes('right')) { lastCardinal = 'right'; return 'right'; }
        return lastCardinal;
    }

    calculatePreviousTeleportPosition() {
        // 计算传送前玩家的“上一格”位置，用于从目的地回传时的落点与朝向
        const currentPosition = this.gridEngine.getPosition('cat');
        const facingDirection = this.gridEngine.getFacingDirection('cat');

        switch (facingDirection) {
            case 'up': {
                return {
                    x: currentPosition.x,
                    y: currentPosition.y + 1,
                };
            }

            case 'right': {
                return {
                    x: currentPosition.x - 1,
                    y: currentPosition.y,
                };
            }

            case 'down': {
                return {
                    x: currentPosition.x,
                    y: currentPosition.y - 1,
                };
            }

            case 'left': {
                return {
                    x: currentPosition.x + 1,
                    y: currentPosition.y,
                };
            }

            default: {
                return {
                    x: currentPosition.x,
                    y: currentPosition.y,
                };
            }
        }
    }

    getFramesForAnimation(assetKey, animation) {
        // 从精灵图集中筛选指定动画前缀的帧，并按名称排序
        return this.anims.generateFrameNames(assetKey)
            .filter((frame) => {
                if (frame.frame.includes(`${assetKey}_${animation}`)) {
                    const parts = frame.frame.split(`${assetKey}_${animation}_`);
                    return Boolean(!Number.isNaN(Number.parseInt(parts[1], 10)));
                }

                return false;
            })
            .sort((a, b) => (a.frame < b.frame ? -1 : 1));
    }

    createPlayerwalkAnimation(assetKey, animationName) {
        // 角色/NPC 的行走循环动画（上/右/下/左），若不存在则创建
        const animationKey = `${assetKey}_${animationName}`;
        if (!this.anims.exists(animationKey)) {
            this.anims.create({
                key: animationKey,
                frames: [
                    { key: assetKey, frame: `${assetKey}_${animationName}_1` },
                    { key: assetKey, frame: `${assetKey}_${animationName.replace('walk', 'idle')}_1` },
                    { key: assetKey, frame: `${assetKey}_${animationName}_2` },
                ],
                frameRate: 4,
                repeat: -1,
                yoyo: true,
            });
        }
    }

    getStopFrame(direction, spriteKey) {
        // 根据朝向返回该精灵的“站立”帧
        switch (direction) {
            case 'up':
                return `${spriteKey}_idle_up`;
            case 'right':
                return `${spriteKey}_idle_right`;
            case 'down':
                return `${spriteKey}_idle_down`;
            case 'left':
                return `${spriteKey}_idle_left`;
            default:
                return null;
        }
    }

    getOppositeDirection(direction) {
        // 计算相反方向，用于 NPC 面向玩家等场景
        switch (direction) {
            case 'up':
                return 'down';
            case 'right':
                return 'left';
            case 'down':
                return 'up';
            case 'left':
                return 'right';
            default:
                return null;
        }
    }

    getBackPosition(facingDirection, position) {
        // 取得玩家背后一格，用于敌人追踪到玩家身后位置
        switch (facingDirection) {
            case 'up':
                return {
                    ...position,
                    y: position.y + 1,
                };
            case 'right':
                return {
                    ...position,
                    x: position.x - 1,
                };
            case 'down':
                return {
                    ...position,
                    y: position.y - 1,
                };
            case 'left':
                return {
                    ...position,
                    x: position.x + 1,
                };
            default:
                return position;
        }
    }

    /**
     * 计算主角面前一格的像素坐标
     */
    getFrontPixelPosition() {
        const facingDirection = this.gridEngine.getFacingDirection('cat');
        const position = this.gridEngine.getPosition('cat');
        const tileW = this.map?.tileWidth || 16;
        const tileH = this.map?.tileHeight || 16;
        switch (facingDirection) {
            case 'up':
                return { x: position.x * tileW, y: (position.y - 1) * tileH };
            case 'right':
                return { x: (position.x + 1) * tileW, y: position.y * tileH };
            case 'down':
                return { x: position.x * tileW, y: (position.y + 1) * tileH };
            case 'left':
                return { x: (position.x - 1) * tileW, y: position.y * tileH };
            default:
                return { x: position.x * tileW, y: position.y * tileH };
        }
    }

    /**
     * 更新交互上下文并通知 React，决定 ActionButton 的图标
     * 规则优先级：
     * 1) 面前是可对话 NPC => 'talk'
     * 2) 面前是可交互箱子/宝箱 => 'interact'
     */
    updateActionContext() {
        if (!this.catSprite || !this.map) return;
        let nextContext = 'none';

        // 1) 检测面前是否有 NPC（使用存在的 catActionCollider 与 npcSprites 重叠近似）
        const nearbyNpc = this.npcSprites?.getChildren?.().some((npc) => {
            return Phaser.Geom.Intersects.RectangleToRectangle(this.catActionCollider.getBounds(), npc.getBounds());
        });
        if (nearbyNpc) {
            nextContext = 'talk';
        } else {
            // 2) 检测面前一格是否为箱子或其它可交互图块
            const front = this.getFrontPixelPosition();
            const isInteractable = this.map.layers?.some((layer) => {
                const t = layer.tilemapLayer.getTileAtWorldXY(front.x, front.y);
                return t?.properties?.ge_collide || t?.properties?.interactable;
            });
            // 3) 农场交互：面前是否为耕地
            if (this.farmManager) {
                const tileX = Math.floor(front.x / this.map.tileWidth);
                const tileY = Math.floor(front.y / this.map.tileHeight);
                const onFarmland = this.farmManager.isFarmland(tileX, tileY);
                const crop = this.farmManager.getCrop(tileX, tileY);
                if (onFarmland) {
                    if (!crop && this.farmManager.getTotalSeedsCount?.() > 0) {
                        nextContext = 'plant';
                    } else if (crop && crop.canHarvest()) {
                        nextContext = 'harvest';
                    } else if (crop && !crop.watered && crop.stage < 5 && this.farmManager.getWaterCount?.() > 0) {
                        nextContext = 'water';
                    }
                } else if (isInteractable) {
                    nextContext = 'interact';
                }
            } else if (isInteractable) {
                nextContext = 'interact';
            }
        }

        if (this.currentActionContext !== nextContext) {
            this.currentActionContext = nextContext;
            const customEvent = new CustomEvent('action-context', { detail: { context: nextContext } });
            window.dispatchEvent(customEvent);
        }
    }

    extractTeleportDataFromTiled(data) {
        // 从 Tiled 自定义属性中解析传送目的地：mapKey:x,y
        const [mapKey, position] = data.trim().split(':');
        const [x, y] = position.split(',');

        return {
            mapKey,
            x: Number.parseInt(x, 10),
            y: Number.parseInt(y, 10),
        };
    }

    extractNpcDataFromTiled(data) {
        // 从 Tiled 自定义属性中解析 NPC 数据：npcKey:movement;delay;area;direction
        const [npcKey, config] = data.trim().split(':');
        const [movementType, delay, area, direction] = config.split(';');

        return {
            npcKey,
            movementType,
            facingDirection: direction,
            delay: Number.parseInt(delay, 10),
            area: Number.parseInt(area, 10),
        };
    }

    updatecatCoinUi(catCoins) {
        // 通过自定义事件与 React `catCoin` 同步
        const customEvent = new CustomEvent('cat-coin', {
            detail: {
                catCoins,
            },
        });

        window.dispatchEvent(customEvent);
    }

    create() {
        // 场景创建入口：加载地图、创建角色/NPC、设置相机、动画与碰撞
        const camera = this.cameras.main;
        const { game } = this.sys;
        const isDebugMode = this.physics.config.debug;
        const { catStatus, mapKey, farmSave } = this.initData;
        this.currentMapKey = mapKey;
        const {
            position: initialPosition,
            frame: initialFrame,
            facingDirection: initialFacingDirection,
            previousPosition,
            coin: catCoin,
            haveSword: catHaveSword,
        } = catStatus;

        camera.fadeIn(SCENE_FADE_TIME);

        // 初始化输入管理器
        this.inputManager = new InputManager(this);

        // 使用 MapLoader 统一加载地图和碰撞数据
        const { map, layers: createdLayers, collidableTileIds } = MapLoader.load(this, mapKey, { debug: isDebugMode });
        if (isDebugMode) { window.phaserGame = game; }
        this.map = map;

        // cat 主角：初始属性、碰撞盒与交互体
        this.catSprite = this.physics.add
            // 使用 idle 动画 key 作为初始纹理（单帧）
            .sprite(initialPosition.x * map.tileWidth, initialPosition.y * map.tileHeight, `cat_idle_${initialFacingDirection || 'down'}`)
            .setDepth(1);
        this.catSprite.coin = catCoin;

        this.catSprite.haveSword = catHaveSword;
        this.updatecatCoinUi(catCoin);

        this.catSprite.collectCoin = (coinQuantity) => {
            this.catSprite.coin = Math.min(this.catSprite.coin + coinQuantity, 999);
            this.updatecatCoinUi(this.catSprite.coin);
        };

        this.catSprite.body.setSize(14, 14);
        this.catSprite.body.setOffset(9, 13);
        this.catActionCollider = createInteractiveGameObject(
            this,
            this.catSprite.x + 9,
            this.catSprite.y + 36,
            14,
            8,
            'attack',
            isDebugMode
        );
        this.catPresenceCollider = createInteractiveGameObject(
            this,
            this.catSprite.x + 16,
            this.catSprite.y + 20,
            320, // TODO
            320, // TODO
            'presence',
            isDebugMode,
            { x: 0.5, y: 0.5 }
        );
        this.catObjectCollider = createInteractiveGameObject(
            this,
            this.catSprite.x + 16,
            this.catSprite.y + 20,
            24,
            24,
            'object',
            isDebugMode,
            { x: 0.5, y: 0.5 }
        );

        // Items 物品组：金币的待机动画
        this.itemsSprites = this.add.group();

        if (!this.anims.exists('coin_idle')) {
            this.anims.create({
                key: 'coin_idle',
                frames: this.getFramesForAnimation('coin', 'idle'),
                frameRate: 4,
                repeat: -1,
                yoyo: false,
            });
        }

        // 将物理碰撞绑定到主角与所有图层
        createdLayers.forEach((layer) => {
            this.physics.add.collider(this.catSprite, layer);
        });

        const npcsKeys = [];
        const dataLayer = map.getObjectLayer('Player'); // Tiled 中的对象层，承载对话、NPC、传送、物品
        console.log('Data layer:', dataLayer);
        console.log('Data layer objects:', dataLayer?.objects);

        if (dataLayer && dataLayer.objects) {
            dataLayer.objects.forEach((data) => {
                const { properties, x, y } = data;
                console.log('Processing object at:', x, y, 'with properties:', properties);

                if (!properties || !Array.isArray(properties) || properties.length === 0) {
                    return;
                }

                properties.forEach((property) => {
                    const { name, type, value } = property;
                    console.log('Property:', name, type, value);

                    switch (name) {
                        case 'dialog': {
                            const customCollider = createInteractiveGameObject(
                                this,
                                x,
                                y,
                                16,
                                16,
                                'dialog',
                                isDebugMode
                            );

                            this.physics.add.overlap(this.catActionCollider, customCollider, (objA, objB) => {
                                if (this.isShowingDialog) {
                                    return;
                                }

                                if (this.inputManager.isEnterJustDown() || this.inputManager.isSpaceJustDown()) {
                                    const characterName = value;
                                    const customEvent = new CustomEvent('new-dialog', {
                                        detail: {
                                            characterName,
                                        },
                                    });

                                    window.dispatchEvent(customEvent);
                                    const dialogBoxFinishedEventListener = () => {
                                        window.removeEventListener(
                                            `${characterName}-dialog-finished`,
                                            dialogBoxFinishedEventListener
                                        );

                                        // just to consume the JustDown
                                        this.inputManager.isEnterJustDown();
                                        this.inputManager.isSpaceJustDown();

                                        this.time.delayedCall(100, () => {
                                            this.isShowingDialog = false;
                                        });
                                    };
                                    window.addEventListener(
                                        `${characterName}-dialog-finished`,
                                        dialogBoxFinishedEventListener
                                    );

                                    this.isShowingDialog = true;
                                }
                            });

                            break;
                        }

                        case 'npcData': {
                            const {
                                facingDirection,
                                movementType,
                                npcKey,
                                delay,
                                area,
                            } = this.extractNpcDataFromTiled(value);

                            npcsKeys.push({
                                facingDirection,
                                movementType,
                                npcKey,
                                delay,
                                area,
                                x,
                                y,
                            });
                            break;
                        }

                        case 'itemData': {
                            const [itemType] = value.split(':');

                            switch (itemType) {
                                case 'coin': {
                                    const item = this.physics.add
                                        .sprite(x, y, 'coin')
                                        .setDepth(1)
                                        .setOrigin(0, 1);

                                    item.itemType = 'coin';
                                    this.itemsSprites.add(item);
                                    item.anims.play('coin_idle');
                                    break;
                                }

                                case 'sword': {
                                    if (!catHaveSword) {
                                        const item = this.physics.add
                                            .sprite(x, y, 'sword')
                                            .setDepth(1)
                                            .setOrigin(0, 1);

                                        item.itemType = 'sword';
                                        this.itemsSprites.add(item);
                                    }

                                    break;
                                }

                                default: {
                                    break;
                                }
                            }

                            break;
                        }

                        case 'teleportTo': { // 传送门：到达重叠即触发，淡出后重启场景到目标地图
                            console.log('Found teleport object at:', x, y, 'with value:', value);

                            const customCollider = createInteractiveGameObject(
                                this,
                                x,
                                y,
                                16,
                                16,
                                'teleport',
                                isDebugMode,
                                { x: 0, y: 0 }
                            );

                            const {
                                mapKey: teleportToMapKey,
                                x: teleportToX,
                                y: teleportToY,
                            } = this.extractTeleportDataFromTiled(value);

                            console.log('Teleport data:', { teleportToMapKey, teleportToX, teleportToY });

                            const overlapCollider = this.physics.add.overlap(this.catSprite, customCollider, () => {
                                console.log('cat entered teleport, teleporting to:', teleportToMapKey, teleportToX, teleportToY);
                                // camera.stopFollow();
                                this.physics.world.removeCollider(overlapCollider);
                                const facingDirection = this.gridEngine.getFacingDirection('cat');
                                camera.fadeOut(SCENE_FADE_TIME);
                                // this.scene.pause();
                                this.isTeleporting = true;
                                this.isAutoMoving = false;
                                if (this.autoMoveTargetHighlight) {
                                    this.autoMoveTargetHighlight.setVisible(false);
                                }
                                this.gridEngine.stopMovement('cat');

                                this.time.delayedCall(
                                    SCENE_FADE_TIME,
                                    () => {
                                        this.isTeleporting = false;
                                        this.scene.restart({
                                            catStatus: {
                                                position: { x: teleportToX, y: teleportToY },
                                                previousPosition: this.calculatePreviousTeleportPosition(),
                                                frame: `cat_idle_${facingDirection}`,
                                                facingDirection,
                                                coin: this.catSprite.coin,
                                                haveSword: this.catSprite.haveSword,
                                            },
                                            mapKey: teleportToMapKey,
                                            farmSave: this.farmManager?.toJSON?.(),
                                        });
                                        // 地图变更后请求自动保存
                                        triggerAutosave();
                                    }
                                );
                            });

                            break;
                        }

                        default: {
                            break;
                        }
                    }
                });
            });
        }

        camera.startFollow(this.catSprite, true, 1, 1);
        camera.setFollowOffset(0, 0);
        this.cameras.main.setRoundPixels(true);
        camera.setBounds(
            0,
            0,
            Math.max(map.widthInPixels, game.scale.gameSize.width),
            Math.max(map.heightInPixels, game.scale.gameSize.height)
        );

        if (map.widthInPixels < game.scale.gameSize.width) {
            camera.setPosition(
                Math.round((game.scale.gameSize.width - map.widthInPixels) / 2),
                camera.y
            );
        }

        if (map.heightInPixels < game.scale.gameSize.height) {
            camera.setPosition(
                camera.x,
                Math.round((game.scale.gameSize.height - map.heightInPixels) / 2)
            );
        }

        // 参照参考项目：简化碰撞配置
        // 调试：显示所有图层名称
        console.log('All available layers:');
        createdLayers.forEach((layer, index) => {
            console.log(`  Layer ${index}: ${layer.layer.name}`);
        });

        // 找到主要的碰撞图层（优先选择Collision图层）
        let wallsLayer = createdLayers.find(layer => {
            const layerName = layer.layer.name ? layer.layer.name.toLowerCase() : '';
            return layerName === 'collision'; // 优先选择专门的Collision图层
        });

        // 如果没有Collision图层，选择Fence图层
        if (!wallsLayer) {
            wallsLayer = createdLayers.find(layer => {
                const layerName = layer.layer.name ? layer.layer.name.toLowerCase() : '';
                return layerName === 'fence';
            });
        }

        // 如果还没有，选择HouseWalls图层
        if (!wallsLayer) {
            wallsLayer = createdLayers.find(layer => {
                const layerName = layer.layer.name ? layer.layer.name.toLowerCase() : '';
                return layerName.includes('wall');
            });
        }

        // 保存碰撞瓦片ID集合用于调试
        this.collidableTileIds = collidableTileIds;
        this.wallsLayer = wallsLayer;

        console.log('Map loaded successfully');
        console.log('Total collidable tile IDs:', collidableTileIds.size);
        console.log('Walls layer found:', wallsLayer ? wallsLayer.layer.name : 'None');

        // 如果没有找到专门的碰撞图层，使用第一个有碰撞瓦片的图层
        if (!wallsLayer && createdLayers.length > 0) {
            this.wallsLayer = createdLayers[0]; // 使用第一个图层作为备选
            console.log('Using first layer as fallback:', this.wallsLayer.layer.name);
        }

        // 调试：检查选中图层的瓦片情况
        if (this.wallsLayer) {
            let tileCount = 0;
            let collidableCount = 0;
            this.wallsLayer.forEachTile((tile) => {
                if (tile && tile.index >= 0) {
                    tileCount++;
                    if (this.collidableTileIds.has(tile.index)) {
                        collidableCount++;
                    }
                }
            });
            console.log(`Selected layer "${this.wallsLayer.layer.name}" has ${tileCount} tiles, ${collidableCount} collidable`);
        }

        // 参照参考项目：简化GridEngine配置
        const gridEngineConfig = {
            characters: [
                {
                    id: 'cat',
                    sprite: this.catSprite,
                    startPosition: initialPosition,
                    speed: 2,
                    offsetY: 24,
                },
            ],
            numberOfDirections: 8,
            // 使用标准的碰撞属性名称
            collisionTilePropertyName: 'ge_collide',
            // 关键配置：直接指定碰撞瓦片ID
            collisionTiles: Array.from(collidableTileIds),
            // 确保寻路算法正确工作
            pathfinding: {
                algorithm: 'A*',
                considerCosts: false, // 不考虑成本，只考虑碰撞
            },
        };

        // 调试信息：显示 GridEngine 配置
        console.log('GridEngine config:', gridEngineConfig);
        console.log('Total collidable tile IDs collected:', collidableTileIds.size);
        console.log('Map tile size:', map.tileWidth, 'x', map.tileHeight);
        console.log('Map dimensions:', map.width, 'x', map.height);

        // 监听保存快照请求：React 设置页会触发
        const handleRequestSave = () => {
            try {
                const snapshot = {
                    mapKey: this.currentMapKey,
                    catStatus: {
                        position: this.gridEngine.getPosition('cat'),
                        frame: this.getStopFrame(this.gridEngine.getFacingDirection('cat'), 'cat'),
                        facingDirection: this.gridEngine.getFacingDirection('cat'),
                        previousPosition: this.calculatePreviousTeleportPosition(),
                        coin: this.catSprite.coin,
                        haveSword: this.catSprite.haveSword,
                    },
                    farmSave: this.farmManager?.toJSON?.(),
                };
                const evt = new CustomEvent('save-snapshot-ready', { detail: snapshot });
                window.dispatchEvent(evt);
            } catch (_) { /* noop */ }
        };
        window.addEventListener('request-save-snapshot', handleRequestSave);

        // 清理事件监听
        this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
            window.removeEventListener('request-save-snapshot', handleRequestSave);
        });

        // 自动保存事件触发工具
        const triggerAutosave = () => {
            try {
                const evt = new CustomEvent('autosave-request');
                window.dispatchEvent(evt);
            } catch (_) { /* noop */ }
        };

        this.physics.add.overlap(this.catSprite, this.itemsSprites, (objA, objB) => {
            const item = [objA, objB].find((obj) => obj !== this.catSprite);

            if (item.itemType === 'coin') {
                this.catSprite.collectCoin(1);
                item.setVisible(false);
                item.destroy();
                triggerAutosave();
            }

            if (item.itemType === 'sword') {
                const customEvent = new CustomEvent('new-dialog', {
                    detail: {
                        characterName: item.itemType,
                    },
                });
                window.dispatchEvent(customEvent);
                this.isShowingDialog = true;
                const dialogBoxFinishedEventListener = () => {
                    window.removeEventListener(
                        `${item.itemType}-dialog-finished`,
                        dialogBoxFinishedEventListener
                    );

                    this.time.delayedCall(100, () => {
                        this.isShowingDialog = false;
                    });
                };
                window.addEventListener(
                    `${item.itemType}-dialog-finished`,
                    dialogBoxFinishedEventListener
                );

                this.catSprite.haveSword = true;
                item.setVisible(false);
                item.destroy();
                triggerAutosave();
            }
        });

        const npcSprites = this.add.group();
        npcsKeys.forEach((npcData) => { // NPC 创建与行走动画注册
            const { npcKey, x, y, facingDirection = 'down' } = npcData;
            const npc = this.physics.add.sprite(0, 0, npcKey, `${npcKey}_idle_${facingDirection}`);
            npc.body.setSize(14, 14);
            npc.body.setOffset(9, 13);
            npcSprites.add(npc);

            this.createPlayerwalkAnimation(npcKey, 'walk_up');
            this.createPlayerwalkAnimation(npcKey, 'walk_right');
            this.createPlayerwalkAnimation(npcKey, 'walk_down');
            this.createPlayerwalkAnimation(npcKey, 'walk_left');

            gridEngineConfig.characters.push({
                id: npcKey,
                sprite: npc,
                startPosition: { x: x / 16, y: (y / 16) - 1 },
                speed: 1,
                offsetY: -20,
            });
        });
        // 供运行期检测交互环境使用
        this.npcSprites = npcSprites;

        // Movement（cat 的动画已在 BootScene 中创建，这里无需基于 atlas 再创建）

        this.gridEngine.create(map, gridEngineConfig); // 初始化 GridEngine（必须在角色加入后）

        // 参照参考项目：移除手动碰撞设置，让GridEngine自动处理
        console.log('GridEngine initialized with collisionTilePropertyName: ge_collide');

        // 验证GridEngine初始化
        console.log('GridEngine initialized successfully');
        console.log('Cat position after GridEngine init:', this.gridEngine.getPosition('cat'));
        console.log('Cat facing direction:', this.gridEngine.getFacingDirection('cat'));

        // 测试GridEngine的碰撞检测
        const testPos = this.gridEngine.getPosition('cat');
        const testRight = { x: testPos.x + 1, y: testPos.y };
        const testDown = { x: testPos.x, y: testPos.y + 1 };
        console.log('GridEngine collision test:');
        console.log('  Right position blocked:', this.gridEngine.isTileBlocked(testRight));
        console.log('  Down position blocked:', this.gridEngine.isTileBlocked(testDown));

        // 检查特定位置的瓦片
        if (this.wallsLayer) {
            const rightTile = this.wallsLayer.getTileAt(testRight.x, testRight.y);
            const downTile = this.wallsLayer.getTileAt(testDown.x, testDown.y);
            console.log('  Right tile ID:', rightTile ? rightTile.index : -1);
            console.log('  Down tile ID:', downTile ? downTile.index : -1);
            console.log('  Right tile collidable:', rightTile ? this.collidableTileIds.has(rightTile.index) : false);
            console.log('  Down tile collidable:', downTile ? this.collidableTileIds.has(downTile.index) : false);
        }

        // 测试碰撞检测
        const testPosition = this.gridEngine.getPosition('cat');
        const canMoveRight = this.gridEngine.isBlocked({ x: testPosition.x + 1, y: testPosition.y });
        const canMoveDown = this.gridEngine.isBlocked({ x: testPosition.x, y: testPosition.y + 1 });
        console.log('Collision test - can move right:', !canMoveRight, 'can move down:', !canMoveDown);

        // 同步初始朝向与待机帧
        if (initialFacingDirection) {
            try {
                // GridEngine 将以此朝向作为 getFacingDirection 初始值
                this.gridEngine.turnTowards('cat', initialFacingDirection);
            } catch (e) {
                // 忽略旧版本无 turnTowards 的情况
            }
            const stopFrame = this.getStopFrame(initialFacingDirection, 'cat');
            if (stopFrame) {
                // getStopFrame 返回的是动画 key；当基于单帧纹理时，直接 setTexture 到该 key
                if (this.textures.exists(stopFrame)) {
                    this.catSprite.setTexture(stopFrame);
                } else {
                    this.catSprite.setFrame(stopFrame);
                }
            }
        }

        // Tap-to-move: 触摸/点击地图自动寻路到目标；若不可达则前往最近可达位置
        this.input.on('pointerdown', (pointer) => { // 监听指针按下事件（含鼠标与触屏）
            if (this.isTeleporting || this.isShowingDialog) { // 传送/对话期间禁用点地移动
                return; // 直接返回，防止状态冲突
            }

            const worldX = pointer.worldX ?? pointer.x; // 获取指针在世界坐标中的 X（若无则退化为屏幕坐标）
            const worldY = pointer.worldY ?? pointer.y; // 获取指针在世界坐标中的 Y（若无则退化为屏幕坐标）
            const target = { // 目标瓦片的网格坐标（基于 16x16 或 map.tileWidth/tileHeight）
                x: Math.floor(worldX / map.tileWidth), // 取整到网格 X
                y: Math.floor(worldY / map.tileHeight), // 取整到网格 Y
            };

            this.isAutoMoving = true; // 标记进入自动寻路模式（用于与手动输入互斥）
            // 显示目标瓦片高亮
            const pixelX = target.x * map.tileWidth; // 计算目标像素 X（用于绘制提示）
            const pixelY = target.y * map.tileHeight; // 计算目标像素 Y（用于绘制提示）
            if (!this.autoMoveTargetHighlight) { // 若尚未创建高亮指示器，则创建
                this.autoMoveTargetHighlight = this.add.rectangle(
                    pixelX + map.tileWidth / 2, // 矩形中心 X（居中到瓦片）
                    pixelY + map.tileHeight / 2, // 矩形中心 Y（居中到瓦片）
                    map.tileWidth, // 矩形宽（与瓦片同宽）
                    map.tileHeight, // 矩形高（与瓦片同高）
                    0xffff66, // 填充颜色（浅黄）
                    0.25, // 透明度
                ).setOrigin(0.5, 0.5).setDepth(1000); // 设置原点与深度，保证覆盖在最上层
                this.autoMoveTargetHighlight.setBlendMode(Phaser.BlendModes.SCREEN); // 轻微叠加高光效果
                this.autoMoveTargetHighlight.setStrokeStyle(1, 0xffff99, 0.8); // 添加边框以增强对比度
            } else { // 已存在则复用并移动到新位置
                this.autoMoveTargetHighlight.setVisible(true); // 显示高亮
                this.autoMoveTargetHighlight.setPosition(
                    pixelX + map.tileWidth / 2, // 更新中心 X
                    pixelY + map.tileHeight / 2, // 更新中心 Y
                );
                this.autoMoveTargetHighlight.setSize(map.tileWidth, map.tileHeight); // 更新尺寸以适配当前地图瓦片大小
            }
            // 轻微闪烁以提示
            this.tweens.add({ // 创建一个 tween 动画
                targets: this.autoMoveTargetHighlight, // 作用于高亮矩形
                alpha: { from: 0.25, to: 0.45 }, // 透明度往返变化
                duration: 400, // 动画时长 400ms
                yoyo: true, // 往返播放
                repeat: 2, // 重复 2 次，合计闪烁 3 次
            });
            // 检查目标位置是否有碰撞
            let canMoveToTarget = true;
            if (this.wallsLayer) {
                const targetTile = this.wallsLayer.getTileAt(target.x, target.y);
                const tileId = targetTile ? targetTile.index : -1;
                const isCollidable = tileId >= 0 && this.collidableTileIds.has(tileId);
                if (isCollidable) {
                    canMoveToTarget = false;
                    console.log(`Click movement blocked: target (${target.x}, ${target.y}) has collision tile ${tileId}`);
                }
            }

            // 只有在目标位置没有碰撞时才移动
            if (canMoveToTarget) {
                // 不使用GridEngine的moveTo，改为手动移动
                // 这样可以确保每一步都经过我们的碰撞检测
                this.startManualPathfinding(target);
            } else {
                console.log(`Cannot move to (${target.x}, ${target.y}) - blocked by collision`);
            }
        });

        // NPCs
        npcsKeys.forEach((npcData) => {
            const {
                movementType,
                npcKey,
                delay,
                area,
            } = npcData;

            if (movementType === NPC_MOVEMENT_RANDOM) {
                this.gridEngine.moveRandomly(npcKey, delay, area);
            }
        });

        // Animations // 角色移动方向来自 GridEngine（可能为 8 向）。动画素材仅有 4 向，做归一映射。
        this.gridEngine.movementStarted().subscribe(({ charId, direction }) => {
            const dir4 = toCardinal(direction ?? this.gridEngine.getFacingDirection(charId));
            if (charId === 'cat') {
                const key = `cat_walk_${dir4}`;
                const anim = this.catSprite.anims;
                if (anim.currentAnim?.key !== key || !anim.isPlaying) anim.play(key);
            } else {
                const npc = npcSprites.getChildren().find(s => s.texture.key === charId);
                if (npc) {
                    const key = `${charId}_walk_${dir4}`;
                    const anim = npc.anims;
                    if (anim.currentAnim?.key !== key || !anim.isPlaying) anim.play(key);
                }
            }
        });

        this.gridEngine.movementStopped().subscribe(({ charId, direction }) => {
            const dir4 = toCardinal(direction ?? this.gridEngine.getFacingDirection(charId));
            if (charId === 'cat') {
                this.catSprite.anims.stop();
                {
                    const stopFrame = this.getStopFrame(dir4, charId);
                    if (this.textures.exists(stopFrame)) {
                        this.catSprite.setTexture(stopFrame);
                    } else {
                        this.catSprite.setFrame(stopFrame);
                    }
                }
            } else {
                const npc = npcSprites.getChildren().find(s => s.texture.key === charId);
                if (npc) {
                    npc.anims.stop();
                    {
                        const stopFrame = this.getStopFrame(dir4, charId);
                        if (this.textures.exists(stopFrame)) {
                            npc.setTexture(stopFrame);
                        } else {
                            npc.setFrame(stopFrame);
                        }
                    }
                }
            }
        });

        this.gridEngine.directionChanged().subscribe(({ charId, direction }) => {
            const dir4 = toCardinal(direction ?? this.gridEngine.getFacingDirection(charId));
            const isMoving = this.gridEngine.isMoving(charId);
            if (charId === 'cat') {
                if (isMoving) {
                    const key = `cat_walk_${dir4}`;
                    const anim = this.catSprite.anims;
                    if (anim.currentAnim?.key !== key || !anim.isPlaying) anim.play(key);
                } else {
                    {
                        const stopFrame = this.getStopFrame(dir4, charId);
                        if (this.textures.exists(stopFrame)) {
                            this.catSprite.setTexture(stopFrame);
                        } else {
                            this.catSprite.setFrame(stopFrame);
                        }
                    }
                }
            } else {
                const npc = npcSprites.getChildren().find(s => s.texture.key === charId);
                if (!npc) return;
                if (isMoving) {
                    const key = `${charId}_walk_${dir4}`;
                    const anim = npc.anims;
                    if (anim.currentAnim?.key !== key || !anim.isPlaying) anim.play(key);
                } else {
                    {
                        const stopFrame = this.getStopFrame(dir4, charId);
                        if (this.textures.exists(stopFrame)) {
                            npc.setTexture(stopFrame);
                        } else {
                            npc.setFrame(stopFrame);
                        }
                    }
                }
            }
        });

        this.catActionCollider.update = () => { // 随主角更新交互体位置与朝向
            const facingDirection = this.gridEngine.getFacingDirection('cat');
            this.catPresenceCollider.setPosition(
                this.catSprite.x + 16,
                this.catSprite.y + 20
            );

            this.catObjectCollider.setPosition(
                this.catSprite.x + 16,
                this.catSprite.y + 20
            );

            switch (facingDirection) {
                case 'down': {
                    this.catActionCollider.setSize(14, 8);
                    this.catActionCollider.body.setSize(14, 8);
                    this.catActionCollider.setX(this.catSprite.x + 9);
                    this.catActionCollider.setY(this.catSprite.y + 36);

                    break;
                }

                case 'up': {
                    this.catActionCollider.setSize(14, 8);
                    this.catActionCollider.body.setSize(14, 8);
                    this.catActionCollider.setX(this.catSprite.x + 9);
                    this.catActionCollider.setY(this.catSprite.y + 12);

                    break;
                }

                case 'left': {
                    this.catActionCollider.setSize(8, 14);
                    this.catActionCollider.body.setSize(8, 14);
                    this.catActionCollider.setX(this.catSprite.x);
                    this.catActionCollider.setY(this.catSprite.y + 21);

                    break;
                }

                case 'right': {
                    this.catActionCollider.setSize(8, 14);
                    this.catActionCollider.body.setSize(8, 14);
                    this.catActionCollider.setX(this.catSprite.x + 24);
                    this.catActionCollider.setY(this.catSprite.y + 21);

                    break;
                }

                default: {
                    break;
                }
            }
        };

        this.physics.add.overlap(this.catActionCollider, npcSprites, (objA, objB) => { // 回车与 NPC 交互（对话）
            if (this.isShowingDialog) {
                return;
            }

            const npc = [objA, objB].find((obj) => obj !== this.catActionCollider);

            if (this.inputManager.isEnterJustDown() || this.inputManager.isSpaceJustDown()) {
                if (this.gridEngine.isMoving(npc.texture.key)) {
                    return;
                }

                const characterName = npc.texture.key;
                const customEvent = new CustomEvent('new-dialog', {
                    detail: {
                        characterName,
                    },
                });

                window.dispatchEvent(customEvent);
                const dialogBoxFinishedEventListener = () => {
                    window.removeEventListener(`${characterName}-dialog-finished`, dialogBoxFinishedEventListener);
                    this.gridEngine.moveRandomly(characterName);

                    // just to consume the JustDown
                    this.inputManager.isEnterJustDown();
                    this.inputManager.isSpaceJustDown();

                    this.time.delayedCall(100, () => {
                        this.isShowingDialog = false;
                        const { delay, area } = npcsKeys.find((npcData) => npcData.npcKey === characterName);
                        this.gridEngine.moveRandomly(characterName, delay, area);
                    });
                };
                window.addEventListener(`${characterName}-dialog-finished`, dialogBoxFinishedEventListener);

                this.isShowingDialog = true;
                const facingDirection = this.gridEngine.getFacingDirection('cat');
                this.gridEngine.stopMovement(characterName);
                npc.setFrame(this.getStopFrame(this.getOppositeDirection(facingDirection), characterName));
            }
        });
    }

    update() { // 每帧更新循环（由 Phaser 驱动）
        // 帧更新：根据状态早退；从 InputManager 取当前方向驱动网格移动

        if ( // 全局状态拦截：传送/攻击/对话时不处理移动
            this.isTeleporting
            || this.isShowingDialog
        ) {
            return; // 阻止进一步逻辑，避免与动画/切场冲突
        }

        this.catActionCollider.update(); // 同步/存在/对象碰撞体到主角位置与朝向
        // 根据周围环境更新交互按钮图标（对话 / 宝箱/箱子 / 攻击）
        this.updateActionContext(); // 推送到 React 的 action-context

        // 执行手动寻路
        if (this.manualPathfinding && this.manualPathfinding.isActive) {
            this.executeManualPathfindingStep();
        }

        // 使用输入管理器处理移动（虚拟摇杆/键盘已统一到 InputManager）
        const currentDirection = this.inputManager.getCurrentDirection(); // 获取当前连续方向（可能为 8 向）

        // 执行农场交互（按键触发）
        if (this.inputManager.isEnterJustDown() || this.inputManager.isSpaceJustDown()) {
            const context = this.currentActionContext;
            if (context === 'plant' || context === 'water' || context === 'harvest') {
                const front = this.getFrontPixelPosition();
                const tileX = Math.floor(front.x / this.map.tileWidth);
                const tileY = Math.floor(front.y / this.map.tileHeight);

                if (context === 'plant') {
                    // 若已有选择流程进行中，忽略重复触发
                    if (this.seedSelectPending) {
                        return;
                    }
                    // 记录待种植地块，打开背包选择种子
                    this.seedSelectPending = { tileX, tileY };
                    try {
                        const evt = new CustomEvent('open-seed-select');
                        window.dispatchEvent(evt);
                    } catch (_) { /* noop */ }
                } else if (context === 'water') {
                    const ok = this.farmManager.water(tileX, tileY);
                    if (!ok) {
                        // noop
                    }
                } else if (context === 'harvest') {
                    const yieldCount = this.farmManager.harvest(tileX, tileY);
                    if (yieldCount > 0) {
                        // 将果实转换为金币（示例）：
                        this.catSprite.collectCoin(yieldCount);
                    }
                }
            }
        }

        // 无输入时：当非自动寻路才停止（避免打断 moveTo）
        if (!currentDirection && this.gridEngine.isMoving('cat') && !this.isAutoMoving) {
            this.gridEngine.stopMovement('cat'); // 停止当前移动（站立）
            return; // 本帧结束
        }

        // 有手动输入：打断自动寻路并按输入方向移动
        if (currentDirection) { // 若检测到手动方向输入
            if (this.isAutoMoving) { // 若正处于自动寻路
                this.isAutoMoving = false; // 清除自动寻路标记
                this.gridEngine.stopMovement('cat'); // 立即中断路径移动
                // 手动输入打断时隐藏目标高亮
                if (this.autoMoveTargetHighlight) {
                    this.autoMoveTargetHighlight.setVisible(false); // 隐藏高亮提示
                }
            }
            if (!this.gridEngine.isMoving('cat')) { // 若当前不在移动（防抖）
                // 测试移动前的碰撞检测
                const currentPos = this.gridEngine.getPosition('cat');
                let targetPos = { ...currentPos };

                switch (currentDirection) {
                    case 'up': targetPos.y -= 1; break;
                    case 'down': targetPos.y += 1; break;
                    case 'left': targetPos.x -= 1; break;
                    case 'right': targetPos.x += 1; break;
                    case 'up-left': targetPos.x -= 1; targetPos.y -= 1; break;
                    case 'up-right': targetPos.x += 1; targetPos.y -= 1; break;
                    case 'down-left': targetPos.x -= 1; targetPos.y += 1; break;
                    case 'down-right': targetPos.x += 1; targetPos.y += 1; break;
                }

                // 混合碰撞检测：使用Phaser物理系统 + GridEngine
                let isBlocked = false;
                let tileInfo = '';

                // 方法1: 检查Phaser物理碰撞
                if (this.wallsLayer) {
                    const tile = this.wallsLayer.getTileAt(targetPos.x, targetPos.y);
                    const tileId = tile ? tile.index : -1;
                    const isCollidable = tileId >= 0 && this.collidableTileIds.has(tileId);
                    tileInfo = `tileId: ${tileId}, collidable: ${isCollidable}`;

                    // 如果瓦片是可碰撞的，阻止移动
                    if (isCollidable) {
                        isBlocked = true;
                    }
                } else {
                    tileInfo = 'no wallsLayer found';
                }

                // 方法2: 如果Phaser检测没有阻止，再检查GridEngine
                if (!isBlocked) {
                    try {
                        isBlocked = this.gridEngine.isTileBlocked(targetPos);
                    } catch (e) {
                        // GridEngine检测失败，使用Phaser检测结果
                    }
                }

                console.log(`Move attempt: ${currentDirection}, from (${currentPos.x},${currentPos.y}) to (${targetPos.x},${targetPos.y}), blocked: ${isBlocked}, ${tileInfo}`);

                // 只有在没有碰撞时才移动
                if (!isBlocked) {
                    this.gridEngine.move('cat', currentDirection); // 发起按方向的离散步进
                } else {
                    console.log(`Movement blocked by collision at (${targetPos.x}, ${targetPos.y})`);
                }
            }
        }
        // 手动寻路相关属性
        this.manualPathfinding = {
            target: null,
            path: [],
            currentStep: 0,
            isActive: false,
            lastMoveTime: 0, // 记录上次移动的时间
        };

        // 更新相机与像素对齐
        const cam = this.cameras?.main;
        if (cam) {
            cam.scrollX = Math.round(cam.scrollX);
            cam.scrollY = Math.round(cam.scrollY);
        }
        this.catSprite.setPosition(Math.round(this.catSprite.x), Math.round(this.catSprite.y));
    }

    // 手动寻路方法 - 简化的寻路算法
    startManualPathfinding(target) {
        const currentPos = this.gridEngine.getPosition('cat');
        console.log(`Starting manual pathfinding from (${currentPos.x}, ${currentPos.y}) to (${target.x}, ${target.y})`);

        // 使用简单的直线寻路
        const path = this.getSimplePath(currentPos, target);

        this.manualPathfinding = {
            target: target,
            path: path,
            currentStep: 0,
            isActive: true,
        };

        console.log(`Manual pathfinding path:`, path);
    }

    // 简化的A*寻路算法
    findPath(start, goal) {
        const openSet = [start];
        const cameFrom = new Map();
        const gScore = new Map();
        const fScore = new Map();

        // 初始化
        gScore.set(`${start.x},${start.y}`, 0);
        fScore.set(`${start.x},${start.y}`, this.heuristic(start, goal));

        while (openSet.length > 0) {
            // 找到fScore最小的节点
            let current = openSet[0];
            let currentIndex = 0;
            for (let i = 1; i < openSet.length; i++) {
                const currentF = fScore.get(`${openSet[i].x},${openSet[i].y}`) || Infinity;
                const bestF = fScore.get(`${current.x},${current.y}`) || Infinity;
                if (currentF < bestF) {
                    current = openSet[i];
                    currentIndex = i;
                }
            }

            // 移除当前节点
            openSet.splice(currentIndex, 1);

            // 检查是否到达目标
            if (current.x === goal.x && current.y === goal.y) {
                return this.reconstructPath(cameFrom, current);
            }

            // 检查所有邻居
            const neighbors = this.getNeighbors(current);
            for (const neighbor of neighbors) {
                const neighborKey = `${neighbor.x},${neighbor.y}`;
                const tentativeG = (gScore.get(`${current.x},${current.y}`) || 0) + 1;

                if (!gScore.has(neighborKey) || tentativeG < gScore.get(neighborKey)) {
                    cameFrom.set(neighborKey, current);
                    gScore.set(neighborKey, tentativeG);
                    fScore.set(neighborKey, tentativeG + this.heuristic(neighbor, goal));

                    if (!openSet.some(n => n.x === neighbor.x && n.y === neighbor.y)) {
                        openSet.push(neighbor);
                    }
                }
            }
        }

        // 如果没有找到路径，返回简单的直线路径
        return this.getSimplePath(start, goal);
    }

    // 启发式函数（曼哈顿距离）
    heuristic(a, b) {
        return Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
    }

    // 获取邻居节点
    getNeighbors(pos) {
        const neighbors = [];
        const directions = [
            { x: 0, y: -1 }, // up
            { x: 0, y: 1 },  // down
            { x: -1, y: 0 }, // left
            { x: 1, y: 0 },  // right
            { x: -1, y: -1 }, // up-left
            { x: 1, y: -1 },  // up-right
            { x: -1, y: 1 },  // down-left
            { x: 1, y: 1 }    // down-right
        ];

        for (const dir of directions) {
            const neighbor = { x: pos.x + dir.x, y: pos.y + dir.y };

            // 检查边界
            if (neighbor.x < 0 || neighbor.y < 0) continue;

            // 检查碰撞
            if (this.isPositionBlocked(neighbor)) continue;

            neighbors.push(neighbor);
        }

        return neighbors;
    }

    // 检查位置是否被阻挡
    isPositionBlocked(pos) {
        if (this.wallsLayer) {
            const tile = this.wallsLayer.getTileAt(pos.x, pos.y);
            const tileId = tile ? tile.index : -1;
            return tileId >= 0 && this.collidableTileIds.has(tileId);
        }
        return false;
    }

    // 重构路径
    reconstructPath(cameFrom, current) {
        const path = [current];
        let currentKey = `${current.x},${current.y}`;

        while (cameFrom.has(currentKey)) {
            current = cameFrom.get(currentKey);
            path.unshift(current);
            currentKey = `${current.x},${current.y}`;
        }

        return path.slice(1); // 移除起始位置
    }

    // 简单路径（备用方案）
    getSimplePath(start, goal) {
        const path = [];
        let current = { ...start };

        console.log(`Generating simple path from (${start.x}, ${start.y}) to (${goal.x}, ${goal.y})`);

        // 先水平移动
        while (current.x !== goal.x) {
            current.x += current.x < goal.x ? 1 : -1;
            if (!this.isPositionBlocked(current)) {
                path.push({ ...current });
                console.log(`Added horizontal step: (${current.x}, ${current.y})`);
            } else {
                console.log(`Horizontal path blocked at (${current.x}, ${current.y})`);
                // 尝试绕行
                const alternative = this.findAlternativePath(current, goal, 'horizontal');
                if (alternative.length > 0) {
                    path.push(...alternative);
                    current = alternative[alternative.length - 1];
                } else {
                    break; // 如果无法绕行，停止
                }
            }
        }

        // 再垂直移动
        while (current.y !== goal.y) {
            current.y += current.y < goal.y ? 1 : -1;
            if (!this.isPositionBlocked(current)) {
                path.push({ ...current });
                console.log(`Added vertical step: (${current.x}, ${current.y})`);
            } else {
                console.log(`Vertical path blocked at (${current.x}, ${current.y})`);
                // 尝试绕行
                const alternative = this.findAlternativePath(current, goal, 'vertical');
                if (alternative.length > 0) {
                    path.push(...alternative);
                    current = alternative[alternative.length - 1];
                } else {
                    break; // 如果无法绕行，停止
                }
            }
        }

        console.log(`Generated path with ${path.length} steps:`, path);
        return path;
    }

    // 寻找替代路径
    findAlternativePath(current, goal, direction) {
        const alternatives = [];

        if (direction === 'horizontal') {
            // 尝试向上或向下绕行
            const up = { x: current.x, y: current.y - 1 };
            const down = { x: current.x, y: current.y + 1 };

            if (!this.isPositionBlocked(up)) {
                alternatives.push(up);
                // 尝试继续水平移动
                const next = { x: current.x + (current.x < goal.x ? 1 : -1), y: up.y };
                if (!this.isPositionBlocked(next)) {
                    alternatives.push(next);
                }
            } else if (!this.isPositionBlocked(down)) {
                alternatives.push(down);
                // 尝试继续水平移动
                const next = { x: current.x + (current.x < goal.x ? 1 : -1), y: down.y };
                if (!this.isPositionBlocked(next)) {
                    alternatives.push(next);
                }
            }
        } else if (direction === 'vertical') {
            // 尝试向左或向右绕行
            const left = { x: current.x - 1, y: current.y };
            const right = { x: current.x + 1, y: current.y };

            if (!this.isPositionBlocked(left)) {
                alternatives.push(left);
                // 尝试继续垂直移动
                const next = { x: left.x, y: current.y + (current.y < goal.y ? 1 : -1) };
                if (!this.isPositionBlocked(next)) {
                    alternatives.push(next);
                }
            } else if (!this.isPositionBlocked(right)) {
                alternatives.push(right);
                // 尝试继续垂直移动
                const next = { x: right.x, y: current.y + (current.y < goal.y ? 1 : -1) };
                if (!this.isPositionBlocked(next)) {
                    alternatives.push(next);
                }
            }
        }

        return alternatives;
    }

    // 执行手动寻路的下一步
    executeManualPathfindingStep() {
        console.log(`Pathfinding check: isActive=${this.manualPathfinding.isActive}, currentStep=${this.manualPathfinding.currentStep}, pathLength=${this.manualPathfinding.path.length}`);

        if (!this.manualPathfinding.isActive || this.manualPathfinding.currentStep >= this.manualPathfinding.path.length) {
            if (this.manualPathfinding.isActive) {
                console.log('Manual pathfinding completed successfully');
            }
            this.manualPathfinding.isActive = false;
            return;
        }

        const currentTime = this.time.now;

        // 检查是否在移动中，或者距离上次移动时间太短
        if (this.gridEngine.isMoving('cat')) {
            console.log('Character is still moving, waiting...');
            return;
        }

        // 如果距离上次移动时间太短，等待一下
        if (currentTime - this.manualPathfinding.lastMoveTime < 100) {
            console.log('Waiting for move cooldown...');
            return;
        }

        const nextStep = this.manualPathfinding.path[this.manualPathfinding.currentStep];
        const currentPos = this.gridEngine.getPosition('cat');

        console.log(`Executing pathfinding step ${this.manualPathfinding.currentStep + 1}/${this.manualPathfinding.path.length}: moving to (${nextStep.x}, ${nextStep.y})`);
        console.log(`Current position: (${currentPos.x}, ${currentPos.y}), Target: (${nextStep.x}, ${nextStep.y})`);

        // 计算移动方向
        const dx = nextStep.x - currentPos.x;
        const dy = nextStep.y - currentPos.y;
        let direction = '';

        if (dx > 0 && dy === 0) direction = 'right';
        else if (dx < 0 && dy === 0) direction = 'left';
        else if (dx === 0 && dy > 0) direction = 'down';
        else if (dx === 0 && dy < 0) direction = 'up';
        else if (dx > 0 && dy > 0) direction = 'down-right';
        else if (dx > 0 && dy < 0) direction = 'up-right';
        else if (dx < 0 && dy > 0) direction = 'down-left';
        else if (dx < 0 && dy < 0) direction = 'up-left';

        console.log(`Calculated direction: ${direction} (dx: ${dx}, dy: ${dy})`);

        if (direction) {
            // 再次检查目标位置是否有碰撞（双重保险）
            if (!this.isPositionBlocked(nextStep)) {
                this.gridEngine.move('cat', direction);
                this.manualPathfinding.currentStep++;
                this.manualPathfinding.lastMoveTime = currentTime;
                console.log(`Moving ${direction} to (${nextStep.x}, ${nextStep.y}) - step ${this.manualPathfinding.currentStep}/${this.manualPathfinding.path.length}`);
                console.log(`After move: isActive=${this.manualPathfinding.isActive}, currentStep=${this.manualPathfinding.currentStep}, pathLength=${this.manualPathfinding.path.length}`);
            } else {
                console.log(`Pathfinding blocked at (${nextStep.x}, ${nextStep.y}) - stopping`);
                this.manualPathfinding.isActive = false;
            }
        } else {
            console.log('Invalid direction calculated - stopping pathfinding');
            this.manualPathfinding.isActive = false;
        }
    }
}

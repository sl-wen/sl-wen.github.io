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
 *      catStatus: { position, previousPosition, frame, facingDirection, health, maxHealth, coin, canPush, haveSword },
 *      mapKey: 'your_map_key_from_BootScene',
 *    });
 * 3. 地图资源需在 `BootScene` 预加载，并确保 Tiled 中 tileset 名称与此处 `addTilesetImage` 匹配。
 * 4. 想要新增 NPC/敌人/物品/传送门：在 Tiled 的对象层 `actions` 中放置对象并配置属性：
 *    - dialog: 值为角色 key（与 React `dialogs` 对应）
 *    - npcData: 形如 `npc_1:random;1000;4;down`
 *    - enemyData: 形如 `slime_green:ai_type;3:40`（类型:AI:速度:生命）
 *    - itemData: 形如 `coin:`、`heart:`、`heart_container:`、`sword:`、`push:`
 *    - teleportTo: 形如 `map_key:10,12`
 * 5. 输入与移动：
 *    - 键盘 WASD/方向键 与 触摸（虚拟摇杆/动作按钮）均通过 `InputManager` 统一处理。
 *    - 在 `update()` 中读取当前方向并调用 `gridEngine.move('cat', direction)`。
 * 
 * 常见问题排查：
 * - 人物无法从传送门离开当前房间：检查 `actions` 对象层是否存在 teleportTo 对象，格式是否正确；检查 tileset 名称是否与 `BootScene` 加载一致。
 * - 图块显示异常：核对 Tiled 中 tileset 的名称与 `addTilesetImage` 所用 key 保持一致。
 * - 敌人不移动/不追踪：确认 `enemyData` 的 AI 类型与常量定义匹配，且重叠体积（presence collider）覆盖到敌人。
 */
import { Input, Math as PhaserMath, Scene } from 'phaser';
import {
    ATTACK_DELAY_TIME,
    BOX_INDEX,
    BUSH_INDEX,
    ENEMY_AI_TYPE,
    NPC_MOVEMENT_RANDOM,
    SCENE_FADE_TIME,
} from '../constants';
import { createInteractiveGameObject } from '../utils';
import InputManager from '../InputManager';

export default class GameScene extends Scene {
    constructor() {
        super('GameScene');
    }

    inputManager = null;
    isShowingDialog = false;
    isTeleporting = false;
    isAttacking = false;
    isAutoMoving = false;
    autoMoveTargetHighlight = null;
    currentActionContext = 'attack';
    npcSprites = null;

    init(data) {
        this.initData = data;
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

    createPlayerAttackAnimation(assetKey, animationName) {
        // 角色的攻击动画（方向区分），若不存在则创建
        const animationKey = `${assetKey}_${animationName}`;
        if (!this.anims.exists(animationKey)) {
            this.anims.create({
                key: animationKey,
                frames: [
                    { key: assetKey, frame: `${assetKey}_${animationName}_1` },
                    { key: assetKey, frame: `${assetKey}_${animationName}_2` },
                    { key: assetKey, frame: `${assetKey}_${animationName}_3` },
                    { key: assetKey, frame: `${assetKey}_${animationName}_4` },
                    { key: assetKey, frame: `${assetKey}_${animationName.replace('attack', 'idle')}_1` },
                ],
                frameRate: 16,
                repeat: 0,
                yoyo: false,
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
        switch (facingDirection) {
            case 'up':
                return { x: position.x * 16, y: (position.y - 1) * 16 };
            case 'right':
                return { x: (position.x + 1) * 16, y: position.y * 16 };
            case 'down':
                return { x: position.x * 16, y: (position.y + 1) * 16 };
            case 'left':
                return { x: (position.x - 1) * 16, y: position.y * 16 };
            default:
                return { x: position.x * 16, y: position.y * 16 };
        }
    }

    /**
     * 更新交互上下文并通知 React，决定 ActionButton 的图标
     * 规则优先级：
     * 1) 面前是可对话 NPC => 'talk'
     * 2) 面前是可交互箱子/宝箱 => 'interact'
     * 3) 默认（有剑）=> 'attack'，否则 'none'
     */
    updateActionContext() {
        if (!this.catSprite || !this.map) return;
        let nextContext = 'attack';

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
            if (isInteractable) {
                nextContext = 'interact';
            } else {
                // 3) 默认
                nextContext = this.catSprite.haveSword ? 'attack' : 'none';
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

    calculatecatHealthState(health) {
        // 将血量转为 UI 需要的状态片段：full/half/empty
        if (health > 10) {
            return 'full';
        }

        if (health > 0) {
            return 'half';
        }

        return 'empty';
    }

    calculatecatHealthStates() {
        // 计算一排心形容器的状态数组，maxHealth 每 20 为一格
        return Array.from({ length: this.catSprite.maxHealth / 20 })
            .fill(null).map(
                (v, index) => this.calculatecatHealthState(
                    Math.max(this.catSprite.health - (20 * index), 0)
                )
            );
    }

    updatecatHealthUi(healthStates) {
        // 通过自定义事件与 React `catHealth` 同步
        const customEvent = new CustomEvent('cat-health', {
            detail: {
                healthStates,
            },
        });

        window.dispatchEvent(customEvent);
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

    getEnemySpecies(enemyType) {
        // 目前敌人族类仅区分史莱姆，保留扩展点
        if (enemyType.includes('slime')) {
            return 'slime';
        }

        return 'slime';
    }

    getEnemyColor(enemyType) {
        // 根据敌人类型为同一精灵着色，便于区分
        if (enemyType.includes('red')) {
            return 0xF1374B;
        }

        if (enemyType.includes('green')) {
            return 0x2BBD6E;
        }

        if (enemyType.includes('yellow')) {
            return 0xFFFF4F;
        }

        return 0x00A0DC;
    }

    getEnemyAttackSpeed(enemyType) {
        // 不同颜色（类型）的攻击频率不同
        if (enemyType.includes('red')) {
            return 2000;
        }

        if (enemyType.includes('green')) {
            return 3000;
        }

        if (enemyType.includes('yellow')) {
            return 4000;
        }

        return 5000;
    }

    spawnItem(position) {
        // 敌人死亡或破坏元素后按概率掉落物品
        const isDebugMode = this.physics.config.debug;
        const itemChance = PhaserMath.Between(1, isDebugMode ? 2 : 5);
        if (itemChance === 1) {
            const itemType = PhaserMath.Between(1, 2);

            if (itemType === 1) {
                const item = this.physics.add
                    .sprite(position.x, position.y, 'heart')
                    .setDepth(1)
                    .setOrigin(0, 0);
                item.itemType = 'heart';
                this.itemsSprites.add(item);
                item.anims.play('heart_idle');
            } else if (itemType === 2) {
                const item = this.physics.add
                    .sprite(position.x, position.y, 'coin')
                    .setDepth(1)
                    .setOrigin(0, 0);
                item.itemType = 'coin';
                this.itemsSprites.add(item);
                item.anims.play('coin_idle');
            }
        }
    }

    calculatePushTilePosition() {
        // 根据玩家朝向计算箱子被推动后的目标像素坐标（以 16px 为一格）
        const facingDirection = this.gridEngine.getFacingDirection('cat');
        const position = this.gridEngine.getPosition('cat');

        switch (facingDirection) {
            case 'up':
                return {
                    x: position.x * 16,
                    y: (position.y - 2) * 16,
                };

            case 'right':
                return {
                    x: (position.x + 2) * 16,
                    y: position.y * 16,
                };

            case 'down':
                return {
                    x: position.x * 16,
                    y: (position.y + 2) * 16,
                };

            case 'left':
                return {
                    x: (position.x - 2) * 16,
                    y: position.y * 16,
                };

            default:
                return {
                    x: position.x * 16,
                    y: position.y * 16,
                };
        }
    }

    create() {
        // 场景创建入口：加载地图、创建角色/敌人/NPC、设置相机、动画与碰撞
        const camera = this.cameras.main;
        const { game } = this.sys;
        const isDebugMode = this.physics.config.debug;
        const { catStatus, mapKey } = this.initData;
        const {
            position: initialPosition,
            frame: initialFrame,
            facingDirection: initialFacingDirection,
            previousPosition,
            health: catHealth,
            maxHealth: catMaxHealth,
            coin: catCoin,
            canPush: catCanPush,
            haveSword: catHaveSword,
        } = catStatus;

        camera.fadeIn(SCENE_FADE_TIME);

        // 初始化输入管理器
        this.inputManager = new InputManager(this);

        // Map 地图加载：根据 `mapKey` 创建 tilemap，并动态注册 tileset
        const map = this.make.tilemap({ key: mapKey });
        
        // 添加调试信息
        console.log('Loading map:', mapKey);
        console.log('Map tilesets:', map.tilesets);
        console.log('Map layers:', map.layers);
        
        // 动态添加图块集，支持多个图块集（名称需与 Tiled 中一致）
        if (map.tilesets && map.tilesets.length > 0) {
            map.tilesets.forEach(tileset => {
                const tilesetName = tileset.name;
                console.log('Adding tileset:', tilesetName);
                if (tilesetName === 'tileset') {
                    map.addTilesetImage('tileset', 'tileset');
                } else if (tilesetName === 'actions_tileset') {
                    map.addTilesetImage('actions_tileset', 'actions_tileset');
                } else if (tilesetName === 'ui_elements') {
                    map.addTilesetImage('ui_elements', 'ui_elements');
                }
            });
        } else {
            // 默认添加基础图块集（兼容旧地图）
            console.log('No tilesets found, using default');
            map.addTilesetImage('tileset', 'tileset');
        }

        if (isDebugMode) {
            window.phaserGame = game;
        }
        // 需要在更新期查询前方图块与交互环境，因此总是持有 map 引用
        this.map = map;

        // cat 主角：初始属性、碰撞盒与交互体
        this.catSprite = this.physics.add
            .sprite(initialPosition.x * 16, initialPosition.y * 16, 'cat', initialFrame)
            .setDepth(1);
        this.catSprite.health = catHealth;
        this.catSprite.maxHealth = catMaxHealth;
        this.catSprite.coin = catCoin;
        this.catSprite.canPush = catCanPush;
        this.catSprite.haveSword = catHaveSword;
        this.updatecatHealthUi(this.calculatecatHealthStates());
        this.updatecatCoinUi(catCoin);

        this.catSprite.restoreHealth = (restore) => {
            this.catSprite.health = Math.min(this.catSprite.health + restore, this.catSprite.maxHealth);
            this.updatecatHealthUi(this.calculatecatHealthStates());
        };

        this.catSprite.increaseMaxHealth = (increase) => {
            this.catSprite.maxHealth += increase;
            // 参照原项目：提升心之容器后，当前生命同步至最大值
            this.catSprite.health = this.catSprite.maxHealth;
            this.updatecatHealthUi(this.calculatecatHealthStates());
        };

        this.catSprite.collectCoin = (coinQuantity) => {
            this.catSprite.coin = Math.min(this.catSprite.coin + coinQuantity, 999);
            this.updatecatCoinUi(this.catSprite.coin);
        };

        this.catSprite.takeDamage = (damage) => {
            this.time.delayedCall(
                180,
                () => {
                    this.catSprite.health -= damage;
                    if (this.catSprite.health <= 0) {
                        camera.fadeOut(SCENE_FADE_TIME);
                        this.updatecatHealthUi([]);
                        this.updatecatCoinUi(null);
                        this.time.delayedCall(
                            SCENE_FADE_TIME,
                            () => {
                                this.isTeleporting = false;
                                this.scene.start('GameOverScene');
                            }
                        );
                    } else {
                        this.updatecatHealthUi(this.calculatecatHealthStates());
                        this.tweens.add({
                            targets: this.catSprite,
                            alpha: 0,
                            ease: PhaserMath.Easing.Elastic.InOut,
                            duration: 70,
                            repeat: 1,
                            yoyo: true,
                        });
                    }
                }
            );
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

        // Items 物品组：心与金币的待机动画
        this.itemsSprites = this.add.group();
        if (!this.anims.exists('heart_idle')) {
            this.anims.create({
                key: 'heart_idle',
                frames: this.getFramesForAnimation('heart', 'idle'),
                frameRate: 4,
                repeat: -1,
                yoyo: false,
            });
        }

        if (!this.anims.exists('coin_idle')) {
            this.anims.create({
                key: 'coin_idle',
                frames: this.getFramesForAnimation('coin', 'idle'),
                frameRate: 4,
                repeat: -1,
                yoyo: false,
            });
        }

        const enemiesData = [];
        const elementsLayers = this.add.group();
        // 逐层创建 tilemapLayer，并记录 elements 类型图层用于交互
        for (let i = 0; i < map.layers.length; i++) {
            const layerData = map.layers[i];
            let layer;
            
            // 动态检测图层使用的图块集
            if (layerData.tileset) {
                const tilesetName = layerData.tileset.name;
                layer = map.createLayer(i, tilesetName, 0, 0);
            } else {
                // 如果没有指定图块集，使用默认的
                layer = map.createLayer(i, 'tileset', 0, 0);
            }
            
            // 检查图层属性
            if (layerData.properties) {
                layerData.properties.forEach((property) => {
                    const { value, name } = property;

                    if (name === 'type' && value === 'elements') {
                        elementsLayers.add(layer);
                    }
                });
            }

            this.physics.add.collider(this.catSprite, layer);
        }

        const npcsKeys = [];
        const dataLayer = map.getObjectLayer('actions'); // Tiled 中的对象层，承载对话、NPC、敌人、传送、物品
        console.log('Data layer:', dataLayer);
        console.log('Data layer objects:', dataLayer?.objects);
        
        if (dataLayer && dataLayer.objects) {
            dataLayer.objects.forEach((data) => {
                const { properties, x, y } = data;
                console.log('Processing object at:', x, y, 'with properties:', properties);

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

                            case 'heart_container': {
                                const item = this.physics.add
                                    .sprite(x, y, 'heart_container')
                                    .setDepth(1)
                                    .setOrigin(0, 1);

                                item.itemType = 'heart_container';
                                this.itemsSprites.add(item);
                                break;
                            }

                            case 'heart': {
                                const item = this.physics.add
                                    .sprite(x, y, 'heart')
                                    .setDepth(1)
                                    .setOrigin(0, 1);

                                item.itemType = 'heart';
                                this.itemsSprites.add(item);
                                item.anims.play('heart_idle');
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

                            case 'push': {
                                if (!catCanPush) {
                                    const item = this.physics.add
                                        .sprite(x, y, 'push')
                                        .setDepth(1)
                                        .setOrigin(0, 1);

                                    item.itemType = 'push';
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

                    case 'enemyData': {
                        const [enemyType, enemyAI, speed, health] = value.split(':');
                        enemiesData.push({
                            x,
                            y,
                            speed: Number.parseInt(speed, 10),
                            enemyType,
                            enemySpecies: this.getEnemySpecies(enemyType),
                            enemyAI,
                            enemyName: `${enemyType}_${enemiesData.length}`,
                            health: Number.parseInt(health, 10),
                        });
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
                            isDebugMode
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
                            // this.gridEngine.stopMovement('cat');

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
                                            health: this.catSprite.health,
                                            maxHealth: this.catSprite.maxHealth,
                                            coin: this.catSprite.coin,
                                            canPush: this.catSprite.canPush,
                                            haveSword: this.catSprite.haveSword,
                                        },
                                        mapKey: teleportToMapKey,
                                    });
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

        camera.startFollow(this.catSprite, true); // 相机跟随主角
        camera.setFollowOffset(-this.catSprite.width, -this.catSprite.height);
        camera.setBounds(
            0,
            0,
            Math.max(map.widthInPixels, game.scale.gameSize.width),
            Math.max(map.heightInPixels, game.scale.gameSize.height)
        );

        if (map.widthInPixels < game.scale.gameSize.width) {
            camera.setPosition(
                (game.scale.gameSize.width - map.widthInPixels) / 2
            );
        }

        if (map.heightInPixels < game.scale.gameSize.height) {
            camera.setPosition(
                camera.x,
                (game.scale.gameSize.height - map.heightInPixels) / 2
            );
        }

        const gridEngineConfig = {
            characters: [
                {
                    id: 'cat',
                    sprite: this.catSprite,
                    startPosition: initialPosition,
                    offsetY: 4,
                },
            ],
            numberOfDirections: 8,
        };

        this.physics.add.overlap(this.catSprite, this.itemsSprites, (objA, objB) => {
            const item = [objA, objB].find((obj) => obj !== this.catSprite);

            if (item.itemType === 'heart') {
                this.catSprite.restoreHealth(20);
                item.setVisible(false);
                item.destroy();
            }

            if (item.itemType === 'coin') {
                this.catSprite.collectCoin(1);
                item.setVisible(false);
                item.destroy();
            }

            if (item.itemType === 'heart_container') {
                this.catSprite.increaseMaxHealth(20);
                item.setVisible(false);
                item.destroy();
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
            }

            if (item.itemType === 'push') {
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

                this.catSprite.canPush = true;
                item.setVisible(false);
                item.destroy();
            }
        });

        this.enemiesSprites = this.add.group();
        enemiesData.forEach((enemyData, index) => { // 敌人创建、动画与网格配置
            const { enemySpecies, enemyType, x, y, enemyName, speed, enemyAI, health } = enemyData;
            const enemy = this.physics.add.sprite(0, 0, enemyType, `${enemySpecies}_idle_1`);
            enemy.setTint(this.getEnemyColor(enemyType));
            enemy.name = enemyName;
            enemy.enemyType = enemyType;
            enemy.enemySpecies = enemySpecies;
            enemy.enemyAI = enemyAI;
            enemy.speed = speed;
            enemy.health = health;
            enemy.isAttacking = false;
            enemy.updateFollowcatPosition = true;
            enemy.lastKnowcatPosition = { x: 0, y: 0 };
            enemy.body.setSize(14, 14);
            enemy.body.setOffset(9, 21);
            this.enemiesSprites.add(enemy);
            enemy.takeDamage = (damage, isSpaceJustDown) => {
                if (isSpaceJustDown) {
                    enemy.health -= damage;

                    if (enemy.health < 0) {
                        enemy.setVisible(false);
                        const position = this.gridEngine.getPosition(enemy.name);
                        this.spawnItem({
                            x: position.x * 16,
                            y: position.y * 16,
                        });
                        this.gridEngine.setPosition(enemy.name, { x: 1, y: 1 });
                        enemy.destroy();
                    } else {
                        this.tweens.add({
                            targets: enemy,
                            alpha: 0,
                            ease: PhaserMath.Easing.Elastic.InOut,
                            duration: 70,
                            repeat: 1,
                            yoyo: true,
                        });
                    }
                }
            };

            if (!this.anims.exists(`${enemySpecies}_idle`)) {
                this.anims.create({
                    key: `${enemySpecies}_idle`,
                    frames: this.getFramesForAnimation(enemySpecies, 'idle'),
                    frameRate: 8,
                    repeat: -1,
                    yoyo: false,
                });
            }

            if (!this.anims.exists(`${enemySpecies}_attack`)) {
                this.anims.create({
                    key: `${enemySpecies}_attack`,
                    frames: this.getFramesForAnimation(enemySpecies, 'attack'),
                    frameRate: 12,
                    repeat: 0,
                    yoyo: false,
                });
            }

            if (!this.anims.exists(`${enemySpecies}_walk`)) {
                this.anims.create({
                    key: `${enemySpecies}_walk`,
                    frames: this.getFramesForAnimation(enemySpecies, 'walk'),
                    frameRate: 8,
                    repeat: -1,
                    yoyo: false,
                });
            }

            if (!this.anims.exists(`${enemySpecies}_die`)) {
                this.anims.create({
                    key: `${enemySpecies}_die`,
                    frames: this.getFramesForAnimation(enemySpecies, 'die'),
                    frameRate: 8,
                    repeat: 0,
                    yoyo: false,
                });
            }

            enemy.anims.play(`${enemySpecies}_idle`);
            enemy.on('animationcomplete', (animation) => {
                if (animation.key.includes('attack')) {
                    enemy.anims.play(`${enemySpecies}_idle`);
                }
            });

            gridEngineConfig.characters.push({
                id: enemyName,
                sprite: enemy,
                startPosition: { x: x / 16, y: (y / 16) - 1 },
                speed,
                offsetY: -4,
            });
        });

        const npcSprites = this.add.group();
        npcsKeys.forEach((npcData) => { // NPC 创建与行走动画注册
            const { npcKey, x, y, facingDirection = 'down' } = npcData;
            const npc = this.physics.add.sprite(0, 0, npcKey, `${npcKey}_idle_${facingDirection}_1`);
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
                offsetY: 4,
            });
        });
        // 供运行期检测交互环境使用
        this.npcSprites = npcSprites;

        // Movement
        this.createPlayerwalkAnimation('cat', 'walk_up');
        this.createPlayerwalkAnimation('cat', 'walk_right');
        this.createPlayerwalkAnimation('cat', 'walk_down');
        this.createPlayerwalkAnimation('cat', 'walk_left');

        // Attack
        this.createPlayerAttackAnimation('cat', 'attack_up', 12, 0, false);
        this.createPlayerAttackAnimation('cat', 'attack_right', 12, 0, false);
        this.createPlayerAttackAnimation('cat', 'attack_down', 12, 0, false);
        this.createPlayerAttackAnimation('cat', 'attack_left', 12, 0, false);

        this.catSprite.on('animationcomplete', (animation, animationFrame) => {
            if (animation.key.includes('attack')) {
                this.isAttacking = false;
            }
        });

        this.catSprite.on('animationstop', (animation, animationFrame) => {
            if (animation.key.includes('attack')) {
                this.isAttacking = false;
            }
        });

        this.gridEngine.create(map, gridEngineConfig); // 初始化 GridEngine（必须在角色加入后）

        // Tap-to-move: 触摸/点击地图自动寻路到目标；若不可达则前往最近可达位置
        this.input.on('pointerdown', (pointer) => {
            if (this.isTeleporting || this.isAttacking || this.isShowingDialog) {
                return;
            }

            const worldX = pointer.worldX ?? pointer.x;
            const worldY = pointer.worldY ?? pointer.y;
            const target = {
                x: Math.floor(worldX / map.tileWidth),
                y: Math.floor(worldY / map.tileHeight),
            };

            this.isAutoMoving = true;
            // 显示目标瓦片高亮
            const pixelX = target.x * map.tileWidth;
            const pixelY = target.y * map.tileHeight;
            if (!this.autoMoveTargetHighlight) {
                this.autoMoveTargetHighlight = this.add.rectangle(
                    pixelX + map.tileWidth / 2,
                    pixelY + map.tileHeight / 2,
                    map.tileWidth,
                    map.tileHeight,
                    0xffff66,
                    0.25,
                ).setOrigin(0.5, 0.5).setDepth(1000);
                this.autoMoveTargetHighlight.setBlendMode(Phaser.BlendModes.SCREEN);
                this.autoMoveTargetHighlight.setStrokeStyle(1, 0xffff99, 0.8);
            } else {
                this.autoMoveTargetHighlight.setVisible(true);
                this.autoMoveTargetHighlight.setPosition(
                    pixelX + map.tileWidth / 2,
                    pixelY + map.tileHeight / 2,
                );
                this.autoMoveTargetHighlight.setSize(map.tileWidth, map.tileHeight);
            }
            // 轻微闪烁以提示
            this.tweens.add({
                targets: this.autoMoveTargetHighlight,
                alpha: { from: 0.25, to: 0.45 },
                duration: 400,
                yoyo: true,
                repeat: 2,
            });
            this.gridEngine.moveTo('cat', target, {
                NoPathFoundStrategy: 'CLOSEST_REACHABLE',
            });
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

        // enemies
        enemiesData.forEach((enemyData) => {
            const {
                enemyAI,
                enemyName,
                speed,
            } = enemyData;

            this.gridEngine.moveRandomly(enemyName, 1000, 4);
        });
        this.physics.add.overlap(this.catObjectCollider, this.enemiesSprites, (objA, objB) => {
            const enemy = [objA, objB].find((obj) => obj !== this.catObjectCollider);
            if (enemy.isAttacking || this.gridEngine.isMoving(enemy.name)) {
                return;
            }

            enemy.anims.play(`${enemy.enemySpecies}_attack`);
            this.catSprite.takeDamage(10);
            enemy.isAttacking = true;
            this.time.delayedCall(
                this.getEnemyAttackSpeed(enemy.enemyType),
                () => {
                    enemy.isAttacking = false;
                }
            );
        });

        this.physics.add.overlap(this.catPresenceCollider, this.enemiesSprites, (objA, objB) => {
            const enemy = [objA, objB].find((obj) => obj !== this.catPresenceCollider);

            if (enemy.canSeecat && enemy.enemyAI === ENEMY_AI_TYPE) {
                enemy.isFollowingcat = true;
                if (enemy.updateFollowcatPosition) {
                    const facingDirection = this.gridEngine.getFacingDirection('cat');
                    const catPosition = this.gridEngine.getPosition('cat');
                    const catBackPosition = this.getBackPosition(facingDirection, catPosition);

                    if (
                        enemy.lastKnowcatPosition.x !== catBackPosition.x
                        || enemy.lastKnowcatPosition.y !== catBackPosition.y
                    ) {
                        const enemyPosition = this.gridEngine.getPosition(enemy.name);
                        enemy.lastKnowcatPosition = catBackPosition;

                        if (
                            catBackPosition.x === enemyPosition.x
                            && catBackPosition.y === enemyPosition.y
                        ) {
                            enemy.updateFollowcatPosition = false;
                            // TODO can attack I guess
                            return;
                        }

                        enemy.updateFollowcatPosition = false;
                        this.time.delayedCall(1000, () => {
                            enemy.updateFollowcatPosition = true;
                        });

                        this.gridEngine.setSpeed(enemy.name, Math.ceil(enemy.speed * 1.5));
                        this.gridEngine.moveTo(enemy.name, catBackPosition, {
                            NoPathFoundStrategy: 'CLOSEST_REACHABLE',
                        });
                    }
                }
            }

            enemy.canSeecat = enemy.body.embedded;
        });

        // Animations
        this.gridEngine.movementStarted().subscribe(({ charId, direction }) => { // 开始移动时切换行走动画
            if (charId === 'cat') {
                // 角色移动方向来自 GridEngine（可能为 8 向）。动画素材仅有 4 向，做归一映射。
                const cardinal = this.inputManager.getCurrentCardinalDirection() || direction;
                const animDir = (cardinal === 'up' || cardinal === 'down' || cardinal === 'left' || cardinal === 'right') ? cardinal : direction;
                this.catSprite.anims.play(`cat_walk_${animDir}`);
            } else {
                const npc = npcSprites.getChildren().find((npcSprite) => npcSprite.texture.key === charId);
                if (npc) {
                    const cardinal = this.inputManager.getCurrentCardinalDirection() || direction;
                    const animDir = (cardinal === 'up' || cardinal === 'down' || cardinal === 'left' || cardinal === 'right') ? cardinal : direction;
                    npc.anims.play(`${charId}_walk_${animDir}`);
                    return;
                }

                const enemy = this.enemiesSprites.getChildren().find((enemySprite) => enemySprite.name === charId);
                if (enemy) {
                    enemy.anims.play(`${enemy.enemySpecies}_walk`);
                }
            }
        });

        this.gridEngine.movementStopped().subscribe(({ charId, direction }) => { // 停止时重置为站立帧/待机
            if (charId === 'cat') {
                this.catSprite.anims.stop();
                const cardinal = this.inputManager.getCurrentCardinalDirection() || direction;
                this.catSprite.setFrame(this.getStopFrame(cardinal, charId));
                // 自动寻路结束（cat 停止）
                this.isAutoMoving = false;
                // 隐藏目标高亮
                if (this.autoMoveTargetHighlight) {
                    this.autoMoveTargetHighlight.setVisible(false);
                }
            } else {
                const npc = npcSprites.getChildren().find((npcSprite) => npcSprite.texture.key === charId);
                if (npc) {
                    npc.anims.stop();
                    const cardinal = this.inputManager.getCurrentCardinalDirection() || direction;
                    npc.setFrame(this.getStopFrame(cardinal, charId));
                    return;
                }

                const enemy = this.enemiesSprites.getChildren().find((enemySprite) => enemySprite.name === charId);
                if (enemy) {
                    enemy.anims.play(`${enemy.enemySpecies}_idle`, true);
                }
            }
        });

        this.gridEngine.directionChanged().subscribe(({ charId, direction }) => { // 朝向改变时更新站立帧
            if (charId === 'cat') {
                const cardinal = this.inputManager.getCurrentCardinalDirection() || direction;
                this.catSprite.setFrame(this.getStopFrame(cardinal, charId));
            } else {
                const npc = npcSprites.getChildren().find((npcSprite) => npcSprite.texture.key === charId);
                if (npc) {
                    const cardinal = this.inputManager.getCurrentCardinalDirection() || direction;
                    npc.setFrame(this.getStopFrame(cardinal, charId));
                    return;
                }

                const enemy = this.enemiesSprites.getChildren().find((enemySprite) => enemySprite.name === charId);
                if (enemy) {
                    enemy.anims.play(`${enemy.enemySpecies}_idle`);
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

        this.physics.add.overlap(this.catActionCollider, elementsLayers, (objA, objB) => { // 与场景元素交互：砍草、推箱
            const tile = [objA, objB].find((obj) => obj !== this.catActionCollider);

            // 防御性校验，确保拿到的是有效的 Tile 对象
            if (!tile || typeof tile.index !== 'number' || (tile.layer == null && tile.tilemapLayer == null)) {
                return;
            }

            // Handles attack
            if (tile.index > 0 && !tile.wasHandled) {
                switch (tile.index) {
                    case BUSH_INDEX: {
                        if (this.isAttacking) {
                            tile.wasHandled = true;

                            this.time.delayedCall(
                                ATTACK_DELAY_TIME,
                                () => {
                                    const layerRef = tile.layer?.tilemapLayer || tile.tilemapLayer;
                                    const dropX = tile.pixelX;
                                    const dropY = tile.pixelY;
                                    if (layerRef) {
                                        // 使用 TilemapLayer API 安全移除瓦片，避免失效引用导致的冻结
                                        layerRef.removeTileAt(tile.x, tile.y, true, true);
                                    }
                                    this.spawnItem({ x: dropX, y: dropY });
                                }
                            );
                        }

                        break;
                    }

                    case BOX_INDEX: {
                        if (this.catSprite.canPush && this.isAttacking) {
                            const newPosition = this.calculatePushTilePosition();
                            const canBePushed = map.layers.every((layer) => {
                                const t = layer.tilemapLayer.getTileAtWorldXY(
                                    newPosition.x,
                                    newPosition.y
                                );

                                return !t?.properties?.ge_collide;
                            });

                            if (canBePushed && !tile.isMoved) {
                                tile.isMoved = true;
                                this.tweens.add({
                                    targets: tile,
                                    pixelX: newPosition.x,
                                    pixelY: newPosition.y,
                                    ease: 'Power2', // PhaserMath.Easing
                                    duration: 700,
                                    onComplete: () => {
                                        const sourceLayer = tile.layer?.tilemapLayer || tile.tilemapLayer;
                                        if (sourceLayer) {
                                            // 移除旧瓦片后在目标位置放置新箱子瓦片
                                            sourceLayer.removeTileAt(tile.x, tile.y, true, true);
                                            const newTile = sourceLayer.putTileAt(
                                                BOX_INDEX,
                                                newPosition.x / 16,
                                                newPosition.y / 16,
                                                true
                                            );

                                            if (newTile) {
                                                newTile.properties = {
                                                    ...tile.properties,
                                                };
                                                newTile.isMoved = true;
                                            }
                                        }
                                    },
                                });
                            }
                        }

                        break;
                    }

                    default: {
                        break;
                    }
                }
            }
        });

        this.physics.add.overlap(this.catActionCollider, this.enemiesSprites, (objA, objB) => { // 攻击判定
            const enemy = [objA, objB].find((obj) => obj !== this.catActionCollider);

            // Handles attack
            if (this.isAttacking) {
                const isSpaceJustDown = this.inputManager.isSpaceJustDown();
                this.time.delayedCall(
                    ATTACK_DELAY_TIME,
                    () => {
                        enemy.takeDamage(25, isSpaceJustDown);
                    }
                );
            }
        });
    }

    update() {
        // 帧更新：根据状态早退；从 InputManager 取当前方向驱动网格移动

        if (
            this.isTeleporting
            || this.isAttacking
            || this.isShowingDialog
        ) {
            return;
        }

        if (
            !this.gridEngine.isMoving('cat')
            && this.inputManager.isSpaceJustDown()
            && this.catSprite.haveSword
        ) {
            const facingDirection = this.gridEngine.getFacingDirection('cat');
            this.catSprite.anims.play(`cat_attack_${facingDirection}`);
            this.isAttacking = true;
            return;
        }

        this.enemiesSprites.getChildren().forEach((enemy) => {
            enemy.canSeecat = enemy.body.embedded;
            if (!enemy.canSeecat && enemy.isFollowingcat) {
                enemy.isFollowingcat = false;
                this.gridEngine.setSpeed(enemy.name, enemy.speed);
                this.gridEngine.moveRandomly(enemy.name, 1000, 4);
            }
        });

        this.catActionCollider.update();
        // 根据周围环境更新交互按钮图标（对话 / 宝箱/箱子 / 攻击）
        this.updateActionContext();
        
        // 使用输入管理器处理移动（虚拟摇杆/键盘已统一到 InputManager）
        const currentDirection = this.inputManager.getCurrentDirection();

        // 无输入时：当非自动寻路才停止（避免打断 moveTo）
        if (!currentDirection && this.gridEngine.isMoving('cat') && !this.isAutoMoving) {
            this.gridEngine.stopMovement('cat');
            return;
        }

        // 有手动输入：打断自动寻路并按输入方向移动
        if (currentDirection) {
            if (this.isAutoMoving) {
                this.isAutoMoving = false;
                this.gridEngine.stopMovement('cat');
                // 手动输入打断时隐藏目标高亮
                if (this.autoMoveTargetHighlight) {
                    this.autoMoveTargetHighlight.setVisible(false);
                }
            }
            if (!this.gridEngine.isMoving('cat')) {
                this.gridEngine.move('cat', currentDirection);
            }
        }
    }
}

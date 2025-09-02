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
 *      heroStatus: { position, previousPosition, frame, facingDirection, health, maxHealth, coin, canPush, haveSword },
 *      mapKey: 'your_map_key_from_BootScene',
 *    });
 * 3. 地图资源需在 `BootScene` 预加载，并确保 Tiled 中 tileset 名称与此处 `addTilesetImage` 匹配。
 * 4. 想要新增 NPC/敌人/物品/传送门：在 Tiled 的对象层 `actions` 中放置对象并配置属性：
 *    - dialog: 值为角色 key（与 React `dialogs` 对应）
 *    - npcData: 形如 `npc_01:random;1000;4;down`
 *    - enemyData: 形如 `slime_green:ai_type;3:40`（类型:AI:速度:生命）
 *    - itemData: 形如 `coin:`、`heart:`、`heart_container:`、`sword:`、`push:`
 *    - teleportTo: 形如 `map_key:10,12`
 * 5. 输入与移动：
 *    - 键盘 WASD/方向键 与 触摸（虚拟摇杆/动作按钮）均通过 `InputManager` 统一处理。
 *    - 在 `update()` 中读取当前方向并调用 `gridEngine.move('hero', direction)`。
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

    init(data) {
        this.initData = data;
    }

    calculatePreviousTeleportPosition() {
        // 计算传送前玩家的“上一格”位置，用于从目的地回传时的落点与朝向
        const currentPosition = this.gridEngine.getPosition('hero');
        const facingDirection = this.gridEngine.getFacingDirection('hero');

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

    createPlayerWalkingAnimation(assetKey, animationName) {
        // 角色/NPC 的行走循环动画（上/右/下/左），若不存在则创建
        const animationKey = `${assetKey}_${animationName}`;
        if (!this.anims.exists(animationKey)) {
            this.anims.create({
                key: animationKey,
                frames: [
                    { key: assetKey, frame: `${assetKey}_${animationName}_01` },
                    { key: assetKey, frame: `${assetKey}_${animationName.replace('walking', 'idle')}_01` },
                    { key: assetKey, frame: `${assetKey}_${animationName}_02` },
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
                    { key: assetKey, frame: `${assetKey}_${animationName}_01` },
                    { key: assetKey, frame: `${assetKey}_${animationName}_02` },
                    { key: assetKey, frame: `${assetKey}_${animationName}_03` },
                    { key: assetKey, frame: `${assetKey}_${animationName}_04` },
                    { key: assetKey, frame: `${assetKey}_${animationName.replace('attack', 'idle')}_01` },
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
                return `${spriteKey}_idle_up_01`;
            case 'right':
                return `${spriteKey}_idle_right_01`;
            case 'down':
                return `${spriteKey}_idle_down_01`;
            case 'left':
                return `${spriteKey}_idle_left_01`;
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

    calculateHeroHealthState(health) {
        // 将血量转为 UI 需要的状态片段：full/half/empty
        if (health > 10) {
            return 'full';
        }

        if (health > 0) {
            return 'half';
        }

        return 'empty';
    }

    calculateHeroHealthStates() {
        // 计算一排心形容器的状态数组，maxHealth 每 20 为一格
        return Array.from({ length: this.heroSprite.maxHealth / 20 })
            .fill(null).map(
                (v, index) => this.calculateHeroHealthState(
                    Math.max(this.heroSprite.health - (20 * index), 0)
                )
            );
    }

    updateHeroHealthUi(healthStates) {
        // 通过自定义事件与 React `HeroHealth` 同步
        const customEvent = new CustomEvent('hero-health', {
            detail: {
                healthStates,
            },
        });

        window.dispatchEvent(customEvent);
    }

    updateHeroCoinUi(heroCoins) {
        // 通过自定义事件与 React `HeroCoin` 同步
        const customEvent = new CustomEvent('hero-coin', {
            detail: {
                heroCoins,
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
        const facingDirection = this.gridEngine.getFacingDirection('hero');
        const position = this.gridEngine.getPosition('hero');

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
        const { heroStatus, mapKey } = this.initData;
        const {
            position: initialPosition,
            frame: initialFrame,
            facingDirection: initialFacingDirection,
            previousPosition,
            health: heroHealth,
            maxHealth: heroMaxHealth,
            coin: heroCoin,
            canPush: heroCanPush,
            haveSword: heroHaveSword,
        } = heroStatus;

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
            this.map = map;
        }

        // Hero 主角：初始属性、碰撞盒与交互体
        this.heroSprite = this.physics.add
            .sprite(initialPosition.x * 16, initialPosition.y * 16, 'hero', initialFrame)
            .setDepth(1);
        this.heroSprite.health = heroHealth;
        this.heroSprite.maxHealth = heroMaxHealth;
        this.heroSprite.coin = heroCoin;
        this.heroSprite.canPush = heroCanPush;
        this.heroSprite.haveSword = heroHaveSword;
        this.updateHeroHealthUi(this.calculateHeroHealthStates());
        this.updateHeroCoinUi(heroCoin);

        this.heroSprite.restoreHealth = (restore) => {
            this.heroSprite.health = Math.min(this.heroSprite.health + restore, this.heroSprite.maxHealth);
            this.updateHeroHealthUi(this.calculateHeroHealthStates());
        };

        this.heroSprite.increaseMaxHealth = (increase) => {
            this.heroSprite.maxHealth += increase;
            this.updateHeroHealthUi(this.calculateHeroHealthStates());
        };

        this.heroSprite.collectCoin = (coinQuantity) => {
            this.heroSprite.coin = Math.min(this.heroSprite.coin + coinQuantity, 999);
            this.updateHeroCoinUi(this.heroSprite.coin);
        };

        this.heroSprite.takeDamage = (damage) => {
            this.time.delayedCall(
                180,
                () => {
                    this.heroSprite.health -= damage;
                    if (this.heroSprite.health <= 0) {
                        camera.fadeOut(SCENE_FADE_TIME);
                        this.updateHeroHealthUi([]);
                        this.updateHeroCoinUi(null);
                        this.time.delayedCall(
                            SCENE_FADE_TIME,
                            () => {
                                this.isTeleporting = false;
                                this.scene.start('GameOverScene');
                            }
                        );
                    } else {
                        this.updateHeroHealthUi(this.calculateHeroHealthStates());
                        this.tweens.add({
                            targets: this.heroSprite,
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
        this.heroSprite.body.setSize(14, 14);
        this.heroSprite.body.setOffset(9, 13);
        this.heroActionCollider = createInteractiveGameObject(
            this,
            this.heroSprite.x + 9,
            this.heroSprite.y + 36,
            14,
            8,
            'attack',
            isDebugMode
        );
        this.heroPresenceCollider = createInteractiveGameObject(
            this,
            this.heroSprite.x + 16,
            this.heroSprite.y + 20,
            320, // TODO
            320, // TODO
            'presence',
            isDebugMode,
            { x: 0.5, y: 0.5 }
        );
        this.heroObjectCollider = createInteractiveGameObject(
            this,
            this.heroSprite.x + 16,
            this.heroSprite.y + 20,
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

            this.physics.add.collider(this.heroSprite, layer);
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

                        this.physics.add.overlap(this.heroActionCollider, customCollider, (objA, objB) => {
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
                                if (!heroHaveSword) {
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
                                if (!heroCanPush) {
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

                        const overlapCollider = this.physics.add.overlap(this.heroSprite, customCollider, () => {
                            console.log('Hero entered teleport, teleporting to:', teleportToMapKey, teleportToX, teleportToY);
                            // camera.stopFollow();
                            this.physics.world.removeCollider(overlapCollider);
                            const facingDirection = this.gridEngine.getFacingDirection('hero');
                            camera.fadeOut(SCENE_FADE_TIME);
                            // this.scene.pause();
                            this.isTeleporting = true;
                            // this.gridEngine.stopMovement('hero');

                            this.time.delayedCall(
                                SCENE_FADE_TIME,
                                () => {
                                    this.isTeleporting = false;
                                    this.scene.restart({
                                        heroStatus: {
                                            position: { x: teleportToX, y: teleportToY },
                                            previousPosition: this.calculatePreviousTeleportPosition(),
                                            frame: `hero_idle_${facingDirection}_01`,
                                            facingDirection,
                                            health: this.heroSprite.health,
                                            maxHealth: this.heroSprite.maxHealth,
                                            coin: this.heroSprite.coin,
                                            canPush: this.heroSprite.canPush,
                                            haveSword: this.heroSprite.haveSword,
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

        camera.startFollow(this.heroSprite, true); // 相机跟随主角
        camera.setFollowOffset(-this.heroSprite.width, -this.heroSprite.height);
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
                    id: 'hero',
                    sprite: this.heroSprite,
                    startPosition: initialPosition,
                    offsetY: 4,
                },
            ],
            numberOfDirections: 8,
        };

        this.physics.add.overlap(this.heroSprite, this.itemsSprites, (objA, objB) => {
            const item = [objA, objB].find((obj) => obj !== this.heroSprite);

            if (item.itemType === 'heart') {
                this.heroSprite.restoreHealth(20);
                item.setVisible(false);
                item.destroy();
            }

            if (item.itemType === 'coin') {
                this.heroSprite.collectCoin(1);
                item.setVisible(false);
                item.destroy();
            }

            if (item.itemType === 'heart_container') {
                this.heroSprite.increaseMaxHealth(20);
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

                this.heroSprite.haveSword = true;
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

                this.heroSprite.canPush = true;
                item.setVisible(false);
                item.destroy();
            }
        });

        this.enemiesSprites = this.add.group();
        enemiesData.forEach((enemyData, index) => { // 敌人创建、动画与网格配置
            const { enemySpecies, enemyType, x, y, enemyName, speed, enemyAI, health } = enemyData;
            const enemy = this.physics.add.sprite(0, 0, enemyType, `${enemySpecies}_idle_01`);
            enemy.setTint(this.getEnemyColor(enemyType));
            enemy.name = enemyName;
            enemy.enemyType = enemyType;
            enemy.enemySpecies = enemySpecies;
            enemy.enemyAI = enemyAI;
            enemy.speed = speed;
            enemy.health = health;
            enemy.isAttacking = false;
            enemy.updateFollowHeroPosition = true;
            enemy.lastKnowHeroPosition = { x: 0, y: 0 };
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

            if (!this.anims.exists(`${enemySpecies}_walking`)) {
                this.anims.create({
                    key: `${enemySpecies}_walking`,
                    frames: this.getFramesForAnimation(enemySpecies, 'walking'),
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
            const npc = this.physics.add.sprite(0, 0, npcKey, `${npcKey}_idle_${facingDirection}_01`);
            npc.body.setSize(14, 14);
            npc.body.setOffset(9, 13);
            npcSprites.add(npc);

            this.createPlayerWalkingAnimation(npcKey, 'walking_up');
            this.createPlayerWalkingAnimation(npcKey, 'walking_right');
            this.createPlayerWalkingAnimation(npcKey, 'walking_down');
            this.createPlayerWalkingAnimation(npcKey, 'walking_left');

            gridEngineConfig.characters.push({
                id: npcKey,
                sprite: npc,
                startPosition: { x: x / 16, y: (y / 16) - 1 },
                speed: 1,
                offsetY: 4,
            });
        });

        // Movement
        this.createPlayerWalkingAnimation('hero', 'walking_up');
        this.createPlayerWalkingAnimation('hero', 'walking_right');
        this.createPlayerWalkingAnimation('hero', 'walking_down');
        this.createPlayerWalkingAnimation('hero', 'walking_left');

        // Attack
        this.createPlayerAttackAnimation('hero', 'attack_up', 12, 0, false);
        this.createPlayerAttackAnimation('hero', 'attack_right', 12, 0, false);
        this.createPlayerAttackAnimation('hero', 'attack_down', 12, 0, false);
        this.createPlayerAttackAnimation('hero', 'attack_left', 12, 0, false);

        this.heroSprite.on('animationcomplete', (animation, animationFrame) => {
            if (animation.key.includes('attack')) {
                this.isAttacking = false;
            }
        });

        this.heroSprite.on('animationstop', (animation, animationFrame) => {
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
            this.gridEngine.moveTo('hero', target, {
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
        this.physics.add.overlap(this.heroObjectCollider, this.enemiesSprites, (objA, objB) => {
            const enemy = [objA, objB].find((obj) => obj !== this.heroObjectCollider);
            if (enemy.isAttacking || this.gridEngine.isMoving(enemy.name)) {
                return;
            }

            enemy.anims.play(`${enemy.enemySpecies}_attack`);
            this.heroSprite.takeDamage(10);
            enemy.isAttacking = true;
            this.time.delayedCall(
                this.getEnemyAttackSpeed(enemy.enemyType),
                () => {
                    enemy.isAttacking = false;
                }
            );
        });

        this.physics.add.overlap(this.heroPresenceCollider, this.enemiesSprites, (objA, objB) => {
            const enemy = [objA, objB].find((obj) => obj !== this.heroPresenceCollider);

            if (enemy.canSeeHero && enemy.enemyAI === ENEMY_AI_TYPE) {
                enemy.isFollowingHero = true;
                if (enemy.updateFollowHeroPosition) {
                    const facingDirection = this.gridEngine.getFacingDirection('hero');
                    const heroPosition = this.gridEngine.getPosition('hero');
                    const heroBackPosition = this.getBackPosition(facingDirection, heroPosition);

                    if (
                        enemy.lastKnowHeroPosition.x !== heroBackPosition.x
                        || enemy.lastKnowHeroPosition.y !== heroBackPosition.y
                    ) {
                        const enemyPosition = this.gridEngine.getPosition(enemy.name);
                        enemy.lastKnowHeroPosition = heroBackPosition;

                        if (
                            heroBackPosition.x === enemyPosition.x
                            && heroBackPosition.y === enemyPosition.y
                        ) {
                            enemy.updateFollowHeroPosition = false;
                            // TODO can attack I guess
                            return;
                        }

                        enemy.updateFollowHeroPosition = false;
                        this.time.delayedCall(1000, () => {
                            enemy.updateFollowHeroPosition = true;
                        });

                        this.gridEngine.setSpeed(enemy.name, Math.ceil(enemy.speed * 1.5));
                        this.gridEngine.moveTo(enemy.name, heroBackPosition, {
                            NoPathFoundStrategy: 'CLOSEST_REACHABLE',
                        });
                    }
                }
            }

            enemy.canSeeHero = enemy.body.embedded;
        });

        // Animations
        this.gridEngine.movementStarted().subscribe(({ charId, direction }) => { // 开始移动时切换行走动画
            if (charId === 'hero') {
                this.heroSprite.anims.play(`hero_walking_${direction}`);
            } else {
                const npc = npcSprites.getChildren().find((npcSprite) => npcSprite.texture.key === charId);
                if (npc) {
                    npc.anims.play(`${charId}_walking_${direction}`);
                    return;
                }

                const enemy = this.enemiesSprites.getChildren().find((enemySprite) => enemySprite.name === charId);
                if (enemy) {
                    enemy.anims.play(`${enemy.enemySpecies}_walking`);
                }
            }
        });

        this.gridEngine.movementStopped().subscribe(({ charId, direction }) => { // 停止时重置为站立帧/待机
            if (charId === 'hero') {
                this.heroSprite.anims.stop();
                this.heroSprite.setFrame(this.getStopFrame(direction, charId));
                // 自动寻路结束（hero 停止）
                this.isAutoMoving = false;
                // 隐藏目标高亮
                if (this.autoMoveTargetHighlight) {
                    this.autoMoveTargetHighlight.setVisible(false);
                }
            } else {
                const npc = npcSprites.getChildren().find((npcSprite) => npcSprite.texture.key === charId);
                if (npc) {
                    npc.anims.stop();
                    npc.setFrame(this.getStopFrame(direction, charId));
                    return;
                }

                const enemy = this.enemiesSprites.getChildren().find((enemySprite) => enemySprite.name === charId);
                if (enemy) {
                    enemy.anims.play(`${enemy.enemySpecies}_idle`, true);
                }
            }
        });

        this.gridEngine.directionChanged().subscribe(({ charId, direction }) => { // 朝向改变时更新站立帧
            if (charId === 'hero') {
                this.heroSprite.setFrame(this.getStopFrame(direction, charId));
            } else {
                const npc = npcSprites.getChildren().find((npcSprite) => npcSprite.texture.key === charId);
                if (npc) {
                    npc.setFrame(this.getStopFrame(direction, charId));
                    return;
                }

                const enemy = this.enemiesSprites.getChildren().find((enemySprite) => enemySprite.name === charId);
                if (enemy) {
                    enemy.anims.play(`${enemy.enemySpecies}_idle`);
                }
            }
        });

        this.heroActionCollider.update = () => { // 随主角更新交互体位置与朝向
            const facingDirection = this.gridEngine.getFacingDirection('hero');
            this.heroPresenceCollider.setPosition(
                this.heroSprite.x + 16,
                this.heroSprite.y + 20
            );

            this.heroObjectCollider.setPosition(
                this.heroSprite.x + 16,
                this.heroSprite.y + 20
            );

            switch (facingDirection) {
                case 'down': {
                    this.heroActionCollider.setSize(14, 8);
                    this.heroActionCollider.body.setSize(14, 8);
                    this.heroActionCollider.setX(this.heroSprite.x + 9);
                    this.heroActionCollider.setY(this.heroSprite.y + 36);

                    break;
                }

                case 'up': {
                    this.heroActionCollider.setSize(14, 8);
                    this.heroActionCollider.body.setSize(14, 8);
                    this.heroActionCollider.setX(this.heroSprite.x + 9);
                    this.heroActionCollider.setY(this.heroSprite.y + 12);

                    break;
                }

                case 'left': {
                    this.heroActionCollider.setSize(8, 14);
                    this.heroActionCollider.body.setSize(8, 14);
                    this.heroActionCollider.setX(this.heroSprite.x);
                    this.heroActionCollider.setY(this.heroSprite.y + 21);

                    break;
                }

                case 'right': {
                    this.heroActionCollider.setSize(8, 14);
                    this.heroActionCollider.body.setSize(8, 14);
                    this.heroActionCollider.setX(this.heroSprite.x + 24);
                    this.heroActionCollider.setY(this.heroSprite.y + 21);

                    break;
                }

                default: {
                    break;
                }
            }
        };

        this.physics.add.overlap(this.heroActionCollider, npcSprites, (objA, objB) => { // 回车与 NPC 交互（对话）
            if (this.isShowingDialog) {
                return;
            }

            const npc = [objA, objB].find((obj) => obj !== this.heroActionCollider);

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
                const facingDirection = this.gridEngine.getFacingDirection('hero');
                this.gridEngine.stopMovement(characterName);
                npc.setFrame(this.getStopFrame(this.getOppositeDirection(facingDirection), characterName));
            }
        });

        this.physics.add.overlap(this.heroActionCollider, elementsLayers, (objA, objB) => { // 与场景元素交互：砍草、推箱
            const tile = [objA, objB].find((obj) => obj !== this.heroActionCollider);

            // Handles attack
            if (tile?.index > 0 && !tile.wasHandled) {
                switch (tile.index) {
                    case BUSH_INDEX: {
                        if (this.isAttacking) {
                            tile.wasHandled = true;

                            this.time.delayedCall(
                                ATTACK_DELAY_TIME,
                                () => {
                                    tile.setVisible(false);
                                    this.spawnItem({
                                        x: tile.pixelX,
                                        y: tile.pixelY,
                                    });
                                    tile.destroy();
                                }
                            );
                        }

                        break;
                    }

                    case BOX_INDEX: {
                        if (this.heroSprite.canPush && this.isAttacking) {
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
                                        tile.setVisible(false);
                                        const newTile = tile.layer.tilemapLayer.putTileAt(
                                            BOX_INDEX,
                                            newPosition.x / 16,
                                            newPosition.y / 16,
                                            true
                                        );

                                        newTile.properties = {
                                            ...tile.properties,
                                        };
                                        newTile.isMoved = true;
                                        tile.destroy();
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

        this.physics.add.overlap(this.heroActionCollider, this.enemiesSprites, (objA, objB) => { // 攻击判定
            const enemy = [objA, objB].find((obj) => obj !== this.heroActionCollider);

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
            !this.gridEngine.isMoving('hero')
            && this.inputManager.isSpaceJustDown()
            && this.heroSprite.haveSword
        ) {
            const facingDirection = this.gridEngine.getFacingDirection('hero');
            this.heroSprite.anims.play(`hero_attack_${facingDirection}`);
            this.isAttacking = true;
            return;
        }

        this.enemiesSprites.getChildren().forEach((enemy) => {
            enemy.canSeeHero = enemy.body.embedded;
            if (!enemy.canSeeHero && enemy.isFollowingHero) {
                enemy.isFollowingHero = false;
                this.gridEngine.setSpeed(enemy.name, enemy.speed);
                this.gridEngine.moveRandomly(enemy.name, 1000, 4);
            }
        });

        this.heroActionCollider.update();
        
        // 使用输入管理器处理移动（虚拟摇杆/键盘已统一到 InputManager）
        const currentDirection = this.inputManager.getCurrentDirection();

        // 无输入时：当非自动寻路才停止（避免打断 moveTo）
        if (!currentDirection && this.gridEngine.isMoving('hero') && !this.isAutoMoving) {
            this.gridEngine.stopMovement('hero');
            return;
        }

        // 有手动输入：打断自动寻路并按输入方向移动
        if (currentDirection) {
            if (this.isAutoMoving) {
                this.isAutoMoving = false;
                this.gridEngine.stopMovement('hero');
                // 手动输入打断时隐藏目标高亮
                if (this.autoMoveTargetHighlight) {
                    this.autoMoveTargetHighlight.setVisible(false);
                }
            }
            if (!this.gridEngine.isMoving('hero')) {
                this.gridEngine.move('hero', currentDirection);
            }
        }
    }
}

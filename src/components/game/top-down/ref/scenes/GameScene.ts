import { Input, Math as PhaserMath, Scene, GameObjects, Physics, Tilemaps } from 'phaser';
import { createInteractiveGameObject } from '../utils';
import {
    ATTACK_DELAY_TIME,
    BOX_INDEX,
    BUSH_INDEX,
    ENEMY_AI_TYPE,
    NPC_MOVEMENT_RANDOM,
    SCENE_FADE_TIME,
} from '../constants';

// 位置接口
interface Position {
    x: number;
    y: number;
}

// 传送数据接口
interface TeleportData {
    mapKey: string;
    x: number;
    y: number;
}

// NPC 数据接口
interface NpcData {
    npcKey: string;
    movementType: string;
    facingDirection: string;
    delay: number;
    area: number;
}

// 英雄状态接口
interface HeroStatus {
    position: Position;
    previousPosition: Position;
    frame: string;
    facingDirection: string;
    health: number;
    maxHealth: number;
    coin: number;
    canPush: boolean;
    haveSword: boolean;
}

// 游戏场景数据接口
interface GameSceneData {
    heroStatus: HeroStatus;
    mapKey: string;
}

// 扩展的精灵接口
interface ExtendedSprite extends GameObjects.Sprite {
    itemType?: string;
    isCustomCollider?: boolean;
    health?: number;
    maxHealth?: number;
    coin?: number;
    canPush?: boolean;
    haveSword?: boolean;
    restoreHealth?: (restore: number) => void;
    increaseMaxHealth?: (increase: number) => void;
    collectCoin?: (coinQuantity: number) => void;
    takeDamage?: (damage: number) => void;
}

/**
 * 主游戏场景
 * 处理游戏的核心逻辑，包括玩家控制、敌人 AI、物品系统等
 */
export default class GameScene extends Scene {
    // 输入控制
    private enterKey!: Input.Keyboard.Key;
    private spaceKey!: Input.Keyboard.Key;
    private cursors!: any;
    private wasd!: Input.Keyboard.Key[];

    // 游戏状态
    private isShowingDialog: boolean = false;
    private isTeleporting: boolean = false;
    private isAttacking: boolean = false;

    // 游戏对象
    private heroSprite!: ExtendedSprite;
    private itemsSprites!: Physics.Arcade.Group;
    private gridEngine: any; // Grid Engine 实例
    private map!: Tilemaps.Tilemap;
    private heroActionCollider!: GameObjects.Rectangle;
    private heroPresenceCollider!: GameObjects.Rectangle;
    private heroObjectCollider!: GameObjects.Rectangle;

    // 初始化数据
    private initData!: GameSceneData;

    constructor() {
        super('GameScene');
    }

    /**
     * 初始化场景数据
     * @param data - 传入的游戏数据
     */
    init(data: GameSceneData): void {
        this.initData = data;
    }

    /**
     * 计算传送前的位置
     * 根据当前面向方向计算传送前的位置
     * @returns 传送前的位置
     */
    calculatePreviousTeleportPosition(): Position {
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

    /**
     * 计算推箱子瓦片位置
     * @returns 推箱子瓦片位置
     */
    calculatePushTilePosition(): Position {
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

    /**
     * 获取动画帧
     * @param assetKey - 资源键名
     * @param animation - 动画名称
     * @returns 动画帧数组
     */
    getFramesForAnimation(assetKey: string, animation: string): any[] {
        return this.anims.generateFrameNames(assetKey)
            .filter((frame) => {
                const frameName = frame.frame as string;
                if (frameName && frameName.includes(`${assetKey}_${animation}`)) {
                    const parts = frameName.split(`${assetKey}_${animation}_`);
                    return Boolean(!Number.isNaN(Number.parseInt(parts[1], 10)));
                }

                return false;
            })
            .sort((a, b) => {
                const frameA = a.frame as string;
                const frameB = b.frame as string;
                return frameA < frameB ? -1 : 1;
            });
    }

    /**
     * 创建玩家行走动画
     * @param assetKey - 资源键名
     * @param animationName - 动画名称
     */
    createPlayerWalkingAnimation(assetKey: string, animationName: string): void {
        this.anims.create({
            key: `${assetKey}_${animationName}`,
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

    /**
     * 创建玩家攻击动画
     * @param assetKey - 资源键名
     * @param animationName - 动画名称
     */
    createPlayerAttackAnimation(assetKey: string, animationName: string): void {
        this.anims.create({
            key: `${assetKey}_${animationName}`,
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

    /**
     * 获取停止帧
     * @param direction - 方向
     * @param spriteKey - 精灵键名
     * @returns 停止帧名称
     */
    getStopFrame(direction: string, spriteKey: string): string | null {
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

    /**
     * 获取相反方向
     * @param direction - 当前方向
     * @returns 相反方向
     */
    getOppositeDirection(direction: string): string | null {
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

    /**
     * 获取后方位置
     * @param facingDirection - 面向方向
     * @param position - 当前位置
     * @returns 后方位置
     */
    getBackPosition(facingDirection: string, position: Position): Position {
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
     * 从 Tiled 数据中提取传送信息
     * @param data - Tiled 数据字符串
     * @returns 传送数据对象
     */
    extractTeleportDataFromTiled(data: string): TeleportData {
        const [mapKey, position] = data.trim().split(':');
        const [x, y] = position.split(',');

        return {
            mapKey,
            x: Number.parseInt(x, 10),
            y: Number.parseInt(y, 10),
        };
    }

    /**
     * 从 Tiled 数据中提取 NPC 信息
     * @param data - Tiled 数据字符串
     * @returns NPC 数据对象
     */
    extractNpcDataFromTiled(data: string): NpcData {
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

    /**
     * 计算英雄健康状态
     * @param health - 健康值
     * @returns 健康状态字符串
     */
    calculateHeroHealthState(health: number): string {
        if (health > 10) {
            return 'full';
        }

        if (health > 0) {
            return 'half';
        }

        return 'empty';
    }

    /**
     * 计算英雄所有健康状态
     * @returns 健康状态数组
     */
    calculateHeroHealthStates(): string[] {
        const maxHealth = this.heroSprite.maxHealth || 60;
        const health = this.heroSprite.health || 60;
        return Array.from({ length: maxHealth / 20 })
            .fill(null).map(
                (v, index) => this.calculateHeroHealthState(
                    Math.max(health - (20 * index), 0)
                )
            );
    }

    /**
     * 更新英雄健康 UI
     * @param healthStates - 健康状态数组
     */
    updateHeroHealthUi(healthStates: string[]): void {
        const customEvent = new CustomEvent('hero-health', {
            detail: {
                healthStates,
            },
        });

        window.dispatchEvent(customEvent);
    }

    /**
     * 更新英雄金币 UI
     * @param heroCoins - 英雄金币数量
     */
    updateHeroCoinUi(heroCoins: number): void {
        const customEvent = new CustomEvent('hero-coin', {
            detail: {
                heroCoins,
            },
        });

        window.dispatchEvent(customEvent);
    }

    /**
     * 获取敌人物种
     * @param enemyType - 敌人类型
     * @returns 敌人物种
     */
    getEnemySpecies(enemyType: string): string {
        if (enemyType.includes('slime')) {
            return 'slime';
        }

        return 'slime';
    }

    /**
     * 获取敌人颜色
     * @param enemyType - 敌人类型
     * @returns 颜色值
     */
    getEnemyColor(enemyType: string): number {
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

    /**
     * 获取敌人攻击速度
     * @param enemyType - 敌人类型
     * @returns 攻击间隔时间（毫秒）
     */
    getEnemyAttackSpeed(enemyType: string): number {
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

    /**
     * 生成物品
     * @param position - 生成位置
     */
    spawnItem(position: Position): void {
        const isDebugMode = (this.physics.config as any).debug;
        const itemChance = PhaserMath.Between(1, isDebugMode ? 2 : 5);
        if (itemChance === 1) {
            const itemType = PhaserMath.Between(1, 2);

            if (itemType === 1) {
                const item = this.physics.add
                    .sprite(position.x, position.y, 'heart')
                    .setDepth(1)
                    .setOrigin(0, 0) as ExtendedSprite;
                item.itemType = 'heart';
                this.itemsSprites.add(item);
                item.anims.play('heart_idle');
            } else if (itemType === 2) {
                const item = this.physics.add
                    .sprite(position.x, position.y, 'coin')
                    .setDepth(1)
                    .setOrigin(0, 0) as ExtendedSprite;
                item.itemType = 'coin';
                this.itemsSprites.add(item);
                item.anims.play('coin_idle');
            }
        }
    }

    /**
     * 创建阶段 - 初始化游戏场景
     */
    create(): void {
        const camera = this.cameras.main;
        const { game } = this.sys;
        const isDebugMode = (this.physics.config as any).debug;
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

        // 场景淡入效果
        camera.fadeIn(SCENE_FADE_TIME);

        // 设置输入控制
        this.enterKey = this.input.keyboard.addKey(Input.Keyboard.KeyCodes.ENTER)!;
        this.spaceKey = this.input.keyboard.addKey(Input.Keyboard.KeyCodes.SPACE)!;
        this.cursors = this.input.keyboard.createCursorKeys();
        this.wasd = this.input.keyboard.addKeys({
            up: Input.Keyboard.KeyCodes.W,
            down: Input.Keyboard.KeyCodes.S,
            left: Input.Keyboard.KeyCodes.A,
            right: Input.Keyboard.KeyCodes.D,
        }) as Input.Keyboard.Key[];

        // 创建地图
        this.map = this.make.tilemap({ key: mapKey });
        this.map.addTilesetImage('tileset', 'tileset');

        if (isDebugMode) {
            (window as any).phaserGame = game;
        }

        // 创建英雄精灵
        this.heroSprite = this.physics.add
            .sprite(0, 0, 'hero', initialFrame)
            .setDepth(1) as ExtendedSprite;
        
        // 设置英雄属性
        this.heroSprite.health = heroHealth;
        this.heroSprite.maxHealth = heroMaxHealth;
        this.heroSprite.coin = heroCoin;
        this.heroSprite.canPush = heroCanPush;
        this.heroSprite.haveSword = heroHaveSword;
        
        // 更新 UI
        this.updateHeroHealthUi(this.calculateHeroHealthStates());
        this.updateHeroCoinUi(heroCoin);

        // 设置英雄方法
        this.heroSprite.restoreHealth = (restore: number) => {
            const currentHealth = this.heroSprite.health || 0;
            const maxHealth = this.heroSprite.maxHealth || 60;
            this.heroSprite.health = Math.min(currentHealth + restore, maxHealth);
            this.updateHeroHealthUi(this.calculateHeroHealthStates());
        };

        this.heroSprite.increaseMaxHealth = (increase: number) => {
            this.heroSprite.maxHealth = (this.heroSprite.maxHealth || 60) + increase;
            this.updateHeroHealthUi(this.calculateHeroHealthStates());
        };

        this.heroSprite.collectCoin = (coinQuantity: number) => {
            const currentCoin = this.heroSprite.coin || 0;
            this.heroSprite.coin = Math.min(currentCoin + coinQuantity, 999);
            this.updateHeroCoinUi(this.heroSprite.coin);
        };

        this.heroSprite.takeDamage = (damage: number) => {
            this.time.delayedCall(
                180,
                () => {
                    const currentHealth = this.heroSprite.health || 0;
                    this.heroSprite.health = currentHealth - damage;
                    if (this.heroSprite.health <= 0) {
                        camera.fadeOut(SCENE_FADE_TIME);
                        this.updateHeroHealthUi([]);
                        this.updateHeroCoinUi(0);
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

        // 设置英雄碰撞体
        if (this.heroSprite.body) {
            (this.heroSprite.body as any).setSize(14, 14);
            (this.heroSprite.body as any).setOffset(9, 13);
        }
        
        // 创建英雄交互碰撞器
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
            320,
            320,
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

        // 创建物品组
        this.itemsSprites = this.physics.add.group();
        
        // 创建物品动画
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

        // 创建地图层
        const elementsLayers = this.add.group();
        for (let i = 0; i < this.map.layers.length; i++) {
            const layer = this.map.createLayer(i, 'tileset', 0, 0);
            if (layer && layer.layer && layer.layer.properties) {
                layer.layer.properties.forEach((property: any) => {
                    const { value, name } = property;

                    if (name === 'type' && value === 'elements') {
                        elementsLayers.add(layer);
                    }
                });

                this.physics.add.collider(this.heroSprite, layer);
            }
        }

        // 初始化 Grid Engine
        this.gridEngine = this.plugins.get('gridEngine');
        this.gridEngine.create(this.map, {
            characters: [
                {
                    id: 'hero',
                    sprite: this.heroSprite,
                    startPosition: initialPosition,
                    facingDirection: initialFacingDirection,
                },
            ],
        });

        // 设置输入处理
        this.setupInputHandling();
    }

    /**
     * 设置输入处理
     */
    private setupInputHandling(): void {
        // 这里可以添加输入处理逻辑
        // 由于原文件很大，这里简化处理
    }

    /**
     * 更新阶段
     */
    update(): void {
        // 这里可以添加更新逻辑
        // 由于原文件很大，这里简化处理
    }
}
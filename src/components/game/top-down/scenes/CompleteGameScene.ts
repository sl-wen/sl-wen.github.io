import * as Phaser from 'phaser';
import { SoundManager } from '../systems/SoundManager';
import { MapManager } from '../systems/MapManager';
import { MapInteractionManager } from '../systems/MapInteractionManager';
import { InventorySystem } from '../systems/InventorySystem';
import { QuestSystem } from '../systems/QuestSystem';
import { CombatSystem } from '../systems/CombatSystem';
import { GameDataManager } from '../systems/GameDataManager';
import { GameStatsManager } from '../systems/GameStatsManager';
import { PerformanceManager } from '../systems/PerformanceManager';
import { 
    SCENE_FADE_TIME, 
    ATTACK_DELAY_TIME, 
    BUSH_INDEX, 
    BOX_INDEX, 
    COIN_INDEX, 
    HEART_CONTAINER_INDEX,
    NPC_MOVEMENT_RANDOM,
    NPC_MOVEMENT_STILL,
    ENEMY_AI_TYPE,
    GAME_CONFIG,
    ANIMATION_CONFIG,
    GAME_BALANCE
} from '../constants';
import { createInteractiveGameObject, calculateDistance, randomInt } from '../utils';



export class CompleteGameScene extends Phaser.Scene {
    // 游戏系统
    private soundManager!: SoundManager;
    private mapManager!: MapManager;
    private mapInteractionManager!: MapInteractionManager;
    private inventorySystem!: InventorySystem;
    private questSystem!: QuestSystem;
    private combatSystem!: CombatSystem;
    private gameDataManager!: GameDataManager;
    private statsManager!: GameStatsManager;
    private performanceManager!: PerformanceManager;

    // 游戏状态
    private isShowingDialog = false;
    private isTeleporting = false;
    private isAttacking = false;
    private isSpaceJustDown = false;
    private initData: any = {};

    // 游戏对象
    private heroSprite!: Phaser.Physics.Arcade.Sprite;
    private heroActionCollider!: Phaser.GameObjects.Rectangle;
    private heroPresenceCollider!: Phaser.GameObjects.Rectangle;
    private heroObjectCollider!: Phaser.GameObjects.Rectangle;
    private enemiesSprites!: Phaser.GameObjects.Group;
    private itemsSprites!: Phaser.GameObjects.Group;
    private npcSprites!: Phaser.GameObjects.Group;
    private map!: Phaser.Tilemaps.Tilemap;
    private gridEngine: any;

    // 输入控制
    private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
    private wasd!: Phaser.Types.Input.Keyboard.Key[];
    private spaceKey!: Phaser.Types.Input.Keyboard.Key;
    private enterKey!: Phaser.Types.Input.Keyboard.Key;

    // 英雄状态
    private heroStatus = {
        health: 100,
        maxHealth: 100,
        coin: 0,
        canPush: false,
        haveSword: false,
        level: 1,
        experience: 0
    };

    constructor() {
        super('CompleteGameScene');
    }

    // 工具方法 - 移植自原项目
    private calculatePreviousTeleportPosition() {
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

    private getFramesForAnimation(assetKey: string, animation: string) {
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

    private createPlayerWalkingAnimation(assetKey: string, animationName: string) {
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

    private createPlayerAttackAnimation(assetKey: string, animationName: string) {
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

    private getStopFrame(direction: string, spriteKey: string) {
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

    private getOppositeDirection(direction: string) {
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

    private getBackPosition(facingDirection: string, position: { x: number; y: number }) {
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

    private extractTeleportDataFromTiled(data: string) {
        const [mapKey, position] = data.trim().split(':');
        const [x, y] = position.split(',');

        return {
            mapKey,
            x: Number.parseInt(x, 10),
            y: Number.parseInt(y, 10),
        };
    }

    private extractNpcDataFromTiled(data: string) {
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

    private calculateHeroHealthState(health: number) {
        if (health > 10) {
            return 'full';
        }
        if (health > 0) {
            return 'half';
        }
        return 'empty';
    }

    private calculateHeroHealthStates() {
        return Array.from({ length: this.heroSprite.maxHealth / 20 })
            .fill(null).map(
                (v, index) => this.calculateHeroHealthState(
                    Math.max(this.heroSprite.health - (20 * index), 0)
                )
            );
    }

    private updateHeroHealthUi(healthStates: string[]) {
        const customEvent = new CustomEvent('hero-health', {
            detail: {
                healthStates,
            },
        });
        window.dispatchEvent(customEvent);
    }

    private updateHeroCoinUi(heroCoins: number) {
        const customEvent = new CustomEvent('hero-coin', {
            detail: {
                heroCoins,
            },
        });
        window.dispatchEvent(customEvent);
    }

    private getEnemySpecies(enemyType: string) {
        if (enemyType.includes('slime')) {
            return 'slime';
        }
        return 'slime';
    }

    private getEnemyColor(enemyType: string) {
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

    private getEnemyAttackSpeed(enemyType: string) {
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

    private spawnItem(position: { x: number; y: number }) {
        const isDebugMode = this.physics.config.debug;
        const itemChance = randomInt(1, isDebugMode ? 2 : 5);
        if (itemChance === 1) {
            const itemType = randomInt(1, 2);

            if (itemType === 1) {
                const item = this.physics.add
                    .sprite(position.x, position.y, 'heart')
                    .setDepth(1)
                    .setOrigin(0, 0);
                (item as any).itemType = 'heart';
                this.itemsSprites.add(item);
                item.anims.play('heart_idle');
            } else if (itemType === 2) {
                const item = this.physics.add
                    .sprite(position.x, position.y, 'coin')
                    .setDepth(1)
                    .setOrigin(0, 0);
                (item as any).itemType = 'coin';
                this.itemsSprites.add(item);
                item.anims.play('coin_idle');
            }
        }
    }

    private calculatePushTilePosition() {
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

    init(data: any) {
        this.initData = data;
        this.heroStatus = { ...this.heroStatus, ...data.heroStatus };
    }

    create() {
        console.log('CompleteGameScene: 创建场景');
        
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
        } = heroStatus || {};

        camera.fadeIn(SCENE_FADE_TIME);

        // 初始化游戏系统
        this.initializeGameSystems();

        // 设置输入控制
        this.setupInput();

        // Map
        const map = this.make.tilemap({ key: mapKey || 'map_main' });
        map.addTilesetImage('tileset', 'tileset');

        if (isDebugMode) {
            (window as any).phaserGame = game;
            this.map = map;
        }

        // Hero
        this.heroSprite = this.physics.add
            .sprite(0, 0, 'hero', initialFrame || 'hero_idle_down_01')
            .setDepth(1);
        this.heroSprite.health = heroHealth || this.heroStatus.health;
        this.heroSprite.maxHealth = heroMaxHealth || this.heroStatus.maxHealth;
        this.heroSprite.coin = heroCoin || this.heroStatus.coin;
        this.heroSprite.canPush = heroCanPush || this.heroStatus.canPush;
        this.heroSprite.haveSword = heroHaveSword || this.heroStatus.haveSword;
        this.updateHeroHealthUi(this.calculateHeroHealthStates());
        this.updateHeroCoinUi(this.heroSprite.coin);

        this.heroSprite.restoreHealth = (restore: number) => {
            this.heroSprite.health = Math.min(this.heroSprite.health + restore, this.heroSprite.maxHealth);
            this.updateHeroHealthUi(this.calculateHeroHealthStates());
        };

        this.heroSprite.increaseMaxHealth = (increase: number) => {
            this.heroSprite.maxHealth += increase;
            this.updateHeroHealthUi(this.calculateHeroHealthStates());
        };

        this.heroSprite.collectCoin = (coinQuantity: number) => {
            this.heroSprite.coin = Math.min(this.heroSprite.coin + coinQuantity, 999);
            this.updateHeroCoinUi(this.heroSprite.coin);
            this.statsManager.recordCoinCollected(coinQuantity);
        };

        this.heroSprite.takeDamage = (damage: number) => {
            this.time.delayedCall(
                180,
                () => {
                    this.heroSprite.health -= damage;
                    if (this.heroSprite.health <= 0) {
                        camera.fadeOut(SCENE_FADE_TIME);
                        this.updateHeroHealthUi([]);
                        this.updateHeroCoinUi(null);
                        this.statsManager.endGame();
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
                            ease: Phaser.Math.Easing.Elastic.InOut,
                            duration: 70,
                            repeat: 1,
                            yoyo: true,
                        });
                        this.statsManager.recordDamageTaken(damage);
                    }
                }
            );
        };

        (this.heroSprite.body as Phaser.Physics.Arcade.Body).setSize(14, 14);
        (this.heroSprite.body as Phaser.Physics.Arcade.Body).setOffset(9, 13);

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

        // Items
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

        // 创建地图图层和元素
        const enemiesData: any[] = [];
        const elementsLayers = this.add.group();
        
        for (let i = 0; i < map.layers.length; i++) {
            const layer = map.createLayer(i, 'tileset', 0, 0);
            layer.layer.properties.forEach((property: any) => {
                const { value, name } = property;

                if (name === 'type' && value === 'elements') {
                    elementsLayers.add(layer);
                }
            });

            this.physics.add.collider(this.heroSprite, layer);
        }

        // 设置GridEngine
        this.setupGridEngine();

        // 创建敌人和NPC
        this.createEnemies();
        this.createNPCs();

        // 设置碰撞检测
        this.setupCollisions(elementsLayers);

        // 设置相机
        this.setupCamera();

        // 加载地图交互数据
        this.mapInteractionManager.loadMapInteractions(mapKey || 'map_main');

        // 优化GridEngine性能
        this.optimizeGridEngine();

        // 启用调试模式（如果启用）
        this.enableGridEngineDebug();

        // 同步角色位置
        this.syncCharacterPositions();

        // 播放背景音乐
        this.soundManager.playBackgroundMusic('village');
    }

    private initializeGameSystems() {
        this.soundManager = SoundManager.getInstance();
        this.mapManager = MapManager.getInstance();
        this.mapInteractionManager = MapInteractionManager.getInstance();
        this.inventorySystem = InventorySystem.getInstance();
        this.questSystem = QuestSystem.getInstance();
        this.combatSystem = CombatSystem.getInstance();
        this.gameDataManager = GameDataManager.getInstance();
        this.statsManager = GameStatsManager.getInstance();
        this.performanceManager = PerformanceManager.getInstance();

        // 初始化系统
        this.soundManager.initialize(this);
        this.mapManager.initialize(this);
        this.mapInteractionManager.initialize(this);
        this.performanceManager.initialize(this);
        
        // 设置地图交互回调
        this.mapInteractionManager.setOnInteractionCallback((interaction) => {
            this.onMapInteraction(interaction);
        });
        
        this.mapInteractionManager.setOnEventTriggeredCallback((event) => {
            this.onMapEventTriggered(event);
        });
        
        // 开始游戏统计
        this.statsManager.startGame();
    }

    private setupInput() {
        this.enterKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ENTER);
        this.spaceKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
        this.cursors = this.input.keyboard.createCursorKeys();
        this.wasd = this.input.keyboard.addKeys({
            up: Phaser.Input.Keyboard.KeyCodes.W,
            down: Phaser.Input.Keyboard.KeyCodes.S,
            left: Phaser.Input.Keyboard.KeyCodes.A,
            right: Phaser.Input.Keyboard.KeyCodes.D,
        }) as Phaser.Types.Input.Keyboard.Key[];
    }

    private createMap() {
        const currentMap = this.mapManager.getCurrentMap();
        if (!currentMap) return;

        this.map = this.make.tilemap({ key: currentMap.tilemapKey });
        this.map.addTilesetImage('tileset', 'tileset');

        // 创建图层
        for (let i = 0; i < this.map.layers.length; i++) {
            const layer = this.map.createLayer(i, 'tileset', 0, 0);
            this.physics.add.collider(this.heroSprite, layer);
        }
    }

    private createHero() {
        const currentMap = this.mapManager.getCurrentMap();
        if (!currentMap) return;

        // 创建英雄精灵
        this.heroSprite = this.physics.add
            .sprite(0, 0, 'hero', 'hero_idle_down_01')
            .setDepth(1);

        // 设置英雄属性
        this.heroSprite.health = this.heroStatus.health;
        this.heroSprite.maxHealth = this.heroStatus.maxHealth;
        this.heroSprite.coin = this.heroStatus.coin;
        this.heroSprite.canPush = this.heroStatus.canPush;
        this.heroSprite.haveSword = this.heroStatus.haveSword;

        // 设置碰撞体
        (this.heroSprite.body as Phaser.Physics.Arcade.Body).setSize(14, 14);
        (this.heroSprite.body as Phaser.Physics.Arcade.Body).setOffset(9, 13);

        // 创建交互碰撞器
        this.heroActionCollider = createInteractiveGameObject(
            this,
            this.heroSprite.x + 9,
            this.heroSprite.y + 36,
            14,
            8,
            'attack'
        );

        this.heroPresenceCollider = createInteractiveGameObject(
            this,
            this.heroSprite.x + 16,
            this.heroSprite.y + 20,
            320,
            320,
            'presence',
            false,
            { x: 0.5, y: 0.5 }
        );

        this.heroObjectCollider = createInteractiveGameObject(
            this,
            this.heroSprite.x + 16,
            this.heroSprite.y + 20,
            24,
            24,
            'object',
            false,
            { x: 0.5, y: 0.5 }
        );

        // 添加英雄方法
        this.addHeroMethods();

        // 创建动画
        this.createHeroAnimations();
    }

    private addHeroMethods() {
        // 恢复生命值
        (this.heroSprite as any).restoreHealth = (restore: number) => {
            this.heroSprite.health = Math.min(this.heroSprite.health + restore, this.heroSprite.maxHealth);
            this.updateHeroHealthUI();
        };

        // 增加最大生命值
        (this.heroSprite as any).increaseMaxHealth = (increase: number) => {
            this.heroSprite.maxHealth += increase;
            this.updateHeroHealthUI();
        };

        // 收集金币
        (this.heroSprite as any).collectCoin = (coinQuantity: number) => {
            this.heroSprite.coin = Math.min(this.heroSprite.coin + coinQuantity, 999);
            this.updateHeroCoinUI();
            this.soundManager.playSoundEffect('pickup');
            this.statsManager.itemCollected('coin');
        };

        // 受到伤害
        (this.heroSprite as any).takeDamage = (damage: number) => {
            this.time.delayedCall(180, () => {
                this.heroSprite.health -= damage;
                this.statsManager.damageTaken(damage);
                if (this.heroSprite.health <= 0) {
                    this.cameras.main.fadeOut(SCENE_FADE_TIME);
                    this.updateHeroHealthUI();
                    this.updateHeroCoinUI();
                    this.time.delayedCall(SCENE_FADE_TIME, () => {
                        this.isTeleporting = false;
                        this.scene.start('GameOverScene');
                    });
                } else {
                    this.updateHeroHealthUI();
                    this.tweens.add({
                        targets: this.heroSprite,
                        alpha: 0,
                        ease: Phaser.Math.Easing.Elastic.InOut,
                        duration: 70,
                        repeat: 1,
                        yoyo: true,
                    });
                }
            });
        };
    }

    private createHeroAnimations() {
        // 行走动画
        this.createPlayerWalkingAnimation('hero', 'walking_up');
        this.createPlayerWalkingAnimation('hero', 'walking_right');
        this.createPlayerWalkingAnimation('hero', 'walking_down');
        this.createPlayerWalkingAnimation('hero', 'walking_left');

        // 攻击动画
        this.createPlayerAttackAnimation('hero', 'attack_up');
        this.createPlayerAttackAnimation('hero', 'attack_right');
        this.createPlayerAttackAnimation('hero', 'attack_down');
        this.createPlayerAttackAnimation('hero', 'attack_left');

        // 动画完成事件
        this.heroSprite.on('animationcomplete', (animation: Phaser.Animations.Animation) => {
            if (animation.key.includes('attack')) {
                this.isAttacking = false;
            }
        });
    }

    private createPlayerWalkingAnimation(assetKey: string, animationName: string) {
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

    private createPlayerAttackAnimation(assetKey: string, animationName: string) {
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

    private createItems() {
        this.itemsSprites = this.add.group();

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

        // 从地图数据创建物品
        const itemSpawns = this.mapManager.getItemSpawns();
        itemSpawns.forEach((itemSpawn) => {
            if (Math.random() <= itemSpawn.chance) {
                this.createItem(itemSpawn);
            }
        });
    }

    private createItem(itemSpawn: any) {
        const item = this.physics.add
            .sprite(itemSpawn.x * 16, itemSpawn.y * 16, itemSpawn.itemType)
            .setDepth(1)
            .setOrigin(0, 1);

        (item as any).itemType = itemSpawn.itemType;
        this.itemsSprites.add(item);

        // 播放动画
        if (itemSpawn.itemType === 'heart') {
            item.anims.play('heart_idle');
        } else if (itemSpawn.itemType === 'coin') {
            item.anims.play('coin_idle');
        }
    }

    private createEnemies() {
        this.enemiesSprites = this.add.group();

        // 从地图数据创建敌人
        const enemySpawns = this.mapManager.getEnemySpawns();
        enemySpawns.forEach((enemySpawn, index) => {
            this.createEnemy(enemySpawn, index);
        });
    }

    private createEnemy(enemySpawn: any, index: number) {
        const enemy = this.physics.add.sprite(0, 0, 'slime', 'slime_idle_01');
        enemy.setTint(this.getEnemyColor(enemySpawn.enemyType));
        enemy.name = `${enemySpawn.enemyType}_${index}`;
        (enemy as any).enemyType = enemySpawn.enemyType;
        (enemy as any).enemySpecies = 'slime';
        (enemy as any).enemyAI = ENEMY_AI_TYPE;
        (enemy as any).speed = enemySpawn.level;
        enemy.health = enemySpawn.level * 10;
        (enemy as any).isAttacking = false;
        (enemy as any).canSeeHero = false;
        (enemy as any).isFollowingHero = false;
        (enemy as any).updateFollowHeroPosition = true;
        (enemy as any).lastKnowHeroPosition = { x: 0, y: 0 };

        // 设置碰撞体
        (enemy.body as Phaser.Physics.Arcade.Body).setSize(14, 14);
        (enemy.body as Phaser.Physics.Arcade.Body).setOffset(9, 21);

        this.enemiesSprites.add(enemy);

        // 添加敌人方法
        (enemy as any).takeDamage = (damage: number, isSpaceJustDown: boolean) => {
            if (isSpaceJustDown) {
                enemy.health -= damage;

                if (enemy.health < 0) {
                    this.statsManager.enemyDefeated(damage);
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
                        ease: Phaser.Math.Easing.Elastic.InOut,
                        duration: 70,
                        repeat: 1,
                        yoyo: true,
                    });
                }
            }
        };

        // 创建敌人动画
        this.createEnemyAnimations(enemySpawn.enemyType);
    }

    private createEnemyAnimations(enemyType: string) {
        const enemySpecies = 'slime';

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
    }

    private createNPCs() {
        this.npcSprites = this.add.group();

        // 从地图数据创建NPC
        const npcSpawns = this.mapManager.getNPCSpawns();
        npcSpawns.forEach((npcSpawn) => {
            this.createNPC(npcSpawn);
        });
    }

    private createNPC(npcSpawn: any) {
        const npc = this.physics.add.sprite(0, 0, npcSpawn.npcType, `${npcSpawn.npcType}_idle_${npcSpawn.facingDirection}_01`);
        (npc.body as Phaser.Physics.Arcade.Body).setSize(14, 14);
        (npc.body as Phaser.Physics.Arcade.Body).setOffset(9, 13);
        this.npcSprites.add(npc);

        // 创建NPC动画
        this.createPlayerWalkingAnimation(npcSpawn.npcType, 'walking_up');
        this.createPlayerWalkingAnimation(npcSpawn.npcType, 'walking_right');
        this.createPlayerWalkingAnimation(npcSpawn.npcType, 'walking_down');
        this.createPlayerWalkingAnimation(npcSpawn.npcType, 'walking_left');
    }

    private setupCollisions(elementsLayers?: Phaser.GameObjects.Group) {
        // 英雄与物品碰撞
        this.physics.add.overlap(this.heroSprite, this.itemsSprites, (objA, objB) => {
            const item = [objA, objB].find((obj) => obj !== this.heroSprite);

            if ((item as any).itemType === 'heart') {
                (this.heroSprite as any).restoreHealth(20);
                this.statsManager.itemCollected('heart');
                item.setVisible(false);
                item.destroy();
            }

            if ((item as any).itemType === 'coin') {
                (this.heroSprite as any).collectCoin(1);
                item.setVisible(false);
                item.destroy();
            }

            if ((item as any).itemType === 'heart_container') {
                (this.heroSprite as any).increaseMaxHealth(20);
                item.setVisible(false);
                item.destroy();
            }

            if ((item as any).itemType === 'sword') {
                this.showDialog((item as any).itemType);
                (this.heroSprite as any).haveSword = true;
                item.setVisible(false);
                item.destroy();
            }

            if ((item as any).itemType === 'push') {
                this.showDialog((item as any).itemType);
                (this.heroSprite as any).canPush = true;
                item.setVisible(false);
                item.destroy();
            }
        });

        // 英雄与敌人碰撞
        this.physics.add.overlap(this.heroObjectCollider, this.enemiesSprites, (objA, objB) => {
            const enemy = [objA, objB].find((obj) => obj !== this.heroObjectCollider);
            if ((enemy as any).isAttacking || this.gridEngine.isMoving(enemy.name)) {
                return;
            }

            enemy.anims.play(`slime_attack`);
            (this.heroSprite as any).takeDamage(10);
            (enemy as any).isAttacking = true;
            this.time.delayedCall(this.getEnemyAttackSpeed((enemy as any).enemyType), () => {
                (enemy as any).isAttacking = false;
            });
        });

        // 英雄攻击碰撞
        this.physics.add.overlap(this.heroActionCollider, this.enemiesSprites, (objA, objB) => {
            const enemy = [objA, objB].find((obj) => obj !== this.heroActionCollider);

            if (this.isAttacking) {
                const isSpaceJustDown = this.isSpaceJustDown;
                this.time.delayedCall(ATTACK_DELAY_TIME, () => {
                    (enemy as any).takeDamage(25, isSpaceJustDown);
                });
            }
        });

        // 英雄与NPC碰撞
        this.physics.add.overlap(this.heroActionCollider, this.npcSprites, (objA, objB) => {
            if (this.isShowingDialog) {
                return;
            }

            const npc = [objA, objB].find((obj) => obj !== this.heroActionCollider);

            if (Phaser.Input.Keyboard.JustDown(this.enterKey)) {
                if (this.gridEngine.isMoving(npc.texture.key)) {
                    return;
                }

                this.showDialog(npc.texture.key);
                this.gridEngine.stopMovement(npc.texture.key);
            }
        });

        // 英雄与地图元素碰撞 - 移植自原项目
        if (elementsLayers) {
            this.physics.add.overlap(this.heroActionCollider, elementsLayers, (objA, objB) => {
                const tile = [objA, objB].find((obj) => obj !== this.heroActionCollider);

                // 处理攻击
                if (tile?.index > 0 && !(tile as any).wasHandled) {
                    switch (tile.index) {
                        case BUSH_INDEX: {
                            if (this.isAttacking) {
                                (tile as any).wasHandled = true;

                                this.time.delayedCall(
                                    ATTACK_DELAY_TIME,
                                    () => {
                                        tile.setVisible(false);
                                        this.spawnItem({
                                            x: (tile as any).pixelX,
                                            y: (tile as any).pixelY,
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
                                const canBePushed = this.map.layers.every((layer: any) => {
                                    const t = layer.tilemapLayer.getTileAtWorldXY(
                                        newPosition.x,
                                        newPosition.y
                                    );

                                    return !t?.properties?.ge_collide;
                                });

                                if (canBePushed && !(tile as any).isMoved) {
                                    (tile as any).isMoved = true;
                                    this.tweens.add({
                                        targets: tile,
                                        pixelX: newPosition.x,
                                        pixelY: newPosition.y,
                                        ease: 'Power2',
                                        duration: 700,
                                        onComplete: () => {
                                            tile.setVisible(false);
                                            const newTile = (tile as any).layer.tilemapLayer.putTileAt(
                                                BOX_INDEX,
                                                newPosition.x / 16,
                                                newPosition.y / 16,
                                                true
                                            );

                                            newTile.properties = {
                                                ...(tile as any).properties,
                                            };
                                            (newTile as any).isMoved = true;
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
        }
    }

    private setupCamera() {
        const camera = this.cameras.main;
        camera.startFollow(this.heroSprite, true);
        camera.setFollowOffset(-this.heroSprite.width, -this.heroSprite.height);
        camera.setBounds(0, 0, this.map.widthInPixels, this.map.heightInPixels);
    }

    private setupGridEngine() {
        const currentMap = this.mapManager.getCurrentMap();
        if (!currentMap) return;

        // 创建GridEngine配置
        const gridEngineConfig = {
            characters: [
                {
                    id: 'hero',
                    sprite: this.heroSprite,
                    startPosition: currentMap.spawnPoint || { x: 10, y: 10 },
                    offsetY: 4,
                    speed: GAME_BALANCE.HERO.MOVE_SPEED,
                    walkingAnimationMapping: {
                        up: 'hero_walking_up',
                        down: 'hero_walking_down',
                        left: 'hero_walking_left',
                        right: 'hero_walking_right',
                    },
                    idleFrameMapping: {
                        up: 'hero_idle_up_01',
                        down: 'hero_idle_down_01',
                        left: 'hero_idle_left_01',
                        right: 'hero_idle_right_01',
                    },
                },
            ],
        };

        // 添加敌人到GridEngine
        this.enemiesSprites.getChildren().forEach((enemy: any) => {
            const enemyConfig = {
                id: enemy.name,
                sprite: enemy,
                startPosition: { x: Math.floor(enemy.x / 16), y: Math.floor(enemy.y / 16) },
                speed: (enemy as any).speed || GAME_BALANCE.ENEMY.SLIME.MOVE_SPEED,
                offsetY: -4,
                walkingAnimationMapping: {
                    up: 'slime_walking',
                    down: 'slime_walking',
                    left: 'slime_walking',
                    right: 'slime_walking',
                },
                idleFrameMapping: {
                    up: 'slime_idle',
                    down: 'slime_idle',
                    left: 'slime_idle',
                    right: 'slime_idle',
                },
                // 敌人AI配置
                ai: {
                    type: ENEMY_AI_TYPE,
                    followDistance: 5,
                    attackDistance: 1,
                    patrolRadius: 3,
                    idleTime: 2000,
                },
            };
            gridEngineConfig.characters.push(enemyConfig);
        });

        // 添加NPC到GridEngine
        this.npcSprites.getChildren().forEach((npc: any) => {
            const npcConfig = {
                id: npc.texture.key,
                sprite: npc,
                startPosition: { x: Math.floor(npc.x / 16), y: Math.floor(npc.y / 16) },
                speed: ANIMATION_CONFIG.NPC_WALK_SPEED,
                offsetY: 4,
                walkingAnimationMapping: {
                    up: `${npc.texture.key}_walking_up`,
                    down: `${npc.texture.key}_walking_down`,
                    left: `${npc.texture.key}_walking_left`,
                    right: `${npc.texture.key}_walking_right`,
                },
                idleFrameMapping: {
                    up: `${npc.texture.key}_idle_up_01`,
                    down: `${npc.texture.key}_idle_down_01`,
                    left: `${npc.texture.key}_idle_left_01`,
                    right: `${npc.texture.key}_idle_right_01`,
                },
                // NPC行为配置
                behavior: {
                    movementType: NPC_MOVEMENT_RANDOM,
                    movementDelay: 3000,
                    movementArea: 2,
                    canInteract: true,
                },
            };
            gridEngineConfig.characters.push(npcConfig);
        });

        // 创建GridEngine
        this.gridEngine.create(this.map, gridEngineConfig);

        // 设置移动事件
        this.setupGridEngineEvents();

        // 初始化AI系统
        this.initializeAISystem();

        // 设置路径寻找
        this.setupPathfinding();
    }

    private setupGridEngineEvents() {
        // 移动开始事件
        this.gridEngine.movementStarted().subscribe(({ charId, direction }: any) => {
            this.handleMovementStarted(charId, direction);
        });

        // 移动停止事件
        this.gridEngine.movementStopped().subscribe(({ charId, direction }: any) => {
            this.handleMovementStopped(charId, direction);
        });

        // 方向改变事件
        this.gridEngine.directionChanged().subscribe(({ charId, direction }: any) => {
            this.handleDirectionChanged(charId, direction);
        });

        // 位置改变事件
        this.gridEngine.positionChanged().subscribe(({ charId, position }: any) => {
            this.handlePositionChanged(charId, position);
        });

        // 移动完成事件
        this.gridEngine.movementFinished().subscribe(({ charId }: any) => {
            this.handleMovementFinished(charId);
        });
    }

    private handleMovementStarted(charId: string, direction: string) {
        if (charId === 'hero') {
            this.heroSprite.anims.play(`hero_walking_${direction}`);
            this.soundManager.playSoundEffect('footstep');
        } else {
            const npc = this.npcSprites.getChildren().find((npcSprite: any) => npcSprite.texture.key === charId);
            if (npc) {
                npc.anims.play(`${charId}_walking_${direction}`);
                return;
            }

            const enemy = this.enemiesSprites.getChildren().find((enemySprite: any) => enemySprite.name === charId);
            if (enemy) {
                enemy.anims.play(`slime_walking`);
            }
        }
    }

    private handleMovementStopped(charId: string, direction: string) {
        if (charId === 'hero') {
            this.heroSprite.anims.stop();
            this.heroSprite.setFrame(this.getStopFrame(direction, charId));
        } else {
            const npc = this.npcSprites.getChildren().find((npcSprite: any) => npcSprite.texture.key === charId);
            if (npc) {
                npc.anims.stop();
                npc.setFrame(this.getStopFrame(direction, charId));
                return;
            }

            const enemy = this.enemiesSprites.getChildren().find((enemySprite: any) => enemySprite.name === charId);
            if (enemy) {
                enemy.anims.play(`slime_idle`, true);
            }
        }
    }

    private handleDirectionChanged(charId: string, direction: string) {
        if (charId === 'hero') {
            this.heroSprite.setFrame(this.getStopFrame(direction, charId));
        } else {
            const npc = this.npcSprites.getChildren().find((npcSprite: any) => npcSprite.texture.key === charId);
            if (npc) {
                npc.setFrame(this.getStopFrame(direction, charId));
                return;
            }

            const enemy = this.enemiesSprites.getChildren().find((enemySprite: any) => enemySprite.name === charId);
            if (enemy) {
                enemy.setFrame(`slime_idle`);
            }
        }
    }

    private handlePositionChanged(charId: string, position: { x: number; y: number }) {
        // 更新碰撞器位置
        if (charId === 'hero') {
            this.updateColliders();
        }

        // 检查传送点
        this.checkTeleportPoints(charId, position);

        // 检查交互点
        this.checkInteractionPoints(charId, position);
    }

    private handleMovementFinished(charId: string) {
        // 移动完成后的处理
        if (charId === 'hero') {
            // 英雄移动完成后的逻辑
            this.onHeroMovementFinished();
        } else {
            // NPC或敌人移动完成后的逻辑
            this.onCharacterMovementFinished(charId);
        }
    }

    // AI系统
    private initializeAISystem() {
        // 初始化敌人AI
        this.enemiesSprites.getChildren().forEach((enemy: any) => {
            this.initializeEnemyAI(enemy);
        });

        // 初始化NPC AI
        this.npcSprites.getChildren().forEach((npc: any) => {
            this.initializeNPCAI(npc);
        });

        // 启动AI更新循环
        this.time.addEvent({
            delay: 1000,
            callback: this.updateAI,
            callbackScope: this,
            loop: true,
        });
    }

    private initializeEnemyAI(enemy: any) {
        enemy.aiState = {
            type: 'patrol',
            lastActionTime: 0,
            patrolRadius: 3,
            followDistance: 5,
            attackDistance: 1,
            idleTime: 2000,
            lastPosition: { x: enemy.x, y: enemy.y },
        };

        // 开始巡逻
        this.startEnemyPatrol(enemy);
    }

    private initializeNPCAI(npc: any) {
        npc.aiState = {
            type: 'idle',
            lastActionTime: 0,
            movementDelay: 3000,
            movementArea: 2,
            canInteract: true,
            lastPosition: { x: npc.x, y: npc.y },
        };

        // 开始NPC行为
        this.startNPCBehavior(npc);
    }

    private updateAI() {
        const currentTime = this.time.now;

        // 更新敌人AI
        this.enemiesSprites.getChildren().forEach((enemy: any) => {
            this.updateEnemyAI(enemy, currentTime);
        });

        // 更新NPC AI
        this.npcSprites.getChildren().forEach((npc: any) => {
            this.updateNPCAI(npc, currentTime);
        });
    }

    private updateEnemyAI(enemy: any, currentTime: number) {
        const heroPosition = this.gridEngine.getPosition('hero');
        const enemyPosition = this.gridEngine.getPosition(enemy.name);
        const distance = calculateDistance(
            heroPosition.x,
            heroPosition.y,
            enemyPosition.x,
            enemyPosition.y
        );

        // 检查是否应该跟随英雄
        if (distance <= enemy.aiState.followDistance && !enemy.aiState.isFollowing) {
            enemy.aiState.isFollowing = true;
            enemy.aiState.type = 'follow';
            this.gridEngine.setSpeed(enemy.name, enemy.aiState.followSpeed || 2);
        } else if (distance > enemy.aiState.followDistance && enemy.aiState.isFollowing) {
            enemy.aiState.isFollowing = false;
            enemy.aiState.type = 'patrol';
            this.gridEngine.setSpeed(enemy.name, enemy.aiState.patrolSpeed || 1);
            this.startEnemyPatrol(enemy);
        }

        // 根据AI状态执行相应行为
        switch (enemy.aiState.type) {
            case 'patrol':
                this.updateEnemyPatrol(enemy, currentTime);
                break;
            case 'follow':
                this.updateEnemyFollow(enemy, heroPosition);
                break;
            case 'attack':
                this.updateEnemyAttack(enemy, currentTime);
                break;
        }
    }

    private updateNPCAI(npc: any, currentTime: number) {
        if (currentTime - npc.aiState.lastActionTime > npc.aiState.movementDelay) {
            this.updateNPCBehavior(npc);
            npc.aiState.lastActionTime = currentTime;
        }
    }

    private startEnemyPatrol(enemy: any) {
        if (enemy.aiState.type === 'patrol') {
            this.gridEngine.moveRandomly(enemy.name, 2000, enemy.aiState.patrolRadius);
        }
    }

    private updateEnemyPatrol(enemy: any, currentTime: number) {
        if (!this.gridEngine.isMoving(enemy.name) && 
            currentTime - enemy.aiState.lastActionTime > enemy.aiState.idleTime) {
            this.startEnemyPatrol(enemy);
            enemy.aiState.lastActionTime = currentTime;
        }
    }

    private updateEnemyFollow(enemy: any, heroPosition: { x: number; y: number }) {
        if (!this.gridEngine.isMoving(enemy.name)) {
            const enemyPosition = this.gridEngine.getPosition(enemy.name);
            const path = this.gridEngine.findShortestPath(enemy.name, heroPosition);
            
            if (path && path.length > 0) {
                this.gridEngine.move(enemy.name, path[0]);
            }
        }
    }

    private updateEnemyAttack(enemy: any, currentTime: number) {
        // 攻击逻辑
        if (currentTime - enemy.aiState.lastActionTime > enemy.aiState.attackCooldown) {
            // 执行攻击
            enemy.anims.play('slime_attack');
            enemy.aiState.lastActionTime = currentTime;
        }
    }

    private startNPCBehavior(npc: any) {
        if (npc.aiState.type === 'idle') {
            this.gridEngine.moveRandomly(npc.texture.key, npc.aiState.movementDelay, npc.aiState.movementArea);
        }
    }

    private updateNPCBehavior(npc: any) {
        if (npc.aiState.type === 'idle' && !this.gridEngine.isMoving(npc.texture.key)) {
            this.startNPCBehavior(npc);
        }
    }

    // 路径寻找系统
    private setupPathfinding() {
        // 设置路径寻找配置
        this.gridEngine.setPathfindingConfig({
            algorithm: 'A*',
            diagonalMovement: false,
            costFunction: (from: any, to: any) => {
                // 基础移动成本
                let cost = 1;

                // 检查目标位置是否有障碍物
                const tile = this.map.getTileAt(to.x, to.y);
                if (tile && tile.properties?.ge_collide) {
                    cost = Infinity; // 不可通过
                }

                // 检查是否有敌人
                const enemiesAtPosition = this.enemiesSprites.getChildren().filter((enemy: any) => {
                    const enemyPos = this.gridEngine.getPosition(enemy.name);
                    return enemyPos.x === to.x && enemyPos.y === to.y;
                });

                if (enemiesAtPosition.length > 0) {
                    cost += 10; // 增加通过敌人的成本
                }

                return cost;
            },
        });
    }

    // 位置检查方法
    private checkTeleportPoints(charId: string, position: { x: number; y: number }) {
        if (charId !== 'hero') return;

        // 检查当前位置是否有传送点
        const teleportLayer = this.map.getLayer('teleports');
        if (teleportLayer) {
            const tile = teleportLayer.getTileAt(position.x, position.y);
            if (tile && tile.properties?.teleportData) {
                this.handleTeleport(tile.properties.teleportData);
            }
        }
    }

    private checkInteractionPoints(charId: string, position: { x: number; y: number }) {
        if (charId !== 'hero') return;

        // 检查交互点
        const interactionLayer = this.map.getLayer('interactions');
        if (interactionLayer) {
            const tile = interactionLayer.getTileAt(position.x, position.y);
            if (tile && tile.properties?.interactionType) {
                this.handleInteraction(tile.properties.interactionType, tile.properties.interactionData);
            }
        }
    }

    private handleTeleport(teleportData: string) {
        if (this.isTeleporting) return;

        this.isTeleporting = true;
        const data = this.extractTeleportDataFromTiled(teleportData);

        // 淡出效果
        this.cameras.main.fadeOut(SCENE_FADE_TIME);
        
        this.time.delayedCall(SCENE_FADE_TIME, () => {
            // 切换到新地图
            this.scene.start('CompleteGameScene', {
                mapKey: data.mapKey,
                heroStatus: {
                    position: { x: data.x, y: data.y },
                    health: this.heroSprite.health,
                    maxHealth: this.heroSprite.maxHealth,
                    coin: this.heroSprite.coin,
                    canPush: this.heroSprite.canPush,
                    haveSword: this.heroSprite.haveSword,
                },
            });
        });
    }

    private handleInteraction(interactionType: string, interactionData: any) {
        switch (interactionType) {
            case 'dialog':
                this.showDialog(interactionData.characterName);
                break;
            case 'item':
                this.collectItem(interactionData.itemType);
                break;
            case 'trigger':
                this.triggerEvent(interactionData.eventName);
                break;
        }
    }

    // 移动完成回调
    private onHeroMovementFinished() {
        // 英雄移动完成后的逻辑
        this.statsManager.recordMovement();
    }

    private onCharacterMovementFinished(charId: string) {
        // 角色移动完成后的逻辑
        const npc = this.npcSprites.getChildren().find((npcSprite: any) => npcSprite.texture.key === charId);
        if (npc) {
            // NPC移动完成
            this.onNPCMovementFinished(npc);
        }

        const enemy = this.enemiesSprites.getChildren().find((enemySprite: any) => enemySprite.name === charId);
        if (enemy) {
            // 敌人移动完成
            this.onEnemyMovementFinished(enemy);
        }
    }

    private onNPCMovementFinished(npc: any) {
        // NPC移动完成后的行为
        if (npc.aiState.type === 'idle') {
            // 随机转向
            const directions = ['up', 'down', 'left', 'right'];
            const randomDirection = directions[Math.floor(Math.random() * directions.length)];
            this.gridEngine.setDirection(npc.texture.key, randomDirection);
        }
    }

    private onEnemyMovementFinished(enemy: any) {
        // 敌人移动完成后的行为
        if (enemy.aiState.type === 'patrol') {
            // 继续巡逻
            this.startEnemyPatrol(enemy);
        }
    }

    // 地图交互回调方法
    private onMapInteraction(interaction: any): void {
        // 记录交互统计
        this.statsManager.recordInteraction(interaction.type);
        
        // 播放交互音效
        if (interaction.properties?.soundEffect) {
            this.soundManager.playSoundEffect(interaction.properties.soundEffect);
        }
        
        // 显示交互反馈
        this.showInteractionFeedback(interaction);
    }

    private onMapEventTriggered(event: any): void {
        // 记录事件触发统计
        this.statsManager.recordEventTriggered(event.name);
        
        // 处理事件触发
        this.handleMapEventTriggered(event);
    }

    private showInteractionFeedback(interaction: any): void {
        // 显示交互反馈效果
        if (interaction.properties?.particleEffect) {
            // 创建粒子效果
            this.createInteractionParticleEffect(interaction);
        }
        
        // 显示交互消息
        if (interaction.properties?.message) {
            this.showMessage(interaction.properties.message);
        }
    }

    private handleMapEventTriggered(event: any): void {
        // 处理地图事件触发
        switch (event.type) {
            case 'trigger':
                this.handleTriggerEvent(event);
                break;
            case 'condition':
                this.handleConditionEvent(event);
                break;
            case 'sequence':
                this.handleSequenceEvent(event);
                break;
        }
    }

    private handleTriggerEvent(event: any): void {
        // 处理触发事件
        console.log(`触发事件: ${event.name}`);
    }

    private handleConditionEvent(event: any): void {
        // 处理条件事件
        console.log(`条件事件: ${event.name}`);
    }

    private handleSequenceEvent(event: any): void {
        // 处理序列事件
        console.log(`序列事件: ${event.name}`);
    }

    private createInteractionParticleEffect(interaction: any): void {
        // 创建交互粒子效果
        if (!this.scene) return;
        
        // 这里可以添加粒子效果创建逻辑
    }

    private showMessage(message: string): void {
        // 显示消息
        const customEvent = new CustomEvent('show-message', {
            detail: { message },
        });
        window.dispatchEvent(customEvent);
    }

    // GridEngine辅助方法
    private collectItem(itemType: string) {
        switch (itemType) {
            case 'heart':
                (this.heroSprite as any).restoreHealth(20);
                this.statsManager.itemCollected('heart');
                break;
            case 'coin':
                (this.heroSprite as any).collectCoin(1);
                break;
            case 'sword':
                (this.heroSprite as any).haveSword = true;
                this.showDialog('sword');
                break;
            case 'push':
                (this.heroSprite as any).canPush = true;
                this.showDialog('push');
                break;
        }
    }

    private triggerEvent(eventName: string) {
        // 触发游戏事件
        const customEvent = new CustomEvent('game-event', {
            detail: { eventName, data: {} },
        });
        window.dispatchEvent(customEvent);
    }

    // 多角色同步方法
    private syncCharacterPositions() {
        // 同步所有角色位置到GridEngine
        this.enemiesSprites.getChildren().forEach((enemy: any) => {
            const position = this.gridEngine.getPosition(enemy.name);
            enemy.setPosition(position.x * 16, position.y * 16);
        });

        this.npcSprites.getChildren().forEach((npc: any) => {
            const position = this.gridEngine.getPosition(npc.texture.key);
            npc.setPosition(position.x * 16, position.y * 16);
        });
    }

    // 性能优化方法
    private optimizeGridEngine() {
        // 设置GridEngine性能选项
        this.gridEngine.setPerformanceConfig({
            maxPathfindingDistance: 20,
            pathfindingCacheSize: 100,
            movementBatchSize: 5,
            updateFrequency: 60,
        });

        // 启用空间分区
        this.gridEngine.enableSpatialPartitioning({
            cellSize: 32,
            maxObjectsPerCell: 10,
        });
    }

    // 调试方法
    private enableGridEngineDebug() {
        if (this.physics.config.debug) {
            this.gridEngine.enableDebugMode({
                showPaths: true,
                showCollisions: true,
                showPositions: true,
                showDirections: true,
            });
        }
    }

    private showDialog(characterName: string) {
        if (this.isShowingDialog) return;

        const customEvent = new CustomEvent('new-dialog', {
            detail: { characterName },
        });
        window.dispatchEvent(customEvent);

        this.isShowingDialog = true;
        const dialogBoxFinishedEventListener = () => {
            window.removeEventListener(`${characterName}-dialog-finished`, dialogBoxFinishedEventListener);
            this.time.delayedCall(100, () => {
                this.isShowingDialog = false;
            });
        };
        window.addEventListener(`${characterName}-dialog-finished`, dialogBoxFinishedEventListener);
    }

    private spawnItem(position: { x: number; y: number }) {
        const itemChance = Phaser.Math.Between(1, 5);
        if (itemChance === 1) {
            const itemType = Phaser.Math.Between(1, 2);

            if (itemType === 1) {
                const item = this.physics.add
                    .sprite(position.x, position.y, 'heart')
                    .setDepth(1)
                    .setOrigin(0, 0);
                (item as any).itemType = 'heart';
                this.itemsSprites.add(item);
                item.anims.play('heart_idle');
            } else if (itemType === 2) {
                const item = this.physics.add
                    .sprite(position.x, position.y, 'coin')
                    .setDepth(1)
                    .setOrigin(0, 0);
                (item as any).itemType = 'coin';
                this.itemsSprites.add(item);
                item.anims.play('coin_idle');
            }
        }
    }

    // 工具函数
    private getFramesForAnimation(assetKey: string, animation: string) {
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

    private getStopFrame(direction: string, spriteKey: string) {
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

    private getOppositeDirection(direction: string) {
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

    private getBackPosition(facingDirection: string, position: { x: number; y: number }) {
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

    private calculatePreviousTeleportPosition() {
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

    private extractTeleportDataFromTiled(data: string) {
        const [mapKey, position] = data.trim().split(':');
        const [x, y] = position.split(',');

        return {
            mapKey,
            x: Number.parseInt(x, 10),
            y: Number.parseInt(y, 10),
        };
    }

    private extractNpcDataFromTiled(data: string) {
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

    private getEnemyColor(enemyType: string) {
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

    private getEnemyAttackSpeed(enemyType: string) {
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

    private updateHeroHealthUI() {
        const healthStates = this.calculateHeroHealthStates();
        const customEvent = new CustomEvent('hero-health', {
            detail: { healthStates },
        });
        window.dispatchEvent(customEvent);
    }

    private updateHeroCoinUI() {
        const customEvent = new CustomEvent('hero-coin', {
            detail: { heroCoins: this.heroSprite.coin },
        });
        window.dispatchEvent(customEvent);
    }

    private calculateHeroHealthStates() {
        return Array.from({ length: this.heroSprite.maxHealth / 20 })
            .fill(null).map((v, index) => this.calculateHeroHealthState(
                Math.max(this.heroSprite.health - (20 * index), 0)
            ));
    }

    private calculateHeroHealthState(health: number) {
        if (health > 10) {
            return 'full';
        }
        if (health > 0) {
            return 'half';
        }
        return 'empty';
    }

    update() {
        this.isSpaceJustDown = Phaser.Input.Keyboard.JustDown(this.spaceKey);

        // 更新游戏统计
        this.statsManager.updatePlayTime();

        if (
            this.isTeleporting
            || this.isAttacking
            || this.isShowingDialog
        ) {
            return;
        }

        // 攻击逻辑
        if (
            !this.gridEngine.isMoving('hero')
            && this.isSpaceJustDown
            && (this.heroSprite as any).haveSword
        ) {
            const facingDirection = this.gridEngine.getFacingDirection('hero');
            this.heroSprite.anims.play(`hero_attack_${facingDirection}`);
            this.isAttacking = true;
            this.soundManager.playSoundEffect('attack');
            return;
        }

        // 更新敌人AI - 移植自原项目
        this.enemiesSprites.getChildren().forEach((enemy: any) => {
            enemy.canSeeHero = enemy.body.embedded;
            if (!enemy.canSeeHero && enemy.isFollowingHero) {
                enemy.isFollowingHero = false;
                this.gridEngine.setSpeed(enemy.name, enemy.speed);
                this.gridEngine.moveRandomly(enemy.name, 1000, 4);
            }
        });

        // 更新碰撞器位置
        this.updateColliders();

        // 移动逻辑
        if (this.cursors.left.isDown || this.wasd[2].isDown) {
            this.gridEngine.move('hero', 'left');
        } else if (this.cursors.right.isDown || this.wasd[3].isDown) {
            this.gridEngine.move('hero', 'right');
        } else if (this.cursors.up.isDown || this.wasd[0].isDown) {
            this.gridEngine.move('hero', 'up');
        } else if (this.cursors.down.isDown || this.wasd[1].isDown) {
            this.gridEngine.move('hero', 'down');
        }
    }

    private updateColliders() {
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
                (this.heroActionCollider.body as Phaser.Physics.Arcade.Body).setSize(14, 8);
                this.heroActionCollider.setX(this.heroSprite.x + 9);
                this.heroActionCollider.setY(this.heroSprite.y + 36);
                break;
            }
            case 'up': {
                this.heroActionCollider.setSize(14, 8);
                (this.heroActionCollider.body as Phaser.Physics.Arcade.Body).setSize(14, 8);
                this.heroActionCollider.setX(this.heroSprite.x + 9);
                this.heroActionCollider.setY(this.heroSprite.y + 12);
                break;
            }
            case 'left': {
                this.heroActionCollider.setSize(8, 14);
                (this.heroActionCollider.body as Phaser.Physics.Arcade.Body).setSize(8, 14);
                this.heroActionCollider.setX(this.heroSprite.x);
                this.heroActionCollider.setY(this.heroSprite.y + 21);
                break;
            }
            case 'right': {
                this.heroActionCollider.setSize(8, 14);
                (this.heroActionCollider.body as Phaser.Physics.Arcade.Body).setSize(8, 14);
                this.heroActionCollider.setX(this.heroSprite.x + 24);
                this.heroActionCollider.setY(this.heroSprite.y + 21);
                break;
            }
        }
    }
}
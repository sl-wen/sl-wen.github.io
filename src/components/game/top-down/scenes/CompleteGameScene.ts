import * as Phaser from 'phaser';
import {
    ATTACK_DELAY_TIME,
    BOX_INDEX,
    BUSH_INDEX,
    ENEMY_AI_TYPE,
    NPC_MOVEMENT_RANDOM,
    SCENE_FADE_TIME
} from '../constants';
import { CombatSystem } from '../systems/CombatSystem';
import { EnemyAISystem } from '../systems/EnemyAISystem';
import { EnhancedAchievementSystem } from '../systems/EnhancedAchievementSystem';
import { EnhancedCraftingSystem } from '../systems/EnhancedCraftingSystem';
import { EnhancedGameStatsSystem } from '../systems/EnhancedGameStatsSystem';
import { EnhancedInventorySystem } from '../systems/EnhancedInventorySystem';
import { EnhancedShopSystem } from '../systems/EnhancedShopSystem';
import { GameDataManager } from '../systems/GameDataManager';
import { GameStatsManager } from '../systems/GameStatsManager';
import { InventorySystem } from '../systems/InventorySystem';
import { ItemSystem } from '../systems/ItemSystem';
import { MapInteractionManager } from '../systems/MapInteractionManager';
import { MapManager } from '../systems/MapManager';
import { MobileAdapterSystem } from '../systems/MobileAdapterSystem';
import { ParticleSystem } from '../systems/ParticleSystem';
import { PerformanceManager } from '../systems/PerformanceManager';
import { QuestSystem } from '../systems/QuestSystem';
import { ScreenEffectSystem } from '../systems/ScreenEffectSystem';
import { SoundManager } from '../systems/SoundManager';
import { TeleportSystem } from '../systems/TeleportSystem';
import { TestSystem } from '../systems/TestSystem';
import { calculateDistance, createInteractiveGameObject, randomInt } from '../utils';



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
    private teleportSystem!: TeleportSystem;
    private enemyAISystem!: EnemyAISystem;
    private itemSystem!: ItemSystem;
    private enhancedInventorySystem!: EnhancedInventorySystem;
    private particleSystem!: ParticleSystem;
    private screenEffectSystem!: ScreenEffectSystem;
    private mobileAdapterSystem!: MobileAdapterSystem;
    private enhancedShopSystem!: EnhancedShopSystem;
    private enhancedCraftingSystem!: EnhancedCraftingSystem;
    private enhancedGameStatsSystem!: EnhancedGameStatsSystem;
    private enhancedAchievementSystem!: EnhancedAchievementSystem;
    private testSystem!: TestSystem;

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

    // 地图缩放和位置
    private mapScale: number = 1;
    private mapCenterX: number = 0;
    private mapCenterY: number = 0;
    private _coordinateDebugShown: boolean = false;

    // 输入控制
    private cursors!: Phaser.Types.Input.Keyboard.CursorKeys | null;
    private wasd!: Phaser.Input.Keyboard.Key[] | null;
    private spaceKey!: Phaser.Input.Keyboard.Key | null;
    private enterKey!: Phaser.Input.Keyboard.Key | null;

    // 英雄状态
    private heroStatus = {
        health: 100,
        maxHealth: 100,
        coin: 0,
        canPush: false,
        haveSword: false,
        level: 1,
        experience: 0,
        position: { x: 23, y: 30 },
        frame: 'hero_idle_down_01',
        facingDirection: 'down',
        previousPosition: { x: 23, y: 30 }
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
                if (frame.frame && typeof frame.frame === 'string' && frame.frame.includes(`${assetKey}_${animation}`)) {
                    const parts = frame.frame.split(`${assetKey}_${animation}_`);
                    return Boolean(!Number.isNaN(Number.parseInt(parts[1], 10)));
                }
                return false;
            })
            .sort((a, b) => {
                if (a.frame && b.frame) {
                    return a.frame < b.frame ? -1 : 1;
                }
                return 0;
            });
    }

    private createPlayerWalkingAnimation(assetKey: string, animationName: string) {
        const animationKey = `${assetKey}_${animationName}`;

        // 检查动画是否已存在
        if (this.anims.exists(animationKey)) {
            console.log(`动画已存在，跳过创建: ${animationKey}`);
            return;
        }

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

    private createPlayerAttackAnimation(assetKey: string, animationName: string) {
        const animationKey = `${assetKey}_${animationName}`;

        // 检查动画是否已存在
        if (this.anims.exists(animationKey)) {
            console.log(`动画已存在，跳过创建: ${animationKey}`);
            return;
        }

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
        return Array.from({ length: this.heroStatus.maxHealth / 20 })
            .fill(null).map(
                (v, index) => this.calculateHeroHealthState(
                    Math.max(this.heroStatus.health - (20 * index), 0)
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

        // 设置初始地图
        if (mapKey) {
            this.mapManager.setCurrentMap(mapKey);
        }

        // 设置输入控制
        this.setupInput();

        // Map
        this.createMap();

        // 检查地图是否创建成功
        if (!this.map) {
            console.error('❌ 地图创建失败，无法继续初始化游戏');
            return;
        }

        if (isDebugMode) {
            (window as any).phaserGame = game;
        }

        // Hero - 使用createHero方法创建英雄
        this.createHero();

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

        // 设置英雄与地图图层的碰撞
        if (this.map && this.map.layers) {
            for (let i = 0; i < this.map.layers.length; i++) {
                const layer = this.map.layers[i];
                if (layer && layer.tilemapLayer) {
                    this.physics.add.collider(this.heroSprite, layer.tilemapLayer);
                }
            }
        }

        // 创建敌人和NPC
        this.createEnemies();
        this.createNPCs();

        // 设置GridEngine
        this.setupGridEngine();

        // 设置碰撞检测
        this.setupCollisions(elementsLayers);

        // 加载地图交互数据
        this.mapInteractionManager.loadMapInteractions(mapKey || 'map_main');

        // 优化GridEngine性能
        this.optimizeGridEngine();

        // 启用调试模式（如果启用）
        this.enableGridEngineDebug();

        // 同步角色位置
        this.syncCharacterPositions();

        // 播放背景音乐 - 暂时注释掉，因为音频文件不存在
        // this.soundManager.playBackgroundMusic('village');
    }

    private initializeGameSystems() {
        try {
            // 获取系统实例
            this.soundManager = SoundManager.getInstance();
            this.mapManager = MapManager.getInstance();
            this.mapInteractionManager = MapInteractionManager.getInstance();
            this.inventorySystem = InventorySystem.getInstance();
            this.questSystem = QuestSystem.getInstance(this); // 传递场景实例
            this.combatSystem = CombatSystem.getInstance(this); // 传递场景实例
            this.gameDataManager = GameDataManager.getInstance();
            this.statsManager = GameStatsManager.getInstance();
            this.performanceManager = PerformanceManager.getInstance();
            this.teleportSystem = TeleportSystem.getInstance();
            this.enemyAISystem = EnemyAISystem.getInstance();
            this.itemSystem = ItemSystem.getInstance(this); // 传递场景实例
            this.enhancedInventorySystem = EnhancedInventorySystem.getInstance();
            this.particleSystem = ParticleSystem.getInstance();
            this.screenEffectSystem = ScreenEffectSystem.getInstance();
            this.mobileAdapterSystem = MobileAdapterSystem.getInstance();
            this.enhancedShopSystem = EnhancedShopSystem.getInstance();
            this.enhancedCraftingSystem = EnhancedCraftingSystem.getInstance();
            this.enhancedGameStatsSystem = EnhancedGameStatsSystem.getInstance();
            this.enhancedAchievementSystem = EnhancedAchievementSystem.getInstance();
            this.testSystem = TestSystem.getInstance();

            // 检查系统实例是否有效
            const systems = [
                { name: 'SoundManager', instance: this.soundManager },
                { name: 'MapManager', instance: this.mapManager },
                { name: 'MapInteractionManager', instance: this.mapInteractionManager },
                { name: 'InventorySystem', instance: this.inventorySystem },
                { name: 'QuestSystem', instance: this.questSystem },
                { name: 'CombatSystem', instance: this.combatSystem },
                { name: 'GameDataManager', instance: this.gameDataManager },
                { name: 'GameStatsManager', instance: this.statsManager },
                { name: 'PerformanceManager', instance: this.performanceManager },
                { name: 'TeleportSystem', instance: this.teleportSystem },
                { name: 'EnemyAISystem', instance: this.enemyAISystem },
                { name: 'ItemSystem', instance: this.itemSystem },
                { name: 'EnhancedInventorySystem', instance: this.enhancedInventorySystem },
                { name: 'ParticleSystem', instance: this.particleSystem },
                { name: 'ScreenEffectSystem', instance: this.screenEffectSystem },
                { name: 'MobileAdapterSystem', instance: this.mobileAdapterSystem },
                { name: 'EnhancedShopSystem', instance: this.enhancedShopSystem },
                { name: 'EnhancedCraftingSystem', instance: this.enhancedCraftingSystem },
                { name: 'EnhancedGameStatsSystem', instance: this.enhancedGameStatsSystem },
                { name: 'EnhancedAchievementSystem', instance: this.enhancedAchievementSystem },
                { name: 'TestSystem', instance: this.testSystem }
            ];

            // 验证所有系统实例
            for (const system of systems) {
                if (!system.instance) {
                    console.error(`❌ 系统实例获取失败: ${system.name}`);
                    throw new Error(`系统实例获取失败: ${system.name}`);
                }
            }

            console.log('✅ 所有系统实例获取成功');

            // 初始化系统
            if (this.soundManager) this.soundManager.initialize(this);
            if (this.mapManager) this.mapManager.initialize(this);
            if (this.mapInteractionManager) this.mapInteractionManager.initialize(this);
            if (this.performanceManager) this.performanceManager.initialize(this);
            if (this.teleportSystem) this.teleportSystem.initialize(this);
            if (this.enemyAISystem) this.enemyAISystem.initialize(this);
            if (this.itemSystem) this.itemSystem.initialize(this);
            if (this.enhancedInventorySystem) this.enhancedInventorySystem.initialize(this);
            if (this.particleSystem) this.particleSystem.initialize(this);
            if (this.screenEffectSystem) this.screenEffectSystem.initialize(this);
            if (this.mobileAdapterSystem) this.mobileAdapterSystem.initialize(this);
            if (this.enhancedShopSystem) this.enhancedShopSystem.initialize(this);
            if (this.enhancedCraftingSystem) this.enhancedCraftingSystem.initialize(this);
            if (this.enhancedGameStatsSystem) this.enhancedGameStatsSystem.initialize(this);
            if (this.enhancedAchievementSystem) this.enhancedAchievementSystem.initialize(this);
            if (this.testSystem) this.testSystem.initialize(this);

            console.log('✅ 所有系统初始化完成');

        } catch (error) {
            console.error('❌ 系统初始化失败:', error);
            throw error;
        }

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
        // 检查键盘输入是否可用
        if (!this.input.keyboard) {
            console.warn('键盘输入不可用，使用默认值');
            this.enterKey = null;
            this.spaceKey = null;
            this.cursors = null;
            this.wasd = null;
            return;
        }

        try {
            this.enterKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ENTER);
            this.spaceKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
            this.cursors = this.input.keyboard.createCursorKeys();
            this.wasd = this.input.keyboard.addKeys({
                up: Phaser.Input.Keyboard.KeyCodes.W,
                down: Phaser.Input.Keyboard.KeyCodes.S,
                left: Phaser.Input.Keyboard.KeyCodes.A,
                right: Phaser.Input.Keyboard.KeyCodes.D,
            }) as Phaser.Input.Keyboard.Key[];
        } catch (error) {
            console.error('设置输入控制时出错:', error);
            this.enterKey = null;
            this.spaceKey = null;
            this.cursors = null;
            this.wasd = null;
        }
    }

    private createMap() {
        const { mapKey } = this.initData;
        const currentMap = this.mapManager.getCurrentMap();

        // 如果没有当前地图，尝试使用传入的mapKey
        const tilemapKey = currentMap?.tilemapKey || mapKey || 'home_page_city_house_01';

        console.log('🗺️ [DEBUG] 地图创建开始:');
        console.log(`   🎯 传入的mapKey: ${mapKey}`);
        console.log(`   🗺️ 当前地图: ${currentMap?.name || '无'}`);
        console.log(`   📍 使用的tilemapKey: ${tilemapKey}`);

        // 检查地图资源是否存在
        if (!this.cache.tilemap.exists(tilemapKey)) {
            console.error(`❌ 地图资源不存在: ${tilemapKey}`);
            console.log('📋 可用的地图资源:', this.cache.tilemap.entries);

            // 尝试使用房间地图作为默认地图
            const defaultTilemapKey = 'home_page_city_house_01';
            if (this.cache.tilemap.exists(defaultTilemapKey)) {
                console.log(`🔄 使用房间地图: ${defaultTilemapKey}`);
                this.map = this.make.tilemap({ key: defaultTilemapKey });
            } else {
                console.error(`❌ 房间地图也不存在: ${defaultTilemapKey}`);
                console.log('📋 所有可用的地图资源:', this.cache.tilemap.entries);

                // 尝试使用任何可用的地图
                const availableMaps = Array.from(this.cache.tilemap.entries.keys());
                if (availableMaps.length > 0) {
                    const firstAvailableMap = availableMaps[0] as string;
                    console.log(`🔄 使用第一个可用的地图: ${firstAvailableMap}`);
                    this.map = this.make.tilemap({ key: firstAvailableMap });
                } else {
                    console.error('❌ 没有任何可用的地图资源');
                    // 尝试创建一个简单的默认地图
                    console.log('🔄 尝试创建简单的默认地图');
                    this.createSimpleDefaultMap();
                    return;
                }
            }
        } else {
            this.map = this.make.tilemap({ key: tilemapKey });
        }

        // 检查瓦片集是否存在
        if (!this.textures.exists('tileset')) {
            console.error(`❌ 瓦片集纹理不存在: tileset`);
            return;
        }

        this.map.addTilesetImage('tileset', 'tileset');

        // 计算缩放比例和居中位置
        const gameWidth = this.cameras.main.width;
        const gameHeight = this.cameras.main.height;
        const mapWidth = this.map.widthInPixels;
        const mapHeight = this.map.heightInPixels;

        // 计算缩放比例，确保地图完全显示在屏幕内
        const scaleX = gameWidth / mapWidth;
        const scaleY = gameHeight / mapHeight;
        this.mapScale = Math.min(scaleX, scaleY) * 0.8; // 留一些边距

        // 计算居中位置 - 确保地图在屏幕正中央
        this.mapCenterX = (gameWidth - mapWidth * this.mapScale) / 2;
        this.mapCenterY = (gameHeight - mapHeight * this.mapScale) / 2;

        // 验证地图是否真的居中
        const mapDisplayWidth = mapWidth * this.mapScale;
        const mapDisplayHeight = mapHeight * this.mapScale;
        const expectedCenterX = gameWidth / 2;
        const expectedCenterY = gameHeight / 2;
        const actualCenterX = this.mapCenterX + mapDisplayWidth / 2;
        const actualCenterY = this.mapCenterY + mapDisplayHeight / 2;

        // 添加详细的调试信息
        console.log('🗺️ [DEBUG] 地图创建信息:');
        console.log(`   📏 游戏窗口尺寸: ${gameWidth}x${gameHeight} 像素`);
        console.log(`   🗺️ 地图原始尺寸: ${mapWidth}x${mapHeight} 像素 (${this.map.width}x${this.map.height} 瓦片)`);
        console.log(`   📐 缩放比例计算:`);
        console.log(`      - 水平缩放: ${scaleX.toFixed(3)} (${gameWidth}/${mapWidth})`);
        console.log(`      - 垂直缩放: ${scaleY.toFixed(3)} (${gameHeight}/${mapHeight})`);
        console.log(`      - 最终缩放: ${this.mapScale.toFixed(3)} (最小值 * 0.8)`);
        console.log(`   📍 地图位置信息:`);
        console.log(`      - 居中X坐标: ${this.mapCenterX.toFixed(1)} 像素`);
        console.log(`      - 居中Y坐标: ${this.mapCenterY.toFixed(1)} 像素`);
        console.log(`   📦 地图显示尺寸:`);
        console.log(`      - 缩放后宽度: ${(mapWidth * this.mapScale).toFixed(1)} 像素`);
        console.log(`      - 缩放后高度: ${(mapHeight * this.mapScale).toFixed(1)} 像素`);
        console.log(`   🎯 地图边界信息:`);
        console.log(`      - 物理世界边界: (${this.mapCenterX.toFixed(1)}, ${this.mapCenterY.toFixed(1)}, ${(mapWidth * this.mapScale).toFixed(1)}, ${(mapHeight * this.mapScale).toFixed(1)})`);
        console.log(`   🎯 地图居中验证:`);
        console.log(`      - 期望中心: (${expectedCenterX.toFixed(1)}, ${expectedCenterY.toFixed(1)})`);
        console.log(`      - 实际中心: (${actualCenterX.toFixed(1)}, ${actualCenterY.toFixed(1)})`);
        console.log(`      - 居中偏差: (${(actualCenterX - expectedCenterX).toFixed(1)}, ${(actualCenterY - expectedCenterY).toFixed(1)})`);
        console.log(`   🎮 瓦片信息:`);
        console.log(`      - 瓦片大小: 16x16 像素`);
        console.log(`      - 缩放后瓦片大小: ${(16 * this.mapScale).toFixed(1)}x${(16 * this.mapScale).toFixed(1)} 像素`);

        // 创建图层并应用缩放和位置
        for (let i = 0; i < this.map.layers.length; i++) {
            const layer = this.map.createLayer(i, 'tileset', this.mapCenterX, this.mapCenterY);
            if (layer) {
                layer.setScale(this.mapScale);
                console.log(`🗺️ 图层 ${i} 创建完成: 位置(${layer.x}, ${layer.y}), 缩放(${layer.scaleX}, ${layer.scaleY}), 尺寸(${layer.width}, ${layer.height})`);
            }
        }

        // 设置世界边界
        this.physics.world.setBounds(this.mapCenterX, this.mapCenterY, mapWidth * this.mapScale, mapHeight * this.mapScale);

        // 设置相机边界
        this.cameras.main.setBounds(this.mapCenterX, this.mapCenterY, mapWidth * this.mapScale, mapHeight * this.mapScale);
    }

    private createSimpleDefaultMap() {
        console.log('🗺️ 创建简单的默认地图');

        // 创建一个简单的默认地图
        const mapData = {
            width: 20,
            height: 15,
            tilewidth: 16,
            tileheight: 16,
            layers: [
                {
                    name: 'ground',
                    width: 20,
                    height: 15,
                    data: Array(300).fill(1) // 填充草地瓦片
                }
            ]
        };

        // 添加地图到缓存
        this.cache.tilemap.add('default_map', mapData);

        // 创建地图
        this.map = this.make.tilemap({ key: 'default_map' });

        // 设置默认缩放和位置
        this.mapScale = 2;
        this.mapCenterX = 100;
        this.mapCenterY = 100;

        console.log('✅ 简单默认地图创建完成');
    }

    /**
     * 将瓦片坐标转换为世界坐标
     */
    private tileToWorldPosition(tileX: number, tileY: number): { x: number, y: number } {
        const tileSize = 16; // 瓦片大小
        const worldX = this.mapCenterX + tileX * tileSize * this.mapScale;
        const worldY = this.mapCenterY + tileY * tileSize * this.mapScale;

        // 添加坐标转换调试信息（只在第一次调用时显示）
        if (!this._coordinateDebugShown) {
            console.log('🎯 [DEBUG] 坐标转换示例:');
            console.log(`   📍 瓦片坐标: (${tileX}, ${tileY})`);
            console.log(`   🌍 世界坐标: (${worldX.toFixed(1)}, ${worldY.toFixed(1)})`);
            console.log(`   📐 转换公式: 世界坐标 = 地图中心 + 瓦片坐标 × 瓦片大小 × 缩放比例`);
            console.log(`   🔢 计算过程: (${this.mapCenterX.toFixed(1)} + ${tileX} × ${tileSize} × ${this.mapScale.toFixed(3)}, ${this.mapCenterY.toFixed(1)} + ${tileY} × ${tileSize} × ${this.mapScale.toFixed(3)})`);
            this._coordinateDebugShown = true;
        }

        return { x: worldX, y: worldY };
    }

    private createHero() {
        const currentMap = this.mapManager.getCurrentMap();
        if (!currentMap) return;

        // 检查英雄纹理是否存在
        if (!this.textures.exists('hero')) {
            console.error('❌ 英雄纹理不存在: hero');
            console.log('📋 可用的纹理:', this.textures.getTextureKeys());
            return;
        }

        // 检查英雄帧是否存在
        if (!this.textures.get('hero').has('hero_idle_down_01')) {
            console.error('❌ 英雄帧不存在: hero_idle_down_01');
            console.log('📋 可用的帧:', this.textures.get('hero').getFrameNames());
            return;
        }

        // 获取英雄初始状态
        const {
            frame: initialFrame,
            facingDirection: initialFacingDirection,
            health: heroHealth,
            maxHealth: heroMaxHealth,
            coin: heroCoin,
            canPush: heroCanPush,
            haveSword: heroHaveSword,
        } = this.heroStatus;

        // 使用地图配置的生成点
        const initialPosition = currentMap.spawnPoint;

        // 计算英雄在世界中的位置
        const worldPosition = this.tileToWorldPosition(initialPosition.x, initialPosition.y);

        // 创建英雄精灵
        this.heroSprite = this.physics.add
            .sprite(worldPosition.x, worldPosition.y, 'hero', initialFrame || 'hero_idle_down_01')
            .setDepth(1);

        console.log('✅ 英雄创建成功');
        console.log(`   🎯 初始位置: (${initialPosition.x}, ${initialPosition.y})`);
        console.log(`   🌍 世界位置: (${worldPosition.x.toFixed(1)}, ${worldPosition.y.toFixed(1)})`);
        console.log(`   📍 面向方向: ${initialFacingDirection}`);
        console.log(`   🎮 英雄精灵:`, this.heroSprite);
        console.log(`   👁️ 英雄可见性:`, this.heroSprite.visible);
        console.log(`   🎨 英雄纹理:`, this.heroSprite.texture.key);
        console.log(`   📍 英雄帧:`, this.heroSprite.frame.name);
        console.log(`   📍 英雄精灵位置: (${this.heroSprite.x.toFixed(1)}, ${this.heroSprite.y.toFixed(1)})`);
        console.log(`   📍 英雄精灵深度:`, this.heroSprite.depth);
        console.log(`   📍 英雄精灵激活:`, this.heroSprite.active);
        console.log(`   📍 英雄精灵父容器:`, this.heroSprite.parentContainer);

        // 设置英雄属性
        (this.heroSprite as any).health = heroHealth;
        (this.heroSprite as any).maxHealth = heroMaxHealth;
        (this.heroSprite as any).coin = heroCoin;
        (this.heroSprite as any).canPush = heroCanPush;
        (this.heroSprite as any).haveSword = heroHaveSword;

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

        // 设置相机 - 在英雄创建完成后
        this.setupCamera();
    }

    private addHeroMethods() {
        // 恢复生命值
        (this.heroSprite as any).restoreHealth = (restore: number) => {
            (this.heroSprite as any).health = Math.min((this.heroSprite as any).health + restore, (this.heroSprite as any).maxHealth);
            this.updateHeroHealthUi(this.calculateHeroHealthStates());
        };

        // 增加最大生命值
        (this.heroSprite as any).increaseMaxHealth = (increase: number) => {
            (this.heroSprite as any).maxHealth += increase;
            this.updateHeroHealthUi(this.calculateHeroHealthStates());
        };

        // 收集金币
        (this.heroSprite as any).collectCoin = (coinQuantity: number) => {
            (this.heroSprite as any).coin = Math.min((this.heroSprite as any).coin + coinQuantity, 999);
            this.updateHeroCoinUI();
            this.soundManager.playSoundEffect('pickup');
            this.statsManager.itemCollected('coin');
        };

        // 受到伤害
        (this.heroSprite as any).takeDamage = (damage: number) => {
            this.time.delayedCall(180, () => {
                (this.heroSprite as any).health -= damage;
                this.statsManager.damageTaken(damage);
                if ((this.heroSprite as any).health <= 0) {
                    this.cameras.main.fadeOut(SCENE_FADE_TIME);
                    this.updateHeroHealthUi(this.calculateHeroHealthStates());
                    this.updateHeroCoinUI();
                    this.time.delayedCall(SCENE_FADE_TIME, () => {
                        this.isTeleporting = false;
                        this.scene.start('GameOverScene');
                    });
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
        // 计算物品在世界中的位置
        const worldPosition = this.tileToWorldPosition(itemSpawn.x, itemSpawn.y);

        const item = this.physics.add
            .sprite(worldPosition.x, worldPosition.y, itemSpawn.itemType)
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
        // 计算敌人在世界中的位置
        const worldPosition = this.tileToWorldPosition(enemySpawn.x, enemySpawn.y);

        const enemy = this.physics.add.sprite(worldPosition.x, worldPosition.y, 'slime', 'slime_idle_01');
        enemy.setTint(this.getEnemyColor(enemySpawn.enemyType));
        enemy.name = `${enemySpawn.enemyType}_${index}`;
        (enemy as any).enemyType = enemySpawn.enemyType;
        (enemy as any).enemySpecies = 'slime';
        (enemy as any).enemyAI = ENEMY_AI_TYPE;
        (enemy as any).speed = enemySpawn.level;
        (enemy as any).health = enemySpawn.level * 10;
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
                (enemy as any).health -= damage;

                if ((enemy as any).health < 0) {
                    this.statsManager.enemyDefeated(damage);
                    enemy.setVisible(false);
                    const position = this.gridEngine.getPosition(enemy.name);
                    const worldPosition = this.tileToWorldPosition(position.x, position.y);
                    this.spawnItem({
                        x: worldPosition.x,
                        y: worldPosition.y,
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
        // 计算NPC在世界中的位置
        const worldPosition = this.tileToWorldPosition(npcSpawn.x, npcSpawn.y);

        // NPC纹理映射
        const npcTextureMap: { [key: string]: string } = {
            'mayor': 'npc_01',
            'merchant': 'npc_02',
            'guard': 'npc_03',
            'hermit': 'npc_04',
            'miner': 'npc_01'
        };

        // 获取实际的纹理键
        const textureKey = npcTextureMap[npcSpawn.npcType] || npcSpawn.npcType;
        const frameKey = `${textureKey}_idle_${npcSpawn.facingDirection}_01`;

        if (!this.textures.exists(textureKey)) {
            console.warn(`纹理不存在: ${textureKey}，跳过创建NPC: ${npcSpawn.npcType}`);
            console.log('📋 可用的纹理:', this.textures.getTextureKeys());
            return;
        }

        // 检查帧是否存在
        if (!this.textures.get(textureKey).has(frameKey)) {
            console.warn(`纹理帧不存在: ${frameKey}，使用默认帧`);
            // 使用默认帧或跳过创建
            return;
        }

        const npc = this.physics.add.sprite(worldPosition.x, worldPosition.y, textureKey, frameKey);
        (npc.body as Phaser.Physics.Arcade.Body).setSize(14, 14);
        (npc.body as Phaser.Physics.Arcade.Body).setOffset(9, 13);
        this.npcSprites.add(npc);

        // 创建NPC动画 - 使用映射后的纹理键
        this.createPlayerWalkingAnimation(textureKey, 'walking_up');
        this.createPlayerWalkingAnimation(textureKey, 'walking_right');
        this.createPlayerWalkingAnimation(textureKey, 'walking_down');
        this.createPlayerWalkingAnimation(textureKey, 'walking_left');
    }

    private setupCollisions(elementsLayers?: Phaser.GameObjects.Group) {
        // 英雄与物品碰撞
        this.physics.add.overlap(this.heroSprite, this.itemsSprites, (objA, objB) => {
            const item = [objA, objB].find((obj) => obj !== this.heroSprite);

            if (item && (item as any).itemType === 'heart') {
                (this.heroSprite as any).restoreHealth(20);
                this.statsManager.itemCollected('heart');
                (item as any).setVisible(false);
                (item as any).destroy();
            }

            if (item && (item as any).itemType === 'coin') {
                (this.heroSprite as any).collectCoin(1);
                (item as any).setVisible(false);
                (item as any).destroy();
            }

            if (item && (item as any).itemType === 'heart_container') {
                (this.heroSprite as any).increaseMaxHealth(20);
                (item as any).setVisible(false);
                (item as any).destroy();
            }

            if (item && (item as any).itemType === 'sword') {
                this.showDialog((item as any).itemType);
                (this.heroSprite as any).haveSword = true;
                (item as any).setVisible(false);
                (item as any).destroy();
            }

            if (item && (item as any).itemType === 'push') {
                this.showDialog((item as any).itemType);
                (this.heroSprite as any).canPush = true;
                (item as any).setVisible(false);
                (item as any).destroy();
            }
        });

        // 英雄与敌人碰撞
        this.physics.add.overlap(this.heroObjectCollider, this.enemiesSprites, (objA, objB) => {
            const enemy = [objA, objB].find((obj) => obj !== this.heroObjectCollider);
            if (enemy && ((enemy as any).isAttacking || this.gridEngine.isMoving((enemy as any).name))) {
                return;
            }

            if (enemy) {
                (enemy as any).anims.play(`slime_attack`);
            }
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

            if (this.enterKey && Phaser.Input.Keyboard.JustDown(this.enterKey)) {
                if (npc && this.gridEngine.isMoving((npc as any).texture.key)) {
                    return;
                }

                if (npc) {
                    this.showDialog((npc as any).texture.key);
                }
                if (npc) {
                    this.gridEngine.stopMovement((npc as any).texture.key);
                }
            }
        });

        // 英雄与地图元素碰撞 - 移植自原项目
        if (elementsLayers) {
            this.physics.add.overlap(this.heroActionCollider, elementsLayers, (objA, objB) => {
                const tile = [objA, objB].find((obj) => obj !== this.heroActionCollider);

                // 处理攻击
                if (tile && (tile as any).index > 0 && !(tile as any).wasHandled) {
                    switch ((tile as any).index) {
                        case BUSH_INDEX: {
                            if (this.isAttacking) {
                                (tile as any).wasHandled = true;

                                this.time.delayedCall(
                                    ATTACK_DELAY_TIME,
                                    () => {
                                        if (tile) {
                                            (tile as any).setVisible(false);
                                        }
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
                            if ((this.heroSprite as any).canPush && this.isAttacking) {
                                const newPosition = this.calculatePushTilePosition();
                                let canBePushed = true;
                                if (this.map && this.map.layers) {
                                    canBePushed = this.map.layers.every((layer: any) => {
                                        const t = layer.tilemapLayer.getTileAtWorldXY(
                                            newPosition.x,
                                            newPosition.y
                                        );

                                        return !t?.properties?.ge_collide;
                                    });
                                }

                                if (canBePushed && !(tile as any).isMoved) {
                                    (tile as any).isMoved = true;
                                    this.tweens.add({
                                        targets: tile,
                                        pixelX: newPosition.x,
                                        pixelY: newPosition.y,
                                        ease: 'Power2',
                                        duration: 700,
                                        onComplete: () => {
                                            if (tile) {
                                                (tile as any).setVisible(false);
                                            }
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

        // 先设置相机边界
        if (this.map) {
            camera.setBounds(this.mapCenterX, this.mapCenterY, this.map.widthInPixels * this.mapScale, this.map.heightInPixels * this.mapScale);
        }

        // 计算地图中心位置
        const mapCenterX = this.mapCenterX + (this.map.widthInPixels * this.mapScale) / 2;
        const mapCenterY = this.mapCenterY + (this.map.heightInPixels * this.mapScale) / 2;

        // 设置相机初始位置到地图中心
        camera.setScroll(mapCenterX - this.cameras.main.width / 2, mapCenterY - this.cameras.main.height / 2);

        // 设置相机跟随，使用默认偏移（英雄在屏幕中央）
        camera.startFollow(this.heroSprite, true, 0.1, 0.1);

        console.log('📷 相机设置完成:');
        console.log(`   📍 跟随目标: 英雄精灵`);
        console.log(`   📍 屏幕尺寸: ${this.cameras.main.width}x${this.cameras.main.height}`);
        console.log(`   📍 地图中心: (${mapCenterX.toFixed(1)}, ${mapCenterY.toFixed(1)})`);
        console.log(`   📍 英雄位置: (${this.heroSprite.x.toFixed(1)}, ${this.heroSprite.y.toFixed(1)})`);
        console.log(`   📍 相机初始滚动: (${(mapCenterX - this.cameras.main.width / 2).toFixed(1)}, ${(mapCenterY - this.cameras.main.height / 2).toFixed(1)})`);
        console.log(`   📍 相机边界: (${this.mapCenterX.toFixed(1)}, ${this.mapCenterY.toFixed(1)}, ${(this.map.widthInPixels * this.mapScale).toFixed(1)}, ${(this.map.heightInPixels * this.mapScale).toFixed(1)})`);
    }

    private setupGridEngine() {
        // 检查地图是否已创建
        if (!this.map) {
            console.error('❌ 地图未创建，无法设置GridEngine');
            return;
        }

        const currentMap = this.mapManager.getCurrentMap();
        if (!currentMap) {
            console.error('❌ 当前地图数据不存在，无法设置GridEngine');
            return;
        }

        // 使用地图配置的生成点
        const spawnPoint = currentMap.spawnPoint;
        const worldPosition = this.tileToWorldPosition(spawnPoint.x, spawnPoint.y);

        // 设置英雄位置
        this.heroSprite.setPosition(worldPosition.x, worldPosition.y);

        // 添加英雄位置调试信息
        console.log('👤 [DEBUG] 英雄生成位置:');
        console.log(`   🎯 瓦片坐标: (${spawnPoint.x}, ${spawnPoint.y})`);
        console.log(`   🌍 世界坐标: (${worldPosition.x.toFixed(1)}, ${worldPosition.y.toFixed(1)})`);
        console.log(`   📍 英雄精灵位置: (${this.heroSprite.x.toFixed(1)}, ${this.heroSprite.y.toFixed(1)})`);

        // 创建GridEngine配置
        const gridEngineConfig = {
            characters: [
                {
                    id: 'hero',
                    sprite: this.heroSprite,
                    startPosition: spawnPoint,
                    facingDirection: this.heroStatus.facingDirection,
                    offsetY: 4,
                    speed: 4 as const, // 降低速度，参考原项目设置
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
        if (this.enemiesSprites && this.enemiesSprites.getChildren) {
            this.enemiesSprites.getChildren().forEach((enemy: any) => {
                const enemyConfig = {
                    id: enemy.name,
                    sprite: enemy,
                    startPosition: { x: Math.floor(enemy.x / 16), y: Math.floor(enemy.y / 16) },
                    facingDirection: 'down',
                    speed: 4 as const, // 降低速度，参考原项目设置
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
        }

        // 添加NPC到GridEngine
        if (this.npcSprites && this.npcSprites.getChildren) {
            this.npcSprites.getChildren().forEach((npc: any) => {
                const npcConfig = {
                    id: npc.texture.key,
                    sprite: npc,
                    startPosition: { x: Math.floor(npc.x / 16), y: Math.floor(npc.y / 16) },
                    facingDirection: 'down',
                    speed: 4 as const, // 降低速度，参考原项目设置
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
        }

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

        // 注意：movementFinished 事件可能不存在，我们将在 handleMovementStopped 中处理移动完成逻辑
    }

    private handleMovementStarted(charId: string, direction: string) {
        if (charId === 'hero') {
            (this.heroSprite as any).anims.play(`hero_walking_${direction}`);
            this.soundManager.playSoundEffect('footstep');

            // 更新碰撞器位置
            this.updateColliders();
        } else {
            if (this.npcSprites && this.npcSprites.getChildren) {
                const npc = this.npcSprites.getChildren().find((npcSprite: any) => npcSprite.texture.key === charId);
                if (npc) {
                    (npc as any).anims.play(`${charId}_walking_${direction}`);
                    return;
                }
            }

            if (this.enemiesSprites && this.enemiesSprites.getChildren) {
                const enemy = this.enemiesSprites.getChildren().find((enemySprite: any) => enemySprite.name === charId);
                if (enemy) {
                    (enemy as any).anims.play(`slime_walking`);
                }
            }
        }
    }

    private handleMovementStopped(charId: string, direction: string) {
        if (charId === 'hero') {
            (this.heroSprite as any).anims.stop();
            (this.heroSprite as any).setFrame(this.getStopFrame(direction, charId) || 'hero_idle_down_01');

            // 英雄移动完成后的逻辑
            this.onHeroMovementFinished();

            // 检查位置相关的交互
            const position = this.gridEngine.getPosition(charId);
            this.checkTeleportPoints(charId, position);
            this.checkInteractionPoints(charId, position);
        } else {
            if (this.npcSprites && this.npcSprites.getChildren) {
                const npc = this.npcSprites.getChildren().find((npcSprite: any) => npcSprite.texture.key === charId);
                if (npc) {
                    (npc as any).anims.stop();
                    (npc as any).setFrame(this.getStopFrame(direction, charId) || 'npc_idle');

                    // NPC移动完成
                    this.onNPCMovementFinished(npc);
                    return;
                }
            }

            if (this.enemiesSprites && this.enemiesSprites.getChildren) {
                const enemy = this.enemiesSprites.getChildren().find((enemySprite: any) => enemySprite.name === charId);
                if (enemy) {
                    (enemy as any).anims.play(`slime_idle`, true);

                    // 敌人移动完成
                    this.onEnemyMovementFinished(enemy);
                }
            }
        }
    }

    private handleDirectionChanged(charId: string, direction: string) {
        if (charId === 'hero') {
            (this.heroSprite as any).setFrame(this.getStopFrame(direction, charId) || 'hero_idle_down_01');
        } else {
            if (this.npcSprites && this.npcSprites.getChildren) {
                const npc = this.npcSprites.getChildren().find((npcSprite: any) => npcSprite.texture.key === charId);
                if (npc) {
                    (npc as any).setFrame(this.getStopFrame(direction, charId) || 'npc_idle');
                    return;
                }
            }

            if (this.enemiesSprites && this.enemiesSprites.getChildren) {
                const enemy = this.enemiesSprites.getChildren().find((enemySprite: any) => enemySprite.name === charId);
                if (enemy) {
                    (enemy as any).setFrame(`slime_idle`);
                }
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

            // 检查位置相关的交互
            const position = this.gridEngine.getPosition(charId);
            this.checkTeleportPoints(charId, position);
            this.checkInteractionPoints(charId, position);
        } else {
            // NPC或敌人移动完成后的逻辑
            this.onCharacterMovementFinished(charId);
        }
    }

    // AI系统
    private initializeAISystem() {
        // 初始化敌人AI
        if (this.enemiesSprites && this.enemiesSprites.getChildren) {
            this.enemiesSprites.getChildren().forEach((enemy: any) => {
                this.initializeEnemyAI(enemy);
            });
        }

        // 初始化NPC AI
        if (this.npcSprites && this.npcSprites.getChildren) {
            this.npcSprites.getChildren().forEach((npc: any) => {
                this.initializeNPCAI(npc);
            });
        }

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
        if (this.enemiesSprites && this.enemiesSprites.getChildren) {
            this.enemiesSprites.getChildren().forEach((enemy: any) => {
                this.updateEnemyAI(enemy, currentTime);
            });
        }

        // 更新NPC AI
        if (this.npcSprites && this.npcSprites.getChildren) {
            this.npcSprites.getChildren().forEach((npc: any) => {
                this.updateNPCAI(npc, currentTime);
            });
        }
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

            // 简单的跟随逻辑 - 直接向英雄移动
            const dx = heroPosition.x - enemyPosition.x;
            const dy = heroPosition.y - enemyPosition.y;

            // 选择移动方向
            if (Math.abs(dx) > Math.abs(dy)) {
                // 水平移动
                if (dx > 0) {
                    this.gridEngine.move(enemy.name, 'right');
                } else {
                    this.gridEngine.move(enemy.name, 'left');
                }
            } else {
                // 垂直移动
                if (dy > 0) {
                    this.gridEngine.move(enemy.name, 'down');
                } else {
                    this.gridEngine.move(enemy.name, 'up');
                }
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
        // 路径寻找配置 - 使用基础API
        console.log('路径寻找系统已初始化');

        // 注意：某些高级路径寻找配置可能不可用
        // 如果需要，可以在这里添加自定义的路径寻找逻辑
    }

    // 位置检查方法
    private checkTeleportPoints(charId: string, position: { x: number; y: number }) {
        if (charId !== 'hero') return;
        if (!this.map) return;

        // 检查当前位置是否有传送点
        const teleportLayer = this.map.getLayer('teleports');
        if (teleportLayer && (teleportLayer as any).tilemapLayer?.getTileAt) {
            const tile = (teleportLayer as any).tilemapLayer.getTileAt(position.x, position.y);
            if (tile && tile.properties?.teleportData) {
                this.handleTeleport(tile.properties.teleportData);
            }
        }
    }

    private checkInteractionPoints(charId: string, position: { x: number; y: number }) {
        if (charId !== 'hero') return;
        if (!this.map) return;

        // 检查交互点
        const interactionLayer = this.map.getLayer('interactions');
        if (interactionLayer && (interactionLayer as any).tilemapLayer?.getTileAt) {
            const tile = (interactionLayer as any).tilemapLayer.getTileAt(position.x, position.y);
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
                    health: (this.heroSprite as any).health,
                    maxHealth: (this.heroSprite as any).maxHealth,
                    coin: (this.heroSprite as any).coin,
                    canPush: (this.heroSprite as any).canPush,
                    haveSword: (this.heroSprite as any).haveSword,
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
        // this.statsManager.recordMovement();
    }

    private onCharacterMovementFinished(charId: string) {
        // 角色移动完成后的逻辑
        if (this.npcSprites && this.npcSprites.getChildren) {
            const npc = this.npcSprites.getChildren().find((npcSprite: any) => npcSprite.texture.key === charId);
            if (npc) {
                // NPC移动完成
                this.onNPCMovementFinished(npc);
            }
        }

        if (this.enemiesSprites && this.enemiesSprites.getChildren) {
            const enemy = this.enemiesSprites.getChildren().find((enemySprite: any) => enemySprite.name === charId);
            if (enemy) {
                // 敌人移动完成
                this.onEnemyMovementFinished(enemy);
            }
        }
    }

    private onNPCMovementFinished(npc: any) {
        // NPC移动完成后的行为
        if (npc.aiState.type === 'idle') {
            // 随机转向
            const directions = ['up', 'down', 'left', 'right'];
            const randomDirection = directions[Math.floor(Math.random() * directions.length)];
            this.gridEngine.setFacingDirection(npc.texture.key, randomDirection);
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
        // this.statsManager.recordInteraction(interaction.type);

        // 播放交互音效
        if (interaction.properties?.soundEffect) {
            this.soundManager.playSoundEffect(interaction.properties.soundEffect);
        }

        // 显示交互反馈
        this.showInteractionFeedback(interaction);
    }

    private onMapEventTriggered(event: any): void {
        // 记录事件触发统计
        // this.statsManager.recordEventTriggered(event.name);

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
        if (this.enemiesSprites && this.enemiesSprites.getChildren) {
            this.enemiesSprites.getChildren().forEach((enemy: any) => {
                const position = this.gridEngine.getPosition(enemy.name);
                const worldPosition = this.tileToWorldPosition(position.x, position.y);
                enemy.setPosition(worldPosition.x, worldPosition.y);
            });
        }

        if (this.npcSprites && this.npcSprites.getChildren) {
            this.npcSprites.getChildren().forEach((npc: any) => {
                const position = this.gridEngine.getPosition(npc.texture.key);
                const worldPosition = this.tileToWorldPosition(position.x, position.y);
                npc.setPosition(worldPosition.x, worldPosition.y);
            });
        }
    }

    // 性能优化方法
    private optimizeGridEngine() {
        // GridEngine 性能优化 - 使用基础API
        console.log('GridEngine 性能优化已启用');

        // 注意：某些高级性能配置可能不可用
        // 如果需要，可以在这里添加自定义的性能优化逻辑
    }

    // 调试方法
    private enableGridEngineDebug() {
        if (this.physics.config.debug) {
            console.log('GridEngine 调试模式已启用');

            // 注意：某些调试功能可能不可用
            // 如果需要，可以在这里添加自定义的调试逻辑
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





    private updateHeroCoinUI() {
        const customEvent = new CustomEvent('hero-coin', {
            detail: { heroCoins: this.heroStatus.coin },
        });
        window.dispatchEvent(customEvent);
    }



    update() {
        this.isSpaceJustDown = this.spaceKey && Phaser.Input.Keyboard.JustDown ? Phaser.Input.Keyboard.JustDown(this.spaceKey) : false;

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
        if (this.enemiesSprites && this.enemiesSprites.getChildren) {
            this.enemiesSprites.getChildren().forEach((enemy: any) => {
                enemy.canSeeHero = enemy.body.embedded;
                if (!enemy.canSeeHero && enemy.isFollowingHero) {
                    enemy.isFollowingHero = false;
                    this.gridEngine.setSpeed(enemy.name, enemy.speed);
                    this.gridEngine.moveRandomly(enemy.name, 1000, 4);
                }
            });
        }

        // 更新碰撞器位置
        this.updateColliders();

        // 移动逻辑
        if (this.cursors && this.wasd) {
            let moved = false;

            if (this.cursors.left?.isDown || this.wasd[2]?.isDown) {
                console.log('🎮 向左移动');
                this.gridEngine.move('hero', 'left');
                moved = true;
            } else if (this.cursors.right?.isDown || this.wasd[3]?.isDown) {
                console.log('🎮 向右移动');
                this.gridEngine.move('hero', 'right');
                moved = true;
            } else if (this.cursors.up?.isDown || this.wasd[0]?.isDown) {
                console.log('🎮 向上移动');
                this.gridEngine.move('hero', 'up');
                moved = true;
            } else if (this.cursors.down?.isDown || this.wasd[1]?.isDown) {
                console.log('🎮 向下移动');
                this.gridEngine.move('hero', 'down');
                moved = true;
            }

            if (!moved && !this.gridEngine.isMoving('hero')) {
                // 停止移动动画
                (this.heroSprite as any).anims.stop();
                (this.heroSprite as any).setFrame('hero_idle_down_01');
            }
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

export default CompleteGameScene;
import * as Phaser from 'phaser';
import { SoundManager } from '../systems/SoundManager';
import { MapManager } from '../systems/MapManager';
import { InventorySystem } from '../systems/InventorySystem';
import { QuestSystem } from '../systems/QuestSystem';
import { CombatSystem } from '../systems/CombatSystem';
import { GameDataManager } from '../systems/GameDataManager';
import { GameStatsManager } from '../systems/GameStatsManager';

// 游戏常量
const SCENE_FADE_TIME = 300;
const ATTACK_DELAY_TIME = 50;
const BUSH_INDEX = 428;
const BOX_INDEX = 427;
const COIN_INDEX = 192;
const HEART_CONTAINER_INDEX = 233;
const NPC_MOVEMENT_RANDOM = 'random';
const NPC_MOVEMENT_STILL = 'still';
const ENEMY_AI_TYPE = 'follow';

// 创建交互式游戏对象的工具函数
const createInteractiveGameObject = (
    scene: Phaser.Scene,
    x: number,
    y: number,
    width: number,
    height: number,
    name: string,
    isDebug = false,
    origin = { x: 0, y: 1 }
) => {
    const customCollider = new Phaser.GameObjects.Rectangle(
        scene,
        x,
        y,
        width,
        height
    ).setOrigin(origin.x, origin.y);
    customCollider.name = name;
    (customCollider as any).isCustomCollider = true;

    if (isDebug) {
        customCollider.setFillStyle(0x741B47);
    }

    scene.physics.add.existing(customCollider);
    (customCollider.body as Phaser.Physics.Arcade.Body).setAllowGravity(false);
    (customCollider.body as Phaser.Physics.Arcade.Body).setImmovable(true);

    return customCollider;
};

export class CompleteGameScene extends Phaser.Scene {
    // 游戏系统
    private soundManager!: SoundManager;
    private mapManager!: MapManager;
    private inventorySystem!: InventorySystem;
    private questSystem!: QuestSystem;
    private combatSystem!: CombatSystem;
    private gameDataManager!: GameDataManager;
    private statsManager!: GameStatsManager;

    // 游戏状态
    private isShowingDialog = false;
    private isTeleporting = false;
    private isAttacking = false;
    private isSpaceJustDown = false;

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

    init(data: any) {
        this.heroStatus = { ...this.heroStatus, ...data.heroStatus };
    }

    create() {
        console.log('CompleteGameScene: 创建场景');

        // 初始化游戏系统
        this.initializeGameSystems();

        // 设置输入控制
        this.setupInput();

        // 创建地图
        this.createMap();

        // 创建英雄
        this.createHero();

        // 创建物品
        this.createItems();

        // 创建敌人
        this.createEnemies();

        // 创建NPC
        this.createNPCs();

        // 设置碰撞检测
        this.setupCollisions();

        // 设置相机
        this.setupCamera();

        // 设置GridEngine
        this.setupGridEngine();

        // 播放背景音乐
        this.soundManager.playBackgroundMusic('village');
    }

      private initializeGameSystems() {
    this.soundManager = SoundManager.getInstance();
    this.mapManager = MapManager.getInstance();
    this.inventorySystem = InventorySystem.getInstance();
    this.questSystem = QuestSystem.getInstance();
    this.combatSystem = CombatSystem.getInstance();
    this.gameDataManager = GameDataManager.getInstance();
    this.statsManager = GameStatsManager.getInstance();

    // 初始化系统
    this.soundManager.initialize(this);
    this.mapManager.initialize(this);
    
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

    private setupCollisions() {
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

        const gridEngineConfig = {
            characters: [
                {
                    id: 'hero',
                    sprite: this.heroSprite,
                    startPosition: currentMap.spawnPoint,
                    offsetY: 4,
                },
            ],
        };

        // 添加敌人到GridEngine
        this.enemiesSprites.getChildren().forEach((enemy: any) => {
            gridEngineConfig.characters.push({
                id: enemy.name,
                sprite: enemy,
                startPosition: { x: enemy.x / 16, y: (enemy.y / 16) - 1 },
                speed: (enemy as any).speed,
                offsetY: -4,
            });
        });

        // 添加NPC到GridEngine
        this.npcSprites.getChildren().forEach((npc: any) => {
            gridEngineConfig.characters.push({
                id: npc.texture.key,
                sprite: npc,
                startPosition: { x: npc.x / 16, y: (npc.y / 16) - 1 },
                speed: 1,
                offsetY: 4,
            });
        });

        this.gridEngine.create(this.map, gridEngineConfig);

        // 设置移动事件
        this.setupGridEngineEvents();
    }

    private setupGridEngineEvents() {
        // 移动开始事件
        this.gridEngine.movementStarted().subscribe(({ charId, direction }: any) => {
            if (charId === 'hero') {
                this.heroSprite.anims.play(`hero_walking_${direction}`);
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
        });

        // 移动停止事件
        this.gridEngine.movementStopped().subscribe(({ charId, direction }: any) => {
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
        });
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

    if (this.isTeleporting || this.isAttacking || this.isShowingDialog) {
      return;
    }

        // 攻击逻辑
        if (!this.gridEngine.isMoving('hero') && this.isSpaceJustDown && (this.heroSprite as any).haveSword) {
            const facingDirection = this.gridEngine.getFacingDirection('hero');
            this.heroSprite.anims.play(`hero_attack_${facingDirection}`);
            this.isAttacking = true;
            this.soundManager.playSoundEffect('attack');
            return;
        }

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
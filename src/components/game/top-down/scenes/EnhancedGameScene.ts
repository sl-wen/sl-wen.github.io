import * as Phaser from 'phaser';
import { InventorySystem } from '../systems/InventorySystem';
import { QuestSystem } from '../systems/QuestSystem';
import { CombatSystem } from '../systems/CombatSystem';
import { GameDataManager } from '../systems/GameDataManager';
import { 
  COMBAT_RANGE, 
  COMBAT_DAMAGE, 
  COMBAT_COOLDOWN, 
  ENEMY_DETECTION_RANGE,
  QUEST_TYPES,
  ITEM_TYPES
} from '../ref/constants';

// 玩家状态接口
interface PlayerStats {
  health: number;
  maxHealth: number;
  attack: number;
  defense: number;
  speed: number;
  level: number;
  experience: number;
  gold: number;
}

// 游戏状态接口
interface GameState {
  playerStats: PlayerStats;
  currentMap: string;
  playerPosition: { x: number; y: number };
  gameTime: number;
}

/**
 * 增强版游戏场景
 * 集成了物品系统、任务系统和战斗系统
 */
export class EnhancedGameScene extends Phaser.Scene {
  // 游戏系统
  private inventorySystem!: InventorySystem;
  private questSystem!: QuestSystem;
  private combatSystem!: CombatSystem;
  private gameDataManager!: GameDataManager;

  // 游戏状态
  private gameState: GameState;
  private isInCombat: boolean = false;
  private lastAttackTime: number = 0;

  // 游戏对象
  private player!: Phaser.GameObjects.Sprite;
  private enemies!: Phaser.GameObjects.Group;
  private items!: Phaser.GameObjects.Group;
  private npcs!: Phaser.GameObjects.Group;
  private map!: Phaser.Tilemaps.Tilemap;
  private gridEngine: any;

  // 输入控制
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private wasd!: Phaser.Input.Keyboard.Key[];
  private spaceKey!: Phaser.Input.Keyboard.Key | null;
  private enterKey!: Phaser.Input.Keyboard.Key | null;

  constructor() {
    super('EnhancedGameScene');
    this.gameState = {
      playerStats: {
        health: 100,
        maxHealth: 100,
        attack: 10,
        defense: 5,
        speed: 1,
        level: 1,
        experience: 0,
        gold: 0
      },
      currentMap: 'village',
      playerPosition: { x: 10, y: 10 },
      gameTime: 0
    };
  }

  create() {
    console.log('EnhancedGameScene: 创建场景');

    // 初始化游戏系统
    this.initializeGameSystems();

    // 创建地图
    this.createMap();

    // 创建玩家
    this.createPlayer();

    // 创建NPC
    this.createNPCs();

    // 创建敌人
    this.createEnemies();

    // 创建物品
    this.createItems();

    // 设置输入控制
    this.setupInput();

    // 设置相机
    this.setupCamera();

    // 设置UI事件
    this.setupUIEvents();

    // 初始化任务
    this.initializeQuests();

    console.log('EnhancedGameScene: 场景创建完成');
  }

  update(time: number, delta: number) {
    this.gameState.gameTime += delta;

    if (!this.isInCombat) {
      this.handlePlayerMovement();
      this.handlePlayerActions();
    }

    this.updateEnemies(delta);
    this.checkCollisions();
    this.updateUI();
  }

  /**
   * 初始化游戏系统
   */
  private initializeGameSystems(): void {
    this.inventorySystem = InventorySystem.getInstance();
    this.questSystem = QuestSystem.getInstance();
    this.combatSystem = CombatSystem.getInstance();
    this.gameDataManager = GameDataManager.getInstance();

    // 加载存档数据
    this.loadGameData();
  }

  /**
   * 创建地图
   */
  private createMap(): void {
    // 创建瓦片地图
    this.map = this.make.tilemap({ key: 'village_map' });
    const tileset = this.map.addTilesetImage('tileset', 'tileset');
    
    // 创建图层
    const groundLayer = this.map.createLayer('ground', tileset || 'tileset');
    const objectsLayer = this.map.createLayer('objects', tileset || 'tileset');
    
    // 设置碰撞
    if (objectsLayer) {
        objectsLayer.setCollisionByProperty({ collides: true });
    }

    // 初始化GridEngine
    this.gridEngine = this.plugins.get('gridEngine');
    this.gridEngine.create(this.map, {
      characters: [
        {
          id: 'player',
          sprite: this.player,
          walkingAnimationMapping: 6,
          startPosition: { x: this.gameState.playerPosition.x, y: this.gameState.playerPosition.y }
        }
      ]
    });
  }

  /**
   * 创建玩家
   */
  private createPlayer(): void {
    this.player = this.add.sprite(0, 0, 'hero');
    this.player.setScale(2);
    
    // 创建玩家动画
    this.createPlayerAnimations();
    
    // 设置玩家属性
    this.player.setData('stats', this.gameState.playerStats);
    this.player.setData('inventory', this.inventorySystem);
    this.player.setData('quests', this.questSystem);
  }

  /**
   * 创建玩家动画
   */
  private createPlayerAnimations(): void {
    // 待机动画
    this.anims.create({
      key: 'hero_idle',
      frames: this.anims.generateFrameNumbers('hero', { start: 0, end: 3 }),
      frameRate: 8,
      repeat: -1
    });

    // 行走动画
    this.anims.create({
      key: 'hero_walk',
      frames: this.anims.generateFrameNumbers('hero', { start: 4, end: 7 }),
      frameRate: 8,
      repeat: -1
    });

    // 攻击动画
    this.anims.create({
      key: 'hero_attack',
      frames: this.anims.generateFrameNumbers('hero', { start: 8, end: 11 }),
      frameRate: 12,
      repeat: 0
    });

    this.player.play('hero_idle');
  }

  /**
   * 创建NPC
   */
  private createNPCs(): void {
    this.npcs = this.add.group();
    const npcData = this.gameDataManager.getAllNPCs();

    npcData.forEach(npcData => {
      const npc = this.add.sprite(
        npcData.position.x * 16,
        npcData.position.y * 16,
        'npc_01'
      );
      npc.setScale(2);
      npc.setData('npcData', npcData);
      npc.setData('dialog', npcData.dialog);
      npc.setData('quests', npcData.quests);
      
      this.npcs.add(npc);
    });
  }

  /**
   * 创建敌人
   */
  private createEnemies(): void {
    this.enemies = this.add.group();
    
    // 创建史莱姆敌人
    for (let i = 0; i < 5; i++) {
      const enemy = this.add.sprite(
        Phaser.Math.Between(100, 700),
        Phaser.Math.Between(100, 500),
        'slime'
      );
      enemy.setScale(2);
      enemy.setData('type', 'slime');
      enemy.setData('health', 30);
      enemy.setData('maxHealth', 30);
      enemy.setData('attack', 8);
      enemy.setData('defense', 2);
      enemy.setData('level', 2);
      
      this.enemies.add(enemy);
    }
  }

  /**
   * 创建物品
   */
  private createItems(): void {
    this.items = this.add.group();
    
    // 创建草药
    for (let i = 0; i < 10; i++) {
      const item = this.add.sprite(
        Phaser.Math.Between(50, 750),
        Phaser.Math.Between(50, 550),
        'herb'
      );
      item.setScale(1.5);
      item.setData('type', 'herb');
      item.setData('itemId', 'herb');
      
      this.items.add(item);
    }

    // 创建金币
    for (let i = 0; i < 5; i++) {
      const coin = this.add.sprite(
        Phaser.Math.Between(50, 750),
        Phaser.Math.Between(50, 550),
        'coin'
      );
      coin.setScale(1.5);
      coin.setData('type', 'coin');
      coin.setData('value', 10);
      
      this.items.add(coin);
    }
  }

  /**
   * 设置输入控制
   */
  private setupInput(): void {
    this.cursors = (this.input.keyboard?.createCursorKeys() || null) as Phaser.Types.Input.Keyboard.CursorKeys;
    this.wasd = (this.input.keyboard?.addKeys('W,S,A,D') || []) as Phaser.Input.Keyboard.Key[];
    this.spaceKey = this.input.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE) || null;
    this.enterKey = this.input.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.ENTER) || null;
  }

  /**
   * 设置相机
   */
  private setupCamera(): void {
    this.cameras.main.startFollow(this.player);
    this.cameras.main.setZoom(2);
  }

  /**
   * 设置UI事件
   */
  private setupUIEvents(): void {
    // 监听UI事件
    window.addEventListener('inventory-update', () => {
      this.updateInventoryUI();
    });

    window.addEventListener('quest-update', () => {
      this.updateQuestUI();
    });
  }

  /**
   * 初始化任务
   */
  private initializeQuests(): void {
    // 自动接受第一个任务
    const firstQuest = this.gameDataManager.getQuest('first_steps');
    if (firstQuest) {
      this.questSystem.acceptQuest(firstQuest);
    }
  }

  /**
   * 处理玩家移动
   */
  private handlePlayerMovement(): void {
    const speed = this.gameState.playerStats.speed;
    let moving = false;

    // 处理方向键输入
    if (this.cursors.left.isDown || this.wasd[2].isDown) {
      this.gridEngine.move('player', 'left');
      moving = true;
    } else if (this.cursors.right.isDown || this.wasd[3].isDown) {
      this.gridEngine.move('player', 'right');
      moving = true;
    } else if (this.cursors.up.isDown || this.wasd[0].isDown) {
      this.gridEngine.move('player', 'up');
      moving = true;
    } else if (this.cursors.down.isDown || this.wasd[1].isDown) {
      this.gridEngine.move('player', 'down');
      moving = true;
    }

    // 播放动画
    if (moving) {
      this.player.play('hero_walk', true);
    } else {
      this.player.play('hero_idle', true);
    }

    // 更新玩家位置
    const position = this.gridEngine.getPosition('player');
    this.gameState.playerPosition = { x: position.x, y: position.y };
  }

  /**
   * 处理玩家动作
   */
  private handlePlayerActions(): void {
    // 空格键交互
    if (this.spaceKey && Phaser.Input.Keyboard.JustDown(this.spaceKey)) {
      this.handleInteraction();
    }

    // 回车键攻击
    if (this.enterKey && Phaser.Input.Keyboard.JustDown(this.enterKey)) {
      this.handleAttack();
    }
  }

  /**
   * 处理交互
   */
  private handleInteraction(): void {
    const playerPos = this.gridEngine.getPosition('player');
    const facingDirection = this.gridEngine.getFacingDirection('player');

    // 计算交互位置
    let interactX = playerPos.x;
    let interactY = playerPos.y;

    switch (facingDirection) {
      case 'up': interactY--; break;
      case 'down': interactY++; break;
      case 'left': interactX--; break;
      case 'right': interactX++; break;
    }

    // 检查NPC交互
    this.npcs.getChildren().forEach((npc: any) => {
      const npcPos = this.gridEngine.getPosition(npc);
      if (npcPos.x === interactX && npcPos.y === interactY) {
        this.interactWithNPC(npc);
        return;
      }
    });

    // 检查物品交互
    this.items.getChildren().forEach((item: any) => {
      const itemX = Math.floor(item.x / 16);
      const itemY = Math.floor(item.y / 16);
      if (itemX === interactX && itemY === interactY) {
        this.interactWithItem(item);
        return;
      }
    });
  }

  /**
   * 与NPC交互
   */
  private interactWithNPC(npc: any): void {
    const npcData = npc.getData('npcData');
    const dialog = npc.getData('dialog');
    const quests = npc.getData('quests');

    // 显示对话
    this.showDialog(npcData.name, dialog[0]);

    // 检查任务
    quests.forEach((questId: string) => {
      const quest = this.gameDataManager.getQuest(questId);
      if (quest) {
        const availableQuests = this.questSystem.getAvailableQuestsForNPC(npcData.id, [quest]);
        if (availableQuests.length > 0) {
          this.showQuestOffer(availableQuests[0]);
        }

        const completableQuests = this.questSystem.getCompletableQuestsForNPC(npcData.id);
        if (completableQuests.length > 0) {
          this.completeQuest(completableQuests[0]);
        }
      }
    });
  }

  /**
   * 与物品交互
   */
  private interactWithItem(item: any): void {
    const itemType = item.getData('type');
    const itemId = item.getData('itemId');

    if (itemType === 'herb' && itemId) {
      const gameItem = this.gameDataManager.getItem(itemId);
      if (gameItem) {
        if (this.inventorySystem.addItem(gameItem)) {
          item.destroy();
          this.showMessage(`获得 ${gameItem.name}`);
          
          // 更新任务进度
          this.questSystem.updateQuestProgress('COLLECT' as keyof typeof QUEST_TYPES, itemId, 1);
        } else {
          this.showMessage('背包已满');
        }
      }
    } else if (itemType === 'coin') {
      const value = item.getData('value');
      this.gameState.playerStats.gold += value;
      item.destroy();
      this.showMessage(`获得 ${value} 金币`);
    }
  }

  /**
   * 处理攻击
   */
  private handleAttack(): void {
    const now = Date.now();
    if (now - this.lastAttackTime < COMBAT_COOLDOWN) {
      return;
    }

    this.player.play('hero_attack');
    this.lastAttackTime = now;

    // 检查攻击范围内的敌人
    const playerPos = this.gridEngine.getPosition('player');
    const facingDirection = this.gridEngine.getFacingDirection('player');

    let attackX = playerPos.x;
    let attackY = playerPos.y;

    switch (facingDirection) {
      case 'up': attackY--; break;
      case 'down': attackY++; break;
      case 'left': attackX--; break;
      case 'right': attackX++; break;
    }

    this.enemies.getChildren().forEach((enemy: any) => {
      const enemyX = Math.floor(enemy.x / 16);
      const enemyY = Math.floor(enemy.y / 16);
      
      if (enemyX === attackX && enemyY === attackY) {
        this.attackEnemy(enemy);
      }
    });
  }

  /**
   * 攻击敌人
   */
  private attackEnemy(enemy: any): void {
    const enemyHealth = enemy.getData('health');
    const damage = Math.max(1, this.gameState.playerStats.attack - enemy.getData('defense'));
    
    enemy.setData('health', enemyHealth - damage);
    
    // 显示伤害数字
    this.showDamageNumber(enemy.x, enemy.y, damage);

    if (enemy.getData('health') <= 0) {
      // 敌人死亡
      const enemyType = enemy.getData('type');
      const enemyLevel = enemy.getData('level');
      
      // 获得经验值和金币
      const experience = enemyLevel * 10;
      const gold = Math.floor(enemyLevel * 5 + Math.random() * 10);
      
      this.gameState.playerStats.experience += experience;
      this.gameState.playerStats.gold += gold;
      
      // 更新任务进度
      this.questSystem.updateQuestProgress('KILL' as keyof typeof QUEST_TYPES, enemyType, 1);
      
      // 生成战利品
      this.generateLoot(enemy.x, enemy.y, enemyLevel);
      
      enemy.destroy();
      this.showMessage(`击败敌人！获得 ${experience} 经验，${gold} 金币`);
      
      // 检查升级
      this.checkLevelUp();
    }
  }

  /**
   * 显示伤害数字
   */
  private showDamageNumber(x: number, y: number, damage: number): void {
    const text = this.add.text(x, y - 20, damage.toString(), {
      fontSize: '16px',
      color: '#ff0000',
      stroke: '#000000',
      strokeThickness: 2
    });
    
    this.tweens.add({
      targets: text,
      y: y - 50,
      alpha: 0,
      duration: 1000,
      onComplete: () => text.destroy()
    });
  }

  /**
   * 生成战利品
   */
  private generateLoot(x: number, y: number, enemyLevel: number): void {
    // 根据敌人等级生成战利品
    if (enemyLevel >= 3 && Math.random() < 0.3) {
      const healthPotion = this.gameDataManager.getItem('health_potion');
      if (healthPotion) {
        const item = this.add.sprite(x, y, 'health_potion');
        item.setScale(1.5);
        item.setData('type', 'health_potion');
        item.setData('itemId', 'health_potion');
        this.items.add(item);
      }
    }
  }

  /**
   * 检查升级
   */
  private checkLevelUp(): void {
    const currentLevel = this.gameState.playerStats.level;
    const experienceNeeded = currentLevel * 100;
    
    if (this.gameState.playerStats.experience >= experienceNeeded) {
      this.gameState.playerStats.level++;
      this.gameState.playerStats.experience -= experienceNeeded;
      this.gameState.playerStats.maxHealth += 20;
      this.gameState.playerStats.health = this.gameState.playerStats.maxHealth;
      this.gameState.playerStats.attack += 2;
      this.gameState.playerStats.defense += 1;
      
      this.showMessage(`升级！等级 ${currentLevel} → ${this.gameState.playerStats.level}`);
    }
  }

  /**
   * 更新敌人
   */
  private updateEnemies(delta: number): void {
    if (this.isInCombat) return;

    this.enemies.getChildren().forEach((enemy: any) => {
      // 简单的敌人AI
      const playerPos = this.gridEngine.getPosition('player');
      const enemyX = Math.floor(enemy.x / 16);
      const enemyY = Math.floor(enemy.y / 16);
      
      const distance = Phaser.Math.Distance.Between(
        playerPos.x, playerPos.y,
        enemyX, enemyY
      );

      if (distance <= ENEMY_DETECTION_RANGE) {
        // 敌人发现玩家，开始追踪
        this.moveEnemyTowardsPlayer(enemy, playerPos);
      }
    });
  }

  /**
   * 敌人向玩家移动
   */
  private moveEnemyTowardsPlayer(enemy: any, playerPos: any): void {
    const enemyX = Math.floor(enemy.x / 16);
    const enemyY = Math.floor(enemy.y / 16);
    
    const dx = playerPos.x - enemyX;
    const dy = playerPos.y - enemyY;
    
    if (Math.abs(dx) > Math.abs(dy)) {
      // 水平移动
      if (dx > 0) {
        enemy.x += 1;
      } else {
        enemy.x -= 1;
      }
    } else {
      // 垂直移动
      if (dy > 0) {
        enemy.y += 1;
      } else {
        enemy.y -= 1;
      }
    }
  }

  /**
   * 检查碰撞
   */
  private checkCollisions(): void {
    // 检查玩家与敌人的碰撞
    this.enemies.getChildren().forEach((enemy: any) => {
      const playerPos = this.gridEngine.getPosition('player');
      const enemyX = Math.floor(enemy.x / 16);
      const enemyY = Math.floor(enemy.y / 16);
      
      if (playerPos.x === enemyX && playerPos.y === enemyY) {
        this.startCombat(enemy);
      }
    });
  }

  /**
   * 开始战斗
   */
  private startCombat(enemy: any): void {
    this.isInCombat = true;
    
    // 创建战斗实体
    const playerEntity: any = {
      id: 'player',
      name: '玩家',
      health: this.gameState.playerStats.health,
      maxHealth: this.gameState.playerStats.maxHealth,
      attack: this.gameState.playerStats.attack,
      defense: this.gameState.playerStats.defense,
      speed: this.gameState.playerStats.speed,
      level: this.gameState.playerStats.level,
      position: this.gridEngine.getPosition('player'),
      isPlayer: true,
      isAlive: true
    };

    const enemyEntity: any = {
      id: 'enemy',
      name: '敌人',
      health: enemy.getData('health'),
      maxHealth: enemy.getData('maxHealth'),
      attack: enemy.getData('attack'),
      defense: enemy.getData('defense'),
      speed: 1,
      level: enemy.getData('level'),
      position: { x: Math.floor(enemy.x / 16), y: Math.floor(enemy.y / 16) },
      isPlayer: false,
      isAlive: true
    };

    this.combatSystem.startCombat(playerEntity, [enemyEntity]);
    this.showMessage('战斗开始！');
  }

  /**
   * 显示对话
   */
  private showDialog(characterName: string, message: string): void {
    const event = new CustomEvent('new-dialog', {
      detail: { characterName, message }
    });
    window.dispatchEvent(event);
  }

  /**
   * 显示任务提供
   */
  private showQuestOffer(quest: any): void {
    this.showMessage(`新任务：${quest.title}`);
  }

  /**
   * 完成任务
   */
  private completeQuest(quest: any): void {
    const rewards = this.questSystem.completeQuest(quest.id);
    if (rewards && typeof rewards === 'object') {
      this.gameState.playerStats.experience += (rewards as any).experience || 0;
      this.gameState.playerStats.gold += (rewards as any).gold || 0;
      
      if ((rewards as any).items) {
        (rewards as any).items.forEach((itemReward: any) => {
          const item = this.gameDataManager.getItem(itemReward.id);
          if (item) {
            this.inventorySystem.addItem(item, itemReward.quantity);
          }
        });
      }
      
      this.showMessage(`任务完成！获得 ${(rewards as any).experience || 0} 经验，${(rewards as any).gold || 0} 金币`);
      this.checkLevelUp();
    }
  }

  /**
   * 显示消息
   */
  private showMessage(message: string): void {
    console.log(message);
    // 这里可以集成到UI系统中显示消息
  }

  /**
   * 更新UI
   */
  private updateUI(): void {
    // 更新状态栏
    const event = new CustomEvent('hero-health', {
      detail: { 
        healthStates: [`${this.gameState.playerStats.health}/${this.gameState.playerStats.maxHealth}`] 
      }
    });
    window.dispatchEvent(event);

    const coinEvent = new CustomEvent('hero-coin', {
      detail: { heroCoins: this.gameState.playerStats.gold }
    });
    window.dispatchEvent(coinEvent);
  }

  /**
   * 更新背包UI
   */
  private updateInventoryUI(): void {
    // 触发背包更新事件
    const event = new CustomEvent('inventory-changed', {
      detail: { inventory: this.inventorySystem.getInventory() }
    });
    window.dispatchEvent(event);
  }

  /**
   * 更新任务UI
   */
  private updateQuestUI(): void {
    // 触发任务更新事件
    const event = new CustomEvent('quest-changed', {
      detail: { quests: this.questSystem.getActiveQuests() }
    });
    window.dispatchEvent(event);
  }

  /**
   * 保存游戏数据
   */
  private saveGameData(): void {
    const saveData = {
      gameState: this.gameState,
      inventory: this.inventorySystem.saveData(),
      quests: this.questSystem.saveData(),
      combat: this.combatSystem.saveData()
    };

    localStorage.setItem('enhanced_game_save', JSON.stringify(saveData));
  }

  /**
   * 加载游戏数据
   */
  private loadGameData(): void {
    const saveData = localStorage.getItem('enhanced_game_save');
    if (saveData) {
      try {
        const data = JSON.parse(saveData);
        this.gameState = data.gameState || this.gameState;
        this.inventorySystem.loadData(data.inventory);
        this.questSystem.loadData(data.quests);
        this.combatSystem.loadData(data.combat);
      } catch (error) {
        console.error('加载存档失败:', error);
      }
    }
  }

  /**
   * 场景关闭时保存数据
   */
  shutdown() {
    this.saveGameData();
  }
}
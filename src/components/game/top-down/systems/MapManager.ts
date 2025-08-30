/**
 * 地图管理系统
 * 负责管理多个地图、传送点和地图切换
 */
export interface MapData {
  key: string;
  name: string;
  tilesetKey: string;
  tilemapKey: string;
  musicKey: string;
  spawnPoint: { x: number; y: number };
  teleportPoints: TeleportPoint[];
  npcs: NPCSpawn[];
  enemies: EnemySpawn[];
  items: ItemSpawn[];
  background: string;
  lighting: 'day' | 'night' | 'cave';
}

export interface TeleportPoint {
  x: number;
  y: number;
  targetMap: string;
  targetX: number;
  targetY: number;
  name: string;
  requiresItem?: string;
  locked?: boolean;
}

export interface NPCSpawn {
  id: string;
  x: number;
  y: number;
  npcType: string;
  facingDirection: 'up' | 'down' | 'left' | 'right';
  movementType: 'static' | 'patrol' | 'random';
  patrolArea?: number;
  dialogueKey?: string;
}

export interface EnemySpawn {
  id: string;
  x: number;
  y: number;
  enemyType: string;
  level: number;
  respawnTime: number;
  patrolArea?: number;
}

export interface ItemSpawn {
  id: string;
  x: number;
  y: number;
  itemType: string;
  respawnTime: number;
  chance: number;
}

export class MapManager {
  private static instance: MapManager;
  private currentMap: string = 'village';
  private maps: Map<string, MapData> = new Map();
  private scene: Phaser.Scene | null = null;
  private onMapChangeCallback?: (fromMap: string, toMap: string) => void;

  private constructor() {
    this.initializeMaps();
  }

  public static getInstance(): MapManager {
    if (!MapManager.instance) {
      MapManager.instance = new MapManager();
    }
    return MapManager.instance;
  }

  /**
   * 初始化地图数据
   */
  private initializeMaps(): void {
    // 村庄地图
    this.maps.set('village', {
      key: 'village',
      name: '宁静村庄',
      tilesetKey: 'tileset',
      tilemapKey: 'home_page_city_house_01',
      musicKey: 'village',
      spawnPoint: { x: 5, y: 6 }, // 修复：使用地图范围内的位置
      background: '#87CEEB',
      lighting: 'day',
      teleportPoints: [
        {
          x: 35,
          y: 15,
          targetMap: 'forest',
          targetX: 5,
          targetY: 15,
          name: '森林入口'
        },
        {
          x: 40,
          y: 45,
          targetMap: 'cave',
          targetX: 8,
          targetY: 8,
          name: '神秘洞穴',
          requiresItem: 'ancient_key',
          locked: true
        }
      ],
      npcs: [
        {
          id: 'village_mayor',
          x: 3,
          y: 3,
          npcType: 'mayor',
          facingDirection: 'down',
          movementType: 'static',
          dialogueKey: 'mayor_greeting'
        },
        {
          id: 'village_merchant',
          x: 7,
          y: 8,
          npcType: 'merchant',
          facingDirection: 'left',
          movementType: 'patrol',
          patrolArea: 3,
          dialogueKey: 'merchant_shop'
        },
        {
          id: 'village_guard',
          x: 2,
          y: 2,
          npcType: 'guard',
          facingDirection: 'right',
          movementType: 'patrol',
          patrolArea: 2,
          dialogueKey: 'guard_info'
        }
      ],
      enemies: [
        {
          id: 'village_slime_1',
          x: 4,
          y: 4,
          enemyType: 'slime',
          level: 1,
          respawnTime: 30000
        },
        {
          id: 'village_slime_2',
          x: 8,
          y: 9,
          enemyType: 'slime',
          level: 1,
          respawnTime: 30000
        }
      ],
      items: [
        {
          id: 'village_herb_1',
          x: 15,
          y: 20,
          itemType: 'herb',
          respawnTime: 60000,
          chance: 0.7
        },
        {
          id: 'village_coin_1',
          x: 30,
          y: 30,
          itemType: 'coin',
          respawnTime: 45000,
          chance: 0.5
        },
        {
          id: 'village_heart_1',
          x: 25,
          y: 40,
          itemType: 'heart',
          respawnTime: 90000,
          chance: 0.3
        }
      ]
    });

    // 森林地图 - 暂时使用村庄地图，因为forest_map.json不存在
    this.maps.set('forest', {
      key: 'forest',
      name: '神秘森林',
      tilesetKey: 'tileset',
      tilemapKey: 'home_page_city', // 暂时使用现有地图
      musicKey: 'forest',
      spawnPoint: { x: 5, y: 15 },
      background: '#228B22',
      lighting: 'day',
      teleportPoints: [
        {
          x: 3,
          y: 12,
          targetMap: 'village',
          targetX: 15,
          targetY: 5,
          name: '返回村庄'
        },
        {
          x: 18,
          y: 8,
          targetMap: 'cave',
          targetX: 8,
          targetY: 8,
          name: '洞穴入口'
        }
      ],
      npcs: [
        {
          id: 'forest_hermit',
          x: 10,
          y: 10,
          npcType: 'hermit',
          facingDirection: 'down',
          movementType: 'static',
          dialogueKey: 'hermit_wisdom'
        }
      ],
      enemies: [
        {
          id: 'forest_slime_1',
          x: 8,
          y: 6,
          enemyType: 'slime',
          level: 2,
          respawnTime: 25000
        },
        {
          id: 'forest_slime_2',
          x: 15,
          y: 12,
          enemyType: 'slime',
          level: 2,
          respawnTime: 25000
        },
        {
          id: 'forest_goblin_1',
          x: 12,
          y: 8,
          enemyType: 'goblin',
          level: 3,
          respawnTime: 40000
        }
      ],
      items: [
        {
          id: 'forest_herb_1',
          x: 6,
          y: 4,
          itemType: 'herb',
          respawnTime: 45000,
          chance: 0.8
        },
        {
          id: 'forest_herb_2',
          x: 16,
          y: 10,
          itemType: 'herb',
          respawnTime: 45000,
          chance: 0.8
        },
        {
          id: 'forest_mushroom_1',
          x: 9,
          y: 14,
          itemType: 'mushroom',
          respawnTime: 60000,
          chance: 0.6
        }
      ]
    });

    // 洞穴地图 - 暂时使用村庄地图，因为cave_map.json不存在
    this.maps.set('cave', {
      key: 'cave',
      name: '神秘洞穴',
      tilesetKey: 'tileset',
      tilemapKey: 'home_page_city', // 暂时使用现有地图
      musicKey: 'cave',
      spawnPoint: { x: 8, y: 8 },
      background: '#2F4F4F',
      lighting: 'cave',
      teleportPoints: [
        {
          x: 6,
          y: 6,
          targetMap: 'village',
          targetX: 25,
          targetY: 20,
          name: '返回村庄'
        },
        {
          x: 15,
          y: 12,
          targetMap: 'forest',
          targetX: 18,
          targetY: 8,
          name: '森林出口'
        }
      ],
      npcs: [
        {
          id: 'cave_miner',
          x: 10,
          y: 10,
          npcType: 'miner',
          facingDirection: 'up',
          movementType: 'patrol',
          patrolArea: 2,
          dialogueKey: 'miner_treasure'
        }
      ],
      enemies: [
        {
          id: 'cave_bat_1',
          x: 12,
          y: 6,
          enemyType: 'bat',
          level: 4,
          respawnTime: 20000
        },
        {
          id: 'cave_bat_2',
          x: 8,
          y: 14,
          enemyType: 'bat',
          level: 4,
          respawnTime: 20000
        },
        {
          id: 'cave_troll_1',
          x: 14,
          y: 10,
          enemyType: 'troll',
          level: 5,
          respawnTime: 60000
        }
      ],
      items: [
        {
          id: 'cave_gem_1',
          x: 11,
          y: 8,
          itemType: 'gem',
          respawnTime: 120000,
          chance: 0.3
        },
        {
          id: 'cave_ore_1',
          x: 13,
          y: 12,
          itemType: 'iron_ore',
          respawnTime: 90000,
          chance: 0.5
        }
      ]
    });
  }

  /**
   * 初始化地图管理器
   */
  public initialize(scene: Phaser.Scene): void {
    this.scene = scene;
    this.loadMapAssets();
  }

  /**
   * 加载地图资源
   */
  private loadMapAssets(): void {
    if (!this.scene) return;

    // 加载瓦片集
    this.scene.load.image('tileset', 'assets/topdown/sprites/maps/tilesets/tileset.png');
    // 暂时只加载现有的地图文件
    this.scene.load.tilemapTiledJSON('home_page_city', 'assets/topdown/sprites/maps/cities/home_page_city.json');
    this.scene.load.tilemapTiledJSON('home_page_city_house_01', 'assets/topdown/sprites/maps/houses/home_page_city_house_01.json');
    this.scene.load.tilemapTiledJSON('home_page_city_house_02', 'assets/topdown/sprites/maps/houses/home_page_city_house_02.json');
    this.scene.load.tilemapTiledJSON('home_page_city_house_03', 'assets/topdown/sprites/maps/houses/home_page_city_house_03.json');
  }

  /**
   * 获取当前地图数据
   */
  public getCurrentMap(): MapData | null {
    return this.maps.get(this.currentMap) || null;
  }

  /**
   * 设置当前地图
   */
  public setCurrentMap(mapKey: string): boolean {
    const targetMap = this.maps.get(mapKey);
    if (!targetMap) {
      console.warn(`Map not found: ${mapKey}`);
      return false;
    }

    this.currentMap = mapKey;
    console.log(`Current map set to: ${mapKey}`);
    return true;
  }

  /**
   * 获取指定地图数据
   */
  public getMap(mapKey: string): MapData | null {
    return this.maps.get(mapKey) || null;
  }

  /**
   * 获取所有地图
   */
  public getAllMaps(): Map<string, MapData> {
    return new Map(this.maps);
  }

  /**
   * 切换地图
   */
  public changeMap(mapKey: string, playerX?: number, playerY?: number): boolean {
    const targetMap = this.maps.get(mapKey);
    if (!targetMap) {
      console.warn(`Map not found: ${mapKey}`);
      return false;
    }

    const fromMap = this.currentMap;
    this.currentMap = mapKey;

    // 触发地图切换回调
    if (this.onMapChangeCallback) {
      this.onMapChangeCallback(fromMap, mapKey);
    }

    console.log(`Map changed from ${fromMap} to ${mapKey}`);
    return true;
  }

  /**
   * 通过传送点切换地图
   */
  public teleportToMap(teleportPoint: TeleportPoint): boolean {
    if (teleportPoint.locked && teleportPoint.requiresItem) {
      console.log(`Teleport point ${teleportPoint.name} is locked. Requires: ${teleportPoint.requiresItem}`);
      return false;
    }

    return this.changeMap(
      teleportPoint.targetMap,
      teleportPoint.targetX,
      teleportPoint.targetY
    );
  }

  /**
   * 检查位置是否有传送点
   */
  public getTeleportPointAt(x: number, y: number): TeleportPoint | null {
    const currentMap = this.getCurrentMap();
    if (!currentMap) return null;

    return currentMap.teleportPoints.find(
      point => point.x === x && point.y === y
    ) || null;
  }

  /**
   * 获取地图的NPC生成点
   */
  public getNPCSpawns(): NPCSpawn[] {
    const currentMap = this.getCurrentMap();
    return currentMap?.npcs || [];
  }

  /**
   * 获取地图的敌人生成点
   */
  public getEnemySpawns(): EnemySpawn[] {
    const currentMap = this.getCurrentMap();
    return currentMap?.enemies || [];
  }

  /**
   * 获取地图的物品生成点
   */
  public getItemSpawns(): ItemSpawn[] {
    const currentMap = this.getCurrentMap();
    return currentMap?.items || [];
  }

  /**
   * 设置地图切换回调
   */
  public onMapChange(callback: (fromMap: string, toMap: string) => void): void {
    this.onMapChangeCallback = callback;
  }

  /**
   * 获取地图的推荐玩家等级
   */
  public getRecommendedLevel(mapKey: string): number {
    const map = this.maps.get(mapKey);
    if (!map) return 1;

    // 根据敌人等级计算推荐等级
    const enemyLevels = map.enemies.map(enemy => enemy.level);
    if (enemyLevels.length === 0) return 1;

    const maxEnemyLevel = Math.max(...enemyLevels);
    return Math.max(1, maxEnemyLevel - 1);
  }

  /**
   * 检查玩家是否可以进入地图
   */
  public canEnterMap(mapKey: string, playerLevel: number): boolean {
    const recommendedLevel = this.getRecommendedLevel(mapKey);
    return playerLevel >= recommendedLevel;
  }

  /**
   * 获取地图的解锁条件
   */
  public getMapUnlockRequirements(mapKey: string): string[] {
    const map = this.maps.get(mapKey);
    if (!map) return [];

    const requirements: string[] = [];

    // 检查传送点解锁条件
    map.teleportPoints.forEach(point => {
      if (point.requiresItem) {
        requirements.push(`需要物品: ${point.requiresItem}`);
      }
    });

    // 检查等级要求
    const recommendedLevel = this.getRecommendedLevel(mapKey);
    if (recommendedLevel > 1) {
      requirements.push(`推荐等级: ${recommendedLevel}`);
    }

    return requirements;
  }

  /**
   * 获取当前地图名称
   */
  public getCurrentMapName(): string {
    const currentMap = this.getCurrentMap();
    return currentMap?.name || '未知地图';
  }

  /**
   * 获取当前地图背景色
   */
  public getCurrentMapBackground(): string {
    const currentMap = this.getCurrentMap();
    return currentMap?.background || '#000000';
  }

  /**
   * 获取当前地图光照类型
   */
  public getCurrentMapLighting(): 'day' | 'night' | 'cave' {
    const currentMap = this.getCurrentMap();
    return currentMap?.lighting || 'day';
  }
}
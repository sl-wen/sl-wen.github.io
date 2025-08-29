import { GameItem, Equipment } from './InventorySystem';
import { Quest } from './QuestSystem';
import { ITEM_TYPES, QUEST_TYPES } from '../ref/constants';

/**
 * 游戏数据管理器
 * 管理游戏中的物品、任务、NPC等静态数据
 */
export class GameDataManager {
  private static instance: GameDataManager;
  private items: Map<string, GameItem>;
  private quests: Map<string, Quest>;
  private npcs: Map<string, any>;

  private constructor() {
    this.items = new Map();
    this.quests = new Map();
    this.npcs = new Map();
    this.initializeGameData();
  }

  public static getInstance(): GameDataManager {
    if (!GameDataManager.instance) {
      GameDataManager.instance = new GameDataManager();
    }
    return GameDataManager.instance;
  }

  /**
   * 初始化游戏数据
   */
  private initializeGameData(): void {
    this.initializeItems();
    this.initializeQuests();
    this.initializeNPCs();
  }

  /**
   * 初始化物品数据
   */
  private initializeItems(): void {
    // 武器
    const weapons: Equipment[] = [
      {
        id: 'wooden_sword',
        name: '木剑',
        description: '一把简单的木制剑，适合初学者使用。',
        type: ITEM_TYPES.WEAPON,
        icon: '⚔️',
        stackable: false,
        maxStack: 1,
        quantity: 1,
        value: 50,
        rarity: 'common',
        slot: 'weapon',
        stats: {
          attack: 5
        }
      },
      {
        id: 'iron_sword',
        name: '铁剑',
        description: '一把锋利的铁剑，比木剑更加强大。',
        type: ITEM_TYPES.WEAPON,
        icon: '🗡️',
        stackable: false,
        maxStack: 1,
        quantity: 1,
        value: 150,
        rarity: 'uncommon',
        slot: 'weapon',
        stats: {
          attack: 12
        }
      },
      {
        id: 'steel_sword',
        name: '钢剑',
        description: '一把精工打造的钢剑，威力强大。',
        type: ITEM_TYPES.WEAPON,
        icon: '⚔️',
        stackable: false,
        maxStack: 1,
        quantity: 1,
        value: 300,
        rarity: 'rare',
        slot: 'weapon',
        stats: {
          attack: 20
        }
      }
    ];

    // 护甲
    const armors: Equipment[] = [
      {
        id: 'leather_armor',
        name: '皮甲',
        description: '用皮革制成的轻便护甲。',
        type: ITEM_TYPES.ARMOR,
        icon: '🛡️',
        stackable: false,
        maxStack: 1,
        quantity: 1,
        value: 80,
        rarity: 'common',
        slot: 'armor',
        stats: {
          defense: 3,
          health: 10
        }
      },
      {
        id: 'iron_armor',
        name: '铁甲',
        description: '坚固的铁制护甲，提供良好的防护。',
        type: ITEM_TYPES.ARMOR,
        icon: '🛡️',
        stackable: false,
        maxStack: 1,
        quantity: 1,
        value: 200,
        rarity: 'uncommon',
        slot: 'armor',
        stats: {
          defense: 8,
          health: 25
        }
      }
    ];

    // 消耗品
    const consumables: GameItem[] = [
      {
        id: 'health_potion',
        name: '生命药水',
        description: '恢复50点生命值。',
        type: ITEM_TYPES.CONSUMABLE,
        icon: '❤️',
        stackable: true,
        maxStack: 10,
        quantity: 1,
        value: 25,
        rarity: 'common',
        effects: [
          {
            type: 'health',
            value: 50
          }
        ]
      },
      {
        id: 'mana_potion',
        name: '魔法药水',
        description: '恢复30点魔法值。',
        type: ITEM_TYPES.CONSUMABLE,
        icon: '🔮',
        stackable: true,
        maxStack: 10,
        quantity: 1,
        value: 30,
        rarity: 'common',
        effects: [
          {
            type: 'health',
            value: 30
          }
        ]
      },
      {
        id: 'strength_potion',
        name: '力量药水',
        description: '临时增加攻击力，持续5分钟。',
        type: ITEM_TYPES.CONSUMABLE,
        icon: '💪',
        stackable: true,
        maxStack: 5,
        quantity: 1,
        value: 50,
        rarity: 'uncommon',
        effects: [
          {
            type: 'damage',
            value: 5,
            duration: 300000 // 5分钟
          }
        ]
      }
    ];

    // 材料
    const materials: GameItem[] = [
      {
        id: 'herb',
        name: '草药',
        description: '常见的草药，可用于制作药水。',
        type: ITEM_TYPES.MATERIAL,
        icon: '🌿',
        stackable: true,
        maxStack: 20,
        quantity: 1,
        value: 5,
        rarity: 'common'
      },
      {
        id: 'iron_ore',
        name: '铁矿',
        description: '铁矿石，可用于锻造武器和护甲。',
        type: ITEM_TYPES.MATERIAL,
        icon: '⛏️',
        stackable: true,
        maxStack: 15,
        quantity: 1,
        value: 15,
        rarity: 'common'
      },
      {
        id: 'gold_ore',
        name: '金矿',
        description: '珍贵的金矿石。',
        type: ITEM_TYPES.MATERIAL,
        icon: '💰',
        stackable: true,
        maxStack: 10,
        quantity: 1,
        value: 50,
        rarity: 'uncommon'
      }
    ];

    // 任务物品
    const questItems: GameItem[] = [
      {
        id: 'ancient_key',
        name: '古老钥匙',
        description: '一把神秘的古老钥匙，似乎能打开某个重要的门。',
        type: ITEM_TYPES.QUEST,
        icon: '🗝️',
        stackable: false,
        maxStack: 1,
        quantity: 1,
        value: 0,
        rarity: 'rare'
      },
      {
        id: 'crystal_shard',
        name: '水晶碎片',
        description: '一块发光的水晶碎片，蕴含着神秘的力量。',
        type: ITEM_TYPES.QUEST,
        icon: '💎',
        stackable: true,
        maxStack: 5,
        quantity: 1,
        value: 0,
        rarity: 'rare'
      }
    ];

    // 将所有物品添加到Map中
    [...weapons, ...armors, ...consumables, ...materials, ...questItems].forEach(item => {
      this.items.set(item.id, item);
    });
  }

  /**
   * 初始化任务数据
   */
  private initializeQuests(): void {
    const quests: Quest[] = [
      {
        id: 'first_steps',
        title: '第一步',
        description: '与村长对话，了解村庄的情况。',
        objectives: [
          {
            id: 'talk_to_mayor',
            type: QUEST_TYPES.TALK,
            target: 'mayor',
            required: 1,
            current: 0,
            description: '与村长对话'
          }
        ],
        rewards: {
          experience: 50,
          gold: 25,
          items: [
            { id: 'wooden_sword', quantity: 1 }
          ]
        },
        status: 'not_started',
        level: 1,
        category: 'main',
        repeatable: false,
        giver: 'mayor',
        turnIn: 'mayor'
      },
      {
        id: 'herb_collection',
        title: '草药收集',
        description: '收集10个草药，用于制作药水。',
        objectives: [
          {
            id: 'collect_herbs',
            type: QUEST_TYPES.COLLECT,
            target: 'herb',
            required: 10,
            current: 0,
            description: '收集草药'
          }
        ],
        rewards: {
          experience: 100,
          gold: 50,
          items: [
            { id: 'health_potion', quantity: 3 }
          ]
        },
        status: 'not_started',
        level: 2,
        category: 'side',
        repeatable: true,
        giver: 'herbalist',
        turnIn: 'herbalist'
      },
      {
        id: 'slime_hunt',
        title: '史莱姆狩猎',
        description: '击败5只史莱姆，保护村庄的安全。',
        objectives: [
          {
            id: 'kill_slimes',
            type: QUEST_TYPES.KILL,
            target: 'slime',
            required: 5,
            current: 0,
            description: '击败史莱姆'
          }
        ],
        rewards: {
          experience: 150,
          gold: 75,
          items: [
            { id: 'leather_armor', quantity: 1 }
          ]
        },
        status: 'not_started',
        level: 3,
        category: 'side',
        repeatable: true,
        giver: 'guard',
        turnIn: 'guard'
      },
      {
        id: 'ancient_ruins',
        title: '古代遗迹',
        description: '探索古代遗迹，寻找神秘的宝藏。',
        objectives: [
          {
            id: 'explore_ruins',
            type: QUEST_TYPES.EXPLORE,
            target: 'ancient_ruins',
            required: 1,
            current: 0,
            description: '探索古代遗迹'
          },
          {
            id: 'find_crystal',
            type: QUEST_TYPES.COLLECT,
            target: 'crystal_shard',
            required: 3,
            current: 0,
            description: '收集水晶碎片'
          }
        ],
        rewards: {
          experience: 300,
          gold: 200,
          items: [
            { id: 'steel_sword', quantity: 1 },
            { id: 'ancient_key', quantity: 1 }
          ]
        },
        status: 'not_started',
        level: 5,
        category: 'main',
        repeatable: false,
        prerequisites: ['first_steps'],
        giver: 'scholar',
        turnIn: 'scholar'
      }
    ];

    quests.forEach(quest => {
      this.quests.set(quest.id, quest);
    });
  }

  /**
   * 初始化NPC数据
   */
  private initializeNPCs(): void {
    const npcs = [
      {
        id: 'mayor',
        name: '村长',
        description: '村庄的领导者，负责管理村庄事务。',
        position: { x: 10, y: 8 },
        dialog: [
          '欢迎来到我们的村庄，勇敢的冒险者！',
          '我们村庄最近遇到了一些麻烦，需要你的帮助。',
          '如果你准备好了，我可以给你一些任务。'
        ],
        quests: ['first_steps']
      },
      {
        id: 'herbalist',
        name: '草药师',
        description: '精通草药学的专家，制作各种药水。',
        position: { x: 15, y: 12 },
        dialog: [
          '你好，年轻的冒险者！',
          '我正在研究新的药水配方，需要一些草药。',
          '如果你能帮我收集一些草药，我会给你丰厚的报酬。'
        ],
        quests: ['herb_collection']
      },
      {
        id: 'guard',
        name: '守卫',
        description: '村庄的守卫，负责保护村民安全。',
        position: { x: 8, y: 15 },
        dialog: [
          '站住！我是村庄的守卫。',
          '最近有史莱姆在村庄附近出没，威胁着村民的安全。',
          '如果你能帮助我们消灭这些怪物，我会给你奖励。'
        ],
        quests: ['slime_hunt']
      },
      {
        id: 'scholar',
        name: '学者',
        description: '博学的学者，研究古代文明的历史。',
        position: { x: 20, y: 5 },
        dialog: [
          '啊，一位对历史感兴趣的冒险者！',
          '我在研究古代遗迹，那里可能隐藏着重要的秘密。',
          '如果你愿意帮助我探索遗迹，我会分享我的发现。'
        ],
        quests: ['ancient_ruins']
      }
    ];

    npcs.forEach(npc => {
      this.npcs.set(npc.id, npc);
    });
  }

  /**
   * 获取物品数据
   * @param itemId - 物品ID
   * @returns 物品数据
   */
  getItem(itemId: string): GameItem | undefined {
    return this.items.get(itemId);
  }

  /**
   * 获取所有物品数据
   * @returns 所有物品数据
   */
  getAllItems(): GameItem[] {
    return Array.from(this.items.values());
  }

  /**
   * 获取任务数据
   * @param questId - 任务ID
   * @returns 任务数据
   */
  getQuest(questId: string): Quest | undefined {
    return this.quests.get(questId);
  }

  /**
   * 获取所有任务数据
   * @returns 所有任务数据
   */
  getAllQuests(): Quest[] {
    return Array.from(this.quests.values());
  }

  /**
   * 获取NPC数据
   * @param npcId - NPC ID
   * @returns NPC数据
   */
  getNPC(npcId: string): any {
    return this.npcs.get(npcId);
  }

  /**
   * 获取所有NPC数据
   * @returns 所有NPC数据
   */
  getAllNPCs(): any[] {
    return Array.from(this.npcs.values());
  }

  /**
   * 根据类型获取物品
   * @param type - 物品类型
   * @returns 指定类型的物品数组
   */
  getItemsByType(type: keyof typeof ITEM_TYPES): GameItem[] {
    return Array.from(this.items.values()).filter(item => item.type === type);
  }

  /**
   * 根据稀有度获取物品
   * @param rarity - 稀有度
   * @returns 指定稀有度的物品数组
   */
  getItemsByRarity(rarity: string): GameItem[] {
    return Array.from(this.items.values()).filter(item => item.rarity === rarity);
  }

  /**
   * 根据等级获取任务
   * @param level - 等级
   * @returns 指定等级的任务数组
   */
  getQuestsByLevel(level: number): Quest[] {
    return Array.from(this.quests.values()).filter(quest => quest.level <= level);
  }

  /**
   * 根据类别获取任务
   * @param category - 任务类别
   * @returns 指定类别的任务数组
   */
  getQuestsByCategory(category: string): Quest[] {
    return Array.from(this.quests.values()).filter(quest => quest.category === category);
  }
}
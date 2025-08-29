/**
 * 商店系统
 * 允许玩家与NPC进行物品交易
 */
export interface ShopItem {
  id: string;
  itemId: string;
  price: number;
  quantity: number; // -1 表示无限
  requiredLevel: number;
  requiredReputation?: number;
  discount?: number; // 折扣百分比 (0-100)
  isSpecial?: boolean; // 特殊商品
}

export interface Shop {
  id: string;
  name: string;
  description: string;
  npcId: string;
  items: ShopItem[];
  buyRate: number; // 收购价格倍率 (0.1-1.0)
  sellRate: number; // 出售价格倍率 (1.0-2.0)
  reputation: number; // 商店声望
  unlockCondition?: string;
  isOpen: boolean;
}

export interface Transaction {
  type: 'buy' | 'sell';
  itemId: string;
  quantity: number;
  price: number;
  totalCost: number;
  timestamp: number;
}

export class ShopSystem {
  private static instance: ShopSystem;
  private shops: Map<string, Shop> = new Map();
  private playerReputation: Map<string, number> = new Map(); // 玩家在各商店的声望
  private transactionHistory: Transaction[] = [];
  private onTransactionCallback?: (transaction: Transaction) => void;

  private constructor() {
    this.initializeShops();
    this.loadPlayerData();
  }

  public static getInstance(): ShopSystem {
    if (!ShopSystem.instance) {
      ShopSystem.instance = new ShopSystem();
    }
    return ShopSystem.instance;
  }

  /**
   * 初始化商店
   */
  private initializeShops(): void {
    // 村庄商人商店
    this.addShop({
      id: 'village_merchant',
      name: '村庄杂货店',
      description: '提供各种基础物品和材料',
      npcId: 'village_merchant',
      buyRate: 0.5,
      sellRate: 1.2,
      reputation: 0,
      isOpen: true,
      items: [
        {
          id: 'merchant_herb',
          itemId: 'herb',
          price: 5,
          quantity: -1,
          requiredLevel: 1
        },
        {
          id: 'merchant_wood',
          itemId: 'wood',
          price: 3,
          quantity: -1,
          requiredLevel: 1
        },
        {
          id: 'merchant_string',
          itemId: 'string',
          price: 2,
          quantity: -1,
          requiredLevel: 1
        },
        {
          id: 'merchant_health_potion',
          itemId: 'health_potion',
          price: 15,
          quantity: 10,
          requiredLevel: 1
        },
        {
          id: 'merchant_leather',
          itemId: 'leather',
          price: 8,
          quantity: 5,
          requiredLevel: 2
        }
      ]
    });

    // 森林隐士商店
    this.addShop({
      id: 'forest_hermit',
      name: '隐士的收藏',
      description: '神秘的隐士出售稀有物品',
      npcId: 'forest_hermit',
      buyRate: 0.7,
      sellRate: 1.5,
      reputation: 0,
      isOpen: true,
      unlockCondition: '完成隐士任务',
      items: [
        {
          id: 'hermit_mushroom',
          itemId: 'mushroom',
          price: 12,
          quantity: 3,
          requiredLevel: 2
        },
        {
          id: 'hermit_gem',
          itemId: 'gem',
          price: 100,
          quantity: 1,
          requiredLevel: 3,
          requiredReputation: 10,
          isSpecial: true
        },
        {
          id: 'hermit_strength_potion',
          itemId: 'strength_potion',
          price: 25,
          quantity: 2,
          requiredLevel: 2
        },
        {
          id: 'hermit_ancient_scroll',
          itemId: 'ancient_scroll',
          price: 50,
          quantity: 1,
          requiredLevel: 4,
          requiredReputation: 20,
          isSpecial: true
        }
      ]
    });

    // 洞穴矿工商店
    this.addShop({
      id: 'cave_miner',
      name: '矿工的宝藏',
      description: '矿工出售各种矿石和工具',
      npcId: 'cave_miner',
      buyRate: 0.6,
      sellRate: 1.3,
      reputation: 0,
      isOpen: true,
      unlockCondition: '完成矿工任务',
      items: [
        {
          id: 'miner_iron_ore',
          itemId: 'iron_ore',
          price: 10,
          quantity: 5,
          requiredLevel: 2
        },
        {
          id: 'miner_coal',
          itemId: 'coal',
          price: 5,
          quantity: 8,
          requiredLevel: 2
        },
        {
          id: 'miner_pickaxe',
          itemId: 'pickaxe',
          price: 30,
          quantity: 2,
          requiredLevel: 2
        },
        {
          id: 'miner_gold_ore',
          itemId: 'gold_ore',
          price: 25,
          quantity: 2,
          requiredLevel: 3,
          requiredReputation: 15
        },
        {
          id: 'miner_diamond',
          itemId: 'diamond',
          price: 200,
          quantity: 1,
          requiredLevel: 5,
          requiredReputation: 30,
          isSpecial: true
        }
      ]
    });
  }

  /**
   * 添加商店
   */
  private addShop(shop: Shop): void {
    this.shops.set(shop.id, shop);
  }

  /**
   * 获取所有商店
   */
  public getAllShops(): Shop[] {
    return Array.from(this.shops.values());
  }

  /**
   * 获取指定商店
   */
  public getShop(shopId: string): Shop | null {
    return this.shops.get(shopId) || null;
  }

  /**
   * 获取NPC的商店
   */
  public getShopByNPC(npcId: string): Shop | null {
    return this.getAllShops().find(shop => shop.npcId === npcId) || null;
  }

  /**
   * 购买物品
   */
  public buyItem(shopId: string, itemId: string, quantity: number, playerGold: number, playerLevel: number): { success: boolean; message: string; cost: number } {
    const shop = this.getShop(shopId);
    if (!shop || !shop.isOpen) {
      return { success: false, message: '商店不存在或已关闭', cost: 0 };
    }

    const shopItem = shop.items.find(item => item.itemId === itemId);
    if (!shopItem) {
      return { success: false, message: '商品不存在', cost: 0 };
    }

    if (playerLevel < shopItem.requiredLevel) {
      return { success: false, message: `需要等级 ${shopItem.requiredLevel}`, cost: 0 };
    }

    if (shopItem.requiredReputation) {
      const playerRep = this.getPlayerReputation(shopId);
      if (playerRep < shopItem.requiredReputation) {
        return { success: false, message: `需要声望 ${shopItem.requiredReputation}`, cost: 0 };
      }
    }

    if (shopItem.quantity !== -1 && shopItem.quantity < quantity) {
      return { success: false, message: '库存不足', cost: 0 };
    }

    const basePrice = shopItem.price * quantity;
    const discount = shopItem.discount || 0;
    const finalPrice = Math.floor(basePrice * (1 - discount / 100) * shop.sellRate);

    if (playerGold < finalPrice) {
      return { success: false, message: '金币不足', cost: finalPrice };
    }

    // 记录交易
    const transaction: Transaction = {
      type: 'buy',
      itemId,
      quantity,
      price: shopItem.price,
      totalCost: finalPrice,
      timestamp: Date.now()
    };

    this.recordTransaction(transaction);

    // 更新库存
    if (shopItem.quantity !== -1) {
      shopItem.quantity -= quantity;
    }

    // 增加声望
    this.addPlayerReputation(shopId, Math.floor(quantity * 0.1));

    return { success: true, message: `成功购买 ${quantity} 个 ${itemId}`, cost: finalPrice };
  }

  /**
   * 出售物品
   */
  public sellItem(shopId: string, itemId: string, quantity: number, playerInventory: any[]): { success: boolean; message: string; earnings: number } {
    const shop = this.getShop(shopId);
    if (!shop || !shop.isOpen) {
      return { success: false, message: '商店不存在或已关闭', earnings: 0 };
    }

    // 检查玩家是否有足够的物品
    const playerItem = playerInventory.find(item => item.id === itemId);
    if (!playerItem || playerItem.quantity < quantity) {
      return { success: false, message: '物品数量不足', earnings: 0 };
    }

    // 计算收购价格（基于物品基础价值）
    const baseValue = this.getItemBaseValue(itemId);
    const earnings = Math.floor(baseValue * quantity * shop.buyRate);

    // 记录交易
    const transaction: Transaction = {
      type: 'sell',
      itemId,
      quantity,
      price: baseValue,
      totalCost: earnings,
      timestamp: Date.now()
    };

    this.recordTransaction(transaction);

    // 增加声望
    this.addPlayerReputation(shopId, Math.floor(quantity * 0.05));

    return { success: true, message: `成功出售 ${quantity} 个 ${itemId}`, earnings };
  }

  /**
   * 获取物品基础价值
   */
  private getItemBaseValue(itemId: string): number {
    const baseValues: { [key: string]: number } = {
      'herb': 3,
      'wood': 2,
      'string': 1,
      'leather': 5,
      'iron_ore': 8,
      'coal': 3,
      'mushroom': 8,
      'gem': 80,
      'gold_ore': 20,
      'diamond': 150,
      'health_potion': 10,
      'strength_potion': 15,
      'pickaxe': 20,
      'wooden_sword': 15,
      'iron_sword': 40,
      'steel_sword': 100,
      'leather_armor': 25,
      'iron_armor': 60,
      'ancient_key': 200,
      'ancient_scroll': 30
    };

    return baseValues[itemId] || 1;
  }

  /**
   * 记录交易
   */
  private recordTransaction(transaction: Transaction): void {
    this.transactionHistory.push(transaction);
    
    // 限制交易历史记录数量
    if (this.transactionHistory.length > 100) {
      this.transactionHistory = this.transactionHistory.slice(-50);
    }

    // 触发回调
    if (this.onTransactionCallback) {
      this.onTransactionCallback(transaction);
    }
  }

  /**
   * 获取玩家在指定商店的声望
   */
  public getPlayerReputation(shopId: string): number {
    return this.playerReputation.get(shopId) || 0;
  }

  /**
   * 增加玩家声望
   */
  public addPlayerReputation(shopId: string, amount: number): void {
    const currentRep = this.getPlayerReputation(shopId);
    this.playerReputation.set(shopId, currentRep + amount);
    this.savePlayerData();
  }

  /**
   * 获取玩家声望等级
   */
  public getReputationLevel(reputation: number): string {
    if (reputation >= 50) return '崇拜';
    if (reputation >= 30) return '尊敬';
    if (reputation >= 15) return '友好';
    if (reputation >= 5) return '中立';
    return '冷淡';
  }

  /**
   * 获取声望等级描述
   */
  public getReputationDescription(reputation: number): string {
    const level = this.getReputationLevel(reputation);
    const descriptions: { [key: string]: string } = {
      '崇拜': '你是商店的贵宾，享受最高折扣',
      '尊敬': '商店老板非常信任你',
      '友好': '商店老板对你很友好',
      '中立': '商店老板对你保持中立态度',
      '冷淡': '商店老板对你有些冷淡'
    };
    return descriptions[level] || '';
  }

  /**
   * 获取交易历史
   */
  public getTransactionHistory(limit: number = 20): Transaction[] {
    return this.transactionHistory.slice(-limit);
  }

  /**
   * 获取商店推荐商品
   */
  public getRecommendedItems(shopId: string, playerLevel: number, playerGold: number): ShopItem[] {
    const shop = this.getShop(shopId);
    if (!shop) return [];

    return shop.items
      .filter(item => 
        item.requiredLevel <= playerLevel &&
        item.price <= playerGold * 2 && // 推荐价格不超过玩家金币的2倍
        item.quantity > 0
      )
      .sort((a, b) => {
        // 特殊商品优先
        if (a.isSpecial && !b.isSpecial) return -1;
        if (!a.isSpecial && b.isSpecial) return 1;
        // 按价格排序
        return a.price - b.price;
      })
      .slice(0, 5); // 最多推荐5个商品
  }

  /**
   * 获取商店折扣信息
   */
  public getShopDiscounts(shopId: string): ShopItem[] {
    const shop = this.getShop(shopId);
    if (!shop) return [];

    return shop.items.filter(item => item.discount && item.discount > 0);
  }

  /**
   * 设置交易回调
   */
  public onTransaction(callback: (transaction: Transaction) => void): void {
    this.onTransactionCallback = callback;
  }

  /**
   * 加载玩家数据
   */
  private loadPlayerData(): void {
    try {
      const saved = localStorage.getItem('game_shop_data');
      if (saved) {
        const data = JSON.parse(saved);
        this.playerReputation = new Map(data.reputation || []);
        this.transactionHistory = data.transactions || [];
      }
    } catch (error) {
      console.warn('Failed to load shop data:', error);
    }
  }

  /**
   * 保存玩家数据
   */
  private savePlayerData(): void {
    try {
      const data = {
        reputation: Array.from(this.playerReputation.entries()),
        transactions: this.transactionHistory.slice(-50) // 只保存最近50笔交易
      };
      localStorage.setItem('game_shop_data', JSON.stringify(data));
    } catch (error) {
      console.warn('Failed to save shop data:', error);
    }
  }

  /**
   * 获取商店统计信息
   */
  public getShopStats(shopId: string): { totalTransactions: number; totalSpent: number; totalEarned: number; reputation: number } {
    const shopTransactions = this.transactionHistory.filter(t => {
      // 这里可以根据需要添加商店标识
      return true; // 暂时统计所有交易
    });

    const buyTransactions = shopTransactions.filter(t => t.type === 'buy');
    const sellTransactions = shopTransactions.filter(t => t.type === 'sell');

    return {
      totalTransactions: shopTransactions.length,
      totalSpent: buyTransactions.reduce((sum, t) => sum + t.totalCost, 0),
      totalEarned: sellTransactions.reduce((sum, t) => sum + t.totalCost, 0),
      reputation: this.getPlayerReputation(shopId)
    };
  }

  /**
   * 检查商店是否解锁
   */
  public isShopUnlocked(shopId: string, playerQuests: any[]): boolean {
    const shop = this.getShop(shopId);
    if (!shop) return false;

    if (!shop.unlockCondition) return true;

    // 检查解锁条件（这里可以根据具体的任务系统进行调整）
    const completedQuests = playerQuests.filter(quest => quest.status === 'completed');
    const hasUnlockQuest = completedQuests.some(quest => 
      quest.id.includes(shop.unlockCondition || '')
    );

    return hasUnlockQuest;
  }
}
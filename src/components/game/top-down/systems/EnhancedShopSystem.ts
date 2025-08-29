/**
 * 增强商店系统
 * 提供高级商店功能，包括动态定价、声誉系统、特殊事件、拍卖、高级交易机制等
 */

import { storage } from '../utils';

// 商店类型
export type ShopType = 'general' | 'weapon' | 'armor' | 'magic' | 'food' | 'crafting' | 'special' | 'black_market' | 'auction';

// 商品类型
export type ItemType = 'weapon' | 'armor' | 'consumable' | 'material' | 'quest' | 'cosmetic' | 'currency' | 'special';

// 商品稀有度
export type ItemRarity = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary' | 'mythic';

// 商品质量
export type ItemQuality = 'broken' | 'damaged' | 'normal' | 'good' | 'excellent' | 'perfect';

// 交易类型
export type TransactionType = 'buy' | 'sell' | 'trade' | 'auction' | 'gift' | 'steal' | 'quest_reward';

// 价格波动类型
export type PriceFluctuationType = 'stable' | 'volatile' | 'trending_up' | 'trending_down' | 'seasonal' | 'event_based';

// 声誉等级
export type ReputationLevel = 'hostile' | 'unfriendly' | 'neutral' | 'friendly' | 'honored' | 'revered' | 'exalted';

// 商店商品
export interface ShopItem {
  id: string;
  name: string;
  description: string;
  type: ItemType;
  rarity: ItemRarity;
  quality: ItemQuality;
  basePrice: number;
  currentPrice: number;
  stock: number;
  maxStock: number;
  restockRate: number; // 每小时补货数量
  lastRestock: number;
  demand: number; // 需求度 (0-100)
  supply: number; // 供应度 (0-100)
  priceHistory: PricePoint[];
  isLimited: boolean;
  isSeasonal: boolean;
  isEvent: boolean;
  requirements: ItemRequirements;
  effects: ItemEffect[];
  tradeable: boolean;
  stackable: boolean;
  maxStack: number;
  weight: number;
  icon: string;
  model: string;
  tags: string[];
  metadata: Record<string, any>;
}

// 价格点
export interface PricePoint {
  timestamp: number;
  price: number;
  volume: number;
  demand: number;
  supply: number;
}

// 商品需求
export interface ItemRequirements {
  level: number;
  reputation: ReputationLevel;
  faction: string[];
  quest: string[];
  currency: Record<string, number>;
  items: Record<string, number>;
  skills: Record<string, number>;
  achievements: string[];
}

// 商品效果
export interface ItemEffect {
  type: string;
  value: number;
  duration: number;
  condition: string;
  chance: number;
}

// 商店配置
export interface ShopConfig {
  id: string;
  name: string;
  description: string;
  type: ShopType;
  location: string;
  npcId: string;
  reputation: number; // 当前声誉值
  reputationLevel: ReputationLevel;
  reputationHistory: ReputationPoint[];
  buyRate: number; // 收购价格倍率
  sellRate: number; // 出售价格倍率
  priceFluctuation: PriceFluctuationType;
  priceVolatility: number; // 价格波动性 (0-1)
  restockInterval: number; // 补货间隔 (分钟)
  maxItems: number; // 最大商品数量
  specialEvents: ShopEvent[];
  discounts: Discount[];
  taxes: Tax[];
  currency: string;
  supportedCurrencies: string[];
  tradingHours: TradingHours;
  isOpen: boolean;
  isAuction: boolean;
  auctionConfig?: AuctionConfig;
  blackMarketConfig?: BlackMarketConfig;
  metadata: Record<string, any>;
}

// 声誉点
export interface ReputationPoint {
  timestamp: number;
  value: number;
  change: number;
  reason: string;
}

// 商店事件
export interface ShopEvent {
  id: string;
  name: string;
  description: string;
  type: 'sale' | 'discount' | 'special_item' | 'reputation_boost' | 'price_crash' | 'stock_overflow';
  startTime: number;
  endTime: number;
  isActive: boolean;
  effects: EventEffect[];
  requirements: EventRequirements;
}

// 事件效果
export interface EventEffect {
  type: 'price_modifier' | 'reputation_boost' | 'stock_boost' | 'discount' | 'special_item';
  value: number;
  target: string; // 目标商品或商店
}

// 事件需求
export interface EventRequirements {
  playerLevel: number;
  reputation: ReputationLevel;
  quests: string[];
  items: Record<string, number>;
}

// 折扣
export interface Discount {
  id: string;
  name: string;
  description: string;
  type: 'percentage' | 'fixed' | 'buy_one_get_one' | 'bulk';
  value: number;
  minQuantity: number;
  maxQuantity: number;
  applicableItems: string[];
  startTime: number;
  endTime: number;
  isActive: boolean;
  usageCount: number;
  maxUsage: number;
}

// 税收
export interface Tax {
  id: string;
  name: string;
  type: 'sales_tax' | 'import_tax' | 'luxury_tax' | 'black_market_tax';
  rate: number;
  applicableItems: string[];
  minAmount: number;
  maxAmount: number;
}

// 交易时间
export interface TradingHours {
  openTime: string; // HH:MM
  closeTime: string; // HH:MM
  daysOpen: number[]; // 0-6 (周日-周六)
  isAlwaysOpen: boolean;
  timezone: string;
}

// 拍卖配置
export interface AuctionConfig {
  enabled: boolean;
  duration: number; // 拍卖持续时间 (分钟)
  minBid: number;
  bidIncrement: number;
  autoExtend: boolean;
  extendTime: number; // 自动延长时间 (分钟)
  commission: number; // 佣金比例
  featuredItems: string[];
}

// 黑市配置
export interface BlackMarketConfig {
  enabled: boolean;
  reputationRequired: ReputationLevel;
  riskLevel: number; // 风险等级 (0-100)
  guardPatrol: boolean;
  escapeRoutes: string[];
  illegalItems: string[];
  bribeCost: number;
}

// 交易记录
export interface Transaction {
  id: string;
  shopId: string;
  playerId: string;
  type: TransactionType;
  itemId: string;
  quantity: number;
  price: number;
  totalAmount: number;
  currency: string;
  timestamp: number;
  reputationChange: number;
  metadata: Record<string, any>;
}

// 拍卖
export interface Auction {
  id: string;
  shopId: string;
  itemId: string;
  sellerId: string;
  startPrice: number;
  currentPrice: number;
  minBid: number;
  startTime: number;
  endTime: number;
  isActive: boolean;
  bids: Bid[];
  winnerId?: string;
  commission: number;
}

// 竞标
export interface Bid {
  id: string;
  bidderId: string;
  amount: number;
  timestamp: number;
}

// 商店统计
export interface ShopStats {
  totalTransactions: number;
  totalRevenue: number;
  totalItemsSold: number;
  averageTransactionValue: number;
  mostPopularItems: string[];
  reputationTrend: number;
  customerSatisfaction: number;
  profitMargin: number;
  restockFrequency: number;
  eventParticipation: number;
}

// 商店事件类型
export interface ShopEventType {
  type: 'item_purchased' | 'item_sold' | 'price_changed' | 'stock_updated' | 'reputation_changed' | 'event_started' | 'event_ended' | 'auction_started' | 'auction_ended' | 'discount_applied' | 'custom';
  data?: any;
  timestamp: number;
}

export class EnhancedShopSystem {
  private static instance: EnhancedShopSystem;
  private scene: Phaser.Scene | null = null;
  
  // 数据存储
  private shops: Map<string, ShopConfig> = new Map();
  private items: Map<string, ShopItem> = new Map();
  private transactions: Transaction[] = [];
  private auctions: Map<string, Auction> = new Map();
  private events: ShopEventType[] = [];
  private callbacks: Map<string, (data: any) => void> = new Map();
  
  // 配置
  private config = {
    maxPriceHistory: 100,
    priceUpdateInterval: 60000, // 1分钟
    restockCheckInterval: 300000, // 5分钟
    eventCheckInterval: 60000, // 1分钟
    auctionCheckInterval: 30000, // 30秒
    maxTransactions: 1000,
    maxEvents: 100
  };
  
  // 统计
  private stats: ShopStats = {
    totalTransactions: 0,
    totalRevenue: 0,
    totalItemsSold: 0,
    averageTransactionValue: 0,
    mostPopularItems: [],
    reputationTrend: 0,
    customerSatisfaction: 0,
    profitMargin: 0,
    restockFrequency: 0,
    eventParticipation: 0
  };

  private constructor() {
    this.initializeDefaultShops();
    this.initializeDefaultItems();
    this.startTimers();
  }

  public static getInstance(): EnhancedShopSystem {
    if (!EnhancedShopSystem.instance) {
      EnhancedShopSystem.instance = new EnhancedShopSystem();
    }
    return EnhancedShopSystem.instance;
  }

  /**
   * 初始化增强商店系统
   */
  public initialize(scene: Phaser.Scene): void {
    this.scene = scene;
    this.setupEventHandlers();
    console.log('增强商店系统已初始化');
  }

  /**
   * 初始化默认商店
   */
  private initializeDefaultShops(): void {
    // 村庄商人
    this.addShop({
      id: 'village_merchant',
      name: '村庄商人',
      description: '提供基础商品和服务的友好商人',
      type: 'general',
      location: 'village_center',
      npcId: 'village_merchant',
      reputation: 0,
      reputationLevel: 'neutral',
      reputationHistory: [],
      buyRate: 0.5,
      sellRate: 1.2,
      priceFluctuation: 'stable',
      priceVolatility: 0.1,
      restockInterval: 60,
      maxItems: 20,
      specialEvents: [],
      discounts: [],
      taxes: [],
      currency: 'gold',
      supportedCurrencies: ['gold', 'silver'],
      tradingHours: {
        openTime: '06:00',
        closeTime: '22:00',
        daysOpen: [0, 1, 2, 3, 4, 5, 6],
        isAlwaysOpen: false,
        timezone: 'local'
      },
      isOpen: true,
      isAuction: false,
      metadata: {}
    });

    // 武器商人
    this.addShop({
      id: 'weapon_smith',
      name: '武器铁匠',
      description: '专门制作和销售各种武器的铁匠铺',
      type: 'weapon',
      location: 'village_smithy',
      npcId: 'weapon_smith',
      reputation: 0,
      reputationLevel: 'neutral',
      reputationHistory: [],
      buyRate: 0.6,
      sellRate: 1.4,
      priceFluctuation: 'trending_up',
      priceVolatility: 0.2,
      restockInterval: 120,
      maxItems: 15,
      specialEvents: [],
      discounts: [],
      taxes: [],
      currency: 'gold',
      supportedCurrencies: ['gold'],
      tradingHours: {
        openTime: '08:00',
        closeTime: '20:00',
        daysOpen: [1, 2, 3, 4, 5, 6],
        isAlwaysOpen: false,
        timezone: 'local'
      },
      isOpen: true,
      isAuction: false,
      metadata: {}
    });

    // 魔法商店
    this.addShop({
      id: 'magic_shop',
      name: '魔法商店',
      description: '销售各种魔法物品和卷轴的神秘商店',
      type: 'magic',
      location: 'village_magic',
      npcId: 'magic_vendor',
      reputation: 0,
      reputationLevel: 'neutral',
      reputationHistory: [],
      buyRate: 0.7,
      sellRate: 1.6,
      priceFluctuation: 'volatile',
      priceVolatility: 0.4,
      restockInterval: 180,
      maxItems: 12,
      specialEvents: [],
      discounts: [],
      taxes: [],
      currency: 'gold',
      supportedCurrencies: ['gold', 'magic_crystal'],
      tradingHours: {
        openTime: '10:00',
        closeTime: '18:00',
        daysOpen: [1, 2, 3, 4, 5],
        isAlwaysOpen: false,
        timezone: 'local'
      },
      isOpen: true,
      isAuction: false,
      metadata: {}
    });

    // 拍卖行
    this.addShop({
      id: 'auction_house',
      name: '拍卖行',
      description: '玩家可以拍卖和竞标稀有物品的地方',
      type: 'auction',
      location: 'city_center',
      npcId: 'auction_master',
      reputation: 0,
      reputationLevel: 'neutral',
      reputationHistory: [],
      buyRate: 0.8,
      sellRate: 1.0,
      priceFluctuation: 'volatile',
      priceVolatility: 0.6,
      restockInterval: 0,
      maxItems: 50,
      specialEvents: [],
      discounts: [],
      taxes: [],
      currency: 'gold',
      supportedCurrencies: ['gold'],
      tradingHours: {
        openTime: '00:00',
        closeTime: '23:59',
        daysOpen: [0, 1, 2, 3, 4, 5, 6],
        isAlwaysOpen: true,
        timezone: 'local'
      },
      isOpen: true,
      isAuction: true,
      auctionConfig: {
        enabled: true,
        duration: 1440, // 24小时
        minBid: 1,
        bidIncrement: 1,
        autoExtend: true,
        extendTime: 5,
        commission: 0.05,
        featuredItems: []
      },
      metadata: {}
    });

    // 黑市
    this.addShop({
      id: 'black_market',
      name: '黑市',
      description: '销售违禁品和稀有物品的秘密市场',
      type: 'black_market',
      location: 'city_underground',
      npcId: 'black_market_dealer',
      reputation: -100,
      reputationLevel: 'hostile',
      reputationHistory: [],
      buyRate: 0.3,
      sellRate: 2.0,
      priceFluctuation: 'volatile',
      priceVolatility: 0.8,
      restockInterval: 240,
      maxItems: 8,
      specialEvents: [],
      discounts: [],
      taxes: [],
      currency: 'gold',
      supportedCurrencies: ['gold', 'black_market_token'],
      tradingHours: {
        openTime: '20:00',
        closeTime: '04:00',
        daysOpen: [0, 1, 2, 3, 4, 5, 6],
        isAlwaysOpen: false,
        timezone: 'local'
      },
      isOpen: true,
      isAuction: false,
      blackMarketConfig: {
        enabled: true,
        reputationRequired: 'unfriendly',
        riskLevel: 80,
        guardPatrol: true,
        escapeRoutes: ['sewer', 'rooftop', 'back_alley'],
        illegalItems: ['stolen_goods', 'contraband', 'forbidden_magic'],
        bribeCost: 100
      },
      metadata: {}
    });
  }

  /**
   * 初始化默认商品
   */
  private initializeDefaultItems(): void {
    // 基础商品
    this.addItem({
      id: 'health_potion',
      name: '生命药水',
      description: '恢复生命值的药水',
      type: 'consumable',
      rarity: 'common',
      quality: 'normal',
      basePrice: 20,
      currentPrice: 20,
      stock: 50,
      maxStock: 100,
      restockRate: 5,
      lastRestock: Date.now(),
      demand: 70,
      supply: 80,
      priceHistory: [],
      isLimited: false,
      isSeasonal: false,
      isEvent: false,
      requirements: { level: 1, reputation: 'neutral', faction: [], quest: [], currency: {}, items: {}, skills: {}, achievements: [] },
      effects: [{ type: 'heal', value: 50, duration: 0, condition: '', chance: 100 }],
      tradeable: true,
      stackable: true,
      maxStack: 99,
      weight: 0.5,
      icon: 'health_potion',
      model: 'health_potion',
      tags: ['potion', 'healing', 'consumable'],
      metadata: {}
    });

    // 武器
    this.addItem({
      id: 'iron_sword',
      name: '铁剑',
      description: '坚固的铁制长剑',
      type: 'weapon',
      rarity: 'common',
      quality: 'normal',
      basePrice: 100,
      currentPrice: 100,
      stock: 10,
      maxStock: 20,
      restockRate: 1,
      lastRestock: Date.now(),
      demand: 60,
      supply: 70,
      priceHistory: [],
      isLimited: false,
      isSeasonal: false,
      isEvent: false,
      requirements: { level: 5, reputation: 'neutral', faction: [], quest: [], currency: {}, items: {}, skills: {}, achievements: [] },
      effects: [{ type: 'damage', value: 15, duration: 0, condition: '', chance: 100 }],
      tradeable: true,
      stackable: false,
      maxStack: 1,
      weight: 3.0,
      icon: 'iron_sword',
      model: 'iron_sword',
      tags: ['weapon', 'sword', 'melee'],
      metadata: {}
    });

    // 魔法物品
    this.addItem({
      id: 'fire_scroll',
      name: '火球术卷轴',
      description: '释放火球术的魔法卷轴',
      type: 'magic' as any,
      rarity: 'uncommon',
      quality: 'normal',
      basePrice: 150,
      currentPrice: 150,
      stock: 5,
      maxStock: 10,
      restockRate: 1,
      lastRestock: Date.now(),
      demand: 40,
      supply: 50,
      priceHistory: [],
      isLimited: false,
      isSeasonal: false,
      isEvent: false,
      requirements: { level: 10, reputation: 'friendly', faction: [], quest: [], currency: {}, items: {}, skills: { magic: 5 }, achievements: [] },
      effects: [{ type: 'fire_damage', value: 30, duration: 0, condition: '', chance: 100 }],
      tradeable: true,
      stackable: true,
      maxStack: 10,
      weight: 0.2,
      icon: 'fire_scroll',
      model: 'fire_scroll',
      tags: ['magic', 'scroll', 'fire'],
      metadata: {}
    });
  }

  /**
   * 设置事件处理器
   */
  private setupEventHandlers(): void {
    // 监听游戏事件
    if (this.scene) {
      this.scene.events.on('shop-interaction', this.handleShopInteraction, this);
      this.scene.events.on('item-purchased', this.handleItemPurchased, this);
      this.scene.events.on('item-sold', this.handleItemSold, this);
    }
  }

  /**
   * 开始定时器
   */
  private startTimers(): void {
    // 价格更新定时器
    setInterval(() => {
      this.updatePrices();
    }, this.config.priceUpdateInterval);

    // 补货检查定时器
    setInterval(() => {
      this.checkRestock();
    }, this.config.restockCheckInterval);

    // 事件检查定时器
    setInterval(() => {
      this.checkEvents();
    }, this.config.eventCheckInterval);

    // 拍卖检查定时器
    setInterval(() => {
      this.checkAuctions();
    }, this.config.auctionCheckInterval);
  }

  /**
   * 添加商店
   */
  public addShop(shop: ShopConfig): void {
    this.shops.set(shop.id, shop);
    this.addEvent('custom', { shopId: shop.id, shop });
  }

  /**
   * 获取商店
   */
  public getShop(shopId: string): ShopConfig | undefined {
    return this.shops.get(shopId);
  }

  /**
   * 获取所有商店
   */
  public getAllShops(): ShopConfig[] {
    return Array.from(this.shops.values());
  }

  /**
   * 添加商品
   */
  public addItem(item: ShopItem): void {
    this.items.set(item.id, item);
    this.addEvent('custom', { itemId: item.id, item });
  }

  /**
   * 获取商品
   */
  public getItem(itemId: string): ShopItem | undefined {
    return this.items.get(itemId);
  }

  /**
   * 获取所有商品
   */
  public getAllItems(): ShopItem[] {
    return Array.from(this.items.values());
  }

  /**
   * 购买商品
   */
  public buyItem(shopId: string, itemId: string, quantity: number, playerData?: any): boolean {
    const shop = this.getShop(shopId);
    const item = this.getItem(itemId);
    
    if (!shop || !item || !this.isShopOpen(shop)) {
      return false;
    }

    // 检查库存
    if (item.stock < quantity) {
      return false;
    }

    // 计算价格
    const price = this.calculatePrice(shop, item, 'buy', quantity);
    const totalCost = price * quantity;

    // 检查玩家货币
    if (playerData && playerData.currency && playerData.currency[shop.currency] < totalCost) {
      return false;
    }

    // 检查需求
    if (!this.checkRequirements(item.requirements, playerData)) {
      return false;
    }

    // 执行交易
    if (playerData) {
      playerData.currency[shop.currency] -= totalCost;
      this.addPlayerItem(itemId, quantity, playerData);
    }

    // 更新库存
    item.stock -= quantity;
    item.demand += 5; // 增加需求
    item.supply -= 5; // 减少供应

    // 记录交易
    const transaction: Transaction = {
      id: this.generateTransactionId(),
      shopId,
      playerId: playerData?.id || 'unknown',
      type: 'buy',
      itemId,
      quantity,
      price,
      totalAmount: totalCost,
      currency: shop.currency,
      timestamp: Date.now(),
      reputationChange: 1,
      metadata: {}
    };

    this.transactions.push(transaction);
    this.updateStats(transaction);

    // 更新声誉
    this.updateReputation(shop, 1);

    this.addEvent('item_purchased', { transaction, shop, item });
    return true;
  }

  /**
   * 出售商品
   */
  public sellItem(shopId: string, itemId: string, quantity: number, playerData?: any): boolean {
    const shop = this.getShop(shopId);
    const item = this.getItem(itemId);
    
    if (!shop || !item || !this.isShopOpen(shop)) {
      return false;
    }

    // 检查玩家物品
    if (playerData && !this.hasPlayerItem(itemId, quantity, playerData)) {
      return false;
    }

    // 计算价格
    const price = this.calculatePrice(shop, item, 'sell', quantity);
    const totalEarnings = price * quantity;

    // 执行交易
    if (playerData) {
      playerData.currency[shop.currency] += totalEarnings;
      this.removePlayerItem(itemId, quantity, playerData);
    }

    // 更新库存
    item.stock += quantity;
    item.demand -= 3; // 减少需求
    item.supply += 3; // 增加供应

    // 记录交易
    const transaction: Transaction = {
      id: this.generateTransactionId(),
      shopId,
      playerId: playerData?.id || 'unknown',
      type: 'sell',
      itemId,
      quantity,
      price,
      totalAmount: totalEarnings,
      currency: shop.currency,
      timestamp: Date.now(),
      reputationChange: 0.5,
      metadata: {}
    };

    this.transactions.push(transaction);
    this.updateStats(transaction);

    // 更新声誉
    this.updateReputation(shop, 0.5);

    this.addEvent('item_sold', { transaction, shop, item });
    return true;
  }

  /**
   * 计算价格
   */
  private calculatePrice(shop: ShopConfig, item: ShopItem, type: 'buy' | 'sell', quantity: number): number {
    let basePrice = item.currentPrice;

    // 应用商店倍率
    if (type === 'buy') {
      basePrice *= shop.buyRate;
    } else {
      basePrice *= shop.sellRate;
    }

    // 应用声誉折扣
    const reputationDiscount = this.getReputationDiscount(shop.reputationLevel);
    basePrice *= (1 - reputationDiscount);

    // 应用活动折扣
    const eventDiscount = this.getEventDiscount(shop, item);
    basePrice *= (1 - eventDiscount);

    // 应用批量折扣
    const bulkDiscount = this.getBulkDiscount(shop, item, quantity);
    basePrice *= (1 - bulkDiscount);

    // 应用税收
    const tax = this.calculateTax(shop, item, basePrice * quantity);
    basePrice += tax / quantity;

    return Math.max(1, Math.round(basePrice));
  }

  /**
   * 获取声誉折扣
   */
  private getReputationDiscount(level: ReputationLevel): number {
    const discounts = {
      'hostile': 0,
      'unfriendly': 0,
      'neutral': 0,
      'friendly': 0.05,
      'honored': 0.10,
      'revered': 0.15,
      'exalted': 0.20
    };
    return discounts[level] || 0;
  }

  /**
   * 获取活动折扣
   */
  private getEventDiscount(shop: ShopConfig, item: ShopItem): number {
    let totalDiscount = 0;
    
    for (const event of shop.specialEvents) {
      if (event.isActive && event.effects) {
        for (const effect of event.effects) {
          if (effect.type === 'discount' && (effect.target === item.id || effect.target === 'all')) {
            totalDiscount += effect.value;
          }
        }
      }
    }
    
    return Math.min(0.5, totalDiscount); // 最大50%折扣
  }

  /**
   * 获取批量折扣
   */
  private getBulkDiscount(shop: ShopConfig, item: ShopItem, quantity: number): number {
    for (const discount of shop.discounts) {
      if (discount.isActive && 
          quantity >= discount.minQuantity && 
          quantity <= discount.maxQuantity &&
          (discount.applicableItems.includes(item.id) || discount.applicableItems.includes('all'))) {
        return discount.value;
      }
    }
    return 0;
  }

  /**
   * 计算税收
   */
  private calculateTax(shop: ShopConfig, item: ShopItem, amount: number): number {
    let totalTax = 0;
    
    for (const tax of shop.taxes) {
      if (amount >= tax.minAmount && amount <= tax.maxAmount &&
          (tax.applicableItems.includes(item.id) || tax.applicableItems.includes('all'))) {
        totalTax += amount * tax.rate;
      }
    }
    
    return totalTax;
  }

  /**
   * 检查商店是否开放
   */
  private isShopOpen(shop: ShopConfig): boolean {
    if (!shop.isOpen) return false;
    if (shop.tradingHours.isAlwaysOpen) return true;

    const now = new Date();
    const currentTime = now.getHours() * 60 + now.getMinutes();
    const openTime = this.parseTime(shop.tradingHours.openTime);
    const closeTime = this.parseTime(shop.tradingHours.closeTime);
    const currentDay = now.getDay();

    return shop.tradingHours.daysOpen.includes(currentDay) &&
           currentTime >= openTime && currentTime <= closeTime;
  }

  /**
   * 解析时间字符串
   */
  private parseTime(timeStr: string): number {
    const [hours, minutes] = timeStr.split(':').map(Number);
    return hours * 60 + minutes;
  }

  /**
   * 检查需求
   */
  private checkRequirements(requirements: ItemRequirements, playerData?: any): boolean {
    if (!playerData) return true;

    // 检查等级
    if (playerData.level < requirements.level) return false;

    // 检查声誉
    if (playerData.reputation && playerData.reputation < this.getReputationValue(requirements.reputation)) {
      return false;
    }

    // 检查货币
    for (const [currency, amount] of Object.entries(requirements.currency)) {
      if (!playerData.currency || playerData.currency[currency] < amount) {
        return false;
      }
    }

    // 检查物品
    for (const [itemId, amount] of Object.entries(requirements.items)) {
      if (!this.hasPlayerItem(itemId, amount, playerData)) {
        return false;
      }
    }

    return true;
  }

  /**
   * 获取声誉值
   */
  private getReputationValue(level: ReputationLevel): number {
    const values = {
      'hostile': -100,
      'unfriendly': -50,
      'neutral': 0,
      'friendly': 50,
      'honored': 100,
      'revered': 200,
      'exalted': 300
    };
    return values[level] || 0;
  }

  /**
   * 检查玩家是否有物品
   */
  private hasPlayerItem(itemId: string, quantity: number, playerData: any): boolean {
    if (!playerData.inventory) return false;
    
    const item = playerData.inventory.find((item: any) => item.id === itemId);
    return item && item.quantity >= quantity;
  }

  /**
   * 添加玩家物品
   */
  private addPlayerItem(itemId: string, quantity: number, playerData: any): void {
    if (!playerData.inventory) playerData.inventory = [];
    
    const existingItem = playerData.inventory.find((item: any) => item.id === itemId);
    if (existingItem) {
      existingItem.quantity += quantity;
    } else {
      playerData.inventory.push({ id: itemId, quantity });
    }
  }

  /**
   * 移除玩家物品
   */
  private removePlayerItem(itemId: string, quantity: number, playerData: any): void {
    if (!playerData.inventory) return;
    
    const item = playerData.inventory.find((item: any) => item.id === itemId);
    if (item) {
      item.quantity -= quantity;
      if (item.quantity <= 0) {
        const index = playerData.inventory.indexOf(item);
        playerData.inventory.splice(index, 1);
      }
    }
  }

  /**
   * 更新价格
   */
  private updatePrices(): void {
    for (const item of Array.from(this.items.values())) {
      const oldPrice = item.currentPrice;
      
      // 基于供需调整价格
      const demandFactor = item.demand / 100;
      const supplyFactor = item.supply / 100;
      const priceChange = (demandFactor - supplyFactor) * 0.1;
      
      item.currentPrice = Math.max(1, Math.round(item.basePrice * (1 + priceChange)));
      
      // 记录价格历史
      const pricePoint: PricePoint = {
        timestamp: Date.now(),
        price: item.currentPrice,
        volume: 0,
        demand: item.demand,
        supply: item.supply
      };
      
      item.priceHistory.push(pricePoint);
      if (item.priceHistory.length > this.config.maxPriceHistory) {
        item.priceHistory.shift();
      }
      
      // 重置供需
      item.demand = Math.max(0, item.demand - 1);
      item.supply = Math.min(100, item.supply + 1);
      
      if (oldPrice !== item.currentPrice) {
        this.addEvent('price_changed', { itemId: item.id, oldPrice, newPrice: item.currentPrice });
      }
    }
  }

  /**
   * 检查补货
   */
  private checkRestock(): void {
    const now = Date.now();
    
    for (const item of Array.from(this.items.values())) {
      if (item.stock < item.maxStock) {
        const timeSinceRestock = now - item.lastRestock;
        const restockTime = item.restockRate * 60 * 60 * 1000; // 转换为毫秒
        
        if (timeSinceRestock >= restockTime) {
          const restockAmount = Math.min(
            item.restockRate,
            item.maxStock - item.stock
          );
          
          item.stock += restockAmount;
          item.lastRestock = now;
          item.supply += restockAmount;
          
          this.addEvent('stock_updated', { itemId: item.id, restockAmount, newStock: item.stock });
        }
      }
    }
  }

  /**
   * 检查事件
   */
  private checkEvents(): void {
    const now = Date.now();
    
    for (const shop of this.shops.values()) {
      for (const event of shop.specialEvents) {
        // 检查事件开始
        if (!event.isActive && now >= event.startTime && now <= event.endTime) {
          event.isActive = true;
          this.addEvent('event_started', { shopId: shop.id, event });
        }
        
        // 检查事件结束
        if (event.isActive && now > event.endTime) {
          event.isActive = false;
          this.addEvent('event_ended', { shopId: shop.id, event });
        }
      }
    }
  }

  /**
   * 检查拍卖
   */
  private checkAuctions(): void {
    const now = Date.now();
    
    for (const auction of this.auctions.values()) {
      if (auction.isActive && now >= auction.endTime) {
        this.endAuction(auction.id);
      }
    }
  }

  /**
   * 创建拍卖
   */
  public createAuction(shopId: string, itemId: string, sellerId: string, startPrice: number, duration: number = 1440): string {
    const shop = this.getShop(shopId);
    if (!shop || !shop.isAuction || !shop.auctionConfig) {
      throw new Error('商店不支持拍卖');
    }

    const auction: Auction = {
      id: this.generateAuctionId(),
      shopId,
      itemId,
      sellerId,
      startPrice,
      currentPrice: startPrice,
      minBid: Math.max(shop.auctionConfig.minBid, startPrice),
      startTime: Date.now(),
      endTime: Date.now() + duration * 60 * 1000,
      isActive: true,
      bids: [],
      commission: shop.auctionConfig.commission
    };

    this.auctions.set(auction.id, auction);
    this.addEvent('auction_started', { auction });
    
    return auction.id;
  }

  /**
   * 竞标
   */
  public placeBid(auctionId: string, bidderId: string, amount: number): boolean {
    const auction = this.auctions.get(auctionId);
    if (!auction || !auction.isActive) {
      return false;
    }

    if (amount <= auction.currentPrice) {
      return false;
    }

    const bid: Bid = {
      id: this.generateBidId(),
      bidderId,
      amount,
      timestamp: Date.now()
    };

    auction.bids.push(bid);
    auction.currentPrice = amount;

    this.addEvent('bid_placed', { auctionId, bid });
    return true;
  }

  /**
   * 结束拍卖
   */
  private endAuction(auctionId: string): void {
    const auction = this.auctions.get(auctionId);
    if (!auction) return;

    auction.isActive = false;

    if (auction.bids.length > 0) {
      const winningBid = auction.bids[auction.bids.length - 1];
      auction.winnerId = winningBid.bidderId;
      
      // 处理交易
      const commission = winningBid.amount * auction.commission;
      const sellerEarnings = winningBid.amount - commission;
      
      this.addEvent('auction_ended', { 
        auction, 
        winner: winningBid.bidderId, 
        finalPrice: winningBid.amount,
        commission,
        sellerEarnings
      });
    } else {
      this.addEvent('auction_ended', { auction, winner: null });
    }
  }

  /**
   * 更新声誉
   */
  private updateReputation(shop: ShopConfig, change: number): void {
    const oldLevel = shop.reputationLevel;
    shop.reputation += change;
    
    // 更新声誉等级
    if (shop.reputation >= 300) shop.reputationLevel = 'exalted';
    else if (shop.reputation >= 200) shop.reputationLevel = 'revered';
    else if (shop.reputation >= 100) shop.reputationLevel = 'honored';
    else if (shop.reputation >= 50) shop.reputationLevel = 'friendly';
    else if (shop.reputation >= 0) shop.reputationLevel = 'neutral';
    else if (shop.reputation >= -50) shop.reputationLevel = 'unfriendly';
    else shop.reputationLevel = 'hostile';

    // 记录声誉历史
    const reputationPoint: ReputationPoint = {
      timestamp: Date.now(),
      value: shop.reputation,
      change,
      reason: 'transaction'
    };
    
    shop.reputationHistory.push(reputationPoint);
    if (shop.reputationHistory.length > 100) {
      shop.reputationHistory.shift();
    }

    if (oldLevel !== shop.reputationLevel) {
      this.addEvent('reputation_changed', { 
        shopId: shop.id, 
        oldLevel, 
        newLevel: shop.reputationLevel,
        reputation: shop.reputation 
      });
    }
  }

  /**
   * 更新统计
   */
  private updateStats(transaction: Transaction): void {
    this.stats.totalTransactions++;
    this.stats.totalRevenue += transaction.totalAmount;
    this.stats.totalItemsSold += transaction.quantity;
    this.stats.averageTransactionValue = this.stats.totalRevenue / this.stats.totalTransactions;
    
    // 更新最受欢迎商品
    const itemIndex = this.stats.mostPopularItems.indexOf(transaction.itemId);
    if (itemIndex === -1) {
      this.stats.mostPopularItems.push(transaction.itemId);
    } else {
      this.stats.mostPopularItems.splice(itemIndex, 1);
      this.stats.mostPopularItems.push(transaction.itemId);
    }
    
    if (this.stats.mostPopularItems.length > 10) {
      this.stats.mostPopularItems.shift();
    }
  }

  /**
   * 事件处理
   */
  private handleShopInteraction(data: any): void {
    // 处理商店交互事件
    console.log('商店交互:', data);
  }

  private handleItemPurchased(data: any): void {
    // 处理物品购买事件
    console.log('物品购买:', data);
  }

  private handleItemSold(data: any): void {
    // 处理物品出售事件
    console.log('物品出售:', data);
  }

  /**
   * 生成交易ID
   */
  private generateTransactionId(): string {
    return `txn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * 生成拍卖ID
   */
  private generateAuctionId(): string {
    return `auc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * 生成竞标ID
   */
  private generateBidId(): string {
    return `bid_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * 添加事件
   */
  private addEvent(type: ShopEventType['type'], data?: any): void {
    const event: ShopEventType = {
      type,
      data,
      timestamp: Date.now()
    };
    
    this.events.push(event);
    
    if (this.events.length > this.config.maxEvents) {
      this.events.shift();
    }
    
    this.triggerCallback(type, data);
  }

  /**
   * 注册回调
   */
  public registerCallback(eventType: string, callback: (data: any) => void): void {
    this.callbacks.set(eventType, callback);
  }

  /**
   * 触发回调
   */
  private triggerCallback(eventType: string, data: any): void {
    const callback = this.callbacks.get(eventType);
    if (callback) {
      callback(data);
    }
  }

  /**
   * 获取商店统计
   */
  public getShopStats(): ShopStats {
    return { ...this.stats };
  }

  /**
   * 获取交易记录
   */
  public getTransactions(limit: number = 100): Transaction[] {
    return this.transactions.slice(-limit);
  }

  /**
   * 获取活跃拍卖
   */
  public getActiveAuctions(): Auction[] {
    return Array.from(this.auctions.values()).filter(auction => auction.isActive);
  }

  /**
   * 获取商店事件
   */
  public getShopEvents(): ShopEventType[] {
    return [...this.events];
  }

  /**
   * 清理资源
   */
  public destroy(): void {
    this.events = [];
    this.callbacks.clear();
    this.transactions = [];
    this.auctions.clear();
    
    this.scene = null;
    console.log('增强商店系统已销毁');
  }
}
/**
 * 物品系统
 * 负责管理游戏中的物品、装备、制作、强化和交易
 */

import { storage } from '../utils';

// 物品类型
export type ItemType = 'weapon' | 'armor' | 'consumable' | 'material' | 'quest' | 'currency' | 'container' | 'tool' | 'book' | 'special';

// 物品稀有度
export type ItemRarity = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary' | 'mythic' | 'unique';

// 物品品质
export type ItemQuality = 'broken' | 'poor' | 'normal' | 'good' | 'excellent' | 'perfect' | 'masterwork';

// 装备槽位
export type EquipmentSlot = 'weapon' | 'armor' | 'helmet' | 'gloves' | 'boots' | 'accessory1' | 'accessory2' | 'ring1' | 'ring2' | 'amulet';

// 物品属性
export interface ItemStats {
  attack?: number;
  defense?: number;
  magic?: number;
  health?: number;
  mana?: number;
  stamina?: number;
  speed?: number;
  luck?: number;
  critical?: number;
  dodge?: number;
  resistance?: {
    fire?: number;
    ice?: number;
    lightning?: number;
    poison?: number;
    physical?: number;
  };
}

// 物品效果
export interface ItemEffect {
  type: 'buff' | 'debuff' | 'heal' | 'damage' | 'teleport' | 'summon' | 'transform' | 'custom';
  target: 'self' | 'enemy' | 'ally' | 'area' | 'target';
  value: any;
  duration: number;
  chance: number; // 触发概率 0-1
  conditions?: ItemEffectCondition[];
}

// 物品效果条件
export interface ItemEffectCondition {
  type: 'health' | 'mana' | 'level' | 'time' | 'weather' | 'location' | 'equipment' | 'custom';
  operator: 'eq' | 'gt' | 'lt' | 'gte' | 'lte' | 'ne';
  value: any;
  description: string;
}

// 物品数据
export interface Item {
  id: string;
  name: string;
  description: string;
  type: ItemType;
  rarity: ItemRarity;
  quality: ItemQuality;
  level: number;
  
  // 基础属性
  icon: string;
  model?: string;
  stackable: boolean;
  maxStack: number;
  quantity: number;
  weight: number;
  value: number;
  
  // 装备属性
  slot?: EquipmentSlot;
  stats?: ItemStats;
  requirements?: ItemRequirements;
  
  // 效果系统
  effects?: ItemEffect[];
  passiveEffects?: ItemEffect[];
  
  // 制作系统
  craftable: boolean;
  craftingRecipe?: CraftingRecipe;
  materials?: string[]; // 材料ID列表
  
  // 强化系统
  enhanceable: boolean;
  enhancementLevel: number;
  maxEnhancementLevel: number;
  enhancementStats?: ItemStats;
  
  // 交易系统
  tradeable: boolean;
  buyPrice: number;
  sellPrice: number;
  vendorPrice: number;
  
  // 耐久度系统
  durability?: number;
  maxDurability?: number;
  repairable: boolean;
  
  // 特殊属性
  unique: boolean;
  bound: boolean; // 是否绑定
  soulbound: boolean; // 是否灵魂绑定
  tradeableOnce: boolean; // 是否只能交易一次
  
  // 元数据
  tags: string[];
  metadata: Record<string, any>;
  
  // 统计信息
  usageCount: number;
  lastUsed: number;
  createdTime: number;
  obtainedFrom: string;
}

// 物品需求
export interface ItemRequirements {
  level: number;
  strength?: number;
  dexterity?: number;
  intelligence?: number;
  class?: string[];
  reputation?: Record<string, number>;
  quests?: string[];
  items?: string[];
}

// 制作配方
export interface CraftingRecipe {
  id: string;
  name: string;
  description: string;
  category: string;
  difficulty: number;
  time: number; // 制作时间（毫秒）
  experience: number; // 获得的制作经验
  materials: CraftingMaterial[];
  tools?: string[]; // 需要的工具
  station?: string; // 需要的制作台
  chance: number; // 成功率 0-1
  criticalChance: number; // 暴击制作概率
  criticalBonus: number; // 暴击制作奖励
}

// 制作材料
export interface CraftingMaterial {
  itemId: string;
  quantity: number;
  quality?: ItemQuality;
  optional: boolean;
}

// 强化数据
export interface EnhancementData {
  level: number;
  successRate: number;
  cost: number;
  materials: CraftingMaterial[];
  stats: ItemStats;
  failurePenalty: 'none' | 'downgrade' | 'break' | 'lose_materials';
}

// 物品容器
export interface ItemContainer {
  id: string;
  name: string;
  type: 'chest' | 'bag' | 'vault' | 'guild_bank' | 'mailbox';
  capacity: number;
  items: Item[];
  locked: boolean;
  password?: string;
  owner: string;
  accessLevel: 'owner' | 'guild' | 'public';
}

// 物品交易
export interface ItemTrade {
  id: string;
  seller: string;
  buyer?: string;
  item: Item;
  price: number;
  currency: string;
  status: 'active' | 'sold' | 'cancelled' | 'expired';
  createdAt: number;
  expiresAt: number;
  location: string;
}

// 物品统计
export interface ItemStats {
  totalItems: number;
  totalValue: number;
  mostUsedItems: string[];
  rarestItems: string[];
  totalCrafted: number;
  totalEnhanced: number;
  totalTraded: number;
}

// 物品事件
export interface ItemEvent {
  type: 'item_obtained' | 'item_used' | 'item_crafted' | 'item_enhanced' | 'item_traded' | 'item_destroyed' | 'item_equipped' | 'item_unequipped' | 'custom';
  itemId: string;
  data?: any;
  timestamp: number;
}

export class ItemSystem {
  private static instance: ItemSystem;
  private scene: Phaser.Scene | null = null;
  
  // 数据存储
  private items: Map<string, Item> = new Map();
  private craftingRecipes: Map<string, CraftingRecipe> = new Map();
  private enhancementData: Map<string, EnhancementData[]> = new Map();
  private containers: Map<string, ItemContainer> = new Map();
  private trades: Map<string, ItemTrade> = new Map();
  private events: ItemEvent[] = [];
  private callbacks: Map<string, (data: any) => void> = new Map();
  
  // 配置
  private config = {
    maxInventorySize: 100,
    maxStackSize: 999,
    maxEnhancementLevel: 20,
    maxDurability: 1000,
    tradeExpirationTime: 7 * 24 * 60 * 60 * 1000, // 7天
    maxEventsSize: 100,
    enableCrafting: true,
    enableEnhancement: true,
    enableTrading: true,
    enableDurability: true
  };
  
  // 统计信息
  private stats: ItemStats = {
    totalItems: 0,
    totalValue: 0,
    mostUsedItems: [],
    rarestItems: [],
    totalCrafted: 0,
    totalEnhanced: 0,
    totalTraded: 0
  };

  private constructor() {
    this.initializeDefaultItems();
    this.initializeCraftingRecipes();
    this.initializeEnhancementData();
  }

  public static getInstance(): ItemSystem {
    if (!ItemSystem.instance) {
      ItemSystem.instance = new ItemSystem();
    }
    return ItemSystem.instance;
  }

  /**
   * 初始化物品系统
   */
  public initialize(scene: Phaser.Scene): void {
    this.scene = scene;
    this.setupEventHandlers();
    console.log('物品系统已初始化');
  }

  /**
   * 设置事件处理器
   */
  private setupEventHandlers(): void {
    if (!this.scene) return;

    // 监听游戏事件
    this.scene.events.on('item-obtained', (data: any) => {
      this.onItemObtained(data);
    });

    this.scene.events.on('item-used', (data: any) => {
      this.onItemUsed(data);
    });

    this.scene.events.on('item-crafted', (data: any) => {
      this.onItemCrafted(data);
    });
  }

  /**
   * 创建物品
   */
  public createItem(itemData: Partial<Item>): Item {
    const item: Item = {
      id: itemData.id || `item_${Date.now()}`,
      name: itemData.name || 'Unknown Item',
      description: itemData.description || 'A mysterious item',
      type: itemData.type || 'material',
      rarity: itemData.rarity || 'common',
      quality: itemData.quality || 'normal',
      level: itemData.level || 1,
      icon: itemData.icon || 'default_icon',
      stackable: itemData.stackable || false,
      maxStack: itemData.maxStack || 1,
      quantity: itemData.quantity || 1,
      weight: itemData.weight || 0,
      value: itemData.value || 0,
      craftable: itemData.craftable || false,
      enhanceable: itemData.enhanceable || false,
      enhancementLevel: itemData.enhancementLevel || 0,
      maxEnhancementLevel: itemData.maxEnhancementLevel || 0,
      tradeable: itemData.tradeable || true,
      buyPrice: itemData.buyPrice || 0,
      sellPrice: itemData.sellPrice || 0,
      vendorPrice: itemData.vendorPrice || 0,
      repairable: itemData.repairable || false,
      unique: itemData.unique || false,
      bound: itemData.bound || false,
      soulbound: itemData.soulbound || false,
      tradeableOnce: itemData.tradeableOnce || false,
      tags: itemData.tags || [],
      metadata: itemData.metadata || {},
      usageCount: itemData.usageCount || 0,
      lastUsed: itemData.lastUsed || 0,
      createdTime: Date.now(),
      obtainedFrom: itemData.obtainedFrom || 'system',
      ...itemData
    };

    this.items.set(item.id, item);
    this.addEvent('custom', item.id, { type: 'item_created', item });
    console.log(`创建物品: ${item.name}`);
    
    return item;
  }

  /**
   * 获取物品
   */
  public getItem(itemId: string): Item | undefined {
    return this.items.get(itemId);
  }

  /**
   * 获取所有物品
   */
  public getAllItems(): Item[] {
    return Array.from(this.items.values());
  }

  /**
   * 按类型获取物品
   */
  public getItemsByType(type: ItemType): Item[] {
    return Array.from(this.items.values()).filter(item => item.type === type);
  }

  /**
   * 按稀有度获取物品
   */
  public getItemsByRarity(rarity: ItemRarity): Item[] {
    return Array.from(this.items.values()).filter(item => item.rarity === rarity);
  }

  /**
   * 搜索物品
   */
  public searchItems(query: string): Item[] {
    const lowerQuery = query.toLowerCase();
    return Array.from(this.items.values()).filter(item =>
      item.name.toLowerCase().includes(lowerQuery) ||
      item.description.toLowerCase().includes(lowerQuery) ||
      item.tags.some(tag => tag.toLowerCase().includes(lowerQuery))
    );
  }

  /**
   * 使用物品
   */
  public useItem(itemId: string, target?: any): ItemEffect[] {
    const item = this.items.get(itemId);
    if (!item) return [];

    // 检查物品类型
    if (item.type !== 'consumable' && item.type !== 'tool') {
      console.log(`物品 ${item.name} 不可使用`);
      return [];
    }

    // 检查耐久度
    if (item.durability !== undefined && item.durability <= 0) {
      console.log(`物品 ${item.name} 已损坏`);
      return [];
    }

    // 应用物品效果
    const effects = this.applyItemEffects(item, target);

    // 更新物品状态
    item.usageCount++;
    item.lastUsed = Date.now();

    // 减少耐久度
    if (item.durability !== undefined) {
      item.durability--;
    }

    // 如果是消耗品，减少数量
    if (item.type === 'consumable') {
      item.quantity--;
      if (item.quantity <= 0) {
        this.destroyItem(itemId);
      }
    }

    this.addEvent('item_used', itemId, { item, target, effects });
    console.log(`使用物品: ${item.name}`);
    
    return effects;
  }

  /**
   * 应用物品效果
   */
  private applyItemEffects(item: Item, target?: any): ItemEffect[] {
    const effects: ItemEffect[] = [];
    
    if (!item.effects) return effects;

    item.effects.forEach(effect => {
      // 检查触发概率
      if (Math.random() > effect.chance) return;

      // 检查使用条件
      if (effect.conditions && !this.evaluateEffectConditions(effect.conditions, target)) {
        return;
      }

      // 应用效果
      this.applyEffect(effect, target);
      effects.push(effect);
    });

    return effects;
  }

  /**
   * 评估效果条件
   */
  private evaluateEffectConditions(conditions: ItemEffectCondition[], target?: any): boolean {
    return conditions.every(condition => {
      const value = this.getConditionValue(condition.type, target);
      return this.evaluateCondition(condition, value);
    });
  }

  /**
   * 获取条件值
   */
  private getConditionValue(type: string, target?: any): any {
    if (!target) return 0;

    switch (type) {
      case 'health':
        return target.health / target.maxHealth;
      case 'mana':
        return target.mana / target.maxMana;
      case 'level':
        return target.level;
      case 'time':
        return Date.now();
      case 'weather':
        return target.weather || 'clear';
      case 'location':
        return target.location;
      case 'equipment':
        return target.equipment;
      default:
        return target[type] || 0;
    }
  }

  /**
   * 评估条件
   */
  private evaluateCondition(condition: ItemEffectCondition, value: any): boolean {
    switch (condition.operator) {
      case 'eq':
        return value === condition.value;
      case 'gt':
        return value > condition.value;
      case 'lt':
        return value < condition.value;
      case 'gte':
        return value >= condition.value;
      case 'lte':
        return value <= condition.value;
      case 'ne':
        return value !== condition.value;
      default:
        return false;
    }
  }

  /**
   * 应用效果
   */
  private applyEffect(effect: ItemEffect, target?: any): void {
    if (!this.scene) return;

    switch (effect.type) {
      case 'buff':
        this.scene.events.emit('apply-buff', { target, effect });
        break;
      case 'debuff':
        this.scene.events.emit('apply-debuff', { target, effect });
        break;
      case 'heal':
        this.scene.events.emit('heal-target', { target, amount: effect.value });
        break;
      case 'damage':
        this.scene.events.emit('damage-target', { target, amount: effect.value });
        break;
      case 'teleport':
        this.scene.events.emit('teleport-target', { target, location: effect.value });
        break;
      case 'summon':
        this.scene.events.emit('summon-creature', { target, creature: effect.value });
        break;
      case 'transform':
        this.scene.events.emit('transform-target', { target, form: effect.value });
        break;
      case 'custom':
        this.scene.events.emit('custom-effect', { target, effect });
        break;
    }
  }

  /**
   * 制作物品
   */
  public craftItem(recipeId: string, playerData?: any): boolean {
    if (!this.config.enableCrafting) return false;

    const recipe = this.craftingRecipes.get(recipeId);
    if (!recipe) {
      console.error(`未找到制作配方: ${recipeId}`);
      return false;
    }

    // 检查材料
    if (!this.checkCraftingMaterials(recipe.materials, playerData)) {
      console.log(`制作材料不足: ${recipe.name}`);
      return false;
    }

    // 检查工具和制作台
    if (!this.checkCraftingRequirements(recipe, playerData)) {
      console.log(`制作条件不满足: ${recipe.name}`);
      return false;
    }

    // 消耗材料
    this.consumeCraftingMaterials(recipe.materials, playerData);

    // 计算成功率
    const successChance = recipe.chance * (1 + (playerData?.craftingSkill || 0) * 0.1);
    const isSuccess = Math.random() <= successChance;
    const isCritical = Math.random() <= recipe.criticalChance;

    if (isSuccess) {
      // 创建物品
      const item = this.createItem({
        id: recipe.id,
        name: recipe.name,
        description: recipe.description,
        type: 'weapon', // 根据配方设置
        rarity: 'common',
        quality: isCritical ? 'excellent' : 'normal',
        level: 1,
        craftable: false,
        obtainedFrom: 'crafting'
      });

      // 给予制作经验
      const experience = isCritical ? recipe.experience * recipe.criticalBonus : recipe.experience;
      if (playerData) {
        playerData.craftingExperience = (playerData.craftingExperience || 0) + experience;
      }

      this.stats.totalCrafted++;
      this.addEvent('item_crafted', item.id, { recipe, item, isCritical, experience });
      console.log(`制作成功: ${item.name}${isCritical ? ' (暴击制作)' : ''}`);
      
      return true;
    } else {
      console.log(`制作失败: ${recipe.name}`);
      return false;
    }
  }

  /**
   * 检查制作材料
   */
  private checkCraftingMaterials(materials: CraftingMaterial[], playerData?: any): boolean {
    return materials.every(material => {
      if (material.optional) return true;
      
      const playerItem = this.getPlayerItem(material.itemId, playerData);
      return playerItem && playerItem.quantity >= material.quantity;
    });
  }

  /**
   * 检查制作需求
   */
  private checkCraftingRequirements(recipe: CraftingRecipe, playerData?: any): boolean {
    // 检查工具
    if (recipe.tools) {
      const hasTools = recipe.tools.every(toolId => 
        this.getPlayerItem(toolId, playerData)
      );
      if (!hasTools) return false;
    }

    // 检查制作台
    if (recipe.station) {
      const hasStation = playerData?.nearbyStations?.includes(recipe.station);
      if (!hasStation) return false;
    }

    return true;
  }

  /**
   * 消耗制作材料
   */
  private consumeCraftingMaterials(materials: CraftingMaterial[], playerData?: any): void {
    materials.forEach(material => {
      if (material.optional) return;
      
      this.removePlayerItem(material.itemId, material.quantity, playerData);
    });
  }

  /**
   * 强化物品
   */
  public enhanceItem(itemId: string, playerData?: any): boolean {
    if (!this.config.enableEnhancement) return false;

    const item = this.items.get(itemId);
    if (!item || !item.enhanceable) {
      console.error(`物品不可强化: ${itemId}`);
      return false;
    }

    if (item.enhancementLevel >= item.maxEnhancementLevel) {
      console.log(`物品已达到最大强化等级: ${item.name}`);
      return false;
    }

    const enhancementData = this.getEnhancementData(item.type, item.enhancementLevel + 1);
    if (!enhancementData) {
      console.error(`未找到强化数据: ${item.type} ${item.enhancementLevel + 1}`);
      return false;
    }

    // 检查材料
    if (!this.checkCraftingMaterials(enhancementData.materials, playerData)) {
      console.log(`强化材料不足: ${item.name}`);
      return false;
    }

    // 消耗材料
    this.consumeCraftingMaterials(enhancementData.materials, playerData);

    // 计算成功率
    const successChance = enhancementData.successRate * (1 + (playerData?.enhancementSkill || 0) * 0.1);
    const isSuccess = Math.random() <= successChance;

    if (isSuccess) {
      // 强化成功
      item.enhancementLevel++;
      item.stats = { ...item.stats, ...enhancementData.stats };
      item.value += enhancementData.cost;

      this.stats.totalEnhanced++;
      this.addEvent('item_enhanced', itemId, { item, enhancementData, isSuccess });
      console.log(`强化成功: ${item.name} +${item.enhancementLevel}`);
      
      return true;
    } else {
      // 强化失败
      this.handleEnhancementFailure(item, enhancementData);
      this.addEvent('item_enhanced', itemId, { item, enhancementData, isSuccess: false });
      console.log(`强化失败: ${item.name}`);
      
      return false;
    }
  }

  /**
   * 处理强化失败
   */
  private handleEnhancementFailure(item: Item, enhancementData: EnhancementData): void {
    switch (enhancementData.failurePenalty) {
      case 'downgrade':
        if (item.enhancementLevel > 0) {
          item.enhancementLevel--;
        }
        break;
      case 'break':
        this.destroyItem(item.id);
        break;
      case 'lose_materials':
        // 材料已经消耗，无需额外处理
        break;
      case 'none':
      default:
        // 无惩罚
        break;
    }
  }

  /**
   * 获取强化数据
   */
  private getEnhancementData(itemType: ItemType, level: number): EnhancementData | undefined {
    const enhancementList = this.enhancementData.get(itemType);
    if (!enhancementList) return undefined;
    
    return enhancementList.find(data => data.level === level);
  }

  /**
   * 创建交易
   */
  public createTrade(seller: string, item: Item, price: number, currency: string = 'gold', location: string = 'market'): string {
    if (!this.config.enableTrading) return '';

    if (!item.tradeable) {
      console.log(`物品不可交易: ${item.name}`);
      return '';
    }

    const trade: ItemTrade = {
      id: `trade_${Date.now()}`,
      seller,
      item: { ...item },
      price,
      currency,
      status: 'active',
      createdAt: Date.now(),
      expiresAt: Date.now() + this.config.tradeExpirationTime,
      location
    };

    this.trades.set(trade.id, trade);
    this.addEvent('item_traded', item.id, { trade, type: 'created' });
    console.log(`创建交易: ${item.name} - ${price} ${currency}`);
    
    return trade.id;
  }

  /**
   * 购买物品
   */
  public buyItem(tradeId: string, buyer: string, playerData?: any): boolean {
    const trade = this.trades.get(tradeId);
    if (!trade || trade.status !== 'active') {
      console.log(`交易不存在或已失效: ${tradeId}`);
      return false;
    }

    // 检查买家货币
    const buyerCurrency = this.getPlayerCurrency(trade.currency, playerData);
    if (buyerCurrency < trade.price) {
      console.log(`货币不足: ${buyerCurrency} < ${trade.price}`);
      return false;
    }

    // 扣除货币
    this.removePlayerCurrency(trade.currency, trade.price, playerData);

    // 添加物品到买家背包
    this.addPlayerItem(trade.item, playerData);

    // 更新交易状态
    trade.buyer = buyer;
    trade.status = 'sold';

    this.stats.totalTraded++;
    this.addEvent('item_traded', trade.item.id, { trade, type: 'sold' });
    console.log(`购买成功: ${trade.item.name}`);
    
    return true;
  }

  /**
   * 取消交易
   */
  public cancelTrade(tradeId: string, seller: string): boolean {
    const trade = this.trades.get(tradeId);
    if (!trade || trade.seller !== seller) {
      console.log(`无法取消交易: ${tradeId}`);
      return false;
    }

    trade.status = 'cancelled';
    this.addEvent('item_traded', trade.item.id, { trade, type: 'cancelled' });
    console.log(`取消交易: ${trade.item.name}`);
    
    return true;
  }

  /**
   * 获取活跃交易
   */
  public getActiveTrades(location?: string): ItemTrade[] {
    const now = Date.now();
    return Array.from(this.trades.values()).filter(trade =>
      trade.status === 'active' &&
      trade.expiresAt > now &&
      (!location || trade.location === location)
    );
  }

  /**
   * 创建容器
   */
  public createContainer(containerData: Partial<ItemContainer>): ItemContainer {
    const container: ItemContainer = {
      id: containerData.id || `container_${Date.now()}`,
      name: containerData.name || 'Container',
      type: containerData.type || 'chest',
      capacity: containerData.capacity || 10,
      items: containerData.items || [],
      locked: containerData.locked || false,
      owner: containerData.owner || 'system',
      accessLevel: containerData.accessLevel || 'owner',
      ...containerData
    };

    this.containers.set(container.id, container);
    console.log(`创建容器: ${container.name}`);
    
    return container;
  }

  /**
   * 添加物品到容器
   */
  public addItemToContainer(containerId: string, item: Item): boolean {
    const container = this.containers.get(containerId);
    if (!container) return false;

    if (container.items.length >= container.capacity) {
      console.log(`容器已满: ${container.name}`);
      return false;
    }

    container.items.push(item);
    console.log(`添加物品到容器: ${item.name} -> ${container.name}`);
    
    return true;
  }

  /**
   * 从容器移除物品
   */
  public removeItemFromContainer(containerId: string, itemId: string): Item | null {
    const container = this.containers.get(containerId);
    if (!container) return null;

    const index = container.items.findIndex(item => item.id === itemId);
    if (index === -1) return null;

    const item = container.items.splice(index, 1)[0];
    console.log(`从容器移除物品: ${item.name} <- ${container.name}`);
    
    return item;
  }

  /**
   * 工具方法
   */
  private getPlayerItem(itemId: string, playerData?: any): Item | null {
    if (!playerData?.inventory) return null;
    return playerData.inventory.find((item: Item) => item.id === itemId) || null;
  }

  private addPlayerItem(item: Item, playerData?: any): void {
    if (!playerData?.inventory) return;
    
    const existingItem = this.getPlayerItem(item.id, playerData);
    if (existingItem && existingItem.stackable) {
      existingItem.quantity += item.quantity;
    } else {
      playerData.inventory.push(item);
    }
  }

  private removePlayerItem(itemId: string, quantity: number, playerData?: any): void {
    if (!playerData?.inventory) return;
    
    const item = this.getPlayerItem(itemId, playerData);
    if (!item) return;

    item.quantity -= quantity;
    if (item.quantity <= 0) {
      const index = playerData.inventory.findIndex((i: Item) => i.id === itemId);
      if (index !== -1) {
        playerData.inventory.splice(index, 1);
      }
    }
  }

  private getPlayerCurrency(currency: string, playerData?: any): number {
    return playerData?.currency?.[currency] || 0;
  }

  private removePlayerCurrency(currency: string, amount: number, playerData?: any): void {
    if (!playerData?.currency) return;
    
    playerData.currency[currency] = Math.max(0, (playerData.currency[currency] || 0) - amount);
  }

  private destroyItem(itemId: string): void {
    const item = this.items.get(itemId);
    if (!item) return;

    this.items.delete(itemId);
    this.addEvent('item_destroyed', itemId, { item });
    console.log(`销毁物品: ${item.name}`);
  }

  /**
   * 事件处理
   */
  private onItemObtained(data: any): void {
    const { item, source } = data;
    this.addEvent('item_obtained', item.id, { item, source });
  }

  private onItemUsed(data: any): void {
    const { item, target } = data;
    this.addEvent('item_used', item.id, { item, target });
  }

  private onItemCrafted(data: any): void {
    const { item, recipe } = data;
    this.addEvent('item_crafted', item.id, { item, recipe });
  }

  /**
   * 初始化默认物品
   */
  private initializeDefaultItems(): void {
    // 武器
    this.createItem({
      id: 'iron_sword',
      name: '铁剑',
      description: '一把普通的铁制长剑',
      type: 'weapon',
      rarity: 'common',
      quality: 'normal',
      level: 1,
      icon: 'iron_sword',
      slot: 'weapon',
      stats: { attack: 10 },
      value: 100,
      tradeable: true,
      buyPrice: 120,
      sellPrice: 80,
      vendorPrice: 100,
      tags: ['weapon', 'sword', 'melee']
    });

    // 防具
    this.createItem({
      id: 'leather_armor',
      name: '皮甲',
      description: '用皮革制成的轻便护甲',
      type: 'armor',
      rarity: 'common',
      quality: 'normal',
      level: 1,
      icon: 'leather_armor',
      slot: 'armor',
      stats: { defense: 5 },
      value: 80,
      tradeable: true,
      buyPrice: 100,
      sellPrice: 60,
      vendorPrice: 80,
      tags: ['armor', 'leather', 'light']
    });

    // 消耗品
    this.createItem({
      id: 'health_potion',
      name: '生命药水',
      description: '恢复生命值的药水',
      type: 'consumable',
      rarity: 'common',
      quality: 'normal',
      level: 1,
      icon: 'health_potion',
      stackable: true,
      maxStack: 10,
      value: 20,
      effects: [
        {
          type: 'heal',
          target: 'self',
          value: 50,
          duration: 0,
          chance: 1.0
        }
      ],
      tradeable: true,
      buyPrice: 25,
      sellPrice: 15,
      vendorPrice: 20,
      tags: ['consumable', 'potion', 'heal']
    });

    // 材料
    this.createItem({
      id: 'iron_ore',
      name: '铁矿石',
      description: '可以冶炼成铁的矿石',
      type: 'material',
      rarity: 'common',
      quality: 'normal',
      level: 1,
      icon: 'iron_ore',
      stackable: true,
      maxStack: 50,
      value: 5,
      tradeable: true,
      buyPrice: 8,
      sellPrice: 2,
      vendorPrice: 5,
      tags: ['material', 'ore', 'metal']
    });
  }

  /**
   * 初始化制作配方
   */
  private initializeCraftingRecipes(): void {
    // 铁剑制作配方
    this.craftingRecipes.set('iron_sword_recipe', {
      id: 'iron_sword_recipe',
      name: '铁剑制作',
      description: '制作一把铁剑',
      category: 'weapon',
      difficulty: 1,
      time: 5000,
      experience: 10,
      materials: [
        { itemId: 'iron_ore', quantity: 3, optional: false },
        { itemId: 'wood', quantity: 1, optional: false }
      ],
      tools: ['hammer'],
      station: 'forge',
      chance: 0.8,
      criticalChance: 0.1,
      criticalBonus: 1.5
    });

    // 皮甲制作配方
    this.craftingRecipes.set('leather_armor_recipe', {
      id: 'leather_armor_recipe',
      name: '皮甲制作',
      description: '制作一件皮甲',
      category: 'armor',
      difficulty: 1,
      time: 3000,
      experience: 8,
      materials: [
        { itemId: 'leather', quantity: 2, optional: false },
        { itemId: 'thread', quantity: 1, optional: false }
      ],
      tools: ['needle'],
      station: 'workbench',
      chance: 0.9,
      criticalChance: 0.05,
      criticalBonus: 1.2
    });
  }

  /**
   * 初始化强化数据
   */
  private initializeEnhancementData(): void {
    // 武器强化数据
    this.enhancementData.set('weapon', [
      {
        level: 1,
        successRate: 0.9,
        cost: 100,
        materials: [{ itemId: 'enhancement_stone', quantity: 1, optional: false }],
        stats: { attack: 2 },
        failurePenalty: 'none'
      },
      {
        level: 2,
        successRate: 0.8,
        cost: 200,
        materials: [{ itemId: 'enhancement_stone', quantity: 2, optional: false }],
        stats: { attack: 4 },
        failurePenalty: 'downgrade'
      },
      {
        level: 3,
        successRate: 0.7,
        cost: 400,
        materials: [{ itemId: 'enhancement_stone', quantity: 3, optional: false }],
        stats: { attack: 6 },
        failurePenalty: 'downgrade'
      }
    ]);

    // 防具强化数据
    this.enhancementData.set('armor', [
      {
        level: 1,
        successRate: 0.9,
        cost: 80,
        materials: [{ itemId: 'enhancement_stone', quantity: 1, optional: false }],
        stats: { defense: 1 },
        failurePenalty: 'none'
      },
      {
        level: 2,
        successRate: 0.8,
        cost: 160,
        materials: [{ itemId: 'enhancement_stone', quantity: 2, optional: false }],
        stats: { defense: 2 },
        failurePenalty: 'downgrade'
      }
    ]);
  }

  /**
   * 添加事件
   */
  private addEvent(type: ItemEvent['type'], itemId: string, data?: any): void {
    const event: ItemEvent = {
      type,
      itemId,
      data,
      timestamp: Date.now()
    };
    
    this.events.push(event);
    
    // 保持事件历史在合理范围内
    if (this.events.length > this.config.maxEventsSize) {
      this.events.shift();
    }
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
   * 获取物品数据
   */
  public getItemData(itemId: string): Item | undefined {
    return this.items.get(itemId);
  }

  /**
   * 获取制作配方
   */
  public getCraftingRecipe(recipeId: string): CraftingRecipe | undefined {
    return this.craftingRecipes.get(recipeId);
  }

  /**
   * 获取所有制作配方
   */
  public getAllCraftingRecipes(): CraftingRecipe[] {
    return Array.from(this.craftingRecipes.values());
  }

  /**
   * 获取物品事件
   */
  public getItemEvents(): ItemEvent[] {
    return [...this.events];
  }

  /**
   * 获取物品统计
   */
  public getItemStats(): ItemStats {
    return { ...this.stats };
  }

  /**
   * 清理资源
   */
  public destroy(): void {
    this.items.clear();
    this.craftingRecipes.clear();
    this.enhancementData.clear();
    this.containers.clear();
    this.trades.clear();
    this.events = [];
    this.callbacks.clear();
    
    this.scene = null;
    console.log('物品系统已销毁');
  }
}
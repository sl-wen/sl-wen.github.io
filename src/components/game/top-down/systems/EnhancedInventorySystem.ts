/**
 * 增强背包系统
 * 负责管理玩家的背包、装备、物品分类、搜索和排序
 */

import { storage } from '../utils';

// 背包类型
export type InventoryType = 'main' | 'equipment' | 'material' | 'consumable' | 'quest' | 'temporary' | 'warehouse' | 'guild';

// 背包槽位状态
export type SlotStatus = 'empty' | 'occupied' | 'locked' | 'restricted' | 'highlighted' | 'selected';

// 物品分类
export type ItemCategory = 'weapon' | 'armor' | 'consumable' | 'material' | 'quest' | 'currency' | 'tool' | 'book' | 'special' | 'all';

// 排序方式
export type SortMethod = 'name' | 'type' | 'rarity' | 'value' | 'weight' | 'quantity' | 'level' | 'quality' | 'recent' | 'usage';

// 排序方向
export type SortDirection = 'asc' | 'desc';

// 背包槽位
export interface InventorySlot {
  id: string;
  index: number;
  item: any | null;
  quantity: number;
  status: SlotStatus;
  locked: boolean;
  restricted: boolean;
  category: ItemCategory;
  lastUpdated: number;
  metadata: Record<string, any>;
}

// 背包配置
export interface InventoryConfig {
  type: InventoryType;
  name: string;
  description: string;
  maxSlots: number;
  unlockedSlots: number;
  categories: ItemCategory[];
  allowStacking: boolean;
  allowSorting: boolean;
  allowSearch: boolean;
  allowFiltering: boolean;
  allowExpansion: boolean;
  expansionCost: number;
  weightLimit?: number;
  sizeLimit?: number;
}

// 背包过滤器
export interface InventoryFilter {
  category?: ItemCategory;
  rarity?: string[];
  level?: { min: number; max: number };
  value?: { min: number; max: number };
  tags?: string[];
  searchText?: string;
  showEquipped?: boolean;
  showBound?: boolean;
  showTradeable?: boolean;
}

// 背包排序
export interface InventorySort {
  method: SortMethod;
  direction: SortDirection;
  secondary?: SortMethod;
  secondaryDirection?: SortDirection;
}

// 背包统计
export interface InventoryStats {
  totalItems: number;
  totalValue: number;
  totalWeight: number;
  usedSlots: number;
  availableSlots: number;
  categories: Record<ItemCategory, number>;
  rarities: Record<string, number>;
  mostValuableItem: any;
  heaviestItem: any;
  rarestItem: any;
}

// 背包事件
export interface InventoryEvent {
  type: 'item_added' | 'item_removed' | 'item_moved' | 'item_used' | 'item_equipped' | 'item_unequipped' | 'inventory_expanded' | 'inventory_sorted' | 'inventory_filtered' | 'custom';
  slotId: string;
  data?: any;
  timestamp: number;
}

export class EnhancedInventorySystem {
  private static instance: EnhancedInventorySystem;
  private scene: Phaser.Scene | null = null;
  
  // 数据存储
  private inventories: Map<InventoryType, InventoryConfig> = new Map();
  private slots: Map<InventoryType, InventorySlot[]> = new Map();
  private events: InventoryEvent[] = [];
  private callbacks: Map<string, (data: any) => void> = new Map();
  
  // 状态管理
  private currentFilter: InventoryFilter = {};
  private currentSort: InventorySort = { method: 'name', direction: 'asc' };
  private selectedSlots: Set<string> = new Set();
  private highlightedSlots: Set<string> = new Set();
  
  // 配置
  private config = {
    maxEventsSize: 100,
    autoSort: false,
    autoStack: true,
    enableSearch: true,
    enableFiltering: true,
    enableSorting: true,
    enableExpansion: true,
    maxExpansionLevel: 10,
    expansionCostMultiplier: 1.5
  };
  
  // 统计信息
  private stats: InventoryStats = {
    totalItems: 0,
    totalValue: 0,
    totalWeight: 0,
    usedSlots: 0,
    availableSlots: 0,
    categories: {} as Record<ItemCategory, number>,
    rarities: {},
    mostValuableItem: null,
    heaviestItem: null,
    rarestItem: null
  };

  private constructor() {
    this.initializeDefaultInventories();
  }

  public static getInstance(): EnhancedInventorySystem {
    if (!EnhancedInventorySystem.instance) {
      EnhancedInventorySystem.instance = new EnhancedInventorySystem();
    }
    return EnhancedInventorySystem.instance;
  }

  /**
   * 初始化背包系统
   */
  public initialize(scene: Phaser.Scene): void {
    this.scene = scene;
    this.setupEventHandlers();
    console.log('增强背包系统已初始化');
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

    this.scene.events.on('item-equipped', (data: any) => {
      this.onItemEquipped(data);
    });
  }

  /**
   * 创建背包
   */
  public createInventory(config: InventoryConfig): void {
    this.inventories.set(config.type, config);
    
    // 初始化槽位
    const slots: InventorySlot[] = [];
    for (let i = 0; i < config.maxSlots; i++) {
      slots.push({
        id: `${config.type}_slot_${i}`,
        index: i,
        item: null,
        quantity: 0,
        status: i < config.unlockedSlots ? 'empty' : 'locked',
        locked: i >= config.unlockedSlots,
        restricted: false,
        category: 'all',
        lastUpdated: Date.now(),
        metadata: {}
      });
    }
    
    this.slots.set(config.type, slots);
    console.log(`创建背包: ${config.name}`);
  }

  /**
   * 获取背包配置
   */
  public getInventoryConfig(type: InventoryType): InventoryConfig | undefined {
    return this.inventories.get(type);
  }

  /**
   * 获取背包槽位
   */
  public getInventorySlots(type: InventoryType): InventorySlot[] {
    return this.slots.get(type) || [];
  }

  /**
   * 添加物品到背包
   */
  public addItem(type: InventoryType, item: any, quantity: number = 1): boolean {
    const slots = this.slots.get(type);
    const config = this.inventories.get(type);
    
    if (!slots || !config) {
      console.error(`背包不存在: ${type}`);
      return false;
    }

    // 检查重量限制
    if (config.weightLimit && !this.checkWeightLimit(type, item, quantity)) {
      console.log(`背包重量超限: ${type}`);
      return false;
    }

    // 自动堆叠
    if (config.allowStacking && this.config.autoStack) {
      const stacked = this.tryStackItem(slots, item, quantity);
      if (stacked) {
        this.addEvent('item_added', '', { type, item, quantity, method: 'stacked' });
        return true;
      }
    }

    // 寻找空槽位
    const emptySlot = this.findEmptySlot(slots, item.category || 'all');
    if (!emptySlot) {
      console.log(`背包已满: ${type}`);
      return false;
    }

    // 添加物品
    emptySlot.item = { ...item };
    emptySlot.quantity = Math.min(quantity, item.maxStack || 1);
    emptySlot.status = 'occupied';
    emptySlot.category = item.category || 'all';
    emptySlot.lastUpdated = Date.now();

    this.addEvent('item_added', emptySlot.id, { type, item, quantity, method: 'new_slot' });
    console.log(`添加物品到背包: ${item.name} x${emptySlot.quantity}`);
    
    return true;
  }

  /**
   * 尝试堆叠物品
   */
  private tryStackItem(slots: InventorySlot[], item: any, quantity: number): boolean {
    const stackableSlots = slots.filter(slot => 
      slot.item?.id === item.id && 
      slot.quantity < (slot.item.maxStack || 1) &&
      !slot.locked
    );

    let remainingQuantity = quantity;
    
    for (const slot of stackableSlots) {
      const spaceInStack = (slot.item.maxStack || 1) - slot.quantity;
      const addAmount = Math.min(remainingQuantity, spaceInStack);
      
      slot.quantity += addAmount;
      slot.lastUpdated = Date.now();
      remainingQuantity -= addAmount;
      
      if (remainingQuantity <= 0) {
        return true;
      }
    }
    
    return false;
  }

  /**
   * 寻找空槽位
   */
  private findEmptySlot(slots: InventorySlot[], category: ItemCategory): InventorySlot | null {
    return slots.find(slot => 
      slot.status === 'empty' && 
      !slot.locked && 
      !slot.restricted &&
      (slot.category === 'all' || slot.category === category)
    ) || null;
  }

  /**
   * 检查重量限制
   */
  private checkWeightLimit(type: InventoryType, item: any, quantity: number): boolean {
    const config = this.inventories.get(type);
    if (!config?.weightLimit) return true;

    const currentWeight = this.getInventoryWeight(type);
    const itemWeight = (item.weight || 0) * quantity;
    
    return currentWeight + itemWeight <= config.weightLimit;
  }

  /**
   * 获取背包重量
   */
  public getInventoryWeight(type: InventoryType): number {
    const slots = this.slots.get(type);
    if (!slots) return 0;

    return slots.reduce((total, slot) => {
      if (slot.item) {
        return total + (slot.item.weight || 0) * slot.quantity;
      }
      return total;
    }, 0);
  }

  /**
   * 移除物品
   */
  public removeItem(type: InventoryType, itemId: string, quantity: number = 1): boolean {
    const slots = this.slots.get(type);
    if (!slots) return false;

    let remainingQuantity = quantity;
    
    // 从后往前移除（后添加的先移除）
    for (let i = slots.length - 1; i >= 0; i--) {
      const slot = slots[i];
      if (slot.item?.id === itemId && !slot.locked) {
        const removeAmount = Math.min(remainingQuantity, slot.quantity);
        slot.quantity -= removeAmount;
        remainingQuantity -= removeAmount;
        
        if (slot.quantity <= 0) {
          slot.item = null;
          slot.quantity = 0;
          slot.status = 'empty';
          slot.category = 'all';
        }
        
        slot.lastUpdated = Date.now();
        
        if (remainingQuantity <= 0) {
          this.addEvent('item_removed', slot.id, { type, itemId, quantity });
          return true;
        }
      }
    }
    
    return false;
  }

  /**
   * 移动物品
   */
  public moveItem(type: InventoryType, fromSlotId: string, toSlotId: string): boolean {
    const slots = this.slots.get(type);
    if (!slots) return false;

    const fromSlot = slots.find(s => s.id === fromSlotId);
    const toSlot = slots.find(s => s.id === toSlotId);
    
    if (!fromSlot || !toSlot || fromSlot.locked || toSlot.locked) {
      return false;
    }

    // 如果目标槽位为空，直接移动
    if (toSlot.status === 'empty') {
      toSlot.item = fromSlot.item;
      toSlot.quantity = fromSlot.quantity;
      toSlot.status = 'occupied';
      toSlot.category = fromSlot.category;
      toSlot.lastUpdated = Date.now();
      
      fromSlot.item = null;
      fromSlot.quantity = 0;
      fromSlot.status = 'empty';
      fromSlot.category = 'all';
      fromSlot.lastUpdated = Date.now();
      
      this.addEvent('item_moved', toSlot.id, { type, fromSlotId, toSlotId });
      return true;
    }

    // 如果目标槽位有相同物品，尝试堆叠
    if (toSlot.item?.id === fromSlot.item?.id && toSlot.item?.stackable) {
      const maxStack = toSlot.item.maxStack || 1;
      const spaceInStack = maxStack - toSlot.quantity;
      
      if (spaceInStack > 0) {
        const moveAmount = Math.min(fromSlot.quantity, spaceInStack);
        toSlot.quantity += moveAmount;
        fromSlot.quantity -= moveAmount;
        
        if (fromSlot.quantity <= 0) {
          fromSlot.item = null;
          fromSlot.quantity = 0;
          fromSlot.status = 'empty';
          fromSlot.category = 'all';
        }
        
        fromSlot.lastUpdated = Date.now();
        toSlot.lastUpdated = Date.now();
        
        this.addEvent('item_moved', toSlot.id, { type, fromSlotId, toSlotId, method: 'stacked' });
        return true;
      }
    }

    // 交换物品
    const tempItem = toSlot.item;
    const tempQuantity = toSlot.quantity;
    const tempCategory = toSlot.category;
    
    toSlot.item = fromSlot.item;
    toSlot.quantity = fromSlot.quantity;
    toSlot.category = fromSlot.category;
    toSlot.lastUpdated = Date.now();
    
    fromSlot.item = tempItem;
    fromSlot.quantity = tempQuantity;
    fromSlot.category = tempCategory;
    fromSlot.lastUpdated = Date.now();
    
    this.addEvent('item_moved', toSlot.id, { type, fromSlotId, toSlotId, method: 'swapped' });
    return true;
  }

  /**
   * 使用物品
   */
  public useItem(type: InventoryType, slotId: string, target?: any): any {
    const slots = this.slots.get(type);
    if (!slots) return null;

    const slot = slots.find(s => s.id === slotId);
    if (!slot || !slot.item || slot.locked) {
      return null;
    }

    // 检查物品是否可使用
    if (!this.canUseItem(slot.item)) {
      console.log(`物品不可使用: ${slot.item.name}`);
      return null;
    }

    // 使用物品
    const result = this.applyItemEffect(slot.item, target);
    
    // 减少数量
    slot.quantity--;
    if (slot.quantity <= 0) {
      slot.item = null;
      slot.quantity = 0;
      slot.status = 'empty';
      slot.category = 'all';
    }
    
    slot.lastUpdated = Date.now();
    
    this.addEvent('item_used', slotId, { type, item: slot.item, target, result });
    console.log(`使用物品: ${slot.item?.name}`);
    
    return result;
  }

  /**
   * 检查物品是否可使用
   */
  private canUseItem(item: any): boolean {
    return item.type === 'consumable' || item.type === 'tool';
  }

  /**
   * 应用物品效果
   */
  private applyItemEffect(item: any, target?: any): any {
    if (!this.scene) return null;

    // 触发物品使用事件
    this.scene.events.emit('use-item', { item, target });
    
    return item.effects || [];
  }

  /**
   * 装备物品
   */
  public equipItem(type: InventoryType, slotId: string): boolean {
    const slots = this.slots.get(type);
    if (!slots) return false;

    const slot = slots.find(s => s.id === slotId);
    if (!slot || !slot.item || slot.locked) {
      return false;
    }

    // 检查是否为装备
    if (!this.isEquipment(slot.item)) {
      console.log(`物品不是装备: ${slot.item.name}`);
      return false;
    }

    // 装备物品
    const equipped = this.getEquippedItem(slot.item.slot);
    if (equipped) {
      // 卸下当前装备
      this.unequipItem(slot.item.slot);
    }

    // 设置装备
    this.setEquippedItem(slot.item.slot, slot.item);
    
    // 从背包移除
    this.removeItem(type, slot.item.id, 1);
    
    this.addEvent('item_equipped', slotId, { type, item: slot.item, slot: slot.item.slot });
    console.log(`装备物品: ${slot.item.name}`);
    
    return true;
  }

  /**
   * 卸下装备
   */
  public unequipItem(slot: string): boolean {
    const equipped = this.getEquippedItem(slot);
    if (!equipped) {
      return false;
    }

    // 添加到主背包
    const added = this.addItem('main', equipped, 1);
    if (added) {
      this.setEquippedItem(slot, null);
      this.addEvent('item_unequipped', '', { slot, item: equipped });
      console.log(`卸下装备: ${equipped.name}`);
      return true;
    }

    return false;
  }

  /**
   * 检查是否为装备
   */
  private isEquipment(item: any): boolean {
    return item.type === 'weapon' || item.type === 'armor';
  }

  /**
   * 获取装备物品
   */
  private getEquippedItem(slot: string): any {
    // 这里需要从玩家数据获取装备信息
    return null;
  }

  /**
   * 设置装备物品
   */
  private setEquippedItem(slot: string, item: any): void {
    // 这里需要更新玩家数据
  }

  /**
   * 搜索物品
   */
  public searchItems(type: InventoryType, query: string): InventorySlot[] {
    const slots = this.slots.get(type);
    if (!slots) return [];

    const lowerQuery = query.toLowerCase();
    return slots.filter(slot => 
      slot.item && (
        slot.item.name.toLowerCase().includes(lowerQuery) ||
        slot.item.description.toLowerCase().includes(lowerQuery) ||
        slot.item.tags?.some((tag: string) => tag.toLowerCase().includes(lowerQuery))
      )
    );
  }

  /**
   * 过滤物品
   */
  public filterItems(type: InventoryType, filter: InventoryFilter): InventorySlot[] {
    const slots = this.slots.get(type);
    if (!slots) return [];

    return slots.filter(slot => {
      if (!slot.item) return false;

      // 分类过滤
      if (filter.category && filter.category !== 'all' && slot.item.category !== filter.category) {
        return false;
      }

      // 稀有度过滤
      if (filter.rarity && filter.rarity.length > 0 && !filter.rarity.includes(slot.item.rarity)) {
        return false;
      }

      // 等级过滤
      if (filter.level) {
        const itemLevel = slot.item.level || 1;
        if (itemLevel < filter.level.min || itemLevel > filter.level.max) {
          return false;
        }
      }

      // 价值过滤
      if (filter.value) {
        const itemValue = slot.item.value || 0;
        if (itemValue < filter.value.min || itemValue > filter.value.max) {
          return false;
        }
      }

      // 标签过滤
      if (filter.tags && filter.tags.length > 0) {
        const itemTags = slot.item.tags || [];
        if (!filter.tags.some(tag => itemTags.includes(tag))) {
          return false;
        }
      }

      // 搜索文本过滤
      if (filter.searchText) {
        const searchText = filter.searchText.toLowerCase();
        const itemName = slot.item.name.toLowerCase();
        const itemDesc = slot.item.description.toLowerCase();
        if (!itemName.includes(searchText) && !itemDesc.includes(searchText)) {
          return false;
        }
      }

      // 装备状态过滤
      if (filter.showEquipped !== undefined) {
        const isEquipped = this.isItemEquipped(slot.item);
        if (filter.showEquipped !== isEquipped) {
          return false;
        }
      }

      // 绑定状态过滤
      if (filter.showBound !== undefined) {
        if (filter.showBound !== slot.item.bound) {
          return false;
        }
      }

      // 可交易状态过滤
      if (filter.showTradeable !== undefined) {
        if (filter.showTradeable !== slot.item.tradeable) {
          return false;
        }
      }

      return true;
    });
  }

  /**
   * 检查物品是否已装备
   */
  private isItemEquipped(item: any): boolean {
    // 这里需要检查物品是否在装备栏中
    return false;
  }

  /**
   * 排序物品
   */
  public sortItems(type: InventoryType, sort: InventorySort): void {
    const slots = this.slots.get(type);
    if (!slots) return;

    const occupiedSlots = slots.filter(slot => slot.item !== null);
    const emptySlots = slots.filter(slot => slot.item === null);

    // 排序有物品的槽位
    occupiedSlots.sort((a, b) => {
      let comparison = this.compareItems(a.item, b.item, sort.method);
      
      if (comparison === 0 && sort.secondary) {
        comparison = this.compareItems(a.item, b.item, sort.secondary);
        if (sort.secondaryDirection === 'desc') {
          comparison = -comparison;
        }
      }
      
      return sort.direction === 'desc' ? -comparison : comparison;
    });

    // 重新排列槽位
    const newSlots = [...occupiedSlots, ...emptySlots];
    this.slots.set(type, newSlots);
    
    this.addEvent('inventory_sorted', '', { type, sort });
    console.log(`背包排序完成: ${type}`);
  }

  /**
   * 比较物品
   */
  private compareItems(itemA: any, itemB: any, method: SortMethod): number {
    switch (method) {
      case 'name':
        return itemA.name.localeCompare(itemB.name);
      case 'type':
        return itemA.type.localeCompare(itemB.type);
      case 'rarity':
        return this.getRarityValue(itemA.rarity) - this.getRarityValue(itemB.rarity);
      case 'value':
        return (itemA.value || 0) - (itemB.value || 0);
      case 'weight':
        return (itemA.weight || 0) - (itemB.weight || 0);
      case 'quantity':
        return (itemA.quantity || 0) - (itemB.quantity || 0);
      case 'level':
        return (itemA.level || 1) - (itemB.level || 1);
      case 'quality':
        return this.getQualityValue(itemA.quality) - this.getQualityValue(itemB.quality);
      case 'recent':
        return (itemA.lastUpdated || 0) - (itemB.lastUpdated || 0);
      case 'usage':
        return (itemA.usageCount || 0) - (itemB.usageCount || 0);
      default:
        return 0;
    }
  }

  /**
   * 获取稀有度数值
   */
  private getRarityValue(rarity: string): number {
    const rarityValues: Record<string, number> = {
      'common': 1,
      'uncommon': 2,
      'rare': 3,
      'epic': 4,
      'legendary': 5,
      'mythic': 6,
      'unique': 7
    };
    return rarityValues[rarity] || 0;
  }

  /**
   * 获取品质数值
   */
  private getQualityValue(quality: string): number {
    const qualityValues: Record<string, number> = {
      'broken': 1,
      'poor': 2,
      'normal': 3,
      'good': 4,
      'excellent': 5,
      'perfect': 6,
      'masterwork': 7
    };
    return qualityValues[quality] || 0;
  }

  /**
   * 扩展背包
   */
  public expandInventory(type: InventoryType): boolean {
    const config = this.inventories.get(type);
    if (!config || !config.allowExpansion) {
      return false;
    }

    const currentSlots = this.slots.get(type);
    if (!currentSlots) return false;

    const currentLevel = Math.floor(currentSlots.length / 10);
    if (currentLevel >= this.config.maxExpansionLevel) {
      console.log(`背包已达到最大扩展等级: ${type}`);
      return false;
    }

    // 计算扩展成本
    const expansionCost = Math.floor(config.expansionCost * Math.pow(this.config.expansionCostMultiplier, currentLevel));
    
    // 这里需要检查玩家是否有足够的货币
    // if (!this.checkPlayerCurrency(expansionCost)) {
    //   return false;
    // }

    // 添加新槽位
    const newSlotsCount = 10;
    const newSlots: InventorySlot[] = [];
    
    for (let i = 0; i < newSlotsCount; i++) {
      const slotIndex = currentSlots.length + i;
      newSlots.push({
        id: `${type}_slot_${slotIndex}`,
        index: slotIndex,
        item: null,
        quantity: 0,
        status: 'empty',
        locked: false,
        restricted: false,
        category: 'all',
        lastUpdated: Date.now(),
        metadata: {}
      });
    }

    currentSlots.push(...newSlots);
    config.maxSlots += newSlotsCount;
    
    this.addEvent('inventory_expanded', '', { type, newSlotsCount, expansionCost });
    console.log(`背包扩展成功: ${type} +${newSlotsCount} 槽位`);
    
    return true;
  }

  /**
   * 获取背包统计
   */
  public getInventoryStats(type: InventoryType): InventoryStats {
    const slots = this.slots.get(type);
    if (!slots) return this.stats;

    const occupiedSlots = slots.filter(slot => slot.item !== null);
    const items = occupiedSlots.map(slot => slot.item);

    const categories: Record<ItemCategory, number> = {} as Record<ItemCategory, number>;
    const rarities: Record<string, number> = {};

    let totalValue = 0;
    let totalWeight = 0;
    let mostValuableItem: any = null;
    let heaviestItem: any = null;
    let rarestItem: any = null;

    items.forEach(item => {
      // 统计分类
      const category = item.category || 'all';
      (categories as any)[category] = ((categories as any)[category] || 0) + item.quantity;

      // 统计稀有度
      const rarity = item.rarity || 'common';
      rarities[rarity] = (rarities[rarity] || 0) + item.quantity;

      // 计算总价值
      totalValue += (item.value || 0) * item.quantity;

      // 计算总重量
      totalWeight += (item.weight || 0) * item.quantity;

      // 找出最有价值的物品
      if (!mostValuableItem || item.value > mostValuableItem.value) {
        mostValuableItem = item;
      }

      // 找出最重的物品
      if (!heaviestItem || item.weight > heaviestItem.weight) {
        heaviestItem = item;
      }

      // 找出最稀有的物品
      if (!rarestItem || this.getRarityValue(item.rarity) > this.getRarityValue(rarestItem.rarity)) {
        rarestItem = item;
      }
    });

    return {
      totalItems: items.length,
      totalValue,
      totalWeight,
      usedSlots: occupiedSlots.length,
      availableSlots: slots.length - occupiedSlots.length,
      categories,
      rarities,
      mostValuableItem,
      heaviestItem,
      rarestItem
    };
  }

  /**
   * 选择槽位
   */
  public selectSlot(slotId: string, multiSelect: boolean = false): void {
    if (!multiSelect) {
      this.selectedSlots.clear();
    }
    this.selectedSlots.add(slotId);
  }

  /**
   * 取消选择槽位
   */
  public deselectSlot(slotId: string): void {
    this.selectedSlots.delete(slotId);
  }

  /**
   * 清除选择
   */
  public clearSelection(): void {
    this.selectedSlots.clear();
  }

  /**
   * 获取选中的槽位
   */
  public getSelectedSlots(): string[] {
    return Array.from(this.selectedSlots);
  }

  /**
   * 高亮槽位
   */
  public highlightSlot(slotId: string): void {
    this.highlightedSlots.add(slotId);
  }

  /**
   * 取消高亮槽位
   */
  public unhighlightSlot(slotId: string): void {
    this.highlightedSlots.delete(slotId);
  }

  /**
   * 清除高亮
   */
  public clearHighlight(): void {
    this.highlightedSlots.clear();
  }

  /**
   * 获取高亮的槽位
   */
  public getHighlightedSlots(): string[] {
    return Array.from(this.highlightedSlots);
  }

  /**
   * 初始化默认背包
   */
  private initializeDefaultInventories(): void {
    // 主背包
    this.createInventory({
      type: 'main',
      name: '主背包',
      description: '存放各种物品的主要背包',
      maxSlots: 30,
      unlockedSlots: 20,
      categories: ['all'],
      allowStacking: true,
      allowSorting: true,
      allowSearch: true,
      allowFiltering: true,
      allowExpansion: true,
      expansionCost: 1000,
      weightLimit: 100
    });

    // 装备栏
    this.createInventory({
      type: 'equipment',
      name: '装备栏',
      description: '存放装备的专用背包',
      maxSlots: 10,
      unlockedSlots: 10,
      categories: ['weapon', 'armor'],
      allowStacking: false,
      allowSorting: true,
      allowSearch: true,
      allowFiltering: true,
      allowExpansion: false,
      expansionCost: 0
    });

    // 材料背包
    this.createInventory({
      type: 'material',
      name: '材料背包',
      description: '存放制作材料的专用背包',
      maxSlots: 50,
      unlockedSlots: 30,
      categories: ['material'],
      allowStacking: true,
      allowSorting: true,
      allowSearch: true,
      allowFiltering: true,
      allowExpansion: true,
      expansionCost: 500
    });

    // 消耗品背包
    this.createInventory({
      type: 'consumable',
      name: '消耗品背包',
      description: '存放消耗品的专用背包',
      maxSlots: 20,
      unlockedSlots: 15,
      categories: ['consumable'],
      allowStacking: true,
      allowSorting: true,
      allowSearch: true,
      allowFiltering: true,
      allowExpansion: true,
      expansionCost: 300
    });
  }

  /**
   * 事件处理
   */
  private onItemObtained(data: any): void {
    const { item, source } = data;
    this.addEvent('custom', '', { type: 'item_obtained', item, source });
  }

  private onItemUsed(data: any): void {
    const { item, target } = data;
    this.addEvent('item_used', '', { item, target });
  }

  private onItemEquipped(data: any): void {
    const { item, slot } = data;
    this.addEvent('item_equipped', '', { item, slot });
  }

  /**
   * 添加事件
   */
  private addEvent(type: InventoryEvent['type'], slotId: string, data?: any): void {
    const event: InventoryEvent = {
      type,
      slotId,
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
   * 获取背包事件
   */
  public getInventoryEvents(): InventoryEvent[] {
    return [...this.events];
  }

  /**
   * 清理资源
   */
  public destroy(): void {
    this.inventories.clear();
    this.slots.clear();
    this.events = [];
    this.callbacks.clear();
    this.selectedSlots.clear();
    this.highlightedSlots.clear();
    
    this.scene = null;
    console.log('增强背包系统已销毁');
  }
}
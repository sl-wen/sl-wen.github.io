import { ITEM_TYPES, MAX_INVENTORY_SLOTS } from '../ref/constants';

// 物品接口
export interface GameItem {
  id: string;
  name: string;
  description: string;
  type: keyof typeof ITEM_TYPES;
  icon: string;
  stackable: boolean;
  maxStack: number;
  quantity: number;
  value: number;
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
  effects?: ItemEffect[];
}

// 物品效果接口
export interface ItemEffect {
  type: 'health' | 'damage' | 'defense' | 'speed' | 'luck';
  value: number;
  duration?: number; // 持续时间（毫秒），undefined表示永久效果
}

// 装备接口
export interface Equipment extends GameItem {
  slot: 'weapon' | 'armor' | 'accessory';
  stats: {
    attack?: number;
    defense?: number;
    speed?: number;
    health?: number;
  };
}

// 背包槽位接口
export interface InventorySlot {
  item: GameItem | null;
  quantity: number;
}

/**
 * 游戏物品系统
 * 管理玩家的背包、装备和物品使用
 */
export class InventorySystem {
  private static instance: InventorySystem;
  private slots: InventorySlot[];
  private equipped: {
    weapon: Equipment | null;
    armor: Equipment | null;
    accessory: Equipment | null;
  };
  private gold: number;

  private constructor() {
    this.slots = Array(MAX_INVENTORY_SLOTS).fill(null).map(() => ({
      item: null,
      quantity: 0
    }));
    this.equipped = {
      weapon: null,
      armor: null,
      accessory: null
    };
    this.gold = 0;
  }

  public static getInstance(): InventorySystem {
    if (!InventorySystem.instance) {
      InventorySystem.instance = new InventorySystem();
    }
    return InventorySystem.instance;
  }

  /**
   * 添加物品到背包
   * @param item - 要添加的物品
   * @param quantity - 数量
   * @returns 是否成功添加
   */
  addItem(item: GameItem, quantity: number = 1): boolean {
    // 如果是可堆叠物品，先尝试堆叠
    if (item.stackable) {
      const existingSlot = this.slots.find(slot => 
        slot.item?.id === item.id && slot.quantity < item.maxStack
      );
      
      if (existingSlot) {
        const spaceInStack = item.maxStack - existingSlot.quantity;
        const addAmount = Math.min(quantity, spaceInStack);
        existingSlot.quantity += addAmount;
        quantity -= addAmount;
        
        if (quantity <= 0) {
          return true;
        }
      }
    }

    // 寻找空槽位
    const emptySlot = this.slots.find(slot => slot.item === null);
    if (!emptySlot) {
      return false; // 背包已满
    }

    emptySlot.item = { ...item };
    emptySlot.quantity = Math.min(quantity, item.maxStack);
    
    return true;
  }

  /**
   * 从背包移除物品
   * @param itemId - 物品ID
   * @param quantity - 数量
   * @returns 是否成功移除
   */
  removeItem(itemId: string, quantity: number = 1): boolean {
    let remainingQuantity = quantity;
    
    for (let i = this.slots.length - 1; i >= 0; i--) {
      const slot = this.slots[i];
      if (slot.item?.id === itemId) {
        const removeAmount = Math.min(remainingQuantity, slot.quantity);
        slot.quantity -= removeAmount;
        remainingQuantity -= removeAmount;
        
        if (slot.quantity <= 0) {
          slot.item = null;
          slot.quantity = 0;
        }
        
        if (remainingQuantity <= 0) {
          return true;
        }
      }
    }
    
    return false;
  }

  /**
   * 装备物品
   * @param slotIndex - 背包槽位索引
   * @returns 是否成功装备
   */
  equipItem(slotIndex: number): boolean {
    const slot = this.slots[slotIndex];
    if (!slot.item || (slot.item.type !== 'WEAPON' && 
        slot.item.type !== 'ARMOR')) {
      return false;
    }

    const equipment = slot.item as Equipment;
    const equipmentSlot = equipment.slot;

    // 卸下当前装备
    if (this.equipped[equipmentSlot]) {
      this.addItem(this.equipped[equipmentSlot]!);
    }

    // 装备新物品
    this.equipped[equipmentSlot] = equipment;
    this.removeItem(equipment.id, 1);

    return true;
  }

  /**
   * 卸下装备
   * @param slotType - 装备槽位类型
   * @returns 是否成功卸下
   */
  unequipItem(slotType: 'weapon' | 'armor' | 'accessory'): boolean {
    const equipped = this.equipped[slotType];
    if (!equipped) {
      return false;
    }

    if (this.addItem(equipped)) {
      this.equipped[slotType] = null;
      return true;
    }

    return false; // 背包已满
  }

  /**
   * 使用消耗品
   * @param slotIndex - 背包槽位索引
   * @returns 物品效果数组
   */
  useConsumable(slotIndex: number): ItemEffect[] {
    const slot = this.slots[slotIndex];
    if (!slot.item || slot.item.type !== 'CONSUMABLE') {
      return [];
    }

    const effects = slot.item.effects || [];
    this.removeItem(slot.item.id, 1);
    
    return effects;
  }

  /**
   * 获取背包内容
   * @returns 背包槽位数组
   */
  getInventory(): InventorySlot[] {
    return [...this.slots];
  }

  /**
   * 获取装备信息
   * @returns 当前装备
   */
  getEquipment() {
    return { ...this.equipped };
  }

  /**
   * 获取金币数量
   * @returns 金币数量
   */
  getGold(): number {
    return this.gold;
  }

  /**
   * 添加金币
   * @param amount - 金币数量
   */
  addGold(amount: number): void {
    this.gold += amount;
  }

  /**
   * 消费金币
   * @param amount - 金币数量
   * @returns 是否成功消费
   */
  spendGold(amount: number): boolean {
    if (this.gold >= amount) {
      this.gold -= amount;
      return true;
    }
    return false;
  }

  /**
   * 检查是否有指定物品
   * @param itemId - 物品ID
   * @param quantity - 数量
   * @returns 是否有足够数量
   */
  hasItem(itemId: string, quantity: number = 1): boolean {
    let totalQuantity = 0;
    
    for (const slot of this.slots) {
      if (slot.item?.id === itemId) {
        totalQuantity += slot.quantity;
      }
    }
    
    return totalQuantity >= quantity;
  }

  /**
   * 获取物品总数量
   * @param itemId - 物品ID
   * @returns 物品总数量
   */
  getItemCount(itemId: string): number {
    let totalQuantity = 0;
    
    for (const slot of this.slots) {
      if (slot.item?.id === itemId) {
        totalQuantity += slot.quantity;
      }
    }
    
    return totalQuantity;
  }

  /**
   * 获取背包使用情况
   * @returns 背包使用统计
   */
  getInventoryStats() {
    const usedSlots = this.slots.filter(slot => slot.item !== null).length;
    return {
      used: usedSlots,
      total: MAX_INVENTORY_SLOTS,
      available: MAX_INVENTORY_SLOTS - usedSlots
    };
  }

  /**
   * 保存背包数据
   * @returns 背包数据
   */
  saveData() {
    return {
      slots: this.slots,
      equipped: this.equipped,
      gold: this.gold
    };
  }

  /**
   * 加载背包数据
   * @param data - 背包数据
   */
  loadData(data: any) {
    this.slots = data.slots || this.slots;
    this.equipped = data.equipped || this.equipped;
    this.gold = data.gold || 0;
  }
}
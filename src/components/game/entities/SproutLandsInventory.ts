export interface InventoryItem {
  id: string;
  name: string;
  type: 'crop' | 'seed' | 'tool' | 'food' | 'material';
  quantity: number;
  quality?: 'poor' | 'normal' | 'good' | 'excellent';
  value: number;
  description?: string;
  stackable: boolean;
  maxStack: number;
}

export interface ToolItem extends InventoryItem {
  type: 'tool';
  durability: number;
  maxDurability: number;
  toolType: 'hoe' | 'wateringCan' | 'seeds' | 'axe' | 'pickaxe' | 'fishingRod';
}

export interface CropItem extends InventoryItem {
  type: 'crop';
  cropType: string;
  quality: 'poor' | 'normal' | 'good' | 'excellent';
}

export interface SeedItem extends InventoryItem {
  type: 'seed';
  cropType: string;
  growthTime: number;
  season: string[];
}

export class SproutLandsInventory {
  private items: Map<string, InventoryItem>;
  private maxSlots: number;
  private gold: number;

  constructor(maxSlots: number = 36) {
    this.items = new Map();
    this.maxSlots = maxSlots;
    this.gold = 100; // Starting gold

    // Initialize with basic tools and seeds
    this.initializeStartingItems();
  }

  private initializeStartingItems(): void {
    // Add basic tools
    this.addTool('hoe', '基础锄头', 100, '用于翻耕土地的简单工具');
    this.addTool('wateringCan', '洒水壶', 100, '给作物浇水的工具');
    
    // Add starting seeds
    this.addSeed('carrot', '胡萝卜种子', 5, 20, 45000, ['春季', '秋季']);
    this.addSeed('wheat', '小麦种子', 10, 10, 30000, ['春季', '夏季', '秋季']);
    this.addSeed('lettuce', '生菜种子', 8, 15, 25000, ['春季', '秋季']);
  }

  private addTool(
    toolType: ToolItem['toolType'],
    name: string,
    durability: number,
    description: string
  ): void {
    const tool: ToolItem = {
      id: `tool_${toolType}`,
      name,
      type: 'tool',
      quantity: 1,
      value: this.getToolValue(toolType),
      description,
      stackable: false,
      maxStack: 1,
      durability,
      maxDurability: durability,
      toolType
    };

    this.items.set(tool.id, tool);
  }

  private addSeed(
    cropType: string,
    name: string,
    quantity: number,
    value: number,
    growthTime: number,
    season: string[]
  ): void {
    const seed: SeedItem = {
      id: `seed_${cropType}`,
      name,
      type: 'seed',
      quantity,
      value,
      description: `用于种植${cropType}的种子`,
      stackable: true,
      maxStack: 99,
      cropType,
      growthTime,
      season
    };

    this.items.set(seed.id, seed);
  }

  private getToolValue(toolType: string): number {
    const toolValues: Record<string, number> = {
      hoe: 50,
      wateringCan: 75,
      seeds: 0,
      axe: 150,
      pickaxe: 200,
      fishingRod: 100
    };
    return toolValues[toolType] || 50;
  }

  // Item management
  addItem(item: Partial<InventoryItem>): boolean {
    if (this.getItemCount() >= this.maxSlots && !this.hasItem(item.id!)) {
      return false; // Inventory full
    }

    const itemId = item.id!;
    const existingItem = this.items.get(itemId);

    if (existingItem && existingItem.stackable) {
      // Stack with existing item
      const newQuantity = existingItem.quantity + (item.quantity || 1);
      if (newQuantity <= existingItem.maxStack) {
        existingItem.quantity = newQuantity;
        return true;
      } else {
        // Can't stack more, inventory might be full
        return false;
      }
    } else {
      // Add new item
      const newItem: InventoryItem = {
        id: itemId,
        name: item.name || 'Unknown Item',
        type: item.type || 'material',
        quantity: item.quantity || 1,
        value: item.value || 0,
        description: item.description,
        stackable: item.stackable ?? true,
        maxStack: item.maxStack || 99,
        quality: item.quality
      };

      this.items.set(itemId, newItem);
      return true;
    }
  }

  removeItem(itemId: string, quantity: number = 1): boolean {
    const item = this.items.get(itemId);
    if (!item || item.quantity < quantity) {
      return false;
    }

    item.quantity -= quantity;
    if (item.quantity <= 0) {
      this.items.delete(itemId);
    }

    return true;
  }

  hasItem(itemId: string, quantity: number = 1): boolean {
    const item = this.items.get(itemId);
    return item ? item.quantity >= quantity : false;
  }

  getItem(itemId: string): InventoryItem | undefined {
    return this.items.get(itemId);
  }

  getAllItems(): InventoryItem[] {
    return Array.from(this.items.values());
  }

  getItemsByType(type: InventoryItem['type']): InventoryItem[] {
    return Array.from(this.items.values()).filter(item => item.type === type);
  }

  getItemCount(): number {
    return this.items.size;
  }

  // Specific item type methods
  getTools(): ToolItem[] {
    return this.getItemsByType('tool') as ToolItem[];
  }

  getSeeds(): SeedItem[] {
    return this.getItemsByType('seed') as SeedItem[];
  }

  getCrops(): CropItem[] {
    return this.getItemsByType('crop') as CropItem[];
  }

  // Tool durability management
  useTool(toolType: string): boolean {
    const tool = Array.from(this.items.values()).find(
      item => item.type === 'tool' && (item as ToolItem).toolType === toolType
    ) as ToolItem;

    if (!tool || tool.durability <= 0) {
      return false;
    }

    tool.durability -= 1;
    
    // Remove tool if broken
    if (tool.durability <= 0) {
      this.items.delete(tool.id);
    }

    return true;
  }

  repairTool(toolId: string, amount: number): boolean {
    const tool = this.items.get(toolId) as ToolItem;
    if (!tool || tool.type !== 'tool') {
      return false;
    }

    const repairCost = Math.floor(amount * tool.value * 0.1);
    if (this.gold < repairCost) {
      return false;
    }

    tool.durability = Math.min(tool.maxDurability, tool.durability + amount);
    this.gold -= repairCost;
    return true;
  }

  // Gold management
  getGold(): number {
    return this.gold;
  }

  addGold(amount: number): void {
    this.gold += amount;
  }

  spendGold(amount: number): boolean {
    if (this.gold >= amount) {
      this.gold -= amount;
      return true;
    }
    return false;
  }

  // Selling items
  sellItem(itemId: string, quantity: number = 1): number {
    const item = this.items.get(itemId);
    if (!item || item.quantity < quantity) {
      return 0;
    }

    let sellValue = item.value * quantity;

    // Apply quality multiplier for crops
    if (item.quality) {
      const qualityMultipliers = {
        poor: 0.5,
        normal: 1.0,
        good: 1.2,
        excellent: 1.5
      };
      sellValue *= qualityMultipliers[item.quality];
    }

    sellValue = Math.floor(sellValue);

    if (this.removeItem(itemId, quantity)) {
      this.addGold(sellValue);
      return sellValue;
    }

    return 0;
  }

  // Buying items
  buyItem(item: Partial<InventoryItem>, cost: number): boolean {
    if (this.gold < cost) {
      return false;
    }

    if (this.addItem(item)) {
      this.gold -= cost;
      return true;
    }

    return false;
  }

  // Inventory management
  canAddItem(item: Partial<InventoryItem>): boolean {
    const itemId = item.id!;
    const existingItem = this.items.get(itemId);

    if (existingItem && existingItem.stackable) {
      const newQuantity = existingItem.quantity + (item.quantity || 1);
      return newQuantity <= existingItem.maxStack;
    } else {
      return this.getItemCount() < this.maxSlots;
    }
  }

  getMaxSlots(): number {
    return this.maxSlots;
  }

  expandInventory(additionalSlots: number, cost: number): boolean {
    if (this.gold < cost) {
      return false;
    }

    this.maxSlots += additionalSlots;
    this.gold -= cost;
    return true;
  }

  // Sorting and organization
  sortInventory(): void {
    const items = Array.from(this.items.values());
    
    // Sort by type, then by name
    items.sort((a, b) => {
      if (a.type !== b.type) {
        const typeOrder = ['tool', 'seed', 'crop', 'food', 'material'];
        return typeOrder.indexOf(a.type) - typeOrder.indexOf(b.type);
      }
      return a.name.localeCompare(b.name);
    });

    // Rebuild the map in sorted order
    this.items.clear();
    items.forEach(item => {
      this.items.set(item.id, item);
    });
  }

  // Search functionality
  searchItems(query: string): InventoryItem[] {
    const lowerQuery = query.toLowerCase();
    return Array.from(this.items.values()).filter(item =>
      item.name.toLowerCase().includes(lowerQuery) ||
      item.description?.toLowerCase().includes(lowerQuery) ||
      item.type.toLowerCase().includes(lowerQuery)
    );
  }

  // Statistics
  getTotalValue(): number {
    let total = this.gold;
    this.items.forEach(item => {
      let itemValue = item.value * item.quantity;
      if (item.quality) {
        const qualityMultipliers = {
          poor: 0.5,
          normal: 1.0,
          good: 1.2,
          excellent: 1.5
        };
        itemValue *= qualityMultipliers[item.quality];
      }
      total += itemValue;
    });
    return Math.floor(total);
  }

  getInventoryStats(): {
    totalItems: number;
    usedSlots: number;
    maxSlots: number;
    totalValue: number;
    gold: number;
  } {
    return {
      totalItems: Array.from(this.items.values()).reduce((sum, item) => sum + item.quantity, 0),
      usedSlots: this.getItemCount(),
      maxSlots: this.maxSlots,
      totalValue: this.getTotalValue(),
      gold: this.gold
    };
  }

  // Save/Load functionality
  save(): any {
    return {
      items: Array.from(this.items.entries()),
      maxSlots: this.maxSlots,
      gold: this.gold
    };
  }

  load(data: any): void {
    if (data.items) {
      this.items = new Map(data.items);
    }
    if (data.maxSlots) {
      this.maxSlots = data.maxSlots;
    }
    if (data.gold !== undefined) {
      this.gold = data.gold;
    }
  }
}

export default SproutLandsInventory;
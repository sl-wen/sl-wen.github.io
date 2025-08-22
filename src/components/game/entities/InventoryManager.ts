import { InventoryItem, CropType } from '../types/GameTypes';

// 背包管理器类 - 负责管理玩家的物品存储和操作
export class InventoryManager {
  private items: InventoryItem[] = []; // 存储所有背包物品的数组
  private maxSlots: number = 50; // 背包最大容量（物品种类数量）

  // 构造函数 - 创建背包管理器并初始化默认物品
  constructor() {
    this.initializeDefaultItems();
  }

  // 初始化默认物品 - 给玩家一些基础的必需品
  private initializeDefaultItems() {
    // 添加基础水源物品，用于烹饪
    this.items.push({
      id: 'water',
      name: '水',
      type: 'ingredient', // 烹饪原料类型
      quantity: 10, // 初始数量10个
      icon: 'water_bottle',
      description: '清澈的水，烹饪必需品'
    });

    // 其他基础工具和种子由Cat类处理，避免重复初始化
  }

  // 添加物品到背包 - 支持物品叠加和容量检查
  public addItem(item: InventoryItem): boolean {
    // 检查是否已存在相同物品
    const existingItem = this.items.find(i => i.id === item.id);
    
    if (existingItem) {
      // 相同物品直接叠加数量
      existingItem.quantity += item.quantity;
      return true;
    } else {
      // 新物品需要检查背包空间
      if (this.items.length >= this.maxSlots) {
        return false; // 背包已满，添加失败
      }
      
      // 创建物品副本并添加到背包
      this.items.push({ ...item });
      return true;
    }
  }

  // 从背包移除物品 - 支持部分移除和自动清理
  public removeItem(itemId: string, quantity: number = 1): boolean {
    const item = this.items.find(i => i.id === itemId);
    
    // 检查物品是否存在且数量足够
    if (!item || item.quantity < quantity) {
      return false; // 物品不存在或数量不足
    }

    // 减少物品数量
    item.quantity -= quantity;
    
    // 如果数量为0，从背包中完全移除该物品
    if (item.quantity === 0) {
      this.items = this.items.filter(i => i.id !== itemId);
    }
    
    return true; // 移除成功
  }

  // 检查是否拥有指定物品和数量
  public hasItem(itemId: string, quantity: number = 1): boolean {
    const item = this.items.find(i => i.id === itemId);
    return item !== undefined && item.quantity >= quantity;
  }

  // 获取指定物品的详细信息
  public getItem(itemId: string): InventoryItem | undefined {
    return this.items.find(i => i.id === itemId);
  }

  // 获取所有物品的副本（防止外部直接修改）
  public getAllItems(): InventoryItem[] {
    return [...this.items];
  }

  // 根据物品类型筛选物品 - 用于分类显示
  public getItemsByType(type: InventoryItem['type']): InventoryItem[] {
    return this.items.filter(item => item.type === type);
  }

  // 获取指定物品的数量
  public getItemCount(itemId: string): number {
    const item = this.items.find(i => i.id === itemId);
    return item ? item.quantity : 0; // 不存在则返回0
  }

  // 获取背包总容量
  public getTotalSlots(): number {
    return this.maxSlots;
  }

  // 获取已使用的格子数量
  public getUsedSlots(): number {
    return this.items.length;
  }

  // 获取剩余空闲格子数量
  public getFreeSlots(): number {
    return this.maxSlots - this.items.length;
  }

  // 检查背包是否已满
  public isFull(): boolean {
    return this.items.length >= this.maxSlots;
  }

  // 检查背包是否为空
  public isEmpty(): boolean {
    return this.items.length === 0;
  }

  // Helper method to add harvested crops
  public addHarvestedCrop(cropType: CropType, quantity: number, quality: 'poor' | 'good' | 'excellent'): boolean {
    const cropItem: InventoryItem = {
      id: cropType,
      name: this.getCropDisplayName(cropType),
      type: 'crop',
      quantity: quantity,
      icon: `${cropType}_harvested`,
      description: `${this.getCropDisplayName(cropType)} - 品质: ${this.getQualityDisplayName(quality)}`
    };

    return this.addItem(cropItem);
  }

  // Helper method to add cooked food
  public addCookedFood(foodId: string, name: string, quantity: number, description: string): boolean {
    const foodItem: InventoryItem = {
      id: foodId,
      name: name,
      type: 'food',
      quantity: quantity,
      icon: foodId,
      description: description
    };

    return this.addItem(foodItem);
  }

  // Helper method to add seeds
  public addSeeds(cropType: CropType, quantity: number): boolean {
    const seedItem: InventoryItem = {
      id: `${cropType}_seeds`,
      name: `${this.getCropDisplayName(cropType)}种子`,
      type: 'seed',
      quantity: quantity,
      icon: `${cropType}_seeds`,
      description: `可以种植${this.getCropDisplayName(cropType)}的种子`
    };

    return this.addItem(seedItem);
  }

  // Helper method to consume ingredients for cooking
  public consumeIngredients(ingredients: { itemId: string; quantity: number }[]): boolean {
    // First check if all ingredients are available
    for (const ingredient of ingredients) {
      if (!this.hasItem(ingredient.itemId, ingredient.quantity)) {
        return false;
      }
    }

    // If all ingredients are available, consume them
    for (const ingredient of ingredients) {
      this.removeItem(ingredient.itemId, ingredient.quantity);
    }

    return true;
  }

  // Sort inventory by type and name
  public sortInventory(): void {
    this.items.sort((a, b) => {
      // First sort by type
      const typeOrder = ['tool', 'seed', 'crop', 'ingredient', 'food'];
      const typeComparison = typeOrder.indexOf(a.type) - typeOrder.indexOf(b.type);
      
      if (typeComparison !== 0) {
        return typeComparison;
      }
      
      // Then sort by name within the same type
      return a.name.localeCompare(b.name);
    });
  }

  // Clear all items (for testing or reset)
  public clear(): void {
    this.items = [];
    this.initializeDefaultItems();
  }

  // Export inventory data for saving
  public exportData(): InventoryItem[] {
    return [...this.items];
  }

  // Import inventory data for loading
  public importData(items: InventoryItem[]): void {
    this.items = [...items];
  }

  private getCropDisplayName(cropType: CropType): string {
    const names = {
      [CropType.CARROT]: '胡萝卜',
      [CropType.TOMATO]: '番茄',
      [CropType.WHEAT]: '小麦',
      [CropType.CORN]: '玉米',
      [CropType.STRAWBERRY]: '草莓',
      [CropType.LETTUCE]: '生菜',
      [CropType.POTATO]: '土豆',
      [CropType.PUMPKIN]: '南瓜'
    };
    return names[cropType];
  }

  private getQualityDisplayName(quality: 'poor' | 'good' | 'excellent'): string {
    const qualities = {
      'poor': '一般',
      'good': '良好',
      'excellent': '优秀'
    };
    return qualities[quality];
  }

  // Debug method to add test items
  public addTestItems(): void {
    // Add some test crops
    this.addHarvestedCrop(CropType.CARROT, 5, 'good');
    this.addHarvestedCrop(CropType.TOMATO, 3, 'excellent');
    this.addHarvestedCrop(CropType.WHEAT, 8, 'good');
    
    // Add more seeds
    this.addSeeds(CropType.LETTUCE, 5);
    this.addSeeds(CropType.CORN, 3);
    
    // Add more water
    this.addItem({
      id: 'water',
      name: '水',
      type: 'ingredient',
      quantity: 5,
      icon: 'water_bottle',
      description: '清澈的水，烹饪必需品'
    });
  }
}
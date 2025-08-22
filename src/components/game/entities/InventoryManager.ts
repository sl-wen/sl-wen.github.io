import { InventoryItem, CropType } from '../types/GameTypes';

export class InventoryManager {
  private items: InventoryItem[] = [];
  private maxSlots: number = 50;

  constructor() {
    this.initializeDefaultItems();
  }

  private initializeDefaultItems() {
    // Add basic water item
    this.items.push({
      id: 'water',
      name: '水',
      type: 'ingredient',
      quantity: 10,
      icon: 'water_bottle',
      description: '清澈的水，烹饪必需品'
    });

    // Add starting tools and seeds (already handled in Cat class)
  }

  public addItem(item: InventoryItem): boolean {
    // Check if inventory is full (for new items)
    const existingItem = this.items.find(i => i.id === item.id);
    
    if (existingItem) {
      existingItem.quantity += item.quantity;
      return true;
    } else {
      // Check if we have space for new item
      if (this.items.length >= this.maxSlots) {
        return false; // Inventory full
      }
      
      this.items.push({ ...item });
      return true;
    }
  }

  public removeItem(itemId: string, quantity: number = 1): boolean {
    const item = this.items.find(i => i.id === itemId);
    
    if (!item || item.quantity < quantity) {
      return false;
    }

    item.quantity -= quantity;
    
    if (item.quantity === 0) {
      this.items = this.items.filter(i => i.id !== itemId);
    }
    
    return true;
  }

  public hasItem(itemId: string, quantity: number = 1): boolean {
    const item = this.items.find(i => i.id === itemId);
    return item !== undefined && item.quantity >= quantity;
  }

  public getItem(itemId: string): InventoryItem | undefined {
    return this.items.find(i => i.id === itemId);
  }

  public getAllItems(): InventoryItem[] {
    return [...this.items];
  }

  public getItemsByType(type: InventoryItem['type']): InventoryItem[] {
    return this.items.filter(item => item.type === type);
  }

  public getItemCount(itemId: string): number {
    const item = this.items.find(i => i.id === itemId);
    return item ? item.quantity : 0;
  }

  public getTotalSlots(): number {
    return this.maxSlots;
  }

  public getUsedSlots(): number {
    return this.items.length;
  }

  public getFreeSlots(): number {
    return this.maxSlots - this.items.length;
  }

  public isFull(): boolean {
    return this.items.length >= this.maxSlots;
  }

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
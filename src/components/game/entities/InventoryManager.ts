import { CropType, InventoryItem } from '../types/GameTypes';

/**
 * 背包管理器类
 * 负责管理玩家的物品存储和操作
 * 包括物品添加、移除、查询、分类等功能
 */
export class InventoryManager {
  private items: InventoryItem[] = [];  // 存储所有背包物品的数组
  private maxSlots: number = 50;        // 背包最大容量（物品种类数量）

  /**
   * 构造函数
   * 创建背包管理器并初始化默认物品
   */
  constructor() {
    this.initializeDefaultItems();  // 初始化默认物品
  }

  /**
   * 初始化默认物品
   * 给玩家一些基础的必需品
   */
  private initializeDefaultItems() {
    // 添加基础水源物品，用于烹饪
    this.items.push({
      id: 'water',                    // 物品ID
      name: '水',                     // 物品名称
      type: 'ingredient',             // 烹饪原料类型
      quantity: 10,                   // 初始数量10个
      icon: 'water_bottle',           // 图标
      description: '清澈的水，烹饪必需品'  // 描述
    });

    // 其他基础工具和种子由Cat类处理，避免重复初始化
  }

  /**
   * 添加物品到背包
   * 支持物品叠加和容量检查
   * @param item 要添加的物品
   * @returns 是否添加成功
   */
  public addItem(item: InventoryItem): boolean {
    // 检查是否已存在相同物品
    const existingItem = this.items.find(i => i.id === item.id);

    if (existingItem) {
      // 相同物品直接叠加数量
      existingItem.quantity += item.quantity;  // 增加数量
      return true;  // 添加成功
    } else {
      // 新物品需要检查背包空间
      if (this.items.length >= this.maxSlots) {
        return false;  // 背包已满，添加失败
      }

      // 创建物品副本并添加到背包
      this.items.push({ ...item });  // 创建副本避免外部修改
      return true;  // 添加成功
    }
  }

  /**
   * 从背包移除物品
   * 支持部分移除和自动清理
   * @param itemId 物品ID
   * @param quantity 要移除的数量，默认为1
   * @returns 是否移除成功
   */
  public removeItem(itemId: string, quantity: number = 1): boolean {
    const item = this.items.find(i => i.id === itemId);  // 查找物品

    // 检查物品是否存在且数量足够
    if (!item || item.quantity < quantity) {
      return false;  // 物品不存在或数量不足
    }

    // 减少物品数量
    item.quantity -= quantity;  // 减少指定数量

    // 如果数量为0，从背包中完全移除该物品
    if (item.quantity === 0) {
      this.items = this.items.filter(i => i.id !== itemId);  // 过滤掉数量为0的物品
    }

    return true;  // 移除成功
  }

  /**
   * 检查是否拥有指定物品和数量
   * @param itemId 物品ID
   * @param quantity 需要的数量，默认为1
   * @returns 是否拥有足够数量的物品
   */
  public hasItem(itemId: string, quantity: number = 1): boolean {
    const item = this.items.find(i => i.id === itemId);  // 查找物品
    return item !== undefined && item.quantity >= quantity;  // 检查是否存在且数量足够
  }

  /**
   * 获取指定物品的详细信息
   * @param itemId 物品ID
   * @returns 物品对象或undefined
   */
  public getItem(itemId: string): InventoryItem | undefined {
    return this.items.find(i => i.id === itemId);  // 返回物品对象
  }

  /**
   * 获取所有物品的副本（防止外部直接修改）
   * @returns 物品数组的副本
   */
  public getAllItems(): InventoryItem[] {
    return [...this.items];  // 返回数组副本
  }

  /**
   * 根据物品类型筛选物品
   * 用于分类显示
   * @param type 物品类型
   * @returns 指定类型的物品数组
   */
  public getItemsByType(type: InventoryItem['type']): InventoryItem[] {
    return this.items.filter(item => item.type === type);  // 按类型过滤
  }

  /**
   * 获取指定物品的数量
   * @param itemId 物品ID
   * @returns 物品数量，不存在则返回0
   */
  public getItemCount(itemId: string): number {
    const item = this.items.find(i => i.id === itemId);  // 查找物品
    return item ? item.quantity : 0;  // 不存在则返回0
  }

  /**
   * 获取背包总容量
   * @returns 背包最大格子数
   */
  public getTotalSlots(): number {
    return this.maxSlots;  // 返回最大容量
  }

  /**
   * 获取已使用的格子数量
   * @returns 已使用的格子数
   */
  public getUsedSlots(): number {
    return this.items.length;  // 返回物品数组长度
  }

  /**
   * 获取剩余空闲格子数量
   * @returns 剩余空闲格子数
   */
  public getFreeSlots(): number {
    return this.maxSlots - this.items.length;  // 总容量减去已使用数量
  }

  /**
   * 检查背包是否已满
   * @returns 背包是否已满
   */
  public isFull(): boolean {
    return this.items.length >= this.maxSlots;  // 检查是否达到最大容量
  }

  /**
   * 检查背包是否为空
   * @returns 背包是否为空
   */
  public isEmpty(): boolean {
    return this.items.length === 0;  // 检查物品数组是否为空
  }

  /**
   * 添加收获的作物到背包
   * @param cropType 作物类型
   * @param quantity 数量
   * @param quality 品质（poor/good/excellent）
   * @returns 是否添加成功
   */
  public addHarvestedCrop(cropType: CropType, quantity: number, quality: 'poor' | 'good' | 'excellent'): boolean {
    const cropItem: InventoryItem = {
      id: cropType,                                                           // 作物ID
      name: this.getCropDisplayName(cropType),                               // 作物显示名称
      type: 'crop',                                                          // 作物类型
      quantity: quantity,                                                    // 数量
      icon: `${cropType}_harvested`,                                        // 收获后的图标
      description: `${this.getCropDisplayName(cropType)} - 品质: ${this.getQualityDisplayName(quality)}`  // 描述包含品质信息
    };

    return this.addItem(cropItem);  // 添加到背包
  }

  /**
   * 添加烹饪好的食物到背包
   * @param foodId 食物ID
   * @param name 食物名称
   * @param quantity 数量
   * @param description 食物描述
   * @returns 是否添加成功
   */
  public addCookedFood(foodId: string, name: string, quantity: number, description: string): boolean {
    const foodItem: InventoryItem = {
      id: foodId,                                                            // 食物ID
      name: name,                                                            // 食物名称
      type: 'food',                                                          // 食物类型
      quantity: quantity,                                                    // 数量
      icon: foodId,                                                          // 食物图标
      description: description                                               // 食物描述
    };

    return this.addItem(foodItem);  // 添加到背包
  }

  /**
   * 添加种子到背包
   * @param cropType 作物类型
   * @param quantity 数量
   * @returns 是否添加成功
   */
  public addSeeds(cropType: CropType, quantity: number): boolean {
    const seedItem: InventoryItem = {
      id: `${cropType}_seeds`,                                               // 种子ID
      name: `${this.getCropDisplayName(cropType)}种子`,                      // 种子名称
      type: 'seed',                                                          // 种子类型
      quantity: quantity,                                                    // 数量
      icon: `${cropType}_seeds`,                                            // 种子图标
      description: `可以种植${this.getCropDisplayName(cropType)}的种子`      // 种子描述
    };

    return this.addItem(seedItem);  // 添加到背包
  }

  /**
   * 消耗烹饪所需的材料
   * @param ingredients 材料列表，包含物品ID和数量
   * @returns 是否成功消耗所有材料
   */
  public consumeIngredients(ingredients: { itemId: string; quantity: number }[]): boolean {
    // 首先检查所有材料是否足够
    for (const ingredient of ingredients) {
      if (!this.hasItem(ingredient.itemId, ingredient.quantity)) {
        return false;  // 如果任何材料不足，返回失败
      }
    }

    // 如果所有材料都足够，则消耗它们
    for (const ingredient of ingredients) {
      this.removeItem(ingredient.itemId, ingredient.quantity);
    }

    return true;  // 所有材料都成功消耗
  }

  /**
   * 对背包物品进行排序
   * 按类型和名称排序
   */
  public sortInventory(): void {
    this.items.sort((a, b) => {
      // 首先按类型排序
      const typeOrder = ['tool', 'seed', 'crop', 'ingredient', 'food'];  // 类型优先级顺序
      const typeComparison = typeOrder.indexOf(a.type) - typeOrder.indexOf(b.type);

      if (typeComparison !== 0) {
        return typeComparison;  // 如果类型不同，按类型优先级排序
      }

      // 在相同类型内按名称排序
      return a.name.localeCompare(b.name);
    });
  }

  /**
   * 清空背包并重新初始化默认物品
   * 用于测试或重置
   */
  public clear(): void {
    this.items = [];  // 清空物品数组
    this.initializeDefaultItems();  // 重新初始化默认物品
  }

  /**
   * 导出背包数据用于保存
   * @returns 背包物品数据的副本
   */
  public exportData(): InventoryItem[] {
    return [...this.items];  // 返回物品数组的副本
  }

  /**
   * 导入背包数据用于加载
   * @param items 要导入的物品数据
   */
  public importData(items: InventoryItem[]): void {
    this.items = [...items];  // 用导入的数据替换当前物品数组
  }

  /**
   * 获取作物的中文显示名称
   * @param cropType 作物类型
   * @returns 作物的中文名称
   */
  private getCropDisplayName(cropType: CropType): string {
    const names = {
      [CropType.CARROT]: '胡萝卜',      // 胡萝卜
      [CropType.TOMATO]: '番茄',        // 番茄
      [CropType.WHEAT]: '小麦',         // 小麦
      [CropType.CORN]: '玉米',          // 玉米
      [CropType.STRAWBERRY]: '草莓',    // 草莓
      [CropType.LETTUCE]: '生菜',       // 生菜
      [CropType.POTATO]: '土豆',        // 土豆
      [CropType.PUMPKIN]: '南瓜'        // 南瓜
    };
    return names[cropType];  // 返回对应的中文名称
  }

  /**
   * 获取品质的中文显示名称
   * @param quality 品质等级
   * @returns 品质的中文名称
   */
  private getQualityDisplayName(quality: 'poor' | 'good' | 'excellent'): string {
    const qualities = {
      'poor': '一般',        // 一般品质
      'good': '良好',        // 良好品质
      'excellent': '优秀'    // 优秀品质
    };
    return qualities[quality];  // 返回对应的中文名称
  }

  /**
   * 添加测试物品到背包
   * 用于调试和测试功能
   */
  public addTestItems(): void {
    // 添加一些测试作物
    this.addHarvestedCrop(CropType.CARROT, 5, 'good');      // 添加胡萝卜
    this.addHarvestedCrop(CropType.TOMATO, 3, 'excellent'); // 添加番茄
    this.addHarvestedCrop(CropType.WHEAT, 8, 'good');       // 添加小麦

    // 添加更多种子
    this.addSeeds(CropType.LETTUCE, 5);  // 添加生菜种子
    this.addSeeds(CropType.CORN, 3);     // 添加玉米种子

    // 添加水
    this.addItem({
      id: 'water',                        // 水ID
      name: '水',                         // 水名称
      type: 'ingredient',                 // 材料类型
      quantity: 5,                        // 数量
      icon: 'water_bottle',               // 水瓶图标
      description: '清澈的水，烹饪必需品'  // 描述
    });
  }
}
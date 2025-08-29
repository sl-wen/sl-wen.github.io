/**
 * 制作系统
 * 允许玩家将材料组合成新的物品
 */
export interface Recipe {
  id: string;
  name: string;
  description: string;
  category: 'weapon' | 'armor' | 'consumable' | 'material' | 'tool';
  difficulty: number; // 1-10, 制作难度
  requiredLevel: number;
  ingredients: Ingredient[];
  result: CraftingResult;
  craftingTime: number; // 制作时间（毫秒）
  experienceReward: number;
  unlockCondition?: string;
}

export interface Ingredient {
  itemId: string;
  quantity: number;
  quality?: 'any' | 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
}

export interface CraftingResult {
  itemId: string;
  quantity: number;
  quality: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
  chance: number; // 成功概率 (0-1)
}

export interface CraftingProgress {
  recipeId: string;
  startTime: number;
  endTime: number;
  isComplete: boolean;
}

export class CraftingSystem {
  private static instance: CraftingSystem;
  private recipes: Map<string, Recipe> = new Map();
  private activeCrafting: Map<string, CraftingProgress> = new Map();
  private onCraftingCompleteCallback?: (recipeId: string, success: boolean) => void;

  private constructor() {
    this.initializeRecipes();
  }

  public static getInstance(): CraftingSystem {
    if (!CraftingSystem.instance) {
      CraftingSystem.instance = new CraftingSystem();
    }
    return CraftingSystem.instance;
  }

  /**
   * 初始化制作配方
   */
  private initializeRecipes(): void {
    // 武器配方
    this.addRecipe({
      id: 'wooden_sword',
      name: '木剑',
      description: '用木头制作的简单武器',
      category: 'weapon',
      difficulty: 2,
      requiredLevel: 1,
      ingredients: [
        { itemId: 'wood', quantity: 3 },
        { itemId: 'string', quantity: 1 }
      ],
      result: {
        itemId: 'wooden_sword',
        quantity: 1,
        quality: 'common',
        chance: 0.9
      },
      craftingTime: 5000,
      experienceReward: 10
    });

    this.addRecipe({
      id: 'iron_sword',
      name: '铁剑',
      description: '用铁矿石制作的坚固武器',
      category: 'weapon',
      difficulty: 5,
      requiredLevel: 3,
      ingredients: [
        { itemId: 'iron_ore', quantity: 2 },
        { itemId: 'wood', quantity: 1 },
        { itemId: 'leather', quantity: 1 }
      ],
      result: {
        itemId: 'iron_sword',
        quantity: 1,
        quality: 'uncommon',
        chance: 0.8
      },
      craftingTime: 15000,
      experienceReward: 25
    });

    this.addRecipe({
      id: 'steel_sword',
      name: '钢剑',
      description: '用精炼钢材制作的高级武器',
      category: 'weapon',
      difficulty: 8,
      requiredLevel: 5,
      ingredients: [
        { itemId: 'steel_ingot', quantity: 3 },
        { itemId: 'iron_ore', quantity: 1 },
        { itemId: 'gem', quantity: 1, quality: 'rare' }
      ],
      result: {
        itemId: 'steel_sword',
        quantity: 1,
        quality: 'rare',
        chance: 0.7
      },
      craftingTime: 30000,
      experienceReward: 50
    });

    // 护甲配方
    this.addRecipe({
      id: 'leather_armor',
      name: '皮甲',
      description: '用皮革制作的轻便护甲',
      category: 'armor',
      difficulty: 3,
      requiredLevel: 2,
      ingredients: [
        { itemId: 'leather', quantity: 4 },
        { itemId: 'string', quantity: 2 }
      ],
      result: {
        itemId: 'leather_armor',
        quantity: 1,
        quality: 'common',
        chance: 0.85
      },
      craftingTime: 10000,
      experienceReward: 15
    });

    this.addRecipe({
      id: 'iron_armor',
      name: '铁甲',
      description: '用铁板制作的坚固护甲',
      category: 'armor',
      difficulty: 6,
      requiredLevel: 4,
      ingredients: [
        { itemId: 'iron_ore', quantity: 4 },
        { itemId: 'leather', quantity: 2 },
        { itemId: 'string', quantity: 1 }
      ],
      result: {
        itemId: 'iron_armor',
        quantity: 1,
        quality: 'uncommon',
        chance: 0.75
      },
      craftingTime: 20000,
      experienceReward: 30
    });

    // 消耗品配方
    this.addRecipe({
      id: 'health_potion',
      name: '生命药水',
      description: '恢复生命值的药水',
      category: 'consumable',
      difficulty: 2,
      requiredLevel: 1,
      ingredients: [
        { itemId: 'herb', quantity: 2 },
        { itemId: 'water', quantity: 1 }
      ],
      result: {
        itemId: 'health_potion',
        quantity: 1,
        quality: 'common',
        chance: 0.95
      },
      craftingTime: 3000,
      experienceReward: 5
    });

    this.addRecipe({
      id: 'strength_potion',
      name: '力量药水',
      description: '临时提升攻击力的药水',
      category: 'consumable',
      difficulty: 4,
      requiredLevel: 2,
      ingredients: [
        { itemId: 'herb', quantity: 3 },
        { itemId: 'mushroom', quantity: 1 },
        { itemId: 'water', quantity: 1 }
      ],
      result: {
        itemId: 'strength_potion',
        quantity: 1,
        quality: 'uncommon',
        chance: 0.8
      },
      craftingTime: 8000,
      experienceReward: 12
    });

    // 材料配方
    this.addRecipe({
      id: 'steel_ingot',
      name: '钢锭',
      description: '精炼的钢材',
      category: 'material',
      difficulty: 4,
      requiredLevel: 3,
      ingredients: [
        { itemId: 'iron_ore', quantity: 3 },
        { itemId: 'coal', quantity: 1 }
      ],
      result: {
        itemId: 'steel_ingot',
        quantity: 1,
        quality: 'uncommon',
        chance: 0.85
      },
      craftingTime: 12000,
      experienceReward: 20
    });

    // 工具配方
    this.addRecipe({
      id: 'pickaxe',
      name: '铁镐',
      description: '用于挖掘矿石的工具',
      category: 'tool',
      difficulty: 3,
      requiredLevel: 2,
      ingredients: [
        { itemId: 'iron_ore', quantity: 2 },
        { itemId: 'wood', quantity: 2 }
      ],
      result: {
        itemId: 'pickaxe',
        quantity: 1,
        quality: 'common',
        chance: 0.9
      },
      craftingTime: 8000,
      experienceReward: 15
    });

    this.addRecipe({
      id: 'ancient_key',
      name: '古老钥匙',
      description: '开启神秘洞穴的钥匙',
      category: 'material',
      difficulty: 7,
      requiredLevel: 4,
      ingredients: [
        { itemId: 'iron_ore', quantity: 1 },
        { itemId: 'gem', quantity: 1, quality: 'rare' },
        { itemId: 'gold_ore', quantity: 1 }
      ],
      result: {
        itemId: 'ancient_key',
        quantity: 1,
        quality: 'rare',
        chance: 0.6
      },
      craftingTime: 25000,
      experienceReward: 40
    });
  }

  /**
   * 添加制作配方
   */
  private addRecipe(recipe: Recipe): void {
    this.recipes.set(recipe.id, recipe);
  }

  /**
   * 获取所有配方
   */
  public getAllRecipes(): Recipe[] {
    return Array.from(this.recipes.values());
  }

  /**
   * 获取指定类别的配方
   */
  public getRecipesByCategory(category: Recipe['category']): Recipe[] {
    return this.getAllRecipes().filter(recipe => recipe.category === category);
  }

  /**
   * 获取指定等级的配方
   */
  public getRecipesByLevel(level: number): Recipe[] {
    return this.getAllRecipes().filter(recipe => recipe.requiredLevel <= level);
  }

  /**
   * 获取指定配方
   */
  public getRecipe(recipeId: string): Recipe | null {
    return this.recipes.get(recipeId) || null;
  }

  /**
   * 检查是否可以制作指定配方
   */
  public canCraft(recipeId: string, inventory: any[], playerLevel: number): { canCraft: boolean; missingItems: string[] } {
    const recipe = this.getRecipe(recipeId);
    if (!recipe) {
      return { canCraft: false, missingItems: ['配方不存在'] };
    }

    if (playerLevel < recipe.requiredLevel) {
      return { canCraft: false, missingItems: [`需要等级 ${recipe.requiredLevel}`] };
    }

    const missingItems: string[] = [];
    
    for (const ingredient of recipe.ingredients) {
      const inventoryItem = inventory.find(item => item.id === ingredient.itemId);
      if (!inventoryItem || inventoryItem.quantity < ingredient.quantity) {
        missingItems.push(`${ingredient.itemId} x${ingredient.quantity}`);
      }
    }

    return {
      canCraft: missingItems.length === 0,
      missingItems
    };
  }

  /**
   * 开始制作
   */
  public startCrafting(recipeId: string, inventory: any[], playerLevel: number): boolean {
    const canCraft = this.canCraft(recipeId, inventory, playerLevel);
    if (!canCraft.canCraft) {
      console.warn('Cannot craft recipe:', canCraft.missingItems);
      return false;
    }

    const recipe = this.getRecipe(recipeId);
    if (!recipe) return false;

    // 检查是否已经在制作中
    if (this.activeCrafting.has(recipeId)) {
      console.warn('Recipe already being crafted:', recipeId);
      return false;
    }

    // 扣除材料
    for (const ingredient of recipe.ingredients) {
      const inventoryItem = inventory.find(item => item.id === ingredient.itemId);
      if (inventoryItem) {
        inventoryItem.quantity -= ingredient.quantity;
        if (inventoryItem.quantity <= 0) {
          const index = inventory.indexOf(inventoryItem);
          inventory.splice(index, 1);
        }
      }
    }

    // 开始制作
    const startTime = Date.now();
    const endTime = startTime + recipe.craftingTime;
    
    this.activeCrafting.set(recipeId, {
      recipeId,
      startTime,
      endTime,
      isComplete: false
    });

    // 设置完成定时器
    setTimeout(() => {
      this.completeCrafting(recipeId);
    }, recipe.craftingTime);

    console.log(`Started crafting ${recipe.name}`);
    return true;
  }

  /**
   * 完成制作
   */
  private completeCrafting(recipeId: string): void {
    const progress = this.activeCrafting.get(recipeId);
    if (!progress) return;

    const recipe = this.getRecipe(recipeId);
    if (!recipe) return;

    // 计算成功率
    const success = Math.random() <= recipe.result.chance;
    
    if (success) {
      console.log(`Successfully crafted ${recipe.name}`);
    } else {
      console.log(`Failed to craft ${recipe.name}`);
    }

    // 标记为完成
    progress.isComplete = true;
    this.activeCrafting.set(recipeId, progress);

    // 触发回调
    if (this.onCraftingCompleteCallback) {
      this.onCraftingCompleteCallback(recipeId, success);
    }
  }

  /**
   * 获取制作进度
   */
  public getCraftingProgress(recipeId: string): { progress: number; timeRemaining: number; isComplete: boolean } | null {
    const crafting = this.activeCrafting.get(recipeId);
    if (!crafting) return null;

    const now = Date.now();
    const totalTime = crafting.endTime - crafting.startTime;
    const elapsed = now - crafting.startTime;
    const progress = Math.min(1, elapsed / totalTime);
    const timeRemaining = Math.max(0, crafting.endTime - now);

    return {
      progress,
      timeRemaining,
      isComplete: crafting.isComplete
    };
  }

  /**
   * 获取所有正在制作的配方
   */
  public getActiveCrafting(): CraftingProgress[] {
    return Array.from(this.activeCrafting.values());
  }

  /**
   * 取消制作
   */
  public cancelCrafting(recipeId: string): boolean {
    const crafting = this.activeCrafting.get(recipeId);
    if (!crafting || crafting.isComplete) return false;

    this.activeCrafting.delete(recipeId);
    console.log(`Cancelled crafting: ${recipeId}`);
    return true;
  }

  /**
   * 获取制作结果
   */
  public getCraftingResult(recipeId: string): { itemId: string; quantity: number; quality: string } | null {
    const recipe = this.getRecipe(recipeId);
    if (!recipe) return null;

    return {
      itemId: recipe.result.itemId,
      quantity: recipe.result.quantity,
      quality: recipe.result.quality
    };
  }

  /**
   * 设置制作完成回调
   */
  public onCraftingComplete(callback: (recipeId: string, success: boolean) => void): void {
    this.onCraftingCompleteCallback = callback;
  }

  /**
   * 获取配方的制作难度描述
   */
  public getDifficultyDescription(difficulty: number): string {
    if (difficulty <= 2) return '简单';
    if (difficulty <= 4) return '普通';
    if (difficulty <= 6) return '困难';
    if (difficulty <= 8) return '专家';
    return '大师';
  }

  /**
   * 获取配方的制作时间描述
   */
  public getCraftingTimeDescription(time: number): string {
    const seconds = Math.ceil(time / 1000);
    if (seconds < 60) return `${seconds}秒`;
    const minutes = Math.ceil(seconds / 60);
    return `${minutes}分钟`;
  }

  /**
   * 搜索配方
   */
  public searchRecipes(query: string): Recipe[] {
    const lowerQuery = query.toLowerCase();
    return this.getAllRecipes().filter(recipe => 
      recipe.name.toLowerCase().includes(lowerQuery) ||
      recipe.description.toLowerCase().includes(lowerQuery) ||
      recipe.category.toLowerCase().includes(lowerQuery)
    );
  }

  /**
   * 获取推荐配方（基于玩家等级和材料）
   */
  public getRecommendedRecipes(inventory: any[], playerLevel: number): Recipe[] {
    const availableRecipes = this.getRecipesByLevel(playerLevel);
    
    return availableRecipes.filter(recipe => {
      const canCraft = this.canCraft(recipe.id, inventory, playerLevel);
      return canCraft.canCraft;
    }).sort((a, b) => {
      // 按难度排序，简单配方优先
      return a.difficulty - b.difficulty;
    });
  }
}
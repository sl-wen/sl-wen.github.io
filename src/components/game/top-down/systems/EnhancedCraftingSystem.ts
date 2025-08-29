/**
 * 增强制作系统
 * 提供高级制作功能，包括技能树、品质系统、失败处理、经验进度、高级配方管理等
 */

import { storage } from '../utils';

// 制作类型
export type CraftingType = 'weapon' | 'armor' | 'consumable' | 'material' | 'magic' | 'furniture' | 'tool' | 'special';

// 制作难度
export type CraftingDifficulty = 'beginner' | 'apprentice' | 'journeyman' | 'expert' | 'master' | 'grandmaster';

// 制作品质
export type CraftingQuality = 'broken' | 'poor' | 'normal' | 'good' | 'excellent' | 'perfect' | 'masterwork' | 'legendary';

// 制作状态
export type CraftingStatus = 'idle' | 'preparing' | 'crafting' | 'finishing' | 'completed' | 'failed' | 'cancelled';

// 技能类型
export type SkillType = 'weaponcraft' | 'armorcraft' | 'alchemy' | 'enchanting' | 'cooking' | 'blacksmithing' | 'woodworking' | 'jewelcrafting';

// 配方类型
export type RecipeType = 'basic' | 'advanced' | 'master' | 'legendary' | 'seasonal' | 'event' | 'secret' | 'experimental';

// 制作配方
export interface CraftingRecipe {
  id: string;
  name: string;
  description: string;
  type: RecipeType;
  craftingType: CraftingType;
  difficulty: CraftingDifficulty;
  skillRequired: SkillType;
  skillLevelRequired: number;
  ingredients: CraftingIngredient[];
  tools: string[]; // 需要的工具
  station: string; // 制作台类型
  baseTime: number; // 基础制作时间 (秒)
  baseSuccessRate: number; // 基础成功率
  baseQuality: CraftingQuality;
  experienceReward: number;
  unlockConditions: RecipeUnlockCondition[];
  isUnlocked: boolean;
  isDiscovered: boolean;
  category: string;
  tags: string[];
  metadata: Record<string, any>;
}

// 制作材料
export interface CraftingIngredient {
  itemId: string;
  quantity: number;
  quality: CraftingQuality;
  isOptional: boolean;
  substitutes: string[]; // 替代材料
  minQuality: CraftingQuality; // 最低品质要求
}

// 配方解锁条件
export interface RecipeUnlockCondition {
  type: 'skill_level' | 'quest_completed' | 'item_owned' | 'reputation' | 'achievement' | 'discovery' | 'crafting_count';
  target: string;
  value: number;
  description: string;
}

// 制作技能
export interface CraftingSkill {
  type: SkillType;
  level: number;
  experience: number;
  experienceToNext: number;
  totalExperience: number;
  specializations: SkillSpecialization[];
  perks: SkillPerk[];
  craftingHistory: CraftingRecord[];
  metadata: Record<string, any>;
}

// 技能专精
export interface SkillSpecialization {
  id: string;
  name: string;
  description: string;
  level: number;
  experience: number;
  maxLevel: number;
  effects: SkillEffect[];
  requirements: SkillRequirement[];
  isUnlocked: boolean;
}

// 技能效果
export interface SkillEffect {
  type: 'success_rate' | 'quality_bonus' | 'speed_bonus' | 'cost_reduction' | 'experience_bonus' | 'unlock_recipe' | 'special_ability';
  value: number;
  target: string; // 目标配方或技能
  condition: string; // 触发条件
}

// 技能需求
export interface SkillRequirement {
  type: 'skill_level' | 'total_crafts' | 'successful_crafts' | 'quality_crafts' | 'specialization_level';
  target: string;
  value: number;
}

// 技能特权
export interface SkillPerk {
  id: string;
  name: string;
  description: string;
  type: 'passive' | 'active' | 'conditional';
  effect: SkillEffect;
  cost: number;
  isUnlocked: boolean;
  isActive: boolean;
}

// 制作记录
export interface CraftingRecord {
  id: string;
  recipeId: string;
  timestamp: number;
  status: CraftingStatus;
  quality: CraftingQuality;
  timeSpent: number;
  experienceGained: number;
  materialsUsed: CraftingIngredient[];
  toolsUsed: string[];
  stationUsed: string;
  skillLevel: number;
  specializations: string[];
  perks: string[];
  metadata: Record<string, any>;
}

// 制作台
export interface CraftingStation {
  id: string;
  name: string;
  description: string;
  type: string;
  location: string;
  isAvailable: boolean;
  quality: CraftingQuality;
  efficiency: number; // 效率加成
  specialEffects: StationEffect[];
  requirements: StationRequirement[];
  upgrades: StationUpgrade[];
  currentUpgrade: number;
  metadata: Record<string, any>;
}

// 制作台效果
export interface StationEffect {
  type: 'quality_bonus' | 'speed_bonus' | 'success_rate_bonus' | 'experience_bonus' | 'cost_reduction' | 'special_ability';
  value: number;
  target: string;
  condition: string;
}

// 制作台需求
export interface StationRequirement {
  type: 'skill_level' | 'item_owned' | 'quest_completed' | 'reputation';
  target: string;
  value: number;
}

// 制作台升级
export interface StationUpgrade {
  id: string;
  name: string;
  description: string;
  level: number;
  cost: Record<string, number>;
  effects: StationEffect[];
  requirements: StationRequirement[];
  isUnlocked: boolean;
}

// 制作工具
export interface CraftingTool {
  id: string;
  name: string;
  description: string;
  type: string;
  quality: CraftingQuality;
  durability: number;
  maxDurability: number;
  efficiency: number;
  specialEffects: ToolEffect[];
  isBroken: boolean;
  metadata: Record<string, any>;
}

// 工具效果
export interface ToolEffect {
  type: 'quality_bonus' | 'speed_bonus' | 'success_rate_bonus' | 'durability_bonus' | 'special_ability';
  value: number;
  target: string;
  condition: string;
}

// 制作配置
export interface CraftingConfig {
  maxConcurrentCrafts: number;
  autoQualityCheck: boolean;
  autoToolRepair: boolean;
  experienceMultiplier: number;
  qualityMultiplier: number;
  failurePenalty: number;
  criticalSuccessChance: number;
  criticalFailureChance: number;
  skillDecayRate: number;
  specializationDecayRate: number;
}

// 制作统计
export interface CraftingStats {
  totalCrafts: number;
  successfulCrafts: number;
  failedCrafts: number;
  totalExperience: number;
  averageQuality: number;
  bestQuality: CraftingQuality;
  fastestCraft: number;
  slowestCraft: number;
  mostCraftedRecipe: string;
  totalMaterialsUsed: number;
  totalToolsUsed: number;
  skillProgress: Record<SkillType, number>;
}

// 制作事件
export interface CraftingEvent {
  type: 'craft_started' | 'craft_progress' | 'craft_completed' | 'craft_failed' | 'skill_level_up' | 'recipe_unlocked' | 'specialization_unlocked' | 'perk_unlocked' | 'tool_broken' | 'station_upgraded' | 'quality_critical' | 'experience_gained';
  data?: any;
  timestamp: number;
}

export class EnhancedCraftingSystem {
  private static instance: EnhancedCraftingSystem;
  private scene: Phaser.Scene | null = null;
  
  // 数据存储
  private recipes: Map<string, CraftingRecipe> = new Map();
  private skills: Map<SkillType, CraftingSkill> = new Map();
  private stations: Map<string, CraftingStation> = new Map();
  private tools: Map<string, CraftingTool> = new Map();
  private activeCrafts: Map<string, ActiveCraft> = new Map();
  private events: CraftingEvent[] = [];
  private callbacks: Map<string, (data: any) => void> = new Map();
  
  // 配置
  private config: CraftingConfig = {
    maxConcurrentCrafts: 3,
    autoQualityCheck: true,
    autoToolRepair: false,
    experienceMultiplier: 1.0,
    qualityMultiplier: 1.0,
    failurePenalty: 0.1,
    criticalSuccessChance: 0.05,
    criticalFailureChance: 0.02,
    skillDecayRate: 0.001,
    specializationDecayRate: 0.002
  };
  
  // 统计
  private stats: CraftingStats = {
    totalCrafts: 0,
    successfulCrafts: 0,
    failedCrafts: 0,
    totalExperience: 0,
    averageQuality: 0,
    bestQuality: 'normal',
    fastestCraft: 0,
    slowestCraft: 0,
    mostCraftedRecipe: '',
    totalMaterialsUsed: 0,
    totalToolsUsed: 0,
    skillProgress: {} as Record<SkillType, number>
  };

  private constructor() {
    this.initializeDefaultRecipes();
    this.initializeDefaultSkills();
    this.initializeDefaultStations();
    this.initializeDefaultTools();
    this.startTimers();
  }

  public static getInstance(): EnhancedCraftingSystem {
    if (!EnhancedCraftingSystem.instance) {
      EnhancedCraftingSystem.instance = new EnhancedCraftingSystem();
    }
    return EnhancedCraftingSystem.instance;
  }

  /**
   * 初始化增强制作系统
   */
  public initialize(scene: Phaser.Scene): void {
    this.scene = scene;
    this.setupEventHandlers();
    console.log('增强制作系统已初始化');
  }

  /**
   * 初始化默认配方
   */
  private initializeDefaultRecipes(): void {
    // 基础武器配方
    this.addRecipe({
      id: 'iron_sword',
      name: '铁剑',
      description: '坚固的铁制长剑',
      type: 'basic',
      craftingType: 'weapon',
      difficulty: 'beginner',
      skillRequired: 'weaponcraft',
      skillLevelRequired: 1,
      ingredients: [
        { itemId: 'iron_ingot', quantity: 3, quality: 'normal', isOptional: false, substitutes: [], minQuality: 'normal' },
        { itemId: 'wood_handle', quantity: 1, quality: 'normal', isOptional: false, substitutes: [], minQuality: 'normal' },
        { itemId: 'leather_strap', quantity: 1, quality: 'normal', isOptional: true, substitutes: ['cloth_strip'], minQuality: 'normal' }
      ],
      tools: ['hammer', 'anvil'],
      station: 'forge',
      baseTime: 300, // 5分钟
      baseSuccessRate: 0.8,
      baseQuality: 'normal',
      experienceReward: 50,
      unlockConditions: [
        { type: 'skill_level', target: 'weaponcraft', value: 1, description: '武器制作技能等级1' }
      ],
      isUnlocked: true,
      isDiscovered: true,
      category: 'weapons',
      tags: ['sword', 'melee', 'iron'],
      metadata: {}
    });

    // 高级护甲配方
    this.addRecipe({
      id: 'steel_plate_armor',
      name: '钢制板甲',
      description: '坚固的钢制板甲',
      type: 'advanced',
      craftingType: 'armor',
      difficulty: 'journeyman',
      skillRequired: 'armorcraft',
      skillLevelRequired: 5,
      ingredients: [
        { itemId: 'steel_plate', quantity: 5, quality: 'good', isOptional: false, substitutes: [], minQuality: 'normal' },
        { itemId: 'leather_padding', quantity: 2, quality: 'normal', isOptional: false, substitutes: ['cloth_padding'], minQuality: 'normal' },
        { itemId: 'steel_buckles', quantity: 3, quality: 'normal', isOptional: false, substitutes: [], minQuality: 'normal' }
      ],
      tools: ['hammer', 'anvil', 'rivet_tool'],
      station: 'forge',
      baseTime: 1800, // 30分钟
      baseSuccessRate: 0.7,
      baseQuality: 'good',
      experienceReward: 150,
      unlockConditions: [
        { type: 'skill_level', target: 'armorcraft', value: 5, description: '护甲制作技能等级5' },
        { type: 'quest_completed', target: 'master_armorsmith', value: 1, description: '完成大师护甲师任务' }
      ],
      isUnlocked: false,
      isDiscovered: false,
      category: 'armor',
      tags: ['plate', 'heavy', 'steel'],
      metadata: {}
    });

    // 魔法药水配方
    this.addRecipe({
      id: 'health_potion',
      name: '生命药水',
      description: '恢复生命值的魔法药水',
      type: 'basic',
      craftingType: 'consumable',
      difficulty: 'beginner',
      skillRequired: 'alchemy',
      skillLevelRequired: 1,
      ingredients: [
        { itemId: 'red_herb', quantity: 2, quality: 'normal', isOptional: false, substitutes: ['healing_herb'], minQuality: 'normal' },
        { itemId: 'water', quantity: 1, quality: 'normal', isOptional: false, substitutes: ['pure_water'], minQuality: 'normal' },
        { itemId: 'crystal_dust', quantity: 1, quality: 'normal', isOptional: true, substitutes: [], minQuality: 'normal' }
      ],
      tools: ['mortar_pestle', 'cauldron'],
      station: 'alchemy_lab',
      baseTime: 120, // 2分钟
      baseSuccessRate: 0.9,
      baseQuality: 'normal',
      experienceReward: 30,
      unlockConditions: [
        { type: 'skill_level', target: 'alchemy', value: 1, description: '炼金术技能等级1' }
      ],
      isUnlocked: true,
      isDiscovered: true,
      category: 'potions',
      tags: ['healing', 'potion', 'magic'],
      metadata: {}
    });
  }

  /**
   * 初始化默认技能
   */
  private initializeDefaultSkills(): void {
    const skillTypes: SkillType[] = ['weaponcraft', 'armorcraft', 'alchemy', 'enchanting', 'cooking', 'blacksmithing', 'woodworking', 'jewelcrafting'];
    
    for (const skillType of skillTypes) {
      this.skills.set(skillType, {
        type: skillType,
        level: 1,
        experience: 0,
        experienceToNext: 100,
        totalExperience: 0,
        specializations: [],
        perks: [],
        craftingHistory: [],
        metadata: {}
      });
    }
  }

  /**
   * 初始化默认制作台
   */
  private initializeDefaultStations(): void {
    // 锻造台
    this.addStation({
      id: 'forge',
      name: '锻造台',
      description: '用于制作金属武器和护甲',
      type: 'forge',
      location: 'village_smithy',
      isAvailable: true,
      quality: 'normal',
      efficiency: 1.0,
      specialEffects: [
        { type: 'quality_bonus', value: 0.1, target: 'metal_items', condition: 'skill_level >= 3' }
      ],
      requirements: [],
      upgrades: [
        {
          id: 'forge_upgrade_1',
          name: '改进锻造台',
          description: '提高制作效率和品质',
          level: 2,
          cost: { 'iron_ingot': 10, 'gold': 100 },
          effects: [
            { type: 'efficiency_bonus', value: 0.2, target: 'all', condition: '' }
          ],
          requirements: [
            { type: 'skill_level', target: 'blacksmithing', value: 3 }
          ],
          isUnlocked: false
        }
      ],
      currentUpgrade: 1,
      metadata: {}
    });

    // 炼金实验室
    this.addStation({
      id: 'alchemy_lab',
      name: '炼金实验室',
      description: '用于制作魔法药水和药剂',
      type: 'alchemy',
      location: 'village_magic',
      isAvailable: true,
      quality: 'normal',
      efficiency: 1.0,
      specialEffects: [
        { type: 'success_rate_bonus', value: 0.05, target: 'potions', condition: 'skill_level >= 2' }
      ],
      requirements: [],
      upgrades: [],
      currentUpgrade: 1,
      metadata: {}
    });
  }

  /**
   * 初始化默认工具
   */
  private initializeDefaultTools(): void {
    // 锤子
    this.addTool({
      id: 'hammer',
      name: '铁锤',
      description: '用于锻造金属物品',
      type: 'blacksmithing',
      quality: 'normal',
      durability: 100,
      maxDurability: 100,
      efficiency: 1.0,
      specialEffects: [
        { type: 'quality_bonus', value: 0.05, target: 'metal_items', condition: 'durability > 50' }
      ],
      isBroken: false,
      metadata: {}
    });

    // 研钵和杵
    this.addTool({
      id: 'mortar_pestle',
      name: '研钵和杵',
      description: '用于研磨草药和材料',
      type: 'alchemy',
      quality: 'normal',
      durability: 80,
      maxDurability: 80,
      efficiency: 1.0,
      specialEffects: [
        { type: 'speed_bonus', value: 0.1, target: 'herb_grinding', condition: 'durability > 30' }
      ],
      isBroken: false,
      metadata: {}
    });
  }

  /**
   * 设置事件处理器
   */
  private setupEventHandlers(): void {
    // 监听游戏事件
    if (this.scene) {
      this.scene.events.on('crafting-interaction', this.handleCraftingInteraction, this);
      this.scene.events.on('item-crafted', this.handleItemCrafted, this);
      this.scene.events.on('crafting-failed', this.handleCraftingFailed, this);
    }
  }

  /**
   * 开始定时器
   */
  private startTimers(): void {
    // 制作进度更新定时器
    setInterval(() => {
      this.updateCraftingProgress();
    }, 1000); // 每秒更新一次

    // 技能衰减定时器
    setInterval(() => {
      this.updateSkillDecay();
    }, 60000); // 每分钟检查一次
  }

  /**
   * 添加配方
   */
  public addRecipe(recipe: CraftingRecipe): void {
    this.recipes.set(recipe.id, recipe);
    this.addEvent('recipe_added', { recipeId: recipe.id, recipe });
  }

  /**
   * 获取配方
   */
  public getRecipe(recipeId: string): CraftingRecipe | undefined {
    return this.recipes.get(recipeId);
  }

  /**
   * 获取所有配方
   */
  public getAllRecipes(): CraftingRecipe[] {
    return Array.from(this.recipes.values());
  }

  /**
   * 获取可用配方
   */
  public getAvailableRecipes(playerData?: any): CraftingRecipe[] {
    return this.getAllRecipes().filter(recipe => {
      if (!recipe.isUnlocked) return false;
      
      // 检查技能等级
      const skill = this.skills.get(recipe.skillRequired);
      if (!skill || skill.level < recipe.skillLevelRequired) return false;
      
      // 检查解锁条件
      return this.checkRecipeUnlockConditions(recipe, playerData);
    });
  }

  /**
   * 检查配方解锁条件
   */
  private checkRecipeUnlockConditions(recipe: CraftingRecipe, playerData?: any): boolean {
    for (const condition of recipe.unlockConditions) {
      switch (condition.type) {
        case 'skill_level':
          const skill = this.skills.get(condition.target as SkillType);
          if (!skill || skill.level < condition.value) return false;
          break;
        case 'quest_completed':
          // 检查任务完成状态
          if (playerData && !playerData.completedQuests?.includes(condition.target)) return false;
          break;
        case 'item_owned':
          // 检查物品拥有状态
          if (playerData && !this.hasPlayerItem(condition.target, condition.value, playerData)) return false;
          break;
        case 'reputation':
          // 检查声誉等级
          if (playerData && playerData.reputation < condition.value) return false;
          break;
        case 'achievement':
          // 检查成就
          if (playerData && !playerData.achievements?.includes(condition.target)) return false;
          break;
        case 'crafting_count':
          // 检查制作次数
          if (this.stats.totalCrafts < condition.value) return false;
          break;
      }
    }
    return true;
  }

  /**
   * 开始制作
   */
  public startCrafting(recipeId: string, playerData?: any): string | null {
    const recipe = this.getRecipe(recipeId);
    if (!recipe || !this.canCraft(recipe, playerData)) {
      return null;
    }

    // 检查制作台
    const station = this.getAvailableStation(recipe.station);
    if (!station) {
      return null;
    }

    // 检查工具
    const tools = this.getAvailableTools(recipe.tools);
    if (tools.length < recipe.tools.length) {
      return null;
    }

    // 消耗材料
    if (playerData && !this.consumeMaterials(recipe.ingredients, playerData)) {
      return null;
    }

    // 创建制作任务
    const craftId = this.generateCraftId();
    const activeCraft: ActiveCraft = {
      id: craftId,
      recipeId,
      playerId: playerData?.id || 'unknown',
      status: 'preparing',
      startTime: Date.now(),
      currentTime: 0,
      totalTime: this.calculateCraftingTime(recipe, playerData),
      quality: recipe.baseQuality,
      successRate: this.calculateSuccessRate(recipe, playerData),
      experienceReward: recipe.experienceReward,
      materialsUsed: recipe.ingredients,
      toolsUsed: tools.map(t => t.id),
      stationUsed: station.id,
      skillLevel: this.skills.get(recipe.skillRequired)?.level || 1,
      specializations: [],
      perks: [],
      metadata: {}
    };

    this.activeCrafts.set(craftId, activeCraft);
    this.addEvent('craft_started', { craftId, recipe, activeCraft });
    
    return craftId;
  }

  /**
   * 检查是否可以制作
   */
  private canCraft(recipe: CraftingRecipe, playerData?: any): boolean {
    // 检查是否解锁
    if (!recipe.isUnlocked) return false;

    // 检查技能等级
    const skill = this.skills.get(recipe.skillRequired);
    if (!skill || skill.level < recipe.skillLevelRequired) return false;

    // 检查材料
    if (playerData && !this.hasMaterials(recipe.ingredients, playerData)) return false;

    // 检查制作台
    const station = this.getAvailableStation(recipe.station);
    if (!station) return false;

    // 检查工具
    const tools = this.getAvailableTools(recipe.tools);
    if (tools.length < recipe.tools.length) return false;

    return true;
  }

  /**
   * 检查材料
   */
  private hasMaterials(ingredients: CraftingIngredient[], playerData: any): boolean {
    for (const ingredient of ingredients) {
      if (!ingredient.isOptional && !this.hasPlayerItem(ingredient.itemId, ingredient.quantity, playerData)) {
        return false;
      }
    }
    return true;
  }

  /**
   * 消耗材料
   */
  private consumeMaterials(ingredients: CraftingIngredient[], playerData: any): boolean {
    for (const ingredient of ingredients) {
      if (!ingredient.isOptional) {
        if (!this.removePlayerItem(ingredient.itemId, ingredient.quantity, playerData)) {
          return false;
        }
      }
    }
    return true;
  }

  /**
   * 获取可用制作台
   */
  private getAvailableStation(stationType: string): CraftingStation | null {
    for (const station of this.stations.values()) {
      if (station.type === stationType && station.isAvailable) {
        return station;
      }
    }
    return null;
  }

  /**
   * 获取可用工具
   */
  private getAvailableTools(toolTypes: string[]): CraftingTool[] {
    const availableTools: CraftingTool[] = [];
    
    for (const toolType of toolTypes) {
      for (const tool of this.tools.values()) {
        if (tool.type === toolType && !tool.isBroken && !availableTools.some(t => t.type === toolType)) {
          availableTools.push(tool);
          break;
        }
      }
    }
    
    return availableTools;
  }

  /**
   * 计算制作时间
   */
  private calculateCraftingTime(recipe: CraftingRecipe, playerData?: any): number {
    let time = recipe.baseTime;
    
    // 技能加成
    const skill = this.skills.get(recipe.skillRequired);
    if (skill) {
      time *= (1 - skill.level * 0.02); // 每级减少2%时间
    }
    
    // 制作台加成
    const station = this.getAvailableStation(recipe.station);
    if (station) {
      time *= (1 - station.efficiency * 0.1);
    }
    
    // 工具加成
    const tools = this.getAvailableTools(recipe.tools);
    for (const tool of tools) {
      const speedEffect = tool.specialEffects.find(e => e.type === 'speed_bonus');
      if (speedEffect) {
        time *= (1 - speedEffect.value);
      }
    }
    
    return Math.max(10, Math.round(time)); // 最少10秒
  }

  /**
   * 计算成功率
   */
  private calculateSuccessRate(recipe: CraftingRecipe, playerData?: any): number {
    let rate = recipe.baseSuccessRate;
    
    // 技能加成
    const skill = this.skills.get(recipe.skillRequired);
    if (skill) {
      rate += skill.level * 0.01; // 每级增加1%成功率
    }
    
    // 制作台加成
    const station = this.getAvailableStation(recipe.station);
    if (station) {
      const successEffect = station.specialEffects.find(e => e.type === 'success_rate_bonus');
      if (successEffect) {
        rate += successEffect.value;
      }
    }
    
    // 工具加成
    const tools = this.getAvailableTools(recipe.tools);
    for (const tool of tools) {
      const successEffect = tool.specialEffects.find(e => e.type === 'success_rate_bonus');
      if (successEffect) {
        rate += successEffect.value;
      }
    }
    
    return Math.min(0.99, Math.max(0.01, rate)); // 限制在1%-99%之间
  }

  /**
   * 更新制作进度
   */
  private updateCraftingProgress(): void {
    const now = Date.now();
    
    for (const [craftId, craft] of this.activeCrafts.entries()) {
      if (craft.status === 'crafting') {
        const elapsed = now - craft.startTime;
        craft.currentTime = elapsed;
        
        // 检查是否完成
        if (elapsed >= craft.totalTime) {
          this.completeCrafting(craftId);
        } else {
          // 更新进度
          const progress = elapsed / craft.totalTime;
          this.addEvent('craft_progress', { craftId, progress, craft });
        }
      }
    }
  }

  /**
   * 完成制作
   */
  private completeCrafting(craftId: string): void {
    const craft = this.activeCrafts.get(craftId);
    if (!craft) return;

    const recipe = this.getRecipe(craft.recipeId);
    if (!recipe) return;

    // 计算最终结果
    const success = Math.random() < craft.successRate;
    const quality = this.calculateFinalQuality(craft, recipe);
    
    if (success) {
      craft.status = 'completed';
      craft.quality = quality;
      
      // 给予经验
      this.gainExperience(recipe.skillRequired, craft.experienceReward);
      
      // 记录制作历史
      this.recordCrafting(craft, 'completed', quality);
      
      // 更新统计
      this.updateStats(craft, true, quality);
      
      this.addEvent('craft_completed', { craftId, craft, recipe, quality });
    } else {
      craft.status = 'failed';
      
      // 失败惩罚
      this.applyFailurePenalty(recipe.skillRequired);
      
      // 记录制作历史
      this.recordCrafting(craft, 'failed', 'broken');
      
      // 更新统计
      this.updateStats(craft, false, 'broken');
      
      this.addEvent('craft_failed', { craftId, craft, recipe });
    }
    
    // 移除制作任务
    this.activeCrafts.delete(craftId);
  }

  /**
   * 计算最终品质
   */
  private calculateFinalQuality(craft: ActiveCraft, recipe: CraftingRecipe): CraftingQuality {
    let quality = recipe.baseQuality;
    
    // 技能加成
    const skill = this.skills.get(recipe.skillRequired);
    if (skill) {
      const qualityBonus = skill.level * 0.02; // 每级增加2%品质
      if (Math.random() < qualityBonus) {
        quality = this.upgradeQuality(quality);
      }
    }
    
    // 制作台加成
    const station = this.stations.get(craft.stationUsed);
    if (station) {
      const qualityEffect = station.specialEffects.find(e => e.type === 'quality_bonus');
      if (qualityEffect && Math.random() < qualityEffect.value) {
        quality = this.upgradeQuality(quality);
      }
    }
    
    // 工具加成
    for (const toolId of craft.toolsUsed) {
      const tool = this.tools.get(toolId);
      if (tool) {
        const qualityEffect = tool.specialEffects.find(e => e.type === 'quality_bonus');
        if (qualityEffect && Math.random() < qualityEffect.value) {
          quality = this.upgradeQuality(quality);
        }
      }
    }
    
    return quality;
  }

  /**
   * 升级品质
   */
  private upgradeQuality(quality: CraftingQuality): CraftingQuality {
    const qualities: CraftingQuality[] = ['broken', 'poor', 'normal', 'good', 'excellent', 'perfect', 'masterwork', 'legendary'];
    const currentIndex = qualities.indexOf(quality);
    return qualities[Math.min(currentIndex + 1, qualities.length - 1)];
  }

  /**
   * 获得经验
   */
  private gainExperience(skillType: SkillType, amount: number): void {
    const skill = this.skills.get(skillType);
    if (!skill) return;

    const adjustedAmount = Math.round(amount * this.config.experienceMultiplier);
    skill.experience += adjustedAmount;
    skill.totalExperience += adjustedAmount;

    // 检查升级
    while (skill.experience >= skill.experienceToNext) {
      skill.experience -= skill.experienceToNext;
      skill.level++;
      skill.experienceToNext = this.calculateExperienceToNext(skill.level);
      
      this.addEvent('skill_level_up', { skillType, newLevel: skill.level, skill });
    }
  }

  /**
   * 计算升级所需经验
   */
  private calculateExperienceToNext(level: number): number {
    return Math.round(100 * Math.pow(1.5, level - 1));
  }

  /**
   * 应用失败惩罚
   */
  private applyFailurePenalty(skillType: SkillType): void {
    const skill = this.skills.get(skillType);
    if (!skill) return;

    const penalty = Math.round(skill.experience * this.config.failurePenalty);
    skill.experience = Math.max(0, skill.experience - penalty);
  }

  /**
   * 记录制作历史
   */
  private recordCrafting(craft: ActiveCraft, status: CraftingStatus, quality: CraftingQuality): void {
    const record: CraftingRecord = {
      id: this.generateRecordId(),
      recipeId: craft.recipeId,
      timestamp: Date.now(),
      status,
      quality,
      timeSpent: craft.currentTime,
      experienceGained: status === 'completed' ? craft.experienceReward : 0,
      materialsUsed: craft.materialsUsed,
      toolsUsed: craft.toolsUsed,
      stationUsed: craft.stationUsed,
      skillLevel: craft.skillLevel,
      specializations: craft.specializations,
      perks: craft.perks,
      metadata: craft.metadata
    };

    const skill = this.skills.get(this.getRecipe(craft.recipeId)?.skillRequired || 'weaponcraft');
    if (skill) {
      skill.craftingHistory.push(record);
      if (skill.craftingHistory.length > 100) {
        skill.craftingHistory.shift();
      }
    }
  }

  /**
   * 更新统计
   */
  private updateStats(craft: ActiveCraft, success: boolean, quality: CraftingQuality): void {
    this.stats.totalCrafts++;
    
    if (success) {
      this.stats.successfulCrafts++;
    } else {
      this.stats.failedCrafts++;
    }
    
    this.stats.totalExperience += craft.experienceReward;
    
    // 更新平均品质
    const qualityValues = { 'broken': 0, 'poor': 1, 'normal': 2, 'good': 3, 'excellent': 4, 'perfect': 5, 'masterwork': 6, 'legendary': 7 };
    const currentAvg = this.stats.averageQuality;
    const totalCrafts = this.stats.totalCrafts;
    this.stats.averageQuality = (currentAvg * (totalCrafts - 1) + qualityValues[quality]) / totalCrafts;
    
    // 更新最佳品质
    if (qualityValues[quality] > qualityValues[this.stats.bestQuality]) {
      this.stats.bestQuality = quality;
    }
    
    // 更新最快/最慢制作时间
    if (this.stats.fastestCraft === 0 || craft.currentTime < this.stats.fastestCraft) {
      this.stats.fastestCraft = craft.currentTime;
    }
    if (craft.currentTime > this.stats.slowestCraft) {
      this.stats.slowestCraft = craft.currentTime;
    }
    
    // 更新最常制作配方
    const recipeCounts: Record<string, number> = {};
    for (const record of this.getAllCraftingRecords()) {
      recipeCounts[record.recipeId] = (recipeCounts[record.recipeId] || 0) + 1;
    }
    
    let mostCrafted = '';
    let maxCount = 0;
    for (const [recipeId, count] of Object.entries(recipeCounts)) {
      if (count > maxCount) {
        maxCount = count;
        mostCrafted = recipeId;
      }
    }
    this.stats.mostCraftedRecipe = mostCrafted;
    
    // 更新材料使用统计
    this.stats.totalMaterialsUsed += craft.materialsUsed.reduce((sum, mat) => sum + mat.quantity, 0);
    this.stats.totalToolsUsed += craft.toolsUsed.length;
  }

  /**
   * 更新技能衰减
   */
  private updateSkillDecay(): void {
    for (const skill of this.skills.values()) {
      // 技能衰减
      if (skill.experience > 0) {
        const decay = Math.round(skill.experience * this.config.skillDecayRate);
        skill.experience = Math.max(0, skill.experience - decay);
      }
      
      // 专精衰减
      for (const spec of skill.specializations) {
        if (spec.experience > 0) {
          const decay = Math.round(spec.experience * this.config.specializationDecayRate);
          spec.experience = Math.max(0, spec.experience - decay);
        }
      }
    }
  }

  /**
   * 添加制作台
   */
  public addStation(station: CraftingStation): void {
    this.stations.set(station.id, station);
    this.addEvent('station_added', { stationId: station.id, station });
  }

  /**
   * 添加工具
   */
  public addTool(tool: CraftingTool): void {
    this.tools.set(tool.id, tool);
    this.addEvent('tool_added', { toolId: tool.id, tool });
  }

  /**
   * 获取制作统计
   */
  public getCraftingStats(): CraftingStats {
    return { ...this.stats };
  }

  /**
   * 获取所有制作记录
   */
  public getAllCraftingRecords(): CraftingRecord[] {
    const allRecords: CraftingRecord[] = [];
    for (const skill of this.skills.values()) {
      allRecords.push(...skill.craftingHistory);
    }
    return allRecords.sort((a, b) => b.timestamp - a.timestamp);
  }

  /**
   * 获取制作事件
   */
  public getCraftingEvents(): CraftingEvent[] {
    return [...this.events];
  }

  /**
   * 事件处理
   */
  private handleCraftingInteraction(data: any): void {
    console.log('制作交互:', data);
  }

  private handleItemCrafted(data: any): void {
    console.log('物品制作完成:', data);
  }

  private handleCraftingFailed(data: any): void {
    console.log('制作失败:', data);
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
   * 移除玩家物品
   */
  private removePlayerItem(itemId: string, quantity: number, playerData: any): boolean {
    if (!playerData.inventory) return false;
    
    const item = playerData.inventory.find((item: any) => item.id === itemId);
    if (item && item.quantity >= quantity) {
      item.quantity -= quantity;
      if (item.quantity <= 0) {
        const index = playerData.inventory.indexOf(item);
        playerData.inventory.splice(index, 1);
      }
      return true;
    }
    return false;
  }

  /**
   * 生成制作ID
   */
  private generateCraftId(): string {
    return `craft_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * 生成记录ID
   */
  private generateRecordId(): string {
    return `record_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * 添加事件
   */
  private addEvent(type: CraftingEvent['type'], data?: any): void {
    const event: CraftingEvent = {
      type,
      data,
      timestamp: Date.now()
    };
    
    this.events.push(event);
    
    if (this.events.length > 100) {
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
   * 清理资源
   */
  public destroy(): void {
    this.events = [];
    this.callbacks.clear();
    this.activeCrafts.clear();
    
    this.scene = null;
    console.log('增强制作系统已销毁');
  }
}

// 活跃制作任务
interface ActiveCraft {
  id: string;
  recipeId: string;
  playerId: string;
  status: CraftingStatus;
  startTime: number;
  currentTime: number;
  totalTime: number;
  quality: CraftingQuality;
  successRate: number;
  experienceReward: number;
  materialsUsed: CraftingIngredient[];
  toolsUsed: string[];
  stationUsed: string;
  skillLevel: number;
  specializations: string[];
  perks: string[];
  metadata: Record<string, any>;
}
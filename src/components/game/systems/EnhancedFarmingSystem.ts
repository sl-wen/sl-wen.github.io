import * as Phaser from 'phaser';
import { CropType, ToolType } from '../types/GameTypes';
import { GameManager } from './GameManager';
import { TimeWeatherSystem, WeatherType, SeasonType } from './TimeWeatherSystem';
import { AudioManager } from './AudioManager';
import { AnimationManager } from './AnimationManager';

/**
 * 作物品质枚举
 */
export enum CropQuality {
  POOR = 'poor',
  NORMAL = 'normal',
  GOOD = 'good',
  EXCELLENT = 'excellent',
  LEGENDARY = 'legendary'
}

/**
 * 土壤类型枚举
 */
export enum SoilType {
  SANDY = 'sandy',
  LOAMY = 'loamy',
  CLAY = 'clay',
  FERTILE = 'fertile'
}

/**
 * 作物详细信息接口
 */
export interface CropInfo {
  type: CropType;
  name: string;
  description: string;
  growthTime: number; // 基础生长时间（毫秒）
  waterNeed: number; // 水分需求（0-100）
  fertilizerBonus: number; // 肥料加成
  seasonPreference: SeasonType[]; // 适宜季节
  sellPrice: number; // 基础售价
  experienceReward: number; // 经验奖励
  harvestCount: { min: number; max: number }; // 收获数量范围
  rarity: number; // 稀有度（0-1）
  unlockLevel: number; // 解锁等级
}

/**
 * 增强型农业系统
 * 参考top-down-react-phaser-game的农业机制，提供更丰富的种植体验
 */
export class EnhancedFarmingSystem {
  private scene: Phaser.Scene;
  private gameManager: GameManager;
  private timeWeatherSystem: TimeWeatherSystem;
  private audioManager: AudioManager;
  private animationManager: AnimationManager;

  // 作物信息数据库
  private cropDatabase: Map<CropType, CropInfo> = new Map();
  
  // 土壤管理
  private soilMap: Map<string, SoilType> = new Map(); // 位置 -> 土壤类型
  private soilQualityMap: Map<string, number> = new Map(); // 位置 -> 土壤质量(0-100)
  
  // 种植记录
  private plantingHistory: Map<string, {
    cropType: CropType;
    plantTime: number;
    harvestTime: number;
    quality: CropQuality;
  }[]> = new Map();

  // 农业技能系统
  private farmingSkills = {
    level: 1,
    experience: 0,
    experienceToNext: 100,
    bonuses: {
      growthSpeed: 1.0,
      yieldMultiplier: 1.0,
      qualityChance: 0.1,
      waterEfficiency: 1.0
    }
  };

  // 工具耐久度系统
  private toolDurability: Map<ToolType, number> = new Map();
  private toolEfficiency: Map<ToolType, number> = new Map();

  // 作物轮作系统
  private cropRotationBonus: Map<string, number> = new Map();

  constructor(
    scene: Phaser.Scene, 
    timeWeatherSystem: TimeWeatherSystem
  ) {
    this.scene = scene;
    this.gameManager = GameManager.getInstance();
    this.timeWeatherSystem = timeWeatherSystem;
    // 从场景获取共享的系统实例，避免重复创建
    this.audioManager = (scene as any).audioManager || new AudioManager(scene);
    this.animationManager = (scene as any).animationManager || new AnimationManager(scene);

    this.initializeCropDatabase();
    this.initializeTools();
    this.setupEventListeners();
    
    console.log('EnhancedFarmingSystem initialized');
  }

  /**
   * 初始化作物数据库
   */
  private initializeCropDatabase(): void {
    const crops: CropInfo[] = [
      {
        type: CropType.CARROT,
        name: '胡萝卜',
        description: '营养丰富的橙色蔬菜，富含维生素A',
        growthTime: 45000,
        waterNeed: 60,
        fertilizerBonus: 1.2,
        seasonPreference: [SeasonType.SPRING, SeasonType.AUTUMN],
        sellPrice: 15,
        experienceReward: 10,
        harvestCount: { min: 1, max: 3 },
        rarity: 0.1,
        unlockLevel: 1
      },
      {
        type: CropType.TOMATO,
        name: '番茄',
        description: '多汁的红色果实，可用于多种料理',
        growthTime: 60000,
        waterNeed: 80,
        fertilizerBonus: 1.5,
        seasonPreference: [SeasonType.SUMMER],
        sellPrice: 25,
        experienceReward: 15,
        harvestCount: { min: 2, max: 4 },
        rarity: 0.2,
        unlockLevel: 2
      },
      {
        type: CropType.WHEAT,
        name: '小麦',
        description: '制作面包的基本原料',
        growthTime: 30000,
        waterNeed: 40,
        fertilizerBonus: 1.1,
        seasonPreference: [SeasonType.SPRING, SeasonType.SUMMER],
        sellPrice: 8,
        experienceReward: 8,
        harvestCount: { min: 3, max: 6 },
        rarity: 0.05,
        unlockLevel: 1
      },
      {
        type: CropType.CORN,
        name: '玉米',
        description: '高大的谷物作物，营养价值高',
        growthTime: 90000,
        waterNeed: 70,
        fertilizerBonus: 1.3,
        seasonPreference: [SeasonType.SUMMER],
        sellPrice: 30,
        experienceReward: 20,
        harvestCount: { min: 1, max: 2 },
        rarity: 0.3,
        unlockLevel: 3
      },
      {
        type: CropType.STRAWBERRY,
        name: '草莓',
        description: '甜美的红色浆果，深受喜爱',
        growthTime: 75000,
        waterNeed: 90,
        fertilizerBonus: 1.4,
        seasonPreference: [SeasonType.SPRING, SeasonType.SUMMER],
        sellPrice: 40,
        experienceReward: 25,
        harvestCount: { min: 2, max: 5 },
        rarity: 0.4,
        unlockLevel: 4
      },
      {
        type: CropType.LETTUCE,
        name: '生菜',
        description: '清脆的绿叶蔬菜，生长迅速',
        growthTime: 25000,
        waterNeed: 70,
        fertilizerBonus: 1.1,
        seasonPreference: [SeasonType.SPRING, SeasonType.AUTUMN],
        sellPrice: 12,
        experienceReward: 6,
        harvestCount: { min: 1, max: 2 },
        rarity: 0.1,
        unlockLevel: 1
      },
      {
        type: CropType.POTATO,
        name: '土豆',
        description: '营养丰富的块茎作物，用途广泛',
        growthTime: 50000,
        waterNeed: 50,
        fertilizerBonus: 1.2,
        seasonPreference: [SeasonType.SPRING, SeasonType.AUTUMN],
        sellPrice: 18,
        experienceReward: 12,
        harvestCount: { min: 2, max: 4 },
        rarity: 0.15,
        unlockLevel: 2
      },
      {
        type: CropType.PUMPKIN,
        name: '南瓜',
        description: '巨大的橙色果实，秋季的象征',
        growthTime: 120000,
        waterNeed: 60,
        fertilizerBonus: 1.6,
        seasonPreference: [SeasonType.AUTUMN],
        sellPrice: 60,
        experienceReward: 35,
        harvestCount: { min: 1, max: 1 },
        rarity: 0.6,
        unlockLevel: 5
      }
    ];

    crops.forEach(crop => {
      this.cropDatabase.set(crop.type, crop);
    });
  }

  /**
   * 初始化工具系统
   */
  private initializeTools(): void {
    this.toolDurability.set(ToolType.HOE, 100);
    this.toolDurability.set(ToolType.WATERING_CAN, 100);
    this.toolDurability.set(ToolType.FERTILIZER, 50);
    this.toolDurability.set(ToolType.SEEDS, 999);

    this.toolEfficiency.set(ToolType.HOE, 1.0);
    this.toolEfficiency.set(ToolType.WATERING_CAN, 1.0);
    this.toolEfficiency.set(ToolType.FERTILIZER, 1.0);
    this.toolEfficiency.set(ToolType.SEEDS, 1.0);
  }

  /**
   * 设置事件监听器
   */
  private setupEventListeners(): void {
    this.gameManager.on('season-changed', this.onSeasonChange, this);
    this.gameManager.on('weather-changed', this.onWeatherChange, this);
  }

  /**
   * 种植作物
   */
  public plantCrop(
    x: number, 
    y: number, 
    cropType: CropType, 
    soilQuality: number = 50
  ): boolean {
    const cropInfo = this.cropDatabase.get(cropType);
    if (!cropInfo) {
      console.warn(`Unknown crop type: ${cropType}`);
      return false;
    }

    // 检查等级要求
    if (this.farmingSkills.level < cropInfo.unlockLevel) {
      this.gameManager.emit('show-notification', `需要农业等级 ${cropInfo.unlockLevel} 才能种植 ${cropInfo.name}`);
      return false;
    }

    // 检查季节适宜性
    const currentSeason = this.timeWeatherSystem.getCurrentTime().season;
    if (!cropInfo.seasonPreference.includes(currentSeason)) {
      const seasonBonus = this.getSeasonGrowthMultiplier(cropType, currentSeason);
      if (seasonBonus < 0.5) {
        this.gameManager.emit('show-notification', `${cropInfo.name} 在 ${currentSeason} 季节生长困难`);
      }
    }

    // 计算生长时间
    const growthTime = this.calculateGrowthTime(cropType, soilQuality);
    
    // 创建作物实例
    const cropData = {
      type: cropType,
      plantTime: Date.now(),
      expectedHarvestTime: Date.now() + growthTime,
      soilQuality: soilQuality,
      waterLevel: 100,
      fertilizerLevel: 0,
      quality: this.calculateInitialQuality(cropType, soilQuality)
    };

    // 记录种植历史
    const positionKey = `${x},${y}`;
    if (!this.plantingHistory.has(positionKey)) {
      this.plantingHistory.set(positionKey, []);
    }

    // 播放种植音效
    this.audioManager.playFarmSound('plant');
    
    // 播放种植动画
    this.animationManager.playAnimation(this.scene.add.sprite(x, y, 'plant_effect'), 'plant_seed');

    // 增加经验
    this.gainExperience(cropInfo.experienceReward * 0.5); // 种植获得一半经验

    // 消耗工具耐久度
    this.consumeToolDurability(ToolType.SEEDS, 1);

    console.log(`Planted ${cropInfo.name} at (${x}, ${y})`);
    return true;
  }

  /**
   * 浇水
   */
  public waterCrop(x: number, y: number, crop: any): boolean {
    if (!crop || crop.waterLevel >= 100) {
      return false;
    }

    const efficiency = this.toolEfficiency.get(ToolType.WATERING_CAN) || 1.0;
    const waterAmount = 30 * efficiency * this.farmingSkills.bonuses.waterEfficiency;
    
    crop.waterLevel = Math.min(100, crop.waterLevel + waterAmount);
    
    // 播放浇水音效和动画
    this.audioManager.playFarmSound('water');
    this.animationManager.playAnimation(
      this.scene.add.sprite(x, y, 'water_effect'), 
      'water_splash'
    );

    // 消耗工具耐久度
    this.consumeToolDurability(ToolType.WATERING_CAN, 2);

    // 增加少量经验
    this.gainExperience(2);

    return true;
  }

  /**
   * 施肥
   */
  public fertilizeCrop(x: number, y: number, crop: any): boolean {
    if (!crop || crop.fertilizerLevel >= 100) {
      return false;
    }

    const cropInfo = this.cropDatabase.get(crop.type);
    if (!cropInfo) return false;

    crop.fertilizerLevel = 100;
    crop.growthSpeedMultiplier = (crop.growthSpeedMultiplier || 1.0) * cropInfo.fertilizerBonus;

    // 播放施肥音效和动画
    this.audioManager.playFarmSound('fertilize');
    this.animationManager.playAnimation(
      this.scene.add.sprite(x, y, 'fertilizer_effect'), 
      'fertilizer_sparkle'
    );

    // 消耗工具耐久度
    this.consumeToolDurability(ToolType.FERTILIZER, 10);

    // 增加经验
    this.gainExperience(5);

    return true;
  }

  /**
   * 收获作物
   */
  public harvestCrop(x: number, y: number, crop: any): {
    success: boolean;
    items: { type: CropType; quality: CropQuality; quantity: number }[];
    experience: number;
  } {
    const cropInfo = this.cropDatabase.get(crop.type);
    if (!cropInfo || !crop.isReadyToHarvest) {
      return { success: false, items: [], experience: 0 };
    }

    // 计算收获品质
    const quality = this.calculateHarvestQuality(crop);
    
    // 计算收获数量
    const baseQuantity = Phaser.Math.Between(cropInfo.harvestCount.min, cropInfo.harvestCount.max);
    const bonusQuantity = Math.floor(baseQuantity * this.farmingSkills.bonuses.yieldMultiplier);
    const totalQuantity = baseQuantity + bonusQuantity;

    // 计算经验奖励
    const experienceReward = cropInfo.experienceReward * this.getQualityMultiplier(quality);

    // 记录收获历史
    const positionKey = `${x},${y}`;
    const history = this.plantingHistory.get(positionKey) || [];
    history.push({
      cropType: crop.type,
      plantTime: crop.plantTime,
      harvestTime: Date.now(),
      quality: quality
    });
    this.plantingHistory.set(positionKey, history);

    // 更新轮作奖励
    this.updateCropRotationBonus(positionKey, crop.type);

    // 播放收获音效和动画
    this.audioManager.playFarmSound('harvest');
    this.animationManager.playAnimation(
      this.scene.add.sprite(x, y, 'harvest_effect'), 
      'harvest_glow'
    );

    // 增加经验
    this.gainExperience(experienceReward);

    // 检查成就
    this.checkHarvestAchievements(crop.type, quality, totalQuantity);

    console.log(`Harvested ${totalQuantity}x ${quality} ${cropInfo.name}`);

    return {
      success: true,
      items: [{
        type: crop.type,
        quality: quality,
        quantity: totalQuantity
      }],
      experience: experienceReward
    };
  }

  /**
   * 计算生长时间
   */
  private calculateGrowthTime(cropType: CropType, soilQuality: number): number {
    const cropInfo = this.cropDatabase.get(cropType);
    if (!cropInfo) return 60000;

    let growthTime = cropInfo.growthTime;
    
    // 土壤质量影响
    const soilMultiplier = 0.5 + (soilQuality / 100) * 0.5; // 0.5 - 1.0
    growthTime *= soilMultiplier;

    // 季节影响
    const currentSeason = this.timeWeatherSystem.getCurrentTime().season;
    const seasonMultiplier = this.getSeasonGrowthMultiplier(cropType, currentSeason);
    growthTime *= seasonMultiplier;

    // 技能影响
    growthTime *= (2 - this.farmingSkills.bonuses.growthSpeed); // 技能越高，时间越短

    return Math.max(growthTime, cropInfo.growthTime * 0.1); // 最快不能少于10%原时间
  }

  /**
   * 获取季节生长倍率
   */
  private getSeasonGrowthMultiplier(cropType: CropType, season: SeasonType): number {
    const cropInfo = this.cropDatabase.get(cropType);
    if (!cropInfo) return 1.0;

    if (cropInfo.seasonPreference.includes(season)) {
      return 0.8; // 适宜季节生长快20%
    } else {
      return 1.5; // 不适宜季节生长慢50%
    }
  }

  /**
   * 计算初始品质
   */
  private calculateInitialQuality(cropType: CropType, soilQuality: number): CropQuality {
    const baseChance = soilQuality / 100;
    const skillBonus = this.farmingSkills.bonuses.qualityChance;
    const totalChance = baseChance + skillBonus;

    if (totalChance > 0.8) return CropQuality.EXCELLENT;
    if (totalChance > 0.6) return CropQuality.GOOD;
    if (totalChance > 0.3) return CropQuality.NORMAL;
    return CropQuality.POOR;
  }

  /**
   * 计算收获品质
   */
  private calculateHarvestQuality(crop: any): CropQuality {
    let qualityScore = 0;

    // 基础品质
    qualityScore += this.getQualityScore(crop.quality);

    // 水分影响
    if (crop.waterLevel >= 80) qualityScore += 20;
    else if (crop.waterLevel >= 60) qualityScore += 10;
    else if (crop.waterLevel < 30) qualityScore -= 20;

    // 肥料影响
    if (crop.fertilizerLevel >= 50) qualityScore += 15;

    // 天气影响
    const weatherEffect = this.timeWeatherSystem.getWeatherEffect();
    qualityScore += weatherEffect.growth * 10;

    // 轮作奖励
    const rotationBonus = this.getCropRotationBonus(crop.x, crop.y);
    qualityScore += rotationBonus;

    // 技能奖励
    qualityScore += this.farmingSkills.bonuses.qualityChance * 50;

    return this.scoreToQuality(qualityScore);
  }

  /**
   * 品质分数转换
   */
  private getQualityScore(quality: CropQuality): number {
    switch (quality) {
      case CropQuality.POOR: return 10;
      case CropQuality.NORMAL: return 30;
      case CropQuality.GOOD: return 50;
      case CropQuality.EXCELLENT: return 70;
      case CropQuality.LEGENDARY: return 90;
      default: return 30;
    }
  }

  /**
   * 分数转品质
   */
  private scoreToQuality(score: number): CropQuality {
    if (score >= 85) return CropQuality.LEGENDARY;
    if (score >= 70) return CropQuality.EXCELLENT;
    if (score >= 50) return CropQuality.GOOD;
    if (score >= 30) return CropQuality.NORMAL;
    return CropQuality.POOR;
  }

  /**
   * 获取品质倍率
   */
  private getQualityMultiplier(quality: CropQuality): number {
    switch (quality) {
      case CropQuality.POOR: return 0.5;
      case CropQuality.NORMAL: return 1.0;
      case CropQuality.GOOD: return 1.5;
      case CropQuality.EXCELLENT: return 2.0;
      case CropQuality.LEGENDARY: return 3.0;
      default: return 1.0;
    }
  }

  /**
   * 更新轮作奖励
   */
  private updateCropRotationBonus(position: string, cropType: CropType): void {
    const history = this.plantingHistory.get(position) || [];
    if (history.length >= 2) {
      const lastCrop = history[history.length - 2];
      if (lastCrop.cropType !== cropType) {
        // 不同作物轮作，增加奖励
        this.cropRotationBonus.set(position, 10);
      } else {
        // 连续种植同一作物，减少奖励
        const currentBonus = this.cropRotationBonus.get(position) || 0;
        this.cropRotationBonus.set(position, Math.max(0, currentBonus - 5));
      }
    }
  }

  /**
   * 获取轮作奖励
   */
  private getCropRotationBonus(x: number, y: number): number {
    const position = `${x},${y}`;
    return this.cropRotationBonus.get(position) || 0;
  }

  /**
   * 增加经验
   */
  private gainExperience(amount: number): void {
    this.farmingSkills.experience += amount;
    
    // 检查升级
    while (this.farmingSkills.experience >= this.farmingSkills.experienceToNext) {
      this.farmingSkills.experience -= this.farmingSkills.experienceToNext;
      this.farmingSkills.level++;
      this.farmingSkills.experienceToNext = Math.floor(this.farmingSkills.experienceToNext * 1.2);
      
      // 升级奖励
      this.updateSkillBonuses();
      this.gameManager.emit('skill-level-up', {
        skill: 'farming',
        level: this.farmingSkills.level
      });
      
      console.log(`Farming level up! New level: ${this.farmingSkills.level}`);
    }
  }

  /**
   * 更新技能奖励
   */
  private updateSkillBonuses(): void {
    const level = this.farmingSkills.level;
    this.farmingSkills.bonuses = {
      growthSpeed: 1.0 + (level - 1) * 0.05, // 每级增加5%生长速度
      yieldMultiplier: 1.0 + (level - 1) * 0.03, // 每级增加3%产量
      qualityChance: 0.1 + (level - 1) * 0.02, // 每级增加2%品质概率
      waterEfficiency: 1.0 + (level - 1) * 0.04 // 每级增加4%浇水效率
    };
  }

  /**
   * 消耗工具耐久度
   */
  private consumeToolDurability(tool: ToolType, amount: number): void {
    const current = this.toolDurability.get(tool) || 0;
    const newDurability = Math.max(0, current - amount);
    this.toolDurability.set(tool, newDurability);

    if (newDurability <= 0) {
      this.gameManager.emit('tool-broken', tool);
    } else if (newDurability <= 20) {
      this.gameManager.emit('tool-low-durability', { tool, durability: newDurability });
    }
  }

  /**
   * 检查收获成就
   */
  private checkHarvestAchievements(cropType: CropType, quality: CropQuality, quantity: number): void {
    // 这里可以添加各种成就检查逻辑
    if (quality === CropQuality.LEGENDARY) {
      this.gameManager.emit('achievement-unlocked', 'legendary_harvest');
    }
    
    if (quantity >= 5) {
      this.gameManager.emit('achievement-unlocked', 'abundant_harvest');
    }
  }

  /**
   * 季节变化处理
   */
  private onSeasonChange(season: SeasonType): void {
    console.log(`Season changed to ${season}, updating crop growth rates`);
    // 可以在这里添加季节变化的特殊处理逻辑
  }

  /**
   * 天气变化处理
   */
  private onWeatherChange(weatherData: { weather: any; intensity: number }): void {
    console.log(`Weather changed, updating crop conditions`);
    // 可以在这里添加天气变化的特殊处理逻辑
  }

  /**
   * 获取作物信息
   */
  public getCropInfo(cropType: CropType): CropInfo | undefined {
    return this.cropDatabase.get(cropType);
  }

  /**
   * 获取农业技能信息
   */
  public getFarmingSkills() {
    return { ...this.farmingSkills };
  }

  /**
   * 获取工具状态
   */
  public getToolStatus(): Map<ToolType, { durability: number; efficiency: number }> {
    const status = new Map();
    for (const [tool, durability] of this.toolDurability) {
      status.set(tool, {
        durability,
        efficiency: this.toolEfficiency.get(tool) || 1.0
      });
    }
    return status;
  }

  /**
   * 销毁系统
   */
  public destroy(): void {
    this.gameManager.off('season-changed', this.onSeasonChange, this);
    this.gameManager.off('weather-changed', this.onWeatherChange, this);
  }
}
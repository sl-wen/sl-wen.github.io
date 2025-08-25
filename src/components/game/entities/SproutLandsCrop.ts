export type CropType = 
  | 'carrot' 
  | 'tomato' 
  | 'wheat' 
  | 'corn' 
  | 'strawberry' 
  | 'lettuce' 
  | 'potato' 
  | 'pumpkin';

export type CropGrowthStage = 'seed' | 'sprout' | 'growing' | 'mature' | 'ready';

export interface CropData {
  type: CropType;
  name: string;
  growthTime: number; // in milliseconds
  sellPrice: number;
  seedCost: number;
  waterRequirement: number;
  seasons: string[];
  harvestYield: number;
}

export interface CropState {
  type: CropType;
  stage: CropGrowthStage;
  plantedTime: number;
  lastWateredTime: number;
  waterLevel: number;
  quality: 'poor' | 'normal' | 'good' | 'excellent';
  isWithered: boolean;
}

export class SproutLandsCrop {
  private state: CropState;
  private static cropDatabase: Record<CropType, CropData> = {
    carrot: {
      type: 'carrot',
      name: '胡萝卜',
      growthTime: 45000, // 45 seconds
      sellPrice: 35,
      seedCost: 20,
      waterRequirement: 3,
      seasons: ['春季', '秋季'],
      harvestYield: 1
    },
    tomato: {
      type: 'tomato',
      name: '番茄',
      growthTime: 60000, // 60 seconds
      sellPrice: 60,
      seedCost: 50,
      waterRequirement: 4,
      seasons: ['夏季'],
      harvestYield: 2
    },
    wheat: {
      type: 'wheat',
      name: '小麦',
      growthTime: 30000, // 30 seconds
      sellPrice: 25,
      seedCost: 10,
      waterRequirement: 2,
      seasons: ['春季', '夏季', '秋季'],
      harvestYield: 3
    },
    corn: {
      type: 'corn',
      name: '玉米',
      growthTime: 90000, // 90 seconds
      sellPrice: 100,
      seedCost: 80,
      waterRequirement: 5,
      seasons: ['夏季'],
      harvestYield: 2
    },
    strawberry: {
      type: 'strawberry',
      name: '草莓',
      growthTime: 75000, // 75 seconds
      sellPrice: 120,
      seedCost: 100,
      waterRequirement: 4,
      seasons: ['春季', '夏季'],
      harvestYield: 3
    },
    lettuce: {
      type: 'lettuce',
      name: '生菜',
      growthTime: 25000, // 25 seconds
      sellPrice: 20,
      seedCost: 15,
      waterRequirement: 3,
      seasons: ['春季', '秋季'],
      harvestYield: 1
    },
    potato: {
      type: 'potato',
      name: '土豆',
      growthTime: 50000, // 50 seconds
      sellPrice: 40,
      seedCost: 25,
      waterRequirement: 3,
      seasons: ['春季', '秋季'],
      harvestYield: 2
    },
    pumpkin: {
      type: 'pumpkin',
      name: '南瓜',
      growthTime: 120000, // 120 seconds
      sellPrice: 200,
      seedCost: 100,
      waterRequirement: 6,
      seasons: ['秋季'],
      harvestYield: 1
    }
  };

  constructor(type: CropType, plantedTime: number = Date.now()) {
    this.state = {
      type,
      stage: 'seed',
      plantedTime,
      lastWateredTime: plantedTime,
      waterLevel: 1,
      quality: 'normal',
      isWithered: false
    };
  }

  // Growth management
  update(currentTime: number): void {
    if (this.state.isWithered || this.state.stage === 'ready') {
      return;
    }

    const cropData = SproutLandsCrop.cropDatabase[this.state.type];
    const timeSincePlanted = currentTime - this.state.plantedTime;
    const timeSinceWatered = currentTime - this.state.lastWateredTime;

    // Check if crop needs water (withers after 30 seconds without water)
    if (timeSinceWatered > 30000 && this.state.waterLevel <= 0) {
      this.state.isWithered = true;
      this.state.quality = 'poor';
      return;
    }

    // Decrease water level over time
    if (timeSinceWatered > 10000) { // Every 10 seconds
      this.state.waterLevel = Math.max(0, this.state.waterLevel - 1);
    }

    // Update growth stage based on time
    const growthProgress = timeSincePlanted / cropData.growthTime;

    if (growthProgress >= 1.0) {
      this.state.stage = 'ready';
    } else if (growthProgress >= 0.75) {
      this.state.stage = 'mature';
    } else if (growthProgress >= 0.5) {
      this.state.stage = 'growing';
    } else if (growthProgress >= 0.25) {
      this.state.stage = 'sprout';
    }

    // Update quality based on care
    this.updateQuality();
  }

  private updateQuality(): void {
    const cropData = SproutLandsCrop.cropDatabase[this.state.type];
    const currentTime = Date.now();
    const timeSinceWatered = currentTime - this.state.lastWateredTime;

    // Quality factors
    let qualityScore = 50; // Base score

    // Water care bonus
    if (this.state.waterLevel >= cropData.waterRequirement) {
      qualityScore += 30;
    } else if (this.state.waterLevel > 0) {
      qualityScore += 10;
    }

    // Consistent care bonus
    if (timeSinceWatered < 15000) { // Well watered recently
      qualityScore += 20;
    }

    // Determine quality tier
    if (qualityScore >= 90) {
      this.state.quality = 'excellent';
    } else if (qualityScore >= 70) {
      this.state.quality = 'good';
    } else if (qualityScore >= 40) {
      this.state.quality = 'normal';
    } else {
      this.state.quality = 'poor';
    }
  }

  // Watering
  water(): boolean {
    if (this.state.isWithered || this.state.stage === 'ready') {
      return false;
    }

    const cropData = SproutLandsCrop.cropDatabase[this.state.type];
    this.state.waterLevel = Math.min(cropData.waterRequirement + 1, this.state.waterLevel + 2);
    this.state.lastWateredTime = Date.now();

    // Revive withered crops if watered early enough
    if (this.state.isWithered && Date.now() - this.state.lastWateredTime < 60000) {
      this.state.isWithered = false;
    }

    return true;
  }

  // Harvesting
  isReady(): boolean {
    return this.state.stage === 'ready' && !this.state.isWithered;
  }

  canHarvest(): boolean {
    return this.isReady();
  }

  getHarvestItem(): { 
    id: string;
    name: string;
    type: 'crop'; 
    quantity: number; 
    quality: 'poor' | 'normal' | 'good' | 'excellent'; 
    value: number;
    experience: number;
    stackable: boolean;
    maxStack: number;
  } {
    if (!this.canHarvest()) {
      throw new Error('Crop is not ready for harvest');
    }

    const cropData = SproutLandsCrop.cropDatabase[this.state.type];
    const qualityMultiplier = this.getQualityMultiplier();
    
    return {
      id: `crop_${this.state.type}`,
      name: cropData.name,
      type: 'crop',
      quantity: cropData.harvestYield,
      quality: this.state.quality,
      value: Math.floor(cropData.sellPrice * qualityMultiplier),
      experience: this.getExperienceReward(),
      stackable: true,
      maxStack: 99
    };
  }

  private getQualityMultiplier(): number {
    switch (this.state.quality) {
      case 'excellent': return 1.5;
      case 'good': return 1.2;
      case 'normal': return 1.0;
      case 'poor': return 0.5;
      default: return 1.0;
    }
  }

  private getExperienceReward(): number {
    const baseXP = 10;
    const qualityBonus = {
      excellent: 5,
      good: 3,
      normal: 0,
      poor: -2
    };

    return Math.max(1, baseXP + qualityBonus[this.state.quality]);
  }

  // Getters
  getType(): CropType {
    return this.state.type;
  }

  getStage(): CropGrowthStage {
    return this.state.stage;
  }

  getWaterLevel(): number {
    return this.state.waterLevel;
  }

  getQuality(): string {
    return this.state.quality;
  }

  isWithered(): boolean {
    return this.state.isWithered;
  }

  getGrowthProgress(): number {
    const cropData = SproutLandsCrop.cropDatabase[this.state.type];
    const timeSincePlanted = Date.now() - this.state.plantedTime;
    return Math.min(1.0, timeSincePlanted / cropData.growthTime);
  }

  getCropData(): CropData {
    return { ...SproutLandsCrop.cropDatabase[this.state.type] };
  }

  // Sprite information for rendering
  getSpriteInfo(): {
    spriteX: number;
    spriteY: number;
    width: number;
    height: number;
  } {
    // Map crop types to sprite sheet positions
    const cropSpriteMap: Record<CropType, number> = {
      carrot: 0,
      tomato: 1,
      wheat: 2,
      corn: 3,
      strawberry: 4,
      lettuce: 5,
      potato: 6,
      pumpkin: 7
    };

    // Map growth stages to sprite columns
    const stageMap: Record<CropGrowthStage, number> = {
      seed: 0,
      sprout: 1,
      growing: 2,
      mature: 3,
      ready: 4
    };

    const cropRow = cropSpriteMap[this.state.type] || 0;
    const stageColumn = stageMap[this.state.stage] || 0;

    return {
      spriteX: stageColumn * 16,
      spriteY: cropRow * 16,
      width: 16,
      height: 16
    };
  }

  // Static methods
  static getCropData(type: CropType): CropData {
    return { ...SproutLandsCrop.cropDatabase[type] };
  }

  static getAllCropTypes(): CropType[] {
    return Object.keys(SproutLandsCrop.cropDatabase) as CropType[];
  }

  // Save/Load functionality
  save(): any {
    return { ...this.state };
  }

  static load(data: any): SproutLandsCrop {
    const crop = new SproutLandsCrop(data.type, data.plantedTime);
    crop.state = { ...data };
    return crop;
  }
}

export default SproutLandsCrop;
import * as Phaser from 'phaser';
import { Crop as CropData, CropType, CropStage } from '../types/GameTypes';

// 作物类 - 管理农场中单个作物的生长、状态和视觉效果
export class Crop extends Phaser.GameObjects.Sprite {
  private cropData: CropData; // 作物的完整数据状态
  private growthTimer: Phaser.Time.TimerEvent | null = null; // 生长计时器
  private waterIndicator: Phaser.GameObjects.Graphics | null = null; // 水分指示器
  private fertilizerIndicator: Phaser.GameObjects.Graphics | null = null; // 肥料指示器

  // 构造函数 - 创建新的作物实例
  constructor(scene: Phaser.Scene, x: number, y: number, cropType: CropType) {
    super(scene, x, y, `${cropType}_seed`);

    // 初始化作物数据
    this.cropData = {
      type: cropType, // 作物类型
      stage: CropStage.SEED, // 初始阶段为种子
      waterLevel: 50, // 初始水分50%
      fertilizerLevel: 0, // 初始无肥料
      growthTime: 0, // 已生长时间为0
      maxGrowthTime: this.getMaxGrowthTime(cropType), // 获取该作物的最大生长时间
      harvestYield: this.getHarvestYield(cropType), // 获取该作物的收获产量
      x: x, // 作物X坐标
      y: y // 作物Y坐标
    };

    // 将作物添加到游戏场景
    scene.add.existing(this);
    this.setDepth(5); // 设置渲染层级
    this.setOrigin(0.5, 1); // 设置原点为底部中心

    // 开始生长计时器
    this.startGrowthTimer();

    // 创建状态指示器
    this.createIndicators();
  }

  // 获取不同作物的最大生长时间 - 每种作物有不同的成熟时间
  private getMaxGrowthTime(cropType: CropType): number {
    const growthTimes = {
      [CropType.CARROT]: 45000,     // 胡萝卜：45秒
      [CropType.TOMATO]: 60000,     // 番茄：60秒
      [CropType.WHEAT]: 30000,      // 小麦：30秒
      [CropType.CORN]: 90000,       // 玉米：90秒
      [CropType.STRAWBERRY]: 75000, // 草莓：75秒
      [CropType.LETTUCE]: 25000,    // 生菜：25秒
      [CropType.POTATO]: 50000,     // 土豆：50秒
      [CropType.PUMPKIN]: 120000    // 南瓜：120秒
    };
    return growthTimes[cropType];
  }

  // 获取不同作物的收获产量 - 每种作物收获时获得的数量不同
  private getHarvestYield(cropType: CropType): number {
    const yields = {
      [CropType.CARROT]: 2,    // 胡萝卜：2个
      [CropType.TOMATO]: 3,    // 番茄：3个
      [CropType.WHEAT]: 4,     // 小麦：4个
      [CropType.CORN]: 2,      // 玉米：2个
      [CropType.STRAWBERRY]: 5, // 草莓：5个
      [CropType.LETTUCE]: 3,   // 生菜：3个
      [CropType.POTATO]: 3,    // 土豆：3个
      [CropType.PUMPKIN]: 1    // 南瓜：1个（但价值高）
    };
    return yields[cropType];
  }

  // 创建作物状态指示器 - 显示水分和肥料状态
  private createIndicators() {
    // 水分指示器（蓝色条状图）
    this.waterIndicator = this.scene.add.graphics();
    this.waterIndicator.setDepth(15); // 设置在较高层级，确保可见

    // 肥料指示器（绿色条状图）
    this.fertilizerIndicator = this.scene.add.graphics();
    this.fertilizerIndicator.setDepth(15);

    // 初始化指示器显示
    this.updateIndicators();
  }

  // 更新状态指示器的显示 - 根据当前水分和肥料等级绘制进度条
  private updateIndicators() {
    if (!this.waterIndicator || !this.fertilizerIndicator) return;

    // 清除之前的绘制内容
    this.waterIndicator.clear();
    this.fertilizerIndicator.clear();

    // 水分指示器设置
    const waterBarWidth = 20; // 进度条宽度
    const waterBarHeight = 3; // 进度条高度
    const waterX = this.x - waterBarWidth / 2; // 居中对齐
    const waterY = this.y - this.height - 15; // 位于作物上方

    // 绘制水分指示器背景（深灰色）
    this.waterIndicator.fillStyle(0x333333);
    this.waterIndicator.fillRect(waterX, waterY, waterBarWidth, waterBarHeight);

    // 绘制水分指示器填充（蓝色，根据水分等级调整宽度）
    const waterFillWidth = (this.cropData.waterLevel / 100) * waterBarWidth;
    this.waterIndicator.fillStyle(0x4A90E2); // 蓝色
    this.waterIndicator.fillRect(waterX, waterY, waterFillWidth, waterBarHeight);

    // 肥料指示器（只在施肥后显示）
    if (this.cropData.fertilizerLevel > 0) {
      const fertilizerY = waterY - 5; // 位于水分指示器上方
      this.fertilizerIndicator.fillStyle(0x333333);
      this.fertilizerIndicator.fillRect(waterX, fertilizerY, waterBarWidth, waterBarHeight);

      const fertilizerFillWidth = (this.cropData.fertilizerLevel / 100) * waterBarWidth;
      this.fertilizerIndicator.fillStyle(0x7ED321);
      this.fertilizerIndicator.fillRect(waterX, fertilizerY, fertilizerFillWidth, waterBarHeight);
    }
  }

  private startGrowthTimer() {
    if (this.growthTimer) {
      this.growthTimer.destroy();
    }

    this.growthTimer = this.scene.time.addEvent({
      delay: 1000, // Update every second
      callback: this.updateGrowth,
      callbackScope: this,
      loop: true
    });
  }

  private updateGrowth() {
    if (this.cropData.stage === CropStage.MATURE || this.cropData.stage === CropStage.WITHERED) {
      return;
    }

    // Growth rate affected by water and fertilizer
    let growthRate = 1000; // Base growth per second
    
    // Water affects growth rate
    if (this.cropData.waterLevel > 60) {
      growthRate *= 1.5; // 50% faster growth when well-watered
    } else if (this.cropData.waterLevel < 30) {
      growthRate *= 0.5; // 50% slower growth when dry
    }

    // Fertilizer boosts growth
    if (this.cropData.fertilizerLevel > 0) {
      growthRate *= (1 + this.cropData.fertilizerLevel / 100); // Up to 100% faster
    }

    this.cropData.growthTime += growthRate;

    // Decrease water level over time
    this.cropData.waterLevel = Math.max(0, this.cropData.waterLevel - 0.5);

    // Decrease fertilizer level over time
    if (this.cropData.fertilizerLevel > 0) {
      this.cropData.fertilizerLevel = Math.max(0, this.cropData.fertilizerLevel - 0.2);
    }

    // Check for stage progression
    this.checkStageProgression();

    // Update visual indicators
    this.updateIndicators();

    // Check if crop should wither
    if (this.cropData.waterLevel === 0 && this.cropData.stage !== CropStage.SEED) {
      this.scene.time.delayedCall(10000, () => {
        if (this.cropData.waterLevel === 0) {
          this.wither();
        }
      });
    }
  }

  private checkStageProgression() {
    const progress = this.cropData.growthTime / this.cropData.maxGrowthTime;

    let newStage = this.cropData.stage;

    if (progress >= 1.0 && this.cropData.stage !== CropStage.MATURE) {
      newStage = CropStage.MATURE;
    } else if (progress >= 0.7 && this.cropData.stage === CropStage.GROWING) {
      // Stay in growing stage until fully mature
    } else if (progress >= 0.3 && this.cropData.stage === CropStage.SPROUT) {
      newStage = CropStage.GROWING;
    } else if (progress >= 0.1 && this.cropData.stage === CropStage.SEED) {
      newStage = CropStage.SPROUT;
    }

    if (newStage !== this.cropData.stage) {
      this.cropData.stage = newStage;
      this.updateVisual();
    }
  }

  private updateVisual() {
    const textureName = `${this.cropData.type}_${this.cropData.stage}`;
    this.setTexture(textureName);

    // Add growth particle effect
    if (this.cropData.stage !== CropStage.WITHERED) {
      const particles = this.scene.add.particles(this.x, this.y - 10, 'sparkle', {
        scale: { start: 0.2, end: 0 },
        alpha: { start: 1, end: 0 },
        tint: 0x7ED321,
        lifespan: 500,
        quantity: 3,
        speed: { min: 10, max: 30 },
        gravityY: -50
      });

      this.scene.time.delayedCall(500, () => {
        particles.destroy();
      });
    }
  }

  public water(amount: number = 30) {
    if (this.cropData.stage === CropStage.WITHERED) return false;

    this.cropData.waterLevel = Math.min(100, this.cropData.waterLevel + amount);
    this.updateIndicators();

    // Water particle effect
    const particles = this.scene.add.particles(this.x, this.y - 20, 'water_drop', {
      scale: { start: 0.3, end: 0 },
      alpha: { start: 1, end: 0 },
      tint: 0x4A90E2,
      lifespan: 800,
      quantity: 5,
      speed: { min: 20, max: 40 },
      gravityY: 100
    });

    this.scene.time.delayedCall(800, () => {
      particles.destroy();
    });

    return true;
  }

  public fertilize(amount: number = 50) {
    if (this.cropData.stage === CropStage.WITHERED || this.cropData.stage === CropStage.MATURE) {
      return false;
    }

    this.cropData.fertilizerLevel = Math.min(100, this.cropData.fertilizerLevel + amount);
    this.updateIndicators();

    // Fertilizer particle effect
    const particles = this.scene.add.particles(this.x, this.y - 20, 'sparkle', {
      scale: { start: 0.4, end: 0 },
      alpha: { start: 1, end: 0 },
      tint: 0x7ED321,
      lifespan: 1000,
      quantity: 8,
      speed: { min: 30, max: 50 },
      gravityY: -20
    });

    this.scene.time.delayedCall(1000, () => {
      particles.destroy();
    });

    return true;
  }

  public harvest(): { success: boolean; yield: number; quality: 'poor' | 'good' | 'excellent' } {
    if (this.cropData.stage !== CropStage.MATURE) {
      return { success: false, yield: 0, quality: 'poor' };
    }

    // Calculate quality based on care
    let quality: 'poor' | 'good' | 'excellent' = 'good';
    let yieldMultiplier = 1;

    if (this.cropData.waterLevel > 70 && this.cropData.fertilizerLevel > 30) {
      quality = 'excellent';
      yieldMultiplier = 1.5;
    } else if (this.cropData.waterLevel < 30) {
      quality = 'poor';
      yieldMultiplier = 0.7;
    }

    const finalYield = Math.floor(this.cropData.harvestYield * yieldMultiplier);

    // Harvest particle effect
    const particles = this.scene.add.particles(this.x, this.y - 10, 'sparkle', {
      scale: { start: 0.5, end: 0 },
      alpha: { start: 1, end: 0 },
      tint: 0xFFD700,
      lifespan: 1500,
      quantity: 12,
      speed: { min: 40, max: 80 },
      gravityY: -30
    });

    this.scene.time.delayedCall(1500, () => {
      particles.destroy();
    });

    // Remove the crop
    this.destroy();

    return { success: true, yield: finalYield, quality };
  }

  private wither() {
    if (this.cropData.stage === CropStage.WITHERED) return;

    this.cropData.stage = CropStage.WITHERED;
    this.setTexture(`${this.cropData.type}_withered`);
    this.setTint(0x8B4513); // Brown tint for withered crops

    // Stop growth
    if (this.growthTimer) {
      this.growthTimer.destroy();
      this.growthTimer = null;
    }
  }

  public getCropData(): CropData {
    return { ...this.cropData };
  }

  public canInteract(): boolean {
    return this.cropData.stage === CropStage.MATURE || this.cropData.stage === CropStage.WITHERED;
  }

  public getInteractionText(): string {
    if (this.cropData.stage === CropStage.MATURE) {
      return `收获 ${this.getCropDisplayName()}`;
    } else if (this.cropData.stage === CropStage.WITHERED) {
      return '清除枯萎的作物';
    }
    return '';
  }

  private getCropDisplayName(): string {
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
    return names[this.cropData.type];
  }

  destroy() {
    if (this.growthTimer) {
      this.growthTimer.destroy();
    }
    if (this.waterIndicator) {
      this.waterIndicator.destroy();
    }
    if (this.fertilizerIndicator) {
      this.fertilizerIndicator.destroy();
    }
    super.destroy();
  }
}
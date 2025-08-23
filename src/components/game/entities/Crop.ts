import * as Phaser from 'phaser';
import { Crop as CropData, CropStage, CropType } from '../types/GameTypes';

/**
 * 作物类 - 管理农场中单个作物的生长、状态和视觉效果
 * 继承自Phaser的Sprite，负责作物的生命周期管理
 */
export class Crop extends Phaser.GameObjects.Sprite {
  private cropData: CropData;                                    // 作物的完整数据状态
  private growthTimer: Phaser.Time.TimerEvent | null = null;    // 生长计时器
  private waterIndicator: Phaser.GameObjects.Graphics | null = null;    // 水分指示器
  private fertilizerIndicator: Phaser.GameObjects.Graphics | null = null; // 肥料指示器

  /**
   * 构造函数
   * 创建新的作物实例
   * @param scene Phaser场景对象
   * @param x 作物的X坐标位置
   * @param y 作物的Y坐标位置
   * @param cropType 作物类型
   */
  constructor(scene: Phaser.Scene, x: number, y: number, cropType: CropType) {
    super(scene, x, y, `${cropType}_seed`);  // 调用父类构造函数，使用种子纹理

    // 初始化作物数据
    this.cropData = {
      type: cropType,                                    // 作物类型
      stage: CropStage.SEED,                            // 初始阶段为种子
      waterLevel: 50,                                   // 初始水分50%
      fertilizerLevel: 0,                               // 初始无肥料
      growthTime: 0,                                    // 已生长时间为0
      maxGrowthTime: this.getMaxGrowthTime(cropType),   // 获取该作物的最大生长时间
      harvestYield: this.getHarvestYield(cropType),     // 获取该作物的收获产量
      x: x,                                             // 作物X坐标
      y: y                                              // 作物Y坐标
    };

    // 将作物添加到游戏场景
    scene.add.existing(this);  // 添加到显示列表
    this.setDepth(5);          // 设置渲染层级为5
    this.setOrigin(0.5, 1);    // 设置原点为底部中心，便于种植对齐

    // 开始生长计时器
    this.startGrowthTimer();  // 启动生长计时器

    // 创建状态指示器
    this.createIndicators();  // 创建水分和肥料指示器
  }

  /**
   * 获取不同作物的最大生长时间
   * 每种作物有不同的成熟时间
   * @param cropType 作物类型
   * @returns 最大生长时间（毫秒）
   */
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
    return growthTimes[cropType];  // 返回对应作物的生长时间
  }

  /**
   * 获取不同作物的收获产量
   * 每种作物收获时获得的数量不同
   * @param cropType 作物类型
   * @returns 收获产量
   */
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
    return yields[cropType];  // 返回对应作物的产量
  }

  /**
   * 创建作物状态指示器
   * 显示水分和肥料状态
   */
  private createIndicators() {
    // 水分指示器（蓝色条状图）
    this.waterIndicator = this.scene.add.graphics();  // 创建图形对象
    this.waterIndicator.setDepth(15);  // 设置在较高层级，确保可见

    // 肥料指示器（绿色条状图）
    this.fertilizerIndicator = this.scene.add.graphics();  // 创建图形对象
    this.fertilizerIndicator.setDepth(15);  // 设置在较高层级

    // 初始化指示器显示
    this.updateIndicators();  // 更新指示器显示
  }

  /**
   * 更新状态指示器的显示
   * 根据当前水分和肥料等级绘制进度条
   */
  private updateIndicators() {
    if (!this.waterIndicator || !this.fertilizerIndicator) return;  // 检查指示器是否存在

    // 清除之前的绘制内容
    this.waterIndicator.clear();        // 清除水分指示器
    this.fertilizerIndicator.clear();   // 清除肥料指示器

    // 水分指示器设置
    const waterBarWidth = 20;           // 进度条宽度
    const waterBarHeight = 3;           // 进度条高度
    const waterX = this.x - waterBarWidth / 2;  // 居中对齐
    const waterY = this.y - this.height - 15;   // 位于作物上方

    // 绘制水分指示器背景（深灰色）
    this.waterIndicator.fillStyle(0x333333);  // 设置填充颜色为深灰色
    this.waterIndicator.fillRect(waterX, waterY, waterBarWidth, waterBarHeight);  // 绘制背景矩形

    // 绘制水分指示器填充（蓝色，根据水分等级调整宽度）
    const waterFillWidth = (this.cropData.waterLevel / 100) * waterBarWidth;  // 计算填充宽度
    this.waterIndicator.fillStyle(0x4A90E2);  // 设置蓝色填充
    this.waterIndicator.fillRect(waterX, waterY, waterFillWidth, waterBarHeight);  // 绘制填充矩形

    // 肥料指示器（只在施肥后显示）
    if (this.cropData.fertilizerLevel > 0) {
      const fertilizerY = waterY - 5;  // 位于水分指示器上方
      this.fertilizerIndicator.fillStyle(0x333333);  // 设置深灰色背景
      this.fertilizerIndicator.fillRect(waterX, fertilizerY, waterBarWidth, waterBarHeight);  // 绘制背景

      const fertilizerFillWidth = (this.cropData.fertilizerLevel / 100) * waterBarWidth;  // 计算肥料填充宽度
      this.fertilizerIndicator.fillStyle(0x7ED321);  // 设置绿色填充
      this.fertilizerIndicator.fillRect(waterX, fertilizerY, fertilizerFillWidth, waterBarHeight);  // 绘制肥料填充
    }
  }

  /**
   * 启动生长计时器
   * 每秒更新作物生长状态
   */
  private startGrowthTimer() {
    if (this.growthTimer) {
      this.growthTimer.destroy();  // 销毁现有计时器
    }

    this.growthTimer = this.scene.time.addEvent({
      delay: 1000,              // 每秒更新一次
      callback: this.updateGrowth,  // 回调函数
      callbackScope: this,      // 回调函数的作用域
      loop: true               // 循环执行
    });
  }

  /**
   * 更新作物生长状态
   * 处理生长速度、水分消耗、肥料消耗等
   */
  private updateGrowth() {
    if (this.cropData.stage === CropStage.MATURE || this.cropData.stage === CropStage.WITHERED) {
      return;  // 成熟或枯萎的作物不再生长
    }

    // 生长速度受水分和肥料影响
    let growthRate = 1000;  // 基础生长速度（每秒）

    // 水分影响生长速度
    if (this.cropData.waterLevel > 60) {
      growthRate *= 1.5;  // 水分充足时生长速度提升50%
    } else if (this.cropData.waterLevel < 30) {
      growthRate *= 0.5;  // 水分不足时生长速度降低50%
    }

    // 肥料提升生长速度
    if (this.cropData.fertilizerLevel > 0) {
      growthRate *= (1 + this.cropData.fertilizerLevel / 100);  // 最多提升100%生长速度
    }

    this.cropData.growthTime += growthRate;  // 增加生长时间

    // 水分随时间减少
    this.cropData.waterLevel = Math.max(0, this.cropData.waterLevel - 0.5);  // 每秒减少0.5%水分

    // 肥料随时间减少
    if (this.cropData.fertilizerLevel > 0) {
      this.cropData.fertilizerLevel = Math.max(0, this.cropData.fertilizerLevel - 0.2);  // 每秒减少0.2%肥料
    }

    // 检查生长阶段进展
    this.checkStageProgression();  // 检查是否需要进入下一阶段

    // 更新视觉指示器
    this.updateIndicators();  // 更新水分和肥料指示器

    // 检查作物是否应该枯萎
    if (this.cropData.waterLevel === 0 && this.cropData.stage !== CropStage.SEED) {
      this.scene.time.delayedCall(10000, () => {  // 10秒后检查
        if (this.cropData.waterLevel === 0) {
          this.wither();  // 如果仍然没有水分，则枯萎
        }
      });
    }
  }

  /**
   * 检查生长阶段进展
   * 根据生长进度决定是否进入下一阶段
   */
  private checkStageProgression() {
    const progress = this.cropData.growthTime / this.cropData.maxGrowthTime;  // 计算生长进度（0-1）

    let newStage = this.cropData.stage;  // 新的生长阶段

    if (progress >= 1.0 && this.cropData.stage !== CropStage.MATURE) {
      newStage = CropStage.MATURE;  // 100%进度时成熟
    } else if (progress >= 0.7 && this.cropData.stage === CropStage.GROWING) {
      // 70%进度时保持在生长阶段，直到完全成熟
    } else if (progress >= 0.3 && this.cropData.stage === CropStage.SPROUT) {
      newStage = CropStage.GROWING;  // 30%进度时进入生长阶段
    } else if (progress >= 0.1 && this.cropData.stage === CropStage.SEED) {
      newStage = CropStage.SPROUT;  // 10%进度时发芽
    }

    if (newStage !== this.cropData.stage) {
      this.cropData.stage = newStage;  // 更新生长阶段
      this.updateVisual();  // 更新视觉效果
    }
  }

  /**
   * 更新视觉效果
   * 根据当前生长阶段更新纹理和粒子效果
   */
  private updateVisual() {
    const textureName = `${this.cropData.type}_${this.cropData.stage}`;  // 构建纹理名称
    this.setTexture(textureName);  // 设置新的纹理

    // 添加生长粒子效果（枯萎的作物不显示粒子）
    if (this.cropData.stage !== CropStage.WITHERED) {
      const particles = this.scene.add.particles(this.x, this.y - 10, 'sparkle', {
        scale: { start: 0.2, end: 0 },    // 粒子缩放从0.2到0
        alpha: { start: 1, end: 0 },      // 透明度从1到0
        tint: 0x7ED321,                   // 绿色粒子
        lifespan: 500,                    // 粒子生命周期500ms
        quantity: 3,                      // 粒子数量
        speed: { min: 10, max: 30 },      // 粒子速度范围
        gravityY: -50                     // 向上飘散
      });

      this.scene.time.delayedCall(500, () => {
        particles.destroy();  // 500ms后销毁粒子系统
      });
    }
  }

  /**
   * 给作物浇水
   * @param amount 浇水量，默认30
   * @returns 是否浇水成功
   */
  public water(amount: number = 30) {
    if (this.cropData.stage === CropStage.WITHERED) return false;  // 枯萎的作物不能浇水

    this.cropData.waterLevel = Math.min(100, this.cropData.waterLevel + amount);  // 增加水分，最大100%
    this.updateIndicators();  // 更新指示器

    // 浇水粒子效果
    const particles = this.scene.add.particles(this.x, this.y - 20, 'water_drop', {
      scale: { start: 0.3, end: 0 },    // 粒子缩放从0.3到0
      alpha: { start: 1, end: 0 },      // 透明度从1到0
      tint: 0x4A90E2,                   // 蓝色水滴粒子
      lifespan: 800,                    // 粒子生命周期800ms
      quantity: 5,                      // 粒子数量
      speed: { min: 20, max: 40 },      // 粒子速度范围
      gravityY: 100                     // 向下掉落
    });

    this.scene.time.delayedCall(800, () => {
      particles.destroy();  // 800ms后销毁粒子系统
    });

    return true;  // 浇水成功
  }

  /**
   * 给作物施肥
   * @param amount 施肥量，默认50
   * @returns 是否施肥成功
   */
  public fertilize(amount: number = 50) {
    if (this.cropData.stage === CropStage.WITHERED || this.cropData.stage === CropStage.MATURE) {
      return false;  // 枯萎或成熟的作物不能施肥
    }

    this.cropData.fertilizerLevel = Math.min(100, this.cropData.fertilizerLevel + amount);  // 增加肥料，最大100%
    this.updateIndicators();  // 更新指示器

    // 施肥粒子效果
    const particles = this.scene.add.particles(this.x, this.y - 20, 'sparkle', {
      scale: { start: 0.4, end: 0 },    // 粒子缩放从0.4到0
      alpha: { start: 1, end: 0 },      // 透明度从1到0
      tint: 0x7ED321,                   // 绿色肥料粒子
      lifespan: 1000,                   // 粒子生命周期1000ms
      quantity: 8,                      // 粒子数量
      speed: { min: 30, max: 50 },      // 粒子速度范围
      gravityY: -20                     // 轻微向上飘散
    });

    this.scene.time.delayedCall(1000, () => {
      particles.destroy();  // 1000ms后销毁粒子系统
    });

    return true;  // 施肥成功
  }

  /**
   * 收获作物
   * @returns 收获结果，包含是否成功、产量和品质
   */
  public harvest(): { success: boolean; yield: number; quality: 'poor' | 'good' | 'excellent' } {
    if (this.cropData.stage !== CropStage.MATURE) {
      return { success: false, yield: 0, quality: 'poor' };  // 只有成熟的作物才能收获
    }

    // 根据照料情况计算品质
    let quality: 'poor' | 'good' | 'excellent' = 'good';  // 默认良好品质
    let yieldMultiplier = 1;  // 默认产量倍数

    if (this.cropData.waterLevel > 70 && this.cropData.fertilizerLevel > 30) {
      quality = 'excellent';  // 水分和肥料都很充足时，品质优秀
      yieldMultiplier = 1.5;  // 产量提升50%
    } else if (this.cropData.waterLevel < 30) {
      quality = 'poor';       // 水分不足时，品质差
      yieldMultiplier = 0.7;  // 产量降低30%
    }

    const finalYield = Math.floor(this.cropData.harvestYield * yieldMultiplier);  // 计算最终产量

    // 收获粒子效果
    const particles = this.scene.add.particles(this.x, this.y - 10, 'sparkle', {
      scale: { start: 0.5, end: 0 },    // 粒子缩放从0.5到0
      alpha: { start: 1, end: 0 },      // 透明度从1到0
      tint: 0xFFD700,                   // 金色收获粒子
      lifespan: 1500,                   // 粒子生命周期1500ms
      quantity: 12,                     // 粒子数量
      speed: { min: 40, max: 80 },      // 粒子速度范围
      gravityY: -30                     // 向上飘散
    });

    this.scene.time.delayedCall(1500, () => {
      particles.destroy();  // 1500ms后销毁粒子系统
    });

    // 移除作物
    this.destroy();  // 销毁作物对象

    return { success: true, yield: finalYield, quality };  // 返回收获结果
  }

  /**
   * 作物枯萎
   * 当作物缺水时调用此方法
   */
  private wither() {
    if (this.cropData.stage === CropStage.WITHERED) return;  // 已经枯萎的作物不再处理

    this.cropData.stage = CropStage.WITHERED;  // 设置生长阶段为枯萎
    this.setTexture(`${this.cropData.type}_withered`);  // 设置枯萎纹理
    this.setTint(0x8B4513);  // 设置棕色色调，表示枯萎状态

    // 停止生长
    if (this.growthTimer) {
      this.growthTimer.destroy();  // 销毁生长计时器
      this.growthTimer = null;     // 清空计时器引用
    }
  }

  /**
   * 获取作物数据
   * @returns 作物数据的副本
   */
  public getCropData(): CropData {
    return { ...this.cropData };  // 返回数据副本，防止外部修改
  }

  /**
   * 检查是否可以交互
   * @returns 是否可以交互（成熟或枯萎的作物可以交互）
   */
  public canInteract(): boolean {
    return this.cropData.stage === CropStage.MATURE || this.cropData.stage === CropStage.WITHERED;  // 只有成熟或枯萎的作物可以交互
  }

  /**
   * 获取交互提示文本
   * @returns 交互提示文本
   */
  public getInteractionText(): string {
    if (this.cropData.stage === CropStage.MATURE) {
      return `收获 ${this.getCropDisplayName()}`;  // 成熟作物显示收获提示
    } else if (this.cropData.stage === CropStage.WITHERED) {
      return '清除枯萎的作物';  // 枯萎作物显示清除提示
    }
    return '';  // 其他阶段不显示交互提示
  }

  /**
   * 获取作物的中文显示名称
   * @returns 作物的中文名称
   */
  private getCropDisplayName(): string {
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
    return names[this.cropData.type];  // 返回对应的中文名称
  }

  /**
   * 销毁作物对象
   * 清理所有相关资源
   */
  destroy() {
    if (this.growthTimer) {
      this.growthTimer.destroy();  // 销毁生长计时器
    }
    if (this.waterIndicator) {
      this.waterIndicator.destroy();  // 销毁水分指示器
    }
    if (this.fertilizerIndicator) {
      this.fertilizerIndicator.destroy();  // 销毁肥料指示器
    }
    super.destroy();  // 调用父类的销毁方法
  }
}
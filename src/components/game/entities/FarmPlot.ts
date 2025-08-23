import * as Phaser from 'phaser';
import { CropType, FarmPlot as FarmPlotData } from '../types/GameTypes';
import { Crop } from './Crop';

/**
 * 农田地块类
 * 继承自Phaser精灵，管理单个农田地块的状态和交互
 * 包括耕地、种植、浇水、施肥、收获等农场操作
 */
export class FarmPlot extends Phaser.GameObjects.Sprite {
  private plotData: FarmPlotData;                                    // 地块数据（位置、状态、土壤质量等）
  private crop: Crop | null = null;                                  // 当前种植的作物（null表示空地块）
  private plotIndicator: Phaser.GameObjects.Graphics | null = null;  // 地块指示器（显示土壤质量）
  private interactionHint: Phaser.GameObjects.Text | null = null;    // 交互提示文本
  private isHovered: boolean = false;                                // 是否被鼠标悬停

  /**
   * 构造函数
   * 创建农田地块并初始化数据
   * @param scene 游戏场景
   * @param x 地块X坐标
   * @param y 地块Y坐标
   */
  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, 'farm_plot_empty');

    // 初始化地块数据
    this.plotData = {
      x: x,
      y: y,
      isPlowed: false,                                    // 初始状态：未耕地
      soilQuality: 50 + Math.random() * 30               // 随机土壤质量：50-80之间
    };

    // 添加到场景
    scene.add.existing(this);
    this.setDepth(1);                    // 设置渲染深度
    this.setOrigin(0.5, 1);              // 设置锚点（底部中心）
    this.setInteractive();               // 启用交互

    // 创建视觉指示器
    this.createIndicators();

    // 设置交互事件
    this.setupInteraction();
  }

  /**
   * 创建视觉指示器
   * 包括地块质量指示器和交互提示文本
   */
  private createIndicators() {
    // 地块质量指示器（地块周围的微妙发光效果）
    this.plotIndicator = this.scene.add.graphics();
    this.plotIndicator.setDepth(0);
    this.updatePlotIndicator();

    // 交互提示文本
    this.interactionHint = this.scene.add.text(this.x, this.y - 40, '', {
      fontSize: '12px',
      color: '#ffffff',
      backgroundColor: '#000000',
      padding: { x: 4, y: 2 }
    });
    this.interactionHint.setOrigin(0.5);      // 居中对齐
    this.interactionHint.setVisible(false);   // 初始隐藏
    this.interactionHint.setDepth(20);        // 高渲染层级
  }

  /**
   * 更新地块指示器
   * 根据土壤质量和耕地状态更新视觉指示器
   */
  private updatePlotIndicator() {
    if (!this.plotIndicator) return;

    this.plotIndicator.clear();

    // 显示土壤质量（用微妙的边框颜色表示）
    const qualityColor = this.getSoilQualityColor();
    this.plotIndicator.lineStyle(2, qualityColor, 0.3);
    this.plotIndicator.strokeRect(this.x - 16, this.y - 32, 32, 32);

    // 显示耕地状态
    if (this.plotData.isPlowed) {
      this.plotIndicator.fillStyle(0x8B4513, 0.1); // 耕地土壤的棕色色调
      this.plotIndicator.fillRect(this.x - 16, this.y - 32, 32, 32);
    }
  }

  /**
   * 获取土壤质量对应的颜色
   * 根据土壤质量返回不同的颜色值用于视觉指示
   * @returns 颜色值（十六进制）
   */
  private getSoilQualityColor(): number {
    if (this.plotData.soilQuality >= 70) return 0x7ED321; // 绿色：优质土壤
    if (this.plotData.soilQuality >= 50) return 0xF5A623; // 黄色：一般土壤
    return 0xD0021B; // 红色：贫瘠土壤
  }

  /**
   * 设置交互事件
   * 绑定鼠标悬停、点击等交互事件
   */
  private setupInteraction() {
    // 鼠标悬停事件
    this.on('pointerover', () => {
      this.isHovered = true;
      this.updateInteractionHint();
      this.interactionHint?.setVisible(true);
    });

    // 鼠标离开事件
    this.on('pointerout', () => {
      this.isHovered = false;
      this.interactionHint?.setVisible(false);
    });

    // 鼠标点击事件
    this.on('pointerdown', () => {
      this.handleInteraction();
    });
  }

  /**
   * 更新交互提示文本
   * 根据地块当前状态显示相应的操作提示
   */
  private updateInteractionHint() {
    if (!this.interactionHint) return;

    let hintText = '';

    if (!this.plotData.isPlowed) {
      hintText = '使用锄头耕地';
    } else if (!this.crop) {
      hintText = '种植种子';
    } else if (this.crop.canInteract()) {
      hintText = this.crop.getInteractionText();
    } else {
      const cropData = this.crop.getCropData();
      hintText = `${this.getCropDisplayName(cropData.type)} - ${this.getStageDisplayName(cropData.stage)}`;
    }

    this.interactionHint.setText(hintText);
  }

  /**
   * 处理交互事件
   * 向游戏场景发送地块交互事件
   */
  private handleInteraction() {
    // 向游戏场景发送地块交互事件
    this.scene.events.emit('farm-plot-interaction', {
      plot: this,
      plotData: this.plotData,
      crop: this.crop
    });
  }

  /**
   * 耕地操作
   * 将地块翻土，为种植做准备
   * @returns 是否成功耕地
   */
  public plow(): boolean {
    if (this.plotData.isPlowed || this.crop) return false;  // 已耕地或有作物时不能耕地

    this.plotData.isPlowed = true;                          // 设置耕地状态
    this.setTexture('farm_plot_plowed');                    // 更换为耕地纹理
    this.updatePlotIndicator();                             // 更新指示器

    // 耕地粒子效果
    const particles = this.scene.add.particles(this.x, this.y - 16, 'dirt_particle', {
      scale: { start: 0.3, end: 0 },                        // 粒子缩放：从0.3缩小到0
      alpha: { start: 1, end: 0 },                          // 透明度变化：从完全不透明到透明
      tint: 0x8B4513,                                       // 泥土颜色：棕色
      lifespan: 800,                                        // 生命周期：800毫秒
      quantity: 8,                                          // 粒子数量：8个
      speed: { min: 20, max: 40 },                          // 速度范围：20-40像素/秒
      gravityY: 50                                          // 重力：向下50像素/秒²
    });

    // 延迟销毁粒子效果
    this.scene.time.delayedCall(800, () => {
      particles.destroy();
    });

    return true;
  }

  /**
   * 种植作物
   * 在已耕地的地块上种植指定类型的作物
   * @param cropType 作物类型
   * @returns 是否成功种植
   */
  public plantCrop(cropType: CropType): boolean {
    if (!this.plotData.isPlowed || this.crop) return false;  // 检查是否可以种植

    // 创建新的作物实例
    this.crop = new Crop(this.scene, this.x, this.y - 5, cropType);
    this.plotData.crop = this.crop.getCropData();

    // 更新地块外观为已种植状态
    this.setTexture('farm_plot_planted');

    return true;
  }

  /**
   * 给作物浇水
   * @returns 是否成功浇水
   */
  public waterCrop(): boolean {
    if (!this.crop) return false;
    return this.crop.water();
  }

  /**
   * 给作物施肥
   * @returns 是否成功施肥
   */
  public fertilizeCrop(): boolean {
    if (!this.crop) return false;
    return this.crop.fertilize();
  }

  /**
   * 收获作物
   * 收获成熟的作物并返回收获结果
   * @returns 收获结果（包含成功状态、产量和质量）或null
   */
  public harvestCrop(): { success: boolean; yield: number; quality: 'poor' | 'good' | 'excellent' } | null {
    if (!this.crop) return null;

    const result = this.crop.harvest();

    if (result.success) {
      this.crop = null;
      this.plotData.crop = undefined;
      this.setTexture('farm_plot_plowed'); // 回到耕地状态

      // 成功收获后略微提升土壤质量
      this.plotData.soilQuality = Math.min(100, this.plotData.soilQuality + 2);
      this.updatePlotIndicator();
    }

    return result;
  }

  /**
   * 清除作物
   * 移除地块上的作物（无论是否成熟）
   * @returns 是否成功清除
   */
  public clearCrop(): boolean {
    if (!this.crop) return false;

    this.crop.destroy();
    this.crop = null;
    this.plotData.crop = undefined;
    this.setTexture('farm_plot_plowed');

    return true;
  }

  /**
   * 改善土壤质量
   * 提升地块的土壤质量并显示改善效果
   * @param amount 改善数量（默认10点）
   * @returns 是否成功改善
   */
  public improveSoil(amount: number = 10): boolean {
    this.plotData.soilQuality = Math.min(100, this.plotData.soilQuality + amount);
    this.updatePlotIndicator();

    // 土壤改善粒子效果
    const particles = this.scene.add.particles(this.x, this.y - 16, 'sparkle', {
      scale: { start: 0.3, end: 0 },
      alpha: { start: 1, end: 0 },
      tint: 0x7ED321,                                       // 绿色：表示土壤改善
      lifespan: 1000,                                       // 生命周期：1秒
      quantity: 5,                                          // 粒子数量：5个
      speed: { min: 15, max: 30 },                          // 速度范围：15-30像素/秒
      gravityY: -10                                         // 重力：向上飘散
    });

    this.scene.time.delayedCall(1000, () => {
      particles.destroy();
    });

    return true;
  }

  /**
   * 获取地块数据
   * @returns 地块数据的副本
   */
  public getPlotData(): FarmPlotData {
    return { ...this.plotData };
  }

  /**
   * 获取当前作物
   * @returns 作物实例或null
   */
  public getCrop(): Crop | null {
    return this.crop;
  }

  /**
   * 检查是否可以种植
   * @returns 是否已耕地且没有作物
   */
  public canPlant(): boolean {
    return this.plotData.isPlowed && !this.crop;
  }

  /**
   * 检查是否可以耕地
   * @returns 是否未耕地且没有作物
   */
  public canPlow(): boolean {
    return !this.plotData.isPlowed && !this.crop;
  }

  /**
   * 检查是否可以浇水
   * @returns 是否有作物
   */
  public canWater(): boolean {
    return this.crop !== null;
  }

  /**
   * 检查是否可以施肥
   * @returns 是否有作物
   */
  public canFertilize(): boolean {
    return this.crop !== null;
  }

  /**
   * 检查是否可以收获
   * @returns 是否有作物且作物可以交互（成熟）
   */
  public canHarvest(): boolean {
    return this.crop !== null && this.crop.canInteract();
  }

  /**
   * 获取作物显示名称
   * 将作物类型枚举转换为中文显示名称
   * @param cropType 作物类型
   * @returns 中文作物名称
   */
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

  /**
   * 获取生长阶段显示名称
   * 将作物生长阶段转换为中文显示名称
   * @param stage 生长阶段
   * @returns 中文阶段名称
   */
  private getStageDisplayName(stage: string): string {
    const stages: Record<string, string> = {
      'seed': '种子',
      'sprout': '发芽',
      'growing': '成长中',
      'mature': '成熟',
      'withered': '枯萎'
    };
    return stages[stage] || stage;
  }

  /**
   * 更新方法
   * 每帧调用，处理悬停状态下的交互提示更新
   */
  update() {
    if (this.isHovered) {
      this.updateInteractionHint();
    }
  }

  /**
   * 销毁方法
   * 清理所有相关资源，包括作物、指示器和提示文本
   */
  destroy() {
    if (this.crop) {
      this.crop.destroy();
    }
    if (this.plotIndicator) {
      this.plotIndicator.destroy();
    }
    if (this.interactionHint) {
      this.interactionHint.destroy();
    }
    super.destroy();
  }
}
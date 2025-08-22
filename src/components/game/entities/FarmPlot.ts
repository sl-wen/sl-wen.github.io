import * as Phaser from 'phaser';
import { FarmPlot as FarmPlotData, CropType } from '../types/GameTypes';
import { Crop } from './Crop';

export class FarmPlot extends Phaser.GameObjects.Sprite {
  private plotData: FarmPlotData;
  private crop: Crop | null = null;
  private plotIndicator: Phaser.GameObjects.Graphics | null = null;
  private interactionHint: Phaser.GameObjects.Text | null = null;
  private isHovered: boolean = false;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, 'farm_plot_empty');

    // Initialize plot data
    this.plotData = {
      x: x,
      y: y,
      isPlowed: false,
      soilQuality: 50 + Math.random() * 30 // Random soil quality between 50-80
    };

    // Add to scene
    scene.add.existing(this);
    this.setDepth(1);
    this.setOrigin(0.5, 1);
    this.setInteractive();

    // Create visual indicators
    this.createIndicators();

    // Setup interaction events
    this.setupInteraction();
  }

  private createIndicators() {
    // Plot quality indicator (subtle glow around plot)
    this.plotIndicator = this.scene.add.graphics();
    this.plotIndicator.setDepth(0);
    this.updatePlotIndicator();

    // Interaction hint text
    this.interactionHint = this.scene.add.text(this.x, this.y - 40, '', {
      fontSize: '12px',
      color: '#ffffff',
      backgroundColor: '#000000',
      padding: { x: 4, y: 2 }
    });
    this.interactionHint.setOrigin(0.5);
    this.interactionHint.setVisible(false);
    this.interactionHint.setDepth(20);
  }

  private updatePlotIndicator() {
    if (!this.plotIndicator) return;

    this.plotIndicator.clear();

    // Show soil quality with subtle border color
    const qualityColor = this.getSoilQualityColor();
    this.plotIndicator.lineStyle(2, qualityColor, 0.3);
    this.plotIndicator.strokeRect(this.x - 16, this.y - 32, 32, 32);

    // Show plowed state
    if (this.plotData.isPlowed) {
      this.plotIndicator.fillStyle(0x8B4513, 0.1); // Brown tint for plowed soil
      this.plotIndicator.fillRect(this.x - 16, this.y - 32, 32, 32);
    }
  }

  private getSoilQualityColor(): number {
    if (this.plotData.soilQuality >= 70) return 0x7ED321; // Green for good soil
    if (this.plotData.soilQuality >= 50) return 0xF5A623; // Yellow for average soil
    return 0xD0021B; // Red for poor soil
  }

  private setupInteraction() {
    this.on('pointerover', () => {
      this.isHovered = true;
      this.updateInteractionHint();
      this.interactionHint?.setVisible(true);
    });

    this.on('pointerout', () => {
      this.isHovered = false;
      this.interactionHint?.setVisible(false);
    });

    this.on('pointerdown', () => {
      this.handleInteraction();
    });
  }

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

  private handleInteraction() {
    // Emit interaction event to GameScene
    this.scene.events.emit('farm-plot-interaction', {
      plot: this,
      plotData: this.plotData,
      crop: this.crop
    });
  }

  public plow(): boolean {
    if (this.plotData.isPlowed || this.crop) return false;

    this.plotData.isPlowed = true;
    this.setTexture('farm_plot_plowed');
    this.updatePlotIndicator();

    // Plowing particle effect
    const particles = this.scene.add.particles(this.x, this.y - 16, 'dirt_particle', {
      scale: { start: 0.3, end: 0 },
      alpha: { start: 1, end: 0 },
      tint: 0x8B4513,
      lifespan: 800,
      quantity: 8,
      speed: { min: 20, max: 40 },
      gravityY: 50
    });

    this.scene.time.delayedCall(800, () => {
      particles.destroy();
    });

    return true;
  }

  public plantCrop(cropType: CropType): boolean {
    if (!this.plotData.isPlowed || this.crop) return false;

    // Create new crop
    this.crop = new Crop(this.scene, this.x, this.y - 5, cropType);
    this.plotData.crop = this.crop.getCropData();

    // Update plot appearance
    this.setTexture('farm_plot_planted');

    return true;
  }

  public waterCrop(): boolean {
    if (!this.crop) return false;
    return this.crop.water();
  }

  public fertilizeCrop(): boolean {
    if (!this.crop) return false;
    return this.crop.fertilize();
  }

  public harvestCrop(): { success: boolean; yield: number; quality: 'poor' | 'good' | 'excellent' } | null {
    if (!this.crop) return null;

    const result = this.crop.harvest();
    
    if (result.success) {
      this.crop = null;
      this.plotData.crop = undefined;
      this.setTexture('farm_plot_plowed'); // Back to plowed state
      
      // Improve soil quality slightly after successful harvest
      this.plotData.soilQuality = Math.min(100, this.plotData.soilQuality + 2);
      this.updatePlotIndicator();
    }

    return result;
  }

  public clearCrop(): boolean {
    if (!this.crop) return false;

    this.crop.destroy();
    this.crop = null;
    this.plotData.crop = undefined;
    this.setTexture('farm_plot_plowed');

    return true;
  }

  public improveSoil(amount: number = 10): boolean {
    this.plotData.soilQuality = Math.min(100, this.plotData.soilQuality + amount);
    this.updatePlotIndicator();

    // Soil improvement particle effect
    const particles = this.scene.add.particles(this.x, this.y - 16, 'sparkle', {
      scale: { start: 0.3, end: 0 },
      alpha: { start: 1, end: 0 },
      tint: 0x7ED321,
      lifespan: 1000,
      quantity: 5,
      speed: { min: 15, max: 30 },
      gravityY: -10
    });

    this.scene.time.delayedCall(1000, () => {
      particles.destroy();
    });

    return true;
  }

  public getPlotData(): FarmPlotData {
    return { ...this.plotData };
  }

  public getCrop(): Crop | null {
    return this.crop;
  }

  public canPlant(): boolean {
    return this.plotData.isPlowed && !this.crop;
  }

  public canPlow(): boolean {
    return !this.plotData.isPlowed && !this.crop;
  }

  public canWater(): boolean {
    return this.crop !== null;
  }

  public canFertilize(): boolean {
    return this.crop !== null;
  }

  public canHarvest(): boolean {
    return this.crop !== null && this.crop.canInteract();
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

  update() {
    if (this.isHovered) {
      this.updateInteractionHint();
    }
  }

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
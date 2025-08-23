import * as Phaser from 'phaser';
import { InventoryItem, Recipe } from '../types/GameTypes';

/**
 * 烹饪站类
 * 继承自Phaser精灵，管理烹饪站的状态和烹饪功能
 * 包括配方管理、烹饪进度、粒子效果等
 */
export class CookingStation extends Phaser.GameObjects.Sprite {
  private recipes: Recipe[] = [];                                      // 可用配方列表
  private currentRecipe: Recipe | null = null;                        // 当前烹饪的配方
  private cookingTimer: Phaser.Time.TimerEvent | null = null;         // 烹饪计时器
  private isCooking: boolean = false;                                  // 是否正在烹饪
  private cookingProgress: number = 0;                                // 烹饪进度（0-100）
  private progressBar: Phaser.GameObjects.Graphics | null = null;     // 进度条图形
  private cookingParticles: Phaser.GameObjects.Particles.ParticleEmitter | null = null;  // 烹饪粒子效果

  /**
   * 构造函数
   * 创建烹饪站并初始化所有功能
   * @param scene 游戏场景
   * @param x 烹饪站X坐标
   * @param y 烹饪站Y坐标
   */
  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, 'cooking_station');

    // 添加到场景
    scene.add.existing(this);
    this.setDepth(5);                    // 设置渲染深度
    this.setOrigin(0.5, 1);              // 设置锚点（底部中心）
    this.setInteractive();               // 启用交互

    // 初始化配方
    this.initializeRecipes();

    // 创建进度条
    this.createProgressBar();

    // 设置交互
    this.setupInteraction();
  }

  private initializeRecipes() {
    this.recipes = [
      {
        id: 'carrot_soup',
        name: '胡萝卜汤',
        description: '温暖的胡萝卜汤，恢复能量和幸福感',
        ingredients: [
          { itemId: 'carrot', quantity: 3 },
          { itemId: 'water', quantity: 1 }
        ],
        result: { itemId: 'carrot_soup', quantity: 1 },
        cookingTime: 5000,
        happinessBonus: 20,
        energyBonus: 30
      },
      {
        id: 'tomato_salad',
        name: '番茄沙拉',
        description: '新鲜的番茄沙拉，增加幸福感',
        ingredients: [
          { itemId: 'tomato', quantity: 2 },
          { itemId: 'lettuce', quantity: 1 }
        ],
        result: { itemId: 'tomato_salad', quantity: 1 },
        cookingTime: 3000,
        happinessBonus: 15,
        energyBonus: 20
      },
      {
        id: 'wheat_bread',
        name: '小麦面包',
        description: '香喷喷的面包，大幅恢复能量',
        ingredients: [
          { itemId: 'wheat', quantity: 4 }
        ],
        result: { itemId: 'wheat_bread', quantity: 2 },
        cookingTime: 8000,
        happinessBonus: 25,
        energyBonus: 40
      },
      {
        id: 'corn_soup',
        name: '玉米汤',
        description: '甜美的玉米汤，恢复大量能量',
        ingredients: [
          { itemId: 'corn', quantity: 2 },
          { itemId: 'water', quantity: 1 }
        ],
        result: { itemId: 'corn_soup', quantity: 1 },
        cookingTime: 6000,
        happinessBonus: 30,
        energyBonus: 35
      },
      {
        id: 'strawberry_cake',
        name: '草莓蛋糕',
        description: '甜蜜的草莓蛋糕，极大提升幸福感',
        ingredients: [
          { itemId: 'strawberry', quantity: 5 },
          { itemId: 'wheat', quantity: 2 }
        ],
        result: { itemId: 'strawberry_cake', quantity: 1 },
        cookingTime: 10000,
        happinessBonus: 50,
        energyBonus: 25
      },
      {
        id: 'potato_stew',
        name: '土豆炖菜',
        description: '丰盛的土豆炖菜，均衡恢复',
        ingredients: [
          { itemId: 'potato', quantity: 3 },
          { itemId: 'carrot', quantity: 1 },
          { itemId: 'water', quantity: 1 }
        ],
        result: { itemId: 'potato_stew', quantity: 1 },
        cookingTime: 7000,
        happinessBonus: 35,
        energyBonus: 45
      },
      {
        id: 'pumpkin_pie',
        name: '南瓜派',
        description: '节日特色南瓜派，极大恢复所有属性',
        ingredients: [
          { itemId: 'pumpkin', quantity: 1 },
          { itemId: 'wheat', quantity: 2 }
        ],
        result: { itemId: 'pumpkin_pie', quantity: 1 },
        cookingTime: 12000,
        happinessBonus: 60,
        energyBonus: 50
      },
      {
        id: 'mixed_salad',
        name: '混合沙拉',
        description: '健康的混合沙拉，提升幸福感',
        ingredients: [
          { itemId: 'lettuce', quantity: 2 },
          { itemId: 'tomato', quantity: 1 },
          { itemId: 'carrot', quantity: 1 }
        ],
        result: { itemId: 'mixed_salad', quantity: 1 },
        cookingTime: 4000,
        happinessBonus: 25,
        energyBonus: 30
      }
    ];
  }

  private createProgressBar() {
    this.progressBar = this.scene.add.graphics();
    this.progressBar.setDepth(15);
    this.updateProgressBar();
  }

  private updateProgressBar() {
    if (!this.progressBar) return;

    this.progressBar.clear();

    if (this.isCooking) {
      // Background bar
      const barWidth = 40;
      const barHeight = 4;
      const barX = this.x - barWidth / 2;
      const barY = this.y - this.height - 10;

      this.progressBar.fillStyle(0x333333);
      this.progressBar.fillRect(barX, barY, barWidth, barHeight);

      // Progress fill
      const fillWidth = (this.cookingProgress / 100) * barWidth;
      this.progressBar.fillStyle(0xFF6B35);
      this.progressBar.fillRect(barX, barY, fillWidth, barHeight);

      // Border
      this.progressBar.lineStyle(1, 0xFFFFFF, 0.8);
      this.progressBar.strokeRect(barX, barY, barWidth, barHeight);
    }
  }

  private setupInteraction() {
    this.on('pointerdown', () => {
      if (!this.isCooking) {
        this.scene.events.emit('cooking-station-interaction', this);
      }
    });
  }

  public canCook(recipe: Recipe, inventory: InventoryItem[]): boolean {
    // Check if all ingredients are available
    return recipe.ingredients.every(ingredient => {
      const item = inventory.find(i => i.id === ingredient.itemId);
      return item && item.quantity >= ingredient.quantity;
    });
  }

  /**
   * 开始烹饪
   * 根据配方开始烹饪过程，包括计时器和粒子效果
   * @param recipe 要烹饪的配方
   * @returns 是否成功开始烹饪
   */
  public startCooking(recipe: Recipe): boolean {
    if (this.isCooking) return false;  // 已在烹饪中

    this.currentRecipe = recipe;       // 设置当前配方
    this.isCooking = true;             // 设置烹饪状态
    this.cookingProgress = 0;          // 重置进度

    // 更换为烹饪状态纹理
    this.setTexture('cooking_station_active');

    // 创建烹饪粒子效果
    this.createCookingParticles();

    // 开始烹饪计时器（每100次更新一次进度）
    this.cookingTimer = this.scene.time.addEvent({
      delay: recipe.cookingTime / 100,  // 烹饪时间除以100，确保100次更新
      callback: this.updateCooking,
      callbackScope: this,
      repeat: 99                        // 重复99次，总共100次
    });

    // 烹饪完成回调
    this.scene.time.delayedCall(recipe.cookingTime, () => {
      this.completeCooking();
    });

    return true;
  }

  private updateCooking() {
    this.cookingProgress += 1;
    this.updateProgressBar();

    // Add some random cooking effects
    if (Math.random() < 0.3) {
      this.addCookingEffect();
    }
  }

  private createCookingParticles() {
    // Steam particles
    this.cookingParticles = this.scene.add.particles(this.x, this.y - 30, 'steam', {
      scale: { start: 0.2, end: 0.4 },
      alpha: { start: 0.8, end: 0 },
      tint: 0xFFFFFF,
      lifespan: 2000,
      frequency: 200,
      quantity: 1,
      speed: { min: 10, max: 20 },
      gravityY: -50
    });
  }

  private addCookingEffect() {
    // Random sparkles during cooking
    const sparkles = this.scene.add.particles(
      this.x + (Math.random() - 0.5) * 20,
      this.y - 20 + (Math.random() - 0.5) * 10,
      'sparkle',
      {
        scale: { start: 0.2, end: 0 },
        alpha: { start: 1, end: 0 },
        tint: [0xFF6B35, 0xFFD700, 0xFF9500],
        lifespan: 500,
        quantity: 2,
        speed: { min: 10, max: 30 }
      }
    );

    this.scene.time.delayedCall(500, () => {
      sparkles.destroy();
    });
  }

  private completeCooking() {
    if (!this.currentRecipe) return;

    this.isCooking = false;
    this.cookingProgress = 0;

    // Change texture back to idle
    this.setTexture('cooking_station');

    // Stop cooking particles
    if (this.cookingParticles) {
      this.cookingParticles.destroy();
      this.cookingParticles = null;
    }

    // Clear progress bar
    this.updateProgressBar();

    // Create completion effect
    const completionParticles = this.scene.add.particles(this.x, this.y - 20, 'sparkle', {
      scale: { start: 0.5, end: 0 },
      alpha: { start: 1, end: 0 },
      tint: 0xFFD700,
      lifespan: 1500,
      quantity: 15,
      speed: { min: 50, max: 100 },
      gravityY: -20
    });

    this.scene.time.delayedCall(1500, () => {
      completionParticles.destroy();
    });

    // Emit cooking completion event
    this.scene.events.emit('cooking-completed', {
      recipe: this.currentRecipe,
      result: this.currentRecipe.result
    });

    this.currentRecipe = null;

    // Clean timer
    if (this.cookingTimer) {
      this.cookingTimer.destroy();
      this.cookingTimer = null;
    }
  }

  public getAvailableRecipes(inventory: InventoryItem[]): Recipe[] {
    return this.recipes.filter(recipe => this.canCook(recipe, inventory));
  }

  public getAllRecipes(): Recipe[] {
    return [...this.recipes];
  }

  public getCurrentRecipe(): Recipe | null {
    return this.currentRecipe;
  }

  public isCookingInProgress(): boolean {
    return this.isCooking;
  }

  public getCookingProgress(): number {
    return this.cookingProgress;
  }

  public cancelCooking(): boolean {
    if (!this.isCooking) return false;

    this.isCooking = false;
    this.cookingProgress = 0;
    this.currentRecipe = null;

    // Change texture back to idle
    this.setTexture('cooking_station');

    // Stop cooking particles
    if (this.cookingParticles) {
      this.cookingParticles.destroy();
      this.cookingParticles = null;
    }

    // Clean timer
    if (this.cookingTimer) {
      this.cookingTimer.destroy();
      this.cookingTimer = null;
    }

    // Clear progress bar
    this.updateProgressBar();

    return true;
  }

  update() {
    // Update progress bar if cooking
    if (this.isCooking) {
      this.updateProgressBar();
    }
  }

  destroy() {
    if (this.cookingTimer) {
      this.cookingTimer.destroy();
    }
    if (this.cookingParticles) {
      this.cookingParticles.destroy();
    }
    if (this.progressBar) {
      this.progressBar.destroy();
    }
    super.destroy();
  }
}
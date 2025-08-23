import * as Phaser from 'phaser';
import { CatStats, InventoryItem, Recipe } from '../types/GameTypes';
import { UILayoutManager } from '../UILayoutManager';

/**
 * UI场景类
 * 负责管理游戏的所有用户界面元素
 * 包括对话框、通知、状态栏、背包界面、烹饪界面等
 */
export class UIScene extends Phaser.Scene {
  // UI布局管理器
  private uiLayoutManager!: UILayoutManager;

  // UI元素
  private dialogueBox!: Phaser.GameObjects.Container;      // 对话框容器
  private dialogueText!: Phaser.GameObjects.Text;          // 对话框文本
  private notificationText!: Phaser.GameObjects.Text;      // 通知文本
  private healthBar!: Phaser.GameObjects.Graphics;         // 生命值条
  private energyBar!: Phaser.GameObjects.Graphics;         // 体力值条
  private happinessBar!: Phaser.GameObjects.Graphics;      // 快乐值条
  private healthText!: Phaser.GameObjects.Text;            // 生命值文本
  private energyText!: Phaser.GameObjects.Text;            // 体力值文本
  private happinessText!: Phaser.GameObjects.Text;         // 快乐值文本
  private levelText!: Phaser.GameObjects.Text;             // 等级文本
  private inventoryContainer!: Phaser.GameObjects.Container;  // 背包容器
  private cookingContainer!: Phaser.GameObjects.Container;    // 烹饪界面容器
  private currentToolText!: Phaser.GameObjects.Text;          // 当前工具文本
  private isInventoryOpen: boolean = false;                   // 背包是否打开
  private isCookingOpen: boolean = false;                     // 烹饪界面是否打开
  private interactionIndicators!: Phaser.GameObjects.Container;  // 交互指示器容器
  private proximityIndicator!: Phaser.GameObjects.Graphics;      // 接近指示器
  private characterPortrait!: Phaser.GameObjects.Text;           // 角色肖像

  // 状态栏容器
  private statsContainer!: Phaser.GameObjects.Container;         // 统计信息容器

  constructor() {
    super({ key: 'UIScene' });
  }

  /**
   * 场景创建方法
   * 初始化所有UI元素和事件监听器
   */
  create() {
    // 初始化UI布局管理器
    this.uiLayoutManager = new UILayoutManager(this);

    // 创建响应式设计的UI元素
    this.createDialogueBox();              // 创建对话框
    this.createNotificationArea();         // 创建通知区域
    this.createResponsiveCatStats();       // 创建响应式状态栏
    this.createToolIndicator();            // 创建工具指示器
    this.createInventoryInterface();       // 创建背包界面
    this.createCookingInterface();         // 创建烹饪界面
    this.createInteractionIndicators();    // 创建交互指示器

    // 监听来自GameScene的事件
    this.events.on('show-dialogue', this.showDialogue, this);           // 显示对话框
    this.events.on('show-notification', this.showNotification, this);   // 显示通知
    this.events.on('cat-stats-changed', this.onCatStatsChanged, this);  // 小猫状态变化
    this.events.on('toggle-inventory', this.toggleInventory, this);     // 切换背包
    this.events.on('open-cooking', this.openCookingInterface, this);    // 打开烹饪界面
    this.events.on('tool-selected', this.onToolSelected, this);         // 工具选择
    this.events.on('show-interaction-hint', this.showInteractionHint, this);  // 显示交互提示
    this.events.on('highlight-interactable', this.highlightInteractable, this); // 高亮可交互对象
  }

  private createDialogueBox() {
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;

    // Create modern dialogue container
    this.dialogueBox = this.add.container(width / 2, height - 120);

    // Modern glassmorphism background
    const dialogueBg = this.add.graphics();
    dialogueBg.fillStyle(0x1a1a2e, 0.85);
    dialogueBg.lineStyle(2, 0x6c5ce7, 0.8);
    dialogueBg.fillRoundedRect(-320, -50, 640, 100, 15);
    dialogueBg.strokeRoundedRect(-320, -50, 640, 100, 15);

    // Add subtle glow effect
    dialogueBg.lineStyle(4, 0x6c5ce7, 0.3);
    dialogueBg.strokeRoundedRect(-324, -54, 648, 108, 18);

    // Modern text with better typography
    this.dialogueText = this.add.text(0, 0, '', {
      fontSize: '16px',
      color: '#ffffff',
      align: 'center',
      wordWrap: { width: 600 },
      fontFamily: 'Arial, sans-serif',
      lineSpacing: 4
    });
    this.dialogueText.setOrigin(0.5);

    // Add character portrait placeholder
    this.characterPortrait = this.add.text(-280, 0, '🐱', {
      fontSize: '32px'
    });
    this.characterPortrait.setOrigin(0.5);

    // Continue indicator
    const continueIndicator = this.add.text(280, 20, '👆', {
      fontSize: '16px',
      color: '#74b9ff'
    });
    continueIndicator.setOrigin(0.5);

    // Pulsing animation for continue indicator
    this.tweens.add({
      targets: continueIndicator,
      alpha: 0.5,
      duration: 800,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });

    // Add to container
    this.dialogueBox.add([dialogueBg, this.dialogueText, this.characterPortrait, continueIndicator]);
    this.dialogueBox.setVisible(false);
    this.dialogueBox.setScrollFactor(0);
    this.dialogueBox.setDepth(1000);
  }

  private createNotificationArea() {
    const width = this.cameras.main.width;

    // Create notification container for better styling
    const notificationContainer = this.add.container(width / 2, 50);
    notificationContainer.setScrollFactor(0);
    notificationContainer.setDepth(1100);

    // Modern notification background with glassmorphism
    const notificationBg = this.add.graphics();
    notificationBg.fillStyle(0x000000, 0.6);
    notificationBg.lineStyle(2, 0x4a90e2, 0.8);
    notificationBg.fillRoundedRect(-120, -20, 240, 40, 20);
    notificationBg.strokeRoundedRect(-120, -20, 240, 40, 20);

    this.notificationText = this.add.text(0, 0, '', {
      fontSize: '16px',
      color: '#ffffff',
      align: 'center',
      fontFamily: 'Arial, sans-serif',
      fontStyle: 'bold'
    });
    this.notificationText.setOrigin(0.5);

    notificationContainer.add([notificationBg, this.notificationText]);
    notificationContainer.setVisible(false);

    // Store reference
    (this as any).notificationContainer = notificationContainer;
  }

  private createResponsiveCatStats() {
    const screenInfo = this.uiLayoutManager.getScreenInfo();
    const statsPosition = this.uiLayoutManager.getStatsBarPosition();

    // 根据屏幕尺寸调整状态栏
    const barWidth = screenInfo.isMobile ? (screenInfo.isPortrait ? 140 : 160) : 180;
    const barHeight = screenInfo.isMobile ? 16 : 18;
    const spacing = screenInfo.isMobile ? 24 : 28;
    const fontSize = screenInfo.isMobile ? '10px' : '11px';

    // 创建状态栏容器
    this.statsContainer = this.add.container(statsPosition.x, statsPosition.y);
    this.statsContainer.setScrollFactor(0);
    this.statsContainer.setDepth(100);

    // 健康值条
    const healthContainer = this.add.container(0, 0);
    const healthBg = this.add.graphics();
    healthBg.fillStyle(0x000000, 0.4);
    healthBg.lineStyle(2, 0xe74c3c, 0.6);
    healthBg.fillRoundedRect(0, 0, barWidth, barHeight, 9);
    healthBg.strokeRoundedRect(0, 0, barWidth, barHeight, 9);

    this.healthBar = this.add.graphics();
    this.healthBar.setDepth(1);

    this.healthText = this.add.text(8, 2, '❤️ 100/100', {
      fontSize: fontSize,
      color: '#ffffff',
      fontStyle: 'bold',
      fontFamily: 'Arial, sans-serif'
    });
    this.healthText.setDepth(2);

    healthContainer.add([healthBg, this.healthBar, this.healthText]);

    // 能量值条
    const energyContainer = this.add.container(0, spacing);
    const energyBg = this.add.graphics();
    energyBg.fillStyle(0x000000, 0.4);
    energyBg.lineStyle(2, 0x74b9ff, 0.6);
    energyBg.fillRoundedRect(0, 0, barWidth, barHeight, 9);
    energyBg.strokeRoundedRect(0, 0, barWidth, barHeight, 9);

    this.energyBar = this.add.graphics();
    this.energyBar.setDepth(1);

    this.energyText = this.add.text(8, 2, '⚡ 100/100', {
      fontSize: fontSize,
      color: '#ffffff',
      fontStyle: 'bold',
      fontFamily: 'Arial, sans-serif'
    });
    this.energyText.setDepth(2);

    energyContainer.add([energyBg, this.energyBar, this.energyText]);

    // 快乐值条
    const happinessContainer = this.add.container(0, spacing * 2);
    const happinessBg = this.add.graphics();
    happinessBg.fillStyle(0x000000, 0.4);
    happinessBg.lineStyle(2, 0xff6b9d, 0.6);
    happinessBg.fillRoundedRect(0, 0, barWidth, barHeight, 9);
    happinessBg.strokeRoundedRect(0, 0, barWidth, barHeight, 9);

    this.happinessBar = this.add.graphics();
    this.happinessBar.setDepth(1);

    this.happinessText = this.add.text(8, 2, '😸 100/100', {
      fontSize: fontSize,
      color: '#ffffff',
      fontStyle: 'bold',
      fontFamily: 'Arial, sans-serif'
    });
    this.happinessText.setDepth(2);

    happinessContainer.add([happinessBg, this.happinessBar, this.happinessText]);

    // 等级文本
    this.levelText = this.add.text(0, spacing * 3 + 5, '🐱 等级: 1', {
      fontSize: screenInfo.isMobile ? '12px' : '14px',
      color: '#ffd700',
      fontStyle: 'bold'
    });
    this.levelText.setDepth(102);

    // 添加到主容器
    this.statsContainer.add([healthContainer, energyContainer, happinessContainer, this.levelText]);

    // 存储容器尺寸信息用于响应式更新
    (this.statsContainer as any).barWidth = barWidth;
    (this.statsContainer as any).barHeight = barHeight;
    (this.statsContainer as any).spacing = spacing;
  }

  private createToolIndicator() {
    this.currentToolText = this.add.text(20, this.cameras.main.height - 40, '工具: 无', {
      fontSize: '14px',
      color: '#ffffff',
      backgroundColor: 'rgba(0,0,0,0.7)',
      padding: { x: 10, y: 5 }
    });
    this.currentToolText.setScrollFactor(0);
    this.currentToolText.setDepth(100);
  }

  private createInventoryInterface() {
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;

    this.inventoryContainer = this.add.container(width / 2, height / 2);
    this.inventoryContainer.setScrollFactor(0);
    this.inventoryContainer.setDepth(500);
    this.inventoryContainer.setVisible(false);

    // Background panel
    const inventoryBg = this.add.graphics();
    inventoryBg.fillStyle(0x2c3e50, 0.95);
    inventoryBg.fillRoundedRect(-250, -200, 500, 400, 15);
    inventoryBg.lineStyle(3, 0x34495e);
    inventoryBg.strokeRoundedRect(-250, -200, 500, 400, 15);

    // Title
    const inventoryTitle = this.add.text(0, -170, '🎒 小猫的背包', {
      fontSize: '24px',
      color: '#ecf0f1',
      fontStyle: 'bold'
    });
    inventoryTitle.setOrigin(0.5);

    // Close button
    const closeButton = this.add.text(220, -170, '✕', {
      fontSize: '20px',
      color: '#e74c3c',
      fontStyle: 'bold'
    });
    closeButton.setOrigin(0.5);
    closeButton.setInteractive();
    closeButton.on('pointerdown', () => {
      this.toggleInventory([]);
    });

    this.inventoryContainer.add([inventoryBg, inventoryTitle, closeButton]);
  }

  private createCookingInterface() {
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;

    this.cookingContainer = this.add.container(width / 2, height / 2);
    this.cookingContainer.setScrollFactor(0);
    this.cookingContainer.setDepth(500);
    this.cookingContainer.setVisible(false);

    // Background panel
    const cookingBg = this.add.graphics();
    cookingBg.fillStyle(0x8b4513, 0.95);
    cookingBg.fillRoundedRect(-300, -250, 600, 500, 15);
    cookingBg.lineStyle(3, 0xa0522d);
    cookingBg.strokeRoundedRect(-300, -250, 600, 500, 15);

    // Title
    const cookingTitle = this.add.text(0, -220, '🍳 小猫厨房', {
      fontSize: '24px',
      color: '#ecf0f1',
      fontStyle: 'bold'
    });
    cookingTitle.setOrigin(0.5);

    // Close button
    const closeButton = this.add.text(270, -220, '✕', {
      fontSize: '20px',
      color: '#e74c3c',
      fontStyle: 'bold'
    });
    closeButton.setOrigin(0.5);
    closeButton.setInteractive();
    closeButton.on('pointerdown', () => {
      this.closeCookingInterface();
    });

    this.cookingContainer.add([cookingBg, cookingTitle, closeButton]);
  }

  private onCatStatsChanged(stats: CatStats) {
    if (!this.statsContainer) return;

    const barWidth = (this.statsContainer as any).barWidth || 160;
    const barHeight = (this.statsContainer as any).barHeight || 18;

    // Update health bar with animation
    this.healthBar.clear();
    const healthPercent = stats.health / stats.maxHealth;

    // Create gradient health bar
    const healthGradient = healthPercent > 0.5 ? 0xe74c3c : (healthPercent > 0.25 ? 0xf39c12 : 0x8b0000);
    this.healthBar.fillStyle(healthGradient, 0.8);
    this.healthBar.fillRoundedRect(3, 3, (barWidth - 6) * healthPercent, barHeight - 6, 6);

    // Add glow effect for low health
    if (healthPercent < 0.3) {
      this.healthBar.lineStyle(2, 0xff0000, 0.6);
      this.healthBar.strokeRoundedRect(1, 1, barWidth - 2, barHeight - 2, 8);
    }

    this.healthText.setText(`❤️ ${Math.floor(stats.health)}/${stats.maxHealth}`);

    // Update energy bar with animation
    this.energyBar.clear();
    const energyPercent = stats.energy / stats.maxEnergy;
    this.energyBar.fillStyle(0x74b9ff, 0.8);
    this.energyBar.fillRoundedRect(3, 3, (barWidth - 6) * energyPercent, barHeight - 6, 6);

    // Add sparkle effect for full energy
    if (energyPercent > 0.9) {
      this.energyBar.lineStyle(2, 0x00cec9, 0.7);
      this.energyBar.strokeRoundedRect(1, 1, barWidth - 2, barHeight - 2, 8);
    }

    this.energyText.setText(`⚡ ${Math.floor(stats.energy)}/${stats.maxEnergy}`);

    // Update happiness bar with animation
    this.happinessBar.clear();
    const happinessPercent = stats.happiness / stats.maxHappiness;
    this.happinessBar.fillStyle(0xff6b9d, 0.8);
    this.happinessBar.fillRoundedRect(3, 3, (barWidth - 6) * happinessPercent, barHeight - 6, 6);

    // Add heart effect for high happiness
    if (happinessPercent > 0.8) {
      this.happinessBar.lineStyle(2, 0xff7675, 0.7);
      this.happinessBar.strokeRoundedRect(1, 1, barWidth - 2, barHeight - 2, 8);
    }

    this.happinessText.setText(`😸 ${Math.floor(stats.happiness)}/${stats.maxHappiness}`);

    // Update level with celebration effect for level up
    const newLevelText = `🐱 等级: ${stats.level}`;
    if (this.levelText.text !== newLevelText) {
      this.levelText.setText(newLevelText);
      // Level up celebration
      this.tweens.add({
        targets: this.levelText,
        scaleX: 1.2,
        scaleY: 1.2,
        duration: 300,
        yoyo: true,
        ease: 'Back.easeOut'
      });
    }
  }

  private onToolSelected(toolName: string) {
    this.currentToolText.setText(`工具: ${toolName}`);
  }

  private toggleInventory(items: InventoryItem[]) {
    this.isInventoryOpen = !this.isInventoryOpen;
    this.inventoryContainer.setVisible(this.isInventoryOpen);

    if (this.isInventoryOpen) {
      this.populateInventory(items);
    }
  }

  private populateInventory(items: InventoryItem[]) {
    // Clear existing inventory items (keep background and title)
    const childrenToRemove = this.inventoryContainer.list.slice(3);
    childrenToRemove.forEach(child => {
      this.inventoryContainer.remove(child);
      if (child.destroy) {
        child.destroy();
      }
    });

    // Create inventory slots
    const slotsPerRow = 8;
    const slotSize = 45;
    const slotSpacing = 50;
    const startX = -175;
    const startY = -120;

    items.forEach((item, index) => {
      const row = Math.floor(index / slotsPerRow);
      const col = index % slotsPerRow;
      const x = startX + (col * slotSpacing);
      const y = startY + (row * slotSpacing);

      // Slot background
      const slotBg = this.add.graphics();
      slotBg.fillStyle(0x34495e, 0.8);
      slotBg.fillRoundedRect(x - slotSize / 2, y - slotSize / 2, slotSize, slotSize, 5);
      slotBg.lineStyle(2, 0x7f8c8d);
      slotBg.strokeRoundedRect(x - slotSize / 2, y - slotSize / 2, slotSize, slotSize, 5);

      // Item icon (placeholder)
      const itemIcon = this.add.text(x, y - 8, this.getItemIcon(item), {
        fontSize: '20px'
      });
      itemIcon.setOrigin(0.5);

      // Item quantity
      if (item.quantity > 1) {
        const quantityText = this.add.text(x + 15, y + 15, item.quantity.toString(), {
          fontSize: '10px',
          color: '#ffffff',
          backgroundColor: '#e74c3c',
          padding: { x: 2, y: 1 }
        });
        quantityText.setOrigin(0.5);
        this.inventoryContainer.add(quantityText);
      }

      // Item name on hover
      const itemContainer = this.add.container(x, y);
      itemContainer.setSize(slotSize, slotSize);
      itemContainer.setInteractive();

      let hoverText: Phaser.GameObjects.Text;
      itemContainer.on('pointerover', () => {
        hoverText = this.add.text(x, y - 30, item.name, {
          fontSize: '12px',
          color: '#ffffff',
          backgroundColor: 'rgba(0,0,0,0.8)',
          padding: { x: 5, y: 3 }
        });
        hoverText.setOrigin(0.5);
        this.inventoryContainer.add(hoverText);
      });

      itemContainer.on('pointerout', () => {
        if (hoverText) {
          this.inventoryContainer.remove(hoverText);
          hoverText.destroy();
        }
      });

      this.inventoryContainer.add([slotBg, itemIcon, itemContainer]);
    });
  }

  private openCookingInterface(data: { recipes: Recipe[], inventory: InventoryItem[] }) {
    this.isCookingOpen = true;
    this.cookingContainer.setVisible(true);
    this.populateCookingInterface(data.recipes, data.inventory);
  }

  private closeCookingInterface() {
    this.isCookingOpen = false;
    this.cookingContainer.setVisible(false);
  }

  private populateCookingInterface(recipes: Recipe[], inventory: InventoryItem[]) {
    // Clear existing recipe items (keep background and title)
    const childrenToRemove = this.cookingContainer.list.slice(3);
    childrenToRemove.forEach(child => {
      this.cookingContainer.remove(child);
      if (child.destroy) {
        child.destroy();
      }
    });

    // Available recipes title
    const availableTitle = this.add.text(-280, -180, '可制作的料理:', {
      fontSize: '16px',
      color: '#ecf0f1',
      fontStyle: 'bold'
    });

    this.cookingContainer.add(availableTitle);

    // List recipes
    recipes.forEach((recipe, index) => {
      const y = -150 + (index * 60);

      // Recipe background
      const recipeBg = this.add.graphics();
      const canCook = this.canCookRecipe(recipe, inventory);
      recipeBg.fillStyle(canCook ? 0x27ae60 : 0x7f8c8d, 0.3);
      recipeBg.fillRoundedRect(-280, y - 20, 560, 50, 8);

      if (canCook) {
        recipeBg.lineStyle(2, 0x2ecc71);
        recipeBg.strokeRoundedRect(-280, y - 20, 560, 50, 8);
      }

      // Recipe name
      const recipeName = this.add.text(-270, y - 10, recipe.name, {
        fontSize: '14px',
        color: canCook ? '#ecf0f1' : '#95a5a6',
        fontStyle: 'bold'
      });

      // Recipe description
      const recipeDesc = this.add.text(-270, y + 5, recipe.description, {
        fontSize: '10px',
        color: canCook ? '#bdc3c7' : '#7f8c8d'
      });

      // Ingredients
      const ingredientsText = recipe.ingredients.map(ing => {
        const item = inventory.find(i => i.id === ing.itemId);
        const hasEnough = item && item.quantity >= ing.quantity;
        return `${ing.itemId} x${ing.quantity}${hasEnough ? '✓' : '✗'}`;
      }).join(', ');

      const ingredients = this.add.text(-270, y + 18, `需要: ${ingredientsText}`, {
        fontSize: '9px',
        color: canCook ? '#95a5a6' : '#7f8c8d'
      });

      // Cook button
      if (canCook) {
        const cookButton = this.add.text(250, y, '制作', {
          fontSize: '12px',
          color: '#ffffff',
          backgroundColor: '#e67e22',
          padding: { x: 8, y: 4 }
        });
        cookButton.setOrigin(0.5);
        cookButton.setInteractive();
        cookButton.on('pointerdown', () => {
          this.cookRecipe(recipe);
        });
        this.cookingContainer.add(cookButton);
      }

      this.cookingContainer.add([recipeBg, recipeName, recipeDesc, ingredients]);
    });
  }

  private canCookRecipe(recipe: Recipe, inventory: InventoryItem[]): boolean {
    return recipe.ingredients.every(ingredient => {
      const item = inventory.find(i => i.id === ingredient.itemId);
      return item && item.quantity >= ingredient.quantity;
    });
  }

  private cookRecipe(recipe: Recipe) {
    // Emit event to GameScene to handle cooking
    this.scene.get('GameScene').events.emit('start-cooking', recipe);
    this.closeCookingInterface();
  }

  private getItemIcon(item: InventoryItem): string {
    const icons: { [key: string]: string } = {
      // Tools
      'watering_can': '💧',
      'hoe': '🔨',
      'fertilizer': '🌱',

      // Seeds
      'carrot_seeds': '🥕',
      'tomato_seeds': '🍅',
      'wheat_seeds': '🌾',
      'corn_seeds': '🌽',
      'strawberry_seeds': '🍓',
      'lettuce_seeds': '🥬',
      'potato_seeds': '🥔',
      'pumpkin_seeds': '🎃',

      // Crops
      'carrot': '🥕',
      'tomato': '🍅',
      'wheat': '🌾',
      'corn': '🌽',
      'strawberry': '🍓',
      'lettuce': '🥬',
      'potato': '🥔',
      'pumpkin': '🎃',

      // Food
      'carrot_soup': '🍲',
      'tomato_salad': '🥗',
      'wheat_bread': '🍞',
      'corn_soup': '🍲',
      'strawberry_cake': '🍰',
      'potato_stew': '🍲',
      'pumpkin_pie': '🥧',
      'mixed_salad': '🥗',

      // Ingredients
      'water': '💧'
    };

    return icons[item.id] || '📦';
  }

  private createInteractionIndicators() {
    // Create a container for interaction indicators
    this.interactionIndicators = this.add.container(0, 0);
    this.interactionIndicators.setDepth(500);

    // Create proximity indicator
    this.proximityIndicator = this.add.graphics();
    this.proximityIndicator.setScrollFactor(1);
    this.proximityIndicator.setDepth(499);
    this.proximityIndicator.setVisible(false);
  }

  private showInteractionHint(data: { x: number, y: number, type: string, message?: string }) {
    // Create floating interaction hint
    const hintIcon = this.getInteractionIcon(data.type);
    const hintText = this.add.text(data.x, data.y - 60, hintIcon, {
      fontSize: '32px',
      color: '#f1c40f'
    });
    hintText.setOrigin(0.5);
    hintText.setDepth(1000);

    // Add pulsing animation
    this.tweens.add({
      targets: hintText,
      scaleX: 1.2,
      scaleY: 1.2,
      duration: 500,
      yoyo: true,
      repeat: 2,
      ease: 'Sine.easeInOut'
    });

    // Fade out after animation
    this.time.delayedCall(2000, () => {
      this.tweens.add({
        targets: hintText,
        alpha: 0,
        y: hintText.y - 30,
        duration: 800,
        ease: 'Power2',
        onComplete: () => hintText.destroy()
      });
    });

    // Show message if provided
    if (data.message) {
      this.showNotification(data.message);
    }
  }

  private highlightInteractable(data: { x: number, y: number, type: string, range: number }) {
    // Clear existing proximity indicator
    this.proximityIndicator.clear();

    // Draw interaction range circle
    this.proximityIndicator.lineStyle(3, 0x74b9ff, 0.6);
    this.proximityIndicator.strokeCircle(data.x, data.y, data.range);

    // Add inner glow effect
    this.proximityIndicator.lineStyle(1, 0x74b9ff, 0.3);
    this.proximityIndicator.strokeCircle(data.x, data.y, data.range - 5);

    this.proximityIndicator.setVisible(true);

    // Create pulsing effect
    this.tweens.add({
      targets: this.proximityIndicator,
      alpha: 0.3,
      duration: 1000,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });

    // Auto-hide after 3 seconds
    this.time.delayedCall(3000, () => {
      this.proximityIndicator.setVisible(false);
      this.tweens.killTweensOf(this.proximityIndicator);
      this.proximityIndicator.setAlpha(1);
    });
  }

  private getInteractionIcon(type: string): string {
    const icons: { [key: string]: string } = {
      'farm_plot': '🌱',
      'cooking_station': '🍳',
      'decoration': '✨',
      'harvest': '🌾',
      'plant': '🌰',
      'water': '💧',
      'fertilize': '🌿',
      'cook': '👨‍🍳',
      'default': '💫'
    };

    return icons[type] || icons['default'];
  }

  // Enhanced notification system with modern design
  private showNotification(text: string, category: string = 'info') {
    const container = (this as any).notificationContainer;
    if (!container) return;

    // Clear existing notification
    if (container.visible) {
      this.tweens.killTweensOf(container);
    }

    // Set notification style based on category
    const styles = {
      info: { color: '#74b9ff', bgColor: 0x2d3436, borderColor: 0x74b9ff },
      success: { color: '#00b894', bgColor: 0x2d3436, borderColor: 0x00b894 },
      warning: { color: '#fdcb6e', bgColor: 0x2d3436, borderColor: 0xfdcb6e },
      error: { color: '#e17055', bgColor: 0x2d3436, borderColor: 0xe17055 },
      achievement: { color: '#a29bfe', bgColor: 0x2d3436, borderColor: 0xa29bfe }
    };

    const style = styles[category as keyof typeof styles] || styles.info;

    // Update notification background
    const bg = container.list[0] as Phaser.GameObjects.Graphics;
    bg.clear();
    bg.fillStyle(style.bgColor, 0.9);
    bg.lineStyle(2, style.borderColor, 0.8);
    bg.fillRoundedRect(-120, -20, 240, 40, 20);
    bg.strokeRoundedRect(-120, -20, 240, 40, 20);

    // Add subtle glow effect
    bg.lineStyle(4, style.borderColor, 0.3);
    bg.strokeRoundedRect(-124, -24, 248, 48, 24);

    this.notificationText.setText(text);
    this.notificationText.setStyle({
      fontSize: '16px',
      color: style.color,
      align: 'center',
      fontFamily: 'Arial, sans-serif',
      fontStyle: 'bold'
    });

    container.setVisible(true);
    container.setAlpha(0);
    container.setScale(0.8);

    // Modern slide-in animation with bounce
    this.tweens.add({
      targets: container,
      alpha: 1,
      scaleX: 1,
      scaleY: 1,
      y: container.y + 5,
      duration: 400,
      ease: 'Back.easeOut'
    });

    // Auto-hide after delay
    this.time.delayedCall(3000, () => {
      this.tweens.add({
        targets: this.notificationText,
        alpha: 0,
        y: this.notificationText.y - 10,
        duration: 500,
        ease: 'Power2',
        onComplete: () => {
          this.notificationText.setVisible(false);
          this.notificationText.y = 50; // Reset position
        }
      });
    });
  }

  // Enhanced dialogue system with character portraits
  private showDialogue(data: { text: string, character?: string, portrait?: string }) {
    this.dialogueText.setText(data.text);

    // Add character portrait if provided
    if (data.character && data.portrait) {
      // Create or update character portrait
      if (!this.characterPortrait) {
        this.characterPortrait = this.add.text(-280, 0, data.portrait, {
          fontSize: '32px'
        });
        this.characterPortrait.setOrigin(0.5);
        this.dialogueBox.add(this.characterPortrait);
      } else {
        this.characterPortrait.setText(data.portrait);
      }
    }

    this.dialogueBox.setVisible(true);
    this.dialogueBox.setAlpha(0);

    // Slide up animation
    this.tweens.add({
      targets: this.dialogueBox,
      alpha: 1,
      y: this.dialogueBox.y - 10,
      duration: 400,
      ease: 'Back.easeOut'
    });

    // Auto-hide after reading time (based on text length)
    const readingTime = Math.max(2000, data.text.length * 50);
    this.time.delayedCall(readingTime, () => {
      this.hideDialogue();
    });
  }

  private hideDialogue() {
    this.tweens.add({
      targets: this.dialogueBox,
      alpha: 0,
      y: this.dialogueBox.y + 10,
      duration: 300,
      ease: 'Power2',
      onComplete: () => {
        this.dialogueBox.setVisible(false);
        // Reset position
        this.dialogueBox.y = this.cameras.main.height - 100;
      }
    });
  }

  update() {
    // Update UI elements if needed
    // For example, update mini-map or other dynamic UI elements

    // Update interaction indicators based on game state
    this.updateInteractionIndicators();

    // 更新响应式UI布局
    this.updateResponsiveLayout();
  }

  private updateResponsiveLayout() {
    if (!this.uiLayoutManager) return;

    // const screenInfo = this.uiLayoutManager.getScreenInfo();

    // 更新状态栏位置
    if (this.statsContainer) {
      const statsPosition = this.uiLayoutManager.getStatsBarPosition();

      // 平滑移动到新位置
      this.tweens.add({
        targets: this.statsContainer,
        x: statsPosition.x,
        y: statsPosition.y,
        duration: 300,
        ease: 'Power2.easeOut'
      });
    }

    // 更新对话框和通知的位置以适应屏幕变化
    this.updateDialoguePosition();
    this.updateNotificationPosition();
  }

  private updateDialoguePosition() {
    if (this.dialogueBox) {
      const width = this.cameras.main.width;
      const height = this.cameras.main.height;
      const screenInfo = this.uiLayoutManager.getScreenInfo();

      // 根据屏幕尺寸调整对话框位置
      const dialogueY = screenInfo.isMobile
        ? height - (screenInfo.isPortrait ? 100 : 80)
        : height - 120;

      this.dialogueBox.setPosition(width / 2, dialogueY);
    }
  }

  private updateNotificationPosition() {
    const notificationContainer = (this as any).notificationContainer;
    if (notificationContainer) {
      const width = this.cameras.main.width;
      const screenInfo = this.uiLayoutManager.getScreenInfo();

      // 根据屏幕尺寸调整通知位置
      const notificationY = screenInfo.isMobile
        ? (screenInfo.isPortrait ? 40 : 30)
        : 50;

      notificationContainer.setPosition(width / 2, notificationY);
    }
  }

  private updateInteractionIndicators() {
    // This could be expanded to show context-sensitive interaction hints
    // based on what the player is near or what tool they have selected
  }
}
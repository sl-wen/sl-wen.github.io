import * as Phaser from 'phaser';
import { InventoryItem, CatStats, Recipe } from '../types/GameTypes';

export class UIScene extends Phaser.Scene {
  private dialogueBox!: Phaser.GameObjects.Container;
  private dialogueText!: Phaser.GameObjects.Text;
  private notificationText!: Phaser.GameObjects.Text;
  private healthBar!: Phaser.GameObjects.Graphics;
  private energyBar!: Phaser.GameObjects.Graphics;
  private happinessBar!: Phaser.GameObjects.Graphics;
  private healthText!: Phaser.GameObjects.Text;
  private energyText!: Phaser.GameObjects.Text;
  private happinessText!: Phaser.GameObjects.Text;
  private levelText!: Phaser.GameObjects.Text;
  private inventoryContainer!: Phaser.GameObjects.Container;
  private cookingContainer!: Phaser.GameObjects.Container;
  private currentToolText!: Phaser.GameObjects.Text;
  private isInventoryOpen: boolean = false;
  private isCookingOpen: boolean = false;
  private interactionIndicators!: Phaser.GameObjects.Container;
  private proximityIndicator!: Phaser.GameObjects.Graphics;
  private characterPortrait!: Phaser.GameObjects.Text;

  constructor() {
    super({ key: 'UIScene' });
  }

  create() {
    // Create UI elements
    this.createDialogueBox();
    this.createNotificationArea();
    this.createCatStats();
    this.createToolIndicator();
    this.createInventoryInterface();
    this.createCookingInterface();
    this.createMiniMap();
    this.createInteractionIndicators();

    // Listen for events from GameScene
    this.events.on('show-dialogue', this.showDialogue, this);
    this.events.on('show-notification', this.showNotification, this);
    this.events.on('cat-stats-changed', this.onCatStatsChanged, this);
    this.events.on('toggle-inventory', this.toggleInventory, this);
    this.events.on('open-cooking', this.openCookingInterface, this);
    this.events.on('tool-selected', this.onToolSelected, this);
    this.events.on('show-interaction-hint', this.showInteractionHint, this);
    this.events.on('highlight-interactable', this.highlightInteractable, this);
  }

  private createDialogueBox() {
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;

    // Create dialogue container
    this.dialogueBox = this.add.container(width / 2, height - 100);

    // Background
    const dialogueBg = this.add.graphics();
    dialogueBg.fillStyle(0x000000, 0.8);
    dialogueBg.fillRoundedRect(-300, -40, 600, 80, 10);
    dialogueBg.lineStyle(2, 0x4ecdc4);
    dialogueBg.strokeRoundedRect(-300, -40, 600, 80, 10);

    // Text
    this.dialogueText = this.add.text(0, 0, '', {
      fontSize: '16px',
      color: '#ffffff',
      align: 'center',
      wordWrap: { width: 580 }
    });
    this.dialogueText.setOrigin(0.5);

    // Add to container
    this.dialogueBox.add([dialogueBg, this.dialogueText]);
    this.dialogueBox.setVisible(false);
    this.dialogueBox.setScrollFactor(0);
    this.dialogueBox.setDepth(1000);
  }

  private createNotificationArea() {
    const width = this.cameras.main.width;

    this.notificationText = this.add.text(width / 2, 50, '', {
      fontSize: '18px',
      color: '#f1c40f',
      align: 'center',
      backgroundColor: 'rgba(0,0,0,0.7)',
      padding: { x: 20, y: 10 }
    });
    this.notificationText.setOrigin(0.5);
    this.notificationText.setScrollFactor(0);
    this.notificationText.setVisible(false);
    this.notificationText.setDepth(999);
  }

  private createCatStats() {
    const startY = 20;
    const barWidth = 150;
    const barHeight = 16;
    const spacing = 25;

    // Health bar
    const healthBg = this.add.graphics();
    healthBg.fillStyle(0x8b0000, 0.3);
    healthBg.fillRoundedRect(20, startY, barWidth, barHeight, 8);
    healthBg.setScrollFactor(0);
    healthBg.setDepth(100);

    this.healthBar = this.add.graphics();
    this.healthBar.setScrollFactor(0);
    this.healthBar.setDepth(101);

    this.healthText = this.add.text(25, startY + 2, '❤️ 100/100', {
      fontSize: '12px',
      color: '#ffffff',
      fontStyle: 'bold'
    });
    this.healthText.setScrollFactor(0);
    this.healthText.setDepth(102);

    // Energy bar
    const energyBg = this.add.graphics();
    energyBg.fillStyle(0x0066cc, 0.3);
    energyBg.fillRoundedRect(20, startY + spacing, barWidth, barHeight, 8);
    energyBg.setScrollFactor(0);
    energyBg.setDepth(100);

    this.energyBar = this.add.graphics();
    this.energyBar.setScrollFactor(0);
    this.energyBar.setDepth(101);

    this.energyText = this.add.text(25, startY + spacing + 2, '⚡ 100/100', {
      fontSize: '12px',
      color: '#ffffff',
      fontStyle: 'bold'
    });
    this.energyText.setScrollFactor(0);
    this.energyText.setDepth(102);

    // Happiness bar
    const happinessBg = this.add.graphics();
    happinessBg.fillStyle(0xff6b9d, 0.3);
    happinessBg.fillRoundedRect(20, startY + spacing * 2, barWidth, barHeight, 8);
    happinessBg.setScrollFactor(0);
    happinessBg.setDepth(100);

    this.happinessBar = this.add.graphics();
    this.happinessBar.setScrollFactor(0);
    this.happinessBar.setDepth(101);

    this.happinessText = this.add.text(25, startY + spacing * 2 + 2, '😸 100/100', {
      fontSize: '12px',
      color: '#ffffff',
      fontStyle: 'bold'
    });
    this.happinessText.setScrollFactor(0);
    this.happinessText.setDepth(102);

    // Level text
    this.levelText = this.add.text(20, startY + spacing * 3 + 5, '🐱 等级: 1', {
      fontSize: '14px',
      color: '#ffd700',
      fontStyle: 'bold'
    });
    this.levelText.setScrollFactor(0);
    this.levelText.setDepth(102);
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

  private createMiniMap() {
    // Simple mini-map placeholder
    const miniMapBg = this.add.graphics();
    miniMapBg.fillStyle(0x000000, 0.5);
    miniMapBg.fillRoundedRect(this.cameras.main.width - 120, 20, 100, 80, 5);
    miniMapBg.lineStyle(2, 0x4ecdc4);
    miniMapBg.strokeRoundedRect(this.cameras.main.width - 120, 20, 100, 80, 5);
    miniMapBg.setScrollFactor(0);
    miniMapBg.setDepth(90);

    const miniMapText = this.add.text(this.cameras.main.width - 70, 60, '🗺️\n农场', {
      fontSize: '10px',
      color: '#ffffff',
      align: 'center'
    });
    miniMapText.setOrigin(0.5);
    miniMapText.setScrollFactor(0);
    miniMapText.setDepth(91);
  }

  private showDialogue(text: string) {
    this.dialogueText.setText(text);
    this.dialogueBox.setVisible(true);

    // Auto-hide after 3 seconds
    this.time.delayedCall(3000, () => {
      this.dialogueBox.setVisible(false);
    });
  }

  private showNotification(text: string) {
    this.notificationText.setText(text);
    this.notificationText.setVisible(true);

    // Fade out animation
    this.tweens.add({
      targets: this.notificationText,
      alpha: { from: 1, to: 0 },
      duration: 3000,
      ease: 'Power2',
      onComplete: () => {
        this.notificationText.setVisible(false);
        this.notificationText.setAlpha(1);
      }
    });
  }

  private onCatStatsChanged(stats: CatStats) {
    // Update health bar
    this.healthBar.clear();
    const healthPercent = stats.health / stats.maxHealth;
    this.healthBar.fillStyle(0xe74c3c);
    this.healthBar.fillRoundedRect(20, 20, 150 * healthPercent, 16, 8);
    this.healthText.setText(`❤️ ${Math.floor(stats.health)}/${stats.maxHealth}`);

    // Update energy bar
    this.energyBar.clear();
    const energyPercent = stats.energy / stats.maxEnergy;
    this.energyBar.fillStyle(0x3498db);
    this.energyBar.fillRoundedRect(20, 45, 150 * energyPercent, 16, 8);
    this.energyText.setText(`⚡ ${Math.floor(stats.energy)}/${stats.maxEnergy}`);

    // Update happiness bar
    this.happinessBar.clear();
    const happinessPercent = stats.happiness / stats.maxHappiness;
    this.happinessBar.fillStyle(0xff6b9d);
    this.happinessBar.fillRoundedRect(20, 70, 150 * happinessPercent, 16, 8);
    this.happinessText.setText(`😸 ${Math.floor(stats.happiness)}/${stats.maxHappiness}`);

    // Update level
    this.levelText.setText(`🐱 等级: ${stats.level}`);
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
      slotBg.fillRoundedRect(x - slotSize/2, y - slotSize/2, slotSize, slotSize, 5);
      slotBg.lineStyle(2, 0x7f8c8d);
      slotBg.strokeRoundedRect(x - slotSize/2, y - slotSize/2, slotSize, slotSize, 5);

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

  // Enhanced notification system with categories
  private showNotification(text: string, category: string = 'info') {
    // Clear existing notification
    if (this.notificationText.visible) {
      this.tweens.killTweensOf(this.notificationText);
    }

    // Set notification style based on category
    const styles = {
      info: { color: '#3498db', backgroundColor: 'rgba(52, 152, 219, 0.1)' },
      success: { color: '#2ecc71', backgroundColor: 'rgba(46, 204, 113, 0.1)' },
      warning: { color: '#f39c12', backgroundColor: 'rgba(243, 156, 18, 0.1)' },
      error: { color: '#e74c3c', backgroundColor: 'rgba(231, 76, 60, 0.1)' },
      achievement: { color: '#9b59b6', backgroundColor: 'rgba(155, 89, 182, 0.1)' }
    };

    const style = styles[category as keyof typeof styles] || styles.info;
    
    this.notificationText.setText(text);
    this.notificationText.setStyle({
      fontSize: '18px',
      color: style.color,
      align: 'center',
      backgroundColor: style.backgroundColor,
      padding: { x: 20, y: 10 }
    });

    this.notificationText.setVisible(true);
    this.notificationText.setAlpha(0);

    // Slide in animation
    this.tweens.add({
      targets: this.notificationText,
      alpha: 1,
      y: this.notificationText.y + 10,
      duration: 300,
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
  }

  private updateInteractionIndicators() {
    // This could be expanded to show context-sensitive interaction hints
    // based on what the player is near or what tool they have selected
  }
}
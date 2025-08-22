import * as Phaser from 'phaser';

export class Chest extends Phaser.Physics.Arcade.Sprite {
  private treasure: string;
  private isOpened: boolean = false;
  private interactionCooldown: boolean = false;
  private glow: Phaser.GameObjects.Graphics | null = null;
  private indicator: Phaser.GameObjects.Text | null = null;
  private interactionPrompt: Phaser.GameObjects.Container | null = null;
  private rangeIndicator: Phaser.GameObjects.Graphics | null = null;
  private isPlayerNearby: boolean = false;

  constructor(scene: Phaser.Scene, x: number, y: number, treasure: string) {
    super(scene, x, y, 'chest');

    this.treasure = treasure;

    // Add to scene
    scene.add.existing(this);
    scene.physics.add.existing(this, true); // Static body

    // Set properties
    this.setSize(28, 28);
    this.setOffset(2, 4);
    this.setDepth(5);
    this.setTint(0xf1c40f);

    // Create visual effects
    this.createGlowEffect();
    this.createInteractionIndicator();
    this.createInteractionPrompt();
    this.createRangeIndicator();
  }

  private createGlowEffect() {
    // Create a glowing effect around the chest
    this.glow = this.scene.add.graphics();
    this.glow.lineStyle(3, 0xffd700, 0.5);
    this.glow.strokeRect(this.x - 18, this.y - 18, 36, 36);
    this.glow.setDepth(4);

    // Pulsing glow animation
    this.scene.tweens.add({
      targets: this.glow,
      alpha: 0.2,
      duration: 1000,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });
  }

  private createInteractionIndicator() {
    // Create a floating treasure icon
    this.indicator = this.scene.add.text(this.x, this.y - 40, '💰', {
      fontSize: '16px'
    });
    this.indicator.setOrigin(0.5);
    this.indicator.setVisible(false);
    this.indicator.setDepth(10);

    // Floating animation
    this.scene.tweens.add({
      targets: this.indicator,
      y: this.indicator.y - 5,
      duration: 800,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });
  }

  private createInteractionPrompt() {
    // Create interaction prompt container
    this.interactionPrompt = this.scene.add.container(this.x, this.y - 60);
    this.interactionPrompt.setDepth(15);

    // Background for prompt
    const promptBg = this.scene.add.graphics();
    promptBg.fillStyle(0x000000, 0.8);
    promptBg.fillRoundedRect(-40, -15, 80, 30, 5);
    promptBg.lineStyle(1, 0xffd700, 1);
    promptBg.strokeRoundedRect(-40, -15, 80, 30, 5);

    // Prompt text - show different text for mobile vs desktop
    const isMobile = this.scene.sys.game.device.input.touch;
    const promptText = this.scene.add.text(0, 0, isMobile ? 'Tap' : 'Press E', {
      fontSize: '12px',
      color: '#ffffff',
      align: 'center'
    });
    promptText.setOrigin(0.5);

    // Add to container
    this.interactionPrompt.add([promptBg, promptText]);
    this.interactionPrompt.setVisible(false);

    // Gentle pulsing animation for prompt
    this.scene.tweens.add({
      targets: this.interactionPrompt,
      scale: 1.1,
      duration: 600,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });
  }

  private createRangeIndicator() {
    // Create interaction range circle
    this.rangeIndicator = this.scene.add.graphics();
    this.rangeIndicator.setDepth(3);
    this.rangeIndicator.setVisible(false);
    
    // Draw range circle
    this.rangeIndicator.lineStyle(2, 0x4ecdc4, 0.6);
    this.rangeIndicator.strokeCircle(this.x, this.y, 60);
    
    // Add subtle pulsing animation
    this.scene.tweens.add({
      targets: this.rangeIndicator,
      alpha: 0.3,
      duration: 1500,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });
  }

  public interact() {
    if (this.isOpened || this.interactionCooldown) return;

    this.interactionCooldown = true;

    // Hide interaction prompt immediately
    this.showInteractionPrompt(false);

    // Open chest animation
    this.openChest();

    // Show treasure notification with enhanced feedback
    (this.scene as any).showNotification(`✨ 获得了: ${this.treasure}! ✨`);

    // Give reward to player
    const gameScene = this.scene;
    if ((gameScene as any).player) {
      (gameScene as any).player.gainExperience(25);

      // Give specific rewards based on treasure type with better feedback
      if (this.treasure.includes('金币')) {
        // Give gold (could implement inventory system)
        this.createRewardEffect(0xffd700); // Gold particles
      } else if (this.treasure.includes('生命药水')) {
        const healAmount = 30;
        (gameScene as any).player.heal(healAmount);
        this.createRewardEffect(0x00ff00); // Green particles for health
        (this.scene as any).showNotification(`❤️ 恢复了 ${healAmount} 点生命值!`);
      } else if (this.treasure.includes('魔法')) {
        const manaAmount = 20;
        (gameScene as any).player.restoreMana(manaAmount);
        this.createRewardEffect(0x0000ff); // Blue particles for mana
        (this.scene as any).showNotification(`💙 恢复了 ${manaAmount} 点魔法值!`);
      }
    }

    // Reset cooldown
    this.scene.time.delayedCall(1000, () => {
      this.interactionCooldown = false;
    });
  }

  private createRewardEffect(color: number) {
    // Create specific reward particles
    const particles = this.scene.add.particles(this.x, this.y - 10, 'grass', {
      scale: { start: 0.4, end: 0 },
      alpha: { start: 1, end: 0 },
      tint: color,
      lifespan: 2000,
      quantity: 20,
      speed: { min: 50, max: 120 },
      gravityY: -30,
      emitZone: { type: 'edge', source: new Phaser.Geom.Circle(0, 0, 15), quantity: 20 }
    });

    this.scene.time.delayedCall(2000, () => {
      particles.destroy();
    });
  }

  private openChest() {
    this.isOpened = true;

    // Change appearance to opened chest
    this.setTint(0xd4af37); // Darker gold

    // Remove glow effect
    if (this.glow) {
      this.glow.destroy();
      this.glow = null;
    }

    // Hide indicator
    this.showIndicator(false);

    // Enhanced opening animation
    this.scene.tweens.add({
      targets: this,
      scaleY: 0.8,
      scaleX: 1.1,
      duration: 200,
      yoyo: true,
      ease: 'Back.easeOut',
      onComplete: () => {
        // Add opened chest visual state
        this.setAlpha(0.8);
      }
    });

    // Enhanced sparkle effect
    this.createSparkleEffect();
  }

  private createSparkleEffect() {
    const particles = this.scene.add.particles(this.x, this.y - 10, 'grass', {
      scale: { start: 0.3, end: 0 },
      alpha: { start: 1, end: 0 },
      tint: [0xffd700, 0xffff00, 0xffa500],
      lifespan: 1500,
      quantity: 15,
      speed: { min: 30, max: 80 },
      gravityY: -50
    });

    this.scene.time.delayedCall(1500, () => {
      particles.destroy();
    });
  }

  public showIndicator(show: boolean) {
    if (this.indicator && !this.isOpened) {
      this.indicator.setVisible(show);
    }
  }

  public showInteractionPrompt(show: boolean) {
    if (this.interactionPrompt && !this.isOpened) {
      this.interactionPrompt.setVisible(show);
    }
  }

  public showRangeIndicator(show: boolean) {
    if (this.rangeIndicator && !this.isOpened) {
      this.rangeIndicator.setVisible(show);
    }
  }

  public checkPlayerProximity(playerX: number, playerY: number): boolean {
    const distance = Phaser.Math.Distance.Between(this.x, this.y, playerX, playerY);
    const wasNearby = this.isPlayerNearby;
    const isInRange = distance < 60;
    const isVeryClose = distance < 40;
    
    this.isPlayerNearby = isInRange;

    // Show/hide interaction elements based on proximity
    if (isInRange && !wasNearby && !this.isOpened) {
      this.showIndicator(true);
      this.showRangeIndicator(true);
      
      if (isVeryClose) {
        this.showInteractionPrompt(true);
      }
    } else if (!isInRange && wasNearby) {
      this.showIndicator(false);
      this.showInteractionPrompt(false);
      this.showRangeIndicator(false);
    } else if (isInRange && !this.isOpened) {
      // Update prompt visibility based on distance
      if (isVeryClose && !this.interactionPrompt?.visible) {
        this.showInteractionPrompt(true);
      } else if (!isVeryClose && this.interactionPrompt?.visible) {
        this.showInteractionPrompt(false);
      }
    }

    return this.isPlayerNearby;
  }

  public isChestOpened(): boolean {
    return this.isOpened;
  }

  public getTreasure(): string {
    return this.treasure;
  }

  update() {
    // Update indicator position
    if (this.indicator) {
      this.indicator.x = this.x;
    }

    // Update interaction prompt position
    if (this.interactionPrompt) {
      this.interactionPrompt.x = this.x;
      this.interactionPrompt.y = this.y - 60;
    }

    // Update range indicator position
    if (this.rangeIndicator && !this.isOpened) {
      this.rangeIndicator.clear();
      this.rangeIndicator.lineStyle(2, 0x4ecdc4, 0.6);
      this.rangeIndicator.strokeCircle(this.x, this.y, 60);
    }

    // Update glow position
    if (this.glow && !this.isOpened) {
      this.glow.clear();
      this.glow.lineStyle(3, 0xffd700, 0.5);
      this.glow.strokeRect(this.x - 18, this.y - 18, 36, 36);
    }
  }

  destroy() {
    if (this.indicator) {
      this.indicator.destroy();
      this.indicator = null;
    }
    if (this.glow) {
      this.glow.destroy();
      this.glow = null;
    }
    if (this.interactionPrompt) {
      this.interactionPrompt.destroy();
      this.interactionPrompt = null;
    }
    if (this.rangeIndicator) {
      this.rangeIndicator.destroy();
      this.rangeIndicator = null;
    }
    super.destroy();
  }
}
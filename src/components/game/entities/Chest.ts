import Phaser from 'phaser';

export class Chest extends Phaser.Physics.Arcade.Sprite {
  private treasure: string;
  private isOpened: boolean = false;
  private interactionCooldown: boolean = false;

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
    
    // Create glow effect
    this.createGlowEffect();
    
    // Add interaction indicator
    this.createInteractionIndicator();
  }

  private createGlowEffect() {
    // Create a glowing effect around the chest
    const glow = this.scene.add.graphics();
    glow.lineStyle(3, 0xffd700, 0.5);
    glow.strokeRect(this.x - 18, this.y - 18, 36, 36);
    
    // Store reference
    (this as any).glow = glow;
    
    // Pulsing glow animation
    this.scene.tweens.add({
      targets: glow,
      alpha: 0.2,
      duration: 1000,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });
  }

  private createInteractionIndicator() {
    // Create a floating treasure icon
    const indicator = this.scene.add.text(this.x, this.y - 40, '💰', {
      fontSize: '16px'
    });
    indicator.setOrigin(0.5);
    indicator.setVisible(false);
    
    // Store reference
    (this as any).indicator = indicator;
    
    // Floating animation
    this.scene.tweens.add({
      targets: indicator,
      y: indicator.y - 5,
      duration: 800,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });
  }

  public interact() {
    if (this.isOpened || this.interactionCooldown) return;
    
    this.interactionCooldown = true;
    
    // Open chest animation
    this.openChest();
    
    // Show treasure notification
    (this.scene as any).showNotification(`获得了: ${this.treasure}!`);
    
    // Give reward to player
    const gameScene = this.scene;
    if ((gameScene as any).player) {
      (gameScene as any).player.gainExperience(25);
      
      // Give specific rewards based on treasure type
      if (this.treasure.includes('金币')) {
        // Give gold (could implement inventory system)
      } else if (this.treasure.includes('生命药水')) {
        (gameScene as any).player.heal(30);
      } else if (this.treasure.includes('魔法')) {
        (gameScene as any).player.restoreMana(20);
      }
    }
    
    // Reset cooldown
    this.scene.time.delayedCall(1000, () => {
      this.interactionCooldown = false;
    });
  }

  private openChest() {
    this.isOpened = true;
    
    // Change appearance to opened chest
    this.setTint(0xd4af37); // Darker gold
    
    // Remove glow effect
    if ((this as any).glow) {
      (this as any).glow.destroy();
    }
    
    // Hide indicator
    this.showIndicator(false);
    
    // Opening animation
    this.scene.tweens.add({
      targets: this,
      scaleY: 0.8,
      duration: 200,
      yoyo: true,
      ease: 'Back.easeOut'
    });
    
    // Sparkle effect
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
    if ((this as any).indicator && !this.isOpened) {
      (this as any).indicator.setVisible(show);
    }
  }

  public isChestOpened(): boolean {
    return this.isOpened;
  }

  public getTreasure(): string {
    return this.treasure;
  }

  update() {
    // Update indicator position
    if ((this as any).indicator) {
      (this as any).indicator.x = this.x;
    }
    
    // Update glow position
    if ((this as any).glow && !this.isOpened) {
      (this as any).glow.x = this.x - 18;
      (this as any).glow.y = this.y - 18;
    }
  }

  destroy() {
    if ((this as any).indicator) {
      (this as any).indicator.destroy();
    }
    if ((this as any).glow) {
      (this as any).glow.destroy();
    }
    super.destroy();
  }
}
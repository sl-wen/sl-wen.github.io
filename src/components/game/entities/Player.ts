import Phaser from 'phaser';

export class Player extends Phaser.Physics.Arcade.Sprite {
  private direction: string = 'down';
  private health: number = 100;
  private maxHealth: number = 100;
  private mana: number = 50;
  private maxMana: number = 100;
  private level: number = 1;
  private experience: number = 0;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, 'player');
    
    // Add to scene
    scene.add.existing(this);
    scene.physics.add.existing(this);
    
    // Set physics properties
    this.setCollideWorldBounds(true);
    this.setSize(24, 24);
    this.setOffset(4, 8);
    
    // Set initial properties
    this.setDepth(10);
    this.setTint(0x3498db);
    
    // Create animations (using tint changes since we have simple sprites)
    this.createAnimations();
  }

  private createAnimations() {
    // Since we're using simple colored rectangles, we'll simulate animations with tint changes
    this.scene.tweens.add({
      targets: this,
      scaleX: 1.1,
      scaleY: 0.9,
      duration: 200,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });
  }

  public setDirection(direction: string) {
    this.direction = direction;
    
    // Change tint slightly based on direction for visual feedback
    switch (direction) {
      case 'up':
        this.setTint(0x2980b9);
        break;
      case 'down':
        this.setTint(0x3498db);
        break;
      case 'left':
        this.setTint(0x2c3e50);
        break;
      case 'right':
        this.setTint(0x34495e);
        break;
    }
  }

  public getDirection(): string {
    return this.direction;
  }

  public takeDamage(amount: number) {
    this.health = Math.max(0, this.health - amount);
    
    // Flash red when taking damage
    this.setTint(0xff0000);
    this.scene.time.delayedCall(200, () => {
      this.setTint(0x3498db);
    });
    
    if (this.health <= 0) {
      this.die();
    }
  }

  public heal(amount: number) {
    this.health = Math.min(this.maxHealth, this.health + amount);
    
    // Flash green when healing
    this.setTint(0x00ff00);
    this.scene.time.delayedCall(200, () => {
      this.setTint(0x3498db);
    });
  }

  public useMana(amount: number): boolean {
    if (this.mana >= amount) {
      this.mana -= amount;
      return true;
    }
    return false;
  }

  public restoreMana(amount: number) {
    this.mana = Math.min(this.maxMana, this.mana + amount);
  }

  public gainExperience(amount: number) {
    this.experience += amount;
    const expNeeded = this.level * 100;
    
    if (this.experience >= expNeeded) {
      this.levelUp();
    }
  }

  private levelUp() {
    this.level++;
    this.experience = 0;
    this.maxHealth += 20;
    this.maxMana += 10;
    this.health = this.maxHealth;
    this.mana = this.maxMana;
    
    // Level up effect
    const particles = this.scene.add.particles(this.x, this.y, 'grass', {
      scale: { start: 0.5, end: 0 },
      alpha: { start: 1, end: 0 },
      tint: 0xffd700,
      lifespan: 1000,
      quantity: 10,
      speed: { min: 50, max: 100 }
    });
    
    this.scene.time.delayedCall(1000, () => {
      particles.destroy();
    });
    
    // Notify UI
    (this.scene as any).showNotification(`Level Up! 现在是 ${this.level} 级！`);
  }

  private die() {
    // Death animation
    this.setTint(0x666666);
    this.setAlpha(0.5);
    
    // Respawn after delay
    this.scene.time.delayedCall(2000, () => {
      this.respawn();
    });
    
    (this.scene as any).showNotification('你死了！正在重生...');
  }

  private respawn() {
    this.health = this.maxHealth;
    this.mana = this.maxMana;
    this.setAlpha(1);
    this.setTint(0x3498db);
    this.setPosition(100, 100); // Respawn at starting position
    
    (this.scene as any).showNotification('重生成功！');
  }

  public getStats() {
    return {
      health: this.health,
      maxHealth: this.maxHealth,
      mana: this.mana,
      maxMana: this.maxMana,
      level: this.level,
      experience: this.experience
    };
  }

  update() {
    // Regenerate mana slowly
    if (this.mana < this.maxMana) {
      this.mana = Math.min(this.maxMana, this.mana + 0.1);
    }
  }
}
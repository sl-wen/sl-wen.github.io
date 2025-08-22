import * as Phaser from 'phaser';

export class Player extends Phaser.Physics.Arcade.Sprite {
  private direction: string = 'down';
  private health: number = 100;
  private maxHealth: number = 100;
  private mana: number = 50;
  private maxMana: number = 100;
  private level: number = 1;
  private experience: number = 0;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, 'player_walk', 0);

    // Add to scene
    scene.add.existing(this);
    scene.physics.add.existing(this);

    // Set physics properties
    this.setCollideWorldBounds(true);
    this.setSize(24, 24);
    this.setOffset(4, 8);

    // Set initial properties
    this.setDepth(10);

    // Create animations
    this.createAnimations();
    
    // Start with idle animation
    this.play('player_idle_down');
  }

  private createAnimations() {
    const anims = this.scene.anims;
    
    // Walking animations for each direction
    // Down (frames 0-3)
    anims.create({
      key: 'player_walk_down',
      frames: anims.generateFrameNumbers('player_walk', { start: 0, end: 3 }),
      frameRate: 8,
      repeat: -1
    });
    
    // Left (frames 4-7)
    anims.create({
      key: 'player_walk_left',
      frames: anims.generateFrameNumbers('player_walk', { start: 4, end: 7 }),
      frameRate: 8,
      repeat: -1
    });
    
    // Right (frames 8-11)
    anims.create({
      key: 'player_walk_right',
      frames: anims.generateFrameNumbers('player_walk', { start: 8, end: 11 }),
      frameRate: 8,
      repeat: -1
    });
    
    // Up (frames 12-15)
    anims.create({
      key: 'player_walk_up',
      frames: anims.generateFrameNumbers('player_walk', { start: 12, end: 15 }),
      frameRate: 8,
      repeat: -1
    });
    
    // Idle animations (first frame of each direction)
    anims.create({
      key: 'player_idle_down',
      frames: [{ key: 'player_walk', frame: 0 }],
      frameRate: 1
    });
    
    anims.create({
      key: 'player_idle_left',
      frames: [{ key: 'player_walk', frame: 4 }],
      frameRate: 1
    });
    
    anims.create({
      key: 'player_idle_right',
      frames: [{ key: 'player_walk', frame: 8 }],
      frameRate: 1
    });
    
    anims.create({
      key: 'player_idle_up',
      frames: [{ key: 'player_walk', frame: 12 }],
      frameRate: 1
    });
  }

  public setDirection(direction: string) {
    this.direction = direction;
    
    // Play walking animation based on direction
    const isMoving = Math.abs(this.body!.velocity.x) > 10 || Math.abs(this.body!.velocity.y) > 10;
    
    if (isMoving) {
      this.play(`player_walk_${direction}`, true);
    } else {
      this.play(`player_idle_${direction}`, true);
    }
  }

  public setMoving(isMoving: boolean) {
    if (isMoving) {
      this.play(`player_walk_${this.direction}`, true);
    } else {
      this.play(`player_idle_${this.direction}`, true);
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
      this.clearTint();
    });

    // Trigger UI update
    if ('events' in this.scene.scene.get('UIScene')) {
      this.scene.scene.get('UIScene').events.emit('playerStatsChanged', this.getStats());
    }

    if (this.health <= 0) {
      this.die();
    }
  }

  public heal(amount: number) {
    const oldHealth = this.health;
    this.health = Math.min(this.maxHealth, this.health + amount);
    const actualHeal = this.health - oldHealth;

    // Only show effects if actually healed
    if (actualHeal > 0) {
      // Flash green when healing
      this.setTint(0x00ff00);
      this.scene.time.delayedCall(200, () => {
        this.clearTint();
      });

      // Create healing particles
      const particles = this.scene.add.particles(this.x, this.y - 10, 'grass', {
        scale: { start: 0.3, end: 0 },
        alpha: { start: 1, end: 0 },
        tint: 0x00ff00,
        lifespan: 1000,
        quantity: 8,
        speed: { min: 30, max: 60 },
        gravityY: -20
      });

      this.scene.time.delayedCall(1000, () => {
        particles.destroy();
      });

      // Trigger UI update event
      if ('events' in this.scene.scene.get('UIScene')) {
        this.scene.scene.get('UIScene').events.emit('playerStatsChanged', this.getStats());
      }
    }

    return actualHeal;
  }

  public useMana(amount: number): boolean {
    if (this.mana >= amount) {
      this.mana -= amount;
      
      // Trigger UI update
      if ('events' in this.scene.scene.get('UIScene')) {
        this.scene.scene.get('UIScene').events.emit('playerStatsChanged', this.getStats());
      }
      
      return true;
    }
    return false;
  }

  public restoreMana(amount: number) {
    const oldMana = this.mana;
    this.mana = Math.min(this.maxMana, this.mana + amount);
    const actualRestore = this.mana - oldMana;

    // Only show effects if actually restored
    if (actualRestore > 0) {
      // Flash blue when restoring mana
      this.setTint(0x0080ff);
      this.scene.time.delayedCall(200, () => {
        this.clearTint();
      });

      // Create mana particles
      const particles = this.scene.add.particles(this.x, this.y - 10, 'grass', {
        scale: { start: 0.3, end: 0 },
        alpha: { start: 1, end: 0 },
        tint: 0x0080ff,
        lifespan: 1000,
        quantity: 8,
        speed: { min: 30, max: 60 },
        gravityY: -20
      });

      this.scene.time.delayedCall(1000, () => {
        particles.destroy();
      });

      // Trigger UI update event
      if ('events' in this.scene.scene.get('UIScene')) {
        this.scene.scene.get('UIScene').events.emit('playerStatsChanged', this.getStats());
      }
    }

    return actualRestore;
  }

  public gainExperience(amount: number) {
    this.experience += amount;
    const expNeeded = this.level * 100;

    if (this.experience >= expNeeded) {
      this.levelUp();
    }

    // Trigger UI update
    if ('events' in this.scene.scene.get('UIScene')) {
      this.scene.scene.get('UIScene').events.emit('playerStatsChanged', this.getStats());
    }
  }

  private levelUp() {
    this.level++;
    this.experience = 0;
    const oldMaxHealth = this.maxHealth;
    const oldMaxMana = this.maxMana;
    
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
      quantity: 15,
      speed: { min: 50, max: 100 }
    });

    this.scene.time.delayedCall(1000, () => {
      particles.destroy();
    });

    // Notify UI
    if ('showNotification' in this.scene) {
      (this.scene as any).showNotification(`🎉 升级了！现在是 ${this.level} 级！`);
      (this.scene as any).showNotification(`💪 最大生命值增加 ${this.maxHealth - oldMaxHealth}！`);
      (this.scene as any).showNotification(`🔮 最大魔法值增加 ${this.maxMana - oldMaxMana}！`);
    }

    // Trigger UI update
    if ('events' in this.scene.scene.get('UIScene')) {
      this.scene.scene.get('UIScene').events.emit('playerStatsChanged', this.getStats());
    }
  }

  private die() {
    // Death animation
    this.setTint(0x666666);
    this.setAlpha(0.5);

    // Respawn after delay
    this.scene.time.delayedCall(2000, () => {
      this.respawn();
    });

    if ('showNotification' in this.scene) {
      (this.scene as any).showNotification('你死了！正在重生...');
    }
  }

  private respawn() {
    this.health = this.maxHealth;
    this.mana = this.maxMana;
    this.setAlpha(1);
    this.setTint(0x3498db);
    this.setPosition(100, 100); // Respawn at starting position

    if ('showNotification' in this.scene) {
      (this.scene as any).showNotification('重生成功！');
    }
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
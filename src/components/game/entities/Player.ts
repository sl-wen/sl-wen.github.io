import * as Phaser from 'phaser';
import { CatStats, ToolType, InventoryItem } from '../types/GameTypes';

export class Cat extends Phaser.Physics.Arcade.Sprite {
  private direction: string = 'down';
  private stats: CatStats;
  private currentTool: ToolType | null = null;
  private inventory: InventoryItem[] = [];
  private isActing: boolean = false;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, 'cat_walk', 0);

    // Initialize cat stats
    this.stats = {
      health: 100,
      maxHealth: 100,
      energy: 100,
      maxEnergy: 100,
      level: 1,
      experience: 0,
      happiness: 100,
      maxHappiness: 100
    };

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
    this.play('cat_idle_down');

    // Initialize with basic farming tools
    this.initializeInventory();
  }

  private initializeInventory() {
    // Give the cat some starting tools and seeds
    this.inventory = [
      {
        id: 'watering_can',
        name: '水壶',
        type: 'tool',
        quantity: 1,
        icon: 'watering_can',
        description: '给作物浇水的工具'
      },
      {
        id: 'hoe',
        name: '锄头',
        type: 'tool',
        quantity: 1,
        icon: 'hoe',
        description: '用来耕地的工具'
      },
      {
        id: 'carrot_seeds',
        name: '胡萝卜种子',
        type: 'seed',
        quantity: 10,
        icon: 'carrot_seeds',
        description: '可以种植胡萝卜的种子'
      },
      {
        id: 'tomato_seeds',
        name: '番茄种子',
        type: 'seed',
        quantity: 5,
        icon: 'tomato_seeds',
        description: '可以种植番茄的种子'
      }
    ];
  }

  private createAnimations() {
    const anims = this.scene.anims;
    
    // Walking animations for each direction
    // Down (frames 0-3)
    anims.create({
      key: 'cat_walk_down',
      frames: anims.generateFrameNumbers('cat_walk', { start: 0, end: 3 }),
      frameRate: 8,
      repeat: -1
    });
    
    // Left (frames 4-7)
    anims.create({
      key: 'cat_walk_left',
      frames: anims.generateFrameNumbers('cat_walk', { start: 4, end: 7 }),
      frameRate: 8,
      repeat: -1
    });
    
    // Right (frames 8-11)
    anims.create({
      key: 'cat_walk_right',
      frames: anims.generateFrameNumbers('cat_walk', { start: 8, end: 11 }),
      frameRate: 8,
      repeat: -1
    });
    
    // Up (frames 12-15)
    anims.create({
      key: 'cat_walk_up',
      frames: anims.generateFrameNumbers('cat_walk', { start: 12, end: 15 }),
      frameRate: 8,
      repeat: -1
    });
    
    // Idle animations (first frame of each direction)
    anims.create({
      key: 'cat_idle_down',
      frames: [{ key: 'cat_walk', frame: 0 }],
      frameRate: 1
    });
    
    anims.create({
      key: 'cat_idle_left',
      frames: [{ key: 'cat_walk', frame: 4 }],
      frameRate: 1
    });
    
    anims.create({
      key: 'cat_idle_right',
      frames: [{ key: 'cat_walk', frame: 8 }],
      frameRate: 1
    });
    
    anims.create({
      key: 'cat_idle_up',
      frames: [{ key: 'cat_walk', frame: 12 }],
      frameRate: 1
    });

    // Action animations
    anims.create({
      key: 'cat_digging',
      frames: anims.generateFrameNumbers('cat_actions', { start: 0, end: 3 }),
      frameRate: 6,
      repeat: 2
    });

    anims.create({
      key: 'cat_watering',
      frames: anims.generateFrameNumbers('cat_actions', { start: 4, end: 7 }),
      frameRate: 6,
      repeat: 2
    });

    anims.create({
      key: 'cat_harvesting',
      frames: anims.generateFrameNumbers('cat_actions', { start: 8, end: 11 }),
      frameRate: 6,
      repeat: 1
    });
  }

  public setDirection(direction: string) {
    this.direction = direction;
    
    // Play walking animation based on direction
    const isMoving = Math.abs(this.body!.velocity.x) > 10 || Math.abs(this.body!.velocity.y) > 10;
    
    if (this.isActing) {
      return; // Don't change animation if performing an action
    }

    if (isMoving) {
      this.play(`cat_walk_${direction}`, true);
    } else {
      this.play(`cat_idle_${direction}`, true);
    }
  }

  public move(x: number, y: number) {
    if (this.isActing) return; // Can't move while performing actions
    
    const speed = 120;
    this.setVelocity(x * speed, y * speed);

    // Determine direction based on movement
    if (Math.abs(x) > Math.abs(y)) {
      this.setDirection(x > 0 ? 'right' : 'left');
    } else if (y !== 0) {
      this.setDirection(y > 0 ? 'down' : 'up');
    }
  }

  public stop() {
    this.setVelocity(0, 0);
    if (!this.isActing) {
      this.play(`cat_idle_${this.direction}`, true);
    }
  }

  public performAction(action: 'dig' | 'water' | 'harvest') {
    if (this.isActing) return false;

    this.isActing = true;
    this.setVelocity(0, 0);

    let animationKey: string;
    let duration: number;

    switch (action) {
      case 'dig':
        animationKey = 'cat_digging';
        duration = 1000;
        this.consumeEnergy(5);
        break;
      case 'water':
        animationKey = 'cat_watering';
        duration = 800;
        this.consumeEnergy(3);
        break;
      case 'harvest':
        animationKey = 'cat_harvesting';
        duration = 600;
        this.consumeEnergy(2);
        this.gainHappiness(5);
        break;
    }

    this.play(animationKey);
    
    // Return to idle after action
    this.scene.time.delayedCall(duration, () => {
      this.isActing = false;
      this.play(`cat_idle_${this.direction}`);
    });

    return true;
  }

  public consumeEnergy(amount: number) {
    this.stats.energy = Math.max(0, this.stats.energy - amount);
    if (this.stats.energy === 0) {
      this.scene.events.emit('cat-tired');
    }
  }

  public restoreEnergy(amount: number) {
    this.stats.energy = Math.min(this.stats.maxEnergy, this.stats.energy + amount);
  }

  public gainHappiness(amount: number) {
    this.stats.happiness = Math.min(this.stats.maxHappiness, this.stats.happiness + amount);
  }

  public loseHappiness(amount: number) {
    this.stats.happiness = Math.max(0, this.stats.happiness - amount);
  }

  public gainExperience(amount: number) {
    this.stats.experience += amount;
    const expForNextLevel = this.stats.level * 100;
    
    if (this.stats.experience >= expForNextLevel) {
      this.levelUp();
    }
  }

  private levelUp() {
    this.stats.level++;
    this.stats.experience = 0;
    this.stats.maxHealth += 10;
    this.stats.maxEnergy += 10;
    this.stats.maxHappiness += 5;
    this.stats.health = this.stats.maxHealth;
    this.stats.energy = this.stats.maxEnergy;
    this.stats.happiness = this.stats.maxHappiness;

    // Show level up effect
    this.scene.events.emit('cat-level-up', this.stats.level);
  }

  public setCurrentTool(tool: ToolType | null) {
    this.currentTool = tool;
  }

  public getCurrentTool(): ToolType | null {
    return this.currentTool;
  }

  public getInventory(): InventoryItem[] {
    return this.inventory;
  }

  public addToInventory(item: InventoryItem): boolean {
    const existingItem = this.inventory.find(i => i.id === item.id);
    if (existingItem) {
      existingItem.quantity += item.quantity;
    } else {
      this.inventory.push(item);
    }
    return true;
  }

  public removeFromInventory(itemId: string, quantity: number = 1): boolean {
    const item = this.inventory.find(i => i.id === itemId);
    if (!item || item.quantity < quantity) {
      return false;
    }

    item.quantity -= quantity;
    if (item.quantity === 0) {
      this.inventory = this.inventory.filter(i => i.id !== itemId);
    }
    return true;
  }

  public getStats(): CatStats {
    return { ...this.stats };
  }

  public canPerformAction(): boolean {
    return !this.isActing && this.stats.energy > 0;
  }

  update() {
    // Gradually restore energy over time
    if (this.stats.energy < this.stats.maxEnergy) {
      this.stats.energy = Math.min(this.stats.maxEnergy, this.stats.energy + 0.01);
    }

    // Gradually decrease happiness if energy is low
    if (this.stats.energy < 20) {
      this.loseHappiness(0.005);
    }
  }
}
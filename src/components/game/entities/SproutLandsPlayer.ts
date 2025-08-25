export interface PlayerStats {
  health: number;
  maxHealth: number;
  energy: number;
  maxEnergy: number;
  experience: number;
  level: number;
}

export interface PlayerPosition {
  x: number;
  y: number;
  direction: 'up' | 'down' | 'left' | 'right';
}

export type ToolType = 'hoe' | 'wateringCan' | 'seeds' | 'hand' | 'axe' | 'pickaxe';

export class SproutLandsPlayer {
  private position: PlayerPosition;
  private stats: PlayerStats;
  private currentTool: ToolType;
  private isMoving: boolean;
  private animationFrame: number;
  private lastMoveTime: number;

  constructor(x: number = 0, y: number = 0) {
    this.position = {
      x,
      y,
      direction: 'down'
    };

    this.stats = {
      health: 100,
      maxHealth: 100,
      energy: 100,
      maxEnergy: 100,
      experience: 0,
      level: 1
    };

    this.currentTool = 'hoe';
    this.isMoving = false;
    this.animationFrame = 0;
    this.lastMoveTime = 0;
  }

  // Position management
  getPosition(): PlayerPosition {
    return { ...this.position };
  }

  setPosition(x: number, y: number): void {
    this.position.x = x;
    this.position.y = y;
  }

  move(dx: number, dy: number, gridWidth: number, gridHeight: number): boolean {
    const newX = this.position.x + dx;
    const newY = this.position.y + dy;

    // Check boundaries
    if (newX < 0 || newX >= gridWidth || newY < 0 || newY >= gridHeight) {
      return false;
    }

    // Update position and direction
    this.position.x = newX;
    this.position.y = newY;

    if (dx > 0) this.position.direction = 'right';
    else if (dx < 0) this.position.direction = 'left';
    else if (dy > 0) this.position.direction = 'down';
    else if (dy < 0) this.position.direction = 'up';

    this.isMoving = true;
    this.lastMoveTime = Date.now();

    return true;
  }

  // Animation management
  update(deltaTime: number): void {
    // Update animation frame
    if (this.isMoving) {
      this.animationFrame += deltaTime * 0.01;
      if (this.animationFrame >= 4) {
        this.animationFrame = 0;
      }

      // Stop moving animation after a short time
      if (Date.now() - this.lastMoveTime > 200) {
        this.isMoving = false;
        this.animationFrame = 0;
      }
    }

    // Regenerate energy over time
    if (this.stats.energy < this.stats.maxEnergy) {
      this.stats.energy = Math.min(
        this.stats.maxEnergy,
        this.stats.energy + deltaTime * 0.001
      );
    }
  }

  getAnimationFrame(): number {
    return Math.floor(this.animationFrame);
  }

  isPlayerMoving(): boolean {
    return this.isMoving;
  }

  // Stats management
  getStats(): PlayerStats {
    return { ...this.stats };
  }

  consumeEnergy(amount: number): boolean {
    if (this.stats.energy >= amount) {
      this.stats.energy -= amount;
      return true;
    }
    return false;
  }

  addExperience(amount: number): boolean {
    this.stats.experience += amount;
    
    // Check for level up
    const requiredXP = this.getRequiredExperience(this.stats.level + 1);
    if (this.stats.experience >= requiredXP) {
      return this.levelUp();
    }
    
    return false;
  }

  private levelUp(): boolean {
    this.stats.level++;
    this.stats.maxHealth += 10;
    this.stats.maxEnergy += 15;
    this.stats.health = this.stats.maxHealth; // Full heal on level up
    this.stats.energy = this.stats.maxEnergy; // Full energy on level up
    
    return true;
  }

  private getRequiredExperience(level: number): number {
    return Math.floor(100 * Math.pow(1.5, level - 1));
  }

  heal(amount: number): void {
    this.stats.health = Math.min(this.stats.maxHealth, this.stats.health + amount);
  }

  restoreEnergy(amount: number): void {
    this.stats.energy = Math.min(this.stats.maxEnergy, this.stats.energy + amount);
  }

  // Tool management
  getCurrentTool(): ToolType {
    return this.currentTool;
  }

  setTool(tool: ToolType): void {
    this.currentTool = tool;
  }

  canUseTool(): boolean {
    const energyCosts: Record<ToolType, number> = {
      hoe: 5,
      wateringCan: 3,
      seeds: 2,
      hand: 1,
      axe: 8,
      pickaxe: 10
    };

    return this.stats.energy >= energyCosts[this.currentTool];
  }

  useTool(): boolean {
    if (!this.canUseTool()) {
      return false;
    }

    const energyCosts: Record<ToolType, number> = {
      hoe: 5,
      wateringCan: 3,
      seeds: 2,
      hand: 1,
      axe: 8,
      pickaxe: 10
    };

    this.consumeEnergy(energyCosts[this.currentTool]);
    return true;
  }

  // Sprite information for rendering
  getSpriteInfo(): {
    spriteX: number;
    spriteY: number;
    width: number;
    height: number;
  } {
    const directions = {
      down: 0,
      left: 1,
      right: 2,
      up: 3
    };

    const directionIndex = directions[this.position.direction];
    const frameIndex = this.isMoving ? this.getAnimationFrame() : 0;

    return {
      spriteX: frameIndex * 16,
      spriteY: directionIndex * 16,
      width: 16,
      height: 16
    };
  }

  // Save/Load functionality
  save(): any {
    return {
      position: this.position,
      stats: this.stats,
      currentTool: this.currentTool
    };
  }

  load(data: any): void {
    if (data.position) {
      this.position = { ...data.position };
    }
    if (data.stats) {
      this.stats = { ...data.stats };
    }
    if (data.currentTool) {
      this.currentTool = data.currentTool;
    }
  }
}

export default SproutLandsPlayer;
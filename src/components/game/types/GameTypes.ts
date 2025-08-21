import Phaser from 'phaser';

// Extended scene interface for game methods
export interface GameSceneInterface extends Phaser.Scene {
  showDialogue?: (text: string) => void;
  showNotification?: (text: string) => void;
  player?: any;
}

// Extended sprite interface for custom properties
export interface ExtendedSprite extends Phaser.Physics.Arcade.Sprite {
  indicator?: Phaser.GameObjects.Text;
  glow?: Phaser.GameObjects.Graphics;
}

// Game entity base interface
export interface GameEntity {
  interact(): void;
  update?(): void;
}

// Player stats interface
export interface PlayerStats {
  health: number;
  maxHealth: number;
  mana: number;
  maxMana: number;
  level: number;
  experience: number;
}

// Game configuration types
export interface GameConfig {
  width: number;
  height: number;
  minWidth?: number;
  minHeight?: number;
  maxWidth?: number;
  maxHeight?: number;
}
import * as Phaser from 'phaser';

// Extended scene interface for game methods
export interface GameSceneInterface extends Phaser.Scene {
  showDialogue?: (text: string) => void;
  showNotification?: (text: string) => void;
  player?: any;
  showInventory?: () => void;
  showCookingInterface?: () => void;
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

// Cat player stats interface
export interface CatStats {
  health: number;
  maxHealth: number;
  energy: number;
  maxEnergy: number;
  level: number;
  experience: number;
  happiness: number;
  maxHappiness: number;
}

// Crop types enum
export enum CropType {
  CARROT = 'carrot',
  TOMATO = 'tomato',
  WHEAT = 'wheat',
  CORN = 'corn',
  STRAWBERRY = 'strawberry',
  LETTUCE = 'lettuce',
  POTATO = 'potato',
  PUMPKIN = 'pumpkin'
}

// Crop growth stages
export enum CropStage {
  SEED = 'seed',
  SPROUT = 'sprout',
  GROWING = 'growing',
  MATURE = 'mature',
  WITHERED = 'withered'
}

// Crop interface
export interface Crop {
  type: CropType;
  stage: CropStage;
  waterLevel: number;
  fertilizerLevel: number;
  growthTime: number;
  maxGrowthTime: number;
  harvestYield: number;
  x: number;
  y: number;
}

// Tool types enum
export enum ToolType {
  WATERING_CAN = 'watering_can',
  HOE = 'hoe',
  FERTILIZER = 'fertilizer',
  SEEDS = 'seeds'
}

// Inventory item interface
export interface InventoryItem {
  id: string;
  name: string;
  type: 'seed' | 'crop' | 'tool' | 'food' | 'ingredient';
  quantity: number;
  icon: string;
  description: string;
}

// Recipe interface
export interface Recipe {
  id: string;
  name: string;
  description: string;
  ingredients: { itemId: string; quantity: number }[];
  result: { itemId: string; quantity: number };
  cookingTime: number;
  happinessBonus: number;
  energyBonus: number;
}

// Farm plot interface
export interface FarmPlot {
  x: number;
  y: number;
  isPlowed: boolean;
  crop?: Crop;
  soilQuality: number;
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
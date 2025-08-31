import * as Phaser from 'phaser';

/**
 * 扩展游戏场景接口
 * 为Phaser场景添加自定义游戏方法
 */
export interface GameSceneInterface extends Phaser.Scene {
  showDialogue?: (text: string) => void;        // 显示对话框的方法
  showNotification?: (text: string) => void;    // 显示通知消息的方法
  player?: any;                                 // 玩家对象引用
  showInventory?: () => void;                   // 显示背包界面的方法
  showCookingInterface?: () => void;            // 显示烹饪界面的方法
}

// 扩展精灵接口 - 为Phaser精灵添加自定义属性
export interface ExtendedSprite extends Phaser.Physics.Arcade.Sprite {
  indicator?: Phaser.GameObjects.Text; // 交互提示文本
  glow?: Phaser.GameObjects.Graphics; // 发光效果图形对象
}

// 游戏实体基础接口 - 定义所有可交互游戏对象的基本行为
export interface GameEntity {
  interact(): void; // 交互行为方法，必须实现
  update?(): void; // 可选的更新方法，用于每帧更新逻辑
}

// 小猫玩家属性接口 - 定义小猫角色的各项数值属性
export interface CatStats {
  health: number; // 当前健康值
  maxHealth: number; // 最大健康值
  energy: number; // 当前体力值
  maxEnergy: number; // 最大体力值
  level: number; // 角色等级
  experience: number; // 当前经验值
  happiness: number; // 当前快乐值
  maxHappiness: number; // 最大快乐值
}

// 作物类型枚举 - 定义农场中可种植的所有作物类型
export enum CropType {
  CARROT = 'carrot', // 胡萝卜
  TOMATO = 'tomato', // 番茄
  WHEAT = 'wheat', // 小麦
  CORN = 'corn', // 玉米
  STRAWBERRY = 'strawberry', // 草莓
  LETTUCE = 'lettuce', // 生菜
  POTATO = 'potato', // 土豆
  PUMPKIN = 'pumpkin' // 南瓜
}

// 作物生长阶段枚举 - 定义作物从种植到收获的各个成长阶段
export enum CropStage {
  SEED = 'seed', // 种子阶段
  SPROUT = 'sprout', // 发芽阶段
  GROWING = 'growing', // 生长阶段
  MATURE = 'mature', // 成熟阶段（可收获）
  WITHERED = 'withered' // 枯萎阶段（过度生长未收获）
}

// 作物数据接口 - 定义单个作物的完整状态信息
export interface Crop {
  type: CropType; // 作物类型
  stage: CropStage; // 当前生长阶段
  waterLevel: number; // 水分等级（影响生长速度）
  fertilizerLevel: number; // 肥料等级（影响产量）
  growthTime: number; // 已生长时间（毫秒）
  maxGrowthTime: number; // 完全成熟所需时间（毫秒）
  harvestYield: number; // 收获产量（受水分和肥料影响）
  x: number; // 作物在农田中的X坐标
  y: number; // 作物在农田中的Y坐标
}

// 工具类型枚举 - 定义农场中可使用的所有工具类型
export enum ToolType {
  WATERING_CAN = 'watering_can', // 浇水壶
  HOE = 'hoe', // 锄头（用于翻土）
  FERTILIZER = 'fertilizer', // 肥料
  SEEDS = 'seeds' // 种子
}

// 背包物品接口 - 定义背包中物品的数据结构
export interface InventoryItem {
  id: string; // 物品唯一标识符
  name: string; // 物品显示名称
  type: 'seed' | 'crop' | 'tool' | 'food' | 'ingredient'; // 物品类型分类
  quantity: number; // 物品数量
  icon: string; // 物品图标资源路径
  description: string; // 物品描述文本
}

// 烹饪配方接口 - 定义食物制作的配方信息
export interface Recipe {
  id: string; // 配方唯一标识符
  name: string; // 食物名称
  description: string; // 食物描述
  ingredients: { itemId: string; quantity: number }[]; // 所需原料列表
  result: { itemId: string; quantity: number }; // 制作结果（产出物品和数量）
  cookingTime: number; // 烹饪所需时间（毫秒）
  happinessBonus: number; // 食用后增加的快乐值
  energyBonus: number; // 食用后恢复的体力值
}

// 农田地块接口 - 定义单个农田地块的状态信息
export interface FarmPlot {
  x: number; // 地块的X坐标位置
  y: number; // 地块的Y坐标位置
  isPlowed: boolean; // 是否已翻土（翻土后才能种植）
  crop?: Crop; // 当前种植的作物（可选，空地块时为undefined）
  soilQuality: number; // 土壤质量等级（影响作物生长）
}

// 游戏尺寸配置
export interface GameSize {
  width: number;
  height: number;
  multiplier: number;
}

// 游戏配置
export interface GameConfig {
  type: number;
  title: string;
  parent: string;
  orientation: number;
  localStorageName: string;
  width: number;
  height: number;
  autoRound: boolean;
  pixelArt: boolean;
  scale: {
    autoCenter: number;
    mode: number;
  };
  scene: any[];
  physics: {
    default: string;
  };
  plugins: {
    scene: Array<{
      key: string;
      plugin: any;
      mapping: string;
    }>;
  };
  backgroundColor: string;
}

// 对话框消息
export interface DialogMessage {
  message: string;
}

// 对话框配置
export interface DialogConfig {
  characterName: string;
  messages: DialogMessage[];
}

// 游戏菜单项
export interface GameMenuItem {
  id: string;
  label: string;
  action?: string;
}

// 游戏菜单配置
export interface GameMenuConfig {
  menuItems: GameMenuItem[];
  menuPosition: string;
}

// 角色血量状态
export interface HealthState {
  current: number;
  max: number;
}

// 角色血量配置
export interface HeroHealthConfig {
  healthStates: HealthState[];
}

// 金币配置
export interface HeroCoinConfig {
  heroCoins: number;
}

// 游戏事件类型
export type GameEventType =
  | 'new-dialog'
  | 'menu-items'
  | 'hero-health'
  | 'hero-coin'
  | 'menu-item-selected'
  | 'dialog-finished';

// 游戏事件
export interface GameEvent {
  type: GameEventType;
  detail: any;
}

// 游戏状态
export interface GameState {
  isGameReady: boolean;
  isMobile: boolean;
  messages: DialogMessage[];
  characterName: string;
  gameMenuItems: GameMenuItem[];
  gameMenuPosition: string;
  heroHealthStates: HealthState[];
  heroCoins: number | null;
}

// 游戏组件Props
export interface TopDownGameProps {
  width?: number;
  height?: number;
  skipCompatibility?: boolean;
}

// 对话框组件Props
export interface DialogBoxProps {
  onDone: () => void;
  characterName: string;
  messages: DialogMessage[];
  gameSize: GameSize;
}

// 游戏菜单组件Props
export interface GameMenuProps {
  items: GameMenuItem[];
  gameSize: GameSize;
  position: string;
  onSelected: (selectedItem: GameMenuItem) => void;
}

// 角色血量组件Props
export interface HeroHealthProps {
  gameSize: GameSize;
  healthStates: HealthState[];
}

// 金币组件Props
export interface HeroCoinProps {
  gameSize: GameSize;
  heroCoins: number;
}

// 消息组件Props
export interface MessageProps {
  text: string;
  onComplete?: () => void;
}
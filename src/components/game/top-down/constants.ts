// 游戏常量定义
// 移植自原项目: https://github.com/blopa/top-down-react-phaser-game

// 场景切换时间常量
export const SCENE_FADE_TIME = 300;

// 攻击延迟时间常量
export const ATTACK_DELAY_TIME = 50;

// 瓦片集索引常量
export const BUSH_INDEX = 428;
export const BOX_INDEX = 427;
export const COIN_INDEX = 192;
export const HEART_CONTAINER_INDEX = 233;

// NPC移动类型常量
export const NPC_MOVEMENT_RANDOM = 'random';
export const NPC_MOVEMENT_STILL = 'still';

// 敌人AI类型常量
export const ENEMY_AI_TYPE = 'follow';

// 存档数据键常量
export const SAVE_DATA_KEY = 'pablogg_game_data';

// 游戏配置常量
export const GAME_CONFIG = {
  // 游戏尺寸
  GAME_WIDTH: 400,
  GAME_HEIGHT: 224, // 16 * 14 = 224
  
  // 缩放配置
  MIN_SCALE: 1,
  MAX_SCALE: 4,
  
  // 像素艺术配置
  PIXEL_ART: true,
  AUTO_ROUND: true,
  
  // 物理配置
  PHYSICS_TYPE: 'arcade',
  
  // 背景颜色
  BACKGROUND_COLOR: '#000000',
  
  // 本地存储配置
  LOCAL_STORAGE_NAME: 'top-down-rpg-game',
  
  // 游戏标题
  GAME_TITLE: 'Top-Down RPG Game',
  
  // 方向配置
  ORIENTATION: 'landscape' as const,
  
  // 缩放模式
  SCALE_MODE: 'fit' as const,
  SCALE_AUTO_CENTER: 'center_both' as const,
};

// 动画配置常量
export const ANIMATION_CONFIG = {
  // 角色动画
  HERO_WALK_SPEED: 8,
  HERO_IDLE_SPEED: 0,
  
  // 敌人动画
  ENEMY_WALK_SPEED: 6,
  ENEMY_IDLE_SPEED: 0,
  
  // NPC动画
  NPC_WALK_SPEED: 4,
  NPC_IDLE_SPEED: 0,
  
  // 物品动画
  ITEM_BOB_SPEED: 2000,
  ITEM_BOB_DISTANCE: 2,
};

// 游戏状态常量
export const GAME_STATES = {
  LOADING: 'loading',
  MENU: 'menu',
  PLAYING: 'playing',
  PAUSED: 'paused',
  GAME_OVER: 'game_over',
  VICTORY: 'victory',
} as const;

// 事件常量
export const GAME_EVENTS = {
  // 场景事件
  SCENE_START: 'scene-start',
  SCENE_END: 'scene-end',
  
  // 游戏事件
  GAME_START: 'game-start',
  GAME_PAUSE: 'game-pause',
  GAME_RESUME: 'game-resume',
  GAME_OVER: 'game-over',
  
  // 角色事件
  HERO_MOVE: 'hero-move',
  HERO_ATTACK: 'hero-attack',
  HERO_DAMAGE: 'hero-damage',
  HERO_HEAL: 'hero-heal',
  HERO_COLLECT: 'hero-collect',
  
  // 敌人事件
  ENEMY_SPAWN: 'enemy-spawn',
  ENEMY_DIE: 'enemy-die',
  ENEMY_ATTACK: 'enemy-attack',
  
  // 物品事件
  ITEM_SPAWN: 'item-spawn',
  ITEM_COLLECT: 'item-collect',
  
  // 对话事件
  DIALOG_START: 'dialog-start',
  DIALOG_END: 'dialog-end',
  DIALOG_NEXT: 'dialog-next',
  
  // 菜单事件
  MENU_OPEN: 'menu-open',
  MENU_CLOSE: 'menu-close',
  MENU_SELECT: 'menu-select',
  
  // 系统事件
  SAVE_GAME: 'save-game',
  LOAD_GAME: 'load-game',
  SETTINGS_CHANGE: 'settings-change',
  
  // UI事件
  UI_UPDATE: 'ui-update',
  UI_SHOW: 'ui-show',
  UI_HIDE: 'ui-hide',
} as const;

// 输入常量
export const INPUT_KEYS = {
  // 方向键
  UP: 'W',
  DOWN: 'S',
  LEFT: 'A',
  RIGHT: 'D',
  
  // 动作键
  ATTACK: 'SPACE',
  INTERACT: 'E',
  INVENTORY: 'I',
  MENU: 'ESC',
  
  // 功能键
  SAVE: 'F5',
  LOAD: 'F9',
  SETTINGS: 'F10',
  FULLSCREEN: 'F11',
  
  // 数字键
  ONE: 'ONE',
  TWO: 'TWO',
  THREE: 'THREE',
  FOUR: 'FOUR',
  FIVE: 'FIVE',
  SIX: 'SIX',
  SEVEN: 'SEVEN',
  EIGHT: 'EIGHT',
  NINE: 'NINE',
  ZERO: 'ZERO',
} as const;

// 音效常量
export const SOUND_KEYS = {
  // 背景音乐
  BGM_MENU: 'bgm_menu',
  BGM_GAME: 'bgm_game',
  BGM_VICTORY: 'bgm_victory',
  BGM_GAME_OVER: 'bgm_game_over',
  
  // 音效
  SFX_ATTACK: 'sfx_attack',
  SFX_DAMAGE: 'sfx_damage',
  SFX_HEAL: 'sfx_heal',
  SFX_COLLECT: 'sfx_collect',
  SFX_MENU_SELECT: 'sfx_menu_select',
  SFX_MENU_CONFIRM: 'sfx_menu_confirm',
  SFX_DIALOG_NEXT: 'sfx_dialog_next',
  SFX_LEVEL_UP: 'sfx_level_up',
  SFX_ACHIEVEMENT: 'sfx_achievement',
} as const;

// 地图常量
export const MAP_KEYS = {
  // 地图文件
  MAP_MAIN: 'map_main',
  MAP_FOREST: 'map_forest',
  MAP_CAVE: 'map_cave',
  MAP_TOWN: 'map_town',
  
  // 图层名称
  LAYER_GROUND: 'ground',
  LAYER_WALLS: 'walls',
  LAYER_OBJECTS: 'objects',
  LAYER_COLLISIONS: 'collisions',
  LAYER_SPAWNS: 'spawns',
  LAYER_TRIGGERS: 'triggers',
} as const;

// 精灵常量
export const SPRITE_KEYS = {
  // 角色精灵
  HERO: 'hero',
  ENEMY_SLIME: 'enemy_slime',
  ENEMY_SKELETON: 'enemy_skeleton',
  NPC_VILLAGER: 'npc_villager',
  NPC_MERCHANT: 'npc_merchant',
  
  // 物品精灵
  ITEM_COIN: 'item_coin',
  ITEM_HEART: 'item_heart',
  ITEM_SWORD: 'item_sword',
  ITEM_POTION: 'item_potion',
  ITEM_KEY: 'item_key',
  
  // UI精灵
  UI_HEALTH: 'ui_health',
  UI_COIN: 'ui_coin',
  UI_MENU: 'ui_menu',
  UI_DIALOG: 'ui_dialog',
} as const;

// 动画常量
export const ANIMATION_KEYS = {
  // 角色动画
  HERO_IDLE: 'hero_idle',
  HERO_WALK: 'hero_walk',
  HERO_ATTACK: 'hero_attack',
  HERO_DAMAGE: 'hero_damage',
  
  // 敌人动画
  ENEMY_IDLE: 'enemy_idle',
  ENEMY_WALK: 'enemy_walk',
  ENEMY_ATTACK: 'enemy_attack',
  ENEMY_DIE: 'enemy_die',
  
  // 物品动画
  ITEM_BOB: 'item_bob',
  ITEM_SPARKLE: 'item_sparkle',
  
  // 特效动画
  EFFECT_DAMAGE: 'effect_damage',
  EFFECT_HEAL: 'effect_heal',
  EFFECT_COLLECT: 'effect_collect',
} as const;

// 物理常量
export const PHYSICS_CONFIG = {
  // 重力
  GRAVITY: { x: 0, y: 0 },
  
  // 碰撞组
  COLLISION_GROUPS: {
    HERO: 1,
    ENEMY: 2,
    ITEM: 3,
    WALL: 4,
    TRIGGER: 5,
  },
  
  // 碰撞掩码
  COLLISION_MASKS: {
    HERO: [2, 3, 4, 5], // 与敌人、物品、墙壁、触发器碰撞
    ENEMY: [1, 4], // 与英雄、墙壁碰撞
    ITEM: [1], // 只与英雄碰撞
    WALL: [1, 2], // 与英雄、敌人碰撞
    TRIGGER: [1], // 只与英雄碰撞
  },
} as const;

// 游戏平衡常量
export const GAME_BALANCE = {
  // 角色属性
  HERO: {
    MAX_HEALTH: 6,
    ATTACK_DAMAGE: 1,
    MOVE_SPEED: 120,
    ATTACK_RANGE: 32,
    ATTACK_COOLDOWN: 500,
  },
  
  // 敌人属性
  ENEMY: {
    SLIME: {
      HEALTH: 2,
      DAMAGE: 1,
      MOVE_SPEED: 80,
      ATTACK_RANGE: 24,
      ATTACK_COOLDOWN: 1000,
      DROP_RATE: 0.3,
    },
    SKELETON: {
      HEALTH: 3,
      DAMAGE: 2,
      MOVE_SPEED: 100,
      ATTACK_RANGE: 32,
      ATTACK_COOLDOWN: 800,
      DROP_RATE: 0.5,
    },
  },
  
  // 物品属性
  ITEMS: {
    COIN: {
      VALUE: 1,
      WEIGHT: 0,
    },
    HEART: {
      HEAL_AMOUNT: 2,
      WEIGHT: 1,
    },
    SWORD: {
      DAMAGE_BONUS: 1,
      WEIGHT: 2,
    },
    POTION: {
      HEAL_AMOUNT: 4,
      WEIGHT: 1,
    },
  },
} as const;

// 本地存储键常量
export const STORAGE_KEYS = {
  // 游戏数据
  GAME_DATA: 'game_data',
  GAME_SETTINGS: 'game_settings',
  GAME_STATS: 'game_stats',
  
  // 系统数据
  TUTORIAL_PROGRESS: 'tutorial_progress',
  ACHIEVEMENTS: 'achievements',
  HELP_HISTORY: 'help_history',
  HELP_FAVORITES: 'help_favorites',
  
  // 用户数据
  USER_PREFERENCES: 'user_preferences',
  CONTROL_SETTINGS: 'control_settings',
  AUDIO_SETTINGS: 'audio_settings',
  VIDEO_SETTINGS: 'video_settings',
} as const;

// 错误常量
export const ERROR_MESSAGES = {
  // 加载错误
  ASSET_LOAD_FAILED: 'Failed to load asset:',
  SCENE_LOAD_FAILED: 'Failed to load scene:',
  SAVE_LOAD_FAILED: 'Failed to load save data:',
  
  // 游戏错误
  INVALID_STATE: 'Invalid game state:',
  INVALID_INPUT: 'Invalid input:',
  INVALID_POSITION: 'Invalid position:',
  
  // 系统错误
  STORAGE_ERROR: 'Storage error:',
  NETWORK_ERROR: 'Network error:',
  RENDER_ERROR: 'Render error:',
} as const;

// 调试常量
export const DEBUG_CONFIG = {
  // 调试模式
  ENABLED: process.env.NODE_ENV === 'development',
  
  // 调试选项
  SHOW_FPS: true,
  SHOW_COLLISIONS: false,
  SHOW_PATHS: false,
  SHOW_STATS: true,
  
  // 调试快捷键
  TOGGLE_DEBUG: 'F12',
  TOGGLE_COLLISIONS: 'C',
  TOGGLE_PATHS: 'P',
  TOGGLE_STATS: 'T',
} as const;

export default {
  SCENE_FADE_TIME,
  ATTACK_DELAY_TIME,
  BUSH_INDEX,
  BOX_INDEX,
  COIN_INDEX,
  HEART_CONTAINER_INDEX,
  NPC_MOVEMENT_RANDOM,
  NPC_MOVEMENT_STILL,
  ENEMY_AI_TYPE,
  SAVE_DATA_KEY,
  GAME_CONFIG,
  ANIMATION_CONFIG,
  GAME_STATES,
  GAME_EVENTS,
  INPUT_KEYS,
  SOUND_KEYS,
  MAP_KEYS,
  SPRITE_KEYS,
  ANIMATION_KEYS,
  PHYSICS_CONFIG,
  GAME_BALANCE,
  STORAGE_KEYS,
  ERROR_MESSAGES,
  DEBUG_CONFIG,
};
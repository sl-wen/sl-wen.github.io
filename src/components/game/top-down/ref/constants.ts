// 场景淡入淡出时间（毫秒）
export const SCENE_FADE_TIME = 300;

// 攻击延迟时间（毫秒）
export const ATTACK_DELAY_TIME = 50;

// 瓦片集相关常量
export const BUSH_INDEX = 428;           // 灌木丛瓦片索引
export const BOX_INDEX = 427;            // 箱子瓦片索引
export const COIN_INDEX = 192;           // 金币瓦片索引
export const HEART_CONTAINER_INDEX = 233; // 心形容器瓦片索引

// NPC 移动类型
export const NPC_MOVEMENT_RANDOM = 'random'; // 随机移动
export const NPC_MOVEMENT_STILL = 'still';   // 静止不动
export const NPC_MOVEMENT_PATROL = 'patrol'; // 巡逻移动

// 敌人 AI 类型
export const ENEMY_AI_TYPE = 'follow';       // 跟随玩家
export const ENEMY_AI_PATROL = 'patrol';     // 巡逻
export const ENEMY_AI_AGGRESSIVE = 'aggressive'; // 主动攻击

// 游戏存档数据键名
export const SAVE_DATA_KEY = 'pablogg_game_data';

// 战斗系统常量
export const COMBAT_RANGE = 32;              // 攻击范围（像素）
export const COMBAT_DAMAGE = 10;             // 基础攻击伤害
export const COMBAT_COOLDOWN = 1000;         // 攻击冷却时间（毫秒）
export const ENEMY_DETECTION_RANGE = 64;     // 敌人检测范围（像素）

// 物品系统常量
export const MAX_INVENTORY_SLOTS = 20;       // 最大背包槽位
export const ITEM_TYPES = {
  WEAPON: 'weapon',
  ARMOR: 'armor',
  CONSUMABLE: 'consumable',
  MATERIAL: 'material',
  QUEST: 'quest'
} as const;

// 任务系统常量
export const QUEST_TYPES = {
  KILL: 'kill',
  COLLECT: 'collect',
  TALK: 'talk',
  EXPLORE: 'explore'
} as const;

export const QUEST_STATUS = {
  NOT_STARTED: 'not_started',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
  FAILED: 'failed'
} as const;

// 地图传送点常量
export const TELEPORT_TYPES = {
  NORMAL: 'normal',
  SECRET: 'secret',
  QUEST: 'quest'
} as const;

// 音效和音乐常量
export const AUDIO_KEYS = {
  BACKGROUND_MUSIC: 'background_music',
  COMBAT_SOUND: 'combat_sound',
  ITEM_PICKUP: 'item_pickup',
  NPC_DIALOG: 'npc_dialog',
  FOOTSTEPS: 'footsteps'
} as const;

// UI 常量
export const UI_LAYERS = {
  BACKGROUND: 0,
  GAME: 1,
  UI: 2,
  DIALOG: 3,
  MENU: 4
} as const;

// 动画常量
export const ANIMATION_KEYS = {
  HERO_IDLE: 'hero_idle',
  HERO_WALK: 'hero_walk',
  HERO_ATTACK: 'hero_attack',
  ENEMY_IDLE: 'enemy_idle',
  ENEMY_WALK: 'enemy_walk',
  ENEMY_ATTACK: 'enemy_attack',
  ITEM_SPARKLE: 'item_sparkle'
} as const;
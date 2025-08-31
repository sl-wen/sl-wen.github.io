// 游戏常量配置
export const GAME_CONSTANTS = {
  // 游戏基础配置
  TITLE: 'Top-Down RPG Game',
  VERSION: '1.0.0',
  
  // 游戏尺寸
  DEFAULT_WIDTH: 1280,
  DEFAULT_HEIGHT: 900,
  MOBILE_WIDTH: 400,
  MOBILE_HEIGHT: 600,
  
  // 瓦片尺寸
  TILE_SIZE: 32,
  
  // 角色移动速度
  PLAYER_SPEED: 200,
  
  // 对话框配置
  DIALOG_SPEED: 50,
  DIALOG_FONT_SIZE: 16,
  
  // 菜单配置
  MENU_ANIMATION_DURATION: 300,
  
  // UI配置
  HEALTH_BAR_WIDTH: 200,
  HEALTH_BAR_HEIGHT: 20,
  COIN_ICON_SIZE: 32,
  
  // 游戏状态
  STATES: {
    BOOT: 'BOOT',
    MAIN_MENU: 'MAIN_MENU',
    PLAYING: 'PLAYING',
    PAUSED: 'PAUSED',
    GAME_OVER: 'GAME_OVER',
  },
  
  // 输入控制
  INPUT: {
    UP: ['W', 'w', 'ArrowUp'],
    DOWN: ['S', 's', 'ArrowDown'],
    LEFT: ['A', 'a', 'ArrowLeft'],
    RIGHT: ['D', 'd', 'ArrowRight'],
    ACTION: ['Space', ' '],
    MENU: ['Escape', 'Escape'],
  },
  
  // 资源路径
  ASSETS: {
    IMAGES: '/game/assets/images/',
    SPRITES: '/game/assets/sprites/',
    TILESETS: '/game/assets/tilesets/',
    FONTS: '/game/assets/fonts/',
  },
  
  // 颜色配置
  COLORS: {
    BLACK: '#000000',
    WHITE: '#FFFFFF',
    GRAY: '#808080',
    RED: '#FF0000',
    GREEN: '#00FF00',
    BLUE: '#0000FF',
    YELLOW: '#FFFF00',
    TRANSPARENT: 'transparent',
  },
  
  // 字体配置
  FONTS: {
    PRIMARY: '"Press Start 2P", monospace',
    SECONDARY: 'Arial, sans-serif',
  },
  
  // 动画配置
  ANIMATIONS: {
    FADE_IN: 500,
    FADE_OUT: 500,
    SLIDE_IN: 300,
    SLIDE_OUT: 300,
  },
  
  // 音效配置
  AUDIO: {
    MASTER_VOLUME: 0.7,
    MUSIC_VOLUME: 0.5,
    SFX_VOLUME: 0.8,
  },
} as const;

// 对话框配置
export const DIALOG_CONFIG = {
  "npc_01": [
    { message: "Hello" },
    { message: "How are you?" }
  ],
  "npc_02": [
    { message: "Hello there" }
  ],
  "npc_03": [
    { message: "Hi" },
    { message: "Ok bye!" }
  ],
  "npc_04": [
    { message: "Hey" }
  ],
  "sword": [
    { message: "You got a sword" }
  ],
  "push": [
    { message: "You can push boxes now" }
  ],
  "sign_01": [
    { message: "You can read this!" }
  ],
  "book_01": [
    { message: "Welcome to the game!" }
  ]
} as const;

// 游戏菜单配置
export const MENU_CONFIG = {
  MAIN_MENU: [
    { id: 'start', label: 'START', action: 'start_game' },
    { id: 'settings', label: 'SETTINGS', action: 'open_settings' },
    { id: 'credits', label: 'CREDITS', action: 'show_credits' },
  ],
  PAUSE_MENU: [
    { id: 'resume', label: 'RESUME', action: 'resume_game' },
    { id: 'settings', label: 'SETTINGS', action: 'open_settings' },
    { id: 'main_menu', label: 'MAIN MENU', action: 'return_to_main' },
  ],
  GAME_OVER_MENU: [
    { id: 'restart', label: 'RESTART', action: 'restart_game' },
    { id: 'main_menu', label: 'MAIN MENU', action: 'return_to_main' },
  ],
} as const;

// 游戏事件类型
export const GAME_EVENTS = {
  NEW_DIALOG: 'new-dialog',
  MENU_ITEMS: 'menu-items',
  HERO_HEALTH: 'hero-health',
  HERO_COIN: 'hero-coin',
  MENU_ITEM_SELECTED: 'menu-item-selected',
  DIALOG_FINISHED: 'dialog-finished',
  GAME_START: 'game-start',
  GAME_PAUSE: 'game-pause',
  GAME_RESUME: 'game-resume',
  GAME_OVER: 'game-over',
  ITEM_COLLECTED: 'item-collected',
  NPC_INTERACTION: 'npc-interaction',
} as const;

// 游戏资源文件
export const GAME_ASSETS = {
  // 图片资源
  IMAGES: {
    DIALOG_BORDER: 'dialog_borderbox.png',
    MENU_BACKGROUND: 'menu_background.png',
    GAME_OVER_BACKGROUND: 'game_over_background.png',
    MAIN_MENU_BACKGROUND: 'main_menu_background.png',
  },
  
  // 精灵资源
  SPRITES: {
    PLAYER: 'player.png',
    NPC_01: 'npc_01.png',
    NPC_02: 'npc_02.png',
    NPC_03: 'npc_03.png',
    NPC_04: 'npc_04.png',
    SWORD: 'sword.png',
    COIN: 'coin.png',
    HEART: 'heart.png',
    BOOK: 'book.png',
    SIGN: 'sign.png',
  },
  
  // 瓦片集资源
  TILESETS: {
    MAIN_TILESET: 'main_tileset.png',
    OBJECTS_TILESET: 'objects_tileset.png',
  },
  
  // 字体资源
  FONTS: {
    PRESS_START_2P: 'PressStart2P-Regular.ttf',
  },
} as const;

// 地图配置
export const MAP_CONFIG = {
  TILE_SIZE: 32,
  MAP_WIDTH: 40,
  MAP_HEIGHT: 30,
  LAYERS: {
    GROUND: 0,
    OBJECTS: 1,
    CHARACTERS: 2,
    UI: 3,
  },
} as const;

// 角色配置
export const CHARACTER_CONFIG = {
  PLAYER: {
    SPEED: 200,
    HEALTH: 100,
    START_X: 10,
    START_Y: 10,
  },
  NPC: {
    SPEED: 100,
    INTERACTION_RANGE: 32,
  },
} as const;
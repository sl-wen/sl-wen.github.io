import { GameSize } from '../types/GameTypes';

// 计算游戏尺寸
export const calculateGameSize = (): GameSize => {
  const width = 1280;
  const height = 900;
  const multiplier = 1;

  return {
    width,
    height,
    multiplier,
  };
};

// 检测是否为移动设备
export const isMobileDevice = (): boolean => {
  const userAgent = navigator.userAgent.toLowerCase();
  const isMobileDevice = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent);
  const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  return isMobileDevice || isTouchDevice;
};

// 获取移动设备游戏尺寸
export const getMobileGameSize = (): GameSize => {
  return {
    width: 400,
    height: 600,
    multiplier: 1,
  };
};

// 获取桌面设备游戏尺寸
export const getDesktopGameSize = (): GameSize => {
  return {
    width: 1280,
    height: 900,
    multiplier: 1,
  };
};

// 根据设备类型获取游戏尺寸
export const getGameSizeByDevice = (): GameSize => {
  return isMobileDevice() ? getMobileGameSize() : getDesktopGameSize();
};

// 创建自定义事件
export const createCustomEvent = (eventName: string, detail: any): CustomEvent => {
  return new CustomEvent(eventName, {
    detail,
  });
};

// 分发游戏事件
export const dispatchGameEvent = (eventName: string, detail: any): void => {
  const event = createCustomEvent(eventName, detail);
  window.dispatchEvent(event);
};

// 游戏常量
export const GAME_CONSTANTS = {
  TILE_SIZE: 32,
  PLAYER_SPEED: 200,
  DIALOG_SPEED: 50,
  MENU_ANIMATION_DURATION: 300,
  HEALTH_BAR_WIDTH: 200,
  HEALTH_BAR_HEIGHT: 20,
  COIN_ICON_SIZE: 32,
} as const;

// 游戏状态常量
export const GAME_STATES = {
  BOOT: 'BOOT',
  MAIN_MENU: 'MAIN_MENU',
  PLAYING: 'PLAYING',
  PAUSED: 'PAUSED',
  GAME_OVER: 'GAME_OVER',
} as const;

// 输入控制常量
export const INPUT_KEYS = {
  UP: ['W', 'w', 'ArrowUp'],
  DOWN: ['S', 's', 'ArrowDown'],
  LEFT: ['A', 'a', 'ArrowLeft'],
  RIGHT: ['D', 'd', 'ArrowRight'],
  ACTION: ['Space', ' '],
  MENU: ['Escape', 'Escape'],
} as const;

// 游戏资源路径
export const ASSET_PATHS = {
  IMAGES: '/game/assets/images/',
  SPRITES: '/game/assets/sprites/',
  TILESETS: '/game/assets/tilesets/',
  FONTS: '/game/assets/fonts/',
} as const;

// 游戏配置
export const GAME_CONFIG = {
  TITLE: 'Top-Down RPG Game',
  VERSION: '1.0.0',
  AUTHOR: 'Game Developer',
  DESCRIPTION: 'A top-down RPG game built with React, TypeScript, and Phaser',
} as const;
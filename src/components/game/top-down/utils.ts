// 游戏工具函数
// 移植自原项目: https://github.com/blopa/top-down-react-phaser-game

import { GameObjects, Scene } from 'phaser';
import { GAME_CONFIG, PHYSICS_CONFIG } from './constants';

// 交互式游戏对象创建函数
// 移植自原项目
export const createInteractiveGameObject = (
  scene: Scene,
  x: number,
  y: number,
  width: number,
  height: number,
  name: string,
  isDebug: boolean = false,
  origin: { x: number; y: number } = { x: 0, y: 1 }
): GameObjects.Rectangle => {
  const customCollider = new GameObjects.Rectangle(
    scene,
    x,
    y,
    width,
    height
  ).setOrigin(origin.x, origin.y);
  
  customCollider.name = name;
  (customCollider as any).isCustomCollider = true;

  if (isDebug) {
    customCollider.setFillStyle(0x741B47);
  }

  scene.physics.add.existing(customCollider);
  customCollider.body.setAllowGravity(false);
  customCollider.body.setImmovable(true);

  return customCollider;
};

// 计算游戏尺寸和缩放
// 移植自原项目
export const calculateGameSize = (): {
  width: number;
  height: number;
  multiplier: number;
} => {
  let width = GAME_CONFIG.GAME_WIDTH;
  let height = GAME_CONFIG.GAME_HEIGHT;
  const multiplier = Math.min(
    Math.floor(window.innerWidth / GAME_CONFIG.GAME_WIDTH),
    Math.floor(window.innerHeight / GAME_CONFIG.GAME_HEIGHT)
  ) || 1;

  if (multiplier > 1) {
    width += Math.floor((window.innerWidth - width * multiplier) / (16 * multiplier)) * 16;
    height += Math.floor((window.innerHeight - height * multiplier) / (16 * multiplier)) * 16;
  }

  return { width, height, multiplier };
};

// 计算游戏容器尺寸
export const calculateGameContainerSize = (): {
  width: number;
  height: number;
  multiplier: number;
  containerWidth: number;
  containerHeight: number;
} => {
  const { width, height, multiplier } = calculateGameSize();
  const containerWidth = width * multiplier;
  const containerHeight = height * multiplier;
  
  return {
    width,
    height,
    multiplier,
    containerWidth,
    containerHeight,
  };
};

// 检测是否为移动设备
export const isMobileDevice = (): boolean => {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    navigator.userAgent
  );
};

// 检测是否为触摸设备
export const isTouchDevice = (): boolean => {
  return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
};

// 获取设备类型
export const getDeviceType = (): 'mobile' | 'tablet' | 'desktop' => {
  if (isMobileDevice()) {
    return window.innerWidth < 768 ? 'mobile' : 'tablet';
  }
  return 'desktop';
};

// 格式化时间
export const formatTime = (seconds: number): string => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  
  if (hours > 0) {
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

// 格式化数字
export const formatNumber = (num: number): string => {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M';
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K';
  }
  return num.toString();
};

// 计算两点之间的距离
export const calculateDistance = (
  x1: number,
  y1: number,
  x2: number,
  y2: number
): number => {
  return Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
};

// 计算两点之间的角度
export const calculateAngle = (
  x1: number,
  y1: number,
  x2: number,
  y2: number
): number => {
  return Math.atan2(y2 - y1, x2 - x1);
};

// 限制数值在指定范围内
export const clamp = (value: number, min: number, max: number): number => {
  return Math.min(Math.max(value, min), max);
};

// 线性插值
export const lerp = (start: number, end: number, factor: number): number => {
  return start + (end - start) * factor;
};

// 随机整数
export const randomInt = (min: number, max: number): number => {
  return Math.floor(Math.random() * (max - min + 1)) + min;
};

// 随机浮点数
export const randomFloat = (min: number, max: number): number => {
  return Math.random() * (max - min) + min;
};

// 随机选择数组元素
export const randomChoice = <T>(array: T[]): T => {
  return array[Math.floor(Math.random() * array.length)];
};

// 随机打乱数组
export const shuffleArray = <T>(array: T[]): T[] => {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

// 深拷贝对象
export const deepClone = <T>(obj: T): T => {
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }
  
  if (obj instanceof Date) {
    return new Date(obj.getTime()) as unknown as T;
  }
  
  if (obj instanceof Array) {
    return obj.map(item => deepClone(item)) as unknown as T;
  }
  
  if (typeof obj === 'object') {
    const cloned = {} as T;
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        cloned[key] = deepClone(obj[key]);
      }
    }
    return cloned;
  }
  
  return obj;
};

// 防抖函数
export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  wait: number
): ((...args: Parameters<T>) => void) => {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
};

// 节流函数
export const throttle = <T extends (...args: any[]) => any>(
  func: T,
  limit: number
): ((...args: Parameters<T>) => void) => {
  let inThrottle: boolean;
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
};

// 检查对象是否为空
export const isEmpty = (obj: any): boolean => {
  if (obj == null) return true;
  if (Array.isArray(obj) || typeof obj === 'string') return obj.length === 0;
  if (obj instanceof Map || obj instanceof Set) return obj.size === 0;
  if (typeof obj === 'object') return Object.keys(obj).length === 0;
  return false;
};

// 获取对象的所有键
export const getObjectKeys = (obj: any): string[] => {
  return Object.keys(obj || {});
};

// 获取对象的所有值
export const getObjectValues = <T>(obj: Record<string, T>): T[] => {
  return Object.values(obj || {});
};

// 获取对象的键值对
export const getObjectEntries = <T>(obj: Record<string, T>): [string, T][] => {
  return Object.entries(obj || {});
};

// 合并对象
export const mergeObjects = <T extends Record<string, any>>(
  target: T,
  ...sources: Partial<T>[]
): T => {
  return sources.reduce((result, source) => {
    if (source) {
      Object.keys(source).forEach(key => {
        if (source[key] !== undefined) {
          result[key] = source[key];
        }
      });
    }
    return result;
  }, { ...target });
};

// 检查是否为有效的JSON字符串
export const isValidJSON = (str: string): boolean => {
  try {
    JSON.parse(str);
    return true;
  } catch {
    return false;
  }
};

// 安全的JSON解析
export const safeJSONParse = <T>(str: string, defaultValue: T): T => {
  try {
    return JSON.parse(str);
  } catch {
    return defaultValue;
  }
};

// 安全的JSON字符串化
export const safeJSONStringify = (obj: any): string => {
  try {
    return JSON.stringify(obj);
  } catch {
    return '{}';
  }
};

// 本地存储工具函数
export const storage = {
  // 设置本地存储
  set: (key: string, value: any): void => {
    try {
      localStorage.setItem(key, safeJSONStringify(value));
    } catch (error) {
      console.error('Failed to save to localStorage:', error);
    }
  },

  // 获取本地存储
  get: <T>(key: string, defaultValue: T): T => {
    try {
      const item = localStorage.getItem(key);
      return item ? safeJSONParse(item, defaultValue) : defaultValue;
    } catch (error) {
      console.error('Failed to load from localStorage:', error);
      return defaultValue;
    }
  },

  // 删除本地存储
  remove: (key: string): void => {
    try {
      localStorage.removeItem(key);
    } catch (error) {
      console.error('Failed to remove from localStorage:', error);
    }
  },

  // 清空本地存储
  clear: (): void => {
    try {
      localStorage.clear();
    } catch (error) {
      console.error('Failed to clear localStorage:', error);
    }
  },

  // 检查键是否存在
  has: (key: string): boolean => {
    try {
      return localStorage.getItem(key) !== null;
    } catch {
      return false;
    }
  },
};

// 会话存储工具函数
export const sessionStorage = {
  // 设置会话存储
  set: (key: string, value: any): void => {
    try {
      window.sessionStorage.setItem(key, safeJSONStringify(value));
    } catch (error) {
      console.error('Failed to save to sessionStorage:', error);
    }
  },

  // 获取会话存储
  get: <T>(key: string, defaultValue: T): T => {
    try {
      const item = window.sessionStorage.getItem(key);
      return item ? safeJSONParse(item, defaultValue) : defaultValue;
    } catch (error) {
      console.error('Failed to load from sessionStorage:', error);
      return defaultValue;
    }
  },

  // 删除会话存储
  remove: (key: string): void => {
    try {
      window.sessionStorage.removeItem(key);
    } catch (error) {
      console.error('Failed to remove from sessionStorage:', error);
    }
  },

  // 清空会话存储
  clear: (): void => {
    try {
      window.sessionStorage.clear();
    } catch (error) {
      console.error('Failed to clear sessionStorage:', error);
    }
  },

  // 检查键是否存在
  has: (key: string): boolean => {
    try {
      return window.sessionStorage.getItem(key) !== null;
    } catch {
      return false;
    }
  },
};

// 事件工具函数
export const events = {
  // 触发自定义事件
  trigger: (eventName: string, data?: any): void => {
    const event = new CustomEvent(eventName, { detail: data });
    window.dispatchEvent(event);
  },

  // 监听自定义事件
  listen: (eventName: string, callback: (data: any) => void): (() => void) => {
    const handler = (event: Event) => {
      const customEvent = event as CustomEvent;
      callback(customEvent.detail);
    };
    
    window.addEventListener(eventName, handler);
    
    // 返回取消监听的函数
    return () => {
      window.removeEventListener(eventName, handler);
    };
  },

  // 一次性监听事件
  once: (eventName: string, callback: (data: any) => void): void => {
    const handler = (event: Event) => {
      const customEvent = event as CustomEvent;
      callback(customEvent.detail);
      window.removeEventListener(eventName, handler);
    };
    
    window.addEventListener(eventName, handler);
  },
};

// 动画工具函数
export const animation = {
  // 缓动函数
  easeInQuad: (t: number): number => t * t,
  easeOutQuad: (t: number): number => t * (2 - t),
  easeInOutQuad: (t: number): number => t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t,
  
  easeInCubic: (t: number): number => t * t * t,
  easeOutCubic: (t: number): number => (--t) * t * t + 1,
  easeInOutCubic: (t: number): number => t < 0.5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1,
  
  easeInSine: (t: number): number => 1 - Math.cos(t * Math.PI / 2),
  easeOutSine: (t: number): number => Math.sin(t * Math.PI / 2),
  easeInOutSine: (t: number): number => -(Math.cos(Math.PI * t) - 1) / 2,
  
  // 创建动画
  create: (
    duration: number,
    update: (progress: number) => void,
    easing: (t: number) => number = animation.easeInOutQuad
  ): Promise<void> => {
    return new Promise((resolve) => {
      const startTime = performance.now();
      
      const animate = (currentTime: number) => {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const easedProgress = easing(progress);
        
        update(easedProgress);
        
        if (progress < 1) {
          requestAnimationFrame(animate);
        } else {
          resolve();
        }
      };
      
      requestAnimationFrame(animate);
    });
  },
};

// 颜色工具函数
export const color = {
  // 十六进制转RGB
  hexToRgb: (hex: string): { r: number; g: number; b: number } | null => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : null;
  },

  // RGB转十六进制
  rgbToHex: (r: number, g: number, b: number): string => {
    return '#' + [r, g, b].map(x => {
      const hex = x.toString(16);
      return hex.length === 1 ? '0' + hex : hex;
    }).join('');
  },

  // 颜色混合
  blend: (color1: string, color2: string, ratio: number): string => {
    const rgb1 = color.hexToRgb(color1);
    const rgb2 = color.hexToRgb(color2);
    
    if (!rgb1 || !rgb2) return color1;
    
    const r = Math.round(rgb1.r + (rgb2.r - rgb1.r) * ratio);
    const g = Math.round(rgb1.g + (rgb2.g - rgb1.g) * ratio);
    const b = Math.round(rgb1.b + (rgb2.b - rgb1.b) * ratio);
    
    return color.rgbToHex(r, g, b);
  },

  // 颜色亮度
  getBrightness: (hex: string): number => {
    const rgb = color.hexToRgb(hex);
    if (!rgb) return 0;
    return (rgb.r * 299 + rgb.g * 587 + rgb.b * 114) / 1000;
  },

  // 判断是否为深色
  isDark: (hex: string): boolean => {
    return color.getBrightness(hex) < 128;
  },
};

// 字符串工具函数
export const string = {
  // 首字母大写
  capitalize: (str: string): string => {
    return str.charAt(0).toUpperCase() + str.slice(1);
  },

  // 驼峰命名转短横线命名
  camelToKebab: (str: string): string => {
    return str.replace(/([a-z0-9]|(?=[A-Z]))([A-Z])/g, '$1-$2').toLowerCase();
  },

  // 短横线命名转驼峰命名
  kebabToCamel: (str: string): string => {
    return str.replace(/-([a-z])/g, (g) => g[1].toUpperCase());
  },

  // 截断字符串
  truncate: (str: string, length: number, suffix: string = '...'): string => {
    return str.length > length ? str.substring(0, length) + suffix : str;
  },

  // 生成随机字符串
  random: (length: number = 8): string => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  },
};

// 数组工具函数
export const array = {
  // 数组去重
  unique: <T>(arr: T[]): T[] => {
    return [...new Set(arr)];
  },

  // 数组分组
  groupBy: <T, K extends string | number>(
    arr: T[],
    key: (item: T) => K
  ): Record<K, T[]> => {
    return arr.reduce((groups, item) => {
      const groupKey = key(item);
      if (!groups[groupKey]) {
        groups[groupKey] = [];
      }
      groups[groupKey].push(item);
      return groups;
    }, {} as Record<K, T[]>);
  },

  // 数组排序
  sortBy: <T>(arr: T[], key: (item: T) => any, ascending: boolean = true): T[] => {
    return [...arr].sort((a, b) => {
      const aVal = key(a);
      const bVal = key(b);
      return ascending ? (aVal > bVal ? 1 : -1) : (aVal < bVal ? 1 : -1);
    });
  },

  // 数组分块
  chunk: <T>(arr: T[], size: number): T[][] => {
    const chunks: T[][] = [];
    for (let i = 0; i < arr.length; i += size) {
      chunks.push(arr.slice(i, i + size));
    }
    return chunks;
  },

  // 数组扁平化
  flatten: <T>(arr: T[][]): T[] => {
    return arr.reduce((flat, item) => flat.concat(item), [] as T[]);
  },
};

// 数学工具函数
export const math = {
  // 角度转弧度
  degToRad: (degrees: number): number => {
    return degrees * (Math.PI / 180);
  },

  // 弧度转角度
  radToDeg: (radians: number): number => {
    return radians * (180 / Math.PI);
  },

  // 计算百分比
  percentage: (value: number, total: number): number => {
    return total === 0 ? 0 : (value / total) * 100;
  },

  // 计算平均值
  average: (numbers: number[]): number => {
    return numbers.reduce((sum, num) => sum + num, 0) / numbers.length;
  },

  // 计算中位数
  median: (numbers: number[]): number => {
    const sorted = [...numbers].sort((a, b) => a - b);
    const middle = Math.floor(sorted.length / 2);
    return sorted.length % 2 === 0
      ? (sorted[middle - 1] + sorted[middle]) / 2
      : sorted[middle];
  },

  // 计算标准差
  standardDeviation: (numbers: number[]): number => {
    const avg = math.average(numbers);
    const squareDiffs = numbers.map(value => Math.pow(value - avg, 2));
    const avgSquareDiff = math.average(squareDiffs);
    return Math.sqrt(avgSquareDiff);
  },
};

// 导出所有工具函数
export default {
  createInteractiveGameObject,
  calculateGameSize,
  calculateGameContainerSize,
  isMobileDevice,
  isTouchDevice,
  getDeviceType,
  formatTime,
  formatNumber,
  calculateDistance,
  calculateAngle,
  clamp,
  lerp,
  randomInt,
  randomFloat,
  randomChoice,
  shuffleArray,
  deepClone,
  debounce,
  throttle,
  isEmpty,
  getObjectKeys,
  getObjectValues,
  getObjectEntries,
  mergeObjects,
  isValidJSON,
  safeJSONParse,
  safeJSONStringify,
  storage,
  sessionStorage,
  events,
  animation,
  color,
  string,
  array,
  math,
};
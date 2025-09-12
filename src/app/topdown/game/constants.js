/**
 * 游戏常量定义文件
 * 
 * 这个文件包含了游戏中使用的所有常量值
 * 包括场景切换时间、攻击延迟、地图元素索引、NPC 行为类型等
 * 
 * 使用方法：
 * 1. 在需要使用的文件中导入：import { CONSTANT_NAME } from './constants';
 * 2. 直接使用常量值，避免魔法数字
 * 3. 修改游戏参数时，只需在这里调整常量值
 */

// 场景切换相关常量
export const SCENE_FADE_TIME = 300;        // 场景淡入淡出时间（毫秒）

// 地图元素索引常量
// 这些索引对应 Tiled 地图编辑器中的图块 ID
export const COIN_INDEX = 192;             // 金币图块索引

// NPC 移动行为类型常量
export const NPC_MOVEMENT_RANDOM = 'random';  // NPC 随机移动
export const NPC_MOVEMENT_STILL = 'still';    // NPC 静止不动

// 时间系统常量
export const TIME_SPEEDS = {
    PAUSED: 0,
    SLOW: 0.5,
    NORMAL: 1,
    FAST: 3,
    VERY_FAST: 6,
    ULTRA_FAST: 12
};

// 时间控制键位映射
export const TIME_CONTROL_KEYS = {
    PAUSE: 'ZERO',      // 0 键 - 暂停
    SLOW: 'ONE',        // 1 键 - 慢速
    NORMAL: 'TWO',      // 2 键 - 正常
    FAST: 'THREE',      // 3 键 - 快速
    VERY_FAST: 'FOUR',  // 4 键 - 很快
    ULTRA_FAST: 'FIVE'  // 5 键 - 极快
};

// 昼夜循环常量
export const DAY_PHASES = {
    DAWN: 'dawn',
    MORNING: 'morning',
    NOON: 'noon',
    AFTERNOON: 'afternoon',
    DUSK: 'dusk',
    NIGHT: 'night',
    MIDNIGHT: 'midnight'
};

// 季节常量
export const SEASONS = {
    SPRING: 'spring',
    SUMMER: 'summer',
    AUTUMN: 'autumn',
    WINTER: 'winter'
};

// 天气类型常量
export const WEATHER_TYPES = {
    CLEAR: 'clear',
    RAIN: 'rain',
    WIND: 'wind',
    SNOW: 'snow'
};

// 内部分辨率与深度排序常量
// 建议基准分辨率（16:9）：在此基础上做整数倍缩放，保持像素清晰
export const BASE_WIDTH = 480;
export const BASE_HEIGHT = 270;
// 限制整数缩放的最大倍数，避免超大屏幕上素材过大
export const MAX_INTEGER_ZOOM = 2;
// 额外缩放比例（相对于当前整数缩放），例如 0.25 即缩小为原来的 1/4
export const ZOOM_SCALE = 0.25;

// 动态对象（角色/NPC/物品）的深度基线
// 使用 y 作为动态加成：depth = DYNAMIC_DEPTH_BASE + sprite.y
export const DYNAMIC_DEPTH_BASE = 500;

// 覆盖层（屋顶/树冠/上层遮挡）深度：必须高于动态对象
export const OVERLAY_LAYER_DEPTH = 5000;


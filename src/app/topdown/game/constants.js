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

// 战斗系统相关常量
export const ATTACK_DELAY_TIME = 50;       // 攻击延迟时间（毫秒），防止连续攻击

// 地图元素索引常量
// 这些索引对应 Tiled 地图编辑器中的图块 ID
export const BUSH_INDEX = 428;             // 灌木丛图块索引
export const BOX_INDEX = 427;              // 箱子图块索引
export const COIN_INDEX = 192;             // 金币图块索引
export const HEART_CONTAINER_INDEX = 233;  // 心形容器图块索引

// NPC 移动行为类型常量
export const NPC_MOVEMENT_RANDOM = 'random';  // NPC 随机移动
export const NPC_MOVEMENT_STILL = 'still';    // NPC 静止不动

// 敌人 AI 类型常量
export const ENEMY_AI_TYPE = 'follow';        // 敌人 AI 类型：跟随玩家

// 游戏存档相关常量
export const SAVE_DATA_KEY = 'pablogg_game_data';  // 本地存储的存档数据键名

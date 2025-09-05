/**
 * 游戏工具函数文件
 * 
 * 这个文件包含了游戏中使用的各种工具函数
 * 包括碰撞体创建、游戏尺寸计算等通用功能
 * 
 * 使用方法：
 * 1. 在需要使用的文件中导入：import { functionName } from './utils';
 * 2. 调用相应的工具函数
 * 3. 根据函数参数要求传入正确的参数
 */

import { GameObjects } from 'phaser';

/**
 * 创建交互式游戏对象
 * 
 * 用于创建可交互的碰撞体，如 NPC 对话区域、物品拾取区域等
 * 
 * @param {Phaser.Scene} scene - 游戏场景对象
 * @param {number} x - 碰撞体的 X 坐标
 * @param {number} y - 碰撞体的 Y 坐标
 * @param {number} width - 碰撞体的宽度
 * @param {number} height - 碰撞体的高度
 * @param {string} name - 碰撞体的名称，用于标识
 * @param {boolean} isDebug - 是否显示调试信息（默认 false）
 * @param {Object} origin - 碰撞体的原点位置（默认 { x: 0, y: 1 }）
 * @returns {Phaser.GameObjects.Rectangle} 创建的碰撞体对象
 * 
 * 使用示例：
 * const npcCollider = createInteractiveGameObject(
 *   this, 100, 100, 32, 32, 'npc_1', false
 * );
 */
export const createInteractiveGameObject = (
    scene,
    x,
    y,
    width,
    height,
    name,
    isDebug = false,
    origin = { x: 0, y: 1 }
) => {
    // 创建一个矩形碰撞体
    const customCollider = new GameObjects.Rectangle(
        scene,
        x,
        y,
        width,
        height
    ).setOrigin(origin.x, origin.y);

    // 设置碰撞体属性
    customCollider.name = name;
    customCollider.isCustomCollider = true;

    // 调试模式下显示碰撞体（紫色填充）
    if (isDebug) {
        customCollider.setFillStyle(0x741B47);
    }

    // 将碰撞体添加到物理系统
    scene.physics.add.existing(customCollider);
    customCollider.body.setAllowGravity(false);  // 不受重力影响
    customCollider.body.setImmovable(true);      // 不可移动

    return customCollider;
};

/**
 * 计算游戏尺寸和缩放倍数
 * 
 * 根据当前窗口大小计算最佳的游戏显示尺寸
 * 确保游戏在不同设备上都有良好的显示效果
 * 
 * @returns {Object} 包含 width、height、multiplier 的对象
 *   - width: 游戏基础宽度（像素）
 *   - height: 游戏基础高度（像素）
 *   - multiplier: 缩放倍数
 * 
 * 计算逻辑：
 * 1. 设置基础游戏尺寸（16:9 比例）
 * 2. 根据窗口大小计算合适的缩放倍数
 * 3. 确保最小倍数为 2，保证在手机上的可读性
 * 4. 如果倍数大于 1，进一步扩展尺寸以更好地利用屏幕空间
 * 5. 保持像素完美，扩展的尺寸是 16 的倍数
 * 
 * 使用示例：
 * const { width, height, multiplier } = calculateGameSize();
 * console.log(`游戏尺寸: ${width}x${height}, 缩放倍数: ${multiplier}`);
 */
export const calculateGameSize = () => {
    // 增加基础尺寸，让游戏画面更大
    let width = 1280;  // 从400增加到480
    let height = 720; // 从224增加到270 (16:9比例)

    // 增加最小倍数，确保在手机上显示得足够大
    const minMultiplier = 2; // 设置最小倍数为2
    const calculatedMultiplier = Math.min(Math.floor(window.innerWidth / width), Math.floor(window.innerHeight / height)) || 1;
    const multiplier = Math.max(calculatedMultiplier, minMultiplier);
    //const multiplier = 1;

    // 如果倍数大于1，进一步扩展尺寸以更好地利用屏幕空间
    if (multiplier > 1) {
        // 计算额外的宽度和高度，确保是16的倍数（保持像素完美）
        const extraWidth = Math.floor((window.innerWidth - width * multiplier) / (16 * multiplier)) * 16;
        const extraHeight = Math.floor((window.innerHeight - height * multiplier) / (16 * multiplier)) * 16;

        width += extraWidth;
        height += extraHeight;
    }

    return { width, height, multiplier };
};

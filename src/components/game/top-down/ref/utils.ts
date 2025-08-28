import { GameObjects, Scene } from 'phaser';

// 交互式游戏对象的原点配置接口
interface OriginConfig {
    x: number;
    y: number;
}

// 游戏尺寸计算结果接口
interface GameSizeResult {
    width: number;
    height: number;
    multiplier: number;
}

/**
 * 创建交互式游戏对象
 * @param scene - Phaser 场景实例
 * @param x - X 坐标
 * @param y - Y 坐标
 * @param width - 宽度
 * @param height - 高度
 * @param name - 对象名称
 * @param isDebug - 是否为调试模式（显示碰撞框）
 * @param origin - 原点配置
 * @returns 创建的交互式游戏对象
 */
export const createInteractiveGameObject = (
    scene: Scene,
    x: number,
    y: number,
    width: number,
    height: number,
    name: string,
    isDebug: boolean = false,
    origin: OriginConfig = { x: 0, y: 1 }
): GameObjects.Rectangle => {
    // 创建自定义碰撞器矩形
    const customCollider = new GameObjects.Rectangle(
        scene,
        x,
        y,
        width,
        height
    ).setOrigin(origin.x, origin.y);
    
    // 设置对象属性
    customCollider.name = name;
    (customCollider as any).isCustomCollider = true;

    // 调试模式下显示碰撞框
    if (isDebug) {
        customCollider.setFillStyle(0x741B47);
    }

    // 添加物理属性
    scene.physics.add.existing(customCollider);
    if (customCollider.body) {
        (customCollider.body as any).setAllowGravity(false);
        (customCollider.body as any).setImmovable(true);
    }

    return customCollider;
};

/**
 * 计算游戏尺寸
 * 根据窗口大小计算最佳的游戏显示尺寸和缩放倍数
 * @returns 包含宽度、高度和缩放倍数的对象
 */
export const calculateGameSize = (): GameSizeResult => {
    // 基础游戏尺寸（16x16 像素瓦片）
    let width = 400;   // 25 个瓦片宽度
    let height = 224;  // 14 个瓦片高度
    
    // 计算最大可能的缩放倍数
    const multiplier = Math.min(
        Math.floor(window.innerWidth / 400), 
        Math.floor(window.innerHeight / 224)
    ) || 1;

    // 如果缩放倍数大于1，调整尺寸以更好地适应屏幕
    if (multiplier > 1) {
        // 水平方向调整（以16像素为单位）
        width += Math.floor((window.innerWidth - width * multiplier) / (16 * multiplier)) * 16;
        // 垂直方向调整（以16像素为单位）
        height += Math.floor((window.innerHeight - height * multiplier) / (16 * multiplier)) * 16;
    }

    return { width, height, multiplier };
};
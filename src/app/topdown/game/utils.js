import { GameObjects } from 'phaser';

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
    const customCollider = new GameObjects.Rectangle(
        scene,
        x,
        y,
        width,
        height
    ).setOrigin(origin.x, origin.y);
    customCollider.name = name;
    customCollider.isCustomCollider = true;

    if (isDebug) {
        customCollider.setFillStyle(0x741B47);
    }

    scene.physics.add.existing(customCollider);
    customCollider.body.setAllowGravity(false);
    customCollider.body.setImmovable(true);

    return customCollider;
};

export const calculateGameSize = () => {
    // 增加基础尺寸，让游戏画面更大
    let width = 480; // 从400增加到480
    let height = 270; // 从224增加到270 (16:9比例)
    
    // 增加最小倍数，确保在手机上显示得足够大
    const minMultiplier = 2; // 设置最小倍数为2
    const calculatedMultiplier = Math.min(Math.floor(window.innerWidth / width), Math.floor(window.innerHeight / height)) || 1;
    const multiplier = Math.max(calculatedMultiplier, minMultiplier);

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

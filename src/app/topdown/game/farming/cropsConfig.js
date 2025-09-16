/**
 * 数据驱动作物配置
 * - stages: 每个生长阶段基础时长（毫秒），仅包含从阶段1→4的时长；阶段5为成熟
 * - displayName: 友好名称
 */

export const cropsConfig = {
    huluobo: {
        displayName: '胡萝卜',
        stages: [4000, 5000, 6000, 7000],
    },
    bailuobo: {
        displayName: '白萝卜',
        stages: [4500, 5500, 6500, 7500],
    },
};

/**
 * 获取作物配置；若未配置则返回默认
 */
export function getCropConfig(cropKey) {
    return cropsConfig[cropKey] || { displayName: cropKey, stages: [5000, 5000, 5000, 5000] };
}

/**
 * 获取指定作物在当前阶段所需的基础时长（毫秒）
 * stage: 1..4（5为成熟，返回Infinity防止继续推进）
 */
export function getStageDurationMs(cropKey, stage) {
    if (stage >= 5) return Number.POSITIVE_INFINITY;
    const cfg = getCropConfig(cropKey);
    const idx = Math.max(0, Math.min(cfg.stages.length - 1, stage - 1));
    return cfg.stages[idx] || 5000;
}


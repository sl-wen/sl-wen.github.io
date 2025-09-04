/**
 * FarmManager - 管理耕地与作物交互
 * - 维护可种植地块集合
 * - 处理：种植、浇水、收获
 * - 提供渲染与存档支持
 */

import Crop from './Crop';

export default class FarmManager {
    /**
     * @param {Phaser.Scene} scene
     * @param {{tileSize:number}} options
     */
    constructor(scene, options = {}) {
        this.scene = scene;
        this.tileSize = options.tileSize || 16;

        /** @type {Set<string>} 可种植地块 key:`x,y` */
        this.farmland = new Set();
        /** @type {Map<string, Crop>} 当前已种植作物 key:`x,y` => Crop */
        this.crops = new Map();

        /** 简单背包：种子与水量 */
        this.inventory = {
            seeds: 5,
            water: 10,
        };

        /** 生长配置（每阶段时长 ms）；可按需平衡 */
        this.growthMsPerStage = 5000; // 默认 5s/阶段，加快体验
    }

    /**
     * 在地图上注册一块耕地矩形区域（网格单位）
     */
    addFarmlandRect(x, y, width, height) {
        for (let ty = y; ty < y + height; ty += 1) {
            for (let tx = x; tx < x + width; tx += 1) {
                this.farmland.add(`${tx},${ty}`);
            }
        }
    }

    isFarmland(tileX, tileY) {
        return this.farmland.has(`${tileX},${tileY}`);
    }

    hasCrop(tileX, tileY) {
        return this.crops.has(`${tileX},${tileY}`);
    }

    getCrop(tileX, tileY) {
        return this.crops.get(`${tileX},${tileY}`) || null;
    }

    /** 种植：在空的耕地上放置种子（stage=0） */
    plant(tileX, tileY) {
        if (!this.isFarmland(tileX, tileY)) return false;
        if (this.hasCrop(tileX, tileY)) return false;
        if (this.inventory.seeds <= 0) return false;

        const crop = new Crop(this.scene, tileX, tileY, { tileSize: this.tileSize, cropKey: 'bailuobo' });
        this.crops.set(`${tileX},${tileY}`, crop);
        this.inventory.seeds -= 1;
        return true;
    }

    /** 浇水：推进生长到下一阶段计时 */
    water(tileX, tileY) {
        if (!this.hasCrop(tileX, tileY)) return false;
        if (this.inventory.water <= 0) return false;

        const crop = this.getCrop(tileX, tileY);
        crop.water(this.growthMsPerStage);
        this.inventory.water -= 1;
        return true;
    }

    /** 收获：阶段 5 可收获，销毁作物并返回产物数量 */
    harvest(tileX, tileY) {
        if (!this.hasCrop(tileX, tileY)) return 0;
        const crop = this.getCrop(tileX, tileY);
        if (!crop.canHarvest()) return 0;

        crop.destroy();
        this.crops.delete(`${tileX},${tileY}`);
        // 简单：收获 1 个果实，转化为金币或物品
        return 2; // 产量略高，提升成就感
    }

    /**
     * 将前方像素坐标转换为瓦片（与 GameScene 的 tile 尺寸一致）
     */
    worldXYToTile(x, y) {
        const tileX = Math.floor(x / this.tileSize);
        const tileY = Math.floor(y / this.tileSize);
        return { tileX, tileY };
    }

    /**
     * 存档导出
     */
    toJSON() {
        return {
            farmland: Array.from(this.farmland.values()),
            crops: Array.from(this.crops.values()).map(c => c.toJSON()),
            inventory: { ...this.inventory },
        };
    }

    /**
     * 从存档恢复
     */
    static fromSave(scene, data, options = {}) {
        const fm = new FarmManager(scene, options);
        (data.farmland || []).forEach(key => fm.farmland.add(key));
        (data.crops || []).forEach(c => {
            const crop = Crop.fromSave(scene, c, { tileSize: fm.tileSize });
            fm.crops.set(`${crop.tileX},${crop.tileY}`, crop);
        });
        fm.inventory = data.inventory || { seeds: 5, water: 10 };
        return fm;
    }
}


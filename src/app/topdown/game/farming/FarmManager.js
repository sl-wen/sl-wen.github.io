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

        /**
         * 背包（按分类/Tag）
         * - seeds: 各类种子
         * - misc: 杂物（水/工具等）
         * - fruits: 收获物
         */
        this.inventory = {
            tags: {
                seeds: {
                    items: {
                        // 种子以 cropKey 命名，参照 farmplants.json 前缀
                        huluobo: { id: 'huluobo', name: '胡萝卜种子', count: 0 },
                        bailuobo: { id: 'bailuobo', name: '白萝卜种子', count: 0 },
                    },
                },
                misc: {
                    items: {
                        water: { id: 'water', name: '水', count: 10 },
                        // 可扩展：锄头、洒水壶等
                    },
                },
                fruits: {
                    items: {
                        // 收获物以 cropKey 命名
                        huluobo: { id: 'huluobo', name: '胡萝卜', count: 5 },
                        bailuobo: { id: 'bailuobo', name: '白萝卜', count: 0 },
                    },
                },
            },
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

    /**
     * 工具：取得种子总数
     */
    getTotalSeedsCount() {
        const seeds = this.inventory?.tags?.seeds?.items || {};
        return Object.values(seeds).reduce((sum, it) => sum + (it?.count || 0), 0);
    }

    /**
     * 工具：取得可用的第一种种子 key（count>0）
     */
    getFirstAvailableSeedKey() {
        const seeds = this.inventory?.tags?.seeds?.items || {};
        return Object.keys(seeds).find((k) => (seeds[k]?.count || 0) > 0) || null;
    }

    /**
     * 工具：取得水量
     */
    getWaterCount() {
        return this.inventory?.tags?.misc?.items?.water?.count || 0;
    }

    /**
     * 工具：减少某个分类物品数量
     */
    decreaseItem(tag, itemId, amount = 1) {
        const items = this.inventory?.tags?.[tag]?.items;
        if (!items || !items[itemId]) return false;
        if (items[itemId].count < amount) return false;
        items[itemId].count -= amount;
        return true;
    }

    /**
     * 工具：增加某个分类物品数量
     */
    increaseItem(tag, itemId, amount = 1, nameIfNew) {
        if (!this.inventory.tags[tag]) this.inventory.tags[tag] = { items: {} };
        const items = this.inventory.tags[tag].items;
        if (!items[itemId]) items[itemId] = { id: itemId, name: nameIfNew || itemId, count: 0 };
        items[itemId].count += amount;
        return true;
    }

    /** 种植：在空的耕地上放置种子（stage=1） */
    plant(tileX, tileY) {
        if (!this.isFarmland(tileX, tileY)) return false;
        if (this.hasCrop(tileX, tileY)) return false;
        if (this.getTotalSeedsCount() <= 0) return false;
        const seedKey = this.getFirstAvailableSeedKey();
        if (!seedKey) return false;

        // cropKey 与 farmplants.json 前缀保持一致
        const crop = new Crop(this.scene, tileX, tileY, { tileSize: this.tileSize, cropKey: seedKey });
        this.crops.set(`${tileX},${tileY}`, crop);
        this.decreaseItem('seeds', seedKey, 1);
        this.dispatchInventoryUpdate();
        // autosave
        try { window.dispatchEvent(new CustomEvent('autosave-request')); } catch (_) {}
        return true;
    }

    /** 浇水：推进生长到下一阶段计时 */
    water(tileX, tileY) {
        if (!this.hasCrop(tileX, tileY)) return false;
        if (this.getWaterCount() <= 0) return false;

        const crop = this.getCrop(tileX, tileY);
        crop.water(this.growthMsPerStage);
        this.decreaseItem('misc', 'water', 1);
        this.dispatchInventoryUpdate();
        try { window.dispatchEvent(new CustomEvent('autosave-request')); } catch (_) {}
        return true;
    }

    /** 收获：阶段 4 可收获，销毁作物并返回产物数量 */
    harvest(tileX, tileY) {
        if (!this.hasCrop(tileX, tileY)) return 0;
        const crop = this.getCrop(tileX, tileY);
        if (!crop.canHarvest()) return 0;

        crop.destroy();
        this.crops.delete(`${tileX},${tileY}`);
        // 简单：收获 2 个对应作物
        const yieldCount = 2;
        const fruitKey = crop.cropKey; // 与 farmplants.json 前缀一致
        this.increaseItem('fruits', fruitKey, yieldCount, fruitKey);
        this.dispatchInventoryUpdate();
        try { window.dispatchEvent(new CustomEvent('autosave-request')); } catch (_) {}
        return yieldCount;
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
        // 兼容旧版存档：顶层 {seeds, water, fruits}
        const inv = data.inventory;
        if (!inv || inv.tags === undefined) {
            fm.inventory = {
                tags: {
                    seeds: { items: {
                        huluobo: { id: 'huluobo', name: '胡萝卜种子', count: inv?.seeds ?? 0 },
                        bailuobo: { id: 'bailuobo', name: '白萝卜种子', count: 0 },
                    } },
                    misc: { items: { water: { id: 'water', name: '水', count: inv?.water ?? 0 } } },
                    fruits: { items: {
                        huluobo: { id: 'huluobo', name: '胡萝卜', count: inv?.fruits ?? 0 },
                        bailuobo: { id: 'bailuobo', name: '白萝卜', count: 0 },
                    } },
                },
            };
        } else {
            fm.inventory = inv;
        }
        return fm;
    }

    /**
     * 发送背包更新事件给 React 层
     */
    dispatchInventoryUpdate() {
        try {
            const detail = { inventory: { ...this.inventory } };
            const evt = new CustomEvent('inventory-update', { detail });
            window.dispatchEvent(evt);
        } catch (_) {
            // 忽略 SSR 场景
        }
    }
}


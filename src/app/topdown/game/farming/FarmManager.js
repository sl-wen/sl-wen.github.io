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

        /** 土壤状态：key:`x,y` => { moisture:0..100, fertility:0..100 } */
        this.soil = new Map();

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
                        // 种子：使用帧名 id（-0）
                        'huluobo-0': { id: 'huluobo-0', name: '胡萝卜种子', count: 5 },
                        'bailuobo-0': { id: 'bailuobo-0', name: '白萝卜种子', count: 3 },
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
                        // 果实：使用帧名 id（-5）
                        'huluobo-5': { id: 'huluobo-5', name: '胡萝卜', count: 0 },
                        'bailuobo-5': { id: 'bailuobo-5', name: '白萝卜', count: 0 },
                    },
                },
            },
        };

        /** 生长配置（每阶段时长 ms）；可按需平衡 */
        this.growthMsPerStage = 5000; // 默认 5s/阶段，加快体验
        /** 水容量上限（用于“补水”动作） */
        this.waterCapacity = 20;
    }

    /**
     * 在地图上注册一块耕地矩形区域（网格单位）
     */
    addFarmlandRect(x, y, width, height) {
        for (let ty = y; ty < y + height; ty += 1) {
            for (let tx = x; tx < x + width; tx += 1) {
                this.farmland.add(`${tx},${ty}`);
                if (!this.soil.has(`${tx},${ty}`)) {
                    this.soil.set(`${tx},${ty}`, { moisture: 40, fertility: 60 });
                }
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
     * 工具：取得可用的第一种种子 id（count>0），例如 'huluobo-0'
     */
    getFirstAvailableSeedId() {
        const seeds = this.inventory?.tags?.seeds?.items || {};
        return Object.keys(seeds).find((k) => (seeds[k]?.count || 0) > 0) || null;
    }

    /** 从种子 id 推导 cropKey（去除 -0 后缀） */
    cropKeyFromSeedId(seedId) {
        if (!seedId) return null;
        if (seedId.endsWith('-0')) return seedId.slice(0, -2);
        return seedId;
    }

    /** 从 cropKey 推导果实 id（添加 -5 后缀） */
    fruitIdFromCropKey(cropKey) {
        return `${cropKey}-5`;
    }

    /**
     * 工具：取得水量
     */
    getWaterCount() {
        return this.inventory?.tags?.misc?.items?.water?.count || 0;
    }

    /** 获取水容量上限 */
    getWaterMaxCount() {
        return this.waterCapacity;
    }

    /** 将水量补满到容量上限，返回是否发生变化 */
    refillWater() {
        const max = this.getWaterMaxCount();
        const current = this.getWaterCount();
        if (current >= max) return false;
        // 写回到背包
        if (!this.inventory?.tags?.misc?.items?.water) {
            if (!this.inventory.tags.misc) this.inventory.tags.misc = { items: {} };
            this.inventory.tags.misc.items.water = { id: 'water', name: '水', count: 0 };
        }
        this.inventory.tags.misc.items.water.count = max;
        this.dispatchInventoryUpdate();
        try { window.dispatchEvent(new CustomEvent('autosave-request')); } catch (_) {}
        return true;
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

    /**
     * 种植：在空的耕地上放置种子（stage=1）
     * @param {number} tileX
     * @param {number} tileY
     * @param {string|null} [seedIdOverride] - 指定要使用的种子 id（如 'huluobo-0'）；为空则回退到第一种可用种子
     */
    plant(tileX, tileY, seedIdOverride = null) {
        if (!this.isFarmland(tileX, tileY)) return false;
        if (this.hasCrop(tileX, tileY)) return false;
        if (this.getTotalSeedsCount() <= 0) return false;

        let seedId = seedIdOverride || this.getFirstAvailableSeedId();
        if (!seedId) return false;

        // 校验指定种子可用
        if (seedIdOverride) {
            const seeds = this.inventory?.tags?.seeds?.items || {};
            if (!seeds[seedId] || (seeds[seedId].count || 0) <= 0) {
                // 指定种子无效，尝试回退
                seedId = this.getFirstAvailableSeedId();
                if (!seedId) return false;
            }
        }

        // 从种子 id 提取 cropKey（例如 huluobo-0 -> huluobo）
        const cropKey = this.cropKeyFromSeedId(seedId);
        const crop = new Crop(this.scene, tileX, tileY, { tileSize: this.tileSize, cropKey });
        this.crops.set(`${tileX},${tileY}`, crop);
        this.decreaseItem('seeds', seedId, 1);
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
        // 同步土壤湿度
        const k = `${tileX},${tileY}`;
        const s = this.soil.get(k) || { moisture: 0, fertility: 60 };
        s.moisture = Math.min(100, s.moisture + 30);
        this.soil.set(k, s);
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
        // 简单：收获 2 个对应作物的果实（-5）
        const yieldCount = 2;
        const fruitId = this.fruitIdFromCropKey(crop.cropKey);
        // 友好名称（可扩展更多作物）
        const cropNames = { huluobo: '胡萝卜', bailuobo: '白萝卜' };
        const friendlyName = cropNames[crop.cropKey] || crop.cropKey;
        this.increaseItem('fruits', fruitId, yieldCount, friendlyName);
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
                        'huluobo-0': { id: 'huluobo-0', name: '胡萝卜种子', count: inv?.seeds ?? 0 },
                        'bailuobo-0': { id: 'bailuobo-0', name: '白萝卜种子', count: 0 },
                    } },
                    misc: { items: { water: { id: 'water', name: '水', count: inv?.water ?? 0 } } },
                    fruits: { items: {
                        'huluobo-5': { id: 'huluobo-5', name: '胡萝卜', count: inv?.fruits ?? 0 },
                        'bailuobo-5': { id: 'bailuobo-5', name: '白萝卜', count: 0 },
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

    /**
     * 雨滴与蒸发 tick：批量调整湿度
     */
    rainTick(amount = 0.5) {
        this.farmland.forEach((key) => {
            const s = this.soil.get(key) || { moisture: 0, fertility: 60 };
            s.moisture = Math.min(100, s.moisture + amount);
            this.soil.set(key, s);
        });
    }

    evaporateTick(amount = 0.2) {
        this.farmland.forEach((key) => {
            const s = this.soil.get(key) || { moisture: 0, fertility: 60 };
            s.moisture = Math.max(0, s.moisture - amount);
            this.soil.set(key, s);
        });
    }

    /** 查询土壤状态（用于可视化或交互提示） */
    getSoil(tileX, tileY) {
        return this.soil.get(`${tileX},${tileY}`) || { moisture: 0, fertility: 60 };
    }
}

